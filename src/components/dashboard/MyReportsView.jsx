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

  return (
    <div className="space-y-6 animate-in fade-in py-2 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track the status, repair progress, and verification of civic reports you have submitted in New Town.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReportModal}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Report a Problem</span>
        </button>
      </div>

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
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center max-w-md mx-auto space-y-3">
          <p className="text-sm text-slate-600">
            {myIssues.length === 0
              ? "You haven't reported any issues yet."
              : `No reports currently match "${filterStatus}".`}
          </p>
          <button
            type="button"
            onClick={myIssues.length === 0 ? onOpenReportModal : () => setFilterStatus('All')}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
          >
            {myIssues.length === 0 ? 'Report an Issue' : 'Show All My Reports'}
          </button>
        </div>
      )}
    </div>
  );
}
