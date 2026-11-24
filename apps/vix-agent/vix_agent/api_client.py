"""Service-JWT authenticated client for Vixir internal Vix endpoints (contracts.md §1, §7)."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import os
import time
from typing import Any

import httpx

from .contracts import SessionContext

logger = logging.getLogger("vix.api_client")


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def create_service_jwt(
    secret: str | None = None,
    *,
    ttl_seconds: int = 300,
    now_ts: int | None = None,
) -> str:
    """Create an HS256 Service_Token JWT with scope 'vix-agent' (contracts.md §1)."""
    signing_secret = (
        secret
        if secret is not None
        else os.environ.get("VIXIR_SERVICE_SECRET", "dev-vixir-service-secret")
    )
    iat = int(now_ts if now_ts is not None else time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": "vix-agent",
        "scope": "vix-agent",
        "iat": iat,
        "exp": iat + ttl_seconds,
    }
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(
        signing_secret.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    return f"{header_b64}.{payload_b64}.{_b64url_encode(signature)}"


class VixirApiClient:
    """Async HTTP client for `/api/v1/internal/vix/sessions/{id}/...`."""

    def __init__(
        self,
        base_url: str | None = None,
        service_secret: str | None = None,
        timeout_s: float = 3.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.base_url = (
            base_url or os.environ.get("VIXIR_API_URL", "http://localhost:8081/api/v1")
        ).rstrip("/")
        self.service_secret = service_secret or os.environ.get(
            "VIXIR_SERVICE_SECRET", "dev-vixir-service-secret"
        )
        self.timeout_s = timeout_s
        self._transport = transport

    def _headers(self) -> dict[str, str]:
        token = create_service_jwt(self.service_secret)
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def get_session_context(self, session_id: str) -> SessionContext | None:
        """Fetch session context at room join (Req 1 AC1–4). Returns None on non-2xx or network error."""
        url = f"{self.base_url}/internal/vix/sessions/{session_id}/context"
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout_s, transport=self._transport
            ) as client:
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 403:
                    body = resp.json() if resp.content else {}
                    if body.get("code") == "VIX_DISABLED_INSTITUTION":
                        return SessionContext(
                            mode="PRACTICE",
                            firstName="Student",
                            vixDisabledInstitution=True,
                        )
                if resp.status_code < 200 or resp.status_code >= 300:
                    logger.warning(
                        "Context fetch for session %s returned HTTP %d",
                        session_id,
                        resp.status_code,
                    )
                    return None
                return SessionContext.model_validate(resp.json())
        except Exception as exc:
            logger.warning("Failed to fetch session context for %s: %s", session_id, exc)
            return None

    async def post_turn_message(
        self,
        session_id: str,
        *,
        role: str,
        text: str,
        policy_blocked: bool = False,
        transcripts_retained: bool = False,
        institution_id: str | None = "inst",
    ) -> bool:
        """Record a turn message ONLY when transcript retention is enabled and institution_id is non-null (Req 8 AC3–6)."""
        if not transcripts_retained or institution_id is None:
            return False

        url = f"{self.base_url}/internal/vix/sessions/{session_id}/messages"
        payload: dict[str, Any] = {
            "role": role,
            "text": text,
            "policyBlocked": policy_blocked,
        }
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout_s, transport=self._transport
            ) as client:
                resp = await client.post(url, headers=self._headers(), json=payload)
                return 200 <= resp.status_code < 300
        except Exception as exc:
            logger.warning("Failed to post message for session %s: %s", session_id, exc)
            return False

    async def post_session_end(self, session_id: str, *, turns: int) -> bool:
        """Notify API that Vix session ended with total turns count (Req 1 AC6)."""
        url = f"{self.base_url}/internal/vix/sessions/{session_id}/end"
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout_s, transport=self._transport
            ) as client:
                resp = await client.post(
                    url, headers=self._headers(), json={"turns": max(0, int(turns))}
                )
                return 200 <= resp.status_code < 300
        except Exception as exc:
            logger.warning("Failed to post session end for %s: %s", session_id, exc)
            return False
