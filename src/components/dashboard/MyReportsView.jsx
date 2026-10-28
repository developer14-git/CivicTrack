import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import IssueCard from '../issues/IssueCard';

export default function MyReportsView({
  myIssues = [],
  onOpenIssueDetail,
  onToggleSupport,
  onOpenReportModal,
  currentTime,
  isStaffMode = false,
}) {
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredMyIssues = useMemo(() => {
    if (filterStatus === 'All') return myIssues;
    if (filterStatus === 'Awaiting Verification' || filterStatus === 'Resolution Submitted') {
      return myIssues.filter(
        (i) => i.status === 'Resolution Submitted' || i.status === 'Awaiting Verification'
      );
    }
    return myIssues.filter((i) => i.status === filterStatus);
  }, [myIssues, filterStatus]);

  const statusFilters = [
    { id: 'All', label: 'All' },
    { id: 'Open', label: 'Open' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'Awaiting Verification', label: 'Awaiting Verification' },
    { id: 'Resolved', label: 'Resolved' },
  ];

  // Compute quick personal status counts
  const personalCounts = useMemo(() => {
    return {
      total: myIssues.length,
      open: myIssues.filter((i) => i.status === 'Open').length,
      inProgress: myIssues.filter((i) => i.status === 'In Progress').length,
      submitted: myIssues.filter(
        (i) => i.status === 'Resolution Submitted' || i.status === 'Awaiting Verification'
      ).length,
      resolved: myIssues.filter((i) => i.status === 'Resolved').length,
    };
  }, [myIssues]);

  return (
    <div className="space-y-6 animate-in fade-in py-2 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            My Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track the status, repair progress, and verification of civic reports you have submitted in New Town.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReportModal}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Report a Problem</span>
        </button>
      </div>

      {/* Personal Summary Stats */}
      {myIssues.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              My Total Reports
            </span>
            <div className="text-2xl font-extrabold text-slate-900 leading-none">{personalCounts.total}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
              In Review / Open
            </span>
            <div className="text-2xl font-extrabold text-slate-900 leading-none">{personalCounts.open + personalCounts.inProgress}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block mb-1">
              Awaiting Verification
            </span>
            <div className="text-2xl font-extrabold text-slate-900 leading-none">{personalCounts.submitted}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
              Verified Resolved
            </span>
            <div className="text-2xl font-extrabold text-emerald-700 leading-none">{personalCounts.resolved}</div>
          </div>
        </div>
      )}

      {/* Clean Status Filter Tabs */}
      {myIssues.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {statusFilters.map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-[#07251f] text-white border-[#0f3d33] shadow-xs'
                    : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Issue Cards Grid or Clean Empty State */}
      {filteredMyIssues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMyIssues.map((issue) => (
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
        <div className="bg-white border border-slate-200/90 rounded-xl p-10 text-center max-w-md mx-auto space-y-3 shadow-2xs">
          <p className="text-sm text-slate-600">
            {myIssues.length === 0
              ? "You haven't reported any issues yet."
              : `No reports currently match "${filterStatus}".`}
          </p>
          <button
            type="button"
            onClick={myIssues.length === 0 ? onOpenReportModal : () => setFilterStatus('All')}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
          >
            {myIssues.length === 0 ? 'Report an Issue' : 'Show All My Reports'}
          </button>
        </div>
      )}
    </div>
  );
}
