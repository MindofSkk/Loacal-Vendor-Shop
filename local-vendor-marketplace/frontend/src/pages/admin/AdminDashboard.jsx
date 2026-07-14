import { Ban, Check, Eye, Plus, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getApiError } from '../../api/client';
import { categoryApi, orderApi, shopApi, userApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import { getOrderItemCount, getOrderTotal, getShortOrderId } from '../../utils/orderStatus';

const includesText = (value, query) => String(value || '').toLowerCase().includes(query);
const sectionToTab = {
  dashboard: 'shops',
  shops: 'shops',
  users: 'users',
  orders: 'orders',
  categories: 'categories',
  settings: 'settings'
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { section } = useParams();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('shops');
  const [categoryName, setCategoryName] = useState('');
  const [search, setSearch] = useState('');
  const [shopFilters, setShopFilters] = useState({ category: '', status: '' });
  const [orderFilters, setOrderFilters] = useState({ category: '', status: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  useEffect(() => {
    setTab(sectionToTab[section || 'dashboard'] || 'shops');
    setSearch(searchParams.get('q') || '');
  }, [section, searchParams]);

  const navigateAdminTab = (nextTab) => {
    const params = new URLSearchParams(searchParams);
    navigate(`/admin/${nextTab === 'shops' ? 'shops' : nextTab}${params.toString() ? `?${params.toString()}` : ''}`);
  };

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
    setMessage('');
    setActionLoading(`shop-${id}-${status}`);

    try {
      const { data } = await shopApi.updateStatus(id, {
        status,
        rejectionReason: status === 'rejected' ? 'Rejected by admin review' : undefined
      });

      setShops((currentShops) => currentShops.map((shop) => (shop._id === id ? { ...shop, ...data } : shop)));
      setMessage(`Shop ${status}.`);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setActionLoading('');
    }
  };

  const updateUserStatus = async (id, status) => {
    setError('');
    setMessage('');
    setActionLoading(`user-${id}`);

    try {
      const { data } = await userApi.updateStatus(id, { status });
      setUsers((currentUsers) => currentUsers.map((user) => (user._id === id ? data : user)));
      setMessage(`User ${status}.`);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setActionLoading('');
    }
  };

  const addCategory = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setActionLoading('category-create');

    try {
      const { data } = await categoryApi.create({ name: categoryName });
      setCategories((currentCategories) => [data, ...currentCategories]);
      setCategoryName('');
      setMessage('Category added.');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setActionLoading('');
    }
  };

  const toggleCategory = async (category) => {
    setError('');
    setMessage('');
    setActionLoading(`category-${category._id}`);

    try {
      const { data } = await categoryApi.update(category._id, {
        name: category.name,
        description: category.description,
        isActive: !category.isActive
      });
      setCategories((currentCategories) => currentCategories.map((item) => (item._id === category._id ? data : item)));
      setMessage(`Category ${data.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setActionLoading('');
    }
  };

  const query = search.trim().toLowerCase();
  const visibleShops = useMemo(
    () =>
      shops.filter(
        (shop) =>
          !query ||
          includesText(shop.name, query) ||
          includesText(shop.owner?.name, query) ||
          includesText(shop.owner?.email, query) ||
          includesText(shop.status, query) ||
          includesText(shop.businessType, query) ||
          includesText(shop.category?.name, query) ||
          includesText(shop.location?.area, query) ||
          includesText(shop.location?.city, query)
      ),
    [query, shops]
  );
  const visibleUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          !query ||
          includesText(user.name, query) ||
          includesText(user.email, query) ||
          includesText(user.phone, query) ||
          includesText(user.role, query) ||
          includesText(user.status, query)
      ),
    [query, users]
  );
  const visibleOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          !query ||
          includesText(order._id, query) ||
          includesText(order.customer?.name, query) ||
          includesText(order.customer?.email, query) ||
          includesText(order.shop?.name, query) ||
          includesText(order.shop?.businessType, query) ||
          includesText(order.status, query)
      ),
    [orders, query]
  );
  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          !query ||
          includesText(category.name, query) ||
          includesText(category.slug, query) ||
          includesText(category.description, query)
      ),
    [categories, query]
  );

  return (
    <section className="space-y-4">
      <div>
        <p className="label">Admin console</p>
        <h1 className="text-xl font-black">Marketplace Control</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="panel">
          <p className="label">Users</p>
          <p className="mt-1.5 text-2xl font-black text-blue-700">{users.length}</p>
        </div>
        <div className="panel">
          <p className="label">Shops</p>
          <p className="mt-1.5 text-2xl font-black text-emerald-700">{shops.length}</p>
        </div>
        <div className="panel">
          <p className="label">Orders</p>
          <p className="mt-1.5 text-2xl font-black text-violet-700">{orders.length}</p>
        </div>
        <div className="panel">
          <p className="label">Categories</p>
          <p className="mt-1.5 text-2xl font-black text-amber-600">{categories.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['shops', 'users', 'orders', 'categories', 'settings'].map((item) => (
          <button key={item} className={tab === item ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => navigateAdminTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      <input
        className="field"
        placeholder="Search users, shops, orders, or categories"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

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
          {visibleShops.map((shop) => (
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
                  <button className="btn-primary" type="button" disabled={actionLoading === `shop-${shop._id}-approved`} onClick={() => updateShopStatus(shop._id, 'approved')}>
                    <Check className="h-4 w-4" />
                    {actionLoading === `shop-${shop._id}-approved` ? 'Updating...' : shop.status === 'suspended' ? 'Activate' : 'Approve'}
                  </button>
                )}
                {shop.status !== 'rejected' && shop.status !== 'approved' && (
                  <button className="btn-danger" type="button" disabled={actionLoading === `shop-${shop._id}-rejected`} onClick={() => updateShopStatus(shop._id, 'rejected')}>
                    <X className="h-4 w-4" />
                    {actionLoading === `shop-${shop._id}-rejected` ? 'Rejecting...' : 'Reject'}
                  </button>
                )}
                {shop.status !== 'suspended' && (
                  <button className="btn-secondary" type="button" disabled={actionLoading === `shop-${shop._id}-suspended`} onClick={() => updateShopStatus(shop._id, 'suspended')}>
                    <Ban className="h-4 w-4" />
                    {actionLoading === `shop-${shop._id}-suspended` ? 'Suspending...' : 'Suspend'}
                  </button>
                )}
              </div>
            </article>
          ))}
          {visibleShops.length === 0 && <p className="panel text-stone-600">No shops found.</p>}
        </div>
      )}

      {tab === 'users' && (
        <div className="grid gap-3">
          {visibleUsers.map((user) => (
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
                disabled={actionLoading === `user-${user._id}`}
                onClick={() => updateUserStatus(user._id, user.status === 'active' ? 'suspended' : 'active')}
              >
                {user.status === 'active' ? <Ban className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                {actionLoading === `user-${user._id}` ? 'Updating...' : user.status === 'active' ? 'Suspend' : 'Restore'}
              </button>
            </article>
          ))}
          {visibleUsers.length === 0 && <p className="panel text-stone-600">No users found.</p>}
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
          {visibleOrders.map((order) => (
            <article key={order._id} className="panel space-y-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-950">Order #{getShortOrderId(order)}</h2>
                  <p className="text-sm text-stone-600">{order.customer?.name} from {order.shop?.name}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-base font-bold text-slate-950">Rs {order.subtotal}</p>
                <button className="btn-secondary" type="button" onClick={() => setSelectedOrder(order)}>
                  <Eye className="h-4 w-4" />
                  Inspect order
                </button>
              </div>
            </article>
          ))}
          {visibleOrders.length === 0 && <p className="panel text-stone-600">No orders found.</p>}
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
          <form className="panel h-fit space-y-3" onSubmit={addCategory}>
            <h2 className="text-lg font-black">Add category</h2>
            <input className="field" placeholder="Category name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required />
            <button className="btn-primary w-full" type="submit" disabled={actionLoading === 'category-create'}>
              <Plus className="h-4 w-4" />
              {actionLoading === 'category-create' ? 'Adding...' : 'Add'}
            </button>
          </form>
          <div className="grid gap-3">
            {visibleCategories.map((category) => (
              <article key={category._id} className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-black">{category.name}</h3>
                  <p className="text-sm text-stone-600">{category.slug}</p>
                </div>
                <button className="btn-secondary" type="button" disabled={actionLoading === `category-${category._id}`} onClick={() => toggleCategory(category)}>
                  {actionLoading === `category-${category._id}` ? 'Updating...' : category.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </article>
            ))}
            {visibleCategories.length === 0 && <p className="panel text-stone-600">No categories found.</p>}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="panel space-y-3">
          <p className="label">Admin settings</p>
          <h2 className="text-xl font-black">Settings</h2>
          <p className="text-sm text-stone-600">
            Admin settings are not configured in this MVP. Use Users, Shops, Orders, and Categories to manage marketplace data.
          </p>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="label">Order inspection</p>
                <h2 className="text-xl font-bold text-slate-950">Order #{getShortOrderId(selectedOrder)}</h2>
                <p className="text-sm font-semibold text-slate-500">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedOrder.status} />
                <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={() => setSelectedOrder(null)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <section className="rounded-2xl bg-slate-50 p-3">
                <p className="label">Customer</p>
                <p className="mt-1 font-bold text-slate-950">{selectedOrder.customer?.name || 'Customer'}</p>
                <p className="text-sm text-slate-600">{selectedOrder.customer?.email}</p>
                <p className="text-sm text-slate-600">{selectedOrder.customer?.phone || selectedOrder.deliveryAddress?.phone}</p>
              </section>
              <section className="rounded-2xl bg-slate-50 p-3">
                <p className="label">Seller / Shop</p>
                <p className="mt-1 font-bold text-slate-950">{selectedOrder.shop?.name || 'Shop'}</p>
                <p className="text-sm text-slate-600">{selectedOrder.seller?.name || selectedOrder.seller?.email}</p>
                <p className="text-sm text-slate-600">{selectedOrder.shop?.businessType}</p>
              </section>
              <section className="rounded-2xl bg-slate-50 p-3 md:col-span-2">
                <p className="label">Delivery Address</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{selectedOrder.deliveryAddress?.fullAddress || 'No address available'}</p>
                {selectedOrder.deliveryAddress?.landmark && <p className="text-sm text-slate-600">Landmark: {selectedOrder.deliveryAddress.landmark}</p>}
                <p className="text-sm text-slate-600">Phone: {selectedOrder.deliveryAddress?.phone || 'N/A'}</p>
              </section>
              <section className="rounded-2xl bg-slate-50 p-3 md:col-span-2">
                <p className="label">Items</p>
                <div className="mt-2 grid gap-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={`${item.product}-${item.name}`} className="flex justify-between rounded-xl bg-white px-3 py-2 text-sm">
                      <span className="font-semibold text-slate-700">{item.name} x {item.quantity}</span>
                      <span className="font-bold text-slate-950">₹{Number(item.price || 0) * Number(item.quantity || 0)}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl bg-violet-50 p-3 md:col-span-2">
                <p className="label">Amount</p>
                <p className="mt-1 text-2xl font-bold text-violet-800">₹{getOrderTotal(selectedOrder)}</p>
                <p className="text-sm font-semibold text-violet-700">
                  {getOrderItemCount(selectedOrder)} items • Payment: {selectedOrder.paymentMethod || 'COD'} • {selectedOrder.paymentStatus || 'NOT_REQUIRED'}
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
