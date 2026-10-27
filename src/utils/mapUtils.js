import L from 'leaflet';
import { getDeadlineStatus } from './slaUtils.js';
import { SCHEMATIC_BUILDINGS, resolveIssueCoordinates } from '../data/mockIssues.js';

export const STATUS_PIN_COLORS = {
  'Open': {
    bg: '#f59e0b', // amber-500
    border: '#d97706', // amber-600
    text: '#ffffff',
    ring: 'rgba(245, 158, 11, 0.35)',
    label: 'Open',
  },
  'In Progress': {
    bg: '#0284c7', // sky-600
    border: '#0369a1', // sky-700
    text: '#ffffff',
    ring: 'rgba(2, 132, 199, 0.35)',
    label: 'In Progress',
  },
  'Awaiting Verification': {
    bg: '#9333ea', // purple-600
    border: '#7e22ce', // purple-700
    text: '#ffffff',
    ring: 'rgba(147, 51, 234, 0.35)',
    label: 'Awaiting Verification',
  },
  'Resolution Submitted': {
    bg: '#9333ea', // purple-600
    border: '#7e22ce', // purple-700
    text: '#ffffff',
    ring: 'rgba(147, 51, 234, 0.35)',
    label: 'Awaiting Verification',
  },
  'Resolved': {
    bg: '#10b981', // emerald-500
    border: '#059669', // emerald-600
    text: '#ffffff',
    ring: 'rgba(16, 185, 129, 0.35)',
    label: 'Resolved',
  },
};

/**
 * Returns clean SVG path glyph for category icons inside pin heads
 */
export function getCategoryGlyph(category = '') {
  const cat = category.toLowerCase();
  if (cat.includes('road') && !cat.includes('construction') || cat.includes('footpath') || cat.includes('pothole') || cat.includes('pavement')) {
    // Road / pavement glyph
    return '<path d="M12 2L3 20h18L12 2zm0 4.8l5.2 10.4H6.8L12 6.8z" fill="currentColor"/>';
  }
  if (cat.includes('light') || cat.includes('electricity') || cat.includes('electrical') || cat.includes('wiring')) {
    // Lightbulb
    return '<path d="M12 2a6 6 0 00-6 6c0 2.22 1.21 4.16 3 5.2V16a1 1 0 001 1h4a1 1 0 001-1v-2.8c1.79-1.04 3-2.98 3-5.2a6 6 0 00-6-6zm-1 17h2v1h-2v-1z" fill="currentColor"/>';
  }
  if (cat.includes('drain') || cat.includes('flooding') || cat.includes('sewage') || cat.includes('stormwater')) {
    // Drainage / water flow
    return '<path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" fill="currentColor"/>';
  }
  if (cat.includes('park') || cat.includes('green') || cat.includes('tree') || cat.includes('landscape')) {
    // Tree / leaf
    return '<path d="M12 2L6 10h3v5H8v5h8v-5h-1v-5h3L12 2z" fill="currentColor"/>';
  }
  if (cat.includes('building') || cat.includes('facility') || cat.includes('shelter') || cat.includes('structure')) {
    // Public building / columns
    return '<path d="M12 2L2 7v2h20V7L12 2zm-8 8v8h3v-8H4zm6 0v8h4v-8h-4zm7 0v8h3v-8h-3zM2 20v2h20v-2H2z" fill="currentColor"/>';
  }
  if (cat.includes('waste') || cat.includes('cleanliness') || cat.includes('garbage') || cat.includes('dumping')) {
    // Trash bin
    return '<path d="M6 7v12a2 2 0 002 2h8a2 2 0 002-2V7H6zm3 10V9h2v8H9zm4 0V9h2v8h-2zM15 4h-3l-1-1H9L8 4H5v2h14V4h-4z" fill="currentColor"/>';
  }
  if (cat.includes('traffic') || cat.includes('pedestrian') || cat.includes('signal') || cat.includes('crossing')) {
    // Alert / octagon
    return '<path d="M8.27 3L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3H8.27zM12 7a1 1 0 011 1v4a1 1 0 11-2 0V8a1 1 0 011-1zm0 8a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" fill="currentColor"/>';
  }
  if (cat.includes('water supply') || cat.includes('pipe') || cat.includes('tap') || cat.includes('standpipe')) {
    // Water faucet / supply
    return '<path d="M10 2v2h4V2h-4zm-4 4v2h2v4a4 4 0 004 4h1v3a1 1 0 102 0v-3h1a4 4 0 004-4V8h2V6H6zm10 6a2 2 0 01-2 2h-4a2 2 0 01-2-2V8h8v4z" fill="currentColor"/>';
  }
  if (cat.includes('storm') || cat.includes('natural')) {
    // Cloud lightning / storm
    return '<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM11 11.5l3.5-3.5L13 14h3l-5 6 1.5-5.5H10l1-3z" fill="currentColor"/>';
  }
  if (cat.includes('vandalism') || cat.includes('graffiti')) {
    // Shield alert / brush
    return '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v6h-2V7zm0 8h2v2h-2v-2z" fill="currentColor"/>';
  }
  if (cat.includes('construction') || cat.includes('roadwork')) {
    // Construction cone / tool
    return '<path d="M13.7 2h-3.4L8.5 7h7l-1.8-5zm-2.2 7l-2 5h5l-2-5zm-3.5 7l-2.4 6h12.8l-2.4-6H8zM2 22h20v2H2v-2z" fill="currentColor"/>';
  }
  // Other / default dot
  return '<circle cx="12" cy="12" r="4.5" fill="currentColor"/>';
}

