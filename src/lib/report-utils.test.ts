import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toBn,
  bnToEn,
  getMonthsForPeriod,
  getOverrideMonthForPeriod,
  resolvePeriodConfig,
  QUARTERS_BN,
  HALVES_BN,
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

  describe('bnToEn', () => {
    it('converts Bengali digits to ASCII digits', () => {
      assert.equal(bnToEn('০'), '0');
      assert.equal(bnToEn('১২৩৪৫'), '12345');
      assert.equal(bnToEn('৬৭৮৯'), '6789');
    });

    it('handles mixed characters, decimals, and commas without mangling', () => {
      assert.equal(bnToEn('১০.৫'), '10.5');
      assert.equal(bnToEn('২,৫০০'), '2,500');
    });

    it('handles null and undefined gracefully', () => {
      assert.equal(bnToEn(null), '');
      assert.equal(bnToEn(undefined), '');
    });

    it('performs exact roundtrip with toBn for integers', () => {
      const numbers = [0, 1, 9, 42, 100, 9999];
      for (const n of numbers) {
        assert.equal(Number(bnToEn(toBn(n))), n);
      }
    });

    it('safely rounds float strings avoiding digit stripping inflation (RS-32)', () => {
      // 12.5 should parse to 12.5 and round to 13, NOT strip '.' and become 125 (10x inflation!)
      const input = '১২.৫';
      const cleaned = input.replace(/[,\s]/g, '');
      const parsed = parseFloat(bnToEn(cleaned));
      assert.equal(parsed, 12.5);
      const rounded = Math.round(parsed);
      assert.equal(rounded, 13);
    });
  });

  describe('getMonthsForPeriod (RS-05)', () => {
    it('returns single month for monthly reports', () => {
      assert.deepEqual(getMonthsForPeriod('monthly', 5), [5]);
      assert.deepEqual(getMonthsForPeriod('মাসিক', 7), [7]);
    });

    it('resolves all 4 calendar quarters dynamically', () => {
      // Q1: Jan–Mar
      assert.deepEqual(getMonthsForPeriod('quarterly', 1), [1, 2, 3]);
      assert.deepEqual(getMonthsForPeriod('ত্রৈমাসিক', 2), [1, 2, 3]);
      assert.deepEqual(getMonthsForPeriod('quarterly', 3), [1, 2, 3]);
      // Q2: Apr–Jun
      assert.deepEqual(getMonthsForPeriod('quarterly', 4), [4, 5, 6]);
      assert.deepEqual(getMonthsForPeriod('ত্রৈমাসিক', 5), [4, 5, 6]);
      assert.deepEqual(getMonthsForPeriod('quarterly', 6), [4, 5, 6]);
      // Q3: Jul–Sep
      assert.deepEqual(getMonthsForPeriod('quarterly', 7), [7, 8, 9]);
      assert.deepEqual(getMonthsForPeriod('ত্রৈমাসিক', 8), [7, 8, 9]);
      assert.deepEqual(getMonthsForPeriod('quarterly', 9), [7, 8, 9]);
      // Q4: Oct–Dec
      assert.deepEqual(getMonthsForPeriod('quarterly', 10), [10, 11, 12]);
      assert.deepEqual(getMonthsForPeriod('ত্রৈমাসিক', 11), [10, 11, 12]);
      assert.deepEqual(getMonthsForPeriod('quarterly', 12), [10, 11, 12]);
    });

    it('resolves both calendar halves dynamically', () => {
      // H1: Jan–Jun
      assert.deepEqual(getMonthsForPeriod('halfYearly', 1), [1, 2, 3, 4, 5, 6]);
      assert.deepEqual(getMonthsForPeriod('ষান্মাসিক', 5), [1, 2, 3, 4, 5, 6]);
      // H2: Jul–Dec
      assert.deepEqual(getMonthsForPeriod('halfYearly', 7), [7, 8, 9, 10, 11, 12]);
      assert.deepEqual(getMonthsForPeriod('ষান্মাসিক', 10), [7, 8, 9, 10, 11, 12]);
    });

    it('resolves 9-month and yearly intervals', () => {
      assert.deepEqual(getMonthsForPeriod('nineMonth', 1), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
      assert.deepEqual(getMonthsForPeriod('yearly', 1), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('resolves custom ranges from start to end month', () => {
      assert.deepEqual(getMonthsForPeriod('custom', 2, 5), [2, 3, 4, 5]);
      assert.deepEqual(getMonthsForPeriod('কাস্টম', 7, 10), [7, 8, 9, 10]);
      assert.deepEqual(getMonthsForPeriod('custom', 8, 8), [8]);
      // Defensively clamps end < start to single start month
      assert.deepEqual(getMonthsForPeriod('custom', 9, 3), [9]);
    });
  });

  describe('getOverrideMonthForPeriod (RS-01 & RS-05 Fix)', () => {
    it('returns selected month for monthly reports', () => {
      assert.equal(getOverrideMonthForPeriod('monthly', 10), 10);
      assert.equal(getOverrideMonthForPeriod('মাসিক', 4), 4);
    });

    it('returns period start month for dynamic quarters and halves', () => {
      // Q1 -> 1, Q2 -> 4, Q3 -> 7, Q4 -> 10
      assert.equal(getOverrideMonthForPeriod('quarterly', 2), 1);
      assert.equal(getOverrideMonthForPeriod('ত্রৈমাসিক', 5), 4);
      assert.equal(getOverrideMonthForPeriod('quarterly', 8), 7);
      assert.equal(getOverrideMonthForPeriod('quarterly', 11), 10);

      // H1 -> 1, H2 -> 7
      assert.equal(getOverrideMonthForPeriod('halfYearly', 3), 1);
      assert.equal(getOverrideMonthForPeriod('ষান্মাসিক', 9), 7);

      // Custom range -> startMonth
      assert.equal(getOverrideMonthForPeriod('custom', 3, 7), 3);
      assert.equal(getOverrideMonthForPeriod('কাস্টম', 8, 11), 8);
    });
  });

  describe('resolvePeriodConfig & Start-Month Future Lockout', () => {
    const augustDhaka = { year: 2026, month: 8 };

    it('permits active in-progress periods whose startMonth has already occurred (August test cases)', () => {
      // H2 (July–Dec): startMonth 7 <= August (8) -> accessible!
      const h2 = resolvePeriodConfig({ type: 'halfYearly', half: 2, year: 2026, currentDhakaDate: augustDhaka });
      assert.equal(h2.isFuture, false);
      assert.deepEqual(h2.months, [7, 8, 9, 10, 11, 12]);
      assert.equal(h2.startMonth, 7);
      assert.equal(h2.overrideMonth, 7);

      // Q3 (July–Sept): startMonth 7 <= August (8) -> accessible!
      const q3 = resolvePeriodConfig({ type: 'quarterly', quarter: 3, year: 2026, currentDhakaDate: augustDhaka });
      assert.equal(q3.isFuture, false);
      assert.deepEqual(q3.months, [7, 8, 9]);

      // Yearly (Jan–Dec): startMonth 1 <= August (8) -> accessible!
      const yearly = resolvePeriodConfig({ type: 'yearly', year: 2026, currentDhakaDate: augustDhaka });
      assert.equal(yearly.isFuture, false);

      // 9M (Jan–Sept): startMonth 1 <= August (8) -> accessible!
      const nineM = resolvePeriodConfig({ type: 'nineMonth', year: 2026, currentDhakaDate: augustDhaka });
      assert.equal(nineM.isFuture, false);
    });

    it('blocks periods whose startMonth has NOT yet occurred in current year (August test cases)', () => {
      // Q4 (Oct–Dec): startMonth 10 > August (8) -> future / blocked!
      const q4 = resolvePeriodConfig({ type: 'quarterly', quarter: 4, year: 2026, currentDhakaDate: augustDhaka });
      assert.equal(q4.isFuture, true);

      // Custom range Sept–Nov: startMonth 9 > August (8) -> future / blocked!
      const customFuture = resolvePeriodConfig({ type: 'custom', startMonth: 9, endMonth: 11, year: 2026, currentDhakaDate: augustDhaka });
      assert.equal(customFuture.isFuture, true);

      // Future year 2027 -> future / blocked!
      const futureYear = resolvePeriodConfig({ type: 'monthly', month: 1, year: 2027, currentDhakaDate: augustDhaka });
      assert.equal(futureYear.isFuture, true);

      // Past year 2025 -> accessible!
      const pastYear = resolvePeriodConfig({ type: 'quarterly', quarter: 4, year: 2025, currentDhakaDate: augustDhaka });
      assert.equal(pastYear.isFuture, false);
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
