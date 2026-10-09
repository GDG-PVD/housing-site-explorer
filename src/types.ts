export interface TownInfo {
  town: string;
  zoningUrl: string;
  platform: string;
  whereZoningSits: string;
}

export type AmenityCategory = 'bus_stop' | 'school' | 'grocery' | 'park';

export interface AmenityItem {
  id: string;
  name: string;
  category: AmenityCategory;
  categoryLabel: string;
  address: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  walkingMinutes: number;
}

export interface GeocodeData {
  location: {
    lat: number;
    lng: number;
  };
  formattedAddress: string;
  matchedTown: TownInfo | null;
  rawComponents?: any[];
}

export interface NearbySummary {
  total: number;
  busStops: number;
  schools: number;
  groceryStores: number;
  parks: number;
}
