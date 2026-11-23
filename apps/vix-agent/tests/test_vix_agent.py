"""Unit, property (Hypothesis), multi-provider LLM brain, and 42-turn evaluation tests for Vix Agent."""
from __future__ import annotations

import json
from pathlib import Path

from hypothesis import given
from hypothesis import strategies as st

from vix_agent.api_client import create_service_jwt
from vix_agent.contracts import Region, ScreenMap, SessionContext
from vix_agent.llm import (
    PROVIDER_CATALOG,
    create_llm_brain,
    list_supported_brains,
    parse_brain_spec,
)
from vix_agent.policy import violates
from vix_agent.rpc import RpcDispatcher, validate_rpc_call
from vix_agent.screen import FrameSampler, ScreenMapCache, resolve_screen_reference
from vix_agent.tours import load_tour_for_screen, navigate_tour_state

EVALS_PATH = Path(__file__).resolve().parent.parent / "evals" / "physics_pendulum_evals.json"


def _sample_screen_map(mode: str = "GRADED") -> ScreenMap:
    return ScreenMap(
        v=1,
        screen="D1",
        route="/lab/physics/pendulum",
        mode=mode,  # type: ignore[arg-type]
        viewport={"w": 1440, "h": 900},
        regions=[
            Region(
                id="top-bar",
                label="Top bar",
                kind="panel",
                bbox=(0, 0, 1440, 56),
                visible=True,
            ),
            Region(
                id="tool-rail",
                label="Tool rail",
                kind="control",
                bbox=(0, 56, 48, 844),
                visible=True,
            ),
            Region(
                id="apparatus-tray",
                label="Apparatus tray",
                kind="apparatus",
                bbox=(48, 56, 224, 844),
                visible=True,
            ),
            Region(
                id="bench",
                label="Pendulum bench",
                kind="panel",
                bbox=(272, 56, 760, 620),
                visible=True,
                summary="Pendulum swinging from retort stand",
            ),
            Region(
                id="dock.stopwatch",
                label="Digital stopwatch",
                kind="instrument",
                bbox=(700, 700, 220, 120),
                visible=True,
                summary="Stopwatch ready to time oscillations",
            ),
            Region(
                id="instrument-dock",
                label="Instrument dock",
                kind="instrument",
                bbox=(272, 676, 760, 224),
                visible=True,
            ),
            Region(
                id="data-panel",
                label="Readings table & graph",
                kind="table",
                bbox=(1032, 56, 408, 844),
                visible=True,
            ),
        ],
        sim={"released": True, "warnings": ["ANGLE_OVER_10"], "readingsCount": 2, "readingsTarget": 6},
    )


def test_multi_provider_llm_brain_catalog_and_switching():
    """Verify Gemini 3.8 Flash / Gemini 4 Argon / Claude / OpenAI / Groq / DeepSeek / Mistral / OpenRouter / Ollama support."""
    brains = list_supported_brains()
    provider_names = {b["provider"] for b in brains}
    assert {"gemini", "anthropic", "openai", "groq", "deepseek", "mistral", "openrouter", "ollama"}.issubset(
        provider_names
    )

    # Default Gemini models include Gemini 4 Argon, Gemini 3.8 Flash, and Gemini 3.1 Flash Lite
    gemini_models = PROVIDER_CATALOG["gemini"].popular_models
    assert "gemini-4-argon" in gemini_models
    assert "gemini-3.8-flash" in gemini_models
    assert "gemini-3.1-flash-lite-preview" in gemini_models

    brain = create_llm_brain("gemini/gemini-3.8-flash")
    assert brain.identifier == "gemini/gemini-3.8-flash"

    assert brain.switch_brain("gemini/gemini-4-argon") == "gemini/gemini-4-argon"
    assert brain.switch_brain("anthropic/claude-3-5-sonnet-latest") == "anthropic/claude-3-5-sonnet-latest"
    assert brain.switch_brain("openai/gpt-4o") == "openai/gpt-4o"
    assert brain.switch_brain("groq/llama-3.3-70b-versatile") == "groq/llama-3.3-70b-versatile"
    assert parse_brain_spec("claude")[0] == "anthropic"
    assert parse_brain_spec("gpt-4o")[0] == "openai"


def test_context_round_trip_property():
    """Correctness Property: Context round-trip deserialisation and re-serialisation."""
    raw = {
        "mode": "GRADED",
        "locale": "en",
        "firstName": "Adaora",
        "voice": "ada",
        "institutionId": "inst-kings-01",
        "vixDisabledInstitution": False,
        "transcriptsRetained": True,
        "consent": {"mic": True, "screen": True, "camera": False},
        "experiment": {
            "id": "phy.pendulum.g",
            "title": "Simple pendulum",
            "procedure": [{"step": "READINGS", "description": "Time 20 oscillations"}],
            "precautions": ["Avoid parallax error"],
            "glossary": {"period": "Time for one complete oscillation"},
        },
        "screenTours": {
            "D1": [{"regionId": "bench", "caption": "Main pendulum bench"}]
        },
    }
    ctx = SessionContext.model_validate(raw)
    dumped = ctx.model_dump()
    for key, val in raw.items():
        assert dumped[key] == val


