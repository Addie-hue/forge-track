import pkg from 'pg';
const { Client } = pkg;

async function migrate() {
  const client = new Client({
    user: 'postgres',
    password: 'mca21@2025!',
    host: 'db.opseoypfosjxfvtyxckv.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected.');

  const sql = `
    ALTER TABLE public.attendance 
    ADD COLUMN IF NOT EXISTS knowledge_score DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS skill_score DECIMAL(5,2);
  `;

  try {
    await client.query(sql);
    console.log('✅ Migration successful: knowledge_score and skill_score columns added.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
