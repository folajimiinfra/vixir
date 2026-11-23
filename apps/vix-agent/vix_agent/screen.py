"""ScreenMap cache, staleness refresh, natural-language reference resolver, and FrameSampler (Req 3)."""
from __future__ import annotations

import asyncio
import logging
import re
import time
from collections.abc import Awaitable, Callable
from typing import Any

from .contracts import ScreenMap

logger = logging.getLogger("vix.screen")

STALE_THRESHOLD_S = 2.0      # Req 3 AC1: ScreenMap > 2s old is treated as stale
REFRESH_WAIT_TIMEOUT_S = 1.5  # Req 3 AC2: wait up to 1.5s for refreshed ScreenMap
SPEAKING_FRAME_INTERVAL_S = 1.0  # Req 3 AC7: max 1 frame/s while speaking
IDLE_FRAME_INTERVAL_S = 5.0      # Req 3 AC7: max 1 frame/5s otherwise

# Common natural-language synonyms for lab apparatus and screen regions
_REGION_SYNONYMS: dict[str, tuple[str, ...]] = {
    "bench": ("bench", "canvas", "workspace", "center", "middle", "stage", "experiment area"),
    "bench.bob": ("bob", "orange ball", "brass ball", "pendulum bob", "sphere", "hanging weight", "mass"),
    "bench.stand": ("retort stand", "stand", "clamp", "split cork", "cork", "pivot"),
    "bench.ruler": ("metre rule", "meter stick", "ruler", "scale"),
    "dock.stopwatch": ("stopwatch", "timer", "clock", "digital timer", "oscillation timer"),
    "instrument-dock": ("instrument dock", "bottom dock", "bottom bar", "controls at the bottom", "sliders"),
    "apparatus-tray": ("apparatus tray", "left tray", "left panel", "tray on the left", "equipment list"),
    "tool-rail": ("tool rail", "left icons", "far left bar", "toolbar", "icons on the left"),
    "data-panel": ("data panel", "right panel", "panel on the right", "readings table", "table", "graph", "live plot"),
    "top-bar": ("top bar", "header", "practical switcher", "top menu"),
    "event-log": ("event log", "log strip", "status bar at the bottom"),
}


class ScreenMapCache:
    """Per-session in-memory ScreenMap holder with 2s staleness detection and 16 KB validation."""

    def __init__(self) -> None:
        self._screen_map: ScreenMap | None = None
        self._updated_at: float = 0.0
        self._refresh_event: asyncio.Event = asyncio.Event()

    @property
    def current(self) -> ScreenMap | None:
        return self._screen_map

    @property
    def age_seconds(self) -> float:
        if self._screen_map is None or self._updated_at <= 0:
            return float("inf")
        return max(0.0, time.monotonic() - self._updated_at)

    def is_stale(self, threshold_s: float = STALE_THRESHOLD_S) -> bool:
        """Return True if no ScreenMap exists or if it is older than threshold_s (2.0s)."""
        return self._screen_map is None or self.age_seconds > threshold_s

    def update(self, payload: str | bytes | dict[str, Any] | ScreenMap) -> bool:
        """Validate and store an incoming ScreenMap; malformed payloads (>16KB or bad shape) are discarded (Req 3 AC4)."""
        try:
            if isinstance(payload, ScreenMap):
                validated = payload
            else:
                validated = ScreenMap.parse_validated_payload(payload)
            self._screen_map = validated
            self._updated_at = time.monotonic()
            self._refresh_event.set()
            return True
        except Exception as exc:
            logger.warning("Discarded malformed ScreenMap payload: %s", exc)
            return False

    async def ensure_fresh(
        self,
        publish_request_fn: Callable[[], Awaitable[None]] | None = None,
        wait_timeout_s: float = REFRESH_WAIT_TIMEOUT_S,
    ) -> ScreenMap | None:
        """If cached ScreenMap is stale, publish on `vix.screenmap.request` and wait up to 1.5s (Req 3 AC2)."""
        if not self.is_stale():
            return self._screen_map

        if publish_request_fn is not None:
            self._refresh_event.clear()
            try:
                await publish_request_fn()
                await asyncio.wait_for(self._refresh_event.wait(), timeout=wait_timeout_s)
            except TimeoutError:
                logger.info(
                    "ScreenMap refresh timed out after %.1fs; proceeding with cached state",
                    wait_timeout_s,
                )
            except Exception as exc:
                logger.warning("ScreenMap refresh request failed: %s", exc)

        return self._screen_map


