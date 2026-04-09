# 🧠 Real-Time Collaborative Whiteboard (Distributed System)

A **real-time distributed whiteboard system** that enables multiple users to collaboratively draw with low latency, strong consistency, and fault tolerance. The system is built using an **event-driven architecture** with real-time synchronization, failure handling, and observability.

---

# 🚀 Tech Stack

## Frontend

* React.js
* Apollo Client
* TailwindCSS

## Backend

* Flask + Ariadne (GraphQL)
* WebSockets (GraphQL Subscriptions)
* Kafka (event streaming)

## Database

* PostgreSQL

## Infrastructure

* Docker & Docker Compose

---

# 🏗️ System Architecture

The system follows a **distributed event-driven architecture**:

```
Client → GraphQL API → Kafka → WebSocket Broadcast → Clients
```

---

## 🔄 End-to-End Flow

1. User draws on canvas
2. Frontend batches stroke points (performance optimization)
3. GraphQL mutation sends batched data to backend
4. Backend validates request and authenticates user (JWT)
5. Stroke data is stored in PostgreSQL
6. Event is published to Kafka topic
7. Kafka consumer processes event
8. Backend broadcasts update via WebSocket subscriptions
9. All connected clients receive and render updates

---

# 🧩 Component Design

## 🟢 Client (React)

* Handles user interaction (drawing, tools)
* Performs **local rendering (optimistic updates)**
* Uses **Apollo Client** for GraphQL communication

---

## 🟣 Backend (Flask GraphQL Server)

* Entry point for all requests
* Handles:

  * GraphQL queries, mutations, subscriptions
  * JWT authentication
  * input validation
  * rate limiting

---

## 🔴 Kafka (Streaming Layer)

* Acts as a **message broker**
* Decouples producers (backend) and consumers (broadcast system)
* Topics:

  * `whiteboard.strokes`
  * `whiteboard.presence`

---

## 🟡 PostgreSQL (Data Layer)

* Stores:

  * room data
  * stroke history
  * user presence

---

## 🔵 WebSocket Broadcaster

* Sends real-time updates to all clients
* Ensures synchronization across users

---

# 🔗 Communication Model

| Component          | Communication Type         |
| ------------------ | -------------------------- |
| Client → Backend   | GraphQL (HTTP)             |
| Backend → Client   | WebSockets (Subscriptions) |
| Backend → Kafka    | Event Streaming            |
| Kafka → Backend    | Consumer-based messaging   |
| Backend → Database | SQL                        |

---

# ⚡ Concurrency Model

The system uses an **event-driven asynchronous model**:

* Multiple users draw simultaneously (concurrent input)
* Backend processes events asynchronously
* Kafka enables parallel event streaming
* WebSocket broadcasting supports real-time fan-out

---

# 🔐 Security & Trust Model

## Security Features

* JWT-based authentication
* Input validation (coordinates, roomId)
* Rate limiting (prevents abuse)

## Trust Boundaries

* **Client → Backend:** Untrusted input (validated)
* **Backend → Kafka:** Trusted internal communication
* **Backend → Database:** Secure internal access

---

# 🎯 Features

* 🎨 Multi-user real-time drawing
* 🧑‍🤝‍🧑 Live presence tracking
* 🖱️ Cursor sharing
* 🔄 GraphQL subscriptions
* ⚡ Optimized drawing (batching + throttling)
* 🧾 Persistent drawing history
* 🔐 Secure authentication

---

# ⚡ Performance Optimization

* Stroke batching (~80% reduction in network calls)
* Throttling of draw events
* Incremental canvas rendering
* Local rendering before server sync

---

# 🧪 Failure & Resilience Scenarios

## 1. Unauthorized Requests

* Missing/invalid JWT
* Request rejected
* System remains stable

---

## 2. Malformed Input

* Invalid coordinates or payload
* Validation error returned
* No system crash

---

## 3. Kafka Partial Failure

* Kafka disabled using environment flag
* System falls back to WebSocket broadcast
* Real-time sync continues

---

## 4. High Load / Overload

* Multiple users drawing simultaneously
* Rate limiting + batching applied
* System remains responsive

---

# 👀 Observability

## Implemented Features

* Logging (backend events, errors)
* Health check endpoint:

```graphql
query {
  health
}
```

* System state monitoring:

```graphql
query {
  systemState
}
```

---

# 📊 Evaluation

## Test Results

| Scenario      | Result                          |
| ------------- | ------------------------------- |
| 1 user        | Smooth                          |
| 2 users       | Real-time                       |
| 3 users       | Minor lag (due to event volume) |
| Kafka failure | System continues working        |

## Key Insight

* Stroke batching significantly reduces latency and network load
* Performance depends on frontend rendering and event frequency

---

# ⚖️ Trade-offs

* Kafka improves scalability but adds latency
* GraphQL provides flexibility but adds overhead for high-frequency updates
* Batching reduces network load but introduces slight delay
* Real-time consistency vs performance trade-off

---

# ▶️ How to Run

## Prerequisites

* Docker & Docker Compose
* Node.js (if running frontend manually)
* Python 3.10+

---

## 1. Clone Repository

```bash
git clone https://github.com/Arthpatel1827/real_time_whiteboard.git
cd whiteboard-project
```

---

## 2. Run Using Docker

```bash
docker-compose up --build
```

---

## 3. Services Started

* Frontend → [http://localhost:3000](http://localhost:3000)
* Backend → [http://localhost:5000/graphql](http://localhost:5000/graphql)
* Kafka
* PostgreSQL

---

## 4. Test Application

* Open multiple browser tabs
* Join same room
* Start drawing simultaneously

---

## 5. Run Without Docker (Optional)

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

# 🧠 Why This is a Distributed System

* Multiple independent components (client, backend, Kafka, database)
* Network-based communication
* Event-driven architecture
* Real-time synchronization across users

---

# 🧩 Key Achievements

* Real-time collaboration with low latency
* Event-driven scalable architecture
* Strong failure handling and resilience
* Observability and monitoring
* Secure and production-oriented design

---

# 📌 One-Line Summary

👉 A scalable, event-driven distributed whiteboard system with real-time synchronization, performance optimization, and fault tolerance.

---
