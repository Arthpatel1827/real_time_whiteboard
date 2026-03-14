# GraphQL Schema

## Queries

- `rooms`: Returns a list of active rooms.
- `boardHistory(roomId: ID!)`: Returns persisted drawing events for a room.
- `usersInRoom(roomId: ID!)`: Returns presence information for users in a room.

## Mutations

- `createRoom(name: String!)`: Create a new room.
- `joinRoom(roomId: ID!, userName: String!)`: Join a room and broadcast presence.
- `sendDrawingEvent(input: DrawingEventInput!)`: Persist and publish drawing event.

## Subscriptions

- `drawingUpdates(roomId: ID!)`: Stream drawing events as they happen in a room.
- `userPresenceUpdates(roomId: ID!)`: Stream user presence updates.

## Types

- `DrawingEvent` contains raw stroke data.
- `UserPresence` indicates whether a user is online.
