from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.models.schemas import DocumentRequest, EvaluationCase, EvaluationResponse, QueryRequest, QueryResponse, RunSummary, SearchRequest, SearchResponse
from app.services.engine import AgenticEngine
from app.services.evaluation import EvaluationService
from app.services.ingestion import normalize_document
from app.services.store import RunStore

settings = get_settings()
app = FastAPI(title="LogiScope-Agent API", version="0.1.0", description="Agentic retrieval and mathematical verification API")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
engine = AgenticEngine()
run_store = RunStore()
evaluation_service = EvaluationService(engine)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env, "engine": "local"}


@app.get("/api/v1/corpus")
def corpus() -> dict[str, object]:
    return {"count": len(engine.corpus), "mode": "local", "message": "Connect Qdrant and Neo4j to replace the bundled demonstration corpus."}


@app.post("/api/v1/runs", response_model=QueryResponse)
def create_run(request: QueryRequest) -> QueryResponse:
    return run_store.add(engine.run(request))


@app.get("/api/v1/runs", response_model=list[RunSummary])
def list_runs(limit: int = 20) -> list[RunSummary]:
    return [RunSummary(run_id=run.run_id, question=run.question, closure=run.closure, confidence=run.confidence, latency_ms=run.latency_ms) for run in run_store.list(max(1, min(limit, 100)))]


@app.get("/api/v1/runs/{run_id}", response_model=QueryResponse)
def get_run(run_id: str) -> QueryResponse:
    run = run_store.get(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@app.post("/api/v1/search", response_model=SearchResponse)
def search(request: SearchRequest) -> SearchResponse:
    return SearchResponse(query=request.query, results=engine.search(request.query, request.limit))


@app.post("/api/v1/documents")
def ingest_document(request: DocumentRequest) -> dict[str, object]:
    document = normalize_document(request.title, request.source, request.text, request.kind)
    engine.add_document(document)
    return {"id": document.id, "title": document.title, "tags": document.tags, "status": "indexed", "mode": "local"}


@app.post("/api/v1/evaluations", response_model=EvaluationResponse)
def evaluate(cases: list[EvaluationCase]) -> EvaluationResponse:
    return evaluation_service.run(cases)
