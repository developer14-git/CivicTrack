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
assert.equal(INITIAL_ISSUES.length, 225, `INITIAL_ISSUES must contain exactly 225 demonstration reports (found ${INITIAL_ISSUES.length})`);

// Verify unique contiguous IDs CT-101 through CT-325
const ids = INITIAL_ISSUES.map((i) => i.id);
const uniqueIds = new Set(ids);
assert.equal(uniqueIds.size, 225, 'All 225 report IDs must be strictly unique');
for (let num = 101; num <= 325; num++) {
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
  assert.ok(count >= 10, `Category "${cat}" must have at least 10 reports (found ${count})`);
});

// Verify location precision distribution
const verifiedCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'verified-gps').length;
const approxCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'approximate-landmark').length;
const unmappedCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'unmapped').length;

assert.equal(verifiedCount, 0, 'No hardcoded demo reports should claim verified GPS without real survey evidence');
assert.equal(approxCount, 207, 'Exactly 207 demo reports have approximate landmark coordinates');
assert.equal(unmappedCount, 18, 'Exactly 18 demo reports remain in unmapped queue');
assert.equal(verifiedCount + approxCount + unmappedCount, 225, 'All 225 reports accounted for exactly once across precision sets');

// Verify unmapped queue
const unmappedIds = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'unmapped').map((i) => i.id);
assert.deepEqual(
  unmappedIds,
  ['CT-109', 'CT-134', 'CT-135', 'CT-155', 'CT-168', 'CT-179', 'CT-191', 'CT-200', 'CT-205', 'CT-210', 'CT-218', 'CT-225', 'CT-235', 'CT-245', 'CT-257', 'CT-270', 'CT-283', 'CT-325'],
  'Unmapped queue must match expected unmapped report IDs'
);

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

console.log(`  ✓ Demonstration dataset verified: 225 reports (0 verified GPS, 207 approximate landmark, 18 unmapped), all unique IDs CT-101..CT-325, all 12 categories, all lifecycle statuses`);

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

assert.equal(mappedTotal, 207, 'Must have exactly 207 mapped demo reports');
assert.equal(mappedPoints.size, 207, 'All 207 mapped demo reports must have distinct, non-overlapping coordinates');
console.log('  ✓ All 207 mapped reports have unique, geographically distinct coordinates within New Town');
console.log('  ✓ No artificial coordinate stacking or clustering overlap across the demonstration dataset');

console.log('\n=== ALL GEOGRAPHIC MAP TESTS PASSED ===\n');

