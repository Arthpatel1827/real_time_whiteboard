import React, { useEffect, useState } from 'react';
import WhiteboardCanvas from '../components/whiteboard/WhiteboardCanvas';
import Toolbar from '../components/whiteboard/Toolbar';
import { useDrawingEvents } from '../hooks/useDrawingEvents';

export default function WhiteboardRoom({ roomId, userId, onLeave }) {
  const { drawingEvents, sendDrawingEvent, connectionState } = useDrawingEvents({
    roomId,
    userId,
  });

  const [color, setColor] = useState('#000000');

  useEffect(() => {
    // In a real app, load existing history (GET_BOARD_HISTORY) here.
  }, [roomId]);

  return (
    <div className="whiteboard-room">
      <Toolbar color={color} onColorChange={setColor} onLeave={onLeave} />
      <WhiteboardCanvas
        drawingEvents={drawingEvents}
        onDraw={(event) => sendDrawingEvent({ ...event, color })}
        connectionState={connectionState}
      />
    </div>
  );
}
