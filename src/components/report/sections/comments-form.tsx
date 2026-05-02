"use client";

import { AutoSaveField } from "../auto-save-field";
import { MessageSquare } from "lucide-react";

export function CommentsForm() {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm hover:border-yellow-500/30 transition-all">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
          <div className="p-2.5 bg-yellow-500/10 rounded-2xl text-yellow-600">
             <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-foreground leading-tight">মন্তব্য</h3>
        </div>

        <div className="pt-2">
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
