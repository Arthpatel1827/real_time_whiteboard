import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gql, useMutation, useQuery, useSubscription } from "@apollo/client";
import WhiteboardCanvas from "../components/whiteboard/WhiteboardCanvas";

/* ================= GRAPHQL ================= */

const JOIN_ROOM = gql`
  mutation JoinRoom($roomId: ID!, $userName: String!, $clientId: ID!) {
    joinRoom(roomId: $roomId, userName: $userName, clientId: $clientId) {
      userId
      displayName
      color
      online
    }
  }
`;

const LEAVE_ROOM = gql`
  mutation LeaveRoom($roomId: ID!, $clientId: ID!) {
    leaveRoom(roomId: $roomId, clientId: $clientId) {
      userId
      online
    }
  }
`;

const BOARD_HISTORY = gql`
  query BoardHistory($roomId: ID!) {
    boardHistory(roomId: $roomId) {
      id
      userId
      eventType
      coordinates
      color
      timestamp
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

const DRAWING_UPDATES = gql`
  subscription DrawingUpdates($roomId: ID!) {
    drawingUpdates(roomId: $roomId) {
      id
      userId
      eventType
      coordinates
      color
      timestamp
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

const SEND_DRAWING_EVENT = gql`
  mutation SendDrawingEvent($input: DrawingEventInput!) {
    sendDrawingEvent(input: $input)
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

/* ================= USER ================= */

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("whiteboard_user") || "null");
  } catch {
    return null;
  }
}

/* ================= MAIN ================= */

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const joinedRef = useRef(false);

  const user = getStoredUser();

  const [drawingEvents, setDrawingEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [cursors, setCursors] = useState({});
  const [color, setColor] = useState("#3b82f6");

  const [joinRoom] = useMutation(JOIN_ROOM);
  const [sendDrawingEvent] = useMutation(SEND_DRAWING_EVENT);
  const [sendCursorEvent] = useMutation(SEND_CURSOR_EVENT);

  const { data: historyData } = useQuery(BOARD_HISTORY, {
    variables: { roomId },
    skip: !user,
  });

  const { data: usersData } = useQuery(USERS_IN_ROOM, {
    variables: { roomId },
    skip: !user,
  });

  const { data: subscriptionData } = useSubscription(DRAWING_UPDATES, {
    variables: { roomId },
    skip: !user,
  });

  const { data: cursorData } = useSubscription(CURSOR_UPDATES, {
    variables: { roomId },
    skip: !user,
  });

  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (joinedRef.current) return;
    joinedRef.current = true;

    joinRoom({
      variables: {
        roomId,
        userName: user.displayName,
        clientId: String(user.id),
      },
    });
  }, [roomId, user]);

  useEffect(() => {
    if (historyData?.boardHistory) {
      setDrawingEvents(historyData.boardHistory);
    }
  }, [historyData]);

  useEffect(() => {
    const users = usersData?.usersInRoom;
    if (users) setParticipants(users);
  }, [usersData]);

  useEffect(() => {
    const event = subscriptionData?.drawingUpdates;
    if (!event) return;

    if (event.eventType === "clear") {
      setDrawingEvents([]);
    } else {
      setDrawingEvents((prev) => [...prev, event]);
    }
  }, [subscriptionData]);

  useEffect(() => {
    const cursorEvent = cursorData?.cursorUpdates;
    if (!cursorEvent) return;

    setCursors((prev) => ({
      ...prev,
      [cursorEvent.userId]: cursorEvent,
    }));
  }, [cursorData]);

  /* ================= HANDLERS ================= */

  const handleDraw = async (event) => {
    await sendDrawingEvent({
      variables: {
        input: {
          roomId,
          eventType: "stroke",
          coordinates: event.coordinates,
          color,
          timestamp: new Date().toISOString(),
        },
      },
    });
  };

  const handleClear = async () => {
    setDrawingEvents([]);

    await sendDrawingEvent({
      variables: {
        input: {
          roomId,
          eventType: "clear",
          coordinates: {},
          color,
          timestamp: new Date().toISOString(),
        },
      },
    });
  };

  const handleCursorMove = async ({ x, y }) => {
    if (!user) return;

    await sendCursorEvent({
      variables: {
        roomId,
        userId: String(user.id),
        displayName: user.displayName,
        color,
        x,
        y,
      },
    });
  };

  /* ================= UI ================= */

  return (
    <div className="h-screen bg-[#0b0b12] text-white overflow-hidden">

      {/* TOP BAR */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-[90%] max-w-6xl px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">

        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg">Room {roomId}</h1>
          <span className="text-sm text-gray-400">
            👥 {participants.length}
          </span>
          <span className="w-2 h-2 bg-green-400 rounded-full" />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:scale-105 transition"
          >
            Clear
          </button>

          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-red-500 rounded-lg hover:scale-105 transition"
          >
            Leave
          </button>
        </div>
      </div>

      {/* CANVAS */}
      <div className="w-full h-full relative">

        <div className="absolute inset-0 bg-[radial-gradient(circle,#1a1a2e_1px,transparent_1px)] bg-[size:22px_22px] opacity-30" />

        <WhiteboardCanvas
          drawingEvents={drawingEvents}
          onDraw={handleDraw}
          onCursorMove={handleCursorMove}
          cursors={cursors}
          currentUser={user}
        />

      </div>
    </div>
  );
}