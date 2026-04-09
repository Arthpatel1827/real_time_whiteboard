import logging
import os
import time

from app.database.db import get_db
from app.database.models import DrawingEvent
from app.kafka.kafka_producer import KafkaProducerClient
from app.websocket.connection_registry import connection_registry
from app.observability.metrics_store import metrics_store

logger = logging.getLogger("whiteboard.drawing")
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
        safe_coordinates = coordinates or {}
        start = time.perf_counter()

        with get_db() as db:
            event = DrawingEvent(
                room_id=int(roomId),
                user_id=int(userId),
                event_type=eventType,
                event_data={
                    "coordinates": safe_coordinates,
                    "color": color,
                    "timestamp": timestamp,
                },
            )
            db.add(event)
            db.commit()
            db.refresh(event)

            duration_ms = (time.perf_counter() - start) * 1000
            metrics_store.inc("drawing.persist.success")
            metrics_store.timing("drawing.persist.ms", duration_ms)

            logger.info(
                "drawing_event_persisted",
                extra={
                    "roomId": str(roomId),
                    "userId": str(userId),
                    "eventType": eventType,
                    "durationMs": round(duration_ms, 2),
                },
            )

            return {
                "id": str(event.id),
                "roomId": str(event.room_id),
                "userId": str(event.user_id),
                "eventType": event.event_type,
                "coordinates": safe_coordinates,
                "color": color,
                "timestamp": timestamp,
            }

    @staticmethod
    def get_history(room_id: str):
        start = time.perf_counter()

        with get_db() as db:
            events = (
                db.query(DrawingEvent)
                .filter(DrawingEvent.room_id == int(room_id))
                .order_by(DrawingEvent.created_at, DrawingEvent.id)
                .all()
            )

            result = [
                {
                    "id": str(event.id),
                    "roomId": str(event.room_id),
                    "userId": str(event.user_id),
                    "eventType": event.event_type,
                    "coordinates": (event.event_data or {}).get("coordinates", {}),
                    "color": (event.event_data or {}).get("color"),
                    "timestamp": (event.event_data or {}).get("timestamp"),
                }
                for event in events
            ]

            duration_ms = (time.perf_counter() - start) * 1000
            metrics_store.inc("drawing.history.requests")
            metrics_store.timing("drawing.history.ms", duration_ms)
            metrics_store.set_gauge("drawing.history.lastRoomEventCount", len(result))

            return result

    @staticmethod
    def publish_event(event: dict):
        metrics_store.inc("drawing.publish.attempt")

        kafka_disabled = os.getenv("DISABLE_KAFKA_PUBLISH", "0") == "1"
        force_fail_kafka = os.getenv("FAIL_KAFKA_PUBLISH", "0") == "1"

        kafka_ok = False

        if not kafka_disabled:
            try:
                if force_fail_kafka:
                    raise RuntimeError("Simulated Kafka publish failure")

                producer.publish_drawing_event(event)
                kafka_ok = True
                metrics_store.inc("drawing.publish.kafka.success")
            except Exception as exc:
                metrics_store.inc("drawing.publish.kafka.failure")
                logger.warning(
                    "kafka_publish_failed_fallback_to_websocket",
                    extra={
                        "roomId": event.get("roomId"),
                        "eventId": event.get("id"),
                        "error": str(exc),
                    },
                )

        try:
            connection_registry.broadcast(room_id=event["roomId"], event=event)
            metrics_store.inc("drawing.publish.websocket.success")
        except Exception as exc:
            metrics_store.inc("drawing.publish.websocket.failure")
            logger.exception(
                "websocket_broadcast_failed",
                extra={
                    "roomId": event.get("roomId"),
                    "eventId": event.get("id"),
                    "error": str(exc),
                },
            )
            raise

        if kafka_ok:
            logger.info(
                "drawing_event_published",
                extra={
                    "roomId": event.get("roomId"),
                    "eventId": event.get("id"),
                    "eventType": event.get("eventType"),
                    "kafka": True,
                    "websocket": True,
                },
            )
        else:
            logger.info(
                "drawing_event_published_websocket_only",
                extra={
                    "roomId": event.get("roomId"),
                    "eventId": event.get("id"),
                    "eventType": event.get("eventType"),
                    "kafka": False,
                    "websocket": True,
                },
            )