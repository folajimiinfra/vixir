"""Typed whitelisted LiveKit RPC wrappers with ScreenMap validation and 1-retry verbal fallback (Req 7, contracts.md §5)."""
from __future__ import annotations

import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any, Literal

from .contracts import RPC_METHODS, RpcCall, ScreenMap, TourStep

logger = logging.getLogger("vix.rpc")

RpcSenderFn = Callable[[str, str], Awaitable[str | dict[str, Any]]]


def validate_rpc_call(call: RpcCall, screen_map: ScreenMap | None) -> tuple[bool, str | None]:
    """Verify that the RPC method is whitelisted and any regionId/elementId exists in screen_map (Req 4 AC8, Req 7 AC1–2)."""
    if call.method not in RPC_METHODS:
        return (False, f"Method '{call.method}' is not in whitelisted RPC_METHODS")

    if call.method == "spotlight":
        region_id = call.payload.get("regionId", "")
        if not screen_map or not screen_map.has_id(region_id):
            return (False, f"regionId '{region_id}' is absent from current ScreenMap")

    elif call.method == "pointAt":
        element_id = call.payload.get("elementId", "")
        if not screen_map or not screen_map.has_id(element_id):
            return (False, f"elementId '{element_id}' is absent from current ScreenMap")

    elif call.method == "startTour":
        steps = call.payload.get("steps") or []
        if not screen_map:
            return (False, "No ScreenMap available to verify startTour steps")
        for step in steps:
            rid = step.get("regionId") if isinstance(step, dict) else getattr(step, "regionId", "")
            if not screen_map.has_id(rid):
                return (False, f"Tour step regionId '{rid}' is absent from current ScreenMap")

    elif call.method == "openPanel":
        panel = call.payload.get("panel")
        if panel not in ("readings", "notebook", "assistant"):
            return (False, f"Invalid panel '{panel}' for openPanel")

    return (True, None)


def describe_target_in_words(call: RpcCall, screen_map: ScreenMap | None) -> str:
    """Fallback verbal description when a regionId disappears or an RPC fails twice (Req 7 AC2–3)."""
    target_id = (
        call.payload.get("regionId")
        or call.payload.get("elementId")
        or ""
    )
    label = call.payload.get("label") or target_id or "that area"
    if screen_map:
        for reg in screen_map.regions:
            if reg.id == target_id or target_id.startswith(reg.id + "."):
                label = reg.label
                break
    return f"Look toward the {label} area on your lab screen."


class RpcDispatcher:
    """Executes whitelisted Vix RPCs against the web client with ScreenMap checks and 1 retry."""

    def __init__(self, sender: RpcSenderFn | None = None) -> None:
        self._sender = sender
        self.history: list[RpcCall] = []
        self.verbal_fallbacks: list[str] = []

    async def execute(
        self,
        call: RpcCall,
        screen_map: ScreenMap | None,
    ) -> tuple[bool, str | None]:
        """Run one RPC call after verifying IDs against the current ScreenMap (Req 7 AC1–3)."""
        valid, err_reason = validate_rpc_call(call, screen_map)
        if not valid:
            logger.info("Skipping RPC %s: %s", call.method, err_reason)
            fallback = describe_target_in_words(call, screen_map)
            self.verbal_fallbacks.append(fallback)
            return (False, fallback)

        if self._sender is None:
            self.history.append(call)
            return (True, None)

        payload_json = json.dumps(call.payload)
        for attempt in range(2):  # Req 7 AC3: retry once on error
            try:
                raw_resp = await self._sender(call.method, payload_json)
                parsed: Any = raw_resp
                if isinstance(raw_resp, str) and raw_resp.strip().startswith("{"):
                    try:
                        parsed = json.loads(raw_resp)
                    except json.JSONDecodeError:
                        parsed = raw_resp
                if isinstance(parsed, dict) and "error" in parsed:
                    logger.warning(
                        "RPC %s attempt %d returned error: %s",
                        call.method,
                        attempt + 1,
                        parsed["error"],
                    )
                    continue
                self.history.append(call)
                return (True, None)
            except Exception as exc:
                logger.warning("RPC %s attempt %d raised %s", call.method, attempt + 1, exc)

        fallback = describe_target_in_words(call, screen_map)
        self.verbal_fallbacks.append(fallback)
        return (False, fallback)

    # Typed builder helpers matching contracts.md §5
    @staticmethod
    def spotlight(region_id: str, duration_ms: int = 6000) -> RpcCall:
        return RpcCall(
            method="spotlight",
            payload={"regionId": region_id, "durationMs": duration_ms},
        )

    @staticmethod
    def point_at(element_id: str, label: str) -> RpcCall:
        return RpcCall(
            method="pointAt",
            payload={"elementId": element_id, "label": label},
        )

    @staticmethod
    def start_tour(tour_id: str, steps: list[TourStep]) -> RpcCall:
        return RpcCall(
            method="startTour",
            payload={
                "tourId": tour_id,
                "steps": [s.model_dump() for s in steps],
            },
        )

    @staticmethod
    def tour_step(index: int) -> RpcCall:
        return RpcCall(method="tourStep", payload={"index": int(index)})

    @staticmethod
    def end_tour() -> RpcCall:
        return RpcCall(method="endTour", payload={})

    @staticmethod
    def open_panel(panel: Literal["readings", "notebook", "assistant"]) -> RpcCall:
        return RpcCall(method="openPanel", payload={"panel": panel})

    @staticmethod
    def show_caption(text: str, final: bool = True) -> RpcCall:
        return RpcCall(method="showCaption", payload={"text": text, "final": bool(final)})
