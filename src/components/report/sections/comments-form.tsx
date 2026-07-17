"use client";

import { AutoSaveField } from "../auto-save-field";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import { useReport } from "../report-context";

export function CommentsForm() {
  const { data, updateField, reportId } = useReport();
  const isSubmitted = Boolean(data?.is_submitted);

  const handleSubmissionToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (reportId) {
      await updateField("is_submitted", checked, "comment", "report");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
          <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-600">
             <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">মন্তব্য</h3>
        </div>

        <div className="pt-1">
            <AutoSaveField 
              label="বিশেষ কোন মন্তব্য থাকলে এখানে লিখুন" 
              name="comment" 
              type="textarea" 
              section="comment" 
              table="report_comment" 
              placeholder="আপনার বিস্তারিত মন্তব্য এখানে লিখুন..."
            />
        </div>
      </div>

      {/* Report Submission Confirmation Checkbox Card */}
      <div className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
        isSubmitted 
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-sm" 
          : "bg-primary/5 border-primary/20 text-foreground"
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl mt-0.5 ${isSubmitted ? "bg-emerald-500/20 text-emerald-600" : "bg-primary/10 text-primary"}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-base sm:text-lg leading-tight">
              রিপোর্ট জমা সম্পন্ন হয়েছে (Report Submission Done)
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              সবগুলো সেকশন সঠিকভাবে পূরণ করা হলে এই বক্সে টিক দিয়ে আপনার মাসিক রিপোর্ট জমা নিশ্চিত করুন।
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <input 
            type="checkbox" 
            checked={isSubmitted} 
            onChange={handleSubmissionToggle} 
            className="w-6 h-6 sm:w-7 sm:h-7 accent-emerald-600 rounded-lg cursor-pointer transition-transform active:scale-95" 
            id="report-submission-checkbox"
          />
        </div>
      </div>
    </div>
  );
}

