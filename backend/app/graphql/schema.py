import logging
import os
import time

from ariadne import (
    QueryType,
    MutationType,
    SubscriptionType,
    ScalarType,
    make_executable_schema,
)
from ariadne.asgi import GraphQL
from ariadne.asgi.handlers import GraphQLTransportWSHandler

from app.security.jwt_manager import jwt_manager
from app.security.simple_rate_limiter import rate_limiter
from app.services.room_service import RoomService
from app.services.drawing_service import DrawingService
from app.services.user_service import UserService
from app.websocket.connection_registry import connection_registry
from app.observability.metrics_store import metrics_store
from app.utils.validation import (
    validate_room_id,
    validate_coordinates,
    validate_cursor_coordinates,
)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

logger = logging.getLogger("whiteboard.graphql")

json_scalar = ScalarType("JSON")

type_defs = """
scalar JSON

type Room {
  id: ID!
  name: String!
  participantCount: Int!
  createdAt: String!
}

type DrawingEvent {
  id: ID!
  roomId: ID!
  userId: ID!
  eventType: String!
  coordinates: JSON!
  color: String
  timestamp: String
}

input DrawingEventInput {
  roomId: ID!
  eventType: String!
  coordinates: JSON!
  color: String
  timestamp: String
}

type UserPresence {
  type: String
  roomId: ID
  userId: ID
  clientId: ID
  displayName: String
  color: String
  online: Boolean!
  lastSeen: String
}

type CursorEvent {
  type: String
  roomId: ID!
  userId: ID!
  displayName: String
  color: String
  x: JSON!
  y: JSON!
  timestamp: String
}

type Query {
  rooms: [Room!]!
  room(roomId: ID!): Room
  boardHistory(roomId: ID!): [DrawingEvent!]!
  usersInRoom(roomId: ID!): [UserPresence!]!
  health: JSON!
  systemState: JSON!
}

type Mutation {
  createRoom(name: String!): Room!
  deleteRoom(roomId: ID!): Boolean!
  joinRoom(roomId: ID!, userName: String!, clientId: ID!): UserPresence!
  leaveRoom(roomId: ID!, clientId: ID!): UserPresence!
  sendDrawingEvent(input: DrawingEventInput!): Boolean!
  sendCursorEvent(
    roomId: ID!
    userId: ID!
    displayName: String!
    color: String!
    x: JSON!
    y: JSON!
  ): Boolean!
}

type Subscription {
  drawingUpdates(roomId: ID!): DrawingEvent!
  userPresenceUpdates(roomId: ID!): UserPresence!
  presenceUpdates(roomId: ID!): UserPresence!
  cursorUpdates(roomId: ID!): CursorEvent!
}
"""

query = QueryType()
mutation = MutationType()
subscription = SubscriptionType()


@query.field("rooms")
def resolve_rooms(_, info):
    metrics_store.inc("query.rooms")
    return RoomService.get_rooms()


@query.field("room")
def resolve_room(_, info, roomId):
    metrics_store.inc("query.room")
    validate_room_id(roomId)
    return RoomService.get_room(roomId)


@query.field("boardHistory")
def resolve_board_history(_, info, roomId):
    metrics_store.inc("query.boardHistory")
    validate_room_id(roomId)
    return DrawingService.get_history(room_id=roomId)


@query.field("usersInRoom")
def resolve_users_in_room(_, info, roomId):
    metrics_store.inc("query.usersInRoom")
    validate_room_id(roomId)
    return UserService.get_users_in_room(room_id=roomId)


@query.field("health")
def resolve_health(_, info):
    metrics_store.inc("query.health")
    return {
        "status": "ok",
        "service": "whiteboard-backend",
        "kafkaDisabled": os.getenv("DISABLE_KAFKA_PUBLISH", "0") == "1",
        "simulateKafkaFailure": os.getenv("FAIL_KAFKA_PUBLISH", "0") == "1",
    }


@query.field("systemState")
def resolve_system_state(_, info):
    metrics_store.inc("query.systemState")
    return metrics_store.snapshot()


@mutation.field("createRoom")
def resolve_create_room(_, info, name):
    metrics_store.inc("mutation.createRoom")
    if not name or not name.strip():
        raise ValueError("Room name is required")
    if len(name.strip()) > 100:
        raise ValueError("Room name is too long")
    return RoomService.create_room(name=name.strip())


@mutation.field("deleteRoom")
def resolve_delete_room(_, info, roomId):
    metrics_store.inc("mutation.deleteRoom")
    validate_room_id(roomId)
    return RoomService.delete_room(room_id=roomId)


@mutation.field("joinRoom")
def resolve_join_room(_, info, roomId, userName, clientId):
    metrics_store.inc("mutation.joinRoom")
    validate_room_id(roomId)

    if not userName or not userName.strip():
        raise ValueError("userName is required")
    if len(userName.strip()) > 100:
        raise ValueError("userName is too long")
    if not clientId or len(str(clientId)) > 100:
        raise ValueError("clientId is invalid")

    return UserService.join_room(
        room_id=roomId,
        display_name=userName.strip(),
        client_id=clientId,
    )


@mutation.field("leaveRoom")
def resolve_leave_room(_, info, roomId, clientId):
    metrics_store.inc("mutation.leaveRoom")
    validate_room_id(roomId)

    if not clientId or len(str(clientId)) > 100:
        raise ValueError("clientId is invalid")

    return UserService.leave_room(
        room_id=roomId,
        client_id=clientId,
    )


