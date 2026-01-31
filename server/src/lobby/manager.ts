import { store } from '../store';
import { Lobby, Player } from './types';

const LOBBY_TTL = 7200; // 2 hours

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function key(code: string): string {
  return `lobby:${code}`;
}

export class LobbyManager {
  async create(host: Player, mode: 'private' | 'matchmaking'): Promise<Lobby> {
    let code: string;
    do {
      code = generateCode();
    } while (await store.exists(key(code)));

    const lobby: Lobby = {
      code,
      hostId: host.id,
      players: [host],
      mode,
      status: 'waiting',
      createdAt: Date.now(),
    };

    await store.setex(key(code), LOBBY_TTL, JSON.stringify(lobby));
    return lobby;
  }

  async get(code: string): Promise<Lobby | null> {
    const data = await store.get(key(code));
    return data ? JSON.parse(data) : null;
  }

  async update(lobby: Lobby): Promise<void> {
    await store.setex(key(lobby.code), LOBBY_TTL, JSON.stringify(lobby));
  }

  async addPlayer(code: string, player: Player): Promise<Lobby | null> {
    const lobby = await this.get(code);
    if (!lobby || lobby.status !== 'waiting') return null;
    if (lobby.players.find((p) => p.id === player.id)) return lobby;

    lobby.players.push(player);
    await this.update(lobby);
    return lobby;
  }

  async removePlayer(code: string, playerId: string): Promise<Lobby | null> {
    const lobby = await this.get(code);
    if (!lobby) return null;

    lobby.players = lobby.players.filter((p) => p.id !== playerId);

    if (lobby.players.length === 0) {
      await store.del(key(code));
      return null;
    }

    // Transfer host if the host left
    if (lobby.hostId === playerId) {
      lobby.hostId = lobby.players[0].id;
    }

    await this.update(lobby);
    return lobby;
  }

  /** Update socket ID for a reconnecting player */
  async updateSocketId(
    code: string,
    playerId: string,
    socketId: string
  ): Promise<void> {
    const lobby = await this.get(code);
    if (!lobby) return;
    const player = lobby.players.find((p) => p.id === playerId);
    if (player) {
      player.socketId = socketId;
      await this.update(lobby);
    }
  }

  async setStatus(code: string, status: Lobby['status']): Promise<void> {
    const lobby = await this.get(code);
    if (!lobby) return;
    lobby.status = status;
    await this.update(lobby);
  }

  async delete(code: string): Promise<void> {
    await store.del(key(code));
  }
}

export const lobbyManager = new LobbyManager();
