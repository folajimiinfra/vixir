"""HTTP & LiveKit Bridge Server for Vix Agent (Port 8090).

Exposes:
- GET  /health                  -> Health check (Req 9 AC7) + configured LLM brains & LiveKit status
- GET  /vix/brains              -> List all supported LLM providers & models (Gemini 3.8/4 Argon, Claude, OpenAI, Groq, etc.)
- POST /vix/session/start       -> Start a VixSessionRunner (and mint LiveKit room token if LIVEKIT_API_KEY is set)
- POST /vix/turn                -> Run a live student turn (with live ScreenMap) through LangGraph + real LLM brain
- POST /vix/session/{id}/end    -> End a VixSessionRunner cleanly
"""
from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import logging
import os
import time
import uuid
from typing import Any

from aiohttp import web

from .contracts import Mode, PointerTarget, ScreenMap
from .graph.state import DEFAULT_PENDULUM_CONTEXT
from .llm import create_llm_brain, list_supported_brains, split_into_sentences
from .main import process_user_query
from .pipeline import PipecatDuplexSession
from .session import HEALTH_REGISTRY, VixSessionRunner, log_worker_startup
from .tts import GLOBAL_TTS_SERVICE

logger = logging.getLogger("vix.server")

_SESSIONS: dict[str, VixSessionRunner] = {}
_DUPLEX_SESSIONS: dict[str, PipecatDuplexSession] = {}


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }


