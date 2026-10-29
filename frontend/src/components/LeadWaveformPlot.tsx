import React, { useMemo } from "react";
import { Maximize2 } from "lucide-react";

interface LeadWaveformPlotProps {
  leadName: string;
  data: number[];
  minVal?: number;
  maxVal?: number;
  height?: number;
  showDetails?: boolean;
  onExpand?: () => void;
  gridStyle?: "subtle" | "pink";
}

export const LeadWaveformPlot: React.FC<LeadWaveformPlotProps> = ({
  leadName,
  data,
  minVal,
  maxVal,
  height = 100,
  showDetails = true,
  onExpand,
  gridStyle = "subtle"
}) => {
  const { pathString, rangeMin, rangeMax } = useMemo(() => {
    if (!data || data.length === 0) {
      return { pathString: "", rangeMin: -1, rangeMax: 1 };
    }

    const calculatedMin = minVal !== undefined ? minVal : Math.min(...data);
    const calculatedMax = maxVal !== undefined ? maxVal : Math.max(...data);

    // Add 10% padding to range so peaks don't touch edges
    const rangeSpan = Math.max(0.1, calculatedMax - calculatedMin);
    const yMin = calculatedMin - rangeSpan * 0.1;
    const yMax = calculatedMax + rangeSpan * 0.1;

    const width = 500;
    const h = height;

    // Build SVG path points
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      // Invert y for SVG coordinate system (0 is top)
      const y = h - ((val - yMin) / (yMax - yMin)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return {
      pathString: `M ${points.join(" L ")}`,
      rangeMin: calculatedMin,
      rangeMax: calculatedMax
    };
  }, [data, minVal, maxVal, height]);

  const gridClass = gridStyle === "pink" ? "ecg-grid-pink" : "ecg-grid-subtle";

  return (
    <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs group">
      {/* Top Header info */}
      <div className="absolute top-2 left-2 z-10 flex items-center space-x-2 bg-white/85 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200/60 text-xs">
        <span className="font-bold text-slate-800">{leadName}</span>
        {showDetails && (
          <span className="text-[10px] text-slate-500 font-mono">
            [{rangeMin.toFixed(2)}, {rangeMax.toFixed(2)}] mV
          </span>
        )}
      </div>

      {onExpand && (
        <button
          onClick={onExpand}
          className="absolute top-2 right-2 z-10 p-1 rounded bg-white/85 border border-slate-200 text-slate-500 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition shadow-xs"
          title="Zoom into this lead"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* SVG Canvas Area */}
      <div className={`w-full overflow-hidden ${gridClass}`} style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 500 ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Zero voltage baseline */}
          <line
            x1="0"
            y1={height / 2}
            x2="500"
            y2={height / 2}
            stroke="#cbd5e1"
            strokeWidth="0.8"
            strokeDasharray="3 3"
          />
          {/* Waveform line */}
          <path
            d={pathString}
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Bottom scale labels */}
      {showDetails && (
        <div className="flex justify-between items-center px-2 py-1 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
          <span>0.0 s</span>
          <span>5.0 s</span>
          <span>10.0 s (100 Hz)</span>
        </div>
      )}
    </div>
  );
};
