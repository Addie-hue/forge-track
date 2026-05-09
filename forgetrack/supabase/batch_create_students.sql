-- ============================================================
-- ForgeTrack: Batch Create Student Auth Accounts
-- Run this in Supabase SQL Editor to enable login for ALL students
-- ============================================================

DO $$
DECLARE
    r RECORD;
    v_password_hash TEXT := crypt('4SH24CS001', gen_salt('bf')); -- Default USN password hash example
BEGIN
    FOR r IN SELECT * FROM public.students LOOP
        -- Only create if not already exists in auth.users
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = LOWER(r.usn) || '@forge.local') THEN
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password,
                email_confirmed_at, created_at, updated_at,
                raw_user_meta_data, confirmation_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                gen_random_uuid(), 'authenticated', 'authenticated',
                LOWER(r.usn) || '@forge.local',
                crypt(UPPER(r.usn), gen_salt('bf')), -- Default password is USN uppercase
                NOW(), NOW(), NOW(),
                jsonb_build_object('display_name', r.name),
                ''
            );
            
            RAISE NOTICE 'Created auth account for student: %', r.usn;
        END IF;
    END FOR;
END;
$$;
