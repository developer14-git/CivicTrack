// CivicTrack Browser-Local Persistence Utilities
// Provides robust, quota-safe local storage for the prototype demonstration.
// NOTE: Demo data is stored exclusively in this browser on this device.
// No data is transmitted to an external database or shared across devices.

import { calculateDueAt } from './slaUtils.js';

export const STORAGE_KEY = 'civictrack_issues_v1';
export const STORAGE_META_KEY = 'civictrack_storage_meta_v1';

export const STORAGE_DISCLAIMER =
  'Demo data is stored locally in this browser on this device. Clearing your browser site data or cookies will remove all saved tickets.';

/**
 * Checks if window.localStorage is accessible and writable in the current browsing context.
 */
export function isStorageAvailable() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const testKey = '__civictrack_probe__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes an issue object before writing to localStorage to prevent quota exhaustion.
 * Large base64 data URLs (e.g. uploaded camera images > 500 characters) are omitted from
 * local storage, while preserving immediate in-session memory previews and marking an
 * explicit indicator for post-refresh behavior.
 */
export function sanitizeIssueForStorage(issue) {
  if (!issue || typeof issue !== 'object') return issue;

  const sanitized = { ...issue };

  // Exclude large data URL strings from persistent storage
  if (
    typeof sanitized.photoUrl === 'string' &&
    (sanitized.photoUrl.startsWith('data:') || sanitized.photoUrl.length > 500)
  ) {
    sanitized.photoUrl = null;
    sanitized.photoUnavailableAfterRefresh = true;
  }

  // Handle direct resolution photo url if attached
  if (
    typeof sanitized.resolutionPhotoUrl === 'string' &&
    (sanitized.resolutionPhotoUrl.startsWith('data:') || sanitized.resolutionPhotoUrl.length > 500)
  ) {
    sanitized.resolutionPhotoUrl = null;
    sanitized.resolutionPhotoUnavailableAfterRefresh = true;
  }

  // Handle staff after-photo attachment if present
  if (
    sanitized.resolutionEvidence &&
    typeof sanitized.resolutionEvidence === 'object' &&
    typeof sanitized.resolutionEvidence.afterPhotoUrl === 'string' &&
    (sanitized.resolutionEvidence.afterPhotoUrl.startsWith('data:') ||
      sanitized.resolutionEvidence.afterPhotoUrl.length > 500)
  ) {
    sanitized.resolutionEvidence = {
      ...sanitized.resolutionEvidence,
      afterPhotoUrl: null,
      afterPhotoUnavailableAfterRefresh: true,
    };
  }

  return sanitized;
}

/**
 * Validates the core schema of a stored issue to prevent crashes from malformed data.
 */
export function isValidIssueSchema(item) {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id !== 'string' || !item.id.trim()) return false;
  if (typeof item.title !== 'string' || !item.title.trim()) return false;
  if (typeof item.status !== 'string' || !item.status.trim()) return false;
  if (typeof item.category !== 'string' || !item.category.trim()) return false;
  return true;
}

/**
 * Retrieves storage metadata (last saved timestamp, item count, payload size).
 */
export function getStorageMetadata() {
  if (!isStorageAvailable()) {
    return {
      isAvailable: false,
      lastSavedAt: null,
      itemCount: 0,
      sizeBytes: 0,
    };
  }

  try {
    const rawMeta = window.localStorage.getItem(STORAGE_META_KEY);
    if (!rawMeta) {
      const rawData = window.localStorage.getItem(STORAGE_KEY);
      return {
        isAvailable: true,
        lastSavedAt: null,
        itemCount: 0,
        sizeBytes: rawData ? rawData.length : 0,
      };
    }
    const parsed = JSON.parse(rawMeta);
    return {
      isAvailable: true,
      lastSavedAt: parsed.lastSavedAt || null,
      itemCount: parsed.itemCount || 0,
      sizeBytes: parsed.sizeBytes || 0,
      version: parsed.version || 1,
    };
  } catch {
    return {
      isAvailable: true,
      lastSavedAt: null,
      itemCount: 0,
      sizeBytes: 0,
    };
  }
}

/**
 * Loads issues from localStorage. If storage is empty, missing, or corrupt,
 * safely falls back to fallbackIssues without throwing.
 */
