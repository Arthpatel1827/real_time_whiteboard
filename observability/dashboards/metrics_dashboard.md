# Metrics Dashboard

This dashboard is a starting point for monitoring the Real-Time Whiteboard system.

## Key Metrics

- `drawing_events_processed_total`: Total number of drawing events processed by the backend.
- `kafka_consumer_errors_total`: Errors encountered reading from Kafka.
- `current_subscriptions`: Number of active GraphQL subscriptions.
- `event_processing_latency_seconds`: Latency histogram for processing drawing events.

## Suggested Visualizations

- Time series of `drawing_events_processed_total`.
- Heatmap of `event_processing_latency_seconds` (p50/p90/p99).
- Gauge for `current_subscriptions`.
- Alert on `kafka_consumer_errors_total > 0` over a 5-minute window.
