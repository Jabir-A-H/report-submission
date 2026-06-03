"use client";

import { useState } from "react";
import {
  HelpCircle,
  BookOpen,
  Mail,
  Phone,
  Clock,
  User,
  Settings,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

// ─── Help Center Content ──────────────────────────────────────────────────────

const FAQ_SECTIONS = [
  {
    id: "general",
    label: "সাধারণ প্রশ্নসমূহ",
    icon: <HelpCircle className="w-4 h-4" />,
    items: [
      {
        question: "রিপোর্ট সাবমিশন সিস্টেমটি কী?",
        answer:
          "এটি তা'লীমুল কুরআন ঢাকা মহানগরীর জোনগুলোর জন্য একটি আধুনিক ও ডিজিটাল রিপোর্ট জমাদান ও ব্যবস্থাপনা প্ল্যাটফর্ম। এর মাধ্যমে জোনের প্রতিনিধিরা তাদের মাসিক ও সাময়িক রিপোর্ট খুব সহজেই জমা দিতে পারেন এবং অ্যাডমিনরা সম্মিলিত রিপোর্ট বিশ্লেষণ করতে পারেন।",
      },
      {
        question: "আমি পাসওয়ার্ড ভুলে গেলে কীভাবে উদ্ধার করব?",
        answer:
          "লগইন পেজে থাকা 'পাসওয়ার্ড পুনরুদ্ধার' অপশনটি ব্যবহার করুন অথবা সরাসরি আপনার দায়িত্বপ্রাপ্ত অ্যাডমিনের সাথে যোগাযোগ করুন। অ্যাডমিন আপনার অ্যাকাউন্ট রিসেট করতে পারবেন।",
      },
      {
        question: "সিস্টেমটির থিম বা ভাষা কীভাবে পরিবর্তন করব?",
        answer:
          "আমাদের সিস্টেমে ৪টি চমৎকার আধুনিক থিম (Light, Dark, Solarized Light, Solarized Dark) এবং ২টি ভাষা (বাংলা ও ইংরেজি) রয়েছে। স্ক্রিনের উপরের ডান কোণায় থাকা থিম আইকন এবং ভাষা সিলেক্টর ব্যবহার করে আপনি সহজেই এগুলো পরিবর্তন করতে পারবেন।",
      },
    ],
  },
  {
    id: "user",
    label: "জোন ব্যবহারকারী গাইড",
    icon: <User className="w-4 h-4" />,
    items: [
      {
        question: "রিপোর্ট কীভাবে তৈরি ও পূরণ করব?",
        answer:
          "ড্যাশবোর্ডের 'নতুন রিপোর্ট জমা দিন' বাটনে ক্লিক করে ফরম পেজে প্রবেশ করুন। সেখানে মূল তথ্য, কোর্স, সংগঠন, ব্যক্তিগত উদ্যোগ, বৈঠক ও মন্তব্য সহ ৭টি ধাপ রয়েছে। ধাপে ধাপে সকল তথ্য ইনপুট দিন।",
      },
      {
        question: "অটো-সেভ বা অটোমেটিক সংরক্ষণ কীভাবে কাজ করে?",
        answer:
          "আমাদের সিস্টেমে রয়েছে ক্লাউড অটো-সেভ। আপনি ফরমে যেকোনো মান লিখলে বা সিলেক্ট করলেই স্ক্রিনের উপরে 'সংরক্ষিত হচ্ছে...' দেখাবে এবং ১ সেকেন্ডের মধ্যে তা স্বয়ংক্রিয়ভাবে সেভ হয়ে যাবে। এর ফলে ইন্টারনেট সংযোগ বিচ্ছিন্ন হলেও আপনার কোনো তথ্য হারিয়ে যাবে না।",
      },
      {
        question: "আমি কি জমা দেওয়া রিপোর্ট পরবর্তীতে এডিট করতে পারব?",
        answer:
          "রিপোর্ট পূরণ করার সময় এটি ড্রাফট হিসেবে সংরক্ষিত থাকে। পূরণ সম্পন্ন করে সাবমিট করার পর সেটি অ্যাডমিনের মূল্যায়নে চলে যায়। তবে পরবর্তীতে কোনো সংশোধনের প্রয়োজন হলে অ্যাডমিনকে অবহিত করতে পারেন, অ্যাডমিন সেটি ওভাররাইড করতে পারবেন।",
      },
    ],
  },
  {
    id: "admin",
    label: "অ্যাডমিন প্যানেল গাইড",
    icon: <Settings className="w-4 h-4" />,
    items: [
      {
        question: "নতুন কোনো ব্যবহারকারীকে কীভাবে অনুমোদন দেব?",
        answer:
          "অ্যাডমিন প্যানেলের 'অনুমোদন' (Approval) ট্যাবে যান। সেখানে অপেক্ষমাণ সকল নতুন রেজিস্ট্রেশনের তালিকা দেখতে পাবেন। আপনি 'অনুমোদন করুন' বাটনে ক্লিক করলেই ব্যবহারকারী অ্যাকাউন্টটি সক্রিয় হয়ে যাবে এবং তারা ড্যাশবোর্ডে লগইন করতে পারবেন।",
      },
      {
        question: "সিটি রিপোর্ট ওভাররাইড বা সংশোধন সিস্টেম কীভাবে কাজ করে?",
        answer:
          "সিটি রিপোর্ট পেজে যাওয়ার পর উপরে থাকা 'ওভাররাইড করুন' বাটনে ক্লিক করলে প্রতিটি সেলের পাশে একটি এডিট আইকন আসবে। সেখানে ক্লিক করে আপনি যেকোনো ভুল তথ্যের সঠিক রূপটি লিখে দিতে পারেন। সংশোধিত সেলগুলো একটি স্বতন্ত্র হলুদ আভা (Amber glow) দিয়ে চিহ্নিত হবে যেন আপনি সহজে বুঝতে পারেন কোন তথ্যটি সংশোধন করা হয়েছে।",
      },
      {
        question: "Excel ও PDF এক্সপোর্ট কীভাবে কাজ করে?",
        answer:
          "যেকোনো জোন রিপোর্ট অথবা সমষ্টিগত সিটি রিপোর্ট পেজের উপরে থাকা PDF ও Excel বাটনে ক্লিক করে আপনি সরাসরি প্রিন্ট-রেডি ফাইল ডাউনলোড করতে পারেন। এই ফাইলগুলোতে বাংলা ফন্ট ও সংখ্যাগুলো সুন্দরভাবে সাজানো থাকে।",
      },
    ],
  },
];

const STEPS = [
  {
    title: "ধাপ ১: লগইন ও রেজিস্ট্রেশন",
    desc: "প্রথমে সিস্টেমে নিজের জোন সিলেক্ট করে রেজিস্টার করুন। আপনার অ্যাকাউন্টটি অ্যাডমিন দ্বারা অ্যাক্টিভেট হওয়ার পর লগইন করুন।",
  },
  {
    title: "ধাপ ২: রিপোর্ট পূরণ শুরু করুন",
    desc: "ইউজার ড্যাশবোর্ডে গিয়ে বছর, মাস ও রিপোর্টের ধরন সিলেক্ট করে 'ফরম পূরণ করুন' বাটনে ক্লিক করুন। ফরমে থাকা ট্যাবগুলোর ক্রমানুসারে ডেটা পূরণ করুন।",
  },
  {
    title: "ধাপ ৩: অটো-সেভ নিশ্চিতকরণ",
    desc: "প্রতিটি ঘর পূরণের সময় উপরে 'সংরক্ষিত হয়েছে' সবুজ সংকেতটি লক্ষ্য করুন। নিশ্চিত হয়ে পরবর্তী ট্যাবে যান।",
  },
  {
    title: "ধাপ ৪: জমাদান সম্পন্ন করুন",
    desc: "সকল ট্যাব পূরণ শেষে এক নজরে পুরো রিপোর্টটি দেখে নিন এবং আপনার চূড়ান্ত মন্তব্য লিখে সেভ করুন।",
  },
];

// ─── Help Page Component ──────────────────────────────────────────────────────

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  const activeSection = FAQ_SECTIONS.find((s) => s.id === activeTab) || FAQ_SECTIONS[0];

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  return (
    <div className="container py-10 max-w-5xl px-4 md:px-6">
      {/* ── Page Header ── */}
      <div className="text-center mb-12">
        <div className="inline-flex p-4 bg-primary/10 text-primary rounded-3xl mb-4">
          <BookOpen className="w-10 h-10" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground">
          সাহায্য ও নির্দেশিকা কেন্দ্র
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm md:text-base">
          রিপোর্ট সাবমিশন সিস্টেমের ব্যবহারবিধি, সাধারণ সমস্যা সমাধান এবং সহায়তার বিস্তারিত তথ্য এখানে পাবেন।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Sidebar: FAQ Categories & Tabs ── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 mb-3">
              ক্যাটেগরি সমূহ
            </h3>
            <div className="flex flex-col gap-1.5">
              {FAQ_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveTab(section.id);
                    setOpenFAQIndex(null);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
                    activeTab === section.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {section.icon}
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Support Card */}
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-full blur-2xl -mr-6 -mt-6" />
            <h3 className="font-bold text-base text-foreground mb-4 relative z-10">
              জরুরি কারিগরি সহায়তা
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">ইমেইল করুন</span>
                  <a
                    href="mailto:support@talimulquran.org"
                    className="font-bold text-foreground hover:text-primary transition-colors"
                  >
                    support@talimulquran.org
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-green-500/10 text-green-600 rounded-lg">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">হটলাইন নম্বর</span>
                  <span className="font-bold text-foreground">+৮৮০ ১৭০০-০০০০০০</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">সক্রিয়তার সময়</span>
                  <span className="font-medium text-foreground">সকাল ৯:০০ - রাত ৯:০০ (শনি - বৃহঃ)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Content Panel: FAQ Accordion & Step Guide ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* FAQ Accordion */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              {activeSection.label}
            </h2>

            <div className="space-y-3">
              {activeSection.items.map((item, idx) => {
                const isOpen = openFAQIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-border/60 rounded-xl overflow-hidden bg-muted/20"
                  >
                    <button
                      onClick={() => toggleFAQ(idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-foreground text-sm hover:bg-muted/40 transition-colors"
                    >
                      <span className="pr-4">{item.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`transition-all duration-300 ease-in-out ${
                        isOpen ? "max-h-[300px] border-t border-border/40 p-4" : "max-h-0 opacity-0"
                      } bg-card text-muted-foreground text-xs md:text-sm leading-relaxed`}
                    >
                      {item.answer}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Journey Step-by-Step Guide */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              রিপোর্ট জমাদানের সহজ ৪টি ধাপ
            </h2>

            <div className="relative border-l-2 border-dashed border-border ml-3 pl-6 space-y-6">
              {STEPS.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Step Dot */}
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-card" />
                  <div>
                    <h4 className="font-bold text-sm text-foreground mb-1">
                      {step.title}
                    </h4>
                    <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings & Best Practices */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-3 text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm mb-1">প্রয়োজনীয় টিপস</h4>
              <p className="text-xs leading-relaxed opacity-90">
                রিপোর্ট পূরণের সময় ইন্টারনেট ডাউন হলেও চিন্তার কারণ নেই, অটো-সেভ সচল থাকবে। তবে প্রতিটি ফর্ম সেকশনে ডেটা লেখার সময় 'সংরক্ষিত হয়েছে' মেসেজটি দেখে নেয়া ভালো। চূড়ান্ত সাবমিটের আগে 'রিপোর্ট (এক নজরে)' পেজে গিয়ে সকল তথ্য মিলিয়ে নিতে পারেন।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