def find_region_at_point(x: int, y: int, screen_map: ScreenMap | None) -> str | None:
    """Geometric hit-test: find the most specific visible region whose bbox contains (x, y)."""
    if screen_map is None or not screen_map.regions:
        return None
    matches: list[tuple[str, int]] = []
    for r in screen_map.regions:
        if not r.visible:
            continue
        rx, ry, rw, rh = r.bbox
        if rx <= x <= rx + rw and ry <= y <= ry + rh:
            area = max(1, rw * rh)
            matches.append((r.id, area))
    if not matches:
        return None
    # Smallest bounding box area is the most specific nested region
    matches.sort(key=lambda item: item[1])
    return matches[0][0]


def resolve_screen_reference(
    user_text: str,
    screen_map: ScreenMap | None,
) -> tuple[list[str], float]:
    """Resolve natural-language region/element references OR live PointerTarget to ScreenMap IDs with confidence [0.0, 1.0]."""
    if screen_map is None or not screen_map.regions:
        return ([], 0.0)

    q = user_text.strip().lower()

    # 0. Check if the student is actively pointing at an element on screen (`screen_map.pointerTarget`)
    pt = screen_map.pointerTarget
    is_deictic = any(
        tok in q
        for tok in (
            "this",
            "that",
            "here",
            "there",
            "pointing",
            "clicked",
            "selected",
            "hovering",
            "what is it",
            "what does it do",
            "how do i use it",
        )
    )
    if pt is not None:
        hit_region = (
            pt.regionId
            if (pt.regionId and screen_map.has_id(pt.regionId))
            else find_region_at_point(pt.x, pt.y, screen_map)
        )
        if hit_region and (is_deictic or not q):
            return ([hit_region], 0.98)

    if not q:
        return ([], 0.0)

    visible = [r for r in screen_map.regions if r.visible]
    candidates = visible if visible else screen_map.regions

    scored: list[tuple[str, float]] = []
    viewport_w = max(1, screen_map.viewport.get("w", 1440))
    viewport_h = max(1, screen_map.viewport.get("h", 900))

    # Check sub-element dotted references first (e.g. "orange ball" / "the bob" -> "bench.bob")
    if any(tok in q for tok in ("orange ball", "the bob", "pendulum bob", "brass bob", "hanging ball")):
        if screen_map.has_id("bench.bob"):
            return (["bench.bob"], 0.92)

    for region in candidates:
        score = 0.0
        r_id = region.id.lower()
        r_label = region.label.lower()
        r_kind = region.kind.lower()
        r_summary = (region.summary or "").lower()

        # 1. Exact ID or label substring match
        if r_id in q or r_label in q:
            score = max(score, 0.95)

        # 2. Token overlap with label and summary
        label_tokens = [w for w in re.split(r"\W+", r_label) if len(w) > 2]
        if label_tokens:
            matched_label_tokens = sum(1 for tok in label_tokens if tok in q)
            if matched_label_tokens > 0:
                score = max(score, 0.75 + 0.1 * min(2, matched_label_tokens))

        summary_tokens = [w for w in re.split(r"\W+", r_summary) if len(w) > 3]
        matched_summary_tokens = sum(1 for tok in summary_tokens if tok in q)
        if matched_summary_tokens > 0:
            score = max(score, 0.72 + 0.05 * min(3, matched_summary_tokens))

        # 3. Synonym table match
        for canonical_id, phrases in _REGION_SYNONYMS.items():
            if canonical_id == r_id or r_id.endswith(canonical_id):
                if any(p in q for p in phrases):
                    score = max(score, 0.88)

        # 4. Region kind match ("this instrument", "this table", "this chart", "this control")
        if r_kind in q:
            score = max(score, 0.72)

        # 5. Spatial bounding-box cues ("panel on the right", "on the left", "at the bottom", "at the top")
        x, y, w, h = region.bbox
        center_x = (x + w / 2.0) / viewport_w
        center_y = (y + h / 2.0) / viewport_h

        if ("on the right" in q or "right panel" in q or "right side" in q) and center_x > 0.62:
            score = max(score, 0.82)
        if ("on the left" in q or "left panel" in q or "left side" in q or "left tray" in q) and center_x < 0.35:
            score = max(score, 0.82)
        if ("at the bottom" in q or "bottom dock" in q or "bottom bar" in q) and center_y > 0.68:
            score = max(score, 0.82)
        if ("at the top" in q or "top bar" in q) and center_y < 0.20:
            score = max(score, 0.82)
        if ("in the middle" in q or "in the center" in q or "the bench" in q) and (
            0.25 <= center_x <= 0.75 and 0.20 <= center_y <= 0.75
        ):
            score = max(score, 0.80)

        if score > 0:
            scored.append((region.id, round(min(1.0, score), 2)))

    if not scored:
        return ([], 0.0)

    scored.sort(key=lambda item: item[1], reverse=True)
    best_score = scored[0][1]
    top_ids = [rid for rid, sc in scored if sc >= max(0.7, best_score - 0.1)]
    if not top_ids:
        top_ids = [scored[0][0]]
    return (top_ids, best_score)


