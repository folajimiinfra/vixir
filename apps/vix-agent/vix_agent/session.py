"""Vix LiveKit session lifecycle, voice/chat turn orchestration, limits, and /health check (Req 1, 2, 8, 9)."""
from __future__ import annotations

import asyncio
import logging
import platform
import time
from collections.abc import Awaitable, Callable
from typing import Any

import structlog

from .api_client import VixirApiClient
from .contracts import ExperimentContext, LLMProviderName, Mode, RpcCall, ScreenMap, SessionContext, TourState
from .graph.build import build_vix_graph
from .graph.state import DEFAULT_PENDULUM_CONTEXT, create_vix_state
from .llm import LLMBrain, create_llm_brain, split_into_sentences
from .rpc import RpcDispatcher, RpcSenderFn
from .screen import FrameSampler, ScreenMapCache

logger = logging.getLogger("vix.session")
slog = structlog.get_logger("vix.session")

MAX_SESSION_TURNS = 60            # Req 9 AC5: 60 turns per session cap
MAX_SESSION_DURATION_S = 30 * 60  # Req 9 AC5: 30 minutes per session cap
IDLE_TIMEOUT_S = 5 * 60           # Req 1 AC7: 5 minutes idle timeout


def log_worker_startup(brain: LLMBrain | None = None) -> dict[str, str]:
    """Emit a structlog entry at worker startup listing Python, livekit-agents, VAD/STT/TTS, and LLM model (Req 10 AC4)."""
    try:
        import importlib.metadata

        lk_version = importlib.metadata.version("livekit-agents")
    except Exception:
        lk_version = "1.2+"

    active_brain = brain or create_llm_brain()
    info = {
        "python_version": platform.python_version(),
        "livekit_agents_version": lk_version,
        "vad_provider": "silero",
        "stt_provider": "deepgram-nova-2",
        "tts_provider": "cartesia-sonic",
        "llm_model": active_brain.identifier,
    }
    slog.info("vix_worker_startup", **info)
    return info


class WorkerHealthRegistry:
    """Tracks worker readiness for the GET /health endpoint (Req 9 AC7)."""

    def __init__(self) -> None:
        self.ready: bool = True
        self.active_sessions: int = 0

    def get_health_status(self) -> tuple[int, dict[str, Any]]:
        status_code = 200 if self.ready else 503
        return (
            status_code,
            {
                "status": "ok" if self.ready else "unavailable",
                "activeSessions": self.active_sessions,
            },
        )


HEALTH_REGISTRY = WorkerHealthRegistry()


