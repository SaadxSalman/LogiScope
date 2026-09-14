export type RunSummary = {
  run_id: string;
  question: string;
  closure: string;
  confidence: number;
  latency_ms: number;
};

export type SearchResult = {
  id: string;
  title: string;
  source: string;
  excerpt: string;
  score: number;
  kind: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, cache: "no-store" });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function getRunHistory() {
  return request<RunSummary[]>("/api/v1/runs?limit=6");
}

export function getCorpusStatus() {
  return request<{ count: number; mode: string; message: string }>("/api/v1/corpus");
}

export function searchCorpus(query: string) {
  return request<{ query: string; results: SearchResult[] }>("/api/v1/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit: 4 }),
  });
}
