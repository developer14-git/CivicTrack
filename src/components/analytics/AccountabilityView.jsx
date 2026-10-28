import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ThumbsUp,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Clock,
  ShieldCheck,
  Road,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import CategoryDistributionChart from '../dashboard/CategoryDistributionChart';
import {
  getDeadlineStatus,
  formatTimeRemaining,
  sortOverdueIssues,
  calculateMedianResolutionTime,
  SLA_DISCLAIMER,
} from '../../utils/slaUtils';

// Math helpers for SVG Donut slices
function polarToCartesian(cx, cy, r, angleRad) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeDonutArc(cx, cy, rInner, rOuter, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const startInner = polarToCartesian(cx, cy, rInner, startAngle);
  const endInner = polarToCartesian(cx, cy, rInner, endAngle);

  const angleDiff = endAngle - startAngle;
  const largeArcFlag = angleDiff > Math.PI ? 1 : 0;

  return [
    `M ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)}`,
    `L ${endInner.x.toFixed(2)} ${endInner.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${startInner.x.toFixed(2)} ${startInner.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

// Visual configuration for the 4 Lifecycle Statuses
const STATUS_CONFIG = {
  Open: {
    label: 'Open',
    sublabel: 'Awaiting dispatch',
    primary: '#d97706',
    gradientStart: '#fbbf24',
    gradientEnd: '#d97706',
    tint: '#fffbeb',
    border: '#fde68a',
    text: '#92400e',
    icon: AlertCircle,
  },
  'In Progress': {
    label: 'In Progress',
    sublabel: 'Active field crew',
    primary: '#0284c7',
    gradientStart: '#38bdf8',
    gradientEnd: '#0284c7',
    tint: '#f0f9ff',
    border: '#bae6fd',
    text: '#075985',
    icon: Wrench,
  },
  'Awaiting Verification': {
    label: 'Awaiting Verification',
    sublabel: 'Citizen check required',
    primary: '#7c3aed',
    gradientStart: '#a78bfa',
    gradientEnd: '#7c3aed',
    tint: '#f5f3ff',
    border: '#ddd6fe',
    text: '#5b21b6',
    icon: Clock,
  },
  Resolved: {
    label: 'Resolved',
    sublabel: 'Closed with proof',
    primary: '#059669',
    gradientStart: '#34d399',
    gradientEnd: '#059669',
    tint: '#ecfdf5',
    border: '#a7f3d0',
    text: '#065f46',
    icon: ShieldCheck,
  },
};

// Visual configuration for Action Area Spatial Sectors
const AREA_CONFIG = {
  'Action Area I': {
    label: 'Action Area I',
    sublabel: 'Primary civic core',
    primary: '#059669', // Emerald
    gradientStart: '#10b981',
    gradientEnd: '#047857',
    tint: '#ecfdf5',
    border: '#a7f3d0',
    text: '#065f46',
    icon: MapPin,
  },
  'Action Area II': {
    label: 'Action Area II',
    sublabel: 'Commercial & Institutional',
    primary: '#0284c7', // Sky / Cyan
    gradientStart: '#38bdf8',
    gradientEnd: '#0369a1',
    tint: '#f0f9ff',
    border: '#bae6fd',
    text: '#075985',
    icon: MapPin,
  },
  'Action Area III': {
    label: 'Action Area III',
    sublabel: 'Residential & Sukhobrishti',
    primary: '#7c3aed', // Violet / Purple
    gradientStart: '#8b5cf6',
    gradientEnd: '#6d28d9',
    tint: '#f5f3ff',
    border: '#ddd6fe',
    text: '#5b21b6',
    icon: MapPin,
  },
  'Major Arterial Road & Perimeter': {
    label: 'Major Arterial Road & Perimeter',
    sublabel: 'Biswa Bangla corridor',
    primary: '#d97706', // Amber / Gold
    gradientStart: '#fbbf24',
    gradientEnd: '#b45309',
    tint: '#fffbeb',
    border: '#fde68a',
    text: '#92400e',
    icon: Road,
  },
};

export default function AccountabilityView({
  issues = [],
  onOpenIssueDetail,
  currentTime,
  onSelectStatusFilter,
  onViewAllIssues,
}) {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [hoveredArea, setHoveredArea] = useState(null);
  const [isChartRendered, setIsChartRendered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsChartRendered(true), 60);
    return () => clearTimeout(t);
  }, []);

  // 1. Dashboard Metrics Calculations (Preserved exact logic)
  const metrics = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((i) => i.status === 'Open').length;
    const inProgress = issues.filter((i) => i.status === 'In Progress').length;
    const submitted = issues.filter(
      (i) => i.status === 'Resolution Submitted' || i.status === 'Awaiting Verification'
    ).length;
    const resolved = issues.filter((i) => i.status === 'Resolved').length;

    // Active issues (open or in progress)
    const activeOpenTotal = open + inProgress;

    // High priority active
    const highPriorityActive = issues.filter(
      (i) => (i.status === 'Open' || i.status === 'In Progress') && i.priority === 'High'
    );

    // Resolution-submitted awaiting verification
    const awaitingVerification = issues.filter(
      (i) => i.status === 'Resolution Submitted' || i.status === 'Awaiting Verification'
    );

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
        areaCounts['Major Arterial Road & Perimeter'] =
          (areaCounts['Major Arterial Road & Perimeter'] || 0) + 1;
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

  // 2. Status Donut Slices Math (Center 130, rIn 74, rOut 112)
  const { statusSlices, statusMaxCount } = useMemo(() => {
    const center = 130;
    const rIn = 74;
    const rOut = 112;
    const total = metrics.total;

    const data = [
      { key: 'Open', count: metrics.open, ...STATUS_CONFIG.Open },
      { key: 'In Progress', count: metrics.inProgress, ...STATUS_CONFIG['In Progress'] },
      {
        key: 'Awaiting Verification',
        count: metrics.submitted,
        ...STATUS_CONFIG['Awaiting Verification'],
      },
      { key: 'Resolved', count: metrics.resolved, ...STATUS_CONFIG.Resolved },
    ];

    const maxCount = Math.max(...data.map((d) => d.count), 0);

    if (total === 0) {
      return { statusSlices: [], statusMaxCount: 0 };
    }

    let currentAngle = -Math.PI / 2;
    const activeItems = data.filter((d) => d.count > 0);
    const gapAngle = activeItems.length > 1 ? 0.03 : 0;

    const slices = activeItems.map((item, idx) => {
      const sliceAngle = (item.count / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = (startAngle + endAngle) / 2;

      const safeStart = startAngle + gapAngle / 2;
      const safeEnd = endAngle - gapAngle / 2;
      const pathD = describeDonutArc(center, center, rIn, rOut, safeStart, safeEnd);

      const popDist = 6;
      const popX = Math.cos(midAngle) * popDist;
      const popY = Math.sin(midAngle) * popDist;

      currentAngle += sliceAngle;
      const pct = (item.count / total) * 100;

      return {
        ...item,
        id: `status-slice-${idx}`,
        startAngle,
        endAngle,
        midAngle,
        pathD,
        popX,
        popY,
        pct,
        pctFormatted: `${pct.toFixed(1)}%`,
      };
    });

    return { statusSlices: slices, statusMaxCount: maxCount };
  }, [metrics]);

  // 3. Action Area Donut Slices Math (Center 130, rIn 74, rOut 112)
  const { areaSlices, areaMaxCount } = useMemo(() => {
    const center = 130;
    const rIn = 74;
    const rOut = 112;
    const total = metrics.total;

    const data = Object.keys(AREA_CONFIG).map((areaKey) => {
      const count = metrics.areaCounts[areaKey] || 0;
      return {
        key: areaKey,
        count,
        ...AREA_CONFIG[areaKey],
      };
    });

    const maxCount = Math.max(...data.map((d) => d.count), 0);

    if (total === 0) {
      return { areaSlices: [], areaMaxCount: 0 };
    }

    let currentAngle = -Math.PI / 2;
    const activeItems = data.filter((d) => d.count > 0);
    const gapAngle = activeItems.length > 1 ? 0.03 : 0;

    const slices = activeItems.map((item, idx) => {
      const sliceAngle = (item.count / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = (startAngle + endAngle) / 2;

      const safeStart = startAngle + gapAngle / 2;
      const safeEnd = endAngle - gapAngle / 2;
      const pathD = describeDonutArc(center, center, rIn, rOut, safeStart, safeEnd);

      const popDist = 6;
      const popX = Math.cos(midAngle) * popDist;
      const popY = Math.sin(midAngle) * popDist;

      currentAngle += sliceAngle;
      const pct = (item.count / total) * 100;

      return {
        ...item,
        id: `area-slice-${idx}`,
        startAngle,
        endAngle,
        midAngle,
        pathD,
        popX,
        popY,
        pct,
        pctFormatted: `${pct.toFixed(1)}%`,
      };
    });

    return { areaSlices: slices, areaMaxCount: maxCount };
  }, [metrics]);

  // Handle clicking a status: filter the Issue Browser
  const handleStatusClick = useCallback(
    (statusName) => {
      if (onSelectStatusFilter) {
        // Map "Awaiting Verification" to "Resolution Submitted" if needed
        const filterVal =
          statusName === 'Awaiting Verification' ? 'Resolution Submitted' : statusName;
        onSelectStatusFilter(filterVal);
      }
    },
    [onSelectStatusFilter]
  );

  const displayedEvents = showAllEvents ? metrics.allEvents : metrics.allEvents.slice(0, 5);

  const activeHoveredStatusItem = useMemo(() => {
    if (!hoveredStatus) return null;
    return statusSlices.find((s) => s.key === hoveredStatus) || null;
  }, [hoveredStatus, statusSlices]);

  const activeHoveredAreaItem = useMemo(() => {
    if (!hoveredArea) return null;
    return areaSlices.find((s) => s.key === hoveredArea) || null;
  }, [hoveredArea, areaSlices]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-editorial-enter text-left">
      {/* 1. Page Header with Editorial Dateline & Registry Badges */}
      <div className="relative bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_1px_3px_0_rgba(15,23,42,0.03)] bg-editorial-paper overflow-hidden">
        {/* Subtle Paper-like Micro-Texture */}
        <div className="absolute inset-0 pointer-events-none opacity-35 bg-editorial-dots" aria-hidden="true" />

        {/* Decorative corner registration marks */}
        <div className="absolute top-3 left-3 text-slate-300 font-mono text-[10px] select-none pointer-events-none" aria-hidden="true">+</div>
        <div className="absolute top-3 right-3 text-slate-300 font-mono text-[10px] select-none pointer-events-none" aria-hidden="true">+</div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-900 bg-emerald-50 border border-emerald-200/90 px-3 py-1 rounded-md shadow-2xs">
              MUNICIPAL AUDIT & SLA REPORT • NEW TOWN, KOLKATA
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Action Area I, II & III Municipal Resolution Oversight
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
            Accountability & Public Works Analytics
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            Live municipal resolution outcomes, SLA response times, spatial sector distribution, and community verification audit trails across New Town.
          </p>
        </div>
      </div>

      {/* 2. Key Accountability Metrics (Row of 4 Cards) */}
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
            <p className="text-[11px] text-amber-700 font-bold mt-1 tabular-editorial">
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
            <p className="text-[11px] text-purple-700 font-bold mt-1 tabular-editorial">
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

      {/* 3. Secondary Operational Summary & Endorsements Strip */}
      <section aria-label="Secondary Metrics" className="space-y-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            {/* In Progress */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                In Progress
              </span>
              <div className="text-xl font-black text-slate-900 tabular-editorial">
                {metrics.inProgress}
              </div>
              <span className="text-[11px] text-slate-500 block">Crew dispatched on-site</span>
            </div>

            {/* Verified Resolved */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Verified Resolved
              </span>
              <div className="text-xl font-black text-emerald-700 tabular-editorial">
                {metrics.resolved}
              </div>
              <span className="text-[11px] text-slate-500 block">Community sign-off confirmed</span>
            </div>

            {/* Median Resolution Time */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Median Resolution Time
              </span>
              <div className="text-xl font-black text-slate-900 tabular-editorial">
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
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Quality Oversight
              </span>
              <div className="text-xl font-black text-amber-700 tabular-editorial">
                {metrics.challengedIssues.length + metrics.rejectionCount}
              </div>
              <span className="text-[11px] text-slate-500 block">
                {metrics.challengedIssues.length} challenged &bull; {metrics.rejectionCount} rejected
              </span>
            </div>
          </div>
        </div>

        {/* Endorsement Summary Strip */}
        <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 shadow-2xs">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-slate-900 font-bold tabular-editorial">{metrics.totalEndorsements} endorsements</strong> recorded across citizen reports ({metrics.userEndorsedCount} by your active session)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Single-endorsement per citizen cryptographic integrity enforced
          </span>
        </div>
      </section>

      {/* 4. Visual Analytics Core (2-Tier Infographic Layout) */}
      <section aria-label="Visual Analytics Core" className="space-y-6">
        {/* Tier 1: Two High-Impact Donut Charts Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Card A: Lifecycle Status Donut Chart */}
          <div className="relative bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_1px_3px_0_rgba(15,23,42,0.03)] bg-editorial-paper flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-editorial-dots" aria-hidden="true" />
            <div className="absolute top-2 right-2 text-slate-300 font-mono text-[9px] pointer-events-none select-none">+</div>

            <div className="relative z-10 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                    FLOW AUDIT • STATUS PIPELINE
                  </span>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Lifecycle Status Distribution
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proportional volume across 4 municipal grievance stages
                  </p>
                </div>
                {onSelectStatusFilter && (
                  <span className="text-[11px] font-semibold text-emerald-700 hidden sm:inline">
                    Click slice to filter
                  </span>
                )}
              </div>

              {/* Donut Chart & Legend Presentation */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                {/* Donut SVG (Left) */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative w-[210px] h-[210px] flex items-center justify-center">
                    <svg
                      viewBox="0 0 260 260"
                      className="w-full h-full transform transition-transform duration-300 motion-reduce:transition-none"
                      role="img"
                      aria-label={`Lifecycle status donut chart representing ${metrics.total} issues`}
                    >
                      <defs>
                        <filter id="status-donut-shadow" x="-15%" y="-15%" width="130%" height="130%">
                          <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.08" floodColor="#0f172a" />
                        </filter>
                        {statusSlices.map((slice) => (
                          <linearGradient
                            key={`grad-${slice.id}`}
                            id={`grad-${slice.id}`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor={slice.gradientStart} />
                            <stop offset="100%" stopColor={slice.gradientEnd} />
                          </linearGradient>
                        ))}
                      </defs>

                      <g filter="url(#status-donut-shadow)">
                        {statusSlices.map((slice, idx) => {
                          const isHovered = hoveredStatus === slice.key;
                          const isDimmed = hoveredStatus && !isHovered;
                          const transformStyle = isHovered
                            ? `translate(${slice.popX}px, ${slice.popY}px)`
                            : 'translate(0px, 0px)';

                          return (
                            <path
                              key={slice.key}
                              d={slice.pathD}
                              fill={`url(#grad-${slice.id})`}
                              style={{
                                transform: transformStyle,
                                transition:
                                  'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
                                opacity: isDimmed ? 0.35 : 1,
                                cursor: 'pointer',
                                animationDelay: `${idx * 40}ms`,
                              }}
                              className={`hover:brightness-105 focus:outline-none motion-reduce:transition-none ${
                                isChartRendered ? 'animate-donut-reveal' : 'opacity-0 scale-95'
                              }`}
                              tabIndex={0}
                              role="button"
                              aria-label={`${slice.label}: ${slice.count} reports, ${slice.pctFormatted}`}
                              onMouseEnter={() => setHoveredStatus(slice.key)}
                              onMouseLeave={() => setHoveredStatus(null)}
                              onClick={() => handleStatusClick(slice.key)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleStatusClick(slice.key);
                                }
                              }}
                            />
                          );
                        })}
                      </g>

                      {/* Center Donut Hole Backdrop with concentric compass/gauge accents */}
                      <circle cx="130" cy="130" r="70" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                      <circle cx="130" cy="130" r="62" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                    </svg>

                    {/* Center Dynamic Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center select-none">
                      {activeHoveredStatusItem ? (
                        <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
                          <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            STATUS
                          </span>
                          <div className="text-2xl font-black text-slate-900 tracking-tight tabular-editorial leading-none my-1">
                            {activeHoveredStatusItem.count}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 tabular-editorial">
                            {activeHoveredStatusItem.pctFormatted}
                          </span>
                          <p className="text-[10px] font-bold text-slate-700 truncate max-w-[100px] mt-0.5">
                            {activeHoveredStatusItem.label}
                          </p>
                        </div>
                      ) : (
                        <div className="animate-in fade-in duration-200 flex flex-col items-center">
                          <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400">
                            TOTAL
                          </span>
                          <div className="text-2xl font-black text-slate-900 tracking-tight tabular-editorial leading-none my-1">
                            {metrics.total}
                          </div>
                          <span className="text-[9px] font-bold text-slate-500">
                            4 Phases
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Legend Cards (Right) */}
                <div className="sm:col-span-7 space-y-2">
                  {statusSlices.map((slice) => {
                    const isHovered = hoveredStatus === slice.key;
                    const IconComp = slice.icon;
                    const pctBar =
                      statusMaxCount > 0 ? (slice.count / statusMaxCount) * 100 : 0;

                    return (
                      <button
                        key={slice.key}
                        type="button"
                        onClick={() => handleStatusClick(slice.key)}
                        onMouseEnter={() => setHoveredStatus(slice.key)}
                        onMouseLeave={() => setHoveredStatus(null)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                          isHovered
                            ? 'bg-white border-slate-400 shadow-xs ring-1 ring-slate-300'
                            : 'bg-white/90 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-2xs'
                        }`}
                        aria-label={`Status ${slice.label}: ${slice.count} reports, ${slice.pctFormatted}`}
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
                              style={{
                                backgroundColor: slice.tint,
                                borderColor: slice.border,
                                color: slice.primary,
                              }}
                            >
                              <IconComp className="w-3 h-3" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-800 group-hover:text-slate-900 truncate">
                                {slice.label}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {slice.sublabel}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-slate-500 tabular-editorial">
                              {slice.pctFormatted}
                            </span>
                            <span className="text-xs font-black tabular-editorial px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200/80">
                              {slice.count}
                            </span>
                          </div>
                        </div>

                        {/* Proportional Slim Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${Math.min(100, Math.max(8, pctBar))}%`,
                              backgroundColor: slice.primary,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Action Area Spatial Breakdown Donut Chart */}
          <div className="relative bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_1px_3px_0_rgba(15,23,42,0.03)] bg-editorial-paper flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-editorial-dots" aria-hidden="true" />
            <div className="absolute top-2 right-2 text-slate-300 font-mono text-[9px] pointer-events-none select-none">+</div>

            <div className="relative z-10 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                    GIS CARTOGRAPHY • SECTOR BREAKDOWN
                  </span>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Action Area Distribution
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Spatial dispersion across New Town municipal sectors
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 hidden sm:inline">
                  4 Sectors
                </span>
              </div>

              {/* Donut Chart & Legend Presentation */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                {/* Donut SVG (Left) */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative w-[210px] h-[210px] flex items-center justify-center">
                    <svg
                      viewBox="0 0 260 260"
                      className="w-full h-full transform transition-transform duration-300 motion-reduce:transition-none"
                      role="img"
                      aria-label={`Action area spatial distribution donut chart representing ${metrics.total} issues`}
                    >
                      <defs>
                        <filter id="area-donut-shadow" x="-15%" y="-15%" width="130%" height="130%">
                          <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.08" floodColor="#0f172a" />
                        </filter>
                        {areaSlices.map((slice) => (
                          <linearGradient
                            key={`grad-${slice.id}`}
                            id={`grad-${slice.id}`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor={slice.gradientStart} />
                            <stop offset="100%" stopColor={slice.gradientEnd} />
                          </linearGradient>
                        ))}
                      </defs>

                      <g filter="url(#area-donut-shadow)">
                        {areaSlices.map((slice, idx) => {
                          const isHovered = hoveredArea === slice.key;
                          const isDimmed = hoveredArea && !isHovered;
                          const transformStyle = isHovered
                            ? `translate(${slice.popX}px, ${slice.popY}px)`
                            : 'translate(0px, 0px)';

                          return (
                            <path
                              key={slice.key}
                              d={slice.pathD}
                              fill={`url(#grad-${slice.id})`}
                              style={{
                                transform: transformStyle,
                                transition:
                                  'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
                                opacity: isDimmed ? 0.35 : 1,
                                cursor: 'pointer',
                                animationDelay: `${idx * 40}ms`,
                              }}
                              className={`hover:brightness-105 focus:outline-none motion-reduce:transition-none ${
                                isChartRendered ? 'animate-donut-reveal' : 'opacity-0 scale-95'
                              }`}
                              tabIndex={0}
                              role="button"
                              aria-label={`${slice.label}: ${slice.count} reports, ${slice.pctFormatted}`}
                              onMouseEnter={() => setHoveredArea(slice.key)}
                              onMouseLeave={() => setHoveredArea(null)}
                            />
                          );
                        })}
                      </g>

                      {/* Center Donut Hole Backdrop with concentric compass/gauge accents */}
                      <circle cx="130" cy="130" r="70" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                      <circle cx="130" cy="130" r="62" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                    </svg>

                    {/* Center Dynamic Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center select-none">
                      {activeHoveredAreaItem ? (
                        <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
                          <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            SECTOR
                          </span>
                          <div className="text-2xl font-black text-slate-900 tracking-tight tabular-editorial leading-none my-1">
                            {activeHoveredAreaItem.count}
                          </div>
                          <span className="text-[10px] font-bold text-sky-700 tabular-editorial">
                            {activeHoveredAreaItem.pctFormatted}
                          </span>
                          <p className="text-[9px] font-bold text-slate-700 truncate max-w-[110px] mt-0.5">
                            {activeHoveredAreaItem.label}
                          </p>
                        </div>
                      ) : (
                        <div className="animate-in fade-in duration-200 flex flex-col items-center">
                          <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400">
                            NEW TOWN
                          </span>
                          <div className="text-2xl font-black text-slate-900 tracking-tight tabular-editorial leading-none my-1">
                            {metrics.total}
                          </div>
                          <span className="text-[9px] font-bold text-slate-500">
                            Sectors
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Legend Cards (Right) */}
                <div className="sm:col-span-7 space-y-2">
                  {areaSlices.map((slice) => {
                    const isHovered = hoveredArea === slice.key;
                    const IconComp = slice.icon;
                    const pctBar =
                      areaMaxCount > 0 ? (slice.count / areaMaxCount) * 100 : 0;

                    return (
                      <div
                        key={slice.key}
                        onMouseEnter={() => setHoveredArea(slice.key)}
                        onMouseLeave={() => setHoveredArea(null)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                          isHovered
                            ? 'bg-white border-slate-400 shadow-xs ring-1 ring-slate-300'
                            : 'bg-white/90 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
                              style={{
                                backgroundColor: slice.tint,
                                borderColor: slice.border,
                                color: slice.primary,
                              }}
                            >
                              <IconComp className="w-3 h-3" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-800 group-hover:text-slate-900 truncate">
                                {slice.label}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {slice.sublabel}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-slate-500 tabular-editorial">
                              {slice.pctFormatted}
                            </span>
                            <span className="text-xs font-black tabular-editorial px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200/80">
                              {slice.count}
                            </span>
                          </div>
                        </div>

                        {/* Proportional Slim Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${Math.min(100, Math.max(8, pctBar))}%`,
                              backgroundColor: slice.primary,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 2: Public Works Reports by Category (Full-Width Editorial Visualization) */}
        <div>
          <CategoryDistributionChart
            issues={issues}
            onViewAllIssues={onViewAllIssues}
          />
        </div>
      </section>

      {/* 5. Overdue Issues Table / List */}
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
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0 select-all tabular-editorial">
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
                          <span className="text-xs font-mono font-bold text-rose-600 tabular-editorial">
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

      {/* 6. Oversight & Verification (3 Compact Columns) */}
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
              <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full tabular-editorial">
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
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mr-1.5 shrink-0 tabular-editorial">
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
              <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full tabular-editorial">
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
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mr-1.5 shrink-0 tabular-editorial">
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
              <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full tabular-editorial">
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
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mr-1.5 shrink-0 tabular-editorial">
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
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mr-1.5 shrink-0 tabular-editorial">
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

      {/* 7. Recent Audit Activity */}
      <section aria-label="Recent Audit Activity" className="text-left space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/90">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Recent Audit Activity</h2>
            <span className="text-xs text-slate-500 font-medium tabular-editorial">
              ({metrics.allEvents.length} events recorded)
            </span>
          </div>
          {metrics.allEvents.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 focus:outline-none focus-visible:underline cursor-pointer transition-colors"
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
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0 tabular-editorial">
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

                <div className="shrink-0 text-[11px] text-slate-400 font-mono tabular-editorial">
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
