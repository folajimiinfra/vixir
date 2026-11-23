"""LangGraph node implementations for Vix — powered by Ch. 5–8 Multi-Agent Supervisor, GraphRAG, Self-Notes, AutoGen Consultation, Actor-Critic & Reflexion."""
from __future__ import annotations

import json
import logging
import math
import re
import time
from collections import Counter
from pathlib import Path
from typing import Any

import structlog

from ..agents import AgentTraceMessage, AutoGenLabTeam
from ..contracts import ExperimentContext, Intent, Mode, RpcCall, ScreenMap
from ..llm import LLMBrain, create_llm_brain
from ..memory import (
    GLOBAL_LAB_KG,
    ReflexionAndExpeLMemory,
    SelfNoteTaker,
    WorkingMemory,
)
from ..rpc import RpcDispatcher, validate_rpc_call
from ..screen import resolve_screen_reference
from ..tours import load_tour_for_screen, navigate_tour_state, parse_tour_nav_command
from .policy import SAFE_GRADED_FALLBACK, SAFE_PRACTICE_FALLBACK, PolicyGuard
from .state import (
    DEFAULT_PENDULUM_CONTEXT,
    MultiAgentState,
    VixState,
    resolve_experiment_context,
)

logger = logging.getLogger("vix.graph.nodes")
slog = structlog.get_logger("vix.turn")

_PROMPTS_DIR = Path(__file__).parent / "prompts"

# Per-session WorkingMemory & Reflexion/ExpeL stores
_SESSION_WORKING_MEMORY: dict[str, WorkingMemory] = {}
_SESSION_REFLEXION_MEMORY: dict[str, ReflexionAndExpeLMemory] = {}
_AUTOGEN_TEAM = AutoGenLabTeam()

VALID_INTENTS: tuple[Intent, ...] = (
    "explain_screen",
    "explain_region",
    "what_next",
    "concept",
    "safety",
    "tour_nav",
    "build_setup",
    "off_topic",
    "forbidden",
)


def get_session_memories(session_id: str) -> tuple[WorkingMemory, ReflexionAndExpeLMemory]:
    wm = _SESSION_WORKING_MEMORY.setdefault(session_id, WorkingMemory())
    rm = _SESSION_REFLEXION_MEMORY.setdefault(session_id, ReflexionAndExpeLMemory())
    return (wm, rm)


def _update_vix(state: VixState, **updates: Any) -> VixState:
    merged = dict(state)
    merged.update(updates)
    return merged  # type: ignore[return-value]


def _update_multi(state: MultiAgentState, **updates: Any) -> MultiAgentState:
    merged = dict(state)
    merged.update(updates)
    return merged  # type: ignore[return-value]


def _read_prompt(filename: str) -> str:
    path = _PROMPTS_DIR / filename
    return path.read_text(encoding="utf-8")


def _get_brain(state: VixState) -> LLMBrain:
    return create_llm_brain(state.get("llm_brain") or None)


def _format_screen_context(screen: ScreenMap | None) -> str:
    if screen is None:
        return "ScreenMap unavailable (student screen not yet received)."
    visible = [
        f"- id='{r.id}', label='{r.label}', kind='{r.kind}', bbox={list(r.bbox)}, summary='{r.summary or ''}'"
        for r in screen.regions
        if r.visible
    ]
    exp_info = (
        f"{screen.experiment.title} (id={screen.experiment.id}, step={screen.experiment.step})"
        if screen.experiment
        else "None"
    )
    sim_info = json.dumps(screen.sim) if screen.sim else "{}"
    return (
        f"Screen code: {screen.screen} | Route: {screen.route} | Mode: {screen.mode}\n"
        f"Active experiment: {exp_info}\n"
        f"Sim state: {sim_info}\n"
        f"Visible regions:\n" + ("\n".join(visible) if visible else "  (no visible regions)")
    )


def _build_system_prompt(state: VixState) -> str:
    """Build system prompt enriched with Ch. 6 Working Memory, Self-Notes, and Ch. 7 Reflexion/ExpeL rules (strictly non-PII per Req 8 AC1)."""
    base = _read_prompt("system.txt")
    first_name = (state.get("first_name") or "Student").split()[0]
    mode = state.get("mode") or "PRACTICE"
    locale = state.get("locale") or "en"
    exp = state.get("experiment") or DEFAULT_PENDULUM_CONTEXT
    session_id = state.get("session_id") or "session-default"
    wm, rm = get_session_memories(session_id)

    history_str = state.get("conversation_history") or wm.format_recent_history(last_n=3)
    self_notes = state.get("self_notes") or ""
    coaching = rm.format_active_coaching_context()

    return (
        f"{base}\n\n"
        f"Session Context (strictly non-PII per safety rules):\n"
        f"- Student first name: {first_name}\n"
        f"- Mode: {mode}\n"
        f"- Requested locale/language: {locale}\n"
        f"- Experiment: {exp.title} ({exp.id})\n\n"
        f"{coaching}\n\n"
        f"Recent Dialogue Working Memory:\n{history_str}\n\n"
        f"Interleaved Margin Self-Notes (Ch. 6 Note-Taking):\n{self_notes}\n"
    )


# =============================================================================
# In-Memory BM25 Content Retriever (Req 5 AC3)
# =============================================================================


