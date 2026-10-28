import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  isStorageAvailable,
  getStorageMetadata,
  exportIssuesAsJSON,
  validateAndParseBackupJSON,
  formatByteSize,
  STORAGE_DISCLAIMER,
} from '../../utils/storageUtils';

export default function DataManagementModal({
  isOpen,
  onClose,
  issues,
  onRestore,
  onRestoreIssues,
  onResetToDefaults,
  lastSavedAt,
}) {
  const handleRestoreCallback = onRestoreIssues || onRestore;
  const closeButtonRef = useRef(null);
  const fileInputRef = useRef(null);

  // States
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'backup' | 'restore' | 'reset'
  const [restoreFile, setRestoreFile] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);
  const [restoreError, setRestoreError] = useState(null);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null);

  // Derived metadata from localStorage
  const storageAvailable = isOpen ? isStorageAvailable() : true;
  const meta = isOpen ? getStorageMetadata() : { itemCount: 0, sizeBytes: 0, lastSavedAt: null };

  const handleClose = useCallback(() => {
    setRestoreFile(null);
    setRestorePreview(null);
    setRestoreError(null);
    setResetConfirmText('');
    setActionFeedback(null);
    onClose();
  }, [onClose]);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  // Handle Export
  const handleExport = () => {
    const success = exportIssuesAsJSON(issues);
    if (success) {
      setActionFeedback({
        type: 'success',
        text: `Exported ${issues.length} tickets to JSON backup successfully.`,
      });
    } else {
      setActionFeedback({
        type: 'error',
        text: 'Failed to generate backup JSON file.',
      });
    }
  };

  // Handle File Selection for Restore
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setRestoreError(null);

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const content = loadEvt.target.result;
      const result = validateAndParseBackupJSON(content);
      if (result.valid) {
        setRestorePreview(result);
        setRestoreError(null);
      } else {
        setRestorePreview(null);
        setRestoreError(result.error);
      }
    };
    reader.onerror = () => {
      setRestoreError('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  // Confirm Restore
  const handleConfirmRestore = () => {
    if (!restorePreview || !restorePreview.issues) return;

    if (handleRestoreCallback) {
      handleRestoreCallback(restorePreview.issues);
      setActionFeedback({
        type: 'success',
        text: `Restored ${restorePreview.count} issues from backup into browser memory and local storage.`,
      });
      setRestoreFile(null);
      setRestorePreview(null);
    }
  };

  // Confirm Reset
  const handleConfirmReset = () => {
    if (resetConfirmText.trim().toLowerCase() !== 'reset') {
      setActionFeedback({
        type: 'error',
        text: 'Please type "RESET" into the confirmation field to proceed.',
      });
      return;
    }

    if (onResetToDefaults) {
      onResetToDefaults();
      setActionFeedback({
        type: 'info',
        text: 'Local storage wiped. CivicTrack restored to initial default campus mock records.',
      });
      setResetConfirmText('');
    }
  };

  const formattedSaveTime = lastSavedAt
    ? new Date(lastSavedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : meta.lastSavedAt
    ? new Date(meta.lastSavedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : 'Not yet saved (Default initial state)';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-mgmt-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-xl w-full max-h-[90vh] flex flex-col text-left overflow-hidden z-10">
        {/* Sticky Header Bar */}
        <div className="shrink-0 bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <Database className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="data-mgmt-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Local Data & Persistence Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Client-side localStorage controls, JSON export, and prototype reset.
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            aria-label="Close data management modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 border-b ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : actionFeedback.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-sky-50 text-sky-900 border-sky-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : actionFeedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-sky-600 shrink-0" />
              )}
              <span>{actionFeedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs inside modal */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/70 px-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-950 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Status & Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 px-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-950 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Export Backup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`py-2.5 px-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'restore'
                ? 'border-emerald-600 text-emerald-950 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Restore Backup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`py-2.5 px-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reset'
                ? 'border-rose-600 text-rose-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-rose-700'
            }`}
          >
            Reset Prototype
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* TAB 1: OVERVIEW & STATUS */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Active Persistence Indicator */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  storageAvailable
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                {storageAvailable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {storageAvailable ? 'Browser Persistence Active' : 'Storage Unavailable'}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        storageAvailable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {storageAvailable ? 'localStorage Connected' : 'In-Memory Only'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-700">
                    {storageAvailable
                      ? 'Demo reports, work order dispatches, verification logs, endorsements, and SLA timestamps are automatically serialized to this browser’s localStorage on change.'
                      : 'Private browsing or strict storage isolation has disabled localStorage. Your changes will remain active in memory until the tab is closed.'}
                  </p>
                </div>
              </div>

              {/* Core Storage Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Saved Issues Count
                  </span>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {issues.length} Tickets
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Central reactive store
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Last Successful Save
                  </span>
                  <div className="text-xs font-bold text-slate-800 mt-1 font-mono">
                    {formattedSaveTime}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Approx Payload: {formatByteSize(meta.sizeBytes || JSON.stringify(issues).length)}
                  </span>
                </div>
              </div>

              {/* Photo Policy Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <HardDrive className="w-4 h-4 text-emerald-700" />
                  <span>Photo Attachment Storage Policy</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  To protect the browser from quota exhaustion (typically ~5MB limit per origin), newly attached base64 images remain immediately viewable <strong>during the active session</strong>. Upon page refresh, report metadata, technician logs, and audit entries survive, while high-resolution image binaries are omitted to conserve storage.
                </p>
              </div>

              {/* Transparency & Scope Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Privacy & Storage Scope</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {STORAGE_DISCLAIMER} CivicTrack does not store passwords, user credentials, or sensitive personal data. This client-side prototype is not connected to a remote cloud database or multi-user server.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: EXPORT BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Export Prototype Data to JSON</span>
                </h3>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Download a complete portable snapshot of your current session tickets, including all newly filed issues, verified work orders, citizen challenges, and SLA calculation timestamps.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON Backup ({issues.length} Tickets)</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500 space-y-1">
                <span className="font-semibold text-slate-700 block">Backup Contents:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  <li>{issues.length} Maintenance Issue records and full attributes</li>
                  <li>Technician repair evidence and resolution notes</li>
                  <li>Citizen challenges and verification outcomes</li>
                  <li>All machine-readable reportedAt, dueAt, and verifiedAt timestamps</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: RESTORE BACKUP */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>Restore from JSON Backup</span>
                </h3>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Select a previously exported <code>.json</code> backup file to replace the current in-memory tickets with your saved dataset.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="backup-file-upload"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{restoreFile ? 'Choose Different File' : 'Browse JSON File...'}</span>
                  </button>
                  {restoreFile && (
                    <span className="text-slate-600 font-mono text-[11px] truncate max-w-xs">
                      {restoreFile.name}
                    </span>
                  )}
                </div>

                {restoreError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2 text-[11px]">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Invalid Backup File:</strong>
                      <span>{restoreError}</span>
                    </div>
                  </div>
                )}

                {restorePreview && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-xs text-emerald-900">
                        <FileCheck className="w-4 h-4 text-emerald-700" />
                        Valid Backup Validated
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                        {restorePreview.count} Issues Found
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Restoring this file will overwrite your active tickets with the {restorePreview.count} tickets from this backup.
                    </p>
                    <button
                      type="button"
                      onClick={handleConfirmRestore}
                      className="w-full sm:w-auto px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Confirm & Restore {restorePreview.count} Issues
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RESET TO DEFAULTS */}
          {activeTab === 'reset' && (
            <div className="space-y-4">
              <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Reset to Original Campus Dataset</span>
                </div>
                <p className="text-rose-950/90 leading-relaxed text-[11px]">
                  <strong>Warning:</strong> This irreversible action clears all user-submitted tickets, timeline updates, staff work orders, and citizen challenge records from this browser&apos;s localStorage, returning CivicTrack to the initial 7 demo issues.
                </p>

                <div className="bg-white p-3 rounded-lg border border-rose-200 space-y-2">
                  <label htmlFor="confirm-reset-input" className="block font-semibold text-slate-800 text-xs">
                    Type <code className="bg-slate-100 text-rose-700 px-1 py-0.5 rounded font-mono font-bold">RESET</code> below to confirm:
                  </label>
                  <input
                    id="confirm-reset-input"
                    type="text"
                    placeholder="Type RESET"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    disabled={resetConfirmText.trim().toLowerCase() !== 'reset'}
                    className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      resetConfirmText.trim().toLowerCase() === 'reset'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Irreversible Reset</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 bg-slate-50/80 border-t border-slate-200/80 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">
            Client-Side Storage &bull; No Remote Server Sync
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
