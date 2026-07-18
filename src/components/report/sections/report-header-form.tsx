"use client";

import { AutoSaveField } from "../auto-save-field";
import { UserCheck, GraduationCap, Building2 } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

export function ReportHeaderForm() {
  const { t } = useLanguage();

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Basic Info */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <UserCheck className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">{t.labels.basicInfo}</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AutoSaveField 
            label={t.labels.responsibleName} 
            name="responsible_name" 
            section="header" 
            table="report_header"
            placeholder={t.labels.enterName}
          />
          <AutoSaveField 
            label={t.labels.thanaSubBranch} 
            name="thana" 
            section="header" 
            table="report_header"
            placeholder={t.labels.thanaName}
          />
          <AutoSaveField 
            label={t.labels.wardNo} 
            name="ward" 
            type="number"
            section="header" 
            table="report_header"
            placeholder={t.labels.wardNo}
          />
        </div>
      </div>

      {/* Muallima Stats */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
          <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600">
            <GraduationCap className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">{t.labels.muallimaStats}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <AutoSaveField 
            label={t.labels.totalMuallima} 
            name="total_muallima" 
            type="number"
            section="header" 
            table="report_header"
            inline
          />
          <AutoSaveField 
            label={t.labels.increase} 
            name="muallima_increase" 
            type="number"
            section="header" 
            table="report_header"
            inline
          />
          <AutoSaveField 
            label={t.labels.decrease} 
            name="muallima_decrease" 
            type="number"
            section="header" 
            table="report_header"
            inline
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border/40">
          <div className="space-y-3">
             <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wide border-b border-border/30 pb-2">{t.labels.certifiedMuallimaLabel}</h4>
             <AutoSaveField 
               label={t.labels.certifiedMuallimaLabel} 
               name="certified_muallima" 
               type="number"
               section="header" 
               table="report_header"
               inline
             />
             <AutoSaveField 
               label={t.labels.certifiedTakingClasses} 
               name="certified_muallima_taking_classes" 
               type="number"
               section="header" 
               table="report_header"
               inline
             />
          </div>

          <div className="space-y-3">
             <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wide border-b border-border/30 pb-2">{t.labels.trainedMuallimaLabel}</h4>
             <AutoSaveField 
               label={t.labels.trainedMuallimaLabel} 
               name="trained_muallima" 
               type="number"
               section="header" 
               table="report_header"
               inline
             />
             <AutoSaveField 
               label={t.labels.trainedTakingClasses} 
               name="trained_muallima_taking_classes" 
               type="number"
               section="header" 
               table="report_header"
               inline
             />
          </div>
        </div>
      </div>

      {/* Unit Stats */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">{t.labels.unitStats}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AutoSaveField 
            label={t.labels.unitCount} 
            name="total_unit" 
            type="number"
            section="header" 
            table="report_header"
            inline
          />
          <AutoSaveField 
            label={t.labels.unitsWithMuallima} 
            name="units_with_muallima" 
            type="number"
            section="header" 
            table="report_header"
            inline
          />
        </div>
      </div>
    </div>
  );
}