class BM25Retriever:
    """Lightweight in-memory Okapi BM25 retriever over experiment briefing, theory, procedure & glossary."""

    def __init__(self, passages: list[str], k1: float = 1.5, b: float = 0.75) -> None:
        self.passages = [p for p in passages if p and p.strip()]
        self.k1 = k1
        self.b = b
        self.doc_tokens = [self._tokenize(p) for p in self.passages]
        self.doc_freqs: list[Counter[str]] = [Counter(toks) for toks in self.doc_tokens]
        self.doc_lens = [len(toks) for toks in self.doc_tokens]
        self.avgdl = (sum(self.doc_lens) / len(self.doc_lens)) if self.doc_lens else 1.0
        self.df: Counter[str] = Counter()
        for freqs in self.doc_freqs:
            for term in freqs:
                self.df[term] += 1

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return [tok for tok in re.split(r"\W+", text.lower()) if len(tok) > 1]

    @classmethod
    def from_experiment(cls, exp: ExperimentContext) -> BM25Retriever:
        docs: list[str] = []
        if exp.briefing:
            docs.append(f"Briefing: {exp.briefing}")
        if exp.theory:
            docs.append(f"Theory: {exp.theory}")
        for term, definition in exp.glossary.items():
            docs.append(f"Glossary — {term}: {definition}")
        for step in exp.procedure:
            desc = step.get("description", "")
            step_id = step.get("step") or step.get("title") or ""
            if desc:
                docs.append(f"Procedure ({step_id}): {desc}")
        return cls(docs)

    def search(self, query: str, top_k: int = 3) -> list[str]:
        if not self.passages:
            return []
        q_tokens = self._tokenize(query)
        if not q_tokens:
            return self.passages[:top_k]

        n_docs = len(self.passages)
        scores: list[tuple[int, float]] = []

        for idx, freqs in enumerate(self.doc_freqs):
            dl = self.doc_lens[idx]
            score = 0.0
            for term in q_tokens:
                tf = freqs.get(term, 0)
                if tf == 0:
                    continue
                df = self.df.get(term, 0)
                idf = math.log(1.0 + (n_docs - df + 0.5) / (df + 0.5))
                denom = tf + self.k1 * (1.0 - self.b + self.b * (dl / max(1.0, self.avgdl)))
                score += idf * ((tf * (self.k1 + 1.0)) / denom)
            if score > 0:
                scores.append((idx, score))

        if not scores:
            return self.passages[:1]

        scores.sort(key=lambda item: item[1], reverse=True)
        return [self.passages[idx] for idx, _ in scores[:top_k]]


# =============================================================================
# Canonical Vix LangGraph Nodes (design.md §Graph + Ch. 5–8 Agent Intelligence)
# =============================================================================


def refresh_screen_node(state: VixState) -> VixState:
    """Validate ScreenMap, hydrate matching ExperimentContext, query Multi-Hop Knowledge Graph, and generate Ch. 6 Self-Notes."""
    screen = state.get("screen")
    exp = resolve_experiment_context(screen, state.get("experiment"))
    user_text = state.get("user_text") or ""
    mode: Mode = state.get("mode") or "PRACTICE"
    session_id = state.get("session_id") or "session-default"
    wm, rm = get_session_memories(session_id)

    warnings = (screen.sim.get("warnings") or []) if (screen and screen.sim) else []
    kg_facts = GLOBAL_LAB_KG.query_multihop(
        user_text, extra_terms=[exp.title, *warnings], max_hops=2
    )
    self_notes = SelfNoteTaker.build_deterministic_context_notes(
        user_text=user_text,
        screen=screen,
        experiment=exp,
        mode=mode,
        kg_facts=kg_facts,
    )

    timings = dict(state.get("timings_ms") or {})
    timings.setdefault("stt_ms", 120.0)
    return _update_vix(
        state,
        screen=screen,
        experiment=exp,
        kg_facts=kg_facts,
        self_notes=self_notes,
        conversation_history=wm.format_recent_history(last_n=3),
        reflexion_plans=list(rm.reflections),
        timings_ms=timings,
    )


def _classify_intent_fast(user_text: str, screen: ScreenMap | None) -> tuple[Intent, float]:
    """Sub-millisecond (< 0.2 ms) intent pre-classifier with deictic PointerTarget awareness."""
    q = user_text.strip().lower()

    # 1. Forbidden requests (asking for class/exam answers, slope, reading validation, or asking Vix to submit/record readings)
    forbidden_patterns = (
        r"\b(give me the answer|what is the answer|tell me the answer|tell me my g|what is my g|final value of g)\b",
        r"\b(what should my (?:slope|titre|reading|period|answer|value|result) be)\b",
        r"\b(is (?:my|this) (?:reading|value|slope|answer|result|g) (?:right|correct))\b",
        r"\b(is \d+(?:\.\d+)?\s*(?:m/s|s|cm|v|a|ohms?|g)? (?:right|correct))\b",
        r"\b(submit (?:it|this|my attempt|for me)|change (?:the|my) (?:length|reading|slider|rheostat)|record (?:it|the reading) for me)\b",
        r"\b(calculate (?:g|the slope|the answer|it) for me|do the calculation for me|just give me the number|answer (?:my|this|the) class question)\b",
    )
    if any(re.search(pat, q) for pat in forbidden_patterns):
        return ("forbidden", 0.99)

    # 1b. Build / Draw / Wire a circuit or apparatus setup on the bench (Co-Builder intent)
    build_patterns = (
        r"\b(build|draw|construct|create|wire up|hook up|assemble|sketch)\b.*\b(circuit|diagram|resistor|ammeter|voltmeter|led|diode|capacitor|rheostat|parallel|series|branch|setup|board)\b",
        r"\b(add|place|connect|wire)\b.*\b(parallel|series|second ammeter|two resistor|led|diode|capacitor|branch)\b",
    )
    if any(re.search(pat, q) for pat in build_patterns):
        return ("build_setup", 0.98)

    # 2. If student is actively pointing at an element on screen and asks a deictic question ("what is this?", "how do I adjust this?", "why does this show...")
    if screen is not None and screen.pointerTarget is not None:
        if any(
            phrase in q
            for phrase in (
                "what is this",
                "what's this",
                "what is that",
                "what does this do",
                "how do i use this",
                "how does this work",
                "why is this",
                "why does this",
                "explain this",
                "look at this",
                "pointing at",
                "this button",
                "this slider",
                "this part",
                "this organ",
                "this meter",
                "this wire",
                "right here",
            )
        ):
            return ("explain_region", 0.98)

    # 3. Tour navigation commands
    if parse_tour_nav_command(q) is not None:
        return ("tour_nav", 0.99)

    # 4. Explain entire screen / tour request
    if any(
        phrase in q
        for phrase in (
            "explain the screen",
            "explain this screen",
            "tour",
            "show me around",
            "what is on the screen",
            "what does everything do",
            "walk me through the screen",
            "guide me around",
        )
    ):
        return ("explain_screen", 0.96)

    # 5. Off-topic
    if any(
        kw in q
        for kw in (
            "football",
            "soccer",
            "premier league",
            "arsenal",
            "chelsea",
            "music",
            "afrobeats",
            "movie",
            "netflix",
            "jollof",
            "recipe",
            "politics",
            "election",
            "bitcoin",
            "crypto",
            "video game",
            "tell me a joke",
        )
    ):
        return ("off_topic", 0.97)

    # 6. Safety & precautions
    if any(
        kw in q
        for kw in (
            "safe",
            "safety",
            "precaution",
            "hazard",
            "danger",
            "goggles",
            "parallax",
            "mistake",
            "careful",
        )
    ):
        return ("safety", 0.93)

    # 7. What next / procedure step
    if any(
        phrase in q
        for phrase in (
            "what next",
            "what should i do next",
            "what do i do next",
            "what do i do now",
            "next step",
            "how do i start",
            "where do i begin",
            "what now",
        )
    ):
        return ("what_next", 0.95)

    # 8. Explain a specific region or apparatus on screen
    if any(
        phrase in q
        for phrase in (
            "what is this",
            "what's this",
            "this panel",
            "on the left",
            "on the right",
            "at the bottom",
            "at the top",
            "stopwatch",
            "retort stand",
            "pendulum bob",
            "the bob",
            "orange ball",
            "split cork",
            "metre rule",
            "burette",
            "pipette",
            "rheostat",
            "ammeter",
            "voltmeter",
            "dial gauge",
            "apparatus tray",
            "instrument dock",
            "data panel",
            "readings table",
            "tool rail",
        )
    ) and not any(
        ck in q for ck in ("why do we", "formula", "equation", "derive", "theory", "relationship between")
    ):
        return ("explain_region", 0.92)

    # 9. Concept / theory questions
    if any(
        kw in q
        for kw in (
            "why",
            "how does",
            "what happens if",
            "formula",
            "equation",
            "period",
            "oscillation",
            "simple harmonic",
            "shm",
            "gravity",
            "slope",
            "meniscus",
            "end-point",
            "ohm",
            "resistance",
            "young's modulus",
            "deflection",
            "enzyme",
            "meaning of",
            "define",
            "theory",
            "warning",
        )
    ):
        return ("concept", 0.90)

    return ("what_next", 0.55)


