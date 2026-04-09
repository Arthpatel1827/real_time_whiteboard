import React, { useEffect, useMemo, useRef } from "react";
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

function drawPath(ctx, points, strokeColor) {
  if (!ctx || !Array.isArray(points) || points.length < 2) return;

  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
}

function drawEventOnContext(ctx, event) {
  if (!ctx || !event) return;

  const parsed = formatDrawingEvent(event);
  if (!parsed) return;

  const eventTool = event.tool || event.eventType || "pencil";
  const strokeColor = parsed.color || event.color || "#000000";

  if (eventTool === "pencil" && parsed.points?.length >= 2) {
    drawPath(ctx, parsed.points, strokeColor);
    return;
  }

  if (!parsed.start || !parsed.end) return;

  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

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
  const committedCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const isDrawingRef = useRef(false);
  const startPointRef = useRef(null);
  const lastPointRef = useRef(null);
  const lastCursorSentRef = useRef(0);
  const lastRenderedCountRef = useRef(0);
  const previewFrameRef = useRef(null);
  const previewEventRef = useRef(null);

  const strokeBufferRef = useRef([]);
  const lastStrokeFlushAtRef = useRef(0);
  const STROKE_FLUSH_MS = 80;

  const currentUserColor = useMemo(() => {
    return getUserColor(currentUser?.id);
  }, [currentUser]);

  const clearContext = (ctx) => {
    if (!ctx?.canvas) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const getCommittedContext = () => {
    const canvas = committedCanvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  };

  const getPreviewContext = () => {
    const canvas = previewCanvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  };

  const clearPreviewCanvas = () => {
    clearContext(getPreviewContext());
  };

  const redrawCommittedCanvas = () => {
    const ctx = getCommittedContext();
    if (!ctx) return;

    clearContext(ctx);
    drawingEvents.forEach((event) => drawEventOnContext(ctx, event));
    lastRenderedCountRef.current = drawingEvents.length;
  };

  const syncCanvasSize = () => {
    const container = committedCanvasRef.current?.parentElement;
    const committedCanvas = committedCanvasRef.current;
    const previewCanvas = previewCanvasRef.current;

    if (!container || !committedCanvas || !previewCanvas) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    if (
      committedCanvas.width !== width ||
      committedCanvas.height !== height ||
      previewCanvas.width !== width ||
      previewCanvas.height !== height
    ) {
      committedCanvas.width = width;
      committedCanvas.height = height;
      previewCanvas.width = width;
      previewCanvas.height = height;

      redrawCommittedCanvas();
      clearPreviewCanvas();
    }
  };

  useEffect(() => {
    syncCanvasSize();

    const handleResize = () => {
      syncCanvasSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const committedCtx = getCommittedContext();
    if (!committedCtx) return;

    if (drawingEvents.length === 0) {
      clearContext(committedCtx);
      clearPreviewCanvas();
      lastRenderedCountRef.current = 0;
      return;
    }

    if (drawingEvents.length < lastRenderedCountRef.current) {
      redrawCommittedCanvas();
      return;
    }

    if (drawingEvents.length === lastRenderedCountRef.current) {
      return;
    }

    const newEvents = drawingEvents.slice(lastRenderedCountRef.current);
    newEvents.forEach((event) => drawEventOnContext(committedCtx, event));
    lastRenderedCountRef.current = drawingEvents.length;
  }, [drawingEvents]);

  const getCanvasCoordinates = (e) => {
    const rect = committedCanvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const renderPreview = () => {
    previewFrameRef.current = null;

    const ctx = getPreviewContext();
    if (!ctx) return;

    clearContext(ctx);

    if (previewEventRef.current) {
      drawEventOnContext(ctx, previewEventRef.current);
    }
  };

  const schedulePreviewRender = () => {
    if (previewFrameRef.current) return;
    previewFrameRef.current = requestAnimationFrame(renderPreview);
  };

  const flushStrokeBuffer = () => {
    if (strokeBufferRef.current.length < 2) return;

    onDraw?.({
      tool: "pencil",
      color,
      coordinates: {
        points: [...strokeBufferRef.current],
      },
    });

    const lastPoint = strokeBufferRef.current[strokeBufferRef.current.length - 1];
    strokeBufferRef.current = lastPoint ? [lastPoint] : [];
  };

  const handlePointerDown = (e) => {
    const start = getCanvasCoordinates(e);
    isDrawingRef.current = true;
    startPointRef.current = start;
    lastPointRef.current = start;

    if (tool === "pencil") {
      strokeBufferRef.current = [start];
      lastStrokeFlushAtRef.current = performance.now();
    }
  };

  const handlePointerMove = (e) => {
    const point = getCanvasCoordinates(e);
    const now = performance.now();

    if (now - lastCursorSentRef.current >= 90) {
      lastCursorSentRef.current = now;
      onCursorMove?.({ x: point.x, y: point.y });
    }

    if (!isDrawingRef.current) return;

    if (tool === "rectangle" || tool === "circle") {
      previewEventRef.current = {
        coordinates: {
          start: startPointRef.current,
          end: point,
        },
        color,
        tool,
      };

      schedulePreviewRender();
      return;
    }

    if (tool === "pencil") {
      const committedCtx = getCommittedContext();
      if (!committedCtx || !lastPointRef.current) return;

      drawPath(committedCtx, [lastPointRef.current, point], color);

      strokeBufferRef.current.push(point);
      lastPointRef.current = point;

      if (now - lastStrokeFlushAtRef.current >= STROKE_FLUSH_MS) {
        flushStrokeBuffer();
        lastStrokeFlushAtRef.current = now;
      }
    }
  };

  const handlePointerUp = (e) => {
    if (!isDrawingRef.current) return;

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

      const committedCtx = getCommittedContext();
      drawEventOnContext(committedCtx, shapeEvent);

      previewEventRef.current = null;
      clearPreviewCanvas();

      onDraw?.(shapeEvent);
    }

    if (tool === "pencil") {
      if (
        !lastPointRef.current ||
        lastPointRef.current.x !== end.x ||
        lastPointRef.current.y !== end.y
      ) {
        strokeBufferRef.current.push(end);
      }

      flushStrokeBuffer();
      strokeBufferRef.current = [];
    }

    isDrawingRef.current = false;
    startPointRef.current = null;
    lastPointRef.current = null;
    previewEventRef.current = null;
    clearPreviewCanvas();
  };

  const handlePointerLeave = () => {
    isDrawingRef.current = false;
    startPointRef.current = null;
    lastPointRef.current = null;
    previewEventRef.current = null;
    strokeBufferRef.current = [];
    clearPreviewCanvas();
  };

  useEffect(() => {
    return () => {
      if (previewFrameRef.current) {
        cancelAnimationFrame(previewFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={committedCanvasRef}
        className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />

      <canvas
        ref={previewCanvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      <div className="pointer-events-none absolute inset-0">
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