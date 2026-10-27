// Location utilities and New Town, Kolkata geographic knowledge base for CivicTrack
// Includes landmark database, spatial search, reverse landmark estimation, boundary checks, and geocoding.

export const NEW_TOWN_BOUNDS = {
  minLat: 22.48,
  maxLat: 22.68,
  minLng: 88.40,
  maxLng: 88.55,
};

export const NEW_TOWN_LANDMARKS = [
  // Action Area I
  {
    id: 'nazrul-tirtha',
    name: 'Nazrul Tirtha & Cultural Complex',
    area: 'Action Area I',
    sector: 'Action Area I • Nazrul Tirtha & Cultural Complex',
    aliases: ['Nazrul Tirtha', 'Cultural Complex', 'Block CB', 'Biswa Bangla Sarani Gate 1'],
    coordinates: { lat: 22.5835, lng: 88.4550 },
    locality: 'Biswa Bangla Sarani, Action Area I, New Town, Kolkata',
    description: 'Opposite Nazrul Tirtha Gate 1, Biswa Bangla Sarani',
  },
  {
    id: 'ce-cb-blocks',
    name: 'CE & CB Residential Blocks / Market',
    area: 'Action Area I',
    sector: 'Action Area I • CB & CE Residential Blocks',
    aliases: ['CE Block', 'CB Block', 'CE Market', 'Street 106', 'Street 108'],
    coordinates: { lat: 22.5878, lng: 88.4582 },
    locality: 'Street 106 / 108, Action Area I, New Town, Kolkata',
    description: 'CE Block Community & Market Enclave',
  },
  {
    id: 'nkda-corner',
    name: 'NKDA Corner & Central Bus Terminus',
    area: 'Action Area I',
    sector: 'Action Area I • NKDA Corner & Bus Terminus',
    aliases: ['NKDA Corner', 'Bus Terminus', 'Central Bus Depot', 'Transit Bay', 'New Town Bus Stand'],
    coordinates: { lat: 22.5790, lng: 88.4608 },
    locality: 'Near Central Bus Depot, Action Area I, New Town, Kolkata',
    description: 'NKDA Administrative Corner & Bus Depot',
  },
  {
    id: 'coal-india',
    name: 'Coal India & HIDCO Bhawan Corridor',
    area: 'Action Area I',
    sector: 'Action Area I • Coal India & HIDCO Bhawan Corridor',
    aliases: ['Coal India', 'HIDCO Bhawan', 'HIDCO Office', 'Premises 15', 'DG Block'],
    coordinates: { lat: 22.5860, lng: 88.4625 },
    locality: 'Premises 15, MAR, Action Area I, New Town, Kolkata',
    description: 'Coal India Complex & HIDCO Headquarters',
  },
  {
    id: 'biswa-bangla-convention',
    name: 'Biswa Bangla Convention Centre Plaza',
    area: 'Action Area I',
    sector: 'Action Area I • Biswa Bangla Convention Centre Plaza',
    aliases: ['BBCC', 'Convention Centre', 'Biswa Bangla Convention', 'DG Block BBCC'],
    coordinates: { lat: 22.5840, lng: 88.4690 },
    locality: 'DG Block, Action Area I, New Town, Kolkata',
    description: 'Biswa Bangla Convention Centre Exhibition Grounds',
  },
  {
    id: 'swapno-bhor',
    name: 'Swapno Bhor Senior Citizen Park',
    area: 'Action Area I',
    sector: 'Action Area I • Swapno Bhor Senior Citizen Park',
    aliases: ['Swapno Bhor', 'Senior Citizen Park', 'Block BA Park', 'BA Block Park'],
    coordinates: { lat: 22.5890, lng: 88.4510 },
    locality: 'Block BA, Action Area I, New Town, Kolkata',
    description: 'Swapno Bhor Park & Community Centre',
  },
  {
    id: 'candor-techspace',
    name: 'Candor TechSpace IT Corridor',
    area: 'Action Area I',
    sector: 'Action Area I • Candor TechSpace IT Corridor',
    aliases: ['Candor', 'TechSpace', 'Unitech Infospace', 'Street 007', 'DH Block IT Hub'],
    coordinates: { lat: 22.5780, lng: 88.4680 },
    locality: 'Street 007, Action Area I, New Town, Kolkata',
    description: 'Candor TechSpace Special Economic Zone',
  },
  {
    id: 'rabindra-tirtha',
    name: 'Rabindra Tirtha Cultural Centre',
    area: 'Action Area I',
    sector: 'Action Area I • Nazrul Tirtha & Cultural Complex',
    aliases: ['Rabindra Tirtha', 'Tagore Centre', 'Block DG', 'Biswa Bangla Sarani Rabindra'],
    coordinates: { lat: 22.5820, lng: 88.4520 },
    locality: 'Block DG, Biswa Bangla Sarani, Action Area I, New Town, Kolkata',
    description: 'Rabindra Tirtha cultural complex, Biswa Bangla Sarani',
  },
  {
    id: 'mar-south',
    name: 'Major Arterial Road South (MAR South)',
    area: 'Action Area I',
    sector: 'Major Arterial Road (Biswa Bangla Sarani)',
    aliases: ['MAR South', 'Biswa Bangla Sarani South', 'Pride Hotel Crossing', 'New Town South Entry'],
    coordinates: { lat: 22.5720, lng: 88.4540 },
    locality: 'Major Arterial Road South, Action Area I, New Town, Kolkata',
    description: 'South gateway corridor near flyover junction',
  },
  {
    id: 'axis-mall-novotel',
    name: 'Axis Mall & Novotel Crossing',
    area: 'Action Area I',
    sector: 'Action Area I • CB & CE Residential Blocks',
    aliases: ['Axis Mall', 'Novotel Kolkata', 'Block CF', 'Street 169', 'CF Block Mall'],
    coordinates: { lat: 22.5815, lng: 88.4585 },
    locality: 'Block CF, Street 169, Action Area I, New Town, Kolkata',
    description: 'Axis Mall commercial complex & Novotel crossing',
  },
  {
    id: 'dlf-it-park',
    name: 'DLF 1 & IT Park Hub',
    area: 'Action Area I',
    sector: 'Action Area I • Candor TechSpace IT Corridor',
    aliases: ['DLF 1', 'DLF IT Park', 'Major Arterial Road DLF', 'Street 111', 'AF Block DLF'],
    coordinates: { lat: 22.5855, lng: 88.4530 },
    locality: 'Major Arterial Road, Action Area I, New Town, Kolkata',
    description: 'DLF IT Park commercial & tech hub',
  },
  {
    id: 'new-town-police-station',
    name: 'New Town Police Station & Administrative Complex',
    area: 'Action Area I',
    sector: 'Action Area I • NKDA Corner & Bus Terminus',
    aliases: ['New Town Police Station', 'NKDA Administrative Complex', 'Action Area I Police Station', 'Utility Building NKDA'],
    coordinates: { lat: 22.5870, lng: 88.4560 },
    locality: 'Action Area I, New Town, Kolkata',
    description: 'New Town Police Station & NKDA utility administrative complex',
  },
  {
    id: 'action-area-1',
    name: 'Action Area I (CBD & Residential Core)',
    area: 'Action Area I',
    sector: 'Action Area I • CB & CE Residential Blocks',
    aliases: ['Action Area I', 'Action Area 1', 'AA1', 'AA-I', 'New Town Action Area 1', 'New Town AA1'],
    coordinates: { lat: 22.5835, lng: 88.4570 },
    locality: 'Action Area I Central, New Town, Kolkata',
    description: 'Action Area I central civic and commercial district',
  },

  // Action Area II
  {
    id: 'biswa-bangla-gate',
    name: 'Biswa Bangla Gate (Narkelbagan)',
    area: 'Action Area II',
    sector: 'Action Area II • Biswa Bangla Gate (Narkelbagan)',
    aliases: ['Biswa Bangla Gate', 'Kolkata Gate', 'Narkelbagan', 'Ring Crossing', 'Hanging Restaurant'],
    coordinates: { lat: 22.5932, lng: 88.4716 },
    locality: 'Biswa Bangla Sarani & Major Arterial Road, Action Area II, New Town, Kolkata',
    description: 'Biswa Bangla Gate iconic traffic rotunda & viewing gallery',
  },
  {
    id: 'eco-park',
    name: 'Eco Park & Public Lake Promenade',
    area: 'Action Area II',
    sector: 'Action Area II • Eco Park & Public Lake Promenade',
    aliases: ['Eco Park', 'Eco Island', 'Eco Park Gate 1', 'Eco Park Gate 2', 'Eco Park Gate 3', 'Lake Promenade', 'Prakriti Tirtha'],
    coordinates: { lat: 22.6045, lng: 88.4678 },
    locality: 'Major Arterial Road, Action Area II, New Town, Kolkata',
    description: 'Prakriti Tirtha (Eco Park) Main Promenade Gate 2',
  },
  {
    id: 'mothers-wax-museum',
    name: 'Mother\'s Wax Museum & Urban Village',
    area: 'Action Area II',
    sector: 'Action Area II • Mother\'s Wax Museum & Urban Village',
    aliases: ['Wax Museum', 'Mothers Wax Museum', 'Finance Centre Gate Wax Museum'],
    coordinates: { lat: 22.6025, lng: 88.4688 },
    locality: 'Finance Centre Building, Action Area II, New Town, Kolkata',
    description: 'Opposite Eco Park Gate 2, Finance Centre building',
  },
  {
    id: 'city-centre-2',
    name: 'City Centre 2 & Chinar Park Link',
    area: 'Action Area II',
    sector: 'Action Area II • City Centre 2 & Chinar Park Link',
    aliases: ['City Centre 2', 'CC2', 'Chinar Park', 'Rajarhat Main Road Crossing', 'CC2 Mall'],
    coordinates: { lat: 22.6288, lng: 88.4485 },
    locality: 'Rajarhat Main Road, Action Area II, New Town, Kolkata',
    description: 'City Centre 2 mall plaza & suburban transit link',
  },
  {
    id: 'akankha-crossing',
    name: 'Akankha Crossing & Rajarhat Road',
    area: 'Action Area II',
    sector: 'Action Area II • Akankha Crossing & Rajarhat Road',
    aliases: ['Akankha Crossing', 'Akankha More', 'Rajarhat Link Road', 'Akankha Junction'],
    coordinates: { lat: 22.6210, lng: 88.4610 },
    locality: 'Akankha Crossing, Action Area II, New Town, Kolkata',
    description: 'Akankha multi-lane intersection & northern residential sector',
  },
  {
    id: 'eco-urban-village',
    name: 'Eco Urban Village Promenade',
    area: 'Action Area II',
    sector: 'Action Area II • Mother\'s Wax Museum & Urban Village',
    aliases: ['Eco Urban Village', 'Urban Village', 'Canal Road', 'Rajarhat Canal Walkway'],
    coordinates: { lat: 22.6170, lng: 88.4820 },
    locality: 'Canal Road, Action Area II, New Town, Kolkata',
    description: 'Eco Urban Village public recreation area by the canal',
  },
  {
    id: 'finance-centre-hub',
    name: 'Finance Centre & HIDCO Financial Hub',
    area: 'Action Area II',
    sector: 'Action Area II • Mother\'s Wax Museum & Urban Village',
    aliases: ['Finance Centre', 'Financial Hub', 'HIDCO Financial Centre', 'CBD Phase 2 Hub'],
    coordinates: { lat: 22.6010, lng: 88.4710 },
    locality: 'Financial Hub, Action Area II, New Town, Kolkata',
    description: 'HIDCO Financial Hub & corporate institutional corridor',
  },
  {
    id: 'action-area-2',
    name: 'Action Area II (Institutional & Eco Hub)',
    area: 'Action Area II',
    sector: 'Action Area II • Biswa Bangla Gate (Narkelbagan)',
    aliases: ['Action Area II', 'Action Area 2', 'AA2', 'AA-II', 'New Town Action Area 2', 'New Town AA2'],
    coordinates: { lat: 22.6020, lng: 88.4680 },
    locality: 'Action Area II Central, New Town, Kolkata',
    description: 'Action Area II institutional, convention, and ecological hub',
  },

  // Action Area III
  {
    id: 'tata-medical-center',
    name: 'Tata Medical Center & Health Corridor',
    area: 'Action Area III',
    sector: 'Action Area III • Tata Medical Center & Health Corridor',
    aliases: ['Tata Medical Center', 'TMC', 'Cancer Hospital', 'Health Corridor', 'TMC Hospital'],
    coordinates: { lat: 22.5695, lng: 88.4875 },
    locality: '14 MAR (EW), Action Area III, New Town, Kolkata',
    description: 'Tata Medical Center specialty healthcare zone',
  },
  {
    id: 'sukhobrishti-shapoorji',
    name: 'Sukhobrishti & Shapoorji Complex',
    area: 'Action Area III',
    sector: 'Action Area III • Sukhobrishti & Shapoorji Complex',
    aliases: ['Sukhobrishti', 'Shapoorji', 'Mass Housing', 'Action Area III Residential', 'Shapoorji Pallonji Sukhobrishti'],
    coordinates: { lat: 22.5680, lng: 88.4950 },
    locality: 'Sukhobrishti, Action Area III, New Town, Kolkata',
    description: 'Shapoorji Pallonji Sukhobrishti township gateway',
  },
  {
    id: 'st-xaviers-university',
    name: 'St. Xavier\'s University Avenue',
    area: 'Action Area III',
    sector: 'Action Area III • St. Xavier\'s University Avenue',
    aliases: ['St Xaviers', 'Xavier University', 'Institutional Area', 'SXUK New Town'],
    coordinates: { lat: 22.5645, lng: 88.4840 },
    locality: 'Premises IIIB-1, Action Area III, New Town, Kolkata',
    description: 'St. Xavier\'s University educational campus entrance',
  },
  {
    id: 'uniworld-city',
    name: 'Uniworld City & Downtown Hub',
    area: 'Action Area III',
    sector: 'Action Area III • Uniworld City & Downtown Hub',
    aliases: ['Uniworld City', 'Downtown Hub', 'Candor AA3', 'Air Force Housing', 'Uniworld Towers'],
    coordinates: { lat: 22.5630, lng: 88.4890 },
    locality: 'Downtown Mall Corridor, Action Area III, New Town, Kolkata',
    description: 'Uniworld City towers & commercial downtown hub',
  },
  {
    id: 'action-area-3',
    name: 'Action Area III (University & Tech Township)',
    area: 'Action Area III',
    sector: 'Action Area III • Uniworld City & Downtown Hub',
    aliases: ['Action Area III', 'Action Area 3', 'AA3', 'AA-III', 'New Town Action Area 3', 'New Town AA3'],
    coordinates: { lat: 22.5670, lng: 88.4880 },
    locality: 'Action Area III Central, New Town, Kolkata',
    description: 'Action Area III educational, healthcare, and residential sector',
  },
];

