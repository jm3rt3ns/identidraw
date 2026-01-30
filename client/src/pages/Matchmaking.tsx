import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';

export default function Matchmaking() {
  const { socket } = useSocket();
  const { game } = useGame();
  const navigate = useNavigate();
  const [queueSize, setQueueSize] = useState(0);
  const [dots, setDots] = useState('');

  // Join the matchmaking queue
  useEffect(() => {
    if (!socket) return;

    socket.emit('matchmaking:join', (res: any) => {
      if (!res.success) {
        navigate('/');
      }
    });

    socket.on('matchmaking:queueSize', ({ size }: { size: number }) => {
      setQueueSize(size);
    });

    socket.on('matchmaking:matched', ({ lobbyCode }: { lobbyCode: string }) => {
      navigate(`/game/${lobbyCode}`);
    });

    return () => {
      socket.off('matchmaking:queueSize');
      socket.off('matchmaking:matched');
      socket.emit('matchmaking:leave');
    };
  }, [socket, navigate]);

  // Navigate to game when init is received
  useEffect(() => {
    if (game.phase === 'countdown' && game.lobbyCode) {
      navigate(`/game/${game.lobbyCode}`);
    }
  }, [game.phase, game.lobbyCode, navigate]);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="card text-center max-w-md w-full">
        <div className="mb-6">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Looking for a match{dots}</h2>
          <p className="text-slate-400 mt-2">
            Players in queue: {queueSize} / 5
          </p>
        </div>

        <div className="w-full bg-slate-700 rounded-full h-2 mb-6">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(queueSize / 5) * 100}%` }}
          />
        </div>

        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
