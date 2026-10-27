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
  id: 'CT-201',
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
assert.equal(INITIAL_ISSUES.length, 100, `INITIAL_ISSUES must contain exactly 100 demonstration reports (found ${INITIAL_ISSUES.length})`);

// Verify unique contiguous IDs CT-101 through CT-200
const ids = INITIAL_ISSUES.map((i) => i.id);
const uniqueIds = new Set(ids);
assert.equal(uniqueIds.size, 100, 'All 100 report IDs must be strictly unique');
for (let num = 101; num <= 200; num++) {
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
  assert.ok(count >= 5, `Category "${cat}" must have at least 5 reports (found ${count})`);
});

// Verify location precision distribution
const verifiedCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'verified-gps').length;
const approxCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'approximate-landmark').length;
const unmappedCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'unmapped').length;

assert.equal(verifiedCount, 0, 'No hardcoded demo reports should claim verified GPS without real survey evidence');
assert.equal(approxCount, 92, 'Exactly 92 demo reports have approximate landmark coordinates');
assert.equal(unmappedCount, 8, 'Exactly 8 demo reports remain in unmapped queue');
assert.equal(verifiedCount + approxCount + unmappedCount, 100, 'All 100 reports accounted for exactly once across precision sets');

// Verify unmapped queue
const unmappedIds = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'unmapped').map((i) => i.id);
assert.deepEqual(
  unmappedIds,
  ['CT-109', 'CT-134', 'CT-135', 'CT-155', 'CT-168', 'CT-179', 'CT-191', 'CT-200'],
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

console.log(`  ✓ Demonstration dataset verified: 100 reports (0 verified GPS, 92 approximate landmark, 8 unmapped), all unique IDs CT-101..CT-200, all 12 categories, all lifecycle statuses`);

console.log('\n=== ALL GEOGRAPHIC MAP TESTS PASSED ===\n');

