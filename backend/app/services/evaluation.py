from __future__ import annotations

from dataclasses import dataclass

from app.models.schemas import EvaluationCase, EvaluationResponse, QueryRequest
from app.services.engine import AgenticEngine


@dataclass(frozen=True)
class EvaluationResult:
    case_id: str
    passed: bool
    confidence: float
    closure: str
    note: str


class EvaluationService:
    def __init__(self, engine: AgenticEngine) -> None:
        self.engine = engine

    def run(self, cases: list[EvaluationCase]) -> EvaluationResponse:
        results: list[EvaluationResult] = []
        for case in cases:
            response = self.engine.run(QueryRequest(question=case.question, domain=case.domain))
            matched = all(term.lower() in response.answer.lower() for term in case.required_terms)
            results.append(EvaluationResult(case.id, matched, response.confidence, response.closure, "Required terms grounded" if matched else "Required terms missing from synthesis"))
        passed = sum(result.passed for result in results)
        return EvaluationResponse(total=len(results), passed=passed, pass_rate=round(passed / len(results), 3) if results else 0, results=[result.__dict__ for result in results])
