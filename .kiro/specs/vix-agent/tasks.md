# Implementation Plan — `vix-agent`

- [x] 1. Contracts, API Client & Policy Guard (`vix_agent/`)
  - [x] 1.1 Define Pydantic models for `ScreenMap`, `RpcCall`, `SessionContext`, `ExperimentContext`, and `TourState` with 16 KB ScreenMap validation (`contracts.py`, `test_contracts.py`) (_Req 3.4, Req 7.1_)
  - [x] 1.2 Implement service-JWT `VixirApiClient` for `/internal/vix/sessions/{id}/context`, `/messages`, and `/end` (`api_client.py`) (_Req 1.1, 1.6, 8.4_)
  - [x] 1.3 Implement deterministic + LLM-classifier `PolicyGuard` enforcing GRADED-mode answer blocking, single-rewrite safe-question fallback, and forbidden-action refusal (`policy.py`, `graph/policy.py`, `test_policy.py` with Hypothesis property tests) (_Req 6, Req 8_)

- [x] 2. ScreenMap Cache, Tour Engine & RPC Dispatcher (`vix_agent/`)
  - [x] 2.1 Implement `ScreenMapCache`, region/element reference resolver, and `FrameSampler` consent guard (`screen.py`) (_Req 3.1–3.5, 3.8_)
  - [x] 2.2 Implement scripted tour filtering and bounded `next` / `back` / `again` / `stop` navigation (`tours.py`) (_Req 4.1–4.6_)
  - [x] 2.3 Implement whitelisted `RpcDispatcher` validating `regionId`/`elementId` against the active ScreenMap (`rpc.py`) (_Req 4.8, Req 7_)

- [x] 3. Multi-Agent LangGraph & Pluggable LLM Brains (`vix_agent/graph/`, `vix_agent/llm.py`, `vix_agent/multi_agent.py`)
  - [x] 3.1 Build 18-node LangGraph workflow with intent classification, BM25 content retrieval, Socratic pedagogy, safety answers, worked examples, and PolicyGuard gating (`graph/state.py`, `graph/nodes.py`, `graph/build.py`) (_Req 4, Req 5, Req 6_)
  - [x] 3.2 Implement multi-provider `LLMBrain` supporting Gemini, Anthropic, OpenAI, Groq, DeepSeek, Mistral, OpenRouter, Together, xAI, and Ollama with per-turn timeout and retry fallback (`llm.py`) (_Req 9.1, 9.6_)
  - [x] 3.3 Add specialist agent pool and persistent cross-screen session memory (`agents.py`, `multi_agent.py`, `memory.py`) (_Req 4, Req 5_)

- [x] 4. Full-Duplex Voice Bridge, LiveKit Worker & HTTP Server (`vix_agent/server.py`, `realtime_live.py`, `pipeline.py`, `main.py`, `session.py`)
  - [x] 4.1 Implement LiveKit Agents worker entrypoint with Silero VAD, turn detection, barge-in, and structured startup/turn logging (`main.py`, `session.py`) (_Req 1, Req 2, Req 10.1, 10.4_)
  - [x] 4.2 Expose aiohttp HTTP & WebSocket server on port 8090 (`/health`, `/vix/brains`, `/vix/session/start`, `/vix/turn`, `/vix/voice-turn`, `/vix/tts`, `/vix/ws`, `/vix/live`) (`server.py`, `pipeline.py`, `tts.py`) (_Req 9.7_)
  - [x] 4.3 Implement full-duplex Gemini 3.1 Flash Live audio-to-audio WebSocket bridge (`realtime_live.py`) with real-time `spotlight`, `switch_lab`, and dynamic Tutorial Sandbox bench construction tool calls (_Req 2, Req 4, Req 7_)

- [x] 5. Evaluation Suite & Container Packaging (`evals/`, `tests/`, `Dockerfile`)
  - [x] 5.1 Create 42-turn Physics Pendulum evaluation suite (`evals/physics_pendulum_evals.json`) covering `explain_screen`, `explain_region`, `what_next`, `concept`, `safety`, and graded-mode numeric-leak probes (`tests/test_vix_agent.py`) (_Req 10.2–10.3_)
  - [x] 5.2 Package non-root Python 3.12 + `uv` Dockerfile and wire `ruff check .` + `pytest` into CI and Render deploy workflow (`Dockerfile`) (_Req 9.7_)
  - [ ] 5.3 (P1) Enable live screen-share JPEG frame sampling into the vision model when ScreenMap resolution confidence < 0.7 with `consent.screen == true` (_Req 3.6–3.7_)
