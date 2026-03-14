import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gql, useMutation, useQuery, useSubscription } from '@apollo/client';
import WhiteboardCanvas from '../components/whiteboard/WhiteboardCanvas';
import LogoutButton from '../components/system/LogoutButton';

const JOIN_ROOM = gql`
  mutation JoinRoom($roomId: ID!, $userName: String!, $clientId: ID!) {
    joinRoom(roomId: $roomId, userName: $userName, clientId: $clientId) {
      userId
      clientId
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

const SEND_DRAWING_EVENT = gql`
  mutation SendDrawingEvent($input: DrawingEventInput!) {
    sendDrawingEvent(input: $input)
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

    const user = getStoredUser();

    const [joinRoom, { data: joinData, loading: joinLoading, error: joinError }] =
        useMutation(JOIN_ROOM);

    const [sendDrawingEvent] = useMutation(SEND_DRAWING_EVENT);
    const [drawingEvents, setDrawingEvents] = useState([]);

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
        data: subscriptionData,
        error: subscriptionError,
    } = useSubscription(DRAWING_UPDATES, {
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

    const connectionState = subscriptionError ? 'disconnected' : 'connected';

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Whiteboard Room</h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <p>Room ID: {roomId}</p>
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

                <WhiteboardCanvas
                    drawingEvents={drawingEvents}
                    onDraw={handleDraw}
                    onClear={handleClear}
                    connectionState={connectionState}
                />
            </main>
        </div>
    );
}
