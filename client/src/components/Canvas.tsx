import { useCallback, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { useCanvas } from '../hooks/useCanvas';
import ColorPalette from './ColorPalette';

interface Props {
  disabled?: boolean;
}

export default function Canvas({ disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { sendDraw, clearCanvas: clearRemote } = useGame();

  const handleStroke = useCallback(
    (points: Array<{ x: number; y: number }>, color: string, lineWidth: number) => {
      sendDraw({ points, color, lineWidth });
    },
    [sendDraw]
  );

  const {
    color,
    setColor,
    lineWidth,
    setLineWidth,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
  } = useCanvas(canvasRef, { onStroke: handleStroke, disabled });

  const handleClear = () => {
    clearCanvas();
    clearRemote();
  };

  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0">
      <div className="flex-1 bg-white rounded-lg overflow-hidden relative min-h-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
          onMouseMove={(e) => draw(e.clientX, e.clientY)}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            const t = e.touches[0];
            startDrawing(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const t = e.touches[0];
            draw(t.clientX, t.clientY);
          }}
          onTouchEnd={stopDrawing}
        />
        {disabled && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-slate-600 font-medium">
              Drawing disabled
            </span>
          </div>
        )}
      </div>
      <ColorPalette
        color={color}
        onColorChange={setColor}
        lineWidth={lineWidth}
        onLineWidthChange={setLineWidth}
        onClear={handleClear}
        disabled={disabled}
      />
    </div>
  );
}