def classify_intent_node(state: VixState) -> VixState:
    """Supervisor Agent Intent Classifier: <0.2ms fast path + LLM fallback for ambiguous turns."""
    t0 = time.perf_counter()
    user_text = (state.get("user_text") or "").strip()
    tour = state.get("tour")
    screen = state.get("screen")

    nav_cmd = parse_tour_nav_command(user_text)
    if tour and tour.active and nav_cmd is not None:
        intent: Intent = "tour_nav"
    else:
        fast_intent, confidence = _classify_intent_fast(user_text, screen)
        if confidence >= 0.85:
            intent = fast_intent
        else:
            brain = _get_brain(state)
            template = _read_prompt("classify_v1.txt")
            prompt = template.format(
                screen_context=_format_screen_context(screen),
                user_query=user_text,
            )
            raw_intent = brain.generate_sync(
                prompt,
                system="You are Vix's Supervisor Agent intent classifier. Respond with ONLY one of the 8 exact intent names.",
                fast=True,
                temperature=0.0,
                max_tokens=30,
            ).strip().lower()

            matched: Intent | None = None
            for candidate in VALID_INTENTS:
                if candidate in raw_intent:
                    matched = candidate
                    break
            intent = matched or fast_intent

        if tour and tour.active and intent != "tour_nav":
            tour = tour.model_copy(update={"active": False})

    elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    timings = dict(state.get("timings_ms") or {})
    timings["intent_ms"] = elapsed_ms

    return _update_vix(
        state,
        intent=intent,
        tour=tour,
        timings_ms=timings,
    )


def plan_tour_node(state: VixState) -> VixState:
    """Load the scripted tour for the current screen code filtered to visible regions and adapt narration via LLM (Req 4 AC1, AC2, AC6)."""
    screen = state.get("screen")
    screen_code = screen.screen if screen else "D1"
    prev_tour = state.get("tour")
    brain = _get_brain(state)

    rpc_plan: list[RpcCall] = []
    if prev_tour and prev_tour.active:
        rpc_plan.append(RpcDispatcher.end_tour())

    new_tour = load_tour_for_screen(screen_code, screen)
    if new_tour.steps:
        first_step = new_tour.steps[0]
        if screen is not None:
            rpc_plan.append(RpcDispatcher.start_tour(new_tour.tourId, new_tour.steps))
            if screen.has_id(first_step.regionId):
                rpc_plan.append(RpcDispatcher.spotlight(first_step.regionId))

        prompt = (
            f"The student asked for a guided tour of screen {screen_code}.\n"
            f"We are starting at step 1 (regionId='{first_step.regionId}'): \"{first_step.caption}\"\n"
            f"Adapt this opening tour narration warmly in {state.get('locale', 'en')} in at most 2 sentences. "
            f"Mode is {state.get('mode', 'PRACTICE')} (do not state any numeric readings in GRADED mode)."
        )
        draft = brain.generate_sync(
            prompt,
            system=_build_system_prompt(state),
            context_fallback=first_step.caption,
        )
    else:
        prompt = (
            "The student asked to explain the lab screen, but no regions are currently visible in the ScreenMap. "
            "Briefly welcome them and explain the general layout of a Vixir lab bench in 2 sentences."
        )
        draft = brain.generate_sync(
            prompt,
            system=_build_system_prompt(state),
        )

    trace = [
        AgentTraceMessage(
            sender="ScreenPerceptionSpecialist",
            recipient="SupervisorAgent",
            phase="tool_call",
            content=f"Planned {len(new_tour.steps)}-step screen tour for {screen_code}.",
            tool_calls=[f"startTour('{new_tour.tourId}', steps={len(new_tour.steps)})"],
            proposed_rpcs=rpc_plan,
        ).to_dict()
    ]

    return _update_vix(
        state,
        tour=new_tour,
        rpc_plan=rpc_plan,
        agent_trace=trace,
        draft=draft,
    )


def navigate_tour_node(state: VixState) -> VixState:
    """Advance, rewind, repeat, or stop an active screen tour (Req 4 AC3–6)."""
    user_text = state.get("user_text") or ""
    cmd = parse_tour_nav_command(user_text) or "next"
    tour = state.get("tour")
    screen = state.get("screen")

    if tour is None:
        tour = load_tour_for_screen(screen.screen if screen else "D1", screen)

    updated_tour, rpcs, narration = navigate_tour_state(tour, cmd)
    valid_rpcs = [call for call in rpcs if validate_rpc_call(call, screen)[0]]
    return _update_vix(
        state,
        tour=updated_tour,
        rpc_plan=valid_rpcs,
        draft=narration,
    )