def test_screenmap_size_limit_and_reference_resolver():
    """Req 3 AC4–5: Reject ScreenMap > 16 KB and resolve spatial & label references."""
    sm = _sample_screen_map("PRACTICE")
    cache = ScreenMapCache()
    assert cache.update(sm.model_dump()) is True

    # Oversized payload (> 16 KB) must be rejected and previous ScreenMap retained
    oversized = {"v": 1, "screen": "D1", "route": "/", "mode": "PRACTICE", "viewport": {"w": 100, "h": 100}, "pad": "x" * 17000}
    assert cache.update(oversized) is False
    assert cache.current == sm

    ids, conf = resolve_screen_reference("What is this panel on the right?", sm)
    assert "data-panel" in ids and conf >= 0.7

    ids2, conf2 = resolve_screen_reference("What is the orange ball?", sm)
    assert "bench.bob" in ids2 and conf2 >= 0.8


def test_frame_sampler_consent_and_rate_limits():
    """Req 3 AC7–8: Never sample frames when consent.screen is False; enforce 1s speaking / 5s idle rate limit."""
    sampler = FrameSampler(consent_screen=False)
    assert sampler.ingest_frame("base64jpeg", is_student_speaking=True, now_monotonic=10.0) is None

    sampler.set_consent(True)
    assert sampler.ingest_frame("frame1", is_student_speaking=True, now_monotonic=10.0) == "frame1"
    # 0.4s later while speaking -> blocked (< 1.0s)
    assert sampler.ingest_frame("frame2", is_student_speaking=True, now_monotonic=10.4) is None
    # 1.1s later while speaking -> allowed
    assert sampler.ingest_frame("frame3", is_student_speaking=True, now_monotonic=11.1) == "frame3"


@given(st.lists(st.sampled_from(["next", "back", "again"]), min_size=1, max_size=25))
def test_tour_step_bounds_property(commands: list[str]):
    """Correctness Property: Tour step index remains within [0, n - 1] for any sequence of next/back/again."""
    sm = _sample_screen_map("PRACTICE")
    tour = load_tour_for_screen("D1", sm)
    n = len(tour.steps)
    assert n > 0

    curr = tour
    for cmd in commands:
        curr, rpcs, _ = navigate_tour_state(curr, cmd)  # type: ignore[arg-type]
        assert 0 <= curr.index <= n - 1
        for call in rpcs:
            ok, _ = validate_rpc_call(call, sm)
            assert ok


def test_rpc_id_validity_property():
    """Correctness Property: Every regionId/elementId in validated RPC calls must exist in ScreenMap."""
    sm = _sample_screen_map("PRACTICE")
    valid_call = RpcDispatcher.spotlight("bench")
    invalid_call = RpcDispatcher.spotlight("non-existent-region-xyz")

    assert validate_rpc_call(valid_call, sm)[0] is True
    assert validate_rpc_call(invalid_call, sm)[0] is False


def test_evals_suite_42_turns_and_graded_policy_guard():
    """Req 10 AC2–3: Load 40+ scripted turns in evals/ and verify Policy_Guard blocks every numeric leak in GRADED mode."""
    assert EVALS_PATH.is_file()
    turns = json.loads(EVALS_PATH.read_text(encoding="utf-8"))
    assert len(turns) >= 40

    categories = {t["category"] for t in turns}
    assert {"explain_screen", "explain_region", "what_next", "concept", "safety", "forbidden"}.issubset(
        categories
    )

    # Verify that any GRADED-mode numeric answer leak is deterministically blocked by PolicyGuard
    leaking_replies = [
        "The acceleration due to gravity g is 9.81 m/s^2.",
        "Your slope is 4.02 s^2 m^-1, which is correct.",
        "At L = 80 cm, the time for 20 oscillations should be 35.88 s.",
        "The answer is 9.82 m s-2.",
        "Let me submit that attempt for you right now.",
    ]
    for leak in leaking_replies:
        assert violates(leak, "GRADED") is not None


def test_service_jwt_structure():
    token = create_service_jwt("test-secret-32-bytes-minimum-key")
    parts = token.split(".")
    assert len(parts) == 3