@mutation.field("sendDrawingEvent")
def resolve_send_drawing_event(_, info, input):
    request = info.context["request"]
    started = time.perf_counter()

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        metrics_store.inc("auth.missing_bearer")
        raise ValueError("Missing Authorization header")

    token = auth_header.split(" ", 1)[1].strip()
    payload = jwt_manager.decode_token(token)
    user_id = str(payload["sub"])

    room_id = input["roomId"]
    event_type = input["eventType"]
    coordinates = input["coordinates"]

    validate_room_id(room_id)
    validate_coordinates(event_type, coordinates)

    limiter_key = f"drawing:{user_id}"
    if not rate_limiter.allow(limiter_key, limit=120, window_seconds=10):
        metrics_store.inc("ratelimit.drawing.blocked")
        logger.warning(
            "drawing_rate_limited",
            extra={"userId": user_id, "roomId": room_id},
        )
        raise ValueError("Drawing rate limit exceeded")

    event = DrawingService.create_drawing_event(
        roomId=room_id,
        userId=user_id,
        eventType=event_type,
        coordinates=coordinates,
        color=input.get("color"),
        timestamp=input.get("timestamp"),
    )
    DrawingService.publish_event(event)

    duration_ms = (time.perf_counter() - started) * 1000
    metrics_store.inc("mutation.sendDrawingEvent.success")
    metrics_store.timing("mutation.sendDrawingEvent.ms", duration_ms)

    return True


@mutation.field("sendCursorEvent")
def resolve_send_cursor_event(_, info, roomId, userId, displayName, color, x, y):
    request = info.context["request"]
    started = time.perf_counter()

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        metrics_store.inc("auth.missing_bearer")
        raise ValueError("Missing Authorization header")

    token = auth_header.split(" ", 1)[1].strip()
    payload = jwt_manager.decode_token(token)

    authenticated_user_id = str(payload["sub"])
    if str(userId) != authenticated_user_id:
        metrics_store.inc("auth.cursor_user_mismatch")
        raise ValueError("User ID does not match authenticated token")

    validate_room_id(roomId)
    validate_cursor_coordinates(x, y)

    limiter_key = f"cursor:{authenticated_user_id}"
    if not rate_limiter.allow(limiter_key, limit=200, window_seconds=10):
        metrics_store.inc("ratelimit.cursor.blocked")
        return True

    event = {
        "type": "cursor",
        "roomId": str(roomId),
        "userId": str(userId),
        "displayName": displayName,
        "color": color,
        "x": x,
        "y": y,
        "timestamp": None,
    }

    connection_registry.broadcast_cursor(room_id=roomId, event=event)

    duration_ms = (time.perf_counter() - started) * 1000
    metrics_store.inc("mutation.sendCursorEvent.success")
    metrics_store.timing("mutation.sendCursorEvent.ms", duration_ms)

    return True


@subscription.source("drawingUpdates")
async def source_drawing_updates(obj, info, roomId):
    validate_room_id(roomId)
    queue = connection_registry.subscribe(room_id=roomId)
    metrics_store.inc("subscription.drawing.connect")

    try:
        while True:
            message = await queue.get()
            yield message
    finally:
        connection_registry.unsubscribe(room_id=roomId, queue=queue)
        metrics_store.inc("subscription.drawing.disconnect")


@subscription.field("drawingUpdates")
def drawing_updates_resolver(message, info, roomId):
    return message


@subscription.source("userPresenceUpdates")
async def source_user_presence_updates(obj, info, roomId):
    validate_room_id(roomId)
    queue = connection_registry.subscribe_presence(room_id=roomId)
    metrics_store.inc("subscription.userPresence.connect")

    try:
        while True:
            while not queue.empty():
                queue.get_nowait()

            for user in UserService.get_users_in_room(room_id=roomId):
                yield user

            while True:
                message = await queue.get()
                yield message
    finally:
        connection_registry.unsubscribe_presence(room_id=roomId, queue=queue)
        metrics_store.inc("subscription.userPresence.disconnect")


@subscription.field("userPresenceUpdates")
def user_presence_updates_resolver(message, info, roomId):
    return message


@subscription.source("presenceUpdates")
async def source_presence_updates(obj, info, roomId):
    validate_room_id(roomId)
    queue = connection_registry.subscribe_presence(room_id=roomId)
    metrics_store.inc("subscription.presence.connect")

    try:
        while True:
            while not queue.empty():
                queue.get_nowait()

            for user in UserService.get_users_in_room(room_id=roomId):
                yield user

            while True:
                message = await queue.get()
                yield message
    finally:
        connection_registry.unsubscribe_presence(room_id=roomId, queue=queue)
        metrics_store.inc("subscription.presence.disconnect")


@subscription.field("presenceUpdates")
def presence_updates_resolver(message, info, roomId):
    return message


@subscription.source("cursorUpdates")
async def source_cursor_updates(obj, info, roomId):
    validate_room_id(roomId)
    queue = connection_registry.subscribe_cursor(room_id=roomId)
    metrics_store.inc("subscription.cursor.connect")

    try:
        while True:
            message = await queue.get()
            yield message
    finally:
        connection_registry.unsubscribe_cursor(room_id=roomId, queue=queue)
        metrics_store.inc("subscription.cursor.disconnect")


@subscription.field("cursorUpdates")
def cursor_updates_resolver(message, info, roomId):
    return message


schema = make_executable_schema(
    type_defs,
    query,
    mutation,
    subscription,
    json_scalar,
)

graphql_app = GraphQL(
    schema,
    debug=True,
    websocket_handler=GraphQLTransportWSHandler(),
)