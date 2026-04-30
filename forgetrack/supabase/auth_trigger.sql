-- ============================================================
-- ForgeTrack Auth Trigger
-- Run this THIRD in Supabase SQL Editor (after rls_policies.sql)
-- ============================================================

-- This function creates a public.users row whenever a new auth user is created
-- It checks if the email ends with @forge.local (student) or not (mentor)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_student_id INTEGER;
  v_display_name TEXT;
BEGIN
  -- Determine role based on email pattern
  IF NEW.email LIKE '%@forge.local' THEN
    v_role := 'student';
    -- Extract USN from email (e.g., 4sh24cs001@forge.local -> 4SH24CS001)
    DECLARE
      v_usn TEXT := UPPER(SPLIT_PART(NEW.email, '@', 1));
    BEGIN
      SELECT id, name INTO v_student_id, v_display_name
      FROM public.students
      WHERE UPPER(usn) = v_usn;
      
      IF v_student_id IS NULL THEN
        v_display_name := v_usn;
      END IF;
    END;
  ELSE
    v_role := 'mentor';
    v_student_id := NULL;
    v_display_name := COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      SPLIT_PART(NEW.email, '@', 1)
    );
  END IF;

  INSERT INTO public.users (id, email, role, student_id, display_name)
  VALUES (NEW.id, NEW.email, v_role, v_student_id, v_display_name)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
