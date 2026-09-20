"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4 text-center max-w-md mx-auto animate-in fade-in duration-300">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shadow-xs">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-black text-foreground">কিছু একটা সমস্যা হয়েছে!</h2>
        <p className="text-xs text-muted-foreground">
          পৃষ্ঠাটি লোড করতে অপ্রত্যাশিত ত্রুটি দেখা দিয়েছে। পুনরায় চেষ্টা করতে নিচের বোতামে চাপুন।
        </p>
      </div>

      <div className="flex items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="modern-btn btn-primary h-10 px-4 text-xs font-bold flex items-center gap-2 rounded-xl"
        >
          <RotateCcw className="w-4 h-4" />
          পুনরায় চেষ্টা করুন
        </button>

        <Link
          href="/"
          className="modern-btn bg-muted hover:bg-muted/80 text-foreground h-10 px-4 text-xs font-bold flex items-center gap-2 rounded-xl border border-border transition-colors"
        >
          <Home className="w-4 h-4" />
          হোম ড্যাশবোর্ড
        </Link>
      </div>
    </div>
  );
}
