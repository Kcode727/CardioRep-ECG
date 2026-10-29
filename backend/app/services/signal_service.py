import io
import numpy as np
import pandas as pd
from fastapi import HTTPException, UploadFile
from backend.app.core.config import (
    STANDARD_LEADS,
    EXPECTED_SAMPLE_RATE,
    EXPECTED_SIGNAL_LENGTH,
    EXPECTED_LEADS_COUNT,
    settings
)
from backend.app.schemas.ecg import SignalPreview, LeadSummary

# Common alias mapping for leads (case-insensitive)
LEAD_ALIASES = {
    "i": "I",
    "ii": "II",
    "iii": "III",
    "avr": "aVR",
    "avl": "aVL",
    "avf": "aVF",
    "v1": "V1",
    "v2": "V2",
    "v3": "V3",
    "v4": "V4",
    "v5": "V5",
    "v6": "V6"
}

def parse_and_validate_ecg(file_bytes: bytes, filename: str) -> np.ndarray:
    """
    Parses and validates an uploaded ECG file (CSV or NPY).
    Returns a numpy array of shape (12, 1000) float32.
    Raises HTTPException(400) with clear descriptive error messages for any validation failure.
    """
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds the 10 MB limit.")

    fname = filename.lower()

    if fname.endswith(".csv") or fname.endswith(".txt"):
        try:
            # Read CSV content
            bio = io.BytesIO(file_bytes)
            # Try reading with header
            df = pd.read_csv(bio)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Malformed CSV file. Could not parse table data: {str(e)}"
            )

        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file contains no data.")

        # Check column headers for standard leads
        cols_lower = [str(c).strip().lower() for c in df.columns]
        matched_aliases = [LEAD_ALIASES.get(c) for c in cols_lower]

        if all(alias is not None for alias in matched_aliases) and len(matched_aliases) == EXPECTED_LEADS_COUNT:
            # Reorder columns to standard lead order
            df_reordered = pd.DataFrame()
            for std_lead in STANDARD_LEADS:
                matched_idx = matched_aliases.index(std_lead)
                orig_col = df.columns[matched_idx]
                df_reordered[std_lead] = df[orig_col]

            if len(df_reordered) != EXPECTED_SIGNAL_LENGTH:
                raise HTTPException(
                    status_code=400,
                    detail=f"Expected {EXPECTED_SIGNAL_LENGTH} samples (rows) for 10 seconds at 100 Hz, but found {len(df_reordered)} rows."
                )

            data = df_reordered.to_numpy().T  # (12, 1000)

        elif df.shape == (EXPECTED_SIGNAL_LENGTH, EXPECTED_LEADS_COUNT):
            # 1000 rows x 12 cols without standard column names, assume standard order
            data = df.to_numpy().T

        elif df.shape == (EXPECTED_LEADS_COUNT, EXPECTED_SIGNAL_LENGTH):
            # 12 rows x 1000 cols
            data = df.to_numpy()

        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid signal dimensions. Found shape ({df.shape[0]}, {df.shape[1]}). "
                    f"Expected either 1,000 samples × 12 leads (CSV with 1000 rows and 12 columns) "
                    f"or 12 leads × 1,000 samples. "
                    f"Accepted leads: {', '.join(STANDARD_LEADS)}."
                )
            )

    elif fname.endswith(".npy"):
        try:
            bio = io.BytesIO(file_bytes)
            data = np.load(bio, allow_pickle=False)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not load NumPy array from file: {str(e)}"
            )

        if data.ndim != 2:
            raise HTTPException(
                status_code=400,
                detail=f"Expected a 2-dimensional array, but received an array with {data.ndim} dimensions."
            )

        if data.shape == (EXPECTED_SIGNAL_LENGTH, EXPECTED_LEADS_COUNT):
            data = data.T  # (12, 1000)
        elif data.shape == (EXPECTED_LEADS_COUNT, EXPECTED_SIGNAL_LENGTH):
            pass  # Already (12, 1000)
        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid NumPy array shape: {data.shape}. "
                    f"Expected shape (12, 1000) or (1000, 12)."
                )
            )

    else:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file format '{filename}'. "
                f"Please upload a 12-lead ECG file in .csv or .npy format."
            )
        )

    # Convert to float32 and validate numerical integrity
    try:
        arr = np.asarray(data, dtype=np.float32)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail="File contains non-numeric values. All signal entries must be valid floating-point numbers."
        )

    if np.isnan(arr).any():
        raise HTTPException(
            status_code=400,
            detail="Signal data contains NaN (Not a Number) values. Incomplete or corrupted signals cannot be evaluated."
        )

    if np.isinf(arr).any():
        raise HTTPException(
            status_code=400,
            detail="Signal data contains infinite (Inf) values. Please check sensor clipping or scaling."
        )

    # Sanity check on voltage magnitude: clinical ECG typically ranges -10 mV to +10 mV
    abs_max = np.abs(arr).max()
    if abs_max > 50.0:
        raise HTTPException(
            status_code=400,
            detail=f"Extreme amplitude detected (max |amplitude| = {abs_max:.1f} mV). Expected signal calibrated in millivolts (mV)."
        )

    return arr


def build_signal_preview(signal: np.ndarray, downsample_to: int = 500) -> SignalPreview:
    """
    Computes summary statistics and downsampled waveform points for UI rendering.
    signal shape: (12, 1000)
    """
    lead_summaries = []
    waveform_preview = {}

    # Downsampling index
    step = max(1, EXPECTED_SIGNAL_LENGTH // downsample_to)
    indices = np.arange(0, EXPECTED_SIGNAL_LENGTH, step)

    for i, lead_name in enumerate(STANDARD_LEADS):
        lead_series = signal[i]
        lead_summaries.append(
            LeadSummary(
                lead=lead_name,
                mean=float(np.mean(lead_series)),
                std=float(np.std(lead_series)),
                min=float(np.min(lead_series)),
                max=float(np.max(lead_series))
            )
        )
        # Round preview to 4 decimal places for compact JSON payload
        preview_vals = [round(float(v), 4) for v in lead_series[indices]]
        waveform_preview[lead_name] = preview_vals

    return SignalPreview(
        num_leads=EXPECTED_LEADS_COUNT,
        num_samples=EXPECTED_SIGNAL_LENGTH,
        duration_seconds=float(EXPECTED_SIGNAL_LENGTH / EXPECTED_SAMPLE_RATE),
        sampling_rate_hz=EXPECTED_SAMPLE_RATE,
        leads=STANDARD_LEADS,
        lead_summaries=lead_summaries,
        waveform_preview=waveform_preview
    )
