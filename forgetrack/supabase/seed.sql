-- ============================================================
-- ForgeTrack Seed Data
-- Run this FOURTH in Supabase SQL Editor (after auth_trigger.sql)
-- ============================================================
-- ORDER: students → sessions → attendance → materials → import_log
-- Auth users are created separately via Supabase Auth API

-- ============================================================
-- 1. STUDENTS (25 students)
-- ============================================================
INSERT INTO public.students (name, usn, admission_number, email, branch_code, batch, is_active) VALUES
('Abhishek Sharma',    '4SH24CS001', '24CS001', 'abhishek.sharma@gmail.com',   'CS', '2024-2028', true),
('Ananya Kulkarni',    '4SH24CS002', '24CS002', 'ananya.kulkarni@gmail.com',   'CS', '2024-2028', true),
('Ravi Kumar',         '4SH24CS003', '24CS003', 'ravi.kumar@gmail.com',        'CS', '2024-2028', true),
('Divya Hegde',        '4SH24AI004', '24AI004', 'divya.hegde@gmail.com',       'AI', '2024-2028', true),
('Karthik Reddy',      '4SH24CS005', '24CS005', 'karthik.reddy@gmail.com',    'CS', '2024-2028', true),
('Meera Nair',         '4SH24AI006', '24AI006', 'meera.nair@gmail.com',        'AI', '2024-2028', true),
('Rahul Kumar',        '4SH24CS007', '24CS007', 'rahul.kumar@gmail.com',       'CS', '2024-2028', true),
('Sneha Patil',        '4SH24IS008', '24IS008', 'sneha.patil@gmail.com',       'IS', '2024-2028', true),
('Vikram Joshi',       '4SH24CS009', '24CS009', 'vikram.joshi@gmail.com',      'CS', '2024-2028', true),
('Priya Deshmukh',     '4SH24AI010', '24AI010', 'priya.deshmukh@gmail.com',   'AI', '2024-2028', true),
('Arjun Gowda',        '4SH24CS011', '24CS011', 'arjun.gowda@gmail.com',      'CS', '2024-2028', true),
('Lakshmi Rao',        '4SH24IS012', '24IS012', 'lakshmi.rao@gmail.com',       'IS', '2024-2028', true),
('Nikhil Shetty',      '4SH24CS013', '24CS013', 'nikhil.shetty@gmail.com',    'CS', '2024-2028', true),
('Pooja Acharya',      '4SH24AI014', '24AI014', 'pooja.acharya@gmail.com',    'AI', '2024-2028', true),
('Suresh Bhat',        '4SH24CS015', '24CS015', 'suresh.bhat@gmail.com',      'CS', '2024-2028', true),
('Kavya Srinivas',     '4SH24IS016', '24IS016', 'kavya.srinivas@gmail.com',   'IS', '2024-2028', true),
('Aditya Prasad',      '4SH24CS017', '24CS017', 'aditya.prasad@gmail.com',    'CS', '2024-2028', true),
('Tanvi Kamath',       '4SH24AI018', '24AI018', 'tanvi.kamath@gmail.com',     'AI', '2024-2028', true),
('Deepak Naik',        '4SH24CS019', '24CS019', 'deepak.naik@gmail.com',      'CS', '2024-2028', true),
('Shruti Hegde',       '4SH24IS020', '24IS020', 'shruti.hegde@gmail.com',     'IS', '2024-2028', true),
('Manoj Kulkarni',     '4SH24CS021', '24CS021', 'manoj.kulkarni@gmail.com',   'CS', '2024-2028', true),
('Rashmi Iyer',        '4SH24AI022', '24AI022', 'rashmi.iyer@gmail.com',      'AI', '2024-2028', true),
('Ganesh Rao',         '4SH24CS023', '24CS023', 'ganesh.rao@gmail.com',       'CS', '2024-2028', true),
('Nandini Sharma',     '4SH24IS024', '24IS024', 'nandini.sharma@gmail.com',   'IS', '2024-2028', true),
('Varun Menon',        '4SH24CS025', '24CS025', 'varun.menon@gmail.com',      'CS', '2024-2028', true);

-- ============================================================
-- 2. SESSIONS (15 sessions across Month 4, 5, 6)
-- ============================================================
INSERT INTO public.sessions (date, topic, month_number, duration_hours, session_type, notes) VALUES
-- Month 4 (5 sessions)
('2026-01-06', 'Prompt Engineering Fundamentals',           4, 2.0, 'offline', 'Covered zero-shot, few-shot, chain-of-thought prompting patterns'),
('2026-01-13', 'LangChain & LlamaIndex Introduction',      4, 2.5, 'offline', 'Hands-on with LangChain chains and LlamaIndex document loaders'),
('2026-01-20', 'Vector Databases & Embeddings',             4, 2.0, 'online',  'OpenAI embeddings + Pinecone/pgvector comparison'),
('2026-01-27', 'RAG Pipeline Architecture',                 4, 3.0, 'offline', 'End-to-end Retrieval Augmented Generation pipeline build'),
('2026-02-03', '8-Layer AI Application Stack',              4, 2.0, 'offline', 'Full stack overview: data → embedding → retrieval → generation → evaluation'),

