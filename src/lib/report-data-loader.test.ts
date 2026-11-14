import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadReportDataBundle, type ReportLoaderParams, type RequesterProfile } from './report-data-loader.ts';

function createMockSupabase(tables: Record<string, { data?: any; error?: any; exec?: (q: any) => any }>) {
  return {
    from: (table: string) => {
      const queryState: any = { table, filters: {}, selectCols: '*' };
      const chain: any = {
        select: (cols: string) => {
          queryState.selectCols = cols;
          return chain;
        },
        eq: (col: string, val: any) => {
          queryState.filters[col] = val;
          return chain;
        },
        in: (col: string, vals: any[]) => {
          queryState.filters[col] = vals;
          return chain;
        },
        single: async () => {
          const handler = tables[table];
          if (handler?.exec) return handler.exec(queryState);
          return { data: handler?.data || null, error: handler?.error || null };
        },
        maybeSingle: async () => {
          const handler = tables[table];
          if (handler?.exec) return handler.exec(queryState);
          return { data: handler?.data || null, error: handler?.error || null };
        },
        then: (resolve: (val: any) => any, reject?: (err: any) => any) => {
          const handler = tables[table];
          const result = handler?.exec
            ? handler.exec(queryState)
            : { data: handler?.data || [], error: handler?.error || null };
          return Promise.resolve(result).then(resolve, reject);
        },
      };
      return chain;
    },
  } as any;
}

