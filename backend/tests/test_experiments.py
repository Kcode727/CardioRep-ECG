from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_experiments():
    response = client.get("/api/experiments")
    assert response.status_code == 200
    data = response.json()
    assert data["total_experiments"] == 12
    assert len(data["results"]) == 12
    assert "dataset_limitation" in data
    assert "best_per_fraction" in data

    # Check that CNN, AE, and VAE are all represented
    model_types = {r["model_type"] for r in data["results"]}
    assert "CNN" in model_types
    assert "AE" in model_types
    assert "VAE" in model_types

    # Check fractions
    fractions = {r["labeled_fraction"] for r in data["results"]}
    assert fractions == {0.10, 0.25, 0.50, 1.00}

    # Verify NORM, MI, STTC, CD, HYP columns
    for r in data["results"]:
        assert "F1_NORM" in r
        assert "F1_MI" in r
        assert "F1_STTC" in r
        assert "F1_CD" in r
        assert "F1_HYP" in r
        assert 0.0 <= r["macro_f1"] <= 1.0
        assert 0.0 <= r["val_macro_f1"] <= 1.0
