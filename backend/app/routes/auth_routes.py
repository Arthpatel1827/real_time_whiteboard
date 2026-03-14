from flask import Blueprint, g, jsonify, request

from app.security.decorators import requires_auth
from app.security.auth_service import AuthService

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}

    try:
        result = AuthService.register(
            display_name=data.get('displayName'),
            email=data.get('email'),
            password=data.get('password'),
        )
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception:
        return jsonify({'error': 'Registration failed'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}

    try:
        result = AuthService.login(
            email=data.get('email'),
            password=data.get('password'),
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception:
        return jsonify({'error': 'Login failed'}), 500


@auth_bp.route('/me', methods=['GET'])
@requires_auth
def me():
    return jsonify({'user': g.current_user}), 200