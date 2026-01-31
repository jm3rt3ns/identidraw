import { store } from '../store';
import { GamePlayer, GameState, GuessAttempt } from './types';
import { getRandomAnimals } from './animals';
import { Player } from '../lobby/types';

const GAME_TTL = 3600; // 1 hour

function key(code: string): string {
  return `game:${code}`;
}

export class GameManager {
  // In-memory stroke storage (transient, per-process)
  private strokes = new Map<string, any[]>();

  /** Create a new game from lobby players. Assigns animals in a circular reveal chain. */
  async create(lobbyCode: string, players: Player[]): Promise<GameState> {
    const animals = getRandomAnimals(players.length);
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // Circular chain: player i knows player (i+1)'s animal
    const gamePlayers: GamePlayer[] = shuffled.map((p, i) => ({
      id: p.id,
      username: p.username,
      socketId: p.socketId,
      animal: animals[i],
      knownPlayerId: shuffled[(i + 1) % shuffled.length].id,
      guessedBy: null,
      correctGuesses: [],
      isEliminated: false,
    }));

    const state: GameState = {
      lobbyCode,
      players: gamePlayers,
      status: 'countdown',
      winner: null,
      winReason: null,
      startedAt: Date.now(),
    };

    await store.setex(key(lobbyCode), GAME_TTL, JSON.stringify(state));
    this.strokes.set(lobbyCode, []);
    return state;
  }

  async get(code: string): Promise<GameState | null> {
    const data = await store.get(key(code));
    return data ? JSON.parse(data) : null;
  }

  async update(state: GameState): Promise<void> {
    await store.setex(key(state.lobbyCode), GAME_TTL, JSON.stringify(state));
  }

  async setPlaying(code: string): Promise<GameState | null> {
    const state = await this.get(code);
    if (!state) return null;
    state.status = 'playing';
    await this.update(state);
    return state;
  }

  addStroke(code: string, stroke: any): void {
    const strokes = this.strokes.get(code) || [];
    strokes.push(stroke);
    this.strokes.set(code, strokes);
  }

  getStrokes(code: string): any[] {
    return this.strokes.get(code) || [];
  }

  /** Process a guess. Returns null if the guess is invalid. */
  async processGuess(
    code: string,
    guesserId: string,
    targetId: string,
    guess: string
  ): Promise<{ state: GameState; attempt: GuessAttempt } | null> {
    const state = await this.get(code);
    if (!state || state.status !== 'playing') return null;

    const guesser = state.players.find((p) => p.id === guesserId);
    const target = state.players.find((p) => p.id === targetId);
    if (!guesser || !target) return null;

    // Can't guess yourself, the player you already know, or an eliminated player
    if (guesserId === targetId) return null;
    if (guesser.knownPlayerId === targetId) return null;
    if (target.isEliminated) return null;

    const correct =
      guess.toLowerCase().trim() === target.animal.toLowerCase().trim();

    const attempt: GuessAttempt = {
      guesserId,
      guesserName: guesser.username,
      targetId,
      targetName: target.username,
      guess,
      correct,
      timestamp: Date.now(),
    };

    if (correct) {
      target.isEliminated = true;
      target.guessedBy = guesserId;
      if (!guesser.correctGuesses.includes(targetId)) {
        guesser.correctGuesses.push(targetId);
      }
      this.checkWinConditions(state);
    }

    await this.update(state);
    return { state, attempt };
  }

  private checkWinConditions(state: GameState): void {
    const active = state.players.filter((p) => !p.isEliminated);

    // Last player standing wins
    if (active.length === 1) {
      state.status = 'finished';
      state.winner = active[0].id;
      state.winReason = 'last_standing';
      return;
    }

    // A player who guessed every guessable opponent wins
    for (const player of state.players) {
      const guessable = state.players.filter(
        (p) => p.id !== player.id && p.id !== player.knownPlayerId
      );
      const allGuessed = guessable.every((p) =>
        player.correctGuesses.includes(p.id)
      );
      if (allGuessed && guessable.length > 0) {
        state.status = 'finished';
        state.winner = player.id;
        state.winReason = 'guessed_all';
        return;
      }
    }
  }

  async cleanup(code: string): Promise<void> {
    await store.del(key(code));
    this.strokes.delete(code);
  }
}

export const gameManager = new GameManager();
