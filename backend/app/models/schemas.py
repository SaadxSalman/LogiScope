from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(min_length=3, max_length=4000)
    domain: Literal["mathematics", "statistics", "logic", "general"] = "mathematics"
    max_hops: int = Field(default=3, ge=1, le=6)
    execute_checks: bool = True


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=1000)
    limit: int = Field(default=5, ge=1, le=20)


class DocumentRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    source: str = Field(min_length=2, max_length=300)
    text: str = Field(min_length=20, max_length=20000)
    kind: Literal["axiom", "theorem", "dataset", "paper", "derivation"] = "paper"


class EvaluationCase(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    question: str = Field(min_length=3, max_length=4000)
    domain: Literal["mathematics", "statistics", "logic", "general"] = "general"
    required_terms: list[str] = Field(default_factory=list)


class Evidence(BaseModel):
    id: str
    title: str
    source: str
    excerpt: str
    score: float
    kind: Literal["axiom", "theorem", "dataset", "paper", "derivation"]


class CheckResult(BaseModel):
    name: str
    status: Literal["passed", "warning", "failed"]
    detail: str
    runtime_ms: int


class TraceEvent(BaseModel):
    node: str
    status: Literal["complete", "active", "skipped"]
    detail: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class QueryResponse(BaseModel):
    run_id: str = Field(default_factory=lambda: f"run_{uuid4().hex[:10]}")
    question: str
    answer: str
    confidence: float
    closure: Literal["proven", "conditional", "needs-review"]
    evidence: list[Evidence]
    checks: list[CheckResult]
    trace: list[TraceEvent]
    generated_code: str
    latency_ms: int


class RunSummary(BaseModel):
    run_id: str
    question: str
    closure: str
    confidence: float
    latency_ms: int


class SearchResult(BaseModel):
    id: str
    title: str
    source: str
    excerpt: str
    score: float
    kind: str


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]


class EvaluationResponse(BaseModel):
    total: int
    passed: int
    pass_rate: float
    results: list[dict[str, object]]
