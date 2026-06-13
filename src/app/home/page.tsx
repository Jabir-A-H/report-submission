"use client";

import Link from "next/link";
import { Building2, ArrowRight, FileText, Download, MapPin } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";

export default function LandingPage() {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden bg-background text-foreground">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

      {/* Left Panel: Branding / Messaging */}
      <div className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden bg-linear-to-br from-primary/10 to-primary/5 border-r border-border/50">
        <div className="max-w-md mx-auto relative z-10">
          <div className="w-20 h-20 bg-primary text-primary-foreground rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/30 transform -rotate-6">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black text-foreground mb-6 leading-tight tracking-tight font-bengali">
            {t.siteTitle}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {language === "bn"
              ? "আপনার সকল রিপোর্ট এবং সাংগঠনিক ডেটা সাবমিট করার জন্য সবচেয়ে নিরাপদ ও আধুনিক প্ল্যাটফর্ম। অনুগ্রহ করে প্রবেশ করুন বা নতুন নিবন্ধন করুন।"
              : "The most secure and modern platform to submit all your organizational reports and data. Please enter or register to get started."}
          </p>
        </div>
      </div>

      {/* Right Panel: Content & Toggles */}
      <div className="flex flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-screen relative">
        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full max-w-lg mx-auto lg:mx-0 lg:max-w-none mb-8 animate-in fade-in duration-500">
          {/* Logo on Mobile */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-lg font-black text-primary uppercase tracking-tighter">
              {t.siteTitle}
            </span>
          </div>

          {/* Controls Container */}
          <div className="flex flex-wrap items-center gap-4 bg-card/60 backdrop-blur-md p-2 rounded-2xl border border-border/60 shadow-sm ml-auto">
            <LanguageToggle />
            <div className="w-px h-6 bg-border/80 hidden sm:block" />
            <ThemeToggle />
          </div>
        </div>

        {/* Main Card */}
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div>
            <h2 className="text-4xl font-black text-foreground mb-2">
              {t.welcome}!
            </h2>
            <p className="text-muted-foreground font-medium">
              {t.welcomeSub}
            </p>
          </div>

          <div className="space-y-4">
            {/* Login Button */}
            <Link
              href="/login"
              className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center transition-all hover:bg-primary/90 hover:-translate-y-0.5 shadow-xl shadow-primary/10 group tap-target"
            >
              <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
              {t.enterApp}
            </Link>

            {/* Register Button */}
            <Link
              href="/register"
              className="w-full bg-card hover:bg-muted/30 border-2 border-border text-foreground py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center transition-all hover:-translate-y-0.5 shadow-md tap-target"
            >
              {t.createAccount}
            </Link>
          </div>

          {/* Features */}
          <div className="pt-6 border-t border-border/60">
            <div className="grid grid-cols-1 gap-4 text-sm font-semibold text-muted-foreground">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mr-3 text-emerald-500 border border-emerald-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                {t.features.monthlyAnnual}
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-primary border border-primary/20">
                  <Download className="w-4 h-4" />
                </div>
                {t.features.download}
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center mr-3 text-amber-500 border border-amber-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
                {t.features.cityManagement}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground/60 text-xs font-semibold">
          <p>© {new Date().getFullYear()} {t.siteTitle}. {language === "bn" ? "সকল অধিকার সংরক্ষিত।" : "All rights reserved."}</p>
        </div>
      </div>
    </div>
  );
}
