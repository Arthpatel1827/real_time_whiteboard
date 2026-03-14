import json
import os
import threading
import time

from confluent_kafka import Consumer

from app.kafka.topics import DRAWING_EVENTS
from app.observability.logging_config import get_logger
from app.websocket.connection_registry import connection_registry

logger = get_logger(__name__)


def _consumer_loop():
    bootstrap_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")

    consumer = Consumer(
        {
            "bootstrap.servers": bootstrap_servers,
            "group.id": "whiteboard-consumer",
            "auto.offset.reset": "earliest",
        }
    )

    # Basic retry loop so startup ordering is less fragile
    while True:
        try:
            consumer.subscribe([DRAWING_EVENTS])
            logger.info("Kafka consumer started")
            break
        except Exception as e:
            logger.warning("Kafka subscribe failed, retrying: %s", e)
            time.sleep(2)

    while True:
        msg = consumer.poll(1.0)

        if msg is None:
            continue

        if msg.error():
            logger.error("Kafka error: %s", msg.error())
            continue

        try:
            event = json.loads(msg.value().decode("utf-8"))
            room_id = str(event.get("roomId"))

            logger.debug("Received drawing event for room %s", room_id)

            connection_registry.broadcast(
                room_id=room_id,
                event=event,
            )

        except Exception as e:
            logger.exception("Failed to process Kafka message: %s", e)


def start_consumer():
    thread = threading.Thread(target=_consumer_loop, daemon=True)
    thread.start()
    return thread