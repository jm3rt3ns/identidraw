// --- Lobby ---

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

// --- Game ---

export interface GameInitData {
  yourAnimal: string;
  knownPlayerAnimal: {
    playerId: string;
    username: string;
    animal: string;
  };
  players: Array<{ id: string; username: string }>;
}

export interface GuessAttempt {
  guesserId: string;
  guesserName: string;
  targetId: string;
  targetName: string;
  guess: string;
  correct: boolean;
  timestamp: number;
}

export interface GameFinishedData {
  winnerId: string;
  winReason: 'last_standing' | 'guessed_all';
  players: Array<{
    id: string;
    username: string;
    animal: string;
    isEliminated: boolean;
  }>;
}

export interface DrawStroke {
  playerId: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  lineWidth: number;
}
