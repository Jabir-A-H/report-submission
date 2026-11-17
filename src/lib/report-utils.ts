import { getDhakaDate } from "./date-utils.ts";
import { translations, type Language } from "./i18n.ts";

export const UNICODE_SEPARATOR_REGEX = /[,،٬，_\s\u00A0\u202F]/g;

export const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const MONTHS_BN = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export const REPORT_TYPES = [
  { value: "monthly", label: "মাসিক" },
  { value: "quarterly", label: "ত্রৈমাসিক" },
  { value: "halfYearly", label: "ষান্মাসিক" },
  { value: "nineMonth", label: "নয়-মাসিক" },
  { value: "yearly", label: "বার্ষিক" },
  { value: "custom", label: "কাস্টম রেঞ্জ" },
];

export const QUARTERS_BN = [
  { quarter: 1, label: "১ম ত্রৈমাসিক (জানুয়ারি – মার্চ)", startMonth: 1, endMonth: 3 },
  { quarter: 2, label: "২য় ত্রৈমাসিক (এপ্রিল – জুন)", startMonth: 4, endMonth: 6 },
  { quarter: 3, label: "৩য় ত্রৈমাসিক (জুলাই – সেপ্টেম্বর)", startMonth: 7, endMonth: 9 },
  { quarter: 4, label: "৪র্থ ত্রৈমাসিক (অক্টোবর – ডিসেম্বর)", startMonth: 10, endMonth: 12 },
];

export const HALVES_BN = [
  { half: 1, label: "১ম ষান্মাসিক (জানুয়ারি – জুন)", startMonth: 1, endMonth: 6 },
  { half: 2, label: "২য় ষান্মাসিক (জুলাই – ডিসেম্বর)", startMonth: 7, endMonth: 12 },
];

export const DB_TYPE_MAP: Record<string, string> = {
  monthly: "মাসিক",
  quarterly: "ত্রৈমাসিক",
  halfYearly: "ষান্মাসিক",
  nineMonth: "নয়-মাসিক",
  yearly: "বার্ষিক",
  "মাসিক": "মাসিক",
  "ত্রৈমাসিক": "ত্রৈমাসিক",
  "ষান্মাসিক": "ষান্মাসিক",
  "নয়-মাসিক": "নয়-মাসিক",
  "বার্ষিক": "বার্ষিক",
  custom: "কাস্টম",
  "কাস্টম": "কাস্টম",
  "কাস্টম রেঞ্জ": "কাস্টম",
};

export const URL_TO_ENGLISH_MAP: Record<string, string> = {
  "মাসিক": "monthly",
  "ত্রৈমাসিক": "quarterly",
  "ষান্মাসিক": "halfYearly",
  "নয়-মাসিক": "nineMonth",
  "বার্ষিক": "yearly",
  monthly: "monthly",
  quarterly: "quarterly",
  halfYearly: "halfYearly",
  nineMonth: "nineMonth",
  yearly: "yearly",
  custom: "custom",
  "কাস্টম": "custom",
  "কাস্টম রেঞ্জ": "custom",
};

export const COURSE_CATEGORIES = [
  "বিশিষ্টদের",
  "সাধারণদের",
  "কর্মীদের",
  "ইউনিট সভানেত্রী",
  "অগ্রসরদের",
  "রুকনদের অনুশীলনী ক্লাস",
  "শিশু- তা'লিমুল কুরআন",
  "নিরক্ষর- তা'লিমুস সলাত",
];

export const ORG_CATEGORIES = [
  "দাওয়াত দান",
  "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন",
  "সহযোগী হয়েছেন",
  "সম্মতি দিয়েছেন",
  "সক্রিয় সহযোগী",
  "কর্মী",
  "রুকন",
  "দাওয়াতী ইউনিট",
  "ইউনিট",
  "সুধী",
  "এককালীন",
  "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি",
  "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতজন",
  "বই বিলি",
  "বই বিক্রি",
];

