import { MapPin, ThumbsUp } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';

/**
 * Calculates a short human-readable age from an ISO timestamp.
 */
function formatAge(dateString, fallbackDisplay) {
  if (fallbackDisplay && fallbackDisplay !== 'Just now') {
    return fallbackDisplay;
  }
  if (!dateString) return 'Recent';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return fallbackDisplay || 'Recent';

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 5) return 'Just now';
  if (diffHours < 1) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function IssueCard({
  issue,
  onClick,
  onSupport,
}) {
  const ageText = formatAge(issue.reportedAt, issue.reportedDateDisplay);

  const handleSupportClick = (e) => {
    e.stopPropagation();
    if (onSupport) {
      onSupport(issue.id);
    }
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    onClick?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target === e.currentTarget) {
        e.preventDefault();
        onClick?.();
      }
    }
  };

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-labelledby={`issue-title-${issue.id}`}
      className="group bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 flex flex-col justify-between"
    >
      <div className="space-y-2">
        {/* ID, Category & Age in smaller text */}
        <div className="flex items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono font-medium text-slate-600 shrink-0">{issue.id}</span>
            {issue.category && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium truncate">
                {issue.category}
              </span>
            )}
          </div>
          <span className="shrink-0">{ageText}</span>
        </div>

        {/* Issue Title */}
        <h3
          id={`issue-title-${issue.id}`}
          className="text-sm font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug"
        >
          {issue.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {issue.location ||
              (issue.landmark
                ? `${issue.landmark}${issue.area ? `, ${issue.area}` : ''}`
                : `${issue.building || 'New Town'}${issue.floorRoom ? ` • ${issue.floorRoom}` : ''}`)}
          </span>
        </div>
      </div>

      {/* Badges & Optional Endorsement count */}
      <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={issue.status} />
          {issue.priority && (
            <PriorityBadge priority={issue.priority} />
          )}
        </div>

        {/* Support count */}
        {issue.supporters !== undefined && (
          <button
            type="button"
            onClick={handleSupportClick}
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${
              issue.supportedByMe
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title={issue.supportedByMe ? 'You endorsed this report' : 'Endorse this report'}
            aria-label={`${issue.supporters} endorsements`}
          >
            <ThumbsUp className={`w-3 h-3 ${issue.supportedByMe ? 'fill-emerald-700 text-emerald-700' : ''}`} />
            <span>{issue.supporters}</span>
          </button>
        )}
      </div>
    </article>
  );
}
