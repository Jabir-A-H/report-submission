"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import {
  UserPlus,
  Calendar,
  FileEdit,
  CheckCircle2,
  Download,
  ShieldCheck,
  LayoutDashboard,
  Users,
  FileCheck,
  TrendingUp,
  Printer,
  Sparkles,
  Compass,
  Check,
  HelpCircle,
  Clock,
  Send,
  Eye,
  RefreshCw,
  ExternalLink,
  PhoneCall,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";

// ─── Step Definition Interface ──────────────────────────────────────────────

interface StepItem {
  id: string;
  stepBn: string;
  stepEn: string;
  badgeBn: string;
  badgeEn: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  icon: typeof UserPlus;
  accent: {
    bg: string;
    text: string;
    border: string;
    ring: string;
  };
  actionLink: {
    href: string;
    labelBn: string;
    labelEn: string;
  };
  pins: Array<{
    pin: string;
    textBn: string;
    textEn: string;
  }>;
  troubleshoot: {
    qBn: string;
    qEn: string;
    aBn: string;
    aEn: string;
  };
}

// ─── User Steps Data ────────────────────────────────────────────────────────

const USER_STEPS: StepItem[] = [
  {
    id: "user-step-1",
    stepBn: "০১",
    stepEn: "01",
    badgeBn: "ধাপ ০১",
    badgeEn: "Step 01",
    titleBn: "অ্যাকাউন্ট নিবন্ধন ও অনুমোদন",
    titleEn: "Registration & Account Activation",
    subtitleBn: "আপনার নির্ধারিত জোন নির্বাচন করে অ্যাকাউন্ট খুলুন এবং অ্যাডমিন অনুমোদনের অপেক্ষা করুন।",
    subtitleEn: "Sign up with your designated reporting zone and await administrative activation.",
    icon: UserPlus,
    accent: {
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/30",
      ring: "ring-blue-500/20",
    },
    actionLink: {
      href: "/home?mode=register",
      labelBn: "নিবন্ধন পেজে যান",
      labelEn: "Go to Registration",
    },
    pins: [
      {
        pin: "১",
        textBn: "তালিকা থেকে আপনার নির্ধারিত জোন (যেমন: মিরপুর জোন) নির্বাচন করুন।",
        textEn: "Select your assigned zone (e.g. Mirpur Zone) from the dropdown list.",
      },
      {
        pin: "২",
        textBn: "আপনার সঠিক নাম, মোবাইল/ইমেইল ও পাসওয়ার্ড দিয়ে 'নিবন্ধন করুন' চাপুন।",
        textEn: "Enter your official name, mobile/email, and password, then click Sign Up.",
      },
      {
        pin: "৩",
        textBn: "নিবন্ধনের পর 'অনুমোদনের অপেক্ষায়' মেসেজ দেখতে পাবেন। অ্যাডমিন অনুমোদন দিলেই ড্যাশবোর্ড চালু হবে।",
        textEn: "You will see a 'Pending Approval' screen. Access is granted as soon as an admin approves your account.",
      },
    ],
    troubleshoot: {
      qBn: "নিবন্ধন করার সাথে সাথে কেন লগইন হয় না?",
      qEn: "Why can't I access the dashboard immediately after registration?",
      aBn: "প্রতিটি রিপোর্টের সত্যতা ও প্রাতিষ্ঠানিক গোপনীয়তা রক্ষার জন্য কেন্দ্রীয় অ্যাডমিন আপনার পরিচয় যাচাই করে অ্যাকাউন্টটি সক্রিয় (Approve) করে দেন। অনুমোদন পেয়ে গেলে আপনি যেকোনো সময় সরাসরি লগইন করতে পারবেন।",
      aEn: "To safeguard data integrity, administrators verify each applicant before activation. Once verified, you will have immediate and permanent access.",
    },
  },
  {
    id: "user-step-2",
    stepBn: "০২",
    stepEn: "02",
    badgeBn: "ধাপ ০২",
    badgeEn: "Step 02",
    titleBn: "লগইন ও রিপোর্টের মাস নির্বাচন",
    titleEn: "Login & Reporting Period Context",
    subtitleBn: "অনুমোদিত আইডিতে প্রবেশ করে কাঙ্ক্ষিত বছর ও মাস নির্বাচন করে ফরম পূরণ শুরু করুন।",
    subtitleEn: "Sign in with approved credentials, configure your target month/year, and launch the form.",
    icon: Calendar,
    accent: {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/30",
      ring: "ring-amber-500/20",
    },
    actionLink: {
      href: "/",
      labelBn: "সময় নির্বাচন পেজে যান",
      labelEn: "Go to Period Selector",
    },
    pins: [
      {
        pin: "১",
        textBn: "উপরে আপনার রিপোর্টের বছর এবং যে মাসের তথ্য দিতে চান (যেমন: অক্টোবর) তা বেছে নিন।",
        textEn: "Select the target reporting year and month (e.g. October) from the dropdowns.",
      },
      {
        pin: "২",
        textBn: "মাসিক, ৩ মাস বা ৬ মাসের রিপোর্ট—প্রয়োজন অনুযায়ী মোড নির্বাচন করুন।",
        textEn: "Choose between Monthly, Quarterly (3-Month), or Semi-Annual reporting modes.",
      },
      {
        pin: "৩",
        textBn: "সবুজ রঙের 'ফরম পূরণ করুন' বাটনে ক্লিক করলেই তথ্য এন্ট্রি স্ক্রিনে নিয়ে যাবে।",
        textEn: "Click the prominent 'Fill Out Form' button to enter the data entry workspace.",
      },
    ],
    troubleshoot: {
      qBn: "যদি ভুল মাস নির্বাচন করে ফরম পূরণ শুরু করে ফেলি?",
      qEn: "What if I accidentally selected the wrong month?",
      aBn: "চিন্তার কোনো কারণ নেই! চূড়ান্ত রিপোর্ট জমা দেওয়ার আগ পর্যন্ত আপনি যেকোনো সময় উপরের মেনু থেকে সঠিক মাস পরিবর্তন করে নিতে পারবেন। পূর্বের ডেটা সম্পূর্ণ সুরক্ষিত থাকবে।",
      aEn: "No worries! You can change the month or period anytime from the top selector before final submission. Your input data remains safely preserved.",
    },
  },
  {
    id: "user-step-3",
    stepBn: "০৩",
    stepEn: "03",
    badgeBn: "ধাপ ০৩",
    badgeEn: "Step 03",
    titleBn: "ধাপে ধাপে ৭টি সেকশন পূরণ ও অটো-সেভ",
    titleEn: "7-Section Step-by-Step Data Entry & Auto-Save",
    subtitleBn: "মূল তথ্য, কোর্স, সংগঠন, উদ্যোগ, বৈঠক, সফর ও মন্তব্য পূরণ করুন—টাইপ করলেই ক্লাউডে স্বয়ংক্রিয় সেভ হয়।",
    subtitleEn: "Input data across Header, Courses, Org, Personal, Meetings, Safar, and Remarks with real-time cloud auto-save.",
    icon: FileEdit,
    accent: {
      bg: "bg-violet-500/10",
      text: "text-violet-600 dark:text-violet-400",
      border: "border-violet-500/30",
      ring: "ring-violet-500/20",
    },
    actionLink: {
      href: "/report/header",
      labelBn: "ফরম পূরণে যান",
      labelEn: "Go to Form Entry",
    },
    pins: [
      {
        pin: "১",
        textBn: "উপরের সেকশন ট্যাবগুলো (১ থেকে ৭) পর্যায়ক্রমে ক্লিক করে প্রতিটি বিষয় পূরণ করুন।",
        textEn: "Click through the 7 section tabs at the top sequentially to complete each topic.",
      },
      {
        pin: "২",
        textBn: "প্রতিটি ঘরে সঠিক সংখ্যা বা মন্তব্য টাইপ করুন (খালি থাকলে ০ লিখুন)।",
        textEn: "Enter your counts or qualitative remarks (use 0 if there is no activity).",
      },
      {
        pin: "৩",
        textBn: "উপরে ডানপাশে সবুজ 'সংরক্ষিত' ব্যাজ লক্ষ্য করুন—কোনো আলাদা সেভ বাটন চাপতে হয় না।",
        textEn: "Watch the top-right green 'Saved' indicator—there is no need to manually press any save button.",
      },
    ],
    troubleshoot: {
      qBn: "কোনো সেভ বাটন নেই কেন? ইন্টারনেট চলে গেলে তথ্য মুছে যাবে কি?",
      qEn: "Why is there no Save button? Will data be lost if internet disconnects?",
      aBn: "আমাদের সিস্টেম ক্লাউড অটো-সেভ প্রযুক্তি ব্যবহার করে। আপনি প্রতিটি সংখ্যা টাইপ করার ১ সেকেন্ডের মধ্যে তা স্বয়ংক্রিয়ভাবে ক্লাউডে জমা হয়। যদি ইন্টারনেট চলে যায় এবং লাল রঙের 'আবার চেষ্টা করুন' বাটন আসে, তবে ইন্টারনেট ফিরে এলে ওই বাটনে চাপ দিলেই ডেটা সংরক্ষিত হয়ে যাবে।",
      aEn: "The system auto-saves to the cloud within 1 second of typing. If your connection drops and a red 'Retry' button appears, simply tap it once your internet restores to save all pending changes.",
    },
  },
  {
    id: "user-step-4",
    stepBn: "০৪",
    stepEn: "04",
    badgeBn: "ধাপ ০৪",
    badgeEn: "Step 04",
    titleBn: "এক নজরে যাচাই ও চূড়ান্ত জমাদান",
    titleEn: "Consolidated Review & Final Submission",
    subtitleBn: "'এক নজরে' পেজে সকল সেকশনের পরিসংখ্যান মিলিয়ে নিয়ে চূড়ান্তভাবে রিপোর্টটি জমা দিয়ে লক করুন।",
    subtitleEn: "Review consolidated totals across all sections, then officially submit and lock your report.",
    icon: CheckCircle2,
    accent: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/30",
      ring: "ring-emerald-500/20",
    },
    actionLink: {
      href: "/report",
      labelBn: "রিপোর্ট এক নজরে দেখুন",
      labelEn: "Go to Consolidated Report",
    },
    pins: [
      {
        pin: "১",
        textBn: "'রিপোর্ট (এক নজরে)' পেজে এসে ৭টি সেকশনের মোট পরিসংখ্যান ও মোট যোগফল মিলিয়ে নিন।",
        textEn: "Check all 7 section totals and calculated summaries on the Consolidated Overview page.",
      },
      {
        pin: "২",
        textBn: "কোনো সংখ্যায় ভুল থাকলে পাশের 'সংশোধন' লিংকে ক্লিক করে সাথে সাথে ঠিক করে নিন।",
        textEn: "If you spot an error, tap the quick-link next to that section to correct it immediately.",
      },
      {
        pin: "৩",
        textBn: "সবকিছু সঠিক থাকলে বড় সবুজ 'চূড়ান্ত রিপোর্ট জমা দিন' বাটনে ক্লিক করে রিপোর্টটি লক করুন।",
        textEn: "When verified, tap the prominent 'Submit Final Report' button to deliver and lock your submission.",
      },
    ],
    troubleshoot: {
      qBn: "চূড়ান্ত জমা দেওয়ার পর কোনো ভুল চোখে পড়লে কি পরিবর্তন করা যাবে?",
      qEn: "Can I edit the report after submitting it?",
      aBn: "ভুলবশত যেন ডেটা নষ্ট না হয় সেজন্য জমা দেওয়ার পর রিপোর্টটি সরাসরি এডিট করা যায় না। তবে কোনো জরুরি সংশোধনের প্রয়োজন হলে আপনার কেন্দ্রীয় অ্যাডমিনের সাথে যোগাযোগ করলে তিনি সিটি রিপোর্ট থেকে তা সংশোধন (Override) করে দিতে পারবেন।",
      aEn: "To prevent accidental modifications, reports are locked after final submission. If a critical correction is needed, your central admin can apply an official override on the City Report.",
    },
  },
  {
    id: "user-step-5",
    stepBn: "০৫",
    stepEn: "05",
    badgeBn: "ধাপ ০৫",
    badgeEn: "Step 05",
    titleBn: "অফিসিয়াল PDF ও Excel ডাউনলোড",
    titleEn: "Download Official PDF & Excel",
    subtitleBn: "জমাকৃত রিপোর্টটি প্রাতিষ্ঠানিক মিটিং বা প্রিন্ট করার জন্য ২-পৃষ্ঠার ল্যান্ডস্কেপ ফাইলে সংগ্রহ করুন।",
    subtitleEn: "Export your submitted report as a formal 2-page landscape PDF or formatted Excel workbook.",
    icon: Download,
    accent: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-600 dark:text-cyan-400",
      border: "border-cyan-500/30",
      ring: "ring-cyan-500/20",
    },
    actionLink: {
      href: "/report",
      labelBn: "ডাউনলোড পেজে যান",
      labelEn: "Go to Download Page",
    },
    pins: [
      {
        pin: "১",
        textBn: "'PDF ডাউনলোড' বাটনে চাপ দিলে ২ পৃষ্ঠার ঝকঝকে প্রাতিষ্ঠানিক ফাইল আপনার ফোনে নেমে আসবে।",
        textEn: "Click 'Download PDF' to save a clean, formal 2-page print-ready document to your device.",
      },
      {
        pin: "২",
        textBn: "যদি কম্পিউটারে হিসাব সংরক্ষণ করতে চান তবে 'Excel ডাউনলোড' বাটনে চাপ দিন।",
        textEn: "Click 'Download Excel' if you want a complete spreadsheet calculation for archival.",
      },
      {
        pin: "৩",
        textBn: "ডাউনলোড করা PDF ফাইলটি সরাসরি প্রিন্ট করতে পারেন অথবা আপনার দায়িত্বশীলকে হোয়াটসঅ্যাপে পাঠাতে পারেন।",
        textEn: "You can print the PDF directly in A4 Landscape or share it with coordinators via WhatsApp.",
      },
    ],
    troubleshoot: {
      qBn: "মোবাইল থেকে কীভাবে এটি প্রিন্ট করব?",
      qEn: "How do I print this report from my phone?",
      aBn: "'PDF ডাউনলোড' বাটনে চাপ দিলে ফাইলটি আপনার ফোনের 'Downloads' ফোল্ডারে সংরক্ষিত হবে। এরপর যেকোনো কম্পিউটার দোকান বা ওয়াইফাই প্রিন্টারে পাঠিয়ে A4 সাইজের ল্যান্ডস্কেপ (আড়াআড়ি) মাপে সরাসরি প্রিন্ট করে নিতে পারবেন।",
      aEn: "After downloading the PDF to your phone, send it to any printer or print-shop. Choose 'A4 Landscape' setting for perfect page alignment.",
    },
  },
];

