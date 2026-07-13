"use client";

import { AutoSaveField } from "../auto-save-field";
import { MessageSquare } from "lucide-react";

export function CommentsForm() {
  return (
    <div className="space-y-4">
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
    </div>
  );
}
