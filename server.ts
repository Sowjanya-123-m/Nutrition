import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/db/config';
import { seedDatabase } from './server/db/seed';
import userRoute from './server/routes/userRoute';
import suggestionRoute from './server/routes/suggestionRoute';
import chatRoute from './server/routes/chatRoute';
import mealRoute from './server/routes/mealRoute';
import aiRoute from './server/routes/aiRoute';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Establish database connection (Mongoose or Local fallback)
  await connectDB();
  
  // Seed database with default accounts
  await seedDatabase();

  // 2. Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 3. API Endpoints
  app.use('/api/users', userRoute);
  app.use('/api/suggestions', suggestionRoute);
  app.use('/api/chat', chatRoute);
  app.use('/api/meals', mealRoute);
  app.use('/api/ai', aiRoute);

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      time: new Date().toISOString(),
      databaseFallback: !require('./server/db/config').isMongoConnected,
    });
  });

  // 4. Vite Dev Server Integration / Production Static Assets serving
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚀 Running in DEVELOPMENT mode. Mounting Vite Dev Server...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Let Vite handle asset serving and SPA routing
    app.use(vite.middlewares);
  } else {
    console.log('📦 Running in PRODUCTION mode. Serving bundled static assets...');
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static files
    app.use(express.static(distPath));
    // SPA Fallback for any non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 5. Port Listening (0.0.0.0 required for container ingress)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🟢 Nutrition Assistant Server running on:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   http://0.0.0.0:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer().catch((error) => {
  console.error('❌ Critical server boot error:', error);
  process.exit(1);
});
