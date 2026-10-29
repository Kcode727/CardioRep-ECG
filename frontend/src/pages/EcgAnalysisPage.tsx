import React, { useState, useEffect } from "react";
import type { 
  ModelMetadata, 
  PredictionResultResponse, 
  SampleSignalItem, 
  SignalPreview 
} from "../types/api";
import { apiService } from "../services/api";
import { TwelveLeadGrid } from "../components/TwelveLeadGrid";
import { 
  Upload, 
  FileText, 
  Cpu, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  Check
} from "lucide-react";

interface EcgAnalysisPageProps {
  models: ModelMetadata[];
  samples: SampleSignalItem[];
}

export const EcgAnalysisPage: React.FC<EcgAnalysisPageProps> = ({ models, samples }) => {
  // Selected model
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  // Input selection mode: 'upload' or 'sample'
  const [inputMode, setInputMode] = useState<"sample" | "upload">("sample");
  const [selectedSampleId, setSelectedSampleId] = useState<string>("normal-sinus");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Signal preview & inference states
  const [signalPreview, setSignalPreview] = useState<SignalPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [predicting, setPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResultResponse | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Set default model when models list is populated
  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      const defaultModel = models.find(m => m.id === "best_model_100pct") || models[0];
      setSelectedModelId(defaultModel.id);
    }
  }, [models, selectedModelId]);

  // Load preview when sample is chosen
  useEffect(() => {
    if (inputMode === "sample" && selectedSampleId) {
      loadSamplePreview(selectedSampleId);
    }
  }, [inputMode, selectedSampleId]);

  const loadSamplePreview = async (sampleId: string) => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPredictionResult(null);
    try {
      const preview = await apiService.getSamplePreview(sampleId);
      setSignalPreview(preview);
    } catch (err: any) {
      setPreviewError(err.message || "Failed to load sample signal preview.");
      setSignalPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setPredictionResult(null);
      setPredictError(null);
      setPreviewError(null);
    }
  };

  const handleRunPrediction = async () => {
    if (!selectedModelId) {
      setPredictError("Please select a model checkpoint.");
      return;
    }

    setPredicting(true);
    setPredictError(null);

    try {
      let result: PredictionResultResponse;
      if (inputMode === "sample") {
        result = await apiService.predictSample(selectedSampleId, selectedModelId);
      } else {
        if (!uploadedFile) {
          setPredictError("Please select an ECG file to upload.");
          setPredicting(false);
          return;
        }
        result = await apiService.predictFile(uploadedFile, selectedModelId);
      }
      setPredictionResult(result);
      setSignalPreview(result.signal_info);
    } catch (err: any) {
      setPredictError(err.message || "Prediction request failed.");
    } finally {
      setPredicting(false);
    }
  };

  const selectedModelMeta = models.find(m => m.id === selectedModelId);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          ECG Classification Workbench & Inference Tool
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Submit a standardized 12-lead ECG signal (10 seconds @ 100 Hz = 1,000 samples across 12 leads) 
          and run multi-label diagnostic classification against the trained PyTorch checkpoints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Model Selection & Input Setup */}
        <div className="space-y-6 lg:col-span-1">
          {/* 1. Model Selector Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">1. Select Trained Model Checkpoint</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Available Checkpoints:</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.test_macro_f1 ? `(F1: ${m.test_macro_f1})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedModelMeta && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2 text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Architecture:</span>
                  <span className="font-mono text-[11px] text-indigo-600 font-bold">{selectedModelMeta.model_type}-CNN</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Training Labels:</span>
                  <span className="font-mono text-[11px]">{selectedModelMeta.n_labeled} records ({Math.round(selectedModelMeta.labeled_fraction * 100)}%)</span>
                </div>
                {selectedModelMeta.test_macro_f1 && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Test Macro-F1:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-900">{selectedModelMeta.test_macro_f1}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="font-semibold text-slate-800 block mb-1">Decision Thresholds:</span>
                  <div className="grid grid-cols-5 gap-1 text-[10px] font-mono text-center">
                    {Object.entries(selectedModelMeta.thresholds).map(([t, th]) => (
                      <div key={t} className="bg-white p-1 rounded border border-slate-200">
                        <span className="text-slate-400 block">{t}</span>
                        <span className="font-bold text-slate-800">{th}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Signal Input Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">2. Provide 12-Lead ECG Signal</h3>
            </div>

            {/* Input Mode Toggle */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setInputMode("sample");
                  setPredictError(null);
                }}
                className={`py-1.5 rounded-md transition ${
                  inputMode === "sample"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Preloaded Samples
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode("upload");
                  setPredictError(null);
                }}
                className={`py-1.5 rounded-md transition ${
                  inputMode === "upload"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Upload File (.csv / .npy)
              </button>
            </div>

            {inputMode === "sample" ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Choose Benchmark Example:</label>
                <div className="space-y-2">
                  {samples.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSampleId(s.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                        selectedSampleId === s.id
                          ? "border-indigo-500 bg-indigo-50/50 text-indigo-900 font-medium"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{s.name}</span>
                        {selectedSampleId === s.id && (
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700">Upload Compatible Signal File:</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center hover:border-indigo-400 transition bg-slate-50/50">
                  <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                  <input
                    type="file"
                    id="ecg-file-upload"
                    accept=".csv,.npy,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="ecg-file-upload"
                    className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Click to browse file
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Accepts .csv (1000 rows x 12 leads) or .npy (shape 12x1000)
                  </p>
                </div>

                {uploadedFile && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <span className="font-medium truncate">{uploadedFile.name}</span>
                    <span className="text-[10px] font-mono text-emerald-600 shrink-0">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700">Supported Specifications:</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Duration: 10 seconds @ 100 Hz (1,000 samples)</li>
                    <li>12 standard leads: I, II, III, aVR, aVL, aVF, V1–V6</li>
                    <li>Units: Millivolts (mV)</li>
                    <li>Rejects NaN, infinite values, or improper dimensions</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Error message banner */}
            {(predictError || previewError) && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Error:</span> {predictError || previewError}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleRunPrediction}
              disabled={predicting || (inputMode === "upload" && !uploadedFile)}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2 shadow-sm shadow-indigo-100"
            >
              {predicting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Executing PyTorch Inference...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Model Inference</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Columns: Signal Visualization & Diagnostic Results */}
        <div className="space-y-6 lg:col-span-2">
          {/* Diagnostic Results Card (Shows when inference has executed) */}
          {predictionResult && (
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-indigo-200 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-bold text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                      Inference Result
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{predictionResult.inference_time_ms} ms</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Evaluated by {predictionResult.model_name}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Identified Conditions:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5 justify-end">
                    {predictionResult.detected_classes.length > 0 ? (
                      predictionResult.detected_classes.map((cls) => (
                        <span
                          key={cls}
                          className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200"
                        >
                          {cls}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        None above threshold
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 5-Class Multi-Label Score Bars */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {predictionResult.predictions.map((pred) => {
                    const isDetected = pred.predicted_positive;
                    const percent = Math.min(100, Math.max(0, pred.score * 100));
                    const thPercent = pred.threshold * 100;

                    return (
                      <div
                        key={pred.label}
                        className={`p-3 rounded-lg border transition ${
                          isDetected
                            ? pred.label === "NORM"
                              ? "bg-emerald-50/70 border-emerald-300"
                              : "bg-rose-50/70 border-rose-300"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-sm text-slate-900">{pred.label}</span>
                            <span className="text-xs text-slate-500">({pred.description.split(":")[0]})</span>
                          </div>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isDetected
                                ? pred.label === "NORM"
                                  ? "bg-emerald-200 text-emerald-900"
                                  : "bg-rose-200 text-rose-900"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {isDetected ? "POSITIVE" : "NEGATIVE"}
                          </span>
                        </div>

                        {/* Probability Progress Bar with Threshold Marker */}
                        <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden my-2">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isDetected
                                ? pred.label === "NORM" ? "bg-emerald-500" : "bg-rose-500"
                                : "bg-slate-400"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                          {/* Threshold mark */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10"
                            style={{ left: `${thPercent}%` }}
                            title={`Trained threshold: ${pred.threshold}`}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <span className="text-slate-600">
                            Sigmoid Score: <strong>{(pred.score).toFixed(4)}</strong>
                          </span>
                          <span className="text-slate-500">
                            Threshold: {pred.threshold.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 12-Lead Signal Visualizer */}
          {signalPreview ? (
            <div className="space-y-2">
              <TwelveLeadGrid signalInfo={signalPreview} />
            </div>
          ) : previewLoading ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-slate-500">Loading waveform telemetry...</p>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No Signal Loaded</p>
              <p className="text-xs text-slate-400">
                Choose a preloaded sample or upload a 12-lead signal file to preview the waveform traces.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