/**
 * Calculates straight-line distance in meters between two lat/lng points using Haversine formula
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Searches local New Town landmarks by keyword with strict multi-token filtering
 * to prevent unrelated landmarks from matching just because they share a generic keyword.
 */
export function searchNewTownLocations(query = '', limit = 6) {
  const q = String(query).toLowerCase().trim();
  if (!q) return [];

  const results = [];
  const terms = q.split(/\s+/).filter(Boolean);
  const STOP_WORDS = new Set(['and', '&', 'near', 'at', 'in', 'the', 'of', 'to', 'opposite']);
  const keyTerms = terms.filter((t) => !STOP_WORDS.has(t) && t.length > 1);
  const termsToCheck = keyTerms.length > 0 ? keyTerms : terms;

  NEW_TOWN_LANDMARKS.forEach((item) => {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const areaLower = item.area.toLowerCase();
    const descLower = item.description.toLowerCase();
    const localityLower = (item.locality || '').toLowerCase();
    const aliasesLower = item.aliases.map((a) => a.toLowerCase());

    // 1. Exact full query matches
    if (nameLower === q) score += 1000;
    else if (aliasesLower.some((a) => a === q)) score += 900;
    else if (nameLower.startsWith(q)) score += 600;
    else if (aliasesLower.some((a) => a.startsWith(q))) score += 500;
    else if (nameLower.includes(q)) score += 400;
    else if (aliasesLower.some((a) => a.includes(q))) score += 350;
    else if (descLower.includes(q) || localityLower.includes(q)) score += 200;

    // 2. Action Area explicit search (e.g. "Action Area I", "Action Area 2", "aa3")
    const isAreaQuery = q.includes('action area') || q === 'aa1' || q === 'aa2' || q === 'aa3';
    if (isAreaQuery) {
      if (nameLower.includes(q) || aliasesLower.some((a) => a === q)) {
        score += 800;
      } else if (areaLower.includes(q)) {
        score += 150;
      }
    }

    // 3. Multi-term precision filter:
    // Every key search term must be present across name, aliases, locality, area, or description.
    // If ANY key term is missing, do not match this item (avoids "Swapno Bhor" matching "Eco Park").
    let allKeyTermsPresent = true;
    for (const term of termsToCheck) {
      const inName = nameLower.includes(term);
      const inAliases = aliasesLower.some((a) => a.includes(term));
      const inDesc = descLower.includes(term);
      const inArea = areaLower.includes(term);
      const inLocality = localityLower.includes(term);

      if (!inName && !inAliases && !inDesc && !inArea && !inLocality) {
        allKeyTermsPresent = false;
        break;
      }

      if (inName) score += 40;
      if (inAliases) score += 30;
      if (inArea) score += 15;
      if (inDesc || inLocality) score += 10;
    }

    if (allKeyTermsPresent && score > 0) {
      results.push({
        item: {
          ...item,
          locality: item.locality || `${item.area}, New Town, Kolkata`,
          isLocalLandmark: true,
        },
        score,
      });
    }
  });

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}

