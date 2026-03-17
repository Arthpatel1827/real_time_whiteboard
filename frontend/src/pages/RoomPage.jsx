import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gql, useMutation, useQuery, useSubscription } from '@apollo/client';
import WhiteboardCanvas from '../components/whiteboard/WhiteboardCanvas';
import LogoutButton from '../components/system/LogoutButton';

const JOIN_ROOM = gql`
  mutation JoinRoom($roomId: ID!, $userName: String!, $clientId: ID!) {
    joinRoom(roomId: $roomId, userName: $userName, clientId: $clientId) {
      type
      roomId
      userId
      clientId
      displayName
      color
      online
      lastSeen
    }
  }
`;

const LEAVE_ROOM = gql`
  mutation LeaveRoom($roomId: ID!, $clientId: ID!) {
    leaveRoom(roomId: $roomId, clientId: $clientId) {
      type
      roomId
      userId
      clientId
      displayName
      color
      online
      lastSeen
    }
  }
`;

const BOARD_HISTORY = gql`
  query BoardHistory($roomId: ID!) {
    boardHistory(roomId: $roomId) {
      id
      roomId
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
      type
      roomId
      userId
      clientId
      displayName
      color
      online
      lastSeen
    }
  }
`;

const DRAWING_UPDATES = gql`
  subscription DrawingUpdates($roomId: ID!) {
    drawingUpdates(roomId: $roomId) {
      id
      roomId
      userId
      eventType
      coordinates
      color
      timestamp
    }
  }
`;

const PRESENCE_UPDATES = gql`
  subscription PresenceUpdates($roomId: ID!) {
    presenceUpdates(roomId: $roomId) {
      type
      roomId
      userId
      clientId
      displayName
      color
      online
      lastSeen
    }
  }
`;

const CURSOR_UPDATES = gql`
  subscription CursorUpdates($roomId: ID!) {
    cursorUpdates(roomId: $roomId) {
      type
      roomId
      userId
      displayName
      color
      x
      y
      timestamp
    }
  }
`;

const SEND_DRAWING_EVENT = gql`
  mutation SendDrawingEvent($input: DrawingEventInput!) {
    sendDrawingEvent(input: $input)
  }
`;

