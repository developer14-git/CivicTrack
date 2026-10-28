import { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  ThumbsUp,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Camera,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import {
  SIMULATED_STAFF_USER,
  CHALLENGE_REASONS,
  REJECTION_REASONS,
} from '../../data/mockIssues';
import { formatDueDate, formatTimeRemaining } from '../../utils/slaUtils';

export default function IssueDetailModal({
  issue,
  onClose,
  onToggleSupport,
  isStaffMode = false,
  currentTime,
  onStartWork,
  onSubmitResolution,
  onVerifyResolution,
  onRejectResolution,
  onChallengeIssue,
  onReopenChallengedIssue,
}) {
  const closeButtonRef = useRef(null);

  // Form states for Staff resolution submission
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [techName] = useState(SIMULATED_STAFF_USER.name);
  const [actionTaken, setActionTaken] = useState('');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState(null);
  const [inspectionNote, setInspectionNote] = useState('');
  const [resolutionError, setResolutionError] = useState(null);

  // Form states for Verifier approval / rejection
  const [verifierNote, setVerifierNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectionError, setRejectionError] = useState(null);

  // Form states for Citizen Challenge
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeReason, setChallengeReason] = useState(CHALLENGE_REASONS[0]);
  const [challengeNote, setChallengeNote] = useState('');
  const [challengeError, setChallengeError] = useState(null);

  // Form states for Staff Reopening Challenged Issue
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [staffReopenNote, setStaffReopenNote] = useState('');

  // Lock body scroll and set initial focus
  useEffect(() => {
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
  }, [onClose]);

  if (!issue) return null;

  const dueDateFormatted = formatDueDate(issue.dueAt);
  const timeRemaining = formatTimeRemaining(issue, currentTime);

  // Handlers
  const handleResolutionSubmit = (e) => {
    e.preventDefault();
    if (!actionTaken.trim()) {
      setResolutionError('Please describe the work that was completed.');
      return;
    }
    if (onSubmitResolution) {
      onSubmitResolution(issue.id, {
        technician: techName.trim() || SIMULATED_STAFF_USER.name,
        actionTaken: actionTaken.trim(),
        afterPhotoUrl,
        inspectionNote: inspectionNote.trim(),
      });
      setShowResolutionForm(false);
      setActionTaken('');
      setInspectionNote('');
      setAfterPhotoUrl(null);
      setResolutionError(null);
    }
  };

  const handleVerifySubmit = () => {
    if (onVerifyResolution) {
      onVerifyResolution(issue.id, {
        verifierNote: verifierNote.trim(),
      });
      setVerifierNote('');
    }
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionNote.trim()) {
      setRejectionError('Please explain what needs further attention.');
      return;
    }
    if (onRejectResolution) {
      onRejectResolution(issue.id, {
        reason: rejectionReason,
        note: rejectionNote.trim(),
      });
      setShowRejectForm(false);
      setRejectionNote('');
      setRejectionError(null);
    }
  };

  const handleChallengeSubmit = (e) => {
    e.preventDefault();
    if (!challengeNote.trim()) {
      setChallengeError('Please explain why this repair is inadequate.');
      return;
    }
    if (onChallengeIssue) {
      onChallengeIssue(issue.id, {
        reason: challengeReason,
        note: challengeNote.trim(),
      });
      setShowChallengeForm(false);
      setChallengeNote('');
      setChallengeError(null);
    }
  };

  const handleReopenSubmit = (e) => {
    e.preventDefault();
    if (onReopenChallengedIssue) {
      onReopenChallengedIssue(issue.id, {
        staffNote: staffReopenNote.trim(),
      });
      setShowReopenForm(false);
      setStaffReopenNote('');
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAfterPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-modal-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-2xl w-full max-h-[90vh] flex flex-col text-left overflow-hidden z-10">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/70">
              {issue.id}
            </span>
            <StatusBadge status={issue.status} size="md" />
            {issue.priority && <PriorityBadge priority={issue.priority} size="md" />}
            {issue.isDemoReport && (
              <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md">
                Sample Demo Report
              </span>
            )}
            {issue.isChallenged && (
              <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-md">
                Challenged
              </span>
            )}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ============================================================== */}
          {/* SECTION 1: ISSUE DETAILS                                      */}
          {/* ============================================================== */}
          <section className="space-y-4">
            <h2 id="issue-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {issue.title}
            </h2>

            {issue.isDemoReport && (
              <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded p-2.5 leading-relaxed">
                <strong className="text-slate-700">Demonstration Record:</strong> This is an illustrative sample report created for testing damage tracking across New Town. It does not represent an actual citizen complaint submitted to NKDA or other authorities.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
              <div>
                <span className="text-slate-500 block">Location</span>
                <span className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {issue.location ||
                      (issue.landmark
                        ? `${issue.landmark}${issue.area ? `, ${issue.area}` : ''}`
                        : `${issue.building || 'New Town'}`)}
                  </span>
                </span>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  {issue.locationPrecision === 'verified-gps' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified GPS
                    </span>
                  ) : issue.locationPrecision === 'user-pinned' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> User-Pinned Location
                    </span>
                  ) : issue.locationPrecision === 'unmapped' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Unmapped Queue
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Approximate Landmark Location
                    </span>
                  )}
                  {issue.coordinates?.lat && issue.coordinates?.lng && (
                    <span className="text-[10px] font-mono text-slate-500">
                      ({Number(issue.coordinates.lat).toFixed(5)}, {Number(issue.coordinates.lng).toFixed(5)})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block">Category</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{issue.category}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Reported</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {issue.reportedDateDisplay || 'Recently'} &bull; {issue.reportedBy || 'Resident'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Target Resolution SLA</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {dueDateFormatted} ({timeRemaining})
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {issue.description || 'No additional details provided.'}
              </p>
            </div>

            {/* Attached Photo Evidence */}
            {issue.photoUrl && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>Photo Evidence</span>
                </h3>
                <div className="rounded-lg overflow-hidden border border-slate-200 max-h-56 max-w-sm bg-slate-100">
                  <img src={issue.photoUrl} alt="Reported issue photo" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </section>

          <hr className="border-slate-200" />

          {/* ============================================================== */}
          {/* SECTION 2: PROGRESS                                           */}
          {/* ============================================================== */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Progress
            </h3>

            {/* Plain explanation of current state */}
            <div className="text-xs p-3.5 rounded-lg border bg-slate-50 border-slate-200 text-slate-700 leading-relaxed">
              {issue.status === 'Resolution Submitted' && (
                <p>
                  <strong>Awaiting Verification:</strong> Field maintenance staff have submitted a proposed resolution. A local resident or civic verifier must confirm the fix is satisfactory before this ticket is marked Resolved.
                </p>
              )}
              {issue.status === 'Resolved' && (
                <p>
                  <strong>Resolved:</strong> This repair has been completed and independently verified.
                </p>
              )}
              {issue.status === 'In Progress' && (
                <p>
                  <strong>In Progress:</strong> Maintenance technicians have been dispatched to resolve this issue.
                </p>
              )}
              {issue.status === 'Open' && (
                <p>
                  <strong>Open:</strong> Reported problem is queued for crew assignment and dispatch.
                </p>
              )}
            </div>

            {/* Resolution Evidence from staff if submitted */}
            {issue.resolutionEvidence && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Staff Resolution Log</span>
                </div>
                <p className="text-slate-800">
                  <strong>Action Taken:</strong> {issue.resolutionEvidence.actionTaken}
                </p>
                <p className="text-slate-600">
                  <strong>Technician:</strong> {issue.resolutionEvidence.technician}
                </p>
                {issue.resolutionEvidence.afterPhotoUrl && (
                  <div className="pt-2">
                    <span className="font-semibold text-slate-700 block mb-1">After Repair Photo:</span>
                    <img
                      src={issue.resolutionEvidence.afterPhotoUrl}
                      alt="After fix photo"
                      className="rounded border border-emerald-200 max-h-48 object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Citizen Challenge if present */}
            {issue.isChallenged && issue.challenge && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-rose-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  <span>Active Citizen Challenge</span>
                </div>
                <p className="text-rose-950">
                  <strong>Reason:</strong> {issue.challenge.reason}
                </p>
                {issue.challenge.note && (
                  <p className="text-rose-800">
                    <strong>Note:</strong> {issue.challenge.note}
                  </p>
                )}
              </div>
            )}

            {/* Timeline of events (only show when helpful) */}
            {issue.timeline && issue.timeline.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Timeline
                </span>
                <ol className="relative border-l border-slate-200 ml-2 space-y-3 text-xs">
                  {issue.timeline.map((step, idx) => (
                    <li key={idx} className="ml-4">
                      <div className="absolute w-2 h-2 bg-emerald-600 rounded-full -left-1 mt-1 border border-white" />
                      <div className="font-semibold text-slate-900">{step.title}</div>
                      <div className="text-[11px] text-slate-400">{step.time} &bull; {step.author}</div>
                      {step.note && <p className="text-slate-600 mt-0.5 text-xs">{step.note}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          <hr className="border-slate-200" />

          {/* ============================================================== */}
          {/* SECTION 3: ACTIONS                                            */}
          {/* ============================================================== */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Actions
            </h3>

            {/* General Action: Endorsement */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/90">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{issue.supporters || 0} citizens</span> have endorsed this report
              </div>
              <button
                type="button"
                onClick={() => onToggleSupport?.(issue.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  issue.supportedByMe
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${issue.supportedByMe ? 'fill-emerald-800 text-emerald-800' : ''}`} />
                <span>{issue.supportedByMe ? 'Endorsed' : 'Support this report (+1)'}</span>
              </button>
            </div>

            {/* Independent Verification Workflow (When Awaiting Verification) */}
            {issue.status === 'Resolution Submitted' && (
              <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                    Independent Verification
                  </span>
                  <span className="text-[11px] text-purple-800 font-medium">Citizen & Community Sign-Off</span>
                </div>
                <p className="text-xs text-purple-900/90 leading-relaxed">
                  Has this issue been adequately fixed? Verify closure or request rework.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleVerifySubmit}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Verify & Close Issue
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-800 bg-white border border-rose-300 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Request Rework
                  </button>
                </div>

                {/* Reject & Request Rework Form */}
                {showRejectForm && (
                  <form onSubmit={handleRejectSubmit} className="pt-3 border-t border-purple-200/80 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reason for Rework
                      </label>
                      <select
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200/90 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        {REJECTION_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Details for Technicians <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={rejectionNote}
                        onChange={(e) => {
                          setRejectionNote(e.target.value);
                          if (rejectionError) setRejectionError(null);
                        }}
                        placeholder="Explain what is still broken or incomplete..."
                        className="w-full text-xs p-2 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      {rejectionError && (
                        <p className="text-xs text-rose-600 mt-1">{rejectionError}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Send Back to In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Citizen Challenge Option (For Awaiting Verification or Resolved) */}
            {(issue.status === 'Resolution Submitted' || issue.status === 'Resolved') && !issue.isChallenged && (
              <div className="pt-2">
                {!showChallengeForm ? (
                  <button
                    type="button"
                    onClick={() => setShowChallengeForm(true)}
                    disabled={issue.challengedByMe}
                    className="text-xs font-medium text-slate-600 hover:text-rose-700 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{issue.challengedByMe ? 'You have challenged this repair' : 'Notice a problem with this repair? File a Citizen Challenge'}</span>
                  </button>
                ) : (
                  <form onSubmit={handleChallengeSubmit} className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4 space-y-3 text-xs">
                    <span className="font-bold text-rose-950 block">File a Citizen Challenge</span>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Reason</label>
                      <select
                        value={challengeReason}
                        onChange={(e) => setChallengeReason(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200/90 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      >
                        {CHALLENGE_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Explain Problem <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={challengeNote}
                        onChange={(e) => {
                          setChallengeNote(e.target.value);
                          if (challengeError) setChallengeError(null);
                        }}
                        placeholder="Why is this repair unsatisfactory?"
                        className="w-full text-xs p-2 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      {challengeError && <p className="text-xs text-rose-600 mt-1">{challengeError}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Submit Challenge
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowChallengeForm(false)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Staff Workflow Actions (When in Staff Mode) */}
            {isStaffMode && (
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wider">
                  <Wrench className="w-3.5 h-3.5 text-amber-700" />
                  <span>Demo Staff Actions</span>
                </div>

                {issue.status === 'Open' && (
                  <button
                    type="button"
                    onClick={() => onStartWork?.(issue.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Start Work (Move to In Progress)
                  </button>
                )}

                {issue.status === 'In Progress' && (
                  <div>
                    {!showResolutionForm ? (
                      <button
                        type="button"
                        onClick={() => setShowResolutionForm(true)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Submit Proposed Resolution
                      </button>
                    ) : (
                      <form onSubmit={handleResolutionSubmit} className="space-y-3 pt-2 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Action Taken <span className="text-rose-600">*</span>
                          </label>
                          <textarea
                            rows={2}
                            value={actionTaken}
                            onChange={(e) => {
                              setActionTaken(e.target.value);
                              if (resolutionError) setResolutionError(null);
                            }}
                            placeholder="Describe the repair completed on site..."
                            className="w-full text-xs p-2 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          {resolutionError && (
                            <p className="text-xs text-rose-600 mt-1">{resolutionError}</p>
                          )}
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Attach After-Photo (Optional)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="text-xs text-slate-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            Submit for Verification
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowResolutionForm(false)}
                            className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {issue.isChallenged && (
                  <div>
                    {!showReopenForm ? (
                      <button
                        type="button"
                        onClick={() => setShowReopenForm(true)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Acknowledge Challenge & Reopen for Rework
                      </button>
                    ) : (
                      <form onSubmit={handleReopenSubmit} className="space-y-2 pt-2 text-xs">
                        <textarea
                          rows={2}
                          value={staffReopenNote}
                          onChange={(e) => setStaffReopenNote(e.target.value)}
                          placeholder="Staff note regarding rework..."
                          className="w-full text-xs p-2 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            Reopen Ticket
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReopenForm(false)}
                            className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-slate-50/80 border-t border-slate-200/80 px-6 py-3.5 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
