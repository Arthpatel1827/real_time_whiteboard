import React from "react";

export default function Toolbar({ color, onColorChange, onLeave }) {
  return (
    <div className="flex flex-col items-center gap-4">

      {/* COLOR PICKER */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-gray-400">Color</span>

        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-10 h-10 p-1 rounded-xl bg-white/10 border border-white/10 cursor-pointer"
        />
      </div>

      {/* DIVIDER */}
      <div className="w-8 h-px bg-white/10" />

      {/* TOOL BUTTONS (future ready) */}
      <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-indigo-500 transition">
        ✏️
      </button>

      <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-indigo-500 transition">
        🧽
      </button>

      <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-indigo-500 transition">
        ⬛
      </button>

      <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-indigo-500 transition">
        ⚪
      </button>

      {/* SPACER */}
      <div className="flex-1" />

      {/* LEAVE BUTTON */}
      <button
        onClick={onLeave}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/80 hover:bg-red-400 transition"
        title="Leave Room"
      >
        🚪
      </button>
    </div>
  );
}