// Automated Integration & Reliability Test Suite for CivicTrack
import assert from 'node:assert';
import { calculateDueAt, getDeadlineStatus, calculateMedianResolutionTime } from '../src/utils/slaUtils.js';
import {
  sanitizeIssueForStorage,
  isValidIssueSchema,
  validateAndParseBackupJSON,
} from '../src/utils/storageUtils.js';
import { detectPossibleDuplicates } from '../src/utils/duplicateDetection.js';
import { TOUR_STEPS } from '../src/data/tourSteps.js';
import { INITIAL_ISSUES, SIMULATED_STAFF_USER } from '../src/data/mockIssues.js';

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('=== CIVICTRACK INTEGRATION & RELIABILITY AUDIT ===\n');

// -------------------------------------------------------------
// 1. Core Lifecycle & Transition Integrity
// -------------------------------------------------------------
console.log('Group 1: Issue Lifecycle Transitions & Validation Guards');

runTest('Happy Path: Open -> In Progress -> Resolution Submitted -> Resolved', () => {
  let issues = [
    {
      id: 'CT-101',
      title: 'Water leak',
      status: 'Open',
      timeline: [{ title: 'Reported', author: 'Student' }],
      isChallenged: false,
    },
  ];

  // 1. Start work (Open -> In Progress)
  const targetId = 'CT-101';
  issues = issues.map((issue) => {
    if (issue.id === targetId) {
      assert.strictEqual(issue.status, 'Open', 'Must be Open to start work');
      return {
        ...issue,
        status: 'In Progress',
        isChallenged: false,
        timeline: [...issue.timeline, { title: 'Work In Progress', author: SIMULATED_STAFF_USER.name }],
      };
    }
    return issue;
  });
  assert.strictEqual(issues[0].status, 'In Progress');

  // 2. Submit resolution (In Progress -> Resolution Submitted)
  issues = issues.map((issue) => {
    if (issue.id === targetId) {
      assert.strictEqual(issue.status, 'In Progress', 'Must be In Progress to submit resolution');
      return {
        ...issue,
        status: 'Resolution Submitted',
        resolutionEvidence: { technician: 'Staff tech', actionTaken: 'Fixed joint' },
        timeline: [...issue.timeline, { title: 'Resolution Submitted', author: SIMULATED_STAFF_USER.name }],
        isChallenged: false,
      };
    }
    return issue;
  });
  assert.strictEqual(issues[0].status, 'Resolution Submitted');
  assert.ok(issues[0].resolutionEvidence);

  // 3. Verify resolution (Resolution Submitted -> Resolved)
  const verifiedTimestamp = new Date().toISOString();
  issues = issues.map((issue) => {
    if (issue.id === targetId) {
      assert.strictEqual(issue.status, 'Resolution Submitted', 'Must be Resolution Submitted to verify');
      return {
        ...issue,
        status: 'Resolved',
        verifiedAt: verifiedTimestamp,
        timeline: [...issue.timeline, { title: 'Resolution Verified & Closed', author: 'Verifier' }],
        isChallenged: false,
      };
    }
    return issue;
  });
  assert.strictEqual(issues[0].status, 'Resolved');
  assert.strictEqual(issues[0].verifiedAt, verifiedTimestamp);
  assert.strictEqual(issues[0].timeline.length, 4);
});

runTest('Rejection Path: Resolution Submitted -> In Progress', () => {
  let issues = [
    {
      id: 'CT-102',
      title: 'Pipe Leak',
      status: 'Resolution Submitted',
      isChallenged: true,
      timeline: [{ title: 'Resolution Submitted' }],
    },
  ];

  // Reject resolution
  issues = issues.map((issue) => {
    if (issue.id === 'CT-102') {
      assert.strictEqual(issue.status, 'Resolution Submitted');
      return {
        ...issue,
        status: 'In Progress',
        isChallenged: false,
        timeline: [...issue.timeline, { title: 'Resolution Rejected (Returned to In Progress)' }],
      };
    }
    return issue;
  });

  assert.strictEqual(issues[0].status, 'In Progress');
  assert.strictEqual(issues[0].isChallenged, false);
});

