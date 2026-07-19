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
  inline?: boolean;
  inputWidth?: string;
  tableMode?: boolean;
}

export function AutoSaveField({ label, name, type = "text", placeholder, section, table, category, inline = false, inputWidth, tableMode = false }: AutoSaveFieldProps) {
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
  const currentVal = getInitialValue();
  useEffect(() => {
    setLocalValue(currentVal);
  }, [currentVal]);

  const handleBlur = useCallback(() => {
    if (localValue !== getInitialValue()) {
      updateField(name, localValue, section, table, category);
    }
  }, [localValue, getInitialValue, name, section, table, category, updateField]);

  if (tableMode) {
    return (
      <input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder || "0"}
        className="w-full h-9 text-center bg-transparent hover:bg-muted/40 focus:bg-background border border-transparent focus:border-primary rounded-lg px-1 font-bold text-xs sm:text-sm outline-none transition-all"
      />
    );
  }

  if (inline) {
    return (
      <div className="flex items-center justify-between gap-3 bg-muted/20 border border-border/60 px-3.5 py-2 rounded-xl group hover:border-primary/40 focus-within:border-primary transition-all">
        <label className="text-sm font-bold text-foreground group-focus-within:text-primary transition-colors shrink-0 truncate">
          {label}
        </label>
        <input
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`modern-input h-10 ${inputWidth || "w-24"} px-2.5 py-1 text-center font-bold bg-background focus:bg-background shadow-xs transition-all shrink-0`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full group">
      <label className="text-sm font-bold text-muted-foreground group-focus-within:text-primary transition-colors">
        {label}
      </label>
      
      {type === "textarea" ? (
        <textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="modern-input min-h-[110px] resize-none bg-muted/30 focus:bg-background transition-all"
        />
      ) : (
        <input
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="modern-input h-[46px] bg-muted/30 focus:bg-background transition-all font-semibold"
        />
      )}
    </div>
  );
}
