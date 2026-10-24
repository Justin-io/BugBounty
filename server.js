import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';
const distPath = path.join(__dirname, 'dist');

// Serve static assets from built Vite bundle
app.use(express.static(distPath));

// Health check endpoint for container orchestrators and platform health probes
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// SPA fallback: send index.html for all client-side routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start listener when executed directly
if (process.argv[1] === __filename) {
  app.listen(port, host, () => {
    console.log(`[production] Alex Security Research Academy listening at http://${host}:${port}`);
  });
}

export { app };
