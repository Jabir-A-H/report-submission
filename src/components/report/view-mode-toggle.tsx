"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { LayoutList, Table2 } from "lucide-react";

export type ViewMode = "card" | "table";

interface ViewModeContextType {
  viewMode: ViewMode;
  changeMode: (mode: ViewMode) => void;
}

export const ViewModeContext = createContext<ViewModeContextType | null>(null);

export function useViewMode(defaultMode: ViewMode = "card") {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    const saved = localStorage.getItem("report-view-mode") as ViewMode;
    if (saved === "card" || saved === "table") {
      setViewMode(saved);
    }
  }, []);

  const changeMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("report-view-mode", mode);
  };

  return { viewMode, changeMode };
}

export function ViewModeProvider({
  children,
  defaultMode = "card",
}: {
  children: React.ReactNode;
  defaultMode?: ViewMode;
}) {
  const existing = useContext(ViewModeContext);
  const { viewMode, changeMode } = useViewMode(defaultMode);

  if (existing) {
    return <>{children}</>;
  }

  return (
    <ViewModeContext.Provider value={{ viewMode, changeMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewModeContext() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewModeContext must be used within ViewModeProvider");
  }
  return context;
}

/**
 * Compact icon-based toggle rendered in the top-right section header.
 * Automatically hides if not inside a ViewModeProvider.
 */
export function CompactViewToggle() {
  const context = useContext(ViewModeContext);
  if (!context) return null;

  const { viewMode, changeMode } = context;

  return (
    <div className="flex items-center bg-muted/60 border border-border/80 p-1 rounded-xl gap-1 shadow-2xs">
      <button
        type="button"
        onClick={() => changeMode("card")}
        title="Form View"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          viewMode === "card"
            ? "bg-background text-primary shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutList className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Form</span>
      </button>
      <button
        type="button"
        onClick={() => changeMode("table")}
        title="Table View"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          viewMode === "table"
            ? "bg-background text-primary shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Table2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Table</span>
      </button>
    </div>
  );
}