export const PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"];

export const PERSONAL_METRICS_ROWS = [
  { key: "teaching", label: "কতজন শিখাচ্ছেন" },
  { key: "learning", label: "কতজনকে শিখাচ্ছেন" },
  { key: "olama_invited", label: "দাওয়াতপ্রাপ্ত ওলামা" },
  { key: "became_shohojogi", label: "সহযোগী হয়েছেন" },
  { key: "became_sokrio_shohojogi", label: "সক্রিয় সহযোগী হয়েছেন" },
  { key: "became_kormi", label: "কর্মী হয়েছেন" },
  { key: "became_rukon", label: "রুকন হয়েছেন" },
];

export const MEETING_CATEGORIES = [
  "কমিটি বৈঠক হয়েছে",
  "মুয়াল্লিমাদের নিয়ে বৈঠক",
  "Committee Orientation",
  "Muallima Orientation",
  "অন্যান্য",
];

export const EXTRA_CATEGORIES = [
  "মক্তব সংখ্যা",
  "মক্তব বৃদ্ধি",
  "মহানগরী পরিচালিত",
  "স্থানীয়ভাবে পরিচালিত",
  "মহানগরীর সফর",
  "থানা কমিটির সফর",
  "থানা প্রতিনিধির সফর",
  "ওয়ার্ড প্রতিনিধির সফর",
];

export function toBn(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "০";
  return String(n).replace(/\d/g, (d) => BENGALI_DIGITS[parseInt(d)]);
}

/** Convert Bengali digits (০-৯) to ASCII digits (0-9). */
export function bnToEn(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  return String(val).replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09E6));
}

/**
 * Parses numeric inputs in Bengali or English script from user typing or mobile voice-to-text.
 * Defends against Arabic commas (،), Arabic thousand separators (٬), fullwidth commas (，),
 * Unicode whitespace, and Bengali counting classifiers (e.g. জন, টি, খানা, etc.).
 * Clamps result to non-negative integer for PostgreSQL `CHECK (col >= 0)` constraints.
 */
export function parseBangladeshiNumber(val: unknown): { value: number; raw: string; isValid: boolean } {
  if (val === null || val === undefined || typeof val === "boolean") {
    return { value: 0, raw: "", isValid: false };
  }

  const raw = String(val);
  const normalized = raw.normalize("NFC").trim();
  if (normalized === "") {
    return { value: 0, raw, isValid: false };
  }

  const enConverted = bnToEn(normalized);
  const separatorsStripped = enConverted.replace(UNICODE_SEPARATOR_REGEX, "");
  const classifiersStripped = separatorsStripped.replace(/(জন|টি|টা|খানা|খানি|টিই|জনই|জনশক্তি|টি\s*করে)$/g, "");

  const match = classifiersStripped.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return { value: 0, raw, isValid: false };
  }

  const num = parseFloat(match[0]);
  if (!Number.isFinite(num)) {
    return { value: 0, raw, isValid: false };
  }

  const clamped = Math.max(0, Math.round(num));
  return { value: clamped, raw, isValid: true };
}

/**
 * Format a number or numeric string according to the selected language.
 * In Bengali ('bn'), converts ASCII digits to Bengali digits ('০'-'৯').
 * In English ('en'), converts Bengali digits to ASCII digits ('0'-'9').
 */
export function formatLocaleNumber(
  val: number | string | null | undefined,
  lang: Language = "bn"
): string {
  if (val === null || val === undefined || val === "") {
    return lang === "bn" ? "০" : "0";
  }
  return lang === "bn" ? toBn(val) : bnToEn(String(val));
}

/**
 * Returns localized Month and Year string according to the selected language.
 * e.g., formatMonthYear(8, 2026, 'bn') -> 'আগস্ট ২০২৬'
 *       formatMonthYear(8, 2026, 'en') -> 'August 2026'
 */
