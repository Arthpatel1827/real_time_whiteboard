import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDrawingEvent } from '../../utils/eventFormatter';

function getUserColor(userId) {
  const colors = [
    '#2563eb',
    '#dc2626',
    '#16a34a',
    '#ca8a04',
    '#9333ea',
    '#ea580c',
    '#0891b2',
    '#db2777',
  ];

  const id = String(userId || '');
  const index =
    id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;

  return colors[index];
}

export default function WhiteboardCanvas({
  drawingEvents,
  onDraw,
  onClear,
  onCursorMove,
  connectionState,
  cursors = {},
  currentUser,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastSentRef = useRef(0);
  const lastCursorSentRef = useRef(0);
  const lastRenderedCountRef = useRef(0);

  const currentUserColor = useMemo(() => {
    return getUserColor(currentUser?.id);
  }, [currentUser]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const drawSingleEvent = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (event?.eventType === 'clear') {
      clearCanvas();
      return;
    }

    const parsed = formatDrawingEvent(event);
    if (!parsed?.start || !parsed?.end) return;

    ctx.strokeStyle = parsed.color || '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(parsed.start.x, parsed.start.y);
    ctx.lineTo(parsed.end.x, parsed.end.y);
    ctx.stroke();
  };

  const redrawCanvas = () => {
    clearCanvas();
    drawingEvents.forEach((event) => {
      drawSingleEvent(event);
    });
    lastRenderedCountRef.current = drawingEvents.length;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    if (drawingEvents.length === 0) {
      clearCanvas();
      lastRenderedCountRef.current = 0;
      return;
    }

    if (drawingEvents.length === lastRenderedCountRef.current + 1) {
      const latestEvent = drawingEvents[drawingEvents.length - 1];
      drawSingleEvent(latestEvent);
      lastRenderedCountRef.current = drawingEvents.length;
      return;
    }

    redrawCanvas();
  }, [drawingEvents]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e) => {
    setIsDrawing(true);

    const start = getCanvasCoordinates(e);
    canvasRef.current.dataset.lastX = start.x;
    canvasRef.current.dataset.lastY = start.y;
  };

  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getCanvasCoordinates(e);

    const now = Date.now();
    if (now - lastCursorSentRef.current >= 30) {
      lastCursorSentRef.current = now;

      onCursorMove?.({
        x: point.x,
        y: point.y,
        color: currentUserColor,
      });
    }

    if (!isDrawing) return;

    if (now - lastSentRef.current < 20) return;
    lastSentRef.current = now;

    const start = {
      x: Number(canvas.dataset.lastX),
      y: Number(canvas.dataset.lastY),
    };

    const end = {
      x: point.x,
      y: point.y,
    };

    canvas.dataset.lastX = end.x;
    canvas.dataset.lastY = end.y;

    drawSingleEvent({
      eventType: 'stroke',
      coordinates: { start, end },
      color: '#000000',
      timestamp: new Date().toISOString(),
    });

    onDraw({
      eventType: 'stroke',
      coordinates: { start, end },
      color: '#000000',
      timestamp: new Date().toISOString(),
    });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  return (
    <div className="whiteboard-wrapper">
      <div className="whiteboard-toolbar">
        <button onClick={onClear}>Clear Board</button>
        <div className="connection-status">Connection: {connectionState}</div>
      </div>

      <div
        className="whiteboard-canvas-shell"
        style={{
          position: 'relative',
          border: '2px solid #d1d5db',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="whiteboard-canvas-element"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '960px',
            background: '#ffffff',
            touchAction: 'none',
            cursor: 'crosshair',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          {Object.values(cursors).map((cursor) => (
            <div
              key={cursor.userId}
              style={{
                position: 'absolute',
                left: cursor.x,
                top: cursor.y,
                transform: 'translate(-2px, -2px)',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: cursor.color || '#000000',
                  border: '2px solid #ffffff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                }}
              />
              <div
                style={{
                  marginTop: '4px',
                  display: 'inline-block',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  background: cursor.color || '#000000',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {cursor.displayName || `User ${cursor.userId}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}