import React from 'react';
import {
  Bus,
  GraduationCap,
  ShoppingCart,
  Trees,
  Navigation,
  Footprints,
} from 'lucide-react';
import { AmenityItem, AmenityCategory } from '../types';

interface AmenitiesListProps {
  amenities: AmenityItem[];
  selectedCategory: AmenityCategory | 'all';
  onSelectCategory: (category: AmenityCategory | 'all') => void;
}

export const AmenitiesList: React.FC<AmenitiesListProps> = ({
  amenities,
  selectedCategory,
  onSelectCategory,
}) => {
  const filtered =
    selectedCategory === 'all'
      ? amenities
      : amenities.filter((a) => a.category === selectedCategory);

  const getCategoryDetails = (category: AmenityCategory) => {
    switch (category) {
      case 'bus_stop':
        return {
          icon: <Bus className="w-5 h-5 text-amber-700" />,
          bg: 'bg-amber-100 text-amber-900',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          label: 'Bus Stop',
        };
      case 'school':
        return {
          icon: <GraduationCap className="w-5 h-5 text-blue-700" />,
          bg: 'bg-blue-100 text-blue-900',
          badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
          label: 'School',
        };
      case 'grocery':
        return {
          icon: <ShoppingCart className="w-5 h-5 text-emerald-700" />,
          bg: 'bg-emerald-100 text-emerald-900',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: 'Grocery Store',
        };
      case 'park':
        return {
          icon: <Trees className="w-5 h-5 text-teal-700" />,
          bg: 'bg-teal-100 text-teal-900',
          badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
          label: 'Park',
        };
    }
  };

  const busCount = amenities.filter((a) => a.category === 'bus_stop').length;
  const schoolCount = amenities.filter((a) => a.category === 'school').length;
  const groceryCount = amenities.filter((a) => a.category === 'grocery').length;
  const parkCount = amenities.filter((a) => a.category === 'park').length;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Footprints className="w-6 h-6 text-blue-600" />
            Nearby Amenities (Within ~800m Walk)
          </h3>
          <p className="text-base text-slate-500 mt-1">
            Essential transit, educational, retail, and open space facilities within a half-mile radius.
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full">
            {amenities.length} total found
          </span>
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 rounded-xl text-base font-semibold transition-colors ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Amenities ({amenities.length})
        </button>
        <button
          onClick={() => onSelectCategory('bus_stop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold transition-colors ${
            selectedCategory === 'bus_stop'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Bus className="w-4 h-4" />
          Bus Stops ({busCount})
        </button>
        <button
          onClick={() => onSelectCategory('school')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold transition-colors ${
            selectedCategory === 'school'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Schools ({schoolCount})
        </button>
        <button
          onClick={() => onSelectCategory('grocery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold transition-colors ${
            selectedCategory === 'grocery'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Grocery Stores ({groceryCount})
        </button>
        <button
          onClick={() => onSelectCategory('park')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold transition-colors ${
            selectedCategory === 'park'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200'
          }`}
        >
          <Trees className="w-4 h-4" />
          Parks ({parkCount})
        </button>
      </div>

      {/* Amenities Short List */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
            <p className="text-lg font-medium text-slate-600">
              No amenities found for this category within ~800 meters.
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Try switching category or verifying rural walkability context with the town.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const details = getCategoryDetails(item.category);
            return (
              <div
                key={item.id}
                className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 ${details.bg}`}>
                    {details.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-slate-900">{item.name}</h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${details.badgeBg}`}
                      >
                        {details.label}
                      </span>
                    </div>
                    {item.address && (
                      <p className="text-sm text-slate-500 mt-0.5">{item.address}</p>
                    )}
                  </div>
                </div>

                {/* Walking Distance Tag */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1.5 justify-end text-base font-bold text-slate-900">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span>{item.distanceMeters} m</span>
                  </div>
                  <span className="inline-block mt-0.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    ~{item.walkingMinutes} min walk
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
