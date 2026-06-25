"use client";

import { useReport } from "./report-context";
import { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/components/providers/language-provider";

interface AutoSaveFieldProps {
  label: string;
  name: string;
  type?: "number" | "text" | "textarea";
  placeholder?: string;
  section: string;
  table?: string;
  category?: string;
}

export function AutoSaveField({ label, name, type = "text", placeholder, section, table, category }: AutoSaveFieldProps) {
  const { data, updateField } = useReport();
  const { language } = useLanguage();

  // Helper to extract the initial value based on the nested structure
  const getInitialValue = useCallback(() => {
    if (!data) return "";
    
    // Header
    if (table === "report_header" && data.header) {
      return data.header[name] || "";
    }
    
    // Arrays (courses, organizational, personal, meeting, extra)
    if (category) {
      let arrayData = null;
      if (table === "report_course") arrayData = data.courses;
      else if (table === "report_organizational") arrayData = data.organizational;
      else if (table === "report_personal") arrayData = data.personal;
      else if (table === "report_meeting") arrayData = data.meeting;
      else if (table === "report_extra") arrayData = data.extra;

      if (Array.isArray(arrayData)) {
        const row = arrayData.find(item => item.category === category);
        if (row) return row[name] || "";
      }
    }
    
    // Comment
    if (table === "report_comment" && data.comment) {
      return data.comment[name] || "";
    }

    // Default root level (report table)
    return data[name] || "";
  }, [data, name, table, category]);

  const [localValue, setLocalValue] = useState(getInitialValue());

  // Update local value if data changes externally (e.g. on load)
  useEffect(() => {
    setLocalValue(getInitialValue());
  }, [getInitialValue]);

  const handleBlur = useCallback(() => {
    if (localValue !== getInitialValue()) {
      updateField(name, localValue, section, table, category);
    }
  }, [localValue, getInitialValue, name, section, table, category, updateField]);

  return (
    <div className="flex flex-col gap-2 w-full group">
      <label className="text-sm font-bold text-muted-foreground group-focus-within:text-primary transition-colors">
        {label}
      </label>
      
      {type === "textarea" ? (
        <textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="modern-input min-h-[120px] resize-none bg-muted/30 focus:bg-background transition-all"
        />
      ) : (
        <input
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="modern-input h-[52px] bg-muted/30 focus:bg-background transition-all"
        />
      )}
    </div>
  );
}
