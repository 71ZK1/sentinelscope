// server.ts
// SentinelScope Full-Stack Server Entry Point

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount API endpoints FIRST
  app.use('/api', apiRouter);

  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'SentinelScope ASM Server', timestamp: new Date().toISOString() });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
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
    console.log(`[SentinelScope] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SentinelScope] Fatal server startup failure:', err);
});
