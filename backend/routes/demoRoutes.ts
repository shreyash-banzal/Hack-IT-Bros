import express from 'express';
import { seedDatabase } from '../seed/seed.js';
import { Product } from '../models/Product.js';
import { createOrder } from '../services/orderService.js';

const router = express.Router();

// POST /api/demo/reset
router.post('/reset', async (req, res) => {
  try {
    const result = await seedDatabase(true);
    res.json({
      success: true,
      message: 'MongoDB database successfully reset to clean demo state.',
      productsSeeded: result.productsCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/demo/test-concurrency
router.post('/test-concurrency', async (req, res) => {
  try {
    // 1. Create or set a limited stock item: 5 units
    let testProduct = await Product.findOne({ name: 'Concurrency Test Maggi' });
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Concurrency Test Maggi',
        category: 'Test',
        price: 20,
        unit: 'pack',
        stock: 5,
        lowStockThreshold: 2,
        aliases: ['concurrency maggi'],
        isActive: true,
      });
    } else {
      testProduct.stock = 5;
      await testProduct.save();
    }

    const productId = testProduct._id.toString();

    // 2. Dispatch two simultaneous orders for 4 units each at the exact same time
    const [orderA, orderB] = await Promise.all([
      createOrder({
        items: [{ productId, quantity: 4 }],
        customer: { name: 'Customer A (Simultaneous)', phone: '9999900001' },
        source: 'web',
      }),
      createOrder({
        items: [{ productId, quantity: 4 }],
        customer: { name: 'Customer B (Simultaneous)', phone: '9999900002' },
        source: 'web',
      }),
    ]);

    // 3. Inspect final MongoDB stock
    const finalProduct = await Product.findById(productId).lean();
    const finalStock = finalProduct ? finalProduct.stock : -999;

    const successfulOrdersCount = (orderA.success ? 1 : 0) + (orderB.success ? 1 : 0);
    const failedOrdersCount = (!orderA.success ? 1 : 0) + (!orderB.success ? 1 : 0);

    const raceConditionPrevented = successfulOrdersCount === 1 && failedOrdersCount === 1 && finalStock === 1;

    res.json({
      success: true,
      initialStock: 5,
      requestedUnitsPerOrder: 4,
      finalStock,
      raceConditionPrevented,
      orderA: {
        success: orderA.success,
        orderId: orderA.order?.orderId,
        error: orderA.error,
      },
      orderB: {
        success: orderB.success,
        orderId: orderB.order?.orderId,
        error: orderB.error,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
