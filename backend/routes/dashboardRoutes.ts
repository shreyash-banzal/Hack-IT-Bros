import express from 'express';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();

    // Start of today (00:00:00 local/UTC)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrdersCount = await Order.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    // Real aggregation for sales today
    const todaySalesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
          status: { $in: ['confirmed', 'pending_approval'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    const todaySales = todaySalesAgg[0]?.total || 0;

    // Real aggregation for all-time sales
    const totalSalesAgg = await Order.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'pending_approval'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    const totalSales = totalSalesAgg[0]?.total || 0;

    // Real low stock query
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .select('name stock lowStockThreshold unit price category')
      .lean();

    // Recent 5 real orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      totalProducts,
      totalOrders,
      todayOrders: todayOrdersCount,
      todaySales: Number(todaySales.toFixed(2)),
      totalSales: Number(totalSales.toFixed(2)),
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        unit: p.unit,
        price: p.price,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o._id.toString(),
        orderId: o.orderId,
        customerName: o.customerName,
        itemsCount: o.items.length,
        totalAmount: o.totalAmount,
        status: o.status,
        source: o.source,
        createdAt: o.createdAt,
      })),
    });
  } catch (err: any) {
    console.error('[Dashboard Stats Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
