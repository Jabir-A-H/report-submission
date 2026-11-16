import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDhakaDate, getDhakaDateFallback } from './date-utils.ts';

describe('date-utils', () => {
  describe('getDhakaDate', () => {
    it('returns a valid month (1-12) and year (> 2020)', () => {
      const { month, year, day } = getDhakaDate();

      assert.ok(month >= 1 && month <= 12, `Month ${month} should be between 1 and 12`);
      assert.ok(year >= 2024, `Year ${year} should be >= 2024`);
      assert.ok(day >= 1 && day <= 31, `Day ${day} should be between 1 and 31`);
    });

    it('returns numeric types for all date fields', () => {
      const date = getDhakaDate();
      assert.equal(typeof date.month, 'number');
      assert.equal(typeof date.year, 'number');
      assert.equal(typeof date.day, 'number');
      assert.ok(!Number.isNaN(date.month));
      assert.ok(!Number.isNaN(date.year));
      assert.ok(!Number.isNaN(date.day));
    });

    it('accurately resolves leap year Feb 29 in Asia/Dhaka', () => {
      const leapDay = new Date('2024-02-29T12:00:00Z');
      const result = getDhakaDate(leapDay);
      assert.equal(result.year, 2024);
      assert.equal(result.month, 2);
      assert.equal(result.day, 29);
    });

    it('accurately resolves month transition (June 30 18:00 UTC -> July 1 Dhaka)', () => {
      // 18:00 UTC on June 30 + 6 hours = 00:00 on July 1 in Dhaka
      const transitionDate = new Date('2026-06-30T18:00:00Z');
      const result = getDhakaDate(transitionDate);
      assert.equal(result.year, 2026);
      assert.equal(result.month, 7);
      assert.equal(result.day, 1);
    });

    it('accurately resolves year transition (Dec 31 18:00 UTC -> Jan 1 Dhaka)', () => {
      // 18:00 UTC on Dec 31 + 6 hours = 00:00 on Jan 1 in Dhaka
      const transitionDate = new Date('2025-12-31T18:00:00Z');
      const result = getDhakaDate(transitionDate);
      assert.equal(result.year, 2026);
      assert.equal(result.month, 1);
      assert.equal(result.day, 1);
    });

    it('fallback produces exact match with Intl formatter across all transitions', () => {
      const dates = [
        new Date('2024-02-29T12:00:00Z'),
        new Date('2026-06-30T18:00:00Z'),
        new Date('2025-12-31T18:00:00Z'),
        new Date('2026-08-15T04:30:00Z'),
      ];

      for (const d of dates) {
        const intlResult = getDhakaDate(d);
        const fallbackResult = getDhakaDateFallback(d);
        assert.deepEqual(intlResult, fallbackResult, `Mismatch for date ${d.toISOString()}`);
      }
    });
  });
});
