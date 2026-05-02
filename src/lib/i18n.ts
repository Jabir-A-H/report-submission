export type Language = "bn" | "en";

export const translations = {
  bn: {
    // Common
    siteTitle: "রিপোর্ট সাবমিশন সিস্টেম",
    dashboard: "ড্যাশবোর্ড",
    home: "হোম",
    login: "লগইন করুন",
    register: "নিবন্ধন করুন",
    logout: "লগআউট",
    report: "রিপোর্ট",
    footerCopyright: "© ২০২৫ রিপোর্ট সাবমিশন সিস্টেম। সকল অধিকার সংরক্ষিত।",
    welcome: "স্বাগতম",
    welcomeSub: "আপনার অ্যাকাউন্টে প্রবেশ করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন",
    enterApp: "অ্যাপে প্রবেশ করুন",
    createAccount: "নতুন অ্যাকাউন্ট তৈরি করুন",
    features: {
      monthlyAnnual: "মাসিক ও বার্ষিক রিপোর্ট",
      download: "PDF ও Excel ডাউনলোড",
      cityManagement: "সিটি রিপোর্ট ব্যবস্থাপনা",
    },

    // Auth
    emailOrId: "ইমেইল অথবা ৩-ডিজিট ইউজার আইডি",
    password: "পাসওয়ার্ড",
    name: "আপনার পূর্ণ নাম",
    zoneSelect: "জোন নির্বাচন করুন",
    alreadyRegistered: "ইতিমধ্যে নিবন্ধিত?",
    newUser: "নতুন ব্যবহারকারী?",
    waitingApproval: "রেজিস্ট্রেশন সফল! অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।",

    // Dashboard
    periodSelector: {
      type: "রিপোর্ট টাইপ",
      month: "মাস",
      year: "বছর",
      go: "যান",
    },
    reportTypes: {
      monthly: "মাসিক",
      quarterly: "ত্রৈমাসিক",
      halfYearly: "ষান্মাসিক",
      nineMonth: "নয়-মাসিক",
      yearly: "বার্ষিক",
    },
    sections: {
      header: "মূল তথ্য",
      courses: "গ্রুপ / কোর্স রিপোর্ট",
      organizational: "দাওয়াত ও সংগঠন",
      personal: "ব্যক্তিগত উদ্যোগে তালিমুল কুরআন",
      meeting: "বৈঠকসমূহ",
      extra: "মক্তব ও সফর রিপোর্ট",
      comment: "মন্তব্য রিপোর্ট",
    },
    status: {
      complete: "সম্পন্ন",
      incomplete: "অসম্পূর্ণ",
      empty: "ফাঁকা",
    },
    actions: {
      start: "শুরু করুন",
      edit: "সম্পাদনা করুন",
      view: "দেখুন",
      finalSubmit: "চূড়ান্ত জমা দিন",
    },
    stats: {
      total: "মোট",
      completed: "সম্পন্ন",
      pending: "অপেক্ষমাণ",
    },

    // Admin
    adminActions: {
      cityReport: "সিটি রিপোর্ট",
      userManagement: "ইউজার ব্যবস্থাপনা",
      zoneManagement: "জোন ব্যবস্থাপনা",
      allZoneReports: "সব জোন রিপোর্ট",
    },
    userStats: {
      active: "সক্রিয়",
      pending: "অপেক্ষমাণ",
      admin: "অ্যাডমিন",
      total: "মোট ইউজার",
    },
    zoneStats: {
      total: "মোট জোন",
    },
    help: "সহায়তা",
  },
  en: {
    // Common
    siteTitle: "Report Submission System",
    dashboard: "Dashboard",
    home: "Home",
    login: "Login",
    register: "Register",
    logout: "Logout",
    report: "Report",
    footerCopyright: "© 2025 Report Submission System. All rights reserved.",
    welcome: "Welcome",
    welcomeSub: "Enter your account or create a new one",
    enterApp: "Enter App",
    createAccount: "Create New Account",
    features: {
      monthlyAnnual: "Monthly & Annual Reports",
      download: "PDF & Excel Downloads",
      cityManagement: "City Report Management",
    },

    // Auth
    emailOrId: "Email or 3-digit User ID",
    password: "Password",
    name: "Full Name",
    zoneSelect: "Select Zone",
    alreadyRegistered: "Already registered?",
    newUser: "New user?",
    waitingApproval: "Registration successful! Please wait for admin approval.",

    // Dashboard
    periodSelector: {
      type: "Report Type",
      month: "Month",
      year: "Year",
      go: "Go",
    },
    reportTypes: {
      monthly: "Monthly",
      quarterly: "Quarterly",
      halfYearly: "Half-Yearly",
      nineMonth: "Nine-Month",
      yearly: "Yearly",
    },
    sections: {
      header: "Header",
      courses: "Courses",
      organizational: "Dawah & Org",
      personal: "Personal",
      meeting: "Meeting",
      extra: "Extra",
      comment: "Comment",
    },
    status: {
      complete: "Complete",
      incomplete: "Incomplete",
      empty: "Empty",
    },
    actions: {
      start: "Start",
      edit: "Edit",
      view: "View",
      finalSubmit: "Final Submit",
    },
    stats: {
      total: "Total",
      completed: "Completed",
      pending: "Pending",
    },

    // Admin
    adminActions: {
      cityReport: "City Report",
      userManagement: "User Management",
      zoneManagement: "Zone Management",
      allZoneReports: "All Zone Reports",
    },
    userStats: {
      active: "Active",
      pending: "Pending",
      admin: "Admin",
      total: "Total Users",
    },
    zoneStats: {
      total: "Total Zones",
    },
    help: "Help",
  },
};

export type Translations = typeof translations.bn;
