# Placeholder for presence subscription logic.

from app.websocket.connection_registry import connection_registry


def broadcast_presence(room_id: str, event: dict):
    connection_registry.broadcast_presence(room_id=room_id, event=event)
