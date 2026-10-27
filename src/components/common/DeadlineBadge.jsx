import { Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

const BADGE_CONFIG = {
  Completed: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
    icon: CheckCircle2,
    desc: 'Resolution independently verified within or after target SLA',
  },
  Overdue: {
    label: 'Overdue',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-300',
    dot: 'bg-rose-600',
    icon: AlertTriangle,
    desc: 'Target resolution deadline has passed and issue remains unverified',
  },
  'Due Soon': {
    label: 'Due Soon',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    icon: AlertCircle,
    desc: 'Target resolution deadline expires within 6 hours',
  },
  'On Track': {
    label: 'On Track',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
    icon: Clock,
    desc: 'Within target resolution window (> 6 hours remaining)',
  },
};

export default function DeadlineBadge({
  status = 'On Track',
  size = 'sm',
  showIcon = true,
  className = '',
}) {
  const config = BADGE_CONFIG[status] || BADGE_CONFIG['On Track'];
  const IconComponent = config.icon;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.25 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size] || 'text-[11px] px-2 py-0.5 gap-1';

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size] || 'w-3 h-3';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
      title={config.desc}
      role="status"
      aria-label={`Deadline status: ${config.label}`}
    >
      {showIcon && <IconComponent className={`${iconSizes} shrink-0`} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}
