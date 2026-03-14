import React, { useEffect, useRef, useState } from 'react';
import { formatDrawingEvent } from '../../utils/eventFormatter';

export default function WhiteboardCanvas({
  drawingEvents,
  onDraw,
  onClear,
  connectionState,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawingEvents.forEach((event) => {
      if (event?.eventType === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    });
  };

  useEffect(() => {
    redrawCanvas();
  }, [drawingEvents]);

  const handlePointerDown = (e) => {
    setIsDrawing(true);
    const rect = e.target.getBoundingClientRect();
    const start = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    canvasRef.current.dataset.lastX = start.x;
    canvasRef.current.dataset.lastY = start.y;
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const start = {
      x: Number(canvas.dataset.lastX),
      y: Number(canvas.dataset.lastY),
    };

    const end = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    canvas.dataset.lastX = end.x;
    canvas.dataset.lastY = end.y;

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

      <div className="whiteboard-canvas-shell">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="whiteboard-canvas-element"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </div>
  );
}