"use client";

import { useReport } from "./report-context";
import { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { toBn, bnToEn } from "@/lib/report-utils";

interface AutoSaveFieldProps {
  label: string;
  name: string;
  type?: "number" | "text" | "textarea";
  placeholder?: string;
  section: string;
  table?: string;
  category?: string;
  inline?: boolean;
  inputWidth?: string;
  tableMode?: boolean;
}

export function AutoSaveField({ label, name, type = "text", placeholder, section, table, category, inline = false, inputWidth, tableMode = false }: AutoSaveFieldProps) {
  const { data, updateField, failedFields } = useReport();
  const { language } = useLanguage();

  // Helper to extract the initial value based on the nested structure
  const getInitialValue = useCallback(() => {
    if (!data) return "";
    
    let raw: any = "";
    // Header
    if (table === "report_header" && data.header) {
      raw = data.header[name];
    } else if (category) {
      // Arrays (courses, organizational, personal, meeting, extra)
      let arrayData = null;
      if (table === "report_course") arrayData = data.courses;
      else if (table === "report_organizational") arrayData = data.organizational;
      else if (table === "report_personal") arrayData = data.personal;
      else if (table === "report_meeting") arrayData = data.meeting;
      else if (table === "report_extra") arrayData = data.extra;

      if (Array.isArray(arrayData)) {
        const row = arrayData.find(item => item.category === category);
        if (row) raw = row[name];
      }
    } else if (table === "report_comment" && data.comment) {
      // Comment
      raw = data.comment[name];
    } else {
      // Default root level (report table)
      raw = data[name];
    }

    if (raw === undefined || raw === null || raw === "") return "";

    if (type === "number") {
      return language === "en" ? bnToEn(String(raw)) : toBn(raw);
    }

    return String(raw);
  }, [data, name, table, category, type, language]);

  const [localValue, setLocalValue] = useState(getInitialValue());
  const [isFocused, setIsFocused] = useState(false);

  // Update local value if data changes externally (e.g. on load) and user is not actively typing
  const currentVal = getInitialValue();
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(currentVal);
    }
  }, [currentVal, isFocused]);

  /** Persist to DB — normalises Bengali digits to ASCII and safely rounds numbers before saving. */
  const persist = useCallback(() => {
    const initial = getInitialValue();
    if (localValue !== initial) {
      if (type === "number") {
        const cleaned = String(localValue).replace(/[,\s]/g, "");
        const enStr = bnToEn(cleaned);
        const parsed = parseFloat(enStr);
        // Safely round floats to non-negative integers for PostgreSQL CHECK col >= 0
        const valueToSave = isNaN(parsed) ? "0" : String(Math.max(0, Math.round(parsed)));
        updateField(name, valueToSave, section, table, category);
      } else {
        updateField(name, String(localValue).trim(), section, table, category);
      }
    }
  }, [localValue, getInitialValue, name, section, table, category, updateField, type]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    persist();
  }, [persist]);

  // Task 2: flush dirty value on tab-hide or page unload (mobile-safe exit flush)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persist();
    };
    const onBeforeUnload = () => persist();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [persist]);

  // Task 3: numeric fields use type="text" + inputMode="numeric" to accept Bengali digits
  const isNumeric = type === "number";
  const inputType = isNumeric ? "text" : (type === "textarea" ? "textarea" : type);
  const inputMode = isNumeric ? "numeric" : undefined;

  const fieldKey = `${table || "report"}:${category || ""}:${name}`;
  const isFailed = Boolean(failedFields && failedFields[fieldKey]);

  if (tableMode) {
    return (
      <input
        type={inputType}
        inputMode={inputMode}
        value={localValue}
        onFocus={() => setIsFocused(true)}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder || (language === "bn" ? "০" : "0")}
        title={isFailed ? "সংরক্ষণ ব্যর্থ হয়েছে — পুনরায় চেষ্টা করুন" : undefined}
        className={`w-full h-9 text-center bg-transparent hover:bg-muted/40 focus:bg-background border rounded-lg px-1 font-bold text-xs sm:text-sm outline-none transition-all ${
          isFailed
            ? "border-destructive bg-destructive/10 text-destructive focus:border-destructive ring-1 ring-destructive/40"
            : "border-transparent focus:border-primary"
        }`}
      />
    );
  }

  if (inline) {
    return (
      <div
        className={`flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl group transition-all border ${
          isFailed
            ? "bg-destructive/5 border-destructive/60 focus-within:border-destructive"
            : "bg-muted/20 border-border/60 hover:border-primary/40 focus-within:border-primary"
        }`}
      >
        <label
          className={`text-sm font-bold shrink-0 truncate transition-colors ${
            isFailed ? "text-destructive" : "text-foreground group-focus-within:text-primary"
          }`}
        >
          {label}
        </label>
        <input
          type={inputType}
          inputMode={inputMode}
          value={localValue}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          title={isFailed ? "সংরক্ষণ ব্যর্থ হয়েছে — পুনরায় চেষ্টা করুন" : undefined}
          className={`modern-input h-10 ${inputWidth || "w-24"} px-2.5 py-1 text-center font-bold bg-background shadow-xs transition-all shrink-0 ${
            isFailed
              ? "border-destructive text-destructive focus:border-destructive ring-1 ring-destructive/40"
              : "focus:bg-background"
          }`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full group">
      <div className="flex items-center justify-between">
        <label
          className={`text-sm font-bold transition-colors ${
            isFailed ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
          }`}
        >
          {label}
        </label>
        {isFailed && (
          <span className="text-[11px] text-destructive font-bold animate-in fade-in flex items-center gap-1">
            ⚠️ সংরক্ষণ ব্যর্থ হয়েছে
          </span>
        )}
      </div>

      {type === "textarea" ? (
        <textarea
          value={localValue}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          title={isFailed ? "সংরক্ষণ ব্যর্থ হয়েছে — পুনরায় চেষ্টা করুন" : undefined}
          className={`modern-input min-h-[110px] resize-none transition-all ${
            isFailed
              ? "border-destructive bg-destructive/5 text-destructive focus:border-destructive ring-1 ring-destructive/40"
              : "bg-muted/30 focus:bg-background"
          }`}
        />
      ) : (
        <input
          type={inputType}
          inputMode={inputMode}
          value={localValue}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          title={isFailed ? "সংরক্ষণ ব্যর্থ হয়েছে — পুনরায় চেষ্টা করুন" : undefined}
          className={`modern-input h-[46px] transition-all font-semibold ${
            isFailed
              ? "border-destructive bg-destructive/5 text-destructive focus:border-destructive ring-1 ring-destructive/40"
              : "bg-muted/30 focus:bg-background"
          }`}
        />
      )}
    </div>
  );
}
