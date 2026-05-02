"use client";

import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import { Building2, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function AuthView() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background overflow-hidden">
      {/* Visual Side (Hero) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center p-12 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-black/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-white max-w-lg space-y-12">
          <div className="space-y-4">
            <h1 className="text-6xl font-black leading-tight tracking-tighter uppercase whitespace-pre-line">
              {t.siteTitle}
            </h1>
            <p className="text-xl text-primary-foreground/80 font-bold leading-relaxed">
              সহজ, আধুনিক এবং দ্রুত রিপোর্ট সাবমিশন ব্যবস্থা। আপনার জোনের সকল তথ্য এক জায়গায়।
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {[
              { icon: Zap, text: "রিয়েল-টাইম অটো-সেভ সুবিধা" },
              { icon: CheckCircle2, text: "সহজ ইউজার ইন্টারফেস" },
              { icon: ShieldCheck, text: "নিরাপদ ডাটা স্টোরেজ" },
              { icon: Building2, text: "জোন ভিত্তিক ফিল্টারিং" },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all border border-white/10 shadow-xl">
                  <feature.icon className="w-6 h-6" />
                </div>
                <span className="text-lg font-bold">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        {/* Mobile Header (Visible only on small screens) */}
        <div className="lg:hidden absolute top-12 left-0 right-0 text-center px-6">
           <h2 className="text-3xl font-black text-primary uppercase tracking-tighter mb-2">{t.siteTitle}</h2>
           <p className="text-sm text-muted-foreground font-bold italic">সবুজ ও সহজ রিপোর্ট ব্যবস্থাপনা</p>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="flex p-1.5 bg-muted rounded-2xl">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
                activeTab === "login" 
                ? "bg-background text-primary shadow-lg shadow-black/5" 
                : "text-muted-foreground hover:text-foreground"
              }`}
            >
              লগইন
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
                activeTab === "register" 
                ? "bg-background text-primary shadow-lg shadow-black/5" 
                : "text-muted-foreground hover:text-foreground"
              }`}
            >
              নিবন্ধন
            </button>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === "login" ? (
              <LoginForm />
            ) : (
              <RegisterForm />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
