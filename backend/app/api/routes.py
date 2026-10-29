import os
from pathlib import Path
from typing import List, Optional
import numpy as np
import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from backend.app.core.config import settings, STANDARD_LEADS
from backend.app.schemas.ecg import (
    HealthResponse,
    ModelMetadata,
    ExperimentResultsResponse,
    PredictionResultResponse,
    SampleSignalItem,
    SignalPreview
)
from backend.app.services.model_service import model_manager
from backend.app.services.signal_service import (
    parse_and_validate_ecg,
    build_signal_preview
)

router = APIRouter()

SAMPLE_SIGNALS = [
    {
        "id": "normal-sinus",
        "name": "Normal Sinus Rhythm",
        "description": "Synthetic 12-lead ECG with physiological P-QRS-T complexes and normal frontal axis.",
        "filename": "sample_normal_ecg.csv",
        "leads": STANDARD_LEADS,
        "sample_rate_hz": 100,
        "num_samples": 1000
    },
    {
        "id": "myocardial-infarction",
        "name": "Acute Myocardial Infarction Pattern",
        "description": "Synthetic 12-lead ECG exhibiting pronounced ST-segment elevation and pathological Q-waves.",
        "filename": "sample_mi_ecg.csv",
        "leads": STANDARD_LEADS,
        "sample_rate_hz": 100,
        "num_samples": 1000
    },
    {
        "id": "conduction-disturbance",
        "name": "Conduction Disturbance Pattern",
        "description": "Synthetic 12-lead ECG displaying prolonged QRS duration (>120 ms) typical of intraventricular conduction block.",
        "filename": "sample_cd_ecg.csv",
        "leads": STANDARD_LEADS,
        "sample_rate_hz": 100,
        "num_samples": 1000
    }
]

@router.get("/health", response_model=HealthResponse, tags=["Health"])
def get_health():
    """
    Returns system health, PyTorch hardware acceleration device,
    and verified status of model artifacts and experimental results.
    """
    models = model_manager.discover_model_files()
    model_ids = [m.stem for m in models]
    artifacts_found = len(models) > 0
    results_found = settings.RESULTS_FILE.exists()

    return HealthResponse(
        status="healthy" if (artifacts_found and results_found) else "degraded",
        version=settings.VERSION,
        device=model_manager.device,
        artifacts_found=artifacts_found,
        results_found=results_found,
        available_models_count=len(models),
        available_models=model_ids
    )

@router.get("/models", response_model=List[ModelMetadata], tags=["Models"])
def get_models():
    """
    Returns metadata for all available trained model checkpoints,
    including architecture, labeled data fraction, and trained decision thresholds.
    """
    return model_manager.get_available_models()

@router.get("/experiments", response_model=ExperimentResultsResponse, tags=["Experiments"])
def get_experiments():
    """
    Returns the full 12-run experimental evaluation matrix from the research notebook,
    comparing CNN, AE-CNN, and VAE-CNN across 10%, 25%, 50%, and 100% labeled training data.
    """
    return model_manager.get_experiment_results()

@router.get("/samples", response_model=List[SampleSignalItem], tags=["Samples"])
def list_sample_signals():
    """
    Lists preloaded synthetic 12-lead ECG signals available for instant testing.
    """
    return [SampleSignalItem(**s) for s in SAMPLE_SIGNALS]

@router.get("/samples/{sample_id}/preview", response_model=SignalPreview, tags=["Samples"])
def get_sample_preview(sample_id: str):
    """
    Returns waveform preview data and summary statistics for a preloaded sample signal.
    """
    sample = next((s for s in SAMPLE_SIGNALS if s["id"] == sample_id), None)
    if not sample:
        raise HTTPException(status_code=404, detail=f"Sample signal '{sample_id}' not found.")

    file_path = settings.SAMPLES_DIR / sample["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Sample file '{sample['filename']}' not found on disk.")

    with open(file_path, "rb") as f:
        content = f.read()

    signal = parse_and_validate_ecg(content, sample["filename"])
    return build_signal_preview(signal)

@router.post("/predict", response_model=PredictionResultResponse, tags=["Inference"])
async def predict_ecg(
    file: UploadFile = File(..., description="12-lead ECG signal file in .csv or .npy format (1000 samples x 12 leads)"),
    model_id: str = Form(..., description="ID of the model checkpoint to use for inference (e.g. 'best_model_100pct')")
):
    """
    Performs real PyTorch inference on an uploaded 12-lead ECG signal file.
    Validates signal dimensions, applies checkpoint-specific normalization,
    and returns multi-label prediction probabilities, threshold comparisons,
    and signal summary preview.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload.")

    content = await file.read()
    raw_signal = parse_and_validate_ecg(content, file.filename)

    result = model_manager.predict(model_id=model_id, raw_signal=raw_signal)
    return result

@router.post("/predict-sample/{sample_id}", response_model=PredictionResultResponse, tags=["Inference"])
def predict_sample(
    sample_id: str,
    model_id: str = Form(..., description="ID of the model checkpoint to use for inference")
):
    """
    Convenience endpoint: Runs real inference using one of the preloaded sample ECG signals.
    """
    sample = next((s for s in SAMPLE_SIGNALS if s["id"] == sample_id), None)
    if not sample:
        raise HTTPException(status_code=404, detail=f"Sample signal '{sample_id}' not found.")

    file_path = settings.SAMPLES_DIR / sample["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Sample file '{sample['filename']}' not found on disk.")

    with open(file_path, "rb") as f:
        content = f.read()

    raw_signal = parse_and_validate_ecg(content, sample["filename"])
    return model_manager.predict(model_id=model_id, raw_signal=raw_signal)
