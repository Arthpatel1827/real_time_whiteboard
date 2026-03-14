# Placeholder for GraphQL query resolvers related to rooms.

from app.services.room_service import RoomService


def get_rooms_resolver(_, info):
    return RoomService.get_rooms()
