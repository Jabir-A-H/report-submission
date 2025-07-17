def init_db():
from werkzeug.security import generate_password_hash
from app import app, db, User

def init_db():
    with app.app_context():
        db.drop_all()
        db.create_all()
        users = [
            User(username='user1', email='user1@example.com', password=generate_password_hash('password'), role='user'),
            User(username='user2', email='user2@example.com', password=generate_password_hash('password'), role='user'),
            User(username='admin', email='admin@example.com', password=generate_password_hash('password'), role='admin'),
        ]
        db.session.bulk_save_objects(users)
        db.session.commit()
        print('Database initialized with sample users.')

if __name__ == '__main__':
    init_db()