def _json_response(data: dict[str, Any], status: int = 200) -> web.Response:
    return web.Response(
        text=json.dumps(data),
        status=status,
        content_type="application/json",
        headers=_cors_headers(),
    )


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def mint_livekit_token(room_name: str, participant_identity: str, participant_name: str) -> str | None:
    """Mint an HS256 LiveKit access token when LIVEKIT_API_KEY and LIVEKIT_API_SECRET are configured."""
    api_key = os.environ.get("LIVEKIT_API_KEY", "").strip()
    api_secret = os.environ.get("LIVEKIT_API_SECRET", "").strip()
    if not api_key or not api_secret:
        return None

    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "iss": api_key,
        "sub": participant_identity,
        "name": participant_name,
        "nbf": now,
        "iat": now,
        "exp": now + 3600,
        "video": {
            "roomJoin": True,
            "room": room_name,
            "canPublish": True,
            "canSubscribe": True,
            "canPublishData": True,
        },
    }
    h_b64 = _b64url(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    p_b64 = _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(
        api_secret.encode("utf-8"),
        f"{h_b64}.{p_b64}".encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{h_b64}.{p_b64}.{_b64url(sig)}"


async def handle_options(_request: web.Request) -> web.Response:
    return web.Response(status=204, headers=_cors_headers())


async def handle_health(_request: web.Request) -> web.Response:
    """GET /health — returns HTTP 200 when worker is ready and HTTP 503 otherwise (Req 9 AC7)."""
    HEALTH_REGISTRY.active_sessions = len(_SESSIONS)
    status_code, payload = HEALTH_REGISTRY.get_health_status()
    brain = create_llm_brain()
    lk_url = os.environ.get("LIVEKIT_URL", "").strip()
    lk_key = os.environ.get("LIVEKIT_API_KEY", "").strip()
    lk_secret = os.environ.get("LIVEKIT_API_SECRET", "").strip()
    payload.update(
        {
            "defaultBrain": brain.identifier,
            "livekitConfigured": bool(lk_url and lk_key and lk_secret),
            "livekitUrl": lk_url or None,
            "brains": list_supported_brains(),
        }
    )
    return _json_response(payload, status=status_code)


async def handle_list_brains(_request: web.Request) -> web.Response:
    """GET /vix/brains — list all available LLM brains and their models."""
    brain = create_llm_brain()
    return _json_response(
        {
            "defaultBrain": brain.identifier,
            "brains": list_supported_brains(),
        }
    )


async def handle_session_start(request: web.Request) -> web.Response:
    """POST /vix/session/start — initialize a live Vix session and greet the student via the real LLM."""
    try:
        body = await request.json() if request.can_read_body else {}
    except Exception:
        body = {}

    session_id = body.get("sessionId") or f"vix-{uuid.uuid4().hex[:10]}"
    mode: Mode = body.get("mode", "PRACTICE")
    if mode == "EXAM":
        return _json_response(
            {"error": "VIX_DISABLED_EXAM", "detail": "Vix is disabled during timed exams."},
            status=409,
        )

    first_name = (body.get("firstName") or "Student").split()[0]
    locale = body.get("locale") or "English"
    voice = body.get("voice") or "ada"
    brain_spec = body.get("brain") or None
    exp_title = body.get("experimentTitle") or DEFAULT_PENDULUM_CONTEXT.title
    include_audio = bool(body.get("includeAudio", True))

    brain = create_llm_brain(brain_spec)
    runner = VixSessionRunner(session_id=session_id, brain=brain)
    runner.mode = mode
    runner.first_name = first_name
    runner.locale = locale
    runner.voice = voice
    runner.connected = True
    readings_count: int | None = None
    if body.get("screenMap"):
        runner.on_screenmap_data(body["screenMap"])
        sim_data = body["screenMap"].get("sim") if isinstance(body["screenMap"], dict) else None
        if isinstance(sim_data, dict) and sim_data.get("readingsCount") is not None:
            readings_count = int(sim_data["readingsCount"])

    _SESSIONS[session_id] = runner

    progress_note = (
        f" with {readings_count} readings recorded so far"
        if isinstance(readings_count, int) and readings_count > 0
        else ""
    )
    greeting_prompt = (
        f"Greet {first_name} in {locale} as Vix in exactly 2 short, warm spoken sentences (no LaTeX, no markdown):\n"
        f"1. Say: 'Hi {first_name}, I can see you are in the {exp_title} lab studio{progress_note}.'\n"
        "2. Ask: 'Would you like a quick interactive tour of this lab studio, or would you like me to walk you through a live worked example so you can see how to handle the practical?'"
    )
    greeting = await brain.generate(
        greeting_prompt,
        system="You are Vix, a warm, conversational Nigerian science lab partner. Speak naturally in 2 brief sentences.",
        fast=True,
        max_tokens=120,
    )

    audio_b64: str | None = None
    audio_mime: str | None = None
    if include_audio and greeting:
        try:
            tts_res = await GLOBAL_TTS_SERVICE.synthesize(
                greeting, voice_id=voice, locale=locale
            )
            audio_b64 = tts_res.get("audio")
            audio_mime = tts_res.get("mimeType")
        except Exception as exc:
            logger.warning("Inline greeting TTS failed: %s", exc)

    room_name = f"vix-{session_id}"
    lk_token = mint_livekit_token(room_name, f"student-{first_name.lower()}", first_name)
    lk_url = os.environ.get("LIVEKIT_URL", "").strip() or None

    return _json_response(
        {
            "sessionId": session_id,
            "mode": mode,
            "brain": brain.identifier,
            "voice": voice,
            "greeting": greeting,
            "sentences": split_into_sentences(greeting),
            "audio": audio_b64,
            "mimeType": audio_mime,
            "room": room_name,
            "livekitUrl": lk_url,
            "livekitToken": lk_token,
        }
    )


async def handle_turn(request: web.Request) -> web.Response:
    """POST /vix/turn — run a live student question + ScreenMap through the Vix LangGraph & real LLM with inline Neural TTS."""
    try:
        body = await request.json()
    except Exception:
        return _json_response({"error": "INVALID_JSON"}, status=400)

    query = (body.get("query") or body.get("text") or "").strip()
    if not query:
        return _json_response({"error": "EMPTY_QUERY"}, status=400)

    session_id = body.get("sessionId") or "live-web-session"
    mode: Mode = body.get("mode") or "PRACTICE"
    locale = body.get("locale") or "English"
    voice = body.get("voice") or "ada"
    first_name = (body.get("firstName") or "Student").split()[0]
    include_audio = bool(body.get("includeAudio", True))
    brain_spec = body.get("brain") or None
    raw_screen = body.get("screenMap")
    raw_pointer = body.get("pointerTarget")

    screen_map: ScreenMap | None = None
    if raw_screen:
        try:
            screen_map = ScreenMap.parse_validated_payload(raw_screen)
        except Exception as exc:
            logger.warning("Invalid screenMap payload in /vix/turn: %s", exc)

    if raw_pointer and screen_map is not None:
        try:
            pt = PointerTarget.model_validate(raw_pointer)
            screen_map = screen_map.model_copy(update={"pointerTarget": pt})
        except Exception as exc:
            logger.debug("Invalid pointerTarget payload: %s", exc)

    runner = _SESSIONS.get(session_id)
    if runner is not None:
        if brain_spec:
            runner.switch_brain(brain_spec)
        runner.mode = mode
        runner.locale = locale
        if first_name != "Student":
            runner.first_name = first_name
        if screen_map is not None:
            runner.on_screenmap_data(screen_map)
        result = await runner.handle_student_turn(query)
        active_brain_id = runner.brain.identifier
    else:
        result = await asyncio.to_thread(
            process_user_query,
            query,
            screen_map=screen_map,
            mode=mode,
            session_id=session_id,
            locale=locale,
            first_name=first_name,
            brain=brain_spec,
        )
        active_brain_id = result.get("llm_brain") or create_llm_brain(brain_spec).identifier

    rpcs = [
        c.model_dump() if hasattr(c, "model_dump") else c
        for c in (result.get("rpc_plan") or [])
    ]
    tour = result.get("tour")
    tour_dump = tour.model_dump() if hasattr(tour, "model_dump") else tour
    intent_val = result.get("intent", "what_next")
    reply_text = result.get("reply") or result.get("response") or ""

    ui_action: str | None = None
    if intent_val == "worked_example":
        ui_action = "open_worked_example"
    elif intent_val == "explain_screen":
        ui_action = "start_tour"

    audio_b64: str | None = None
    audio_mime: str | None = None
    if include_audio and reply_text:
        try:
            tts_res = await GLOBAL_TTS_SERVICE.synthesize(
                reply_text, voice_id=voice, locale=locale
            )
            audio_b64 = tts_res.get("audio")
            audio_mime = tts_res.get("mimeType")
        except Exception as exc:
            logger.warning("Inline turn TTS failed: %s", exc)

    return _json_response(
        {
            "sessionId": session_id,
            "brain": active_brain_id,
            "intent": intent_val,
            "uiAction": ui_action,
            "reply": reply_text,
            "sentences": split_into_sentences(reply_text),
            "audio": audio_b64,
            "mimeType": audio_mime,
            "blocked": bool(result.get("blocked") or result.get("policy_blocked")),
            "targetIds": result.get("target_ids") or [],
            "rpcPlan": rpcs,
            "tour": tour_dump,
            "selfNotes": result.get("self_notes") or "",
            "kgFacts": result.get("kg_facts") or [],
            "agentTrace": result.get("agent_trace") or [],
            "criticScore": result.get("critic_score", 10),
            "criticFeedback": result.get("critic_feedback") or "",
            "reflexionPlans": result.get("reflexion_plans") or [],
            "timingsMs": result.get("timings_ms") or {},
        }
    )


async def handle_session_end(request: web.Request) -> web.Response:
    """POST /vix/session/{session_id}/end — close session and clean up."""
    session_id = request.match_info.get("session_id", "")
    runner = _SESSIONS.pop(session_id, None)
    turns = runner.turn_count if runner else 0
    if runner:
        await runner.end()
    return _json_response({"sessionId": session_id, "ended": True, "turns": turns})


async def handle_tts(request: web.Request) -> web.Response:
    """POST /vix/tts — synthesize natural human speech using Gemini 3.8 Neural TTS (Aoede, Charon, Kore)."""
    try:
        body = await request.json()
    except Exception:
        return _json_response({"error": "INVALID_JSON"}, status=400)

    text = (body.get("text") or "").strip()
    if not text:
        return _json_response({"error": "EMPTY_TEXT"}, status=400)

    voice = body.get("voice") or "ada"
    locale = body.get("locale") or "English"
    try:
        audio_payload = await GLOBAL_TTS_SERVICE.synthesize(
            text, voice_id=voice, locale=locale
        )
        return _json_response(audio_payload)
    except Exception as exc:
        logger.warning("Gemini Neural TTS error: %s", exc)
        return _json_response({"error": "TTS_FAILED", "detail": str(exc)}, status=503)


async def handle_ws(request: web.Request) -> web.WebSocketResponse:
    """GET /vix/ws — Pipecat-style bidirectional full-duplex WebSocket stream with barge-in & pointer tracking."""
    ws = web.WebSocketResponse(heartbeat=25.0)
    await ws.prepare(request)

    session_id = request.query.get("sessionId") or f"ws-{uuid.uuid4().hex[:8]}"
    duplex = _DUPLEX_SESSIONS.setdefault(session_id, PipecatDuplexSession(session_id))

    async def emit_frame(frame: dict[str, Any]) -> None:
        if not ws.closed:
            await ws.send_str(json.dumps(frame))

    await emit_frame(
        {
            "type": "session_ready",
            "sessionId": session_id,
            "brain": duplex.brain,
            "voice": duplex.voice,
        }
    )

    async for msg in ws:
        if msg.type == web.WSMsgType.TEXT:
            try:
                data = json.loads(msg.data)
            except Exception as exc:
                logger.debug("Ignored non-JSON WS message: %s", exc)
                continue

            msg_type = data.get("type", "turn")
            if msg_type == "barge_in":
                ack = duplex.trigger_barge_in()
                await emit_frame(ack)
            elif msg_type == "pointer":
                if data.get("pointerTarget"):
                    pt = duplex.update_pointer(data["pointerTarget"])
                    await emit_frame({"type": "pointer_ack", "pointerTarget": pt.model_dump()})
            elif msg_type == "turn":
                query = (data.get("query") or data.get("text") or "").strip()
                if not query:
                    continue
                asyncio.create_task(
                    duplex.start_turn(
                        query=query,
                        emit_frame=emit_frame,
                        screen_map=data.get("screenMap"),
                        pointer_target=data.get("pointerTarget"),
                        mode=data.get("mode"),
                        locale=data.get("locale"),
                        voice=data.get("voice"),
                        brain=data.get("brain"),
                        synthesize_audio=bool(data.get("synthesizeAudio", True)),
                    )
                )

    duplex.trigger_barge_in()
    return ws


async def handle_voice_turn(request: web.Request) -> web.Response:
    """POST /vix/voice-turn — accept real microphone audio (audio/webm, audio/ogg, audio/wav) from getUserMedia,
    transcribe via Gemini 3.1/3.8 multimodal audio input, and run the Multi-Agent Vix LangGraph turn."""
    try:
        body = await request.json()
    except Exception:
        return _json_response({"error": "INVALID_JSON"}, status=400)

    audio_b64 = (body.get("audio") or body.get("audioBase64") or "").strip()
    if not audio_b64:
        return _json_response({"error": "EMPTY_AUDIO"}, status=400)

    mime_type = body.get("mimeType") or "audio/webm"
    locale = body.get("locale") or "English"
    brain_spec = body.get("brain") or None
    brain = create_llm_brain(brain_spec)

    try:
        transcript = await brain.transcribe_audio(
            audio_b64=audio_b64,
            mime_type=mime_type,
            locale=locale,
        )
    except Exception as exc:
        logger.warning("Audio transcription failed: %s", exc)
        return _json_response({"error": "STT_FAILED", "detail": str(exc)}, status=503)

    if not transcript or len(transcript.strip()) < 2:
        logger.info("Voice turn ignored as silence/noise")
        return _json_response(
            {
                "silence": True,
                "transcript": "",
                "reply": "",
                "sentences": [],
            }
        )

    logger.info("Voice turn transcribed: %r", transcript)

    # Delegate to the full LangGraph turn logic with the transcribed speech
    session_id = body.get("sessionId") or "live-web-session"
    mode: Mode = body.get("mode") or "PRACTICE"
    voice = body.get("voice") or "ada"
    first_name = (body.get("firstName") or "Student").split()[0]
    include_audio = bool(body.get("includeAudio", True))
    raw_screen = body.get("screenMap")
    raw_pointer = body.get("pointerTarget")

    screen_map: ScreenMap | None = None
    if raw_screen:
        try:
            screen_map = ScreenMap.parse_validated_payload(raw_screen)
        except Exception as exc:
            logger.warning("Invalid screenMap in /vix/voice-turn: %s", exc)

    if raw_pointer and screen_map is not None:
        try:
            pt = PointerTarget.model_validate(raw_pointer)
            screen_map = screen_map.model_copy(update={"pointerTarget": pt})
        except Exception as exc:
            logger.debug("Ignored invalid pointerTarget in /vix/voice-turn: %s", exc)

    result = await asyncio.to_thread(
        process_user_query,
        query=transcript,
        screen_map=screen_map,
        mode=mode,
        session_id=session_id,
        locale=locale,
        first_name=first_name,
        brain=brain.identifier,
    )

    rpcs = [
        c.model_dump() if hasattr(c, "model_dump") else c
        for c in (result.get("rpc_plan") or [])
    ]
    tour = result.get("tour")
    tour_dump = tour.model_dump() if hasattr(tour, "model_dump") else tour
    intent_val = result.get("intent", "what_next")
    reply_text = result.get("reply") or result.get("response") or ""

    ui_action: str | None = None
    if intent_val == "worked_example":
        ui_action = "open_worked_example"
    elif intent_val == "explain_screen":
        ui_action = "start_tour"

    audio_b64: str | None = None
    audio_mime: str | None = None
    if include_audio and reply_text:
        try:
            tts_res = await GLOBAL_TTS_SERVICE.synthesize(
                reply_text, voice_id=voice, locale=locale
            )
            audio_b64 = tts_res.get("audio")
            audio_mime = tts_res.get("mimeType")
        except Exception as exc:
            logger.warning("Inline voice-turn TTS failed: %s", exc)

    return _json_response(
        {
            "silence": False,
            "sessionId": session_id,
            "brain": brain.identifier,
            "transcript": transcript,
            "intent": intent_val,
            "uiAction": ui_action,
            "reply": reply_text,
            "sentences": split_into_sentences(reply_text),
            "audio": audio_b64,
            "mimeType": audio_mime,
            "blocked": bool(result.get("blocked") or result.get("policy_blocked")),
            "targetIds": result.get("target_ids") or [],
            "rpcPlan": rpcs,
            "tour": tour_dump,
            "selfNotes": result.get("self_notes") or "",
            "kgFacts": result.get("kg_facts") or [],
            "agentTrace": result.get("agent_trace") or [],
            "criticScore": result.get("critic_score", 10),
            "timingsMs": result.get("timings_ms") or {},
        }
    )


def create_http_app() -> web.Application:
    app = web.Application()
    app.router.add_route("OPTIONS", "/{tail:.*}", handle_options)
    app.router.add_get("/health", handle_health)
    app.router.add_get("/vix/brains", handle_list_brains)
    app.router.add_get("/vix/ws", handle_ws)
    app.router.add_post("/vix/session/start", handle_session_start)
    app.router.add_post("/vix/turn", handle_turn)
    app.router.add_post("/vix/voice-turn", handle_voice_turn)
    app.router.add_post("/vix/tts", handle_tts)
    app.router.add_post("/vix/session/{session_id}/turn", handle_turn)
    app.router.add_post("/vix/session/{session_id}/end", handle_session_end)
    return app


def run_server(host: str = "0.0.0.0", port: int | None = None) -> None:
    resolved_port = int(port or os.environ.get("VIX_AGENT_PORT", "8090"))
    brain = create_llm_brain()
    log_worker_startup(brain)
    logger.info("Starting Vix Agent HTTP & LiveKit server on http://%s:%d (brain=%s)", host, resolved_port, brain.identifier)
    web.run_app(create_http_app(), host=host, port=resolved_port)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_server()
