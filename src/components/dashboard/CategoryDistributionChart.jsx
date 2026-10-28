import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Road,
  Zap,
  Droplets,
  Trees,
  Building2,
  Trash2,
  AlertTriangle,
  Wrench,
  CloudRain,
  ShieldAlert,
  HardHat,
  Layers,
  PieChart as PieChartIcon,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockIssues';

// 12 vibrant, harmonious colors with soft gradient pairs and subtle accents
const CATEGORY_COLOR_PALETTE = {
  'Roads and Footpaths': {
    primary: '#059669', // Emerald
    gradientStart: '#10b981',
    gradientEnd: '#047857',
    tint: '#ecfdf5',
    text: '#065f46',
    border: '#a7f3d0',
    icon: Road,
  },
  'Streetlights and Electricity': {
    primary: '#f59e0b', // Amber / Gold
    gradientStart: '#fbbf24',
    gradientEnd: '#d97706',
    tint: '#fefce8',
    text: '#854d0e',
    border: '#fde047',
    icon: Zap,
  },
  'Drainage and Flooding': {
    primary: '#0284c7', // Sky / Cyan
    gradientStart: '#38bdf8',
    gradientEnd: '#0369a1',
    tint: '#f0f9ff',
    text: '#075985',
    border: '#bae6fd',
    icon: Droplets,
  },
  'Public Parks and Green Spaces': {
    primary: '#84cc16', // Lime / Vibrant Green
    gradientStart: '#a3e635',
    gradientEnd: '#65a30d',
    tint: '#f7fee7',
    text: '#3f6212',
    border: '#d9f99d',
    icon: Trees,
  },
  'Public Buildings and Facilities': {
    primary: '#6366f1', // Indigo
    gradientStart: '#818cf8',
    gradientEnd: '#4f46e5',
    tint: '#eef2ff',
    text: '#3730a3',
    border: '#c7d2fe',
    icon: Building2,
  },
  'Waste and Cleanliness': {
    primary: '#f97316', // Coral / Orange
    gradientStart: '#fb923c',
    gradientEnd: '#ea580c',
    tint: '#fff7ed',
    text: '#9a3412',
    border: '#fed7aa',
    icon: Trash2,
  },
  'Traffic and Pedestrian Safety': {
    primary: '#ef4444', // Crimson / Red
    gradientStart: '#f87171',
    gradientEnd: '#dc2626',
    tint: '#fef2f2',
    text: '#991b1b',
    border: '#fecaca',
    icon: AlertTriangle,
  },
  'Water Supply': {
    primary: '#0d9488', // Deep Teal
    gradientStart: '#2dd4bf',
    gradientEnd: '#0f766e',
    tint: '#f0fdfa',
    text: '#115e59',
    border: '#99f6e4',
    icon: Wrench,
  },
  'Storm and Natural Damage': {
    primary: '#8b5cf6', // Violet
    gradientStart: '#a78bfa',
    gradientEnd: '#7c3aed',
    tint: '#f5f3ff',
    text: '#5b21b6',
    border: '#ddd6fe',
    icon: CloudRain,
  },
  'Public Property Vandalism': {
    primary: '#ec4899', // Pink
    gradientStart: '#f472b6',
    gradientEnd: '#db2777',
    tint: '#fdf2f8',
    text: '#9d174d',
    border: '#fbcfe8',
    icon: ShieldAlert,
  },
  'Construction and Roadwork': {
    primary: '#d97706', // Ochre / Warm Gold
    gradientStart: '#fbbf24',
    gradientEnd: '#b45309',
    tint: '#fffbeb',
    text: '#92400e',
    border: '#fde68a',
    icon: HardHat,
  },
  'Other Public Infrastructure': {
    primary: '#64748b', // Slate Blue
    gradientStart: '#94a3b8',
    gradientEnd: '#475569',
    tint: '#f8fafc',
    text: '#334155',
    border: '#cbd5e1',
    icon: Layers,
  },
};

