"use client";

import { useState } from "react";
import { AutoSaveField } from "../auto-save-field";
import { UserPlus, ChevronDown } from "lucide-react";
import { ViewModeProvider, useViewModeContext } from "../view-mode-toggle";

export const PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"];

export const PERSONAL_METRICS_ROWS = [
  { key: "teaching", label: "কতজন শিখাচ্ছেন" },
  { key: "learning", label: "কতজনকে শিখাচ্ছেন" },
  { key: "olama_invited", label: "দাওয়াতপ্রাপ্ত ওলামা" },
  { key: "became_shohojogi", label: "সহযোগী হয়েছেন" },
  { key: "became_sokrio_shohojogi", label: "সক্রিয় সহযোগী হয়েছেন" },
  { key: "became_kormi", label: "কর্মী হয়েছেন" },
  { key: "became_rukon", label: "রুকন হয়েছেন" },
];

function PersonalFormContent() {
  const { viewMode } = useViewModeContext();
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    [PERSONAL_CATEGORIES[0]]: true,
  });

  const toggleCard = (category: string) => {
    setOpenCards((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (viewMode === "table") {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs overflow-x-auto animate-in fade-in duration-300">
        <table className="w-full text-left border-collapse min-w-[550px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground text-xs font-black">
              <th className="p-3 w-52 sticky left-0 bg-muted/90 backdrop-blur z-10 border-r border-border/50 text-left">
                ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন
              </th>
              {PERSONAL_CATEGORIES.map((cat) => (
                <th key={cat} className="p-2 text-center w-32 border-r border-border font-bold text-foreground">
                  {cat === "সক্রিয় সহযোগী" ? "সক্রিয় সহযোগী হয়েছেন" : cat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {PERSONAL_METRICS_ROWS.map((metric) => (
              <tr key={metric.key} className="hover:bg-muted/30 transition-colors">
                <td className="p-3 w-52 font-bold text-foreground sticky left-0 bg-card z-10 border-r border-border/50 text-xs sm:text-sm">
                  {metric.label}
                </td>
                {PERSONAL_CATEGORIES.map((cat) => (
                  <td key={cat} className="p-1 border-r border-border/40">
                    <AutoSaveField
                      label=""
                      name={metric.key}
                      type="number"
                      section="personal"
                      table="report_personal"
                      category={cat}
                      tableMode
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 animate-in fade-in duration-300">
      {PERSONAL_CATEGORIES.map((category) => {
        const isOpen = !!openCards[category];

        return (
          <div
            key={category}
            className="bg-card border border-border/60 rounded-2xl shadow-2xs overflow-hidden transition-all"
          >
            {/* Collapsible Card Header */}
            <button
              type="button"
              onClick={() => toggleCard(category)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/30 transition-colors cursor-pointer outline-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-pink-500/10 rounded-xl text-pink-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {category === "সক্রিয় সহযোগী" ? "সক্রিয় সহযোগী হয়েছেন" : category}
                </h3>
              </div>
              <div className="p-1.5 rounded-lg bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {/* Collapsible Card Body */}
            {isOpen && (
              <div className="p-4 sm:p-5 pt-0 border-t border-border/40 space-y-5 animate-in fade-in duration-200">
                {/* General Teaching */}
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <AutoSaveField
                    label="কতজন শিখাচ্ছেন"
                    name="teaching"
                    type="number"
                    section="personal"
                    table="report_personal"
                    category={category}
                    inline
                    inputWidth="w-28"
                  />
                  <AutoSaveField
                    label="কতজনকে শিখাচ্ছেন"
                    name="learning"
                    type="number"
                    section="personal"
                    table="report_personal"
                    category={category}
                    inline
                    inputWidth="w-28"
                  />
                </div>

                {/* Olama Outreach - Clean without nested box borders */}
                <div className="pt-4 border-t border-border/40 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2.5">
                    <h4 className="text-xs font-bold text-pink-600 uppercase tracking-wide">উলামাদের মাঝে দাওয়াত</h4>
                    <div className="w-full sm:w-64">
                      <AutoSaveField
                        label="দাওয়াত দিয়েছেন (জন)"
                        name="olama_invited"
                        type="number"
                        section="personal"
                        table="report_personal"
                        category={category}
                        inline
                        inputWidth="w-24"
                      />
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2.5">দাওয়াত প্রাপ্ত উলামাদের মধ্যে:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <AutoSaveField
                        label="সহযোগী হয়েছেন"
                        name="became_shohojogi"
                        type="number"
                        section="personal"
                        table="report_personal"
                        category={category}
                        inline
                      />
                      <AutoSaveField
                        label="সক্রিয় সহযোগী হয়েছেন"
                        name="became_sokrio_shohojogi"
                        type="number"
                        section="personal"
                        table="report_personal"
                        category={category}
                        inline
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <AutoSaveField
                      label="কর্মী হয়েছেন"
                      name="became_kormi"
                      type="number"
                      section="personal"
                      table="report_personal"
                      category={category}
                      inline
                    />
                    <AutoSaveField
                      label="রুকন হয়েছেন"
                      name="became_rukon"
                      type="number"
                      section="personal"
                      table="report_personal"
                      category={category}
                      inline
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PersonalForm() {
  return (
    <ViewModeProvider defaultMode="card">
      <PersonalFormContent />
    </ViewModeProvider>
  );
}
