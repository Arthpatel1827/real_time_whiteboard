import React, { useEffect, useState } from "react";
import WhiteboardCanvas from "../components/whiteboard/WhiteboardCanvas";
import Toolbar from "../components/whiteboard/Toolbar";
import { useDrawingEvents } from "../hooks/useDrawingEvents";

export default function WhiteboardRoom({ roomId, onLeave }) {
  const {
    drawingEvents,
    sendDrawingEvent,
    connectionState,
  } = useDrawingEvents({
    roomId,
  });
  const [color, setColor] = useState("#3b82f6");

  useEffect(() => {}, [roomId]);

  return (
    <div className="h-screen bg-[#0b0b12] text-white overflow-hidden">

      {/* 🔝 TOP BAR */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-[90%] max-w-6xl px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">

        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg">Room {roomId}</h1>

          <span className="text-sm text-gray-400">
            👥 {drawingEvents.length}
          </span>

          <span className="w-2 h-2 rounded-full bg-green-400" />
        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={() => sendDrawingEvent({ eventType: "clear" })}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-medium hover:scale-105 transition"
          >
            Clear
          </button>

          <button
            onClick={onLeave}
            className="px-4 py-2 bg-red-500 rounded-lg text-sm hover:scale-105 transition"
          >
            Leave
          </button>

        </div>
      </div>

      {/* 🛠 FLOATING TOOLBAR */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50">
        <div className="flex flex-col items-center gap-4 p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
          <Toolbar
            color={color}
            onColorChange={setColor}
            onLeave={onLeave}
          />
        </div>
      </div>

      {/* 🎨 CANVAS AREA */}
      <div className="w-full h-full relative">

        {/* GRID BACKGROUND */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,#1a1a2e_1px,transparent_1px)] bg-[size:22px_22px] opacity-30" />

        <WhiteboardCanvas
          drawingEvents={drawingEvents}
          onDraw={(event) =>
            sendDrawingEvent({ ...event, color })
          }
        />

        {/* 🔻 ZOOM CONTROLS */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">

          <button className="text-lg hover:scale-110 transition">➖</button>
          <span className="text-sm text-gray-300">100%</span>
          <button className="text-lg hover:scale-110 transition">➕</button>

        </div>

      </div>
    </div>
  );
}