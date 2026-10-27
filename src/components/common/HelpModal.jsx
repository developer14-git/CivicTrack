import { useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
  AlertTriangle,
  MapPin,
  Layers,
} from 'lucide-react';
import { CATEGORIES } from '../../data/mockIssues';

export default function HelpModal({ isOpen, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col text-left overflow-hidden z-10">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-emerald-200" aria-hidden="true" />
            </div>
            <div>
              <h2 id="help-modal-title" className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                About New Town CivicTrack
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Community civic issue reporting, tracking, and accountability platform.
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            aria-label="Close help modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Mission */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3.5 space-y-1">
            <h3 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Civic Mission for New Town, Kolkata</span>
            </h3>
            <p className="text-slate-700 text-xs">
              CivicTrack empowers residents, students, workers, and visitors across New Town (Action Areas I, II, and III) to report public maintenance issues, monitor repair timelines, and verify completed resolutions transparently.
            </p>
          </div>

          {/* 8 Supported Categories */}
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Supported Civic Problem Categories</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <div key={cat} className="flex items-start gap-1.5 bg-slate-50 border border-slate-200/80 rounded p-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span className="font-medium text-slate-800">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Lifecycle & Independent Verification</span>
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
              <li>
                <strong className="text-slate-800">1. Report or Endorse:</strong> Submit an issue with landmark details and optional photo, or endorse an existing report to avoid duplicates.
              </li>
              <li>
                <strong className="text-slate-800">2. Dispatch & Work:</strong> Technicians begin field repairs (moving from Open to In Progress).
              </li>
              <li>
                <strong className="text-slate-800">3. Resolution Submitted:</strong> Crews submit work notes and after-photos. The report is <em>not</em> closed yet.
              </li>
              <li>
                <strong className="text-slate-800">4. Independent Verification:</strong> Local residents or auditors inspect the fix before marking it independently Verified Resolved.
              </li>
            </ol>
          </div>

          {/* Location & Geographic Map */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Interactive Geographic Issue Map</span>
            </h3>
            <p className="text-slate-600">
              The embedded map provides an interactive geographic view with OpenStreetMap tiles across Action Areas I, II, and III. Markers show damage reports with status pin colors, clustering, and honest location precision.
            </p>
          </div>

          {/* Honest Operating Model Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 space-y-1">
            <h3 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Operating Model & Demonstration Notice</span>
            </h3>
            <p className="text-[11px] text-amber-900 leading-normal">
              CivicTrack is an independent civic technology prototype with browser-local persistence and simulated community personas. It is not an official municipal portal or directly integrated with the New Town Kolkata Development Authority (NKDA) or WBHIDCO. SLA deadlines are illustrative demo benchmarks.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded transition-colors"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );
}
