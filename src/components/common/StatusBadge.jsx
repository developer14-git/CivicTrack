export default function StatusBadge({ status, size = 'sm' }) {
  // Normalize status label to plain, understandable English
  const displayLabel = status === 'Resolution Submitted' ? 'Awaiting Verification' : status;

  const styles = {
    Open: 'bg-amber-50 text-amber-800 border-amber-200',
    'In Progress': 'bg-sky-50 text-sky-800 border-sky-200',
    'Resolution Submitted': 'bg-purple-50 text-purple-800 border-purple-200',
    'Awaiting Verification': 'bg-purple-50 text-purple-800 border-purple-200/80',
    Resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  };

  const dots = {
    Open: 'bg-amber-500',
    'In Progress': 'bg-sky-500',
    'Resolution Submitted': 'bg-purple-500',
    'Awaiting Verification': 'bg-purple-500',
    Resolved: 'bg-emerald-600',
  };

  const badgeStyle = styles[status] || styles[displayLabel] || 'bg-slate-100 text-slate-700 border-slate-200';
  const dotStyle = dots[status] || dots[displayLabel] || 'bg-slate-400';

  const sizeClasses = size === 'md'
    ? 'px-2.5 py-0.5 text-xs'
    : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border font-medium ${sizeClasses} ${badgeStyle}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotStyle}`} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}
