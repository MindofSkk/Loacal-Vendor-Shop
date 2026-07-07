import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(form);
      navigate(user.role === 'customer' ? '/' : `/${user.role}`);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md">
      <form className="panel space-y-4" onSubmit={handleSubmit}>
        <div>
          <p className="label">Welcome back</p>
          <h1 className="text-2xl font-black">Login</h1>
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <input
          className="field"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <input
          className="field"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        <button className="btn-primary w-full" type="submit" disabled={loading}>
          <LogIn className="h-4 w-4" />
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className="text-sm text-stone-600">
          New here?{' '}
          <Link to="/register" className="font-bold text-market-leaf">
            Create an account
          </Link>
        </p>
      </form>
    </section>
  );
}
