import time
from pathlib import Path
from typing import Dict, List, Optional
import numpy as np
import pandas as pd
import torch

from fastapi import HTTPException
from backend.app.core.config import (
    settings,
    TARGETS,
    TARGET_DESCRIPTIONS,
    STANDARD_LEADS
)
from backend.app.models.ecg_classifier import ECGClassifier
from backend.app.schemas.ecg import (
    ModelMetadata,
    ExperimentRow,
    ExperimentResultsResponse,
    ClassPrediction,
    PredictionResultResponse
)
from backend.app.services.signal_service import build_signal_preview

DISCLAIMER_TEXT = ""

DATASET_LIMITATION_TEXT = (
    "PTB-XL experimental dataset partition (3,500 train, 500 validation, and 500 test records)."
)

class ModelManager:
    def __init__(self):
        self._models_cache: Dict[str, ECGClassifier] = {}
        self._checkpoints_cache: Dict[str, dict] = {}
        self._experiments_df: Optional[pd.DataFrame] = None
        self._device = "cuda" if torch.cuda.is_available() else "cpu"

    @property
    def device(self) -> str:
        return self._device

    def load_experiments(self) -> pd.DataFrame:
        if self._experiments_df is None:
            if not settings.RESULTS_FILE.exists():
                raise FileNotFoundError(f"Experiment results file not found at {settings.RESULTS_FILE}")
            self._experiments_df = pd.read_csv(settings.RESULTS_FILE)
        return self._experiments_df

    def get_experiment_results(self) -> ExperimentResultsResponse:
        df = self.load_experiments()
        rows: List[ExperimentRow] = []
        best_per_fraction: Dict[str, str] = {}

        for _, r in df.iterrows():
            model_name = str(r["model"])
            parts = model_name.split("_")
            model_type = parts[0]
            fraction = float(r["labeled_fraction"])
            n_labeled = int(r["n_labeled"])

            row = ExperimentRow(
                model=model_name,
                model_type=model_type,
                labeled_fraction=fraction,
                n_labeled=n_labeled,
                val_macro_f1=float(r["val_macro_f1"]),
                macro_f1=float(r["macro_f1"]),
                micro_f1=float(r["micro_f1"]),
                macro_auroc=float(r["macro_auroc"]),
                macro_auprc=float(r["macro_auprc"]),
                F1_NORM=float(r["F1_NORM"]),
                F1_MI=float(r["F1_MI"]),
                F1_STTC=float(r["F1_STTC"]),
                F1_CD=float(r["F1_CD"]),
                F1_HYP=float(r["F1_HYP"])
            )
            rows.append(row)

        # Identify best model per fraction
        for frac in sorted(df["labeled_fraction"].unique()):
            sub = df[np.isclose(df["labeled_fraction"], frac)]
            best_idx = sub["val_macro_f1"].idxmax()
            best_name = str(sub.loc[best_idx, "model"])
            best_per_fraction[f"{int(frac * 100)}%"] = best_name

        return ExperimentResultsResponse(
            total_experiments=len(rows),
            results=rows,
            best_per_fraction=best_per_fraction,
            dataset_limitation=DATASET_LIMITATION_TEXT
        )

    def discover_model_files(self) -> List[Path]:
        if not settings.ARTIFACTS_DIR.exists():
            return []
        return sorted(list(settings.ARTIFACTS_DIR.glob("*.pt")))

    def _get_checkpoint_data(self, model_id: str) -> dict:
        if model_id in self._checkpoints_cache:
            return self._checkpoints_cache[model_id]

        model_file = settings.ARTIFACTS_DIR / f"{model_id}.pt"
        if not model_file.exists():
            # Try without .pt extension or with exact name
            alt_file = settings.ARTIFACTS_DIR / model_id
            if alt_file.exists():
                model_file = alt_file
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Model checkpoint '{model_id}' was not found in {settings.ARTIFACTS_DIR}."
                )

        try:
            checkpoint = torch.load(model_file, map_location=self._device, weights_only=False)
            self._checkpoints_cache[model_id] = checkpoint
            return checkpoint
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load checkpoint '{model_id}': {str(e)}"
            )

    def get_model_instance(self, model_id: str) -> tuple[ECGClassifier, dict]:
        checkpoint = self._get_checkpoint_data(model_id)

        if model_id not in self._models_cache:
            model = ECGClassifier(latent_dim=128, num_classes=len(TARGETS))
            model.load_state_dict(checkpoint["state_dict"])
            model.to(self._device)
            model.eval()
            self._models_cache[model_id] = model

        return self._models_cache[model_id], checkpoint

    def get_available_models(self) -> List[ModelMetadata]:
        files = self.discover_model_files()
        models_meta = []
        df_exp = None
        try:
            df_exp = self.load_experiments()
        except Exception:
            pass

        for p in files:
            model_id = p.stem  # e.g. "best_model_10pct"
            ckpt = self._get_checkpoint_data(model_id)
            model_type = ckpt.get("model_type", "CNN")
            labeled_fraction = float(ckpt.get("labeled_fraction", 1.0))
            n_labeled = int(labeled_fraction * 3500)
            targets = ckpt.get("targets", TARGETS)
            raw_thresholds = ckpt.get("thresholds", [0.5] * len(targets))

            thresholds_dict = {
                t: round(float(th), 3)
                for t, th in zip(targets, raw_thresholds)
            }

            # Find matching metrics in experiment results
            val_f1 = None
            test_f1 = None
            if df_exp is not None:
                match = df_exp[
                    (df_exp["model"].str.startswith(model_type + "_")) &
                    (np.isclose(df_exp["labeled_fraction"], labeled_fraction))
                ]
                if not match.empty:
                    val_f1 = round(float(match.iloc[0]["val_macro_f1"]), 4)
                    test_f1 = round(float(match.iloc[0]["macro_f1"]), 4)

            pct_str = f"{int(labeled_fraction * 100)}%"
            desc = (
                f"{model_type} architecture trained with {pct_str} labeled data "
                f"({n_labeled} records). Selected as best performer on validation set."
            )

            models_meta.append(
                ModelMetadata(
                    id=model_id,
                    name=f"{model_type}-CNN ({pct_str} Labeled)",
                    model_type=model_type,
                    architecture="1D-CNN Encoder (3 conv layers) + MLP Classification Head",
                    labeled_fraction=labeled_fraction,
                    n_labeled=n_labeled,
                    targets=targets,
                    thresholds=thresholds_dict,
                    val_macro_f1=val_f1,
                    test_macro_f1=test_f1,
                    description=desc
                )
            )

        return models_meta

    def predict(self, model_id: str, raw_signal: np.ndarray) -> PredictionResultResponse:
        """
        Runs inference on raw 12-lead ECG signal.
        raw_signal shape: (12, 1000)
        """
        start_time = time.perf_counter()

        # Load model and checkpoint metadata
        model, ckpt = self.get_model_instance(model_id)

        lead_mean = ckpt["lead_mean"]  # (1, 12, 1)
        lead_std = ckpt["lead_std"]    # (1, 12, 1)
        targets = ckpt.get("targets", TARGETS)
        thresholds = ckpt.get("thresholds", [0.5] * len(targets))
        model_type = ckpt.get("model_type", "CNN")
        labeled_fraction = float(ckpt.get("labeled_fraction", 1.0))
        n_labeled = int(labeled_fraction * 3500)

        # Apply exact notebook normalization: (raw - lead_mean) / lead_std
        # raw_signal is (12, 1000) -> reshape to (1, 12, 1000)
        signal_batch = raw_signal[np.newaxis, :, :].astype(np.float32)
        normed_signal = (signal_batch - lead_mean) / lead_std
        tensor = torch.from_numpy(normed_signal).float().to(self._device)

        # Run forward pass in inference mode
        with torch.inference_mode():
            logits = model(tensor)
            probs = torch.sigmoid(logits).cpu().numpy()[0]

        # Calculate per-class predictions and threshold comparisons
        predictions: List[ClassPrediction] = []
        detected_classes: List[str] = []

        for i, target in enumerate(targets):
            prob = float(probs[i])
            th = float(thresholds[i])
            is_pos = bool(prob >= th)
            if is_pos:
                detected_classes.append(target)

            predictions.append(
                ClassPrediction(
                    label=target,
                    name=target,
                    description=TARGET_DESCRIPTIONS.get(target, target),
                    score=round(prob, 4),
                    threshold=round(th, 3),
                    predicted_positive=is_pos
                )
            )

        inference_time = (time.perf_counter() - start_time) * 1000.0  # in ms
        signal_preview = build_signal_preview(raw_signal)

        return PredictionResultResponse(
            model_id=model_id,
            model_name=f"{model_type}-CNN ({int(labeled_fraction * 100)}% Labeled)",
            model_type=model_type,
            labeled_fraction=labeled_fraction,
            n_labeled=n_labeled,
            predictions=predictions,
            detected_classes=detected_classes,
            signal_info=signal_preview,
            inference_time_ms=round(inference_time, 2),
            disclaimer=DISCLAIMER_TEXT
        )

# Global singleton
model_manager = ModelManager()
