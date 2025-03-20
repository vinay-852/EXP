// Update the orders table creation with additional fields
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

// Update the order_items table creation with grams field
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

// First, let's create a function to check if the registration_items table exists
async function checkAndCreateRegistrationItems() {
  const client = await pool.connect();
  try {
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
      );
    `);
    console.log('registration_items table checked/created successfully');
  } catch (err) {
    console.error('Error creating registration_items table:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Update the initializeTables function to include registration_items
async function initializeTables() {
  const client = await pool.connect();
  try {
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

    // Create orders table with correct column names
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

    // Create registration_items table if it doesn't exist
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

// Update the GET items endpoint
app.get('/registrations/:id/items', async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log('Fetching items for registration:', id);
    
    const result = await pool.query(
      'SELECT * FROM registration_items WHERE registration_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(200).json([]); // Return empty array instead of error
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ 
      error: 'Failed to fetch items',
      details: err.message 
    });
  }
});

// Update the POST orders endpoint
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { 
      hotel_id, 
      items, 
      note, 
      total, 
      date,
      status 
    } = req.body;

    console.log('Received order request:', {
      hotel_id,
      itemCount: items?.length,
      total,
      date,
      note
    });

    // Validate inputs
    if (!hotel_id) {
      throw new Error('Hotel ID is required');
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Items are required');
    }
    if (!date) {
      throw new Error('Date is required');
    }

    // Get hotel details
    const hotelResult = await client.query(
      'SELECT * FROM registrations WHERE hotel_id = $1',
      [hotel_id]
    );

    if (hotelResult.rows.length === 0) {
      throw new Error(`Hotel not found: ${hotel_id}`);
    }

    const hotelDetails = hotelResult.rows[0];

    // Create the order
    const orderQuery = `
      INSERT INTO orders (
        hotel_id,
        owner_name,
        phone_number,
        location,
        note,
        total,
        date,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const orderParams = [
      hotel_id,
      hotelDetails.owner_name,
      hotelDetails.phone_number,
      hotelDetails.google_maps_location || '',
      note || '',
      total,
      date,
      status || 'pending'
    ];

    console.log('Creating order with params:', orderParams);

    const orderResult = await client.query(orderQuery, orderParams);
    const order = orderResult.rows[0];

    console.log('Order created:', order);

    // Insert items
    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items (
          order_id,
          name,
          quantity,
          grams,
          price,
          unit
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const itemParams = [
        order.id,
        item.name,
        item.quantity,
        item.grams,
        item.price,
        item.unit
      ];

      console.log('Creating order item:', itemParams);

      const itemResult = await client.query(itemQuery, itemParams);
      console.log('Item created:', itemResult.rows[0]);
    }

    await client.query('COMMIT');

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        hotel_id: order.hotel_id,
        total: order.total,
        date: order.date,
        status: order.status,
        items: items.length
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', {
      error: err.message,
      stack: err.stack,
      details: err
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: err.message
    });
  } finally {
    client.release();
  }
});

// Update the GET orders endpoint
app.get('/api/orders', async (req, res) => {
  try {
    const { hotel_id } = req.query;
    
    console.log('Fetching orders for hotel_id:', hotel_id);

    // If hotel_id is not provided, return an error
    if (!hotel_id) {
      return res.status(400).json({ 
        error: 'Missing required parameter: hotel_id',
        details: 'A hotel_id query parameter is required to fetch orders' 
      });
    }

    let query = `
      SELECT 
        o.id,
        o.hotel_id,
        o.owner_name,
        o.phone_number,
        o.location,
        o.note,
        o.total::float as total,
        o.date,
        o.status,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'name', oi.name,
              'quantity', oi.quantity::float,
              'grams', oi.grams,
              'price', oi.price::float,
              'unit', oi.unit
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.hotel_id = $1
      GROUP BY o.id ORDER BY o.created_at DESC
    `;
    
    const result = await pool.query(query, [hotel_id]);
    
    console.log(`Found ${result.rows.length} orders for hotel_id: ${hotel_id}`);
    
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      details: err.message 
    });
  }
});

// Get orders for a specific hotel
app.get('/api/orders/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const query = `
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'quantity', oi.quantity,
            'grams', oi.grams,
            'price', oi.price,
            'unit', oi.unit
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.hotel_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const result = await pool.query(query, [hotelId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/registrations/:id/delivery-dates', async (req, res) => {
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
      LEFT JOIN orders ON orders.date = date::date
      GROUP BY date::date
      ORDER BY date::date
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching delivery dates:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders for a hotel
app.get('/api/orders/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const query = `
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'quantity', oi.quantity,
            'grams', oi.grams,
            'price', oi.price,
            'unit', oi.unit
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.hotel_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const result = await pool.query(query, [hotelId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get specific order details
app.get('/api/orders/detail/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const query = `
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'quantity', oi.quantity,
            'grams', oi.grams,
            'price', oi.price,
            'unit', oi.unit
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    
    const result = await pool.query(query, [orderId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
}); 