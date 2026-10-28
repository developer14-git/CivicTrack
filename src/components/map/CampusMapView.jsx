import { useState, useMemo, useRef } from 'react';
import {
  PlusCircle,
  AlertTriangle,
  Eye,
  Flame,
  MapPin,
  X,
  Compass,
  Info,
} from 'lucide-react';
import GeographicMap from './GeographicMap';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import { computeHotspots } from '../../utils/mapUtils';
import { getDeadlineStatus } from '../../utils/slaUtils';
import {
  NEW_TOWN_AREAS,
  resolveIssueCoordinates,
} from '../../data/mockIssues';

export default function CampusMapView({
  issues = [],
  selectedCampus,
  onSelectCampus,
  onOpenIssueDetail,
  onOpenReportModal,
}) {
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [hoveredIssueId, setHoveredIssueId] = useState(null);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const mapApiRef = useRef(null);

  // Compute hotspots from actual issue data
  const hotspots = useMemo(() => {
    return computeHotspots(issues);
  }, [issues]);

  // Active hotspot object if one is selected
  const activeHotspot = useMemo(() => {
    if (!selectedHotspotId) return null;
    return hotspots.find((h) => h.id === selectedHotspotId) || null;
  }, [hotspots, selectedHotspotId]);

  // Handle clicking a hotspot card: zooms map & filters reports
  const handleSelectHotspot = (hotspot) => {
    if (selectedHotspotId === hotspot.id) {
      // Toggle off
      setSelectedHotspotId(null);
      if (mapApiRef.current?.recenter) {
        mapApiRef.current.recenter();
      }
    } else {
      setSelectedHotspotId(hotspot.id);
      if (mapApiRef.current?.flyTo && hotspot.coordinates) {
        mapApiRef.current.flyTo(hotspot.coordinates.lat, hotspot.coordinates.lng, 15);
      }
    }
  };

  // Filter issues for the side report list based on active area or hotspot
  const sideListIssues = useMemo(() => {
    return issues.filter((issue) => {
      // If a hotspot is selected, only show issues belonging to it
      if (activeHotspot) {
        return activeHotspot.issues.some((i) => i.id === issue.id);
      }

      // If Action Area filter is selected
      if (selectedCampus && selectedCampus !== 'All Action Areas') {
        const areaMatched =
          issue.campus === selectedCampus ||
          issue.area === selectedCampus ||
          (issue.location && issue.location.includes(selectedCampus));
        if (!areaMatched) return false;
      }

      return true;
    });
  }, [issues, activeHotspot, selectedCampus]);

  // Count unmapped issues
  const unmappedCount = useMemo(() => {
    return issues.filter((issue) => !resolveIssueCoordinates(issue)).length;
  }, [issues]);

  const mappedCount = issues.length - unmappedCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Explore New Town Map
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-semibold px-2.5 py-0.5 rounded-full">
              Kolkata, WB
            </span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
              OpenStreetMap GIS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real geographic map of reported civic issues across Action Area I, II, and III. Click markers or clusters to inspect reports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenReportModal && (
            <button
              type="button"
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg transition-all shadow-xs hover:shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>Report a Problem</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Reports
          </span>
          <div className="text-2xl font-extrabold text-slate-900 leading-none">{issues.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">In central database</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Mapped on GIS
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 leading-none">{mappedCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Verified GPS & landmarks</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Unmapped Queue
          </span>
          <div className="text-2xl font-extrabold text-amber-600 leading-none">{unmappedCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Pending coordinates</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Hotspot Areas
          </span>
          <div className="text-2xl font-extrabold text-slate-900 leading-none">{hotspots.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active civic clusters</span>
        </div>
      </div>

      {/* 3. Main Split Map & Hotspot Exploration Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Geographic Leaflet Map (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>Filter by Action Area:</span>
              <select
                value={selectedCampus || 'All Action Areas'}
                onChange={(e) => onSelectCampus?.(e.target.value)}
                className="bg-white border border-slate-200/90 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer shadow-2xs"
              >
                {NEW_TOWN_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {selectedHotspotId && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/90 text-amber-900 px-3 py-1 rounded-full text-xs shadow-2xs">
                <span>Focused: <strong>{activeHotspot?.name}</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedHotspotId(null)}
                  className="text-amber-700 hover:text-amber-950 ml-1 font-bold cursor-pointer"
                  aria-label="Clear focus"
                >
                  <X className="w-3.5 h-3.5 inline" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive Geographic Map Canvas */}
          <div className="rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs">
            <GeographicMap
              issues={issues}
              onOpenIssueDetail={onOpenIssueDetail}
              height="580px"
              highlightedIssueId={hoveredIssueId || selectedIssueId}
              onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
              externalFilter={activeHotspot?.landmarkName || (selectedCampus && selectedCampus !== 'All Action Areas' ? selectedCampus : null)}
              onResetExternalFilter={() => {
                setSelectedHotspotId(null);
                onSelectCampus?.('All Action Areas');
              }}
              onMapReady={(api) => {
                mapApiRef.current = api;
              }}
            />
          </div>

          {/* Map Attribution and Honesty Disclaimer */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Verified coordinates reflect field reports and landmark geocodes. Illustrative student project for New Town, Kolkata.
              </span>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">
              © OpenStreetMap contributors
            </span>
          </div>
        </div>

        {/* Right Column: Hotspots & Selected Reports Panel (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          {/* A: Hotspot Summary ("Areas needing attention") */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Areas Needing Attention</h2>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full">
                Hotspots
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Based on CivicTrack user reports. Click an area to fly directly to it on the map and filter the queue below.
            </p>

            {/* Hotspot Cards List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {hotspots.map((hotspot) => {
                const isSelected = selectedHotspotId === hotspot.id;
                return (
                  <button
                    key={hotspot.id}
                    type="button"
                    onClick={() => handleSelectHotspot(hotspot)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-xs'
                        : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {hotspot.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 pl-5 block mt-0.5">
                          {hotspot.zone}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {hotspot.overdueCount > 0 && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded-md">
                            {hotspot.overdueCount} Overdue
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md">
                          {hotspot.openCount} Open
                        </span>
                      </div>
                    </div>

                    <div className="pl-5 pt-1.5 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100/80 mt-1.5">
                      <span className="text-slate-400">Top issue:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                        {hotspot.topCategory}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 leading-tight">
              * Hotspot scores represent community reports recorded in this prototype, not official Kolkata municipal ratings.
            </div>
          </div>

          {/* B: Reports in Selected Area / Active View */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  {activeHotspot ? `Reports in ${activeHotspot.name}` : 'Mapped Reports in Active Area'}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {sideListIssues.length} {sideListIssues.length === 1 ? 'report' : 'reports'} listed
                </span>
              </div>

              {activeHotspot && (
                <button
                  type="button"
                  onClick={() => setSelectedHotspotId(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Clear focus
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {sideListIssues.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No reports match the current filter.
                </div>
              ) : (
                sideListIssues.map((issue) => {
                  const deadline = getDeadlineStatus(issue);
                  const isHovered = hoveredIssueId === issue.id;

                  return (
                    <div
                      key={issue.id}
                      onMouseEnter={() => setHoveredIssueId(issue.id)}
                      onMouseLeave={() => setHoveredIssueId(null)}
                      className={`p-3 rounded-xl border transition-all text-left ${
                        isHovered
                          ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded">
                          #{issue.id}
                        </span>
                        <div className="flex items-center gap-1">
                          {issue.priority && <PriorityBadge priority={issue.priority} size="xs" />}
                          {deadline.isOverdue && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 rounded flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                            </span>
                          )}
                          <StatusBadge status={issue.status} size="xs" />
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2 mb-1">
                        {issue.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                        <span className="truncate max-w-[150px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{issue.location || issue.building || 'New Town, Kolkata'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenIssueDetail(issue.id)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer ml-2 shrink-0 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
