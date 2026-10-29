export interface HealthResponse {
  status: string;
  version: string;
  device: string;
  artifacts_found: boolean;
  results_found: boolean;
  available_models_count: number;
  available_models: string[];
}

export interface ModelMetadata {
  id: string;
  name: string;
  model_type: "CNN" | "AE" | "VAE" | string;
  architecture: string;
  labeled_fraction: number;
  n_labeled: number;
  targets: string[];
  thresholds: Record<string, number>;
  val_macro_f1?: number | null;
  test_macro_f1?: number | null;
  description: string;
}

export interface ExperimentRow {
  model: string;
  model_type: string;
  labeled_fraction: number;
  n_labeled: number;
  val_macro_f1: number;
  macro_f1: number;
  micro_f1: number;
  macro_auroc: number;
  macro_auprc: number;
  F1_NORM: number;
  F1_MI: number;
  F1_STTC: number;
  F1_CD: number;
  F1_HYP: number;
}

export interface ExperimentResultsResponse {
  total_experiments: number;
  results: ExperimentRow[];
  best_per_fraction: Record<string, string>;
  dataset_limitation: string;
}

export interface ClassPrediction {
  label: string;
  name: string;
  description: string;
  score: number;
  threshold: number;
  predicted_positive: boolean;
}

export interface LeadSummary {
  lead: string;
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface SignalPreview {
  num_leads: number;
  num_samples: number;
  duration_seconds: number;
  sampling_rate_hz: number;
  leads: string[];
  lead_summaries: LeadSummary[];
  waveform_preview: Record<string, number[]>;
}

export interface PredictionResultResponse {
  model_id: string;
  model_name: string;
  model_type: string;
  labeled_fraction: number;
  n_labeled: number;
  predictions: ClassPrediction[];
  detected_classes: string[];
  signal_info: SignalPreview;
  inference_time_ms: number;
  disclaimer: string;
}

export interface SampleSignalItem {
  id: string;
  name: string;
  description: string;
  filename: string;
  leads: string[];
  sample_rate_hz: number;
  num_samples: number;
}