-- Month 5 (5 sessions)
('2026-02-10', 'ReAct Agent Pattern',                       5, 2.5, 'offline', 'Reasoning + Acting pattern with tool use'),
('2026-02-17', 'Multi-Agent Systems',                       5, 2.0, 'online',  'Crew AI and AutoGen frameworks overview'),
('2026-02-24', 'Tiered Autonomy Multi-Agent Architecture',  5, 3.0, 'offline', 'Building agents with different autonomy levels'),
('2026-03-03', 'pgvector RAG with Supabase',                5, 2.0, 'offline', 'PostgreSQL vector search using Supabase'),
('2026-03-10', 'Evaluation & Guardrails',                   5, 2.5, 'offline', 'LLM output evaluation metrics and safety guardrails'),

-- Month 6 (5 sessions)
('2026-03-17', 'n8n Workflow Automation',                   6, 2.0, 'online',  'No-code AI workflow automation with n8n'),
('2026-03-24', 'Deployment Strategies for AI Apps',         6, 2.0, 'offline', 'Docker, Vercel, Railway deployment patterns'),
('2026-03-31', 'Streamlit & Gradio Dashboards',             6, 2.5, 'offline', 'Building demo UIs for AI models'),
('2026-04-07', 'Capstone Project Kickoff',                  6, 2.0, 'offline', 'Project teams formed, scope defined'),
('2026-04-14', 'Capstone Working Session',                  6, 3.0, 'offline', 'Hands-on project work with mentor guidance');

-- ============================================================
-- 3. ATTENDANCE (25 students × 15 sessions = 375 records)
-- Realistic distribution: 70-90% attendance
-- ============================================================
-- Using a DO block with realistic attendance patterns
DO $$
DECLARE
  v_student RECORD;
  v_session RECORD;
  v_is_present BOOLEAN;
  v_rand FLOAT;
  v_attendance_rate FLOAT;
BEGIN
  FOR v_student IN SELECT id, name FROM public.students ORDER BY id LOOP
    -- Each student gets a base attendance rate between 0.55 and 0.95
    v_attendance_rate := 0.55 + (HASHTEXT(v_student.name)::BIGINT % 40)::FLOAT / 100.0;
    -- Clamp to valid range
    IF v_attendance_rate > 0.95 THEN v_attendance_rate := 0.95; END IF;
    IF v_attendance_rate < 0.55 THEN v_attendance_rate := 0.55; END IF;
    
    FOR v_session IN SELECT id FROM public.sessions ORDER BY id LOOP
      -- Use a hash-based pseudo-random for deterministic results
      v_rand := ABS(HASHTEXT(v_student.id::TEXT || '-' || v_session.id::TEXT)::BIGINT % 100)::FLOAT / 100.0;
      v_is_present := v_rand < v_attendance_rate;
      
      INSERT INTO public.attendance (student_id, session_id, present, marked_by)
      VALUES (v_student.id, v_session.id, v_is_present, 'seed_script');
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- 4. MATERIALS (2 per session: slides + recording)
-- ============================================================
INSERT INTO public.materials (session_id, title, type, url, description)
SELECT 
  s.id,
  s.topic || ' - Slides',
  'slides',
  'https://docs.google.com/presentation/d/example-' || s.id || '/edit',
  'Presentation slides for ' || s.topic
FROM public.sessions s
ORDER BY s.id;

INSERT INTO public.materials (session_id, title, type, url, description)
SELECT 
  s.id,
  s.topic || ' - Recording',
  'recording',
  'https://www.youtube.com/watch?v=example-' || s.id,
  'Session recording for ' || s.topic
FROM public.sessions s
ORDER BY s.id;

-- Add a few extra document/link materials
INSERT INTO public.materials (session_id, title, type, url, description)
VALUES
  (1, 'Prompt Engineering Cheat Sheet', 'document', 'https://drive.google.com/file/d/prompt-cheatsheet/view', 'Quick reference for prompting patterns'),
  (4, 'RAG Architecture Diagram', 'link', 'https://miro.com/board/rag-architecture', 'Interactive Miro board of the RAG pipeline'),
  (6, 'ReAct Paper (Yao et al.)', 'link', 'https://arxiv.org/abs/2210.03629', 'Original ReAct paper for reference'),
  (9, 'pgvector Setup Guide', 'document', 'https://drive.google.com/file/d/pgvector-guide/view', 'Step-by-step pgvector installation and configuration');

-- ============================================================
-- 5. IMPORT LOG (2 demo entries)
-- ============================================================
INSERT INTO public.import_log (filename, uploaded_by, uploaded_at, total_rows, imported_rows, skipped_rows, warnings, column_mapping, status)
VALUES
  ('month4_attendance.csv', 'Nischay', NOW() - INTERVAL '14 days', 125, 120, 5, 
   '["Student Ravi K not found - matched to Ravi Kumar", "2 blank rows skipped"]'::JSONB,
   '{"SL No": "IGNORE", "name": "student_name", "usn": "usn", "15/1/26": "date (pivoted)"}'::JSONB,
   'completed'),
  ('month5_partial.csv', 'Nischay', NOW() - INTERVAL '7 days', 80, 75, 5,
   '["3 duplicate records skipped", "2 date format warnings"]'::JSONB,
   '{"Student Name": "student_name", "USN": "usn", "Date": "date", "Status": "attendance_status"}'::JSONB,
   'completed');
