import Link from 'next/link';
import { Building2, ArrowRight, FileText, Download, MapPin } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-black/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        {/* Logo/Icon Section */}
        <div className="text-center mb-8 animate-in slide-in-from-bottom-4 duration-1000">
          <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-black/20">
            <Building2 className="w-12 h-12 text-purple-600" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 font-bengali tracking-tight">রিপোর্ট সিস্টেম</h1>
          <p className="text-purple-100 text-lg font-medium">মাসিক প্রতিবেদন ব্যবস্থাপনা</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-700">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-blue-600 mb-2">স্বাগতম</h2>
            <p className="text-gray-600 font-medium">
              আপনার অ্যাকাউন্টে প্রবেশ করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন
            </p>
          </div>

          {/* Login Button */}
          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full bg-linear-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-xl shadow-purple-500/30 group"
            >
              <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
              অ্যাপে প্রবেশ করুন
            </Link>

            {/* Register Button */}
            <Link
              href="/register"
              className="w-full bg-white border-2 border-purple-200 text-purple-600 py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center transition-all hover:bg-purple-50 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl shadow-purple-500/10"
            >
              নতুন অ্যাকাউন্ট তৈরি করুন
            </Link>
          </div>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-4 text-sm font-medium text-gray-600">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                মাসিক ও বার্ষিক রিপোর্ট
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Download className="w-4 h-4 text-blue-600" />
                </div>
                PDF ও Excel ডাউনলোড
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <MapPin className="w-4 h-4 text-purple-600" />
                </div>
                সিটি রিপোর্ট ব্যবস্থাপনা
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-purple-100/80 text-sm font-medium">
          <p>© {new Date().getFullYear()} রিপোর্ট সাবমিশন সিস্টেম। সকল অধিকার সংরক্ষিত।</p>
        </div>
      </div>
    </div>
  );
}