/**
 * Finds the nearest recognized landmark to a given coordinate
 */
export function findNearestLandmark(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  NEW_TOWN_LANDMARKS.forEach((landmark) => {
    const dist = calculateDistanceMeters(lat, lng, landmark.coordinates.lat, landmark.coordinates.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = landmark;
    }
  });

  if (!nearest) return null;

  let readableText = '';
  if (minDistance < 75) {
    readableText = `At ${nearest.name} (${nearest.area})`;
  } else if (minDistance < 350) {
    readableText = `Near ${nearest.name} (~${minDistance}m, ${nearest.area})`;
  } else if (minDistance < 1000) {
    readableText = `Vicinity of ${nearest.name} (~${Math.round(minDistance / 100) * 100}m, ${nearest.area})`;
  } else {
    readableText = `${nearest.area} Sector (${nearest.name} area)`;
  }

  return {
    landmark: nearest,
    distanceMeters: minDistance,
    description: readableText,
    area: nearest.area,
    sector: nearest.sector,
  };
}

/**
 * Validates whether coordinates are roughly in the New Town / Greater Kolkata area
 */
export function isWithinNewTownBounds(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  return (
    lat >= NEW_TOWN_BOUNDS.minLat &&
    lat <= NEW_TOWN_BOUNDS.maxLat &&
    lng >= NEW_TOWN_BOUNDS.minLng &&
    lng <= NEW_TOWN_BOUNDS.maxLng
  );
}

