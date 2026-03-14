# Failure Scenarios

This document describes example failure modes and recovery strategies for the real-time whiteboard system.

## Kafka Broker Failure
- **Symptom:** Drawing updates stop propagating to other clients.
- **Mitigation:** Use Kafka monitoring and restart brokers. Clients should reconnect and replay missed events from persisted state.

## PostgreSQL Unavailable
- **Symptom:** API returns errors on room or history queries.
- **Mitigation:** Use database replicas and failover. Implement retry logic and circuit breakers.

## WebSocket Disconnects
- **Symptom:** Clients lose real-time updates.
- **Mitigation:** Client should automatically reconnect with exponential backoff.

## Slow Consumer / Backpressure
- **Symptom:** Kafka consumer lags behind producer.
- **Mitigation:** Scale consumers, increase partitions, and use backpressure mechanisms.
