import express from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from '../services/orderService.js';

const router = express.Router();

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const { status, source } = req.query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (source) filter.source = source;

    const orders = await getAllOrders(filter);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders (Direct order creation with backend pricing and atomic inventory safety)
router.post('/', async (req, res) => {
  try {
    const { items, customer, source = 'web', notes, messageId } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Items array is required' });
      return;
    }

    const result = await createOrder({
      items,
      customer,
      source,
      notes,
      messageId,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
        failedItem: result.failedItem,
      });
      return;
    }

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status (Human approval / rejection / cancellation)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'pending_approval', 'cancelled', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const updated = await updateOrderStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
