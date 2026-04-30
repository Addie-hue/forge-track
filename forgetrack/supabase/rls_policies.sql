-- ============================================================
-- ForgeTrack Row Level Security Policies
-- Run this SECOND in Supabase SQL Editor (after schema.sql)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's student_id
CREATE OR REPLACE FUNCTION public.get_user_student_id()
RETURNS INTEGER AS $$
  SELECT student_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- STUDENTS table policies
-- ============================================================
-- Mentors: full access
CREATE POLICY "mentors_full_access_students" ON public.students
  FOR ALL USING (public.get_user_role() = 'mentor');

-- Students: read only their own row
CREATE POLICY "students_read_own_student" ON public.students
  FOR SELECT USING (id = public.get_user_student_id());

-- ============================================================
-- SESSIONS table policies
-- ============================================================
-- Mentors: full access
CREATE POLICY "mentors_full_access_sessions" ON public.sessions
  FOR ALL USING (public.get_user_role() = 'mentor');

-- Students: can read all sessions (they need upcoming session info)
CREATE POLICY "students_read_all_sessions" ON public.sessions
  FOR SELECT USING (public.get_user_role() = 'student');

-- ============================================================
-- ATTENDANCE table policies
-- ============================================================
-- Mentors: full access
CREATE POLICY "mentors_full_access_attendance" ON public.attendance
  FOR ALL USING (public.get_user_role() = 'mentor');

-- Students: read only their own attendance
CREATE POLICY "students_read_own_attendance" ON public.attendance
  FOR SELECT USING (student_id = public.get_user_student_id());

-- ============================================================
-- MATERIALS table policies
-- ============================================================
-- Mentors: full access
CREATE POLICY "mentors_full_access_materials" ON public.materials
  FOR ALL USING (public.get_user_role() = 'mentor');

-- Students: read all materials (study resources for catch-up)
CREATE POLICY "students_read_all_materials" ON public.materials
  FOR SELECT USING (public.get_user_role() = 'student');

-- ============================================================
-- IMPORT_LOG table policies
-- ============================================================
-- Mentors: can read and create
CREATE POLICY "mentors_read_import_log" ON public.import_log
  FOR SELECT USING (public.get_user_role() = 'mentor');

CREATE POLICY "mentors_insert_import_log" ON public.import_log
  FOR INSERT WITH CHECK (public.get_user_role() = 'mentor');

CREATE POLICY "mentors_update_import_log" ON public.import_log
  FOR UPDATE USING (public.get_user_role() = 'mentor');

-- Students: NO access to import_log
-- (no policy = no access when RLS is enabled)

-- ============================================================
-- USERS table policies
-- ============================================================
-- Mentors: full access
CREATE POLICY "mentors_full_access_users" ON public.users
  FOR ALL USING (public.get_user_role() = 'mentor');

-- Students: read own profile only
CREATE POLICY "students_read_own_user" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Allow users to read their own profile during login (before role is cached)
CREATE POLICY "users_read_self" ON public.users
  FOR SELECT USING (id = auth.uid());
