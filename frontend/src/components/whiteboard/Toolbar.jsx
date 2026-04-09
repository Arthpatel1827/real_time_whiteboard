import React from "react";

export default function Toolbar({
  color,
  onColorChange,
  tool,
  onToolChange,
  onLeave,
}) {
  const buttonClass = (active) =>
    `w-10 h-10 rounded-xl flex items-center justify-center transition ${
      active
        ? "bg-blue-500 scale-110"
        : "bg-white/10 hover:bg-blue-500 hover:scale-105"
    }`;

  return (
    <div className="flex flex-col items-center gap-4">

      {/* 🎨 COLOR */}
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        className="w-10 h-10 rounded-xl border border-white/20 bg-transparent cursor-pointer"
      />

      {/* ✏️ PENCIL */}
      <button
        onClick={() => onToolChange("pencil")}
        className={buttonClass(tool === "pencil")}
        title="Pencil"
      >
        ✏️
      </button>

      {/* 🧽 ERASER */}
      <button
        onClick={() => onToolChange("eraser")}
        className={buttonClass(tool === "eraser")}
        title="Eraser"
      >
        🧽
      </button>

      {/* ⬛ RECTANGLE */}
      <button
        onClick={() => onToolChange("rectangle")}
        className={buttonClass(tool === "rectangle")}
        title="Rectangle (coming next)"
      >
        ⬛
      </button>

      {/* ⚪ CIRCLE */}
      <button
        onClick={() => onToolChange("circle")}
        className={buttonClass(tool === "circle")}
        title="Circle (coming next)"
      >
        ⚪
      </button>

      <div className="h-6" />

      {/* 🚪 LEAVE */}
      <button
        onClick={onLeave}
        className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-400 flex items-center justify-center transition"
        title="Leave Room"
      >
        🚪
      </button>
    </div>
  );
}