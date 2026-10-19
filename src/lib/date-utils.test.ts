import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDhakaDate } from './date-utils.ts';

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
  });
});
