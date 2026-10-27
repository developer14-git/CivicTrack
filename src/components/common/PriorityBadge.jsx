import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function PriorityBadge({ priority = 'Medium', size = 'sm', showIcon = false }) {
  const styles = {
    High: 'bg-rose-50 text-rose-800 border-rose-200/90 font-semibold',
    Medium: 'bg-amber-50 text-amber-900 border-amber-200/90',
    Low: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const dots = {
    High: 'bg-rose-600',
    Medium: 'bg-amber-500',
    Low: 'bg-slate-400',
  };

  const icons = {
    High: AlertCircle,
    Medium: AlertTriangle,
    Low: Info,
  };

  const badgeStyle = styles[priority] || styles.Medium;
  const dotStyle = dots[priority] || dots.Medium;
  const IconComponent = icons[priority] || Info;

  const sizeClasses = size === 'md'
    ? 'px-2.5 py-1 text-xs'
    : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border font-medium ${sizeClasses} ${badgeStyle}`}
      title={`Priority level: ${priority}`}
    >
      {showIcon ? (
        <IconComponent className="w-3 h-3 mr-1 shrink-0" aria-hidden="true" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotStyle}`} aria-hidden="true" />
      )}
      <span>{priority}</span>
    </span>
  );
}
