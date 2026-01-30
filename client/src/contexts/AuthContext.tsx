import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { type User } from 'firebase/auth';
import { onAuthChange, signOut, getIdToken } from '../services/firebase';

interface AuthUser {
  uid: string;
  email: string | null;
  username: string | null;
  dbId: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  setUserProfile: (profile: { username: string; dbId: string }) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (fbUser: User | null) => {
      if (fbUser) {
        // Try to fetch the profile from server
        const token = await fbUser.getIdToken();
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, username: '' }),
          });
          if (res.ok) {
            const { user: dbUser } = await res.json();
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              username: dbUser.username,
              dbId: dbUser.id,
            });
          } else {
            // User authenticated in Firebase but not registered in DB yet
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              username: null,
              dbId: null,
            });
          }
        } catch {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            username: null,
            dbId: null,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const setUserProfile = (profile: { username: string; dbId: string }) => {
    setUser((prev) =>
      prev ? { ...prev, username: profile.username, dbId: profile.dbId } : null
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout: signOut,
        getToken: getIdToken,
        setUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
