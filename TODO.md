no, the ui is not correct as well, i now want only an multi step wizard for report submission. i dont need users to submit report in one page. Right now i am not focusing on the editing part. just the basic report database. and thats why use following names for the report parts-

Full workflow plan

Users will first set a month that they are working on after loging in, they can not do anything before they set the month and year. After this, they can continue to fill out the miultipage form.

Database tables:
ReportHeader
ReportCourse
ReportOrganizational
ReportPersonal
ReportMeeting
ReportExtra
ReportComment


here following are the table headers that i want for each table-
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
ReportCourse
    Category
        বিশিষ্টদের
        সাধারণদের
        কর্মীদের
        ইউনিট সভানেত্রী
        অগ্রসরদের
        রুকনদের অনুশীলনী ক্লাস
        তারবিয়াত বৈঠক
        পারিবারিক ই তা. কুরআন
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
        কতজন সহযোগীকে দাওয়াত দিয়েছেন
        কতজন সক্রিয় সহযোগীকে দাওয়াত দিয়েছেন
        কর্মী হয়েছেন কতজন
        রুকন হয়েছেন কতজন

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

