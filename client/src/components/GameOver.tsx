import type { GameFinishedData } from '../types';

interface Props {
  result: GameFinishedData;
  currentUserId: string;
}

export default function GameOver({ result, currentUserId }: Props) {
  const isWinner = result.winnerId === currentUserId;
  const winner = result.players.find((p) => p.id === result.winnerId);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="card max-w-lg w-full text-center">
        <h2
          className={`text-4xl font-bold mb-2 ${
            isWinner ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isWinner ? 'Victory!' : 'Defeat'}
        </h2>

        <p className="text-xl text-slate-300 mb-4">
          {isWinner
            ? result.winReason === 'last_standing'
              ? 'You were the last player standing!'
              : 'You guessed all other players\' animals!'
            : `${winner?.username || 'Someone'} won the game!`}
        </p>

        {/* Final standings */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-slate-400 mb-2">
            Final Standings
          </h3>
          <ul className="space-y-1 text-sm">
            {result.players.map((p) => (
              <li
                key={p.id}
                className={`flex justify-between px-3 py-1 rounded ${
                  p.id === result.winnerId
                    ? 'bg-green-900/30 text-green-300'
                    : p.isEliminated
                    ? 'text-slate-500'
                    : 'text-slate-300'
                }`}
              >
                <span>
                  {p.username}
                  {p.id === result.winnerId && ' (Winner)'}
                </span>
                <span className="text-slate-400">{p.animal}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-slate-400 text-sm">
          Returning shortly...
        </p>
      </div>
    </div>
  );
}
