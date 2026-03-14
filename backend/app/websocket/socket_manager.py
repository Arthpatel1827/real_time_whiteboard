# Placeholder for a WebSocket connection manager.
# In this scaffold, GraphQL subscriptions are handled via Ariadne and an in-memory registry.

from app.websocket.connection_registry import connection_registry


def broadcast_to_room(room_id: str, message: dict):
    connection_registry.broadcast_drawing_event(room_id, message)