export function formatMonthYear(
  month: number,
  year: number,
  lang: Language = "bn"
): string {
  const m = Math.max(1, Math.min(12, Number(month) || 1));
  const monthName = translations[lang]?.months?.[m - 1] || `${month}`;
  const yearFormatted = formatLocaleNumber(year, lang);
  return `${monthName} ${yearFormatted}`;
}

export function getMonthsForPeriod(
  reportType: string,
  selectedMonth: number,
  endMonth?: number
): number[] {
  const dbType = DB_TYPE_MAP[reportType] || reportType;
  const m = Math.max(1, Math.min(12, Number(selectedMonth) || 1));

  switch (dbType) {
    case "ত্রৈমাসিক": {
      const quarter = Math.ceil(m / 3);
      const start = (quarter - 1) * 3 + 1;
      return [start, start + 1, start + 2];
    }
    case "ষান্মাসিক": {
      return m <= 6 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];
    }
    case "নয়-মাসিক":
      return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    case "বার্ষিক":
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    case "কাস্টম": {
      const start = m;
      const end = Math.max(start, Math.min(12, Number(endMonth) || start));
      const range: number[] = [];
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      return range;
    }
    default: // মাসিক
      return [m];
  }
}

/**
 * Returns the canonical month key for storing/retrieving city report overrides.
 * For monthly reports, returns the selected month.
 * For non-monthly reports, returns the period start month (monthsRange[0]),
 * ensuring overrides are naturally retrieved via `.in("month", getMonthsForPeriod(...))`.
 */
export function getOverrideMonthForPeriod(
  reportType: string,
  selectedMonth: number,
  endMonth?: number
): number {
  const months = getMonthsForPeriod(reportType, selectedMonth, endMonth);
  return months[0] || 1;
}

export interface PeriodConfig {
  type: string;
  dbType: string;
  year: number;
  startMonth: number;
  endMonth: number;
  months: number[];
  overrideMonth: number;
  labelBn: string;
  isMultiMonth: boolean;
  isFuture: boolean;
}

