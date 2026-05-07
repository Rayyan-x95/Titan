/**
 * Sanitizer utility for Titan
 * Ensures data integrity and prevents XSS/Injection
 */

const MAX_STRING_LENGTH = 5000;
const MAX_TITLE_LENGTH = 200;

/**
 * Trims and truncates strings
 */
export function sanitizeString(value: unknown, maxLength = MAX_STRING_LENGTH): string {
  if (typeof value !== 'string') return '';
  return value.trim().substring(0, maxLength);
}

/**
 * Strips HTML tags safely using the browser's DOM parser
 */
// Module-level singleton to avoid creating a new parser every call
let _domParser: DOMParser | null = null;
function getDomParser(): DOMParser | null {
  if (!_domParser && typeof DOMParser !== 'undefined') {
    _domParser = new DOMParser();
  }
  return _domParser;
}

export function stripHtml(value: string): string {
  if (!value) return '';
  try {
    const parser = getDomParser();
    if (parser) {
      const doc = parser.parseFromString(value, 'text/html');
      return doc.body.textContent || '';
    }
    return value.replace(/<[^>]*>?/gm, '');
  } catch {
    // Fallback for environments where DOMParser is not available (e.g., SSR or tests)
    return value.replace(/<[^>]*>?/gm, '');
  }
}

/**
 * Sanitizes a title (single line, limited length)
 */
export function sanitizeTitle(value: unknown): string {
  const sanitized = sanitizeString(value, MAX_TITLE_LENGTH);
  return sanitized.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Sanitizes tags (lowercase, alphanumeric, limited length)
 */
export function sanitizeTag(value: unknown): string {
  const sanitized = sanitizeString(value, 30);
  return sanitized.toLowerCase().replace(/[^\p{L}\p{N}_-]/gu, '');
}

/**
 * Sanitizes an array of tags
 */
export function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return Array.from(new Set(tags.map(sanitizeTag).filter(Boolean)));
}

/**
 * Validates and sanitizes a date string
 */
export function sanitizeDateString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}
