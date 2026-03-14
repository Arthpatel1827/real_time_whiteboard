# Placeholder for GraphQL query resolvers related to users.

from app.services.user_service import UserService


def get_users_in_room_resolver(_, info, roomId):
    return UserService.get_users_in_room(room_id=roomId)
