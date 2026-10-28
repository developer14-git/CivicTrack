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
  RotateCcw,
  Check,
  Filter,
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockIssues';

// Elegant emerald, teal, and muted slate palette complementing CivicTrack's theme
const CATEGORY_COLOR_PALETTE = {
  'Roads and Footpaths': {
    primary: '#047857', // Deep Emerald 700
    hover: '#065f46',
    tint: '#ecfdf5',
    text: '#065f46',
    border: '#a7f3d0',
    icon: Road,
  },
  'Streetlights and Electricity': {
    primary: '#0d9488', // Teal 600
    hover: '#0f766e',
    tint: '#f0fdfa',
    text: '#115e59',
    border: '#99f6e4',
    icon: Zap,
  },
  'Drainage and Flooding': {
    primary: '#0284c7', // Sky-Teal 600
    hover: '#0369a1',
    tint: '#f0f9ff',
    text: '#075985',
    border: '#bae6fd',
    icon: Droplets,
  },
  'Public Parks and Green Spaces': {
    primary: '#10b981', // Emerald 500 / Mint
    hover: '#059669',
    tint: '#ecfdf5',
    text: '#047857',
    border: '#6ee7b7',
    icon: Trees,
  },
  'Public Buildings and Facilities': {
    primary: '#334155', // Slate 700 / Deep Slate
    hover: '#1e293b',
    tint: '#f8fafc',
    text: '#1e293b',
    border: '#cbd5e1',
    icon: Building2,
  },
  'Waste and Cleanliness': {
    primary: '#0f766e', // Deep Teal 700
    hover: '#115e59',
    tint: '#f0fdfa',
    text: '#134e4a',
    border: '#5eead4',
    icon: Trash2,
  },
  'Traffic and Pedestrian Safety': {
    primary: '#059669', // Classic Emerald 600
    hover: '#047857',
    tint: '#ecfdf5',
    text: '#065f46',
    border: '#a7f3d0',
    icon: AlertTriangle,
  },
  'Water Supply': {
    primary: '#0891b2', // Cyan-Teal 600
    hover: '#0e7490',
    tint: '#ecfeff',
    text: '#155e75',
    border: '#a5f3fc',
    icon: Wrench,
  },
  'Storm and Natural Damage': {
    primary: '#475569', // Muted Slate 600
    hover: '#334155',
    tint: '#f1f5f9',
    text: '#334155',
    border: '#cbd5e1',
    icon: CloudRain,
  },
  'Public Property Vandalism': {
    primary: '#64748b', // Slate 500
    hover: '#475569',
    tint: '#f8fafc',
    text: '#475569',
    border: '#e2e8f0',
    icon: ShieldAlert,
  },
  'Construction and Roadwork': {
    primary: '#14b8a6', // Bright Teal 500
    hover: '#0d9488',
    tint: '#f0fdfa',
    text: '#0f766e',
    border: '#99f6e4',
    icon: HardHat,
  },
  'Other Public Infrastructure': {
    primary: '#94a3b8', // Muted Slate 400
    hover: '#64748b',
    tint: '#f8fafc',
    text: '#64748b',
    border: '#e2e8f0',
    icon: Layers,
  },
};

