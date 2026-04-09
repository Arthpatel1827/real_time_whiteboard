export function formatDrawingEvent(event) {
  if (!event) return null;

  const coordinates = event.coordinates || {};
  const color = event.color || "#000";
  const eventType = event.eventType || event.tool || "pencil";

  if (Array.isArray(coordinates.points) && coordinates.points.length >= 2) {
    return {
      points: coordinates.points,
      color,
      eventType,
    };
  }

  if (coordinates.start && coordinates.end) {
    return {
      start: coordinates.start,
      end: coordinates.end,
      color,
      eventType,
    };
  }

  return null;
}