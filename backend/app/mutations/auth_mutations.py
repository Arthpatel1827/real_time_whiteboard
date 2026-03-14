# GraphQL mutation resolvers related to authentication.

from app.security.auth_service import AuthService


def login_resolver(_, info, email, password):
    result = AuthService.login(email=email, password=password)

    return {
        "token": result["token"],
        "user": result["user"],
    }


def register_resolver(_, info, displayName, email, password):
    result = AuthService.register(
        display_name=displayName,
        email=email,
        password=password,
    )

    return {
        "token": result["token"],
        "user": result["user"],
    }