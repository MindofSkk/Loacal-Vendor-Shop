const statusClass = {
  Pending: 'bg-amber-100 text-amber-800',
  Accepted: 'bg-blue-100 text-blue-800',
  Packed: 'bg-indigo-100 text-indigo-800',
  'Out for Delivery': 'bg-sky-100 text-sky-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-800',
  Rejected: 'bg-red-100 text-red-800',
  approved: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-stone-200 text-stone-700',
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-stone-200 text-stone-700'
};

export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass[status] || 'bg-stone-100 text-stone-700'}`}>
      {status}
    </span>
  );
}
