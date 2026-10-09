import React, { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';

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

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const MANDATORY_ENDING = 'This is a starting point, not a zoning determination. Check with the town.';

  // Separate body text and the mandatory ending if present for visual distinction
  let bodyText = summary;
  let hasMandatoryEnding = false;

  if (summary.includes(MANDATORY_ENDING)) {
    hasMandatoryEnding = true;
    bodyText = summary.replace(MANDATORY_ENDING, '').trim();
  }

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
          <div className="space-y-5">
            <p className="text-xl text-slate-800 leading-relaxed font-normal">
              {bodyText}
            </p>

            {/* Mandatory ending sentence */}
            <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-base font-bold text-amber-950">
                {MANDATORY_ENDING}
              </p>
            </div>
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
