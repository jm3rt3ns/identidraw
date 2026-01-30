const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#92400e',
  '#6b7280', '#06b6d4',
];

const WIDTHS = [2, 4, 8, 14];

interface Props {
  color: string;
  onColorChange: (c: string) => void;
  lineWidth: number;
  onLineWidthChange: (w: number) => void;
  onClear: () => void;
  disabled?: boolean;
}

export default function ColorPalette({
  color,
  onColorChange,
  lineWidth,
  onLineWidthChange,
  onClear,
  disabled,
}: Props) {
  return (
    <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-2 flex-wrap">
      {/* Color swatches */}
      <div className="flex gap-1 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            disabled={disabled}
            onClick={() => onColorChange(c)}
            className={`w-7 h-7 rounded-md border-2 transition-transform ${
              color === c ? 'border-brand-500 scale-110' : 'border-slate-600'
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-600" />

      {/* Brush sizes */}
      <div className="flex gap-1 items-center">
        {WIDTHS.map((w) => (
          <button
            key={w}
            disabled={disabled}
            onClick={() => onLineWidthChange(w)}
            className={`flex items-center justify-center w-8 h-8 rounded-md ${
              lineWidth === w ? 'bg-slate-600' : 'bg-slate-700'
            }`}
            aria-label={`Brush size ${w}`}
          >
            <div
              className="rounded-full bg-white"
              style={{ width: w + 2, height: w + 2 }}
            />
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-600" />

      {/* Clear */}
      <button
        onClick={onClear}
        disabled={disabled}
        className="btn-danger text-xs py-1 px-3"
      >
        Clear
      </button>
    </div>
  );
}
