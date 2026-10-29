# CardioRep ECG: Cardiac Abnormality Classification Using Deep Learning

A full-stack, research-oriented machine learning web application investigating whether **unsupervised representation learning** (Autoencoders and Variational Autoencoders) improves multi-label **12-lead electrocardiogram (ECG)** classification when labeled clinical training data is severely limited.

> **Disclaimer:** This software is an **academic research prototype**, not a medical diagnostic product or clinical decision support system. It has not been approved or cleared by the FDA, CE, or any regulatory body.

---

## 1. Research Overview

The project investigates multi-label classification across five diagnostic superclasses defined by the **PTB-XL** database:
- **NORM:** Normal ECG
- **MI:** Myocardial Infarction
- **STTC:** ST/T Changes
- **CD:** Conduction Disturbance
- **HYP:** Hypertrophy

### Model Architectures Compared
1. **Baseline 1D CNN:** Supervised classifier trained from scratch on labeled ECG signals with random weight initialization.
2. **Autoencoder-Pretrained CNN (AE-CNN):** Encoder pretrained on unlabeled ECG reconstruction (Mean Squared Error) before supervised fine-tuning.
3. **Variational Autoencoder-Pretrained CNN (VAE-CNN):** Encoder pretrained on probabilistic latent representations optimizing the Evidence Lower Bound (ELBO) before supervised fine-tuning.

### Training Data Fractions Evaluated
All models were benchmarked across four labeled training data fractions sampled from the training partition:
- **10%** (350 labeled records)
- **25%** (875 labeled records)
- **50%** (1,750 labeled records)
- **100%** (3,500 labeled records)

### Empirical Research Findings
| Labeled Training Fraction | Baseline CNN | AE-CNN | VAE-CNN | Winning Approach |
|:---:|:---:|:---:|:---:|:---:|
| **10%** | 0.510 | 0.487 | **0.529** | **VAE-CNN** |
| **25%** | **0.590** | 0.535 | 0.544 | **Baseline CNN** |
| **50%** | 0.624 | **0.626** | 0.581 | **AE-CNN** |
| **100%** | 0.659 | **0.666** | 0.658 | **AE-CNN** |

> **Key Research Insight:** Pretraining does **not** uniformly outperform the baseline supervised CNN across all fractions. VAE pretraining demonstrates sample efficiency primarily in extreme data-scarce regimes (10%), while supervised training from scratch recovers strongly at 25%, and AE pretraining provides modest gains at 50% and 100%.

---

## 2. Dataset & Limitations Disclosure

- **Source Dataset:** PTB-XL database (PhysioNet v1.0.3), 100 Hz recordings.
- **Incomplete Download Limitation:** The experiments were conducted on a locally available subset of **5,037 records** (rather than the complete 21,837-record archive).
- **Patient-Separated Folds:** Folds 1–8 (3,500 records) were used for training and unsupervised pretraining; Fold 9 (500 records) for validation early stopping and threshold tuning; Fold 10 (500 records) for final held-out test reporting.
- **Single-Run Results:** The reported metrics are preliminary single-run evaluation results from the available subset and should not be claimed as complete-dataset benchmarks.

---

## 3. Project Structure

```
d:\K\DL\
├── README.md                           # Master project documentation
├── .gitignore                          # Git ignore rules
├── .env.example                        # Environment variables template
├── artifacts/
│   ├── README.md                       # Model artifact placement guide
│   └── models/                         # PyTorch model checkpoints (.pt)
│       ├── best_model_10pct.pt         # VAE-CNN (10% labeled data)
│       ├── best_model_25pct.pt         # Baseline CNN (25% labeled data)
│       ├── best_model_50pct.pt         # AE-CNN (50% labeled data)
│       └── best_model_100pct.pt        # AE-CNN (100% labeled data)
├── results/
│   └── experiment_results.csv          # Exact 12-run experimental metrics
├── docs/
│   ├── methodology.md                  # Comprehensive scientific methodology
│   └── model_card.md                   # Standardized AI model card
├── sample_data/
│   ├── generate_samples.py             # Synthetic 12-lead ECG generator
│   ├── sample_normal_ecg.csv           # Normal sinus rhythm sample (CSV)
│   ├── sample_mi_ecg.csv               # Acute MI pattern sample (CSV)
│   ├── sample_cd_ecg.csv               # Conduction disturbance sample (CSV)
│   └── sample_normal_ecg.npy           # Normal sinus rhythm sample (NumPy)
├── backend/
│   ├── requirements.txt                # Python backend dependencies
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint
│   │   ├── core/config.py              # Application settings and paths
│   │   ├── models/ecg_classifier.py    # PyTorch ECGEncoder & ECGClassifier
│   │   ├── schemas/ecg.py              # Pydantic response/request models
│   │   ├── services/
│   │   │   ├── model_service.py        # Model loading, caching & inference
│   │   │   └── signal_service.py       # Signal validation & waveform preview
│   │   └── api/routes.py               # REST API endpoints
│   └── tests/
│       ├── test_health.py              # Health check tests
│       ├── test_models.py              # Model metadata tests
│       ├── test_experiments.py         # Results matrix verification tests
│       └── test_predict.py             # Inference & input validation tests
└── frontend/
    ├── package.json                    # React & Vite dependencies
    ├── vite.config.ts                  # Vite config with backend proxy
    ├── index.html                      # HTML entrypoint
    └── src/
        ├── App.tsx                     # Main application container
        ├── main.tsx                    # React DOM root
        ├── index.css                   # Tailwind CSS & ECG grid styling
        ├── types/api.ts                # TypeScript API contracts
        ├── services/api.ts             # API client service layer
        ├── components/
        │   ├── Navbar.tsx              # Top navigation bar
        │   ├── Footer.tsx              # Research footer
        │   ├── DisclaimerBanner.tsx    # Non-clinical warning banner
        │   ├── LeadWaveformPlot.tsx    # SVG ECG single-lead visualizer
        │   ├── TwelveLeadGrid.tsx      # Standard 12-lead clinical grid
        │   ├── ComparisonLineChart.tsx # Metric vs. Fraction line chart
        │   └── MetricBarChart.tsx      # Per-class F1 grouped bar chart
        └── pages/
            ├── ResearchOverviewPage.tsx# Page A: Research overview
            ├── ModelComparisonPage.tsx # Page B: Results & comparisons
            ├── EcgAnalysisPage.tsx     # Page C: Interactive inference workbench
            └── MethodologyPage.tsx     # Page D: Methodology & limitations
```

