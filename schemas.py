from extensions import ma
from models import (
    Report, ReportHeader, ReportCourse, ReportOrganizational,
    ReportPersonal, ReportMeeting, ReportExtra, ReportComment
)
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields

class ReportHeaderSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ReportHeader
        include_fk = True
        sqla_session = None

class ReportCourseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ReportCourse
        include_fk = True
        sqla_session = None

class ReportOrganizationalSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ReportOrganizational
        include_fk = True
        sqla_session = None

class ReportPersonalSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ReportPersonal
        include_fk = True
        sqla_session = None

class ReportMeetingSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ReportMeeting
        include_fk = True
        sqla_session = None

class ReportExtraSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ReportExtra
        include_fk = True
        sqla_session = None

class ReportCommentSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ReportComment
        include_fk = True
        sqla_session = None

class ReportSchema(SQLAlchemyAutoSchema):
    header = fields.Nested(ReportHeaderSchema)
    courses = fields.List(fields.Nested(ReportCourseSchema))
    organizational = fields.List(fields.Nested(ReportOrganizationalSchema))
    personal = fields.List(fields.Nested(ReportPersonalSchema))
    meetings = fields.List(fields.Nested(ReportMeetingSchema))
    extras = fields.List(fields.Nested(ReportExtraSchema))
    comments = fields.Nested(ReportCommentSchema)

    class Meta:
        model = Report
        include_relationships = True
        include_fk = True
        load_instance = True
        sqla_session = None
