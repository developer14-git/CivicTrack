// Frontend-only, explainable duplicate detection for CivicTrack issue reporting
// Does not use AI, external APIs, or probabilistic guesswork.

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it',
  'its', 'itself', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off',
  'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through',
  'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself',
  'issue', 'problem', 'campus', 'reported', 'there', 'also', 'just', 'need', 'needs',
]);

/**
 * Normalizes text and extracts significant keywords
 */
export function extractKeywords(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

/**
 * Detects possible duplicate issues from existing in-memory issues
 *
 * @param {Object} draft - Current form draft ({ title, category, building, floorRoom, description })
 * @param {Array} existingIssues - Array of currently loaded in-memory issues
 * @returns {Array} List of matched candidates with explainable reasons
 */
export function detectPossibleDuplicates(draft, existingIssues = []) {
  if (!draft || !draft.title || draft.title.trim().length < 3 || !existingIssues.length) {
    return [];
  }

  const draftTitleKeywords = extractKeywords(draft.title);
  const draftDescKeywords = extractKeywords(draft.description);
  const draftRoomKeywords = extractKeywords(draft.floorRoom);

  const allDraftContentKeywords = new Set([
    ...draftTitleKeywords,
    ...draftDescKeywords,
  ]);

  const matches = [];

  for (const issue of existingIssues) {
    const isSameCategory = Boolean(draft.category && issue.category === draft.category);
    const isSameBuilding = Boolean(
      (draft.building && issue.building && draft.building === issue.building) ||
      (draft.area && issue.area && draft.area === issue.area) ||
      (draft.area && issue.building && issue.building.includes(draft.area)) ||
      (draft.building && issue.area && draft.building.includes(issue.area))
    );

    const issueTitleKeywords = extractKeywords(issue.title);
    const issueDescKeywords = extractKeywords(issue.description);
    const issueRoomKeywords = extractKeywords(issue.floorRoom || issue.location || issue.neighbourhood);

    const issueAllContentKeywords = new Set([
      ...issueTitleKeywords,
      ...issueDescKeywords,
    ]);

    // Find overlapping keywords
    const matchedContentKeywords = [];
    allDraftContentKeywords.forEach((kw) => {
      if (issueAllContentKeywords.has(kw)) {
        matchedContentKeywords.push(kw);
      }
    });

    const matchedRoomKeywords = draftRoomKeywords.filter((kw) =>
      issueRoomKeywords.includes(kw)
    );

    let reason = null;
    let score = 0;

    const locationName = issue.neighbourhood || issue.building || issue.area || 'Same area';

    // Rule 1: Same location + Same category + Shared problem keywords
    if (isSameBuilding && isSameCategory && matchedContentKeywords.length > 0) {
      score = 50 + matchedContentKeywords.length * 10;
      const kwPreview = matchedContentKeywords.slice(0, 3).join(', ');
      reason = `${locationName}: same category (${issue.category}), and matching keyword${matchedContentKeywords.length > 1 ? 's' : ''}: "${kwPreview}"`;
    }
    // Rule 2: Same location + Same room / landmark keywords
    else if (isSameBuilding && matchedRoomKeywords.length > 0) {
      score = 40 + matchedRoomKeywords.length * 10;
      reason = `${locationName}: matching location/landmark: "${matchedRoomKeywords.join(', ')}"`;
    }
    // Rule 3: Multiple significant problem keywords in title & description
    else if (matchedContentKeywords.length >= 2) {
      score = 30 + matchedContentKeywords.length * 8;
      const kwPreview = matchedContentKeywords.slice(0, 3).join(', ');
      reason = isSameBuilding
        ? `${locationName}: multiple matching keywords: "${kwPreview}"`
        : `Similar civic issue keywords: "${kwPreview}"`;
    }
    // Rule 4: Same location + Same category (baseline proximity)
    else if (isSameBuilding && isSameCategory && (draft.title.trim().length >= 5 || draft.description.trim().length >= 10)) {
      score = 25;
      reason = `${locationName}: same category (${issue.category})`;
    }
    // Rule 5: Same location with at least 1 distinct keyword
    else if (isSameBuilding && matchedContentKeywords.length === 1 && draft.title.trim().length >= 6) {
      score = 20;
      reason = `${locationName}: matching keyword: "${matchedContentKeywords[0]}"`;
    }

    if (reason && score >= 20) {
      matches.push({
        issue,
        reason,
        score,
        matchedKeywords: matchedContentKeywords,
      });
    }
  }

  // Sort by score descending and return top 3 matches
  return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}
