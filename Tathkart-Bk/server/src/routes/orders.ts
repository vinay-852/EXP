import express from 'express';
import { createOrder, getOrdersByHotelId, getOrderById } from '../models/order';

const router = express.Router();

// Create new order
router.post('/orders', async (req, res) => {
  try {
    console.log('Received order data:', req.body);

    const order = await createOrder(req.body);
    
    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Get orders for a specific hotel
router.get('/orders/:hotelId', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId);
    const orders = await getOrdersByHotelId(hotelId);
    
    res.status(200).json({
      orders
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      message: 'Failed to get orders',
      error: error.message
    });
  }
});

export default router; 