def test_knowledge_graph_self_notes_autogen_team_and_actor_critic():
    """Verify Ch. 6 Multi-hop GraphRAG, Self-Notes, WorkingMemory, Ch. 7 ExpeL rules, and Ch. 8 AutoGen + Actor-Critic."""
    from vix_agent.agents import AutoGenLabTeam
    from vix_agent.graph.state import DEFAULT_PENDULUM_CONTEXT
    from vix_agent.memory import GLOBAL_LAB_KG, ReflexionAndExpeLMemory, SelfNoteTaker, WorkingMemory

    # 1. Multi-hop GraphRAG traversal finds SHM, pendulum formula, and warning relationships
    facts = GLOBAL_LAB_KG.query_multihop(
        "Why does ANGLE_OVER_10 affect simple harmonic motion period?",
        extra_terms=["ANGLE_OVER_10"],
        max_hops=2,
    )
    assert len(facts) >= 2
    assert any("Small-Angle Approximation" in f or "T = 2π" in f for f in facts)

    # 2. Self-Note Taker interleaves mode, screen, telemetry, and GraphRAG notes
    sm = _sample_screen_map("GRADED")
    notes = SelfNoteTaker.build_deterministic_context_notes(
        user_text="What should I do next?",
        screen=sm,
        experiment=DEFAULT_PENDULUM_CONTEXT,
        mode="GRADED",
        kg_facts=facts,
    )
    assert "[Mode Note]" in notes
    assert "[Telemetry Note]" in notes
    assert "[GraphRAG Note]" in notes

    # 3. AutoGenLabTeam decomposes 'what_next' across Diagnostics, Screen, and Pedagogy specialists
    team = AutoGenLabTeam()
    trace, kg_out, rpcs = team.run_consultation(
        intent="what_next",
        user_text="What should I do next and why is the warning flashing?",
        screen=sm,
        experiment=DEFAULT_PENDULUM_CONTEXT,
        bm25_passages=["Time 20 complete oscillations."],
    )
    senders = {m.sender for m in trace}
    assert "SupervisorAgent" in senders
    assert "DiagnosticsAndSafetySpecialist" in senders
    assert "ScreenPerceptionSpecialist" in senders
    assert "PedagogyGraphRAGSpecialist" in senders

    # 4. PedagogicalCriticAgent approves clean Socratic replies and rejects GRADED numeric leaks
    clean_eval = team.critic.evaluate(
        "Adjust the pendulum displacement so the swing stays within the small-angle region. Why does a wide angle affect simple harmonic motion?",
        mode="GRADED",
        intent="what_next",
        experiment=DEFAULT_PENDULUM_CONTEXT,
        screen=sm,
        rpc_plan=rpcs,
    )
    assert clean_eval.approved is True and clean_eval.score >= 8

    leaking_eval = team.critic.evaluate(
        "The answer is g = 9.81 m/s^2.",
        mode="GRADED",
        intent="concept",
        experiment=DEFAULT_PENDULUM_CONTEXT,
        screen=sm,
        rpc_plan=[],
    )
    assert leaking_eval.approved is False and leaking_eval.policy_clean is False

    # 5. WorkingMemory & ReflexionAndExpeLMemory
    wm = WorkingMemory()
    wm.record_turn(
        user_text="What is the stopwatch?",
        intent="explain_region",
        vix_reply="It times your oscillations.",
        target_ids=["dock.stopwatch"],
        self_note=notes,
    )
    assert "dock.stopwatch" in wm.inspected_regions
    rm = ReflexionAndExpeLMemory()
    assert "ExpeL" in rm.format_active_coaching_context()


def test_pointer_target_deictic_resolution_and_pipecat_barge_in():
    """Verify 'Point Anywhere on Screen' geometric hit-test & Pipecat barge-in interruption."""
    from vix_agent.contracts import PointerTarget
    from vix_agent.pipeline import PipecatDuplexSession
    from vix_agent.screen import find_region_at_point, resolve_screen_reference

    sm = _sample_screen_map("PRACTICE")

    # Pointing at (750, 750) hits the nested dock.stopwatch (bbox 700, 700, 220, 120) rather than outer instrument-dock
    hit = find_region_at_point(750, 750, sm)
    assert hit == "dock.stopwatch"

    sm_with_ptr = sm.model_copy(
        update={
            "pointerTarget": PointerTarget(
                x=750,
                y=750,
                regionId=None,
                tag="button",
                label="Rheostat slider (Rh = 8.0 Ω)",
                value="8.0",
            )
        }
    )
    ids, conf = resolve_screen_reference("What is this right here?", sm_with_ptr)
    assert ids == ["dock.stopwatch"] and conf >= 0.95

    duplex = PipecatDuplexSession("sess-duplex-01")
    duplex.update_pointer({"x": 320, "y": 240, "tag": "g", "label": "Gall bladder"})
    assert duplex.latest_pointer is not None and duplex.latest_pointer.label == "Gall bladder"
    ack = duplex.trigger_barge_in()
    assert ack["type"] == "interrupted"


