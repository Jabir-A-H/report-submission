/**
 * Auth utility functions for input normalization, availability contracts, and security helpers.
 */

export interface AvailabilityCheckResult {
  available: boolean;
  rateLimited?: boolean;
  message?: string;
}

/**
 * Normalizes an authentication identifier (email or user_id):
 * 1. Strips zero-width characters: zero-width space (\u200B), zero-width non-joiner (\u200C),
 *    zero-width joiner (\u200D), and byte order mark (\uFEFF).
 * 2. Normalizes non-breaking spaces (\u00A0) to standard spaces.
 * 3. Trims leading and trailing whitespace.
 * 4. Lowercases the entire string.
 */
export function normalizeAuthIdentifier(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .trim()
    .toLowerCase();
}