export function loadIssuesFromStorage(fallbackIssues = []) {
  if (!isStorageAvailable()) {
    return {
      issues: fallbackIssues,
      source: 'fallback',
      isAvailable: false,
      error: 'Browser localStorage is disabled or unavailable.',
    };
  }

  try {
    const rawData = window.localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return {
        issues: fallbackIssues,
        source: 'default',
        isAvailable: true,
        lastSavedAt: null,
      };
    }

    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return {
        issues: fallbackIssues,
        source: 'default',
        isAvailable: true,
        lastSavedAt: null,
      };
    }

    const validIssues = [];
    for (const item of parsed) {
      if (isValidIssueSchema(item)) {
        const reportedAt = item.reportedAt || new Date().toISOString();
        const dueAt = item.dueAt || calculateDueAt(reportedAt, item.priority || 'Medium');

        validIssues.push({
          ...item,
          reportedAt,
          dueAt,
          supporters: Math.max(0, Number(item.supporters) || 0),
          timeline: Array.isArray(item.timeline) ? item.timeline : [],
          isChallenged: Boolean(item.isChallenged),
        });
      }
    }

    if (validIssues.length === 0) {
      return {
        issues: fallbackIssues,
        source: 'default',
        isAvailable: true,
        error: 'Stored data contained no valid issue records.',
      };
    }

    const meta = getStorageMetadata();
    return {
      issues: validIssues,
      source: 'storage',
      isAvailable: true,
      lastSavedAt: meta.lastSavedAt,
    };
  } catch (err) {
    console.warn('[CivicTrack] Error loading saved issues from localStorage:', err);
    return {
      issues: fallbackIssues,
      source: 'default',
      isAvailable: true,
      error: 'Corrupted localStorage data encountered; defaulted to initial records.',
    };
  }
}

/**
 * Persists issues array to localStorage after sanitizing photo byte payloads.
 */
export function saveIssuesToStorage(issues) {
  if (!isStorageAvailable()) {
    return {
      success: false,
      reason: 'unavailable',
      error: 'Browser localStorage is unavailable or disabled.',
    };
  }

  if (!Array.isArray(issues)) {
    return {
      success: false,
      reason: 'invalid_data',
      error: 'Issues data must be an array.',
    };
  }

  try {
    const sanitizedIssues = issues.map(sanitizeIssueForStorage);
    const jsonString = JSON.stringify(sanitizedIssues);
    window.localStorage.setItem(STORAGE_KEY, jsonString);

    const now = new Date().toISOString();
    const meta = {
      version: 1,
      lastSavedAt: now,
      itemCount: sanitizedIssues.length,
      sizeBytes: jsonString.length,
    };
    window.localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));

    return {
      success: true,
      lastSavedAt: now,
      itemCount: sanitizedIssues.length,
      sizeBytes: jsonString.length,
    };
  } catch (err) {
    console.warn('[CivicTrack] Storage save error:', err);
    const isQuota =
      err &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014);

    return {
      success: false,
      reason: isQuota ? 'quota_exceeded' : 'write_error',
      error: isQuota
        ? 'Local storage quota exceeded. Custom modifications remain in memory for this session.'
        : err?.message || 'Failed to write data to localStorage.',
    };
  }
}

/**
 * Resets local storage by wiping stored custom data and optionally
 * seeding with the default initial mock dataset.
 */
export function resetStoredIssues(initialIssues = null) {
  if (!isStorageAvailable()) return false;
  try {
    if (Array.isArray(initialIssues) && initialIssues.length > 0) {
      saveIssuesToStorage(initialIssues);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_META_KEY);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates and triggers download of a standardized JSON backup file.
 */
export function exportIssuesAsJSON(issues) {
  if (!Array.isArray(issues)) return false;

  try {
    const sanitized = issues.map(sanitizeIssueForStorage);
    const backupPayload = {
      app: 'CivicTrack',
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      itemCount: sanitized.length,
      disclaimer: STORAGE_DISCLAIMER,
      issues: sanitized,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `civictrack-backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    return true;
  } catch (err) {
    console.error('[CivicTrack] Export failed:', err);
    return false;
  }
}

/**
 * Validates and parses an uploaded JSON backup file string.
 * Supports both { issues: [...] } wrappers and plain [...] arrays.
 */
export function validateAndParseBackupJSON(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return {
      valid: false,
      error: 'Empty or invalid file content.',
    };
  }

  try {
    const parsed = JSON.parse(jsonString);
    let candidateIssues = null;

    if (Array.isArray(parsed)) {
      candidateIssues = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.issues)) {
      candidateIssues = parsed.issues;
    } else {
      return {
        valid: false,
        error: 'JSON must contain an array of issues or an object with an "issues" array property.',
      };
    }

    if (candidateIssues.length === 0) {
      return {
        valid: false,
        error: 'Backup file contains an empty issues array.',
      };
    }

    const validIssues = [];
    for (const item of candidateIssues) {
      if (isValidIssueSchema(item)) {
        const reportedAt = item.reportedAt || new Date().toISOString();
        const dueAt = item.dueAt || calculateDueAt(reportedAt, item.priority || 'Medium');

        validIssues.push({
          ...item,
          reportedAt,
          dueAt,
          supporters: Math.max(0, Number(item.supporters) || 0),
          timeline: Array.isArray(item.timeline) ? item.timeline : [],
          isChallenged: Boolean(item.isChallenged),
        });
      }
    }

    if (validIssues.length === 0) {
      return {
        valid: false,
        error: 'No valid CivicTrack issues found in this backup file.',
      };
    }

    return {
      valid: true,
      issues: validIssues,
      count: validIssues.length,
      exportedAt: parsed.exportedAt || null,
    };
  } catch (err) {
    return {
      valid: false,
      error: `JSON syntax error: ${err.message}`,
    };
  }
}

/**
 * Returns formatted human-readable file size string.
 */
export function formatByteSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
