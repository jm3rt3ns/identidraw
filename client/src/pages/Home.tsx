import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const joinSchema = Yup.object({
  code: Yup.string()
    .matches(/^\d{6}$/, 'Must be a 6-digit code')
    .required('Required'),
});

export default function Home() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState('');

  const handleCreateLobby = () => {
    if (!socket) return;
    socket.emit('lobby:create', (res: any) => {
      if (res.success) {
        navigate(`/lobby/${res.lobby.code}`);
      } else {
        setError(res.error || 'Failed to create lobby');
      }
    });
  };

  const handleJoinLobby = (values: { code: string }) => {
    if (!socket) return;
    setError('');
    socket.emit('lobby:join', { code: values.code }, (res: any) => {
      if (res.success) {
        navigate(`/lobby/${res.lobby.code}`);
      } else {
        setError(res.error || 'Failed to join lobby');
      }
    });
  };

  const handlePlayNow = () => {
    navigate('/matchmaking');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="card w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">IdentiDraw</h1>
            <p className="text-slate-400 text-sm">
              Welcome, {user?.username}
            </p>
          </div>
          <button onClick={logout} className="btn-secondary text-sm">
            Sign Out
          </button>
        </div>

        {!connected && (
          <p className="text-yellow-400 text-sm mb-4">Connecting to server...</p>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleCreateLobby}
            disabled={!connected}
            className="btn-primary w-full text-lg py-3"
          >
            Create a Lobby
          </button>

          <button
            onClick={() => setShowJoin(!showJoin)}
            disabled={!connected}
            className="btn-secondary w-full text-lg py-3"
          >
            Join a Game
          </button>

          {showJoin && (
            <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
              <Formik
                initialValues={{ code: '' }}
                validationSchema={joinSchema}
                onSubmit={handleJoinLobby}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-2">
                    <Field
                      name="code"
                      className="input text-center text-xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <ErrorMessage name="code" component="p" className="error-text" />
                    <button
                      type="submit"
                      disabled={isSubmitting || !connected}
                      className="btn-primary w-full"
                    >
                      Join Lobby
                    </button>
                  </Form>
                )}
              </Formik>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-800 px-2 text-slate-400">or</span>
                </div>
              </div>

              <button
                onClick={handlePlayNow}
                disabled={!connected}
                className="btn-primary w-full bg-green-600 hover:bg-green-700"
              >
                Play Now (Matchmaking)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
