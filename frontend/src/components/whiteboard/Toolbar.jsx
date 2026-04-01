import React from "react";

export default function Toolbar({ color, onColorChange, onLeave }) {
  return (
    <div className="flex flex-col items-center gap-4">

      {/* COLOR */}
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        className="w-10 h-10 rounded-xl border border-white/20 bg-transparent cursor-pointer"
      />

      {/* TOOLS */}
      <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-blue-500 flex items-center justify-center transition">
        ✏️
      </button>

      <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-blue-500 flex items-center justify-center transition">
        🧽
      </button>

      <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-blue-500 flex items-center justify-center transition">
        ⬛
      </button>

      <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-blue-500 flex items-center justify-center transition">
        ⚪
      </button>

      {/* SPACER */}
      <div className="h-6" />

      {/* LEAVE */}
      <button
        onClick={onLeave}
        className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-400 flex items-center justify-center transition"
      >
        🚪
      </button>
    </div>
  );
}