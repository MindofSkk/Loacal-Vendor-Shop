import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
    address: { line1: '', area: '', city: '', pincode: '' }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateAddress = (key, value) => setForm({ ...form, address: { ...form.address, [key]: value } });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await register(form);
      navigate(user.role === 'customer' ? '/' : '/seller');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl">
      <form className="panel space-y-4" onSubmit={handleSubmit}>
        <div>
          <p className="label">Create account</p>
          <h1 className="text-2xl font-black">Register</h1>
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="field" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="customer">Customer</option>
            <option value="seller">Seller</option>
          </select>
          <input className="field" placeholder="Address line" value={form.address.line1} onChange={(e) => updateAddress('line1', e.target.value)} />
          <input className="field" placeholder="Area" value={form.address.area} onChange={(e) => updateAddress('area', e.target.value)} />
          <input className="field" placeholder="City" value={form.address.city} onChange={(e) => updateAddress('city', e.target.value)} />
          <input className="field" placeholder="Pincode" value={form.address.pincode} onChange={(e) => updateAddress('pincode', e.target.value)} />
        </div>
        <button className="btn-primary w-full" type="submit" disabled={loading}>
          <UserPlus className="h-4 w-4" />
          {loading ? 'Creating...' : 'Register'}
        </button>
        <p className="text-sm text-stone-600">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-market-leaf">
            Login
          </Link>
        </p>
      </form>
    </section>
  );
}
