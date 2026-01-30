import { Server, Socket } from 'socket.io';
import { lobbyManager } from '../lobby/manager';
import { gameManager } from '../game/manager';

export function registerLobbyHandlers(io: Server, socket: Socket) {
  const getPlayer = () => ({
    id: socket.data.userId as string,
    username: socket.data.username as string,
    socketId: socket.id,
  });

  // Create a private lobby
  socket.on('lobby:create', async (callback: Function) => {
    try {
      const lobby = await lobbyManager.create(getPlayer(), 'private');
      socket.data.lobbyCode = lobby.code;
      socket.join(`lobby:${lobby.code}`);
      callback({ success: true, lobby });
    } catch (err) {
      callback({ success: false, error: 'Failed to create lobby' });
    }
  });

  // Join a lobby by code
  socket.on('lobby:join', async ({ code }: { code: string }, callback: Function) => {
    try {
      const lobby = await lobbyManager.addPlayer(code, getPlayer());
      if (!lobby) {
        callback({ success: false, error: 'Lobby not found or game already in progress' });
        return;
      }
      socket.data.lobbyCode = code;
      socket.join(`lobby:${code}`);
      io.to(`lobby:${code}`).emit('lobby:updated', lobby);
      callback({ success: true, lobby });
    } catch (err) {
      callback({ success: false, error: 'Failed to join lobby' });
    }
  });

  // Leave a lobby
  socket.on('lobby:leave', async ({ code }: { code: string }) => {
    const lobby = await lobbyManager.removePlayer(code, socket.data.userId);
    socket.leave(`lobby:${code}`);
    socket.data.lobbyCode = undefined;
    if (lobby) {
      io.to(`lobby:${code}`).emit('lobby:updated', lobby);
    }
  });

  // Send a chat message in the lobby
  socket.on('lobby:chat', ({ code, message }: { code: string; message: string }) => {
    io.to(`lobby:${code}`).emit('lobby:chatMessage', {
      playerId: socket.data.userId,
      username: socket.data.username,
      message,
      timestamp: Date.now(),
    });
  });

  // Host starts the game
  socket.on('lobby:startGame', async ({ code }: { code: string }, callback: Function) => {
    try {
      const lobby = await lobbyManager.get(code);
      if (!lobby) {
        return callback({ success: false, error: 'Lobby not found' });
      }
      if (lobby.hostId !== socket.data.userId) {
        return callback({ success: false, error: 'Only the host can start the game' });
      }
      if (lobby.players.length < 3) {
        return callback({ success: false, error: 'Need at least 3 players to start' });
      }

      await lobbyManager.setStatus(code, 'countdown');
      const gameState = await gameManager.create(code, lobby.players);

      // Send each player their private assignment
      for (const gp of gameState.players) {
        const knownPlayer = gameState.players.find(
          (p) => p.id === gp.knownPlayerId
        );
        const targetSocket = io.sockets.sockets.get(gp.socketId);
        if (targetSocket && knownPlayer) {
          targetSocket.emit('game:init', {
            yourAnimal: gp.animal,
            knownPlayerAnimal: {
              playerId: knownPlayer.id,
              username: knownPlayer.username,
              animal: knownPlayer.animal,
            },
            players: gameState.players.map((p) => ({
              id: p.id,
              username: p.username,
            })),
          });
        }
      }

      io.to(`lobby:${code}`).emit('game:countdown', { seconds: 5 });

      // Transition to playing after countdown
      setTimeout(async () => {
        const state = await gameManager.setPlaying(code);
        if (state) {
          await lobbyManager.setStatus(code, 'playing');
          io.to(`lobby:${code}`).emit('game:started');
        }
      }, 5000);

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: 'Failed to start game' });
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', async () => {
    const code = socket.data.lobbyCode as string | undefined;
    if (code) {
      const lobby = await lobbyManager.removePlayer(code, socket.data.userId);
      if (lobby) {
        io.to(`lobby:${code}`).emit('lobby:updated', lobby);
      }
    }
  });
}
