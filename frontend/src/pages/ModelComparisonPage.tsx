import React, { useState } from "react";
import type { ExperimentResultsResponse, ExperimentRow } from "../types/api";
import { ComparisonLineChart } from "../components/ComparisonLineChart";
import { MetricBarChart } from "../components/MetricBarChart";
import { 
  Table, 
  TrendingUp, 
  Award,
  AlertCircle
} from "lucide-react";

interface ModelComparisonPageProps {
  experimentData: ExperimentResultsResponse | null;
  loading: boolean;
  error: string | null;
}

export const ModelComparisonPage: React.FC<ModelComparisonPageProps> = ({
  experimentData,
  loading,
  error
}) => {
  const [filterModel, setFilterModel] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<keyof ExperimentRow>("labeled_fraction");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600">Loading experimental results...</p>
      </div>
    );
  }

  if (error || !experimentData) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold">Failed to load experimental results</h3>
          <p className="text-sm">{error || "No data returned from backend."}</p>
        </div>
      </div>
    );
  }

  const experiments = experimentData.results;

  // Filtered & sorted table data
  const filtered = experiments.filter(
    (e) => filterModel === "ALL" || e.model_type === filterModel
  );

  const sortedRows = [...filtered].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof ExperimentRow) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  return (
    <div className="space-y-10">
      {/* Title & Introduction */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Model Comparison & Empirical Research Results
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Empirical evaluation comparing the baseline 1D CNN against Autoencoder (AE-CNN) and Variational 
          Autoencoder (VAE-CNN) representations across 4 labeled training data fractions: 10%, 25%, 50%, and 100%.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { fraction: "10%", records: "350 records", winner: "VAE-CNN", f1: "0.529", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { fraction: "25%", records: "875 records", winner: "Baseline CNN", f1: "0.590", badge: "bg-blue-50 text-blue-700 border-blue-200" },
          { fraction: "50%", records: "1,750 records", winner: "AE-CNN", f1: "0.626", badge: "bg-purple-50 text-purple-700 border-purple-200" },
          { fraction: "100%", records: "3,500 records", winner: "AE-CNN", f1: "0.666", badge: "bg-purple-50 text-purple-700 border-purple-200" }
        ].map((card) => (
          <div key={card.fraction} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {card.fraction} Labeled Data
              </span>
              <span className="text-[10px] font-mono text-slate-400">{card.records}</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">{card.f1}</span>
              <span className="text-xs text-slate-500">Test Macro-F1</span>
            </div>
            <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-100">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-slate-700">Top Model:</span>
              <span className={`text-xs px-1.5 py-0.2 rounded border font-medium ${card.badge}`}>
                {card.winner}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section A: Line Chart */}
      <ComparisonLineChart experiments={experiments} />

      {/* Chart Section B: Per-Label F1 Bar Chart */}
      <MetricBarChart experiments={experiments} />

      {/* Scientific Insights Callout */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-bold">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg">Key Experimental Observations & Research Insights</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>Does Pretraining Uniformly Dominate?</span>
            </h4>
            <p className="leading-relaxed text-xs sm:text-sm">
              <strong>No.</strong> Neither self-supervised strategy consistently outperforms the supervised baseline 
              across all fractions. While VAE-CNN exhibits superior Macro-F1 at the lowest extreme regime (10% labels: 
              0.529 vs. 0.510 baseline), baseline CNN recovers strongly at 25% (0.590 vs. 0.544). At 100% data, AE-CNN 
              leads slightly (0.666 vs. 0.659).
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Class Imbalance & Diagnostic Difficulty</span>
            </h4>
            <p className="leading-relaxed text-xs sm:text-sm">
              The normal rhythm class (<strong>NORM</strong>) is easiest to classify (F1 &asymp; 0.80 - 0.85) due to 
              dominant sample frequency (1,838 positive training cases). In contrast, <strong>CD</strong> (Conduction Disturbance) 
              and <strong>HYP</strong> (Hypertrophy) have fewer positive cases and diverse morphologies, yielding lower 
              F1 scores (0.33 - 0.60) where pretraining provides noticeable regularization.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Validation vs. Test Metric Separation</span>
            </h4>
            <p className="leading-relaxed text-xs sm:text-sm">
              Validation fold 9 was strictly dedicated to early stopping (patience = 5) and grid-search threshold tuning 
              (17 candidates between 0.1 and 0.9). Reported final test metrics represent unbiased generalization on 
              completely held-out fold 10 records.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span>Practical Research Implication</span>
            </h4>
            <p className="leading-relaxed text-xs sm:text-sm">
              Unsupervised pretraining should not be treated as a magical panacea. For medical time-series like 12-lead ECGs, 
              reconstruction objectives (MSE) may allocate model capacity to preserving baseline wander or high-frequency 
              noise rather than subtle diagnostic ST-segment or QRS transitions.
            </p>
          </div>
        </div>
      </div>

      {/* Comprehensive Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Table className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Full Experimental Results Matrix (12 Runs)</h3>
          </div>

          {/* Model Filter */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Filter Model:</span>
            <select
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800"
            >
              <option value="ALL">All Models (12)</option>
              <option value="CNN">Baseline CNN (4)</option>
              <option value="AE">AE-CNN (4)</option>
              <option value="VAE">VAE-CNN (4)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort("model")}>
                  Model ID
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort("labeled_fraction")}>
                  Fraction
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort("n_labeled")}>
                  N (Labels)
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:text-indigo-600 font-bold" onClick={() => handleSort("macro_f1")}>
                  Test Macro-F1 {sortBy === "macro_f1" && (sortAsc ? "▲" : "▼")}
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:text-indigo-600" onClick={() => handleSort("val_macro_f1")}>
                  Val Macro-F1
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort("micro_f1")}>
                  Micro-F1
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort("macro_auroc")}>
                  AUROC
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort("macro_auprc")}>
                  AUPRC
                </th>
                <th className="py-2.5 px-3">F1_NORM</th>
                <th className="py-2.5 px-3">F1_MI</th>
                <th className="py-2.5 px-3">F1_STTC</th>
                <th className="py-2.5 px-3">F1_CD</th>
                <th className="py-2.5 px-3">F1_HYP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {sortedRows.map((r) => {
                const isSelectedCheckpoint = [
                  "VAE_0.10", "CNN_0.25", "AE_0.50", "AE_1.00"
                ].includes(r.model);

                return (
                  <tr 
                    key={r.model}
                    className={`hover:bg-slate-50 transition ${
                      isSelectedCheckpoint ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {r.model}
                      {isSelectedCheckpoint && (
                        <span className="ml-1.5 text-[9px] font-sans uppercase font-bold px-1 py-0.2 rounded bg-indigo-100 text-indigo-700">
                          Saved
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">{Math.round(r.labeled_fraction * 100)}%</td>
                    <td className="py-2 px-3 text-slate-500">{r.n_labeled}</td>
                    <td className="py-2 px-3 font-bold text-indigo-700">{r.macro_f1.toFixed(4)}</td>
                    <td className="py-2 px-3 text-slate-600">{r.val_macro_f1.toFixed(4)}</td>
                    <td className="py-2 px-3 text-slate-600">{r.micro_f1.toFixed(4)}</td>
                    <td className="py-2 px-3 text-slate-600">{r.macro_auroc.toFixed(4)}</td>
                    <td className="py-2 px-3 text-slate-600">{r.macro_auprc.toFixed(4)}</td>
                    <td className="py-2 px-3 text-slate-600">{r.F1_NORM.toFixed(3)}</td>
                    <td className="py-2 px-3 text-slate-600">{r.F1_MI.toFixed(3)}</td>
                    <td className="py-2 px-3 text-slate-600">{r.F1_STTC.toFixed(3)}</td>
                    <td className="py-2 px-3 text-slate-600">{r.F1_CD.toFixed(3)}</td>
                    <td className="py-2 px-3 text-slate-600">{r.F1_HYP.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400">
          * Highlighted rows indicate the best-performing checkpoints saved into the model archive and loaded in the ECG Analysis workbench.
        </p>
      </div>
    </div>
  );
};
