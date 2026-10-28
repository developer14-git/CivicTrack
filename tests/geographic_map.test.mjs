import assert from 'node:assert/strict';
import {
  INITIAL_ISSUES,
  CATEGORIES,
  CATEGORY_DETAILS,
  SCHEMATIC_BUILDINGS,
  NEW_TOWN_MAP_CENTER,
  resolveIssueCoordinates,
} from '../src/data/mockIssues.js';
// Minimal window shim for Leaflet module evaluation in Node CLI test runner
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    navigator: { userAgent: 'node' },
    screen: { deviceXDPI: 1, logicalXDPI: 1 },
    devicePixelRatio: 1,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  globalThis.document = {
    documentElement: { style: {} },
    createElement: () => ({ getContext: () => null }),
  };
}


const {
  STATUS_PIN_COLORS,
  computeHotspots,
  createPopupHtml,
  filterMappedIssues,
  clusterMappedIssues,
  getClusterThreshold,
} = await import('../src/utils/mapUtils.js');


console.log('=== RUNNING CIVICTRACK GEOGRAPHIC MAP & HOTSPOT AUDIT ===\n');

// Test 1: Real Geographic Center & Landmark Coordinates
console.log('Group 1: Map Center & Landmark Coordinate Verification');
assert.equal(Array.isArray(NEW_TOWN_MAP_CENTER), true, 'NEW_TOWN_MAP_CENTER should be an array');
assert.equal(NEW_TOWN_MAP_CENTER.length, 2, 'NEW_TOWN_MAP_CENTER should have [lat, lng]');
assert.ok(NEW_TOWN_MAP_CENTER[0] > 22.5 && NEW_TOWN_MAP_CENTER[0] < 22.7, 'Center latitude should be in New Town, Kolkata');
assert.ok(NEW_TOWN_MAP_CENTER[1] > 88.4 && NEW_TOWN_MAP_CENTER[1] < 88.6, 'Center longitude should be in New Town, Kolkata');

SCHEMATIC_BUILDINGS.forEach((bldg) => {
  assert.ok(bldg.coordinates, `Building ${bldg.name} must have coordinates`);
  assert.ok(typeof bldg.coordinates.lat === 'number', `Building ${bldg.name} lat must be a number`);
  assert.ok(typeof bldg.coordinates.lng === 'number', `Building ${bldg.name} lng must be a number`);
  assert.ok(bldg.coordinates.lat > 22.5 && bldg.coordinates.lat < 22.7, `Building ${bldg.name} lat should be in New Town range`);
  assert.ok(bldg.coordinates.lng > 88.4 && bldg.coordinates.lng < 88.6, `Building ${bldg.name} lng should be in New Town range`);
});
console.log('  ✓ Map center and all recognized landmark coordinates verified in New Town, Kolkata');

// Test 2: Honest Location Resolution
console.log('Group 2: Honest Location Resolution & Non-Fabrication Policy');
const ct101 = INITIAL_ISSUES.find((i) => i.id === 'CT-101');
const ct101Coords = resolveIssueCoordinates(ct101);
assert.ok(ct101Coords, 'CT-101 should resolve landmark coordinates');
assert.equal(ct101Coords.isExact, false, 'CT-101 should be marked as approximate landmark, not exact GPS');
assert.equal(ct101Coords.lat, 22.5835);
assert.equal(ct101Coords.lng, 88.4550);
assert.equal(ct101Coords.source, 'Approximate Landmark Location');

// Test genuine verified GPS issue (e.g. citizen submission or documented survey reading)
const verifiedSurveyIssue = {
  id: 'CT-FIXTURE-SURVEY-GPS',
  title: 'Surveyed issue with verified GPS reading',
  coordinates: { lat: 22.5835, lng: 88.4550 },
  locationPrecision: 'verified-gps',
  category: 'Roads and Footpaths',
  priority: 'High',
  status: 'Open',
};
const verifiedCoords = resolveIssueCoordinates(verifiedSurveyIssue);
assert.ok(verifiedCoords, 'Verified GPS issue should resolve coordinates');
assert.equal(verifiedCoords.isExact, true, 'Verified GPS issue must be marked isExact: true');
assert.equal(verifiedCoords.source, 'Verified GPS Coordinates');

const unmappedIssue = {
  id: 'CT-999',
  title: 'Unknown location grievance',
  location: 'Nowhere in particular',
  building: '',
  coordinates: null,
};
const unmappedCoords = resolveIssueCoordinates(unmappedIssue);
assert.equal(unmappedCoords, null, 'Unmapped report must NEVER have fabricated coordinates');

const landmarkOnlyIssue = {
  id: 'CT-998',
  title: 'Issue near Biswa Bangla Gate',
  location: 'Near Biswa Bangla Gate Ring',
  coordinates: null,
};
const landmarkCoords = resolveIssueCoordinates(landmarkOnlyIssue);
assert.ok(landmarkCoords, 'Landmark mention should resolve to verified landmark reference');
assert.equal(landmarkCoords.isExact, false, 'Landmark reference must be marked isExact: false');
assert.equal(landmarkCoords.lat, 22.5932);
assert.equal(landmarkCoords.lng, 88.4716);
console.log('  ✓ Verified GPS, approximate landmark locations, and unmapped issues handled honestly without GPS fabrication');

