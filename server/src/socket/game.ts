import { Server, Socket } from 'socket.io';
import { gameManager } from '../game/manager';
import { lobbyManager } from '../lobby/manager';

export function registerGameHandlers(io: Server, socket: Socket) {
  // Broadcast drawing strokes to other players
  socket.on('game:draw', ({ code, stroke }: { code: string; stroke: any }) => {
    const fullStroke = { ...stroke, playerId: socket.data.userId };
    gameManager.addStroke(code, fullStroke);
    socket.to(`lobby:${code}`).emit('game:draw', fullStroke);
  });

  // Broadcast canvas clear
  socket.on('game:clearCanvas', ({ code }: { code: string }) => {
    socket.to(`lobby:${code}`).emit('game:clearCanvas', {
      playerId: socket.data.userId,
    });
  });

  // Submit a guess
  socket.on(
    'game:guess',
    async (
      { code, targetId, guess }: { code: string; targetId: string; guess: string },
      callback: Function
    ) => {
      try {
        const result = await gameManager.processGuess(
          code,
          socket.data.userId,
          targetId,
          guess
        );

        if (!result) {
          return callback({ success: false, error: 'Invalid guess' });
        }

        // Broadcast the guess attempt to all players
        io.to(`lobby:${code}`).emit('game:guessResult', result.attempt);

        if (result.attempt.correct) {
          const target = result.state.players.find((p) => p.id === targetId);
          io.to(`lobby:${code}`).emit('game:playerEliminated', {
            playerId: targetId,
            animal: target?.animal,
            guessedBy: socket.data.userId,
          });
        }

        // Handle game over
        if (result.state.status === 'finished') {
          io.to(`lobby:${code}`).emit('game:finished', {
            winnerId: result.state.winner,
            winReason: result.state.winReason,
            players: result.state.players.map((p) => ({
              id: p.id,
              username: p.username,
              animal: p.animal,
              isEliminated: p.isEliminated,
            })),
          });

          const lobby = await lobbyManager.get(code);
          if (lobby?.mode === 'private') {
            await lobbyManager.setStatus(code, 'waiting');
            setTimeout(() => {
              io.to(`lobby:${code}`).emit('game:returnToLobby');
            }, 5000);
          } else {
            setTimeout(async () => {
              io.to(`lobby:${code}`).emit('game:returnToHome');
              await lobbyManager.delete(code);
            }, 5000);
          }

          await gameManager.cleanup(code);
        }

        callback({ success: true, correct: result.attempt.correct });
      } catch (err) {
        callback({ success: false, error: 'Failed to process guess' });
      }
    }
  );

  // Request replay of strokes (for late-joiners or reconnects)
  socket.on('game:requestStrokes', ({ code }: { code: string }) => {
    const strokes = gameManager.getStrokes(code);
    socket.emit('game:strokeReplay', strokes);
  });
}
