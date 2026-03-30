import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { guestLogin } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

const schema = Yup.object({
  username: Yup.string()
    .min(3, 'Min 3 characters')
    .max(20, 'Max 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores')
    .required('Required'),
});

export default function Auth() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  if (user?.username) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values: { username: string }) => {
    setError('');
    try {
      const { user: stored } = await guestLogin(values.username);
      setUser({ uid: stored.id, username: stored.username });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">IdentiDraw</h1>
        <p className="text-slate-400 text-center mb-6">
          Draw, guess, and survive!
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <Formik
          initialValues={{ username: '' }}
          validationSchema={schema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="username" className="label">Username</label>
                <Field
                  id="username"
                  name="username"
                  className="input"
                  placeholder="CoolPlayer42"
                />
                <ErrorMessage name="username" component="p" className="error-text" />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? 'Joining...' : 'Play'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