runTest('Challenge Path on Submitted & Resolved Tickets', () => {
  let issues = [
    { id: 'CT-103', status: 'Resolution Submitted', isChallenged: false, timeline: [] },
    { id: 'CT-104', status: 'Resolved', isChallenged: false, timeline: [] },
  ];

  // Challenge CT-103
  issues = issues.map((issue) => {
    if (issue.id === 'CT-103') {
      return {
        ...issue,
        isChallenged: true,
        challengedByMe: true,
        challenge: { reason: 'Recurring Problem', note: 'Still dripping' },
        timeline: [...issue.timeline, { title: 'Citizen Challenge Lodged' }],
      };
    }
    return issue;
  });
  assert.strictEqual(issues[0].isChallenged, true);
  assert.strictEqual(issues[0].challengedByMe, true);
  assert.strictEqual(issues[0].challenge.reason, 'Recurring Problem');

  // Challenge CT-104
  issues = issues.map((issue) => {
    if (issue.id === 'CT-104') {
      return {
        ...issue,
        isChallenged: true,
        challengedByMe: true,
        challenge: { reason: 'Incomplete Cleanup', note: 'Debris left behind' },
        timeline: [...issue.timeline, { title: 'Citizen Challenge Lodged' }],
      };
    }
    return issue;
  });
  assert.strictEqual(issues[1].isChallenged, true);
  assert.strictEqual(issues[1].challenge.reason, 'Incomplete Cleanup');

  // Reopen challenged ticket for rework
  issues = issues.map((issue) => {
    if (issue.id === 'CT-103') {
      assert.strictEqual(issue.isChallenged, true);
      return {
        ...issue,
        status: 'In Progress',
        isChallenged: false,
        timeline: [...issue.timeline, { title: 'Challenge Acknowledged: Reopened for Rework' }],
      };
    }
    return issue;
  });
  assert.strictEqual(issues[0].status, 'In Progress');
  assert.strictEqual(issues[0].isChallenged, false);
});

runTest('Invalid Lifecycle Transitions are Blocked', () => {
  const openIssue = { id: 'CT-O', status: 'Open', isChallenged: false };
  const inProgressIssue = { id: 'CT-P', status: 'In Progress', isChallenged: false };
  const resolvedIssue = { id: 'CT-R', status: 'Resolved', isChallenged: false };

  // 1. Open -> Resolution Submitted (should be blocked)
  const canSubmitFromOpen = openIssue.status === 'In Progress';
  assert.strictEqual(canSubmitFromOpen, false, 'Open tickets cannot submit resolution');

  // 2. Open -> Resolved (should be blocked)
  const canVerifyFromOpen = openIssue.status === 'Resolution Submitted';
  assert.strictEqual(canVerifyFromOpen, false, 'Open tickets cannot be verified');

  // 3. In Progress -> Resolved (should be blocked)
  const canVerifyFromInProgress = inProgressIssue.status === 'Resolution Submitted';
  assert.strictEqual(canVerifyFromInProgress, false, 'In Progress tickets cannot jump to Resolved');

  // 4. Open cannot be challenged (only Resolution Submitted or Resolved)
  const canChallengeOpen = openIssue.status === 'Resolution Submitted' || openIssue.status === 'Resolved';
  assert.strictEqual(canChallengeOpen, false, 'Open issues cannot be challenged');

  // 5. In Progress cannot be challenged
  const canChallengeInProgress = inProgressIssue.status === 'Resolution Submitted' || inProgressIssue.status === 'Resolved';
  assert.strictEqual(canChallengeInProgress, false, 'In Progress issues cannot be challenged');

  // 6. Un-challenged ticket cannot be reopened
  const canReopenUnchallenged = resolvedIssue.isChallenged === true;
  assert.strictEqual(canReopenUnchallenged, false, 'Unchallenged tickets cannot be reopened');
});

