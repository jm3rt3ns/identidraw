import { Server, Socket } from 'socket.io';
import { matchmakingQueue } from '../matchmaking/queue';
import { gameManager } from '../game/manager';
import { lobbyManager } from '../lobby/manager';

export function registerMatchmakingHandlers(io: Server, socket: Socket) {
  // Join the matchmaking queue
  socket.on('matchmaking:join', async (callback: Function) => {
    try {
      const player = {
        id: socket.data.userId as string,
        username: socket.data.username as string,
        socketId: socket.id,
      };

      await matchmakingQueue.add(player);
      socket.data.inMatchmaking = true;

      const size = await matchmakingQueue.getQueueSize();
      socket.emit('matchmaking:queueSize', { size });

      // Attempt to form a match
      const match = await matchmakingQueue.tryMatch();
      if (match) {
        await startMatchmakingGame(io, match.lobbyCode, match.players);
      }

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: 'Failed to join matchmaking' });
    }
  });

  // Leave the matchmaking queue
  socket.on('matchmaking:leave', async () => {
    await matchmakingQueue.remove(socket.data.userId);
    socket.data.inMatchmaking = false;
  });

  // Clean up on disconnect
  socket.on('disconnect', async () => {
    if (socket.data.inMatchmaking) {
      await matchmakingQueue.remove(socket.data.userId);
    }
  });
}

/** Start a game for matched players: join room, assign animals, countdown, play. */
async function startMatchmakingGame(
  io: Server,
  lobbyCode: string,
  players: { id: string; username: string; socketId: string }[]
) {
  // Join all matched players into the lobby room
  for (const p of players) {
    const s = io.sockets.sockets.get(p.socketId);
    if (s) {
      s.data.lobbyCode = lobbyCode;
      s.data.inMatchmaking = false;
      s.join(`lobby:${lobbyCode}`);
    }
  }

  const lobby = await lobbyManager.get(lobbyCode);
  if (!lobby) return;

  await lobbyManager.setStatus(lobbyCode, 'countdown');
  const gameState = await gameManager.create(lobbyCode, lobby.players);

  // Send each player their private assignment
  for (const gp of gameState.players) {
    const knownPlayer = gameState.players.find(
      (p) => p.id === gp.knownPlayerId
    );
    const targetSocket = io.sockets.sockets.get(gp.socketId);
    if (targetSocket && knownPlayer) {
      targetSocket.emit('matchmaking:matched', { lobbyCode });
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

  io.to(`lobby:${lobbyCode}`).emit('game:countdown', { seconds: 5 });

  setTimeout(async () => {
    const state = await gameManager.setPlaying(lobbyCode);
    if (state) {
      await lobbyManager.setStatus(lobbyCode, 'playing');
      io.to(`lobby:${lobbyCode}`).emit('game:started');
    }
  }, 5000);
}
