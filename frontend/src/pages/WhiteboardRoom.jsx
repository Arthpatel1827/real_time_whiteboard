import React, { useEffect, useState } from "react";
import { useQuery, useSubscription, useMutation, gql } from "@apollo/client";
import WhiteboardCanvas from "../components/whiteboard/WhiteboardCanvas.jsx";
import Toolbar from "../components/whiteboard/Toolbar";
import { useDrawingEvents } from "../hooks/useDrawingEvents";
import { getCurrentUser } from "../auth/authStorage";

/* ================= GRAPHQL ================= */

const GET_ROOM = gql`
  query GetRoom($roomId: ID!) {
    room(roomId: $roomId) {
      id
      name
    }
  }
`;

const USERS_IN_ROOM = gql`
  query UsersInRoom($roomId: ID!) {
    usersInRoom(roomId: $roomId) {
      userId
      displayName
      color
      online
    }
  }
`;

const CURSOR_UPDATES = gql`
  subscription CursorUpdates($roomId: ID!) {
    cursorUpdates(roomId: $roomId) {
      userId
      displayName
      color
      x
      y
    }
  }
`;

const SEND_CURSOR_EVENT = gql`
  mutation SendCursorEvent(
    $roomId: ID!
    $userId: ID!
    $displayName: String!
    $color: String!
    $x: JSON!
    $y: JSON!
  ) {
    sendCursorEvent(
      roomId: $roomId
      userId: $userId
      displayName: $displayName
      color: $color
      x: $x
      y: $y
    )
  }
`;

/* ================= COMPONENT ================= */

export default function WhiteboardRoom({ roomId, onLeave }) {
  const user = getCurrentUser();
  const userId = user?.id;

  const [color, setColor] = useState("#3b82f6");

  // ✅ ADD TOOL STATE (FIX)
  const [tool, setTool] = useState("pencil");

  const [cursors, setCursors] = useState({});

  /* ================= QUERIES ================= */

  const { data: roomData, loading } = useQuery(GET_ROOM, {
    variables: { roomId },
  });

  const { data: usersData } = useQuery(USERS_IN_ROOM, {
    variables: { roomId },
  });

  const users = usersData?.usersInRoom || [];

  /* ================= DRAWING ================= */

  const {
    drawingEvents,
    sendDrawingEvent,
    connectionState,
  } = useDrawingEvents({
    roomId,
    userId,
  });

  /* ================= CURSORS ================= */

  const [sendCursorEvent] = useMutation(SEND_CURSOR_EVENT);

  const { data: cursorData } = useSubscription(CURSOR_UPDATES, {
    variables: { roomId },
  });

  useEffect(() => {
    const c = cursorData?.cursorUpdates;
    if (!c) return;

    setCursors((prev) => ({
      ...prev,
      [c.userId]: c,
    }));
  }, [cursorData]);

  const handleCursorMove = ({ x, y }) => {
    if (!user) return;

    sendCursorEvent({
      variables: {
        roomId,
        userId: String(userId),
        displayName: user.displayName,
        color,
        x,
        y,
      },
    });
  };

  const roomName = roomData?.room?.name || `Room ${roomId}`;

  /* ================= UI ================= */

  return (
    <div className="h-screen bg-[#0b0b12] text-white overflow-hidden">

      {/* 🔝 TOP BAR */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-[90%] max-w-6xl px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">

        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg">
            {loading ? "Loading..." : roomName}
          </h1>

          <div className="flex items-center gap-3">
            {users.map((u) => (
              <div key={u.userId} className="flex items-center gap-1 text-sm">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: u.color }}
                />
                <span>{u.displayName}</span>
              </div>
            ))}
          </div>

          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === "connected"
                ? "bg-green-400"
                : "bg-red-400"
            }`}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => sendDrawingEvent({ eventType: "clear" })}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-medium hover:scale-105 transition"
          >
            Clear
          </button>

          <button
            onClick={onLeave}
            className="px-4 py-2 bg-red-500 rounded-lg text-sm hover:scale-105 transition"
          >
            Leave
          </button>
        </div>
      </div>

      {/* 🛠 TOOLBAR */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50">
        <div className="flex flex-col items-center gap-4 p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
          <Toolbar
            color={color}
            onColorChange={setColor}
            tool={tool}                 // ✅ FIX
            onToolChange={setTool}      // ✅ FIX
            onLeave={onLeave}
          />
        </div>
      </div>

      {/* 🎨 CANVAS */}
      <div className="w-full h-full relative">

        <div className="absolute inset-0 bg-[radial-gradient(circle,#1a1a2e_1px,transparent_1px)] bg-[size:22px_22px] opacity-30" />

        <WhiteboardCanvas
          drawingEvents={drawingEvents}
          onDraw={(event) =>
            sendDrawingEvent({ ...event, color, tool }) // ✅ tool added
          }
          onCursorMove={handleCursorMove}
          cursors={cursors}
          currentUser={user}   // ✅ FIX FOR CURSOR NAME
          tool={tool}          // ✅ FIX FOR DRAWING LOGIC
          color={color}
        />

      </div>
    </div>
  );
}