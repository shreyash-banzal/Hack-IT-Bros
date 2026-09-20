import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB, getDatabaseStatus } from './backend/config/db.js';
import { isGroqConfigured } from './backend/ai/groqClient.js';
import { seedDatabase } from './backend/seed/seed.js';
import { Product } from './backend/models/Product.js';

import chatRoutes from './backend/routes/chatRoutes.js';
import productRoutes from './backend/routes/productRoutes.js';
import inventoryRoutes from './backend/routes/inventoryRoutes.js';
import orderRoutes from './backend/routes/orderRoutes.js';
import dashboardRoutes from './backend/routes/dashboardRoutes.js';
import whatsappRoutes from './backend/routes/whatsappRoutes.js';
import demoRoutes from './backend/routes/demoRoutes.js';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Startup environment verification
  console.log('----------------------------------------------------');
  console.log(' [ZERO-CLICK STORE OPERATOR] System Boot');
  console.log('----------------------------------------------------');
  const mongoConfigured = Boolean(process.env.MONGODB_URI?.trim());
  const groqConfigured = isGroqConfigured();

  if (!mongoConfigured) {
    console.warn('[Config Warning] MONGODB_URI is not set. A live in-memory MongoDB engine will be started automatically for development and test execution.');
  } else {
    console.log('[Config Check] MONGODB_URI is configured.');
  }

  if (!groqConfigured) {
    console.warn('[Config Warning] GROQ_API_KEY is not set. Autonomous agent AI calls will return a missing-key status until GROQ_API_KEY is provided.');
  } else {
    console.log('[Config Check] GROQ_API_KEY is configured.');
  }
  console.log('----------------------------------------------------');

  // Attempt database connection and initial seed if product catalog is empty
  try {
    const dbRes = await connectDB();
    if (dbRes.success) {
      const count = await Product.countDocuments();
      if (count === 0) {
        console.log('[Bootstrap] Product collection is empty. Auto-seeding initial store catalog...');
        await seedDatabase(false);
      } else {
        console.log(`[Bootstrap] MongoDB catalog already contains ${count} products.`);
      }
    }
  } catch (err: any) {
    console.error('[Bootstrap DB Error]:', err.message);
  }

  // 1. Health check endpoint (Render & AI Studio health probe)
  app.get('/api/health', (req, res) => {
    const dbStatus = getDatabaseStatus();
    res.json({
      status: 'ok',
      service: 'Zero-Click Store Operator',
      database: dbStatus.connected ? 'connected' : 'disconnected',
      databaseDetails: dbStatus,
      groq: groqConfigured ? 'configured' : 'missing_key',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. API Routes
  app.use('/api/chat', chatRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/demo', demoRoutes);

  // 3. Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Zero-Click Store Operator listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Server Startup Error]:', err);
});
