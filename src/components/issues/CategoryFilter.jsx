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
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
              isActive
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200/90'
            }`}
          >
            <span>{cat}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-white text-slate-600 border border-slate-200/80'
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
