-- ============================================================
-- ForgeTrack: Auto-Provision Student Login Accounts (FIXED)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Helper function for manual provision (DEFINED FIRST)
CREATE OR REPLACE FUNCTION public.create_student_auth_account_manual(p_student_id INTEGER)
RETURNS VOID AS $$
DECLARE
    s RECORD;
    v_user_id UUID;
BEGIN
    SELECT * INTO s FROM public.students WHERE id = p_student_id;
    
    -- Check if student exists and doesn't already have an auth account
    IF FOUND AND NOT EXISTS (SELECT 1 FROM auth.users WHERE email = LOWER(s.usn) || '@forge.local') THEN
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, confirmation_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id, 'authenticated', 'authenticated',
            LOWER(s.usn) || '@forge.local',
            crypt(UPPER(s.usn), gen_salt('bf')),
            NOW(), NOW(), NOW(),
            jsonb_build_object('display_name', s.name),
            ''
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger function to create an auth account for NEW students
CREATE OR REPLACE FUNCTION public.create_student_auth_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the manual function for the newly inserted student ID
    PERFORM public.create_student_auth_account_manual(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Set up the Trigger on students table
DROP TRIGGER IF EXISTS tr_auto_provision_student ON public.students;
CREATE TRIGGER tr_auto_provision_student
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.create_student_auth_account();

-- 4. Run for all EXISTING students who don't have accounts yet
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.students LOOP
        PERFORM public.create_student_auth_account_manual(r.id);
    END LOOP;
END;
$$;
