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
  tool = "pencil",
  color = "#000000",
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const startPointRef = useRef(null);
  const lastSentRef = useRef(0);
  const lastCursorSentRef = useRef(0);
  const lastRenderedCountRef = useRef(0);

  const currentUserColor = useMemo(() => {
    return getUserColor(currentUser?.id);
  }, [currentUser]);

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

    const eventTool = event.tool || event.eventType || "pencil";
    const strokeColor =
      eventTool === "eraser"
        ? "#0b0b12"
        : parsed.color || event.color || "#000000";

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = eventTool === "eraser" ? 12 : 2;
    ctx.lineCap = "round";

    if (eventTool === "rectangle") {
      const width = parsed.end.x - parsed.start.x;
      const height = parsed.end.y - parsed.start.y;
      ctx.strokeRect(parsed.start.x, parsed.start.y, width, height);
      return;
    }

    if (eventTool === "circle") {
      const radius = Math.sqrt(
        Math.pow(parsed.end.x - parsed.start.x, 2) +
          Math.pow(parsed.end.y - parsed.start.y, 2)
      );
      ctx.beginPath();
      ctx.arc(parsed.start.x, parsed.start.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

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

  const getCanvasCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e) => {
    const start = getCanvasCoordinates(e);
    setIsDrawing(true);
    startPointRef.current = start;

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
      });
    }

    if (!isDrawing) return;

    if (tool === "rectangle" || tool === "circle") {
      redrawCanvas();

      drawSingleEvent({
        coordinates: {
          start: startPointRef.current,
          end: point,
        },
        color,
        tool,
      });

      return;
    }

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

    const localEvent = {
      coordinates: { start, end },
      color,
      tool,
    };

    drawSingleEvent(localEvent);
    onDraw(localEvent);
  };

  const handlePointerUp = (e) => {
    if (!isDrawing) return;

    const end = getCanvasCoordinates(e);

    if (tool === "rectangle" || tool === "circle") {
      const shapeEvent = {
        coordinates: {
          start: startPointRef.current,
          end,
        },
        color,
        tool,
      };

      redrawCanvas();
      drawSingleEvent(shapeEvent);
      onDraw(shapeEvent);
    }

    setIsDrawing(false);
    startPointRef.current = null;
  };

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setIsDrawing(false)}
      />

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
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: cursor.color || currentUserColor,
                  border: "2px solid white",
                }}
              />
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