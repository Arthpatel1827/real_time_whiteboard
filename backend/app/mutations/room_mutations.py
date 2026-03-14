# Placeholder for GraphQL mutation resolvers related to rooms.

from app.services.room_service import RoomService


def create_room_resolver(_, info, name):
    return RoomService.create_room(name=name)
