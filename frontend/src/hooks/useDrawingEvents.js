import { useEffect, useMemo, useState } from 'react';
import { useMutation, useSubscription } from '@apollo/client';
import { SEND_DRAWING_EVENT } from '../graphql/mutations/sendDrawingEvent';
import { DRAWING_UPDATES } from '../graphql/subscriptions/drawingUpdates';

export function useDrawingEvents({ roomId }) {
  const [drawingEvents, setDrawingEvents] = useState([]);
  const [connectionState, setConnectionState] = useState('connecting');

  const [sendDrawingEventMutation] = useMutation(SEND_DRAWING_EVENT);

  const subscriptionResult = useSubscription(DRAWING_UPDATES, {
    variables: { roomId },
    onSubscriptionData: ({ subscriptionData }) => {
      const payload = subscriptionData.data?.drawingUpdates;
      if (payload) {
        setDrawingEvents((prev) => [...prev, payload]);
      }
    },
    onError: () => {
      setConnectionState('error');
    },
  });

  useEffect(() => {
    if (subscriptionResult.loading) {
      setConnectionState('connecting');
    } else if (subscriptionResult.error) {
      setConnectionState('error');
    } else {
      setConnectionState('connected');
    }
  }, [subscriptionResult.loading, subscriptionResult.error]);

  const sendDrawingEvent = useMemo(() => {
    return async (event) => {
      try {
        await sendDrawingEventMutation({
          variables: {
            input: {
              ...event,
              roomId, // ✅ ONLY roomId (userId removed)
            },
          },
        });
      } catch (e) {
        console.error('Failed to send drawing event', e);
      }
    };
  }, [roomId, sendDrawingEventMutation]);

  return {
    drawingEvents,
    sendDrawingEvent,
    connectionState,
  };
}