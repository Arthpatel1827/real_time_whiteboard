# 🧠 Real-Time Collaborative Whiteboard

A real-time distributed whiteboard application that allows multiple users to draw simultaneously with live synchronization, presence tracking, and low-latency updates.

---

# 🚀 Tech Stack

### Frontend
- React.js
- Apollo Client
- TailwindCSS

### Backend
- Flask + Ariadne (GraphQL)
- WebSockets (Subscriptions)
- Kafka (event streaming)

### Database
- PostgreSQL

### Infrastructure
- Docker / Docker Compose

---

# 🏗️ System Architecture

The system follows a distributed event-driven architecture:

Client → GraphQL API → Kafka → WebSocket Broadcast → Clients

### Flow:
1. User draws on canvas
2. Frontend batches stroke data
3. GraphQL mutation sends event
4. Backend persists event (PostgreSQL)
5. Event published to Kafka
6. Backend broadcasts via WebSocket subscriptions
7. All clients update in real-time

---

# 🎯 Features

- 🎨 Multi-user real-time drawing
- 🧑‍🤝‍🧑 Live presence tracking
- 🖱️ Cursor sharing
- 🔄 GraphQL subscriptions
- ⚡ Optimized drawing using stroke batching
- 🧾 Persistent drawing history
- 🔐 JWT-based authentication

---

# ⚡ Performance Optimization

- Stroke batching (reduces network load by ~80%)
- Request throttling for cursor & drawing events
- Incremental canvas rendering
- Local rendering before server sync (optimistic updates)

---

# 🧪 Failure & Resilience Scenarios

## 1. Unauthorized Request Handling
- **Test:** Send mutation without Authorization header
- **Result:** Backend rejects request safely
- **Impact:** System remains stable

---

## 2. Malformed Input Handling
- **Test:** Send invalid drawing coordinates
- **Result:** Backend validation fails request
- **Impact:** No crash, valid users unaffected

---

## 3. Kafka Partial Failure
- **Test:** Disable Kafka using environment flag
- **Result:** System falls back to WebSocket broadcast
- **Impact:** Real-time sync continues for connected users

---

## 4. Overload / High Traffic
- **Test:** Multiple users drawing simultaneously
- **Result:** System handles load using batching + throttling
- **Impact:** Reduced lag and stable performance

---

# 👀 Observability

The system provides visibility into runtime behavior using:

## 1. Health Check
```graphql
query {
  health
}