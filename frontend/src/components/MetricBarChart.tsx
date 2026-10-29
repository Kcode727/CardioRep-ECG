import React, { useState } from "react";
import type { ExperimentRow } from "../types/api";

interface MetricBarChartProps {
  experiments: ExperimentRow[];
}

const TARGETS = [
  { key: "F1_NORM", label: "NORM", name: "Normal ECG" },
  { key: "F1_MI", label: "MI", name: "Myocardial Infarction" },
  { key: "F1_STTC", label: "STTC", name: "ST/T Change" },
  { key: "F1_CD", label: "CD", name: "Conduction Disturbance" },
  { key: "F1_HYP", label: "HYP", name: "Hypertrophy" }
];

export const MetricBarChart: React.FC<MetricBarChartProps> = ({ experiments }) => {
  const [chosenFraction, setChosenFraction] = useState<number>(0.10);

  const models = [
    { key: "CNN", label: "CNN (Baseline)", color: "#2563eb" },
    { key: "AE", label: "AE-CNN", color: "#7c3aed" },
    { key: "VAE", label: "VAE-CNN", color: "#059669" }
  ];

  const currentRows = experiments.filter(
    (e) => Math.abs(e.labeled_fraction - chosenFraction) < 0.001
  );

  const width = 640;
  const height = 280;
  const padding = { top: 25, right: 20, bottom: 45, left: 50 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const groupWidth = chartW / TARGETS.length;
  const barWidth = 14;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
      {/* Header with fraction selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Per-Class Diagnostic F1 Score Breakdown</h3>
          <p className="text-xs text-slate-500">
            Comparing individual condition detection F1 on held-out test data
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Labeled Fraction:</label>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            {[0.10, 0.25, 0.50, 1.00].map((frac) => (
              <button
                key={frac}
                onClick={() => setChosenFraction(frac)}
                className={`px-2.5 py-1 rounded-md transition ${
                  Math.abs(chosenFraction - frac) < 0.001
                    ? "bg-white text-indigo-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {`${Math.round(frac * 100)}%`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Grouped Bar Chart */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
          {/* Y-axis gridlines: 0.0 to 1.0 */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val) => {
            const y = padding.top + chartH - val * chartH;
            return (
              <g key={val}>
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
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Grouped Bars per Target Superclass */}
          {TARGETS.map((target, groupIdx) => {
            const groupCenterX = padding.left + groupIdx * groupWidth + groupWidth / 2;

            return (
              <g key={target.key}>
                {/* 3 bars per group: CNN, AE, VAE */}
                {models.map((m, mIdx) => {
                  const row = currentRows.find((r) => r.model_type === m.key);
                  const f1Val = row ? (row[target.key as keyof ExperimentRow] as number) : 0;
                  const barH = f1Val * chartH;
                  const barX = groupCenterX + (mIdx - 1) * (barWidth + 3) - barWidth / 2;
                  const barY = padding.top + chartH - barH;

                  return (
                    <g key={m.key}>
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barH}
                        rx="2"
                        fill={m.color}
                        className="hover:opacity-85 transition"
                      >
                        <title>{`${m.label} - ${target.label}: ${f1Val.toFixed(4)}`}</title>
                      </rect>
                      {/* Value label above bar */}
                      <text
                        x={barX + barWidth / 2}
                        y={barY - 4}
                        textAnchor="middle"
                        className="text-[9px] fill-slate-500 font-mono"
                      >
                        {f1Val.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Target Superclass Label */}
                <text
                  x={groupCenterX}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="text-[12px] font-bold fill-slate-800"
                >
                  {target.label}
                </text>
                <text
                  x={groupCenterX}
                  y={height - padding.bottom + 30}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400"
                >
                  {target.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs">
        {models.map((m) => (
          <div key={m.key} className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: m.color }} />
            <span className="font-medium text-slate-700">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
