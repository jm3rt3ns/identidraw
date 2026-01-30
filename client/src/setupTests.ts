import '@testing-library/jest-dom';

// Mock the underlying Firebase packages to prevent real initialization
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn((_auth: any, cb: any) => {
    // Default: no user signed in
    cb(null);
    return vi.fn(); // unsubscribe
  }),
}));

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  };
  return {
    io: vi.fn(() => mockSocket),
  };
});
