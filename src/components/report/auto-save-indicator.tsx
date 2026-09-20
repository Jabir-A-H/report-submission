"use client";

import { useReport } from "./report-context";
import { Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export function AutoSaveIndicator() {
  const { isSaving, lastSaved, saveError, clearSaveError } = useReport();
  
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>সংরক্ষণ হচ্ছে...</span>
      </div>
    );
  }

  if (saveError) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
        <XCircle className="w-3 h-3 shrink-0" />
        <span>{saveError} —</span>
        <button
          type="button"
          onClick={clearSaveError}
          className="underline underline-offset-2 hover:text-destructive/80 transition-colors"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-600">
        <CheckCircle2 className="w-3 h-3" />
        <span>সংরক্ষিত {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      <AlertCircle className="w-3 h-3" />
      <span>পরিবর্তন স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়</span>
    </div>
  );
}
