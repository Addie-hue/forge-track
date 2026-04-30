import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log(`Connecting to: ${supabaseUrl}`);
  
  // Check if tables are seeded
  console.log('\n--- Checking Database Tables ---');
  const { count: studentsCount, error: err1 } = await supabase.from('students').select('*', { count: 'exact', head: true });
  if (err1) console.log('Students Table Error:', err1.message);
  else console.log(`Students seeded: ${studentsCount}`);

  const { count: sessionsCount, error: err2 } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
  if (err2) console.log('Sessions Table Error:', err2.message);
  else console.log(`Sessions seeded: ${sessionsCount}`);
  
  const { data: users, error: err3 } = await supabase.from('users').select('*');
  if (err3) console.log('Public Users Table Error:', err3.message);
  else {
    console.log(`Public Users seeded: ${users ? users.length : 0}`);
    if (users && users.length > 0) {
      console.log('Users found:', users.map(u => `${u.email} (${u.role})`).join(', '));
    }
  }

  // Check login
  console.log('\n--- Testing Authentication ---');
  const email = 'nischay@theboringpeople.in';
  const password = 'hi123';
  console.log(`Attempting login for ${email}...`);
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('Login Failed:', authError.message);
    if (authError.message.includes('Email not confirmed')) {
      console.error('-> Issue: Email confirmation is required but user is not confirmed.');
    }
  } else {
    console.log('✅ Login Successful!');
    console.log('User ID:', authData.user.id);
  }
}

testConnection();
