from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_run_history_can_retrieve_a_created_run() -> None:
    created = client.post("/api/v1/runs", json={"question": "Explain Bayes theorem", "domain": "statistics"}).json()
    history = client.get("/api/v1/runs")
    detail = client.get(f"/api/v1/runs/{created['run_id']}")

    assert history.status_code == 200
    assert history.json()[0]["run_id"] == created["run_id"]
    assert detail.json()["answer"] == created["answer"]


def test_ingested_document_is_searchable() -> None:
    ingest = client.post("/api/v1/documents", json={"title": "Central limit theorem", "source": "Statistics notes", "text": "The central limit theorem describes the normal approximation for sample means.", "kind": "theorem"})
    results = client.post("/api/v1/search", json={"query": "central limit theorem", "limit": 3})

    assert ingest.status_code == 200
    assert ingest.json()["status"] == "indexed"
    assert results.json()["results"][0]["title"] == "Central limit theorem"


def test_evaluation_reports_pass_rate() -> None:
    response = client.post("/api/v1/evaluations", json=[{"id": "bayes-1", "question": "Explain Bayes theorem", "domain": "statistics", "required_terms": ["Bayes theorem"]}])

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["pass_rate"] == 1
