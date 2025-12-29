"""
User Management and Authentication Models
Handles user accounts, sessions, and authentication
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import hashlib
import secrets
import json
import os


class User:
    """User account model"""

    def __init__(self, user_id: str, email: str, phone: str = None,
                 auth_method: str = "password", google_id: str = None):
        self.user_id = user_id
        self.email = email
        self.phone = phone
        self.phone_verified = False
        self.auth_method = auth_method  # "password" or "google"
        self.google_id = google_id
        self.password_hash = None
        self.created_at = datetime.now().isoformat()
        self.sessions = []  # List of session_ids this user owns
        self.subscription_plan = None  # "starter", "professional", "enterprise"
        self.verification_code = None
        self.verification_expires = None

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "email": self.email,
            "phone": self.phone,
            "phone_verified": self.phone_verified,
            "auth_method": self.auth_method,
            "google_id": self.google_id,
            "created_at": self.created_at,
            "sessions": self.sessions,
            "subscription_plan": self.subscription_plan,
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]):
        user = User(
            user_id=data["user_id"],
            email=data["email"],
            phone=data.get("phone"),
            auth_method=data.get("auth_method", "password"),
            google_id=data.get("google_id")
        )
        user.phone_verified = data.get("phone_verified", False)
        user.password_hash = data.get("password_hash")
        user.created_at = data.get("created_at")
        user.sessions = data.get("sessions", [])
        user.subscription_plan = data.get("subscription_plan")
        user.verification_code = data.get("verification_code")
        user.verification_expires = data.get("verification_expires")
        return user


class UserManager:
    """Manage user accounts and authentication"""

    def __init__(self, data_dir: str = "./data/users"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        self.users_file = os.path.join(data_dir, "users.json")
        self.users: Dict[str, User] = {}
        self.load_users()

    def load_users(self):
        """Load users from disk"""
        if os.path.exists(self.users_file):
            try:
                with open(self.users_file, 'r') as f:
                    data = json.load(f)
                    for user_id, user_data in data.items():
                        self.users[user_id] = User.from_dict(user_data)
            except Exception as e:
                print(f"Error loading users: {e}")
                self.users = {}

    def save_users(self):
        """Save users to disk"""
        try:
            data = {uid: user.to_dict() for uid, user in self.users.items()}
            # Also save password hashes separately (not in to_dict for security)
            for uid, user in self.users.items():
                if user.password_hash:
                    data[uid]["password_hash"] = user.password_hash
                if user.verification_code:
                    data[uid]["verification_code"] = user.verification_code
                    data[uid]["verification_expires"] = user.verification_expires

            with open(self.users_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving users: {e}")

    def create_user(self, email: str, password: str = None, phone: str = None,
                   auth_method: str = "password", google_id: str = None) -> User:
        """Create a new user account"""
        import uuid

        # Check if email already exists
        for user in self.users.values():
            if user.email == email:
                raise ValueError("Email already registered")

        user_id = str(uuid.uuid4())
        user = User(
            user_id=user_id,
            email=email,
            phone=phone,
            auth_method=auth_method,
            google_id=google_id
        )

        if password and auth_method == "password":
            user.password_hash = self.hash_password(password)

        self.users[user_id] = user
        self.save_users()
        return user

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Find user by email"""
        for user in self.users.values():
            if user.email == email:
                return user
        return None

    def get_user_by_google_id(self, google_id: str) -> Optional[User]:
        """Find user by Google ID"""
        for user in self.users.values():
            if user.google_id == google_id:
                return user
        return None

    def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.users.get(user_id)

    def verify_password(self, user: User, password: str) -> bool:
        """Verify user password"""
        if not user.password_hash:
            return False
        return user.password_hash == self.hash_password(password)

    def hash_password(self, password: str) -> str:
        """Hash password with SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()

    def generate_verification_code(self, user: User) -> str:
        """Generate 6-digit verification code for phone"""
        code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        user.verification_code = code
        user.verification_expires = (datetime.now() + timedelta(minutes=10)).isoformat()
        self.save_users()
        return code

    def verify_phone_code(self, user: User, code: str) -> bool:
        """Verify phone verification code"""
        if not user.verification_code or not user.verification_expires:
            return False

        if datetime.fromisoformat(user.verification_expires) < datetime.now():
            return False

        if user.verification_code == code:
            user.phone_verified = True
            user.verification_code = None
            user.verification_expires = None
            self.save_users()
            return True

        return False

    def add_session_to_user(self, user_id: str, session_id: str):
        """Link a voice AI session to a user"""
        user = self.get_user(user_id)
        if user and session_id not in user.sessions:
            user.sessions.append(session_id)
            self.save_users()

    def remove_session_from_user(self, user_id: str, session_id: str):
        """Remove a session from user"""
        user = self.get_user(user_id)
        if user and session_id in user.sessions:
            user.sessions.remove(session_id)
            self.save_users()

    def update_user(self, user: User):
        """Update user data"""
        self.users[user.user_id] = user
        self.save_users()


class AuthToken:
    """JWT-like token management (simplified)"""

    @staticmethod
    def generate_token(user_id: str) -> str:
        """Generate auth token"""
        import uuid
        token = f"{user_id}:{uuid.uuid4().hex}"
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def create_session_token(user_id: str, expires_hours: int = 24) -> Dict[str, Any]:
        """Create session token with expiration"""
        token = AuthToken.generate_token(user_id)
        expires_at = (datetime.now() + timedelta(hours=expires_hours)).isoformat()

        return {
            "token": token,
            "user_id": user_id,
            "expires_at": expires_at
        }
