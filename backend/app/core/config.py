import os
from pathlib import Path
from dataclasses import dataclass, field

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts" / "models"
RESULTS_FILE = BASE_DIR / "results" / "experiment_results.csv"
SAMPLES_DIR = BASE_DIR / "sample_data"

# Standard PTB-XL configurations
TARGETS = ["NORM", "MI", "STTC", "CD", "HYP"]
TARGET_DESCRIPTIONS = {
    "NORM": "Normal ECG: Absence of clinically significant cardiac pathology",
    "MI": "Myocardial Infarction: Ischemic myocardial necrosis / acute or prior infarction",
    "STTC": "ST/T Change: Non-specific or ischemic ST-segment or T-wave alterations",
    "CD": "Conduction Disturbance: Intraventricular conduction delay or bundle branch block",
    "HYP": "Hypertrophy: Left or right ventricular wall hypertrophy / atrial enlargement"
}

STANDARD_LEADS = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"]
EXPECTED_SAMPLE_RATE = 100  # Hz
EXPECTED_SIGNAL_LENGTH = 1000  # 10 seconds @ 100 Hz
EXPECTED_LEADS_COUNT = 12

@dataclass
class Settings:
    PROJECT_NAME: str = "ECG Cardiac Abnormality Classification API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1")
    CORS_ORIGINS: list[str] = field(default_factory=lambda: [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ])
    ARTIFACTS_DIR: Path = ARTIFACTS_DIR
    RESULTS_FILE: Path = RESULTS_FILE
    SAMPLES_DIR: Path = SAMPLES_DIR

settings = Settings()