const FALLBACK_STYLE = {
  primary: '#10b981',
  hover: '#059669',
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
  const [localFilter, setLocalFilter] = useState('All');
  const [tooltipState, setTooltipState] = useState({ visible: false, x: 0, y: 0, data: null });
  const containerRef = useRef(null);

  const effectiveSelectedCategory =
    selectedCategory && selectedCategory !== 'All' ? selectedCategory : localFilter;

  // 1. Dynamic derivation of category counts and percentages from real issues
  const { categoryStats, totalCount, topCategory } = useMemo(() => {
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

    return {
      categoryStats: stats,
      totalCount: total,
      topCategory: stats[0] || null,
    };
  }, [issues]);

  // 2. Compute donut slices
  const { slices, cx, cy, innerR } = useMemo(() => {
    const center = 150;
    const rIn = 82;
    const rOut = 126;

    if (totalCount === 0) {
      return { slices: [], cx: center, cy: center, innerR: rIn };
    }

    let currentAngle = -Math.PI / 2; // Start at 12 o'clock
    const totalSlices = categoryStats.filter((s) => s.count > 0).length;
    const gapAngle = totalSlices > 1 ? 0.024 : 0; // ~1.4deg clean segment gap

    const computed = categoryStats
      .filter((cat) => cat.count > 0)
      .map((cat) => {
        const sliceAngle = (cat.count / totalCount) * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        const midAngle = (startAngle + endAngle) / 2;

        const safeStart = startAngle + gapAngle / 2;
        const safeEnd = endAngle - gapAngle / 2;

        const pathD = describeDonutArc(center, center, rIn, rOut, safeStart, safeEnd);

        // Precompute slight radial translate for hover / active focus
        const popDistance = 5;
        const popX = Math.cos(midAngle) * popDistance;
        const popY = Math.sin(midAngle) * popDistance;

        currentAngle += sliceAngle;

        return {
          ...cat,
          startAngle,
          endAngle,
          midAngle,
          pathD,
          popX,
          popY,
        };
      });

    return { slices: computed, cx: center, cy: center, innerR: rIn, outerR: rOut };
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

  const handleResetFilter = useCallback(() => {
    setLocalFilter('All');
    if (onSelectCategory) onSelectCategory('All');
    if (onViewAllIssues) onViewAllIssues('All');
  }, [onSelectCategory, onViewAllIssues]);

  const handleNavigateToIssueBrowser = useCallback(
    (catName) => {
      if (onViewAllIssues) {
        onViewAllIssues(catName || effectiveSelectedCategory || 'All');
      }
    },
    [onViewAllIssues, effectiveSelectedCategory]
  );

  // Active focus item for center donut display
  const activeFocusItem = useMemo(() => {
    if (hoveredCategory) {
      return categoryStats.find((c) => c.name === hoveredCategory) || null;
    }
    if (effectiveSelectedCategory !== 'All') {
      return categoryStats.find((c) => c.name === effectiveSelectedCategory) || null;
    }
    return null;
  }, [hoveredCategory, effectiveSelectedCategory, categoryStats]);

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
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-7 space-y-6 relative text-left"
    >
      {/* 1. Header with Title & Reset Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
              <PieChartIcon className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Issues by Category
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time complaint distribution across all 12 public infrastructure categories in New Town
          </p>
        </div>

        {/* Quick Filter Control */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {effectiveSelectedCategory !== 'All' ? (
            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset filter ({effectiveSelectedCategory})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNavigateToIssueBrowser('All')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
            >
              <span>Explore in Issue Browser</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Donut Chart & Legend Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left Column: Interactive Donut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] flex items-center justify-center">
            {totalCount > 0 ? (
              <svg
                viewBox="0 0 300 300"
                className="w-full h-full transform transition-transform duration-300"
                role="img"
                aria-label={`Donut chart representing ${totalCount} reports across 12 civic categories`}
              >
                <defs>
                  {/* Subtle inner shadow filter for depth */}
                  <filter id="donut-shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
                  </filter>
                </defs>

                {/* Slices */}
                <g filter="url(#donut-shadow)">
                  {slices.map((slice) => {
                    const isHovered = hoveredCategory === slice.name;
                    const isSelected = effectiveSelectedCategory === slice.name;
                    const isDimmed =
                      (hoveredCategory && !isHovered) ||
                      (effectiveSelectedCategory !== 'All' && !isSelected && !hoveredCategory);

                    const transformStyle =
                      isHovered || isSelected
                        ? `translate(${slice.popX}px, ${slice.popY}px)`
                        : 'translate(0px, 0px)';

                    return (
                      <path
                        key={slice.name}
                        d={slice.pathD}
                        fill={slice.style.primary}
                        style={{
                          transform: transformStyle,
                          transition:
                            'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, filter 0.2s ease',
                          opacity: isDimmed ? 0.38 : 1,
                          cursor: 'pointer',
                        }}
                        className="hover:brightness-105 focus:outline-none"
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

                {/* Center Donut Hole Backdrop */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={innerR - 4}
                  fill="#ffffff"
                  stroke="#f1f5f9"
                  strokeWidth="1.5"
                />
              </svg>
            ) : (
              /* Empty state fallback ring */
              <div className="w-56 h-56 rounded-full border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center">
                <span className="text-xs text-slate-400">No reports logged yet</span>
              </div>
            )}

            {/* Center Dynamic Label (Overlay HTML for crisp font rendering) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center select-none">
              {activeFocusItem ? (
                <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {effectiveSelectedCategory === activeFocusItem.name ? 'Active Filter' : 'Category Focus'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none my-1">
                    {activeFocusItem.count}
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full leading-none">
                    {activeFocusItem.percentFormatted}
                  </span>
                  <p className="text-[11px] font-medium text-slate-600 truncate max-w-[130px] mt-1.5">
                    {activeFocusItem.name}
                  </p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-200 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Tracked
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none my-1">
                    {totalCount} Reports
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full mt-1.5">
                    12 Categories
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Hover segments to inspect • Click to filter
          </p>
        </div>

        {/* Right Column: Legend Breakdown with 2-Column Responsive Grid */}
        <div className="lg:col-span-7 space-y-3">
          {/* Legend Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
            <span className="font-semibold text-slate-700">
              Infrastructure Categories (12)
            </span>
            {topCategory && (
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Top: <strong className="text-slate-800">{topCategory.name}</strong> ({topCategory.count})
              </span>
            )}
          </div>

          {/* 2-Column Compact Legend Grid with Scrolling Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
            {categoryStats.map((cat) => {
              const isHovered = hoveredCategory === cat.name;
              const isSelected = effectiveSelectedCategory === cat.name;
              const IconComp = cat.icon || Layers;

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategoryClick(cat.name)}
                  onMouseEnter={() => setHoveredCategory(cat.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer group ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                      : isHovered
                      ? 'bg-slate-50 border-slate-300 shadow-2xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50/60 hover:border-slate-300'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Filter by ${cat.name}, ${cat.count} reports, ${cat.percentFormatted}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Color Swatch Dot with Icon */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: cat.style.tint,
                        borderColor: cat.style.border,
                        color: cat.style.primary,
                      }}
                    >
                      <IconComp className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 truncate leading-snug">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {cat.percentFormatted} share
                      </div>
                    </div>
                  </div>

                  {/* Count & Status Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200/80 group-hover:bg-white'
                      }`}
                    >
                      {cat.count}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Filter Action Bar */}
          {effectiveSelectedCategory !== 'All' && (
            <div className="mt-3 p-3 bg-emerald-50/90 border border-emerald-200/90 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900">
                <Filter className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>
                  Filtering by <strong>{effectiveSelectedCategory}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigateToIssueBrowser(effectiveSelectedCategory)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <span>Open in Issue Browser</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="px-2 py-1 text-emerald-800 hover:text-emerald-950 font-medium underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Floating Micro-Tooltip on Mouse Move */}
      {tooltipState.visible && tooltipState.data && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[180px] animate-in fade-in duration-100"
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
          <div className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800 flex items-center gap-1">
            <span>Click to filter category</span>
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