class FrameSampler:
    """Rate-limited screen-share Frame sampler strictly gated by `consent.screen` (Req 3 AC6–8)."""

    def __init__(self, *, consent_screen: bool = False, max_dimension_px: int = 1024) -> None:
        self.consent_screen = consent_screen
        self.max_dimension_px = min(1024, max_dimension_px)
        self._last_sample_ts: float = 0.0
        self._latest_frame_b64: str | None = None

    def set_consent(self, consent_screen: bool) -> None:
        self.consent_screen = bool(consent_screen)
        if not self.consent_screen:
            self._latest_frame_b64 = None

    def can_sample(self, *, is_student_speaking: bool = False, now_monotonic: float | None = None) -> bool:
        """Enforce Req 3 AC7–8: never sample if consent.screen is False; max 1/s speaking, 1/5s idle."""
        if not self.consent_screen:
            return False
        now = time.monotonic() if now_monotonic is None else now_monotonic
        if self._last_sample_ts <= 0:
            return True
        min_interval = SPEAKING_FRAME_INTERVAL_S if is_student_speaking else IDLE_FRAME_INTERVAL_S
        return (now - self._last_sample_ts) >= min_interval

    def ingest_frame(
        self,
        frame_b64: str,
        *,
        is_student_speaking: bool = False,
        now_monotonic: float | None = None,
    ) -> str | None:
        """Store a base64 JPEG frame only if consent is granted and within rate limit."""
        if not self.can_sample(
            is_student_speaking=is_student_speaking, now_monotonic=now_monotonic
        ):
            return None
        self._last_sample_ts = time.monotonic() if now_monotonic is None else now_monotonic
        self._latest_frame_b64 = frame_b64
        return self._latest_frame_b64

    def get_frame_for_disambiguation(self, confidence: float) -> str | None:
        """Return latest frame only when ScreenMap resolution confidence < 0.7 and consent is True (Req 3 AC6, AC8)."""
        if not self.consent_screen or confidence >= 0.7:
            return None
        return self._latest_frame_b64
