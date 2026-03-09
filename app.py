from flask import Flask
from config import Config
from extensions import db, cache, compress, limiter, csrf, login_manager, migrate
from utils import register_template_filters
import os

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Flask Extensions
    db.init_app(app)
    from extensions import ma
    ma.init_app(app)
    cache.init_app(app)
    compress.init_app(app)
    limiter.init_app(app)
    csrf.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"
    migrate.init_app(app, db)

    # Production config
    if os.environ.get("RENDER"):
        app.logger.info("🚀 Report Submission System starting on Render")

    # Register blueprints safely inside the app context
    with app.app_context():
        from routes.main import main_bp
        from routes.auth import auth_bp
        from routes.admin import admin_bp
        from routes.reports import reports_bp

        app.register_blueprint(main_bp)
        app.register_blueprint(auth_bp)
        app.register_blueprint(admin_bp)
        app.register_blueprint(reports_bp)

        # Register template filters
        register_template_filters(app)

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        from flask import render_template
        return render_template("404.html"), 404

    return app

# The typical entry point for local development (flask run uses create_app automatically)
app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
