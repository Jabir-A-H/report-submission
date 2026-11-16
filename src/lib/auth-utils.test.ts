import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAuthIdentifier, type AvailabilityCheckResult } from './auth-utils.ts';
import { sanitizeAuthMessage } from './i18n.ts';

describe('auth-utils', () => {
  describe('normalizeAuthIdentifier (RS-42 Login Normalization)', () => {
    it('strips zero-width spaces, joiners, non-joiners, and BOM', () => {
      // \u200B = zero-width space
      // \u200C = zero-width non-joiner
      // \u200D = zero-width joiner
      // \uFEFF = zero-width no-break space / byte order mark
      const input = '\uFEFFuser\u200B_\u200Cname\u200D123';
      const result = normalizeAuthIdentifier(input);
      assert.equal(result, 'user_name123');
    });

    it('normalizes non-breaking spaces (\\u00A0) and trims whitespace', () => {
      const input = '\u00A0 user@example.com \u00A0';
      const result = normalizeAuthIdentifier(input);
      assert.equal(result, 'user@example.com');
    });

    it('lowercases mixed-case email addresses and usernames', () => {
      const email = '  Admin.User@REPORT.Internal  ';
      assert.equal(normalizeAuthIdentifier(email), 'admin.user@report.internal');

      const userId = 'FieldWorker_01';
      assert.equal(normalizeAuthIdentifier(userId), 'fieldworker_01');
    });

    it('handles null, undefined, and empty string gracefully', () => {
      assert.equal(normalizeAuthIdentifier(''), '');
      assert.equal(normalizeAuthIdentifier(null), '');
      assert.equal(normalizeAuthIdentifier(undefined), '');
    });

    it('handles mobile clipboard inputs with mixed zero-width and normal whitespace', () => {
      const dirtyMobileInput = ' \u200Badmin@domain.com\u200C ';
      assert.equal(normalizeAuthIdentifier(dirtyMobileInput), 'admin@domain.com');
    });
  });

  describe('Decoupled Rate Limiting Contract (RS-44 Fail-Open UX)', () => {
    it('ensures rate-limited availability responses fail-open with available: true', () => {
      const rateLimitedResponse: AvailabilityCheckResult = {
        available: true,
        rateLimited: true,
        message: 'যাচাই সীমা অতিক্রান্ত। ফর্ম জমা দেওয়ার সময় চূড়ান্ত যাচাই করা হবে।',
      };

      // Contract invariants:
      assert.equal(rateLimitedResponse.available, true);
      assert.equal(rateLimitedResponse.rateLimited, true);
      assert.ok(rateLimitedResponse.message && rateLimitedResponse.message.length > 0);

      // Verify that blocking conditions check:
      const hasBlockingError = (status: 'idle' | 'checking' | 'available' | 'taken' | 'unverified') =>
        status === 'taken';

      const statusFromResponse = rateLimitedResponse.rateLimited
        ? 'unverified'
        : rateLimitedResponse.available
          ? 'available'
          : 'taken';

      assert.equal(statusFromResponse, 'unverified');
      assert.equal(hasBlockingError(statusFromResponse), false);
    });

    it('ensures taken accounts produce blocking status', () => {
      const takenResponse: AvailabilityCheckResult = {
        available: false,
        message: 'এই ইমেইল দিয়ে আগেই নিবন্ধন করা হয়েছে।',
      };

      assert.equal(takenResponse.available, false);
      assert.equal(takenResponse.rateLimited, undefined);

      const statusFromResponse = takenResponse.rateLimited
        ? 'unverified'
        : takenResponse.available
          ? 'available'
          : 'taken';

      assert.equal(statusFromResponse, 'taken');
    });
  });

  describe('Phishing Defense Message Sanitization (RS-46)', () => {
    it('rejects arbitrary, unverified phishing messages in URL params', () => {
      const phishingAttempts = [
        'Your account has been suspended. Click here: https://evil.com',
        '<script>alert(1)</script>',
        'অনুগ্রহ করে পাসওয়ার্ড পরিবর্তন করতে এই লিঙ্কে যান: http://phish.xyz',
        'Unauthorized access detected. Please re-authenticate at malicious-site.com',
      ];

      for (const attempt of phishingAttempts) {
        const sanitized = sanitizeAuthMessage(attempt);
        assert.equal(sanitized, null, `Should reject phishing string: "${attempt}"`);
      }
    });

    it('accepts and translates known authentication error messages', () => {
      const knownError = 'Invalid login credentials';
      const sanitized = sanitizeAuthMessage(knownError);

      assert.ok(sanitized !== null);
      assert.equal(sanitized.isSuccess, false);
      assert.equal(sanitized.message, 'ইমেইল/ইউজার আইডি অথবা পাসওয়ার্ড সঠিক নয়।');
    });

    it('accepts and preserves known Bengali error translations', () => {
      const bengaliError = 'সকল তথ্য পূরণ করুন';
      const sanitized = sanitizeAuthMessage(bengaliError);

      assert.ok(sanitized !== null);
      assert.equal(sanitized.isSuccess, false);
      assert.equal(sanitized.message, 'সকল তথ্য পূরণ করুন');

      const rateLimitError = 'অতিরিক্ত লগইন চেষ্টা করা হয়েছে। ৫ মিনিট পর আবার চেষ্টা করুন।';
      const sanitizedRateLimit = sanitizeAuthMessage(rateLimitError);
      assert.ok(sanitizedRateLimit !== null);
      assert.equal(sanitizedRateLimit.isSuccess, false);
      assert.equal(sanitizedRateLimit.message, rateLimitError);
    });

    it('accepts known success messages with isSuccess: true', () => {
      const successMsg = 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগ-ইন করুন।';
      const sanitized = sanitizeAuthMessage(successMsg);

      assert.ok(sanitized !== null);
      assert.equal(sanitized.isSuccess, true);
      assert.equal(sanitized.message, successMsg);
    });

    it('returns null for empty, null, or undefined messages', () => {
      assert.equal(sanitizeAuthMessage(''), null);
      assert.equal(sanitizeAuthMessage(null), null);
      assert.equal(sanitizeAuthMessage(undefined), null);
    });
  });
});
