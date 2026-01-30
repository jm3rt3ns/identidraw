import { Socket } from 'socket.io';
import { firebaseAuth } from './firebase';
import { prisma } from '../db';

// Verifies Firebase token and attaches user data to the socket
export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      return next(new Error('User not registered. Please complete registration first.'));
    }

    socket.data.userId = user.id;
    socket.data.username = user.username;
    socket.data.firebaseUid = decoded.uid;
    next();
  } catch {
    next(new Error('Invalid authentication token'));
  }
}
