import { useRef, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Clock,
  HardDrive,
  Users,
  Compass,
  ArrowRight,
  X,
} from 'lucide-react';

export default function TourCompletionModal({
  isOpen,
  onClose,
  onRestartTour,
}) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (closeBtnRef.current) {
      closeBtnRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const innovations = [
    {
      title: 'Two-Stage Issue Lifecycle',
      subtitle: 'Propose Resolution vs Independent Verification',
      description: 'Physical plant technicians submit resolution proposals with work notes and after-photos, but cannot self-close tickets. Only independent verification finalizes closure.',
      icon: ShieldCheck,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Citizen Challenges & Re-work Loop',
      subtitle: 'Student Oversight on Inadequate Fixes',
      description: 'Citizens can contest superficial or recurring repairs with structured challenge categories, preventing premature closure and enforcing contractor rework.',
      icon: Users,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      title: 'Real-Time Deduplication & Endorsements',
      subtitle: 'Noise Reduction & Community Prioritization',
      description: 'Keyword and building matching alerts students to existing complaints before filing. Upvoting consolidates maintenance demand into a single accountable ticket.',
      icon: Compass,
      color: 'text-sky-700 bg-sky-50 border-sky-200',
    },
    {
      title: 'Dynamic SLA Target Deadlines',
      subtitle: 'Priority-Based Operational Governance',
      description: 'Simulated 24-hour, 72-hour, and 7-day deadlines with dynamic countdowns, overdue tracking, and verified median resolution time analytics.',
      icon: Clock,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      title: 'Zero-Backend Local Durability',
      subtitle: 'Client-Side Hardened localStorage & JSON Backups',
      description: 'Fully offline-capable prototype that survives browser reloads, sanitizes base64 payloads to respect storage limits, and supports portable JSON backups.',
      icon: HardDrive,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-complete-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-2xl w-full max-h-[92vh] flex flex-col text-left overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="shrink-0 bg-[#07251f] border-b border-[#0f3d33] text-white px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#103e34] border border-emerald-500/40 text-emerald-300 shrink-0 shadow-xs">
              <Sparkles className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#103e34] text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Presentation Walkthrough Complete</span>
              </div>
              <h2 id="tour-complete-title" className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                CivicTrack Platform Overview
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
                Demonstration Prototype • New Town, Kolkata Civic Issue & Accountability Platform
              </p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Close presentation summary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Executive Summary Paragraph */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              CivicTrack bridges the gap between municipal maintenance operations and citizen trust by replacing opaque complaints with an open, accountable civic technology platform. Rather than treating reporting as an untracked ticket drop, CivicTrack introduces peer verification, public timelines, and community endorsement across New Town, Kolkata.
            </p>
          </div>

          {/* Innovations Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              Core Architectural Innovations Demonstrated
            </h3>
            <div className="space-y-3">
              {innovations.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-colors flex items-start gap-3.5 shadow-2xs"
                  >
                    <div className={`p-2 rounded-lg border shrink-0 ${item.color}`}>
                      <IconComponent className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {item.subtitle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prototype Notice */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed">
            <p>
              <strong>Demonstration Prototype Note:</strong> This application is a fully functioning frontend prototype developed for New Town, Kolkata. All data persists strictly in browser localStorage on this device and can be reset or backed up as JSON at any time.
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="shrink-0 bg-slate-50/80 border-t border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onRestartTour}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restart Presentation Tour</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>Explore CivicTrack Freely</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
