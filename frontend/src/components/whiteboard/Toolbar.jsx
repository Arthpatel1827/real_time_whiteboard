import React from "react";

export default function Toolbar({
  color,
  onColorChange,
  tool,
  onToolChange,
  onLeave,
}) {
  const toolButtonClass = (toolName) =>
    `w-10 h-10 rounded-xl flex items-center justify-center transition ${
      tool === toolName
        ? "bg-blue-500 text-white"
        : "bg-white/10 hover:bg-blue-500"
    }`;

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
      <button
        onClick={() => onToolChange("pencil")}
        className={toolButtonClass("pencil")}
        title="Pencil"
      >
        ✏️
      </button>

      <button
        onClick={() => onToolChange("rectangle")}
        className={toolButtonClass("rectangle")}
        title="Rectangle"
      >
        ⬛
      </button>

      <button
        onClick={() => onToolChange("circle")}
        className={toolButtonClass("circle")}
        title="Circle"
      >
        ⚪
      </button>

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