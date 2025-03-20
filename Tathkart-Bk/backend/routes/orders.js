const express = require('express');
const router = express.Router();
const pool = require('../db/config'); // Your PostgreSQL connection pool

/**
 * GET /api/orders
 * Fetch orders with optional date filtering
 */
router.get('/', async (req, res) => {
  try {
    const { date, hotel_id, admin } = req.query;
    
    // If admin=true, allow fetching all orders
    if (admin === 'true') {
      console.log('Admin request - fetching all orders');
      let query;
      let params = [];
      
      if (date) {
        // If date is provided, filter orders for that specific date
        query = `
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
          WHERE DATE(o.date) = $1
          GROUP BY o.id
          ORDER BY o.created_at DESC
        `;
        params = [date];
      } else {
        // If no date is provided, fetch all orders
        query = `
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
          GROUP BY o.id
          ORDER BY o.created_at DESC
        `;
      }
      
      const { rows: orders } = await pool.query(query, params);
      return res.json(orders);
    }
    
    // For regular users, hotel_id is required
    if (!hotel_id) {
      return res.status(400).json({ 
        error: 'Missing required parameter: hotel_id',
        details: 'A hotel_id query parameter is required to fetch orders' 
      });
    }
    
    let query;
    let params = [];

    if (date) {
      // If date is provided, filter orders for that specific date and hotel_id
      query = `
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
        WHERE DATE(o.date) = $1 AND o.hotel_id = $2
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      params = [date, hotel_id];
    } else {
      // If only hotel_id is provided, fetch all orders for that hotel
      query = `
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
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      params = [hotel_id];
    }

    // Execute the query
    const { rows: orders } = await pool.query(query, params);

    // For each order, fetch its items
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const itemsQuery = `
          SELECT 
            oi.id,
            oi.quantity,
            p.name,
            p.price,
            p.unit
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = $1
        `;
        
        const { rows: items } = await pool.query(itemsQuery, [order.id]);
        
        return {
          id: order.id,
          status: order.status,
          createdAt: order.created_at,
          total: parseFloat(order.total),
          note: order.note,
          hotelId: order.hotel_id,
          hotelName: order.owner_name,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            quantity: parseFloat(item.quantity),
            unit: item.unit
          }))
        };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status
 */
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['pending', 'confirmed', 'ready', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  
  try {
    const query = `
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, status
    `;
    
    const { rows } = await pool.query(query, [status, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

/**
 * GET /api/orders/metrics
 * Get order metrics (counts)
 */
router.get('/metrics', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const metricsQuery = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_users,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = $1) as today_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders
    `;
    
    const { rows } = await pool.query(metricsQuery, [today]);
    
    res.json({
      totalRegistrations: parseInt(rows[0].total_users),
      todayOrders: parseInt(rows[0].today_orders),
      pendingOrders: parseInt(rows[0].pending_orders)
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Add this debug endpoint
router.get('/debug', async (req, res) => {
  try {
    const { hotel_id, admin } = req.query;
    
    // If admin=true, allow fetching all orders
    if (admin === 'true') {
      console.log('Admin debug request - fetching all orders');
      const result = await pool.query(`
        SELECT 
          o.*,
          json_agg(oi.*) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
      `);
      
      return res.json({
        count: result.rows.length,
        orders: result.rows
      });
    }
    
    // For regular users, hotel_id is required
    if (!hotel_id) {
      return res.status(400).json({ 
        error: 'Missing required parameter: hotel_id',
        details: 'A hotel_id query parameter is required to fetch orders' 
      });
    }
    
    const result = await pool.query(`
      SELECT 
        o.*,
        json_agg(oi.*) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.hotel_id = $1
      GROUP BY o.id
    `, [hotel_id]);
    
    res.json({
      count: result.rows.length,
      orders: result.rows
    });
  } catch (err) {
    console.error('Debug query error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 