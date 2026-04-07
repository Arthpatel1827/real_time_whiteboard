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
from app.services.room_service import RoomService
from app.services.drawing_service import DrawingService
from app.services.user_service import UserService
from app.websocket.connection_registry import connection_registry


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
    return RoomService.get_rooms()


@query.field("room")
def resolve_room(_, info, roomId):
    return RoomService.get_room(roomId)


@query.field("boardHistory")
def resolve_board_history(_, info, roomId):
    return DrawingService.get_history(room_id=roomId)


@query.field("usersInRoom")
def resolve_users_in_room(_, info, roomId):
    return UserService.get_users_in_room(room_id=roomId)


@mutation.field("createRoom")
def resolve_create_room(_, info, name):
    return RoomService.create_room(name=name)


@mutation.field("deleteRoom")
def resolve_delete_room(_, info, roomId):
    return RoomService.delete_room(room_id=roomId)


@mutation.field("joinRoom")
def resolve_join_room(_, info, roomId, userName, clientId):
    return UserService.join_room(
        room_id=roomId,
        display_name=userName,
        client_id=clientId,
    )


@mutation.field("leaveRoom")
def resolve_leave_room(_, info, roomId, clientId):
    return UserService.leave_room(
        room_id=roomId,
        client_id=clientId,
    )


@mutation.field("sendDrawingEvent")
def resolve_send_drawing_event(_, info, input):
    request = info.context["request"]

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise ValueError("Missing Authorization header")

    token = auth_header.split(" ", 1)[1].strip()
    payload = jwt_manager.decode_token(token)

    user_id = payload["sub"]

    event = DrawingService.create_drawing_event(
        roomId=input["roomId"],
        userId=user_id,
        eventType=input["eventType"],
        coordinates=input["coordinates"],
        color=input.get("color"),
        timestamp=input.get("timestamp"),
    )
    DrawingService.publish_event(event)
    return True


@mutation.field("sendCursorEvent")
def resolve_send_cursor_event(_, info, roomId, userId, displayName, color, x, y):
    request = info.context["request"]

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise ValueError("Missing Authorization header")

    token = auth_header.split(" ", 1)[1].strip()
    payload = jwt_manager.decode_token(token)

    authenticated_user_id = str(payload["sub"])
    if str(userId) != authenticated_user_id:
        raise ValueError("User ID does not match authenticated token")

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
    return True


@subscription.source("drawingUpdates")
async def source_drawing_updates(obj, info, roomId):
    queue = connection_registry.subscribe(room_id=roomId)

    try:
        while True:
            message = await queue.get()
            yield message
    finally:
        connection_registry.unsubscribe(room_id=roomId, queue=queue)


@subscription.field("drawingUpdates")
def drawing_updates_resolver(message, info, roomId):
    return message


@subscription.source("userPresenceUpdates")
async def source_user_presence_updates(obj, info, roomId):
    queue = connection_registry.subscribe_presence(room_id=roomId)

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


@subscription.field("userPresenceUpdates")
def user_presence_updates_resolver(message, info, roomId):
    return message


@subscription.source("presenceUpdates")
async def source_presence_updates(obj, info, roomId):
    queue = connection_registry.subscribe_presence(room_id=roomId)

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


@subscription.field("presenceUpdates")
def presence_updates_resolver(message, info, roomId):
    return message


@subscription.source("cursorUpdates")
async def source_cursor_updates(obj, info, roomId):
    queue = connection_registry.subscribe_cursor(room_id=roomId)

    try:
        while True:
            message = await queue.get()
            yield message
    finally:
        connection_registry.unsubscribe_cursor(room_id=roomId, queue=queue)


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