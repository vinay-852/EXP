import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Starting database migrations...');
    
    await client.query('BEGIN');

    // Create registrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        hotel_id VARCHAR(100) UNIQUE NOT NULL,
        shop_name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        email_address VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        business_type VARCHAR(100),
        alternate_phone_number VARCHAR(20),
        google_maps_location TEXT,
        address TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Registrations table created or verified');

    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        hotel_id VARCHAR(100) NOT NULL,
        owner_name VARCHAR(255) NOT NULL DEFAULT 'Unknown',
        phone_number VARCHAR(20) NOT NULL DEFAULT 'No Phone',
        location TEXT DEFAULT '',
        note TEXT DEFAULT '',
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hotel_id) REFERENCES registrations(hotel_id)
      )
    `);
    console.log('Orders table created or verified');

    // Create order_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        grams INTEGER,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL DEFAULT 'unit',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
    console.log('Order items table created or verified');

    // Create registration_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS registration_items (
        id SERIAL PRIMARY KEY,
        registration_id VARCHAR(100) NOT NULL,
        item_id INTEGER,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        is_manual BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations(hotel_id)
      )
    `);
    console.log('Registration items table created or verified');

    await client.query('COMMIT');
    console.log('Database migrations completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error running migrations:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default runMigrations; 