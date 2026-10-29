from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_models():
    response = client.get("/api/models")
    assert response.status_code == 200
    models = response.json()
    assert len(models) == 4

    ids = [m["id"] for m in models]
    assert "best_model_10pct" in ids
    assert "best_model_25pct" in ids
    assert "best_model_50pct" in ids
    assert "best_model_100pct" in ids

    for m in models:
        assert "architecture" in m
        assert "labeled_fraction" in m
        assert "n_labeled" in m
        assert "thresholds" in m
        assert len(m["targets"]) == 5
        assert set(m["targets"]) == {"NORM", "MI", "STTC", "CD", "HYP"}
        for t in m["targets"]:
            assert t in m["thresholds"]
            assert 0.0 < m["thresholds"][t] < 1.0
