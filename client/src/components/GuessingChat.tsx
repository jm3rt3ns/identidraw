import { useEffect, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import type { GuessAttempt } from '../types';

interface Props {
  players: Array<{ id: string; username: string }>;
  currentUserId: string;
  knownPlayerId: string;
  eliminatedPlayers: Set<string>;
  guesses: GuessAttempt[];
  disabled: boolean;
}

export default function GuessingChat({
  players,
  currentUserId,
  knownPlayerId,
  eliminatedPlayers,
  guesses,
  disabled,
}: Props) {
  const { sendGuess } = useGame();
  const [targetId, setTargetId] = useState('');
  const [guess, setGuess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Guessable players: not self, not the known player, not eliminated
  const guessable = players.filter(
    (p) =>
      p.id !== currentUserId &&
      p.id !== knownPlayerId &&
      !eliminatedPlayers.has(p.id)
  );

  // Auto-select first guessable player if none selected
  useEffect(() => {
    if (!targetId && guessable.length > 0) {
      setTargetId(guessable[0].id);
    }
  }, [guessable, targetId]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [guesses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !targetId || disabled) return;

    setSubmitting(true);
    await sendGuess(targetId, guess.trim());
    setGuess('');
    setSubmitting(false);
  };

  return (
    <div className="card h-full flex flex-col p-3">
      <h3 className="text-sm font-medium text-slate-400 mb-2">Guesses</h3>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-1 text-sm mb-2">
        {guesses.map((g, i) => (
          <div
            key={i}
            className={`px-2 py-1 rounded ${
              g.correct
                ? 'bg-green-900/40 text-green-300'
                : 'bg-slate-700/50 text-slate-300'
            }`}
          >
            <span className="font-medium">{g.guesserName}</span> guessed{' '}
            <span className="font-medium">{g.targetName}</span>:{' '}
            &quot;{g.guess}&quot;{' '}
            {g.correct ? (
              <span className="text-green-400 font-bold">- Correct!</span>
            ) : (
              <span className="text-slate-500">- Wrong</span>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Guess form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          disabled={disabled || guessable.length === 0}
          className="input w-auto min-w-[120px]"
        >
          {guessable.map((p) => (
            <option key={p.id} value={p.id}>
              {p.username}
            </option>
          ))}
          {guessable.length === 0 && (
            <option value="">No players to guess</option>
          )}
        </select>
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Enter animal guess..."
          disabled={disabled || guessable.length === 0}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={disabled || submitting || !guess.trim() || !targetId}
          className="btn-primary shrink-0"
        >
          Guess
        </button>
      </form>
    </div>
  );
}
