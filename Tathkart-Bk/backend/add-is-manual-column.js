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

async function addIsManualColumn() {
  try {
    console.log('Adding is_manual column to registration_items table...');
    
    const result = await pool.query(`
      ALTER TABLE registration_items 
      ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;
    `);
    
    console.log('Column added successfully!');
  } catch (error) {
    console.error('Error adding column:', error.message);
  } finally {
    pool.end();
  }
}

addIsManualColumn(); 