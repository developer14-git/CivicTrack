// Location utilities and New Town, Kolkata geographic knowledge base for CivicTrack
// Includes landmark database, spatial search, reverse landmark estimation, and boundary checks.

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
    description: 'Opposite Nazrul Tirtha Gate 1, Biswa Bangla Sarani',
  },
  {
    id: 'ce-cb-blocks',
    name: 'CE & CB Residential Blocks / Market',
    area: 'Action Area I',
    sector: 'Action Area I • CB & CE Residential Blocks',
    aliases: ['CE Block', 'CB Block', 'CE Market', 'Street 106', 'Street 108'],
    coordinates: { lat: 22.5878, lng: 88.4582 },
    description: 'CE Block Community & Market Enclave',
  },
  {
    id: 'nkda-corner',
    name: 'NKDA Corner & Central Bus Terminus',
    area: 'Action Area I',
    sector: 'Action Area I • NKDA Corner & Bus Terminus',
    aliases: ['NKDA Corner', 'Bus Terminus', 'Central Bus Depot', 'Transit Bay'],
    coordinates: { lat: 22.5790, lng: 88.4608 },
    description: 'NKDA Administrative Corner & Bus Depot',
  },
  {
    id: 'coal-india',
    name: 'Coal India & HIDCO Bhawan Corridor',
    area: 'Action Area I',
    sector: 'Action Area I • Coal India & HIDCO Bhawan Corridor',
    aliases: ['Coal India', 'HIDCO Bhawan', 'HIDCO Office', 'Premises 15'],
    coordinates: { lat: 22.5860, lng: 88.4625 },
    description: 'Coal India Complex & HIDCO Headquarters',
  },
  {
    id: 'biswa-bangla-convention',
    name: 'Biswa Bangla Convention Centre Plaza',
    area: 'Action Area I',
    sector: 'Action Area I • Biswa Bangla Convention Centre Plaza',
    aliases: ['BBCC', 'Convention Centre', 'Biswa Bangla Convention'],
    coordinates: { lat: 22.5840, lng: 88.4690 },
    description: 'Biswa Bangla Convention Centre Exhibition Grounds',
  },
  {
    id: 'swapno-bhor',
    name: 'Swapno Bhor Senior Citizen Park',
    area: 'Action Area I',
    sector: 'Action Area I • Swapno Bhor Senior Citizen Park',
    aliases: ['Swapno Bhor', 'Senior Citizen Park', 'Block BA Park'],
    coordinates: { lat: 22.5890, lng: 88.4510 },
    description: 'Swapno Bhor Park & Community Centre',
  },
  {
    id: 'candor-techspace',
    name: 'Candor TechSpace IT Corridor',
    area: 'Action Area I',
    sector: 'Action Area I • Candor TechSpace IT Corridor',
    aliases: ['Candor', 'TechSpace', 'Unitech Infospace', 'Street 007'],
    coordinates: { lat: 22.5780, lng: 88.4680 },
    description: 'Candor TechSpace Special Economic Zone',
  },
  {
    id: 'rabindra-tirtha',
    name: 'Rabindra Tirtha Cultural Centre',
    area: 'Action Area I',
    sector: 'Action Area I • Nazrul Tirtha & Cultural Complex',
    aliases: ['Rabindra Tirtha', 'Tagore Centre', 'Block DG'],
    coordinates: { lat: 22.5820, lng: 88.4520 },
    description: 'Rabindra Tirtha cultural complex, Biswa Bangla Sarani',
  },
  {
    id: 'mar-south',
    name: 'Major Arterial Road South (MAR South)',
    area: 'Action Area I',
    sector: 'Major Arterial Road (Biswa Bangla Sarani)',
    aliases: ['MAR South', 'Pride Hotel Crossing', 'New Town South Entry'],
    coordinates: { lat: 22.5720, lng: 88.4540 },
    description: 'South gateway corridor near flyover junction',
  },

  // Action Area II
  {
    id: 'biswa-bangla-gate',
    name: 'Biswa Bangla Gate (Narkelbagan)',
    area: 'Action Area II',
    sector: 'Action Area II • Biswa Bangla Gate (Narkelbagan)',
    aliases: ['Biswa Bangla Gate', 'Kolkata Gate', 'Narkelbagan', 'Ring Crossing', 'Hanging Restaurant'],
    coordinates: { lat: 22.5932, lng: 88.4716 },
    description: 'Biswa Bangla Gate iconic traffic rotunda & viewing gallery',
  },
  {
    id: 'eco-park',
    name: 'Eco Park & Public Lake Promenade',
    area: 'Action Area II',
    sector: 'Action Area II • Eco Park & Public Lake Promenade',
    aliases: ['Eco Park', 'Eco Island', 'Eco Park Gate 1', 'Eco Park Gate 2', 'Lake Promenade'],
    coordinates: { lat: 22.6045, lng: 88.4678 },
    description: 'Prakriti Tirtha (Eco Park) Main Promenade Gate 2',
  },
  {
    id: 'mothers-wax-museum',
    name: 'Mother\'s Wax Museum & Urban Village',
    area: 'Action Area II',
    sector: 'Action Area II • Mother\'s Wax Museum & Urban Village',
    aliases: ['Wax Museum', 'Mothers Wax Museum', 'Finance Centre Gate'],
    coordinates: { lat: 22.6025, lng: 88.4688 },
    description: 'Opposite Eco Park Gate 2, Finance Centre building',
  },
  {
    id: 'city-centre-2',
    name: 'City Centre 2 & Chinar Park Link',
    area: 'Action Area II',
    sector: 'Action Area II • City Centre 2 & Chinar Park Link',
    aliases: ['City Centre 2', 'CC2', 'Chinar Park', 'Rajarhat Main Road Crossing'],
    coordinates: { lat: 22.6288, lng: 88.4485 },
    description: 'City Centre 2 mall plaza & suburban transit link',
  },
  {
    id: 'akankha-crossing',
    name: 'Akankha Crossing & Rajarhat Road',
    area: 'Action Area II',
    sector: 'Action Area II • Akankha Crossing & Rajarhat Road',
    aliases: ['Akankha Crossing', 'Akankha More', 'Rajarhat Link Road'],
    coordinates: { lat: 22.6210, lng: 88.4610 },
    description: 'Akankha multi-lane intersection & northern residential sector',
  },
  {
    id: 'eco-urban-village',
    name: 'Eco Urban Village Promenade',
    area: 'Action Area II',
    sector: 'Action Area II • Mother\'s Wax Museum & Urban Village',
    aliases: ['Eco Urban Village', 'Urban Village', 'Canal Road'],
    coordinates: { lat: 22.6170, lng: 88.4820 },
    description: 'Eco Urban Village public recreation area by the canal',
  },

  // Action Area III
  {
    id: 'tata-medical-center',
    name: 'Tata Medical Center & Health Corridor',
    area: 'Action Area III',
    sector: 'Action Area III • Tata Medical Center & Health Corridor',
    aliases: ['Tata Medical Center', 'TMC', 'Cancer Hospital', 'Health Corridor'],
    coordinates: { lat: 22.5695, lng: 88.4875 },
    description: 'Tata Medical Center specialty healthcare zone',
  },
  {
    id: 'sukhobrishti-shapoorji',
    name: 'Sukhobrishti & Shapoorji Complex',
    area: 'Action Area III',
    sector: 'Action Area III • Sukhobrishti & Shapoorji Complex',
    aliases: ['Sukhobrishti', 'Shapoorji', 'Mass Housing', 'Action Area III Residential'],
    coordinates: { lat: 22.5680, lng: 88.4950 },
    description: 'Shapoorji Pallonji Sukhobrishti township gateway',
  },
  {
    id: 'st-xaviers-university',
    name: 'St. Xavier\'s University Avenue',
    area: 'Action Area III',
    sector: 'Action Area III • St. Xavier\'s University Avenue',
    aliases: ['St Xaviers', 'Xavier University', 'Institutional Area'],
    coordinates: { lat: 22.5645, lng: 88.4840 },
    description: 'St. Xavier\'s University educational campus entrance',
  },
  {
    id: 'uniworld-city',
    name: 'Uniworld City & Downtown Hub',
    area: 'Action Area III',
    sector: 'Action Area III • Uniworld City & Downtown Hub',
    aliases: ['Uniworld City', 'Downtown Hub', 'Candor AA3', 'Air Force Housing'],
    coordinates: { lat: 22.5630, lng: 88.4890 },
    description: 'Uniworld City towers & commercial downtown hub',
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
 * Searches local New Town landmarks by keyword
 */
export function searchNewTownLocations(query = '', limit = 6) {
  const q = String(query).toLowerCase().trim();
  if (!q) return [];

  const results = [];
  const terms = q.split(/\s+/).filter(Boolean);

  NEW_TOWN_LANDMARKS.forEach((item) => {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const areaLower = item.area.toLowerCase();
    const descLower = item.description.toLowerCase();
    const aliasesLower = item.aliases.map((a) => a.toLowerCase());

    // Exact or direct prefix match
    if (nameLower.startsWith(q)) score += 100;
    else if (nameLower.includes(q)) score += 50;

    // Area match
    if (areaLower.includes(q)) score += 40;

    // Alias matches
    aliasesLower.forEach((alias) => {
      if (alias.startsWith(q)) score += 60;
      else if (alias.includes(q)) score += 30;
    });

    // Multi-term check
    terms.forEach((term) => {
      if (nameLower.includes(term)) score += 15;
      if (areaLower.includes(term)) score += 10;
      if (descLower.includes(term)) score += 5;
      if (aliasesLower.some((a) => a.includes(term))) score += 10;
    });

    if (score > 0) {
      results.push({ item, score });
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
 * Safe OpenStreetMap Nominatim geocoding lookup scoped to New Town, Kolkata.
 * Wrapped in try/catch and abort timeout to guarantee failure never breaks the UI.
 */
export async function searchNominatim(query, signal = null) {
  if (!query || query.trim().length < 2) return [];

  // Scoped viewbox around New Town, Kolkata
  const viewbox = '88.40,22.68,88.55,22.48';
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query + ', New Town, Kolkata'
  )}&viewbox=${viewbox}&bounded=0&limit=5&addressdetails=1`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, {
      signal: signal || controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();

    if (!Array.isArray(data)) return [];

    return data.map((item) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      return {
        id: `osm-${item.place_id || Math.random()}`,
        name: item.display_name.split(',')[0],
        fullName: item.display_name,
        area: item.display_name.includes('Action Area II')
          ? 'Action Area II'
          : item.display_name.includes('Action Area III')
          ? 'Action Area III'
          : 'Action Area I',
        coordinates: { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) },
        isOsmResult: true,
      };
    });
  } catch {
    // Graceful fallback: return empty array without crashing
    return [];
  }
}
