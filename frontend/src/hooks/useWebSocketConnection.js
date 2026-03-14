import { useEffect, useState } from 'react';

// Placeholder hook for WebSocket connection state; the primary connection for subscriptions is managed by Apollo.
export function useWebSocketConnection(url) {
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    if (!url) return;

    const ws = new WebSocket(url);

    ws.addEventListener('open', () => setStatus('connected'));
    ws.addEventListener('close', () => setStatus('disconnected'));
    ws.addEventListener('error', () => setStatus('error'));

    return () => {
      ws.close();
    };
  }, [url]);

  return { status };
}