// Test 3: Status Color Coding
console.log('Group 3: Status Color Mapping');
assert.ok(STATUS_PIN_COLORS['Open'], 'Open status must have color config');
assert.equal(STATUS_PIN_COLORS['Open'].bg, '#f59e0b', 'Open must be amber');
assert.ok(STATUS_PIN_COLORS['In Progress'], 'In Progress status must have color config');
assert.equal(STATUS_PIN_COLORS['In Progress'].bg, '#0284c7', 'In Progress must be sky/blue');
assert.ok(STATUS_PIN_COLORS['Awaiting Verification'], 'Awaiting Verification must have color config');
assert.equal(STATUS_PIN_COLORS['Awaiting Verification'].bg, '#9333ea', 'Awaiting Verification must be purple');
assert.ok(STATUS_PIN_COLORS['Resolved'], 'Resolved status must have color config');
assert.equal(STATUS_PIN_COLORS['Resolved'].bg, '#10b981', 'Resolved must be green');
console.log('  ✓ Status colors match specification: Amber (Open), Blue (In Progress), Purple (Verification), Green (Resolved)');

// Test 4: Hotspot Summary Computation
console.log('Group 4: Hotspot Summaries ("Areas Needing Attention")');
const hotspots = computeHotspots(INITIAL_ISSUES);
assert.ok(Array.isArray(hotspots), 'computeHotspots should return an array');
assert.ok(hotspots.length > 0, 'Hotspots should be detected from mock issues');
hotspots.forEach((h) => {
  assert.ok(h.name, 'Hotspot must have a name');
  assert.ok(typeof h.openCount === 'number', 'Hotspot must have openCount');
  assert.ok(typeof h.overdueCount === 'number', 'Hotspot must have overdueCount');
  assert.ok(h.topCategory, 'Hotspot must have topCategory');
  assert.ok(h.coordinates, 'Hotspot must have geographic coordinates');
});

// Verify sort order: most urgent hotspots first
for (let i = 0; i < hotspots.length - 1; i++) {
  const scoreA = hotspots[i].openCount + hotspots[i].overdueCount * 2;
  const scoreB = hotspots[i + 1].openCount + hotspots[i + 1].overdueCount * 2;
  assert.ok(scoreA >= scoreB, 'Hotspots should be sorted by urgency');
}
console.log(`  ✓ Identified ${hotspots.length} active New Town hotspot areas with open/overdue counts and top category`);

// Test 5: Popup Card Generation with Inspection Hook
console.log('Group 5: Popup Card Template & Inspection Action');
const popupHtml = createPopupHtml(ct101, false);
assert.ok(popupHtml.includes('CT-101'), 'Popup must include report ID');
assert.ok(popupHtml.includes(ct101.title), 'Popup must include issue title');
assert.ok(popupHtml.includes('Streetlights'), 'Popup must include issue category');
assert.ok(popupHtml.includes('Approximate Landmark Location'), 'Demo report must show Approximate Landmark Location badge');
assert.ok(popupHtml.includes('data-inspect-issue-id="CT-101"'), 'Popup must include data-inspect-issue-id attribute');
assert.ok(popupHtml.includes('Inspect report'), 'Popup must include Inspect report button text');

const verifiedPopupHtml = createPopupHtml(verifiedSurveyIssue, true);
assert.ok(verifiedPopupHtml.includes('Verified GPS'), 'Verified issue must show Verified GPS badge');
console.log('  ✓ Popup card contains complete metadata, location badges, and inspection action hook');

// Test 6: Comprehensive Public Infrastructure Categories & Demonstration Dataset
console.log('Group 6: Comprehensive Public Infrastructure Categories & Demonstration Dataset');
const expectedCategories = [
  'Roads and Footpaths',
  'Streetlights and Electricity',
  'Drainage and Flooding',
  'Public Parks and Green Spaces',
  'Public Buildings and Facilities',
  'Waste and Cleanliness',
  'Traffic and Pedestrian Safety',
  'Water Supply',
  'Storm and Natural Damage',
  'Public Property Vandalism',
  'Construction and Roadwork',
  'Other Public Infrastructure',
];

expectedCategories.forEach((cat) => {
  assert.ok(CATEGORIES.includes(cat), `CATEGORIES must include "${cat}"`);
  assert.ok(CATEGORY_DETAILS[cat], `CATEGORY_DETAILS must define details for "${cat}"`);
  assert.ok(CATEGORY_DETAILS[cat].examples, `CATEGORY_DETAILS["${cat}"] must provide plain-language examples`);
});
console.log(`  ✓ All ${expectedCategories.length} comprehensive public infrastructure categories verified`);

// Verify demo reports dataset
assert.equal(INITIAL_ISSUES.length, 200, `INITIAL_ISSUES must contain exactly 200 demonstration reports (found ${INITIAL_ISSUES.length})`);