export function resolvePeriodConfig(input: {
  type?: string | null;
  report_type?: string | null;
  month?: number | string | null;
  quarter?: number | string | null;
  half?: number | string | null;
  startMonth?: number | string | null;
  endMonth?: number | string | null;
  year?: number | string | null;
  currentDhakaDate?: { month: number; year: number };
}): PeriodConfig {
  const rawType = input.type || input.report_type || "monthly";
  const englishType = URL_TO_ENGLISH_MAP[rawType] || rawType || "monthly";
  const dbType = DB_TYPE_MAP[rawType] || "মাসিক";

  const dhaka = input.currentDhakaDate || getDhakaDate();
  const year = input.year ? Number(input.year) : dhaka.year;

  let startMonth = 1;
  let endMonth = 1;

  if (englishType === "monthly") {
    startMonth = input.month ? Number(input.month) : dhaka.month;
    endMonth = startMonth;
  } else if (englishType === "quarterly") {
    let q = 1;
    if (input.quarter) {
      q = Math.max(1, Math.min(4, Number(input.quarter)));
    } else if (input.month) {
      q = Math.ceil(Math.max(1, Math.min(12, Number(input.month))) / 3);
    }
    startMonth = (q - 1) * 3 + 1;
    endMonth = startMonth + 2;
  } else if (englishType === "halfYearly") {
    let h = 1;
    if (input.half) {
      h = Math.max(1, Math.min(2, Number(input.half)));
    } else if (input.month) {
      h = Number(input.month) <= 6 ? 1 : 2;
    }
    startMonth = h === 2 ? 7 : 1;
    endMonth = h === 2 ? 12 : 6;
  } else if (englishType === "nineMonth") {
    startMonth = 1;
    endMonth = 9;
  } else if (englishType === "yearly") {
    startMonth = 1;
    endMonth = 12;
  } else if (englishType === "custom") {
    startMonth = Math.max(1, Math.min(12, Number(input.startMonth || input.month || 1)));
    endMonth = Math.max(startMonth, Math.min(12, Number(input.endMonth || startMonth)));
  }

  const months = getMonthsForPeriod(englishType, startMonth, endMonth);
  const overrideMonth = months[0] || 1;
  const isMultiMonth = months.length > 1;

  // Start-Month Future Lockout rule: Period is in the future ONLY IF its startMonth has not occurred yet
  const isFuture =
    year > dhaka.year || (year === dhaka.year && startMonth > dhaka.month);

  // Bengali Period Label
  let labelBn = "";
  if (!isMultiMonth) {
    labelBn = `${MONTHS_BN[startMonth - 1]} ${toBn(year)}`;
  } else if (englishType === "quarterly") {
    const q = Math.ceil(startMonth / 3);
    const qBn = ["১ম", "২য়", "৩য়", "৪র্থ"][q - 1];
    labelBn = `${qBn} ত্রৈমাসিক (${MONTHS_BN[startMonth - 1]} – ${MONTHS_BN[endMonth - 1]} ${toBn(year)})`;
  } else if (englishType === "halfYearly") {
    const h = startMonth <= 6 ? "১ম" : "২য়";
    labelBn = `${h} ষান্মাসিক (${MONTHS_BN[startMonth - 1]} – ${MONTHS_BN[endMonth - 1]} ${toBn(year)})`;
  } else if (englishType === "nineMonth") {
    labelBn = `নয়-মাসিক (জানুয়ারি – সেপ্টেম্বর ${toBn(year)})`;
  } else if (englishType === "yearly") {
    labelBn = `বার্ষিক (জানুয়ারি – ডিসেম্বর ${toBn(year)})`;
  } else {
    labelBn = `কাস্টম (${MONTHS_BN[startMonth - 1]} – ${MONTHS_BN[endMonth - 1]} ${toBn(year)})`;
  }

  return {
    type: englishType,
    dbType,
    year,
    startMonth,
    endMonth,
    months,
    overrideMonth,
    labelBn,
    isMultiMonth,
    isFuture,
  };
}

