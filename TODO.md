no, the ui is not correct as well, i now want only an multi step wizard for report submission. i dont need users to submit report in one page. I said thhat it should show what admin edited the last, but for simplicity i am disgarding the edit history feature altogether. and thats why use following names for the report parts-

Full workflow plan

Each zone has one report. If a zone has multiple users, they can all see the same up to date report. Users will first set a month that they are working on after logging in, they can not do anything before they set the month and year. After this, they can continue to fill out the multi-page form. all edits are auto-saved immediately. They can also edit the report later, and if they change the month and year after setting it, they can view past reports too and edit them given that they have permission. Also, there will be a progress indicator showing which step of the form they are on. Also, there will be a option to select quarterly, half yearly, yearly report option that is the summation of individuals zone reports of that time period. Use access control for admin editable fields.

Database tables for Report Submission Process:
User
Zone
Report
ReportHeader
ReportCourse
ReportOrganizational
ReportPersonal
ReportMeeting
ReportExtra
ReportComment


here following are the table headers that i want for each table- (add id for each table as PK)

User (the current one is [app.py](app.py) looks good to me)
    name
    mobile number
    email
    password
    role (user/admin)
    active (default False)

Zone (the current one is [app.py](app.py) looks good to me)
    name (unique, string, admin can add remove from the predefined list)

Report (not sure how this will work...)
    (the main report model that links to all report sections)


ReportHeader
    Responsible Name (string)
    Thana (string)
    Ward (string)
    Total Muallima (integer)
    Muallima Increase (integer)
    Muallima Decrease (integer)
    Certified Muallima (integer)
    Certified Muallima Taking Classes (integer)
    Trained Muallima (integer)
    Trained Muallima Taking Classes (integer)
    Total Unit (integer)
    Units With Muallima (integer)

ReportCourse
    Category (string, admin can add remove from the predefined list)
    Number (integer only)
    Increase (integer)
    Decrease (integer)
    Sessions (integer)
    Students (integer)
    Attendance (integer)
    Status Board (integer)
    Status Qayda (integer)
    Status Ampara (integer)
    Status Quran (integer)
    Completed (integer)
    Correctly Learned (integer)

ReportOrganizational
    Category (string, admin can add remove from the predefined list)
    Number (integer)
    Increase (integer)
    Amount (not necesary for all entries)
    Comments

ReportPersonal
    Category (string, admin can add remove from the predefined list)
    Rukon (integer)
    Kormi (integer)
    ShokrioShohojogi (integer)

ReportMeeting
    Category (string, admin can add remove from the predefined list)
    City Count (integer, only admin can change this value in the main aggregated file)
    City Avg Attendance (integer, only admin can change this value in the main aggregated file)
    Thana Count (integer)
    Thana Avg Attendance (integer)
    Ward Count (integer)
    Ward Avg Attendance (integer)
    Comments (string)

ReportExtra
    Category (string, admin can add remove from the predefined list)
    Number (integer)

ReportComment
    Report Month
    Monthly Comment
    Tri Monthly Comment
    Six Monthly Comment
    Yearly Comment



Entries predefined in the categories field of each table (can be edited by admin)
Zone
    name
        শ্যামপুর জোন
        ডেমরা জোন
        যাত্রাবাড়ী পূর্ব জোন
        যাত্রাবাড়ী পশ্চিম জোন
        ওয়ারী জোন
        সূত্রাপুর জোন
        চকবাজার বংশাল জোন
        লালবাগ কামরাঙ্গীর চর জোন
        ধানমন্ডি জোন
        মতিঝিল জোন
        পল্টন জোন
        খিলগাঁও জোন
        সবুজবাগ মুগদা জোন

ReportCourse
    Category
        বিশিষ্টদের
        সাধারণদের
        কর্মীদের
        ইউনিট সভানেত্রী
        অগ্রসরদের
        রুকনদের অনুশীলনী ক্লাস
        তারবিয়াত বৈঠক
        পারিবারিক ইউনিটে তা’লীমুল কুরআন
        শিশু- তা’লিমুল কুরআন
        নিরক্ষর- তা’লিমুস সলাত

ReportOrganizational
    Category
        দাওয়াত দান
        কতজন ইসলামের আদর্শ মেনে  চলার চেষ্টা করছেন
        সহযোগী হয়েছে
        সম্মতি দিয়েছেন
        সক্রিয় সহযোগী
        কর্মী
        রুকন
        দাওয়াতী ইউনিট
        ইউনিট
        সূধী
        এককালীন
        জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)
        বই বিলি
        বই বিক্রি

ReportPersonal
    Category
        কতজন শিখাচ্ছেন
        কতজনকে শিখাচ্ছেন
        কতজন ওয়ালামাকে দাওয়াত দিয়েছেন
        দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে সহযোগী হয়েছেন কতজন
        দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে সক্রিয় সহযোগীকে হয়েছেন কতজন
        দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে কর্মী হয়েছেন কতজন
        দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে রুকন হয়েছেন কতজন

ReportMeeting
    Category
        কমিটি বৈঠক হয়েছে
        মুয়াল্লিমাদের নিয়ে বৈঠক
        CM/MO (only admin can change this value in the main aggregated file)

ReportExtra
    Category
        Moktob Count
        Moktob Increase
        Moktob Local
        Moktob City (only admin can change this value in the main aggregated file)
        Sofor City
        Sofor Thana Committee
        Sofor Thana Representative
        Sofor Ward Representative

