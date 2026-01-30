import { redis } from '../redis';
import { Player } from '../lobby/types';
import { lobbyManager } from '../lobby/manager';

const QUEUE_KEY = 'matchmaking:queue';
const MATCH_SIZE = 5;

interface QueueEntry {
  player: Player;
  joinedAt: number;
}

export class MatchmakingQueue {
  async add(player: Player): Promise<void> {
    const entry: QueueEntry = { player, joinedAt: Date.now() };
    await redis.rpush(QUEUE_KEY, JSON.stringify(entry));
  }

  async remove(playerId: string): Promise<void> {
    const entries = await this.getAll();
    await redis.del(QUEUE_KEY);
    const remaining = entries.filter((e) => e.player.id !== playerId);
    if (remaining.length > 0) {
      await redis.rpush(QUEUE_KEY, ...remaining.map((e) => JSON.stringify(e)));
    }
  }

  async getAll(): Promise<QueueEntry[]> {
    const raw = await redis.lrange(QUEUE_KEY, 0, -1);
    return raw.map((r) => JSON.parse(r));
  }

  /** Attempt to form a match. Returns lobby info if successful. */
  async tryMatch(): Promise<{ lobbyCode: string; players: Player[] } | null> {
    const entries = await this.getAll();
    if (entries.length < MATCH_SIZE) return null;

    const matched = entries.slice(0, MATCH_SIZE);
    const players = matched.map((e) => e.player);

    // Remove matched players from the queue
    await redis.del(QUEUE_KEY);
    const remaining = entries.slice(MATCH_SIZE);
    if (remaining.length > 0) {
      await redis.rpush(QUEUE_KEY, ...remaining.map((e) => JSON.stringify(e)));
    }

    // Create a matchmaking lobby with the first player as host
    const lobby = await lobbyManager.create(players[0], 'matchmaking');
    for (let i = 1; i < players.length; i++) {
      await lobbyManager.addPlayer(lobby.code, players[i]);
    }

    return { lobbyCode: lobby.code, players };
  }

  async getQueueSize(): Promise<number> {
    return redis.llen(QUEUE_KEY);
  }
}

export const matchmakingQueue = new MatchmakingQueue();
