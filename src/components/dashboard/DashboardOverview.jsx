import { useState, useMemo } from 'react';
import {
  Plus,
  ArrowRight,
  Eye,
  Flame,
  FileText,
  BarChart3,
  UserCheck,
  MapPin,
  AlertCircle,
  Wrench,
  Clock,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import GeographicMap from '../map/GeographicMap';
import { computeHotspots } from '../../utils/mapUtils';
import { resolveIssueCoordinates, CATEGORIES } from '../../data/mockIssues';

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

export default function DashboardOverview({
  issues = [],
  onOpenReportModal,
  onViewAllIssues,
  onNavigateToMap,
  onOpenIssueDetail,
  onSelectStatusFilter,
  onNavigateToMyReports,
  onNavigateToAnalytics,
}) {
  const [hoveredIssueId, setHoveredIssueId] = useState(null);

  // Compute hotspots and mapped issue count from real issue data
  const hotspots = useMemo(() => computeHotspots(issues), [issues]);
  const mappedCount = useMemo(
    () => issues.filter((i) => resolveIssueCoordinates(i) !== null).length,
    [issues]
  );

  // Active (unresolved) issues for the side list
  const activeSideIssues = useMemo(() => {
    return issues
      .filter((i) => i.status !== 'Resolved')
      .slice(0, 6);
  }, [issues]);

  // 4 Primary Summary Metrics calculated dynamically
  const openCount = issues.filter((i) => i.status === 'Open').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const awaitingVerificationCount = issues.filter(
    (i) => i.status === 'Resolution Submitted' || i.status === 'Awaiting Verification'
  ).length;
  const verifiedResolvedCount = issues.filter((i) => i.status === 'Resolved').length;

  // Category statistics breakdown dynamically calculated from actual reports
  const categoryStats = useMemo(() => {
    const counts = {};
    issues.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return CATEGORIES.map((cat) => ({
      name: cat,
      count: counts[cat] || 0,
      percentage: issues.length > 0 ? Math.round(((counts[cat] || 0) / issues.length) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }, [issues]);

  // Short list of recent reports sorted by activity
  const recentReports = [...issues]
    .sort((a, b) => {
      if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
      if (b.status === 'Resolved' && a.status !== 'Resolved') return -1;
      return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
    })
    .slice(0, 5);

  const handleMetricClick = (status) => {
    if (onSelectStatusFilter) {
      onSelectStatusFilter(status);
    } else if (onViewAllIssues) {
      onViewAllIssues();
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in text-left">
      {/* 1. Hero Section for New Town, Kolkata */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 rounded-full shadow-2xs">
            New Town • Kolkata
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Action Area I, II & III Municipal Grievance Tracking
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Report civic problems in New Town.
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Report potholes, broken streetlights, overflowing garbage, and water leaks. Track municipal field repairs with transparent SLAs and independent community verification.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Report a Problem</span>
          </button>

          <button
            type="button"
            onClick={onViewAllIssues}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <span>Browse All Reports</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </section>

      {/* 2. Primary Summary Report-Statistic Cards */}
      <section aria-label="Key Grievance Summary Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Open Issues */}
          <button
            type="button"
            onClick={() => handleMetricClick('Open')}
            className="group bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 text-left hover:border-amber-300 hover:shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50/80 border border-amber-200/60 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Dispatch
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mt-3 mb-1">
              {openCount}
            </div>
            <div className="text-sm font-semibold text-slate-800">Open Issues</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting municipal dispatch</p>
          </button>

          {/* Card 2: In Progress */}
          <button
            type="button"
            onClick={() => handleMetricClick('In Progress')}
            className="group bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 text-left hover:border-sky-300 hover:shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 border border-sky-200/80 flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-800 bg-sky-50/80 border border-sky-200/60 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Active Repair
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mt-3 mb-1">
              {inProgressCount}
            </div>
            <div className="text-sm font-semibold text-slate-800">In Progress</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Field crew actively on-site</p>
          </button>

          {/* Card 3: Awaiting Verification */}
          <button
            type="button"
            onClick={() => handleMetricClick('Resolution Submitted')}
            className="group bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 text-left hover:border-purple-300 hover:shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/80 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-purple-800 bg-purple-50/80 border border-purple-200/60 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Citizen Check
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mt-3 mb-1">
              {awaitingVerificationCount}
            </div>
            <div className="text-sm font-semibold text-slate-800">Awaiting Verification</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Submitted, pending citizen check</p>
          </button>

          {/* Card 4: Verified Resolved */}
          <button
            type="button"
            onClick={() => handleMetricClick('Resolved')}
            className="group bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 text-left hover:border-emerald-300 hover:shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Closed
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mt-3 mb-1">
              {verifiedResolvedCount}
            </div>
            <div className="text-sm font-semibold text-slate-800">Verified Resolved</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Closed with verification proof</p>
          </button>
        </div>
      </section>

      {/* 3. New Town Issues Map: Main Visual Focus + Areas Needing Attention */}
      <section aria-label="New Town Issues Map" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/90">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">New Town Issues Map</h2>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 rounded-full">
                {mappedCount} reports mapped on GIS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live geographic issue distribution across Action Area I, II & III • OpenStreetMap
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToMap && (
              <button
                type="button"
                onClick={onNavigateToMap}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1.5 focus:outline-none focus-visible:underline cursor-pointer transition-colors"
              >
                <span>Explore full map</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Layout: Map Canvas (Left) + Areas Needing Attention Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Real Leaflet Map Canvas */}
          <div className="lg:col-span-7 xl:col-span-8 rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs">
            <GeographicMap
              issues={issues}
              onOpenIssueDetail={onOpenIssueDetail}
              height="480px"
              isCompact={true}
              highlightedIssueId={hoveredIssueId}
            />
          </div>

          {/* Clean Areas Needing Attention Side Panel */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">Areas Needing Attention</h3>
                    <p className="text-[10px] text-slate-400">High-density civic hotspots</p>
                  </div>
                </div>
                {onNavigateToMap && (
                  <button
                    type="button"
                    onClick={onNavigateToMap}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    View map →
                  </button>
                )}
              </div>

              {/* Hotspot Chips */}
              <div className="flex flex-wrap gap-1.5">
                {hotspots.slice(0, 4).map((hotspot) => (
                  <button
                    key={hotspot.id}
                    type="button"
                    onClick={onNavigateToMap}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    title={`View ${hotspot.openCount} open reports at ${hotspot.name}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="truncate max-w-[120px]">{hotspot.landmarkName || hotspot.name}</span>
                    <strong className="text-slate-900 font-bold">({hotspot.openCount})</strong>
                  </button>
                ))}
              </div>

              {/* Active Complaints List */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Complaints
                  </span>
                  <span className="text-[10px] text-slate-400">Hover highlights pin</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {activeSideIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onMouseEnter={() => setHoveredIssueId(issue.id)}
                      onMouseLeave={() => setHoveredIssueId(null)}
                      className={`py-2 px-2 flex items-center justify-between gap-2.5 rounded-lg transition-colors ${
                        hoveredIssueId === issue.id ? 'bg-emerald-50/70 border border-emerald-200/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded">#{issue.id}</span>
                          <h4 className="text-xs font-semibold text-slate-900 truncate">{issue.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{issue.location || issue.building || 'New Town, Kolkata'}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={issue.status} size="xs" />
                        <button
                          type="button"
                          onClick={() => onOpenIssueDetail(issue.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Inspect issue report"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom link to full map */}
            <div className="pt-3 border-t border-slate-100 mt-2.5">
              <button
                type="button"
                onClick={onNavigateToMap}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200/90 cursor-pointer transition-colors shadow-2xs"
              >
                <span>Explore Full Map & Hotspots</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Compact Category Statistics Section */}
      <section aria-label="Category Breakdown" className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/90">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900">Issues by Category</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Infrastructure complaint distribution across 12 civic categories in New Town
            </p>
          </div>
          <button
            type="button"
            onClick={onViewAllIssues}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Filter categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {categoryStats.slice(0, 12).map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={onViewAllIssues}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer group flex flex-col justify-between"
            >
              <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                {cat.name}
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-slate-900 leading-none">
                  {cat.count}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {cat.percentage}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(8, cat.percentage * 2))}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Recent Reports Section */}
      <section aria-label="Recent Reports" className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/90">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Reports</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest civic maintenance submissions across New Town</p>
          </div>
          <button
            type="button"
            onClick={onViewAllIssues}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 focus:outline-none focus-visible:underline cursor-pointer transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {recentReports.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {recentReports.map((issue) => {
              const ageText = formatAge(issue.reportedAt, issue.reportedDateDisplay);
              const locationText = issue.location || `${issue.building}${issue.floorRoom ? ` • ${issue.floorRoom}` : ''}`;

              return (
                <div
                  key={issue.id}
                  onClick={() => onOpenIssueDetail(issue.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenIssueDetail(issue.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${issue.title}, ${locationText}, category: ${issue.category}, status: ${issue.status}, priority: ${issue.priority}`}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-inset"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          #{issue.id}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900 leading-snug break-words">
                          {issue.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                        <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[11px]">
                          {issue.category}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                          <span>{locationText}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{ageText}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pt-1 sm:pt-0">
                      <StatusBadge status={issue.status} size="sm" />
                      {issue.priority && (
                        <PriorityBadge priority={issue.priority} size="sm" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center shadow-2xs">
            <p className="text-sm text-slate-600 mb-2">No active civic reports right now.</p>
            <button
              type="button"
              onClick={onOpenReportModal}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Report the first issue
            </button>
          </div>
        )}
      </section>

      {/* 6. Quick Actions Section */}
      <section aria-label="Quick Actions" className="pt-1">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={onOpenReportModal}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer shadow-2xs hover:shadow-xs group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Report a Problem</div>
              <div className="text-[11px] text-slate-500">Submit a new civic grievance</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onViewAllIssues}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer shadow-2xs hover:shadow-xs group"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 group-hover:bg-sky-100 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Browse All Reports</div>
              <div className="text-[11px] text-slate-500">Filter by category and area</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToMyReports || onViewAllIssues}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer shadow-2xs hover:shadow-xs group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">My Submissions</div>
              <div className="text-[11px] text-slate-500">Track personal citizen reports</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToAnalytics || onViewAllIssues}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer shadow-2xs hover:shadow-xs group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Accountability Statistics</div>
              <div className="text-[11px] text-slate-500">Inspect SLA & resolution rates</div>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
