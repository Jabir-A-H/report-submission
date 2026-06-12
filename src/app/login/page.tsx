import { login } from "./actions";
import { Building2, LogIn } from "lucide-react";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const resolvedParams = await searchParams;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden bg-background">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

      {/* Left Panel: Branding / Messaging */}
      <div className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden bg-linear-to-br from-primary/10 to-primary/5 border-r border-border/50">
        <div className="max-w-md mx-auto relative z-10">
          <div className="w-20 h-20 bg-primary text-primary-foreground rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/30 transform -rotate-6">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black text-foreground mb-6 leading-tight font-bengali">
            রিপোর্ট পেশ <br /> আধুনিকায়ন
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            আপনার সকল রিপোর্ট এবং সাংগঠনিক ডেটা সাবমিট করার জন্য সবচেয়ে নিরাপদ
            ও আধুনিক প্ল্যাটফর্ম। অনুগ্রহ করে আপনার ইউজার আইডি ও পাসওয়ার্ড
            ব্যবহার করে লগ-ইন করুন।
          </p>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-24">
        <div className="w-full max-w-sm mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Mobile Branding Logo */}
          <div className="lg:hidden w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
            <Building2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-3xl font-black text-foreground mb-2">
              স্বাগতম!
            </h2>
            <p className="text-muted-foreground font-medium">
              ড্যাশবোর্ডে প্রবেশ করতে লগ-ইন করুন
            </p>
          </div>

          <form
            action={login}
            className="animate-in flex-1 flex flex-col w-full justify-center gap-6 text-foreground"
          >
            <div className="space-y-4">
              <div>
                <label
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
                  htmlFor="email"
                >
                  ইউজার আইডি / ইমেইল
                </label>
                <input
                  className="modern-input w-full h-14 text-lg bg-muted/40 focus:bg-background transition-colors px-4 rounded-xl border border-border"
                  name="email"
                  placeholder="ex: user123 or name@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    htmlFor="password"
                  >
                    পাসওয়ার্ড
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-primary hover:underline underline-offset-2"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </Link>
                </div>
                <input
                  className="modern-input w-full h-14 text-lg bg-muted/40 focus:bg-background transition-colors tracking-widest px-4 rounded-xl border border-border"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="modern-btn btn-primary h-14 text-lg font-bold w-full flex items-center justify-center gap-3 group mt-2 shadow-xl shadow-primary/20 bg-primary text-primary-foreground rounded-xl"
            >
              লগ-ইন করুন
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 text-sm text-muted-foreground font-medium gap-4 border-t border-border/40 mt-4">
              <Link
                href="/home"
                className="hover:text-primary transition-colors"
              >
                &larr; হোম পেজ
              </Link>
              <Link
                href="/register"
                className="hover:text-primary transition-colors gap-1"
              >
                অ্যাকাউন্ট নেই?
                <span className="text-primary font-bold underline underline-offset-2">
                  নিবন্ধন করুন
                </span>
              </Link>
            </div>

            {resolvedParams?.message && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-center font-bold text-sm animate-in zoom-in duration-300">
                {resolvedParams.message === "Could not authenticate user"
                  ? "ভুল আইডি অথবা পাসওয়ার্ড প্রদান করেছেন।"
                  : resolvedParams.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
