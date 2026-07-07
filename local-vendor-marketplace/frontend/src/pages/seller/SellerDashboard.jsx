import { PackagePlus, Save, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getApiError } from '../../api/client';
import { categoryApi, orderApi, productApi, shopApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';

const orderStatuses = ['Accepted', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled', 'Rejected'];

export default function SellerDashboard() {
  const [categories, setCategories] = useState([]);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('shop');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    category: '',
    phone: '',
    deliveryRadiusKm: 5,
    location: { area: '', city: '', pincode: '', landmark: '' }
  });
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    status: 'active',
    images: null
  });

  const hydrateShopForm = useCallback((nextShop) => {
    if (!nextShop) return;
    setShopForm({
      name: nextShop.name || '',
      description: nextShop.description || '',
      category: nextShop.category?._id || nextShop.category || '',
      phone: nextShop.phone || '',
      deliveryRadiusKm: nextShop.deliveryRadiusKm || 5,
      location: {
        area: nextShop.location?.area || '',
        city: nextShop.location?.city || '',
        pincode: nextShop.location?.pincode || '',
        landmark: nextShop.location?.landmark || ''
      }
    });
  }, []);

  const loadData = useCallback(async () => {
    const [categoryRes, shopRes, productRes, orderRes] = await Promise.all([
      categoryApi.list(),
      shopApi.myShop(),
      productApi.sellerList(),
      orderApi.sellerOrders()
    ]);
    setCategories(categoryRes.data.filter((category) => category.isActive));
    setShop(shopRes.data);
    hydrateShopForm(shopRes.data);
    setProducts(productRes.data);
    setOrders(orderRes.data);
  }, [hydrateShopForm]);

  useEffect(() => {
    loadData().catch((err) => setError(getApiError(err)));
  }, [loadData]);

  const updateShopLocation = (key, value) =>
    setShopForm({ ...shopForm, location: { ...shopForm.location, [key]: value } });

  const saveShop = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const { data } = await shopApi.saveMyShop(shopForm);
      setShop(data);
      hydrateShopForm(data);
      setMessage('Shop profile submitted for admin approval.');
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const createProduct = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      Object.entries(productForm).forEach(([key, value]) => {
        if (key !== 'images' && value !== '') formData.append(key, value);
      });
      Array.from(productForm.images || []).forEach((file) => formData.append('images', file));
      await productApi.create(formData);
      setProductForm({ name: '', description: '', category: '', price: '', stock: '', status: 'active', images: null });
      setMessage('Product added.');
      loadData();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const deleteProduct = async (id) => {
    await productApi.remove(id);
    loadData();
  };

  const updateOrderStatus = async (id, status) => {
    await orderApi.updateSellerStatus(id, { status, note: `Seller marked ${status}` });
    loadData();
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label">Seller workspace</p>
          <h1 className="text-2xl font-black">Dashboard</h1>
        </div>
        {shop && <StatusBadge status={shop.status} />}
      </div>

      <div className="flex flex-wrap gap-2">
        {['shop', 'products', 'orders'].map((item) => (
          <button key={item} className={tab === item ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      {tab === 'shop' && (
        <form className="panel grid gap-3 md:grid-cols-2" onSubmit={saveShop}>
          <input className="field" placeholder="Shop name" value={shopForm.name} onChange={(event) => setShopForm({ ...shopForm, name: event.target.value })} required />
          <input className="field" placeholder="Phone" value={shopForm.phone} onChange={(event) => setShopForm({ ...shopForm, phone: event.target.value })} required />
          <select className="field" value={shopForm.category} onChange={(event) => setShopForm({ ...shopForm, category: event.target.value })}>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <input className="field" type="number" min="1" max="25" placeholder="Delivery radius" value={shopForm.deliveryRadiusKm} onChange={(event) => setShopForm({ ...shopForm, deliveryRadiusKm: event.target.value })} />
          <input className="field md:col-span-2" placeholder="Description" value={shopForm.description} onChange={(event) => setShopForm({ ...shopForm, description: event.target.value })} />
          {['area', 'city', 'pincode', 'landmark'].map((field) => (
            <input key={field} className="field" placeholder={field} value={shopForm.location[field]} onChange={(event) => updateShopLocation(field, event.target.value)} required={field !== 'landmark'} />
          ))}
          <button className="btn-primary md:col-span-2" type="submit">
            <Save className="h-4 w-4" />
            Save shop
          </button>
        </form>
      )}

      {tab === 'products' && (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <form className="panel h-fit space-y-3" onSubmit={createProduct}>
            <h2 className="text-lg font-black">Add product</h2>
            <input className="field" placeholder="Name" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required />
            <textarea className="field" placeholder="Description" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
            <select className="field" value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>
              <option value="">Category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input className="field" type="number" min="0" placeholder="Price" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} required />
              <input className="field" type="number" min="0" placeholder="Stock" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} required />
            </div>
            <input className="field" type="file" accept="image/*" multiple onChange={(event) => setProductForm({ ...productForm, images: event.target.files })} />
            <button className="btn-primary w-full" type="submit">
              <PackagePlus className="h-4 w-4" />
              Add product
            </button>
          </form>
          <div className="grid gap-3">
            {products.map((product) => (
              <article key={product._id} className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black">{product.name}</h3>
                    <StatusBadge status={product.status} />
                  </div>
                  <p className="text-sm text-stone-600">₹{product.price} | Stock {product.stock}</p>
                </div>
                <button className="btn-danger" type="button" onClick={() => deleteProduct(product._id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </article>
            ))}
            {products.length === 0 && <p className="panel text-stone-600">No products yet.</p>}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="grid gap-3">
          {orders.map((order) => (
            <article key={order._id} className="panel space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="label">{order.customer?.name}</p>
                  <h3 className="font-black">Order #{order._id.slice(-6)}</h3>
                  <p className="text-sm text-stone-600">{order.customer?.phone}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {order.items.map((item) => (
                  <p key={item.product} className="rounded-md bg-stone-50 p-2 text-sm">
                    {item.name} x {item.quantity}
                  </p>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-black">₹{order.subtotal}</p>
                <div className="flex flex-wrap gap-2">
                  {orderStatuses.map((status) => (
                    <button key={status} className="btn-secondary" type="button" onClick={() => updateOrderStatus(order._id, status)}>
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
          {orders.length === 0 && <p className="panel text-stone-600">No orders yet.</p>}
        </div>
      )}
    </section>
  );
}
