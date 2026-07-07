import { XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApiError } from '../../api/client';
import { orderApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const loadOrders = () => {
    orderApi
      .myOrders()
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(getApiError(err)));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const cancelOrder = async (id) => {
    await orderApi.cancel(id, { reason: 'Customer cancelled before acceptance' });
    loadOrders();
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-black">Order history</h1>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {orders.map((order) => (
        <article key={order._id} className="panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="label">{order.shop?.name}</p>
              <h2 className="font-black">Order #{order._id.slice(-6)}</h2>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="grid gap-2">
            {order.items.map((item) => (
              <div key={item.product} className="flex justify-between rounded-md bg-stone-50 p-2 text-sm">
                <span>{item.name} x {item.quantity}</span>
                <span className="font-bold">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-black">₹{order.subtotal}</p>
            {order.status === 'Pending' && (
              <button className="btn-danger" type="button" onClick={() => cancelOrder(order._id)}>
                <XCircle className="h-4 w-4" />
                Cancel
              </button>
            )}
          </div>
        </article>
      ))}
      {orders.length === 0 && <p className="panel text-stone-600">No orders yet.</p>}
    </section>
  );
}
