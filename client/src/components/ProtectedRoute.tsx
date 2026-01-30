import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  // Not authenticated at all
  if (!user) return <Navigate to="/auth" replace />;

  // Authenticated in Firebase but not registered in our DB
  if (!user.username) return <Navigate to="/auth?step=register" replace />;

  return <Outlet />;
}
