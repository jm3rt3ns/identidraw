interface Props {
  seconds: number;
  yourAnimal: string;
  knownPlayer: { playerId: string; username: string; animal: string } | null;
}

export default function Countdown({ seconds, yourAnimal, knownPlayer }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-brand-500 mb-6 animate-pulse">
          {seconds > 0 ? seconds : 'Go!'}
        </div>

        <div className="space-y-3 bg-slate-800/80 rounded-xl p-6 max-w-md">
          <p className="text-lg text-slate-300">
            Your secret animal is:{' '}
            <span className="text-2xl font-bold text-brand-500">
              {yourAnimal}
            </span>
          </p>

          {knownPlayer && (
            <p className="text-lg text-slate-300">
              {knownPlayer.username}&apos;s secret creature is{' '}
              <span className="text-2xl font-bold text-amber-400">
                {knownPlayer.animal}
              </span>
            </p>
          )}

          <p className="text-sm text-slate-400 mt-2">
            Draw your animal. Guess others. Be the last one standing!
          </p>
        </div>
      </div>
    </div>
  );
}
