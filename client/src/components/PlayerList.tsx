import type { Player } from '../types';

interface Props {
  players: Player[];
  hostId: string;
}

export default function PlayerList({ players, hostId }: Props) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-400 mb-2">
        Players ({players.length})
      </h3>
      <ul className="space-y-1">
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50"
          >
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="font-medium">{p.username}</span>
            {p.id === hostId && (
              <span className="text-xs bg-brand-600 px-2 py-0.5 rounded-full ml-auto">
                Host
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
