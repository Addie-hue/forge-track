const { Client } = require('pg');
const fs = require('fs');

async function seed() {
  const connectionString = 'postgresql://postgres:mca21@2025!@db.opseoypfosjxfvtyxckv.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const seedSql = fs.readFileSync('supabase/seed.sql', 'utf8');
    await client.query(seedSql);
    console.log('Seed executed successfully');
    
  } catch (error) {
    console.error('Seed execution error:', error);
  } finally {
    await client.end();
  }
}

seed();
