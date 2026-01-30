import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Auth from '../pages/Auth';
import { AuthProvider } from '../contexts/AuthContext';

const mockSignIn = vi.mocked(signInWithEmailAndPassword);

function renderAuth() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Auth />
      </AuthProvider>
    </BrowserRouter>
  );
}

/** Find the form's submit button (not the tab button) */
function getSubmitButton(name: RegExp) {
  const buttons = screen.getAllByRole('button', { name });
  // The submit button has type="submit"
  const submit = buttons.find(
    (b) => b.getAttribute('type') === 'submit'
  );
  return submit || buttons[buttons.length - 1];
}

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Given a visitor on the auth page', () => {
    it('should display the sign-in form by default', () => {
      renderAuth();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should switch to registration form when Register tab is clicked', async () => {
      renderAuth();
      const user = userEvent.setup();

      await user.click(screen.getByText('Register'));

      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });
  });

  describe('Given invalid login credentials', () => {
    it('should show validation errors for empty fields', async () => {
      renderAuth();
      const user = userEvent.setup();

      await user.click(getSubmitButton(/sign in/i));

      await waitFor(() => {
        expect(screen.getAllByText('Required').length).toBeGreaterThan(0);
      });
    });

    it('should show validation error for invalid email format', async () => {
      renderAuth();
      const user = userEvent.setup();

      await user.type(screen.getByLabelText('Email'), 'not-an-email');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(getSubmitButton(/sign in/i));

      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });
    });
  });

  describe('Given valid login credentials', () => {
    it('should call signIn with the provided email and password', async () => {
      mockSignIn.mockResolvedValue({} as any);
      renderAuth();
      const user = userEvent.setup();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(getSubmitButton(/sign in/i));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com',
          'password123'
        );
      });
    });
  });

  describe('Given registration form with mismatched passwords', () => {
    it('should show password mismatch error', async () => {
      renderAuth();
      const user = userEvent.setup();

      await user.click(screen.getByText('Register'));
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.type(screen.getByLabelText('Confirm Password'), 'different');
      await user.click(getSubmitButton(/create account/i));

      await waitFor(() => {
        expect(screen.getByText('Passwords must match')).toBeInTheDocument();
      });
    });
  });
});
