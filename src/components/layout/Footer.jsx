export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <p className="text-slate-600">
          <span className="font-semibold text-slate-800">CivicTrack</span> — New Town, Kolkata Civic Reporting & Accountability Platform
        </p>
        <p className="text-[11px] text-slate-400">
          Independent civic demonstration • Illustrative schematics • Browser-local persistence
        </p>
      </div>
    </footer>
  );
}
