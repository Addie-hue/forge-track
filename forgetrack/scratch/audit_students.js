import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStudentAccounts() {
  console.log('--- Student Account Audit ---');
  
  // 1. Get all students
  const { data: students, error: sErr } = await supabase.from('students').select('id, usn, email');
  if (sErr) {
    console.error('Error fetching students:', sErr.message);
    return;
  }
  
  console.log(`Total students in database: ${students.length}`);
  
  // 2. Get all public.users (since we can't check auth.users directly from anon key usually)
  const { data: users, error: uErr } = await supabase.from('users').select('email, role, student_id');
  if (uErr) {
    console.error('Error fetching public users:', uErr.message);
    return;
  }
  
  const userMap = new Set(users.map(u => u.email.toLowerCase()));
  const linkedStudents = users.filter(u => u.role === 'student').map(u => u.student_id);
  
  let missingAccounts = 0;
  let unlinkedAccounts = 0;
  
  students.forEach(s => {
    const studentEmail = `${s.usn.toLowerCase()}@forge.local`;
    if (!userMap.has(studentEmail)) {
      missingAccounts++;
      if (missingAccounts <= 5) console.log(`Missing account for: ${s.usn} (${studentEmail})`);
    }
  });
  
  console.log(`\nResults:`);
  console.log(`- Students with active login profiles: ${users.filter(u => u.role === 'student').length}`);
  console.log(`- Students missing accounts: ${missingAccounts}`);
  
  if (missingAccounts > 0) {
    console.log('\n⚠️ ISSUE DETECTED: Some students do not have login accounts.');
    console.log('They will not be able to login until they are added to Supabase Auth.');
  } else {
    console.log('\n✅ All students have login accounts.');
  }
}

checkStudentAccounts();
