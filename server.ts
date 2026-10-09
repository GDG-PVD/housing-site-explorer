import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Load towns data
interface TownInfo {
  town: string;
  zoningUrl: string;
  platform: string;
  whereZoningSits: string;
}

const townsFilePath = path.join(__dirname, 'src', 'data', 'towns.json');
let townsData: TownInfo[] = [];
try {
  const rawTowns = fs.readFileSync(townsFilePath, 'utf-8');
  townsData = JSON.parse(rawTowns);
} catch (err) {
  console.error('Failed to load towns.json:', err);
}

// Helper to normalize strings for comparison
function normalizeStr(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Known village/neighborhood to Rhode Island town mappings
const VILLAGE_TO_TOWN: Record<string, string> = {
  kingston: 'South Kingstown',
  wakefield: 'South Kingstown',
  peacedale: 'South Kingstown',
  westkingston: 'South Kingstown',
  snugharbor: 'South Kingstown',
  greenhill: 'South Kingstown',
  matunuck: 'South Kingstown',
  perryville: 'South Kingstown',
  wickford: 'North Kingstown',
  quonset: 'North Kingstown',
  davisville: 'North Kingstown',
  saunderstown: 'North Kingstown',
  blockisland: 'New Shoreham',
  chepachet: 'Glocester',
  harmony: 'Glocester',
  pascoag: 'Burrillville',
  harrisville: 'Burrillville',
  mapleville: 'Burrillville',
  nasonville: 'Burrillville',
  bridgeton: 'Burrillville',
  glendale: 'Burrillville',
  oakland: 'Burrillville',
  apponaug: 'Warwick',
  conimicut: 'Warwick',
  warwickneck: 'Warwick',
  norwood: 'Warwick',
  oaklandbeach: 'Warwick',
  potowomut: 'Warwick',
  gaspeepoint: 'Warwick',
  hoxsie: 'Warwick',
  buttonwoods: 'Warwick',
  riverside: 'East Providence',
  rumford: 'East Providence',
  manville: 'Lincoln',
  albion: 'Lincoln',
  limerock: 'Lincoln',
  saylesville: 'Lincoln',
  ashaway: 'Hopkinton',
  hopevalley: 'Hopkinton',
  rockville: 'Hopkinton',
  wyoming: 'Richmond',
  woodriverjunction: 'Richmond',
  carolina: 'Richmond',
  alton: 'Richmond',
  kenyon: 'Richmond',
  greenville: 'Smithfield',
  georgiaville: 'Smithfield',
  esmond: 'Smithfield',
  valleyfalls: 'Cumberland',
  lonsdale: 'Cumberland',
  cumberlandhill: 'Cumberland',
  ashton: 'Cumberland',
  berkeley: 'Cumberland',
  diamondhill: 'Cumberland',
  arnoldmills: 'Cumberland',
  northscituate: 'Scituate',
  hope: 'Scituate',
  clayville: 'Scituate',
  fiskeville: 'Scituate',
  edgewood: 'Cranston',
  knightsville: 'Cranston',
  oaklawn: 'Cranston',
  auburn: 'Cranston',
  pawtuxet: 'Cranston',
  meshanticut: 'Cranston',
  misquamicut: 'Westerly',
  watchhill: 'Westerly',
  bradford: 'Westerly',
  avondale: 'Westerly',
  weekapaug: 'Westerly',
  adamsville: 'Little Compton',
  tivertonfourcorners: 'Tiverton',
  quidnick: 'West Warwick',
  arctic: 'West Warwick',
  crompton: 'West Warwick',
  centreville: 'West Warwick',
  natick: 'West Warwick',
  phenix: 'West Warwick',
  riverpoint: 'West Warwick',
  greene: 'Coventry',
  summit: 'Coventry',
  anthony: 'Coventry',
  washington: 'Coventry',
  tiogue: 'Coventry',
  fostercenter: 'Foster',
};

// Match address components or formatted text to one of the 39 RI municipalities
function matchRhodeIslandTown(components: any[] = [], formattedAddress: string = ''): TownInfo | null {
  const normTownMap = new Map<string, TownInfo>();
  for (const t of townsData) {
    normTownMap.set(normalizeStr(t.town), t);
  }

  // Check locality (city/town)
  const localityComp = components.find(c => c.types.includes('locality'));
  if (localityComp) {
    const norm = normalizeStr(localityComp.long_name);
    if (normTownMap.has(norm)) {
      return normTownMap.get(norm)!;
    }
    if (VILLAGE_TO_TOWN[norm]) {
      const parent = VILLAGE_TO_TOWN[norm];
      return townsData.find(t => t.town.toLowerCase() === parent.toLowerCase()) || null;
    }
  }

  // Check administrative_area_level_3 (Towns in New England)
  const admin3Comp = components.find(c => c.types.includes('administrative_area_level_3'));
  if (admin3Comp) {
    const raw = admin3Comp.long_name.replace(/^(Town of|City of)\s+/i, '');
    const norm = normalizeStr(raw);
    if (normTownMap.has(norm)) {
      return normTownMap.get(norm)!;
    }
  }

  // Check sublocality / neighborhood
  const sublocalityComp = components.find(c =>
    c.types.includes('sublocality') ||
    c.types.includes('sublocality_level_1') ||
    c.types.includes('neighborhood')
  );
  if (sublocalityComp) {
    const norm = normalizeStr(sublocalityComp.long_name);
    if (normTownMap.has(norm)) {
      return normTownMap.get(norm)!;
    }
    if (VILLAGE_TO_TOWN[norm]) {
      const parent = VILLAGE_TO_TOWN[norm];
      return townsData.find(t => t.town.toLowerCase() === parent.toLowerCase()) || null;
    }
  }

  // Check formatted address string for exact town names
  for (const t of townsData) {
    const regex = new RegExp(`\\b${t.town}\\b`, 'i');
    if (regex.test(formattedAddress)) {
      return t;
    }
  }

  // Check village names in formatted address
  for (const [village, parentTown] of Object.entries(VILLAGE_TO_TOWN)) {
    if (normalizeStr(formattedAddress).includes(village)) {
      return townsData.find(t => t.town.toLowerCase() === parentTown.toLowerCase()) || null;
    }
  }

  return null;
}

// Distance calculation in meters
function computeHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
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

// 1. Config endpoint
app.get('/api/config', (req, res) => {
  const secretKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
  res.json({
    hasServerKey: Boolean(secretKey && secretKey.trim().length > 0),
    serverKey: secretKey ? secretKey.trim() : '',
  });
});

// 2. Towns dataset endpoint
app.get('/api/towns', (req, res) => {
  res.json(townsData);
});

// 3. Geocode endpoint (proxies to Google Maps Geocoding API)
app.post('/api/geocode', async (req, res) => {
  try {
    const { address, clientApiKey } = req.body;
    if (!address || typeof address !== 'string' || !address.trim()) {
      return res.status(400).json({ error: 'Please enter a Rhode Island address.' });
    }

    const apiKey = (process.env.GOOGLE_MAPS_API_KEY || clientApiKey || '').trim();
    if (!apiKey) {
      return res.status(401).json({
        error: 'No Google Maps API key provided. Please configure GOOGLE_MAPS_API_KEY in Secrets or enter your key.',
        needsKey: true,
      });
    }

    // Append Rhode Island if not specified to prioritize RI results
    let searchAddress = address.trim();
    if (!/(\bRI\b|Rhode Island)/i.test(searchAddress)) {
      searchAddress += ', Rhode Island';
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      searchAddress
    )}&components=country:US|administrative_area:RI&key=${apiKey}`;

    const resp = await fetch(geocodeUrl);
    const data = await resp.json();

    if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
      return res.status(400).json({
        error: data.error_message || `Geocoding request failed: ${data.status}`,
        status: data.status,
      });
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      return res.status(429).json({
        error: 'Google Maps API quota exceeded. Please check your billing or API key.',
        status: data.status,
      });
    }

    if (!data.results || data.results.length === 0) {
      return res.status(404).json({
        error: `Could not find location for "${address}". Please verify the street address or town name.`,
      });
    }

    const result = data.results[0];
    const location = result.geometry.location; // { lat, lng }
    const formattedAddress = result.formatted_address;
    const components = result.address_components || [];

    // Identify town
    const matchedTown = matchRhodeIslandTown(components, formattedAddress);

    res.json({
      location: { lat: location.lat, lng: location.lng },
      formattedAddress,
      matchedTown,
      rawComponents: components,
    });
  } catch (err: any) {
    console.error('Geocode error:', err);
    res.status(500).json({ error: err.message || 'Internal server error while geocoding.' });
  }
});

export interface AmenityItem {
  id: string;
  name: string;
  category: 'bus_stop' | 'school' | 'grocery' | 'park';
  categoryLabel: string;
  address: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  walkingMinutes: number;
}

// 4. Nearby amenities endpoint (within 800m)
app.post('/api/places-nearby', async (req, res) => {
  try {
    const { lat, lng, clientApiKey } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Missing coordinates (lat, lng).' });
    }

    const apiKey = (process.env.GOOGLE_MAPS_API_KEY || clientApiKey || '').trim();
    if (!apiKey) {
      return res.status(401).json({ error: 'No Google Maps API key provided.', needsKey: true });
    }

    const amenities: AmenityItem[] = [];

    // Search categories: bus stops, schools, grocery stores, parks
    const categoriesConfig = [
      {
        category: 'bus_stop' as const,
        label: 'Bus Stop / Transit',
        newTypes: ['transit_station', 'bus_stop', 'bus_station'],
        legacyType: 'transit_station',
        keyword: 'RIPTA bus stop',
      },
      {
        category: 'school' as const,
        label: 'School',
        newTypes: ['school', 'primary_school', 'secondary_school'],
        legacyType: 'school',
        keyword: 'school',
      },
      {
        category: 'grocery' as const,
        label: 'Grocery Store / Market',
        newTypes: ['grocery_store', 'supermarket'],
        legacyType: 'supermarket',
        keyword: 'grocery store supermarket',
      },
      {
        category: 'park' as const,
        label: 'Park & Recreation',
        newTypes: ['park', 'playground'],
        legacyType: 'park',
        keyword: 'park',
      },
    ];

    // Helper using Places API (New) searchNearby
    async function searchPlacesNew(catConfig: typeof categoriesConfig[0]): Promise<AmenityItem[]> {
      const url = 'https://places.googleapis.com/v1/places:searchNearby';
      const body = {
        includedTypes: catConfig.newTypes,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 800.0,
          },
        },
        maxResultCount: 10,
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        throw new Error(`Places New API failed with status ${resp.status}`);
      }

      const data = await resp.json();
      const items: AmenityItem[] = [];
      if (data.places && Array.isArray(data.places)) {
        for (const p of data.places) {
          const pLat = p.location?.latitude;
          const pLng = p.location?.longitude;
          if (pLat != null && pLng != null) {
            const dist = computeHaversineMeters(lat, lng, pLat, pLng);
            if (dist <= 850) {
              items.push({
                id: p.id || `${catConfig.category}-${pLat}-${pLng}`,
                name: p.displayName?.text || catConfig.label,
                category: catConfig.category,
                categoryLabel: catConfig.label,
                address: p.formattedAddress || '',
                lat: pLat,
                lng: pLng,
                distanceMeters: dist,
                walkingMinutes: Math.max(1, Math.round(dist / 80)),
              });
            }
          }
        }
      }
      return items;
    }

    // Fallback helper using legacy Nearby Search if Places API (New) is not active
    async function searchPlacesLegacy(catConfig: typeof categoriesConfig[0]): Promise<AmenityItem[]> {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=800&type=${catConfig.legacyType}&keyword=${encodeURIComponent(
        catConfig.keyword
      )}&key=${apiKey}`;

      const resp = await fetch(url);
      const data = await resp.json();
      const items: AmenityItem[] = [];
      if (data.results && Array.isArray(data.results)) {
        for (const r of data.results.slice(0, 10)) {
          const rLat = r.geometry?.location?.lat;
          const rLng = r.geometry?.location?.lng;
          if (rLat != null && rLng != null) {
            const dist = computeHaversineMeters(lat, lng, rLat, rLng);
            if (dist <= 850) {
              items.push({
                id: r.place_id || `${catConfig.category}-${rLat}-${rLng}`,
                name: r.name || catConfig.label,
                category: catConfig.category,
                categoryLabel: catConfig.label,
                address: r.vicinity || '',
                lat: rLat,
                lng: rLng,
                distanceMeters: dist,
                walkingMinutes: Math.max(1, Math.round(dist / 80)),
              });
            }
          }
        }
      }
      return items;
    }

    for (const cat of categoriesConfig) {
      try {
        const catItems = await searchPlacesNew(cat);
        amenities.push(...catItems);
      } catch (errNew) {
        // Fallback to legacy nearby search
        try {
          const fallbackItems = await searchPlacesLegacy(cat);
          amenities.push(...fallbackItems);
        } catch (errLegacy) {
          console.warn(`Failed search for ${cat.category}:`, errLegacy);
        }
      }
    }

    // Sort by walking distance
    amenities.sort((a, b) => a.distanceMeters - b.distanceMeters);

    // Grouping count summary
    const summary = {
      total: amenities.length,
      busStops: amenities.filter(a => a.category === 'bus_stop').length,
      schools: amenities.filter(a => a.category === 'school').length,
      groceryStores: amenities.filter(a => a.category === 'grocery').length,
      parks: amenities.filter(a => a.category === 'park').length,
    };

    res.json({
      amenities,
      summary,
    });
  } catch (err: any) {
    console.error('Places nearby error:', err);
    res.status(500).json({ error: err.message || 'Error searching nearby amenities.' });
  }
});

