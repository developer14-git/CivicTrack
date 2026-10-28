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
  Activity,
  CheckCircle2,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import GeographicMap from '../map/GeographicMap';
import CategoryDistributionChart from './CategoryDistributionChart';
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
      .slice(0, 8);
  }, [issues]);

  // 4 Primary Summary Metrics calculated dynamically from real dataset
  const totalCount = issues.length;
  const openCount = issues.filter((i) => i.status === 'Open').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const awaitingVerificationCount = issues.filter(
    (i) => i.status === 'Resolution Submitted' || i.status === 'Awaiting Verification'
  ).length;
  const verifiedResolvedCount = issues.filter((i) => i.status === 'Resolved').length;

  // Accurate percentages for infographic visual comparisons
  const openPct = totalCount > 0 ? (openCount / totalCount) * 100 : 0;
  const inProgressPct = totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0;
  const awaitingVerificationPct = totalCount > 0 ? (awaitingVerificationCount / totalCount) * 100 : 0;
  const verifiedResolvedPct = totalCount > 0 ? (verifiedResolvedCount / totalCount) * 100 : 0;
  const mappedPct = totalCount > 0 ? ((mappedCount / totalCount) * 100).toFixed(1) : '0';

  // Short list of recent reports sorted by activity
  const recentReports = useMemo(() => {
    return [...issues]
      .sort((a, b) => {
        if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
        if (b.status === 'Resolved' && a.status !== 'Resolved') return -1;
        return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
      })
      .slice(0, 6);
  }, [issues]);

  const handleMetricClick = (status) => {
    if (onSelectStatusFilter) {
      onSelectStatusFilter(status);
    } else if (onViewAllIssues) {
      onViewAllIssues();
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-editorial-enter text-left">
      {/* 1. Editorial Infographic Hero Header for New Town, Kolkata */}
      <section className="relative bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_1px_3px_0_rgba(15,23,42,0.03)] p-6 sm:p-8 overflow-hidden bg-editorial-paper">
        {/* Subtle Paper-like Micro-Texture */}
        <div className="absolute inset-0 pointer-events-none opacity-35 bg-editorial-dots" aria-hidden="true" />

        {/* Decorative corner registration marks */}
        <div className="absolute top-3 left-3 text-slate-300 font-mono text-[10px] select-none pointer-events-none" aria-hidden="true">+</div>
        <div className="absolute top-3 right-3 text-slate-300 font-mono text-[10px] select-none pointer-events-none" aria-hidden="true">+</div>

        {/* Soft Ambient Corner Glows */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-100/40 via-teal-100/25 to-transparent blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-amber-100/30 via-slate-100/20 to-transparent blur-3xl pointer-events-none" aria-hidden="true" />

        {/* Subtle Civic Motif Silhouette SVG in Background */}
        <svg
          className="absolute -right-6 -bottom-6 w-56 h-56 text-emerald-950/[0.03] pointer-events-none select-none hidden md:block"
          viewBox="0 0 160 160"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M 20 140 H 140" />
          <path d="M 40 140 V 60 L 60 40 L 80 60 V 140" />
          <path d="M 90 140 V 80 H 130 V 140" />
          <circle cx="110" cy="50" r="14" strokeDasharray="3 3" />
          <path d="M 110 36 V 26" />
        </svg>

        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-900 bg-emerald-50 border border-emerald-200/90 px-3 py-1 rounded-md shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              MUNICIPAL ISSUE OBSERVATORY • NEW TOWN, KOLKATA
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Action Area I, II & III Municipal Public Works Audit
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Track, report, and verify public infrastructure across New Town.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Report road hazards, faulty streetlights, drainage bottlenecks, and civic maintenance needs. Follow transparent field resolution SLAs with independent community photographic sign-offs.
          </p>

          {/* Infographic Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 pb-1">
            <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Census</span>
              <span className="text-base font-black text-slate-900 tabular-editorial">{totalCount} Reports</span>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">GIS Mapped</span>
              <span className="text-base font-black text-emerald-700 tabular-editorial">{mappedCount} ({mappedPct}%)</span>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Hotspot Clusters</span>
              <span className="text-base font-black text-amber-700 tabular-editorial">{hotspots.length} Zones</span>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Verification</span>
              <span className="text-base font-black text-slate-900 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 inline shrink-0" />
                Community
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
              <span>Report a Problem</span>
            </button>

            <button
              type="button"
              onClick={onViewAllIssues}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 text-xs sm:text-sm font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <span>Browse All 200 Reports</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Primary Summary Report-Statistic Cards (Editorial Infographic Presentation) */}
      <section aria-label="Key Grievance Summary Metrics" className="space-y-3.5">
        <div className="flex items-center justify-between pb-1">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              CENSUS TELEMETRY • SECTION 01
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Lifecycle Resolution Pipeline
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            Click metric card to filter reports
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Open Issues */}
          <button
            type="button"
            onClick={() => handleMetricClick('Open')}
            className="group relative bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 text-left hover:border-amber-400 hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer shadow-2xs hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md tabular-editorial">
                {openPct.toFixed(0)}% of total
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mt-3.5 mb-1 tabular-editorial">
              {openCount}
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800">Open Issues</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting municipal dispatch</p>

            {/* Proportional Mini-Bar Meter */}
            <div className="w-full bg-slate-100 rounded-full h-1 mt-3 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(5, openPct)}%` }}
              />
            </div>
          </button>

          {/* Card 2: In Progress */}
          <button
            type="button"
            onClick={() => handleMetricClick('In Progress')}
            className="group relative bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 text-left hover:border-sky-400 hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer shadow-2xs hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/80 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Wrench className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-900 bg-sky-50 border border-sky-200/70 px-2 py-0.5 rounded-md tabular-editorial">
                {inProgressPct.toFixed(0)}% of total
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mt-3.5 mb-1 tabular-editorial">
              {inProgressCount}
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800">In Progress</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Field crew actively on-site</p>

            {/* Proportional Mini-Bar Meter */}
            <div className="w-full bg-slate-100 rounded-full h-1 mt-3 overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(5, inProgressPct)}%` }}
              />
            </div>
          </button>

          {/* Card 3: Awaiting Verification */}
          <button
            type="button"
            onClick={() => handleMetricClick('Resolution Submitted')}
            className="group relative bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 text-left hover:border-purple-400 hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer shadow-2xs hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-900 bg-purple-50 border border-purple-200/70 px-2 py-0.5 rounded-md tabular-editorial">
                {awaitingVerificationPct.toFixed(0)}% of total
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mt-3.5 mb-1 tabular-editorial">
              {awaitingVerificationCount}
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800">Awaiting Verification</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Submitted, pending citizen check</p>

            {/* Proportional Mini-Bar Meter */}
            <div className="w-full bg-slate-100 rounded-full h-1 mt-3 overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(5, awaitingVerificationPct)}%` }}
              />
            </div>
          </button>

          {/* Card 4: Verified Resolved */}
          <button
            type="button"
            onClick={() => handleMetricClick('Resolved')}
            className="group relative bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 text-left hover:border-emerald-400 hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shadow-2xs hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md tabular-editorial">
                {verifiedResolvedPct.toFixed(0)}% of total
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mt-3.5 mb-1 tabular-editorial">
              {verifiedResolvedCount}
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800">Verified Resolved</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Closed with verification proof</p>

            {/* Proportional Mini-Bar Meter */}
            <div className="w-full bg-slate-100 rounded-full h-1 mt-3 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(5, verifiedResolvedPct)}%` }}
              />
            </div>
          </button>
        </div>

        {/* Infographic Comparative Ratio Strip: Stacked Distribution Bar */}
        <div className="bg-white rounded-xl border border-slate-200/85 p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Total Grievance Status Proportions
            </span>
            <span className="text-[11px] font-bold text-slate-400 tabular-editorial">
              100% Census Share ({totalCount} Issues)
            </span>
          </div>

          {/* Multi-segment stacked horizontal bar */}
          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100">
            <div
              style={{ width: `${openPct}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`Open: ${openCount} (${openPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${inProgressPct}%` }}
              className="bg-sky-600 h-full transition-all duration-500"
              title={`In Progress: ${inProgressCount} (${inProgressPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${awaitingVerificationPct}%` }}
              className="bg-purple-600 h-full transition-all duration-500"
              title={`Awaiting Verification: ${awaitingVerificationCount} (${awaitingVerificationPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${verifiedResolvedPct}%` }}
              className="bg-emerald-600 h-full transition-all duration-500"
              title={`Resolved: ${verifiedResolvedCount} (${verifiedResolvedPct.toFixed(1)}%)`}
            />
          </div>

          {/* Legend Items */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-600 font-medium">Open:</span>
              <strong className="text-slate-900 tabular-editorial">{openCount} ({openPct.toFixed(1)}%)</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-600" />
              <span className="text-slate-600 font-medium">In Progress:</span>
              <strong className="text-slate-900 tabular-editorial">{inProgressCount} ({inProgressPct.toFixed(1)}%)</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span className="text-slate-600 font-medium">Awaiting Check:</span>
              <strong className="text-slate-900 tabular-editorial">{awaitingVerificationCount} ({awaitingVerificationPct.toFixed(1)}%)</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span className="text-slate-600 font-medium">Verified Closed:</span>
              <strong className="text-slate-900 tabular-editorial">{verifiedResolvedCount} ({verifiedResolvedPct.toFixed(1)}%)</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 3. New Town Issues Map: Main Visual Focus + Areas Needing Attention */}
      <section aria-label="New Town Issues Map" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/90">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                GEOGRAPHIC GIS • SECTION 03
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 rounded-full">
                {mappedCount} reports mapped on GIS ({mappedPct}%)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
              New Town Spatial Cartography
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live geographic issue distribution across Action Area I, II & III • OpenStreetMap
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToMap && (
              <button
                type="button"
                onClick={onNavigateToMap}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1.5 focus:outline-none focus-visible:underline cursor-pointer transition-colors"
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
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between bg-editorial-paper relative">
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

              {/* Hotspot Chips with Infographic Rank Indicators */}
              <div className="flex flex-wrap gap-1.5">
                {hotspots.slice(0, 6).map((hotspot, idx) => (
                  <button
                    key={hotspot.id}
                    type="button"
                    onClick={() => onNavigateToMap && onNavigateToMap(hotspot.id)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    title={`View ${hotspot.openCount} open reports (${hotspot.totalCount} total) at ${hotspot.name}`}
                  >
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded">#{idx + 1}</span>
                    <span className="truncate max-w-[110px]">{hotspot.landmarkName || hotspot.name}</span>
                    <strong className="text-slate-900 font-bold tabular-editorial">({hotspot.totalCount})</strong>
                  </button>
                ))}
              </div>

              {/* Active Complaints List */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Active Complaints
                  </span>
                  <span className="text-[10px] text-slate-400">Hover highlights pin</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {activeSideIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => onOpenIssueDetail && onOpenIssueDetail(issue.id)}
                      onMouseEnter={() => setHoveredIssueId(issue.id)}
                      onMouseLeave={() => setHoveredIssueId(null)}
                      className={`py-2 px-2 flex items-center justify-between gap-2.5 rounded-lg transition-colors cursor-pointer ${
                        hoveredIssueId === issue.id ? 'bg-emerald-50/70 border border-emerald-200/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded tabular-editorial">#{issue.id}</span>
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

      {/* 4. Interactive Category Distribution Donut Chart */}
      <section aria-label="Category Distribution Visualization">
        <CategoryDistributionChart
          issues={issues}
          onViewAllIssues={onViewAllIssues}
        />
      </section>

      {/* 5. Recent Reports Section */}
      <section aria-label="Recent Reports" className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/90">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              AUDIT FEED • SECTION 05
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Recent Submissions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest civic maintenance grievances logged across New Town</p>
          </div>
          <button
            type="button"
            onClick={onViewAllIssues}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 focus:outline-none focus-visible:underline cursor-pointer transition-colors"
          >
            <span>View all reports</span>
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
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 tabular-editorial">
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

      {/* 6. Quick Actions Section (Editorial Action Tiles) */}
      <section aria-label="Quick Actions" className="pt-1">
        <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5">
          QUICK ACTIONS • NAVIGATION
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={onOpenReportModal}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-emerald-300 rounded-xl text-left transition-all duration-200 flex items-center gap-3 cursor-pointer shadow-2xs hover:shadow-xs group hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Report a Problem</div>
              <div className="text-[11px] text-slate-500">Submit a new civic grievance</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onViewAllIssues}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-sky-300 rounded-xl text-left transition-all duration-200 flex items-center gap-3 cursor-pointer shadow-2xs hover:shadow-xs group hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Browse All Reports</div>
              <div className="text-[11px] text-slate-500">Filter by category and area</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToMyReports || onViewAllIssues}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-purple-300 rounded-xl text-left transition-all duration-200 flex items-center gap-3 cursor-pointer shadow-2xs hover:shadow-xs group hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">My Submissions</div>
              <div className="text-[11px] text-slate-500">Track personal citizen reports</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToAnalytics || onViewAllIssues}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-amber-300 rounded-xl text-left transition-all duration-200 flex items-center gap-3 cursor-pointer shadow-2xs hover:shadow-xs group hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <BarChart3 className="w-5 h-5" />
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
