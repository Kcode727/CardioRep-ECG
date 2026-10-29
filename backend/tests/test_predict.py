import io
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_predict_sample_endpoint():
    response = client.post(
        "/api/predict-sample/normal-sinus",
        data={"model_id": "best_model_100pct"}
    )
    assert response.status_code == 200
    res = response.json()
    assert res["model_id"] == "best_model_100pct"
    assert len(res["predictions"]) == 5
    for p in res["predictions"]:
        assert 0.0 <= p["score"] <= 1.0
        assert isinstance(p["predicted_positive"], bool)
    assert "signal_info" in res
    assert res["signal_info"]["num_leads"] == 12
    assert res["signal_info"]["num_samples"] == 1000

def test_predict_csv_upload():
    # Create valid synthetic 1000x12 CSV in memory
    cols = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"]
    arr = np.random.randn(1000, 12).astype(np.float32)
    df = pd.DataFrame(arr, columns=cols)
    csv_bytes = df.to_csv(index=False).encode("utf-8")

    response = client.post(
        "/api/predict",
        files={"file": ("test_signal.csv", csv_bytes, "text/csv")},
        data={"model_id": "best_model_25pct"}
    )
    assert response.status_code == 200
    res = response.json()
    assert res["model_id"] == "best_model_25pct"
    assert len(res["predictions"]) == 5
    assert len(res["signal_info"]["leads"]) == 12

def test_predict_npy_upload():
    # Create valid 12x1000 numpy array in memory
    arr = np.random.randn(12, 1000).astype(np.float32)
    bio = io.BytesIO()
    np.save(bio, arr)
    bio.seek(0)

    response = client.post(
        "/api/predict",
        files={"file": ("test_signal.npy", bio.read(), "application/octet-stream")},
        data={"model_id": "best_model_50pct"}
    )
    assert response.status_code == 200
    res = response.json()
    assert res["model_id"] == "best_model_50pct"

def test_predict_invalid_model_id():
    arr = np.random.randn(1000, 12).astype(np.float32)
    bio = io.BytesIO()
    np.save(bio, arr)
    bio.seek(0)

    response = client.post(
        "/api/predict",
        files={"file": ("test.npy", bio.read(), "application/octet-stream")},
        data={"model_id": "non_existent_model"}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_predict_invalid_dimensions():
    # Only 500 samples instead of 1000
    arr = np.random.randn(500, 12).astype(np.float32)
    bio = io.BytesIO()
    np.save(bio, arr)
    bio.seek(0)

    response = client.post(
        "/api/predict",
        files={"file": ("short.npy", bio.read(), "application/octet-stream")},
        data={"model_id": "best_model_100pct"}
    )
    assert response.status_code == 400
    assert "dimensions" in response.json()["detail"].lower() or "shape" in response.json()["detail"].lower()

def test_predict_nan_values():
    arr = np.random.randn(1000, 12).astype(np.float32)
    arr[10, 2] = np.nan
    bio = io.BytesIO()
    np.save(bio, arr)
    bio.seek(0)

    response = client.post(
        "/api/predict",
        files={"file": ("nan.npy", bio.read(), "application/octet-stream")},
        data={"model_id": "best_model_100pct"}
    )
    assert response.status_code == 400
    assert "nan" in response.json()["detail"].lower()
