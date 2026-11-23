# Requirements Document

## Introduction
**Feature:** Vix agent (Python: LiveKit Agents + LangGraph)

`apps/vix-agent` is the voice-and-vision lab guide. It joins a LiveKit room with one student, listens, reads a live ScreenMap of the student's lab (and, when needed, a screen-share frame), reasons with a LangGraph graph, speaks back, and points at the screen through whitelisted RPCs. It never changes experiment state and never gives answers in graded mode. The client side (buttons, overlays, captions) is specified in `vix-guide`; shared shapes are in steering `contracts.md`; safety rules in steering `vix-safety.md`.

## Glossary
- **Agent**: the LiveKit Agents worker process (`apps/vix-agent`).
- **Session**: one VIX_SESSION row; one LiveKit room; one student.
- **Graph**: the LangGraph state machine that decides every reply.
- **ScreenMap**: JSON published by the web client on LiveKit data topic `vix.screenmap` (contracts §4); maximum 16 KB.
- **Frame**: a JPEG sampled from the student's screen-share track, capped at 1024 px on the longest side.
- **Policy_Guard**: the graph node that checks every outgoing message against the mode rules before the message reaches TTS.
- **Tour**: an ordered list of scripted regions with narration, delivered one step at a time.
- **Service_Token**: a JWT with scope `vix-agent`, signed with `VIXIR_SERVICE_SECRET`, used for agent-to-API calls (contracts §1).
- **Context**: the JSON response from `GET /api/v1/internal/vix/sessions/{id}/context` (contracts §7).

## Requirements

### Requirement 1: Session lifecycle (P0)
**User Story:** As a student, I want Vix to join quickly when I call and leave cleanly when I end, so that it feels like a real call.

#### Acceptance Criteria
1. WHEN the API dispatches the Agent to a room with `{ sessionId }` metadata THE Agent SHALL join the room, fetch Context from `/api/v1/internal/vix/sessions/{id}/context` using its Service_Token, and greet the student by first name within 3 seconds of joining.
2. IF the context endpoint returns `mode: EXAM` THEN THE Agent SHALL leave the room immediately without speaking.
3. IF the institution has disabled Vix (`VIX_DISABLED_INSTITUTION`) THEN THE Agent SHALL leave the room immediately without speaking.
4. IF the context fetch returns a non-2xx status THEN THE Agent SHALL proceed using the scripted tour only, greet the student, and say that full help is temporarily unavailable.
5. IF the LiveKit room-join call fails THEN THE Agent SHALL retry once after 1 second and log the failure; if the retry fails THE Agent SHALL record the error and exit cleanly without posting `/end`.
6. WHEN the student leaves the room or presses End THE Agent SHALL post `POST /api/v1/internal/vix/sessions/{id}/end` with `{ "turns": n }` and disconnect within 2 seconds.
7. WHEN a session is idle for 5 minutes (no student speech, no typed message, no RPC interaction) THE Agent SHALL say a short goodbye and call the end flow in AC6.
8. THE Agent SHALL handle at least 20 concurrent sessions per worker process on a 2 vCPU / 4 GB machine without degrading response latency beyond the p95 budget in Requirement 2 AC2.

### Requirement 2: Voice pipeline (P0)
**User Story:** As a student, I want to talk naturally and be heard, so that I don't have to type.

#### Acceptance Criteria
1. THE Agent SHALL configure an AgentSession with Silero VAD, streaming STT, the LLM, and streaming TTS, with turn detection and barge-in enabled.
2. THE Agent SHALL produce the first audio byte within 1.2 seconds of the end of the student's final speech segment at p50, and within 2.5 seconds at p95, measured from STT final event.
3. WHEN the student speaks while the Agent is speaking THE Agent SHALL stop speaking immediately (barge-in) and process the new input.
4. THE Agent SHALL accept typed messages sent on LiveKit data topic `vix.chat` and process them through the same Graph path as speech.
5. WHEN streaming TTS THE Agent SHALL send `showCaption` RPC with `final: false` on each sentence boundary and `final: true` after the last sentence of a turn.
6. THE Agent SHALL use the voice identifier provided in the session bootstrap (ada, tunde, grace) and the session locale.
7. WHERE the TTS provider does not support the requested locale THE Agent SHALL speak in English and, if a translation is available, send captions in the requested language via `showCaption`.
8. IF the STT provider returns an error or timeout mid-turn THEN THE Agent SHALL discard the partial transcript, send a `showCaption` with text asking the student to repeat, and re-enter the listening state.

