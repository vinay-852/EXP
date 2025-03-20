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

async function checkRegistrations() {
  try {
    console.log('Checking registrations table...\n');
    
    const result = await pool.query('SELECT * FROM registrations');
    console.log(`Total registrations found: ${result.rows.length}\n`);
    console.log('Registrations:\n');
    
    result.rows.forEach(user => {
      console.log('-------------------');
      console.log(`Hotel ID: ${user.hotel_id}`);
      console.log(`Shop Name: ${user.shop_name}`);
      console.log(`Owner Name: ${user.owner_name}`);
      console.log(`Phone: ${user.phone_number}`);
      console.log(`Email: ${user.email_address}`);
      console.log(`Status: ${user.status}`);
      console.log(`Created At: ${user.created_at}\n`);
    });
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkRegistrations();