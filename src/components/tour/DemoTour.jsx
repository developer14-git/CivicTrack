import { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Minimize2,
  Maximize2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { TOUR_STEPS } from '../../data/tourSteps';

export default function DemoTour({
  isActive,
  currentStep = 0,
  onStepChange,
  onExit,
  onComplete,
  onTriggerStepAction,
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  const totalSteps = TOUR_STEPS.length;
  const step = TOUR_STEPS[currentStep] || TOUR_STEPS[0];
  const StepIcon = step.icon;

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(e) {
      // Don't trigger if user is actively typing in an input or textarea
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentStep < totalSteps - 1) {
          onStepChange(currentStep + 1);
        } else {
          onComplete();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStep > 0) {
          onStepChange(currentStep - 1);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep, totalSteps, onStepChange, onComplete, onExit]);

  if (!isActive) return null;

  // Minimized Floating Pill View
  if (isMinimized) {
    return (
      <aside
        className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
        aria-label="Minimized Demo Tour Controls"
      >
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 rounded-full px-4 py-2.5 shadow-2xl flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
            <span className="font-semibold text-slate-200">
              Tour Step {step.number}/{totalSteps}:
            </span>
            <span className="text-slate-300 hidden sm:inline max-w-[200px] truncate">
              {step.tag}
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2.5">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              title="Expand tour dock"
              aria-label="Expand tour dock"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onExit}
              className="p-1 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded-md transition-colors"
              title="Exit presentation tour"
              aria-label="Exit presentation tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Full Expanded Tour Dock
  return (
    <aside
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-xl sm:w-full z-50 animate-in fade-in slide-in-from-bottom-4 duration-200"
      aria-label="Guided Presentation Tour Dock"
    >
      <div className="bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-300/90 text-slate-800 overflow-hidden flex flex-col ring-1 ring-slate-900/5">
        {/* Progress Bar Line */}
        <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
          />
        </div>

        {/* Top Header Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0">
              <Sparkles className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>Step {step.number} of {totalSteps}</span>
            </span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider truncate">
              {step.tag}
            </span>
          </div>

          {/* Minimize & Close Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
              title="Minimize tour dock to view underlying interface"
              aria-label="Minimize tour dock"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onExit}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              title="Exit presentation tour (Esc)"
              aria-label="Exit presentation tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tour Step Body */}
        <div className="p-4 sm:p-5 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {/* Title Row */}
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl border shrink-0 ${step.iconColor}`}>
              <StepIcon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                {step.description}
              </p>
            </div>
          </div>

          {/* Key Insights Bullets */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Demonstration Highlights
            </span>
            {step.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{insight}</span>
              </div>
            ))}
          </div>

          {/* Contextual Action Button (Jump to target view/state) */}
          {step.actionText && (
            <div className="pt-1 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onTriggerStepAction?.(step.actionKey)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                <span>{step.actionText}</span>
              </button>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Click to highlight or open view
              </span>
            </div>
          )}
        </div>

        {/* Bottom Navigation Toolbar */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              currentStep === 0
                ? 'text-slate-300 bg-slate-100 cursor-not-allowed border border-transparent'
                : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs'
            }`}
            aria-label="Previous step"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Step Dots Indicator */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Tour steps">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={idx === currentStep}
                aria-label={`Jump to step ${idx + 1}: ${s.tag}`}
                onClick={() => onStepChange(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
                  idx === currentStep
                    ? 'w-5 bg-emerald-600 ring-2 ring-emerald-200'
                    : idx < currentStep
                    ? 'bg-emerald-400 hover:bg-emerald-500'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          {/* Next / Finish Button */}
          <div className="flex items-center gap-2">
            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={() => onStepChange(currentStep + 1)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
                aria-label="Next step"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onComplete}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
                aria-label="Finish presentation tour"
              >
                <span>Finish</span>
                <Sparkles className="w-4 h-4 text-emerald-200" />
              </button>
            )}
          </div>
        </div>

        {/* Keyboard shortcut hint footer */}
        <div className="px-4 py-1.5 bg-slate-100/90 text-center text-[10px] text-slate-400 border-t border-slate-200/50 hidden sm:block">
          Navigate with keyboard: <kbd className="px-1 py-0.5 bg-white border rounded text-[9px] text-slate-600">← Prev</kbd> <kbd className="px-1 py-0.5 bg-white border rounded text-[9px] text-slate-600">Next →</kbd> <kbd className="px-1 py-0.5 bg-white border rounded text-[9px] text-slate-600">Esc Exit</kbd>
        </div>
      </div>
    </aside>
  );
}
