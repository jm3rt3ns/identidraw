import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { config } from './config';
import { prisma } from './db';
import { firebaseAuth } from './auth/firebase';
import { createSocketServer } from './socket';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// --- REST endpoint for user registration / lookup ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { token, username } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const decoded = await firebaseAuth.verifyIdToken(token);

    // Return existing user if already registered
    const existing = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });
    if (existing) {
      return res.json({ user: existing });
    }

    // New user registration — username is required
    if (!username) {
      return res.status(400).json({ error: 'Username is required for new users' });
    }

    const user = await prisma.user.create({
      data: {
        firebaseUid: decoded.uid,
        username,
        email: decoded.email || '',
      },
    });

    res.json({ user });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      const target = err?.meta?.target;
      if (Array.isArray(target) && target.includes('username')) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    console.error('Registration error:', err);
    res.status(400).json({ error: 'Registration failed' });
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
