import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config';
import { socketAuthMiddleware } from '../auth/middleware';
import { registerLobbyHandlers } from './lobby';
import { registerGameHandlers } from './game';
import { registerMatchmakingHandlers } from './matchmaking';

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.data.username} (${socket.id})`);

    registerLobbyHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerMatchmakingHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.data.username}`);
    });
  });

  return io;
}
