import { useState, useMemo } from 'react';
import {
  ThumbsUp,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import {
  getDeadlineStatus,
  formatTimeRemaining,
  sortOverdueIssues,
  calculateMedianResolutionTime,
  SLA_DISCLAIMER,
} from '../../utils/slaUtils';

export default function AccountabilityView({
  issues = [],
  onOpenIssueDetail,
  currentTime,
}) {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // 1. Dashboard Metrics Calculations (Preserved exact logic)
  const metrics = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((i) => i.status === 'Open').length;
    const inProgress = issues.filter((i) => i.status === 'In Progress').length;
    const submitted = issues.filter((i) => i.status === 'Resolution Submitted').length;
    const resolved = issues.filter((i) => i.status === 'Resolved').length;

    // Active issues (open or in progress)
    const activeOpenTotal = open + inProgress;

    // High priority active
    const highPriorityActive = issues.filter(
      (i) => (i.status === 'Open' || i.status === 'In Progress') && i.priority === 'High'
    );

    // Resolution-submitted awaiting verification
    const awaitingVerification = issues.filter((i) => i.status === 'Resolution Submitted');

    // Verified resolved issues
    const verifiedResolved = issues.filter((i) => i.status === 'Resolved');

    // Citizen challenged issues
    const challengedIssues = issues.filter((i) => i.isChallenged);

    // Rejection events in timeline
    let rejectionCount = 0;
    const rejectedIssuesList = [];
    issues.forEach((issue) => {
      const rejections = (issue.timeline || []).filter((step) =>
        step.title.toLowerCase().includes('rejected')
      );
      if (rejections.length > 0) {
        rejectionCount += rejections.length;
        rejectedIssuesList.push({
          issue,
          rejectionStep: rejections[rejections.length - 1],
        });
      }
    });

    // Endorsement integrity
    const totalEndorsements = issues.reduce((acc, i) => acc + (i.supporters || 0), 0);
    const userEndorsedCount = issues.filter((i) => i.supportedByMe).length;

    // Category breakdown
    const categoryCounts = {};
    issues.forEach((i) => {
      categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
    });

    // New Town Action Area location breakdown
    const areaCounts = {
      'Action Area I': 0,
      'Action Area II': 0,
      'Action Area III': 0,
      'Major Arterial Road & Perimeter': 0,
    };
    issues.forEach((i) => {
      if (i.area && areaCounts[i.area] !== undefined) {
        areaCounts[i.area] += 1;
      } else if (i.location && i.location.includes('Action Area I')) {
        areaCounts['Action Area I'] += 1;
      } else if (i.location && i.location.includes('Action Area II')) {
        areaCounts['Action Area II'] += 1;
      } else if (i.location && i.location.includes('Action Area III')) {
        areaCounts['Action Area III'] += 1;
      } else {
        areaCounts['Major Arterial Road & Perimeter'] = (areaCounts['Major Arterial Road & Perimeter'] || 0) + 1;
      }
    });

    // Combined recent audit events across all issues
    const allEvents = [];
    issues.forEach((issue) => {
      (issue.timeline || []).forEach((step, idx) => {
        allEvents.push({
          ...step,
          eventId: `${issue.id}-evt-${idx}`,
          issueId: issue.id,
          issueTitle: issue.title,
          issueStatus: issue.status,
          category: issue.category,
        });
      });
    });

    // Reverse to show latest first
    allEvents.reverse();

    // Live SLA overdue calculations
    const overdueIssues = issues.filter(
      (i) => getDeadlineStatus(i, currentTime) === 'Overdue'
    );
    const sortedOverdueIssues = sortOverdueIssues(overdueIssues);

    // Median resolution time strictly from verified tickets with valid ISO timestamps
    const medianResolution = calculateMedianResolutionTime(issues);

    return {
      total,
      open,
      inProgress,
      activeOpenTotal,
      highPriorityActive,
      submitted,
      awaitingVerification,
      resolved,
      verifiedResolved,
      challengedIssues,
      rejectionCount,
      rejectedIssuesList,
      totalEndorsements,
      userEndorsedCount,
      categoryCounts,
      areaCounts,
      overdueIssues,
      sortedOverdueIssues,
      medianResolution,
      allEvents, // full history preserved
    };
  }, [issues, currentTime]);

  // Status breakdown data for horizontal bars
  const statusBreakdown = [
    {
      label: 'Open',
      count: metrics.open,
      color: 'bg-amber-500',
      pct: metrics.total > 0 ? Math.round((metrics.open / metrics.total) * 100) : 0,
    },
    {
      label: 'In Progress',
      count: metrics.inProgress,
      color: 'bg-sky-600',
      pct: metrics.total > 0 ? Math.round((metrics.inProgress / metrics.total) * 100) : 0,
    },
    {
      label: 'Awaiting Verification',
      count: metrics.submitted,
      color: 'bg-purple-500',
      pct: metrics.total > 0 ? Math.round((metrics.submitted / metrics.total) * 100) : 0,
    },
    {
      label: 'Resolved',
      count: metrics.resolved,
      color: 'bg-slate-400',
      pct: metrics.total > 0 ? Math.round((metrics.resolved / metrics.total) * 100) : 0,
    },
  ];

  // Category breakdown data for horizontal bars
  const categoryBreakdown = Object.entries(metrics.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => ({
      label: cat,
      count,
      pct: metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0,
    }));

  // Location breakdown data for horizontal bars
  const locationBreakdown = Object.entries(metrics.areaCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([area, count]) => ({
      label: area,
      count,
      pct: metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0,
    }));

  const displayedEvents = showAllEvents ? metrics.allEvents : metrics.allEvents.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="pb-3 border-b border-slate-200 text-left">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
          Accountability Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Resolution outcomes, SLA response times, and public works audit history across New Town, Kolkata.
        </p>
      </div>

      {/* 1. Primary Metrics Row (4 Compact Cards) */}
      <section aria-label="Key Accountability Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Metric 1: Total Reports */}
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 text-left">
            <span className="text-xs font-medium text-slate-500 block">
              Total Reports
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {metrics.total}
            </div>
          </div>

          {/* Metric 2: Open Issues */}
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Open Issues
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {metrics.open}
            </div>
          </div>

          {/* Metric 3: Awaiting Verification */}
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Awaiting Verification
              </span>
              <span className="w-2 h-2 rounded-full bg-purple-500" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {metrics.submitted}
            </div>
          </div>

          {/* Metric 4: Overdue */}
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Overdue
              </span>
              {metrics.overdueIssues.length > 0 ? (
                <span className="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              )}
            </div>
            <div
              className={`text-2xl font-bold mt-1 ${
                metrics.overdueIssues.length > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {metrics.overdueIssues.length}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Secondary Summary Section */}
      <section
        aria-label="Secondary Metrics"
        className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-3.5"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          {/* In Progress */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              In Progress
            </span>
            <div className="text-lg font-bold text-slate-900">
              {metrics.inProgress}
            </div>
            <span className="text-[11px] text-slate-500 block">Crew dispatched</span>
          </div>

          {/* Verified Resolved */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Verified Resolved
            </span>
            <div className="text-lg font-bold text-slate-900">
              {metrics.resolved}
            </div>
            <span className="text-[11px] text-slate-500 block">Independently confirmed</span>
          </div>

          {/* Median Resolution Time */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Median Resolution Time
            </span>
            <div className="text-lg font-bold text-slate-900">
              {metrics.medianResolution.display}
            </div>
            <span
              className="text-[11px] text-slate-500 block truncate"
              title={metrics.medianResolution.subtext}
            >
              {metrics.medianResolution.subtext}
            </span>
          </div>

          {/* Challenges & Rejections */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Challenges & Rejections
            </span>
            <div className="text-lg font-bold text-slate-900">
              {metrics.challengedIssues.length + metrics.rejectionCount}
            </div>
            <span className="text-[11px] text-slate-500 block">
              {metrics.challengedIssues.length} challenged &bull; {metrics.rejectionCount} rejected
            </span>
          </div>
        </div>
      </section>

      {/* 3. Endorsement Information (Compact & Neutral) */}
      <section aria-label="Endorsement Summary">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-slate-900 font-semibold">{metrics.totalEndorsements} endorsements</strong> across reports ({metrics.userEndorsedCount} by you)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            One endorsement per citizen enforced
          </span>
        </div>
      </section>

      {/* 4. Issue Breakdowns (Consistent, Compact Horizontal Bars) */}
      <section aria-label="Issue Breakdowns">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Panel 1: Lifecycle Status Distribution */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">
                  Lifecycle Status
                </h2>
                <span className="text-xs text-slate-500">
                  {metrics.total} Total Issues
                </span>
              </div>

              <div className="space-y-3 pt-3">
                {statusBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>{item.label}</span>
                      <span className="text-slate-500">
                        {item.count} ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${item.color}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 2: Civic Reports by Category */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">
                  Reports by Category
                </h2>
                <span className="text-xs text-slate-500">
                  {Object.keys(metrics.categoryCounts).length} Categories
                </span>
              </div>

              <div className="space-y-3 pt-3">
                {categoryBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span className="truncate max-w-[150px]">{item.label}</span>
                      <span className="text-slate-500 shrink-0">
                        {item.count} ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-700 rounded-full transition-all duration-300"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 3: Location Breakdown by Action Area */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">
                  Action Area Breakdown
                </h2>
                <span className="text-xs text-slate-500">
                  New Town Sectors
                </span>
              </div>

              <div className="space-y-3 pt-3">
                {locationBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span className="truncate max-w-[150px]">{item.label}</span>
                      <span className="text-slate-500 shrink-0">
                        {item.count} ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-700 rounded-full transition-all duration-300"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Overdue Issues (Compact, Readable List) */}
      <section aria-label="Overdue Issues" className="text-left space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pb-1.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Overdue Issues</h2>
            {metrics.sortedOverdueIssues.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                {metrics.sortedOverdueIssues.length}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">
            Target SLA: High (24h) &bull; Medium (72h) &bull; Low (7d)
          </span>
        </div>

        {metrics.sortedOverdueIssues.length > 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {metrics.sortedOverdueIssues.map((issue) => {
              const timeRemaining = formatTimeRemaining(issue, currentTime);
              return (
                <div
                  key={issue.id}
                  onClick={() => onOpenIssueDetail(issue.id)}
                  className="p-3 sm:py-2.5 sm:px-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-mono text-xs font-semibold text-slate-500 shrink-0">
                      #{issue.id}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug break-words">
                      {issue.title}
                    </h3>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-500">{issue.location}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pt-1 sm:pt-0">
                    <PriorityBadge priority={issue.priority} size="sm" />
                    <StatusBadge status={issue.status} size="sm" />
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Overdue {timeRemaining}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenIssueDetail(issue.id);
                      }}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center text-xs text-slate-500">
            No overdue issues. All reports are within target resolution deadlines.
          </div>
        )}
      </section>

      {/* 6. Oversight & Verification (Single Clean Section, 3 Compact Columns) */}
      <section aria-label="Accountability Oversight" className="text-left space-y-2">
        <div className="pb-1.5 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Oversight & Verification</h2>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 divide-y md:divide-y-0 md:divide-x divide-slate-100 grid grid-cols-1 md:grid-cols-3">
          {/* Column 1: High-Priority Active */}
          <div className="p-3.5 space-y-2 text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                High-Priority Active
              </h3>
              <span className="text-xs font-bold text-slate-600">
                {metrics.highPriorityActive.length}
              </span>
            </div>

            {metrics.highPriorityActive.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {metrics.highPriorityActive.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => onOpenIssueDetail(issue.id)}
                    className="py-2 px-1 hover:bg-slate-50 rounded transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs text-slate-400 mr-1.5 shrink-0">
                        #{issue.id}
                      </span>
                      <span className="text-xs font-medium text-slate-900 leading-snug break-words">
                        {issue.title}
                      </span>
                    </div>
                    <PriorityBadge priority={issue.priority} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 italic">No high-priority active issues.</p>
            )}
          </div>

          {/* Column 2: Awaiting Verification */}
          <div className="p-3.5 space-y-2 text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Awaiting Verification
              </h3>
              <span className="text-xs font-bold text-slate-600">
                {metrics.awaitingVerification.length}
              </span>
            </div>

            {metrics.awaitingVerification.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {metrics.awaitingVerification.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => onOpenIssueDetail(issue.id)}
                    className="py-2 px-1 hover:bg-slate-50 rounded transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs text-slate-400 mr-1.5 shrink-0">
                        #{issue.id}
                      </span>
                      <span className="text-xs font-medium text-slate-900 leading-snug break-words">
                        {issue.title}
                      </span>
                    </div>
                    <StatusBadge status={issue.status} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 italic">No reports awaiting verification.</p>
            )}
          </div>

          {/* Column 3: Challenges & Rejections */}
          <div className="p-3.5 space-y-2 text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Challenges & Rejections
              </h3>
              <span className="text-xs font-bold text-slate-600">
                {metrics.challengedIssues.length + metrics.rejectedIssuesList.length}
              </span>
            </div>

            {metrics.challengedIssues.length > 0 || metrics.rejectedIssuesList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {metrics.challengedIssues.map((issue) => (
                  <div
                    key={`ch-${issue.id}`}
                    onClick={() => onOpenIssueDetail(issue.id)}
                    className="py-2 px-1 hover:bg-slate-50 rounded transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs text-slate-400 mr-1.5 shrink-0">
                        #{issue.id}
                      </span>
                      <span className="text-xs font-medium text-slate-900 leading-snug break-words">
                        {issue.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded shrink-0">
                      Challenged
                    </span>
                  </div>
                ))}

                {metrics.rejectedIssuesList.map(({ issue }) => (
                  <div
                    key={`rej-${issue.id}`}
                    onClick={() => onOpenIssueDetail(issue.id)}
                    className="py-2 px-1 hover:bg-slate-50 rounded transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs text-slate-400 mr-1.5 shrink-0">
                        #{issue.id}
                      </span>
                      <span className="text-xs font-medium text-slate-900 leading-snug break-words">
                        {issue.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded shrink-0">
                      Rework
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 italic">No challenged resolutions.</p>
            )}
          </div>
        </div>
      </section>

      {/* 7. Recent Audit Activity (Normal page flow, no nested scrollbar) */}
      <section aria-label="Recent Audit Activity" className="text-left space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Recent Audit Activity</h2>
            <span className="text-xs text-slate-400">
              ({metrics.allEvents.length} events)
            </span>
          </div>
          {metrics.allEvents.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 focus:outline-none focus-visible:underline"
            >
              {showAllEvents ? 'Show less' : `Show all (${metrics.allEvents.length})`}
            </button>
          )}
        </div>

        {metrics.allEvents.length > 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
            {displayedEvents.map((event) => (
              <div
                key={event.eventId}
                onClick={() => onOpenIssueDetail(event.issueId)}
                className="py-2.5 px-3 sm:px-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-xs"
              >
                <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-mono text-xs font-semibold text-slate-400 shrink-0">
                    #{event.issueId}
                  </span>
                  <span className="font-semibold text-slate-900">{event.title}</span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-slate-500">by {event.author}</span>
                  {event.note && (
                    <>
                      <span className="text-slate-300 hidden sm:inline">&bull;</span>
                      <span className="text-slate-600 line-clamp-1">{event.note}</span>
                    </>
                  )}
                </div>

                <div className="shrink-0 text-[11px] text-slate-400 font-mono">
                  {event.time}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center text-xs text-slate-500">
            No audit activity recorded.
          </div>
        )}
      </section>

      {/* 8. How Accountability Works (Compact Collapsible) */}
      <section aria-label="Accountability Rules" className="text-left">
        <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
            className="w-full p-3 sm:px-4 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/60 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            aria-expanded={isMethodologyOpen}
          >
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>How accountability works</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-normal">
              <span>{isMethodologyOpen ? 'Hide details' : 'Show details'}</span>
              {isMethodologyOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </button>

          {isMethodologyOpen && (
            <div className="p-4 pt-1 border-t border-slate-200 space-y-3 text-xs text-slate-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 leading-relaxed pt-2">
                <div>
                  <strong className="text-slate-900 block mb-0.5">Illustrative SLA Targets</strong>
                  <p className="text-[11px] text-slate-500">
                    Issues are marked Overdue when target resolution deadlines pass before independent verification: High (24h), Medium (72h), and Low (7d).
                  </p>
                </div>

                <div>
                  <strong className="text-slate-900 block mb-0.5">Submitted vs. Verified Resolution</strong>
                  <p className="text-[11px] text-slate-500">
                    A fix submitted by maintenance staff remains awaiting verification until an independent civic verifier or resident confirms the repair.
                  </p>
                </div>

                <div>
                  <strong className="text-slate-900 block mb-0.5">Median Resolution Time</strong>
                  <p className="text-[11px] text-slate-500">
                    Calculated strictly from verified tickets with recorded intake and completion timestamps to prevent skewed or synthetic metrics.
                  </p>
                </div>

                <div>
                  <strong className="text-slate-900 block mb-0.5">Challenges & Rejected Fixes</strong>
                  <p className="text-[11px] text-slate-500">
                    Logged as quality oversight events in the audit trail. They prompt crew rework and hold maintenance accountable without inflating report counts.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-400 italic">
                * {SLA_DISCLAIMER}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