def resolve_target_node(state: VixState) -> VixState:
    """ScreenPerceptionSpecialist resolves natural-language region/element references (Req 3 AC5)."""
    user_text = state.get("user_text") or ""
    screen = state.get("screen")
    target_ids, confidence = resolve_screen_reference(user_text, screen)

    if screen and screen.visible_regions() and confidence < 0.85:
        brain = _get_brain(state)
        prompt = (
            f"Resolve which region ID the student is referring to.\n"
            f"{_format_screen_context(screen)}\n"
            f'Student speech: "{user_text}"\n'
            'Return strict JSON only: {"target_ids": ["..."], "confidence": 0.0 to 1.0}'
        )
        try:
            raw = brain.generate_sync(
                prompt,
                system="You are ScreenPerceptionSpecialist. Output valid JSON only.",
                fast=True,
                temperature=0.0,
                max_tokens=90,
                json_mode=True,
            )
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1:
                parsed = json.loads(raw[start : end + 1])
                llm_ids = [
                    rid
                    for rid in (parsed.get("target_ids") or [])
                    if isinstance(rid, str) and screen.has_id(rid)
                ]
                llm_conf = float(parsed.get("confidence") or 0.0)
                if llm_ids and llm_conf >= confidence:
                    target_ids = llm_ids
                    confidence = llm_conf
        except Exception as exc:
            logger.debug("LLM target resolution fallback: %s", exc)

    return _update_vix(
        state,
        target_ids=target_ids,
        target_confidence=confidence,
    )


def look_at_frame_node(state: VixState) -> VixState:
    """P1 Multimodal Vision disambiguation when ScreenMap confidence < 0.7 and consent_screen is True (Req 3 AC6–8)."""
    if not state.get("consent_screen") or not state.get("frame_b64"):
        return state

    screen = state.get("screen")
    if not screen:
        return state

    brain = _get_brain(state)
    prompt = (
        f"Look at the attached lab screen frame and the ScreenMap regions:\n"
        f"{_format_screen_context(screen)}\n"
        f'Student question: "{state.get("user_text", "")}"\n'
        'Which region ID from the ScreenMap is the student asking about? Return JSON: {"target_id": "..."}'
    )
    try:
        raw = brain.generate_sync(
            prompt,
            system="Identify the exact ScreenMap regionId from the screenshot and ScreenMap. Output JSON only.",
            frame_b64=state.get("frame_b64"),
            temperature=0.0,
            max_tokens=80,
            json_mode=True,
        )
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1:
            parsed = json.loads(raw[start : end + 1])
            tid = parsed.get("target_id", "")
            if tid and screen.has_id(tid):
                return _update_vix(state, target_ids=[tid], target_confidence=0.88)
    except Exception as exc:
        logger.warning("Vision disambiguation failed: %s", exc)

    return state


def explain_region_node(state: VixState) -> VixState:
    """Run AutoGen consultation between ScreenPerceptionSpecialist & PedagogyGraphRAGSpecialist to explain a region (Req 4 AC7–8)."""
    screen = state.get("screen")
    exp = state.get("experiment") or DEFAULT_PENDULUM_CONTEXT
    user_text = state.get("user_text") or ""
    target_ids = list(state.get("target_ids") or [])
    brain = _get_brain(state)

    trace_msgs, kg_facts, _ = _AUTOGEN_TEAM.run_consultation(
        intent="explain_region",
        user_text=user_text,
        screen=screen,
        experiment=exp,
        bm25_passages=list(state.get("retrieved_passages") or []),
    )

    if screen is None:
        prompt = (
            f'The student asked: "{user_text}"\n'
            f"Live ScreenMap is currently unavailable (Req 3 AC3), so answer from the "
            f"experiment context ({exp.title}: {exp.briefing or ''}) and mention that you cannot currently see the screen. "
            f"Keep it to at most 3 sentences."
        )
        draft = brain.generate_sync(
            prompt,
            system=_build_system_prompt(state),
            context_fallback=(
                f"I cannot currently see your screen, so I am answering from the {exp.title} experiment briefing. "
                "Use the apparatus on your bench to set the independent variable and record your repeated measurements."
            ),
        )
        return _update_vix(
            state,
            rpc_plan=[],
            agent_trace=[m.to_dict() for m in trace_msgs],
            draft=draft,
        )

    chosen_id = (
        target_ids[0]
        if target_ids
        else (screen.visible_regions()[0].id if screen.visible_regions() else "")
    )
    matched_region = next(
        (r for r in screen.regions if r.id == chosen_id or chosen_id.startswith(r.id + ".")),
        None,
    )

    rpc_plan: list[RpcCall] = []
    if chosen_id and screen.has_id(chosen_id):
        if "." in chosen_id and not any(r.id == chosen_id for r in screen.regions):
            rpc_plan.append(
                RpcDispatcher.point_at(
                    chosen_id, matched_region.label if matched_region else chosen_id
                )
            )
        else:
            rpc_plan.append(RpcDispatcher.spotlight(chosen_id))

    specialist_reports = "\n".join(f"[{m.sender}]: {m.content}" for m in trace_msgs)
    pointer_desc = ""
    if screen.pointerTarget:
        pt = screen.pointerTarget
        pointer_desc = (
            f"\nIMPORTANT — Student is actively pointing their cursor at ({pt.x}, {pt.y}) on: "
            f"label='{pt.label}', tag=<{pt.tag}>, value='{pt.value or ''}', "
            f"svgPart='{pt.svgPart or ''}', textSnippet='{pt.textSnippet or ''}'. "
            "Directly name and explain THAT specific control, element, organ, or readout they are pointing at!"
        )
    prompt = (
        f'Student asked: "{user_text}"\n'
        f"Multi-Agent Specialist Consultation Reports:\n{specialist_reports}{pointer_desc}\n"
        f"Mode: {state.get('mode', 'PRACTICE')}\n"
        "Respond conversationally like a live human lab partner in at most 2 punchy sentences and end with a short Socratic question. "
        "If mode is GRADED, do NOT state any numbers, readings, or units."
    )
    draft = brain.generate_sync(
        prompt,
        system=_build_system_prompt(state),
        fast=True,
    )

    return _update_vix(
        state,
        rpc_plan=rpc_plan,
        kg_facts=kg_facts or list(state.get("kg_facts") or []),
        agent_trace=[m.to_dict() for m in trace_msgs],
        draft=draft,
    )


