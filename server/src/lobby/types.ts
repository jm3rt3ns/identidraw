export interface Player {
  id: string;
  username: string;
  socketId: string;
}

export interface Lobby {
  code: string;
  hostId: string;
  players: Player[];
  mode: 'private' | 'matchmaking';
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  createdAt: number;
}

export interface ChatMessage {
  playerId: string;
  username: string;
  message: string;
  timestamp: number;
}
