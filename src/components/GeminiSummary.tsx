import React, { useEffect, useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, AlertCircle, ShieldAlert, Languages } from 'lucide-react';

// Rhode Island's most common home languages after English. Add more here.
const LANGUAGES = [
  { code: 'en', label: 'English', name: 'English' },
  { code: 'es', label: 'Español', name: 'Spanish' },
  { code: 'pt', label: 'Português', name: 'Portuguese' },
  { code: 'kea', label: 'Kriolu', name: 'Cape Verdean Creole (Kriolu)' },
  { code: 'ht', label: 'Kreyòl ayisyen', name: 'Haitian Creole' },
  { code: 'km', label: 'ខ្មែរ', name: 'Khmer' },
  { code: 'zh', label: '中文', name: 'Simplified Chinese' },
  { code: 'vi', label: 'Tiếng Việt', name: 'Vietnamese' },
  { code: 'fr', label: 'Français', name: 'French' },
  { code: 'ar', label: 'العربية', name: 'Arabic', rtl: true },
];

interface Translation {
  text: string;
  disclaimer: string;
}

interface GeminiSummaryProps {
  summary: string;
  isLoading: boolean;
  error?: string | null;
  onRegenerate: () => void;
}

export const GeminiSummary: React.FC<GeminiSummaryProps> = ({
  summary,
  isLoading,
  error,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState<Record<string, Translation>>({});
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  // A new summary makes old translations stale.
  useEffect(() => {
    setTranslations({});
    setLanguage('en');
    setTranslateError(null);
  }, [summary]);

  const MANDATORY_ENDING = 'This is a starting point, not a zoning determination. Check with the town.';

  // Separate body text and the mandatory ending if present for visual distinction
  let bodyText = summary;
  let hasMandatoryEnding = false;

  if (summary.includes(MANDATORY_ENDING)) {
    hasMandatoryEnding = true;
    bodyText = summary.replace(MANDATORY_ENDING, '').trim();
  }

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const translated = language === 'en' ? null : translations[language];
  const shownBody = translated ? translated.text : bodyText;
  const shownEnding = translated?.disclaimer || MANDATORY_ENDING;

  const handleLanguage = async (code: string) => {
    setLanguage(code);
    setTranslateError(null);
    if (code === 'en' || translations[code]) return;
    const target = LANGUAGES.find((l) => l.code === code);
    if (!target) return;
    setTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bodyText, disclaimer: MANDATORY_ENDING, language: target.code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Translation failed.');
      setTranslations((prev) => ({ ...prev, [code]: data }));
    } catch (err: any) {
      setTranslateError(err.message || 'Translation failed.');
      setLanguage('en');
    } finally {
      setTranslating(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(translated ? `${shownBody} ${shownEnding}` : summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-gradient-to-b from-blue-50/60 to-white border border-blue-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Plain-English Housing Developer Summary
            </h3>
            <p className="text-base text-slate-600">
              Synthesized site guidance, ordinance focus areas & municipal questions
            </p>
          </div>
        </div>

        {summary && !isLoading && (
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-xl shadow-sm text-sm font-semibold text-slate-700">
              <Languages className="w-4 h-4 text-slate-600" />
              <span className="sr-only">Summary language</span>
              <select
                value={language}
                onChange={(e) => handleLanguage(e.target.value)}
                disabled={translating}
                className="bg-transparent focus:outline-none cursor-pointer"
                aria-label="Summary language"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-semibold text-sm shadow-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
            <button
              onClick={onRegenerate}
              title="Regenerate summary"
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl transition-colors shadow-sm"
              aria-label="Regenerate summary"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-4 py-3">
            <div className="flex items-center gap-3 text-blue-700 font-semibold text-lg animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Analyzing site amenities and municipal zoning ordinance with Gemini...</span>
            </div>
            <div className="space-y-2.5 animate-pulse">
              <div className="h-5 bg-blue-100/70 rounded-md w-full"></div>
              <div className="h-5 bg-blue-100/70 rounded-md w-11/12"></div>
              <div className="h-5 bg-blue-100/70 rounded-md w-full"></div>
              <div className="h-5 bg-blue-100/70 rounded-md w-10/12"></div>
              <div className="h-5 bg-blue-100/70 rounded-md w-4/5"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-lg">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Could not generate summary</span>
            </div>
            <p className="text-base text-rose-800">{error}</p>
            <button
              onClick={onRegenerate}
              className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : summary ? (
          <div className="space-y-5" lang={current.code} dir={translated && current.rtl ? 'rtl' : 'ltr'}>
            {translating && (
              <div className="flex items-center gap-2 text-blue-700 font-semibold animate-pulse" dir="ltr">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Translating into {current.name}...</span>
              </div>
            )}
            {translateError && (
              <p className="text-base text-rose-700" dir="ltr">{translateError}</p>
            )}
            <p className="text-xl text-slate-800 leading-relaxed font-normal">
              {shownBody}
            </p>

            {/* Mandatory ending sentence */}
            <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-base font-bold text-amber-950">{shownEnding}</p>
                {translated && (
                  <p className="text-sm text-amber-900 mt-1" lang="en" dir="ltr">
                    {MANDATORY_ENDING}
                  </p>
                )}
              </div>
            </div>
            {translated && (
              <p className="text-sm text-slate-500 italic" dir="ltr">
                Machine translation by Gemini. Have a fluent speaker check it before you share it.
              </p>
            )}
          </div>
        ) : (
          <p className="text-lg text-slate-500 italic">
            Enter an address and click "Explore this site" to view the summary.
          </p>
        )}
      </div>
    </div>
  );
};
