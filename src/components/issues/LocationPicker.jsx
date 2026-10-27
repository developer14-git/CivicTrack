import { useEffect, useRef, useState, useCallback, useId } from 'react';
import L from 'leaflet';
import {
  Search,
  Navigation,
  MapPin,
  X,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Compass,
  Loader2,
  Eye,
} from 'lucide-react';
import {
  searchNewTownLocations,
  findNearestLandmark,
  isWithinNewTownBounds,
  formatCoordinates,
  searchNominatim,
} from '../../utils/locationUtils';
import { NEW_TOWN_MAP_CENTER } from '../../data/mockIssues';

// Custom draggable SVG pin icon with exact 32x42 dimensions and bottom tip anchor
function createPickerMarkerIcon() {
  const html = `
    <div class="relative group cursor-grab active:cursor-grabbing" style="width: 32px; height: 42px;">
      <div class="transition-transform duration-150 hover:scale-110 drop-shadow-lg">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.163 24.837 0 16 0Z" 
                fill="#047857" 
                stroke="#ffffff" 
                stroke-width="2.5"/>
          <circle cx="16" cy="15" r="6" fill="#ffffff" />
          <circle cx="16" cy="15" r="3" fill="#047857" />
        </svg>
      </div>
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-slate-900/40 rounded-full blur-[1px]"></div>
    </div>
  `;

  return L.divIcon({
    className: 'civic-picker-pin',
    html,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
}

export default function LocationPicker({
  coordinates = null,
  locationPrecision = 'approximate-landmark',
  locationSource = '',
  onChange,
  disabled = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Search and Geocoding state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Navigated landmark context (when searching without automatically setting pin)
  const [navigatedLandmark, setNavigatedLandmark] = useState(null);

  // Geolocation and interactive feedback
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [geoNotice, setGeoNotice] = useState(null);

  // Live drag coordinates for instant display updates while dragging
  const [liveDragCoords, setLiveDragCoords] = useState(null);
  const isDraggingRef = useRef(false);

  // Manual lat/lng entry modal toggle
  const [showManualInputs, setShowManualInputs] = useState(false);
  const [manualLatInput, setManualLatInput] = useState('');
  const [manualLngInput, setManualLngInput] = useState('');

  const searchBoxId = useId();

  // Active display coordinates (live drag coordinates take precedence during active drag)
  const displayCoords = liveDragCoords || coordinates;

  // Reverse landmark suggestion based on active coordinates
  const nearestLandmark = displayCoords?.lat && displayCoords?.lng
    ? findNearestLandmark(displayCoords.lat, displayCoords.lng)
    : null;

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  // Helper to place or move marker on map
  const setOrMoveMarker = useCallback((lat, lng, shouldCenter = false) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!markerRef.current) {
      const marker = L.marker([lat, lng], {
        icon: createPickerMarkerIcon(),
        draggable: true,
        riseOnHover: true,
        autoPan: true,
      });

      marker.bindPopup(
        `<div class="text-xs font-sans text-slate-800 p-1">
           <strong class="text-emerald-700">Selected Damage Spot</strong><br/>
           <span class="text-slate-500 text-[11px]">Drag this pin to refine exact position</span>
         </div>`,
        { offset: [0, -36] }
      );

      // Prevent marker click from propagating to map click
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
      });

      // Track drag events for live coordinate feedback
      marker.on('dragstart', () => {
        isDraggingRef.current = true;
      });

      marker.on('drag', (e) => {
        const pos = e.target.getLatLng();
        setLiveDragCoords({
          lat: Number(pos.lat.toFixed(5)),
          lng: Number(pos.lng.toFixed(5)),
        });
      });

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        const cleanLat = Number(pos.lat.toFixed(5));
        const cleanLng = Number(pos.lng.toFixed(5));
        setLiveDragCoords(null);

        // Keep isDraggingRef true briefly to swallow trailing map click
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 150);

        const nearest = findNearestLandmark(cleanLat, cleanLng);
        if (onChangeRef.current) {
          onChangeRef.current({
            coordinates: { lat: cleanLat, lng: cleanLng },
            locationPrecision: 'user-pinned',
            locationSource: 'Pinned on Interactive Map',
            nearestLandmark: nearest,
            area: nearest?.area,
            sector: nearest?.sector,
          });
        }
      });

      marker.addTo(map);
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (shouldCenter) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
    }
  }, []);

  // Helper to remove marker
  const removeMarker = useCallback(() => {
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  }, []);

  const initialCoordinatesRef = useRef(coordinates);
  const setOrMoveMarkerRef = useRef(setOrMoveMarker);
  useEffect(() => {
    setOrMoveMarkerRef.current = setOrMoveMarker;
  }, [setOrMoveMarker]);

  // Initialize Leaflet Map once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCoords = initialCoordinatesRef.current;
    const initialCenter = initialCoords?.lat && initialCoords?.lng
      ? [initialCoords.lat, initialCoords.lng]
      : NEW_TOWN_MAP_CENTER;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialCoords ? 15 : 13,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
      touchZoom: true,
      dragging: true,
      tapTolerance: 15,
    });

    // Standard OSM attribution
    L.control
      .attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; OpenStreetMap contributors')
      .addTo(map);

    // OpenStreetMap tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 11,
      crossOrigin: true,
    }).addTo(map);

    // Prevent modal scrolling from stealing scroll/touch gestures inside map
    if (mapContainerRef.current) {
      L.DomEvent.disableScrollPropagation(mapContainerRef.current);
    }

    // Direct map click places or moves marker immediately to exact clicked coordinate
    map.on('click', (e) => {
      // Ignore click if marker drag just finished
      if (isDraggingRef.current) return;

      const cleanLat = Number(e.latlng.lat.toFixed(5));
      const cleanLng = Number(e.latlng.lng.toFixed(5));
      setGeoError(null);
      setGeoNotice(null);
      setNavigatedLandmark(null);
      setIsSearchOpen(false);

      if (setOrMoveMarkerRef.current) {
        setOrMoveMarkerRef.current(cleanLat, cleanLng, false);
      }

      const nearest = findNearestLandmark(cleanLat, cleanLng);
      if (onChangeRef.current) {
        onChangeRef.current({
          coordinates: { lat: cleanLat, lng: cleanLng },
          locationPrecision: 'user-pinned',
          locationSource: 'Pinned on Interactive Map',
          nearestLandmark: nearest,
          area: nearest?.area,
          sector: nearest?.sector,
        });
      }
    });

    mapInstanceRef.current = map;

    // Handle container sizing with ResizeObserver for modal display & resize events
    const handleInvalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ debounceMoveend: true });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleInvalidate();
    });
    resizeObserver.observe(mapContainerRef.current);

    // Staggered timeouts to adapt to modal transition animations
    const t1 = setTimeout(handleInvalidate, 80);
    const t2 = setTimeout(handleInvalidate, 250);
    const t3 = setTimeout(handleInvalidate, 500);

    window.addEventListener('resize', handleInvalidate);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleInvalidate);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync marker position when external coordinates prop changes (unless actively dragging)
  useEffect(() => {
    if (isDraggingRef.current) return;
    if (coordinates?.lat && coordinates?.lng) {
      setOrMoveMarker(coordinates.lat, coordinates.lng, false);
    } else {
      removeMarker();
    }
  }, [coordinates, setOrMoveMarker, removeMarker]);

  // Handle search text changes
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    // Local instant matches
    const localMatches = searchNewTownLocations(val, 6);
    setSearchResults(localMatches);
    setIsSearchOpen(true);

    // Remote OSM geocoding fallback
    if (val.trim().length >= 3) {
      setIsSearching(true);
      searchNominatim(val)
        .then((remoteResults) => {
          setIsSearching(false);
          if (remoteResults.length > 0) {
            setSearchResults((prev) => {
              const combined = [...prev];
              remoteResults.forEach((rem) => {
                const already = combined.some(
                  (c) => Math.hypot(c.coordinates.lat - rem.coordinates.lat, c.coordinates.lng - rem.coordinates.lng) < 0.001
                );
                if (!already) combined.push(rem);
              });
              return combined.slice(0, 8);
            });
          }
        })
        .catch(() => {
          setIsSearching(false);
        });
    }
  };

  // 1. Pan map to landmark without automatically forcing pin
  const handleNavigateToLandmark = (result) => {
    setIsSearchOpen(false);
    setGeoError(null);
    setGeoNotice(null);
    setNavigatedLandmark(result);

    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([result.coordinates.lat, result.coordinates.lng], 16, { duration: 0.6 });
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }
  };

  // 2. Explicitly pin at landmark coordinates
  const handlePinAtLandmark = (result) => {
    setIsSearchOpen(false);
    setGeoError(null);
    setGeoNotice(null);
    setNavigatedLandmark(null);

    const lat = result.coordinates.lat;
    const lng = result.coordinates.lng;

    setOrMoveMarker(lat, lng, true);

    const nearest = findNearestLandmark(lat, lng);
    if (onChangeRef.current) {
      onChangeRef.current({
        coordinates: { lat, lng },
        locationPrecision: 'approximate-landmark',
        locationSource: `Approximate Landmark: ${result.name}`,
        nearestLandmark: nearest,
        area: result.area || nearest?.area,
        sector: result.sector || nearest?.sector,
        floorRoom: result.description || nearest?.description,
      });
    }
  };

  // Browser Geolocation ("Use my current location")
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);
    setGeoNotice(null);
    setNavigatedLandmark(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = Number(position.coords.latitude.toFixed(5));
        const lng = Number(position.coords.longitude.toFixed(5));

        const inNewTown = isWithinNewTownBounds(lat, lng);
        const precision = inNewTown ? 'verified-gps' : 'user-pinned';
        const source = inNewTown
          ? 'Browser Geolocation (GPS)'
          : 'Browser Geolocation (Outside New Town)';

        setOrMoveMarker(lat, lng, true);

        const nearest = findNearestLandmark(lat, lng);
        if (onChangeRef.current) {
          onChangeRef.current({
            coordinates: { lat, lng },
            locationPrecision: precision,
            locationSource: source,
            nearestLandmark: nearest,
            area: nearest?.area,
            sector: nearest?.sector,
          });
        }

        if (!inNewTown) {
          setGeoNotice(
            `Device GPS coordinates (${lat}, ${lng}) fall outside New Town. You can click on the map or drag the pin to place it at the exact New Town issue spot.`
          );
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === 1) {
          setGeoError('Location permission denied. Click anywhere on the map to pin your location.');
        } else if (error.code === 2) {
          setGeoError('Location unavailable. Please click on the map to place a pin.');
        } else if (error.code === 3) {
          setGeoError('Location request timed out. Please click on the map or retry.');
        } else {
          setGeoError('Unable to retrieve location. Please click on the map to select.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  // Clear / Unmap coordinates
  const handleClearPin = () => {
    removeMarker();
    setSearchQuery('');
    setNavigatedLandmark(null);
    setGeoError(null);
    setGeoNotice(null);
    setLiveDragCoords(null);

    if (onChangeRef.current) {
      onChangeRef.current({
        coordinates: null,
        locationPrecision: 'unmapped',
        locationSource: 'Unmapped',
        nearestLandmark: null,
      });
    }
  };

  // Recenter map on New Town or current pin
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      const center = coordinates?.lat && coordinates?.lng
        ? [coordinates.lat, coordinates.lng]
        : NEW_TOWN_MAP_CENTER;
      mapInstanceRef.current.flyTo(center, coordinates ? 15 : 13, { duration: 0.6 });
    }
  };

  // Manual lat/lng submission
  const handleApplyManualCoords = (e) => {
    e.preventDefault();
    const lat = parseFloat(manualLatInput);
    const lng = parseFloat(manualLngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      const cleanLat = Number(lat.toFixed(5));
      const cleanLng = Number(lng.toFixed(5));
      setOrMoveMarker(cleanLat, cleanLng, true);
      const nearest = findNearestLandmark(cleanLat, cleanLng);
      if (onChangeRef.current) {
        onChangeRef.current({
          coordinates: { lat: cleanLat, lng: cleanLng },
          locationPrecision: 'user-pinned',
          locationSource: 'Manual Coordinate Entry',
          nearestLandmark: nearest,
          area: nearest?.area,
          sector: nearest?.sector,
        });
      }
    }
  };

  return (
    <div className="space-y-2 text-xs">
      {/* Top Search Bar & Geolocation Controls */}
      <div ref={searchContainerRef} className="flex items-center gap-1.5 relative">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            id={searchBoxId}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsSearchOpen(false);
            }}
            placeholder="Search landmark, road, or area to pan map..."
            disabled={disabled}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setIsSearchOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              aria-label="Clear search text"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Autocomplete Results Dropdown with Navigation vs Pinning Distinction */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-[1500] bg-white border border-slate-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 bg-slate-50 border-b border-slate-100 uppercase tracking-wider flex items-center justify-between">
                <span>Select to pan map or pin</span>
                {isSearching && <span className="text-emerald-700 font-normal">Searching OSM...</span>}
              </div>
              {searchResults.map((res) => (
                <div
                  key={res.id || `${res.coordinates.lat}-${res.coordinates.lng}`}
                  className="px-2.5 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-none flex items-center justify-between gap-2 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleNavigateToLandmark(res)}
                    className="min-w-0 flex-1 text-left flex items-start gap-2 cursor-pointer group"
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 group-hover:text-emerald-800 truncate">
                        {res.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {res.area || 'New Town, Kolkata'} &bull; {res.coordinates.lat.toFixed(4)}, {res.coordinates.lng.toFixed(4)}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleNavigateToLandmark(res)}
                      title="Pan map to this landmark"
                      className="px-2 py-1 text-[10px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-slate-600" />
                      <span>Pan Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinAtLandmark(res)}
                      title="Set pin directly at this landmark"
                      className="px-2 py-1 text-[10px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-2xs cursor-pointer inline-flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Pin Here</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Use My Location Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={disabled || isLocating}
          title="Detect and use current device location"
          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md font-medium inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
          )}
          <span className="hidden sm:inline">Use my location</span>
        </button>

        {/* Recenter Button */}
        <button
          type="button"
          onClick={handleRecenter}
          title="Recenter New Town view"
          className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Navigated Landmark Guidance Banner (shown when map panned without forced pin) */}
      {navigatedLandmark && (
        <div className="p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-start gap-2 min-w-0">
            <Compass className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight min-w-0">
              <span className="font-semibold text-emerald-900">Map view moved to:</span>{' '}
              <strong className="font-bold text-slate-900">{navigatedLandmark.name}</strong>{' '}
              <span className="text-slate-600">({navigatedLandmark.area})</span>
              <div className="text-[10px] text-emerald-800 mt-0.5">
                Click anywhere on the map to pin the exact damage spot, or select the landmark point below:
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => handlePinAtLandmark(navigatedLandmark)}
              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-2xs cursor-pointer inline-flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              <span>Pin at this landmark</span>
            </button>
            <button
              type="button"
              onClick={() => setNavigatedLandmark(null)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Geolocation Alerts */}
      {geoError && (
        <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{geoError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGeoError(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {geoNotice && (
        <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{geoNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setGeoNotice(null)}
            className="text-amber-700 hover:text-amber-950 text-xs font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Clear Instruction Header Above Map */}
      <div className="flex items-center justify-between text-[11px] text-slate-600 px-0.5">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>Click the map to mark the damage location, or drag the pin.</span>
        </div>
        {coordinates?.lat && coordinates?.lng && (
          <button
            type="button"
            onClick={handleClearPin}
            className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer text-[11px] inline-flex items-center gap-0.5"
          >
            <X className="w-3 h-3" />
            <span>Clear Pin</span>
          </button>
        )}
      </div>

      {/* Leaflet Map Canvas with Responsive Height & Touch/Scroll Protection */}
      <div className="relative rounded-lg overflow-hidden border border-slate-300 shadow-2xs bg-slate-100">
        <div
          ref={mapContainerRef}
          className="w-full h-[250px] sm:h-[280px] z-0 outline-none rounded-lg"
          style={{ touchAction: 'none' }}
          tabIndex={0}
        />

        {/* Floating Interactive Tip Overlay (bottom-left) */}
        <div className="absolute bottom-2 left-2 right-2 pointer-events-none z-10 flex items-center justify-between">
          <div className="bg-slate-900/85 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md shadow-sm pointer-events-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Click map or drag pin to mark the exact damage spot</span>
          </div>
        </div>
      </div>

      {/* Coordinate & Landmark Readout Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Coordinates & Provenance Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-700">Selected Coordinates:</span>
            {displayCoords?.lat && displayCoords?.lng ? (
              <span className="font-mono text-[11px] font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                {formatCoordinates(displayCoords)}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 italic">No pin placed (click map to set)</span>
            )}

            {/* Provenance Pill */}
            {displayCoords?.lat && displayCoords?.lng ? (
              locationPrecision === 'verified-gps' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Verified GPS
                </span>
              ) : locationPrecision === 'approximate-landmark' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                  <Compass className="w-3 h-3 text-amber-700" /> Approximate Landmark
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-300">
                  <MapPin className="w-3 h-3 text-sky-700" /> User-Pinned Location
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                Unmapped
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {coordinates?.lat && coordinates?.lng && (
              <button
                type="button"
                onClick={handleClearPin}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline"
              >
                Clear Pin
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const next = !showManualInputs;
                setShowManualInputs(next);
                if (next && coordinates?.lat && coordinates?.lng) {
                  setManualLatInput(String(coordinates.lat));
                  setManualLngInput(String(coordinates.lng));
                }
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              {showManualInputs ? 'Hide Coordinates Entry' : 'Manual Coordinates'}
            </button>
          </div>
        </div>

        {/* Nearest Landmark Description */}
        {nearestLandmark && (
          <div className="text-[11px] text-slate-600 flex items-center justify-between gap-1.5 pt-1 border-t border-slate-200/60">
            <span className="truncate">
              Nearest landmark: <strong className="text-slate-800">{nearestLandmark.landmark.name}</strong> ({nearestLandmark.area}, ~{nearestLandmark.distanceMeters}m away)
            </span>
            <button
              type="button"
              onClick={() => {
                if (onChangeRef.current) {
                  onChangeRef.current({
                    coordinates,
                    locationPrecision,
                    locationSource,
                    floorRoom: nearestLandmark.description,
                    area: nearestLandmark.area,
                    sector: nearestLandmark.sector,
                    nearestLandmark,
                  });
                }
              }}
              className="text-emerald-700 hover:text-emerald-900 font-semibold shrink-0 cursor-pointer text-[10px]"
            >
              Use description
            </button>
          </div>
        )}

        {/* Collapsible Manual Latitude / Longitude entry */}
        {showManualInputs && (
          <form onSubmit={handleApplyManualCoords} className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 block mb-0.5">Latitude:</label>
              <input
                type="number"
                step="any"
                value={manualLatInput}
                onChange={(e) => setManualLatInput(e.target.value)}
                placeholder="22.58350"
                className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 block mb-0.5">Longitude:</label>
              <input
                type="number"
                step="any"
                value={manualLngInput}
                onChange={(e) => setManualLngInput(e.target.value)}
                placeholder="88.45500"
                className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <button
              type="submit"
              className="mt-4 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold cursor-pointer shrink-0"
            >
              Apply
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
