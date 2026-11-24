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
                    "Highlight a specific region on the student's lab screen with an orange spotlight ring "
                    "so they can immediately see what you are talking about."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "region_id": {
                            "type": "STRING",
                            "description": (
                                "One of: top-bar, tool-rail, apparatus-tray, bench, "
                                "instrument-dock, event-log, data-panel"
                            ),
                        }
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
                    "are safely preserved and untouched). For example, on Pendulum Lab you run a Mars-gravity "
                    "sandbox pendulum (g_demo = 3.72 m/s^2); on Electronics Lab you clear the board and wire an "
                    "analogous 10-ohm resistor circuit from scratch."
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
                    "Electronics actions: 'clear_board', 'add_component' (component_kind: battery|rheostat|ammeter|voltmeter|wireX|key|resistor|led|diode|capacitor, x, y), "
                    "'wire_components' (from_node, from_term, to_node, to_term), 'set_rheostat' (value 0..20), 'set_emf' (value 1.5..6.0), 'toggle_key' (value 1 or 0), 'record_demo_trial'."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "action": {
                            "type": "STRING",
                            "description": "The exact bench action name to execute visibly on screen.",
                        },
                        "value": {
                            "type": "NUMBER",
                            "description": "Optional numeric value (e.g. length in cm, angle in degrees, rheostat ohms, 1 for true / 0 for false).",
                        },
                        "component_kind": {
                            "type": "STRING",
                            "description": "For Electronics add_component: battery, rheostat, ammeter, voltmeter, wireX, key, resistor, led, diode, or capacitor.",
                        },
                        "x": {"type": "NUMBER", "description": "Optional X coordinate on circuit board."},
                        "y": {"type": "NUMBER", "description": "Optional Y coordinate on circuit board."},
                        "from_node": {"type": "STRING", "description": "Source node ID for wire_components."},
                        "from_term": {"type": "STRING", "description": "Source terminal ('a' or 'b')."},
                        "to_node": {"type": "STRING", "description": "Target node ID for wire_components."},
                        "to_term": {"type": "STRING", "description": "Target terminal ('a' or 'b')."},
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
        "- Whenever explaining a specific part of the bench, call `spotlight_region` so the orange highlight lights up on their screen as you talk.\n"
        "- If the student asks for a tour of the lab studio, call `start_studio_tour` (or call `spotlight_region` sequentially as you walk them around!).\n"
        "LIVE BENCH TUTORIAL WALKTHROUGH (CRITICAL — NO HARDCODED 4-STEP SCRIPT!):\n"
        "- If the student asks you to walk them through an example or show them how to do the practical:\n"
        "  1. First call `start_tutorial_sandbox` with an analogous scenario similar to their bench (e.g., on Pendulum Lab use a Mars-gravity pendulum sandbox; on Electronics Lab clear the board and wire an analogous resistor circuit from scratch).\n"
        "  2. Construct and run the experiment LIVE ON THE REAL BENCH step by step using `operate_bench_control` (e.g., place_protractor -> set_length_cm -> set_release_angle -> set_eye_level -> start_stopwatch -> stop_stopwatch -> record_demo_trial across multiple lengths so they literally watch the live graph plot!).\n"
        "  3. There is NO fixed step count—take as many steps as needed (5, 6, 8+) until the student fully understands! After every 1–2 actions, briefly explain WHY you did that step and invite follow-up questions before proceeding.\n"
        "  4. If the student interrupts with a follow-up question about any step, answer it thoroughly (you can even demonstrate the concept live on the bench, like toggling parallax off/on!), then continue when they are ready.\n"
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
        self.screen_map: ScreenMap | None = initial_screen_map
        self.pointer_target: PointerTarget | None = (
            initial_screen_map.pointerTarget if initial_screen_map else None
        )
        self._closed = False
        self._gemini_ws: aiohttp.ClientWebSocketResponse | None = None
        self._turn_user_transcript = ""
        self._turn_assistant_transcript = ""

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
                    "mode": self.mode,
                    "readingsCount": 0,
                    "visibleRegions": ["top-bar", "tool-rail", "apparatus-tray", "bench", "instrument-dock", "data-panel"],
                    "pointerTarget": self.pointer_target.model_dump() if self.pointer_target else None,
                }
            sim = self.screen_map.sim or {}
            pt = self.pointer_target or self.screen_map.pointerTarget
            return {
                "screen": self.screen_map.screen,
                "route": self.screen_map.route,
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
            await self.send_browser_json(
                {
                    "type": "rpc",
                    "method": "spotlight",
                    "payload": {"regionId": rid, "durationMs": 7000},
                }
            )
            return {"spotlighted": rid, "status": "ok"}

        if name == "start_studio_tour":
            await self.send_browser_json({"type": "ui_action", "action": "start_tour"})
            return {
                "status": "tour_started",
                "regions": [
                    "top-bar (experiment title, lab switcher, Analyse results)",
                    "tool-rail (pointer, vernier ruler, magnifier loupe, notebook, auxiliary stopwatch)",
                    "apparatus-tray (equipment list and simulation seed)",
                    "bench (main interactive experiment area)",
                    "instrument-dock (sliders, stopwatch, Record reading)",
                    "data-panel (live readings table and live graph preview)",
                ],
                "instruction": "Walk through the regions concisely and call spotlight_region for each key region as you mention it!",
            }

        if name == "start_tutorial_sandbox":
            title = str(
                args.get("scenario_title")
                or f"Live Tutorial Sandbox · {exp_ctx.title} (Analogous Demo)"
            )
            note = str(
                args.get("analog_note")
                or "Your own real readings are safely saved while Vix demonstrates from scratch."
            )
            await self.send_browser_json(
                {
                    "type": "bench_control",
                    "action": "start_tutorial_sandbox",
                    "params": {"scenarioTitle": title, "analogNote": note},
                }
            )
            return {
                "status": "tutorial_sandbox_active",
                "scenarioTitle": title,
                "nextHint": (
                    "The real bench is now in Tutorial Sandbox Mode starting from scratch. "
                    "Use operate_bench_control step by step (1-2 controls per turn) and check in with the student for follow-up questions."
                ),
            }

        if name == "operate_bench_control":
            action = str(args.get("action") or "")
            params = {k: v for k, v in args.items() if k != "action"}
            await self.send_browser_json(
                {
                    "type": "bench_control",
                    "action": action,
                    "params": params,
                }
            )
            return {
                "status": "executed_on_live_bench",
                "action": action,
                "params": params,
            }

        if name == "end_tutorial_sandbox":
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
            await self.send_browser_json(
                {
                    "type": "rpc",
                    "method": "navigate",
                    "payload": {"to": raw_route},
                }
            )
            return {"status": "navigating", "to": raw_route}

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
                    if data.get("screenMap"):
                        try:
                            self.screen_map = ScreenMap.parse_validated_payload(data["screenMap"])
                        except Exception as exc:
                            logger.debug("Ignored invalid page_changed screenmap: %s", exc)
                    logger.info("Student navigated live to %s (%s)", new_route, new_title)

                elif mtype == "text":
                    txt = (data.get("text") or "").strip()
                    if txt:
                        self._turn_user_transcript = txt
                        await self.send_browser_json(
                            {"type": "transcript", "role": "user", "text": txt, "final": True}
                        )
                        await g_ws.send_str(json.dumps({"realtimeInput": {"text": txt}}))

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
