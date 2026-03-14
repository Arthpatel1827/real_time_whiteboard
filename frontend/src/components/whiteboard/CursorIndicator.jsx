import React from 'react';

export default function CursorIndicator({ position, userName }) {
  if (!position) return null;
  return (
    <div
      className="cursor-indicator"
      style={{ left: position.x, top: position.y }}
    >
      {userName}
    </div>
  );
}
