// Match a geocoded address to one of Rhode Island's 39 municipalities.
//
// Only the parts of an address that name a place are used: the locality,
// county subdivision and neighborhood components, and as a last resort the
// city segment of the formatted address (the one just before "RI 02xxx").
// Street names are never matched, so "Warwick Ave, Cranston" is Cranston,
// not Warwick, and "Hope St, Providence" is Providence, not Scituate.

export interface TownInfo {
  town: string;
  zoningUrl: string;
  platform: string;
  whereZoningSits: string;
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// Known village/neighborhood to Rhode Island town mappings
export const VILLAGE_TO_TOWN: Record<string, string> = {
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

export function normalizeStr(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// The city segment of "500 Warwick Ave, Cranston, RI 02910, USA" is
// "Cranston": the comma-separated part right before the state segment.
export function citySegment(formattedAddress: string): string | null {
  const parts = formattedAddress.split(',').map(p => p.trim());
  const stateIdx = parts.findIndex(p => /^(RI|Rhode Island)\b/i.test(p));
  if (stateIdx < 1) return null;
  return parts[stateIdx - 1];
}

export function isInRhodeIsland(
  components: AddressComponent[] = [],
  formattedAddress = ''
): boolean {
  const state = components.find(c =>
    c.types.includes('administrative_area_level_1')
  );
  if (state) return state.short_name === 'RI';
  return citySegment(formattedAddress) !== null;
}

export function matchRhodeIslandTown(
  townsData: TownInfo[],
  components: AddressComponent[] = [],
  formattedAddress = ''
): TownInfo | null {
  if (!isInRhodeIsland(components, formattedAddress)) return null;

  const byName = new Map<string, TownInfo>();
  for (const t of townsData) byName.set(normalizeStr(t.town), t);

  const lookup = (name: string): TownInfo | null => {
    const norm = normalizeStr(name.replace(/^(Town of|City of)\s+/i, ''));
    if (byName.has(norm)) return byName.get(norm)!;
    const parent = VILLAGE_TO_TOWN[norm];
    return parent ? byName.get(normalizeStr(parent)) || null : null;
  };

  // Place-name components, most specific municipal level first
  const placeTypes = [
    'locality',
    'administrative_area_level_3',
    'postal_town',
    'sublocality',
    'sublocality_level_1',
    'neighborhood',
  ];
  for (const type of placeTypes) {
    const comp = components.find(c => c.types.includes(type));
    if (comp) {
      const found = lookup(comp.long_name);
      if (found) return found;
    }
  }

  // Last resort: the city segment of the formatted address, never the street
  const city = citySegment(formattedAddress);
  return city ? lookup(city) : null;
}
