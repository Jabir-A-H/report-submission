import { CheckCircle2, LogOut, Clock } from 'lucide-react'

export default function PendingApprovalPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-amber-100 rounded-[2rem] flex items-center justify-center shadow-xl shadow-amber-100/50">
          <Clock className="w-12 h-12 text-amber-600" />
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            রেজিস্ট্রেশন সফল!
          </h1>
          <p className="text-muted-foreground font-bold leading-relaxed text-lg">
            আপনার অ্যাকাউন্ট তৈরি হয়েছে। আপনার ইমেইল ইনবক্স চেক করে ইমেইলটি ভেরিফাই করুন এবং অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।
          </p>
        </div>

        {/* Steps */}
        <div className="premium-card p-6 text-left space-y-4 border-amber-200/50 bg-amber-50/30">
          <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">পরবর্তী ধাপ</h3>
          <div className="space-y-3">
            {[
              { done: true, text: 'অ্যাকাউন্ট তৈরি সম্পন্ন' },
              { done: false, text: 'ইমেইল ভেরিফিকেশন (ইমেইলে পাঠানো লিংক চেক করুন)' },
              { done: false, text: 'অ্যাডমিনের অনুমোদন (অপেক্ষমাণ)' },
              { done: false, text: 'লগইন করুন এবং রিপোর্ট সাবমিট করুন' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  step.done 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-bold ${step.done ? 'text-green-700' : 'text-foreground'}`}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Back to Login (Actually logs out) */}
        <form action="/auth/logout" method="post" className="w-full">
          <button
            type="submit"
            className="modern-btn border border-border bg-card px-6 py-4 font-black inline-flex items-center justify-center gap-2 w-full active:scale-95 transition-all hover:bg-muted"
          >
            <LogOut className="w-5 h-5" />
            <span>লগইন পেজে ফিরে যান</span>
          </button>
        </form>
      </div>
    </div>
  )
}
