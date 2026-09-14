from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_run_returns_grounded_trace() -> None:
    response = client.post("/api/v1/runs", json={"question": "Explain Bayes theorem and verify the equation", "domain": "statistics"})
    body = response.json()
    assert response.status_code == 200
    assert body["confidence"] > 0
    assert len(body["evidence"]) >= 1
    assert any(event["node"] == "sandbox_verifier" for event in body["trace"])
