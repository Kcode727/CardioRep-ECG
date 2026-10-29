from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class HealthResponse(BaseModel):
    status: str
    version: str
    device: str
    artifacts_found: bool
    results_found: bool
    available_models_count: int
    available_models: List[str]

class ModelMetadata(BaseModel):
    id: str
    name: str
    model_type: str
    architecture: str
    labeled_fraction: float
    n_labeled: int
    targets: List[str]
    thresholds: Dict[str, float]
    val_macro_f1: Optional[float] = None
    test_macro_f1: Optional[float] = None
    description: str

class ExperimentRow(BaseModel):
    model: str
    model_type: str
    labeled_fraction: float
    n_labeled: int
    val_macro_f1: float
    macro_f1: float
    micro_f1: float
    macro_auroc: float
    macro_auprc: float
    F1_NORM: float
    F1_MI: float
    F1_STTC: float
    F1_CD: float
    F1_HYP: float

class ExperimentResultsResponse(BaseModel):
    total_experiments: int
    results: List[ExperimentRow]
    best_per_fraction: Dict[str, str]
    dataset_limitation: str

class ClassPrediction(BaseModel):
    label: str
    name: str
    description: str
    score: float
    threshold: float
    predicted_positive: bool

class LeadSummary(BaseModel):
    lead: str
    mean: float
    std: float
    min: float
    max: float

class SignalPreview(BaseModel):
    num_leads: int
    num_samples: int
    duration_seconds: float
    sampling_rate_hz: int
    leads: List[str]
    lead_summaries: List[LeadSummary]
    # Preview downsampled array for fast frontend rendering (e.g. 500 points per lead)
    waveform_preview: Dict[str, List[float]]

class PredictionResultResponse(BaseModel):
    model_id: str
    model_name: str
    model_type: str
    labeled_fraction: float
    n_labeled: int
    predictions: List[ClassPrediction]
    detected_classes: List[str]
    signal_info: SignalPreview
    inference_time_ms: float
    disclaimer: str

class SampleSignalItem(BaseModel):
    id: str
    name: str
    description: str
    filename: str
    leads: List[str]
    sample_rate_hz: int
    num_samples: int
