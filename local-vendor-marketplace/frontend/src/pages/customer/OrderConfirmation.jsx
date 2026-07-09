import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order;
  const shopName = state?.shopName;

  if (!order) {
    return <Navigate to="/orders" replace />;
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="panel space-y-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-8 w-8 text-market-leaf" />
          <div>
            <p className="label">Order placed</p>
            <h1 className="text-2xl font-black">Seller will confirm your order soon.</h1>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-stone-50 p-3">
            <p className="label">Order ID</p>
            <p className="font-black">#{order._id.slice(-6)}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="label">Shop</p>
            <p className="font-black">{shopName || 'Local shop'}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="label">Status</p>
            <div className="mt-2">
              <StatusBadge status={order.status} />
            </div>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="label">Total</p>
            <p className="font-black">Rs {order.subtotal}</p>
          </div>
        </div>

        <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-700">
          <p className="label">Delivery address</p>
          <p className="mt-2 font-semibold text-market-ink">{order.deliveryAddress?.fullAddress}</p>
          {order.deliveryAddress?.landmark && <p>Landmark: {order.deliveryAddress.landmark}</p>}
          <p>Phone: {order.deliveryAddress?.phone}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link className="btn-primary" to="/orders">
            <ShoppingBag className="h-4 w-4" />
            View orders
          </Link>
          <Link className="btn-secondary" to="/">
            Continue shopping
          </Link>
        </div>
      </div>
    </section>
  );
}