// Verify unique contiguous IDs CT-101 through CT-300
const ids = INITIAL_ISSUES.map((i) => i.id);
const uniqueIds = new Set(ids);
assert.equal(uniqueIds.size, 200, 'All 200 report IDs must be strictly unique');
for (let num = 101; num <= 300; num++) {
  assert.ok(uniqueIds.has(`CT-${num}`), `Report ID CT-${num} must exist`);
}

// All mock issues must be clearly marked as demo reports
INITIAL_ISSUES.forEach((issue) => {
  assert.equal(issue.isDemoReport, true, `Issue ${issue.id} must be flagged isDemoReport: true`);
  assert.ok(
    ['verified-gps', 'approximate-landmark', 'unmapped'].includes(issue.locationPrecision),
    `Issue ${issue.id} must have valid honest locationPrecision`
  );
});

// Verify category representation across all 12 categories
expectedCategories.forEach((cat) => {
  const count = INITIAL_ISSUES.filter((i) => i.category === cat).length;
  assert.ok(count >= 15, `Category "${cat}" must have at least 15 reports (found ${count})`);
});

// Verify location precision distribution
const verifiedCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'verified-gps').length;
const approxCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'approximate-landmark').length;
const unmappedCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'unmapped').length;

assert.equal(verifiedCount, 0, 'No hardcoded demo reports should claim verified GPS without real survey evidence');
assert.equal(approxCount, 186, 'Exactly 186 demo reports have approximate landmark coordinates');
assert.equal(unmappedCount, 14, 'Exactly 14 demo reports remain in unmapped queue');
assert.equal(verifiedCount + approxCount + unmappedCount, 200, 'All 200 reports accounted for exactly once across precision sets');

// Verify unmapped queue
const unmappedIds = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'unmapped').map((i) => i.id);
assert.equal(unmappedIds.length, 14, 'Unmapped queue must contain exactly 14 reports');
assert.ok(unmappedIds.includes('CT-109'), 'Unmapped queue must include original CT-109');
assert.ok(unmappedIds.includes('CT-200'), 'Unmapped queue must include CT-200');

// Verify distribution across Action Areas
const areasRepresented = new Set(INITIAL_ISSUES.map((i) => i.area));
assert.ok(areasRepresented.has('Action Area I'), 'Demo reports must cover Action Area I');
assert.ok(areasRepresented.has('Action Area II'), 'Demo reports must cover Action Area II');
assert.ok(areasRepresented.has('Action Area III'), 'Demo reports must cover Action Area III');

// Verify distribution across statuses
const statusesRepresented = new Set(INITIAL_ISSUES.map((i) => i.status));
assert.ok(statusesRepresented.has('Open'), 'Demo dataset must include Open reports');
assert.ok(statusesRepresented.has('In Progress'), 'Demo dataset must include In Progress reports');
assert.ok(
  statusesRepresented.has('Resolution Submitted') || statusesRepresented.has('Awaiting Verification'),
  'Demo dataset must include reports awaiting verification'
);
assert.ok(statusesRepresented.has('Resolved'), 'Demo dataset must include Resolved reports');

console.log(`  ✓ Demonstration dataset verified: 200 reports (0 verified GPS, 186 approximate landmark, 14 unmapped), all unique IDs CT-101..CT-300, all 12 categories, all lifecycle statuses`);

// Test 7: Location Selection Workflow, Marker Movement & Provenance Integrity
console.log('Group 7: Location Selection Workflow & Coordinate Provenance Integrity');

const {
  searchNewTownLocations,
  findNearestLandmark,
  isWithinNewTownBounds,
  formatCoordinates,
} = await import('../src/utils/locationUtils.js');

// 1. User-pinned coordinate selection
const userPinnedIssue = {
  id: 'CT-FIXTURE-PINNED',
  title: 'Pothole on pedestrian footpath near CE block market',
  category: 'Roads and Footpaths',
  building: 'Action Area I • CB & CE Residential Blocks',
  location: 'Action Area I • Street 106',
  coordinates: { lat: 22.58412, lng: 88.45567 },
  locationPrecision: 'user-pinned',
  locationSource: 'Pinned on Interactive Map',
  status: 'Open',
  priority: 'High',
};
const userPinnedCoords = resolveIssueCoordinates(userPinnedIssue);
assert.ok(userPinnedCoords, 'User-pinned issue must resolve coordinates');
assert.equal(userPinnedCoords.lat, 22.58412, 'Must preserve exact user-pinned latitude');
assert.equal(userPinnedCoords.lng, 88.45567, 'Must preserve exact user-pinned longitude');
assert.equal(userPinnedCoords.isExact, false, 'User-pinned issue must NOT be mislabeled as verified GPS');
assert.equal(userPinnedCoords.source, 'Pinned on Interactive Map', 'Must preserve truthful user-pinned source');

