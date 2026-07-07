import { Package, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const isOrderable = (product) => {
  if (product.status !== 'active') return false;
  if (product.businessType === 'Grocery / Kirana Store') return product.stock > 0;
  if (product.businessType === 'Dairy and Bakery') return product.freshStockToday;
  return true;
};

export default function ProductCardV2({ product }) {
  const { addItem } = useCart();
  const [error, setError] = useState('');
  const image = product.images?.[0]?.url;
  const orderable = isOrderable(product);

  const handleAdd = () => {
    const result = addItem(product);
    setError(result?.ok === false ? result.message : '');
  };

  return (
    <article className="panel flex h-full flex-col gap-3">
      <Link to={`/products/${product._id}`} className="block">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-stone-100">
          {image ? (
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-12 w-12 text-stone-400" />
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2">
        <div>
          <p className="text-xs font-semibold text-market-leaf">{product.shop?.name}</p>
          <Link to={`/products/${product._id}`} className="font-bold hover:text-market-leaf">
            {product.name}
          </Link>
        </div>
        <p className="line-clamp-2 text-sm text-stone-600">{product.description || 'Fresh from a nearby shop.'}</p>
        <p className="text-xs text-stone-500">
          {product.businessType === 'Restaurant' && `${product.vegType || ''} ${product.foodCategory || ''}`}
          {product.businessType === 'Grocery / Kirana Store' && `${product.brand || ''} ${product.packSize || ''} | ${product.stock} in stock`}
          {product.businessType === 'Dairy and Bakery' && `${product.dairyBakeryType || ''} ${product.packSize || ''}`}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <p className="text-lg font-black">₹{product.price}</p>
            <p className="text-xs text-stone-500">{orderable ? 'Available' : 'Not available'}</p>
          </div>
          <button type="button" className="btn-primary" disabled={!orderable} onClick={handleAdd}>
            <ShoppingCart className="h-4 w-4" />
            Add
          </button>
        </div>
        {error && <p className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">{error}</p>}
      </div>
    </article>
  );
}
