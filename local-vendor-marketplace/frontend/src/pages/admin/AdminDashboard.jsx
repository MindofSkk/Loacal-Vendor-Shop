import { Ban, Check, Plus, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getApiError } from '../../api/client';
import { categoryApi, orderApi, shopApi, userApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('shops');
  const [categoryName, setCategoryName] = useState('');
  const [shopFilters, setShopFilters] = useState({ category: '', status: '' });
  const [orderFilters, setOrderFilters] = useState({ category: '', status: '' });
  const [error, setError] = useState('');

  const loadData = useCallback(async (nextShopFilters = shopFilters, nextOrderFilters = orderFilters) => {
    const [userRes, shopRes, orderRes, categoryRes] = await Promise.all([
      userApi.list(),
      shopApi.adminList(nextShopFilters),
      orderApi.adminList(nextOrderFilters),
      categoryApi.list()
    ]);
    setUsers(userRes.data);
    setShops(shopRes.data);
    setOrders(orderRes.data);
    setCategories(categoryRes.data);
  }, [orderFilters, shopFilters]);

  useEffect(() => {
    loadData().catch((err) => setError(getApiError(err)));
  }, [loadData]);

  const updateShopFilter = (key, value) => {
    const nextFilters = { ...shopFilters, [key]: value };
    setShopFilters(nextFilters);
    loadData(nextFilters, orderFilters).catch((err) => setError(getApiError(err)));
  };

  const updateOrderFilter = (key, value) => {
    const nextFilters = { ...orderFilters, [key]: value };
    setOrderFilters(nextFilters);
    loadData(shopFilters, nextFilters).catch((err) => setError(getApiError(err)));
  };

  const updateShopStatus = async (id, status) => {
    setError('');

    try {
      const { data } = await shopApi.updateStatus(id, {
        status,
        rejectionReason: status === 'rejected' ? 'Rejected by admin review' : undefined
      });

      setShops((currentShops) => currentShops.map((shop) => (shop._id === id ? { ...shop, ...data } : shop)));
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const updateUserStatus = async (id, status) => {
    await userApi.updateStatus(id, { status });
    loadData();
  };

  const addCategory = async (event) => {
    event.preventDefault();
    await categoryApi.create({ name: categoryName });
    setCategoryName('');
    loadData();
  };

  const toggleCategory = async (category) => {
    await categoryApi.update(category._id, {
      name: category.name,
      description: category.description,
      isActive: !category.isActive
    });
    loadData();
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="label">Admin console</p>
        <h1 className="text-2xl font-black">Marketplace Control</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="panel">
          <p className="label">Users</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{users.length}</p>
        </div>
        <div className="panel">
          <p className="label">Shops</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{shops.length}</p>
        </div>
        <div className="panel">
          <p className="label">Orders</p>
          <p className="mt-2 text-3xl font-black text-violet-700">{orders.length}</p>
        </div>
        <div className="panel">
          <p className="label">Categories</p>
          <p className="mt-2 text-3xl font-black text-amber-600">{categories.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['shops', 'users', 'orders', 'categories'].map((item) => (
          <button key={item} className={tab === item ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {tab === 'shops' && (
        <div className="grid gap-3">
          <div className="panel grid gap-3 sm:grid-cols-2">
            <select className="field" value={shopFilters.category} onChange={(event) => updateShopFilter('category', event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select className="field" value={shopFilters.status} onChange={(event) => updateShopFilter('status', event.target.value)}>
              <option value="">All shop statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          {shops.map((shop) => (
            <article key={shop._id} className="panel space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-black">{shop.name}</h2>
                  <p className="text-sm text-stone-600">{shop.owner?.name} | {shop.location?.area}, {shop.location?.city}</p>
                </div>
                <StatusBadge status={shop.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                {shop.status === 'approved' ? (
                  <button className="btn-secondary" type="button" disabled>
                    <Check className="h-4 w-4" />
                    Approved
                  </button>
                ) : (
                  <button className="btn-primary" type="button" onClick={() => updateShopStatus(shop._id, 'approved')}>
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                )}
                {shop.status !== 'rejected' && shop.status !== 'approved' && (
                  <button className="btn-danger" type="button" onClick={() => updateShopStatus(shop._id, 'rejected')}>
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                )}
                {shop.status !== 'suspended' && (
                  <button className="btn-secondary" type="button" onClick={() => updateShopStatus(shop._id, 'suspended')}>
                    <Ban className="h-4 w-4" />
                    Suspend
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="grid gap-3">
          {users.map((user) => (
            <article key={user._id} className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black">{user.name}</h2>
                  <StatusBadge status={user.status} />
                </div>
                <p className="text-sm text-stone-600">{user.email} | {user.role}</p>
              </div>
              <button
                className={user.status === 'active' ? 'btn-danger' : 'btn-secondary'}
                type="button"
                onClick={() => updateUserStatus(user._id, user.status === 'active' ? 'suspended' : 'active')}
              >
                {user.status === 'active' ? <Ban className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                {user.status === 'active' ? 'Suspend' : 'Restore'}
              </button>
            </article>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="grid gap-3">
          <div className="panel grid gap-3 sm:grid-cols-2">
            <select className="field" value={orderFilters.category} onChange={(event) => updateOrderFilter('category', event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select className="field" value={orderFilters.status} onChange={(event) => updateOrderFilter('status', event.target.value)}>
              <option value="">All order statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Packed">Packed</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          {orders.map((order) => (
            <article key={order._id} className="panel space-y-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-black">Order #{order._id.slice(-6)}</h2>
                  <p className="text-sm text-stone-600">{order.customer?.name} from {order.shop?.name}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-lg font-black">₹{order.subtotal}</p>
            </article>
          ))}
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <form className="panel h-fit space-y-3" onSubmit={addCategory}>
            <h2 className="text-lg font-black">Add category</h2>
            <input className="field" placeholder="Category name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required />
            <button className="btn-primary w-full" type="submit">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>
          <div className="grid gap-3">
            {categories.map((category) => (
              <article key={category._id} className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-black">{category.name}</h3>
                  <p className="text-sm text-stone-600">{category.slug}</p>
                </div>
                <button className="btn-secondary" type="button" onClick={() => toggleCategory(category)}>
                  {category.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