### Requirement 3: Seeing the screen (P0 map, P1 frames)
**User Story:** As a student, I want Vix to know what I'm looking at, so that "what is this?" gets a useful answer.

#### Acceptance Criteria
1. THE Agent SHALL keep the latest ScreenMap per session in memory and treat any ScreenMap older than 2 seconds as stale when answering a screen question.
2. WHEN the cached ScreenMap is stale THE Agent SHALL publish a request on `vix.screenmap.request` and wait up to 1.5 seconds for the refreshed ScreenMap before continuing with the stale one.
3. IF no ScreenMap has been received after the request timeout THE Agent SHALL answer from experiment Context only and note that it cannot currently see the screen.
4. THE Agent SHALL validate that an incoming ScreenMap payload is well-formed JSON not exceeding 16 KB and matches the contracts §4 shape; malformed payloads SHALL be discarded and the previous ScreenMap retained.
5. THE Agent SHALL resolve region and element references in student speech (e.g. "the orange ball", "this panel on the right") to ScreenMap `id` values using the `label`, `kind`, and bounding-box `bbox` fields.
6. (P1) WHEN a reference cannot be resolved from the ScreenMap with confidence ≥ 0.7 AND screen consent is true THE Agent SHALL sample the latest Frame and send it to the vision model together with the ScreenMap for disambiguation.
7. (P1) THE Agent SHALL sample Frames at most once per second while the student is speaking and once per 5 seconds otherwise, and only when screen consent is true.
8. THE Agent SHALL never request, store, or forward Frames when `consent.screen` is false.

### Requirement 4: Explaining the screen (P0)
**User Story:** As a student new to labs, I want a guided tour of the screen, so that I know what each part does.

#### Acceptance Criteria
1. WHEN the student asks to explain the screen THE Graph SHALL load the scripted Tour for the current screen code, filter it to regions present and `visible: true` in the latest ScreenMap, and call `startTour` with the filtered steps.
2. WHEN a Tour is active and the Agent begins narrating a step THE Agent SHALL call `spotlight` for that step's `regionId` before speaking the narration.
3. WHEN a Tour step narration finishes THE Agent SHALL advance to the next step after a 1.5-second pause OR immediately when the student says "next", "continue", or an equivalent.
4. WHEN the student says "back" or "again" during a Tour THE Agent SHALL call `tourStep` with the previous or current step index respectively.
5. WHEN the student says "stop" or asks an off-tour question during a Tour THE Agent SHALL call `endTour` before switching to the question-answering path.
6. WHEN a Tour ends (last step reached, student stops it, or a new Tour is started) THE Agent SHALL call `endTour` to remove overlays before issuing `startTour` again.
7. WHEN the student asks about a single region THE Agent SHALL call `spotlight` or `pointAt` for that region and explain its purpose in at most 3 sentences.
8. THE Agent SHALL only use `regionId` and `elementId` values present in the latest ScreenMap in any RPC payload.

### Requirement 5: Guiding the practical (P0)
**User Story:** As a student mid-experiment, I want to know what to do next without being given the answer.

