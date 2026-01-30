import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import LobbyChat from '../components/LobbyChat';
import PlayerList from '../components/PlayerList';
import type { Lobby as LobbyType } from '../types';

export default function Lobby() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { game, resetGame } = useGame();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState<LobbyType | null>(null);
  const [error, setError] = useState('');

  // Join the lobby room on mount (in case navigated directly)
  useEffect(() => {
    if (!socket || !code) return;

    socket.emit('lobby:join', { code }, (res: any) => {
      if (res.success) {
        setLobby(res.lobby);
      } else {
        setError(res.error || 'Could not join lobby');
      }
    });

    socket.on('lobby:updated', (updated: LobbyType) => setLobby(updated));

    return () => {
      socket.off('lobby:updated');
    };
  }, [socket, code]);

  // Navigate to game when countdown begins
  useEffect(() => {
    if (game.phase === 'countdown' && code) {
      navigate(`/game/${code}`);
    }
  }, [game.phase, code, navigate]);

  // Handle returning from a finished game
  useEffect(() => {
    if (game.returnTo === 'lobby') {
      resetGame();
    }
  }, [game.returnTo, resetGame]);

  const handleStartGame = () => {
    if (!socket || !code) return;
    socket.emit('lobby:startGame', { code }, (res: any) => {
      if (!res.success) setError(res.error || 'Failed to start');
    });
  };

  const handleLeave = () => {
    if (socket && code) {
      socket.emit('lobby:leave', { code });
    }
    navigate('/');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="card text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Joining lobby...</p>
      </div>
    );
  }

  const isHost = user?.dbId === lobby.hostId;
  const canStart = isHost && lobby.players.length >= 3;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Game Lobby</h1>
          <p className="text-slate-400 text-sm">
            Share this code with friends:
          </p>
          <p className="text-3xl font-mono font-bold text-brand-500 tracking-widest">
            {lobby.code}
          </p>
        </div>
        <button onClick={handleLeave} className="btn-secondary">
          Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        {/* Player list */}
        <div className="card">
          <PlayerList
            players={lobby.players}
            hostId={lobby.hostId}
          />
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className="btn-primary w-full mt-4"
            >
              {lobby.players.length < 3
                ? `Need ${3 - lobby.players.length} more player(s)`
                : 'Start Game'}
            </button>
          )}
          {!isHost && (
            <p className="text-slate-400 text-sm mt-4 text-center">
              Waiting for host to start...
            </p>
          )}
        </div>

        {/* Chat */}
        <div className="md:col-span-2 card flex flex-col">
          <LobbyChat lobbyCode={lobby.code} />
        </div>
      </div>
    </div>
  );
}
