from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField, SubmitField, TextAreaField
from wtforms.validators import DataRequired, Optional

class ReportHeaderForm(FlaskForm):
    responsible_name = StringField("দায়িত্বশীলের নাম", validators=[DataRequired()])
    thana = StringField("থানা", validators=[DataRequired()])
    ward = StringField("ওয়ার্ড", validators=[DataRequired()])
    
    total_muallima = IntegerField("মোট মুয়াল্লিমা", validators=[Optional()])
    muallima_increase = IntegerField("মুয়াল্লিমা বৃদ্ধি", validators=[Optional()])
    muallima_decrease = IntegerField("মুয়াল্লিমা ঘাটতি", validators=[Optional()])
    
    certified_muallima = IntegerField("সনদপ্রাপ্ত মুয়াল্লিমা", validators=[Optional()])
    certified_muallima_taking_classes = IntegerField("সনদপ্রাপ্ত মুয়াল্লিমা (ক্লাস নিচ্ছেন)", validators=[Optional()])
    
    trained_muallima = IntegerField("শুধুমাত্র প্রশিক্ষণপ্রাপ্ত", validators=[Optional()])
    trained_muallima_taking_classes = IntegerField("প্রশিক্ষণপ্রাপ্ত (ক্লাস নিচ্ছেন)", validators=[Optional()])
    
    total_unit = IntegerField("মোট ইউনিট", validators=[Optional()])
    units_with_muallima = IntegerField("মুয়াল্লিমা আছে এমন ইউনিট", validators=[Optional()])
    
    submit = SubmitField("সংরক্ষণ করুন")

class ReportCommentForm(FlaskForm):
    comment = TextAreaField("মন্তব্য", validators=[Optional()])
    submit = SubmitField("সংরক্ষণ করুন")
