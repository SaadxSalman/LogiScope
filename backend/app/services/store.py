from __future__ import annotations

from collections import deque
from threading import Lock

from app.models.schemas import QueryResponse


class RunStore:
    """Small thread-safe repository used by the local mode.

    The interface is intentionally storage-agnostic so it can be replaced by
    Redis or Postgres without changing the HTTP layer.
    """

    def __init__(self, max_runs: int = 100) -> None:
        self._runs: deque[QueryResponse] = deque(maxlen=max_runs)
        self._lock = Lock()

    def add(self, run: QueryResponse) -> QueryResponse:
        with self._lock:
            self._runs.appendleft(run)
        return run

    def get(self, run_id: str) -> QueryResponse | None:
        with self._lock:
            return next((run for run in self._runs if run.run_id == run_id), None)

    def list(self, limit: int = 20) -> list[QueryResponse]:
        with self._lock:
            return list(self._runs)[:limit]
