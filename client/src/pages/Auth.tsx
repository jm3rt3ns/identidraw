import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { signUp, signIn, getIdToken } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(8, 'Min 8 characters').required('Required'),
});

const registerSchema = Yup.object({
  username: Yup.string()
    .min(3, 'Min 3 characters')
    .max(20, 'Max 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores')
    .required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(8, 'Min 8 characters').required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Required'),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('step') !== 'register');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUserProfile } = useAuth();

  const handleLogin = async (values: { email: string; password: string }) => {
    setError('');
    try {
      await signIn(values.email, values.password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleRegister = async (values: {
    username: string;
    email: string;
    password: string;
  }) => {
    setError('');
    try {
      await signUp(values.email, values.password);
      const token = await getIdToken();
      if (!token) throw new Error('Failed to get auth token');

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, username: values.username }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      const { user } = await res.json();
      setUserProfile({ username: user.username, dbId: user.id });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">IdentiDraw</h1>
        <p className="text-slate-400 text-center mb-6">
          Draw, guess, and survive!
        </p>

        {/* Tab toggle */}
        <div className="flex mb-6 bg-slate-700 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              isLogin ? 'bg-brand-600 text-white' : 'text-slate-400'
            }`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              !isLogin ? 'bg-brand-600 text-white' : 'text-slate-400'
            }`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {isLogin ? (
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleLogin}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="label">Email</label>
                  <Field id="login-email" name="email" type="email" className="input" placeholder="you@example.com" />
                  <ErrorMessage name="email" component="p" className="error-text" />
                </div>
                <div>
                  <label htmlFor="login-password" className="label">Password</label>
                  <Field id="login-password" name="password" type="password" className="input" placeholder="********" />
                  <ErrorMessage name="password" component="p" className="error-text" />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </Form>
            )}
          </Formik>
        ) : (
          <Formik
            initialValues={{ username: '', email: '', password: '', confirmPassword: '' }}
            validationSchema={registerSchema}
            onSubmit={handleRegister}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label htmlFor="reg-username" className="label">Username</label>
                  <Field id="reg-username" name="username" className="input" placeholder="CoolPlayer42" />
                  <ErrorMessage name="username" component="p" className="error-text" />
                </div>
                <div>
                  <label htmlFor="reg-email" className="label">Email</label>
                  <Field id="reg-email" name="email" type="email" className="input" placeholder="you@example.com" />
                  <ErrorMessage name="email" component="p" className="error-text" />
                </div>
                <div>
                  <label htmlFor="reg-password" className="label">Password</label>
                  <Field id="reg-password" name="password" type="password" className="input" placeholder="********" />
                  <ErrorMessage name="password" component="p" className="error-text" />
                </div>
                <div>
                  <label htmlFor="reg-confirm" className="label">Confirm Password</label>
                  <Field id="reg-confirm" name="confirmPassword" type="password" className="input" placeholder="********" />
                  <ErrorMessage name="confirmPassword" component="p" className="error-text" />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </button>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
}
