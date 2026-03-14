export function clampCoordinate(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeCoordinates({ x, y }, canvas) {
  if (!canvas) return { x, y };
  const rect = canvas.getBoundingClientRect();
  return {
    x: clampCoordinate(x - rect.left, 0, rect.width),
    y: clampCoordinate(y - rect.top, 0, rect.height),
  };
}
