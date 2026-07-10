import { Package, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProductThumbnail } from '../utils/productImages';

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

export default function ProductCardV2({ product }) {
  const { addItem } = useCart();
  const [error, setError] = useState('');
  const image = getProductThumbnail(product);
  const orderable = isOrderable(product);

  const handleAdd = () => {
    const result = addItem(product);
    setError(result?.ok === false ? result.message : '');
  };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/products/${product._id}`} className="block">
        <div className="flex aspect-[5/3] max-h-36 items-center justify-center overflow-hidden bg-slate-100">
          {image ? (
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-12 w-12 text-slate-400" />
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div>
          <p className="text-xs font-bold text-violet-700">{product.shop?.name}</p>
          <Link to={`/products/${product._id}`} className="font-bold text-slate-950 hover:text-violet-700">
            {product.name}
          </Link>
        </div>
        <p className="line-clamp-2 text-xs text-slate-600">{product.description || 'Fresh from a nearby shop.'}</p>
        <p className="text-xs font-semibold text-slate-500">
          {product.businessType === 'Restaurant' && `${product.vegType || ''} ${product.foodCategory || ''}`}
          {product.businessType === 'Grocery / Kirana Store' && `${product.brand || ''} ${product.packSize || ''} | ${product.stock} in stock`}
          {product.businessType === 'Dairy and Bakery' && `${product.dairyBakeryType || ''} ${product.packSize || ''}`}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <p className="text-base font-black">₹{product.price}</p>
            <p className="text-xs font-semibold text-slate-500">
              {product.shop?.temporaryClosure?.enabled ? 'Shop temporarily closed' : orderable ? 'Available' : 'Not available'}
            </p>
          </div>
          <button type="button" className="btn-primary px-3 py-2" disabled={!orderable} onClick={handleAdd}>
            <ShoppingCart className="h-4 w-4" />
            Add
          </button>
        </div>
        {error && <p className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">{error}</p>}
      </div>
    </article>
  );
}