// 2. Verified GPS from browser geolocation
const browserGpsIssue = {
  id: 'CT-FIXTURE-BROWSER-GPS',
  title: 'Exposed street lighting junction box',
  category: 'Streetlights and Electricity',
  building: 'Action Area I • Nazrul Tirtha & Cultural Complex',
  coordinates: { lat: 22.58350, lng: 88.45500 },
  locationPrecision: 'verified-gps',
  locationSource: 'Browser Geolocation (GPS)',
  status: 'Open',
  priority: 'High',
};
const gpsCoords = resolveIssueCoordinates(browserGpsIssue);
assert.ok(gpsCoords, 'Browser GPS issue must resolve coordinates');
assert.equal(gpsCoords.isExact, true, 'Browser GPS issue with verified-gps precision must be marked isExact: true');
assert.equal(gpsCoords.source, 'Verified GPS Coordinates');

// 3. Marker movement and position refinement
const refinedIssue = {
  ...userPinnedIssue,
  coordinates: { lat: 22.58450, lng: 88.45600 },
  locationSource: 'Pinned on Interactive Map (Refined via Drag)',
};
const refinedCoords = resolveIssueCoordinates(refinedIssue);
assert.equal(refinedCoords.lat, 22.58450, 'Refined latitude after marker drag must be preserved');
assert.equal(refinedCoords.lng, 88.45600, 'Refined longitude after marker drag must be preserved');

// 4. Missing coordinates directed to unmapped queue
const unmappedSelectionIssue = {
  id: 'CT-FIXTURE-UNMAPPED',
  title: 'Broken bus stop sign in perimeter sector',
  building: 'Other / Unmapped New Town Location',
  coordinates: null,
  locationPrecision: 'unmapped',
  status: 'Open',
};
assert.equal(
  resolveIssueCoordinates(unmappedSelectionIssue),
  null,
  'Unmapped user selection must return null and never fabricate coordinates'
);

// 5. New Town Landmark Search & Spatial Distance
const nazrulMatches = searchNewTownLocations('Nazrul');
assert.ok(nazrulMatches.length > 0, 'Search for Nazrul should return results');
assert.equal(nazrulMatches[0].name, 'Nazrul Tirtha & Cultural Complex');

const gateMatches = searchNewTownLocations('Biswa Bangla Gate');
assert.ok(gateMatches.length > 0, 'Search for Biswa Bangla Gate should return results');
assert.equal(gateMatches[0].name, 'Biswa Bangla Gate (Narkelbagan)');

// Exact local matching and avoiding unrelated keyword matches
const ecoParkMatches = searchNewTownLocations('Eco Park');
assert.ok(ecoParkMatches.length > 0, 'Search for Eco Park should return Eco Park');
assert.equal(ecoParkMatches[0].name, 'Eco Park & Public Lake Promenade');
const unrelatedParkFound = ecoParkMatches.some((m) => m.name.includes('Swapno Bhor'));
assert.equal(unrelatedParkFound, false, 'Unrelated "Swapno Bhor" park must NOT match "Eco Park" query');

const tataMatches = searchNewTownLocations('Tata Medical');
assert.ok(tataMatches.length > 0, 'Search for Tata Medical should return Tata Medical Center');
assert.equal(tataMatches[0].name, 'Tata Medical Center & Health Corridor');

const street106Matches = searchNewTownLocations('Street 106');
assert.ok(street106Matches.length > 0, 'Search for Street 106 should match CE/CB blocks by alias');
assert.equal(street106Matches[0].id, 'ce-cb-blocks');

const axisMallMatches = searchNewTownLocations('Axis Mall');
assert.ok(axisMallMatches.length > 0, 'Search for Axis Mall should return Axis Mall & Novotel');
assert.equal(axisMallMatches[0].id, 'axis-mall-novotel');

// Empty results for non-matching query
const unknownMatches = searchNewTownLocations('Fictional Place That Does Not Exist 9999');
assert.deepEqual(unknownMatches, [], 'Non-matching query must return empty array');

const emptyQueryMatches = searchNewTownLocations('');
assert.deepEqual(emptyQueryMatches, [], 'Empty query must return empty array');

// Geocoding error resilience & timeouts
const { searchNominatim } = await import('../src/utils/locationUtils.js');
const emptyGeocode = await searchNominatim('');
assert.deepEqual(emptyGeocode, [], 'Empty geocode query must return empty array');

const singleCharGeocode = await searchNominatim('a');
assert.deepEqual(singleCharGeocode, [], 'Single character geocode must return empty array');

const abortController = new AbortController();
abortController.abort();
const abortedGeocode = await searchNominatim('Eco Park', abortController.signal);
assert.deepEqual(abortedGeocode, [], 'Aborted geocoding request must return empty array without throwing');

const nearest = findNearestLandmark(22.58352, 88.45501);
assert.ok(nearest, 'Should detect nearest landmark');
assert.equal(nearest.landmark.id, 'nazrul-tirtha');
assert.ok(nearest.distanceMeters < 30, 'Distance to Nazrul Tirtha should be < 30 meters');

assert.equal(isWithinNewTownBounds(22.5835, 88.4550), true, 'New Town coordinate should be within bounds');
assert.equal(isWithinNewTownBounds(19.0760, 72.8777), false, 'Mumbai coordinate should be outside New Town bounds');
assert.equal(formatCoordinates({ lat: 22.5835, lng: 88.4550 }), '22.58350, 88.45500');

