import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

async function run() {
  const client = new Client({
    user: 'postgres',
    password: 'mca21@2025!',
    host: 'db.opseoypfosjxfvtyxckv.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to Supabase...');
  await client.connect();
  console.log('✅ Connected');

  const files = [
    'supabase/schema.sql',
    'supabase/rls_policies.sql',
    'supabase/auth_trigger.sql',
    'supabase/seed.sql',
    'supabase/create_auth_users.sql'
  ];

  for (const file of files) {
    console.log(`\nExecuting ${file}...`);
    const sql = fs.readFileSync(file, 'utf8');
    try {
      await client.query(sql);
      console.log(`✅ Success`);
    } catch (err) {
      console.error(`❌ Error in ${file}:`, err.message);
    }
  }

  await client.end();
  console.log('\n🎉 Setup Complete!');
}

run();
