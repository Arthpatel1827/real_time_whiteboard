from functools import wraps

from flask import g, jsonify, request

from app.security.jwt_manager import jwt_manager


def requires_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401

        token = auth_header.split(' ', 1)[1].strip()

        try:
            payload = jwt_manager.decode_token(token)
            g.current_user = {
                'id': int(payload['sub']),
                'email': payload.get('email'),
                'displayName': payload.get('displayName'),
            }
        except Exception:
            return jsonify({'error': 'Invalid or expired token'}), 401

        return fn(*args, **kwargs)

    return wrapper