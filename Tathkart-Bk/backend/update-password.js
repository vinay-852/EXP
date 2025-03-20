const { Pool } = require('pg');
const bcrypt = require('bcrypt');

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

async function updatePassword() {
  try {
    const phone = '9398958886';
    const password = 'Sundar@123';
    
    // First, check if user exists and get current data
    const checkUser = await pool.query(
      'SELECT * FROM registrations WHERE phone_number = $1',
      [phone]
    );
    
    if (checkUser.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    console.log('Current user data:', checkUser.rows[0]);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Generated hashed password:', hashedPassword);
    
    // Update the user's password
    const result = await pool.query(
      'UPDATE registrations SET password = $1 WHERE phone_number = $2 RETURNING *',
      [hashedPassword, phone]
    );
    
    console.log('Updated user data:', result.rows[0]);
    
    // Verify the password can be compared correctly
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    console.log('Password verification test:', { isPasswordValid });
    
    console.log('Password updated successfully');
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await pool.end();
  }
}

updatePassword(); 