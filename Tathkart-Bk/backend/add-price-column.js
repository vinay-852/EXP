const { Pool } = require('pg');

const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-twilight-forest-a1hqi35y-pooler.ap-southeast-1.aws.neon.tech',
  database: 'neondb',
  password: 'npg_cpEC40PkfKjH', 
  port: 5432,
  ssl: {
    rejectUnauthorized: true
  }
});

async function addPriceColumn() {
  try {
    console.log('Adding price column to registration_items table...');
    
    const result = await pool.query(`
      ALTER TABLE registration_items 
      ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
    `);
    
    console.log('Price column added successfully!');
  } catch (error) {
    console.error('Error adding column:', error.message);
  } finally {
    pool.end();
  }
}

addPriceColumn(); 