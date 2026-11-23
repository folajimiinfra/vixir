"""Dual Policy_Guard: deterministic regex rule check + real LLM classifier + 1-pass LLM rewrite (Req 6)."""
from __future__ import annotations

import json
import logging
from collections.abc import Iterable
from pathlib import Path

from ..contracts import Mode
from ..llm import LLMBrain, create_llm_brain
from ..policy import violates

logger = logging.getLogger("vix.graph.policy")

_PROMPTS_DIR = Path(__file__).parent / "prompts"

SAFE_GRADED_FALLBACK = (
    "Look closely at the readings in your table and the formula in the experiment briefing. "
    "What expression do you get when you substitute your own recorded values?"
)

SAFE_PRACTICE_FALLBACK = (
    "I can guide you through the method, but I cannot change the apparatus or submit the practical for you. "
    "Which step of the procedure are you working on right now?"
)


def _load_rewrite_template() -> str:
    path = _PROMPTS_DIR / "rewrite_v1.txt"
    return path.read_text(encoding="utf-8")


def _load_system_prompt() -> str:
    path = _PROMPTS_DIR / "system.txt"
    return path.read_text(encoding="utf-8")


class PolicyGuard:
    """Two-stage Policy_Guard (Req 6 AC1–7): deterministic regex rules + real LLM classifier + 1-pass LLM rewrite."""

    def __init__(
        self,
        brain: LLMBrain | None = None,
        *,
        extra_units: Iterable[str] | None = None,
        extra_symbols: Iterable[str] | None = None,
    ) -> None:
        self.brain = brain or create_llm_brain()
        self.extra_units = tuple(extra_units or ())
        self.extra_symbols = tuple(extra_symbols or ())

    def rule_check(self, message: str, mode: Mode) -> str | None:
        """Deterministic rule check (first half of Req 6 AC3)."""
        return violates(
            message,
            mode,
            extra_units=self.extra_units,
            extra_symbols=self.extra_symbols,
        )

    async def llm_classifier_check(self, message: str, mode: Mode) -> tuple[bool, str]:
        """Real LLM classifier returning (leak: bool, reason: str) (second half of Req 6 AC3)."""
        prompt = (
            "You are the Policy_Guard classifier for Vixir Virtual Science Lab.\n"
            f"Mode: {mode}\n"
            f'Candidate Reply: "{message}"\n\n'
            "Rules:\n"
            "1. In GRADED mode, the reply must NEVER state a measured reading, calculated value, slope, "
            "final numeric answer, or confirm whether a student's specific number is right or wrong.\n"
            "2. In ALL modes (PRACTICE or GRADED), the reply must NEVER claim to have changed apparatus state, "
            "recorded a reading, or submitted the attempt for the student.\n\n"
            'Respond with strict JSON only: {"leak": true or false, "reason": "short explanation if leak is true, else empty string"}'
        )
        raw = await self.brain.generate(
            prompt,
            system="You are a strict academic integrity classifier. Output valid JSON only.",
            fast=True,
            temperature=0.0,
            max_tokens=120,
            json_mode=True,
        )
        try:
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1:
                parsed = json.loads(raw[start : end + 1])
                return (bool(parsed.get("leak", False)), str(parsed.get("reason", "")))
        except Exception as exc:
            logger.warning("Failed to parse LLM policy classifier JSON: %s", exc)
        return (False, "")

    def blocks(self, message: str, mode: Mode = "GRADED") -> bool:
        """Synchronous check for rule violations + LLM classifier."""
        return self.rule_check(message, mode) is not None

    async def check(self, message: str, mode: Mode) -> tuple[bool, str | None]:
        """Run both deterministic rule check and real LLM classifier independently; blocked if either flags it (Req 6 AC3)."""
        rule_reason = self.rule_check(message, mode)
        if rule_reason is not None:
            return (True, rule_reason)

        llm_leak, llm_reason = await self.llm_classifier_check(message, mode)
        if llm_leak:
            return (True, llm_reason or "flagged by LLM policy classifier")

        return (False, None)

    async def rewrite_once(self, message: str, mode: Mode, violation_reason: str) -> str:
        """Call the real LLM with rewrite_v1.txt to remove the named policy violation (Req 6 AC2)."""
        template = _load_rewrite_template()
        prompt = template.format(
            original_response=message,
            violation_reason=violation_reason,
            mode=mode,
        )
        rewritten = await self.brain.generate(
            prompt,
            system=_load_system_prompt(),
            fast=True,
            temperature=0.2,
            max_tokens=200,
        )
        return rewritten.strip()

    def rewrite(
        self,
        message: str,
        mode: Mode = "GRADED",
        violation_reason: str = "policy violation",
    ) -> str:
        """Synchronous wrapper calling the real LLM rewrite prompt."""
        template = _load_rewrite_template()
        prompt = template.format(
            original_response=message,
            violation_reason=violation_reason,
            mode=mode,
        )
        return self.brain.generate_sync(
            prompt,
            system=_load_system_prompt(),
            fast=True,
            temperature=0.2,
            max_tokens=200,
        ).strip()

    def safe_fallback(self, mode: Mode) -> str:
        return SAFE_GRADED_FALLBACK if mode == "GRADED" else SAFE_PRACTICE_FALLBACK

    async def enforce(self, draft: str, mode: Mode) -> tuple[str, bool, str | None, int]:
        """Enforce mode policy on `draft` with at most ONE LLM rewrite attempt before safe fallback (Req 6 AC2)."""
        blocked, reason = await self.check(draft, mode)
        if not blocked:
            return (draft, False, None, 0)

        candidate = await self.rewrite_once(draft, mode, reason or "policy violation")
        still_blocked, _ = await self.check(candidate, mode)
        if not still_blocked and candidate:
            return (candidate, True, reason, 1)

        return (self.safe_fallback(mode), True, reason, 2)
