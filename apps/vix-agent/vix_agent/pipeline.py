"""Pipecat-Style Real-Time Full-Duplex Frame Pipeline for Vix Agent.

Implements a low-latency, interruptible conversational pipeline modeled on Pipecat:
- `InterruptionFrame` (`barge_in`): Immediately cancels in-flight LLM and TTS tasks the instant the
  student speaks or interrupts mid-sentence.
- `PointerFrame` (`point_at_screen`): Tracks the exact DOM/SVG element under the student's cursor
  or click (`PointerTarget`) so deictic questions ("What is this?", "Why does this say 8.0 Ω?",
  "How do I adjust this slider?") are grounded to the exact button, knob, wire, organ, or table row.
- `FastSinglePassProcessor`: Runs intent classification, ScreenMap spatial resolution, Multi-Hop
  GraphRAG (`LabKnowledgeGraph`), BM25 retrieval, and AutoGen specialist consultation in-memory in
  < 2 ms, emits `spotlight` / `pointAt` RPCs immediately, and uses ONE fast LLM call (`thinkingBudget: 0`).
- `ParallelSentenceTTSProcessor`: Splits Vix's reply into sentences and synthesizes Sentence 1 and
  Sentence 2 concurrently via Gemini 3.8 Neural TTS (`gemini-3.8-flash-lite-tts`), streaming Sentence 1
  audio to the student immediately while Sentence 2 finishes in the background.
"""
from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

from .contracts import Mode, PointerTarget, ScreenMap
from .graph.nodes import process_user_query
from .llm import split_into_sentences
from .tts import GLOBAL_TTS_SERVICE

logger = logging.getLogger("vix.pipeline")

FrameSinkFn = Callable[[dict[str, Any]], Awaitable[None]]


@dataclass
class PipelineTurnMetrics:
    routing_and_graphrag_ms: float = 0.0
    llm_first_reply_ms: float = 0.0
    first_sentence_tts_ms: float = 0.0
    total_pipeline_ms: float = 0.0