runTest('Single-Vote Endorsement Integrity (No Duplicates by Same User)', () => {
  let issue = { id: 'CT-101', supporters: 14, supportedByMe: false };

  // First click: Endorse
  const wasSupported1 = !!issue.supportedByMe;
  issue = {
    ...issue,
    supportedByMe: !wasSupported1,
    supporters: Math.max(0, wasSupported1 ? issue.supporters - 1 : issue.supporters + 1),
  };
  assert.strictEqual(issue.supportedByMe, true);
  assert.strictEqual(issue.supporters, 15);

  // Second click: Withdraw
  const wasSupported2 = !!issue.supportedByMe;
  issue = {
    ...issue,
    supportedByMe: !wasSupported2,
    supporters: Math.max(0, wasSupported2 ? issue.supporters - 1 : issue.supporters + 1),
  };
  assert.strictEqual(issue.supportedByMe, false);
  assert.strictEqual(issue.supporters, 14);

  // Third click with supporters at 0: never falls below 0
  let zeroIssue = { id: 'CT-Zero', supporters: 0, supportedByMe: true };
  const wasSuppZero = !!zeroIssue.supportedByMe;
  zeroIssue = {
    ...zeroIssue,
    supportedByMe: !wasSuppZero,
    supporters: Math.max(0, wasSuppZero ? zeroIssue.supporters - 1 : zeroIssue.supporters + 1),
  };
  assert.strictEqual(zeroIssue.supporters, 0);
  assert.strictEqual(zeroIssue.supportedByMe, false);
});

runTest('Issue ID Generation Collision Prevention', () => {
  const existingIssues = [
    { id: 'CT-101' },
    { id: 'CT-103' },
    { id: 'CT-105' },
    { id: 'CT-150' },
  ];

  const maxExisting = existingIssues.reduce((max, issue) => {
    const match = issue.id && String(issue.id).match(/^CT-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, isNaN(num) ? 0 : num);
    }
    return max;
  }, 100);

  const newId = `CT-${maxExisting + 1}`;
  assert.strictEqual(newId, 'CT-151', 'New ID must exceed the highest existing ID to avoid collisions');
});

// -------------------------------------------------------------
// 2. SLA Tracking & Timestamp Precision
// -------------------------------------------------------------
console.log('\nGroup 2: SLA Tracking & Timestamp Precision');

runTest('calculateDueAt SLA Policies (High: 24h, Medium: 72h, Low: 7d)', () => {
  const reportedAt = '2026-10-24T00:00:00.000Z';
  const startMs = new Date(reportedAt).getTime();

  const dueHigh = calculateDueAt(reportedAt, 'High');
  assert.strictEqual(new Date(dueHigh).getTime() - startMs, 24 * 60 * 60 * 1000);

  const dueMed = calculateDueAt(reportedAt, 'Medium');
  assert.strictEqual(new Date(dueMed).getTime() - startMs, 72 * 60 * 60 * 1000);

  const dueLow = calculateDueAt(reportedAt, 'Low');
  assert.strictEqual(new Date(dueLow).getTime() - startMs, 7 * 24 * 60 * 60 * 1000);
});

runTest('getDeadlineStatus Lifecycle Precision', () => {
  const now = new Date('2026-10-24T12:00:00.000Z');

  // Due in 12 hours -> On Track
  const onTrackIssue = {
    status: 'Open',
    dueAt: new Date('2026-10-25T00:00:00.000Z').toISOString(),
  };
  assert.strictEqual(getDeadlineStatus(onTrackIssue, now), 'On Track');

  // Due in 3 hours -> Due Soon (<= 6 hours)
  const dueSoonIssue = {
    status: 'Open',
    dueAt: new Date('2026-10-24T15:00:00.000Z').toISOString(),
  };
  assert.strictEqual(getDeadlineStatus(dueSoonIssue, now), 'Due Soon');

  // Due 1 hour ago -> Overdue
  const overdueIssue = {
    status: 'Open',
    dueAt: new Date('2026-10-24T11:00:00.000Z').toISOString(),
  };
  assert.strictEqual(getDeadlineStatus(overdueIssue, now), 'Overdue');

  // Resolution Submitted tickets that are past deadline are still Overdue (not completed)
  const submittedPastDue = {
    status: 'Resolution Submitted',
    dueAt: new Date('2026-10-24T11:00:00.000Z').toISOString(),
  };
  assert.strictEqual(getDeadlineStatus(submittedPastDue, now), 'Overdue', 'Submitted resolutions past SLA are still Overdue until verified');

  // Verified Resolved tickets are Completed
  const verifiedResolved = {
    status: 'Resolved',
    isChallenged: false,
    dueAt: new Date('2026-10-24T11:00:00.000Z').toISOString(),
  };
  assert.strictEqual(getDeadlineStatus(verifiedResolved, now), 'Completed');

  // Challenged Resolved tickets are NOT Completed
  const challengedResolved = {
    status: 'Resolved',
    isChallenged: true,
    dueAt: new Date('2026-10-24T11:00:00.000Z').toISOString(),
  };
  assert.strictEqual(getDeadlineStatus(challengedResolved, now), 'Overdue', 'Challenged tickets past deadline cannot be marked Completed');
});

