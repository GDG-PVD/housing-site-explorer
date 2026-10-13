/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Building,
  Key,
  Shield,
  AlertCircle,
  Loader2,
  Navigation,
  Compass,
  FileText,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { TownInfo, AmenityItem, AmenityCategory, GeocodeData, NearbySummary } from './types';
import { KeyModal } from './components/KeyModal';
import { SiteMap } from './components/SiteMap';
import { ZoningCard } from './components/ZoningCard';
import { AmenitiesList } from './components/AmenitiesList';
import { GeminiSummary } from './components/GeminiSummary';

export default function App() {
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [isServerKey, setIsServerKey] = useState<boolean>(false);
  const [isKeyChecked, setIsKeyChecked] = useState<boolean>(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [pasteBoxKey, setPasteBoxKey] = useState<string>('');

  // Towns database
  const [allTowns, setAllTowns] = useState<TownInfo[]>([]);

  // Search input state
  const [inputAddress, setInputAddress] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStep, setSearchStep] = useState<string>('');
  const [searchError, setSearchError] = useState<string | null>(null);

  // Results State
  const [activeAddress, setActiveAddress] = useState<string>('');
  const [siteLocation, setSiteLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentTown, setCurrentTown] = useState<TownInfo | null>(null);
  const [amenities, setAmenities] = useState<AmenityItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AmenityCategory | 'all'>('all');

  // Gemini Summary State
  const [geminiSummary, setGeminiSummary] = useState<string>('');
  const [isGeminiLoading, setIsGeminiLoading] = useState<boolean>(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Maps Quota / Auth state
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);
  const [authFailed, setAuthFailed] = useState<boolean>(false);

  // Check server secret and localStorage on initial load
  useEffect(() => {
    async function initConfig() {
      try {
        // 1. Fetch server config to check GOOGLE_MAPS_API_KEY from Secrets
        const res = await fetch('/api/config');
        const data = await res.json();

        // 2. Load towns data
        const townsRes = await fetch('/api/towns');
        const townsList = await townsRes.json();
        setAllTowns(townsList);

        if (data.hasServerKey && data.serverKey) {
          setApiKey(data.serverKey);
          setIsServerKey(true);
        } else {
          // Check browser localStorage
          const localKey = localStorage.getItem('google_maps_api_key');
          if (localKey && localKey.trim()) {
            setApiKey(localKey.trim());
            setIsServerKey(false);
          }
        }
      } catch (err) {
        console.error('Config fetch failed:', err);
        const localKey = localStorage.getItem('google_maps_api_key');
        if (localKey && localKey.trim()) {
          setApiKey(localKey.trim());
        }
      } finally {
        setIsKeyChecked(true);
      }
    }

    initConfig();

    // Listen to quota or auth failures
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    const handleAuthFailure = () => setAuthFailed(true);

    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    window.addEventListener('gmp-auth-failure', handleAuthFailure);

    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
      window.removeEventListener('gmp-auth-failure', handleAuthFailure);
    };
  }, []);

  // Save key handler
  const handleSaveKey = (newKey: string) => {
    if (newKey) {
      localStorage.setItem('google_maps_api_key', newKey);
      setApiKey(newKey);
      setIsServerKey(false);
      setAuthFailed(false);
      setQuotaExceeded(false);
    } else {
      localStorage.removeItem('google_maps_api_key');
      setApiKey('');
      setIsServerKey(false);
    }
  };

  // Paste box submit on first load
  const handlePasteBoxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pasteBoxKey.trim();
    if (!trimmed) return;
    handleSaveKey(trimmed);
  };

  // Exploration main workflow
  const handleExploreSite = async (targetAddressOverride?: string) => {
    const addressToQuery = (targetAddressOverride || inputAddress).trim();
    if (!addressToQuery) {
      setSearchError('Please enter a Rhode Island street address.');
      return;
    }

    if (!apiKey) {
      setSearchError('Google Maps API key is required to explore sites.');
      setIsKeyModalOpen(true);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchStep('1. Geocoding address with Google Maps...');

    try {
      // Step 1: Geocode address
      const geocodeRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: addressToQuery,
          clientApiKey: apiKey,
        }),
      });

      const geocodeData = await geocodeRes.json();
      if (!geocodeRes.ok) {
        throw new Error(geocodeData.error || 'Failed to geocode address.');
      }

      const { location, formattedAddress, matchedTown } = geocodeData;
      setSiteLocation(location);
      setActiveAddress(formattedAddress);
      setCurrentTown(matchedTown || null);

      // Step 2: Search nearby amenities (within 800m)
      setSearchStep('2. Searching nearby bus stops, schools, grocery stores & parks (within 800m)...');
      const placesRes = await fetch('/api/places-nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          clientApiKey: apiKey,
        }),
      });

      const placesData = await placesRes.json();
      const loadedAmenities: AmenityItem[] = placesData.amenities || [];
      setAmenities(loadedAmenities);

      // Step 3: Trigger Gemini plain-English summary
      setSearchStep('3. Generating plain-English developer summary with Gemini...');
      generateGeminiSummary({
        address: formattedAddress,
        town: matchedTown?.town || 'Rhode Island municipality',
        zoningUrl: matchedTown?.zoningUrl || '',
        whereZoningSits: matchedTown?.whereZoningSits || '',
        amenities: loadedAmenities,
      });
    } catch (err: any) {
      console.error('Exploration error:', err);
      setSearchError(err.message || 'An error occurred while exploring the site.');
    } finally {
      setIsSearching(false);
      setSearchStep('');
    }
  };

  // Helper to call Gemini summary API
  const generateGeminiSummary = async (siteContext: {
    address: string;
    town: string;
    zoningUrl: string;
    whereZoningSits: string;
    amenities: AmenityItem[];
  }) => {
    setIsGeminiLoading(true);
    setGeminiError(null);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteContext),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate developer summary with Gemini.');
      }

      setGeminiSummary(data.summary || '');
    } catch (err: any) {
      console.error('Gemini error:', err);
      setGeminiError(err.message || 'Failed to generate Gemini summary.');
    } finally {
      setIsGeminiLoading(false);
    }
  };

  // Regenerate summary button
  const handleRegenerate = () => {
    if (!activeAddress || !currentTown) return;
    generateGeminiSummary({
      address: activeAddress,
      town: currentTown.town,
      zoningUrl: currentTown.zoningUrl,
      whereZoningSits: currentTown.whereZoningSits,
      amenities,
    });
  };

  // Sample Rhode Island addresses for quick testing
  const sampleAddresses = [
    '111 Westminster St, Providence, RI',
    '1445 Main St, West Warwick, RI',
    '3139 Post Rd, Warwick, RI',
    '580 Broad St, Central Falls, RI',
    '105 Franklin St, Westerly, RI',
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      {/* Quota Exceeded Sticky Warning Banner (as mandated by Google Maps guidelines) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 text-base text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions, or{' '}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="underline font-bold text-blue-800 hover:text-blue-950"
            >
              Change key
            </button>
            .
          </span>
        </div>
      )}

      {/* Auth Failed Banner */}
      {authFailed && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-900 px-4 py-3 text-base text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>
            Google Maps API authorization failure (invalid or restricted key).{' '}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="underline font-bold text-rose-950 hover:text-rose-800 ml-1"
            >
              Paste / Change your key
            </button>
          </span>
        </div>
      )}

      {/* Single-Column Container (Large text, laptop optimized) */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 space-y-8">
        {/* Header Bar */}
        <header className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-700 text-white rounded-xl shadow-sm">
                <Compass className="w-6 h-6" />
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Site Explorer
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-slate-600 font-medium">
              Rhode Island housing site evaluator for practitioners
            </p>
          </div>

          {/* Key Status & Change Link */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            {apiKey ? (
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-sm shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-slate-600 font-medium">
                  {isServerKey ? 'Secret Key Active' : 'Custom Key Active'}
                </span>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(true)}
                  className="font-bold text-blue-700 hover:text-blue-900 hover:underline transition-colors cursor-pointer"
                >
                  Change key
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3.5 py-2 rounded-xl border border-blue-200 text-sm font-bold hover:bg-blue-100 transition-colors"
              >
                <Key className="w-4 h-4" />
                <span>Configure Key</span>
              </button>
            )}
          </div>
        </header>

        {/* First load: If no key is configured from Secret or localStorage */}
        {isKeyChecked && !apiKey ? (
          <section className="bg-white border-2 border-blue-200 rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-blue-100 text-blue-800 rounded-2xl shrink-0 mt-1">
                <Key className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Paste your Google Maps API key
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Site Explorer requires a Google Maps API key to geocode Rhode Island addresses, render maps, and locate nearby transit, schools, grocery stores, and parks.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasteBoxSubmit} className="space-y-4 pt-2">
              <div>
                <label htmlFor="first-load-key" className="block text-lg font-semibold text-slate-800 mb-2">
                  Google Maps API Key
                </label>
                <input
                  id="first-load-key"
                  type="text"
                  value={pasteBoxKey}
                  onChange={(e) => setPasteBoxKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-5 py-4 text-lg font-mono text-slate-900 bg-slate-50 rounded-2xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
                  autoFocus
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <p className="text-sm text-slate-500">
                  This key will be saved safely in your browser’s local storage. You can also configure <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800 font-semibold">GOOGLE_MAPS_API_KEY</code> in Settings &gt; Secrets.
                </p>
                <button
                  type="submit"
                  disabled={!pasteBoxKey.trim()}
                  className="px-8 py-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-lg font-bold rounded-2xl shadow-md transition-all shrink-0 cursor-pointer"
                >
                  Save &amp; Start Exploring
                </button>
              </div>
            </form>
          </section>
        ) : (
          /* Main Search & Exploration View */
          <div className="space-y-8">
            {/* 1. Address Box & Explore Button */}
            <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <label htmlFor="address-input" className="block text-xl font-bold text-slate-900">
                Rhode Island Site Address
              </label>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExploreSite();
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-6 h-6 text-slate-500" />
                  </div>
                  <input
                    id="address-input"
                    type="text"
                    value={inputAddress}
                    onChange={(e) => {
                      setInputAddress(e.target.value);
                      if (searchError) setSearchError(null);
                    }}
                    placeholder="e.g. 111 Westminster St, Providence, RI"
                    className="w-full pl-13 pr-4 py-4 text-xl text-slate-900 bg-slate-50 hover:bg-slate-50/80 focus:bg-white rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearching || !inputAddress.trim()}
                  className="px-8 py-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xl font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 shrink-0 cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Exploring...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-6 h-6" />
                      <span>Explore this site</span>
                    </>
                  )}
                </button>
              </form>

              {/* Sample Addresses */}
              <div className="pt-2">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                  Sample Rhode Island Sites:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleAddresses.map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setInputAddress(sample);
                        handleExploreSite(sample);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress message during exploration */}
              {isSearching && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-900 font-semibold text-base animate-pulse">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span>{searchStep || 'Gathering site data...'}</span>
                </div>
              )}

              {/* Error Alert */}
              {searchError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 text-base">
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Unable to explore site</p>
                    <p className="text-rose-800 mt-0.5">{searchError}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Results Section */}
            {siteLocation && (
              <div className="space-y-8 animate-fadeIn">
                {/* Active Site Title Banner */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 bg-red-100 text-red-700 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Active Site Selected
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        {activeAddress}
                      </h2>
                    </div>
                  </div>
                  {currentTown && (
                    <div className="self-start sm:self-center bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl text-blue-900 text-base font-bold">
                      {currentTown.town}, RI
                    </div>
                  )}
                </div>

                {/* 2. Interactive Google Map with Markers */}
                <SiteMap
                  apiKey={apiKey}
                  siteLocation={siteLocation}
                  siteAddress={activeAddress}
                  amenities={amenities}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />

                {/* 4. Town Zoning Ordinance Card */}
                <ZoningCard
                  town={currentTown}
                  allTowns={allTowns}
                  onSelectTown={(t) => setCurrentTown(t)}
                />

                {/* 3. Nearby Amenities Short List */}
                <AmenitiesList
                  amenities={amenities}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />

                {/* 5. Gemini Plain-English Summary for Housing Developer */}
                <GeminiSummary
                  summary={geminiSummary}
                  isLoading={isGeminiLoading}
                  error={geminiError}
                  onRegenerate={handleRegenerate}
                />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-200 text-slate-500 text-sm text-center space-y-2">
          <p className="font-medium">
            Site Explorer for Rhode Island Housing Practitioners • Built for laptop screens &amp; field review
          </p>
          <p className="text-xs text-slate-400">
            Covers all 39 Rhode Island municipalities. Data sources: Google Maps Platform &amp; Municipal Code Repositories.
          </p>
        </footer>
      </main>

      {/* Key Modal */}
      <KeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentKey={apiKey}
        isServerKey={isServerKey}
        onSaveKey={handleSaveKey}
      />
    </div>
  );
}