---

## 4. Setup and Execution Instructions

### Prerequisites
- **Python 3.10+** (tested on Python 3.11)
- **Node.js v18+** and **npm** (tested on Node v24.21.0, npm 11.19.0)
- **PyTorch 2.x** (CPU inference supported; CUDA optional)

---

### Step 1: Backend Setup & Execution

1. Navigate to the project root:
   ```bash
   cd d:\K\DL
   ```

2. Install Python dependencies:
   ```bash
   python -m pip install -r backend/requirements.txt
   ```

3. Run automated tests to verify model loading and validation:
   ```bash
   python -m pytest backend/tests/ -v
   ```
   *(Expected output: 10 passed)*

4. Start the FastAPI backend server:
   ```bash
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

5. Verify backend health:
   - Interactive OpenAPI documentation: [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
   - Health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Step 2: Frontend Setup & Execution

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd d:\K\DL\frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   # On Windows PowerShell where script execution is restricted:
   # npm.cmd install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   # or: npm.cmd run dev
   ```

4. Open your browser and navigate to:
   [http://localhost:5173](http://localhost:5173)

---

## 5. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, PyTorch hardware device, and loaded artifacts count |
| `GET` | `/api/models` | List of available trained checkpoints and decision thresholds |
| `GET` | `/api/experiments` | Full 12-run experimental metrics loaded dynamically from CSV |
| `GET` | `/api/samples` | List of preloaded synthetic 12-lead ECG test signals |
| `GET` | `/api/samples/{id}/preview` | Waveform coordinates and summary statistics for a sample |
| `POST` | `/api/predict` | Multipart upload of `.csv` or `.npy` signal for real PyTorch inference |
| `POST` | `/api/predict-sample/{id}` | Execute inference on a preloaded sample signal |
| `GET` | `/api/docs` | Interactive Swagger / OpenAPI documentation |

---

## 6. Accepted Input Signal Specifications

The inference engine strictly requires signals compatible with the PTB-XL training pipeline:
- **Duration:** 10.0 seconds
- **Sampling Frequency:** 100 Hz (1,000 samples per lead)
- **Leads:** 12 leads (`I, II, III, aVR, aVL, aVF, V1, V2, V3, V4, V5, V6`)
- **Accepted Formats:**
  1. `.csv`: Table with 1,000 rows and 12 lead columns (with lead name headers).
  2. `.npy`: 2D NumPy array of shape `(12, 1000)` or `(1000, 12)` float32.
- **Validation:** Files with missing columns, improper shape, NaN values, infinite values, or excessive amplitudes are rejected with clear 400 Bad Request explanations.

---

## 7. Artifact Inventory & Missing Files Report

### Discovered & Validated Artifacts
- `artifacts/models/best_model_10pct.pt` (VAE-CNN checkpoint, 10% labeled fraction)
- `artifacts/models/best_model_25pct.pt` (Baseline CNN checkpoint, 25% labeled fraction)
- `artifacts/models/best_model_50pct.pt` (AE-CNN checkpoint, 50% labeled fraction)
- `artifacts/models/best_model_100pct.pt` (AE-CNN checkpoint, 100% labeled fraction)
- `results/experiment_results.csv` (Full 12-run metrics matrix)

### Missing Files / Artifacts Identified
1. **Losing Checkpoints at Each Fraction:** In the training notebook (Cell 32), only the **single best model** per fraction was saved to disk based on validation F1. The non-winning checkpoints (e.g. CNN-10%, AE-10%, VAE-25%, CNN-50%, VAE-50%, CNN-100%, VAE-100%) were not exported to the ZIP archive. Their metrics are fully preserved in `results/experiment_results.csv`, but their binary `.pt` weights are missing from the supplied archive.
2. **Complete PTB-XL Dataset:** As documented, the initial download was interrupted, yielding 5,037 local records instead of the complete 21,837-record archive.
