const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
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

// Initialize database tables
async function initializeTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create orders table with delivery_date column (without dropping existing tables)
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        hotel_id VARCHAR(100) NOT NULL,
        note TEXT,
        total DECIMAL(10,2) NOT NULL,
        delivery_date DATE NOT NULL,  /* Added delivery_date column */
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hotel_id) REFERENCES registrations(hotel_id)
      )
    `);

    // Create order_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    await client.query('COMMIT');
    console.log('Database tables initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing database tables:', err);
    throw err;
  } finally {
    client.release();
  }
}

app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.status(200).json({ status: 'Backend is running', db: 'Database connected successfully' });
  } catch (err) {
    console.error('Database connection failed:', err.message);
    res.status(500).json({ status: 'Backend is running', db: 'Database connection failed', error: err.message });
  }
});

// Initialize admin_users table
app.post('/api/init-admin-table', async (req, res) => {
  try {
    // Create admin_users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if default admin exists
    const checkResult = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1',
      ['admin@example.com']
    );
    
    if (checkResult.rows.length === 0) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO admin_users(email, name, password) VALUES($1, $2, $3)',
        ['admin@example.com', 'Admin User', hashedPassword]
      );
    }
    
    res.status(200).json({ message: 'Admin table initialized successfully' });
  } catch (error) {
    console.error('Error initializing admin table:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Replace the existing login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, phone, password, isAdmin } = req.body;
    
    console.log('Login request body:', req.body);
    
    // Validate required fields
    if ((!email && !phone) || !password) {
      return res.status(400).json({ 
        message: 'Email/phone and password are required' 
      });
    }

    if (isAdmin || email) {
      // Admin login
      const loginEmail = email || phone; // Use either email or phone for admin
      console.log('Attempting admin login with:', { email: loginEmail });
      
      const adminResult = await pool.query(
        'SELECT * FROM admin_users WHERE email = $1',
        [loginEmail]
      );
    
      console.log('Admin query result:', adminResult.rows);

      if (adminResult.rows.length === 0) {
        return res.status(401).json({ 
          message: 'Invalid email or password'
        });
      }
    
      const admin = adminResult.rows[0];
      const isValid = await bcrypt.compare(password, admin.password);
      
      console.log('Password validation:', { isValid });

      if (!isValid) {
        return res.status(401).json({ 
          message: 'Invalid email or password'
        });
      }
    
      return res.json({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin'
      });
    } else {
      // Regular user login with phone
      const cleanedPhone = phone.replace(/^\+91/, '');
      
      const result = await pool.query(
        'SELECT * FROM registrations WHERE phone_number = $1',
        [cleanedPhone]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ 
          message: 'Invalid credentials'
        });
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        return res.status(401).json({ 
          message: 'Invalid credentials'  
        });
      }

      return res.json({
        hotel_id: user.hotel_id,
        shop_name: user.shop_name,
        owner_name: user.owner_name,
        phone_number: user.phone_number,
        email_address: user.email_address,
        created_at: user.created_at,
        status: user.status,
        role: 'user'
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify session endpoint
app.get('/api/verify-session/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM registrations WHERE hotel_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.json({ valid: false });
    }

    res.json({ valid: true });
  } catch (err) {
    console.error('Session verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Get user details endpoint
app.get('/registrations/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log('Fetching user details for ID:', id);
    
    const result = await pool.query(
      'SELECT * FROM registrations WHERE hotel_id = $1',
      [id]
    );

    console.log('Database query result:', result.rows);

    if (result.rows.length === 0) {
      console.log('No user found with ID:', id);
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    console.log('Found user:', user);
    
    // Get order count
    const orderCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE hotel_id = $1',
      [id]
    );

    const userData = {
      hotel_id: user.hotel_id,
      shop_name: user.shop_name,
      owner_name: user.owner_name,
      phone_number: user.phone_number,
      email_address: user.email_address,
      address: user.address,
      google_maps_location: user.google_maps_location,
      created_at: user.created_at,
      status: user.status,
      order_count: parseInt(orderCountResult.rows[0].count)
    };

    console.log('Sending user data:', userData);
    res.json(userData);
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user items endpoint
app.get('/registrations/:id/items', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM registration_items WHERE registration_id = $1',
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user items:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get delivery dates endpoint
app.get('/registrations/:id/delivery-dates', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get next 30 days of delivery dates
    const result = await pool.query(`
      SELECT 
        date::date as date,
        CASE 
          WHEN COUNT(orders.id) >= 50 THEN 'unavailable'
          ELSE 'available'
        END as status
      FROM generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        INTERVAL '1 day'
      ) AS date
      LEFT JOIN orders ON orders.delivery_date = date::date
      GROUP BY date::date
      ORDER BY date::date
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching delivery dates:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// REGISTER ENDPOINT
app.post('/api/register', async (req, res) => {
  try {
    const { 
      shopName,
      ownerName,
      phone,
      password,
      businessType,
      emailAddress,
      alternatePhoneNumber,
      googleMapsLocation
    } = req.body;
    
    console.log('Registration attempt with:', {
      shopName,
      ownerName,
      phone,
      businessType,
      emailAddress,
      alternatePhoneNumber,
      googleMapsLocation
    });
    
    // Validate required fields
    if (!shopName || !ownerName || !phone || !password) {
      return res.status(400).json({ 
        message: 'Shop name, owner name, phone number, and password are required' 
      });
    }
    
    // Clean the phone number - remove +91 if present
    const cleanedPhone = phone.replace(/^\+91/, '');
    console.log('Cleaned phone number:', cleanedPhone);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if phone number already exists
    const checkResult = await pool.query(
      'SELECT * FROM registrations WHERE phone_number = $1',
      [cleanedPhone]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ 
        message: 'A user with this phone number already exists' 
      });
    }
    
    // Generate a hotel ID
    const hotelId = 'THK' + Math.floor(100000 + Math.random() * 900000);
    
    // Insert the new user with all fields
    const result = await pool.query(`
      INSERT INTO registrations(
        hotel_id,
        shop_name,
        owner_name,
        phone_number,
        email_address,
        password,
        business_type,
        alternate_phone_number,
        google_maps_location
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [
      hotelId,
      shopName,
      ownerName,
      cleanedPhone,
      emailAddress || null,
      hashedPassword,
      businessType || null,
      alternatePhoneNumber || null,
      googleMapsLocation || null
    ]);
    
    const user = result.rows[0];
    console.log('New user created:', user);
    
    // Return the new user data
    res.status(201).json({
      id: user.hotel_id,
      hotel_id: user.hotel_id,
      name: user.shop_name || user.owner_name,
      shop_name: user.shop_name,
      owner_name: user.owner_name,
      phone: user.phone_number,
      email: user.email_address,
      role: 'user'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// GET USER DATA ENDPOINT
app.get('/api/users/:phone', async (req, res) => {
  const { phone } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM registrations WHERE phone_number = $1',
      [phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Determine role (you might have a different role logic)
    let role = 'user';
    if (user.phone_number === '9898989898') { // Example admin phone
      role = 'admin';
    } else if (user.phone_number === '9797979797') { // Example delivery phone
      role = 'delivery';
    }
    
    res.status(200).json({
      id: user.hotel_id,
      name: user.shop_name || user.owner_name,
      phone: user.phone_number,
      role: role
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all registrations
app.get('/registrations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM registrations');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching registrations:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Register a new user
app.post('/register', async (req, res) => {
  try {
    const { emailAddress, password, ...otherFields } = req.body;

    // Check if password is received
    if (!password) {
      return res.status(400).send('Password is required');
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Received password:', password);
    console.log('Hashed password:', hashedPassword);

    // Create a new registration entry
    const result = await pool.query(
      'INSERT INTO registrations(hotel_id, shop_name, owner_name, business_type, email_address, phone_number, alternate_phone_number, google_maps_location, password) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [otherFields.hotelId, otherFields.shopName, otherFields.ownerName, otherFields.businessType, emailAddress, otherFields.phoneNumber, otherFields.alternatePhoneNumber, otherFields.googleMapsLocation, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send('An error occurred');
  }
});

// Get items for a registration
app.get('/registrations/:hotelId/items', async (req, res) => {
  const { hotelId } = req.params;

  try {
    console.log('Fetching items for registration:', hotelId);
    
    const result = await pool.query(
      'SELECT * FROM registration_items WHERE registration_id = $1',
      [hotelId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching items:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Add item to registration
app.post('/registrations/:hotelId/items', async (req, res) => {
  const { hotelId } = req.params;
  const { item_id, name, price, unit, quantity, is_manual } = req.body;

  try {
    console.log('Adding item to registration:', req.body);
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Item name is required' });
    }
    
    if (price === undefined || price === null) {
      return res.status(400).json({ error: 'Item price is required' });
    }
    
    if (!unit) {
      return res.status(400).json({ error: 'Item unit is required' });
    }
    
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Item quantity is required' });
    }
    
    // Check if the registration exists
    const registrationCheck = await pool.query(
      'SELECT * FROM registrations WHERE hotel_id = $1',
      [hotelId]
    );

    if (registrationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // For manual items, we set item_id to null
    const finalItemId = is_manual ? null : item_id;
    
    // Insert the item
    const result = await pool.query(
      'INSERT INTO registration_items (registration_id, item_id, name, price, unit, quantity, is_manual) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [hotelId, finalItemId, name, price, unit, quantity, is_manual || false]
    );

    console.log('Item added successfully:', result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error adding item to registration:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update an item
app.put('/registrations/items/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const { quantity, price, unit } = req.body;

  try {
    console.log('Updating item:', itemId, req.body);
    
    // Validate required fields
    if (price === undefined || price === null) {
      return res.status(400).json({ error: 'Item price is required' });
    }
    
    if (!unit) {
      return res.status(400).json({ error: 'Item unit is required' });
    }
    
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Item quantity is required' });
    }
    
    // Check if the item exists
    const itemCheck = await pool.query(
      'SELECT * FROM registration_items WHERE id = $1',
      [itemId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const result = await pool.query(
      'UPDATE registration_items SET quantity = $1, price = $2, unit = $3 WHERE id = $4 RETURNING *',
      [quantity, price, unit, itemId]
    );

    console.log('Item updated successfully:', result.rows[0]);
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error updating item:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete an item
app.delete('/registrations/items/:itemId', async (req, res) => {
  const { itemId } = req.params;

  try {
    console.log('Deleting item:', itemId);
    
    // Check if the item exists
    const itemCheck = await pool.query(
      'SELECT * FROM registration_items WHERE id = $1',
      [itemId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const result = await pool.query(
      'DELETE FROM registration_items WHERE id = $1 RETURNING *',
      [itemId]
    );

    console.log('Item deleted successfully:', result.rows[0]);
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting item:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create admin user endpoint
app.post('/api/create-admin', async (req, res) => {
  const { email, password, name } = req.body;
  
  try {
    // Check if admin already exists
    const checkResult = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert admin user
    const result = await pool.query(
      'INSERT INTO admin_users(email, name, password) VALUES($1, $2, $3) RETURNING *',
      [email, name, hashedPassword]
    );
    
    res.status(201).json({
      message: 'Admin user created successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Get all admin users
app.get('/api/admins', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM admin_users'
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user password
app.post('/api/update-password', async (req, res) => {
  const { phone, password } = req.body;
  
  try {
    // Validate input
    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the user's password
    const result = await pool.query(
      'UPDATE registrations SET password = $1 WHERE phone_number = $2 RETURNING *',
      [hashedPassword, phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get registration items for a specific hotel ID
app.get('/api/registration-items/:hotelId', async (req, res) => {
  const { hotelId } = req.params;

  try {
    console.log('Fetching items for hotel:', hotelId);
    
    const result = await pool.query(
      'SELECT * FROM registration_items WHERE registration_id = $1',
      [hotelId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching items:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Orders endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const { hotel_id, admin } = req.query;
    
    console.log('Fetching orders with params:', { hotel_id, admin });

    // If admin=true, allow fetching all orders
    if (admin === 'true') {
      console.log('Admin request - fetching all orders');
      const query = `
        SELECT o.*, 
               json_agg(json_build_object(
                 'id', oi.id,
                 'name', oi.name,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'unit', oi.unit
               )) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      
      const result = await pool.query(query);
      console.log(`Found ${result.rows.length} orders for admin`);
      return res.json(result.rows);
    }
    
    // For regular users, hotel_id is required
    if (!hotel_id) {
      return res.status(400).json({ 
        error: 'Missing required parameter: hotel_id',
        details: 'A hotel_id query parameter is required to fetch orders' 
      });
    }
    
    const query = `
      SELECT o.*, 
             json_agg(json_build_object(
               'id', oi.id,
               'name', oi.name,
               'quantity', oi.quantity,
               'price', oi.price,
               'unit', oi.unit
             )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.hotel_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const result = await pool.query(query, [hotel_id]);
    console.log(`Found ${result.rows.length} orders for hotel_id: ${hotel_id}`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { hotel_id, items, note, total, date, status } = req.body;
    
    // Insert the order
    const orderQuery = `
      INSERT INTO orders (hotel_id, note, total, delivery_date, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const orderResult = await client.query(orderQuery, [hotel_id, note, total, date, status]);
    const orderId = orderResult.rows[0].id;
    
    // Insert order items
    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items (order_id, name, quantity, price, unit)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(itemQuery, [
        orderId,
        item.name,
        item.quantity,
        item.price,
        item.unit
      ]);
    }
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Initialize tables
app.post('/api/init-tables', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create orders table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        hotel_id VARCHAR(100) NOT NULL,
        note TEXT,
        total DECIMAL(10,2) NOT NULL,
        delivery_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hotel_id) REFERENCES registrations(hotel_id)
      )
    `);

    // Create order_items table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Tables initialized successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing tables:', err);
    res.status(500).json({ error: 'Failed to initialize tables' });
  } finally {
    client.release();
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await initializeTables();
  } catch (err) {
    console.error('Failed to initialize tables:', err);
  }
});