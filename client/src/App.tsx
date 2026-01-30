import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { GameProvider } from './contexts/GameContext';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Matchmaking from './pages/Matchmaking';
import Game from './pages/Game';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <GameProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/lobby/:code" element={<Lobby />} />
                <Route path="/matchmaking" element={<Matchmaking />} />
                <Route path="/game/:code" element={<Game />} />
              </Route>
            </Routes>
          </GameProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
