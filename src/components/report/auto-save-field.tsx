"use client";

import { useReport } from "./report-context";
import { useState, useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { toBn, bnToEn, parseBangladeshiNumber } from "@/lib/report-utils";

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

export function AutoSaveField({
  label,
  name,
  type = "text",
  placeholder,
  section,
  table = "report",
  category,
  inline = false,
  inputWidth,
  tableMode = false,
}: AutoSaveFieldProps) {
  const { data, updateField, failedFields, reportId } = useReport();
  const { language } = useLanguage();

  const fieldKey = `${reportId || 0}:${table}:${category || ""}:${name}`;
  const draftStorageKey = `draft:${reportId || 0}:${table}:${category || ""}:${name}`;

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
        const row = arrayData.find(
          (item) =>
            item.category === category ||
            (table === "report_course" && item.course_name === category) ||
            (table === "report_meeting" && item.meeting_type === category)
        );
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

  const isMountedRef = useRef(true);
  const dirtyRef = useRef(false);
  const latestValueRef = useRef(localValue);
  const persistRef = useRef<() => void>(() => {});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update local value if data changes externally and user is not actively typing
  const currentVal = getInitialValue();
  useEffect(() => {
    if (!isFocused && isMountedRef.current) {
      // Check if local draft exists
      if (typeof window !== "undefined" && reportId) {
        try {
          const draft = localStorage.getItem(draftStorageKey);
          if (draft !== null && draft !== currentVal) {
            setLocalValue(draft);
            latestValueRef.current = draft;
            dirtyRef.current = true;
            return;
          }
        } catch {}
      }
      setLocalValue(currentVal);
    }
  }, [currentVal, isFocused, draftStorageKey, reportId]);

  /** Persist to DB — normalises Bengali digits to ASCII and safely rounds numbers before saving. */
  const persist = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const initial = getInitialValue();
    const val = latestValueRef.current;
    if (val !== initial) {
      dirtyRef.current = false;
      let res: { success: boolean; error?: any };
      if (type === "number") {
        const parsed = parseBangladeshiNumber(val);
        const valueToSave = parsed.isValid ? String(parsed.value) : "0";
        res = await updateField(name, valueToSave, section, table, category);
      } else {
        res = await updateField(name, String(val).trim(), section, table, category);
      }

      if (res?.success && typeof window !== "undefined" && reportId) {
        try {
          localStorage.removeItem(draftStorageKey);
        } catch {}
      }
    }
  }, [getInitialValue, name, section, table, category, updateField, type, reportId, draftStorageKey]);

  useEffect(() => {
    latestValueRef.current = localValue;
    dirtyRef.current = localValue !== getInitialValue();
    persistRef.current = persist;
  }, [localValue, getInitialValue, persist]);

  const handleChange = useCallback((val: string) => {
    setLocalValue(val);
    latestValueRef.current = val;
    dirtyRef.current = val !== getInitialValue();

    // Write-Ahead Buffer in localStorage
    if (typeof window !== "undefined" && reportId) {
      try {
        localStorage.setItem(draftStorageKey, val);
      } catch {}
    }

    // 1,000ms idle typing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      persistRef.current();
    }, 1000);
  }, [getInitialValue, reportId, draftStorageKey]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    persist();
  }, [persist]);

  // Flush dirty value on tab-hide, page unload, or unmount (e.g. section tab switch)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && dirtyRef.current) {
        persistRef.current();
      }
    };
    const onBeforeUnload = () => {
      if (dirtyRef.current) {
        persistRef.current();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (dirtyRef.current) {
        persistRef.current();
      }
    };
  }, []);

  const isNumeric = type === "number";
  const inputType = isNumeric ? "text" : (type === "textarea" ? "textarea" : type);
  const inputMode = isNumeric ? "numeric" : undefined;

  const isFailed = Boolean(failedFields && failedFields[fieldKey]);

  const sanitizedCategory = category ? category.replace(/[\s/]+/g, "_").toLowerCase() : "root";
  const sanitizedTable = (table || "report").replace(/[\s/]+/g, "_").toLowerCase();
  const fieldId = `field-${section}-${sanitizedTable}-${sanitizedCategory}-${name}`;

  if (tableMode) {
    return (
      <input
        id={fieldId}
        name={name}
        type={inputType}
        inputMode={inputMode}
        enterKeyHint="next"
        value={localValue}
        onFocus={() => setIsFocused(true)}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder || (language === "bn" ? "০" : "0")}
        title={isFailed ? "সংরক্ষণ ব্যর্থ হয়েছে — পুনরায় চেষ্টা করুন" : undefined}
        aria-label={`${category || section} ${label || name}`}
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
          htmlFor={fieldId}
          className={`text-sm font-bold shrink-0 truncate transition-colors cursor-pointer ${
            isFailed ? "text-destructive" : "text-foreground group-focus-within:text-primary"
          }`}
        >
          {label}
        </label>
        <input
          id={fieldId}
          name={name}
          type={inputType}
          inputMode={inputMode}
          enterKeyHint="next"
          value={localValue}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => handleChange(e.target.value)}
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
          htmlFor={fieldId}
          className={`text-sm font-bold transition-colors cursor-pointer ${
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
          id={fieldId}
          name={name}
          value={localValue}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => handleChange(e.target.value)}
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
          id={fieldId}
          name={name}
          type={inputType}
          inputMode={inputMode}
          enterKeyHint="next"
          value={localValue}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => handleChange(e.target.value)}
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
