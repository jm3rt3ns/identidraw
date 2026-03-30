import { describe, it, expect } from 'vitest';
import { issueToken, verifyToken } from './jwt';

describe('issueToken', () => {
  it('returns a non-empty string', () => {
    const token = issueToken({ userId: 'u1', username: 'Alice' });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('produces a token with three dot-separated segments', () => {
    const token = issueToken({ userId: 'u1', username: 'Alice' });
    expect(token.split('.')).toHaveLength(3);
  });
});

describe('verifyToken', () => {
  it('returns userId and username from a freshly issued token', () => {
    const token = issueToken({ userId: 'u1', username: 'Alice' });
    const payload = verifyToken(token);
    expect(payload.userId).toBe('u1');
    expect(payload.username).toBe('Alice');
  });

  it('throws for an arbitrary invalid string', () => {
    expect(() => verifyToken('not-a-jwt')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => verifyToken('')).toThrow();
  });

  it('throws when the signature is tampered', () => {
    const token = issueToken({ userId: 'u1', username: 'Alice' });
    const parts = token.split('.');
    parts[2] = parts[2].split('').reverse().join('');
    expect(() => verifyToken(parts.join('.'))).toThrow();
  });

  it('throws when the payload is swapped in with a different signature', () => {
    const token = issueToken({ userId: 'u1', username: 'Alice' });
    const parts = token.split('.');
    const malicious = Buffer.from(
      JSON.stringify({ userId: 'admin', username: 'hacker', iat: Math.floor(Date.now() / 1000) })
    ).toString('base64url');
    parts[1] = malicious;
    expect(() => verifyToken(parts.join('.'))).toThrow();
  });
});