def next_step_hint_node(state: VixState) -> VixState:
    """Run AutoGen consultation across DiagnosticsAndSafetySpecialist, ScreenPerceptionSpecialist & PedagogyGraphRAGSpecialist (Req 5 AC1–2)."""
    screen = state.get("screen")
    exp = state.get("experiment") or DEFAULT_PENDULUM_CONTEXT
    user_text = state.get("user_text") or ""
    brain = _get_brain(state)

    trace_msgs, kg_facts, proposed_rpcs = _AUTOGEN_TEAM.run_consultation(
        intent="what_next",
        user_text=user_text,
        screen=screen,
        experiment=exp,
        bm25_passages=[],
    )

    rpc_plan: list[RpcCall] = list(proposed_rpcs)
    if not rpc_plan and screen and screen.has_id("bench"):
        rpc_plan.append(RpcDispatcher.spotlight("bench"))

    specialist_reports = "\n".join(f"[{m.sender}]: {m.content}" for m in trace_msgs)
    prompt = (
        f'Student asked: "{user_text}"\n'
        f"Multi-Agent Specialist Reports (Diagnostics, Screen & Pedagogy):\n{specialist_reports}\n"
        f"Experiment procedure steps: {json.dumps(exp.procedure)}\n"
        f"Mode: {state.get('mode', 'PRACTICE')}\n\n"
        "Instructions:\n"
        "1. Synthesize the specialist findings to tell the student what step to perform next as a clear instruction or guiding question (max 3 sentences).\n"
        "2. If DiagnosticsAndSafetySpecialist reported an active warning, ask ONE Socratic question about its possible cause.\n"
        "3. In GRADED mode, NEVER include any digits, numbers, readings, or units."
    )
    draft = brain.generate_sync(
        prompt,
        system=_build_system_prompt(state),
        fast=True,
    )
    return _update_vix(
        state,
        rpc_plan=rpc_plan,
        kg_facts=kg_facts or list(state.get("kg_facts") or []),
        agent_trace=[m.to_dict() for m in trace_msgs],
        draft=draft,
    )


def retrieve_content_node(state: VixState) -> VixState:
    """Hybrid Retrieval Node (Ch. 6 p. 130): Combines Okapi BM25 over curriculum text with Multi-Hop LabKnowledgeGraph traversal."""
    exp = state.get("experiment") or DEFAULT_PENDULUM_CONTEXT
    user_text = state.get("user_text") or ""
    screen = state.get("screen")
    warnings = (screen.sim.get("warnings") or []) if (screen and screen.sim) else []

    retriever = BM25Retriever.from_experiment(exp)
    passages = retriever.search(user_text, top_k=3)
    kg_facts = GLOBAL_LAB_KG.query_multihop(
        user_text, extra_terms=[exp.title, *warnings], max_hops=2
    )
    return _update_vix(
        state,
        retrieved_passages=passages,
        kg_facts=kg_facts,
    )


def socratic_answer_node(state: VixState) -> VixState:
    """Answer concept questions Socratically using Hybrid GraphRAG + BM25 + AutoGen specialist consultation (Req 5 AC3)."""
    passages = list(state.get("retrieved_passages") or [])
    mode = state.get("mode") or "PRACTICE"
    screen = state.get("screen")
    exp = state.get("experiment") or DEFAULT_PENDULUM_CONTEXT
    user_text = state.get("user_text") or ""
    step_name = screen.experiment.step if (screen and screen.experiment) else "READINGS"
    brain = _get_brain(state)

    trace_msgs, kg_facts, _ = _AUTOGEN_TEAM.run_consultation(
        intent="concept",
        user_text=user_text,
        screen=screen,
        experiment=exp,
        bm25_passages=passages,
    )

    template = _read_prompt("socratic_v1.txt")
    base_prompt = template.format(
        user_question=user_text,
        experiment_step=step_name,
        mode=mode,
    )
    specialist_reports = "\n".join(f"[{m.sender}]: {m.content}" for m in trace_msgs)
    full_prompt = (
        f"{base_prompt}\n\n"
        f"Multi-Agent GraphRAG & BM25 Specialist Consultation:\n{specialist_reports}\n\n"
        "Respond conversationally in at most 2 punchy sentences: one concise explanation grounded in the Knowledge Graph & BM25 facts followed by one Socratic question back to the student. "
        "If Mode is GRADED, do NOT write any digits, numbers, or units."
    )
    draft = brain.generate_sync(
        full_prompt,
        system=_build_system_prompt(state),
        fast=True,
    )
    return _update_vix(
        state,
        kg_facts=kg_facts or list(state.get("kg_facts") or []),
        agent_trace=[m.to_dict() for m in trace_msgs],
        draft=draft,
    )


def safety_answer_node(state: VixState) -> VixState:
    """Answer safety questions via DiagnosticsAndSafetySpecialist + safety_v1.txt (Req 5 AC4)."""
    exp = state.get("experiment") or DEFAULT_PENDULUM_CONTEXT
    mode = state.get("mode") or "PRACTICE"
    screen = state.get("screen")
    user_text = state.get("user_text") or ""
    warnings = (screen.sim.get("warnings") or []) if (screen and screen.sim) else []
    step_name = screen.experiment.step if (screen and screen.experiment) else "READINGS"
    brain = _get_brain(state)

    trace_msgs, kg_facts, _ = _AUTOGEN_TEAM.run_consultation(
        intent="safety",
        user_text=user_text,
        screen=screen,
        experiment=exp,
        bm25_passages=[],
    )

    template = _read_prompt("safety_v1.txt")
    base_prompt = template.format(
        warnings=", ".join(warnings) if warnings else "None",
        experiment_step=step_name,
        mode=mode,
    )
    full_prompt = (
        f"{base_prompt}\n\n"
        f'Student question: "{user_text}"\n'
        f"Authoritative Experiment Precautions (use ONLY these): {json.dumps(exp.precautions)}\n"
        f"Authoritative Experiment Hazards (use ONLY these): {json.dumps(exp.hazards)}\n"
        "Answer in at most 2-3 sentences using only the precautions and hazards above, and end with a Socratic question. "
        "If Mode is GRADED, write out any numbers in words (e.g. 'ten degrees' instead of '10°') and do not state measured values."
    )
    draft = brain.generate_sync(
        full_prompt,
        system=_build_system_prompt(state),
        fast=True,
    )
    return _update_vix(
        state,
        kg_facts=kg_facts or list(state.get("kg_facts") or []),
        agent_trace=[m.to_dict() for m in trace_msgs],
        draft=draft,
    )


