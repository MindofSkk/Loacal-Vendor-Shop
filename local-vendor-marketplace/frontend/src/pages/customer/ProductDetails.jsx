import { ArrowLeft, Package, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productApi } from '../../api/services';
import { useCart } from '../../context/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
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
            <p className="label">Stock</p>
            <p className="text-2xl font-black">{product.stock}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="label">Area</p>
            <p className="font-bold">{product.shop?.location?.area}</p>
          </div>
        </div>
        <button type="button" className="btn-primary" disabled={product.stock < 1} onClick={() => addItem(product)}>
          <ShoppingCart className="h-4 w-4" />
          Add to cart
        </button>
      </div>
    </section>
  );
}
