"""Native Full-Duplex Gemini 3.1 Flash Live + LangGraph Multi-Agent Realtime Voice Bridge.

Modeled directly on `luminarix/voice-router` (`pipelines/native.py` + `transports/web_transport.py`),
upgraded for Vixir's virtual science laboratory:
- Streams raw 16 kHz mono 16-bit PCM binary frames continuously from the browser WebSocket to
  Google's `models/gemini-3.1-flash-live-preview` BidiGenerateContent WebSocket.
- Streams raw 24 kHz mono 16-bit PCM audio frames back to the browser in ~250–400 ms (no push-TTS!).
- Native server-side VAD (`automaticActivityDetection`) with true mid-sentence barge-in interruption
  (`serverContent.interrupted` -> immediate browser audio buffer flush).
- Native real-time `inputAudioTranscription` and `outputAudioTranscription` streamed live as both
  the student and Vix speak.
- Real Function-Calling Tools backed by our LangGraph Multi-Agent Specialists, Multi-Hop
  `LabKnowledgeGraph` (GraphRAG), `BM25Retriever`, `BenchArchitectSpecialist`, and `PolicyGuard`.
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
from typing import Any

import aiohttp
from aiohttp import web

from .agents import AutoGenLabTeam
from .contracts import Mode, PointerTarget, ScreenMap
from .graph.nodes import BM25Retriever, _clean_spoken_text
from .graph.state import resolve_experiment_context
from .llm import _load_env_files
from .memory import GLOBAL_LAB_KG
from .tts import VOICE_PERSONA_MAP

logger = logging.getLogger("vix.realtime_live")

_load_env_files()

GEMINI_LIVE_MODEL = "models/gemini-3.1-flash-live-preview"
GEMINI_LIVE_WS_URL = (
    "wss://generativelanguage.googleapis.com/ws/"
    "google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
)

_TEAM = AutoGenLabTeam()

# Tool declarations exposed directly to Gemini 3.1 Flash Live
VIX_LIVE_TOOLS: list[dict[str, Any]] = [
    {
        "functionDeclarations": [
            {
                "name": "inspect_student_screen",
                "description": (
                    "Inspect the student's live lab screen state right now: returns exact experiment name, "
                    "number of readings currently recorded in the table, recorded lengths/values, active warnings, "
                    "visible panels, and the exact component or slider the student is currently pointing at."
                ),
                "parameters": {"type": "OBJECT", "properties": {}},
            },
            {
                "name": "consult_science_knowledge_graph",
                "description": (
                    "Query Vixir's multi-hop Laboratory Knowledge Graph (GraphRAG) and WAEC/NECO curriculum "
                    "briefing for verified theory, formulas, experimental precautions, and error diagnosis."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "query": {
                            "type": "STRING",
                            "description": "The scientific concept, formula, warning, or procedure question.",
                        }
                    },
                    "required": ["query"],
                },
            },
            {
                "name": "spotlight_region",
                "description": (
                    "Move Vix's animated glowing orange pointer & spotlight box directly onto ANY specific component "
                    "or side of the student's screen so the pointer glides to match what you are explaining. "
                    "Top-bar sub-components: 'top-back' (Back to labs arrow), 'top-title' (Experiment title & practical switcher dropdown), "
                    "'top-labs' (Physics/Chemistry/Electronics/Engineering lab switcher), 'top-vix' (Call Vix toggle), 'top-next' (Analyse results / Plot graph button). "
                    "Workspace sides: 'tool-rail' (far-left 5 tool icons), 'apparatus-tray' (left equipment list & conditions), "
                    "'bench' (center interactive experiment stage), 'instrument-dock' (bottom sliders, stopwatch/meters & Record button), "
                    "'event-log' (bottom timestamped log strip), 'data-panel' (right readings table, live graph & notebook)."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "region_id": {
                            "type": "STRING",
                            "description": (
                                "Exact target ID: top-back, top-title, top-labs, top-vix, top-next, "
                                "tool-rail, apparatus-tray, bench, instrument-dock, event-log, or data-panel."
                            ),
                        },
                        "label": {
                            "type": "STRING",
                            "description": "Short human-readable pointer badge label, e.g. 'Practical Switcher Dropdown' or 'Bottom Instrument Dock'.",
                        },
                    },
                    "required": ["region_id"],
                },
            },
            {
                "name": "start_studio_tour",
                "description": (
                    "Start an autonomous interactive spotlight tour around the student's active lab studio "
                    "when the student says they want a tour or overview of the workspace."
                ),
                "parameters": {"type": "OBJECT", "properties": {}},
            },
            {
                "name": "start_tutorial_sandbox",
                "description": (
                    "Enter Live Tutorial Sandbox Mode on the student's ACTUAL lab bench so you can construct and "
                    "demonstrate an analogous example from scratch while they watch (their own real saved readings "
                    "and circuit are safely preserved and untouched). On Pendulum Lab you run a Mars-gravity "
                    "sandbox pendulum (g_demo = 3.72 m/s^2). On Electronics Lab you have 6 curated, properly-wired "
                    "analogous demos you can animate step by step by passing `demo_id`: "
                    "'ohms_10ohm_analog' (10 Ω carbon resistor Ohm's law), 'series_resistors' (5 Ω + 10 Ω in series), "
                    "'parallel_resistors' (10 Ω || 10 Ω in parallel), 'led_current_limiter' (Green LED + 10 Ω limiter), "
                    "'diode_forward_bias' (Si diode 0.65 V + 5 Ω), 'rc_branch' (10 Ω || 100 µF capacitor). "
                    "Omit `demo_id` only if you want an empty board to place & wire custom components one by one."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "scenario_title": {
                            "type": "STRING",
                            "description": "Short title for the analogous tutorial demo banner, e.g. 'Tutorial Demo: Pendulum on Mars (g = 3.72 m/s²)'",
                        },
                        "analog_note": {
                            "type": "STRING",
                            "description": "Brief note explaining why this analogous setup teaches the exact method without giving away their graded answer.",
                        },
                        "demo_id": {
                            "type": "STRING",
                            "description": (
                                "Optional Electronics demo preset ID to build and wire step by step cleanly: "
                                "ohms_10ohm_analog | series_resistors | parallel_resistors | led_current_limiter | diode_forward_bias | rc_branch."
                            ),
                        },
                    },
                    "required": ["scenario_title"],
                },
            },
            {
                "name": "operate_bench_control",
                "description": (
                    "Physically operate a real control on the student's lab bench during a Live Tutorial Sandbox "
                    "so the student watches you build and perform the experiment step by step! "
                    "Pendulum actions: 'place_protractor', 'set_length_cm' (value 30..100), 'set_release_angle' (value 5..25), "
                    "'set_eye_level' (value 1 or 0), 'toggle_swing' (value 1 or 0), 'start_stopwatch', 'stop_stopwatch', "
                    "'reset_stopwatch', 'record_demo_trial'. "
                    "Engineering Beam Deflection actions: 'set_material' (material: 'aluminium'|'brass'|'steel'), 'set_span' (value: 0.6|0.8|1.0), "
                    "'zero_gauge', 'set_masses' (value 0..10, in 100g steps), 'add_mass', 'remove_mass', 'tap_bench', "
                    "'set_phase' (phase: 'loading'|'unloading'), 'set_view' (view: 'isometric'|'elevation'), 'record_demo_trial'. "
                    "Engineering Isometric Drawing actions: 'draw_iso_crate' (2H boxing-in crate), 'draw_iso_outlines' (HB visible outlines), "
                    "'draw_iso_hidden' (dashed hidden edges), 'select_exercise' (exercise_id: stepped_block|slotted_block|l_bracket|cylindrical_boss), "
                    "'set_projection_angle' (angle: first|third), 'toggle_guide' (value 1 or 0), 'check_accuracy'. "
                    "Electronics actions: 'load_demo_circuit' (demo_id: ohms_10ohm_analog|series_resistors|parallel_resistors|led_current_limiter|diode_forward_bias|rc_branch — PREFERRED for clean animated step-by-step wiring!), "
                    "'clear_board', 'add_component' (component_kind: battery|rheostat|ammeter|voltmeter|wireX|key|resistor|led|diode|capacitor, optional node_id, value, x, y — returns exact node_id), "
                    "'wire_components' (from_node, from_term, to_node, to_term — ALWAYS use the exact node_id returned by add_component, e.g. battery1, rheostat1, ammeter1, resistor1, voltmeter1, key1), "
                    "'set_rheostat' (value 0..20), 'set_emf' (value 1.5..6.0), 'toggle_key' (value 1 or 0), 'record_demo_trial'."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "action": {
                            "type": "STRING",
                            "description": "The exact bench action name to execute visibly on screen.",
                        },
                        "demo_id": {
                            "type": "STRING",
                            "description": "For Electronics load_demo_circuit: ohms_10ohm_analog, series_resistors, parallel_resistors, led_current_limiter, diode_forward_bias, or rc_branch.",
                        },
                        "value": {
                            "type": "NUMBER",
                            "description": "Optional numeric value (e.g. length in cm, angle in degrees, resistance in ohms, EMF in volts, 1 for true / 0 for false).",
                        },
                        "component_kind": {
                            "type": "STRING",
                            "description": "For Electronics add_component: battery, rheostat, ammeter, voltmeter, wireX, key, resistor, led, diode, or capacitor.",
                        },
                        "node_id": {
                            "type": "STRING",
                            "description": "Optional deterministic node ID for add_component (e.g. battery1, resistor1, voltmeter1).",
                        },
                        "x": {"type": "NUMBER", "description": "Optional X coordinate on circuit board (80..565; omit to auto-place in canonical schematic slot)."},
                        "y": {"type": "NUMBER", "description": "Optional Y coordinate on circuit board (70..330; omit to auto-place in canonical schematic slot)."},
                        "from_node": {"type": "STRING", "description": "Source node ID for wire_components (e.g. battery1, resistor1)."},
                        "from_term": {"type": "STRING", "description": "Source terminal ('a' or 'b')."},
                        "to_node": {"type": "STRING", "description": "Target node ID for wire_components (e.g. rheostat1, voltmeter1)."},
                        "to_term": {"type": "STRING", "description": "Target terminal ('a' or 'b')."},
                        "material": {"type": "STRING", "description": "For Beam Deflection set_material: aluminium, brass, or steel."},
                        "phase": {"type": "STRING", "description": "For Beam Deflection set_phase: loading or unloading."},
                        "view": {"type": "STRING", "description": "For Beam Deflection set_view: isometric or elevation."},
                        "exercise_id": {"type": "STRING", "description": "For Isometric Drawing select_exercise: stepped_block, slotted_block, l_bracket, or cylindrical_boss."},
                        "angle": {"type": "STRING", "description": "For Isometric Drawing set_projection_angle: first or third."},
                    },
                    "required": ["action"],
                },
            },
            {
                "name": "end_tutorial_sandbox",
                "description": (
                    "Exit Live Tutorial Sandbox Mode when the student understands the walkthrough and is ready "
                    "to practice on their own real bench (restores their real saved readings)."
                ),
                "parameters": {"type": "OBJECT", "properties": {}},
            },
            {
                "name": "switch_lab",
                "description": (
                    "Navigate the student's browser directly to another page, laboratory, or practical bench anywhere on Vixir "
                    "(while keeping this live voice conversation active!). Valid routes: "
                    "'/app' (Student Dashboard), '/labs' (Laboratories Hub), '/library' (Experiment Library), "
                    "'/apparatus' (123-Item Apparatus Encyclopedia), '/attempt/demo/results' (Results & Graph), "
                    "'/attempt/demo/report' (Marked Report / Lab Notebook), "
                    "'/lab/physics/pendulum', '/lab/physics/refraction', '/lab/physics/moments', "
                    "'/lab/chemistry/titration', '/lab/chemistry/qualitative-analysis', "
                    "'/lab/electronics/ohms-law', '/lab/engineering/beam'. "
                    "NOTE: Biology labs are currently disabled (coming soon) and cannot be opened."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "lab_route": {
                            "type": "STRING",
                            "description": "Exact target route such as '/lab/chemistry/titration', '/apparatus', or '/app'.",
                        }
                    },
                    "required": ["lab_route"],
                },
            },
            {
                "name": "build_circuit_setup",
                "description": (
                    "Draw and wire a requested circuit topology on the student's Electronics schematic board "
                    "(e.g. parallel resistors, LED branch, silicon diode, smoothing capacitor, or second ammeter)."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "description": {
                            "type": "STRING",
                            "description": "Description of the circuit to draw and wire.",
                        }
                    },
                    "required": ["description"],
                },
            },
        ]
    }
]


def _resolve_live_voice(voice_id: str) -> tuple[str, str]:
    cleaned = (voice_id or "ada").strip().lower()
    gemini_voice, accent, _tone = VOICE_PERSONA_MAP.get(cleaned, VOICE_PERSONA_MAP["ada"])
    return (gemini_voice, accent)


def _build_live_system_instruction(
    *,
    first_name: str,
    experiment_title: str,
    mode: Mode,
    locale: str,
    accent: str,
    readings_count: int,
) -> str:
    graded_rule = (
        "CRITICAL GRADED-MODE ACADEMIC INTEGRITY RULE: You MUST NEVER reveal final numerical answers, "
        "calculated values of g, slopes, titres, or confirm whether a specific number is right or wrong. "
        "Always guide Socratically or demonstrate using a DIFFERENT analogous lab via show_worked_example."
        if mode == "GRADED"
        else "Guide Socratically, encouraging the student to measure and compute values themselves."
    )
    return (
        f"You are Vix, a warm, charismatic, natural-sounding virtual science laboratory teacher speaking "
        f"with a natural {accent} accent in {locale} to {first_name}.\n"
        f"Current active lab workspace: {experiment_title} (Mode: {mode}, Readings recorded so far: {readings_count}).\n\n"
        "CONVERSATIONAL STYLE:\n"
        "- Speak like a real human teacher standing right beside the student's lab bench—warm, concise (1 to 3 short sentences per turn), responsive, and conversational.\n"
        "- NEVER speak raw LaTeX (no dollar signs, no 'backslash frac', no 'backslash pi') and NEVER speak internal IDs like 'data-panel' or 'instrument-dock'. Say 'T squared', 'four pi squared over g', 'your readings table on the right', 'the controls at the bottom'.\n"
        "- Whenever the student asks about what is on their screen, what they are pointing at, or how many readings they have, ALWAYS call `inspect_student_screen` first so your answer matches their live screen 100% accurately.\n"
        "- Whenever explaining ANY part of the screen, ALWAYS call `spotlight_region` right before talking about it so the glowing pointer glides to that exact component!\n"
        "- STUDIO TOUR RULE (ALL DETAILS, MOVING POINTER PER SIDE): When the student asks for a tour of the lab studio, DO NOT stay stuck on the top bar! Walk through EVERY component across all sides one section at a time, calling `spotlight_region` on each exact component:\n"
        "  • Top bar details: `top-back` (back to laboratories), `top-title` (active practical title & dropdown to switch practicals in the discipline), `top-labs` (lab switcher pills across Physics, Chemistry, Electronics, Engineering, with Biology coming soon), `top-vix` (Vix voice toggle), and `top-next` (Analyse results / Plot graph).\n"
        "  • Left side: `tool-rail` (5 bench tools on the far left) and `apparatus-tray` (the active lab's equipment/rig setup panel—describe what is actually on THIS lab's screen, never invent Pendulum terms like 'air drag' on Beam or Electronics!).\n"
        "  • Center: `bench` (the active lab's live interactive experiment canvas in the center).\n"
        "  • Bottom: `instrument-dock` (the active lab's bottom controls, meters/gauges, and Record button) and `event-log` (timestamped practical replay log).\n"
        "  • Right side: `data-panel` (the active lab's readings table, Live graph preview, and Assistant).\n"
        "  Cover 2–3 related components per turn, calling `spotlight_region` for each, then ask if they have questions before moving to the next side!\n"
        "LIVE BENCH TUTORIAL WALKTHROUGH (CRITICAL — NO HARDCODED 4-STEP SCRIPT!):\n"
        "- If the student asks you to walk them through an example or show them how to do the practical:\n"
        "  1. On Pendulum Lab: call `start_tutorial_sandbox` with a Mars-gravity pendulum sandbox, then operate controls step by step (`place_protractor` -> `set_length_cm` -> `set_release_angle` -> `set_eye_level` -> `start_stopwatch` -> `stop_stopwatch` -> `record_demo_trial`).\n"
        "  2. On Engineering Beam Deflection Lab: call `start_tutorial_sandbox` (automatically switches to an analogous Aluminium beam at 0.800 m span with an empty hanger so their Mild Steel bench stays untouched!), then operate controls step by step: `zero_gauge` -> `set_masses(2)` -> `tap_bench` -> `record_demo_trial` -> `set_masses(4)` -> `tap_bench` -> `record_demo_trial` -> `set_phase('unloading')` -> `set_masses(2)` -> `tap_bench` -> `record_demo_trial` so they see both loading & unloading hysteresis and the live δ-vs-W plot!\n"
        "  3. On Electronics Lab: you have SIX curated, properly-wired analogous demos! ALWAYS prefer passing `demo_id` to `start_tutorial_sandbox` or calling `operate_bench_control(action='load_demo_circuit', demo_id=...)` so the board clears and visibly places every component and orthogonal wire cleanly step by step with guaranteed closed-loop physics:\n"
        "     • `ohms_10ohm_analog` — 10 Ω Carbon Resistor Ohm's Law verification (great first demo!)\n"
        "     • `series_resistors` — Two Resistors in Series (5 Ω + 10 Ω = 15 Ω)\n"
        "     • `parallel_resistors` — Two Resistors in Parallel (10 Ω || 10 Ω = 5 Ω)\n"
        "     • `led_current_limiter` — Green LED + 10 Ω Current-Limiting Resistor\n"
        "     • `diode_forward_bias` — Silicon Diode Forward Bias (0.65 V knee + 5 Ω)\n"
        "     • `rc_branch` — RC Parallel Capacitor Branch (10 Ω || 100 µF)\n"
        "     After wiring the demo, step through adjusting `set_rheostat` and `record_demo_trial` across 2–3 settings so they see the live ammeter/voltmeter needles move and the V–I graph plot! Tell the student they can also ask for ANY of the other 5 Electronics demos (or click the demo pills in the banner)!\n"
        "     If you ever build a custom circuit manually with `add_component`, omit `x`/`y` (auto-places cleanly in the canonical slot) and wire using the exact `node_id` returned by `add_component` (e.g. `battery1`, `rheostat1`, `ammeter1`, `resistor1`, `voltmeter1`, `key1`), making sure the series loop closes back to `battery1:b` and `voltmeter1` connects across the load.\n"
        "  3. There is NO fixed step count—take as many steps as needed until the student fully understands! After every 1–2 actions, briefly explain WHY you did that step and invite follow-up questions before proceeding.\n"
        "  4. If the student interrupts with a follow-up question or asks for a different demo, respond immediately and switch demos seamlessly with `load_demo_circuit`.\n"
        "  5. When they are confident and ready to try themselves, call `end_tutorial_sandbox` so their own real bench and readings are restored.\n"
        "- If the student asks you to switch to another laboratory or practical (Physics Pendulum, Refraction, Moments, Chemistry Titration, Qualitative Salt Analysis, Electronics Ohm's Law, or Engineering Beam Deflection), call `switch_lab` immediately! NOTE: Biology lab is temporarily disabled (coming soon), so if they ask for Biology, kindly explain that Biology is coming soon and offer Physics, Chemistry, Electronics, or Engineering instead.\n"
        "- If the student asks you to build or draw a circuit on the Electronics board, call `build_circuit_setup` or `operate_bench_control`.\n"
        "- For physics/chemistry/biology/electronics/engineering theory or precautions, call `consult_science_knowledge_graph` so your explanation is grounded in WAEC/NECO curriculum.\n"
        f"- {graded_rule}\n"
    )


class GeminiLiveVixBridge:
    """Full-duplex WebSocket bridge between Browser Audio/ScreenMap and Gemini 3.1 Flash Live."""

    def __init__(
        self,
        browser_ws: web.WebSocketResponse,
        *,
        session_id: str,
        first_name: str = "Student",
        voice_id: str = "ada",
        locale: str = "English",
        mode: Mode = "PRACTICE",
        experiment_title: str = "Simple pendulum — determination of g",
        initial_screen_map: ScreenMap | None = None,
    ) -> None:
        self.browser_ws = browser_ws
        self.session_id = session_id
        self.first_name = first_name.split()[0] or "Student"
        self.voice_id = voice_id
        self.locale = locale
        self.mode: Mode = mode
        self.experiment_title = experiment_title
        self.is_authenticated: bool = False
        self.current_route: str = (
            initial_screen_map.route if initial_screen_map else "/lab/physics/pendulum"
        )
        self.screen_map: ScreenMap | None = initial_screen_map
        self.pointer_target: PointerTarget | None = (
            initial_screen_map.pointerTarget if initial_screen_map else None
        )
        self._closed = False
        self._gemini_ws: aiohttp.ClientWebSocketResponse | None = None
        self._turn_user_transcript = ""
        self._turn_assistant_transcript = ""
        self._sandbox_kind_counts: dict[str, int] = {}

    async def send_browser_json(self, payload: dict[str, Any]) -> None:
        if not self.browser_ws.closed and not self._closed:
            try:
                await self.browser_ws.send_str(json.dumps(payload))
            except Exception:
                self._closed = True

    async def send_browser_audio(self, pcm_bytes: bytes) -> None:
        if not self.browser_ws.closed and not self._closed:
            try:
                await self.browser_ws.send_bytes(pcm_bytes)
            except Exception:
                self._closed = True

    async def _execute_tool(self, name: str, args: dict[str, Any]) -> dict[str, Any]:
        """Execute a live Vix LangGraph/Screen/RPC tool called by Gemini 3.1 Flash Live."""
        exp_ctx = resolve_experiment_context(self.screen_map)

        if name == "inspect_student_screen":
            if self.screen_map is None:
                return {
                    "experimentTitle": self.experiment_title,
                    "currentRoute": self.current_route,
                    "isAuthenticated": self.is_authenticated,
                    "mode": self.mode,
                    "readingsCount": 0,
                    "visibleRegions": ["top-bar", "tool-rail", "apparatus-tray", "bench", "instrument-dock", "data-panel"],
                    "pointerTarget": self.pointer_target.model_dump() if self.pointer_target else None,
                }
            sim = self.screen_map.sim or {}
            pt = self.pointer_target or self.screen_map.pointerTarget
            return {
                "screen": self.screen_map.screen,
                "route": self.current_route or self.screen_map.route,
                "isAuthenticated": self.is_authenticated,
                "mode": self.screen_map.mode,
                "experimentTitle": (
                    self.screen_map.experiment.title
                    if self.screen_map.experiment
                    else self.experiment_title
                ),
                "step": self.screen_map.experiment.step if self.screen_map.experiment else "READINGS",
                "readingsCount": sim.get("readingsCount", 0),
                "readingsTarget": sim.get("readingsTarget", 6),
                "recordedLengths": sim.get("recordedLengths", []),
                "warnings": sim.get("warnings", []),
                "pointerTarget": pt.model_dump() if pt else None,
                "visibleRegions": [
                    {"id": r.id, "label": r.label, "summary": r.summary}
                    for r in self.screen_map.regions
                    if r.visible
                ],
            }

        if name == "consult_science_knowledge_graph":
            q = str(args.get("query") or self.experiment_title)
            kg_facts = GLOBAL_LAB_KG.query_multihop(q, extra_terms=[exp_ctx.title], max_hops=2)
            bm25 = BM25Retriever.from_experiment(exp_ctx).search(q, top_k=2)
            return {
                "experiment": exp_ctx.title,
                "knowledgeGraphFacts": kg_facts[:5],
                "curriculumPassages": bm25,
                "precautions": exp_ctx.precautions[:3],
            }

        if name == "spotlight_region":
            rid = str(args.get("region_id") or "bench")
            lbl = str(args.get("label") or "")
            await self.send_browser_json(
                {
                    "type": "rpc",
                    "method": "spotlight",
                    "payload": {"regionId": rid, "label": lbl, "durationMs": 7000},
                }
            )
            return {"spotlighted": rid, "label": lbl, "status": "ok"}

        if name == "start_studio_tour":
            await self.send_browser_json({"type": "ui_action", "action": "start_tour"})
            return {
                "status": "tour_started",
                "tourPlan": [
                    "1. Top Bar details: top-back, top-title, top-labs, top-vix, top-next",
                    "2. Left Side: tool-rail (5 tools) & apparatus-tray (equipment & seed)",
                    "3. Center: bench (interactive apparatus)",
                    "4. Bottom: instrument-dock (controls & stopwatch/meters) & event-log",
                    "5. Right Side: data-panel (readings table, delete row, live graph)",
                ],
                "instruction": (
                    "Start with the Top Bar sub-components (calling spotlight_region on top-back, top-title, top-labs, top-next) "
                    "and explain each clearly, then ask if they are ready to move to the Left Side (tool-rail & apparatus-tray)!"
                ),
            }

        if name == "start_tutorial_sandbox":
            self._sandbox_kind_counts.clear()
            title = str(
                args.get("scenario_title")
                or f"Live Tutorial Sandbox · {exp_ctx.title} (Analogous Demo)"
            )
            note = str(
                args.get("analog_note")
                or "Your own real readings are safely saved while Vix demonstrates from scratch."
            )
            demo_id = str(args.get("demo_id") or "").strip()
            params: dict[str, Any] = {"scenarioTitle": title, "analogNote": note}
            if demo_id:
                params["demo_id"] = demo_id
            await self.send_browser_json(
                {
                    "type": "bench_control",
                    "action": "start_tutorial_sandbox",
                    "params": params,
                }
            )
            return {
                "status": "tutorial_sandbox_active",
                "scenarioTitle": title,
                "demo_id": demo_id or None,
                "availableElectronicsDemos": [
                    "ohms_10ohm_analog",
                    "series_resistors",
                    "parallel_resistors",
                    "led_current_limiter",
                    "diode_forward_bias",
                    "rc_branch",
                ],
                "nextHint": (
                    "The circuit demo is animating step by step on the bench with clean orthogonal wiring and key closed. "
                    "Explain the wiring, then adjust set_rheostat and call record_demo_trial to plot V–I points, or switch to another demo with load_demo_circuit."
                    if demo_id
                    else "The real bench is now in Tutorial Sandbox Mode. On Electronics, call operate_bench_control(action='load_demo_circuit', demo_id='ohms_10ohm_analog') for guaranteed clean step-by-step wiring, or place components with add_component."
                ),
            }

        if name == "operate_bench_control":
            action = str(args.get("action") or "")
            params = {k: v for k, v in args.items() if k != "action"}
            if action in ("clear_board", "load_demo_circuit"):
                self._sandbox_kind_counts.clear()
            assigned_node_id: str | None = None
            if action == "add_component":
                kind = str(params.get("component_kind") or "resistor")
                next_idx = self._sandbox_kind_counts.get(kind, 0) + 1
                self._sandbox_kind_counts[kind] = next_idx
                assigned_node_id = str(params.get("node_id") or f"{kind}{next_idx}")
                params["node_id"] = assigned_node_id
            await self.send_browser_json(
                {
                    "type": "bench_control",
                    "action": action,
                    "params": params,
                }
            )
            resp: dict[str, Any] = {
                "status": "executed_on_live_bench",
                "action": action,
                "params": params,
            }
            if assigned_node_id:
                resp["node_id"] = assigned_node_id
                resp["wiringHint"] = (
                    f"Use '{assigned_node_id}' as from_node/to_node in wire_components."
                )
            return resp

        if name == "end_tutorial_sandbox":
            self._sandbox_kind_counts.clear()
            await self.send_browser_json(
                {
                    "type": "bench_control",
                    "action": "end_tutorial_sandbox",
                    "params": {},
                }
            )
            return {
                "status": "tutorial_sandbox_closed",
                "note": "Student's real bench and saved PostgreSQL readings have been restored.",
            }

        if name == "switch_lab":
            raw_route = str(args.get("lab_route") or "").strip()
            allowed_routes = {
                "/app",
                "/labs",
                "/library",
                "/apparatus",
                "/attempt/demo/results",
                "/attempt/demo/report",
                "/lab/physics/pendulum",
                "/lab/physics/refraction",
                "/lab/physics/moments",
                "/lab/chemistry/titration",
                "/lab/chemistry/qualitative-analysis",
                "/lab/electronics/ohms-law",
                "/lab/engineering/beam",
                "/lab/engineering/isometric",
            }
            if "biology" in raw_route.lower():
                return {
                    "status": "disabled",
                    "reason": "Biology lab is temporarily disabled (coming soon). Offer Physics, Chemistry, Electronics, or Engineering instead.",
                }
            if raw_route not in allowed_routes:
                return {
                    "status": "invalid_route",
                    "allowedRoutes": sorted(allowed_routes),
                }
            public_routes = {"/lab/physics/pendulum"}
            if not self.is_authenticated and raw_route not in public_routes:
                from urllib.parse import quote

                auth_target = f"/auth?next={quote(raw_route, safe='')}"
                await self.send_browser_json(
                    {
                        "type": "rpc",
                        "method": "navigate",
                        "payload": {"to": auth_target},
                    }
                )
                return {
                    "status": "auth_required",
                    "isAuthenticated": False,
                    "redirectedTo": auth_target,
                    "requestedRoute": raw_route,
                    "instruction": (
                        "The student is NOT signed in yet, so the browser opened the Vixir Sign In screen first. "
                        "Do NOT pretend you are already on the lab bench! Tell them warmly that this lab requires "
                        "signing in, that you opened the sign-in screen for them, and as soon as they sign in it "
                        "will take them straight to that lab while you stay on the call with them."
                    ),
                }
            await self.send_browser_json(
                {
                    "type": "rpc",
                    "method": "navigate",
                    "payload": {"to": raw_route},
                }
            )
            return {"status": "navigating", "to": raw_route, "isAuthenticated": True}

        if name == "build_circuit_setup":
            desc = str(args.get("description") or "Ohm's law circuit")
            trace_msg = _TEAM.architect_specialist.build_blueprint(desc, self.screen_map)
            for call in trace_msg.proposed_rpcs:
                await self.send_browser_json(
                    {
                        "type": "rpc",
                        "method": call.method,
                        "payload": call.payload,
                    }
                )
            return {"status": "built_on_canvas", "summary": trace_msg.content}

        return {"error": f"Unknown tool {name}"}

    async def _gemini_receive_loop(self, g_ws: aiohttp.ClientWebSocketResponse) -> None:
        """Forward streaming 24kHz PCM audio, transcripts, barge-in interruptions, and tool calls from Gemini Live."""
        async for msg in g_ws:
            if self._closed:
                break
            if msg.type not in (aiohttp.WSMsgType.TEXT, aiohttp.WSMsgType.BINARY):
                if msg.type in (aiohttp.WSMsgType.CLOSE, aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                    break
                continue

            raw = msg.data.decode("utf-8") if isinstance(msg.data, bytes) else msg.data
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            # 1. Tool calls from Gemini 3.1 Live -> execute LangGraph / RPC tools & send toolResponse
            tool_call = data.get("toolCall")
            if tool_call and tool_call.get("functionCalls"):
                fn_responses: list[dict[str, Any]] = []
                for fc in tool_call["functionCalls"]:
                    fc_id = fc.get("id", "")
                    fc_name = fc.get("name", "")
                    fc_args = fc.get("args") or {}
                    logger.info("Gemini Live tool call: %s(%s)", fc_name, fc_args)
                    result = await self._execute_tool(fc_name, fc_args)
                    fn_responses.append(
                        {
                            "id": fc_id,
                            "name": fc_name,
                            "response": result,
                        }
                    )

                await g_ws.send_str(
                    json.dumps({"toolResponse": {"functionResponses": fn_responses}})
                )
                continue

            # 2. Server Content (audio chunks, live transcriptions, barge-in interruptions, turnComplete)
            sc = data.get("serverContent")
            if not sc:
                continue

            # Native barge-in interruption! Immediately flush browser Web Audio queue!
            if sc.get("interrupted"):
                self._turn_assistant_transcript = ""
                await self.send_browser_json({"type": "interrupted"})
                continue

            # Live student speech transcription
            in_tr = sc.get("inputTranscription", {}).get("text")
            if in_tr:
                self._turn_user_transcript += in_tr
                await self.send_browser_json(
                    {
                        "type": "transcript",
                        "role": "user",
                        "text": self._turn_user_transcript.strip(),
                        "final": False,
                    }
                )

            # Live Vix spoken transcription
            out_tr = sc.get("outputTranscription", {}).get("text")
            if out_tr:
                self._turn_assistant_transcript += out_tr
                clean_out = _clean_spoken_text(self._turn_assistant_transcript)
                await self.send_browser_json(
                    {
                        "type": "transcript",
                        "role": "assistant",
                        "text": clean_out,
                        "final": False,
                    }
                )

            # Streaming 24 kHz mono 16-bit PCM audio frames -> raw binary directly to browser!
            model_turn = sc.get("modelTurn") or {}
            for part in model_turn.get("parts") or []:
                inline = part.get("inlineData") or {}
                b64_audio = inline.get("data")
                if b64_audio:
                    pcm_bytes = base64.b64decode(b64_audio)
                    await self.send_browser_audio(pcm_bytes)

            if sc.get("turnComplete"):
                if self._turn_assistant_transcript:
                    await self.send_browser_json(
                        {
                            "type": "transcript",
                            "role": "assistant",
                            "text": _clean_spoken_text(self._turn_assistant_transcript),
                            "final": True,
                        }
                    )
                self._turn_user_transcript = ""
                self._turn_assistant_transcript = ""
                await self.send_browser_json({"type": "turn_complete"})

    async def _browser_receive_loop(self, g_ws: aiohttp.ClientWebSocketResponse) -> None:
        """Forward continuous 16 kHz PCM mic audio, typed messages, ScreenMap, and Pointer updates to Gemini Live."""
        async for msg in self.browser_ws:
            if self._closed or g_ws.closed:
                break

            if msg.type == aiohttp.WSMsgType.BINARY:
                # Continuous 16 kHz mono 16-bit PCM audio chunk from student's microphone!
                if len(msg.data) > 0:
                    b64 = base64.b64encode(msg.data).decode("ascii")
                    await g_ws.send_str(
                        json.dumps(
                            {
                                "realtimeInput": {
                                    "audio": {
                                        "mimeType": "audio/pcm;rate=16000",
                                        "data": b64,
                                    }
                                }
                            }
                        )
                    )
            elif msg.type == aiohttp.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                except json.JSONDecodeError:
                    continue

                mtype = data.get("type")
                if mtype == "screenmap" and data.get("screenMap"):
                    try:
                        self.screen_map = ScreenMap.parse_validated_payload(data["screenMap"])
                        if self.screen_map.pointerTarget:
                            self.pointer_target = self.screen_map.pointerTarget
                    except Exception as exc:
                        logger.debug("Ignored invalid live screenmap: %s", exc)

                elif mtype == "pointer" and data.get("pointerTarget"):
                    try:
                        pt = PointerTarget.model_validate(data["pointerTarget"])
                        self.pointer_target = pt
                        if self.screen_map:
                            self.screen_map = self.screen_map.model_copy(
                                update={"pointerTarget": pt}
                            )
                        if data.get("askNow"):
                            await g_ws.send_str(
                                json.dumps(
                                    {
                                        "realtimeInput": {
                                            "text": (
                                                f"The student just clicked and pointed at '{pt.label}' "
                                                f"(region={pt.regionId}, value={pt.value or 'n/a'}). "
                                                "Briefly explain what that exact component or control does in this lab."
                                            )
                                        }
                                    }
                                )
                            )
                    except Exception as exc:
                        logger.debug("Ignored invalid pointer: %s", exc)

                elif mtype == "page_changed":
                    new_title = str(data.get("pageTitle") or self.experiment_title)
                    new_route = str(data.get("route") or "")
                    self.experiment_title = new_title
                    if new_route:
                        self.current_route = new_route
                    if "isAuthenticated" in data:
                        self.is_authenticated = bool(data["isAuthenticated"])
                    if data.get("firstName"):
                        self.first_name = str(data["firstName"]).split()[0] or self.first_name
                    if data.get("screenMap"):
                        try:
                            self.screen_map = ScreenMap.parse_validated_payload(data["screenMap"])
                        except Exception as exc:
                            logger.debug("Ignored invalid page_changed screenmap: %s", exc)
                    logger.info(
                        "Student navigated live to %s (%s, authenticated=%s)",
                        new_route,
                        new_title,
                        self.is_authenticated,
                    )

                elif mtype == "text":
                    txt = (data.get("text") or "").strip()
                    if txt:
                        self._turn_user_transcript = txt
                        await self.send_browser_json(
                            {"type": "transcript", "role": "user", "text": txt, "final": True}
                        )
                        await g_ws.send_str(json.dumps({"realtimeInput": {"text": txt}}))

                elif mtype == "silence_checkin":
                    attempt = int(data.get("attempt") or 1)
                    max_attempts = int(data.get("maxAttempts") or 3)
                    prompt = (
                        f"[SYSTEM CHECK-IN {attempt} of {max_attempts}: {self.first_name} has not responded "
                        "for 3 minutes after you expected a reply. Gently check in by name in 1-2 warm, concise "
                        "sentences to be sure they are still following along or ask if they need help.]"
                    )
                    await g_ws.send_str(json.dumps({"realtimeInput": {"text": prompt}}))

                elif mtype == "silence_ending":
                    countdown = int(data.get("countdownSeconds") or 60)
                    prompt = (
                        f"[SYSTEM SESSION TIMEOUT: {self.first_name} has not responded after 3 check-ins "
                        f"at 3-minute intervals. Politely tell {self.first_name} in 1-2 concise sentences that "
                        f"you will be ending the session now with a {countdown}-second countdown unless they "
                        "speak up or interrupt you to keep going.]"
                    )
                    await g_ws.send_str(json.dumps({"realtimeInput": {"text": prompt}}))

                elif mtype == "end":
                    break

    async def run(self) -> None:
        api_key = (
            os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
        ).strip()
        if not api_key:
            await self.send_browser_json(
                {"type": "error", "detail": "GEMINI_API_KEY is not configured."}
            )
            return

        gemini_voice, accent = _resolve_live_voice(self.voice_id)
        readings_count = (
            int((self.screen_map.sim or {}).get("readingsCount", 0))
            if self.screen_map
            else 0
        )

        system_text = _build_live_system_instruction(
            first_name=self.first_name,
            experiment_title=self.experiment_title,
            mode=self.mode,
            locale=self.locale,
            accent=accent,
            readings_count=readings_count,
        )

        url = f"{GEMINI_LIVE_WS_URL}?key={api_key}"
        try:
            async with (
                aiohttp.ClientSession() as http_session,
                http_session.ws_connect(url, heartbeat=20.0, timeout=15) as g_ws,
            ):
                self._gemini_ws = g_ws

                setup_payload = {
                    "setup": {
                        "model": GEMINI_LIVE_MODEL,
                        "generationConfig": {
                            "responseModalities": ["AUDIO"],
                            "speechConfig": {
                                "voiceConfig": {
                                    "prebuiltVoiceConfig": {
                                        "voiceName": gemini_voice
                                    }
                                }
                            },
                        },
                        "inputAudioTranscription": {},
                        "outputAudioTranscription": {},
                        "realtimeInputConfig": {
                            "automaticActivityDetection": {
                                "prefixPaddingMs": 200,
                                "silenceDurationMs": 450,
                            }
                        },
                        "systemInstruction": {"parts": [{"text": system_text}]},
                        "tools": VIX_LIVE_TOOLS,
                    }
                }
                await g_ws.send_str(json.dumps(setup_payload))

                # Wait for setupComplete
                setup_msg = await g_ws.receive(timeout=10)
                logger.info(
                    "Gemini 3.1 Live session ready for %s (%s, voice=%s): %s",
                    self.first_name,
                    self.experiment_title,
                    gemini_voice,
                    str(setup_msg.data)[:80],
                )

                await self.send_browser_json(
                    {
                        "type": "live_ready",
                        "sessionId": self.session_id,
                        "model": GEMINI_LIVE_MODEL,
                        "voice": gemini_voice,
                        "sampleRateOut": 24000,
                    }
                )

                # Trigger immediate natural greeting via realtimeInput (exactly like luminarix/voice-router!)
                progress_phrase = (
                    f" with {readings_count} readings recorded so far"
                    if readings_count > 0
                    else ""
                )
                await g_ws.send_str(
                    json.dumps(
                        {
                            "realtimeInput": {
                                "text": (
                                    f"Introduce yourself warmly in 2 short natural sentences: "
                                    f"Say Hi {self.first_name}, I can see you are in the {self.experiment_title} lab studio{progress_phrase}. "
                                    "Ask if they would like a quick tour around the lab studio, or if they want you to walk them through a worked example so they can practice themselves."
                                )
                            }
                        }
                    )
                )

                # Run full-duplex send/receive concurrently until either side closes
                t_in = asyncio.create_task(self._browser_receive_loop(g_ws))
                t_out = asyncio.create_task(self._gemini_receive_loop(g_ws))
                done, pending = await asyncio.wait(
                    {t_in, t_out}, return_when=asyncio.FIRST_COMPLETED
                )
                for task in pending:
                    task.cancel()
                for task in done:
                    if not task.cancelled() and task.exception():
                        logger.warning("Gemini Live loop exited with: %s", task.exception())
        except Exception as exc:
            logger.error("Gemini Live bridge failed: %s", exc)
            await self.send_browser_json({"type": "error", "detail": str(exc)})
        finally:
            self._closed = True