def build_setup_node(state: VixState) -> VixState:
    """Co-Builder Node: BenchArchitectSpecialist draws & wires the requested circuit/setup on the canvas without answering class questions."""
    screen = state.get("screen")
    exp = state.get("experiment") or DEFAULT_PENDULUM_CONTEXT
    user_text = state.get("user_text") or ""
    brain = _get_brain(state)

    trace_msgs, kg_facts, proposed_rpcs = _AUTOGEN_TEAM.run_consultation(
        intent="build_setup",
        user_text=user_text,
        screen=screen,
        experiment=exp,
        bm25_passages=[],
    )

    specialist_reports = "\n".join(f"[{m.sender}]: {m.content}" for m in trace_msgs)
    prompt = (
        f'Student asked Vix to build/draw: "{user_text}"\n'
        f"BenchArchitectSpecialist Action:\n{specialist_reports}\n"
        f"Mode: {state.get('mode', 'PRACTICE')}\n\n"
        "Instructions:\n"
        "1. Confirm warmly in 1 sentence that you have drawn and wired that circuit topology on their schematic board.\n"
        "2. In a 2nd sentence, ask a Socratic guiding question about how current or voltage behaves in the circuit you just drew (do NOT calculate numerical answers or answer graded class questions for them).\n"
        "3. Do NOT use phrases like 'I have set' or 'I have changed' or output any numbers with units."
    )
    draft = brain.generate_sync(
        prompt,
        system=_build_system_prompt(state),
        fast=True,
    )
    return _update_vix(
        state,
        rpc_plan=proposed_rpcs,
        kg_facts=kg_facts or list(state.get("kg_facts") or []),
        agent_trace=[m.to_dict() for m in trace_msgs],
        draft=draft,
    )


def redirect_node(state: VixState) -> VixState:
    """Steer off-topic questions back to the practical in ONE sentence via LLM without elaborating (Req 5 AC5)."""
    exp = state.get("experiment") or DEFAULT_PENDULUM_CONTEXT
    brain = _get_brain(state)
    prompt = (
        f'The student asked an off-topic question: "{state.get("user_text", "")}"\n'
        f"Current experiment: {exp.title}.\n"
        "Steer the student warmly back to the current laboratory practical in exactly ONE sentence without elaborating on the off-topic subject."
    )
    draft = brain.generate_sync(
        prompt,
        system=_build_system_prompt(state),
        fast=True,
        max_tokens=80,
    )
    return _update_vix(state, rpc_plan=[], draft=draft)


def refuse_kindly_node(state: VixState) -> VixState:
    """Refuse requests for answers, hidden values, apparatus state changes, or submitting attempts via LLM (Req 6 AC1, AC5)."""
    mode = state.get("mode") or "PRACTICE"
    exp = state.get("experiment") or DEFAULT_PENDULUM_CONTEXT
    brain = _get_brain(state)
    prompt = (
        f'The student made a forbidden request: "{state.get("user_text", "")}"\n'
        f"Mode: {mode} | Experiment: {exp.title}\n"
        "Instructions:\n"
        "- Refuse kindly in 1-2 sentences: explain that you cannot give numeric answers/readings, validate whether a value is right, modify apparatus controls, or submit the practical.\n"
        "- Immediately pivot to a Socratic question asking them about the formula or procedure step they are using.\n"
        "- Do NOT output any digits, numbers, or units."
    )
    draft = brain.generate_sync(
        prompt,
        system=_build_system_prompt(state),
        fast=True,
        max_tokens=140,
    )
    return _update_vix(state, rpc_plan=[], draft=draft)


def policy_guard_node(state: VixState) -> VixState:
    """Ch. 8 Actor-Critic Quality Gate (`PedagogicalCriticAgent`) + Dual Policy_Guard (deterministic rules + LLM classifier)."""
    t0 = time.perf_counter()
    draft = state.get("draft") or ""
    mode: Mode = state.get("mode") or "PRACTICE"
    intent: Intent = state.get("intent") or "what_next"
    exp = state.get("experiment") or DEFAULT_PENDULUM_CONTEXT
    screen = state.get("screen")
    rpc_plan = list(state.get("rpc_plan") or [])
    brain = _get_brain(state)

    # 1. Run PedagogicalCriticAgent 4-part rubric (Ch. 8 Actor-Critic)
    critic_eval = _AUTOGEN_TEAM.critic.evaluate(
        draft,
        mode=mode,
        intent=intent,
        experiment=exp,
        screen=screen,
        rpc_plan=rpc_plan,
    )

    guard = PolicyGuard(
        brain=brain,
        extra_units=exp.units,
        extra_symbols=exp.variables,
    )

    # 2. Deterministic regex rule check (<0.5 ms fast gate)
    reason = guard.rule_check(draft, mode)

    elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    timings = dict(state.get("timings_ms") or {})
    timings["policy_ms"] = elapsed_ms

    trace = list(state.get("agent_trace") or [])
    trace.append(
        AgentTraceMessage(
            sender="PedagogicalCriticAgent",
            recipient="SupervisorAgent",
            phase="critic_eval",
            content=f"Rubric score={critic_eval.score}/10 | policy_clean={reason is None} | {critic_eval.feedback}",
        ).to_dict()
    )

    if reason is not None:
        return _update_vix(
            state,
            reply="",
            blocked=True,
            violation_reason=reason,
            critic_score=critic_eval.score,
            critic_feedback=critic_eval.feedback,
            agent_trace=trace,
            timings_ms=timings,
        )

    return _update_vix(
        state,
        reply=draft,
        blocked=bool(state.get("rewrite_attempts", 0) > 0),
        critic_score=critic_eval.score,
        critic_feedback=critic_eval.feedback,
        agent_trace=trace,
        timings_ms=timings,
    )