/**
 * Creates custom SVG Pin icon for an issue
 */
export function createCustomMarkerIcon(issue, isSelected = false) {
  const statusConfig = STATUS_PIN_COLORS[issue.status] || STATUS_PIN_COLORS['Open'];
  const glyph = getCategoryGlyph(issue.category);
  const scale = isSelected ? 1.2 : 1;
  const pinWidth = Math.round(28 * scale);
  const pinHeight = Math.round(36 * scale);

  const html = `
    <div class="relative group cursor-pointer" style="transform: translate(-50%, -100%);">
      <div class="transition-transform duration-200 ${isSelected ? 'scale-110 drop-shadow-xl' : 'hover:scale-105 drop-shadow-md'}">
        <svg width="${pinWidth}" height="${pinHeight}" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Pin body -->
          <path d="M14 0C6.268 0 0 6.268 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.268 21.732 0 14 0Z" 
                fill="${statusConfig.bg}" 
                stroke="#ffffff" 
                stroke-width="2"/>
          <!-- Inner icon circle -->
          <circle cx="14" cy="13" r="8.5" fill="#ffffff" />
          <!-- Category symbol inside pin -->
          <g transform="translate(4.5, 3.5) scale(0.8)" color="${statusConfig.bg}">
            ${glyph}
          </g>
        </svg>
      </div>
      ${isSelected ? `<div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-slate-900/30 rounded-full blur-[1px]"></div>` : ''}
    </div>
  `;

  return L.divIcon({
    className: 'civic-marker-pin',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -pinHeight + 6],
  });
}

/**
 * Creates cluster icon showing total number of grouped issues
 */
export function createClusterIcon(count, issues = []) {
  // Determine dominant status in cluster
  const hasOpen = issues.some((i) => i.status === 'Open');
  const hasInProgress = issues.some((i) => i.status === 'In Progress');
  const hasVerification = issues.some(
    (i) => i.status === 'Resolution Submitted' || i.status === 'Awaiting Verification'
  );

  let ringColor = 'rgba(245, 158, 11, 0.4)'; // amber default
  if (!hasOpen && hasInProgress) ringColor = 'rgba(2, 132, 199, 0.4)';
  if (!hasOpen && !hasInProgress && hasVerification) ringColor = 'rgba(147, 51, 234, 0.4)';
  if (!hasOpen && !hasInProgress && !hasVerification) ringColor = 'rgba(16, 185, 129, 0.4)';

  const html = `
    <div style="transform: translate(-50%, -50%);" class="group cursor-pointer">
      <div class="flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs shadow-md border-2 border-white transition-transform group-hover:scale-110"
           style="box-shadow: 0 0 0 4px ${ringColor};">
        ${count}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'civic-marker-cluster',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/**
 * Generates popup HTML content for a single issue marker
 */
export function createPopupHtml(issue, isExactLocation = false) {
  const statusColor = STATUS_PIN_COLORS[issue.status] || STATUS_PIN_COLORS['Open'];
  const priorityClass =
    issue.priority === 'High'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : issue.priority === 'Medium'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  const precision = issue.locationPrecision || (isExactLocation ? 'verified-gps' : 'approximate-landmark');
  const locBadge =
    precision === 'verified-gps'
      ? `<span class="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
           <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified GPS
         </span>`
      : precision === 'user-pinned'
      ? `<span class="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
           <span class="w-1.5 h-1.5 rounded-full bg-sky-500"></span> User-Pinned Location
         </span>`
      : precision === 'unmapped'
      ? `<span class="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
           <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Unmapped Queue
         </span>`
      : `<span class="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
           <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Approximate Landmark Location
         </span>`;

  const sampleBadge = issue.isDemoReport
    ? `<span class="inline-flex items-center text-[9px] font-medium text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Demo</span>`
    : '';

  return `
    <div class="text-left font-sans text-slate-800" style="min-width: 240px; max-width: 290px;">
      <!-- Header with ID, Demo badge, Priority & Status -->
      <div class="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-slate-100">
        <div class="flex items-center gap-1.5">
          <span class="font-mono text-xs font-bold text-slate-700 tracking-tight">${issue.id}</span>
          ${sampleBadge}
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border ${priorityClass}">
            ${issue.priority}
          </span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style="background-color: ${statusColor.bg};">
            ${statusColor.label}
          </span>
        </div>
      </div>

      <!-- Title -->
      <h4 class="text-xs font-bold text-slate-900 leading-snug mb-1.5 line-clamp-2">
        ${escapeHtml(issue.title)}
      </h4>

      <!-- Category & Location -->
      <div class="space-y-1 text-[11px] text-slate-600 mb-2.5">
        <div class="flex items-start gap-1">
          <span class="font-medium text-slate-400 shrink-0">Category:</span>
          <span class="text-slate-700 font-medium truncate">${escapeHtml(issue.category)}</span>
        </div>
        <div class="flex items-start gap-1">
          <span class="font-medium text-slate-400 shrink-0">Location:</span>
          <span class="text-slate-700 truncate">${escapeHtml(issue.location || issue.building || 'New Town, Kolkata')}</span>
        </div>
        <div class="pt-0.5 flex items-center gap-1.5 flex-wrap">
          ${locBadge}
          ${issue.coordinates?.lat && issue.coordinates?.lng ? `<span class="font-mono text-[9px] text-slate-400">(${Number(issue.coordinates.lat).toFixed(4)}, ${Number(issue.coordinates.lng).toFixed(4)})</span>` : ''}
        </div>
      </div>

      <!-- CTA Button to open existing detail modal -->
      <button 
        type="button" 
        data-inspect-issue-id="${issue.id}" 
        class="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
      >
        <span>Inspect report</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  `;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Groups issues into hotspot areas needing attention based on actual data
 */
export function computeHotspots(issues = []) {
  const groups = {};

  // Initialize from known landmarks
  SCHEMATIC_BUILDINGS.forEach((bldg) => {
    groups[bldg.id] = {
      id: bldg.id,
      name: bldg.name,
      landmarkName: bldg.landmarkName || bldg.name,
      zone: bldg.zone || 'New Town',
      coordinates: bldg.coordinates,
      issues: [],
    };
  });

  // Assign issues
  issues.forEach((issue) => {
    const coordsInfo = resolveIssueCoordinates(issue);
    if (!coordsInfo) return; // Unmapped issues don't create geographic hotspots

    // Match to building
    let targetBldg = SCHEMATIC_BUILDINGS.find((b) => {
      const match = (issue.building || '').toLowerCase();
      const loc = (issue.location || '').toLowerCase();
      return match.includes(b.name.toLowerCase()) || loc.includes(b.name.toLowerCase());
    });

    if (!targetBldg) {
      // Find closest schematic building
      let minDist = Infinity;
      SCHEMATIC_BUILDINGS.forEach((bldg) => {
        if (bldg.coordinates) {
          const d = Math.hypot(
            coordsInfo.lat - bldg.coordinates.lat,
            coordsInfo.lng - bldg.coordinates.lng
          );
          if (d < minDist) {
            minDist = d;
            targetBldg = bldg;
          }
        }
      });
    }

    if (targetBldg && groups[targetBldg.id]) {
      groups[targetBldg.id].issues.push(issue);
    }
  });

  // Calculate statistics for each hotspot
  return Object.values(groups)
    .map((group) => {
      const groupIssues = group.issues;
      const totalCount = groupIssues.length;
      const openCount = groupIssues.filter((i) => i.status === 'Open').length;
      const overdueCount = groupIssues.filter((i) => {
        const deadline = getDeadlineStatus(i);
        return deadline.isOverdue;
      }).length;

      // Top category calculation
      const catCounts = {};
      groupIssues.forEach((i) => {
        catCounts[i.category] = (catCounts[i.category] || 0) + 1;
      });
      let topCategory = 'None';
      let maxCatCount = 0;
      Object.entries(catCounts).forEach(([cat, count]) => {
        if (count > maxCatCount) {
          maxCatCount = count;
          topCategory = cat;
        }
      });

      return {
        ...group,
        totalCount,
        openCount,
        overdueCount,
        topCategory: totalCount > 0 ? topCategory : 'None reported',
        hasAttentionNeeded: openCount > 0 || overdueCount > 0,
      };
    })
    .filter((g) => g.totalCount > 0)
    .sort((a, b) => b.openCount + b.overdueCount * 2 - (a.openCount + a.overdueCount * 2));
}
