import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatDrawingEvent } from "../../utils/eventFormatter";

function getUserColor(userId) {
  const colors = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#ca8a04",
    "#9333ea",
    "#ea580c",
    "#0891b2",
    "#db2777",
  ];

  const id = String(userId || "");
  const index =
    id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    colors.length;

  return colors[index];
}

export default function WhiteboardCanvas({
  drawingEvents,
  onDraw,
  onCursorMove,
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

  /* ================= RESIZE ================= */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  /* ================= DRAW ================= */

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  const drawSingleEvent = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const parsed = formatDrawingEvent(event);

    if (!parsed?.start || !parsed?.end) return;

    ctx.strokeStyle = parsed.color || "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(parsed.start.x, parsed.start.y);
    ctx.lineTo(parsed.end.x, parsed.end.y);
    ctx.stroke();
  };

  const redrawCanvas = () => {
    clearCanvas();
    drawingEvents.forEach(drawSingleEvent);
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
      drawSingleEvent(drawingEvents[drawingEvents.length - 1]);
      lastRenderedCountRef.current = drawingEvents.length;
      return;
    }

    redrawCanvas();
  }, [drawingEvents]);

  /* ================= POINTER ================= */

  const getCanvasCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
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

    /* 🔥 SEND CURSOR */
    if (now - lastCursorSentRef.current >= 30) {
      lastCursorSentRef.current = now;

      onCursorMove?.({
        x: point.x,
        y: point.y,
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
      coordinates: { start, end },
      color: "#000",
    });

    onDraw({
      coordinates: { start, end },
      color: "#000",
    });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  /* ================= UI ================= */

  return (
    <div className="w-full h-full relative">

      {/* 🎨 CANVAS */}
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* 👥 CURSORS */}
      <div className="absolute inset-0 pointer-events-none">
        {Object.values(cursors).map((cursor) => (
          <div
            key={cursor.userId}
            style={{
              position: "absolute",
              left: cursor.x,
              top: cursor.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="flex flex-col items-center">
              
              {/* DOT */}
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: cursor.color,
                  border: "2px solid white",
                }}
              />

              {/* NAME */}
              <span
                style={{
                  fontSize: "10px",
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  padding: "2px 4px",
                  borderRadius: "4px",
                  marginTop: "2px",
                  whiteSpace: "nowrap",
                }}
              >
                {cursor.displayName}
              </span>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}