import React from 'react';

export default function Toolbar({ color, onColorChange, onLeave }) {
  return (
    <div className="toolbar">
      <label>
        Color:
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
        />
      </label>
      <button onClick={onLeave}>Leave Room</button>
    </div>
  );
}
