import { ArrowLeft, MapPin, Phone, RefreshCw, Store, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getApiError } from '../../api/client';
import { orderApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import { useCustomerOrders } from '../../context/CustomerOrdersContext';
import { useToast } from '../../context/ToastContext';
import {
  getOrderItemCount,
  getOrderStatusConfig,
  getOrderTotal,
  getShortOrderId
} from '../../utils/orderStatus';

const timeline = ['Pending', 'Accepted', 'Packed', 'Out for Delivery', 'Delivered'];

export default function OrderDetailsV2() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { activeOrders, orders, updateOrderLocal, loadOrders } = useCustomerOrders();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    orderApi
      .get(id)
      .then(({ data }) => {
        if (alive) setOrder(data);
      })
      .catch((err) => {
        if (alive) setError(getApiError(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    const fresh = [...activeOrders, ...orders].find((item) => item._id === id);
    if (fresh) setOrder((current) => ({ ...(current || {}), ...fresh }));
  }, [activeOrders, id, orders]);

  const statusConfig = getOrderStatusConfig(order?.status);
  const currentStep = statusConfig.step;
  const visibleItems = order?.items || [];
  const address = order?.deliveryAddress || {};
  const total = getOrderTotal(order);

  const canCancel = order?.status === 'Pending';
  const billRows = useMemo(
    () => [
      ['Item Total', `₹${order?.subtotal || 0}`],
      ['Delivery Fee', `₹${order?.deliveryCharge || 0}`],
      ['Payment', order?.paymentMethod || 'COD']
    ],
    [order]
  );

  const cancelOrder = async () => {
    if (!canCancel || !window.confirm('Cancel this pending order?')) return;
    setUpdating(true);
    setError('');

    try {
      const { data } = await orderApi.cancel(order._id, { reason: 'Customer cancelled before acceptance' });
      setOrder(data);
      updateOrderLocal(data);
      await loadOrders({ silent: true });
      toast.success({ title: 'Order cancelled', message: `Order #${getShortOrderId(data)} has been cancelled.` });
    } catch (err) {
      toast.error({ title: 'Cancel failed', message: getApiError(err) });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <p className="panel text-slate-600">Loading order details...</p>;
  }

  if (!order) {
    return (
      <section className="panel space-y-3">
        <p className="font-bold text-red-700">{error || 'Order not found.'}</p>
        <button className="btn-secondary" type="button" onClick={() => navigate('/orders')}>
          Back to orders
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button className="btn-secondary" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <Link className="btn-secondary" to="/orders">
          All orders
        </Link>
      </div>

      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-violet-100">
              {order.shop?.logoUrl ? (
                <img className="h-full w-full object-cover" src={order.shop.logoUrl} alt={order.shop.name} />
              ) : (
                <Store className="h-9 w-9 text-violet-700" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="line-clamp-2 text-xl font-bold text-slate-950">{order.shop?.name || 'Local shop'}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-600">Order #{getShortOrderId(order)}</p>
              <p className="text-xs font-semibold text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">{getOrderItemCount(order)} items</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">₹{total}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="panel">
        <div className="grid grid-cols-5 gap-2">
          {timeline.map((status, index) => {
            const complete = currentStep > index;
            const active = currentStep === index;
            const StepIcon = getOrderStatusConfig(status).icon;
            return (
              <div key={status} className="text-center">
                <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm ${complete || active ? 'bg-violet-700 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <StepIcon className="h-4 w-4" />
                </div>
                <p className={`mt-1 text-[11px] font-bold leading-tight ${active ? 'text-violet-700' : 'text-slate-600'}`}>{getOrderStatusConfig(status).label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <section className="panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="label">Delivery Address</p>
                <h2 className="mt-1 text-base font-bold text-slate-950">{order.customer?.name || 'Customer'}</h2>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-600">{address.fullAddress || 'No delivery address added'}</p>
                {address.landmark && <p className="text-sm text-slate-500">Landmark: {address.landmark}</p>}
                {address.phone && <p className="text-sm text-slate-500">Phone: {address.phone}</p>}
              </div>
              {address.mapUrl && (
                <a className="btn-secondary" href={address.mapUrl} target="_blank" rel="noreferrer">
                  <MapPin className="h-4 w-4" />
                  Directions
                </a>
              )}
            </div>
          </section>

          <section className="panel space-y-3">
            <p className="label">Ordered Items</p>
            {visibleItems.map((item) => (
              <div key={`${item.product}-${item.name}`} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-bold text-slate-950">{item.name}</p>
                  <p className="text-xs font-semibold text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="font-bold text-slate-950">₹{Number(item.price || 0) * Number(item.quantity || 0)}</p>
              </div>
            ))}
          </section>
        </div>

        <div className="space-y-4">
          <section className="panel">
            <p className="label">Payment</p>
            <h2 className="mt-1 text-base font-bold text-slate-950">Cash on Delivery</h2>
            <p className="mt-1 text-xs font-semibold text-amber-700">Payment pending</p>
          </section>

          <section className="panel space-y-2">
            <p className="label">Bill Details</p>
            {billRows.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm font-medium text-slate-600">
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-950">
              <span>To Pay</span>
              <span>₹{total}</span>
            </div>
          </section>

          <section className="panel space-y-2">
            <p className="label">Store Actions</p>
            {order.shop?.phone && (
              <a className="btn-secondary w-full justify-start" href={`tel:${order.shop.phone}`}>
                <Phone className="h-4 w-4" />
                Call Store
              </a>
            )}
            {address.mapUrl && (
              <a className="btn-secondary w-full justify-start" href={address.mapUrl} target="_blank" rel="noreferrer">
                <MapPin className="h-4 w-4" />
                Directions
              </a>
            )}
            <button className="btn-secondary w-full justify-start" type="button" disabled>
              <RefreshCw className="h-4 w-4" />
              Chat coming soon
            </button>
          </section>
        </div>
      </div>

      {canCancel && (
        <button className="btn-danger w-full" type="button" disabled={updating} onClick={cancelOrder}>
          <Trash2 className="h-4 w-4" />
          {updating ? 'Cancelling...' : 'Cancel Order'}
        </button>
      )}
    </section>
  );
}
