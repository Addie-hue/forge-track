import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function seedViaRest() {
  console.log('Seeding via REST...');

  // Authenticate as mentor
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'nischay@theboringpeople.in',
    password: 'hi123'
  });
  
  if (authErr) {
    console.error('Auth error:', authErr.message);
    return;
  }
  console.log('Authenticated successfully.');

  // 1. Insert some students
  const students = [
    { name: 'Alice Smith', usn: '4SH24CS001', branch_code: 'CS', batch: '2024-2028', email: 'alice@example.com' },
    { name: 'Bob Jones', usn: '4SH24CS002', branch_code: 'CS', batch: '2024-2028', email: 'bob@example.com' }
  ];

  for (const s of students) {
    const { data, error } = await supabase.from('students').upsert(s, { onConflict: 'usn' }).select();
    if (error) console.error('Student insert error:', error.message);
    else console.log('Inserted student:', data[0].name);
  }

  // 2. Insert a session
  const sessionData = {
    date: new Date().toISOString().split('T')[0],
    topic: 'Introduction to AI',
    month_number: 1,
    session_type: 'offline',
    duration_hours: 2
  };

  const { data: session, error: sessError } = await supabase.from('sessions').upsert(sessionData, { onConflict: 'date' }).select().single();
  
  if (sessError) {
    console.error('Session insert error:', sessError.message);
  } else {
    console.log('Inserted session:', session.topic);

    // 3. Mark attendance
    const { data: studentsData } = await supabase.from('students').select('*');
    for (const student of studentsData) {
       await supabase.from('attendance').upsert({
         student_id: student.id,
         session_id: session.id,
         present: true,
         marked_by: 'system'
       }, { onConflict: 'student_id, session_id' });
    }
    console.log('Marked attendance for all students');
  }

  console.log('Done!');
}

seedViaRest();
