import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import Canvas from '../components/Canvas';
import MiniCanvas from '../components/MiniCanvas';
import GuessingChat from '../components/GuessingChat';
import Countdown from '../components/Countdown';
import GameOver from '../components/GameOver';

export default function Game() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { game, resetGame } = useGame();
  const navigate = useNavigate();

  // Handle navigation when game tells us to return
  useEffect(() => {
    if (game.returnTo === 'lobby' && code) {
      resetGame();
      navigate(`/lobby/${code}`);
    } else if (game.returnTo === 'home') {
      resetGame();
      navigate('/');
    }
  }, [game.returnTo, code, navigate, resetGame]);

  // If no game data, show loading
  if (!game.yourAnimal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Waiting for game data...</p>
      </div>
    );
  }

  const otherPlayers = game.players.filter((p) => p.id !== user?.dbId);

  return (
    <div className="h-screen flex flex-col p-2 gap-2 overflow-hidden">
      {/* Countdown overlay */}
      {game.phase === 'countdown' && (
        <Countdown
          seconds={game.countdownSeconds}
          yourAnimal={game.yourAnimal}
          knownPlayer={game.knownPlayerAnimal}
        />
      )}

      {/* Game over overlay */}
      {game.phase === 'finished' && game.result && (
        <GameOver
          result={game.result}
          currentUserId={user?.dbId || ''}
        />
      )}

      {/* Top section: canvas + mini canvases */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Left: main canvas + info */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="bg-slate-800 rounded-lg p-2 text-sm flex justify-between items-center">
            <span>
              Your animal: <strong className="text-brand-500">{game.yourAnimal}</strong>
            </span>
            {game.knownPlayerAnimal && (
              <span className="text-slate-400">
                {game.knownPlayerAnimal.username}&apos;s secret creature is{' '}
                <strong className="text-amber-400">
                  {game.knownPlayerAnimal.animal}
                </strong>
              </span>
            )}
          </div>
          <Canvas disabled={game.phase !== 'playing'} />
        </div>

        {/* Right: other players' canvases */}
        <div className="w-48 lg:w-64 flex flex-col gap-2 overflow-y-auto">
          {otherPlayers.map((p) => (
            <MiniCanvas
              key={p.id}
              playerId={p.id}
              username={p.username}
              eliminated={game.eliminatedPlayers.has(p.id)}
              strokes={game.strokes[p.id] || []}
            />
          ))}
        </div>
      </div>

      {/* Bottom: guessing chat */}
      <div className="h-48 lg:h-56">
        <GuessingChat
          players={otherPlayers}
          currentUserId={user?.dbId || ''}
          knownPlayerId={game.knownPlayerAnimal?.playerId || ''}
          eliminatedPlayers={game.eliminatedPlayers}
          guesses={game.guesses}
          disabled={game.phase !== 'playing'}
        />
      </div>
    </div>
  );
}
