import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react';
import { useSocket } from './SocketContext';
import type {
  GameInitData,
  GuessAttempt,
  GameFinishedData,
  DrawStroke,
} from '../types';

// --- State ---

interface GameState {
  phase: 'idle' | 'countdown' | 'playing' | 'finished';
  countdownSeconds: number;
  yourAnimal: string | null;
  knownPlayerAnimal: { playerId: string; username: string; animal: string } | null;
  players: Array<{ id: string; username: string }>;
  eliminatedPlayers: Set<string>;
  guesses: GuessAttempt[];
  strokes: Record<string, DrawStroke[]>;
  result: GameFinishedData | null;
  lobbyCode: string | null;
  returnTo: 'lobby' | 'home' | null;
}

const initialState: GameState = {
  phase: 'idle',
  countdownSeconds: 0,
  yourAnimal: null,
  knownPlayerAnimal: null,
  players: [],
  eliminatedPlayers: new Set(),
  guesses: [],
  strokes: {},
  result: null,
  lobbyCode: null,
  returnTo: null,
};

// --- Actions ---

type Action =
  | { type: 'INIT'; payload: GameInitData & { lobbyCode: string } }
  | { type: 'COUNTDOWN'; seconds: number }
  | { type: 'STARTED' }
  | { type: 'DRAW'; stroke: DrawStroke }
  | { type: 'CLEAR_CANVAS'; playerId: string }
  | { type: 'GUESS'; attempt: GuessAttempt }
  | { type: 'ELIMINATED'; playerId: string }
  | { type: 'FINISHED'; data: GameFinishedData }
  | { type: 'RETURN'; to: 'lobby' | 'home' }
  | { type: 'RESET' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'INIT':
      return {
        ...initialState,
        phase: 'countdown',
        yourAnimal: action.payload.yourAnimal,
        knownPlayerAnimal: action.payload.knownPlayerAnimal,
        players: action.payload.players,
        lobbyCode: action.payload.lobbyCode,
      };
    case 'COUNTDOWN':
      return { ...state, countdownSeconds: action.seconds };
    case 'STARTED':
      return { ...state, phase: 'playing' };
    case 'DRAW': {
      const pid = action.stroke.playerId;
      return {
        ...state,
        strokes: {
          ...state.strokes,
          [pid]: [...(state.strokes[pid] || []), action.stroke],
        },
      };
    }
    case 'CLEAR_CANVAS': {
      const { [action.playerId]: _, ...rest } = state.strokes;
      return { ...state, strokes: rest };
    }
    case 'GUESS':
      return { ...state, guesses: [...state.guesses, action.attempt] };
    case 'ELIMINATED': {
      const next = new Set(state.eliminatedPlayers);
      next.add(action.playerId);
      return { ...state, eliminatedPlayers: next };
    }
    case 'FINISHED':
      return { ...state, phase: 'finished', result: action.data };
    case 'RETURN':
      return { ...state, returnTo: action.to };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// --- Context ---

interface GameContextValue {
  game: GameState;
  dispatch: React.Dispatch<Action>;
  sendDraw: (stroke: Omit<DrawStroke, 'playerId'>) => void;
  clearCanvas: () => void;
  sendGuess: (
    targetId: string,
    guess: string
  ) => Promise<{ success: boolean; correct?: boolean }>;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [game, dispatch] = useReducer(reducer, initialState);

  // Wire up socket events
  useEffect(() => {
    if (!socket) return;

    const onInit = (data: GameInitData) => {
      const code = (socket as any).data?.lobbyCode || '';
      dispatch({ type: 'INIT', payload: { ...data, lobbyCode: code } });
    };

    const onCountdown = ({ seconds }: { seconds: number }) => {
      dispatch({ type: 'COUNTDOWN', seconds });
      // Tick down locally
      let remaining = seconds;
      const interval = setInterval(() => {
        remaining--;
        dispatch({ type: 'COUNTDOWN', seconds: remaining });
        if (remaining <= 0) clearInterval(interval);
      }, 1000);
    };

    socket.on('game:init', onInit);
    socket.on('game:countdown', onCountdown);
    socket.on('game:started', () => dispatch({ type: 'STARTED' }));
    socket.on('game:draw', (stroke: DrawStroke) =>
      dispatch({ type: 'DRAW', stroke })
    );
    socket.on('game:clearCanvas', ({ playerId }: { playerId: string }) =>
      dispatch({ type: 'CLEAR_CANVAS', playerId })
    );
    socket.on('game:guessResult', (attempt: GuessAttempt) =>
      dispatch({ type: 'GUESS', attempt })
    );
    socket.on('game:playerEliminated', ({ playerId }: { playerId: string }) =>
      dispatch({ type: 'ELIMINATED', playerId })
    );
    socket.on('game:finished', (data: GameFinishedData) =>
      dispatch({ type: 'FINISHED', data })
    );
    socket.on('game:returnToLobby', () =>
      dispatch({ type: 'RETURN', to: 'lobby' })
    );
    socket.on('game:returnToHome', () =>
      dispatch({ type: 'RETURN', to: 'home' })
    );

    return () => {
      socket.off('game:init', onInit);
      socket.off('game:countdown', onCountdown);
      socket.off('game:started');
      socket.off('game:draw');
      socket.off('game:clearCanvas');
      socket.off('game:guessResult');
      socket.off('game:playerEliminated');
      socket.off('game:finished');
      socket.off('game:returnToLobby');
      socket.off('game:returnToHome');
    };
  }, [socket]);

  const sendDraw = useCallback(
    (stroke: Omit<DrawStroke, 'playerId'>) => {
      if (!socket || !game.lobbyCode) return;
      socket.emit('game:draw', { code: game.lobbyCode, stroke });
    },
    [socket, game.lobbyCode]
  );

  const clearCanvas = useCallback(() => {
    if (!socket || !game.lobbyCode) return;
    socket.emit('game:clearCanvas', { code: game.lobbyCode });
  }, [socket, game.lobbyCode]);

  const sendGuess = useCallback(
    (targetId: string, guess: string) => {
      return new Promise<{ success: boolean; correct?: boolean }>((resolve) => {
        if (!socket || !game.lobbyCode) {
          resolve({ success: false });
          return;
        }
        socket.emit(
          'game:guess',
          { code: game.lobbyCode, targetId, guess },
          (res: { success: boolean; correct?: boolean }) => resolve(res)
        );
      });
    },
    [socket, game.lobbyCode]
  );

  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <GameContext.Provider
      value={{ game, dispatch, sendDraw, clearCanvas, sendGuess, resetGame }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
