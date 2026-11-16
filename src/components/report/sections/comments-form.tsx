"use client";

import { useState } from "react";
import { AutoSaveField } from "../auto-save-field";
import { MessageSquare, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useReport } from "../report-context";
import { useLanguage } from "@/components/providers/language-provider";

export function CommentsForm() {
  const { t } = useLanguage();
  const { data, updateField, reportId, failedFields, drainPendingSaves } = useReport();
  const [submitting, setSubmitting] = useState(false);
  const [submissionWarning, setSubmissionWarning] = useState<string | null>(null);

  const isSubmitted = Boolean(data?.is_submitted);

  const handleSubmissionToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSubmissionWarning(null);

    if (!reportId) return;

    if (checked) {
      // Confirm submission
      const confirmed = window.confirm(
        "আপনি কি নিশ্চিত যে আপনার মাসিক রিপোর্ট জমা দিতে চান? জমা সম্পন্ন হলে রিপোর্টটি পর্যালোচনার জন্য প্রস্তুত হবে।"
      );
      if (!confirmed) {
        return;
      }

      setSubmitting(true);

      // Pre-flight drain: Blur active element to flush any pending field changes
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Wait up to 2,500ms for saves to drain
      const drained = await drainPendingSaves(2500);

      // Check if any fields failed to save
      const failedCount = Object.keys(failedFields).length;
      if (!drained || failedCount > 0) {
        setSubmitting(false);
        const warningMsg = "কিছু তথ্য সংরক্ষণ করা সম্ভব হয়নি। অনুগ্রহ করে পূর্বে সংরক্ষণ সম্পন্ন করুন।";
        setSubmissionWarning(warningMsg);
        alert(warningMsg);
        return;
      }

      const res = await updateField("is_submitted", true, "comment", "report");
      setSubmitting(false);
      if (!res.success) {
        setSubmissionWarning("রিপোর্ট জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } else {
      const confirmed = window.confirm("আপনি কি রিপোর্টটি পুনরায় সম্পাদনা মোডে নিতে চান?");
      if (!confirmed) return;

      setSubmitting(true);
      await updateField("is_submitted", false, "comment", "report");
      setSubmitting(false);
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
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">{t.labels.comments}</h3>
        </div>

        <div className="pt-1">
            <AutoSaveField 
              label={t.labels.specialComment} 
              name="comment" 
              type="textarea" 
              section="comment" 
              table="report_comment" 
              placeholder={t.labels.commentPlaceholder}
            />
        </div>
      </div>

      {/* Submission Warning Banner */}
      {submissionWarning && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-2xl flex items-center gap-3 text-destructive animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-xs sm:text-sm font-bold">{submissionWarning}</p>
        </div>
      )}

      {/* Report Submission Confirmation Checkbox Card */}
      <div className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
        isSubmitted 
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-sm" 
          : "bg-primary/5 border-primary/20 text-foreground"
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl mt-0.5 ${
            isSubmitted ? "bg-emerald-500/20 text-emerald-600" : "bg-primary/10 text-primary"
          }`}>
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-base sm:text-lg leading-tight">
                {t.labels.reportSubmissionDone}
              </h4>
              {isSubmitted && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-600 text-white shadow-xs">
                  জমাকৃত
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              {t.labels.reportSubmissionHelper}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <input 
            type="checkbox" 
            checked={isSubmitted} 
            disabled={submitting}
            onChange={handleSubmissionToggle} 
            className="w-6 h-6 sm:w-7 sm:h-7 accent-emerald-600 rounded-lg cursor-pointer transition-transform active:scale-95 disabled:opacity-50" 
            id="report-submission-checkbox"
          />
        </div>
      </div>
    </div>
  );
}
