from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
import os

# Initialize Flask app
app = Flask(__name__, static_folder='../dist', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asl-recognition-secret-key-2024')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///asl_app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-2024')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
CORS(app, supports_credentials=True)


# ==========================================
# DATABASE MODELS
# ==========================================

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    display_name = db.Column(db.String(100), nullable=True)
    avatar_color = db.Column(db.String(20), default='cyan')
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    last_login = db.Column(db.DateTime, nullable=True)
    
    messages = db.relationship('Message', backref='sender', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'displayName': self.display_name or self.username,
            'avatarColor': self.avatar_color,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_asl = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    def to_dict(self):
        return {
            'id': self.id,
            'senderId': self.sender_id,
            'content': self.content,
            'isAsl': self.is_asl,
            'timestamp': self.created_at.isoformat() if self.created_at else None
        }


# ==========================================
# AUTH ROUTES
# ==========================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    display_name = data.get('displayName', '').strip()
    
    # Validation
    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400
    
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    
    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400
    
    # Check if user exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create user
    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        display_name=display_name or username,
        avatar_color='cyan'
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Generate token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Registration successful',
        'user': user.to_dict(),
        'token': access_token
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Find user
    user = User.query.filter_by(username=username).first()
    
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Update last login
    user.last_login = db.func.now()
    db.session.commit()
    
    # Generate token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'token': access_token
    }), 200


@app.route('/api/auth/guest', methods=['POST'])
def guest_login():
    """Create a temporary guest session"""
    import random
    import string
    
    # Generate random guest username
    guest_id = ''.join(random.choices(string.digits, k=4))
    guest_username = f'guest_{guest_id}'
    
    # Create guest user
    password_hash = bcrypt.generate_password_hash('guest').decode('utf-8')
    
    user = User(
        username=guest_username,
        email=f'{guest_username}@guest.local',
        password_hash=password_hash,
        display_name=f'Guest {guest_id}',
        avatar_color='gray'
    )
    
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Guest session created',
        'user': user.to_dict(),
        'token': access_token,
        'isGuest': True
    }), 201


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200


@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    # In a real app, you might want to blacklist the token
    return jsonify({'message': 'Logged out successfully'}), 200


# ==========================================
# MESSAGE ROUTES
# ==========================================

@app.route('/api/messages', methods=['GET'])
@jwt_required()
def get_messages():
    messages = Message.query.order_by(Message.created_at.asc()).limit(100).all()
    return jsonify({'messages': [m.to_dict() for m in messages]}), 200


@app.route('/api/messages', methods=['POST'])
@jwt_required()
def send_message():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    content = data.get('content', '').strip()
    is_asl = data.get('isAsl', False)
    
    if not content:
        return jsonify({'error': 'Message content is required'}), 400
    
    message = Message(
        sender_id=user_id,
        content=content,
        is_asl=is_asl
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({
        'message': 'Message sent',
        'data': message.to_dict()
    }), 201


# ==========================================
# USER ROUTES
# ==========================================

@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users for chat contacts"""
    user_id = get_jwt_identity()
    users = User.query.filter(User.id != user_id).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200


@app.route('/api/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


# ==========================================
# SERVE REACT APP
# ==========================================

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


# ==========================================
# ERROR HANDLERS
# ==========================================

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


# ==========================================
# INITIALIZE DATABASE
# ==========================================

def init_db():
    with app.app_context():
        db.create_all()
        
        # Create default admin user if not exists
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                email='admin@asl.app',
                password_hash=bcrypt.generate_password_hash('1234').decode('utf-8'),
                display_name='Administrator',
                avatar_color='cyan'
            )
            db.session.add(admin)
            db.session.commit()
            print('✅ Created default admin user (admin/1234)')
        
        print('✅ Database initialized')


# ==========================================
# RUN SERVER
# ==========================================

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    print(f'\n🚀 ASL Recognition Server running on http://localhost:{port}')
    print('=' * 50)
    app.run(host='0.0.0.0', port=port, debug=True)
