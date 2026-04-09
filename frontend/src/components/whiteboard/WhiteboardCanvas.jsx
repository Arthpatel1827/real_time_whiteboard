import React, { useEffect, useRef, useState } from "react";
import { formatDrawingEvent } from "../../utils/eventFormatter";

console.log("🔥 CANVAS FILE LOADED");
export default function WhiteboardCanvas({
  drawingEvents,
  onDraw,
  onCursorMove,
  cursors = {},
  currentUser,
  tool,
  color,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const startPointRef = useRef(null);
  const lastSentRef = useRef(0);
  const lastCursorSentRef = useRef(0);

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

    // 🔥 ERASER FIX
    if (parsed.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = parsed.color || "#000";
      ctx.lineWidth = 2;
    }

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
  };

  useEffect(() => {
    if (!canvasRef.current) return;
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
    console.log("TOOL:", tool); 
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getCanvasCoordinates(e);
    const now = Date.now();

    /* CURSOR */
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

    const event = {
      coordinates: { start, end },
      color,
      tool, // 🔥 IMPORTANT
    };

    // LOCAL DRAW
    drawSingleEvent(event);

    // SEND TO SERVER
    onDraw(event);
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
                  background: cursor.color || "#fff",
                  border: "2px solid white",
                }}
              />

              <span
                style={{
                  fontSize: "10px",
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  marginTop: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                {cursor.displayName || "User"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}