class PipecatDuplexSession:
    """Full-duplex, interruptible Pipecat-style session over WebSocket or HTTP streaming."""

    def __init__(
        self,
        session_id: str,
        *,
        default_brain: str = "gemini/gemini-3.8-flash",
        default_voice: str = "ada",
        default_locale: str = "English",
        default_mode: Mode = "PRACTICE",
    ) -> None:
        self.session_id = session_id
        self.brain = default_brain
        self.voice = default_voice
        self.locale = default_locale
        self.mode: Mode = default_mode
        self.latest_screen_map: ScreenMap | None = None
        self.latest_pointer: PointerTarget | None = None

        self._active_turn_task: asyncio.Task[None] | None = None
        self._turn_seq: int = 0
        self._interrupted_seq: int = -1

    def trigger_barge_in(self) -> dict[str, Any]:
        """Cancel any in-flight LLM generation or pending TTS sentence stream immediately (Pipecat InterruptionFrame)."""
        self._interrupted_seq = self._turn_seq
        if self._active_turn_task and not self._active_turn_task.done():
            self._active_turn_task.cancel()
        logger.info("Barge-in interruption triggered for session %s (turn %d)", self.session_id, self._turn_seq)
        return {
            "type": "interrupted",
            "sessionId": self.session_id,
            "turnSeq": self._turn_seq,
            "timestamp": time.time(),
        }

    def update_pointer(self, raw_pointer: dict[str, Any] | PointerTarget) -> PointerTarget:
        """Update the exact DOM/SVG element the student is pointing at on screen."""
        if isinstance(raw_pointer, PointerTarget):
            self.latest_pointer = raw_pointer
        else:
            self.latest_pointer = PointerTarget.model_validate(raw_pointer)
        if self.latest_screen_map is not None:
            self.latest_screen_map = self.latest_screen_map.model_copy(
                update={"pointerTarget": self.latest_pointer}
            )
        return self.latest_pointer

    async def start_turn(
        self,
        *,
        query: str,
        emit_frame: FrameSinkFn,
        screen_map: ScreenMap | dict[str, Any] | None = None,
        pointer_target: PointerTarget | dict[str, Any] | None = None,
        mode: Mode | None = None,
        locale: str | None = None,
        voice: str | None = None,
        brain: str | None = None,
        synthesize_audio: bool = True,
    ) -> None:
        """Preempt any active turn (barge-in) and launch the new streaming turn pipeline."""
        self.trigger_barge_in()
        self._turn_seq += 1
        current_seq = self._turn_seq

        if mode:
            self.mode = mode
        if locale:
            self.locale = locale
        if voice:
            self.voice = voice
        if brain:
            self.brain = brain

        parsed_screen: ScreenMap | None = self.latest_screen_map
        if isinstance(screen_map, ScreenMap):
            parsed_screen = screen_map
        elif isinstance(screen_map, dict):
            try:
                parsed_screen = ScreenMap.parse_validated_payload(screen_map)
            except Exception as exc:
                logger.warning("ScreenMap parse warning: %s", exc)

        if pointer_target is not None:
            pt = self.update_pointer(pointer_target)
            if parsed_screen is not None:
                parsed_screen = parsed_screen.model_copy(update={"pointerTarget": pt})
        elif parsed_screen and parsed_screen.pointerTarget:
            self.latest_pointer = parsed_screen.pointerTarget
        elif parsed_screen and self.latest_pointer:
            parsed_screen = parsed_screen.model_copy(update={"pointerTarget": self.latest_pointer})

        self.latest_screen_map = parsed_screen

        task = asyncio.create_task(
            self._run_turn_pipeline(
                turn_seq=current_seq,
                query=query,
                screen_map=parsed_screen,
                emit_frame=emit_frame,
                synthesize_audio=synthesize_audio,
            )
        )
        self._active_turn_task = task
        try:
            await task
        except asyncio.CancelledError:
            await emit_frame(
                {
                    "type": "turn_cancelled",
                    "turnSeq": current_seq,
                    "reason": "barge_in",
                }
            )

    async def _run_turn_pipeline(
        self,
        *,
        turn_seq: int,
        query: str,
        screen_map: ScreenMap | None,
        emit_frame: FrameSinkFn,
        synthesize_audio: bool,
    ) -> None:
        t_start = time.perf_counter()

        await emit_frame(
            {
                "type": "turn_started",
                "turnSeq": turn_seq,
                "brain": self.brain,
                "pointerTarget": (
                    screen_map.pointerTarget.model_dump()
                    if (screen_map and screen_map.pointerTarget)
                    else None
                ),
            }
        )

        # 1. Run the Multi-Agent LangGraph in a worker thread so the event loop stays responsive to barge-in
        result = await asyncio.to_thread(
            process_user_query,
            query=query,
            screen_map=screen_map,
            mode=self.mode,
            session_id=self.session_id,
            locale=self.locale,
            brain=self.brain,
        )

        if self._interrupted_seq >= turn_seq:
            return

        t_llm_done = time.perf_counter()
        llm_ms = round((t_llm_done - t_start) * 1000.0, 1)

        reply: str = result.get("reply") or result.get("response") or ""
        rpcs = [
            c.model_dump() if hasattr(c, "model_dump") else c
            for c in (result.get("rpc_plan") or [])
        ]

        # 2. Emit Text + Spotlight RPCs + Multi-Agent Trace immediately (before TTS even finishes!)
        await emit_frame(
            {
                "type": "text_and_rpc",
                "turnSeq": turn_seq,
                "brain": result.get("llm_brain", self.brain),
                "intent": result.get("intent", "what_next"),
                "reply": reply,
                "blocked": bool(result.get("blocked")),
                "targetIds": result.get("target_ids") or [],
                "rpcPlan": rpcs,
                "selfNotes": result.get("self_notes") or "",
                "kgFacts": result.get("kg_facts") or [],
                "agentTrace": result.get("agent_trace") or [],
                "criticScore": result.get("critic_score", 10),
                "llmMs": llm_ms,
            }
        )

        if not synthesize_audio or not reply.strip():
            await emit_frame({"type": "turn_completed", "turnSeq": turn_seq, "totalMs": llm_ms})
            return

        # 3. Pipecat Sentence-Level Parallel Neural TTS Streaming:
        #    Kick off Gemini 3.8 Neural TTS for ALL sentences concurrently, and stream them in order (0, 1, 2...)
        sentences = split_into_sentences(reply)
        if not sentences:
            await emit_frame({"type": "turn_completed", "turnSeq": turn_seq, "totalMs": llm_ms})
            return

        tts_tasks = [
            asyncio.create_task(
                GLOBAL_TTS_SERVICE.synthesize(
                    sent,
                    voice_id=self.voice,
                    locale=self.locale,
                )
            )
            for sent in sentences
        ]

        try:
            for idx, (sent_text, tts_task) in enumerate(zip(sentences, tts_tasks)):
                if self._interrupted_seq >= turn_seq:
                    for pending in tts_tasks:
                        if not pending.done():
                            pending.cancel()
                    return

                try:
                    audio_payload = await tts_task
                except Exception as exc:
                    logger.warning("Sentence %d TTS failed: %s", idx, exc)
                    continue

                if self._interrupted_seq >= turn_seq:
                    return

                await emit_frame(
                    {
                        "type": "audio_chunk",
                        "turnSeq": turn_seq,
                        "sentenceIndex": idx,
                        "isFinal": idx == len(sentences) - 1,
                        "text": sent_text,
                        "audio": audio_payload["audio"],
                        "mimeType": audio_payload["mimeType"],
                        "durationSeconds": audio_payload.get("durationSeconds", 0.0),
                        "geminiVoice": audio_payload.get("geminiVoice", "Aoede"),
                    }
                )
        finally:
            for pending in tts_tasks:
                if not pending.done():
                    pending.cancel()

        total_ms = round((time.perf_counter() - t_start) * 1000.0, 1)
        await emit_frame(
            {
                "type": "turn_completed",
                "turnSeq": turn_seq,
                "llmMs": llm_ms,
                "totalMs": total_ms,
            }
        )