const FALLBACK_STYLE = {
  primary: '#10b981',
  gradientStart: '#34d399',
  gradientEnd: '#059669',
  tint: '#ecfdf5',
  text: '#065f46',
  border: '#a7f3d0',
  icon: Layers,
};

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

export default function CategoryDistributionChart({
  issues = [],
  onViewAllIssues,
  selectedCategory = 'All',
  onSelectCategory,
}) {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [tooltipState, setTooltipState] = useState({ visible: false, x: 0, y: 0, data: null });
  const containerRef = useRef(null);

  // 1. Dynamic derivation of category counts and percentages from real issues
  const { categoryStats, totalCount, maxCount } = useMemo(() => {
    const total = issues.length;
    const counts = {};

    issues.forEach((issue) => {
      const cat = issue.category || 'Other Public Infrastructure';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const activeCategories = CATEGORIES.filter((c) => c !== 'All');

    const stats = activeCategories.map((name) => {
      const count = counts[name] || 0;
      const pctNumber = total > 0 ? (count / total) * 100 : 0;
      const percentFormatted =
        pctNumber > 0 ? `${pctNumber.toFixed(1).replace('.0', '')}%` : '0%';
      const style = CATEGORY_COLOR_PALETTE[name] || FALLBACK_STYLE;

      return {
        name,
        count,
        percentage: pctNumber,
        percentFormatted,
        style,
        icon: style.icon,
      };
    });

    // Sort descending by count for clean visualization
    stats.sort((a, b) => b.count - a.count);

    const highestCount = stats.length > 0 ? stats[0].count : 0;

    return {
      categoryStats: stats,
      totalCount: total,
      maxCount: highestCount,
    };
  }, [issues]);

  // 2. Compute donut slices with subtle gaps and radial translate vector
  const { slices, cx, cy, innerR } = useMemo(() => {
    const center = 160;
    const rIn = 92;
    const rOut = 138;

    if (totalCount === 0) {
      return { slices: [], cx: center, cy: center, innerR: rIn };
    }

    let currentAngle = -Math.PI / 2; // Start at 12 o'clock
    const totalSlices = categoryStats.filter((s) => s.count > 0).length;
    const gapAngle = totalSlices > 1 ? 0.022 : 0; // Clean segment gap (~1.25 deg)

    const computed = categoryStats
      .filter((cat) => cat.count > 0)
      .map((cat, idx) => {
        const sliceAngle = (cat.count / totalCount) * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        const midAngle = (startAngle + endAngle) / 2;

        const safeStart = startAngle + gapAngle / 2;
        const safeEnd = endAngle - gapAngle / 2;

        const pathD = describeDonutArc(center, center, rIn, rOut, safeStart, safeEnd);

        // Precompute slight radial translate for hover focus
        const popDistance = 6;
        const popX = Math.cos(midAngle) * popDistance;
        const popY = Math.sin(midAngle) * popDistance;

        currentAngle += sliceAngle;

        return {
          ...cat,
          id: `cat-slice-${idx}`,
          startAngle,
          endAngle,
          midAngle,
          pathD,
          popX,
          popY,
        };
      });

    return { slices: computed, cx: center, cy: center, innerR: rIn };
  }, [categoryStats, totalCount]);

  // Handle segment and legend click: filter the existing Issue Browser
  const handleCategoryClick = useCallback(
    (categoryName) => {
      if (onViewAllIssues) {
        onViewAllIssues(categoryName);
      } else if (onSelectCategory) {
        onSelectCategory(categoryName);
      }
    },
    [onViewAllIssues, onSelectCategory]
  );

  // Active focus item for center donut display
  const activeFocusItem = useMemo(() => {
    if (hoveredCategory) {
      return categoryStats.find((c) => c.name === hoveredCategory) || null;
    }
    if (selectedCategory && selectedCategory !== 'All') {
      return categoryStats.find((c) => c.name === selectedCategory) || null;
    }
    return null;
  }, [hoveredCategory, selectedCategory, categoryStats]);

  // Handle mouse move for interactive floating tooltip
  const handleMouseMove = useCallback((e, cat) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipState({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      data: cat,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCategory(null);
    setTooltipState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] p-5 sm:p-7 space-y-6 text-left overflow-hidden"
    >
      {/* Subtle, refined background texture and light gradient glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#cbd5e1_0.75px,transparent_0.75px)] [background-size:16px_16px]"
        aria-hidden="true"
      />
      <div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-100/35 via-teal-100/20 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-tl from-cyan-100/35 via-indigo-100/20 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* 1. Header with Title & Action */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-200/90 flex items-center justify-center shrink-0 shadow-2xs">
            <PieChartIcon className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Issues by Category
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Infrastructure complaint distribution across 12 civic categories in New Town
            </p>
          </div>
        </div>

        {/* Action Link: Explore in Issue Browser with subtle arrow animation */}
        <button
          type="button"
          onClick={() => onViewAllIssues && onViewAllIssues('All')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors group cursor-pointer self-start sm:self-auto px-3 py-1.5 rounded-lg hover:bg-emerald-50/80 border border-transparent hover:border-emerald-200/60"
        >
          <span>Explore in Issue Browser</span>
          <ArrowRight
            className="w-3.5 h-3.5 text-emerald-600 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Subtle divider accent below header */}
      <div className="h-px w-full bg-gradient-to-r from-emerald-500/30 via-slate-200/80 to-transparent mb-5" aria-hidden="true" />

      {/* 2. Main Donut Chart & Legend Presentation */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Interactive Donut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex items-center justify-center">
            {totalCount > 0 ? (
              <svg
                viewBox="0 0 320 320"
                className="w-full h-full transform transition-transform duration-300 motion-reduce:transition-none"
                role="img"
                aria-label={`Donut chart representing ${totalCount} reports across 12 civic categories`}
              >
                <defs>
                  {/* Soft depth shadow filter */}
                  <filter id="donut-soft-shadow" x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.08" floodColor="#0f172a" />
                  </filter>

                  {/* Tasteful segment linear gradients for depth */}
                  {slices.map((slice) => (
                    <linearGradient
                      key={`grad-${slice.id}`}
                      id={`grad-${slice.id}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={slice.style.gradientStart} />
                      <stop offset="100%" stopColor={slice.style.gradientEnd} />
                    </linearGradient>
                  ))}
                </defs>

                {/* Slices Group with soft shadow */}
                <g filter="url(#donut-soft-shadow)">
                  {slices.map((slice) => {
                    const isHovered = hoveredCategory === slice.name;
                    const isSelected = selectedCategory === slice.name;
                    const isDimmed =
                      (hoveredCategory && !isHovered) ||
                      (selectedCategory !== 'All' && !isSelected && !hoveredCategory);

                    const transformStyle =
                      isHovered || isSelected
                        ? `translate(${slice.popX}px, ${slice.popY}px)`
                        : 'translate(0px, 0px)';

                    return (
                      <path
                        key={slice.name}
                        d={slice.pathD}
                        fill={`url(#grad-${slice.id})`}
                        style={{
                          transform: transformStyle,
                          transition:
                            'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, filter 0.2s ease',
                          opacity: isDimmed ? 0.35 : 1,
                          cursor: 'pointer',
                        }}
                        className="hover:brightness-105 focus:outline-none motion-reduce:transition-none"
                        tabIndex={0}
                        role="button"
                        aria-label={`${slice.name}: ${slice.count} reports, ${slice.percentFormatted}`}
                        onMouseEnter={() => setHoveredCategory(slice.name)}
                        onMouseMove={(e) => handleMouseMove(e, slice)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleCategoryClick(slice.name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCategoryClick(slice.name);
                          }
                        }}
                      />
                    );
                  })}
                </g>

                {/* Center Donut Hole Backdrop with subtle inner ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={innerR - 6}
                  fill="#ffffff"
                  stroke="#f1f5f9"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              /* Empty state fallback ring */
              <div className="w-60 h-60 rounded-full border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center">
                <span className="text-xs text-slate-400">No reports logged yet</span>
              </div>
            )}

            {/* Center Dynamic Label (Overlay HTML for crisp font rendering) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center select-none">
              {activeFocusItem ? (
                <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                    Category Focus
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none my-1.5">
                    {activeFocusItem.count} Reports
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700">
                      {activeFocusItem.percentFormatted}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">of {totalCount} total</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700 truncate max-w-[140px] mt-1">
                    {activeFocusItem.name}
                  </p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-200 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    TOTAL TRACKED
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none my-1.5">
                    {totalCount} Reports
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full mt-0.5 shadow-2xs">
                    <TrendingUp className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                    <span>12 Categories</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Hover segments to inspect • Click to filter
          </p>
        </div>

        {/* Right Column: Redesigned 2-Column Responsive Legend without nested scrollbar */}
        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categoryStats.map((cat, idx) => {
              const isHovered = hoveredCategory === cat.name;
              const isSelected = selectedCategory === cat.name;
              const isTop = cat.count === maxCount && maxCount > 0;
              const IconComp = cat.icon || Layers;
              const pctWidth = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategoryClick(cat.name)}
                  onMouseEnter={() => setHoveredCategory(cat.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  style={{
                    animationDelay: `${idx * 25}ms`,
                  }}
                  className={`relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 motion-reduce:transition-none ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                      : isHovered
                      ? 'bg-white border-slate-300 shadow-xs'
                      : 'bg-white/90 border-slate-200/80 hover:bg-white hover:border-slate-300'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Filter by ${cat.name}, ${cat.count} reports, ${cat.percentFormatted}`}
                >
                  {/* Top row: Icon, Category Name, Share & Count Badge */}
                  <div className="flex items-center justify-between gap-2.5 w-full">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Styled Category Icon Container */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                        style={{
                          backgroundColor: cat.style.tint,
                          borderColor: cat.style.border,
                          color: cat.style.primary,
                        }}
                      >
                        <IconComp className="w-3.5 h-3.5" aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 group-hover:text-slate-900 truncate leading-snug">
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {cat.percentFormatted} share
                        </div>
                      </div>
                    </div>

                    {/* Right side: Count Badge & optional Top Volume flag */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isTop && (
                        <span className="hidden xl:inline text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md">
                          Most reported
                        </span>
                      )}
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-800 border-slate-200/80 group-hover:bg-slate-100'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </div>
                  </div>

                  {/* Bottom row: Slim colored progress indicator */}
                  <div className="w-full bg-slate-100/90 rounded-full h-1 mt-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(8, pctWidth))}%`,
                        backgroundColor: cat.style.primary,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Floating Micro-Tooltip on Mouse Move */}
      {tooltipState.visible && tooltipState.data && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs min-w-[190px] animate-in fade-in duration-100"
          style={{
            left: `${tooltipState.x}px`,
            top: `${tooltipState.y - 12}px`,
          }}
          role="tooltip"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: tooltipState.data.style.primary }}
            />
            <span className="font-semibold text-slate-100 truncate">
              {tooltipState.data.name}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-[11px] text-slate-300">
            <span>
              <strong className="text-white font-bold">{tooltipState.data.count}</strong> reports
            </span>
            <span className="text-emerald-400 font-semibold">
              {tooltipState.data.percentFormatted}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800 flex items-center gap-1">
            <span>Click to filter in Issue Browser →</span>
          </div>
        </div>
      )}

      {/* 4. Semantic Fallback Table for Assistive Technologies (WCAG AA Compliance) */}
      <table className="sr-only">
        <caption>Issue Distribution by Civic Category</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Reports Count</th>
            <th scope="col">Percentage Share</th>
          </tr>
        </thead>
        <tbody>
          {categoryStats.map((cat) => (
            <tr key={cat.name}>
              <th scope="row">{cat.name}</th>
              <td>{cat.count}</td>
              <td>{cat.percentFormatted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
