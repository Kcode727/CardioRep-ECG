import React, { useState } from "react";
import type { ExperimentRow } from "../types/api";

interface ComparisonLineChartProps {
  experiments: ExperimentRow[];
}

type MetricKey = "macro_f1" | "micro_f1" | "macro_auroc" | "macro_auprc" | "val_macro_f1";

const METRIC_LABELS: Record<MetricKey, { name: string; desc: string }> = {
  macro_f1: { name: "Test Macro-F1", desc: "Unweighted mean of F1 across the 5 diagnostic superclasses on held-out fold 10" },
  micro_f1: { name: "Test Micro-F1", desc: "Global F1 aggregating true positives, false positives, and false negatives" },
  macro_auroc: { name: "Test Macro-AUROC", desc: "Area under ROC curve across all classes" },
  macro_auprc: { name: "Test Macro-AUPRC", desc: "Area under Precision-Recall curve across all classes" },
  val_macro_f1: { name: "Validation Macro-F1", desc: "Macro-F1 on validation fold 9 used for early stopping & threshold tuning" }
};

const FRACTIONS = [0.10, 0.25, 0.50, 1.00];

export const ComparisonLineChart: React.FC<ComparisonLineChartProps> = ({ experiments }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("macro_f1");
  const [hoveredPoint, setHoveredPoint] = useState<{
    model: string;
    fraction: number;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  // Group by model type: CNN, AE, VAE
  const models = [
    { key: "CNN", label: "Baseline 1D CNN", color: "#2563eb", strokeDash: "none" },
    { key: "AE", label: "Autoencoder-Pretrained (AE-CNN)", color: "#7c3aed", strokeDash: "none" },
    { key: "VAE", label: "Variational AE-Pretrained (VAE-CNN)", color: "#059669", strokeDash: "none" }
  ];

  // Chart dimensions
  const width = 640;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Determine min and max for y-scale
  const allValues = experiments.map(e => e[selectedMetric]);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const yMin = Math.max(0, Math.floor(rawMin * 20) / 20 - 0.05); // Snap to nearest 0.05
  const yMax = Math.min(1.0, Math.ceil(rawMax * 20) / 20 + 0.05);

  const getX = (frac: number) => {
    const fracIndex = FRACTIONS.indexOf(frac);
    return padding.left + (fracIndex / (FRACTIONS.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padding.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Model Performance vs. Labeled Data Available</h3>
          <p className="text-xs text-slate-500">{METRIC_LABELS[selectedMetric].desc}</p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Metric:</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          >
            {Object.entries(METRIC_LABELS).map(([k, meta]) => (
              <option key={k} value={k}>
                {meta.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
          {/* Horizontal Gridlines & Y-ticks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const val = yMin + ratio * (yMax - yMin);
            const y = getY(val);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Vertical Gridlines & X-ticks */}
          {FRACTIONS.map((frac) => {
            const x = getX(frac);
            return (
              <g key={frac}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartH}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className="text-[11px] fill-slate-600 font-medium font-mono"
                >
                  {`${intFrac(frac)}%`}
                </text>
                <text
                  x={x}
                  y={height - padding.bottom + 34}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400 font-mono"
                >
                  ({Math.round(frac * 3500)} records)
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            className="text-[11px] fill-slate-500 font-medium"
          >
            Fraction of Available Labeled Training Records
          </text>

          {/* Model Curves */}
          {models.map((m) => {
            const points = FRACTIONS.map((frac) => {
              const row = experiments.find(
                (e) => e.model_type === m.key && Math.abs(e.labeled_fraction - frac) < 0.001
              );
              const val = row ? row[selectedMetric] : 0;
              return { frac, val, x: getX(frac), y: getY(val) };
            });

            const pathD = points
              .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
              .join(" ");

            return (
              <g key={m.key}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={m.color}
                  strokeWidth="2.5"
                  strokeDasharray={m.strokeDash}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {points.map((p) => (
                  <circle
                    key={`${m.key}-${p.frac}`}
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    fill="#ffffff"
                    stroke={m.color}
                    strokeWidth="2"
                    className="cursor-pointer hover:r-6 transition-all"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        model: m.label,
                        fraction: p.frac,
                        value: p.val,
                        x: p.x,
                        y: p.y
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </g>
            );
          })}

          {/* Hover Tooltip inside SVG */}
          {hoveredPoint && (
            <g transform={`translate(${hoveredPoint.x}, ${hoveredPoint.y - 12})`}>
              <rect
                x="-65"
                y="-32"
                width="130"
                height="28"
                rx="4"
                fill="#0f172a"
                className="shadow-md"
              />
              <text
                x="0"
                y="-14"
                textAnchor="middle"
                fill="#ffffff"
                className="text-[10px] font-mono font-medium"
              >
                {hoveredPoint.model.split(" ")[0]} ({intFrac(hoveredPoint.fraction)}%): {hoveredPoint.value.toFixed(4)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs">
        {models.map((m) => (
          <div key={m.key} className="flex items-center space-x-2">
            <span className="w-3.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="font-medium text-slate-700">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function intFrac(frac: number): number {
  return Math.round(frac * 100);
}
