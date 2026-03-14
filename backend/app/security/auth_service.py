from werkzeug.security import check_password_hash, generate_password_hash

from app.database.db import get_db
from app.database.models import Session, User
from app.security.jwt_manager import jwt_manager


class AuthService:
    @staticmethod
    def register(display_name: str, email: str, password: str) -> dict:
        display_name = (display_name or '').strip()
        email = (email or '').strip().lower()
        password = password or ''

        if not display_name:
            raise ValueError('Display name is required')

        if not email:
            raise ValueError('Email is required')

        if not password:
            raise ValueError('Password is required')

        if len(password) < 6:
            raise ValueError('Password must be at least 6 characters')

        with get_db() as db:
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                raise ValueError('Email is already registered')

            user = User(
                display_name=display_name,
                email=email,
                password_hash=generate_password_hash(password),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            token = jwt_manager.create_token(
                subject=str(user.id),
                extra_claims={
                    'email': user.email,
                    'displayName': user.display_name,
                },
            )

            session = Session(
                user_id=user.id,
                token=token,
                is_active=True,
            )
            db.add(session)
            db.commit()

            return {
                'token': token,
                'user': {
                    'id': user.id,
                    'displayName': user.display_name,
                    'email': user.email,
                },
            }

    @staticmethod
    def login(email: str, password: str) -> dict:
        email = (email or '').strip().lower()
        password = password or ''

        if not email:
            raise ValueError('Email is required')

        if not password:
            raise ValueError('Password is required')

        with get_db() as db:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                raise ValueError('Invalid email or password')

            if not check_password_hash(user.password_hash, password):
                raise ValueError('Invalid email or password')

            token = jwt_manager.create_token(
                subject=str(user.id),
                extra_claims={
                    'email': user.email,
                    'displayName': user.display_name,
                },
            )

            session = Session(
                user_id=user.id,
                token=token,
                is_active=True,
            )
            db.add(session)
            db.commit()

            return {
                'token': token,
                'user': {
                    'id': user.id,
                    'displayName': user.display_name,
                    'email': user.email,
                },
            }

    @staticmethod
    def validate_token(token: str) -> dict:
        return jwt_manager.decode_token(token)