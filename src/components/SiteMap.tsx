import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Bus,
  GraduationCap,
  ShoppingCart,
  Trees,
  Home,
  Navigation,
  Layers,
  MapPin,
} from 'lucide-react';
import { AmenityItem, AmenityCategory } from '../types';

interface SiteMapProps {
  apiKey: string;
  siteLocation: { lat: number; lng: number };
  siteAddress: string;
  amenities: AmenityItem[];
  selectedCategory: AmenityCategory | 'all';
  onSelectCategory: (category: AmenityCategory | 'all') => void;
}

// Controller component to smoothly center/fit map bounds
const MapRecenter: React.FC<{
  center: { lat: number; lng: number };
  amenities: AmenityItem[];
}> = ({ center, amenities }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.setCenter(center);
    map.setZoom(15);
  }, [map, center.lat, center.lng]);

  return null;
};

export const SiteMap: React.FC<SiteMapProps> = ({
  apiKey,
  siteLocation,
  siteAddress,
  amenities,
  selectedCategory,
  onSelectCategory,
}) => {
  const [selectedAmenity, setSelectedAmenity] = useState<AmenityItem | null>(null);
  const [showSiteInfo, setShowSiteInfo] = useState<boolean>(false);

  // Filter amenities
  const filteredAmenities =
    selectedCategory === 'all'
      ? amenities
      : amenities.filter((a) => a.category === selectedCategory);

  const getCategoryIcon = (category: AmenityCategory) => {
    switch (category) {
      case 'bus_stop':
        return <Bus className="w-4 h-4 text-white" />;
      case 'school':
        return <GraduationCap className="w-4 h-4 text-white" />;
      case 'grocery':
        return <ShoppingCart className="w-4 h-4 text-white" />;
      case 'park':
        return <Trees className="w-4 h-4 text-white" />;
    }
  };

  const getCategoryBg = (category: AmenityCategory) => {
    switch (category) {
      case 'bus_stop':
        return 'bg-amber-600 border-amber-800 text-white';
      case 'school':
        return 'bg-blue-600 border-blue-800 text-white';
      case 'grocery':
        return 'bg-emerald-600 border-emerald-800 text-white';
      case 'park':
        return 'bg-teal-600 border-teal-800 text-white';
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Map Header & Filter Chips */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-slate-700" />
          <span className="font-semibold text-slate-900 text-lg">Site Map & 800m Radius</span>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            All ({amenities.length})
          </button>
          <button
            onClick={() => onSelectCategory('bus_stop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === 'bus_stop'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            Bus Stops ({amenities.filter((a) => a.category === 'bus_stop').length})
          </button>
          <button
            onClick={() => onSelectCategory('school')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === 'school'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Schools ({amenities.filter((a) => a.category === 'school').length})
          </button>
          <button
            onClick={() => onSelectCategory('grocery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === 'grocery'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Grocery ({amenities.filter((a) => a.category === 'grocery').length})
          </button>
          <button
            onClick={() => onSelectCategory('park')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === 'park'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-teal-800 hover:bg-teal-50 border border-teal-200'
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            Parks ({amenities.filter((a) => a.category === 'park').length})
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[460px] sm:h-[520px] bg-slate-100">
        <APIProvider apiKey={apiKey} libraries={['marker', 'places']}>
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={siteLocation}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            className="w-full h-full"
          >
            <MapRecenter center={siteLocation} amenities={filteredAmenities} />

            {/* Target Site Marker */}
            <AdvancedMarker
              position={siteLocation}
              title={`Site: ${siteAddress}`}
              onClick={() => {
                setShowSiteInfo(true);
                setSelectedAmenity(null);
              }}
            >
              <div className="relative flex flex-col items-center cursor-pointer group">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-700 text-white text-xs font-bold rounded-full shadow-lg border-2 border-white mb-1 whitespace-nowrap animate-bounce">
                  <Home className="w-3.5 h-3.5" />
                  <span>Target Site</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
              </div>
            </AdvancedMarker>

            {/* Site InfoWindow */}
            {showSiteInfo && (
              <InfoWindow
                position={siteLocation}
                onCloseClick={() => setShowSiteInfo(false)}
              >
                <div className="p-2 max-w-xs text-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 uppercase tracking-wide">
                    <Home className="w-3.5 h-3.5" />
                    Target Site
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{siteAddress}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Coordinates: {siteLocation.lat.toFixed(5)}, {siteLocation.lng.toFixed(5)}
                  </p>
                  <p className="text-xs font-medium text-slate-600 mt-2 bg-slate-100 p-1.5 rounded">
                    Searching within ~800 meters (~0.5 mile / 10-minute walk)
                  </p>
                </div>
              </InfoWindow>
            )}

            {/* Amenity Markers */}
            {filteredAmenities.map((amenity) => (
              <AdvancedMarker
                key={amenity.id}
                position={{ lat: amenity.lat, lng: amenity.lng }}
                title={`${amenity.name} (${amenity.distanceMeters}m)`}
                onClick={() => {
                  setSelectedAmenity(amenity);
                  setShowSiteInfo(false);
                }}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform ${getCategoryBg(
                    amenity.category
                  )}`}
                >
                  {getCategoryIcon(amenity.category)}
                </div>
              </AdvancedMarker>
            ))}

            {/* Amenity InfoWindow */}
            {selectedAmenity && (
              <InfoWindow
                position={{ lat: selectedAmenity.lat, lng: selectedAmenity.lng }}
                onCloseClick={() => setSelectedAmenity(null)}
              >
                <div className="p-2 max-w-xs text-slate-800">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${getCategoryBg(
                      selectedAmenity.category
                    )}`}
                  >
                    {selectedAmenity.categoryLabel}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{selectedAmenity.name}</h4>
                  {selectedAmenity.address && (
                    <p className="text-xs text-slate-500 mt-0.5">{selectedAmenity.address}</p>
                  )}
                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      {selectedAmenity.distanceMeters} meters away
                    </span>
                    <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                      ~{selectedAmenity.walkingMinutes} min walk
                    </span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Floating Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-md flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>Site</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <div className="w-3 h-3 rounded-full bg-amber-600"></div>
            <span>Bus</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>School</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
            <span>Grocery</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <div className="w-3 h-3 rounded-full bg-teal-600"></div>
            <span>Park</span>
          </div>
        </div>
      </div>
    </div>
  );
};
