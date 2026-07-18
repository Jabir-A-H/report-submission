export const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const MONTHS_BN = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
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
  { value: "nineMonth", label: "নয়-মাসিক" },
  { value: "yearly", label: "বার্ষিক" },
];

export const DB_TYPE_MAP: Record<string, string> = {
  monthly: "মাসিক",
  quarterly: "ত্রৈমাসিক",
  halfYearly: "ষান্মাসিক",
  nineMonth: "নয়-মাসিক",
  yearly: "বার্ষিক",
  "মাসিক": "মাসিক",
  "ত্রৈমাসিক": "ত্রৈমাসিক",
  "ষান্মাসিক": "ষান্মাসিক",
  "নয়-মাসিক": "নয়-মাসিক",
  "বার্ষিক": "বার্ষিক",
};

export const URL_TO_ENGLISH_MAP: Record<string, string> = {
  "মাসিক": "monthly",
  "ত্রৈমাসিক": "quarterly",
  "ষান্মাসিক": "halfYearly",
  "নয়-মাসিক": "nineMonth",
  "বার্ষিক": "yearly",
  monthly: "monthly",
  quarterly: "quarterly",
  halfYearly: "halfYearly",
  nineMonth: "nineMonth",
  yearly: "yearly",
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
  "দাওয়াত দান",
  "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন",
  "সহযোগী হয়েছেন",
  "সম্মতি দিয়েছেন",
  "সক্রিয় সহযোগী",
  "কর্মী",
  "রুকন",
  "দাওয়াতী ইউনিট",
  "ইউনিট",
  "সুধী",
  "এককালীন",
  "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি",
  "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতজন",
  "বই বিলি",
  "বই বিক্রি",
];

export const PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"];

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
  "কমিটি বৈঠক হয়েছে",
  "মুয়াল্লিমাদের নিয়ে বৈঠক",
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

export function getMonthsForPeriod(
  reportType: string,
  selectedMonth: number
): number[] {
  const dbType = DB_TYPE_MAP[reportType] || reportType;
  switch (dbType) {
    case "ত্রৈমাসিক":
      return [1, 2, 3];
    case "ষান্মাসিক":
      return [1, 2, 3, 4, 5, 6];
    case "নয়-মাসিক":
      return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    case "বার্ষিক":
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    default: // মাসিক
      return [selectedMonth];
  }
}

export function sumRows<T>(
  rows: T[],
  numericKeys: string[]
): T[] {
  const grouped = new Map<string, T>();
  for (const row of rows) {
    const cat = ((row as any).category as string) || "__header__";
    if (!grouped.has(cat)) {
      grouped.set(cat, { ...row });
    } else {
      const existing = grouped.get(cat)!;
      for (const k of numericKeys) {
        (existing as any)[k] =
          ((existing as any)[k] || 0) + ((row as any)[k] || 0);
      }
      if ((row as any).meeting_name && (row as any).meeting_name.trim() !== "") {
        if (!((existing as any).meeting_name || "").includes((row as any).meeting_name.trim())) {
          (existing as any).meeting_name = [(existing as any).meeting_name, (row as any).meeting_name.trim()].filter(Boolean).join(", ");
        }
      }
      if ((row as any).comments && (row as any).comments.trim() !== "" && (row as any).comments.trim() !== "—") {
        if (!((existing as any).comments || "").includes((row as any).comments.trim())) {
          (existing as any).comments = [(existing as any).comments, (row as any).comments.trim()].filter(Boolean).join(", ");
        }
      }
    }
  }
  return Array.from(grouped.values());
}

export function sumHeaderRows<T extends Record<string, any>>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  // TODO: Yearly snapshots (total_muallima, total_unit, etc.) should not be summed across months.
  // Instead, they should take the most recent month's value, while increase/decrease are summed.
  // This is deferred for future refactoring.
  const base = { ...rows[0] } as any;
  const numericKeys = [
    "total_muallima",
    "muallima_increase",
    "muallima_decrease",
    "certified_muallima",
    "certified_muallima_taking_classes",
    "trained_muallima",
    "trained_muallima_taking_classes",
    "total_unit",
    "units_with_muallima",
  ];
  for (let i = 1; i < rows.length; i++) {
    for (const k of numericKeys) {
      if (k in rows[i]) {
        base[k] = (base[k] || 0) + ((rows[i] as any)[k] || 0);
      }
    }
  }
  return base as T;
}