const SEND_CURSOR_EVENT = gql`
  mutation SendCursorEvent($roomId: ID!, $userId: ID!, $displayName: String!, $color: String!, $x: JSON!, $y: JSON!) {
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

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('whiteboard_user') || 'null');
  } catch {
    return null;
  }
}

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const joinedRef = useRef(false);
  const leftRef = useRef(false);

  const user = getStoredUser();

  const [joinRoom, { data: joinData, loading: joinLoading, error: joinError }] =
    useMutation(JOIN_ROOM);

  const [leaveRoom] = useMutation(LEAVE_ROOM);
  const [sendDrawingEvent] = useMutation(SEND_DRAWING_EVENT);
  const [sendCursorEvent] = useMutation(SEND_CURSOR_EVENT);

  const [drawingEvents, setDrawingEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [cursors, setCursors] = useState({});

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
  } = useQuery(BOARD_HISTORY, {
    variables: { roomId },
    fetchPolicy: 'network-only',
    skip: !user,
  });

  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsersInRoom,
  } = useQuery(USERS_IN_ROOM, {
    variables: { roomId },
    fetchPolicy: 'network-only',
    skip: !user,
  });

  const {
    data: subscriptionData,
    error: subscriptionError,
  } = useSubscription(DRAWING_UPDATES, {
    variables: { roomId },
    skip: !user,
  });

  const { data: presenceData, error: presenceError } = useSubscription(PRESENCE_UPDATES, {
    variables: { roomId },
    skip: !user,
  });

  const { data: cursorData, error: cursorError } = useSubscription(CURSOR_UPDATES, {
    variables: { roomId },
    skip: !user,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
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
    }).catch((err) => {
      console.error('Join room failed:', err);
    });
  }, [roomId, joinRoom, navigate, user]);

  useEffect(() => {
    const history = historyData?.boardHistory;
    if (!history) return;

    setDrawingEvents(history);
  }, [historyData]);

  useEffect(() => {
    const usersInRoom = usersData?.usersInRoom;
    if (!usersInRoom) return;

    setParticipants((prev) => {
      const merged = new Map();

      prev.forEach((participant) => {
        merged.set(String(participant.userId), participant);
      });

      usersInRoom.forEach((participant) => {
        if (participant.online) {
          merged.set(String(participant.userId), participant);
        }
      });

      return Array.from(merged.values()).filter((participant) => participant.online);
    });
  }, [usersData]);

  useEffect(() => {
    const newEvent = subscriptionData?.drawingUpdates;
    if (!newEvent) return;

    setDrawingEvents((prev) => {
      if (newEvent.eventType === 'clear') {
        return [];
      }

      const alreadyExists = prev.some((event) => event.id === newEvent.id);
      if (alreadyExists) return prev;

      return [...prev, newEvent];
    });
  }, [subscriptionData]);

  useEffect(() => {
    const joinedUser = joinData?.joinRoom;
    if (!joinedUser) return;

    const joinedUserId = String(joinedUser.userId);

    setParticipants((prev) => {
      const exists = prev.some(
        (participant) => String(participant.userId) === joinedUserId
      );

      if (exists) {
        return prev.map((participant) =>
          String(participant.userId) === joinedUserId ? joinedUser : participant
        );
      }

      return [...prev, joinedUser];
    });

    refetchUsersInRoom?.().catch((err) => {
      console.error('Failed to refetch users in room:', err);
    });
  }, [joinData, refetchUsersInRoom]);

  useEffect(() => {
    const presenceEvent = presenceData?.presenceUpdates;
    if (!presenceEvent) return;

    const incomingUserId = String(presenceEvent.userId);

    setParticipants((prev) => {
      if (presenceEvent.online) {
        const exists = prev.some(
          (participant) => String(participant.userId) === incomingUserId
        );

        if (exists) {
          return prev.map((participant) =>
            String(participant.userId) === incomingUserId
              ? { ...participant, ...presenceEvent }
              : participant
          );
        }

        return [...prev, presenceEvent];
      }

      return prev.filter(
        (participant) => String(participant.userId) !== incomingUserId
      );
    });

    if (!presenceEvent.online) {
      setCursors((prev) => {
        const updated = { ...prev };
        delete updated[incomingUserId];
        return updated;
      });
    }
  }, [presenceData]);

  useEffect(() => {
    const cursorEvent = cursorData?.cursorUpdates;
    if (!cursorEvent) return;

    if (String(cursorEvent.userId) === String(user?.id)) return;

    setCursors((prev) => ({
      ...prev,
      [String(cursorEvent.userId)]: cursorEvent,
    }));
  }, [cursorData, user]);

  useEffect(() => {
    if (!user || !roomId) return;

    const clientId = String(user.id);

    const notifyLeave = async () => {
      if (leftRef.current) return;
      leftRef.current = true;

      try {
        await leaveRoom({
          variables: {
            roomId,
            clientId,
          },
        });

        setParticipants((prev) =>
          prev.filter((participant) => String(participant.userId) !== clientId)
        );

        setCursors((prev) => {
          const updated = { ...prev };
          delete updated[clientId];
          return updated;
        });
      } catch (err) {
        console.error('Leave room failed:', err);
      }
    };

    const handleBeforeUnload = () => {
      const graphqlUrl = `${window.location.origin.replace(/\/$/, '')}/graphql/`;

      const body = JSON.stringify({
        query: `
          mutation LeaveRoom($roomId: ID!, $clientId: ID!) {
            leaveRoom(roomId: $roomId, clientId: $clientId) {
              userId
              online
            }
          }
        `,
        variables: {
          roomId,
          clientId,
        },
      });

      try {
        navigator.sendBeacon?.(
          graphqlUrl,
          new Blob([body], { type: 'application/json' })
        );
      } catch {
        // fallback skipped
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      notifyLeave();
    };
  }, [leaveRoom, roomId, user]);

  const handleDraw = async (event) => {
    try {
      await sendDrawingEvent({
        variables: {
          input: {
            roomId,
            eventType: event.eventType,
            coordinates: event.coordinates,
            color: event.color || '#000000',
            timestamp: event.timestamp || new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      console.error('Failed to send drawing event:', err);
    }
  };

  const handleClear = async () => {
    try {
      setDrawingEvents([]);
      await sendDrawingEvent({
        variables: {
          input: {
            roomId,
            eventType: 'clear',
            coordinates: {},
            color: '#000000',
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      console.error('Failed to clear board:', err);
    }
  };

  const handleCursorMove = async ({ x, y, color }) => {
    if (!user) return;

    try {
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
    } catch (err) {
      console.error('Failed to send cursor event:', err);
    }
  };

  const connectionState =
    subscriptionError || presenceError || cursorError ? 'disconnected' : 'connected';

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Whiteboard Room</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <p>Room ID: {roomId}</p>
          <p>Participants: {participants.length}</p>
          <Link to="/">← Back</Link>
          <LogoutButton />
        </div>
      </header>

      <main>
        {joinLoading && <p>Joining room...</p>}
        {joinError && <p>Failed to join room.</p>}
        {joinData && <p>Joined successfully.</p>}

        {historyLoading && <p>Loading board history...</p>}
        {historyError && <p>Failed to load board history.</p>}

        {usersLoading && <p>Loading active users...</p>}
        {usersError && <p>Failed to load active users.</p>}

        <div style={{ marginBottom: '12px' }}>
          <strong>Active users:</strong>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              marginTop: '8px',
            }}
          >
            {participants.map((participant) => (
              <div
                key={String(participant.userId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '999px',
                  background: '#ffffff',
                }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: participant.color || '#000000',
                    display: 'inline-block',
                  }}
                />
                <span>
                  {String(participant.userId) === String(user?.id)
                    ? `${participant.displayName || 'You'} (You)`
                    : participant.displayName || `User ${participant.userId}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <WhiteboardCanvas
          drawingEvents={drawingEvents}
          onDraw={handleDraw}
          onClear={handleClear}
          onCursorMove={handleCursorMove}
          connectionState={connectionState}
          cursors={cursors}
          currentUser={user}
        />
      </main>
    </div>
  );
}