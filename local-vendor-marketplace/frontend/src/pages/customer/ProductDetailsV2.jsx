import { ArrowLeft, Package, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productApi } from '../../api/services';
import { useCart } from '../../context/CartContext';

const isOrderable = (product) => {
  if (product.status !== 'active') return false;
  if (product.shop?.temporaryClosure?.enabled) return false;
  if (!isShopOpenNow(product.shop)) return false;
  if (product.businessType === 'Grocery / Kirana Store') return product.stock > 0;
  if (product.businessType === 'Dairy and Bakery') return product.freshStockToday;
  return true;
};

const minutesFromTime = (time) => {
  const [hours, minutes] = String(time || '00:00')
    .split(':')
    .map(Number);
  return hours * 60 + minutes;
};

const isShopOpenNow = (shop) => {
  if (!shop?.workingHours?.length) return true;
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayHours = shop.workingHours.find((entry) => entry.day === dayName);
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

export default function ProductDetailsV2() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi
      .get(id)
      .then(({ data }) => setProduct(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="panel">Loading...</div>;
  if (!product) return <div className="panel">Product not found.</div>;

  const image = product.images?.[0]?.url;
  const orderable = isOrderable(product);
  const handleAdd = () => {
    const result = addItem(product);
    setError(result?.ok === false ? result.message : '');
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-white">
        {image ? <img src={image} alt={product.name} className="h-full w-full object-cover" /> : <Package className="h-20 w-20 text-stone-400" />}
      </div>
      <div className="panel space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-market-leaf">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <p className="label">{product.shop?.name}</p>
          <h1 className="mt-1 text-3xl font-black">{product.name}</h1>
          <p className="mt-3 text-stone-600">{product.description || 'Freshly listed by a nearby seller.'}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-stone-50 p-3">
            <p className="label">Price</p>
            <p className="text-2xl font-black">₹{product.price}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="label">Availability</p>
            <p className="font-bold">{product.shop?.temporaryClosure?.enabled ? 'Shop temporarily closed' : orderable ? 'Available' : 'Not available'}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="label">Area</p>
            <p className="font-bold">{product.shop?.location?.area}</p>
          </div>
        </div>
        <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-700">
          {product.businessType === 'Restaurant' && <p>{product.vegType} | {product.foodCategory}</p>}
          {product.businessType === 'Grocery / Kirana Store' && <p>{product.brand} | {product.packSize} | Stock {product.stock}</p>}
          {product.businessType === 'Dairy and Bakery' && <p>{product.dairyBakeryType} | {product.packSize} | Fresh today: {product.freshStockToday ? 'Yes' : 'No'}</p>}
        </div>
        {error && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>}
        <button type="button" className="btn-primary" disabled={!orderable} onClick={handleAdd}>
          <ShoppingCart className="h-4 w-4" />
          Add to cart
        </button>
      </div>
    </section>
  );
}
