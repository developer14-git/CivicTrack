export default function CategoryFilter({
  categories,
  activeCategory,
  onSelectCategory,
  categoryCounts = {},
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Issue category filter">
      {categories.map((cat) => {
        const isActive = cat === activeCategory;
        const count = categoryCounts[cat];

        return (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectCategory(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer ${
              isActive
                ? 'bg-[#07251f] text-white border-[#0f3d33] shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-slate-200/90'
            }`}
          >
            <span>{cat}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-emerald-400 text-teal-950'
                    : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
