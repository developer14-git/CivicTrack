import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  X,
  Info,
} from 'lucide-react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DashboardOverview from './components/dashboard/DashboardOverview';
import IssueBrowser from './components/issues/IssueBrowser';
import MyReportsView from './components/dashboard/MyReportsView';
import CampusMapView from './components/map/CampusMapView';
import AccountabilityView from './components/analytics/AccountabilityView';
import IssueDetailModal from './components/issues/IssueDetailModal';
import ReportIssueModal from './components/issues/ReportIssueModal';
import DataManagementModal from './components/common/DataManagementModal';
import DemoTour from './components/tour/DemoTour';
import TourCompletionModal from './components/tour/TourCompletionModal';
import {
  INITIAL_ISSUES,
  MOCK_CAMPUSES,
  MOCK_ACTIVITIES,
  MOCK_NOTIFICATIONS,
  CURRENT_SIMULATED_USER,
  SIMULATED_STAFF_USER,
} from './data/mockIssues';
import { calculateDueAt } from './utils/slaUtils';
import {
  loadIssuesFromStorage,
  saveIssuesToStorage,
  resetStoredIssues,
  getStorageMetadata,
} from './utils/storageUtils';

export default function App() {
  // Initialize issues from browser localStorage if available & valid, otherwise use default mock dataset
  const [issues, setIssues] = useState(() => {
    const { issues: initialLoadedIssues } = loadIssuesFromStorage(INITIAL_ISSUES);
    return initialLoadedIssues;
  });
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [storageWarning, setStorageWarning] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(() => {
    const meta = getStorageMetadata();
    return meta?.savedAt || null;
  });

  const [currentTab, setCurrentTab] = useState('overview'); // 'overview' | 'issues' | 'my-reports'
  const [selectedCampus, setSelectedCampus] = useState(MOCK_CAMPUSES[0]);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);
  const [activeStatusFilter, setActiveStatusFilter] = useState('All Statuses');
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Guided Demo Tour State
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isTourComplete, setIsTourComplete] = useState(false);
  const [tourFormData, setTourFormData] = useState(null);

  // Prevent overwriting storage on initial mount
  const isInitialMount = useRef(true);

  // Auto-save changes whenever issues change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const result = saveIssuesToStorage(issues);
    if (result.success) {
      setTimeout(() => {
        setLastSavedAt(result.savedAt);
        setStorageWarning(null);
      }, 0);
    } else {
      setTimeout(() => {
        setStorageWarning(result.error);
        setFeedbackMessage({
          type: 'error',
          text: `Storage Warning: ${result.error}. State retained in memory.`,
        });
      }, 0);
    }
  }, [issues]);

  // Lightweight 60-second interval timer to update live relative SLA timers without requiring reload
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timerId);
  }, []);

  // Auto-clear feedback notification after 5 seconds
  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  const handleToggleStaffMode = (overrideBool) => {
    const nextState = typeof overrideBool === 'boolean' ? overrideBool : !isStaffMode;
    setIsStaffMode(nextState);
    setFeedbackMessage({
      type: 'info',
      text: nextState
        ? 'Demo Staff Mode enabled: You can now dispatch work orders, submit resolution evidence, and manage rework.'
        : 'Switched back to Resident / Citizen View.',
    });
  };

  // Restore issues from uploaded JSON backup
  const handleRestoreIssues = (newIssues) => {
    setIssues(newIssues);
    const result = saveIssuesToStorage(newIssues);
    if (result.success) {
      setLastSavedAt(result.savedAt);
      setStorageWarning(null);
    }
    setFeedbackMessage({
      type: 'success',
      text: `Successfully restored ${newIssues.length} issues from backup JSON.`,
    });
  };

  // Reset prototype to default initial dataset after confirmation
  const handleResetToDefaults = () => {
    resetStoredIssues(INITIAL_ISSUES);
    setIssues(INITIAL_ISSUES);
    setLastSavedAt(new Date().toISOString());
    setStorageWarning(null);
    setFeedbackMessage({
      type: 'info',
      text: `Prototype reset: Restored ${INITIAL_ISSUES.length} default New Town civic issue records.`,
    });
  };

  // --- GUIDED PRESENTATION TOUR WORKFLOW ---
  const handleTourStepChange = (stepIdx) => {
    setTourStep(stepIdx);

    switch (stepIdx) {
      case 0: // 1. Overview
        setCurrentTab('overview');
        setSelectedIssueId(null);
        setIsReportModalOpen(false);
        setIsDataModalOpen(false);
        setIsStaffMode(false);
        setTourFormData(null);
        break;

      case 1: // 2. Report an Issue
        setCurrentTab('overview');
        setSelectedIssueId(null);
        setIsDataModalOpen(false);
        setIsStaffMode(false);
        setTourFormData(null);
        setIsReportModalOpen(true);
        break;

      case 2: // 3. Duplicate Detection & Endorsements
        setSelectedIssueId(null);
        setIsDataModalOpen(false);
        setIsStaffMode(false);
        setIsReportModalOpen(true);
        setTourFormData({
          title: 'Burst Drinking Water Pipeline Flooding Service Road near Nazrul Tirtha',
          category: 'Drainage & Water Supply',
          area: 'Action Area I',
          building: 'Nazrul Tirtha',
          landmark: 'Service Road near Nazrul Tirtha Metro Pillar 42',
          description: 'Treated potable water pipeline has ruptured at joint under sidewalk pavers, flooding the road.',
          priority: 'High',
        });
        break;

      case 3: // 4. Campus Map
        setIsReportModalOpen(false);
        setSelectedIssueId(null);
        setIsDataModalOpen(false);
        setIsStaffMode(false);
        setTourFormData(null);
        setCurrentTab('map');
        break;

      case 4: // 5. Demo Staff Mode
        setIsReportModalOpen(false);
        setIsDataModalOpen(false);
        setIsStaffMode(true);
        setTourFormData(null);
        setCurrentTab('issues');
        {
          const openTicket =
            issues.find((i) => i.id === 'CT-103') ||
            issues.find((i) => i.status === 'Open') ||
            issues[0];
          if (openTicket) {
            setSelectedIssueId(openTicket.id);
          }
        }
        break;

      case 5: // 6. Independent Verification
        setIsReportModalOpen(false);
        setIsDataModalOpen(false);
        setIsStaffMode(false);
        setTourFormData(null);
        setCurrentTab('issues');
        {
          const submittedTicket =
            issues.find((i) => i.id === 'CT-102') ||
            issues.find((i) => i.status === 'Resolution Submitted');
          if (submittedTicket) {
            setSelectedIssueId(submittedTicket.id);
          } else {
            setSelectedIssueId(null);
          }
        }
        break;

      case 6: // 7. Citizen Challenges
        setIsReportModalOpen(false);
        setIsDataModalOpen(false);
        setIsStaffMode(false);
        setTourFormData(null);
        setCurrentTab('issues');
        {
          const targetTicket =
            issues.find((i) => i.id === 'CT-102') ||
            issues.find((i) => i.id === 'CT-105') ||
            issues.find((i) => i.status === 'Resolved' || i.status === 'Resolution Submitted') ||
            issues[0];
          if (targetTicket) {
            setSelectedIssueId(targetTicket.id);
          }
        }
        break;

      case 7: // 8. Accountability Analytics
        setSelectedIssueId(null);
        setIsReportModalOpen(false);
        setIsDataModalOpen(false);
        setIsStaffMode(false);
        setTourFormData(null);
        setCurrentTab('analytics');
        break;

      case 8: // 9. Local Data Management
        setSelectedIssueId(null);
        setIsReportModalOpen(false);
        setIsStaffMode(false);
        setTourFormData(null);
        setIsDataModalOpen(true);
        break;

      default:
        break;
    }
  };

  const handleStartTour = () => {
    setIsTourActive(true);
    setIsTourComplete(false);
    handleTourStepChange(0);
    setFeedbackMessage({
      type: 'info',
      text: 'Starting Guided Presentation Tour. Navigate with Next/Back or keyboard arrows.',
    });
  };

  const handleExitTour = () => {
    setIsTourActive(false);
    setTourFormData(null);
    setIsTourComplete(false);
    setFeedbackMessage({
      type: 'info',
      text: 'Exited Demo Tour. CivicTrack is ready for free exploration.',
    });
  };

  const handleCompleteTour = () => {
    setIsTourActive(false);
    setIsReportModalOpen(false);
    setIsDataModalOpen(false);
    setSelectedIssueId(null);
    setTourFormData(null);
    setIsTourComplete(true);
  };

  const handleRestartTour = () => {
    setIsTourComplete(false);
    setIsTourActive(true);
    handleTourStepChange(0);
  };

  const handleTriggerStepAction = (actionKey) => {
    switch (actionKey) {
      case 'nav_overview':
        setCurrentTab('overview');
        setSelectedIssueId(null);
        setIsReportModalOpen(false);
        setIsDataModalOpen(false);
        break;
      case 'open_report':
        setIsReportModalOpen(true);
        break;
      case 'load_duplicate_demo':
        setIsReportModalOpen(true);
        setTourFormData({
          title: 'Burst Drinking Water Pipeline Flooding Service Road near Nazrul Tirtha',
          category: 'Drainage & Water Supply',
          area: 'Action Area I',
          building: 'Nazrul Tirtha',
          landmark: 'Service Road near Nazrul Tirtha Metro Pillar 42',
          description: 'Treated potable water pipeline has ruptured at joint under sidewalk pavers, flooding the road.',
          priority: 'High',
        });
        break;
      case 'nav_map':
        setCurrentTab('map');
        setIsReportModalOpen(false);
        setSelectedIssueId(null);
        break;
      case 'inspect_staff_ticket':
        setIsStaffMode(true);
        {
          const openTicket =
            issues.find((i) => i.id === 'CT-103') ||
            issues.find((i) => i.status === 'Open') ||
            issues[0];
          if (openTicket) setSelectedIssueId(openTicket.id);
        }
        break;
      case 'inspect_submitted_ticket':
        setIsStaffMode(false);
        {
          const submittedTicket =
            issues.find((i) => i.id === 'CT-102') ||
            issues.find((i) => i.status === 'Resolution Submitted');
          if (submittedTicket) setSelectedIssueId(submittedTicket.id);
        }
        break;
      case 'inspect_challenge_ticket':
        setIsStaffMode(false);
        {
          const targetTicket =
            issues.find((i) => i.id === 'CT-102') ||
            issues.find((i) => i.id === 'CT-105') ||
            issues[0];
          if (targetTicket) setSelectedIssueId(targetTicket.id);
        }
        break;
      case 'nav_analytics':
        setCurrentTab('analytics');
        setSelectedIssueId(null);
        setIsReportModalOpen(false);
        break;
      case 'open_storage_modal':
        setIsDataModalOpen(true);
        break;
      default:
        break;
    }
  };

  // Toggle support (prevents repeated support from same simulated user)
  const handleToggleSupport = (issueId) => {
    setIssues((prevIssues) =>
      prevIssues.map((issue) => {
        if (issue.id === issueId) {
          const wasSupported = !!issue.supportedByMe;
          const updatedSupporters = wasSupported ? issue.supporters - 1 : issue.supporters + 1;
          const updated = {
            ...issue,
            supportedByMe: !wasSupported,
            supporters: Math.max(0, updatedSupporters),
          };

          if (!wasSupported) {
            setActivities((prevActs) => [
              {
                id: `ACT-${Date.now()}`,
                type: 'endorsement',
                issueId: issue.id,
                text: `${CURRENT_SIMULATED_USER.name} endorsed report: ${issue.title.slice(0, 48)}...`,
                timestamp: 'Just now',
                tag: 'Endorsed',
                tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
              },
              ...prevActs.slice(0, 5),
            ]);
            setFeedbackMessage({
              type: 'success',
              text: `You endorsed issue ${issue.id}. Community vote recorded.`,
            });
          } else {
            setFeedbackMessage({
              type: 'info',
              text: `Endorsement withdrawn for ${issue.id}.`,
            });
          }

          return updated;
        }
        return issue;
      })
    );
  };

  // Open detail view and mark related notifications read
  const handleOpenIssueDetail = (issueOrId) => {
    const id = typeof issueOrId === 'object' && issueOrId !== null ? issueOrId.id : issueOrId;
    setSelectedIssueId(id);
    setNotifications((prev) =>
      prev.map((n) => (n.issueId === id ? { ...n, unread: false } : n))
    );
  };

  // Handle clicking a metric card on the dashboard
  const handleSelectStatusFilter = (status) => {
    setActiveStatusFilter(status);
    setCurrentTab('issues');
  };

  // Submit newly created issue into in-memory state
  const handleSubmitIssue = (newIssueData) => {
    const maxExisting = issues.reduce((max, issue) => {
      const match = issue.id && String(issue.id).match(/^CT-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        return Math.max(max, isNaN(num) ? 0 : num);
      }
      return max;
    }, 100);
    const newId = `CT-${maxExisting + 1}`;
    const reportedAt = new Date().toISOString();
    const priority = newIssueData.priority || 'Medium';
    const dueAt = calculateDueAt(reportedAt, priority);

    const createdIssue = {
      ...newIssueData,
      id: newId,
      priority,
      reportedAt,
      dueAt,
      reportedDateDisplay: 'Just now',
      timeline: [
        {
          title: 'Issue Reported',
          time: 'Just now',
          author: CURRENT_SIMULATED_USER.name,
          note: 'Submitted via campus maintenance web portal. Queued for physical plant dispatch.',
        },
      ],
      resolutionEvidence: null,
      isChallenged: false,
    };

    setIssues((prev) => [createdIssue, ...prev]);

    setActivities((prev) => [
      {
        id: `ACT-${Date.now()}`,
        type: 'new_report',
        issueId: newId,
        text: `New maintenance report filed: ${createdIssue.title} (${newId})`,
        timestamp: 'Just now',
        tag: 'New Report',
        tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
      },
      ...prev.slice(0, 5),
    ]);

    setFeedbackMessage({
      type: 'success',
      text: `Maintenance report ${newId} logged successfully in session memory.`,
    });

    return createdIssue;
  };

  // --- LIFECYCLE HANDLERS ---

  // 1. Staff Workflow: Start work on an open issue (move to 'In Progress')
  const handleStartWork = (issueId) => {
    let validTransition = true;

    setIssues((prevIssues) =>
      prevIssues.map((issue) => {
        if (issue.id === issueId) {
          if (issue.status !== 'Open' && !issue.isChallenged) {
            validTransition = false;
            return issue;
          }

          const now = 'Just now';
          const updatedTimeline = [
            ...issue.timeline,
            {
              title: 'Work In Progress (Demo Staff)',
              time: now,
              author: SIMULATED_STAFF_USER.name,
              note: 'Work order accepted by campus maintenance crew. Technicians deployed on site.',
            },
          ];

          setActivities((prevActs) => [
            {
              id: `ACT-${Date.now()}`,
              type: 'crew_dispatch',
              issueId: issue.id,
              text: `Demo Staff began work on: ${issue.title.slice(0, 42)}... (${issue.id})`,
              timestamp: 'Just now',
              tag: 'In Progress',
              tagColor: 'bg-sky-50 text-sky-800 border-sky-200',
            },
            ...prevActs.slice(0, 5),
          ]);

          return {
            ...issue,
            status: 'In Progress',
            isChallenged: false,
            timeline: updatedTimeline,
          };
        }
        return issue;
      })
    );

    if (validTransition) {
      setFeedbackMessage({
        type: 'success',
        text: `Issue ${issueId} moved to In Progress. Technician crew dispatched (Simulated).`,
      });
    } else {
      setFeedbackMessage({
        type: 'error',
        text: 'Invalid transition: Only Open or Challenged issues can be moved to In Progress.',
      });
    }
  };

  // 2. Staff Workflow: Submit resolution proposal (move to 'Resolution Submitted')
  const handleSubmitResolution = (issueId, { technician, actionTaken, afterPhotoUrl, inspectionNote }) => {
    let validTransition = true;

    setIssues((prevIssues) =>
      prevIssues.map((issue) => {
        if (issue.id === issueId) {
          if (issue.status !== 'In Progress') {
            validTransition = false;
            return issue;
          }

          const now = 'Just now';
          const evidenceRecord = {
            title: 'Facility Maintenance Log & Work Record',
            technician: technician?.trim() || SIMULATED_STAFF_USER.name,
            actionTaken: actionTaken.trim(),
            afterPhotoUrl: afterPhotoUrl || null,
            inspectionDate: now,
            verificationNote: inspectionNote?.trim() || 'Work completed on site. Ready for student verification and sign-off.',
            disclaimer: 'Simulated demonstration record for CivicTrack frontend testing. Not connected to physical campus maintenance systems.',
          };

          const updatedTimeline = [
            ...issue.timeline,
            {
              title: 'Resolution Submitted (Demo Staff)',
              time: now,
              author: technician?.trim() || SIMULATED_STAFF_USER.name,
              note: actionTaken.trim(),
            },
          ];

          setActivities((prevActs) => [
            {
              id: `ACT-${Date.now()}`,
              type: 'status_update',
              issueId: issue.id,
              text: `Demo Staff submitted resolution for: ${issue.title.slice(0, 40)}... (${issue.id})`,
              timestamp: 'Just now',
              tag: 'Resolution Submitted',
              tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            },
            ...prevActs.slice(0, 5),
          ]);

          return {
            ...issue,
            status: 'Resolution Submitted',
            resolutionEvidence: evidenceRecord,
            timeline: updatedTimeline,
            isChallenged: false, // reset challenge upon new resolution submission
          };
        }
        return issue;
      })
    );

    if (validTransition) {
      setFeedbackMessage({
        type: 'success',
        text: `Resolution submitted for ${issueId}. Issue is now awaiting independent verification.`,
      });
    } else {
      setFeedbackMessage({
        type: 'error',
        text: 'Invalid transition: Resolutions can only be submitted for issues currently In Progress.',
      });
    }
  };

  // 3. Verifier Workflow: Verify resolution (move to 'Resolved')
  const handleVerifyResolution = (issueId, { verifierNote }) => {
    let validTransition = true;

    setIssues((prevIssues) =>
      prevIssues.map((issue) => {
        if (issue.id === issueId) {
          if (issue.status !== 'Resolution Submitted') {
            validTransition = false;
            return issue;
          }

          const now = 'Just now';
          const updatedTimeline = [
            ...issue.timeline,
            {
              title: 'Resolution Verified & Closed (Independent Verifier)',
              time: now,
              author: `${CURRENT_SIMULATED_USER.name} (Simulated Verifier)`,
              note: verifierNote?.trim() || 'Independent verification completed. Physical repair confirmed satisfactory.',
            },
          ];

          setActivities((prevActs) => [
            {
              id: `ACT-${Date.now()}`,
              type: 'resolved',
              issueId: issue.id,
              text: `Resolution verified & closed: ${issue.title.slice(0, 40)}... (${issue.id})`,
              timestamp: 'Just now',
              tag: 'Resolved',
              tagColor: 'bg-slate-100 text-slate-700 border-slate-200',
            },
            ...prevActs.slice(0, 5),
          ]);

          return {
            ...issue,
            status: 'Resolved',
            verifiedAt: new Date().toISOString(),
            timeline: updatedTimeline,
            isChallenged: false,
          };
        }
        return issue;
      })
    );

    if (validTransition) {
      setFeedbackMessage({
        type: 'success',
        text: `Issue ${issueId} verified and marked Resolved. Maintenance cycle completed.`,
      });
    } else {
      setFeedbackMessage({
        type: 'error',
        text: 'Invalid transition: Only issues with Resolution Submitted can be verified.',
      });
    }
  };

  // 4. Verifier Workflow: Reject resolution (return to 'In Progress')
  const handleRejectResolution = (issueId, { reason, note }) => {
    let validTransition = true;

    setIssues((prevIssues) =>
      prevIssues.map((issue) => {
        if (issue.id === issueId) {
          if (issue.status !== 'Resolution Submitted') {
            validTransition = false;
            return issue;
          }

          const now = 'Just now';
          const rejectionNote = `Resolution Rejected: ${reason}.${note?.trim() ? ` Auditor details: ${note.trim()}` : ''}`;
          const updatedTimeline = [
            ...issue.timeline,
            {
              title: 'Resolution Rejected (Returned to In Progress)',
              time: now,
              author: `${CURRENT_SIMULATED_USER.name} (Simulated Verifier)`,
              note: rejectionNote,
            },
          ];

          setActivities((prevActs) => [
            {
              id: `ACT-${Date.now()}`,
              type: 'rejection',
              issueId: issue.id,
              text: `Resolution rejected for: ${issue.title.slice(0, 40)}... (Returned to In Progress)`,
              timestamp: 'Just now',
              tag: 'In Progress',
              tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
            },
            ...prevActs.slice(0, 5),
          ]);

          return {
            ...issue,
            status: 'In Progress',
            isChallenged: false,
            timeline: updatedTimeline,
          };
        }
        return issue;
      })
    );

    if (validTransition) {
      setFeedbackMessage({
        type: 'info',
        text: `Resolution rejected. Issue ${issueId} has been returned to In Progress for physical plant rework.`,
      });
    } else {
      setFeedbackMessage({
        type: 'error',
        text: 'Invalid transition: Only submitted resolutions can be rejected.',
      });
    }
  };

  // 5. Citizen Workflow: Challenge a resolution ('Resolution Submitted' or 'Resolved')
  const handleChallengeIssue = (issueId, { reason, note }) => {
    let errorMessage = null;

    setIssues((prevIssues) =>
      prevIssues.map((issue) => {
        if (issue.id === issueId) {
          if (issue.status !== 'Resolution Submitted' && issue.status !== 'Resolved') {
            errorMessage = 'Invalid action: Only Resolution Submitted or Resolved issues can be challenged.';
            return issue;
          }
          if (issue.challengedByMe) {
            errorMessage = 'You have already lodged a citizen challenge on this issue.';
            return issue;
          }

          const now = 'Just now';
          const challengeRecord = {
            reason,
            note: note?.trim() || '',
            timestamp: now,
            challenger: `${CURRENT_SIMULATED_USER.name} (Simulated Student)`,
          };

          const updatedTimeline = [
            ...issue.timeline,
            {
              title: 'Citizen Challenge Lodged',
              time: now,
              author: `${CURRENT_SIMULATED_USER.name} (Simulated Student)`,
              note: `Disputed fix: ${reason}.${note?.trim() ? ` Citizen note: ${note.trim()}` : ''}`,
            },
          ];

          setActivities((prevActs) => [
            {
              id: `ACT-${Date.now()}`,
              type: 'challenge',
              issueId: issue.id,
              text: `Citizen challenged fix on: ${issue.title.slice(0, 40)}... (${issue.id})`,
              timestamp: 'Just now',
              tag: 'Challenged',
              tagColor: 'bg-rose-50 text-rose-800 border-rose-200',
            },
            ...prevActs.slice(0, 5),
          ]);

          return {
            ...issue,
            isChallenged: true,
            challengedByMe: true,
            challenge: challengeRecord,
            timeline: updatedTimeline,
          };
        }
        return issue;
      })
    );

    if (errorMessage) {
      setFeedbackMessage({ type: 'error', text: errorMessage });
    } else {
      setFeedbackMessage({
        type: 'success',
        text: `Citizen challenge recorded for ${issueId}. Marked for physical plant review.`,
      });
    }
  };

  // 6. Staff Workflow: Reopen challenged issue to 'In Progress' for rework
  const handleReopenChallengedIssue = (issueId, { staffNote }) => {
    let errorMessage = null;

    setIssues((prevIssues) =>
      prevIssues.map((issue) => {
        if (issue.id === issueId) {
          if (!issue.isChallenged) {
            errorMessage = `Issue ${issueId} is not currently marked as challenged.`;
            return issue;
          }

          const now = 'Just now';
          const updatedTimeline = [
            ...issue.timeline,
            {
              title: 'Challenge Acknowledged: Reopened for Rework',
              time: now,
              author: SIMULATED_STAFF_USER.name,
              note: staffNote?.trim() || 'Citizen challenge reviewed and accepted. Work order reopened for supplemental maintenance.',
            },
          ];

          setActivities((prevActs) => [
            {
              id: `ACT-${Date.now()}`,
              type: 'reopened',
              issueId: issue.id,
              text: `Demo Staff reopened ${issue.title.slice(0, 40)}... for rework.`,
              timestamp: 'Just now',
              tag: 'In Progress',
              tagColor: 'bg-sky-50 text-sky-800 border-sky-200',
            },
            ...prevActs.slice(0, 5),
          ]);

          return {
            ...issue,
            status: 'In Progress',
            isChallenged: false,
            timeline: updatedTimeline,
          };
        }
        return issue;
      })
    );

    if (errorMessage) {
      setFeedbackMessage({
        type: 'error',
        text: errorMessage,
      });
    } else {
      setFeedbackMessage({
        type: 'success',
        text: `Issue ${issueId} reopened to In Progress for physical plant rework.`,
      });
    }
  };

  const selectedIssue = issues.find((i) => i.id === selectedIssueId);
  const myReports = issues.filter((i) => i.isMyReport);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Top Header / Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'issues' && currentTab !== 'issues') {
            setActiveStatusFilter('All Statuses');
          }
          setCurrentTab(tab);
        }}
        selectedCampus={selectedCampus}
        onSelectCampus={setSelectedCampus}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        notifications={notifications}
        onOpenIssueDetail={handleOpenIssueDetail}
        currentUser={CURRENT_SIMULATED_USER}
        myReportsCount={myReports.length}
        isStaffMode={isStaffMode}
        onToggleStaffMode={handleToggleStaffMode}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onStartTour={handleStartTour}
      />

      {/* Storage Quota / Availability Warning Banner */}
      {storageWarning && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-900 px-4 py-2">
          <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
              <span>
                <strong>Storage Notice:</strong> {storageWarning}. App continues operating in memory. Export backup to save changes.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDataModalOpen(true)}
              className="text-xs font-semibold text-rose-700 underline hover:text-rose-900 shrink-0 cursor-pointer"
            >
              Manage Backups
            </button>
          </div>
        </div>
      )}

      {/* Demo Staff Mode Alert Banner */}
      {isStaffMode && (
        <div className="bg-amber-400 text-amber-950 px-4 py-2 border-b border-amber-500 shadow-sm">
          <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-950 text-amber-200">
                Staff Demo Active
              </span>
              <span>
                Operating as <strong>{SIMULATED_STAFF_USER.name}</strong> ({SIMULATED_STAFF_USER.role}) — Simulated maintenance crew workflow.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleStaffMode(false)}
              className="text-xs font-semibold underline hover:text-black cursor-pointer ml-auto"
            >
              Exit Staff Mode
            </button>
          </div>
        </div>
      )}

      {/* Floating Action / Validation Feedback Toast */}
      {feedbackMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border text-sm ${
              feedbackMessage.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : feedbackMessage.type === 'info'
                ? 'bg-sky-50 text-sky-900 border-sky-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
          >
            {feedbackMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : feedbackMessage.type === 'info' ? (
              <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium leading-relaxed">
              {feedbackMessage.text}
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              aria-label="Dismiss feedback"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'overview' && (
          <DashboardOverview
            issues={issues}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onViewAllIssues={() => {
              setActiveStatusFilter('All Statuses');
              setCurrentTab('issues');
            }}
            onNavigateToMap={() => setCurrentTab('map')}
            onNavigateToMyReports={() => setCurrentTab('my-reports')}
            onNavigateToAnalytics={() => setCurrentTab('analytics')}
            onOpenIssueDetail={handleOpenIssueDetail}
            onToggleSupport={handleToggleSupport}
            onSelectStatusFilter={handleSelectStatusFilter}
            recentActivities={activities}
            currentTime={currentTime}
            isStaffMode={isStaffMode}
            onStartTour={handleStartTour}
          />
        )}

        {currentTab === 'issues' && (
          <IssueBrowser
            issues={issues}
            onOpenIssueDetail={handleOpenIssueDetail}
            onToggleSupport={handleToggleSupport}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            selectedStatus={activeStatusFilter}
            onSelectStatus={setActiveStatusFilter}
            currentTime={currentTime}
            isStaffMode={isStaffMode}
          />
        )}

        {currentTab === 'map' && (
          <CampusMapView
            issues={issues}
            selectedCampus={selectedCampus}
            onSelectCampus={setSelectedCampus}
            onOpenIssueDetail={handleOpenIssueDetail}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onToggleSupport={handleToggleSupport}
          />
        )}

        {currentTab === 'analytics' && (
          <AccountabilityView
            issues={issues}
            onOpenIssueDetail={handleOpenIssueDetail}
            currentTime={currentTime}
          />
        )}

        {currentTab === 'my-reports' && (
          <MyReportsView
            myIssues={myReports}
            onOpenIssueDetail={handleOpenIssueDetail}
            onToggleSupport={handleToggleSupport}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            currentUser={CURRENT_SIMULATED_USER}
            currentTime={currentTime}
            isStaffMode={isStaffMode}
          />
        )}
      </main>

      {/* Issue Detail View Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssueId(null)}
          onToggleSupport={handleToggleSupport}
          isStaffMode={isStaffMode}
          currentTime={currentTime}
          onToggleStaffMode={handleToggleStaffMode}
          onStartWork={handleStartWork}
          onSubmitResolution={handleSubmitResolution}
          onVerifyResolution={handleVerifyResolution}
          onRejectResolution={handleRejectResolution}
          onChallengeIssue={handleChallengeIssue}
          onReopenChallengedIssue={handleReopenChallengedIssue}
        />
      )}

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitIssue={handleSubmitIssue}
        selectedCampus={selectedCampus}
        onViewCreatedIssue={handleOpenIssueDetail}
        existingIssues={issues}
        onToggleSupport={handleToggleSupport}
        onOpenIssueDetail={handleOpenIssueDetail}
        initialFormData={tourFormData}
      />

      {/* Data Management & Backup Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        issues={issues}
        onRestore={handleRestoreIssues}
        onResetToDefaults={handleResetToDefaults}
        lastSavedAt={lastSavedAt}
      />

      {/* Presentation Tour Dock & Completion Modal */}
      <DemoTour
        isActive={isTourActive}
        currentStep={tourStep}
        onStepChange={handleTourStepChange}
        onExit={handleExitTour}
        onComplete={handleCompleteTour}
        onTriggerStepAction={handleTriggerStepAction}
      />

      <TourCompletionModal
        isOpen={isTourComplete}
        onClose={() => setIsTourComplete(false)}
        onRestartTour={handleRestartTour}
      />

      {/* Footer */}
      <Footer
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onStartTour={handleStartTour}
      />
    </div>
  );
}
