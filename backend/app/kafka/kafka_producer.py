import json
import os

from confluent_kafka import Producer

from app.kafka.topics import DRAWING_EVENTS


class KafkaProducerClient:
    def __init__(self):
        bootstrap_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
        self.producer = Producer({
            "bootstrap.servers": bootstrap_servers
        })

    def send_event(self, topic, data):
        self.producer.produce(
            topic,
            json.dumps(data).encode("utf-8")
        )
        self.producer.flush()

    def publish_drawing_event(self, event: dict):
        self.send_event(DRAWING_EVENTS, event)