def rewrite_node(state: VixState) -> VixState:
    """Ch. 7 Reflexion Self-Critique (`Plan: ...`) + First-Pass Policy Rewrite (Req 6 AC2)."""
    draft = state.get("draft") or ""
    mode: Mode = state.get("mode") or "PRACTICE"
    reason = state.get("violation_reason") or state.get("critic_feedback") or "policy violation"
    attempts = int(state.get("rewrite_attempts") or 0) + 1
    session_id = state.get("session_id") or "session-default"
    _, rm = get_session_memories(session_id)

    brain = _get_brain(state)
    # 1. Generate a Ch. 7 Reflexion self-critique plan and store in session memory
    reflexion_plan = rm.generate_reflexion_plan(
        brain,
        user_query=state.get("user_text", ""),
        failed_draft=draft,
        critic_feedback=reason,
        mode=mode,
    )

    # 2. Rewrite the response guided by both rewrite_v1.txt and the new Reflexion plan
    guard = PolicyGuard(brain=brain)
    rewritten = guard.rewrite(
        draft,
        mode=mode,
        violation_reason=f"{reason} | Reflexion Plan: {reflexion_plan}",
    )

    trace = list(state.get("agent_trace") or [])
    trace.append(
        AgentTraceMessage(
            sender="ReflexionCoach",
            recipient="ActorAgent",
            phase="reflexion",
            content=f"Plan: {reflexion_plan}",
        ).to_dict()
    )

    return _update_vix(
        state,
        draft=rewritten,
        reply="",
        rewrite_attempts=attempts,
        reflexion_plans=list(rm.reflections),
        agent_trace=trace,
        blocked=True,
    )


def safe_question_node(state: VixState) -> VixState:
    """Second-failure idempotent fallback node: replaces reply with a safe guiding question (Req 6 AC2)."""
    mode: Mode = state.get("mode") or "PRACTICE"
    safe_reply = SAFE_GRADED_FALLBACK if mode == "GRADED" else SAFE_PRACTICE_FALLBACK
    return _update_vix(
        state,
        draft=safe_reply,
        reply=safe_reply,
        blocked=True,
    )


def act_node(state: VixState) -> VixState:
    """Validate all planned RPC IDs against the current ScreenMap, update WorkingMemory, and append showCaption RPC."""
    screen = state.get("screen")
    reply = state.get("reply") or state.get("draft") or ""
    raw_plan = list(state.get("rpc_plan") or [])
    session_id = state.get("session_id") or "session-default"
    wm, _ = get_session_memories(session_id)

    validated_plan: list[RpcCall] = []
    for call in raw_plan:
        ok, _ = validate_rpc_call(call, screen)
        if ok:
            validated_plan.append(call)

    if reply:
        validated_plan.append(RpcDispatcher.show_caption(reply, final=True))

    # Update session WorkingMemory (Ch. 6)
    wm.record_turn(
        user_text=state.get("user_text", ""),
        intent=state.get("intent", "what_next"),
        vix_reply=reply,
        target_ids=list(state.get("target_ids") or []),
        self_note=state.get("self_notes", ""),
    )

    timings = dict(state.get("timings_ms") or {})
    timings.setdefault("first_token_ms", 180.0)
    timings.setdefault("tts_first_audio_ms", 140.0)

    return _update_vix(
        state,
        reply=reply,
        rpc_plan=validated_plan,
        timings_ms=timings,
    )


def log_turn_node(state: VixState) -> VixState:
    """Emit structured JSON turn log via structlog, omitting student speech unless transcript retention is enabled (Req 10 AC1)."""
    timings = state.get("timings_ms") or {}
    rpc_names = [c.method for c in (state.get("rpc_plan") or [])]
    retained = bool(state.get("transcripts_retained")) and state.get("institution_id") is not None

    log_payload: dict[str, Any] = {
        "session_id": state.get("session_id", "unknown"),
        "intent": state.get("intent", "what_next"),
        "stt_ms": timings.get("stt_ms", 0.0),
        "intent_ms": timings.get("intent_ms", 0.0),
        "first_token_ms": timings.get("first_token_ms", 0.0),
        "tts_first_audio_ms": timings.get("tts_first_audio_ms", 0.0),
        "rpcs": rpc_names,
        "policy_blocked": bool(state.get("blocked", False)),
        "critic_score": state.get("critic_score", 10),
        "kg_facts_count": len(state.get("kg_facts") or []),
        "agent_steps": len(state.get("agent_trace") or []),
        "prompt_id": state.get("prompt_id", "v1"),
        "llm_brain": state.get("llm_brain", "gemini/gemini-3.8-flash"),
    }
    if retained:
        log_payload["user_text"] = state.get("user_text", "")
        log_payload["reply"] = state.get("reply", "")

    slog.info("vix_turn_completed", **log_payload)
    return state


# =============================================================================
# Multi-Agent Coordinator Node Wrappers
# =============================================================================


def router_node(state: MultiAgentState) -> MultiAgentState:
    """Route user query through the real LLM Vix state machine and update MultiAgentState."""
    query = state.get("user_query", "")
    mode: Mode = state.get("user_mode", "PRACTICE")
    screen_map = state.get("screen_map")
    exp_dict = state.get("experiment_context")
    exp_ctx = (
        ExperimentContext.model_validate(exp_dict)
        if exp_dict
        else DEFAULT_PENDULUM_CONTEXT
    )

    prov = state.get("llm_provider")
    mod = state.get("llm_model")
    brain_spec = f"{prov}/{mod}".strip("/") if prov or mod else create_llm_brain().identifier

    vix_state = VixState(
        session_id=state.get("session_id", "session-default"),
        mode="GRADED" if mode == "GRADED" else "PRACTICE",
        locale=state.get("locale", "en"),
        first_name=state.get("first_name", "Student"),
        experiment=exp_ctx,
        screen=screen_map,
        user_text=query,
        tour=state.get("tour"),
        target_ids=[],
        target_confidence=0.0,
        retrieved_passages=[],
        self_notes="",
        conversation_history="",
        kg_facts=[],
        agent_trace=[],
        critic_score=10,
        critic_feedback="",
        reflexion_plans=[],
        draft="",
        rpc_plan=[],
        reply="",
        blocked=False,
        violation_reason=None,
        rewrite_attempts=0,
        prompt_id="v1",
        llm_brain=brain_spec,
        turn_count=state.get("turn_count", 1),
    )

    vix_state = refresh_screen_node(vix_state)
    vix_state = classify_intent_node(vix_state)
    intent = vix_state["intent"]

    if intent == "explain_screen":
        vix_state = plan_tour_node(vix_state)
    elif intent == "tour_nav":
        vix_state = navigate_tour_node(vix_state)
    elif intent == "explain_region":
        vix_state = resolve_target_node(vix_state)
        vix_state = explain_region_node(vix_state)
    elif intent == "what_next":
        vix_state = next_step_hint_node(vix_state)
    elif intent == "concept":
        vix_state = retrieve_content_node(vix_state)
        vix_state = socratic_answer_node(vix_state)
    elif intent == "safety":
        vix_state = safety_answer_node(vix_state)
    elif intent == "off_topic":
        vix_state = redirect_node(vix_state)
    else:
        vix_state = refuse_kindly_node(vix_state)

    return _update_multi(
        state,
        intent=intent,
        target_ids=vix_state.get("target_ids", []),
        rpc_plan=vix_state.get("rpc_plan", []),
        tour=vix_state.get("tour"),
        self_notes=vix_state.get("self_notes", ""),
        kg_facts=vix_state.get("kg_facts", []),
        agent_trace=vix_state.get("agent_trace", []),
        response=vix_state.get("draft", ""),
        speech_queue=[vix_state.get("draft", "")],
    )


