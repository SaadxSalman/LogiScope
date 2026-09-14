"use client";

import { FormEvent, useEffect, useState } from "react";
import { getCorpusStatus, getRunHistory, RunSummary, searchCorpus, SearchResult } from "../lib/api";

type Evidence = { id: string; title: string; source: string; excerpt: string; score: number; kind: string };
type Check = { name: string; status: string; detail: string; runtime_ms: number };
type Event = { node: string; status: string; detail: string };
type Run = { run_id: string; answer: string; confidence: number; closure: string; evidence: Evidence[]; checks: Check[]; trace: Event[]; generated_code: string; latency_ms: number };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const starter = "Can you verify Bayes theorem and explain which assumptions make the result valid?";

export default function Console() {
  const [question, setQuestion] = useState(starter);
  const [domain, setDomain] = useState("mathematics");
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<RunSummary[]>([]);
  const [corpusCount, setCorpusCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    Promise.all([getRunHistory(), getCorpusStatus()]).then(([runs, corpus]) => {
      setHistory(runs);
      setCorpusCount(corpus.count);
    }).catch(() => undefined);
  }, [run]);

  async function search(event: FormEvent) {
    event.preventDefault();
    if (searchQuery.trim().length < 2) return;
    try {
      const response = await searchCorpus(searchQuery);
      setSearchResults(response.results);
    } catch {
      setSearchResults([]);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/v1/runs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, domain, max_hops: 3, execute_checks: true }) });
      if (!response.ok) throw new Error("The agent endpoint returned an error.");
      setRun(await response.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to reach the agent API.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="shell">
    <nav className="topbar"><div className="brand"><span className="brand-mark">L</span><span>LOGISCOPE<span className="muted"> / AGENT</span></span></div><div className="nav-status"><span className="pulse" /> LOCAL ENGINE <span className="divider" /> v0.1.0</div></nav>
    <section className="hero"><div className="eyebrow">REASONING WORKSPACE <span>•</span> SESSION READY</div><h1>Make every conclusion<br /><em>show its work.</em></h1><p className="hero-copy">An agentic retrieval loop for proofs, inference, and symbolic logic. Ask a hard question, inspect the evidence, and watch the verifier close the gaps.</p></section>
    <section className="workspace">
      <form className="query-panel" onSubmit={submit}><div className="panel-heading"><div><span className="step">01</span><span className="panel-title">Frame the investigation</span></div><span className="kbd">⌘ ↵</span></div><label htmlFor="question">RESEARCH QUESTION</label><textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} /><div className="controls"><div className="select-wrap"><label htmlFor="domain">DOMAIN</label><select id="domain" value={domain} onChange={(event) => setDomain(event.target.value)}><option value="mathematics">Mathematics</option><option value="statistics">Statistics</option><option value="logic">Symbolic logic</option><option value="general">General research</option></select></div><button type="submit" disabled={loading || question.length < 3}>{loading ? "RUNNING LOOP..." : "RUN INVESTIGATION"}<span>↗</span></button></div>{error && <div className="error">{error} Start the API with <code>uvicorn app.main:app --reload</code>.</div>}</form>
      <div className="side-note"><span className="note-line" /><p><strong>Active control loop</strong><br />Decompose → retrieve → verify → reflect. Every run leaves a trace you can audit.</p></div>
    </section>
    {run ? <section className="results"><div className="result-head"><div><div className="eyebrow">RUN {run.run_id}</div><h2>Verification report</h2></div><div className={`closure ${run.closure}`}>{run.closure === "proven" ? "✓" : "~"} {run.closure}</div></div><div className="answer-grid"><article className="answer"><div className="card-label">AGENT SYNTHESIS <span>{run.latency_ms} ms</span></div><p>{run.answer}</p><div className="confidence"><div><span>CONFIDENCE</span><strong>{Math.round(run.confidence * 100)}%</strong></div><div className="meter"><i style={{ width: `${run.confidence * 100}%` }} /></div></div></article><article className="trace"><div className="card-label">CONTROL LOOP TRACE</div>{run.trace.map((item) => <div className="trace-row" key={item.node}><span className="trace-dot" /><div><strong>{item.node.replaceAll("_", " ")}</strong><p>{item.detail}</p></div></div>)}</article></div><div className="lower-grid"><article className="evidence"><div className="card-label">RETRIEVED EVIDENCE <span>{run.evidence.length} SOURCES</span></div>{run.evidence.map((item) => <div className="evidence-row" key={item.id}><div className="evidence-index">{item.kind.slice(0, 3).toUpperCase()}</div><div><strong>{item.title}</strong><small>{item.source} · relevance {Math.round(item.score * 100)}%</small><p>{item.excerpt}</p></div></div>)}</article><article className="checks"><div className="card-label">SANDBOX CHECKS</div>{run.checks.map((check) => <div className="check-row" key={check.name}><span className={`check-icon ${check.status}`}>{check.status === "passed" ? "✓" : "!"}</span><div><strong>{check.name}</strong><p>{check.detail}</p></div><small>{check.runtime_ms}ms</small></div>)}<details><summary>VIEW GENERATED PLAN</summary><pre>{run.generated_code}</pre></details></article></div></section> : <section className="empty-state"><div className="empty-orbit"><span>∴</span></div><h2>Your next proof starts here.</h2><p>Submit a question to activate retrieval and see the reasoning trace.</p></section>}
    <section className="observatory"><div className="section-heading"><div><div className="eyebrow">SYSTEM OBSERVATORY</div><h2>Know what the agent knows.</h2></div><span className="live-label"><i /> LIVE LOCAL STATE</span></div><div className="observatory-grid"><article className="metric"><span className="metric-number">{corpusCount ?? "—"}</span><span className="metric-label">INDEXED SOURCES</span><p>Local corpus ready for hybrid retrieval.</p></article><article className="metric"><span className="metric-number">{history.length}</span><span className="metric-label">RECENT RUNS</span><p>Runs retained in the current session.</p></article><article className="history"><div className="card-label">RECENT INVESTIGATIONS</div>{history.length ? history.map((item) => <div className="history-row" key={item.run_id}><span className={`history-status ${item.closure}`} /><div><strong>{item.question}</strong><small>{item.closure} · {Math.round(item.confidence * 100)}% · {item.latency_ms}ms</small></div></div>) : <p className="muted-copy">No investigations yet. Your first run will appear here.</p>}</article><article className="search-card"><div className="card-label">SEARCH THE INDEX</div><form onSubmit={search} className="search-form"><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Try: variance, modus ponens..." /><button type="submit" aria-label="Search corpus">↗</button></form>{searchResults.map((item) => <div className="search-result" key={item.id}><strong>{item.title}</strong><small>{item.source} · {Math.round(item.score * 100)}%</small></div>)}</article></div></section>
    <footer><span>LOGISCOPE-AGENT</span><span>BUILT FOR RIGOROUS INFERENCE</span><span>QDRANT · NEO4J · LANGGRAPH READY</span></footer>
  </main>;
}
