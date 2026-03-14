import { useCallback, useRef } from 'react';

export function useCanvas() {
  const canvasRef = useRef(null);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return { canvasRef, clear };
}
