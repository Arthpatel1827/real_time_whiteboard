from collections import defaultdict
from datetime import datetime

from app.websocket.connection_registry import connection_registry


class UserService:
    # room_id -> client_id -> presence
    _active_users_by_room = defaultdict(dict)

    @staticmethod
    def join_room(room_id: str, display_name: str, client_id: str):
        room_id = str(room_id)
        client_id = str(client_id)

        presence = {
            "userId": client_id,
            "online": True,
            "lastSeen": datetime.utcnow().isoformat(),
            "displayName": display_name,
        }

        UserService._active_users_by_room[room_id][client_id] = presence
        connection_registry.broadcast_presence(room_id=room_id, event=presence)
        return presence

    @staticmethod
    def leave_room(room_id: str, client_id: str):
        room_id = str(room_id)
        client_id = str(client_id)

        existing = UserService._active_users_by_room.get(room_id, {}).pop(client_id, None)
        if existing:
            presence = {
                "userId": client_id,
                "online": False,
                "lastSeen": datetime.utcnow().isoformat(),
                "displayName": existing.get("displayName"),
            }
            connection_registry.broadcast_presence(room_id=room_id, event=presence)
            return presence

        return {
            "userId": client_id,
            "online": False,
            "lastSeen": datetime.utcnow().isoformat(),
            "displayName": None,
        }

    @staticmethod
    def get_users_in_room(room_id: str):
        room_id = str(room_id)
        return list(UserService._active_users_by_room.get(room_id, {}).values())

    @staticmethod
    def get_participant_count(room_id: str) -> int:
        room_id = str(room_id)
        return len(UserService._active_users_by_room.get(room_id, {}))