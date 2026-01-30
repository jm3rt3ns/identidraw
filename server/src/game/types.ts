export interface GamePlayer {
  id: string;
  username: string;
  socketId: string;
  animal: string;
  // The player whose animal this player already knows
  knownPlayerId: string;
  guessedBy: string | null;
  correctGuesses: string[];
  isEliminated: boolean;
}

export interface GameState {
  lobbyCode: string;
  players: GamePlayer[];
  status: 'countdown' | 'playing' | 'finished';
  winner: string | null;
  winReason: 'last_standing' | 'guessed_all' | null;
  startedAt: number;
}

export interface DrawStroke {
  playerId: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  lineWidth: number;
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
