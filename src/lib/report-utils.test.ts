import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toBn,
  getMonthsForPeriod,
  sumRows,
  sumHeaderRows,
  DB_TYPE_MAP,
  URL_TO_ENGLISH_MAP,
} from './report-utils.ts';

describe('report-utils', () => {
  describe('toBn', () => {
    it('converts ASCII digits to Bengali digits', () => {
      assert.equal(toBn(0), '০');
      assert.equal(toBn(12345), '১২৩৪৫');
      assert.equal(toBn('6789'), '৬৭৮৯');
    });

    it('handles null and undefined gracefully', () => {
      assert.equal(toBn(null), '০');
      assert.equal(toBn(undefined), '০');
    });
  });

  describe('getMonthsForPeriod', () => {
    it('returns single month for monthly reports', () => {
      assert.deepEqual(getMonthsForPeriod('monthly', 5), [5]);
      assert.deepEqual(getMonthsForPeriod('মাসিক', 7), [7]);
    });

    it('returns correct month ranges for multi-month periods', () => {
      assert.deepEqual(getMonthsForPeriod('quarterly', 1), [1, 2, 3]);
      assert.deepEqual(getMonthsForPeriod('halfYearly', 1), [1, 2, 3, 4, 5, 6]);
      assert.deepEqual(getMonthsForPeriod('nineMonth', 1), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
      assert.deepEqual(getMonthsForPeriod('yearly', 1), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });
  });

  describe('sumHeaderRows (KI-005 Fix)', () => {
    it('returns null for empty rows', () => {
      assert.equal(sumHeaderRows([]), null);
    });

    it('returns the row directly when single row provided', () => {
      const single = {
        total_muallima: 10,
        muallima_increase: 2,
        muallima_decrease: 1,
      };
      assert.deepEqual(sumHeaderRows([single]), single);
    });

    it('takes latest month snapshot for inventory and sums deltas across months', () => {
      const month1 = {
        month: 1,
        total_muallima: 10,
        muallima_increase: 2,
        muallima_decrease: 0,
        certified_muallima: 5,
        total_unit: 4,
        responsible_name: 'Fatima',
      };
      const month2 = {
        month: 2,
        total_muallima: 12,
        muallima_increase: 3,
        muallima_decrease: 1,
        certified_muallima: 7,
        total_unit: 5,
        responsible_name: 'Fatima',
      };
      const month3 = {
        month: 3,
        total_muallima: 15,
        muallima_increase: 4,
        muallima_decrease: 1,
        certified_muallima: 9,
        total_unit: 6,
        responsible_name: 'Ayesha',
      };

      const result = sumHeaderRows([month2, month1, month3]); // pass out of order to verify sorting
      assert.ok(result);

      // Snapshot fields: must be from latest month (month 3)
      assert.equal(result.total_muallima, 15);
      assert.equal(result.certified_muallima, 9);
      assert.equal(result.total_unit, 6);
      assert.equal(result.responsible_name, 'Ayesha');

      // Delta fields: must be summed across all 3 months
      // increase: 2 + 3 + 4 = 9
      assert.equal(result.muallima_increase, 9);
      // decrease: 0 + 1 + 1 = 2
      assert.equal(result.muallima_decrease, 2);
    });
  });

  describe('sumRows (KI-006 Fix)', () => {
    it('sums standard count keys normally', () => {
      const rows = [
        { category: 'কর্মী', teaching: 2, learning: 10 },
        { category: 'কর্মী', teaching: 3, learning: 15 },
        { category: 'রুকন', teaching: 1, learning: 5 },
      ];
      const result = sumRows(rows, ['teaching', 'learning']);
      assert.equal(result.length, 2);

      const kormi = result.find((r) => r.category === 'কর্মী');
      assert.ok(kormi);
      assert.equal(kormi.teaching, 5);
      assert.equal(kormi.learning, 25);

      const rukon = result.find((r) => r.category === 'রুকন');
      assert.ok(rukon);
      assert.equal(rukon.teaching, 1);
      assert.equal(rukon.learning, 5);
    });

    it('calculates weighted mean for average attendance instead of summing averages', () => {
      const rows = [
        // Month 1: 2 meetings with average 10 attendees (total 20 attendees)
        {
          category: 'কমিটি বৈঠক হয়েছে',
          city_count: 2,
          city_avg_attendance: 10,
          thana_count: 3,
          thana_avg_attendance: 20,
        },
        // Month 2: 3 meetings with average 15 attendees (total 45 attendees)
        {
          category: 'কমিটি বৈঠক হয়েছে',
          city_count: 3,
          city_avg_attendance: 15,
          thana_count: 1,
          thana_avg_attendance: 40,
        },
      ];

      const result = sumRows(rows, [
        'city_count',
        'city_avg_attendance',
        'thana_count',
        'thana_avg_attendance',
      ]);

      const meeting = result[0];
      // City: Total meetings = 2 + 3 = 5
      assert.equal(meeting.city_count, 5);
      // City: Total attendees = (2 * 10) + (3 * 15) = 65. Weighted avg = 65 / 5 = 13.
      // (Old buggy behavior would have summed 10 + 15 = 25)
      assert.equal(meeting.city_avg_attendance, 13);

      // Thana: Total meetings = 3 + 1 = 4
      assert.equal(meeting.thana_count, 4);
      // Thana: Total attendees = (3 * 20) + (1 * 40) = 100. Weighted avg = 100 / 4 = 25.
      // (Old buggy behavior would have summed 20 + 40 = 60)
      assert.equal(meeting.thana_avg_attendance, 25);
    });

    it('preserves meeting_name and comments by appending unique values', () => {
      const rows = [
        { category: 'অন্যান্য', meeting_name: 'কুরআন সেমিনার', number: 1 },
        { category: 'অন্যান্য', meeting_name: 'কুরআন প্রতিযোগিতা', number: 2 },
      ];
      const result = sumRows(rows, ['number']);
      assert.equal(result[0].number, 3);
      assert.equal(result[0].meeting_name, 'কুরআন সেমিনার, কুরআন প্রতিযোগিতা');
    });
  });
});
