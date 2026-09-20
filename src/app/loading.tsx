import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3 p-4 text-center select-none animate-in fade-in duration-300">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-xs">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-foreground">লোড হচ্ছে...</p>
        <p className="text-xs text-muted-foreground">অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন</p>
      </div>
    </div>
  );
}
