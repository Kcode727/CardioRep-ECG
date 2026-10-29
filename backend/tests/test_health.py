from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "documentation" in data
    assert "health" in data

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "device" in data
    assert data["artifacts_found"] is True
    assert data["results_found"] is True
    assert data["available_models_count"] == 4
    assert "best_model_100pct" in data["available_models"]
