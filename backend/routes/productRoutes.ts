import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} from '../services/productService.js';

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;
    if (query && typeof query === 'string') {
      const results = await searchProducts(query);
      res.json(results);
      return;
    }
    const products = await getAllProducts({ isActive: true });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const { name, category, price, stock, unit, lowStockThreshold, aliases, description } = req.body;
    if (!name || price === undefined) {
      res.status(400).json({ error: 'Product name and price are required.' });
      return;
    }
    const product = await createProduct({
      name,
      category: category || 'General',
      price: Number(price),
      stock: Number(stock ?? 0),
      unit: unit || 'piece',
      lowStockThreshold: Number(lowStockThreshold ?? 5),
      aliases,
      description,
    });
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateProduct(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Product not found or invalid ID' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const success = await deleteProduct(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
