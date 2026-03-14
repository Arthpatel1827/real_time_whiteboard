import os
import time

import jwt


class JwtManager:
    def __init__(self):
        self.secret = os.environ.get('JWT_SECRET', 'supersecret')
        self.algorithm = 'HS256'
        self.expiration_seconds = int(os.environ.get('JWT_EXP', 3600))

    def create_token(self, subject: str, extra_claims: dict = None) -> str:
        payload = {
            'sub': subject,
            'iat': int(time.time()),
            'exp': int(time.time()) + self.expiration_seconds,
        }
        if extra_claims:
            payload.update(extra_claims)
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)

    def decode_token(self, token: str) -> dict:
        return jwt.decode(token, self.secret, algorithms=[self.algorithm])


jwt_manager = JwtManager()
