import { LocateFixed, Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiError } from '../../api/client';
import { orderApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const minutesFromTime = (time) => {
  const [hours, minutes] = String(time || '00:00')
    .split(':')
    .map(Number);
  return hours * 60 + minutes;
};

const isShopOpenNow = (shop) => {
  if (shop?.temporaryClosure?.enabled) return false;
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayHours = shop?.workingHours?.find((entry) => entry.day === dayName);
  if (!todayHours) return true;
  if (todayHours.closed) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = minutesFromTime(todayHours.openTime);
  const closeMinutes = minutesFromTime(todayHours.closeTime);
  return openMinutes <= closeMinutes
    ? currentMinutes >= openMinutes && currentMinutes <= closeMinutes
    : currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
};

const getDistanceKm = (from, to) => {
  const fromLat = Number(from?.latitude);
  const fromLng = Number(from?.longitude);
  const toLat = Number(to?.latitude);
  const toLng = Number(to?.longitude);
  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) return null;
  const earthRadiusKm = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};

export default function CartV2() {
  const { user } = useAuth();
  const { items, subtotal, updateQuantity, removeItem, clearCart, cartError } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState({
    fullAddress: [user?.address?.line1, user?.address?.area, user?.address?.city, user?.address?.pincode]
      .filter(Boolean)
      .join(', '),
    landmark: user?.address?.landmark || '',
    phone: user?.phone || '',
    latitude: '',
    longitude: ''
  });
  const [locationStatus, setLocationStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const shop = items[0]?.shop;
  const minimumOrder = Number(shop?.deliverySettings?.minimumOrder || 0);
  const radiusKm = Number(shop?.deliverySettings?.radiusKm || shop?.deliveryRadiusKm || 0);
  const distanceKm = getDistanceKm(address, shop?.location);
  const outsideRadius = distanceKm != null && radiusKm > 0 && distanceKm > radiusKm;
  const shopClosed = shop && !isShopOpenNow(shop);
  const belowMinimum = subtotal < minimumOrder;
  const checkoutBlocked = Boolean(shop?.temporaryClosure?.enabled || shopClosed || outsideRadius || belowMinimum);

  const captureLocation = () => {
    setLocationStatus('');

    if (!navigator.geolocation) {
      setLocationStatus('Browser location is not supported. Manual address will be used.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddress({
          ...address,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationStatus('Location captured.');
      },
      () => {
        setLocationStatus('Location permission denied. Manual address will be used.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await orderApi.create({
        items: items.map((item) => ({ product: item._id, quantity: item.quantity })),
        deliveryAddress: {
          fullAddress: address.fullAddress,
          landmark: address.landmark,
          phone: address.phone,
          latitude: address.latitude === '' ? undefined : Number(address.latitude),
          longitude: address.longitude === '' ? undefined : Number(address.longitude)
        }
      });
      const shopName = items[0]?.shop?.name;
      clearCart();
      navigate('/order-confirmation', { state: { order: data, shopName } });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="space-y-3">
        <h1 className="text-2xl font-black">Cart</h1>
        {items.map((item) => (
          <article key={item._id} className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-violet-50 text-xs font-bold text-violet-700">
              {item.images?.[0]?.url ? (
                <img className="h-full w-full object-cover" src={item.images[0].url} alt={item.name} />
              ) : (
                'Image'
              )}
            </div>
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
        <p className="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-700">Location helps the seller deliver faster.</p>
        {cartError && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{cartError}</p>}
        {shop?.temporaryClosure?.enabled && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">This shop is temporarily closed.</p>}
        {shopClosed && !shop?.temporaryClosure?.enabled && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">This shop is closed right now.</p>}
        {belowMinimum && items.length > 0 && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">Minimum order is ₹{minimumOrder}.</p>}
        {outsideRadius && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">This shop does not deliver to your location.</p>}
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {locationStatus && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{locationStatus}</p>}
        <button className="btn-secondary w-full" type="button" onClick={captureLocation}>
          <LocateFixed className="h-4 w-4" />
          Use current location
        </button>
        {address.latitude && address.longitude && (
          <p className="text-xs text-stone-500">
            Captured: {Number(address.latitude).toFixed(5)}, {Number(address.longitude).toFixed(5)}
            {distanceKm != null ? ` | Shop distance: ${distanceKm} km` : ''}
          </p>
        )}
        <textarea
          className="field min-h-28"
          placeholder="Full address"
          value={address.fullAddress}
          onChange={(event) => setAddress({ ...address, fullAddress: event.target.value })}
          required
        />
        <input
          className="field"
          placeholder="Landmark"
          value={address.landmark}
          onChange={(event) => setAddress({ ...address, landmark: event.target.value })}
        />
        <input
          className="field"
          placeholder="Phone number"
          value={address.phone}
          onChange={(event) => setAddress({ ...address, phone: event.target.value })}
          required
        />
        <div className="flex items-center justify-between border-t border-stone-200 pt-3">
          <span className="font-bold">Subtotal</span>
          <span className="text-2xl font-black">₹{subtotal}</span>
        </div>
        <button className="btn-primary w-full" type="submit" disabled={items.length === 0 || loading || checkoutBlocked}>
          {loading ? 'Placing...' : 'Place order'}
        </button>
      </form>
    </section>
  );
}
