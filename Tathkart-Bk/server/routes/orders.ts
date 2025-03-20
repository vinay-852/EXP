import express from 'express';
import { createOrder, getUserOrders } from '../models/order';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/registrations/orders', authenticateToken, async (req, res) => {
  try {
    const { hotel_id, items, total, date, note, owner_name, phone_number, location } = req.body;

    // Validate required fields
    if (!hotel_id || !items || items.length === 0) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        hotel_id,
        owner_name,
        phone_number,
        location,
        note,
        total,
        date,
        status: 'pending',
        items: {
          create: items.map(item => ({
            item_id: item.item_id,
            name: item.name,
            quantity: item.quantity,
            grams: item.grams,
            price: item.price,
            unit: item.unit
          }))
        }
      },
      include: {
        items: true
      }
    });

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      message: 'Failed to create order',
      error: error.message
    });
  }
});

router.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    const orders = await getUserOrders(Number(userId));
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router; 