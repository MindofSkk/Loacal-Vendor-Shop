import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiError } from '../../api/client';
import { orderApi } from '../../api/services';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Cart() {
  const { user } = useAuth();
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState({
    line1: user?.address?.line1 || '',
    area: user?.address?.area || '',
    city: user?.address?.city || '',
    pincode: user?.address?.pincode || '',
    phone: user?.phone || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const placeOrder = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await orderApi.create({
        items: items.map((item) => ({ product: item._id, quantity: item.quantity })),
        deliveryAddress: address
      });
      clearCart();
      navigate('/orders');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        <h1 className="text-2xl font-black">Cart</h1>
        {items.map((item) => (
          <article key={item._id} className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black">{item.name}</p>
              <p className="text-sm text-stone-600">₹{item.price} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary px-3" type="button" onClick={() => updateQuantity(item._id, item.quantity - 1)}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold">{item.quantity}</span>
              <button className="btn-secondary px-3" type="button" onClick={() => updateQuantity(item._id, item.quantity + 1)}>
                <Plus className="h-4 w-4" />
              </button>
              <button className="btn-danger px-3" type="button" onClick={() => removeItem(item._id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
        {items.length === 0 && <p className="panel text-stone-600">Your cart is empty.</p>}
      </div>
      <form className="panel h-fit space-y-3" onSubmit={placeOrder}>
        <h2 className="text-xl font-black">Delivery address</h2>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {['line1', 'area', 'city', 'pincode', 'phone'].map((field) => (
          <input
            key={field}
            className="field"
            placeholder={field === 'line1' ? 'Address line' : field}
            value={address[field]}
            onChange={(event) => setAddress({ ...address, [field]: event.target.value })}
            required={field !== 'phone'}
          />
        ))}
        <div className="flex items-center justify-between border-t border-stone-200 pt-3">
          <span className="font-bold">Subtotal</span>
          <span className="text-2xl font-black">₹{subtotal}</span>
        </div>
        <button className="btn-primary w-full" type="submit" disabled={items.length === 0 || loading}>
          {loading ? 'Placing...' : 'Place order'}
        </button>
      </form>
    </section>
  );
}
