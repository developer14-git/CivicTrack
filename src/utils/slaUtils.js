// CivicTrack SLA & Target Resolution Deadline Utilities
// Prototype demonstration defaults only.
// DISCLAIMER: Demo SLA targets are illustrative prototype defaults for student testing.
// They do NOT represent official campus facilities commitments, binding agreements, or university policy.

export const SLA_POLICY_HOURS = {
  High: 24, // 24 hours
  Medium: 72, // 72 hours (3 days)
  Low: 168, // 7 days (168 hours)
};

export const SLA_POLICY_DESCRIPTIONS = {
  High: '24 hours (Urgent safety hazard or critical outage)',
  Medium: '72 hours (Standard operational maintenance)',
  Low: '7 days / 168 hours (Non-urgent aesthetic or minor repair)',
};

export const SLA_DISCLAIMER =
  'Illustrative prototype defaults for demonstration only. Not official college policy or binding facilities commitments.';

/**
 * Calculates dueAt ISO string based on reportedAt ISO string and priority
 */
export function calculateDueAt(reportedAt, priority) {
  if (!reportedAt) return null;
  const reportedDate = new Date(reportedAt);
  if (isNaN(reportedDate.getTime())) return null;

  const hours = SLA_POLICY_HOURS[priority] ?? SLA_POLICY_HOURS.Medium;
  const dueDate = new Date(reportedDate.getTime() + hours * 60 * 60 * 1000);
  return dueDate.toISOString();
}

/**
 * Determines live deadline status:
 * - 'Completed' (independently verified as Resolved and not currently challenged)
 * - 'Overdue' (deadline passed while issue is not independently verified as Resolved)
 * - 'Due Soon' (deadline is within the next 6 hours and has not passed)
 * - 'On Track' (deadline is > 6 hours away)
 *
 * NOTE: 'Resolution Submitted' is intentionally NOT 'Completed'. A submitted repair
 * remains subject to SLA deadlines until verified.
 */
export function getDeadlineStatus(issue, currentTime = new Date()) {
  if (!issue) return 'Unknown';

  // An issue is Completed ONLY when status is 'Resolved' and there is no active challenge.
  // Rejections and citizen challenges do not qualify as successful completion.
  if (issue.status === 'Resolved' && !issue.isChallenged) {
    return 'Completed';
  }

  if (!issue.dueAt) {
    return 'No SLA';
  }

  const dueTime = new Date(issue.dueAt).getTime();
  if (isNaN(dueTime)) {
    return 'Invalid Date';
  }

  const now = currentTime instanceof Date ? currentTime.getTime() : new Date(currentTime).getTime();
  const diffMs = dueTime - now;

  if (diffMs < 0) {
    return 'Overdue';
  }

  // Within the next 6 hours (6 * 60 * 60 * 1000 = 21,600,000 ms)
  if (diffMs <= 6 * 60 * 60 * 1000) {
    return 'Due Soon';
  }

  return 'On Track';
}

/**
 * Formats time remaining or overdue duration into a human-readable string.
 * Example: "Overdue by 4h 12m", "Due in 1d 8h", "Due in 3h 15m", "Completed"
 */
export function formatTimeRemaining(issue, currentTime = new Date()) {
  if (!issue) return '';

  if (issue.status === 'Resolved' && !issue.isChallenged) {
    return 'Completed';
  }

  if (!issue.dueAt) {
    return 'No target deadline';
  }

  const dueTime = new Date(issue.dueAt).getTime();
  if (isNaN(dueTime)) return 'Invalid deadline';

  const now = currentTime instanceof Date ? currentTime.getTime() : new Date(currentTime).getTime();
  const diffMs = dueTime - now;

  const absDiff = Math.abs(diffMs);
  const totalMinutes = Math.floor(absDiff / (60 * 1000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (diffMs < 0) {
    // Overdue
    if (days > 0) {
      return `Overdue by ${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `Overdue by ${hours}h ${minutes}m`;
    }
    return `Overdue by ${Math.max(1, minutes)}m`;
  }

  // Future deadline
  if (days > 0) {
    return `Due in ${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `Due in ${hours}h ${minutes}m`;
  }
  return `Due in ${Math.max(1, minutes)}m`;
}

/**
 * Formats a due date ISO string for display.
 * Example: "Oct 26, 2026, 8:30 AM"
 */
export function formatDueDate(dueAt) {
  if (!dueAt) return 'No deadline set';
  const date = new Date(dueAt);
  if (isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Priority rank for sorting overdue items (High first, then Medium, then Low)
 */
const PRIORITY_ORDER = {
  High: 1,
  Medium: 2,
  Low: 3,
};

/**
 * Sorts overdue issues: Highest priority first, then oldest deadline (earliest dueAt).
 */
export function sortOverdueIssues(overdueIssues) {
  return [...overdueIssues].sort((a, b) => {
    const pA = PRIORITY_ORDER[a.priority] || 99;
    const pB = PRIORITY_ORDER[b.priority] || 99;
    if (pA !== pB) {
      return pA - pB;
    }
    const timeA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
    const timeB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
    return timeA - timeB;
  });
}

/**
 * Computes median resolution time strictly from valid reportedAt and verifiedAt ISO timestamps.
 * Issues without valid machine-readable timestamps are excluded from calculations.
 */
export function calculateMedianResolutionTime(issues) {
  const durations = [];

  for (const issue of issues) {
    // Only verified resolved tickets with verifiedAt and reportedAt qualify
    if (issue.status === 'Resolved' && !issue.isChallenged && issue.reportedAt && issue.verifiedAt) {
      const start = new Date(issue.reportedAt).getTime();
      const end = new Date(issue.verifiedAt).getTime();

      if (!isNaN(start) && !isNaN(end) && end >= start) {
        durations.push(end - start);
      }
    }
  }

  if (durations.length === 0) {
    return {
      hasData: false,
      sampleSize: 0,
      display: 'Insufficient demo data',
      subtext: 'Requires verified reports with valid report and verification ISO timestamps',
    };
  }

  durations.sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  const medianMs =
    durations.length % 2 !== 0 ? durations[mid] : (durations[mid - 1] + durations[mid]) / 2;

  const totalMinutes = Math.round(medianMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let displayStr = '';
  if (hours > 0 && minutes > 0) {
    displayStr = `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    displayStr = `${hours} hours`;
  } else {
    displayStr = `${minutes} mins`;
  }

  return {
    hasData: true,
    sampleSize: durations.length,
    medianMs,
    display: displayStr,
    subtext: `Based on ${durations.length} independently verified ${
      durations.length === 1 ? 'ticket' : 'tickets'
    } with validated timestamps`,
  };
}
