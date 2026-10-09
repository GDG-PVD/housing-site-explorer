import React, { useState } from 'react';
import { BookOpen, ExternalLink, ChevronDown, Check, Building2, Landmark, FileText } from 'lucide-react';
import { TownInfo } from '../types';

interface ZoningCardProps {
  town: TownInfo | null;
  allTowns: TownInfo[];
  onSelectTown: (town: TownInfo) => void;
}

export const ZoningCard: React.FC<ZoningCardProps> = ({
  town,
  allTowns,
  onSelectTown,
}) => {
  const [isChangingTown, setIsChangingTown] = useState(false);

  if (!town) {
    return (
      <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 shadow-sm">
        <div className="flex items-start gap-3">
          <Landmark className="w-6 h-6 text-amber-700 shrink-0 mt-1" />
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-amber-950">Town Zoning Ordinance</h3>
            <p className="text-base text-amber-800">
              Could not automatically determine the Rhode Island town for this address. Select your town from the list below to access its zoning ordinance:
            </p>
            <div className="relative inline-block w-full max-w-md">
              <select
                onChange={(e) => {
                  const found = allTowns.find((t) => t.town === e.target.value);
                  if (found) onSelectTown(found);
                }}
                className="w-full px-4 py-3 bg-white text-base font-semibold border border-amber-300 rounded-xl text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a Rhode Island Town (39 municipalities)...
                </option>
                {allTowns.map((t) => (
                  <option key={t.town} value={t.town}>
                    {t.town}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Rhode Island Municipality
            </span>
            <h3 className="text-2xl font-bold text-slate-900">{town.town}, RI</h3>
          </div>
        </div>

        {/* Change town selector toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsChangingTown(!isChangingTown)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
          >
            <span>Change town</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {isChangingTown && (
            <div className="absolute right-0 mt-2 w-64 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-20 p-2">
              <p className="text-xs font-semibold text-slate-400 px-3 py-1.5 uppercase">
                All 39 RI Municipalities
              </p>
              {allTowns.map((t) => (
                <button
                  key={t.town}
                  type="button"
                  onClick={() => {
                    onSelectTown(t);
                    setIsChangingTown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                    t.town === town.town
                      ? 'bg-blue-50 font-bold text-blue-700'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{t.town}</span>
                  {t.town === town.town && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ordinance Details & Link */}
      <div className="mt-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
              Where Zoning Sits in Code
            </span>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {town.whereZoningSits && town.whereZoningSits.trim().length > 0
                ? town.whereZoningSits
                : 'Zoning Ordinance section'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
              Codification Platform
            </span>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {town.platform || 'Town Code Website'}
            </p>
          </div>
        </div>

        {/* Primary Link Button */}
        <div className="pt-2">
          <a
            href={town.zoningUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-between w-full px-6 py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-lg shadow-sm hover:shadow transition-all group"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-200 group-hover:text-white transition-colors" />
              <span>Open {town.town} Zoning Ordinance</span>
            </div>
            <div className="flex items-center gap-1.5 text-base font-semibold text-blue-100 group-hover:text-white">
              <span>View Code</span>
              <ExternalLink className="w-5 h-5" />
            </div>
          </a>
          <p className="text-sm text-slate-500 mt-2 pl-1">
            Official municipal code for {town.town}. Check permitted residential uses, dimensional standards, setbacks, parking requirements, and Rhode Island comprehensive permit regulations.
          </p>
        </div>
      </div>
    </div>
  );
};
