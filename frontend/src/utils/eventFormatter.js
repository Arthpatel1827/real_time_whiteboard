export function formatDrawingEvent(event) {
  const {
    coordinates = {},
    color,
    eventType,
    tool, // ✅ ADD THIS
  } = event;

  return {
    start: coordinates.start || { x: 0, y: 0 },
    end: coordinates.end || { x: 0, y: 0 },
    color: color || "#000",
    eventType,
    tool: tool || "pencil", // ✅ CRITICAL FIX
  };
}