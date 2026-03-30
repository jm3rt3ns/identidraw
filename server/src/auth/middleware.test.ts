import { describe, it, expect, vi } from 'vitest';
import { socketAuthMiddleware } from './middleware';
import { issueToken } from './jwt';

function makeSocket(token?: string) {
  return {
    handshake: { auth: { token } },
    data: {} as Record<string, unknown>,
  };
}

describe('socketAuthMiddleware', () => {
  it('calls next with an error when no token is provided', async () => {
    const socket = makeSocket();
    const next = vi.fn();
    await socketAuthMiddleware(socket as any, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toMatch(/authentication required/i);
  });

  it('calls next with an error for a plaintext invalid token', async () => {
    const socket = makeSocket('this-is-not-a-jwt');
    const next = vi.fn();
    await socketAuthMiddleware(socket as any, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('calls next with an error for a tampered token', async () => {
    const token = issueToken({ userId: 'u1', username: 'Alice' });
    const parts = token.split('.');
    parts[2] = parts[2].split('').reverse().join('');
    const tampered = parts.join('.');
    const socket = makeSocket(tampered);
    const next = vi.fn();
    await socketAuthMiddleware(socket as any, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('calls next with no arguments for a valid token', async () => {
    const token = issueToken({ userId: 'u42', username: 'Bob' });
    const socket = makeSocket(token);
    const next = vi.fn();
    await socketAuthMiddleware(socket as any, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('populates socket.data with userId and username from a valid token', async () => {
    const token = issueToken({ userId: 'u42', username: 'Bob' });
    const socket = makeSocket(token);
    const next = vi.fn();
    await socketAuthMiddleware(socket as any, next);
    expect(socket.data.userId).toBe('u42');
    expect(socket.data.username).toBe('Bob');
  });
});
