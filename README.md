# LogiScope-Agent

LogiScope-Agent is a local-first full-stack workspace for evidence-grounded mathematical reasoning. It turns a research question into an inspectable control loop: retrieve relevant premises, draft a response, run deterministic consistency checks, reflect on the result, and classify whether the answer reaches logical closure.

The repository contains a FastAPI backend and a Next.js 15 frontend. The default experience is deliberately useful without cloud credentials or infrastructure. A small bundled corpus demonstrates the complete workflow locally. Qdrant, Neo4j, Redis, and Phoenix are available through Docker Compose when you are ready to replace those local adapters with production services.

## Why this project exists

Traditional retrieval-augmented generation tends to hide its work behind a single retrieve-then-generate call. That is a poor fit for proof-heavy or statistical questions, where a plausible paragraph is not enough. LogiScope treats retrieval as an active reasoning process.

A run exposes:

- The original research question and selected domain.
- The evidence selected by the retrieval stage.
- A generated verification plan.
- Deterministic premise, symbolic, and grounding checks.
- A node-by-node trace of the control loop.
- A confidence score and a closure classification.

The current local engine is intentionally deterministic. That makes the product easy to test, easy to demo, and honest about where external model and data integrations still need to be connected.

## Product capabilities

### Investigation console

The frontend is a compact research workspace rather than a marketing page. It provides:

- A question composer with domain selection.
- A single action that calls the agent API.
- Loading and error states for unavailable APIs.
- A synthesis panel with latency and confidence.
- Closure status: `proven` or `conditional`.
- Evidence cards with source, kind, excerpt, and relevance score.
- A control-loop trace for auditability.
- Sandbox check results with runtime values.
- An expandable generated verification plan.
- Responsive behavior for desktop and mobile widths.

### Agentic control loop

The backend currently models the following nodes:

1. `intake`: normalize the question and domain.
2. `hybrid_retrieval`: score the local corpus using lexical overlap and structural tags.
3. `sandbox_verifier`: run deterministic consistency checks.
4. `reflection`: compare the draft to retrieved premises and checks.
5. `closure`: classify the outcome and calculate confidence.

The implementation is intentionally expressed as small service methods so it can be replaced by LangGraph nodes without changing the HTTP contract.

### Local corpus

The included demonstration corpus contains examples for:

- Pythagorean theorem.
- Bayes theorem.
- Law of total variance.
- Modus ponens.
- A retrieval ablation benchmark.

This is not intended to be a scientific source of truth. It is a test fixture and a working UI seed. Replace it with a real ingestion and indexing pipeline before using the system for research or operational decisions.

## Architecture

```text
Browser (Next.js)
       |
       | POST /api/v1/runs
       v
FastAPI API
       |
       +--> AgenticEngine
       |       +--> intake
       |       +--> local hybrid retrieval
       |       +--> deterministic verifier
       |       +--> reflection + closure
       |
       +--> future adapters
               +--> Qdrant dense vectors
               +--> BM25 / sparse index
               +--> Neo4j knowledge graph
               +--> Redis + Celery execution queue
               +--> Phoenix / OpenInference traces
```

### Backend layout

- `backend/app/main.py`: FastAPI application, CORS, health route, and run route.
- `backend/app/core/config.py`: environment-backed settings.
- `backend/app/models/schemas.py`: request and response contracts.
- `backend/app/services/engine.py`: local retrieval, verification, trace, and response synthesis.
- `backend/tests/test_api.py`: focused API behavior tests.
- `backend/Dockerfile`: production API image.

### Frontend layout

- `frontend/app/page.tsx`: application entry point.
- `frontend/app/layout.tsx`: metadata and global shell.
- `frontend/app/globals.css`: visual system and responsive layout.
- `frontend/components/console.tsx`: investigation interaction and report rendering.
- `frontend/Dockerfile`: multi-stage production image.

## Requirements

For the local development path:

- Python 3.12 or newer.
- Node.js 20 or newer.
- npm 10 or newer.
- Git.

Docker is optional. It is only needed for Qdrant, Neo4j, Redis, and Phoenix.

## Configuration

All important configuration is centralized in the root `.env` file. It is ignored by Git and is intentionally not accompanied by an `.env.example` file.

The included values are safe local defaults and blank provider keys. Edit the file for your environment:

| Variable | Purpose | Local default |
| --- | --- | --- |
| `APP_ENV` | Backend environment label | `development` |
| `API_HOST` | FastAPI bind host | `0.0.0.0` |
| `API_PORT` | FastAPI port | `8000` |
| `FRONTEND_ORIGIN` | Allowed browser origin | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | URL used by the browser | `http://localhost:8000` |
| `LLM_PROVIDER` | Model adapter selection | `local` |
| `LLM_MODEL` | Model name passed to an adapter | `local-reasoning` |
| `OPENAI_API_KEY` | Optional OpenAI credential | blank |
| `ANTHROPIC_API_KEY` | Optional Anthropic credential | blank |
| `REDIS_URL` | Celery and queue broker | `redis://localhost:6379/0` |
| `QDRANT_URL` | Vector database URL | `http://localhost:6333` |
| `QDRANT_API_KEY` | Optional Qdrant credential | blank |
| `NEO4J_URI` | Knowledge graph URI | `bolt://localhost:7687` |
| `NEO4J_USERNAME` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | `change-me` |
| `PHOENIX_ENDPOINT` | Phoenix collector/UI endpoint | `http://localhost:6006` |
| `SANDBOX_TIMEOUT_SECONDS` | Maximum code execution budget | `5` |
| `MAX_RETRIEVAL_HOPS` | Default graph/retrieval hop limit | `3` |