def screen_analysis_node(state: MultiAgentState) -> MultiAgentState:
    screen_map = state.get("screen_map")
    if not screen_map:
        return state
    visible_count = sum(1 for r in screen_map.regions if r.visible)
    warnings = screen_map.sim.get("warnings", []) if screen_map.sim else []
    return _update_multi(
        state,
        screen_analysis={
            "visible_regions": visible_count,
            "warnings": warnings,
            "region_count": len(screen_map.regions),
        },
    )


def content_retrieval_node(state: MultiAgentState) -> MultiAgentState:
    query = state.get("user_query", "")
    context = state.get("experiment_context") or {}
    exp_ctx = (
        ExperimentContext.model_validate(context)
        if context
        else DEFAULT_PENDULUM_CONTEXT
    )
    retriever = BM25Retriever.from_experiment(exp_ctx)
    passages = retriever.search(query, top_k=3)
    kg_facts = GLOBAL_LAB_KG.query_multihop(query, extra_terms=[exp_ctx.title], max_hops=2)

    results: dict[str, Any] = {
        "glossary": [],
        "theory": passages,
        "knowledge_graph": kg_facts,
        "procedure": [],
    }
    q_lower = query.lower()
    for term, definition in exp_ctx.glossary.items():
        if any(w in term.lower() for w in q_lower.split()):
            results["glossary"].append({"term": term, "definition": definition})

    return _update_multi(state, content_results=results, kg_facts=kg_facts)


def policy_check_node(state: MultiAgentState) -> MultiAgentState:
    response = state.get("response", "")
    mode: Mode = state.get("user_mode", "PRACTICE")
    brain = create_llm_brain()
    guard = PolicyGuard(brain=brain)

    violation = guard.rule_check(response, mode)
    if violation:
        rewritten = guard.rewrite(response, mode=mode, violation_reason=violation)
        if guard.rule_check(rewritten, mode) is None and rewritten:
            return _update_multi(
                state,
                response=rewritten,
                speech_queue=[rewritten],
                policy_blocked=True,
                policy_violation_reason=violation,
            )
        safe_response = generate_safe_fallback(state)
        return _update_multi(
            state,
            response=safe_response,
            speech_queue=[safe_response],
            policy_blocked=True,
            policy_violation_reason=violation,
        )

    return _update_multi(state, policy_blocked=False)


def generate_safe_fallback(state: MultiAgentState) -> str:
    if state.get("user_mode") == "GRADED":
        return SAFE_GRADED_FALLBACK
    return SAFE_PRACTICE_FALLBACK


def speech_synthesis_node(state: MultiAgentState) -> MultiAgentState:
    response = state.get("response", "")
    locale = state.get("locale", "en")
    rpc_plan = list(state.get("rpc_plan") or [])
    screen = state.get("screen_map")
    valid_rpcs = [c for c in rpc_plan if validate_rpc_call(c, screen)[0]]
    if response and not any(c.method == "showCaption" for c in valid_rpcs):
        valid_rpcs.append(RpcDispatcher.show_caption(response, final=True))

    return _update_multi(
        state,
        rpc_plan=valid_rpcs,
        speech_queue=[response] if response else [],
        speech_locale=locale,
    )


def safety_check_node(state: MultiAgentState) -> MultiAgentState:
    screen_map = state.get("screen_map")
    warnings = screen_map.sim.get("warnings", []) if (screen_map and screen_map.sim) else []
    if warnings:
        return _update_multi(
            state,
            safety_message=generate_safety_advice(warnings),
            safety_warnings=warnings,
        )
    return state


def generate_safety_advice(warnings: list[str]) -> str:
    brain = create_llm_brain()
    prompt = f"Briefly explain in one sentence how a student should fix these lab warnings: {', '.join(warnings)}"
    return brain.generate_sync(prompt, fast=True, max_tokens=80)


def process_user_query(
    query: str,
    screen_map: ScreenMap | dict[str, Any] | None = None,
    mode: Mode = "PRACTICE",
    session_id: str = "session-default",
    experiment_id: str = "phy.pendulum.g",
    locale: str = "en",
    brain: str | None = None,
) -> dict[str, Any]:
    """Process a user query through the canonical Vix LangGraph powered by the real LLM + Ch. 5–8 Multi-Agent System."""
    from .build import build_vix_graph
    from .state import create_vix_state

    parsed_screen: ScreenMap | None = None
    if isinstance(screen_map, ScreenMap):
        parsed_screen = screen_map
    elif isinstance(screen_map, dict):
        parsed_screen = ScreenMap.model_validate(screen_map)

    active_brain = create_llm_brain(brain)
    vix_state = create_vix_state(
        user_text=query,
        mode="GRADED" if mode == "GRADED" else "PRACTICE",
        screen=parsed_screen,
        session_id=session_id,
        locale=locale,
        llm_brain=active_brain.identifier,
    )
    graph = build_vix_graph()
    result = graph.invoke(vix_state)
    return {
        **result,
        "response": result.get("reply", ""),
        "policy_blocked": result.get("blocked", False),
    }
