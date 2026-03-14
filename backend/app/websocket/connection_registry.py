import asyncio
from collections import defaultdict


class ConnectionRegistry:
    def __init__(self):
        self.room_subscribers = defaultdict(list)
        self.presence_subscribers = defaultdict(list)
        self.connections = defaultdict(list)

    def add(self, room_id, websocket):
        self.connections[str(room_id)].append(websocket)

    def remove(self, room_id, websocket):
        room_id = str(room_id)
        if room_id in self.connections and websocket in self.connections[room_id]:
            self.connections[room_id].remove(websocket)

    def get_room_connections(self, room_id):
        return self.connections.get(str(room_id), [])

    def subscribe(self, room_id):
        queue = asyncio.Queue()
        self.room_subscribers[str(room_id)].append(queue)
        return queue

    def unsubscribe(self, room_id, queue):
        room_id = str(room_id)
        if room_id in self.room_subscribers and queue in self.room_subscribers[room_id]:
            self.room_subscribers[room_id].remove(queue)

    def broadcast(self, room_id, event):
        room_id = str(room_id)
        for queue in self.room_subscribers.get(room_id, []):
            queue.put_nowait(event)

    def subscribe_presence(self, room_id):
        queue = asyncio.Queue()
        self.presence_subscribers[str(room_id)].append(queue)
        return queue

    def unsubscribe_presence(self, room_id, queue):
        room_id = str(room_id)
        if room_id in self.presence_subscribers and queue in self.presence_subscribers[room_id]:
            self.presence_subscribers[room_id].remove(queue)

    def broadcast_presence(self, room_id, event):
        room_id = str(room_id)
        for queue in self.presence_subscribers.get(room_id, []):
            queue.put_nowait(event)


connection_registry = ConnectionRegistry()