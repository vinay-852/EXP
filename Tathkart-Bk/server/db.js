// PostgreSQL Database Connection and Authentication API
const { Pool } = require('pg');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'auth_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Initialize database tables
const initDb = async () => {
  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Initialize database on startup
initDb();

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      phoneNumber: user.phone_number,
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
    req.user = user;
    next();
  });
};

// API Routes

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phoneNumber, email, password, role = 'user' } = req.body;
    
    // Validate input
    if (!name || !phoneNumber || !password) {
      return res.status(400).json({ error: 'Name, phone number, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phoneNumber]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (name, phone_number, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phoneNumber, email, hashedPassword, role]
    );
    
    const newUser = result.rows[0];
    
    // Format user object for response
    const user = {
      id: newUser.id,
      name: newUser.name,
      phoneNumber: newUser.phone_number,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.created_at
    };
    
    // Generate token
    const token = generateToken(newUser);
    
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login with phone number
app.post('/api/auth/login-phone', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    
    // Validate input
    if (!phoneNumber || !password) {
      return res.status(400).json({ error: 'Phone number and password are required' });
    }
    
    // Find user by phone number
    const result = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phoneNumber]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }
    
    // Format user object for response
    const userResponse = {
      id: user.id,
      name: user.name,
      phoneNumber: user.phone_number,
      email: user.email,
      role: user.role,
      createdAt: user.created_at
    };
    
    // Generate token
    const token = generateToken(user);
    
    res.json({ user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Login with email
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Format user object for response
    const userResponse = {
      id: user.id,
      name: user.name,
      phoneNumber: user.phone_number,
      email: user.email,
      role: user.role,
      createdAt: user.created_at
    };
    
    // Generate token
    const token = generateToken(user);
    
    res.json({ user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    // Get user from database using the ID from the token
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Format user object for response
    const userResponse = {
      id: user.id,
      name: user.name,
      phoneNumber: user.phone_number,
      email: user.email,
      role: user.role,
      createdAt: user.created_at
    };
    
    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout (optional - client-side token removal is usually sufficient)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a real implementation, you might want to blacklist the token
  // For now, we'll just return a success message
  res.json({ message: 'Logged out successfully' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { pool }; 