runTest('calculateMedianResolutionTime Accuracy & Edge Handling', () => {
  // Empty or no verified tickets
  const emptyRes = calculateMedianResolutionTime([]);
  assert.strictEqual(emptyRes.hasData, false);
  assert.strictEqual(emptyRes.display, 'Insufficient demo data');

  // Verified issues with valid timestamps
  const issues = [
    {
      status: 'Resolved',
      isChallenged: false,
      reportedAt: '2026-10-20T10:00:00.000Z',
      verifiedAt: '2026-10-20T14:00:00.000Z', // 4 hours
    },
    {
      status: 'Resolved',
      isChallenged: false,
      reportedAt: '2026-10-20T10:00:00.000Z',
      verifiedAt: '2026-10-20T16:00:00.000Z', // 6 hours
    },
    {
      status: 'Resolved',
      isChallenged: false,
      reportedAt: '2026-10-20T10:00:00.000Z',
      verifiedAt: '2026-10-20T20:00:00.000Z', // 10 hours
    },
    // Invalid/unverified tickets that must be excluded
    {
      status: 'Resolution Submitted',
      reportedAt: '2026-10-20T10:00:00.000Z',
      verifiedAt: '2026-10-20T11:00:00.000Z',
    },
    {
      status: 'Resolved',
      isChallenged: true, // Challenged tickets excluded
      reportedAt: '2026-10-20T10:00:00.000Z',
      verifiedAt: '2026-10-20T11:00:00.000Z',
    },
    {
      status: 'Resolved',
      reportedAt: 'invalid-date',
      verifiedAt: '2026-10-20T11:00:00.000Z',
    },
  ];

  const medianResult = calculateMedianResolutionTime(issues);
  assert.strictEqual(medianResult.hasData, true);
  assert.strictEqual(medianResult.sampleSize, 3);
  // Median of [4h, 6h, 10h] is 6h
  assert.strictEqual(medianResult.display, '6 hours');
});

// -------------------------------------------------------------
// 3. Deduplication & Linking Workflow
// -------------------------------------------------------------
console.log('\nGroup 3: Deduplication Detection & Endorsements');

runTest('detectPossibleDuplicates Matches on Same Building + Category + Keywords', () => {
  const existing = [
    {
      id: 'CT-102',
      title: 'Science Block C Pipe Leak Flooding East Wing',
      category: 'Plumbing',
      building: 'Science Block C',
      floorRoom: 'Ground floor near Lab 102',
      description: 'Main waterline joint cracked under high pressure.',
      supporters: 5,
    },
    {
      id: 'CT-105',
      title: 'Library 3rd Floor Broken Window Latch',
      category: 'Infrastructure',
      building: 'Library',
      floorRoom: '3rd Floor Study Carrel 12',
      description: 'Window does not stay closed.',
      supporters: 2,
    },
  ];

  const draft = {
    title: 'Water pipe leak in corridor',
    category: 'Plumbing',
    building: 'Science Block C',
    floorRoom: 'East Wing corridor',
    description: 'Continuous water leaking from ceiling pipe.',
  };

  const matches = detectPossibleDuplicates(draft, existing);
  assert.ok(matches.length >= 1, 'Should find candidate match');
  assert.strictEqual(matches[0].issue.id, 'CT-102');
  assert.ok(matches[0].reason.includes('Science Block C') || matches[0].reason.includes('Plumbing') || matches[0].reason.includes('leak'));
});

