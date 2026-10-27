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
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import GeographicMap from '../map/GeographicMap';
import { computeHotspots } from '../../utils/mapUtils';
import { resolveIssueCoordinates } from '../../data/mockIssues';

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
      .slice(0, 5);
  }, [issues]);

  // 4 Primary Summary Metrics calculated dynamically
  const openCount = issues.filter((i) => i.status === 'Open').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const awaitingVerificationCount = issues.filter(
    (i) => i.status === 'Resolution Submitted' || i.status === 'Awaiting Verification'
  ).length;
  const verifiedResolvedCount = issues.filter((i) => i.status === 'Resolved').length;

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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* 1. Hero Section for New Town, Kolkata */}
      <section className="text-left space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            New Town • Kolkata
          </span>
          <span className="text-xs text-slate-500">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Report a Problem</span>
          </button>

          <button
            type="button"
            onClick={onViewAllIssues}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            <span>Browse All Reports</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </section>

      {/* 2. Primary Summary Metrics */}
      <section aria-label="Key Grievance Summary Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          {/* 1: Open Issues */}
          <button
            type="button"
            onClick={() => handleMetricClick('Open')}
            className="bg-white rounded-lg border border-slate-200 p-3.5 text-left hover:border-slate-300 hover:bg-slate-50/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">Open Issues</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 leading-none">
              {openCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Awaiting municipal dispatch</p>
          </button>

          {/* 2: In Progress */}
          <button
            type="button"
            onClick={() => handleMetricClick('In Progress')}
            className="bg-white rounded-lg border border-slate-200 p-3.5 text-left hover:border-slate-300 hover:bg-slate-50/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">In Progress</span>
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-sky-100" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 leading-none">
              {inProgressCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Field crew actively on-site</p>
          </button>

          {/* 3: Awaiting Verification */}
          <button
            type="button"
            onClick={() => handleMetricClick('Resolution Submitted')}
            className="bg-white rounded-lg border border-slate-200 p-3.5 text-left hover:border-slate-300 hover:bg-slate-50/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">Awaiting Verification</span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-100" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 leading-none">
              {awaitingVerificationCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Submitted, pending citizen check</p>
          </button>

          {/* 4: Verified Resolved */}
          <button
            type="button"
            onClick={() => handleMetricClick('Resolved')}
            className="bg-white rounded-lg border border-slate-200 p-3.5 text-left hover:border-slate-300 hover:bg-slate-50/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">Verified Resolved</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 leading-none">
              {verifiedResolvedCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Closed with verification proof</p>
          </button>
        </div>
      </section>

      {/* 3. New Town Issues Map (Real Geographic Leaflet Map & Nearest Issues) */}
      <section aria-label="New Town Issues Map" className="space-y-3 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">New Town Issues Map</h2>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
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
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 focus:outline-none focus-visible:underline cursor-pointer"
              >
                <span>Explore full map</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Layout: Map Canvas (Left) + Nearest Reports (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Real Leaflet Map Preview */}
          <div className="lg:col-span-7 xl:col-span-8">
            <GeographicMap
              issues={issues}
              onOpenIssueDetail={onOpenIssueDetail}
              height="450px"
              isCompact={true}
              highlightedIssueId={hoveredIssueId}
            />
          </div>

          {/* Side Panel: Key Attention Areas & Nearest Active Complaints */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-900">Areas Needing Attention</h3>
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
                {hotspots.slice(0, 3).map((hotspot) => (
                  <button
                    key={hotspot.id}
                    type="button"
                    onClick={onNavigateToMap}
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                    title={`View ${hotspot.openCount} open reports at ${hotspot.name}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="truncate max-w-[110px]">{hotspot.landmarkName || hotspot.name}</span>
                    <strong className="text-slate-900">({hotspot.openCount})</strong>
                  </button>
                ))}
              </div>

              {/* Nearest Active Complaints List */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Active Complaints
                  </span>
                  <span className="text-[10px] text-slate-400">Hover highlights pin</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                  {activeSideIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onMouseEnter={() => setHoveredIssueId(issue.id)}
                      onMouseLeave={() => setHoveredIssueId(null)}
                      className={`py-1.5 flex items-center justify-between gap-2 rounded px-1 transition-colors ${
                        hoveredIssueId === issue.id ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500">#{issue.id}</span>
                          <h4 className="text-xs font-semibold text-slate-800 truncate">{issue.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {issue.location || issue.building || 'New Town, Kolkata'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <StatusBadge status={issue.status} size="xs" />
                        <button
                          type="button"
                          onClick={() => onOpenIssueDetail(issue.id)}
                          className="p-1 text-slate-400 hover:text-emerald-700 cursor-pointer"
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
            <div className="pt-2.5 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={onNavigateToMap}
                className="w-full py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200 cursor-pointer transition-colors"
              >
                <span>Explore Full Map & Hotspots</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Recent Reports (Compact, Readable List) */}
      <section className="space-y-3 text-left">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Reports</h2>
            <p className="text-xs text-slate-500">Latest civic maintenance submissions across New Town</p>
          </div>
          <button
            type="button"
            onClick={onViewAllIssues}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 focus:outline-none focus-visible:underline cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {recentReports.length > 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
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
                  className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-inset"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-slate-400 shrink-0">#{issue.id}</span>
                        <h3 className="text-sm font-semibold text-slate-900 leading-snug break-words">
                          {issue.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                        <span className="font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded text-[11px]">
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
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center shadow-2xs">
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

      {/* 5. Quick Actions Section */}
      <section aria-label="Quick Actions" className="pt-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-left">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={onOpenReportModal}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-left transition-colors flex items-center gap-3 cursor-pointer shadow-2xs"
          >
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Report a Problem</div>
              <div className="text-[11px] text-slate-500">Submit a new civic grievance</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onViewAllIssues}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-left transition-colors flex items-center gap-3 cursor-pointer shadow-2xs"
          >
            <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Browse All Reports</div>
              <div className="text-[11px] text-slate-500">Filter by category and area</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToMyReports || onViewAllIssues}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-left transition-colors flex items-center gap-3 cursor-pointer shadow-2xs"
          >
            <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">My Submissions</div>
              <div className="text-[11px] text-slate-500">Track personal citizen reports</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToAnalytics || onViewAllIssues}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-left transition-colors flex items-center gap-3 cursor-pointer shadow-2xs"
          >
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Accountability Statistics</div>
              <div className="text-[11px] text-slate-500">Inspect SLA & resolution rates</div>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
