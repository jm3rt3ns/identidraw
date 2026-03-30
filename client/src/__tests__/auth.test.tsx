import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Auth from '../pages/Auth';
import { AuthProvider } from '../contexts/AuthContext';

function renderAuth() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Auth />
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Given a visitor on the auth page', () => {
    it('shows a username field and no email or password fields', () => {
      renderAuth();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });

    it('shows a Play button', () => {
      renderAuth();
      expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument();
    });

    it('has no Sign In or Register tabs', () => {
      renderAuth();
      expect(screen.queryByRole('button', { name: /^sign in$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^register$/i })).not.toBeInTheDocument();
    });
  });

  describe('Given an empty submission', () => {
    it('shows a required validation error', async () => {
      renderAuth();
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /^play$/i }));
      await waitFor(() => {
        expect(screen.getByText('Required')).toBeInTheDocument();
      });
    });
  });

  describe('Given a username that is too short', () => {
    it('shows a min-length validation error', async () => {
      renderAuth();
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/username/i), 'ab');
      await user.click(screen.getByRole('button', { name: /^play$/i }));
      await waitFor(() => {
        expect(screen.getByText(/min 3 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Given a username with invalid characters', () => {
    it('shows an invalid characters error', async () => {
      renderAuth();
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/username/i), 'bad name!');
      await user.click(screen.getByRole('button', { name: /^play$/i }));
      await waitFor(() => {
        expect(screen.getByText(/only letters, numbers, underscores/i)).toBeInTheDocument();
      });
    });
  });

  describe('Given a valid username', () => {
    it('calls POST /api/auth/guest with the username', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'fake-jwt', user: { id: 'u1', username: 'Alice' } }),
      });

      renderAuth();
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/username/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /^play$/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/guest',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ username: 'Alice' }),
          })
        );
      });
    });

    it('shows a server error message when the request fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Username already taken' }),
      });

      renderAuth();
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/username/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /^play$/i }));

      await waitFor(() => {
        expect(screen.getByText('Username already taken')).toBeInTheDocument();
      });
    });
  });
});