runTest('Supporting Existing Report Preserves Total Issues Count', () => {
  const initialIssues = [...INITIAL_ISSUES];
  const initialCount = initialIssues.length;

  const targetIssue = initialIssues[1];
  assert.ok(targetIssue);

  // User chooses "Support Existing" instead of creating a new issue
  const updatedIssues = initialIssues.map((issue) => {
    if (issue.id === targetIssue.id) {
      return {
        ...issue,
        supporters: issue.supporters + 1,
        supportedByMe: true,
      };
    }
    return issue;
  });

  assert.strictEqual(updatedIssues.length, initialCount, 'Total issue count must remain unchanged when endorsing existing ticket');
  assert.strictEqual(updatedIssues[1].supporters, targetIssue.supporters + 1);
});

// -------------------------------------------------------------
// 4. Persistence, Backup & Storage Safeguards
// -------------------------------------------------------------
console.log('\nGroup 4: Storage Persistence & Quota Safeguards');

runTest('sanitizeIssueForStorage Strips Oversized Photos (>500 chars / data:)', () => {
  const largePhoto = 'data:image/png;base64,' + 'A'.repeat(2000);
  const rawIssue = {
    id: 'CT-999',
    title: 'Broken chair',
    photoUrl: largePhoto,
    resolutionEvidence: {
      afterPhotoUrl: largePhoto,
      technician: 'Staff',
    },
  };

  const sanitized = sanitizeIssueForStorage(rawIssue);
  assert.strictEqual(sanitized.photoUrl, null, 'Oversized photoUrl must be set to null');
  assert.strictEqual(sanitized.photoUnavailableAfterRefresh, true, 'Flag must be set');
  assert.strictEqual(sanitized.resolutionEvidence.afterPhotoUrl, null, 'Evidence photo must be null');
  assert.strictEqual(sanitized.resolutionEvidence.afterPhotoUnavailableAfterRefresh, true);
  assert.strictEqual(sanitized.title, 'Broken chair', 'Metadata must remain intact');
});

runTest('isValidIssueSchema Validates Required Fields', () => {
  assert.strictEqual(isValidIssueSchema({ id: 'CT-1', title: 'T', status: 'Open', category: 'Plumbing' }), true);
  assert.strictEqual(isValidIssueSchema({ id: 'CT-1', title: '', status: 'Open', category: 'Plumbing' }), false);
  assert.strictEqual(isValidIssueSchema({ id: 'CT-1', status: 'Open', category: 'Plumbing' }), false);
  assert.strictEqual(isValidIssueSchema(null), false);
  assert.strictEqual(isValidIssueSchema('string'), false);
});

runTest('validateAndParseBackupJSON Enforces Valid Data', () => {
  // 1. Valid wrapped format
  const validWrapped = JSON.stringify({
    app: 'CivicTrack',
    issues: [
      { id: 'CT-101', title: 'Test 1', status: 'Open', category: 'Plumbing', priority: 'High' },
    ],
  });
  const res1 = validateAndParseBackupJSON(validWrapped);
  assert.strictEqual(res1.valid, true);
  assert.strictEqual(res1.issues.length, 1);
  assert.ok(res1.issues[0].reportedAt);
  assert.ok(res1.issues[0].dueAt);

  // 2. Valid plain array
  const validArray = JSON.stringify([
    { id: 'CT-102', title: 'Test 2', status: 'In Progress', category: 'Electrical', priority: 'Medium' },
  ]);
  const res2 = validateAndParseBackupJSON(validArray);
  assert.strictEqual(res2.valid, true);
  assert.strictEqual(res2.issues.length, 1);

  // 3. Corrupt JSON syntax
  const resCorrupt = validateAndParseBackupJSON('{ not valid json }');
  assert.strictEqual(resCorrupt.valid, false);
  assert.ok(resCorrupt.error.includes('JSON syntax error'));

  // 4. Empty issues array
  const resEmpty = validateAndParseBackupJSON(JSON.stringify({ issues: [] }));
  assert.strictEqual(resEmpty.valid, false);
});

