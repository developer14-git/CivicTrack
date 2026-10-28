import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  Search,
  Filter,
  Maximize2,
  Minimize2,
  RotateCcw,
  AlertTriangle,
  X,
  Info,
} from 'lucide-react';
import {
  STATUS_PIN_COLORS,
  createCustomMarkerIcon,
  createClusterIcon,
  createPopupHtml,
  filterMappedIssues,
  clusterMappedIssues,
} from '../../utils/mapUtils';
import {
  CATEGORIES,
  NEW_TOWN_MAP_CENTER,
  resolveIssueCoordinates,
} from '../../data/mockIssues';

export default function GeographicMap({
  issues = [],
  onOpenIssueDetail,
  height = '520px',
  isCompact = false,
  highlightedIssueId = null,
  onSelectIssue = null,
  onMapReady = null,
  externalFilter = null, // e.g. from parent Hotspot click
  onResetExternalFilter = null,
}) {
  const mapContainerRef = useRef(null);
  const wrapperRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  const issuesRef = useRef(issues);
  const onOpenIssueDetailRef = useRef(onOpenIssueDetail);
  const onMapReadyRef = useRef(onMapReady);

  useEffect(() => {
    issuesRef.current = issues;
    onOpenIssueDetailRef.current = onOpenIssueDetail;
    onMapReadyRef.current = onMapReady;
  }, [issues, onOpenIssueDetail, onMapReady]);


  // Map state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(!isCompact);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  const [showUnmappedDrawer, setShowUnmappedDrawer] = useState(false);
  const [activeZoom, setActiveZoom] = useState(13);

  // Group issues into mapped and unmapped
  const { mappedIssues, unmappedIssues } = useMemo(() => {
    const mapped = [];
    const unmapped = [];

    issues.forEach((issue) => {
      const coords = resolveIssueCoordinates(issue);
      if (coords) {
        mapped.push({
          issue,
          lat: coords.lat,
          lng: coords.lng,
          isExact: coords.isExact,
          source: coords.source,
        });
      } else {
        unmapped.push(issue);
      }
    });

    return { mappedIssues: mapped, unmappedIssues: unmapped };
  }, [issues]);

  // Apply filters to mapped issues
  const visibleMappedIssues = useMemo(() => {
    return filterMappedIssues(mappedIssues, {
      searchQuery,
      externalFilter,
      categoryFilter,
      statusFilter,
      priorityFilter,
      unresolvedOnly,
    });
  }, [
    mappedIssues,
    searchQuery,
    externalFilter,
    categoryFilter,
    statusFilter,
    priorityFilter,
    unresolvedOnly,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'All' ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    unresolvedOnly ||
    Boolean(externalFilter && externalFilter !== 'ALL' && externalFilter !== 'All Action Areas');

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setCategoryFilter('All');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setUnresolvedOnly(false);
    if (onResetExternalFilter) {
      onResetExternalFilter();
    }
  }, [onResetExternalFilter]);

  // Track initial bounds fitting to avoid fighting user pan/zoom
  const hasFittedInitialBoundsRef = useRef(false);

  // Automatically fit map bounds to the full New Town demo dataset on initial load
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || hasFittedInitialBoundsRef.current || visibleMappedIssues.length === 0) return;

    const bounds = L.latLngBounds(visibleMappedIssues.map((m) => [m.lat, m.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [24, 24],
        maxZoom: 14,
      });
      hasFittedInitialBoundsRef.current = true;
    }
  }, [visibleMappedIssues]);

  // If external filter changes (e.g. clicked a specific Hotspot or Action Area), smoothly fit bounds to it
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !externalFilter || externalFilter === 'ALL' || externalFilter === 'All Action Areas') return;
    if (visibleMappedIssues.length > 0) {
      const bounds = L.latLngBounds(visibleMappedIssues.map((m) => [m.lat, m.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    }
  }, [externalFilter, visibleMappedIssues]);
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: NEW_TOWN_MAP_CENTER,
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false, // We'll add custom positioned zoom control
      attributionControl: false,
    });

    // Add standard attribution control at bottom-right
    L.control
      .attribution({
        position: 'bottomright',
        prefix: false,
      })
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" class="hover:underline">OpenStreetMap</a> contributors'
      )
      .addTo(map);

    // Custom positioned zoom control at bottom-right
    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map);

    // Add OpenStreetMap tile layer
    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 11,
      crossOrigin: true,
    });

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.on('load', () => {
      setTileError(false);
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // Create layer group for pins
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Track zoom level for clustering recomputation
    map.on('zoomend', () => {
      setActiveZoom(map.getZoom());
    });

    // Popup Inspect Report button click delegation
    map.on('popupopen', (e) => {
      const popupElement = e.popup.getElement();
      if (!popupElement) return;

      const inspectBtn = popupElement.querySelector('[data-inspect-issue-id]');
      if (inspectBtn) {
        inspectBtn.onclick = (event) => {
          event.preventDefault();
          const issueId = inspectBtn.getAttribute('data-inspect-issue-id');
          const currentIssues = issuesRef.current || [];
          const targetIssue = currentIssues.find((i) => i.id === issueId);
          if (targetIssue && onOpenIssueDetailRef.current) {
            onOpenIssueDetailRef.current(targetIssue);
          }
        };
      }
    });

    mapInstanceRef.current = map;

    // Expose map API if parent requested
    if (onMapReadyRef.current) {
      onMapReadyRef.current({
        map,
        flyTo: (lat, lng, zoom = 15) => {
          map.flyTo([lat, lng], zoom, { duration: 0.8 });
        },
        recenter: () => {
          map.flyTo(NEW_TOWN_MAP_CENTER, 13, { duration: 0.8 });
        },
      });
    }

    // Force map to adapt to its container size
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount


  // Watch container resize to prevent grey tiles
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Spatial clustering and marker rendering whenever issues, zoom, or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (visibleMappedIssues.length === 0) return;

    const currentZoom = map.getZoom();
    const clusters = clusterMappedIssues(
      visibleMappedIssues,
      currentZoom,
      (lat, lng) => map.latLngToContainerPoint([lat, lng])
    );

    // Detect identical coordinates among individual markers for visual spiderfy
    const coordUsage = new Map();
    clusters.forEach((cl) => {
      if (!cl.isCluster) {
        const key = cl.item.lat.toFixed(5) + ',' + cl.item.lng.toFixed(5);
        coordUsage.set(key, (coordUsage.get(key) || 0) + 1);
      }
    });

    const coordIndex = new Map();

    // Render markers and clusters
    clusters.forEach((cl) => {
      if (cl.isCluster) {
        // Cluster marker
        const clusterMarker = L.marker([cl.lat, cl.lng], {
          icon: createClusterIcon(
            cl.count,
            cl.items.map((it) => it.issue)
          ),
          riseOnHover: true,
        });

        clusterMarker.on('click', () => {
          const bounds = L.latLngBounds(cl.items.map((it) => [it.lat, it.lng]));
          if (bounds.isValid() && currentZoom < 16) {
            const spanLat = bounds.getNorth() - bounds.getSouth();
            const spanLng = bounds.getEast() - bounds.getWest();

            if (spanLat < 0.0003 && spanLng < 0.0003) {
              // Zoom directly in to level 16 to reveal all individual markers
              map.setView([cl.lat, cl.lng], Math.min(16, currentZoom + 2), { animate: true });
            } else {
              map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
            }
          } else {
            // Open popup list of issues in this cluster
            const popupHtml = `
              <div class="text-left font-sans text-slate-800" style="min-width: 250px; max-width: 300px;">
                <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span class="text-xs font-bold text-slate-900">${cl.count} Reports at this Location</span>
                  <span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">Cluster</span>
                </div>
                <div class="max-h-48 overflow-y-auto space-y-2 pr-1">
                  ${cl.items
                    .map(
                      ({ issue }) => `
                    <div class="p-1.5 rounded border border-slate-100 hover:bg-slate-50 text-left">
                      <div class="flex items-center justify-between gap-1 mb-1">
                        <span class="font-mono text-[11px] font-bold text-slate-700">${issue.id}</span>
                        <span class="text-[10px] px-1.5 py-0.2 rounded font-semibold text-white" style="background-color: ${
                          STATUS_PIN_COLORS[issue.status]?.bg || '#f59e0b'
                        }">
                          ${issue.status}
                        </span>
                      </div>
                      <p class="text-xs font-medium text-slate-800 line-clamp-1 mb-1">${escapeXml(issue.title)}</p>
                      <button 
                        type="button" 
                        data-inspect-issue-id="${issue.id}" 
                        class="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
                      >
                        Inspect details →
                      </button>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `;
            clusterMarker.bindPopup(popupHtml, { className: 'civic-leaflet-popup' }).openPopup();
          }
        });

        markersLayer.addLayer(clusterMarker);
      } else {
        // Individual issue marker
        const { issue, lat, lng, isExact } = cl.item;
        const isSelected = highlightedIssueId === issue.id;

        // Deterministic micro-separation if multiple individual markers share the exact same spot
        const key = lat.toFixed(5) + ',' + lng.toFixed(5);
        const totalAtCoord = coordUsage.get(key) || 1;
        let renderedLat = lat;
        let renderedLng = lng;

        if (totalAtCoord > 1) {
          const idx = coordIndex.get(key) || 0;
          coordIndex.set(key, idx + 1);
          // Radial spiderfy displacement (approx 12-15 meters)
          const angle = (2 * Math.PI * idx) / totalAtCoord;
          const radius = 0.00012; // ~13 meters
          renderedLat = lat + radius * Math.cos(angle);
          renderedLng = lng + radius * Math.sin(angle);
        }

        const marker = L.marker([renderedLat, renderedLng], {
          icon: createCustomMarkerIcon(issue, isSelected),
          riseOnHover: true,
        });

        // Bind interactive popup card
        const popupContent = createPopupHtml(issue, isExact);
        marker.bindPopup(popupContent, {
          className: 'civic-leaflet-popup',
          offset: [0, -10],
        });

        marker.on('click', () => {
          if (onSelectIssue) {
            onSelectIssue(issue);
          }
        });

        markersLayer.addLayer(marker);

        // If this marker is specifically highlighted, open popup
        if (isSelected) {
          setTimeout(() => {
            marker.openPopup();
          }, 100);
        }
      }
    });
  }, [visibleMappedIssues, activeZoom, highlightedIssueId, onSelectIssue, onOpenIssueDetail]);

  // Recenter map: fits full New Town dataset bounds
  const handleRecenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (visibleMappedIssues.length > 0) {
      const bounds = L.latLngBounds(visibleMappedIssues.map((m) => [m.lat, m.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
        return;
      }
    }
    map.flyTo(NEW_TOWN_MAP_CENTER, 13, { duration: 0.8 });
  }, [visibleMappedIssues]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs select-none transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* 1. Leaflet Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 outline-none" tabIndex={0} />

      {/* 2. Floating Top-Left Search and Filter Panel */}
      <div className="absolute top-3 left-3 z-10 max-w-sm sm:max-w-md w-[calc(100%-1.5rem)] pointer-events-auto space-y-2">
        {/* Dataset visibility badge & active filters reset bar */}
        <div className="flex items-center justify-between gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-lg shadow-2xs border border-slate-200/90 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-medium text-slate-700 truncate">
              Showing <strong>{visibleMappedIssues.length}</strong> of {mappedIssues.length} mapped reports
            </span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-emerald-700 hover:text-emerald-900 font-semibold text-[11px] underline shrink-0 cursor-pointer"
            >
              Reset all
            </button>
          )}
        </div>

        {/* Search Bar + Quick Actions */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/90 p-1.5 flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark, or ID..."
              className="w-full pl-8 pr-6 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Toggle Filter Drawer */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`px-2 py-1.5 rounded text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer ${
              hasActiveFilters || isFilterOpen
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle map filters"
          >
            <Filter className="w-3 h-3" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            )}
          </button>

          {/* Recenter button */}
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 rounded text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Recenter New Town"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit fullscreen' : 'View map fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Filters Sub-panel */}
        {isFilterOpen && (
          <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200/80 p-2.5 text-xs text-slate-700 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
            {externalFilter && (
              <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-100 rounded px-2 py-1 text-[11px] text-emerald-800">
                <span className="truncate">Area: <strong>{externalFilter}</strong></span>
                {onResetExternalFilter && (
                  <button
                    type="button"
                    onClick={onResetExternalFilter}
                    className="text-emerald-700 hover:text-emerald-950 font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {/* Category Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-emerald-600 truncate"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Awaiting Verification">Awaiting Verification</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Quick Toggle & Reset Row */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 hover:text-slate-900 select-none">
                <input
                  type="checkbox"
                  checked={unresolvedOnly}
                  onChange={(e) => setUnresolvedOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-slate-300"
                />
                <span>Unresolved only</span>
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Floating Bottom-Left Marker Legend & Count Bar */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200/80 px-2.5 py-1.5 text-xs flex flex-wrap items-center gap-3">
          {/* Status color chips */}
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-amber-300" />
              <span>Open</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 ring-1 ring-sky-300" />
              <span>In Progress</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 ring-1 ring-purple-300" />
              <span>Verification</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-emerald-300" />
              <span>Resolved</span>
            </span>
          </div>

          <div className="h-3 w-px bg-slate-200 hidden sm:block" />

          {/* Counts */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>
              <strong>{visibleMappedIssues.length}</strong> of {mappedIssues.length} shown
            </span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowUnmappedDrawer(true)}
              className="text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
              title="View reports without verified coordinates"
            >
              {unmappedIssues.length} unmapped
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tile Error Fallback Banner */}
      {tileError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 max-w-md w-[90%] bg-amber-50 border border-amber-300 rounded-lg p-2.5 shadow-md flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p>
              OpenStreetMap tile server is slow or offline. Local civic markers remain fully interactive.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (tileLayerRef.current) {
                tileLayerRef.current.redraw();
                setTileError(false);
              }
            }}
            className="ml-2 font-semibold text-amber-800 underline hover:text-amber-950 shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5. Unmapped Reports Modal/Drawer */}
      {showUnmappedDrawer && (
        <div className="absolute inset-0 z-30 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Unmapped Civic Reports ({unmappedIssues.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUnmappedDrawer(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Per CivicTrack's <strong>honest location policy</strong>, coordinates are never fabricated for complaints without verified GPS or recognized landmark references. These reports remain tracked in the municipal queue.
            </p>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {unmappedIssues.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  All active reports have verified geographic locations.
                </div>
              ) : (
                unmappedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-700">{issue.id}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{
                        backgroundColor: STATUS_PIN_COLORS[issue.status]?.bg || '#f59e0b',
                      }}>
                        {issue.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 mb-1">{issue.title}</h4>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Location noted: {issue.location || issue.building || 'Perimeter area (unspecified GPS)'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUnmappedDrawer(false);
                        if (onOpenIssueDetail) onOpenIssueDetail(issue);
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      Inspect report & details →
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 mt-3 text-right">
              <button
                type="button"
                onClick={() => setShowUnmappedDrawer(false)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Close list
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function escapeXml(unsafe = '') {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
