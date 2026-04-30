-- ============================================================
-- ForgeTrack Database Schema
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

-- 1. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  usn TEXT UNIQUE NOT NULL,
  admission_number TEXT,
  email TEXT,
  branch_code TEXT NOT NULL,
  batch TEXT DEFAULT '2024-2028',
  is_active BOOLEAN DEFAULT true, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  month_number INTEGER NOT NULL,
  duration_hours DECIMAL(3,1) DEFAULT 2.0,
  session_type TEXT DEFAULT 'offline' CHECK (session_type IN ('offline', 'online')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Import Log Table (must exist before Attendance, since attendance references it)
CREATE TABLE IF NOT EXISTS public.import_log (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  warnings JSONB,
  column_mapping JSONB,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'partial', 'failed'))
);

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  marked_by TEXT DEFAULT 'system',
  import_id INTEGER REFERENCES public.import_log(id) ON DELETE SET NULL,
  UNIQUE(student_id, session_id)
);

-- 5. Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('slides', 'recording', 'document', 'link')),
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Users Table (public profile linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
  student_id INTEGER REFERENCES public.students(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON public.attendance(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_materials_session ON public.materials(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON public.users(student_id);
