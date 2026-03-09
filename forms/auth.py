from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, SelectField
from wtforms.validators import DataRequired, Email, Length

class LoginForm(FlaskForm):
    identifier = StringField("Email or User ID", validators=[DataRequired()])
    password = PasswordField("Password", validators=[DataRequired()])
    submit = SubmitField("লগইন (Login)")

class RegisterForm(FlaskForm):
    name = StringField("Full Name", validators=[DataRequired()])
    email = StringField("Email Address", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=6)])
    zone_id = SelectField("Zone", coerce=int, validators=[DataRequired()])
    submit = SubmitField("রেজিস্টার (Register)")
