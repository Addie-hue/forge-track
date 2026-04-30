-- ============================================================
-- ForgeTrack: Create Auth Users
-- Run this FIFTH in Supabase SQL Editor (after seed.sql)
-- ============================================================
-- NOTE: This uses Supabase's internal auth functions.
-- Alternatively, create these users via the Supabase Dashboard
-- under Authentication > Users > Add User.
-- ============================================================

-- ============================================================
-- OPTION A: Create users via Supabase Dashboard (RECOMMENDED)
-- ============================================================
-- Go to your Supabase Dashboard > Authentication > Users > Add User
-- Create these users manually:
--
-- 1. Mentor: nischay@theboringpeople.in / hi123
-- 2. Co-facilitator: varun@theboringpeople.in / hi123
-- 3. Test Student: 4sh24cs001@forge.local / 4SH24CS001
--
-- After creating each user, the auth_trigger will auto-create
-- the public.users row with the correct role.
--
-- For the test student, after the trigger runs, verify:
--   SELECT * FROM public.users WHERE email = '4sh24cs001@forge.local';
--   Should show role='student', student_id=1

-- ============================================================
-- OPTION B: Create users via SQL (if Option A doesn't work)
-- ============================================================
-- This directly inserts into auth.users. Some Supabase versions
-- may not allow this. Use Option A if this fails.

-- Mentor 1: Nischay
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'nischay@theboringpeople.in',
  crypt('hi123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"display_name": "Nischay B K"}'::JSONB,
  ''
);

-- Mentor 2: Varun
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'varun@theboringpeople.in',
  crypt('hi123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"display_name": "Varun"}'::JSONB,
  ''
);

-- Test Student: 4SH24CS001
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  '4sh24cs001@forge.local',
  crypt('4SH24CS001', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"display_name": "Abhishek Sharma"}'::JSONB,
  ''
);

-- ============================================================
-- Verify: After running, check these queries:
-- ============================================================
-- SELECT * FROM public.users;
-- Should show 3 rows:
--   nischay@theboringpeople.in | mentor  | student_id=NULL
--   varun@theboringpeople.in   | mentor  | student_id=NULL
--   4sh24cs001@forge.local     | student | student_id=1
