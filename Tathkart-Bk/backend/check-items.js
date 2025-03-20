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

async function checkItems() {
  try {
    const result = await pool.query('SELECT * FROM registration_items');
    console.log('All registration items:', result.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

checkItems(); 