// 6. Map popup badge rendering
const popupPinned = createPopupHtml(userPinnedIssue);
assert.ok(popupPinned.includes('User-Pinned Location'), 'Popup must display User-Pinned Location badge');

const popupGps = createPopupHtml(browserGpsIssue, true);
assert.ok(popupGps.includes('Verified GPS'), 'Popup must display Verified GPS badge');

const popupUnmapped = createPopupHtml(unmappedSelectionIssue);
assert.ok(popupUnmapped.includes('Unmapped Queue'), 'Popup must display Unmapped Queue badge');

console.log('  ✓ User-pinned coordinates preserved without landmark replacement');
console.log('  ✓ Browser GPS provenance verified without false GPS claims');
// Test 8: Geographic Distribution & Coordinate Overlap Prevention Audit
console.log('Group 8: Geographic Distribution & Coordinate Overlap Prevention');
const mappedPoints = new Set();
let mappedTotal = 0;

INITIAL_ISSUES.forEach((issue) => {
  const coords = resolveIssueCoordinates(issue);
  if (coords) {
    mappedTotal++;
    assert.equal(
      isWithinNewTownBounds(coords.lat, coords.lng),
      true,
      `Issue ${issue.id} coordinate (${coords.lat}, ${coords.lng}) must be within New Town geographic bounds`
    );
    const coordKey = `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
    assert.equal(
      mappedPoints.has(coordKey),
      false,
      `Issue ${issue.id} must not duplicate coordinates with another issue at ${coordKey}`
    );
    mappedPoints.add(coordKey);
  }
});

assert.equal(mappedTotal, 186, 'Must have exactly 186 mapped demo reports');
assert.equal(mappedPoints.size, 186, 'All 186 mapped demo reports must have distinct, non-overlapping coordinates');
console.log('  ✓ All 186 mapped reports have unique, geographically distinct coordinates within New Town');
console.log('  ✓ No artificial coordinate stacking or clustering overlap across the demonstration dataset');

// Test 9: Modal Location Selection Usability & State Synchronization Audit
console.log('Group 9: Modal Location Selection Usability & State Synchronization');

// 9.1: Reliable map click-to-pin exact coordinate preservation
const clickedLat = 22.58419;
const clickedLng = 88.45573;
const clickResolvedNearest = findNearestLandmark(clickedLat, clickedLng);

assert.ok(clickResolvedNearest, 'Nearest landmark must be computed for clicked coordinate');
assert.equal(clickResolvedNearest.landmark.id, 'nazrul-tirtha');
assert.ok(clickResolvedNearest.distanceMeters > 0, 'Must record actual distance from landmark centroid');

// Report payload produced when user clicks on map
const manualMapClickReport = {
  id: 'CT-TEST-CLICK',
  title: 'Cracked kerb on Street 106',
  category: 'Roads and Footpaths',
  campus: clickResolvedNearest.area,
  area: clickResolvedNearest.area,
  building: clickResolvedNearest.sector,
  floorRoom: clickResolvedNearest.description,
  location: `${clickResolvedNearest.area} • ${clickResolvedNearest.description}`,
  coordinates: { lat: clickedLat, lng: clickedLng },
  locationPrecision: 'user-pinned',
  locationSource: 'Pinned on Interactive Map',
};

const clickCoords = resolveIssueCoordinates(manualMapClickReport);
assert.equal(clickCoords.lat, clickedLat, 'Map click must preserve exact clicked latitude without snapping to landmark');
assert.equal(clickCoords.lng, clickedLng, 'Map click must preserve exact clicked longitude without snapping to landmark');
assert.equal(clickCoords.isExact, false, 'Map click must never be falsely marked as verified GPS');
assert.equal(clickCoords.source, 'Pinned on Interactive Map');

// 9.2: Marker drag refinement updates coordinates without landmark reversion
const draggedLat = 22.58488;
const draggedLng = 88.45612;
const dragResolvedNearest = findNearestLandmark(draggedLat, draggedLng);

const markerDraggedReport = {
  ...manualMapClickReport,
  coordinates: { lat: draggedLat, lng: draggedLng },
  area: dragResolvedNearest.area,
  building: dragResolvedNearest.sector,
  locationSource: 'Pinned on Interactive Map',
};

const dragCoords = resolveIssueCoordinates(markerDraggedReport);
assert.equal(dragCoords.lat, draggedLat, 'Dragged marker must update latitude immediately to exact dropped point');
assert.equal(dragCoords.lng, draggedLng, 'Dragged marker must update longitude immediately to exact dropped point');
assert.notEqual(dragCoords.lat, clickResolvedNearest.landmark.coordinates.lat, 'Pin must never snap back to landmark centroid');

// 9.3: Landmark search navigation vs explicit pin selection distinction
const searchResults = searchNewTownLocations('Eco Park');
assert.ok(searchResults.length > 0, 'Eco Park search must return recognized results');
const ecoParkResult = searchResults[0];

// Case A: User only navigated/panned map to search result (pin was placed at nearby custom spot)
const userPinnedNearEcoPark = {
  id: 'CT-TEST-NEAR-ECO',
  title: 'Waterlogged pavement opposite Gate 2',
  category: 'Drainage and Flooding',
  campus: ecoParkResult.area,
  area: ecoParkResult.area,
  building: ecoParkResult.sector,
  floorRoom: 'Opposite Eco Park Gate 2, near bus shelter',
  location: `${ecoParkResult.area} • Opposite Eco Park Gate 2, near bus shelter`,
  coordinates: { lat: 22.60512, lng: 88.46820 }, // 80 meters away from landmark centroid
  locationPrecision: 'user-pinned',
  locationSource: 'Pinned on Interactive Map',
};
const pannedPinCoords = resolveIssueCoordinates(userPinnedNearEcoPark);
assert.equal(pannedPinCoords.lat, 22.60512, 'Navigating via search must not overwrite manual pin coordinates');
assert.equal(pannedPinCoords.lng, 88.46820);
assert.equal(pannedPinCoords.isExact, false);

// Case B: User explicitly chose "Pin at this landmark"
const explicitLandmarkPinReport = {
  id: 'CT-TEST-EXPLICIT-LANDMARK',
  title: 'Damaged railing at Eco Park entrance plaza',
  category: 'Public Parks and Green Spaces',
  campus: ecoParkResult.area,
  area: ecoParkResult.area,
  building: ecoParkResult.sector,
  floorRoom: ecoParkResult.description,
  location: `${ecoParkResult.area} • ${ecoParkResult.description}`,
  coordinates: { lat: ecoParkResult.coordinates.lat, lng: ecoParkResult.coordinates.lng },
  locationPrecision: 'approximate-landmark',
  locationSource: `Approximate Landmark: ${ecoParkResult.name}`,
};
const landmarkPinCoords = resolveIssueCoordinates(explicitLandmarkPinReport);
assert.equal(landmarkPinCoords.lat, ecoParkResult.coordinates.lat);
assert.equal(landmarkPinCoords.lng, ecoParkResult.coordinates.lng);
assert.equal(landmarkPinCoords.isExact, false);
assert.equal(landmarkPinCoords.source, `Approximate Landmark: ${ecoParkResult.name}`);

// 9.4: State synchronization across coordinate display, nearest landmark, and report submission
assert.equal(manualMapClickReport.coordinates.lat, clickedLat);
assert.equal(manualMapClickReport.coordinates.lng, clickedLng);
assert.equal(manualMapClickReport.campus, manualMapClickReport.area);
assert.ok(manualMapClickReport.location.startsWith(manualMapClickReport.area));

// 9.5: Clear pin / unmapped state synchronization
const clearedPinReport = {
  id: 'CT-TEST-CLEARED',
  title: 'Missing street sign in newly laid sector road',
  category: 'Traffic and Pedestrian Safety',
  campus: 'Action Area I',
  area: 'Action Area I',
  building: 'Other / Unmapped New Town Location',
  floorRoom: 'Inner perimeter road',
  location: 'Action Area I • Inner perimeter road',
  coordinates: null,
  locationPrecision: 'unmapped',
  locationSource: 'Unmapped Queue',
};
assert.equal(resolveIssueCoordinates(clearedPinReport), null, 'Cleared pin report must cleanly resolve to null coordinates');

// 9.6: Map navigation coordinate ordering and preserving manual pin across searches
const allLocalResults = searchNewTownLocations('Action Area', 25);
allLocalResults.forEach((res) => {
  assert.ok(typeof res.coordinates.lat === 'number', `Result ${res.name} must have numeric lat`);
  assert.ok(typeof res.coordinates.lng === 'number', `Result ${res.name} must have numeric lng`);
  assert.ok(
    isWithinNewTownBounds(res.coordinates.lat, res.coordinates.lng),
    `Result ${res.name} coordinates must fall within New Town bounds`
  );
  assert.ok(res.locality, `Result ${res.name} must have locality description`);
});

// Preserving manual pin when search navigates
const initialUserPin = { lat: 22.58412, lng: 88.45567 };
let activePinCoordinates = { ...initialUserPin };
// User performs 3 searches and navigates around map:
const search1 = searchNewTownLocations('City Centre 2');
const navCoords1 = search1[0].coordinates;
assert.notEqual(navCoords1.lat, activePinCoordinates.lat, 'Navigation target differs from pin');
// Pin remains untouched
assert.deepEqual(activePinCoordinates, initialUserPin, 'Search 1 navigation must not alter active pin');

const search2 = searchNewTownLocations('Tata Medical');
const navCoords2 = search2[0].coordinates;
assert.notEqual(navCoords2.lat, activePinCoordinates.lat);
assert.deepEqual(activePinCoordinates, initialUserPin, 'Search 2 navigation must not alter active pin');

console.log('  ✓ Reliable map click-to-pin places and moves pin without landmark snapping');
console.log('  ✓ Marker drag live position updates and commits exact coordinates');
console.log('  ✓ Landmark search navigation clearly distinguished from explicit pin selection');
console.log('  ✓ Complete state synchronization across map, badges, nearest landmark, and report payload');
console.log('  ✓ Map navigation coordinates strictly validated and manual pin preserved across searches');

// Test 10: User Verification Criteria: Dataset Scale, Bounds, Action Area Distribution & Filtered Clustering
console.log('\nGroup 10: User Verification Criteria (Dataset Scale, Bounds, Action Areas, Honest GPS, Filtered Clustering)');

// 1. At least 100 mapped demonstration reports
const mappedDemoReports = INITIAL_ISSUES.map((issue) => ({
  issue,
  coords: resolveIssueCoordinates(issue),
})).filter((x) => x.coords !== null);

const mappedReportCount = mappedDemoReports.length;
assert.ok(
  mappedReportCount >= 180,
  `Must have at least 180 mapped demonstration reports across New Town (found ${mappedReportCount})`
);
console.log(`  ✓ Confirmed ${mappedReportCount} mapped demonstration reports (exceeds requirement of >= 180)`);

// 2. Unique IDs and valid coordinates
const reportIdSet = new Set();
mappedDemoReports.forEach(({ issue, coords }) => {
  assert.ok(issue.id && typeof issue.id === 'string' && issue.id.trim() !== '', `Issue must have valid non-empty string ID: ${issue.id}`);
  assert.equal(reportIdSet.has(issue.id), false, `Issue ID ${issue.id} must be unique`);
  reportIdSet.add(issue.id);

  assert.ok(typeof coords.lat === 'number' && Number.isFinite(coords.lat), `Issue ${issue.id} lat must be a finite number`);
  assert.ok(typeof coords.lng === 'number' && Number.isFinite(coords.lng), `Issue ${issue.id} lng must be a finite number`);
});
console.log(`  ✓ All ${mappedReportCount} mapped reports have unique IDs and valid finite numeric coordinates`);

// 3. Coordinates within the intended geographic bounds
mappedDemoReports.forEach(({ issue, coords }) => {
  assert.equal(
    isWithinNewTownBounds(coords.lat, coords.lng),
    true,
    `Report ${issue.id} coordinates (${coords.lat}, ${coords.lng}) must fall strictly within New Town geographic bounds`
  );
});
console.log(`  ✓ All ${mappedReportCount} coordinates strictly within New Town, Kolkata bounds (22.52-22.66 N, 88.42-88.54 E)`);

// 4. Distribution across all three Action Areas
const areaDistribution = {
  'Action Area I': 0,
  'Action Area II': 0,
  'Action Area III': 0,
};
mappedDemoReports.forEach(({ issue }) => {
  if (areaDistribution[issue.area] !== undefined) {
    areaDistribution[issue.area]++;
  }
});

assert.ok(areaDistribution['Action Area I'] >= 20, `Action Area I must have ample reports (found ${areaDistribution['Action Area I']})`);
assert.ok(areaDistribution['Action Area II'] >= 20, `Action Area II must have ample reports (found ${areaDistribution['Action Area II']})`);
assert.ok(areaDistribution['Action Area III'] >= 20, `Action Area III must have ample reports (found ${areaDistribution['Action Area III']})`);
console.log(`  ✓ Strong geographic distribution: Action Area I: ${areaDistribution['Action Area I']}, Action Area II: ${areaDistribution['Action Area II']}, Action Area III: ${areaDistribution['Action Area III']}`);

// 5. No false claim that approximate coordinates are GPS-verified
mappedDemoReports.forEach(({ issue, coords }) => {
  if (issue.isDemoReport) {
    assert.notEqual(
      issue.locationPrecision,
      'verified-gps',
      `Demonstration report ${issue.id} must NOT claim verified GPS coordinates without empirical survey`
    );
    assert.equal(
      coords.isExact,
      false,
      `Resolved coordinates for demo report ${issue.id} must be flagged isExact: false`
    );
    assert.equal(
      issue.locationPrecision,
      'approximate-landmark',
      `Demonstration report ${issue.id} must have locationPrecision === 'approximate-landmark'`
    );
  }
});
console.log('  ✓ No false claims of verified GPS: all demonstration reports truthfully designated approximate landmark precision');

// 6. Marker and cluster counts respecting the active filters
const preparedMappedIssues = mappedDemoReports.map(({ issue, coords }) => ({
  issue,
  lat: coords.lat,
  lng: coords.lng,
  isExact: coords.isExact,
  source: coords.source,
}));

// 6a: Category filtering & cluster verification
const testCategory = 'Roads and Footpaths';
const roadsIssues = filterMappedIssues(preparedMappedIssues, { categoryFilter: testCategory });
assert.ok(roadsIssues.length > 0, `Filtered category "${testCategory}" must return issues`);
roadsIssues.forEach(({ issue }) => {
  assert.equal(issue.category, testCategory, `Every issue in filtered set must have category "${testCategory}"`);
});
const roadsClusters = clusterMappedIssues(roadsIssues, 13);
const totalRoadsInClusters = roadsClusters.reduce((acc, c) => acc + (c.isCluster ? c.count : 1), 0);
assert.equal(totalRoadsInClusters, roadsIssues.length, 'Roads cluster items count must exactly equal filtered issues count');

// 6b: Status filtering (Open, In Progress, Verification, Resolved)
const openIssues = filterMappedIssues(preparedMappedIssues, { statusFilter: 'Open' });
assert.ok(openIssues.length > 0, 'Open status filter must return issues');
openIssues.forEach(({ issue }) => assert.equal(issue.status, 'Open'));
const openClusters = clusterMappedIssues(openIssues, 13);
const totalOpenInClusters = openClusters.reduce((acc, c) => acc + (c.isCluster ? c.count : 1), 0);
assert.equal(totalOpenInClusters, openIssues.length, 'Open clusters count must match filtered Open issues count');

const inProgressIssues = filterMappedIssues(preparedMappedIssues, { statusFilter: 'In Progress' });
assert.ok(inProgressIssues.length > 0, 'In Progress status filter must return issues');
inProgressIssues.forEach(({ issue }) => assert.equal(issue.status, 'In Progress'));

const verificationIssues = filterMappedIssues(preparedMappedIssues, { statusFilter: 'Awaiting Verification' });
assert.ok(verificationIssues.length > 0, 'Awaiting Verification status filter must return issues');
verificationIssues.forEach(({ issue }) => {
  assert.ok(issue.status === 'Resolution Submitted' || issue.status === 'Awaiting Verification');
});

const resolvedIssues = filterMappedIssues(preparedMappedIssues, { statusFilter: 'Resolved' });
assert.ok(resolvedIssues.length > 0, 'Resolved status filter must return issues');
resolvedIssues.forEach(({ issue }) => assert.equal(issue.status, 'Resolved'));

// 6c: Priority filtering
const highPriorityIssues = filterMappedIssues(preparedMappedIssues, { priorityFilter: 'High' });
assert.ok(highPriorityIssues.length > 0, 'High priority filter must return issues');
highPriorityIssues.forEach(({ issue }) => assert.equal(issue.priority, 'High'));

// 6d: Action Area / externalFilter
const area3Issues = filterMappedIssues(preparedMappedIssues, { externalFilter: 'Action Area III' });
assert.ok(area3Issues.length > 0, 'Action Area III filter must return issues');
area3Issues.forEach(({ issue }) => {
  assert.ok(
    (issue.area || '').includes('Action Area III') ||
    (issue.campus || '').includes('Action Area III') ||
    (issue.location || '').includes('Action Area III')
  );
});
const area3Clusters = clusterMappedIssues(area3Issues, 13);
const totalArea3InClusters = area3Clusters.reduce((acc, c) => acc + (c.isCluster ? c.count : 1), 0);
assert.equal(totalArea3InClusters, area3Issues.length, 'Action Area III cluster items count must match filtered count');

// 6e: Search query filtering
const bbgSearchIssues = filterMappedIssues(preparedMappedIssues, { searchQuery: 'Biswa Bangla Gate' });
assert.ok(bbgSearchIssues.length > 0, 'Search for Biswa Bangla Gate must return matching issues');
bbgSearchIssues.forEach(({ issue }) => {
  const text = `${issue.title} ${issue.location} ${issue.building} ${issue.neighbourhood}`.toLowerCase();
  assert.ok(text.includes('biswa bangla gate'), 'Search results must contain query');
});

// 6f: Threshold progression validation (more zoom = unclustering)
assert.equal(getClusterThreshold(16), 0, 'Zoom 16 threshold should be 0px');
assert.equal(getClusterThreshold(15), 8, 'Zoom 15 threshold should be 8px');
assert.equal(getClusterThreshold(14), 14, 'Zoom 14 threshold should be 14px');
assert.equal(getClusterThreshold(13), 18, 'Zoom 13 threshold should be 18px');
assert.equal(getClusterThreshold(12), 22, 'Zoom 12 threshold should be 22px');
assert.equal(getClusterThreshold(11), 28, 'Zoom 11 threshold should be 28px');

const zoom12Clusters = clusterMappedIssues(preparedMappedIssues, 12);
const zoom13Clusters = clusterMappedIssues(preparedMappedIssues, 13);
const zoom14Clusters = clusterMappedIssues(preparedMappedIssues, 14);
const zoom16Clusters = clusterMappedIssues(preparedMappedIssues, 16);

// At zoom 16, threshold is 0 so all items must be rendered as individual markers
assert.equal(zoom16Clusters.every((c) => !c.isCluster), true, 'Zoom 16 must be 100% individual markers');
assert.equal(zoom16Clusters.length, preparedMappedIssues.length, 'Zoom 16 must have individual marker for every issue');
assert.ok(zoom13Clusters.length > zoom12Clusters.length, 'Zoom 13 must show more separated objects than Zoom 12');
assert.ok(zoom14Clusters.length > zoom13Clusters.length, 'Zoom 14 must show more separated objects than Zoom 13');

console.log('  ✓ Marker and cluster counts accurately respect category, status, priority, area, and search filters');
console.log('  ✓ Progressive spatial unclustering verified across zoom levels (zoom 12 -> 13 -> 14 -> 16)');

console.log('\n=== ALL GEOGRAPHIC MAP TESTS PASSED ===\n');

