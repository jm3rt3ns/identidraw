import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCanvasOptions {
  onStroke: (points: Array<{ x: number; y: number }>, color: string, lineWidth: number) => void;
  disabled?: boolean;
}

/**
 * Hook that manages drawing on an HTML5 canvas.
 * Coordinates are normalized to 0-1 so strokes render at any size.
 */
export function useCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  { onStroke, disabled }: UseCanvasOptions
) {
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const isDrawing = useRef(false);
  const pointsBuffer = useRef<Array<{ x: number; y: number }>>([]);
  const batchTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext('2d') || null;
  }, [canvasRef]);

  // Set up canvas resolution to match display size
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, [canvasRef]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const toNormalized = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
      };
    },
    [canvasRef]
  );

  // Draw a line segment on the canvas using normalized coords
  const drawSegment = useCallback(
    (
      from: { x: number; y: number },
      to: { x: number; y: number },
      strokeColor: string,
      width: number
    ) => {
      const ctx = getCtx();
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
      ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
      ctx.stroke();
    },
    [getCtx, canvasRef]
  );

  const flushBatch = useCallback(() => {
    if (pointsBuffer.current.length > 0) {
      onStroke([...pointsBuffer.current], color, lineWidth);
      pointsBuffer.current = [];
    }
  }, [onStroke, color, lineWidth]);

  const startDrawing = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;
      isDrawing.current = true;
      const pos = toNormalized(clientX, clientY);
      lastPos.current = pos;
      pointsBuffer.current = [pos];

      // Batch send every 30ms
      batchTimer.current = setInterval(flushBatch, 30);
    },
    [disabled, toNormalized, flushBatch]
  );

  const draw = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDrawing.current || disabled) return;
      const pos = toNormalized(clientX, clientY);

      if (lastPos.current) {
        drawSegment(lastPos.current, pos, color, lineWidth);
      }

      lastPos.current = pos;
      pointsBuffer.current.push(pos);
    },
    [disabled, toNormalized, drawSegment, color, lineWidth]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPos.current = null;
    clearInterval(batchTimer.current);
    flushBatch();
  }, [flushBatch]);

  // Clear the entire canvas
  const clearCanvas = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [getCtx, canvasRef]);

  return {
    color,
    setColor,
    lineWidth,
    setLineWidth,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    drawSegment,
    resizeCanvas,
  };
}