class VixSessionRunner:
    """Manages one student's Vix session across LiveKit speech, vix.chat, vix.screenmap, and RPCs."""

    def __init__(
        self,
        session_id: str,
        *,
        api_client: VixirApiClient | None = None,
        rpc_sender: RpcSenderFn | None = None,
        speak_fn: Callable[[str], Awaitable[None]] | None = None,
        disconnect_fn: Callable[[], Awaitable[None]] | None = None,
        request_screenmap_fn: Callable[[], Awaitable[None]] | None = None,
        brain: str | LLMBrain | None = None,
    ) -> None:
        self.session_id = session_id
        self.api_client = api_client or VixirApiClient()
        self.rpc_dispatcher = RpcDispatcher(sender=rpc_sender)
        self._speak_fn = speak_fn
        self._disconnect_fn = disconnect_fn
        self._request_screenmap_fn = request_screenmap_fn

        if isinstance(brain, LLMBrain):
            self.brain = brain
        else:
            self.brain = create_llm_brain(brain)

        self.screen_cache = ScreenMapCache()
        self.frame_sampler = FrameSampler(consent_screen=False)
        self.graph = build_vix_graph()

        self.context: SessionContext | None = None
        self.experiment: ExperimentContext = DEFAULT_PENDULUM_CONTEXT
        self.mode: Mode = "PRACTICE"
        self.locale: str = "en"
        self.first_name: str = "Student"
        self.voice: str = "ada"
        self.scripted_tour_only: bool = False
        self.transcripts_retained: bool = False
        self.institution_id: str | None = "inst-default"

        self.tour: TourState | None = None
        self.turn_count: int = 0
        self.started_at: float = time.monotonic()
        self.last_activity_at: float = time.monotonic()
        self.connected: bool = False
        self.ended: bool = False
        self.is_speaking: bool = False

    def switch_brain(
        self,
        brain: str | None = None,
        *,
        provider: LLMProviderName | None = None,
        model: str | None = None,
        api_key: str | None = None,
    ) -> str:
        """Hot-swap the LLM brain for this session (e.g. 'gemini/gemini-2.5-flash', 'anthropic/claude-3-5-sonnet-latest', 'openai/gpt-4o')."""
        return self.brain.switch_brain(
            brain=brain, provider=provider, model=model, api_key=api_key
        )

    async def start(
        self,
        join_fn: Callable[[], Awaitable[None]] | None = None,
    ) -> bool:
        """Join room (with 1 retry after 1s on failure per Req 1 AC5), fetch context, and greet student."""
        if join_fn is not None:
            joined = False
            for attempt in range(2):
                try:
                    await join_fn()
                    joined = True
                    break
                except Exception as exc:
                    logger.warning("Room join attempt %d failed: %s", attempt + 1, exc)
                    if attempt == 0:
                        await asyncio.sleep(1.0)
            if not joined:
                logger.error("Room join failed after retry for session %s; exiting without /end", self.session_id)
                return False

        self.connected = True
        self.started_at = time.monotonic()
        self.last_activity_at = time.monotonic()

        ctx = await self.api_client.get_session_context(self.session_id)
        if ctx is None:
            # Req 1 AC4 & Req 9 AC4: non-2xx context fetch -> proceed with scripted tour only
            self.scripted_tour_only = True
            self.transcripts_retained = False
            greeting = (
                "Hello! I am Vix, your lab guide. Full interactive help is temporarily unavailable, "
                "so I can walk you through a guided tour of your lab screen."
            )
            await self._deliver_reply(greeting)
            return True

        self.context = ctx
        self.mode = ctx.mode
        self.locale = ctx.locale or "en"
        self.first_name = (ctx.firstName or "Student").split()[0]  # Req 8 AC1: first name only
        self.voice = ctx.voice
        self.institution_id = ctx.institutionId
        # Req 8 AC6: if institution_id is null, treat transcript retention as disabled
        self.transcripts_retained = bool(ctx.transcriptsRetained) and (ctx.institutionId is not None)
        if ctx.institutionId is None:
            self.scripted_tour_only = True
        self.frame_sampler.set_consent(ctx.consent.screen)
        self.experiment = ctx.get_experiment_context()

        # Req 1 AC2 & AC3: immediately leave without speaking if EXAM mode or VIX_DISABLED_INSTITUTION
        if self.mode == "EXAM" or ctx.vixDisabledInstitution:
            logger.info(
                "Leaving session %s immediately (mode=%s, vixDisabled=%s)",
                self.session_id,
                self.mode,
                ctx.vixDisabledInstitution,
            )
            self.connected = False
            self.ended = True
            if self._disconnect_fn is not None:
                await self._disconnect_fn()
            return False

        greeting = f"Hello {self.first_name}! I am Vix, your lab guide. Ask me to explain the screen or what step to try next."
        await self._deliver_reply(greeting)
        return True

    def on_screenmap_data(self, raw_payload: str | bytes | dict[str, Any] | ScreenMap) -> bool:
        """Ingest a message from LiveKit data topic `vix.screenmap` (Req 3 AC1, AC4)."""
        self.last_activity_at = time.monotonic()
        return self.screen_cache.update(raw_payload)

    def on_barge_in(self) -> None:
        """Stop current speech immediately when student starts speaking (Req 2 AC3)."""
        if self.is_speaking:
            self.is_speaking = False

    async def on_stt_error(self) -> None:
        """Discard partial transcript on STT error/timeout and ask student to repeat via showCaption (Req 2 AC8)."""
        await self.rpc_dispatcher.execute(
            RpcDispatcher.show_caption("I did not catch that clearly—could you please repeat?", final=True),
            self.screen_cache.current,
        )

    async def handle_student_turn(
        self,
        user_text: str,
        *,
        now_monotonic: float | None = None,
    ) -> dict[str, Any]:
        """Process either spoken input or a typed message from `vix.chat` (Req 2 AC4)."""
        now = time.monotonic() if now_monotonic is None else now_monotonic
        self.on_barge_in()

        # Check 5-minute idle timeout or 30-minute session duration limit or 60-turn cap (Req 1 AC7, Req 9 AC5)
        if (now - self.last_activity_at) >= IDLE_TIMEOUT_S:
            farewell = "We have been quiet for five minutes, so I will disconnect now. Call me back whenever you need a hand!"
            await self._deliver_reply(farewell)
            await self.end()
            return {"reply": farewell, "ended": True, "reason": "idle_timeout"}

        if self.turn_count >= MAX_SESSION_TURNS or (now - self.started_at) >= MAX_SESSION_DURATION_S:
            farewell = "We have reached the session limit for this call. Good luck finishing your practical!"
            await self._deliver_reply(farewell)
            await self.end()
            return {"reply": farewell, "ended": True, "reason": "session_limit"}

        self.last_activity_at = now
        self.turn_count += 1

        # Refresh ScreenMap if stale (> 2 seconds old) per Req 3 AC1–2
        screen = await self.screen_cache.ensure_fresh(self._request_screenmap_fn)

        vix_state = create_vix_state(
            user_text=user_text,
            mode="GRADED" if self.mode == "GRADED" else "PRACTICE",
            screen=screen,
            experiment=self.experiment,
            session_id=self.session_id,
            first_name=self.first_name,
            locale=self.locale,
            tour=self.tour,
            frame_b64=self.frame_sampler.get_frame_for_disambiguation(0.5),
            consent_screen=self.frame_sampler.consent_screen,
            llm_brain=self.brain.identifier,
            turn_count=self.turn_count,
            transcripts_retained=self.transcripts_retained,
            institution_id=self.institution_id,
        )

        result = self.graph.invoke(vix_state)
        self.tour = result.get("tour")
        reply = result.get("reply", "")
        blocked = bool(result.get("blocked", False))
        rpc_plan: list[RpcCall] = list(result.get("rpc_plan") or [])

        # Execute planned non-caption RPCs first (spotlight, startTour, tourStep, endTour, pointAt, openPanel)
        for call in rpc_plan:
            if call.method != "showCaption":
                await self.rpc_dispatcher.execute(call, screen)

        # Stream TTS and sentence-boundary showCaption RPCs (Req 2 AC5, Req 9 AC2)
        await self._deliver_reply(reply)

        # Record transcript turns if retention is enabled (Req 6 AC6, Req 8 AC3–4)
        if self.transcripts_retained and self.institution_id is not None:
            await self.api_client.post_turn_message(
                self.session_id,
                role="student",
                text=user_text,
                policy_blocked=False,
                transcripts_retained=True,
                institution_id=self.institution_id,
            )
            await self.api_client.post_turn_message(
                self.session_id,
                role="vix",
                text=reply,
                policy_blocked=blocked,
                transcripts_retained=True,
                institution_id=self.institution_id,
            )

        # If this turn hit the 60-turn limit, close out cleanly after answering
        if self.turn_count >= MAX_SESSION_TURNS:
            await self.end()

        return dict(result)

    async def _deliver_reply(self, reply: str) -> None:
        """Send sentence-level showCaption RPCs (`final=False` then `final=True`) and invoke TTS with fallback (Req 2 AC5, Req 9 AC2)."""
        sentences = split_into_sentences(reply)
        if not sentences:
            return

        self.is_speaking = True
        screen = self.screen_cache.current
        for idx, sentence in enumerate(sentences):
            is_last = idx == len(sentences) - 1
            await self.rpc_dispatcher.execute(
                RpcDispatcher.show_caption(sentence, final=is_last),
                screen,
            )

        if self._speak_fn is not None:
            try:
                await self._speak_fn(reply)
            except Exception as exc:
                # Req 9 AC2: If TTS fails, showCaption fallback is already sent without retrying TTS
                logger.warning("TTS failed for session %s; caption fallback delivered: %s", self.session_id, exc)
        self.is_speaking = False

    async def end(self) -> None:
        """End active tour overlay, post `/end` with turn count, and disconnect within 2s (Req 1 AC6, Req 7 AC4)."""
        if self.ended:
            return
        self.ended = True

        if self.tour and self.tour.active:
            self.tour = self.tour.model_copy(update={"active": False})
            await self.rpc_dispatcher.execute(
                RpcDispatcher.end_tour(),
                self.screen_cache.current,
            )

        if self.connected:
            await self.api_client.post_session_end(
                self.session_id,
                turns=self.turn_count,
            )
            self.connected = False

        if self._disconnect_fn is not None:
            await self._disconnect_fn()