#### Acceptance Criteria
1. WHEN the student asks what to do next THE Graph SHALL compare the `sim` state and `experiment.step` in the ScreenMap with the experiment procedure steps from Context and state the next procedure step as an instruction or a guiding question.
2. WHEN the ScreenMap `sim.warnings` list is non-empty THE Agent MAY mention one warning per turn as a question about its possible cause, not as a statement of the student's error.
3. WHEN the student asks a concept question THE Graph SHALL retrieve relevant passages from the experiment's briefing, theory, and glossary using in-memory BM25 and answer Socratically: one short explanation followed by one question back to the student.
4. WHEN the student asks about safety THE Graph SHALL answer using only the experiment's `precautions` and `hazards` fields from Context.
5. WHEN the student asks a question unrelated to the current experiment or laboratory science THE Agent SHALL steer back to the practical in one sentence without elaborating on the off-topic subject.

### Requirement 6: Mode policy (P0)
**User Story:** As a teacher, I want Vix to help without doing graded work, so that marks stay honest.

#### Acceptance Criteria
1. WHILE the mode is GRADED THE Agent SHALL NOT speak or caption any reading, calculated value, slope, final result, or statement about whether a specific value is correct.
2. THE Policy_Guard SHALL intercept every outgoing message before it reaches TTS; IF a message violates the policy THEN THE Policy_Guard SHALL pass it to the LLM rewrite node with the named violation; IF the rewritten message still fails THEN THE Policy_Guard SHALL replace it with a safe guiding question.
3. THE Policy_Guard SHALL apply two independent checks: a deterministic rule check (numbers adjacent to the experiment's quantity symbols or units, phrases such as "the answer is", "your g is", "the value is") and an LLM classifier returning `{ leak: bool, reason: string }`; a message is blocked if either check flags it.
4. WHILE the mode is PRACTICE THE Agent MAY explain a worked method using the student's own numbers but SHALL ask the student to compute the final value themselves before providing it.
5. THE Agent SHALL refuse requests to change experiment apparatus state, submit the attempt, or reveal hidden per-student values in every mode.
6. WHEN a message is blocked by Policy_Guard THE Agent SHALL record the blocked message with `policy_blocked: true` to `POST /api/v1/internal/vix/sessions/{id}/messages` only when transcript retention is enabled for the institution.
7. THE Agent SHALL apply mode policy checks regardless of whether the web client has redacted the ScreenMap, treating redaction as a defence-in-depth measure only.

### Requirement 7: Acting on the screen (P0)
**User Story:** As a student, I want Vix to point at things, so that I see exactly what it means.

#### Acceptance Criteria
1. THE Agent SHALL act on the student's screen only through the RPCs defined in contracts §5: `spotlight`, `pointAt`, `startTour`, `tourStep`, `endTour`, `openPanel`, `showCaption`.
2. THE Agent SHALL verify that every `regionId` and `elementId` in a planned RPC payload is present in the ScreenMap that was current when the Graph planned the RPC; if the ScreenMap has since changed and the id is absent, THE Agent SHALL skip the RPC and describe the location in words.
3. WHEN an RPC returns `{"error": code}` THE Agent SHALL retry that RPC once; if the retry also fails THE Agent SHALL describe the target location in words instead.
4. THE Agent SHALL call `endTour` to remove any active Tour overlay before the session ends.

### Requirement 8: Safety and privacy for minors (P0)
**User Story:** As a parent or school, I want Vix to be safe for children.

#### Acceptance Criteria
1. THE Agent SHALL include only the student's first name, the mode, the locale, and the experiment Context in model prompts; it SHALL NOT include the student's last name, institution name, email, or any other personal identifier.
2. THE Agent SHALL maintain an encouraging, age-appropriate tone, avoid personal questions, and decline unsafe or unrelated requests in every session regardless of student input.
3. WHERE transcript retention is disabled (checked against `institution.vix_transcripts_retained`) THE Agent SHALL keep the conversation only in memory for the duration of the session and not write it to any persistent store.
4. WHERE transcript retention is enabled THE Agent SHALL send each turn to `POST /api/v1/internal/vix/sessions/{id}/messages` with `{ "role", "text", "policyBlocked" }` after the turn completes.
5. THE Agent SHALL never record audio or store raw audio bytes, regardless of transcript retention settings.
6. WHERE the student's `institution_id` is null (anonymous practice attempt) THE Agent SHALL treat transcript retention as disabled and proceed with scripted-tour-only context.

### Requirement 9: Resilience (P0)
**User Story:** As a student on a weak connection, I want help to degrade gracefully.

#### Acceptance Criteria
1. IF an LLM call fails or times out THEN THE Agent SHALL retry once with a 500 ms delay; if the retry also fails THE Agent SHALL send `showCaption` with a brief text answer drawn from experiment Context without LLM generation.
2. IF a TTS call fails THEN THE Agent SHALL send `showCaption` with the text of the reply as a fallback, without retrying.
3. IF the LiveKit room connection drops mid-session THEN THE Agent SHALL attempt to reconnect once within 5 seconds; if reconnection fails THE Agent SHALL log the disconnection and exit cleanly.
4. IF the API context call fails at join THEN THE Agent SHALL proceed using the scripted Tour only and inform the student that full help is temporarily unavailable.
5. THE Agent SHALL enforce per-session limits of 60 turns and 30 minutes; when either limit is reached THE Agent SHALL say a brief farewell and call the session-end flow.
6. THE Agent SHALL enforce a per-turn LLM timeout of 8 seconds, after which the turn falls through to the LLM failure path in AC1.
7. THE Agent SHALL expose a health-check endpoint (`GET /health`) that returns HTTP 200 when the worker is ready to accept dispatches and HTTP 503 otherwise, for use by the deployment orchestrator.

### Requirement 10: Observability and evaluation (P0 basic, P1 full)
**User Story:** As the team, I want to measure Vix's latency and safety, so that we can prove it in the demo and improve it.

#### Acceptance Criteria
1. THE Agent SHALL emit a structlog JSON log entry per turn containing: `session_id`, `intent`, latency fields `stt_ms` (time from speech end to STT final), `intent_ms` (classify node), `first_token_ms` (LLM first token), `tts_first_audio_ms` (TTS first audio), `rpcs` (list of RPC method names called), `policy_blocked` (bool), and `prompt_id` (version identifier of the prompts used); student speech text SHALL be omitted unless transcript retention is enabled.
2. THE repo SHALL contain an evaluation set at `apps/vix-agent/evals/` with at least 40 scripted student turns covering the physics-pendulum P0 lab (the reference P0 lab), distributed across intent categories: explain_screen, explain_region, what_next, concept, safety, and graded-mode trick questions seeking numeric answers.
3. `uv run pytest` SHALL execute the evaluation set against the Graph with a stubbed LLM for routing and policy rules, and SHALL fail CI if any graded-mode message containing a numeric answer passes the Policy_Guard rule check.
4. THE Agent SHALL emit a structlog entry at worker startup listing the Python version, livekit-agents version, VAD/STT/TTS provider identifiers, and the LLM model identifier, to aid post-incident diagnosis.

## Correctness properties (pytest + hypothesis)

- **Policy leak**: for any generated GRADED-mode reply string containing a decimal number followed by a quantity unit drawn from the experiment's `variables` and `instruments` config, `PolicyGuard.blocks(reply)` SHALL return true. This covers both the rule-check and the LLM classifier paths independently.
- **RPC id validity**: for any Graph execution, every `regionId` and `elementId` in `state.rpc_plan` SHALL be present in `state.screen.regions` at the point the RPC plan is committed; the Agent SHALL never emit an RPC id absent from the current ScreenMap.
- **Tour step bounds**: for any sequence of `next`, `back`, and `again` commands applied to a Tour of `n` steps, the current step index SHALL remain within `[0, n − 1]` at every point.
- **Context round-trip**: for any valid Context JSON response, deserialising it into the `contracts.py` Pydantic model and re-serialising SHALL produce a JSON object equal to the original (round-trip property).
- **Policy idempotence**: for any message where `PolicyGuard.blocks(message)` is true, `PolicyGuard.blocks(PolicyGuard.rewrite(message))` being true SHALL trigger the safe-question fallback, not a second rewrite loop (idempotence of the rewrite boundary).
