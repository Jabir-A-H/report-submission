# Help Page Review: Report-Submission

This review covers `help-diagram-client.tsx`, the new help component, with every claim checked against the app code at commit `f0f35a2`. The new page looks far better than the placeholder, but it now confidently describes things the app does not do. Fix accuracy first, then add anything new.

## Where the help page and the app disagree

### User guide

| Help says | The app actually does |
| --- | --- |
| Step 1: enter name, mobile/email, password | The form asks for name, user ID, email, password twice, and zone. There is no mobile field. |
| Step 1: only admin approval is needed | Email verification is needed too (the form's own note says so). Google sign-in also exists on register and login, and the help does not mention it. |
| Step 2: choose Monthly / 3-month / 6-month (the mockup shows Monthly / 3 Months / Annual) | Users only see month and year. The other modes exist only on admin pages. The text and mockup also disagree with each other. |
| Step 2: green "ফরম পূরণ করুন" button | The button says "যান". It reveals the 7 section cards on the same page, and you then tap a section. |
| Step 3: 7 section tabs at the top | There are no tabs. Navigation is the bottom Previous/Next buttons plus a "ড্যাশবোর্ড" link top-left. |
| Step 3: save badge at top-right | It is under the section title, top-centre. |
| Step 3: saved within 1 second of typing | It saves when you leave the field, switch app or tab, or close the page. The retry description is accurate now. |
| Step 4: "এক নজরে" page, "সংশোধন" links, "চূড়ান্ত রিপোর্ট জমা দিন" button, report locks after submission | None of these exist. The only submission control is the checkbox "রিপোর্ট জমা সম্পন্ন হয়েছে" in the last section, and nothing locks. |

The Step 4 FAQ ("you can't edit after submitting, ask your admin") is the most harmful line, because it tells people not to fix their own mistakes. ADR 019 documents the same features, so it needs correcting too.

### Admin guide

- **Dashboard:** it shows the current month only, with no period dropdown and no submission timestamps.
- **Approvals:** "অপেক্ষমাণ" is a status filter, not a tab, and the button reads "অনুমোদন করুন".
- **Rejecting:** there is no reject button. The only options are the trash icon "মুছে ফেলুন" with a হ্যাঁ/না confirm, or leaving the user unapproved.
- **Roles:** there is no role-change control (zone change and deactivate exist).
- **Overrides:** the way to restore the original number is the "মুছুন" button. Clearing the field is not that path.
- **Not checked:** the button names on the reports list and the export labels.

## Why it still feels "not enough"

1. **Nothing helps with actual problems.** There is one FAQ per step, and no entry for what people really get stuck on:
   - "I can't log in" (user ID versus email, a capital letter or space added by the keyboard)
   - "I didn't get the verification email"
   - "I forgot my password"
   - "my number isn't saved"
   - "how do I change something after finishing"

   Today there is no resend-verification button and no admin password reset, so decide what you want to tell people in those cases. The login fix is also not in yet, so "type the ID in lowercase with no spaces" is a useful tip for now.
2. **There is no human contact.** The banner says "contact your zone representative or admin" with no number. The usual small-organisation fix is a tap-to-WhatsApp link to a real person.
3. **Navigation labels are poor.** The stepper uses the first word of each title, so users see "ধাপে" and "এক" on desktop, and only numbers on mobile. Add a short label per step. The highlight also only follows clicks, not scrolling.

## Options for the main structural choices

### How to show screens

- **Coded mockups (what you have):** polished and theme-proof, but a second UI to maintain, and they already drifted. They show invented labels like "Total Center Count", and the Step 2 text and mockup disagree.
- **Real screenshots with numbered callouts:** accurate on day one but stale when the UI changes, and heavier on 3G.
- **Text-only numbered steps with the exact button labels in quotes:** the cheapest and hardest to get wrong.
- **30-60 second screen recordings per task, shareable on WhatsApp:** commonly used for low-digital-literacy field users.

For 20-30 users, text-first with real labels, plus recordings for the two or three hardest tasks, is the suggested route.

### How to organise it

- Keep the five-step walkthrough and add a short "common problems" list.
- Or add a "?" on each section screen that opens help for that screen. This is the most efficient for a form-filling app, but costs more to build.
- A WhatsApp-sized one-page PDF card is the cheapest add-on.

### How to know it is enough

Have two or three people who did not build the app do three tasks using only the help page, and note where they stall. After launch, turn any question asked twice on WhatsApp into a help entry.

## Decision needed

Pick one:

- **(a)** Rewrite Step 4 to describe the checkbox honestly: tick it when all sections are filled, it tells the admin, and you can still edit later.
- **(b)** Build a real final-submit and lock feature, then keep the Step 4 text as written.

Option (a) is the suggested route unless locking is wanted.

**Decided (from the comments):** no lock feature for now, and the user guide drops the submission step and says instead that reports can always be edited. The tick box itself stays in the app as the admin’s signal. **\[owner\]** Users will no longer be told about the box, so fewer will tick it and the dashboard’s “জমাকৃত” count will under-report. Decide how you will tell them, for example through the zone representatives.

## Unrelated but time-sensitive

The year dropdown in `period-selector.tsx` is hardcoded to 2025 and 2026. From 1 January 2027, field workers will not be able to select the new year. The `/report` and city-report year lists stop at 2027 too. Generate the list from the current year in Asia/Dhaka instead.

## Corrected copy (draft)

Use this in place of the current step text in the help page. Labels in quotation marks come from the code. **\[confirm\]** marks wording I could not verify in the code, so check it on the live screen first. **\[owner\]** marks something only you can decide or fill in.

### User guide

#### Step 01: Register and get approved

**বাংলা**

- **শিরোনাম:** সাইন আপ ও অনুমোদন
- **বিবরণ:** নিজের তথ্য দিয়ে অ্যাকাউন্ট খুলুন। ইমেইল যাচাই ও অ্যাডমিনের অনুমোদন শেষ হলে লগ-ইন করতে পারবেন।
- **১.** সাইন আপ ফর্মে আপনার নাম, ইউজার আইডি, ইমেইল ও পাসওয়ার্ড (দুইবার) দিন এবং তালিকা থেকে আপনার জোন বেছে নিন।
- **২.** “সাইন আপ করুন” চাপুন। এরপর ইমেইলে আসা যাচাই লিংকে ক্লিক করুন। ইমেইল না পেলে স্প্যাম ফোল্ডার দেখুন।
- **৩.** অনুমোদনের অপেক্ষার পর্দা দেখা যাবে। অ্যাডমিন অনুমোদন দিলে লগ-ইন করতে পারবেন।
- **প্রশ্ন:** সাইন আপের পরেই কেন লগ-ইন করা যায় না?
- **উত্তর:** দুটি কাজ বাকি থাকে: আপনার ইমেইল যাচাই এবং অ্যাডমিনের অনুমোদন। দুটোই শেষ হলে লগ-ইন করতে পারবেন। দেরি হলে আপনার জোন প্রতিনিধি বা অ্যাডমিনকে জানান।

**English**

- **Title:** Register and get approved
- **Summary:** Create an account with your details. You can log in once your email is verified and an admin approves you.
- **1.** On the sign-up form enter your name, user ID, email and password (twice), and pick your zone from the list.
- **2.** Tap “সাইন আপ করুন” (Sign up). Then open the verification link sent to your email. If it does not arrive, check your spam folder.
- **3.** You will see the waiting-for-approval screen. You can log in once an admin approves you.
- **Question:** Why can’t I log in right after registering?
- **Answer:** Two things are still pending: verifying your email and the admin’s approval. When both are done you can log in. If it takes long, tell your zone representative or the admin.
- **\[confirm\]** The form also has a Google sign-in button. Add one line on how that route works, including whether it also needs admin approval.

#### Step 02: Log in and choose the month

**বাংলা**

- **শিরোনাম:** লগ-ইন ও মাস নির্বাচন
- **বিবরণ:** ইউজার আইডি বা ইমেইল ও পাসওয়ার্ড দিয়ে লগ-ইন করুন, তারপর মাস ও বছর বেছে নিন।
- **১.** লগ-ইন পেজে ইউজার আইডি (অথবা ইমেইল) ও পাসওয়ার্ড দিন। আইডি যেভাবে সাইন আপ করেছিলেন ঠিক সেভাবে লিখুন। ফোনের কিবোর্ড প্রথম অক্ষর বড় হাতের করে দিলে বা শেষে ফাঁকা (স্পেস) যোগ করলে লগ-ইন হবে না।
- **২.** “মাস” ও “বছর” বেছে নিয়ে “যান” চাপুন।
- **৩.** সাতটি সেকশনের কার্ড দেখা যাবে। যে সেকশন পূরণ করবেন তার “সম্পাদনা করুন” চাপুন।
- **প্রশ্ন:** ভুল মাস বেছে ফেললে কী করবেন?
- **উত্তর:** সঠিক মাস বেছে আবার “যান” চাপুন। প্রতিটি মাসের তথ্য আলাদা থাকে, তাই আগের মাসের তথ্য যেমন ছিল তেমনই থাকবে। ভবিষ্যতের মাস বেছে নিলে “ভবিষ্যতের সময়ের জন্য রিপোর্ট তৈরি বা পরিবর্তন করা সম্ভব নয়।” বার্তা আসবে।

**English**

- **Title:** Log in and choose the month
- **Summary:** Log in with your user ID or email and password, then pick the month and year.
- **1.** On the login page enter your user ID (or email) and password. Type the ID exactly as you registered it. If your phone keyboard capitalises the first letter or adds a trailing space, the login will fail.
- **2.** Pick the “মাস” (Month) and “বছর” (Year), then tap “যান” (Go).
- **3.** The seven section cards appear. Tap “সম্পাদনা করুন” (Edit) on the section you want to fill.
- **Question:** What if I picked the wrong month?
- **Answer:** Pick the correct month and tap “যান” again. Each month’s data is kept separately, so the earlier month stays as it was. If you pick a future month you will see “ভবিষ্যতের সময়ের জন্য রিপোর্ট তৈরি বা পরিবর্তন করা সম্ভব নয়।” (reports cannot be created or changed for a future period).
- **\[confirm\]** How to reopen the month and year bar once a month is chosen (the current screen shows a compact bar with an edit icon, but I did not verify its label).

#### Step 03: Fill the seven sections

The sections, in order: “মূল তথ্য”, “গ্রুপ / কোর্স রিপোর্ট”, “দাওয়াত ও সংগঠন”, “ব্যক্তিগত উদ্যোগে তালিমুল কুরআন”, “বৈঠকসমূহ”, “মক্তব ও সফর রিপোর্ট”, “মন্তব্য রিপোর্ট”.

**বাংলা**

- **শিরোনাম:** সাতটি সেকশন পূরণ ও স্বয়ংক্রিয় সংরক্ষণ
- **বিবরণ:** প্রতিটি সেকশনের ঘর পূরণ করুন। সাইট আপনার দেওয়া তথ্য নিজে থেকে সংরক্ষণ করে রাখে। সংরক্ষিত তথ্য আপনি যেকোনো সময় আবার খুলে বদলাতে পারবেন।
- **১.** পরের সেকশনে যেতে নিচের ডানদিকের বোতাম চাপুন (তাতে পরের সেকশনের নাম লেখা থাকে)। আগের সেকশনে ফিরতে বামদিকের বোতাম চাপুন। ড্যাশবোর্ডে ফিরতে উপরের বাম কোণের তীর (←) চাপুন।
- **২.** নিচের মেনুর রিপোর্ট ট্যাবে গিয়ে দেখে নিন, আপনার তথ্য সংরক্ষিত হয়েছে কিনা।
- **প্রশ্ন:** লাল “আবার চেষ্টা করুন” দেখালে কী করবেন?
- **উত্তর:** ইন্টারনেট সংযোগ ঠিক আছে কিনা দেখুন, তারপর “আবার চেষ্টা করুন” চাপুন। “সংরক্ষিত” না দেখা পর্যন্ত পেজ বন্ধ করবেন না। যে ঘরগুলো আগেই “সংরক্ষিত” দেখিয়েছে সেগুলো থেকে যায়।

**English**

- **Title:** Fill the seven sections and rely on auto-save
- **Summary:** Fill in each section. The site saves what you enter on its own. You can reopen and change saved data at any time.
- **1.** To go to the next section, tap the button at the bottom right (it shows the next section’s name). To go back, tap the button on the left. To return to the dashboard, tap the arrow (←) at the top left.
- **2.** Open the report tab in the bottom menu to check that your data was saved.
- **Question:** What should I do if a red “আবার চেষ্টা করুন” (Try again) appears?
- **Answer:** Check that your internet connection works, then tap “আবার চেষ্টা করুন”. Do not close the page until “সংরক্ষিত” shows. Boxes that already showed “সংরক্ষিত” are kept.
- **\[confirm\]** On some sections a view toggle appears at the top right (card view and table view). Its label was not checked.

#### Step 04: Download PDF

**বাংলা**

- **শিরোনাম:** PDF ডাউনলোড
- **বিবরণ:** আপনার রিপোর্ট ২ পাতার ল্যান্ডস্কেপ PDF ফাইলে নামিয়ে নিন, তারপর প্রিন্ট করুন বা WhatsApp-এ শেয়ার করুন।
- **১.** নিচের মেনু থেকে রিপোর্ট ট্যাব খুলুন।
- **২.** PDF ডাউনলোডের বোতাম চাপুন।
- **৩.** PDF প্রিন্ট করতে কাগজ A4 ও ল্যান্ডস্কেপ (আড়াআড়ি) বেছে নিন, স্কেল “Fit to Page” বা ১০০%।
- **প্রশ্ন:** ফোন থেকে কীভাবে প্রিন্ট বা শেয়ার করবেন?
- **উত্তর:** ডাউনলোড করা PDF ফোনের Downloads ফোল্ডারে থাকে। WhatsApp-এ পাঠাতে ফাইলটি অ্যাটাচ করে পাঠান। প্রিন্ট করতে ফাইলটি প্রিন্টার বা কম্পিউটারের দোকানে পাঠিয়ে A4 ল্যান্ডস্কেপ প্রিন্ট করতে বলুন।

**English**

- **Title:** Download PDF
- **Summary:** Save your report as a 2-page landscape PDF, then print it or share it on WhatsApp.
- **1.** Open the report tab in the bottom menu.
- **2.** Tap the PDF download button.
- **3.** To print the PDF, choose A4 paper, landscape orientation, and scaling “Fit to Page” or 100%.
- **Question:** How do I print or share from my phone?
- **Answer:** The downloaded PDF is in your phone’s Downloads folder. To share it on WhatsApp, attach the file in a chat. To print, send it to a printer or a computer shop and ask for A4 landscape.
- **\[confirm\]** The exact label of the bottom-menu report tab and of the PDF button. The download code exists on that page, but I did not read the labels.

### Admin guide

#### Admin step 01: Check this month’s progress on the dashboard

**বাংলা**

- **শিরোনাম:** ড্যাশবোর্ডে চলতি মাসের অগ্রগতি
- **বিবরণ:** কোন জোন রিপোর্ট জমা চিহ্নিত করেছে আর কোনগুলো বাকি, তা একনজরে দেখুন।
- **১.** ড্যাশবোর্ডে মোট জোন, “জমাকৃত”, অপেক্ষমাণ জোন ও শতকরা হার দেখুন।
- **২.** জোনের তালিকায় কারা জমাকৃত আর কারা অপেক্ষমাণ তা মিলিয়ে নিন।
- **৩.** অপেক্ষমাণ জোনের প্রতিনিধিকে ফোন বা WhatsApp-এ জানান। ড্যাশবোর্ড থেকে বার্তা পাঠানোর সুবিধা নেই।
- **প্রশ্ন:** আগের মাসের অবস্থা কোথায় দেখব?
- **উত্তর:** ড্যাশবোর্ডে শুধু চলতি মাস দেখায়। আগের মাসের রিপোর্ট দেখতে রিপোর্ট তালিকার পেজে মাস ও বছর বেছে নিন। মনে রাখবেন, “জমাকৃত” মানে জোন নিজে বক্সে টিক দিয়েছে। সব সেকশনে তথ্য আছে কিনা, ড্যাশবোর্ড তা যাচাই করে না।

**English**

- **Title:** Check this month’s progress on the dashboard
- **Summary:** See at a glance which zones have marked their report as submitted and which are still pending.
- **1.** On the dashboard, read the total zones, “জমাকৃত” (submitted), pending zones and the percentage.
- **2.** In the zone list, check who is submitted and who is pending.
- **3.** Contact pending zone representatives by phone or WhatsApp. The dashboard cannot send messages.
- **Question:** Where can I see earlier months?
- **Answer:** The dashboard shows only the current month. To see an earlier month’s reports, open the reports list page and pick the month and year. Remember that “submitted” means the zone ticked the box itself. The dashboard does not check that every section has data.
- **\[owner\]** The old text promised a period dropdown and exact timestamps on the dashboard. Neither exists, so both were removed.

#### Admin step 02: Approve and manage users

**বাংলা**

- **শিরোনাম:** ব্যবহারকারী অনুমোদন ও ব্যবস্থাপনা
- **বিবরণ:** নতুন নিবন্ধনকারীদের অনুমোদন দিন এবং প্রয়োজনে জোন বদলান বা অ্যাকাউন্ট বন্ধ করুন।
- **১.** ব্যবস্থাপনা পেজে স্ট্যাটাস ফিল্টার থেকে “অপেক্ষমাণ” বেছে নতুন আবেদনগুলো দেখুন।
- **২.** আবেদনকারীকে চিনতে পারলে “অনুমোদন করুন” চাপুন। এরপর তিনি লগ-ইন করতে পারবেন।
- **৩.** কারও অ্যাকাউন্ট সাময়িক বন্ধ করতে “নিষ্ক্রিয় করুন” চাপুন। ভুল জোন বেছে থাকলে তার জোন বদলে দিন।
- **প্রশ্ন:** অপরিচিত কেউ নিবন্ধন করলে কী করব?
- **উত্তর:** অনুমোদন না দিলে তিনি ঢুকতে পারবেন না। তালিকা থেকে একেবারে সরাতে লাল ট্র্যাশ আইকন “মুছে ফেলুন” চাপুন, তারপর নিশ্চিত করুন। এটি স্থায়ীভাবে মুছে যায়।
- **সতর্কতা:** মাসের মাঝখানে কারও জোন বদলালে সেই মাসে আগের জোনে ভরা তথ্য নতুন জোনে যায় না। তাই বদলানোর আগে ব্যবহারকারীকে জানিয়ে নিন।

**English**

- **Title:** Approve and manage users
- **Summary:** Approve new sign-ups, and change a zone or switch off an account when needed.
- **1.** On the management page choose “অপেক্ষমাণ” (Pending) in the status filter to see new applications.
- **2.** If you recognise the applicant, tap “অনুমোদন করুন” (Approve). They can then log in.
- **3.** To switch an account off for now, tap “নিষ্ক্রিয় করুন” (Deactivate). If someone picked the wrong zone, change their zone.
- **Question:** What if a stranger registers?
- **Answer:** They cannot get in unless you approve them. To remove them from the list entirely, tap the red trash icon “মুছে ফেলুন” and confirm. This deletes them permanently.
- **Caution:** If you change someone’s zone in the middle of a month, data already entered for that month under the old zone does not move to the new zone, because reports belong to the zone. Tell the user before you change it.
- **\[owner\]** The old text promised a “Pending tab”, a red “বাতিল” (Reject) button and role changes. None of these exist: pending is a filter, the only removal is delete, and there is no role control. If you want a softer “reject”, deactivating without deleting is the closest option.

#### Admin step 03: Review zone reports

**বাংলা**

- **শিরোনাম:** জোনের রিপোর্ট পর্যালোচনা
- **বিবরণ:** যেকোনো মাসের জোনভিত্তিক রিপোর্ট খুলে দেখুন।
- **১.** মেনু থেকে সব জোনের রিপোর্টের তালিকা খুলুন।
- **২.** মাস, বছর ও রিপোর্টের ধরন বেছে নিয়ে ফিল্টার করুন এবং কাঙ্ক্ষিত জোনের রিপোর্ট খুলুন।
- **৩.** কোনো জোনের তথ্যে ভুল দেখলে সেই জোনকে জানান। সমষ্টিগত সংখ্যা ঠিক করতে হলে সিটি রিপোর্টে ওভাররাইড করুন।
- **প্রশ্ন:** তালিকায় থাকা মানেই কি রিপোর্ট জমা হয়েছে?
- **উত্তর:** নিশ্চিত নয়। জমা হয়েছে কিনা দেখতে ড্যাশবোর্ডের “জমাকৃত” তালিকা দেখুন।

**English**

- **Title:** Review zone reports
- **Summary:** Open any month’s zone-wise reports.
- **1.** Open the list of all zones’ reports from the menu.
- **2.** Filter by month, year and report type, then open the zone’s report.
- **3.** If a zone’s data looks wrong, tell that zone. To fix the combined figures, use an override in the city report.
- **Question:** Does being in the list mean the report was submitted?
- **Answer:** Not necessarily. Check the dashboard’s submitted list to see whether it was marked as submitted.
- **\[confirm\]** The exact menu label of this page (it is probably “সব জোন রিপোর্ট”), the name of the open-report button on each row, and whether the page has a zone filter. Also check whether the list still includes reports that were only opened and never filled or submitted. It did when I last read it, and the answer above depends on this.

#### Admin step 04: Correct figures in the city report

**বাংলা**

- **শিরোনাম:** সিটি রিপোর্টে সংখ্যা সংশোধন (ওভাররাইড)
- **বিবরণ:** জোনগুলোর যোগফল থেকে তৈরি সিটি রিপোর্টের কোনো ঘরের সংখ্যা প্রয়োজনে নিজে ঠিক করে দিন।
- **১.** সিটি রিপোর্ট খুলে রিপোর্টের ধরন, মাস ও বছর বেছে নিন।
- **২.** “⚡ এডিট মোড” চালু করুন, যে ঘরের সংখ্যা বদলাতে চান তাতে চাপুন, নতুন সংখ্যা লিখে নিশ্চিত করুন।
- **৩.** মূল যোগফলে ফিরে যেতে ওভাররাইড করা ঘরের “মুছুন” বোতাম চাপুন এবং নিশ্চিত করুন।
- **প্রশ্ন:** ওভাররাইড করার পর জোন তথ্য বদলালে কী হবে?
- **উত্তর:** ওভাররাইড করা ঘরের সংখ্যা স্থির থাকে। জোন পরে তথ্য সংশোধন করলে সেই ঘর নিজে থেকে বদলায় না। তাই জোনের সংশোধনের পর ওভাররাইড করা ঘরগুলো আবার দেখে নিন।

**English**

- **Title:** Correct figures in the city report (override)
- **Summary:** The city report is built from the zones’ totals. Fix a cell’s number yourself when needed.
- **1.** Open the city report and choose the report type, month and year.
- **2.** Turn on “⚡ এডিট মোড” (Edit Mode), tap the cell you want to change, type the new number and confirm.
- **3.** To go back to the original total, tap “মুছুন” (Delete) on the overridden cell and confirm.
- **Question:** What happens if a zone corrects its data after I override?
- **Answer:** An overridden cell stays at the number you set. If a zone corrects its data later, that cell does not change by itself. Re-check your overridden cells after any zone correction.
- **\[owner\]** The old text said clearing the value restores the original. The code has a separate “মুছুন” button for that, so the text now describes the button.
- **\[owner\]** Quarterly, half-yearly, nine-month and yearly views are always calculated from January. Decide the wording after you settle KI-017, and do not promise rolling quarters until then.
- **\[confirm\]** The highlight colour of overridden cells, and whether the “stays fixed” behaviour above still holds in the current code.

#### Admin step 05: Export the city report

**বাংলা**

- **শিরোনাম:** সিটি রিপোর্ট PDF ও Excel
- **বিবরণ:** সংশোধনসহ চূড়ান্ত সিটি রিপোর্ট ফাইলে নামিয়ে নিন।
- **১.** সিটি রিপোর্টে সঠিক ধরন, মাস ও বছর বেছে নিন এবং ওভাররাইডগুলো একবার দেখে নিন।
- **২.** “পিডিএফ ডাউনলোড” বা “এক্সেল ডাউনলোড” বোতাম চাপুন।
- **৩.** PDF প্রিন্ট করতে A4 ল্যান্ডস্কেপ বেছে নিন।
- **প্রশ্ন:** ওভাররাইড করা সংখ্যা কি ফাইলে আসবে?
- **উত্তর:** হ্যাঁ। ফাইলে ওভাররাইড করা সংখ্যাই দেখাবে।

**English**

- **Title:** City report PDF and Excel
- **Summary:** Save the final city report, including your corrections, as a file.
- **1.** In the city report choose the right type, month and year, and check your overrides once.
- **2.** Tap “পিডিএফ ডাউনলোড” (PDF download) or “এক্সেল ডাউনলোড” (Excel download).
- **3.** To print the PDF, choose A4 landscape.
- **Question:** Do overridden numbers appear in the file?
- **Answer:** Yes. The file shows the overridden numbers.
- **\[confirm\]** Those two labels come from the button tooltips. Check what is visibly written on the buttons.

### Common problems (new section)

Place this as its own section on the help page, near the top or at the bottom. Each question takes one short answer.

**বাংলা**

- **লগ-ইন করতে পারছি না।** ইউজার আইডি বা ইমেইল ও পাসওয়ার্ড ঠিক আছে কিনা দেখুন। ফোনের কিবোর্ড প্রথম অক্ষর বড় হাতের করে দিলে বা শেষে ফাঁকা (স্পেস) যোগ করলে লগ-ইন হয় না। ইমেইল যাচাই বা অ্যাডমিনের অনুমোদন বাকি থাকলেও ঢোকা যায় না।
- **যাচাই ইমেইল আসেনি।** স্প্যাম বা প্রমোশন ফোল্ডার দেখুন এবং সাইন আপের সময় ইমেইল ঠিকঠাক লিখেছিলেন কিনা মিলিয়ে নিন। তবুও না এলে আপনার জোন প্রতিনিধি বা অ্যাডমিনকে জানান।
- **পাসওয়ার্ড ভুলে গেছি।** লগ-ইন পেজের পাসওয়ার্ড ভোলার লিংকে সাইন আপের সময় দেওয়া ইমেইল দিন, তারপর ইমেইলে আসা লিংক থেকে নতুন পাসওয়ার্ড দিন। সাইন আপের সময় দেওয়া ইমেইল মনে না থাকলে অ্যাডমিনকে জানান।
- **ভুল জোন বেছে ফেলেছি।** অ্যাডমিনকে জানান। অ্যাডমিন আপনার জোন বদলে দিতে পারেন। তথ্য ভরার আগেই জানালে ভালো।
- **লাল “সংরক্ষণ ব্যর্থ হয়েছে” বার্তা এসেছে।** ইন্টারনেট সংযোগ ঠিক আছে কিনা দেখুন, তারপর “আবার চেষ্টা করুন” চাপুন। “সংরক্ষিত” না দেখা পর্যন্ত পেজ বন্ধ করবেন না।
- **সংখ্যা লিখলাম কিন্তু “সংরক্ষিত” দেখাচ্ছে না।** সংরক্ষণ শুরু হয় ঘর থেকে বেরিয়ে এলে। অন্য ঘরে বা ফাঁকা জায়গায় ট্যাপ করুন, তারপর উপরে “সংরক্ষিত” ও সময় দেখা পর্যন্ত অপেক্ষা করুন।
- **আলাদা সেভ বোতাম কোথায়?** সেভ বোতাম নেই, তথ্য নিজে থেকেই সংরক্ষিত হয়।
- **ভরা তথ্যে ভুল পেলাম।** সেকশনে গিয়ে ঘর ঠিক করুন। রিপোর্ট যেকোনো সময় বদলানো যায়, কিছুই লক হয় না। বড় পরিবর্তন করলে অ্যাডমিনকে জানান।
- **ভুল মাসে তথ্য দিয়ে ফেলেছি।** ভুল মাসের তথ্য সেই মাসেই থেকে যায়। ওই মাস খুলে ঘরগুলো ঠিক করুন, তারপর সঠিক মাস বেছে সেখানে তথ্য দিন এবং অ্যাডমিনকে জানান।

**English**

- **I can’t log in.** Check the user ID or email and the password. If the keyboard capitalises the first letter or adds a trailing space, the login fails. You also cannot get in while email verification or admin approval is pending.
- **The verification email did not arrive.** Check your spam or promotions folder, and check that you typed the email correctly when registering. If it still does not come, tell your zone representative or the admin.
- **I forgot my password.** Enter your registration email in the forgot-password link on the login page, then set a new password from the link in the email. If you do not remember the registration email, tell the admin.
- **I picked the wrong zone.** Tell the admin. An admin can change your zone. It is best to tell them before you enter data.
- **A red “সংরক্ষণ ব্যর্থ হয়েছে” (Save failed) message appeared.** Check your internet connection, then tap “আবার চেষ্টা করুন” (Try again). Do not close the page until “সংরক্ষিত” (Saved) shows.
- **I typed a number but it does not say “সংরক্ষিত”.** Saving starts when you leave the box. Tap another box or a blank area, then wait for “সংরক্ষিত” and a time to appear at the top.
- **Where is the Save button?** There is no Save button: data saves on its own.
- **I found a mistake in data I already entered.** Go to the section and fix the box. Reports can be edited at any time, and nothing is locked. If it is a big change, tell the admin.
- **I entered data in the wrong month.** The data stays in that month. Open that month and correct the boxes, then pick the right month, enter the data there, and tell the admin.
- **\[owner\]** Today there is no resend-verification button, and an admin cannot reset a password or look up a registered email from the app. Decide what the admin does in those cases, and write that into the two answers above.
- **\[confirm\]** The exact label of the forgot-password link on the login page.

### Help contact block (new)

**বাংলা:** সাহায্য লাগলে WhatsApp করুন: \[নম্বর\]। বার্তায় আপনার ইউজার আইডি ও জোনের নাম লিখুন।

**English:** Need help? Message us on WhatsApp: \[number\]. Include your user ID and zone name.

**\[owner\]** Fill in a real number, and decide who answers it. Replace the current “contact your zone representative or admin” banner with this.

### Before you publish

1. **Replace the mockups too, not just the text.** The current mockups still show the old behaviour: mode pills in Step 02, seven tabs at the top in Step 03, and a final-submit screen in Step 04. Redraw them from the real screens, or switch to plain numbered text with the exact button labels until you have time to do that.
2. **Fix the step-navigation labels.** The step bar shows the first word of each title, which gives “ধাপে” and “এক” on desktop. Give each step a short label of its own.
3. **Settle the owner items above:** how users will learn about the submission tick box (the user guide no longer mentions it), the contact number, what to tell people about a missing verification email and a forgotten email or password, the Google sign-in line, and the quarterly wording (KI-017).
4. **Check every \[confirm\] item on the live screens.** Do this on a real phone, not only on a desktop.
5. **Update ADR 019,** which documents a final-submit button and a lock that do not exist.
6. **Test with real people.** Ask two or three people who did not build the app to do three tasks using only the help page, and note where they stall. Turn any question asked twice on WhatsApp into a new entry in the common-problems list.
