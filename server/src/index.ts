import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { config } from './config';
import { prisma } from './db';
import { issueToken } from './auth/jwt';
import { createSocketServer } from './socket';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// --- Guest auth: pick a username and receive a JWT ---
app.post('/api/auth/guest', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      return res.status(400).json({ error: 'Username must be 3–20 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return res.status(400).json({ error: 'Username may only contain letters, numbers, and underscores' });
    }

    // Find or create the user by username
    let user = await prisma.user.findUnique({ where: { username: trimmed } });
    if (!user) {
      user = await prisma.user.create({ data: { username: trimmed } });
    }

    const token = issueToken({ userId: user.id, username: user.username });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err: any) {
    console.error('Guest auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Serve client in production
if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });
}

// --- Start server ---
const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(config.port, () => {
  console.log(`IdentiDraw server running on port ${config.port}`);
});
