import { useState, useMemo } from 'react';
import {
  Search,
  X,
} from 'lucide-react';
import IssueCard from './IssueCard';
import CategoryFilter from './CategoryFilter';
import { CATEGORIES, STATUSES } from '../../data/mockIssues';

const PRIORITY_WEIGHTS = { High: 3, Medium: 2, Low: 1 };

export default function IssueBrowser({
  issues,
  onOpenIssueDetail,
  onToggleSupport,
  onOpenReportModal,
  selectedStatus = 'All Statuses',
  onSelectStatus,
  currentTime,
  isStaffMode = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [localStatus, setLocalStatus] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('newest');

  const currentStatus = onSelectStatus ? selectedStatus : localStatus;
  const handleStatusChange = (val) => {
    if (onSelectStatus) {
      onSelectStatus(val);
    } else {
      setLocalStatus(val);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts = { All: issues.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = issues.filter((i) => i.category === cat).length;
      }
    });
    return counts;
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = issue.title.toLowerCase().includes(q);
          const matchDesc = (issue.description || '').toLowerCase().includes(q);
          const matchLoc = (issue.location || '').toLowerCase().includes(q);
          const matchArea = (issue.area || '').toLowerCase().includes(q);
          const matchNeighbourhood = (issue.neighbourhood || '').toLowerCase().includes(q);
          const matchId = issue.id.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchLoc && !matchArea && !matchNeighbourhood && !matchId) {
            return false;
          }
        }

        if (selectedCategory !== 'All' && issue.category !== selectedCategory) {
          return false;
        }

        if (selectedArea !== 'All Areas') {
          if (issue.area && issue.area !== selectedArea) {
            return false;
          }
          if (!issue.area && issue.location && !issue.location.toLowerCase().includes(selectedArea.toLowerCase())) {
            return false;
          }
        }

        if (currentStatus !== 'All Statuses') {
          if (currentStatus === 'Awaiting Verification' || currentStatus === 'Resolution Submitted') {
            if (issue.status !== 'Resolution Submitted' && issue.status !== 'Awaiting Verification') {
              return false;
            }
          } else if (issue.status !== currentStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
        }
        if (sortBy === 'supporters') {
          return (b.supporters || 0) - (a.supporters || 0);
        }
        if (sortBy === 'priority') {
          return (PRIORITY_WEIGHTS[b.priority] || 0) - (PRIORITY_WEIGHTS[a.priority] || 0);
        }
        if (sortBy === 'deadline') {
          const timeA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
          const timeB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
          return timeA - timeB;
        }
        return 0;
      });
  }, [issues, searchQuery, selectedCategory, selectedArea, currentStatus, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedArea('All Areas');
    handleStatusChange('All Statuses');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6 animate-in fade-in py-2 text-left">
      {/* Title & Filter Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Browse Civic Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Explore public grievances, follow repairs, and track accountability across New Town, Kolkata.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenReportModal}
            className="self-start sm:self-auto px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            + Report a Problem
          </button>
        </div>

        {/* Search, Area, Status, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by title, landmark, sector, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-200/90 bg-slate-50/60 hover:bg-white focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              aria-label="Search civic reports"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Area Selector */}
          <div className="lg:col-span-3">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-200/90 bg-slate-50/60 hover:bg-white focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer transition-colors"
              aria-label="Filter by New Town Area"
            >
              <option value="All Areas">All Action Areas</option>
              <option value="Action Area I">Action Area I (Nazrul Tirtha, CE/CB)</option>
              <option value="Action Area II">Action Area II (Biswa Bangla, Eco Park)</option>
              <option value="Action Area III">Action Area III (Tata Medical, Sukhobrishti)</option>
              <option value="Major Arterial Road & Perimeter">Major Arterial Road & Perimeter</option>
            </select>
          </div>

          {/* Status Select */}
          <div className="lg:col-span-3">
            <select
              value={currentStatus === 'Resolution Submitted' ? 'Awaiting Verification' : currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-200/90 bg-slate-50/60 hover:bg-white focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer transition-colors"
              aria-label="Filter by Status"
            >
              {STATUSES.map((status) => {
                const label = status === 'Resolution Submitted' ? 'Awaiting Verification' : status;
                return (
                  <option key={status} value={status}>
                    {status === 'All Statuses' ? 'All Statuses' : label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort Select */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-200/90 bg-slate-50/60 hover:bg-white focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer transition-colors"
              aria-label="Sort reports"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="supporters">Sort: Endorsed</option>
              <option value="priority">Sort: Priority</option>
              <option value="deadline">Sort: Target SLA</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="pt-2 border-t border-slate-100">
          <CategoryFilter
            categories={CATEGORIES}
            activeCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Results Count & Clear */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-900 font-bold">{filteredIssues.length}</strong> of{' '}
            {issues.length} reports
          </span>
          {(searchQuery || selectedCategory !== 'All' || selectedArea !== 'All Areas' || currentStatus !== 'All Statuses') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer transition-colors"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Grid of Clean Issue Cards */}
      {filteredIssues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => onOpenIssueDetail(issue.id)}
              onSupport={onToggleSupport}
              currentTime={currentTime}
              isStaffMode={isStaffMode}
            />
          ))}
        </div>
      ) : (
        /* Simple Empty State with 1 sentence & 1 action */
        <div className="bg-white border border-slate-200/90 rounded-xl p-10 text-center max-w-md mx-auto space-y-3 shadow-2xs">
          <p className="text-sm text-slate-600">
            No issues match your current search and filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