export function toFiniteNumber(val: unknown): number {
  if (typeof val === "boolean" || val === null || val === undefined) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val === "string") {
    const cleaned = val.normalize("NFC").replace(UNICODE_SEPARATOR_REGEX, "");
    const en = bnToEn(cleaned);
    if (en === "") return 0;
    const num = Number(en);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

export const NON_NUMERIC_KEYS = new Set([
  "category",
  "meeting_name",
  "comments",
  "id",
  "report_id",
  "created_at",
  "updated_at",
  "month",
  "year",
  "report_type",
  "is_submitted",
]);

const ATTENDANCE_WEIGHT_PAIRS: Record<string, string> = {
  city_avg_attendance: "city_count",
  thana_avg_attendance: "thana_count",
  ward_avg_attendance: "ward_count",
};

export function sumRows<T>(
  rows: T[],
  numericKeys: string[]
): T[] {
  const grouped = new Map<string, T>();
  const weights = new Map<string, Record<string, { totalAttendees: number; totalCount: number; reportCount: number; sumAvg: number }>>();

  const isAvgKey = (key: string) => key in ATTENDANCE_WEIGHT_PAIRS;

  for (const row of rows) {
    const cat = ((row as any).category as string) || "__header__";

    if (!grouped.has(cat)) {
      const initial = { ...row } as any;
      for (const k of numericKeys) {
        if (!isAvgKey(k) && !NON_NUMERIC_KEYS.has(k)) {
          initial[k] = toFiniteNumber(initial[k]);
        }
      }
      grouped.set(cat, initial);
      weights.set(cat, {});
    } else {
      const existing = grouped.get(cat)!;

      // Sum standard numeric keys (non-averages)
      for (const k of numericKeys) {
        if (!isAvgKey(k) && !NON_NUMERIC_KEYS.has(k)) {
          (existing as any)[k] =
            toFiniteNumber((existing as any)[k]) + toFiniteNumber((row as any)[k]);
        }
      }

      if ((row as any).meeting_name && String((row as any).meeting_name).trim() !== "") {
        const existingNames = ((existing as any).meeting_name || "")
          .split(/\r?\n|,\s*/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        const newNames = String((row as any).meeting_name)
          .split(/\r?\n|,\s*/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...existingNames, ...newNames]));
        (existing as any).meeting_name = merged.join(", ");
      }
      if (
        (row as any).comments &&
        String((row as any).comments).trim() !== "" &&
        String((row as any).comments).trim() !== "—"
      ) {
        const existingComments = ((existing as any).comments || "")
          .split(/\r?\n|,\s*/)
          .map((s: string) => s.trim())
          .filter((s: string) => s && s !== "—");
        const newComments = String((row as any).comments)
          .split(/\r?\n|,\s*/)
          .map((s: string) => s.trim())
          .filter((s: string) => s && s !== "—");
        const merged = Array.from(new Set([...existingComments, ...newComments]));
        (existing as any).comments = merged.join(", ");
      }
    }

    // Accumulate weighted attendance for average keys
    const catWeights = weights.get(cat)!;
    for (const k of numericKeys) {
      if (isAvgKey(k)) {
        if (!catWeights[k]) {
          catWeights[k] = { totalAttendees: 0, totalCount: 0, reportCount: 0, sumAvg: 0 };
        }
        const countKey = ATTENDANCE_WEIGHT_PAIRS[k];
        const count = toFiniteNumber((row as any)[countKey]);
        const avg = toFiniteNumber((row as any)[k]);

        if (count > 0) {
          catWeights[k].totalAttendees += count * avg;
          catWeights[k].totalCount += count;
        }
        if (avg > 0) {
          catWeights[k].reportCount += 1;
          catWeights[k].sumAvg += avg;
        }
      }
    }
  }

  // Calculate final weighted averages for all groups
  grouped.forEach((row, cat) => {
    const catWeights = weights.get(cat);
    if (!catWeights) return;

    for (const k of numericKeys) {
      if (isAvgKey(k)) {
        const stats = catWeights[k];
        if (stats && stats.totalCount > 0) {
          (row as any)[k] = Math.round(stats.totalAttendees / stats.totalCount);
        } else if (stats && stats.reportCount > 0) {
          (row as any)[k] = Math.round(stats.sumAvg / stats.reportCount);
        } else {
          (row as any)[k] = 0;
        }
      }
    }
  });

  return Array.from(grouped.values());
}

const HEADER_SNAPSHOT_KEYS = [
  "total_muallima",
  "certified_muallima",
  "certified_muallima_taking_classes",
  "trained_muallima",
  "trained_muallima_taking_classes",
  "total_unit",
  "units_with_muallima",
];

const HEADER_DELTA_KEYS = [
  "muallima_increase",
  "muallima_decrease",
];

export function sumHeaderRows<T extends Record<string, any>>(rows: T[]): T | null {
  if (!rows || rows.length === 0) return null;
  if (rows.length === 1) return { ...rows[0] };

  // Sort rows chronologically if month is available to capture the latest inventory snapshot
  const sorted = [...rows].sort((a, b) => Number(a.month) - Number(b.month));
  const latest = sorted[sorted.length - 1];

  const base = { ...latest } as any;

  // Flow deltas: sum across the multi-month period
  for (const k of HEADER_DELTA_KEYS) {
    base[k] = sorted.reduce((sum, r) => sum + toFiniteNumber(r[k]), 0);
  }

  // Stock snapshots: take the latest month's stock value
  for (const k of HEADER_SNAPSHOT_KEYS) {
    base[k] = toFiniteNumber(latest[k]);
  }

  return base as T;
}
