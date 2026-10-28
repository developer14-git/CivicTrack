import { useState, useMemo } from 'react';
import {
  ThumbsUp,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MapPin,
  CheckCircle2,
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
    <div className="space-y-6 animate-editorial-enter">
      {/* Page Header */}
      <div className="pb-3.5 border-b border-slate-200/90 text-left">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 rounded-md">
            MUNICIPAL AUDIT & SLA REPORT
          </span>
          <span className="text-xs text-slate-400 font-medium">New Town, Kolkata</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
          Accountability Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Resolution outcomes, SLA response times, and public works audit history across New Town, Kolkata.
        </p>
      </div>

      {/* 1. Primary Metrics Row (4 Compact Cards) */}
      <section aria-label="Key Accountability Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Metric 1: Total Reports */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 text-left shadow-2xs bg-editorial-paper hover:-translate-y-0.5 transition-transform duration-200">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Total Reports
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1 leading-none tabular-editorial">
              {metrics.total}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Logged municipal complaints</p>
          </div>

          {/* Metric 2: Open Issues */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 text-left shadow-2xs bg-editorial-paper hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Open Issues
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-100" aria-hidden="true" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 leading-none tabular-editorial">
              {metrics.open}
            </div>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              {metrics.total > 0 ? ((metrics.open / metrics.total) * 100).toFixed(1) : 0}% of census
            </p>
          </div>

          {/* Metric 3: Awaiting Verification */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 text-left shadow-2xs bg-editorial-paper hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Awaiting Verification
              </span>
              <span className="w-2 h-2 rounded-full bg-purple-500 ring-2 ring-purple-100" aria-hidden="true" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 leading-none tabular-editorial">
              {metrics.submitted}
            </div>
            <p className="text-[11px] text-purple-700 font-medium mt-1">
              {metrics.total > 0 ? ((metrics.submitted / metrics.total) * 100).toFixed(1) : 0}% of census
            </p>
          </div>

          {/* Metric 4: Overdue */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 text-left shadow-2xs bg-editorial-paper hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Overdue
              </span>
              {metrics.overdueIssues.length > 0 ? (
                <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-100" aria-hidden="true" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" aria-hidden="true" />
              )}
            </div>
            <div
              className={`text-3xl font-black mt-1 leading-none tabular-editorial ${
                metrics.overdueIssues.length > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {metrics.overdueIssues.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Exceeded standard SLA deadline</p>
          </div>
        </div>
      </section>

      {/* 2. Secondary Summary Section */}
      <section
        aria-label="Secondary Metrics"
        className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs"
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
        <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 shadow-2xs">
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
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 text-left flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">
                  Lifecycle Status
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {metrics.total} Total Issues
                </span>
              </div>

              <div className="space-y-3 pt-3">
                {statusBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{item.label}</span>
                      <span className="text-slate-500 font-medium">
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
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 text-left flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">
                  Reports by Category
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {Object.keys(metrics.categoryCounts).length} Categories
                </span>
              </div>

              <div className="space-y-3 pt-3">
                {categoryBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span className="truncate max-w-[150px]">{item.label}</span>
                      <span className="text-slate-500 font-medium shrink-0">
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
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 text-left flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">
                  Action Area Breakdown
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  New Town Sectors
                </span>
              </div>

              <div className="space-y-3 pt-3">
                {locationBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span className="truncate max-w-[150px]">{item.label}</span>
                      <span className="text-slate-500 font-medium shrink-0">
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
      <section aria-label="Overdue issues" className="text-left space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pb-2 border-b border-slate-200/90">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Overdue issues</h2>
            {metrics.sortedOverdueIssues.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {metrics.sortedOverdueIssues.length}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Target resolution SLA: High (24h) &bull; Medium (72h) &bull; Low (7d)
          </p>
        </div>

        {metrics.sortedOverdueIssues.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
            {/* Desktop Column Headers */}
            <div className="hidden md:flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="flex-1 min-w-0 pr-4">Issue</div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-20 shrink-0 text-left">Priority</div>
                <div className="w-28 shrink-0 text-left">Status</div>
                <div className="w-28 shrink-0 text-right">Overdue by</div>
                <div className="w-24 shrink-0 text-right">Action</div>
              </div>
            </div>

            {/* Issues List */}
            <div>
              {metrics.sortedOverdueIssues.map((issue) => {
                const rawRemaining = formatTimeRemaining(issue, currentTime);
                const durationOnly = rawRemaining.replace(/^Overdue\s*(by\s*)?/i, '').trim();
                const overdueDisplay = durationOnly ? `${durationOnly} overdue` : 'Overdue';

                return (
                  <div
                    key={issue.id}
                    onClick={() => onOpenIssueDetail(issue.id)}
                    className="group px-4 py-3 hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0 flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4 text-xs"
                  >
                    {/* Issue Details: ID, Title, and Location */}
                    <div className="min-w-0 flex-1 md:pr-4">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0 select-all">
                          #{issue.id}
                        </span>
                        <h3
                          className="text-sm font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-2 md:truncate"
                          title={issue.title}
                        >
                          {issue.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        <span className="truncate" title={issue.location}>{issue.location}</span>
                      </div>
                    </div>

                    {/* Attributes & Action */}
                    <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 pt-2 md:pt-0 border-t border-slate-100 md:border-t-0 md:gap-4 shrink-0">
                      <div className="flex items-center gap-3 md:gap-4">
                        {/* Priority */}
                        <div className="md:w-20 shrink-0 flex items-center">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                issue.priority === 'High'
                                  ? 'bg-rose-500'
                                  : issue.priority === 'Medium'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                              aria-hidden="true"
                            />
                            <span>{issue.priority}</span>
                          </span>
                        </div>

                        {/* Status */}
                        <div className="md:w-28 shrink-0 flex items-center">
                          <StatusBadge status={issue.status} size="xs" />
                        </div>

                        {/* Overdue Duration */}
                        <div className="md:w-28 shrink-0 md:text-right flex items-center md:justify-end">
                          <span className="text-xs font-mono font-bold text-rose-600">
                            {overdueDisplay}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="md:w-24 shrink-0 text-right flex items-center justify-end ml-auto md:ml-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenIssueDetail(issue.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 group-hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded py-0.5 cursor-pointer"
                          aria-label={`View issue #${issue.id}: ${issue.title}`}
                        >
                          <span>View issue</span>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-600 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center text-xs text-slate-500 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-2.5">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">No overdue issues</p>
            <p className="text-xs text-slate-500 mt-0.5">All active reports are currently within their target SLA resolution windows.</p>
          </div>
        )}
      </section>

      {/* 6. Oversight & Verification (Single Clean Section, 3 Compact Columns) */}
      <section aria-label="Accountability Oversight" className="text-left space-y-2">
        <div className="pb-1.5 border-b border-slate-200/90">
          <h2 className="text-base font-bold text-slate-900">Oversight & Verification</h2>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 divide-y md:divide-y-0 md:divide-x divide-slate-100 grid grid-cols-1 md:grid-cols-3 shadow-2xs overflow-hidden">
          {/* Column 1: High-Priority Active */}
          <div className="p-4 space-y-2.5 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                High-Priority Active
              </h3>
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                {metrics.highPriorityActive.length}
              </span>
            </div>

            {metrics.highPriorityActive.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {metrics.highPriorityActive.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => onOpenIssueDetail(issue.id)}
                    className="py-2.5 px-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mr-1.5 shrink-0">
                        #{issue.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 leading-snug break-words">
                        {issue.title}
                      </span>
                    </div>
                    <PriorityBadge priority={issue.priority} size="xs" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 italic text-center">No high-priority active issues.</p>
            )}
          </div>

          {/* Column 2: Awaiting Verification */}
          <div className="p-4 space-y-2.5 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Awaiting Verification
              </h3>
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                {metrics.awaitingVerification.length}
              </span>
            </div>

            {metrics.awaitingVerification.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {metrics.awaitingVerification.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => onOpenIssueDetail(issue.id)}
                    className="py-2.5 px-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mr-1.5 shrink-0">
                        #{issue.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 leading-snug break-words">
                        {issue.title}
                      </span>
                    </div>
                    <StatusBadge status={issue.status} size="xs" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 italic text-center">No reports awaiting verification.</p>
            )}
          </div>

          {/* Column 3: Challenges & Rejections */}
          <div className="p-4 space-y-2.5 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Challenges & Rejections
              </h3>
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                {metrics.challengedIssues.length + metrics.rejectedIssuesList.length}
              </span>
            </div>

            {metrics.challengedIssues.length > 0 || metrics.rejectedIssuesList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {metrics.challengedIssues.map((issue) => (
                  <div
                    key={`ch-${issue.id}`}
                    onClick={() => onOpenIssueDetail(issue.id)}
                    className="py-2.5 px-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mr-1.5 shrink-0">
                        #{issue.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 leading-snug break-words">
                        {issue.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded-md shrink-0">
                      Challenged
                    </span>
                  </div>
                ))}

                {metrics.rejectedIssuesList.map(({ issue }) => (
                  <div
                    key={`rej-${issue.id}`}
                    onClick={() => onOpenIssueDetail(issue.id)}
                    className="py-2.5 px-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mr-1.5 shrink-0">
                        #{issue.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 leading-snug break-words">
                        {issue.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md shrink-0">
                      Rework
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 italic text-center">No challenged resolutions.</p>
            )}
          </div>
        </div>
      </section>

      {/* 7. Recent Audit Activity (Normal page flow, no nested scrollbar) */}
      <section aria-label="Recent Audit Activity" className="text-left space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/90">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Recent Audit Activity</h2>
            <span className="text-xs text-slate-500 font-medium">
              ({metrics.allEvents.length} events recorded)
            </span>
          </div>
          {metrics.allEvents.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 focus:outline-none focus-visible:underline cursor-pointer transition-colors"
            >
              {showAllEvents ? 'Show less' : `Show all (${metrics.allEvents.length})`}
            </button>
          )}
        </div>

        {metrics.allEvents.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/90 divide-y divide-slate-100 shadow-2xs overflow-hidden">
            {displayedEvents.map((event) => (
              <div
                key={event.eventId}
                onClick={() => onOpenIssueDetail(event.issueId)}
                className="py-3 px-3.5 sm:px-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-xs"
              >
                <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
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
          <div className="bg-white rounded-xl border border-slate-200/90 p-6 text-center text-xs text-slate-500 shadow-2xs">
            No audit activity recorded.
          </div>
        )}
      </section>

      {/* 8. How Accountability Works (Compact Collapsible) */}
      <section aria-label="Accountability Rules" className="text-left">
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
            className="w-full p-3.5 sm:px-4 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
            aria-expanded={isMethodologyOpen}
          >
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span className="font-bold text-slate-800">How accountability works</span>
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
            <div className="p-4 pt-2 border-t border-slate-100 space-y-3 text-xs text-slate-600 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 leading-relaxed pt-1">
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
