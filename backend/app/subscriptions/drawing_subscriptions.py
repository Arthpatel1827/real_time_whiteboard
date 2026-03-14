# Placeholder for subscription business logic.

from app.websocket.connection_registry import connection_registry


def broadcast_drawing_event(room_id: str, event: dict):
    connection_registry.broadcast_drawing_event(room_id=room_id, event=event)
