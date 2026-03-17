from collections import defaultdict
from datetime import datetime

from app.websocket.connection_registry import connection_registry


class UserService:
    # room_id -> client_id -> presence
    _active_users_by_room = defaultdict(dict)

    _CURSOR_COLORS = [
        "#2563eb",
        "#dc2626",
        "#16a34a",
        "#ca8a04",
        "#9333ea",
        "#ea580c",
        "#0891b2",
        "#db2777",
    ]

    @staticmethod
    def _get_user_color(client_id: str) -> str:
        client_id = str(client_id)
        index = sum(ord(char) for char in client_id) % len(UserService._CURSOR_COLORS)
        return UserService._CURSOR_COLORS[index]

    @staticmethod
    def _build_presence(room_id: str, display_name: str, client_id: str, online: bool):
        room_id = str(room_id)
        client_id = str(client_id)

        return {
            "type": "presence",
            "roomId": room_id,
            "userId": client_id,
            "clientId": client_id,
            "displayName": display_name,
            "color": UserService._get_user_color(client_id),
            "online": online,
            "lastSeen": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def join_room(room_id: str, display_name: str, client_id: str):
        room_id = str(room_id)
        client_id = str(client_id)

        presence = UserService._build_presence(
            room_id=room_id,
            display_name=display_name,
            client_id=client_id,
            online=True,
        )

        UserService._active_users_by_room[room_id][client_id] = presence
        connection_registry.broadcast_presence(room_id=room_id, event=presence)
        return presence

    @staticmethod
    def leave_room(room_id: str, client_id: str):
        room_id = str(room_id)
        client_id = str(client_id)

        existing = UserService._active_users_by_room.get(room_id, {}).pop(client_id, None)

        if existing:
            presence = UserService._build_presence(
                room_id=room_id,
                display_name=existing.get("displayName") or "Unknown User",
                client_id=client_id,
                online=False,
            )
            connection_registry.broadcast_presence(room_id=room_id, event=presence)
            return presence

        return UserService._build_presence(
            room_id=room_id,
            display_name="Unknown User",
            client_id=client_id,
            online=False,
        )

    @staticmethod
    def get_users_in_room(room_id: str):
        room_id = str(room_id)
        return list(UserService._active_users_by_room.get(room_id, {}).values())

    @staticmethod
    def get_participant_count(room_id: str) -> int:
        room_id = str(room_id)
        return len(UserService._active_users_by_room.get(room_id, {}))