// 5. Gemini Plain-English Summary Endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { address, town, zoningUrl, whereZoningSits, amenities } = req.body;

    if (!address || !town) {
      return res.status(400).json({ error: 'Missing site address or town name.' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in environment or Secrets.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const amenityListText =
      Array.isArray(amenities) && amenities.length > 0
        ? amenities
            .map(
              (a: any) =>
                `- ${a.name} (${a.categoryLabel}): ~${a.distanceMeters}m (${a.walkingMinutes} min walk)`
            )
            .join('\n')
        : 'No major transit stops, schools, grocery stores, or parks were identified within a half-mile (~800m) walking radius.';

    const systemInstruction = `You are a Rhode Island housing development advisor assisting a non-profit or affordable housing practitioner (not a software developer, but a housing sponsor evaluating land for residential development).
Your job is to provide a concise, plain-English summary of the site in exactly 5 to 8 sentences.
Do NOT use bullet points or markdown headers. Provide continuous, readable prose in a single paragraph.

You must cover:
1. What is nearby (bus stops, schools, grocery stores, parks, and overall walkability / transit access).
2. What specific elements to check in the town's zoning ordinance (mention the town name "${town}", their zoning code link, and specific regulations like permitted residential uses, density limits, parking minimums, setbacks, or Rhode Island Comprehensive Permit / Low and Moderate Income Housing Act provisions).
3. Critical questions to ask the town planning or zoning board (such as municipal water/sewer connections, dimensional relief or density bonuses, and local approval timelines).
4. You MUST end your response with this EXACT closing sentence as the final sentence:
"This is a starting point, not a zoning determination. Check with the town."`;

    const userPrompt = `Site Address: ${address}
Rhode Island Town/Municipality: ${town}
Zoning Ordinance Link: ${zoningUrl || 'See local town ordinances'}
Where Zoning Sits in Code: ${whereZoningSits || 'Zoning Code chapter'}
Nearby amenities found within 800m walk:
${amenityListText}

Write the plain-English summary in exactly 5 to 8 sentences for a housing developer, ending with:
"This is a starting point, not a zoning determination. Check with the town."`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    let rawText = response.text ? response.text.trim() : '';

    // Guarantee the exact required ending sentence
    const MANDATORY_ENDING = 'This is a starting point, not a zoning determination. Check with the town.';
    if (!rawText.endsWith(MANDATORY_ENDING)) {
      // Remove any trailing variations if present
      rawText = rawText.replace(/This is a starting point.*$/i, '').trim();
      rawText = rawText.replace(/\.\s*$/, '');
      rawText = `${rawText}. ${MANDATORY_ENDING}`;
    }

    res.json({
      summary: rawText,
    });
  } catch (err: any) {
    console.error('Gemini summary error:', err);
    res.status(500).json({ error: err.message || 'Error generating site summary with Gemini.' });
  }
});

// Vite Middleware or Static file serving
async function setupApp() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Site Explorer server listening on http://localhost:${port}`);
  });
}

setupApp().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
