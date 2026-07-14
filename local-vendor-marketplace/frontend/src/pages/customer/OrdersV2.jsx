import { MapPin, RefreshCw, Search, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiError } from '../../api/client';
import { orderApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import { useCustomerOrders } from '../../context/CustomerOrdersContext';
import { useToast } from '../../context/ToastContext';
import { getOrderItemCount, getOrderTotal, getShortOrderId, isTerminalOrderStatus } from '../../utils/orderStatus';

const statusFilters = ['All', 'Active', 'Pending', 'Accepted', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled', 'Rejected'];
const includesText = (value, query) => String(value || '').toLowerCase().includes(query);

export default function OrdersV2() {
  const { orders, loadingOrders, error, loadOrders, updateOrderLocal } = useCustomerOrders();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const cancelOrder = async (id) => {
    if (!window.confirm('Cancel this pending order?')) return;
    setActionLoading(`cancel-${id}`);

    try {
      const { data } = await orderApi.cancel(id, { reason: 'Customer cancelled before acceptance' });
      updateOrderLocal(data);
      await loadOrders({ silent: true });
      toast.success({ title: 'Order cancelled', message: `Order #${getShortOrderId(data)} has been cancelled.` });
    } catch (err) {
      toast.error({ title: 'Cancel failed', message: getApiError(err) });
    } finally {
      setActionLoading('');
    }
  };

  const visibleOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' ? !isTerminalOrderStatus(order.status) : order.status === statusFilter);
      const matchesSearch =
        !q ||
        includesText(order._id, q) ||
        includesText(order.shop?.name, q) ||
        includesText(order.status, q) ||
        includesText(order.deliveryAddress?.phone, q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label">Customer orders</p>
          <h1 className="text-xl font-bold text-slate-950">Order history</h1>
        </div>
        <button className="btn-secondary" type="button" onClick={() => loadOrders({ silent: false })}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="panel space-y-3">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          <input
            className="w-full bg-transparent font-semibold outline-none"
            placeholder="Search by order number or shop"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((status) => (
            <button
              key={status}
              className={statusFilter === status ? 'btn-primary whitespace-nowrap' : 'btn-secondary whitespace-nowrap'}
              type="button"
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loadingOrders && orders.length === 0 && <p className="panel text-slate-600">Loading orders...</p>}

      {visibleOrders.map((order) => (
        <article key={order._id} className="panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="label">{order.shop?.name}</p>
              <h2 className="font-bold text-slate-950">Order #{getShortOrderId(order)}</h2>
              <p className="text-xs font-semibold text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-700">
            <p>{order.deliveryAddress?.fullAddress || 'No delivery address added'}</p>
            <p>Phone: {order.deliveryAddress?.phone || 'N/A'}</p>
            {order.deliveryAddress?.landmark && <p>Landmark: {order.deliveryAddress.landmark}</p>}
            {order.deliveryAddress?.mapUrl && (
              <a className="mt-2 inline-flex items-center gap-2 font-bold text-market-leaf" href={order.deliveryAddress.mapUrl} target="_blank" rel="noreferrer">
                <MapPin className="h-4 w-4" />
                Location shared
              </a>
            )}
          </div>
          <div className="grid gap-2">
            {order.items.map((item) => (
              <div key={`${item.product}-${item.name}`} className="flex justify-between rounded-md bg-stone-50 p-2 text-sm">
                <span>{item.name} x {item.quantity}</span>
                <span className="font-bold">₹{Number(item.price || 0) * Number(item.quantity || 0)}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-slate-700">
              {getOrderItemCount(order)} items • ₹{getOrderTotal(order)}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Link className="btn-primary" to={`/orders/${order._id}`}>
                View Order
              </Link>
              {order.status === 'Pending' && (
                <button className="btn-danger" type="button" disabled={actionLoading === `cancel-${order._id}`} onClick={() => cancelOrder(order._id)}>
                  <XCircle className="h-4 w-4" />
                  {actionLoading === `cancel-${order._id}` ? 'Cancelling...' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        </article>
      ))}

      {!loadingOrders && visibleOrders.length === 0 && <p className="panel text-stone-600">No orders found.</p>}
    </section>
  );
}