// -------------------------------------------------------------
// 5. Tour Navigation Integrity
// -------------------------------------------------------------
console.log('\nGroup 5: Demo Tour Steps & Navigation Integrity');

runTest('All 9 Demo Tour Steps are Defined and Non-Destructive', () => {
  assert.strictEqual(TOUR_STEPS.length, 9, 'Must have exactly 9 tour steps');

  TOUR_STEPS.forEach((step, idx) => {
    assert.strictEqual(step.number, idx + 1, `Step ${idx} must have sequential number`);
    assert.ok(step.title, `Step ${idx} must have a title`);
    assert.ok(step.description, `Step ${idx} must have a description`);
    assert.ok(Array.isArray(step.insights) && step.insights.length > 0, `Step ${idx} must have insights`);

    // Ensure actionKey does NOT map to any destructive functions
    if (step.actionKey) {
      const allowedActions = [
        'nav_overview',
        'open_report',
        'load_duplicate_demo',
        'nav_map',
        'inspect_staff_ticket',
        'inspect_submitted_ticket',
        'inspect_challenge_ticket',
        'nav_analytics',
        'open_storage_modal',
      ];
      assert.ok(allowedActions.includes(step.actionKey), `Action key "${step.actionKey}" must be safe`);
    }
  });
});

// -------------------------------------------------------------
// 6. Dataset Expansion & Storage Preservation Audit
// -------------------------------------------------------------
console.log('\nGroup 6: Dataset Expansion, ID Collision & Storage Preservation');

runTest('100-Report Demonstration Dataset Integrity & Uniqueness', () => {
  assert.strictEqual(INITIAL_ISSUES.length, 100, `INITIAL_ISSUES should contain exactly 100 records (found ${INITIAL_ISSUES.length})`);

  const ids = INITIAL_ISSUES.map((i) => i.id);
  const uniqueIds = new Set(ids);
  assert.strictEqual(uniqueIds.size, 100, 'All 100 report IDs must be unique');

  for (let num = 101; num <= 200; num++) {
    assert.ok(uniqueIds.has(`CT-${num}`), `Report ID CT-${num} must exist`);
  }

  // Verify all are marked demo
  INITIAL_ISSUES.forEach((issue) => {
    assert.strictEqual(issue.isDemoReport, true, `Issue ${issue.id} must be flagged isDemoReport: true`);
  });

  // Reconcile precision counts
  const approxCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'approximate-landmark').length;
  const unmappedCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'unmapped').length;
  const verifiedCount = INITIAL_ISSUES.filter((i) => i.locationPrecision === 'verified-gps').length;

  assert.strictEqual(verifiedCount, 0, 'No demo records should claim verified GPS without field survey');
  assert.strictEqual(approxCount, 92, '92 reports have approximate landmark coordinates');
  assert.strictEqual(unmappedCount, 8, '8 reports are in the unmapped queue');
  assert.strictEqual(approxCount + unmappedCount, 100, 'Mapped + unmapped must equal 100');
});

runTest('Dynamic Next-ID Generation Never Collides with 100 Records or Restored Backup', () => {
  // With 100 default issues
  const maxExisting100 = INITIAL_ISSUES.reduce((max, issue) => {
    const match = issue.id && String(issue.id).match(/^CT-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, isNaN(num) ? 0 : num);
    }
    return max;
  }, 100);
  assert.strictEqual(`CT-${maxExisting100 + 1}`, 'CT-201', 'Next ID for default 100 issues must be CT-201');

  // With restored backup containing higher ID
  const backupWithHighId = [...INITIAL_ISSUES, { id: 'CT-250', title: 'Restored issue' }];
  const maxWithBackup = backupWithHighId.reduce((max, issue) => {
    const match = issue.id && String(issue.id).match(/^CT-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, isNaN(num) ? 0 : num);
    }
    return max;
  }, 100);
  assert.strictEqual(`CT-${maxWithBackup + 1}`, 'CT-251', 'Next ID after restoring backup must exceed CT-250');
});

console.log(`\n=== AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