describe('report-data-loader', () => {
  const adminRequester: RequesterProfile = {
    role: 'admin',
    zone_id: 2,
    active: true,
  };

  const userRequester: RequesterProfile = {
    role: 'user',
    zone_id: 3,
    active: true,
  };

  describe('Authorization & Access Control', () => {
    it('rejects unapproved/inactive requesters with 403 Forbidden', async () => {
      const mockDb = createMockSupabase({});
      const res = await loadReportDataBundle(
        mockDb,
        { reportId: 10 },
        { role: 'admin', zone_id: 1, active: false }
      );
      assert.equal(res.error?.status, 403);
      assert.equal(res.error?.message, 'Forbidden');
    });

    it('rejects regular users attempting to load city aggregated reports', async () => {
      const mockDb = createMockSupabase({});
      const res = await loadReportDataBundle(
        mockDb,
        { cityReport: true },
        userRequester
      );
      assert.equal(res.error?.status, 403);
      assert.equal(res.error?.message, 'Forbidden');
    });

    it('rejects regular users attempting to load reports belonging to a different zone', async () => {
      const mockDb = createMockSupabase({
        report: {
          data: { id: 10, zone_id: 5, report_type: 'মাসিক', month: 1, year: 2026 },
        },
      });
      const res = await loadReportDataBundle(
        mockDb,
        { reportId: 10 },
        userRequester // zone_id is 3, report is zone 5
      );
      assert.equal(res.error?.status, 403);
    });
  });

  describe('Case B: City Aggregated Reports & English Period Normalization', () => {
    it('normalizes English period token "quarterly" to Bengali "ত্রৈমাসিক" and loads overrides', async () => {
      let overrideQueryReportType = '';
      let overrideQueryMonths: number[] = [];

      const mockDb = createMockSupabase({
        view_city_header_agg: { data: [{ total_muallima: 50, month: 1 }] },
        view_city_course_agg: { data: [{ category: 'সাধারণদের', number: 10, month: 1 }] },
        view_city_organizational_agg: { data: [] },
        view_city_personal_agg: { data: [] },
        view_city_meeting_agg: { data: [] },
        view_city_extra_agg: { data: [] },
        city_report_override: {
          exec: (q) => {
            overrideQueryReportType = q.filters.report_type;
            overrideQueryMonths = q.filters.month;
            return {
              data: [
                {
                  section: 'courses',
                  field: 'number',
                  category: 'সাধারণদের',
                  value: '25',
                },
                {
                  section: 'comment',
                  field: 'city_comment',
                  category: 'মহানগরী মন্তব্য',
                  value: 'মহানগরীর সকল জোনের কার্যক্রম সন্তোষজনক।',
                },
              ],
              error: null,
            };
          },
        },
      });

      const res = await loadReportDataBundle(
        mockDb,
        {
          cityReport: true,
          reportType: 'quarterly',
          year: 2026,
          month: 1,
        },
        adminRequester
      );

      assert.ok(res.data);
      assert.equal(res.data.isCityAgg, true);
      assert.equal(res.data.reportType, 'ত্রৈমাসিক');
      // Confirmed fix: query passed canonical Bengali string 'ত্রৈমাসিক', not 'quarterly'
      assert.equal(overrideQueryReportType, 'ত্রৈমাসিক');
      assert.deepEqual(overrideQueryMonths, [1, 2, 3]);

      // Overrides merged into course item
      const course = res.data.courses.find((c) => c.category === 'সাধারণদের');
      assert.ok(course);
      assert.equal(course.number, 25);

      // Qualitative city remarks attached to bundle
      assert.equal(
        res.data.comment?.comment,
        'মহানগরীর সকল জোনের কার্যক্রম সন্তোষজনক।'
      );
    });

    it('intercepts zone_id === 1 as DCS / City entity and routes to Case B', async () => {
      const mockDb = createMockSupabase({
        view_city_header_agg: { data: [{ total_muallima: 100, month: 5 }] },
        view_city_course_agg: { data: [] },
        view_city_organizational_agg: { data: [] },
        view_city_personal_agg: { data: [] },
        view_city_meeting_agg: { data: [] },
        view_city_extra_agg: { data: [] },
        city_report_override: { data: [] },
      });

      const res = await loadReportDataBundle(
        mockDb,
        {
          zoneId: 1, // DCS Zone 1 interception
          month: 5,
          year: 2026,
          reportType: 'monthly',
        },
        adminRequester
      );

      assert.ok(res.data);
      assert.equal(res.data.isCityAgg, true);
      assert.equal(res.data.zoneName, 'ঢাকা মহানগরী');
      assert.equal(res.data.reportType, 'মাসিক');
    });
  });

  describe('Case A: Single Zone Reports', () => {
    it('loads single zone report by reportId', async () => {
      const mockDb = createMockSupabase({
        report: {
          data: {
            id: 42,
            zone_id: 3,
            report_type: 'মাসিক',
            month: 4,
            year: 2026,
            zone: { name: 'মিরপুর' },
          },
        },
        report_header: { data: { responsible_name: 'ফাতেমা', total_muallima: 15 } },
        report_course: { data: [{ category: 'সাধারণদের', number: 8 }] },
        report_organizational: { data: [] },
        report_personal: { data: [] },
        report_meeting: { data: [] },
        report_extra: { data: [] },
        report_comment: { data: { comment: 'অগ্রগতি ভালো।' } },
      });

      const res = await loadReportDataBundle(
        mockDb,
        { reportId: 42 },
        userRequester // user belongs to zone 3
      );

      assert.ok(res.data);
      assert.equal(res.data.isCityAgg, false);
      assert.equal(res.data.zoneName, 'মিরপুর');
      assert.equal(res.data.reportType, 'মাসিক');
      assert.equal(res.data.header.responsible_name, 'ফাতেমা');
      assert.equal(res.data.courses[0].number, 8);
      assert.equal(res.data.comment?.comment, 'অগ্রগতি ভালো।');
    });

    it('aggregates multi-month zone reports by zoneId and period range', async () => {
      const mockDb = createMockSupabase({
        zone: { data: { id: 2, name: 'উত্তরা' } },
        report: {
          data: [
            { id: 101, zone_id: 2, month: 1, year: 2026, report_type: 'মাসিক' },
            { id: 102, zone_id: 2, month: 2, year: 2026, report_type: 'মাসিক' },
            { id: 103, zone_id: 2, month: 3, year: 2026, report_type: 'মাসিক' },
          ],
        },
        report_header: {
          data: [
            { report_id: 101, month: 1, total_muallima: 10, muallima_increase: 2 },
            { report_id: 102, month: 2, total_muallima: 12, muallima_increase: 3 },
            { report_id: 103, month: 3, total_muallima: 15, muallima_increase: 1 },
          ],
        },
        report_course: {
          data: [
            { report_id: 101, category: 'সাধারণদের', number: 5 },
            { report_id: 102, category: 'সাধারণদের', number: 7 },
            { report_id: 103, category: 'সাধারণদের', number: 3 },
          ],
        },
        report_organizational: { data: [] },
        report_personal: { data: [] },
        report_meeting: { data: [] },
        report_extra: { data: [] },
        report_comment: {
          data: [
            { report_id: 101, comment: 'জানুয়ারি মন্তব্য' },
            { report_id: 103, comment: 'মার্চ মন্তব্য' },
          ],
        },
      });

      const res = await loadReportDataBundle(
        mockDb,
        {
          zoneId: 2,
          year: 2026,
          month: 1,
          reportType: 'quarterly',
        },
        adminRequester
      );

      assert.ok(res.data);
      assert.equal(res.data.isCityAgg, false);
      assert.equal(res.data.zoneName, 'উত্তরা');
      assert.equal(res.data.reportType, 'ত্রৈমাসিক');

      // Deltas summed: 2 + 3 + 1 = 6
      assert.equal(res.data.header.muallima_increase, 6);
      // Latest month stock: month 3 total_muallima = 15
      assert.equal(res.data.header.total_muallima, 15);

      // Course summed: 5 + 7 + 3 = 15
      assert.equal(res.data.courses[0].number, 15);

      // Comments joined by newline
      assert.equal(res.data.comment?.comment, 'জানুয়ারি মন্তব্য\nমার্চ মন্তব্য');
    });

    it('accurately resolves latest month stock snapshot when monthly reports are returned out-of-order', async () => {
      // Return reports out-of-order: Month 3, Month 1, Month 2
      const mockDb = createMockSupabase({
        zone: { data: { id: 2, name: 'উত্তরা' } },
        report: {
          data: [
            { id: 103, zone_id: 2, month: 3, year: 2026, report_type: 'মাসিক' },
            { id: 101, zone_id: 2, month: 1, year: 2026, report_type: 'মাসিক' },
            { id: 102, zone_id: 2, month: 2, year: 2026, report_type: 'মাসিক' },
          ],
        },
        // report_header rows without explicit month column, in out-of-order sequence
        report_header: {
          data: [
            { report_id: 103, total_muallima: 30, total_unit: 12, muallima_increase: 5 }, // Month 3 (latest stock)
            { report_id: 101, total_muallima: 10, total_unit: 6, muallima_increase: 2 },  // Month 1
            { report_id: 102, total_muallima: 20, total_unit: 8, muallima_increase: 3 },  // Month 2
          ],
        },
        report_course: { data: [] },
        report_organizational: { data: [] },
        report_personal: { data: [] },
        report_meeting: { data: [] },
        report_extra: { data: [] },
        report_comment: { data: [] },
      });

      const res = await loadReportDataBundle(
        mockDb,
        {
          zoneId: 2,
          year: 2026,
          month: 1,
          reportType: 'quarterly',
        },
        adminRequester
      );

      assert.ok(res.data);
      // Deltas summed: 5 + 2 + 3 = 10
      assert.equal(res.data.header.muallima_increase, 10);
      // Latest month stock: month 3 total_muallima = 30, total_unit = 12 (not month 2 values despite sequence)
      assert.equal(res.data.header.total_muallima, 30);
      assert.equal(res.data.header.total_unit, 12);
    });
  });
});
