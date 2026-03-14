# Placeholder for metrics instrumentation (e.g., Prometheus)

from prometheus_client import Counter, Gauge, Histogram

DRAWING_EVENTS_PROCESSED = Counter('drawing_events_processed_total', 'Number of drawing events processed')
KAFKA_CONSUMER_ERRORS = Counter('kafka_consumer_errors_total', 'Number of errors in Kafka consumer')
CURRENT_SUBSCRIPTIONS = Gauge('current_subscriptions', 'Number of active GraphQL subscriptions')
EVENT_PROCESSING_LATENCY = Histogram('event_processing_latency_seconds', 'Latency to process drawing events')
