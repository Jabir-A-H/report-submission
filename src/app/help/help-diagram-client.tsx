"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { AppearanceFooterToggle } from "@/components/layout/appearance-footer-toggle";
import {
  UserPlus,
  Calendar,
  FileEdit,
  Download,
  ShieldCheck,
  LayoutDashboard,
  Users,
  FileCheck,
  TrendingUp,
  Printer,
  Sparkles,
  Compass,
  HelpCircle,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

// ─── Step Interface ─────────────────────────────────────────────────────────

interface StepItem {
  id: string;
  stepBn: string;
  stepEn: string;
  shortLabelBn: string;
  shortLabelEn: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  icon: typeof UserPlus;
  actionLink: {
    href: string;
    labelBn: string;
    labelEn: string;
  };
  pointsBn: string[];
  pointsEn: string[];
  qaBn: {
    q: string;
    a: string;
  };
  qaEn: {
    q: string;
    a: string;
  };
  cautionBn?: string;
  cautionEn?: string;
}

// ─── User Steps (Accurate 4 Steps) ──────────────────────────────────────────

const USER_STEPS: StepItem[] = [
  {
    id: "user-step-1",
    stepBn: "০১",
    stepEn: "01",
    shortLabelBn: "সাইন আপ",
    shortLabelEn: "Sign Up",
    titleBn: "সাইন আপ ও অনুমোদন",
    titleEn: "Register and get approved",
    descBn: "নিজের তথ্য দিয়ে অ্যাকাউন্ট খুলুন। ইমেইল যাচাই ও অ্যাডমিনের অনুমোদন শেষ হলে লগ-ইন করতে পারবেন।",
    descEn: "Create an account with your details. You can log in once your email is verified and an admin approves you.",
    icon: UserPlus,
    actionLink: {
      href: "/home?mode=register",
      labelBn: "নিবন্ধন পেজে যান",
      labelEn: "Go to Sign Up",
    },
    pointsBn: [
      "সাইন আপ ফর্মে আপনার পূর্ণ নাম, ইউজার আইডি, ইমেইল ও পাসওয়ার্ড (দুইবার) দিন এবং তালিকা থেকে আপনার জোন বেছে নিন। Google অ্যাকাউন্ট থাকলে “Google দিয়ে সাইন-ইন” ব্যবহার করতে পারেন।",
      "“সাইন আপ করুন” চাপুন। এরপর ইমেইলে আসা যাচাই লিংকে ক্লিক করুন। ইমেইল না পেলে স্প্যাম ফোল্ডার দেখুন।",
      "অনুমোদনের অপেক্ষার পর্দা দেখা যাবে। কেন্দ্রীয় অ্যাডমিন অনুমোদন দিলে আপনি সরাসরি লগ-ইন করতে পারবেন।",
    ],
    pointsEn: [
      "On the sign-up form enter your name, user ID, email and password (twice), and pick your zone from the list. (Or use Google Sign-In if using a Google account).",
      "Tap “সাইন আপ করুন” (Sign up). Then open the verification link sent to your email. If it does not arrive, check your spam folder.",
      "You will see the waiting-for-approval screen. You can log in once an admin approves your account.",
    ],
    qaBn: {
      q: "সাইন আপের পরেই কেন লগ-ইন করা যায় না?",
      a: "দুটি কাজ বাকি থাকে: আপনার ইমেইল যাচাই এবং অ্যাডমিনের অনুমোদন। দুটোই শেষ হলে লগ-ইন করতে পারবেন। দেরি হলে আপনার জোন প্রতিনিধি বা অ্যাডমিনকে জানান।",
    },
    qaEn: {
      q: "Why can't I log in right after registering?",
      a: "Two things are still pending: verifying your email and the admin's approval. When both are done you can log in. If it takes long, tell your zone representative or the admin.",
    },
  },
  {
    id: "user-step-2",
    stepBn: "০২",
    stepEn: "02",
    shortLabelBn: "মাস নির্বাচন",
    shortLabelEn: "Choose Month",
    titleBn: "লগ-ইন ও মাস নির্বাচন",
    titleEn: "Log in and choose the month",
    descBn: "ইউজার আইডি বা ইমেইল ও পাসওয়ার্ড দিয়ে লগ-ইন করুন, তারপর মাস ও বছর বেছে নিন।",
    descEn: "Log in with your user ID or email and password, then pick the month and year.",
    icon: Calendar,
    actionLink: {
      href: "/",
      labelBn: "ড্যাশবোর্ডে যান",
      labelEn: "Go to Dashboard",
    },
    pointsBn: [
      "লগ-ইন পেজে ইউজার আইডি (অথবা ইমেইল) ও পাসওয়ার্ড দিন। আইডি যেভাবে সাইন আপ করেছিলেন ঠিক সেভাবে লিখুন। ফোনের কিবোর্ড প্রথম অক্ষর বড় হাতের করে দিলে বা শেষে ফাঁকা (স্পেস) যোগ করলে লগ-ইন হবে না।",
      "“মাস” ও “বছর” বেছে নিয়ে “যান” চাপুন।",
      "সাতটি সেকশনের কার্ড দেখা যাবে। যে সেকশন পূরণ করবেন তার “সম্পাদনা করুন” চাপুন। মাস বদলাতে চাইলে উপরের সংক্ষিপ্ত মাস-বছরের পিলটিতে ট্যাপ করে পুনরায় মাস বেছে নিন।",
    ],
    pointsEn: [
      "On the login page enter your user ID (or email) and password. Type the ID exactly as you registered it. If your phone keyboard capitalises the first letter or adds a trailing space, the login will fail.",
      "Pick the “মাস” (Month) and “বছর” (Year), then tap “যান” (Go).",
      "The seven section cards appear. Tap “সম্পাদনা করুন” (Edit) on the section you want to fill. To change the month, tap the compact month-year pill at the top.",
    ],
    qaBn: {
      q: "ভুল মাস বেছে ফেললে কী করবেন?",
      a: "সঠিক মাস বেছে আবার “যান” চাপুন। প্রতিটি মাসের তথ্য আলাদা থাকে, তাই আগের মাসের তথ্য যেমন ছিল তেমনই থাকবে। ভবিষ্যতের মাস বেছে নিলে “ভবিষ্যতের সময়ের জন্য রিপোর্ট তৈরি বা পরিবর্তন করা সম্ভব নয়।” বার্তা আসবে।",
    },
    qaEn: {
      q: "What if I picked the wrong month?",
      a: "Pick the correct month and tap “যান” again. Each month's data is kept separately, so the earlier month stays as it was. If you pick a future month you will see a notice that reports cannot be created for a future period.",
    },
  },
  {
    id: "user-step-3",
    stepBn: "০৩",
    stepEn: "03",
    shortLabelBn: "তথ্য পূরণ",
    shortLabelEn: "Fill Form",
    titleBn: "সাতটি সেকশন পূরণ ও স্বয়ংক্রিয় সংরক্ষণ",
    titleEn: "Fill the seven sections and rely on auto-save",
    descBn: "প্রতিটি সেকশনের ঘর পূরণ করুন। সাইট আপনার দেওয়া তথ্য নিজে থেকে সংরক্ষণ করে রাখে। সংরক্ষিত তথ্য আপনি যেকোনো সময় আবার খুলে বদলাতে পারবেন।",
    descEn: "Fill in each section. The site saves what you enter on its own. You can reopen and change saved data at any time.",
    icon: FileEdit,
    actionLink: {
      href: "/report/header",
      labelBn: "ফরম পূরণে যান",
      labelEn: "Go to Form Entry",
    },
    pointsBn: [
      "পরের সেকশনে যেতে নিচের ডানদিকের বোতাম চাপুন (তাতে পরের সেকশনের নাম লেখা থাকে)। আগের সেকশনে ফিরতে বামদিকের বোতাম চাপুন। ড্যাশবোর্ডে ফিরতে উপরের বাম কোণের তীর (← ড্যাশবোর্ড) চাপুন।",
      "তথ্য লেখা শেষ হলে অন্য ঘরে বা ফাঁকা জায়গায় ট্যাপ করুন; উপরে শিরোনামের নিচে “সংরক্ষিত” লেখা দেখতে পাবেন। আলাদা কোনো সেভ বোতাম নেই।",
      "সেকশনগুলো ক্রমানুসারে: মূল তথ্য, গ্রুপ / কোর্স রিপোর্ট, দাওয়াত ও সংগঠন, ব্যক্তিগত উদ্যোগে তালিমুল কুরআন, বৈঠকসমূহ, মক্তব ও সফর রিপোর্ট, মন্তব্য রিপোর্ট।",
      "সব সেকশন পূরণ শেষ হলে শেষ সেকশন “মন্তব্য রিপোর্ট”-এ গিয়ে “রিপোর্ট জমা সম্পন্ন হয়েছে” বক্সে টিক দিন। এতে অ্যাডমিন জানতে পারবেন আপনার রিপোর্ট প্রস্তুত। তবে পরেও আপনি যেকোনো সময় এটি পুনরায় সম্পাদনা করতে পারবেন।",
    ],
    pointsEn: [
      "To go to the next section, tap the button at the bottom right (it shows the next section's name). To go back, tap the button on the left. To return to the dashboard, tap the arrow (← ড্যাশবোর্ড) at the top left.",
      "When you finish typing, tap another field or blank area; you will see “সংরক্ষিত” (Saved) centered below the section title. There is no manual save button.",
      "The sections in order: Header, Courses, Org, Personal, Meetings, Safar, and Remarks.",
      "When finished, open the final section (“মন্তব্য রিপোর্ট”) and tick the “রিপোর্ট জমা সম্পন্ন হয়েছে” (Report submission complete) box. This signals the admin that your report is ready, but you can still edit it anytime.",
    ],
    qaBn: {
      q: "লাল “আবার চেষ্টা করুন” দেখালে কী করবেন?",
      a: "ইন্টারনেট সংযোগ ঠিক আছে কিনা দেখুন, তারপর “আবার চেষ্টা করুন” চাপুন। “সংরক্ষিত” না দেখা পর্যন্ত পেজ বন্ধ করবেন না। যে ঘরগুলো আগেই “সংরক্ষিত” দেখিয়েছে সেগুলো অক্ষত থাকে।",
    },
    qaEn: {
      q: "What should I do if a red “আবার চেষ্টা করুন” (Try again) appears?",
      a: "Check that your internet connection works, then tap “আবার চেষ্টা করুন”. Do not close the page until “সংরক্ষিত” shows. Boxes that already showed “সংরক্ষিত” are safely kept.",
    },
  },
  {
    id: "user-step-4",
    stepBn: "০৪",
    stepEn: "04",
    shortLabelBn: "PDF ডাউনলোড",
    shortLabelEn: "Download PDF",
    titleBn: "PDF ডাউনলোড ও শেয়ার",
    titleEn: "Download PDF and share",
    descBn: "আপনার রিপোর্ট ২ পাতার ল্যান্ডস্কেপ PDF ফাইলে নামিয়ে নিন, তারপর প্রিন্ট করুন বা WhatsApp-এ শেয়ার করুন।",
    descEn: "Save your report as a 2-page landscape PDF, then print it or share it on WhatsApp.",
    icon: Download,
    actionLink: {
      href: "/report",
      labelBn: "রিপোর্ট পেজে যান",
      labelEn: "Go to Report",
    },
    pointsBn: [
      "নিচের মেনু থেকে “রিপোর্ট” ট্যাব খুলুন।",
      "উপরে ডানে “ডাউনলোড” বোতামে চাপ দিয়ে “পিডিএফ ডাউনলোড” বেছে নিন।",
      "PDF প্রিন্ট করতে প্রিন্টার সেটিংসে কাগজ A4 ও ল্যান্ডস্কেপ (আড়াআড়ি) বেছে নিন, স্কেল “Fit to Page” বা ১০০% রাখুন।",
    ],
    pointsEn: [
      "Open the “রিপোর্ট” (Report) tab from the bottom menu.",
      "Tap the “ডাউনলোড” (Download) button at the top-right and select “পিডিএফ ডাউনলোড” (Download PDF).",
      "To print the PDF, choose A4 paper, landscape orientation, and scaling “Fit to Page” or 100%.",
    ],
    qaBn: {
      q: "ফোন থেকে কীভাবে প্রিন্ট বা শেয়ার করবেন?",
      a: "ডাউনলোড করা PDF ফোনের Downloads ফোল্ডারে থাকে। WhatsApp-এ পাঠাতে ফাইলটি চ্যাটে অ্যাটাচ করে পাঠান। প্রিন্ট করতে ফাইলটি প্রিন্টার বা কম্পিউটারের দোকানে পাঠিয়ে A4 ল্যান্ডস্কেপ প্রিন্ট করতে বলুন।",
    },
    qaEn: {
      q: "How do I print or share from my phone?",
      a: "The downloaded PDF is in your phone's Downloads folder. To share it on WhatsApp, attach the file in a chat. To print, send it to a printer or a computer shop and ask for A4 landscape.",
    },
  },
];

// ─── Admin Steps (Accurate 5 Steps) ─────────────────────────────────────────

const ADMIN_STEPS: StepItem[] = [
  {
    id: "admin-step-1",
    stepBn: "০১",
    stepEn: "01",
    shortLabelBn: "ড্যাশবোর্ড",
    shortLabelEn: "Dashboard",
    titleBn: "ড্যাশবোর্ডে চলতি মাসের অগ্রগতি",
    titleEn: "Check this month’s progress on the dashboard",
    descBn: "কোন জোন রিপোর্ট জমা চিহ্নিত করেছে আর কোনগুলো বাকি, তা একনজরে দেখুন।",
    descEn: "See at a glance which zones have marked their report as submitted and which are still pending.",
    icon: LayoutDashboard,
    actionLink: {
      href: "/dashboard",
      labelBn: "ড্যাশবোর্ডে যান",
      labelEn: "Go to Dashboard",
    },
    pointsBn: [
      "ড্যাশবোর্ডে মোট জোন, “জমাকৃত”, অপেক্ষমাণ জোন ও শতকরা হার দেখুন।",
      "জোনের তালিকায় কারা জমাকৃত আর কারা অপেক্ষমাণ তা মিলিয়ে নিন।",
      "অপেক্ষমাণ জোনের প্রতিনিধিকে ফোন বা WhatsApp-এ জানান। ড্যাশবোর্ড থেকে স্বয়ংক্রিয় বার্তা পাঠানোর সুবিধা নেই।",
    ],
    pointsEn: [
      "On the dashboard, read the total zones, “জমাকৃত” (submitted), pending zones and the percentage.",
      "In the zone list, check who is submitted and who is pending.",
      "Contact pending zone representatives by phone or WhatsApp. The dashboard cannot send messages.",
    ],
    qaBn: {
      q: "আগের মাসের অবস্থা কোথায় দেখব?",
      a: "ড্যাশবোর্ডে শুধু চলতি মাস দেখায়। আগের মাসের রিপোর্ট দেখতে রিপোর্ট তালিকার পেজে মাস ও বছর বেছে নিন। মনে রাখবেন, “জমাকৃত” মানে জোন নিজে বক্সে টিক দিয়েছে। সব সেকশনে তথ্য আছে কিনা, ড্যাশবোর্ড তা যাচাই করে না।",
    },
    qaEn: {
      q: "Where can I see earlier months?",
      a: "The dashboard shows only the current month. To see an earlier month's reports, open the reports list page and pick the month and year. Remember that “submitted” means the zone ticked the box itself.",
    },
  },
  {
    id: "admin-step-2",
    stepBn: "০২",
    stepEn: "02",
    shortLabelBn: "ইউজার অনুমোদন",
    shortLabelEn: "Approvals",
    titleBn: "ব্যবহারকারী অনুমোদন ও ব্যবস্থাপনা",
    titleEn: "Approve and manage users",
    descBn: "নতুন নিবন্ধনকারীদের অনুমোদন দিন এবং প্রয়োজনে জোন বদলান বা অ্যাকাউন্ট বন্ধ করুন।",
    descEn: "Approve new sign-ups, and change a zone or switch off an account when needed.",
    icon: Users,
    actionLink: {
      href: "/management",
      labelBn: "ব্যবস্থাপনায় যান",
      labelEn: "Go to Management",
    },
    pointsBn: [
      "ব্যবস্থাপনা পেজে স্ট্যাটাস ফিল্টার থেকে “অপেক্ষমাণ” বেছে নতুন আবেদনগুলো দেখুন।",
      "আবেদনকারীকে চিনতে পারলে “অনুমোদন করুন” চাপুন। এরপর তিনি লগ-ইন করতে পারবেন।",
      "কারও অ্যাকাউন্ট সাময়িক বন্ধ করতে “নিষ্ক্রিয় করুন” চাপুন। ভুল জোন বেছে থাকলে তার জোন বদলে দিন।",
    ],
    pointsEn: [
      "On the management page choose “অপেক্ষমাণ” (Pending) in the status filter to see new applications.",
      "If you recognise the applicant, tap “অনুমোদন করুন” (Approve). They can then log in.",
      "To switch an account off for now, tap “নিষ্ক্রিয় করুন” (Deactivate). If someone picked the wrong zone, change their zone.",
    ],
    qaBn: {
      q: "অপরিচিত কেউ নিবন্ধন করলে কী করব?",
      a: "অনুমোদন না দিলে তিনি ঢুকতে পারবেন না। তালিকা থেকে একেবারে সরাতে লাল ট্র্যাশ আইকন “মুছে ফেলুন” চাপুন, তারপর নিশ্চিত করুন। এটি স্থায়ীভাবে মুছে যায়।",
    },
    qaEn: {
      q: "What if a stranger registers?",
      a: "They cannot get in unless you approve them. To remove them from the list entirely, tap the red trash icon “মুছে ফেলুন” and confirm. This deletes them permanently.",
    },
    cautionBn: "মাসের মাঝখানে কারও জোন বদলালে সেই মাসে আগের জোনে ভরা তথ্য নতুন জোনে যায় না, কারণ রিপোর্টগুলো জোনের অধীনে থাকে। তাই বদলানোর আগে ব্যবহারকারীকে জানিয়ে নিন।",
    cautionEn: "If you change someone’s zone in the middle of a month, data already entered for that month under the old zone does not move to the new zone. Inform the user beforehand.",
  },
  {
    id: "admin-step-3",
    stepBn: "০৩",
    stepEn: "03",
    shortLabelBn: "জোন রিপোর্ট",
    shortLabelEn: "Zone Reports",
    titleBn: "জোনের রিপোর্ট পর্যালোচনা",
    titleEn: "Review zone reports",
    descBn: "যেকোনো মাসের জোনভিত্তিক রিপোর্ট খুলে দেখুন।",
    descEn: "Open any month’s zone-wise reports.",
    icon: FileCheck,
    actionLink: {
      href: "/reports",
      labelBn: "রিপোর্ট তালিকায় যান",
      labelEn: "Go to Reports List",
    },
    pointsBn: [
      "মেনু থেকে সব জোনের রিপোর্টের তালিকা খুলুন।",
      "মাস, বছর ও রিপোর্টের ধরন বেছে নিয়ে ফিল্টার করুন এবং কাঙ্ক্ষিত জোনের রিপোর্ট খুলুন।",
      "কোনো জোনের তথ্যে ভুল দেখলে সেই জোনকে জানান। সমষ্টিগত সংখ্যা ঠিক করতে হলে সিটি রিপোর্টে ওভাররাইড করুন।",
    ],
    pointsEn: [
      "Open the list of all zones’ reports from the menu.",
      "Filter by month, year and report type, then open the zone’s report.",
      "If a zone’s data looks wrong, tell that zone. To fix the combined figures, use an override in the city report.",
    ],
    qaBn: {
      q: "তালিকায় থাকা মানেই কি রিপোর্ট জমা হয়েছে?",
      a: "নিশ্চিত নয়। জমা হয়েছে কিনা দেখতে ড্যাশবোর্ডের “জমাকৃত” তালিকা দেখুন।",
    },
    qaEn: {
      q: "Does being in the list mean the report was submitted?",
      a: "Not necessarily. Check the dashboard’s submitted list to see whether it was marked as submitted.",
    },
  },
  {
    id: "admin-step-4",
    stepBn: "০৪",
    stepEn: "04",
    shortLabelBn: "সিটি ওভাররাইড",
    shortLabelEn: "Overrides",
    titleBn: "সিটি রিপোর্টে সংখ্যা সংশোধন (ওভাররাইড)",
    titleEn: "Correct figures in the city report (override)",
    descBn: "জোনগুলোর যোগফল থেকে তৈরি সিটি রিপোর্টের কোনো ঘরের সংখ্যা প্রয়োজনে নিজে ঠিক করে দিন।",
    descEn: "The city report is built from the zones’ totals. Fix a cell’s number yourself when needed.",
    icon: TrendingUp,
    actionLink: {
      href: "/city-report",
      labelBn: "সিটি রিপোর্টে যান",
      labelEn: "Go to City Report",
    },
    pointsBn: [
      "সিটি রিপোর্ট খুলে রিপোর্টের ধরন, মাস ও বছর বেছে নিন।",
      "“⚡ এডিট মোড” চালু করুন, যে ঘরের সংখ্যা বদলাতে চান তাতে চাপুন, নতুন সংখ্যা লিখে নিশ্চিত করুন।",
      "মূল যোগফলে ফিরে যেতে ওভাররাইড করা ঘরের “মুছুন” বোতাম চাপুন এবং নিশ্চিত করুন।",
    ],
    pointsEn: [
      "Open the city report and choose the report type, month and year.",
      "Turn on “⚡ এডিট মোড” (Edit Mode), tap the cell you want to change, type the new number and confirm.",
      "To go back to the original total, tap “মুছুন” (Delete) on the overridden cell and confirm.",
    ],
    qaBn: {
      q: "ওভাররাইড করার পর জোন তথ্য বদলালে কী হবে?",
      a: "ওভাররাইড করা ঘরের সংখ্যা স্থির থাকে। জোন পরে তথ্য সংশোধন করলে সেই ঘর নিজে থেকে বদলায় না। তাই জোনের সংশোধনের পর ওভাররাইড করা ঘরগুলো আবার দেখে নিন।",
    },
    qaEn: {
      q: "What happens if a zone corrects its data after I override?",
      a: "An overridden cell stays at the number you set. If a zone corrects its data later, that cell does not change by itself. Re-check your overridden cells after any zone correction.",
    },
  },
  {
    id: "admin-step-5",
    stepBn: "০৫",
    stepEn: "05",
    shortLabelBn: "এক্সপোর্ট",
    shortLabelEn: "Export",
    titleBn: "সিটি রিপোর্ট PDF ও Excel",
    titleEn: "City report PDF and Excel",
    descBn: "সংশোধনসহ চূড়ান্ত সিটি রিপোর্ট ফাইলে নামিয়ে নিন।",
    descEn: "Save the final city report, including your corrections, as a file.",
    icon: Printer,
    actionLink: {
      href: "/city-report",
      labelBn: "এক্সপোর্টে যান",
      labelEn: "Go to Export",
    },
    pointsBn: [
      "সিটি রিপোর্টে সঠিক ধরন, মাস ও বছর বেছে নিন এবং ওভাররাইডগুলো একবার দেখে নিন।",
      "“পিডিএফ ডাউনলোড” বা “এক্সেল ডাউনলোড” বোতাম চাপুন।",
      "PDF প্রিন্ট করতে A4 ল্যান্ডস্কেপ বেছে নিন।",
    ],
    pointsEn: [
      "In the city report choose the right type, month and year, and check your overrides once.",
      "Tap “পিডিএফ ডাউনলোড” (PDF download) or “এক্সেল ডাউনলোড” (Excel download).",
      "To print the PDF, choose A4 landscape.",
    ],
    qaBn: {
      q: "ওভাররাইড করা সংখ্যা কি ফাইলে আসবে?",
      a: "হ্যাঁ। ফাইলে ওভাররাইড করা সংখ্যাই দেখাবে।",
    },
    qaEn: {
      q: "Do overridden numbers appear in the file?",
      a: "Yes. The file shows the overridden numbers.",
    },
  },
];

// ─── Common Problems Data ───────────────────────────────────────────────────

interface CommonProblem {
  qBn: string;
  qEn: string;
  aBn: string;
  aEn: string;
}

const COMMON_PROBLEMS: CommonProblem[] = [
  {
    qBn: "লগ-ইন করতে পারছি না।",
    qEn: "I can’t log in.",
    aBn: "ইউজার আইডি বা ইমেইল ও পাসওয়ার্ড ঠিক আছে কিনা দেখুন। ফোনের কিবোর্ড প্রথম অক্ষর বড় হাতের করে দিলে বা শেষে ফাঁকা (স্পেস) যোগ করলে লগ-ইন হয় না। ইমেইল যাচাই বা অ্যাডমিনের অনুমোদন বাকি থাকলেও ঢোকা যায় না।",
    aEn: "Check the user ID or email and the password. If the keyboard capitalises the first letter or adds a trailing space, the login fails. You also cannot get in while email verification or admin approval is pending.",
  },
  {
    qBn: "যাচাই ইমেইল আসেনি।",
    qEn: "The verification email did not arrive.",
    aBn: "স্প্যাম বা প্রমোশন ফোল্ডার দেখুন এবং সাইন আপের সময় ইমেইল ঠিকঠাক লিখেছিলেন কিনা মিলিয়ে নিন। তবুও না এলে আপনার জোন প্রতিনিধি বা অ্যাডমিনকে জানান।",
    aEn: "Check your spam or promotions folder, and check that you typed the email correctly when registering. If it still does not come, tell your zone representative or the admin.",
  },
  {
    qBn: "পাসওয়ার্ড ভুলে গেছি।",
    qEn: "I forgot my password.",
    aBn: "লগ-ইন পেজের পাসওয়ার্ড ভোলার লিংকে সাইন আপের সময় দেওয়া ইমেইল দিন, তারপর ইমেইলে আসা লিংক থেকে নতুন পাসওয়ার্ড দিন। সাইন আপের সময় দেওয়া ইমেইল মনে না থাকলে অ্যাডমিনকে জানান।",
    aEn: "Enter your registration email in the forgot-password link on the login page, then set a new password from the link in the email. If you do not remember the registration email, tell the admin.",
  },
  {
    qBn: "ভুল জোন বেছে ফেলেছি।",
    qEn: "I picked the wrong zone.",
    aBn: "অ্যাডমিনকে জানান। অ্যাডমিন আপনার জোন বদলে দিতে পারেন। তথ্য ভরার আগেই জানালে ভালো।",
    aEn: "Tell the admin. An admin can change your zone. It is best to tell them before you enter data.",
  },
  {
    qBn: "লাল “সংরক্ষণ ব্যর্থ হয়েছে” বার্তা এসেছে।",
    qEn: "A red “সংরক্ষণ ব্যর্থ হয়েছে” (Save failed) message appeared.",
    aBn: "ইন্টারনেট সংযোগ ঠিক আছে কিনা দেখুন, তারপর “আবার চেষ্টা করুন” চাপুন। “সংরক্ষিত” না দেখা পর্যন্ত পেজ বন্ধ করবেন না।",
    aEn: "Check your internet connection, then tap “আবার চেষ্টা করুন” (Try again). Do not close the page until “সংরক্ষিত” (Saved) shows.",
  },
  {
    qBn: "সংখ্যা লিখলাম কিন্তু “সংরক্ষিত” দেখাচ্ছে না।",
    qEn: "I typed a number but it does not say “সংরক্ষিত”.",
    aBn: "সংরক্ষণ শুরু হয় ঘর থেকে বেরিয়ে এলে। অন্য ঘরে বা ফাঁকা জায়গায় ট্যাপ করুন, তারপর উপরে শিরোনামের নিচে “সংরক্ষিত” দেখা পর্যন্ত অপেক্ষা করুন।",
    aEn: "Saving starts when you leave the box. Tap another box or a blank area, then wait for “সংরক্ষিত” (Saved) to appear below the section title.",
  },
  {
    qBn: "আলাদা সেভ বোতাম কোথায়?",
    qEn: "Where is the Save button?",
    aBn: "সেভ বোতাম নেই, তথ্য নিজে থেকেই সংরক্ষিত হয়।",
    aEn: "There is no Save button: data saves on its own automatically.",
  },
  {
    qBn: "ভরা তথ্যে ভুল পেলাম।",
    qEn: "I found a mistake in data I already entered.",
    aBn: "সেকশনে গিয়ে ঘর ঠিক করুন। রিপোর্ট যেকোনো সময় বদলানো যায়, কিছুই লক হয় না। বড় পরিবর্তন করলে অ্যাডমিনকে জানান।",
    aEn: "Go to the section and fix the box. Reports can be edited at any time, and nothing is locked. If it is a big change, tell the admin.",
  },
  {
    qBn: "ভুল মাসে তথ্য দিয়ে ফেলেছি।",
    qEn: "I entered data in the wrong month.",
    aBn: "ভুল মাসের তথ্য সেই মাসেই থেকে যায়। ওই মাস খুলে ঘরগুলো ঠিক করুন, তারপর সঠিক মাস বেছে সেখানে তথ্য দিন এবং অ্যাডমিনকে জানান।",
    aEn: "The data stays in that month. Open that month and correct the boxes, then pick the right month, enter the data there, and tell the admin.",
  },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export function HelpDiagramClient({
  initialIsAdmin,
  isLoggedIn,
}: {
  initialIsAdmin: boolean;
  isLoggedIn: boolean;
}) {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<"user" | "admin">(
    initialIsAdmin ? "admin" : "user"
  );
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  const isManualScrollingRef = useRef(false);
  const manualTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isEn = language === "en";
  const paramsStr = searchParams.toString();
  const periodQuery = paramsStr ? `?${paramsStr}` : "";

  const steps = activeView === "admin" ? ADMIN_STEPS : USER_STEPS;

  // ── IntersectionObserver: Auto-update Stepper as User Scrolls ──
  useEffect(() => {
    const allStepIds = [...steps.map((s) => s.id), "common-problems"];
    const elements = allStepIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScrollingRef.current) return;

        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by distance to the viewport top detection zone
          visibleEntries.sort(
            (a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top)
          );
          const topVisibleId = visibleEntries[0].target.id;
          if (topVisibleId === "common-problems") {
            setSelectedStepIndex(steps.length);
          } else {
            const stepIdx = steps.findIndex((s) => s.id === topVisibleId);
            if (stepIdx !== -1) {
              setSelectedStepIndex(stepIdx);
            }
          }
        }
      },
      {
        // Detection box: top offset matches the sticky obstruction
        rootMargin: "-120px 0px -50% 0px",
        threshold: [0, 0.15, 0.4],
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
    };
  }, [steps]);

  // ── Smooth Scroll with Exact Clearance to Avoid Top Clipping ──
  const scrollToTarget = (targetId: string, stepIdx: number) => {
    setSelectedStepIndex(stepIdx);
    isManualScrollingRef.current = true;
    if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);

    const element = document.getElementById(targetId);
    if (element) {
      // Calculate sticky obstruction with comfortable breathing room:
      // Desktop: Navbar (64px) + Stepper (~50px) + 26px padding = ~140px
      // Mobile: Stepper (~48px) + 22px padding = ~70px
      const isDesktop = window.innerWidth >= 768;
      const stickyOffset = isDesktop ? 140 : 72;
      const rect = element.getBoundingClientRect();
      const targetY = window.pageYOffset + rect.top - stickyOffset;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth",
      });
    }

    // Re-enable observer after smooth scroll completes (~850ms)
    manualTimeoutRef.current = setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 850);
  };

  const handleStepSelect = (index: number) => {
    scrollToTarget(steps[index].id, index);
  };

  const handleProblemsScroll = () => {
    scrollToTarget("common-problems", steps.length);
  };

  return (
    <div className="container py-6 md:py-10 max-w-3xl px-4 md:px-6 flex-1 flex flex-col justify-between">
      <div>
        {/* ── Page Header ── */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex p-3 bg-primary/10 text-primary rounded-2xl mb-3 ring-1 ring-primary/20">
            <Compass className="w-7 h-7 md:w-8 md:h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {activeView === "admin"
              ? isEn
                ? "Admin Operational Guide"
                : "অ্যাডমিন নির্দেশিকা"
              : isEn
                ? "Step-by-Step Reporting Guide"
                : "সহজ ধাপে রিপোর্ট জমাদান সহায়িকা"}
          </h1>

          <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
            {activeView === "admin"
              ? isEn
                ? "Step-by-step administrative guide for zone monitoring, user approvals, city data overrides, and official exports."
                : "ড্যাশবোর্ড পর্যবেক্ষণ, ইউজার অনুমোদন, জোন অডিট, সিটি ওভাররাইড ও এক্সপোর্টের সহজ নির্দেশিকা।"
              : isEn
                ? "Simple, text-first instructions for Quran teachers and zone representatives to fill out and submit reports."
                : "তা'লীমুল কুরআন বিভাগের শিক্ষক ও জোন প্রতিনিধিদের জন্য সহজ ও ধারাবাহিক লিখিত সহায়িকা।"}
          </p>

          {/* ── Role Switcher (Admins Only) ── */}
          {initialIsAdmin && (
            <div className="flex items-center justify-center mt-5">
              <div className="inline-flex p-1 bg-muted/70 border border-border/80 rounded-2xl shadow-inner gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveView("admin");
                    setSelectedStepIndex(0);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activeView === "admin"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isEn ? "Admin Guide" : "অ্যাডমিন গাইড"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView("user");
                    setSelectedStepIndex(0);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activeView === "user"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isEn ? "User Guide" : "ব্যবহারকারী গাইড"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Responsive Stepper Navigator with Active Auto-Highlight ── */}
        <div className="sticky top-2 sm:top-3 md:top-20 z-20 mb-8 p-1.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-md transition-all">
          <div className={`grid gap-1.5 text-center ${steps.length === 4 ? "grid-cols-4 sm:grid-cols-5" : "grid-cols-5 sm:grid-cols-6"}`}>
            {steps.map((s, idx) => {
              const isActive = idx === selectedStepIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleStepSelect(idx)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground font-black shadow-xs"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground font-bold"
                  }`}
                >
                  <span className="text-xs truncate">
                    {isEn ? s.shortLabelEn : s.shortLabelBn}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleProblemsScroll}
              className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl transition-all text-xs font-bold ${
                selectedStepIndex === steps.length
                  ? "bg-primary text-primary-foreground font-black shadow-xs"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{isEn ? "Problems" : "সমস্যা"}</span>
            </button>
          </div>
        </div>

        {/* ── Step-by-Step Text Cards with Headroom Scroll Margins ── */}
        <div className="space-y-8 md:space-y-10">
          {steps.map((step) => {
            const targetHref =
              step.actionLink.href.startsWith("/") && !step.actionLink.href.startsWith("/home")
                ? `${step.actionLink.href}${periodQuery}`
                : step.actionLink.href;

            const points = isEn ? step.pointsEn : step.pointsBn;
            const qa = isEn ? step.qaEn : step.qaBn;
            const caution = isEn ? step.cautionEn : step.cautionBn;

            return (
              <div
                key={step.id}
                id={step.id}
                className="scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-40 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 transition-all"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                      {isEn ? step.stepEn : step.stepBn}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-foreground">
                      {isEn ? step.titleEn : step.titleBn}
                    </h2>
                  </div>

                  <Link
                    href={targetHref}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>{isEn ? step.actionLink.labelEn : step.actionLink.labelBn}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Summary Description */}
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isEn ? step.descEn : step.descBn}
                </p>

                {/* Numbered Action Steps */}
                <div className="space-y-2 pt-1">
                  {points.map((point, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      <span className="w-5 h-5 rounded-full bg-muted text-foreground font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {pIdx + 1}
                      </span>
                      <p className="text-foreground leading-relaxed flex-1">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Caution if any */}
                {caution && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{caution}</span>
                  </div>
                )}

                {/* Single Step Q&A */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs sm:text-sm space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{qa.q}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-5">
                    {qa.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Dedicated Common Problems Section ── */}
        <div id="common-problems" className="mt-12 scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-40 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-black text-foreground">
              {isEn ? "Common Problems & Solutions" : "সাধারণ সমস্যা ও সমাধান"}
            </h2>
          </div>

          <div className="space-y-3">
            {COMMON_PROBLEMS.map((item, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-1 text-xs sm:text-sm"
              >
                <h3 className="font-bold text-foreground flex items-start gap-2">
                  <span className="text-primary font-black">•</span>
                  <span>{isEn ? item.qEn : item.qBn}</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-3.5">
                  {isEn ? item.aEn : item.aBn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Human Contact Block ── */}
        <div className="mt-10 p-5 rounded-2xl bg-card border border-border flex items-start gap-3.5 text-xs sm:text-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground">
              {isEn ? "Need direct assistance?" : "সরাসরি সহায়তার প্রয়োজন?"}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {isEn
                ? "If you encounter any issues not covered here, please message your assigned Zone Representative or Central Administrator on WhatsApp. Please mention your User ID and Zone Name in the message."
                : "উপরে উল্লেখিত সমাধানগুলো কাজ না করলে সাহায্য পেতে আপনার জোন প্রতিনিধির সাথে যোগাযোগ করুন অথবা WhatsApp-এ বার্তা দিন। বার্তায় অবশ্যই আপনার ইউজার আইডি ও জোনের নাম লিখুন।"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Standard Institutional Footer with Language & Theme Toggles ── */}
      <footer className="w-full border-t border-border/60 bg-card/40 py-4 mt-12 shrink-0 rounded-2xl px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <p>© {new Date().getFullYear()} {t.copyrightText}</p>
            <span className="hidden sm:inline text-border">|</span>
            <Link
              href={isLoggedIn ? `/${periodQuery}` : "/home"}
              className="inline-flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors underline underline-offset-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-primary" />
              <span>
                {isLoggedIn
                  ? isEn
                    ? "Back to Dashboard"
                    : "মূল ড্যাশবোর্ডে ফিরুন"
                  : isEn
                    ? "Back to Login / Sign Up"
                    : "লগইন / নিবন্ধন পেজে ফিরুন"}
              </span>
            </Link>
          </div>
          <AppearanceFooterToggle />
        </div>
      </footer>
    </div>
  );
}
