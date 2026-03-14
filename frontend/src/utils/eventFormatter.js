export function formatDrawingEvent(event) {
  // Convert backend event to client-friendly format.
  const { coordinates = {}, color, eventType } = event;
  return {
    start: coordinates.start || { x: 0, y: 0 },
    end: coordinates.end || { x: 0, y: 0 },
    color: color || '#000',
    eventType,
  };
}
