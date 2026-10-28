import { ShieldCheck, HardDrive, Sparkles } from 'lucide-react';

export default function Footer({ onOpenDataModal, onStartTour }) {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
          </div>
          <p className="text-slate-600">
            <span className="font-semibold text-slate-900">CivicTrack</span> — New Town, Kolkata Civic Reporting & Accountability Platform
          </p>
        </div>

        <div className="flex items-center gap-4 text-slate-500 text-xs">
          {onOpenDataModal && (
            <button
              type="button"
              onClick={onOpenDataModal}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>Storage & Backup</span>
            </button>
          )}
          {onStartTour && (
            <button
              type="button"
              onClick={onStartTour}
              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Demo Tour</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          Independent civic technology demonstration • Action Area I, II & III
        </p>
      </div>
    </footer>
  );
}

