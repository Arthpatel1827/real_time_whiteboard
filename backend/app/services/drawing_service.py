from app.database.db import get_db
from app.database.models import DrawingEvent
from app.kafka.kafka_producer import KafkaProducerClient
from app.websocket.connection_registry import connection_registry

producer = KafkaProducerClient()


class DrawingService:
    @staticmethod
    def create_drawing_event(
        roomId: str,
        userId: str,
        eventType: str,
        coordinates: dict,
        color: str = None,
        timestamp: str = None,
    ):
        with get_db() as db:
            event = DrawingEvent(
                room_id=int(roomId),
                user_id=int(userId),
                event_type=eventType,
                event_data={
                    "coordinates": coordinates,
                    "color": color,
                    "timestamp": timestamp,
                },
            )
            db.add(event)
            db.commit()
            db.refresh(event)
            return {
                "id": str(event.id),
                "roomId": str(event.room_id),
                "userId": str(event.user_id),
                "eventType": event.event_type,
                "coordinates": coordinates,
                "color": color,
                "timestamp": timestamp,
            }

    @staticmethod
    def get_history(room_id: str):
        with get_db() as db:
            events = (
                db.query(DrawingEvent)
                .filter(DrawingEvent.room_id == int(room_id))
                .order_by(DrawingEvent.created_at)
                .all()
            )
            return [
                {
                    "id": str(event.id),
                    "roomId": str(event.room_id),
                    "userId": str(event.user_id),
                    "eventType": event.event_type,
                    "coordinates": event.event_data.get("coordinates", {}),
                    "color": event.event_data.get("color"),
                    "timestamp": event.event_data.get("timestamp"),
                }
                for event in events
            ]

    @staticmethod
    def publish_event(event: dict):
        producer.publish_drawing_event(event)
        connection_registry.broadcast(room_id=event["roomId"], event=event)