import express from 'express';
import { getAllProducts, getLowStockProducts } from '../services/productService.js';
import { checkInventory } from '../services/inventoryService.js';

const router = express.Router();

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const products = await getAllProducts();
    const inventoryList = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      unit: p.unit,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      isLowStock: p.stock <= p.lowStockThreshold,
      isOutOfStock: p.stock <= 0,
      updatedAt: p.updatedAt,
    }));
    res.json(inventoryList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', async (req, res) => {
  try {
    const lowStock = await getLowStockProducts();
    res.json(lowStock);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/check/:productId
router.get('/check/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = parseInt((req.query.quantity as string) || '1', 10);
    const result = await checkInventory(productId, quantity);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