// ─── Admin Steps Data ───────────────────────────────────────────────────────

const ADMIN_STEPS: StepItem[] = [
  {
    id: "admin-step-1",
    stepBn: "০১",
    stepEn: "01",
    badgeBn: "ধাপ ০১",
    badgeEn: "Step 01",
    titleBn: "কমান্ড সেন্টার ও অগ্রগতি পর্যবেক্ষণ",
    titleEn: "Command Center KPI & Progress Monitoring",
    subtitleBn: "চলতি মাসের রিপোর্টিং অগ্রগতি, জমাকৃত জোন এবং বাকি জোনের পরিসংখ্যান এক নজরে পর্যবেক্ষণ করুন।",
    subtitleEn: "Monitor real-time submission velocity, completed zones, and pending field submissions.",
    icon: LayoutDashboard,
    accent: {
      bg: "bg-teal-500/10",
      text: "text-teal-600 dark:text-teal-400",
      border: "border-teal-500/30",
      ring: "ring-teal-500/20",
    },
    actionLink: {
      href: "/dashboard",
      labelBn: "ড্যাশবোর্ডে যান",
      labelEn: "Go to Dashboard",
    },
    pins: [
      {
        pin: "১",
        textBn: "ড্যাশবোর্ডের উপরে চলতি মাসের মোট জোন, জমাকৃত রিপোর্ট ও অপেক্ষমাণ জোনের অনুপাত দেখুন।",
        textEn: "View total zones, completed submissions, and pending ratios on the current month KPI bar.",
      },
      {
        pin: "২",
        textBn: "কোন জোন কখন রিপোর্ট জমা দিয়েছে তার তালিকা ও তারিখ রিয়েল-টাইমে ট্র্যাক করুন।",
        textEn: "Track the real-time submission list showing which zones have submitted and exact timestamps.",
      },
      {
        pin: "৩",
        textBn: "যাঁরা এখনো জমা দেননি, তাঁদের সরাসরি তালিকা থেকে চিহ্নিত করে তাগিদ দিন।",
        textEn: "Identify pending zones instantly to follow up with zone coordinators before deadlines.",
      },
    ],
    troubleshoot: {
      qBn: "চলতি মাস ছাড়া পূর্বের মাসের অগ্রগতি কীভাবে দেখব?",
      qEn: "How do I review progress for previous reporting periods?",
      aBn: "ড্যাশবোর্ডের উপরের ড্রপডাউন থেকে যেকোনো মাস বা বছর নির্বাচন করলেই স্বয়ংক্রিয়ভাবে সেই সময়ের অগ্রগতি ও জোন স্ট্যাটাস স্ক্রিনে ফুটে উঠবে।",
      aEn: "Select any past month or year from the top period dropdown to instantly load historical completion metrics.",
    },
  },
  {
    id: "admin-step-2",
    stepBn: "০২",
    stepEn: "02",
    badgeBn: "ধাপ ০২",
    badgeEn: "Step 02",
    titleBn: "ব্যবহারকারী অনুমোদন ও জোন নিয়ন্ত্রণ",
    titleEn: "User Approval & Zone Governance",
    subtitleBn: "নতুন রেজিস্ট্রেশন যাচাই করে ১-ক্লিকে অনুমোদন দিন এবং জোন প্রতিনিধিদের দায়িত্ব পরিচালনা করুন।",
    subtitleEn: "Verify incoming registrations, grant 1-click approvals, and assign zone responsibilities.",
    icon: Users,
    accent: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-500/30",
      ring: "ring-indigo-500/20",
    },
    actionLink: {
      href: "/management",
      labelBn: "ইউজার ব্যবস্থাপনায় যান",
      labelEn: "Go to Management",
    },
    pins: [
      {
        pin: "১",
        textBn: "'অপেক্ষমাণ' ট্যাবে গিয়ে নতুন শিক্ষকদের আবেদন ও নির্বাচিত জোন পর্যবেক্ষণ করুন।",
        textEn: "Open the 'Pending' tab to inspect incoming sign-ups and their selected zones.",
      },
      {
        pin: "২",
        textBn: "সবুজ 'অনুমোদন দিন' বাটনে ক্লিক করলেই ইউজারের আইডি সক্রিয় (active=true) হয়ে যাবে।",
        textEn: "Click the green 'Approve' button to activate the account instantly (active=true).",
      },
      {
        pin: "৩",
        textBn: "প্রয়োজনে ইউজারের জোন বা রোল পরিবর্তন করতে পারেন অথবা নিষ্ক্রিয় করতে পারেন।",
        textEn: "You can reassign zones, modify administrative roles, or deactivate accounts when needed.",
      },
    ],
    troubleshoot: {
      qBn: "যদি কোনো অপরিচিত ব্যক্তি রেজিস্ট্রেশন করে ফেলে?",
      qEn: "What if an unauthorized person attempts to sign up?",
      aBn: "নিবন্ধন করলেই কেউ ডেটা দেখতে পারে না। আপনি অনুমোদন না দেওয়া পর্যন্ত সে সিস্টেমে ঢুকতে পারবে না। অপছন্দ হলে লাল 'বাতিল' বাটনে চাপ দিয়ে আবেদনটি সরাসরি প্রত্যাখ্যান করতে পারেন।",
      aEn: "Unapproved sign-ups cannot access any reports. You can safely reject invalid requests by clicking the red Reject button.",
    },
  },
  {
    id: "admin-step-3",
    stepBn: "০৩",
    stepEn: "03",
    badgeBn: "ধাপ ০৩",
    badgeEn: "Step 03",
    titleBn: "জমাকৃত জোন রিপোর্ট অডিট",
    titleEn: "Audit Submitted Zone Reports",
    subtitleBn: "সকল জোনের জমাকৃত মাসিক রিপোর্ট পুঙ্খানুপুঙ্খ পরীক্ষা করুন এবং দায়িত্বশীলদের মন্তব্য দেখুন।",
    subtitleEn: "Inspect filed reports across zones, verify submitted counts, and read field observations.",
    icon: FileCheck,
    accent: {
      bg: "bg-violet-500/10",
      text: "text-violet-600 dark:text-violet-400",
      border: "border-violet-500/30",
      ring: "ring-violet-500/20",
    },
    actionLink: {
      href: "/reports",
      labelBn: "রিপোর্ট অডিট তালিকায় যান",
      labelEn: "Go to Reports List",
    },
    pins: [
      {
        pin: "১",
        textBn: "জোন ড্রপডাউন ও মাস ফিল্টার দিয়ে নির্দিষ্ট জোনের রিপোর্ট খুঁজে নিন।",
        textEn: "Filter by zone and month to locate a specific zone's submission.",
      },
      {
        pin: "২",
        textBn: "নীল 'রিপোর্ট দেখুন' বাটনে চাপ দিলে ৭টি সেকশনের প্রতিটি সংখ্যা ও বিবরণ বিস্তারিত দেখতে পাবেন।",
        textEn: "Click the blue 'View Report' button to inspect complete section details and field notes.",
      },
      {
        pin: "৩",
        textBn: "মাঠপর্যায়ের দায়িত্বশীলদের বিশেষ মন্তব্য ও সুপারিশগুলো আলাদাভাবে নিরীক্ষা করুন।",
        textEn: "Review qualitative field remarks and local recommendations provided by field representatives.",
      },
    ],
    troubleshoot: {
      qBn: "কোনো জোনের তথ্যে স্পষ্ট ভুল থাকলে অ্যাডমিন কীভাবে সমাধান করবেন?",
      qEn: "How should an admin handle obvious data errors submitted by a zone?",
      aBn: "জোন রিপোর্টটি সরাসরি পরিবর্তন না করে সিটি রিপোর্ট (City Report) পেজে যান। সেখানে 'এডিট মোড' অন করে ওই সেলের উপর সঠিক সংখ্যা লিখে 'ওভাররাইড' করে দিন।",
      aEn: "Instead of unlocking individual zone forms, open the City Report, enable Edit Mode, and apply an authoritative cell override.",
    },
  },
  {
    id: "admin-step-4",
    stepBn: "০৪",
    stepEn: "04",
    badgeBn: "ধাপ ০৪",
    badgeEn: "Step 04",
    titleBn: "সমন্বিত সিটি রিপোর্ট ও সেল ওভাররাইড",
    titleEn: "City Aggregates & Authoritative Overrides",
    subtitleBn: "ঢাকা মহানগরীর সমন্বিত মোট ডেটা পর্যবেক্ষণ করুন এবং প্রাতিষ্ঠানিক প্রয়োজনে যেকোনো সংখ্যা ওভাররাইড করুন।",
    subtitleEn: "Review metropolitan totals and apply official cell overrides in Edit Mode.",
    icon: TrendingUp,
    accent: {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/30",
      ring: "ring-amber-500/20",
    },
    actionLink: {
      href: "/city-report",
      labelBn: "সিটি রিপোর্টে যান",
      labelEn: "Go to City Report",
    },
    pins: [
      {
        pin: "১",
        textBn: "সকল জোনের মোট যোগফল স্বয়ংক্রিয়ভাবে মহানগরীর মূল টেবিলে একত্রিত হয়।",
        textEn: "All active zone submissions are automatically aggregated into metropolitan totals.",
      },
      {
        pin: "২",
        textBn: "উপরে 'এডিট মোড' অন করলে যেকোনো সেলে হলুদ বর্ডার আসবে এবং সংখ্যা পরিবর্তন করা যাবে।",
        textEn: "Toggle 'Edit Mode' on to highlight cells in amber, allowing you to edit values directly.",
      },
      {
        pin: "৩",
        textBn: "ওভাররাইড করা সংখ্যাগুলো হলুদ চিহ্নিত থাকবে যেন সবাই বুঝতে পারে কেন্দ্রীয়ভাবে সংশোধিত হয়েছে।",
        textEn: "Overridden numbers remain highlighted with an amber glow to indicate authoritative adjustments.",
      },
    ],
    troubleshoot: {
      qBn: "ওভাররাইড মুছে ফেলে আবার মূল যোগফলে ফিরে যাওয়া যায় কি?",
      qEn: "Can an override be removed to restore the original calculated sum?",
      aBn: "হ্যাঁ! এডিট মোডে গিয়ে ওই সেলের সংখ্যাটি সম্পূর্ণ মুছে দিলে বা খালি করে দিলে সিস্টেম স্বয়ংক্রিয়ভাবে আবার সকল জোনের মূল গাণিতিক যোগফল ফিরিয়ে আনবে।",
      aEn: "Yes! Simply clear the input value in Edit Mode, and the system immediately restores the natural mathematical sum of all zones.",
    },
  },
  {
    id: "admin-step-5",
    stepBn: "০৫",
    stepEn: "05",
    badgeBn: "ধাপ ০৫",
    badgeEn: "Step 05",
    titleBn: "অফিসিয়াল মহানগরী PDF ও Excel এক্সপোর্ট",
    titleEn: "Official Metropolitan PDF & Excel Export",
    subtitleBn: "কেন্দ্রীয় মিটিং বা প্রাতিষ্ঠানিক রেকর্ডের জন্য ঢাকা মহানগরীর সমন্বিত ২-পাতার ল্যান্ডস্কেপ ফাইল ডাউনলোড করুন।",
    subtitleEn: "Download executive 2-page landscape PDFs or Excel workbooks incorporating all cell overrides.",
    icon: Printer,
    accent: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/30",
      ring: "ring-emerald-500/20",
    },
    actionLink: {
      href: "/city-report",
      labelBn: "এক্সপোর্টে যান",
      labelEn: "Go to Export",
    },
    pins: [
      {
        pin: "১",
        textBn: "'কেন্দ্রীয় PDF ডাউনলোড' বাটনে চাপ দিলে ওভাররাইড সহ সম্পূর্ণ মহানগরীর রিপোর্ট ফাইল তৈরি হবে।",
        textEn: "Click 'Download Central PDF' to generate the executive report incorporating all adjustments.",
      },
      {
        pin: "২",
        textBn: "প্রতিটি রিপোর্ট সুনির্দিষ্ট ২-পৃষ্ঠার অফিশিয়াল ছকে সুসজ্জিত থাকে যা সরাসরি প্রিন্ট উপযোগী।",
        textEn: "Every export fits precisely on 2 official landscape pages, formatted for immediate printing.",
      },
      {
        pin: "৩",
        textBn: "মিটিংয়ে উপস্থাপনের জন্য 'Excel ডাউনলোড' থেকে বিস্তারিত টেবিল ফাইলও সংগ্রহ করতে পারেন।",
        textEn: "You can also export to Excel for multi-zone tabular presentations in executive meetings.",
      },
    ],
    troubleshoot: {
      qBn: "প্রিন্ট করার সময় পৃষ্ঠা কেটে গেলে কী করবেন?",
      qEn: "What if the document edges get cut off during printing?",
      aBn: "প্রিন্টার সেটিংসে গিয়ে পেপার সাইজ 'A4', ওরিয়েন্টেশন 'Landscape (আড়াআড়ি)' এবং স্কেলিং 'Fit to Page' অথবা '100%' নির্বাচন করুন। এতে কোনো লাইন বা টেবিল মার্জিনের বাইরে যাবে না।",
      aEn: "In your printer dialog, ensure Paper Size is set to 'A4', Orientation to 'Landscape', and Scaling to 'Fit to Page' or '100%'.",
    },
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function HelpDiagramClient({ initialIsAdmin }: { initialIsAdmin: boolean }) {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<"user" | "admin">(
    initialIsAdmin ? "admin" : "user"
  );
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  const isEn = language === "en";
  const paramsStr = searchParams.toString();
  const periodQuery = paramsStr ? `?${paramsStr}` : "";

  const steps = activeView === "admin" ? ADMIN_STEPS : USER_STEPS;
  const currentStep = steps[selectedStepIndex] || steps[0];

  const handleStepSelect = (index: number) => {
    setSelectedStepIndex(index);
    const element = document.getElementById(steps[index].id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="container py-8 md:py-12 max-w-4xl px-4 md:px-6">
      {/* ── Main Header ── */}
      <div className="text-center mb-8 md:mb-12">
        <div className="inline-flex p-3 bg-primary/10 text-primary rounded-2xl mb-3 ring-1 ring-primary/20">
          <Compass className="w-7 h-7 md:w-8 md:h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">
          {activeView === "admin"
            ? isEn
              ? "Admin Operational Guide"
              : "অ্যাডমিন নির্দেশিকা ও কার্যপ্রণালী"
            : isEn
              ? "Step-by-Step Reporting Guide"
              : "সহজ ধাপে রিপোর্ট জমাদান সহায়িকা"}
        </h1>

        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto text-xs sm:text-sm md:text-base leading-relaxed">
          {activeView === "admin"
            ? isEn
              ? "Visual, step-by-step administrative guide for zone monitoring, user approvals, city data overrides, and official exports."
              : "জোন মনিটরিং, ইউজার অনুমোদন, মহানগরীর রিপোর্ট সমন্বয় ও এক্সপোর্টের চিত্রভিত্তিক ধারাবাহিক নির্দেশিকা।"
            : isEn
              ? "A complete, illustrated guide for Quran teachers and zone representatives to fill out and submit reports effortlessly."
              : "তা'লীমুল কুরআন বিভাগের শিক্ষক ও জোন প্রতিনিধিদের জন্য চিত্রভিত্তিক সহজ ও ধারাবাহিক সহায়িকা।"}
        </p>

        {/* ── Role Switcher (Visible ONLY for Administrators) ── */}
        {initialIsAdmin && (
          <div className="flex items-center justify-center mt-6">
            <div className="inline-flex p-1 bg-muted/70 border border-border/80 rounded-2xl shadow-inner gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveView("admin");
                  setSelectedStepIndex(0);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all ${
                  activeView === "admin"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isEn ? "Admin Guide" : "অ্যাডমিন গাইড"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView("user");
                  setSelectedStepIndex(0);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all ${
                  activeView === "user"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isEn ? "User Guide" : "ব্যবহারকারী গাইড"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Interactive Stage Stepper Navigator ── */}
      <div className="sticky top-20 z-20 mb-8 p-1.5 sm:p-2 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-md">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {steps.map((s, idx) => {
            const isActive = idx === selectedStepIndex;
            const StepIcon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStepSelect(idx)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:px-3 sm:py-2.5 rounded-xl transition-all text-center ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {isEn ? s.stepEn : s.stepBn}
                </span>
                <span className="hidden sm:inline text-xs font-bold truncate">
                  {isEn ? s.titleEn.split(" ")[0] : s.titleBn.split(" ")[0]}
                </span>
                <StepIcon className="w-3.5 h-3.5 sm:hidden shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Detailed Illustrated Walkthrough Cards ── */}
      <div className="space-y-10 md:space-y-14">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const targetHref =
            step.actionLink.href.startsWith("/") && !step.actionLink.href.startsWith("/home")
              ? `${step.actionLink.href}${periodQuery}`
              : step.actionLink.href;

          return (
            <div
              key={step.id}
              id={step.id}
              className="scroll-mt-36 bg-card border border-border/90 rounded-3xl p-5 sm:p-7 md:p-8 shadow-sm hover:border-primary/40 transition-all"
            >
              {/* Step Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${step.accent.bg} ${step.accent.text} border ${step.accent.border} flex items-center justify-center font-black text-base sm:text-lg shadow-xs`}
                  >
                    {isEn ? step.stepEn : step.stepBn}
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-muted-foreground block">
                      {isEn ? step.badgeEn : step.badgeBn}
                    </span>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-foreground">
                      {isEn ? step.titleEn : step.titleBn}
                    </h2>
                  </div>
                </div>

                <Link
                  href={targetHref}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-black text-xs transition-colors border border-primary/20"
                >
                  <span>{isEn ? step.actionLink.labelEn : step.actionLink.labelBn}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Subtitle / Purpose */}
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 font-medium">
                {isEn ? step.subtitleEn : step.subtitleBn}
              </p>

              {/* ── Illustrated Screen Preview Mockup ── */}
              <div className="mb-6 rounded-2xl bg-muted/40 border border-border/80 p-3 sm:p-5 overflow-hidden">
                <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>{isEn ? "Visual Screen Preview" : "স্ক্রিনের বাস্তব রূপ কেমন হবে"}</span>
                </div>

                {/* Dynamic Screen Mockup based on step id */}
                {renderMockup(step.id, isEn)}
              </div>

              {/* ── Action Pins: কী করবেন? ── */}
              <div className="mb-6 space-y-2.5">
                <h3 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>{isEn ? "What to do in this step:" : "এই ধাপে আপনাকে কী করতে হবে:"}</span>
                </h3>
                <div className="grid gap-2 sm:gap-2.5">
                  {step.pins.map((pin) => (
                    <div
                      key={pin.pin}
                      className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/70 text-xs sm:text-sm"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {pin.pin}
                      </span>
                      <span className="text-foreground leading-relaxed">
                        {isEn ? pin.textEn : pin.textBn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Troubleshooting & Common Questions ── */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-black text-amber-600 dark:text-amber-400 mb-1">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>{isEn ? step.troubleshoot.qEn : step.troubleshoot.qBn}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-6">
                  {isEn ? step.troubleshoot.aEn : step.troubleshoot.aBn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Reassurance / Direct Support Banner ── */}
      <div className="mt-12 p-6 rounded-3xl bg-card border border-border text-center shadow-xs">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <PhoneCall className="w-5 h-5" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-foreground">
          {isEn ? "Still having trouble?" : "কোনো সমস্যা বা অস্পষ্টতা আছে?"}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
          {isEn
            ? "Reach out directly to your assigned Zone Representative or Central System Administrator for immediate guidance."
            : "যেকোনো কারিগরি সমস্যা বা সহায়তার জন্য আপনার জোন প্রতিনিধি অথবা কেন্দ্রীয় অ্যাডমিনের সাথে যোগাযোগ করুন।"}
        </p>
      </div>
    </div>
  );
}

// ─── Render Realistic UI Mockups ────────────────────────────────────────────

function renderMockup(stepId: string, isEn: boolean) {
  switch (stepId) {
    // ── User Step 1: Registration Card & Pending Approval ──
    case "user-step-1":
      return (
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {/* Registration Form Frame */}
          <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs space-y-2.5">
            <div className="font-black text-foreground text-center border-b border-border/60 pb-1.5">
              {isEn ? "Sign Up Form" : "অ্যাকাউন্ট নিবন্ধন"}
            </div>
            <div className="space-y-1.5">
              <div className="text-[11px] text-muted-foreground">{isEn ? "Full Name" : "আপনার নাম"}</div>
              <div className="h-7 px-2 rounded-lg bg-muted/60 border border-border flex items-center text-foreground font-medium">
                {isEn ? "Md. Ibrahim" : "মোঃ ইব্রাহীম"}
              </div>
            </div>
            {/* Zone Selection with Pin 1 */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between text-[11px] font-bold text-primary">
                <span>{isEn ? "Assigned Zone" : "আপনার নির্ধারিত জোন"}</span>
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-black">
                  ১
                </span>
              </div>
              <div className="h-7 px-2 rounded-lg bg-primary/10 border-2 border-primary/40 flex items-center justify-between text-primary font-black">
                <span>{isEn ? "Mirpur Zone" : "মিরপুর জোন"}</span>
                <span>▼</span>
              </div>
            </div>
            {/* Submit Button with Pin 2 */}
            <div className="pt-1 relative">
              <div className="h-8 rounded-lg bg-primary text-primary-foreground font-black flex items-center justify-center gap-1.5 shadow-xs">
                <span>{isEn ? "Create Account" : "নিবন্ধন সম্পন্ন করুন"}</span>
                <span className="w-4 h-4 rounded-full bg-primary-foreground text-primary text-[10px] flex items-center justify-center font-black">
                  ২
                </span>
              </div>
            </div>
          </div>

          {/* Pending Approval Screen Frame */}
          <div className="bg-card p-3.5 rounded-xl border-2 border-amber-500/30 flex flex-col items-center justify-center text-center space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-[11px]">
              <span>{isEn ? "Pending Approval" : "অনুমোদনের অপেক্ষায়"}</span>
              <span className="w-4 h-4 rounded-full bg-amber-600 dark:bg-amber-400 text-card text-[10px] flex items-center justify-center font-black">
                ৩
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight px-2">
              {isEn
                ? "Your account is awaiting admin approval. You will gain access as soon as it is verified."
                : "আপনার অ্যাকাউন্টটি তৈরি হয়েছে। অ্যাডমিন অনুমোদন দিলেই রিপোর্ট এন্ট্রি করতে পারবেন।"}
            </p>
          </div>
        </div>
      );

    // ── User Step 2: Period Selector Card ──
    case "user-step-2":
      return (
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="font-black text-foreground">
              {isEn ? "Reporting Period Selection" : "রিপোর্টের সময়কাল নির্ধারণ"}
            </div>
            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold">
              {isEn ? "Zone: Mirpur" : "জোন: মিরপুর"}
            </span>
          </div>

          {/* Period Mode Selector */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="h-7 rounded-lg bg-primary text-primary-foreground font-black flex items-center justify-center text-[11px]">
              {isEn ? "Monthly" : "মাসিক"}
            </div>
            <div className="h-7 rounded-lg bg-muted text-muted-foreground font-medium flex items-center justify-center text-[11px]">
              {isEn ? "3 Months" : "৩ মাস"}
            </div>
            <div className="h-7 rounded-lg bg-muted text-muted-foreground font-medium flex items-center justify-center text-[11px]">
              {isEn ? "Annual" : "বার্ষিক"}
            </div>
          </div>

          {/* Year and Month Dropdowns with Pin 1 */}
          <div className="grid grid-cols-2 gap-2 relative">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground">{isEn ? "Year" : "বছর"}</span>
              <div className="h-7 px-2 rounded-lg bg-muted/60 border border-border flex items-center justify-between text-foreground font-bold">
                <span>{isEn ? "2026" : "২০২৬"}</span>
                <span>▼</span>
              </div>
            </div>
            <div className="space-y-1 relative">
              <div className="flex items-center justify-between text-[10px] font-bold text-primary">
                <span>{isEn ? "Month" : "মাস"}</span>
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-black">
                  ১
                </span>
              </div>
              <div className="h-7 px-2 rounded-lg bg-primary/10 border-2 border-primary/40 flex items-center justify-between text-primary font-black">
                <span>{isEn ? "October" : "অক্টোবর"}</span>
                <span>▼</span>
              </div>
            </div>
          </div>

          {/* Big Green Launch Button with Pin 2 */}
          <div className="pt-1 relative">
            <div className="h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center gap-2 shadow-xs">
              <FileEdit className="w-3.5 h-3.5" />
              <span>{isEn ? "Fill Out Form" : "ফরম পূরণ করুন"}</span>
              <span className="w-4 h-4 rounded-full bg-white text-emerald-700 text-[10px] flex items-center justify-center font-black">
                ২
              </span>
            </div>
          </div>
        </div>
      );

    // ── User Step 3: 7-Section Form & Auto-Save ──
    case "user-step-3":
      return (
        <div className="bg-card p-3.5 sm:p-4 rounded-xl border border-border shadow-xs space-y-3 text-xs">
          {/* Top Bar with Auto-Save Badge Pin 3 */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-black text-foreground">
              {isEn ? "Data Entry Workspace" : "তথ্য পূরণ ওয়ার্কস্পেস"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black">
                ৩
              </span>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-[11px]">
                <Check className="w-3 h-3" />
                <span>{isEn ? "Cloud Saved" : "সংরক্ষিত"}</span>
              </div>
            </div>
          </div>

          {/* Section Tabs with Pin 1 */}
          <div className="relative">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <div className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-black whitespace-nowrap flex items-center gap-1">
                <span>{isEn ? "1. Header" : "১. মূল তথ্য"}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-primary-foreground text-primary text-[9px] flex items-center justify-center font-black">
                  ১
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-bold whitespace-nowrap">
                {isEn ? "2. Courses" : "২. কোর্স"}
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-bold whitespace-nowrap">
                {isEn ? "3. Org" : "৩. সংগঠন"}
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-bold whitespace-nowrap">
                {isEn ? "4. Personal" : "৪. উদ্যোগ"}
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-bold whitespace-nowrap">
                ...
              </div>
            </div>
          </div>

          {/* Input Row with Pin 2 */}
          <div className="space-y-2 bg-muted/40 p-2.5 rounded-lg border border-border/70">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-foreground text-[11px]">
                {isEn ? "Total Center Count" : "মোট কেন্দ্র সংখ্যা"}
              </span>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-black">
                  ২
                </span>
                <div className="w-20 h-7 rounded-md bg-card border-2 border-primary/50 text-right px-2 font-black text-foreground flex items-center justify-end">
                  ১৫
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-foreground text-[11px]">
                {isEn ? "Participating Students" : "অংশগ্রহণকারী ছাত্র সংখ্যা"}
              </span>
              <div className="w-20 h-7 rounded-md bg-card border border-border text-right px-2 font-black text-foreground flex items-center justify-end">
                ১৮০
              </div>
            </div>
          </div>
        </div>
      );

    // ── User Step 4: Consolidated Review & Final Submit ──
    case "user-step-4":
      return (
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="font-black text-foreground flex items-center gap-1.5">
              <span>{isEn ? "Consolidated Summary" : "এক নজরে সকল পরিসংখ্যান"}</span>
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-black">
                ১
              </span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">
              {isEn ? "Status: Draft" : "অবস্থা: খসড়া"}
            </span>
          </div>

          {/* Summary Chips */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/60 border border-border">
              <div className="text-[10px] text-muted-foreground">{isEn ? "Total Centers" : "মোট কেন্দ্র"}</div>
              <div className="text-sm font-black text-foreground">১৫</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/60 border border-border">
              <div className="text-[10px] text-muted-foreground">{isEn ? "Students" : "মোট ছাত্র"}</div>
              <div className="text-sm font-black text-foreground">১৮০</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/60 border border-border">
              <div className="text-[10px] text-muted-foreground">{isEn ? "Courses" : "মোট কোর্স"}</div>
              <div className="text-sm font-black text-foreground">১২</div>
            </div>
          </div>

          {/* Big Submit Button Pin 2 & Lock Status Pin 3 */}
          <div className="pt-1 space-y-2">
            <div className="h-9 rounded-xl bg-primary text-primary-foreground font-black flex items-center justify-center gap-2 shadow-xs cursor-default">
              <Send className="w-3.5 h-3.5" />
              <span>{isEn ? "Submit Final Report" : "চূড়ান্ত রিপোর্ট জমা দিন"}</span>
              <span className="w-4 h-4 rounded-full bg-primary-foreground text-primary text-[10px] flex items-center justify-center font-black">
                ২
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-bold">
              <span className="w-3.5 h-3.5 rounded-full bg-muted text-foreground text-[9px] flex items-center justify-center font-black">
                ৩
              </span>
              <span>{isEn ? "Submitting officially locks the report for administrative audit." : "জমা দেওয়ার পর তথ্য লক হয়ে যাবে যাতে কোনো গরমিল না হয়।"}</span>
            </div>
          </div>
        </div>
      );

    // ── User Step 5: Official PDF & Sharing ──
    case "user-step-5":
      return (
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {/* Export Action Card */}
          <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs space-y-2.5">
            <div className="font-black text-foreground border-b border-border/60 pb-1.5">
              {isEn ? "Export Options" : "ডাউনলোড ও প্রিন্ট"}
            </div>
            {/* Download PDF Button Pin 1 */}
            <div className="h-8 rounded-lg bg-primary text-primary-foreground font-black flex items-center justify-between px-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>{isEn ? "Download PDF (2 Pages)" : "PDF ডাউনলোড (২ পাতা)"}</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-primary-foreground text-primary text-[10px] flex items-center justify-center font-black">
                ১
              </span>
            </div>
            {/* Download Excel Button Pin 2 */}
            <div className="h-8 rounded-lg bg-muted text-foreground border border-border font-bold flex items-center justify-between px-3">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? "Download Excel File" : "Excel ফাইল ডাউনলোড"}</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-muted-foreground/30 text-foreground text-[10px] flex items-center justify-center font-black">
                ২
              </span>
            </div>
          </div>

          {/* Mini Landscape Document Representation Pin 3 */}
          <div className="bg-card p-3 rounded-xl border-2 border-primary/30 flex flex-col justify-between shadow-xs">
            <div className="space-y-1 text-center">
              <div className="text-[10px] font-black text-foreground">
                {isEn ? "Official Institutional Report" : "তা'লীমুল কুরআন বিভাগ — মাসিক রিপোর্ট"}
              </div>
              <div className="text-[9px] text-muted-foreground border-b border-border pb-1">
                {isEn ? "2-Page Official Print Layout" : "২-পাতার প্রিন্ট-রেডি অফিশিয়াল ছক"}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 my-2 text-[8px] text-muted-foreground border border-dashed border-border p-1 rounded">
              <div className="bg-muted p-0.5 rounded">কেন্দ্র: ১৫</div>
              <div className="bg-muted p-0.5 rounded">ছাত্র: ১৮০</div>
              <div className="bg-muted p-0.5 rounded">কোর্স: ১২</div>
              <div className="bg-muted p-0.5 rounded">বৈঠক: ৮</div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-primary font-black">
              <span>{isEn ? "Ready to Print / Share" : "প্রিন্ট বা শেয়ার করুন"}</span>
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-black">
                ৩
              </span>
            </div>
          </div>
        </div>
      );

    // ── Admin Step 1: Command Center KPI Dashboard ──
    case "admin-step-1":
      return (
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-black text-foreground">
              {isEn ? "Current Month Condition Panel" : "চলতি মাসের সার্বিক অগ্রগতি"}
            </span>
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-black">
              ১
            </span>
          </div>
          {/* KPI Count Cards */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/60 border border-border">
              <div className="text-[10px] text-muted-foreground">{isEn ? "Total Zones" : "মোট জোন"}</div>
              <div className="text-base font-black text-foreground">১২টি</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <div className="text-[10px] font-bold">{isEn ? "Submitted" : "জমাকৃত"}</div>
              <div className="text-base font-black">৮টি (৬৭%)</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <div className="text-[10px] font-bold">{isEn ? "Pending" : "অপেক্ষমাণ"}</div>
              <div className="text-base font-black">৪টি</div>
            </div>
          </div>
          {/* Submission list Pin 2 */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] p-1.5 rounded-md bg-muted/50 border border-border/60">
              <span className="font-bold text-foreground">মিরপুর জোন</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1">
                ✓ জমাকৃত (১২ অক্টো)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] p-1.5 rounded-md bg-muted/50 border border-border/60">
              <span className="font-bold text-foreground">উত্তরা জোন</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                ⏳ অপেক্ষমাণ
              </span>
            </div>
          </div>
        </div>
      );

    // ── Admin Step 2: User Approval & Management ──
    case "admin-step-2":
      return (
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-black text-foreground">
              {isEn ? "Pending Registrations" : "নতুন আবেদন ও অনুমোদন"}
            </span>
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-black">
              ১
            </span>
          </div>
          <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-black text-foreground text-[12px]">মাওলানা আব্দুল্লাহ</div>
                <div className="text-[10px] text-muted-foreground">জোন: মিরপুর জোন | ১২ অক্টোবর</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                অপেক্ষমাণ
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-7 rounded-md bg-emerald-600 text-white font-black flex items-center justify-center gap-1 shadow-xs">
                <span>{isEn ? "Approve User" : "অনুমোদন দিন"}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-white text-emerald-700 text-[9px] flex items-center justify-center font-black">
                  ২
                </span>
              </div>
              <div className="px-3 h-7 rounded-md bg-muted text-muted-foreground font-bold flex items-center justify-center border border-border">
                {isEn ? "Reject" : "বাতিল"}
              </div>
            </div>
          </div>
        </div>
      );

    // ── Admin Step 3: Audit Submitted Reports ──
    case "admin-step-3":
      return (
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-black text-foreground">
              {isEn ? "Submitted Zone Reports Audit" : "জমাকৃত রিপোর্ট নিরীক্ষা"}
            </span>
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-black">
              ১
            </span>
          </div>
          <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
            <div>
              <div className="font-black text-foreground text-[12px]">মিরপুর জোন — অক্টোবর ২০২৬</div>
              <div className="text-[10px] text-muted-foreground">জমা দিয়েছেন: মোঃ ইব্রাহীম (১৫ কেন্দ্র, ১২ কোর্স)</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-black flex items-center gap-1 shadow-xs">
              <Eye className="w-3.5 h-3.5" />
              <span>{isEn ? "Audit" : "অডিট করুন"}</span>
            </div>
          </div>
        </div>
      );

    // ── Admin Step 4: City Report & Cell Overrides ──
    case "admin-step-4":
      return (
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-black text-foreground">
              {isEn ? "Metropolitan Aggregate & Overrides" : "ঢাকা মহানগরীর সমন্বিত রিপোর্ট"}
            </span>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-[10px]">
              <span>{isEn ? "Edit Mode Active" : "এডিট মোড চালু"}</span>
              <span className="w-3.5 h-3.5 rounded-full bg-amber-600 dark:bg-amber-400 text-card text-[9px] flex items-center justify-center font-black">
                ১
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
              <span className="text-[11px] font-bold text-foreground">মোট মহানগরী কেন্দ্র সংখ্যা</span>
              <span className="font-black text-foreground">১২০</span>
            </div>
            {/* Overridden Cell Pin 2 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border-2 border-amber-500/50">
              <div>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">
                  মোট ছাত্র সংখ্যা (সংশোধিত)
                </span>
                <span className="text-[9px] text-amber-600 dark:text-amber-400/80">অ্যাডমিন কর্তৃক ওভাররাইড করা</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">
                  ২
                </span>
                <div className="px-2 py-0.5 rounded bg-card font-black text-amber-600 dark:text-amber-400 border border-amber-500/40">
                  ৭৫০ ✏️
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    // ── Admin Step 5: Official Executive Export ──
    case "admin-step-5":
      return (
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-black text-foreground">
              {isEn ? "Executive Export Engine" : "মহানগরীর অফিশিয়াল এক্সপোর্ট"}
            </span>
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-black">
              ১
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="h-9 rounded-lg bg-primary text-primary-foreground font-black flex items-center justify-center gap-1.5 shadow-xs">
              <Printer className="w-3.5 h-3.5" />
              <span>{isEn ? "Central PDF (2-Page)" : "কেন্দ্রীয় PDF ডাউনলোড"}</span>
            </div>
            <div className="h-9 rounded-lg bg-muted text-foreground border border-border font-bold flex items-center justify-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEn ? "City Excel Sheet" : "মহানগরী Excel শিট"}</span>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