/**
 * Formats coordinates for clean UI presentation
 */
export function formatCoordinates(coords, decimals = 5) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return 'Not plotted';
  }
  return `${coords.lat.toFixed(decimals)}, ${coords.lng.toFixed(decimals)}`;
}

/**
 * Safe OpenStreetMap Nominatim geocoding lookup biased and scoped to New Town, Kolkata, West Bengal, India.
 * Evaluates geographic relevance, rejects distant non-local results, and handles timeouts/errors cleanly.
 */
export async function searchNominatim(query, signal = null) {
  if (!query || query.trim().length < 2) return [];

  const trimmed = query.trim();
  const isAlreadyLocalized = /new\s*town|kolkata|rajarhat|west\s*bengal/i.test(trimmed);
  const osmQuery = isAlreadyLocalized
    ? `${trimmed}, West Bengal, India`
    : `${trimmed}, New Town, Kolkata, West Bengal, India`;

  // Scoped viewbox around Greater New Town / Rajarhat, Kolkata (min_lon, max_lat, max_lon, min_lat)
  const viewbox = '88.38,22.68,88.56,22.48';
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    osmQuery
  )}&countrycodes=in&viewbox=${viewbox}&bounded=0&limit=6&addressdetails=1`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const results = [];
    const seen = new Set();

    data.forEach((item) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      if (isNaN(lat) || isNaN(lng)) return;

      // Filter out results completely outside Greater Kolkata / West Bengal
      const isRegional = lat >= 22.40 && lat <= 22.75 && lng >= 88.30 && lng <= 88.65;
      const displayName = item.display_name || '';
      const isBengal = /west\s*bengal|kolkata|rajarhat|north\s*24\s*parganas|new\s*town/i.test(displayName);

      if (!isRegional && !isBengal) return;

      // Proximity deduplication (~100m)
      const coordKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      if (seen.has(coordKey)) return;
      seen.add(coordKey);

      // Clean primary name and locality
      const primaryName = (item.name || displayName.split(',')[0] || trimmed).trim();
      const addr = item.address || {};
      const road = addr.road || addr.pedestrian || addr.street;
      const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.commercial;
      const city = addr.city_district || addr.city || 'New Town, Kolkata';

      const localityParts = [road, suburb, city].filter(Boolean);
      const locality = localityParts.length > 0
        ? localityParts.join(', ')
        : displayName.split(',').slice(1, 4).map((s) => s.trim()).filter(Boolean).join(', ');

      // Determine Action Area
      let area = 'Action Area I';
      if (/Action\s*Area\s*II\b/i.test(displayName) || (lat >= 22.59 && lat <= 22.63 && lng >= 88.44 && lng <= 88.48)) {
        area = 'Action Area II';
      } else if (/Action\s*Area\s*III\b/i.test(displayName) || (lat >= 22.55 && lat <= 22.58 && lng >= 88.47 && lng <= 88.52)) {
        area = 'Action Area III';
      } else {
        const nearest = findNearestLandmark(lat, lng);
        if (nearest?.area) area = nearest.area;
      }

      results.push({
        id: `osm-${item.place_id || Math.random().toString(36).substr(2, 9)}`,
        name: primaryName,
        locality: locality || `${area}, New Town, Kolkata`,
        fullName: displayName,
        area,
        sector: `${area} • ${primaryName}`,
        description: locality || displayName,
        coordinates: { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) },
        isOsmResult: true,
      });
    });

    return results;
  } catch {
    // Graceful error/abort fallback
    return [];
  }
}
