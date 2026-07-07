import { Package, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const image = product.images?.[0]?.url;

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
        <div className="mt-auto flex items-center justify-between">
          <div>
            <p className="text-lg font-black">₹{product.price}</p>
            <p className="text-xs text-stone-500">{product.stock} in stock</p>
          </div>
          <button type="button" className="btn-primary" disabled={product.stock < 1} onClick={() => addItem(product)}>
            <ShoppingCart className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