Never commit `.env`, real provider keys, database passwords, or exported traces. Rotate any credential that was exposed outside your secret manager.

## Run locally

### 1. Start the API

From the repository root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Open `http://localhost:8000/docs` for the generated OpenAPI explorer.

### 2. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

If the frontend needs to call an API on another host, update `NEXT_PUBLIC_API_URL` in the root `.env` before starting Next.js. Next.js reads public environment values when the dev server starts, so restart it after changing that value.

### 3. Run the test suite

The backend test configuration is rooted at the backend package:

```powershell
cd backend
pytest -q
```

Build the frontend exactly as CI or a deployment pipeline would:

```powershell
cd frontend
npm run build
```

## Run supporting infrastructure

Start the optional local services:

```powershell
docker compose up -d redis qdrant neo4j phoenix
```

Service endpoints:

- Redis: `localhost:6379`
- Qdrant: `http://localhost:6333/dashboard`
- Neo4j browser: `http://localhost:7474`
- Phoenix: `http://localhost:6006`

Neo4j starts with the credentials configured in `docker-compose.yml` and mirrored in `.env`. Change both values for any shared environment.

The current `AgenticEngine` still uses the bundled corpus. Infrastructure availability alone does not switch the engine to external adapters; that boundary is intentionally explicit for the next integration step.

## API reference

### `GET /health`

Returns a small liveness response:

```json
{
  "status": "ok",
  "environment": "development",
  "engine": "local"
}
```

### `GET /api/v1/corpus`

Returns the active corpus mode and count. This is useful for displaying adapter state in a future admin surface.

### `POST /api/v1/runs`

Request body:

```json
{
  "question": "Can you verify Bayes theorem and explain the assumptions?",
  "domain": "statistics",
  "max_hops": 3,
  "execute_checks": true
}
```

Supported domains are `mathematics`, `statistics`, `logic`, and `general`. `question` must contain between 3 and 4000 characters. `max_hops` is bounded from 1 through 6.

A response includes `run_id`, `answer`, `confidence`, `closure`, `evidence`, `checks`, `trace`, `generated_code`, and `latency_ms`. The frontend consumes this response directly; keeping the contract stable makes it possible to replace the local engine with a queued LangGraph run later.

Example PowerShell request:

```powershell
$body = @{ question = 'Explain Bayes theorem'; domain = 'statistics'; max_hops = 3; execute_checks = $true } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/api/v1/runs -Method Post -ContentType 'application/json' -Body $body
```

## Security model and sandbox boundary

The local demonstration engine does not execute arbitrary user code. It creates a generated verification plan as text and runs only deterministic checks implemented by the service.

A production implementation must preserve that boundary. Recommended controls for a real statistical or symbolic worker include:

- Run the worker in a separate container or microVM with no host filesystem access.
- Use a non-root user and a read-only root filesystem.
- Apply CPU, memory, process-count, and wall-clock limits.
- Disable network access by default.
- Mount only a temporary working directory.
- Allowlist imports such as SymPy, SciPy, pandas, statsmodels, and z3-solver.
- Parse code into an AST before execution and reject filesystem, process, socket, reflection, and dynamic import operations.
- Kill the worker on timeout and discard its writable layer.
- Store source provenance and verifier output with each run.
- Treat all retrieved documents as untrusted input.

`RestrictedPython` is useful as one layer, not as a complete isolation boundary. Use operating-system isolation as the security control and language restrictions as defense in depth.

## Roadmap

### Retrieval

- Add document ingestion for Markdown, PDF, HTML, and structured datasets.
- Generate embeddings and write named Qdrant collections.
- Add BM25 or Tantivy sparse retrieval and reciprocal-rank fusion.
- Model entities, definitions, assumptions, and implication edges in Neo4j.
- Persist document version, source URL, checksum, and extraction metadata.

### Orchestration

- Replace the in-process engine with a LangGraph state graph.
- Add query decomposition and parallel sub-question workers.
- Add retry policies based on verifier failures.
- Persist runs and checkpoints for pause/resume behavior.
- Add Celery task execution backed by Redis.

### Verification

- Add a dedicated SymPy worker for symbolic identities.
- Add SciPy and statsmodels adapters for numerical checks.
- Add z3-solver for satisfiability and first-order logic fragments.
- Compare generated claims against explicit assumptions.
- Track verifier confidence independently from language-model confidence.

### Observability

- Instrument each node with OpenInference spans.
- Send traces to Phoenix and expose a run link in the console.
- Store token usage, retrieval latency, verifier runtime, and retry counts.
- Add evaluation datasets for groundedness, proof validity, and refusal quality.

### Product

- Add saved investigations and run comparison.
- Add source pinning and user feedback on evidence quality.
- Add streaming trace events through WebSockets or Server-Sent Events.
- Add access control, workspace tenancy, and audit exports.

## Development principles

- Keep the HTTP schemas stable while adapters evolve behind them.
- Prefer evidence and explicit assumptions over fluent unsupported prose.
- Make every automated conclusion inspectable.
- Keep the local path deterministic and fast enough for tests.
- Fail closed when evidence or verification is insufficient.
- Never treat a confidence score as proof by itself.

## License and status

This repository is a development foundation, not a certified theorem prover or statistical package. Do not use the demonstration corpus or local verifier as the sole basis for medical, legal, financial, safety-critical, or scientific claims.
