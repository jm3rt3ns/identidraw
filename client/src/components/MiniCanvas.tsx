import { useEffect, useRef } from 'react';
import type { DrawStroke } from '../types';

interface Props {
  playerId: string;
  username: string;
  eliminated: boolean;
  strokes: DrawStroke[];
}

/**
 * Small read-only canvas that replays strokes from another player.
 * Renders incrementally for performance.
 */
export default function MiniCanvas({ playerId, username, eliminated, strokes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderedCount = useRef(0);

  // Size the canvas once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, []);

  // Incrementally render new strokes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let i = renderedCount.current; i < strokes.length; i++) {
      const stroke = strokes[i];
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(
        stroke.points[0].x * canvas.width,
        stroke.points[0].y * canvas.height
      );
      for (let j = 1; j < stroke.points.length; j++) {
        ctx.lineTo(
          stroke.points[j].x * canvas.width,
          stroke.points[j].y * canvas.height
        );
      }
      ctx.stroke();
    }

    renderedCount.current = strokes.length;
  }, [strokes]);

  return (
    <div className={`rounded-lg overflow-hidden ${eliminated ? 'opacity-50' : ''}`}>
      <div className="bg-slate-700 px-2 py-1 text-xs flex justify-between items-center">
        <span className="truncate font-medium">{username}</span>
        {eliminated && (
          <span className="text-red-400 text-xs ml-1 shrink-0">OUT</span>
        )}
      </div>
      <div className="bg-white aspect-[4/3]">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          data-player-id={playerId}
        />
      </div>
    </div>
  );
}
