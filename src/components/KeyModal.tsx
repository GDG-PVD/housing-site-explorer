import React, { useState } from 'react';
import { Key, ShieldCheck, ExternalLink, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface KeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  isServerKey: boolean;
  onSaveKey: (newKey: string) => void;
}

export const KeyModal: React.FC<KeyModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  isServerKey,
  onSaveKey,
}) => {
  const [inputKey, setInputKey] = useState(isServerKey ? '' : currentKey);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setError('Please paste a valid Google Maps API key.');
      return;
    }
    setError(null);
    onSaveKey(trimmed);
    onClose();
  };

  const handleClear = () => {
    onSaveKey('');
    setInputKey('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Google Maps API Key</h2>
              <p className="text-sm text-slate-500">Configure key for geocoding & map tiles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {isServerKey ? (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-base">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-950">App Secret Connected</p>
                <p className="text-sm text-emerald-800 mt-1">
                  Using <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">GOOGLE_MAPS_API_KEY</code> from AI Studio Secrets. You can override it below with a custom key if needed.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-base text-slate-600 space-y-2">
              <p>
                Site Explorer uses Google Maps Platform to geocode Rhode Island addresses, display interactive maps, and calculate walking distances to nearby bus stops, schools, grocery stores, and parks.
              </p>
              <p className="text-sm text-slate-500">
                Your key is stored safely in your browser’s local storage and is never written to public source code.
              </p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="maps-key-input" className="block text-base font-semibold text-slate-800 mb-2">
                Paste Google Maps API Key
              </label>
              <input
                id="maps-key-input"
                type="text"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 text-base font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm text-slate-900"
                autoFocus
              />
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-rose-600 mt-2 font-medium">
                  <AlertCircle className="w-4 h-4" /> {error}
                </p>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-medium text-slate-700">Required Google Cloud APIs on this key:</p>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li>Maps JavaScript API</li>
                <li>Geocoding API</li>
                <li>Places API (New)</li>
              </ul>
              <a
                href="https://console.cloud.google.com/google/maps-apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-700 font-semibold hover:underline mt-1 pt-1"
              >
                Open Google Cloud Console <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex items-center justify-between pt-2">
              {!isServerKey && currentKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2.5 text-sm font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  Clear Key
                </button>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-base font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-colors"
                >
                  Save Key
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
