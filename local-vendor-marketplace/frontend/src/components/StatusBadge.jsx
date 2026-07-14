import { getOrderStatusConfig } from '../utils/orderStatus';

const statusClass = {
  approved: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-stone-200 text-stone-700',
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-stone-200 text-stone-700'
};

export default function StatusBadge({ status }) {
  const orderStatus = getOrderStatusConfig(status);
  const className = statusClass[status] || orderStatus.tone || 'bg-stone-100 text-stone-700';
  const label = statusClass[status] ? status : orderStatus.label;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}
