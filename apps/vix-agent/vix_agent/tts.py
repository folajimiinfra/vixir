"""Gemini 3.8 Neural TTS Service for Vix Agent (modeled on luminarix/voice-integrations FrontdeskVoicePreviewService).

Uses `gemini-3.8-flash-lite-tts` and `gemini-3.8-flash-tts` with `responseModalities: ["AUDIO"]`
and Gemini prebuilt neural voices (`Aoede`, `Charon`, `Kore`, `Orus`, `Sulafat`, `Erinome`)
steered with bracketed accent/personality tags so Vix sounds natural, warm, and human rather than
like browser robotic speechSynthesis.
"""
from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
import re
import struct
from collections import OrderedDict
from typing import Any

import httpx

from .llm import _load_env_files

logger = logging.getLogger("vix.tts")

_load_env_files()

# Map Vix persona IDs ('ada', 'tunde', 'grace') and Gemini prebuilt voice names to (GeminiVoiceName, Accent, Tone)
VOICE_PERSONA_MAP: dict[str, tuple[str, str, str]] = {
    "ada": ("Aoede", "Nigerian English", "warm, friendly, conversational science lab guide"),
    "tunde": ("Charon", "Nigerian English", "calm, encouraging, natural science lab guide"),
    "grace": ("Kore", "British English", "clear, warm, articulate science lab guide"),
    "aoede": ("Aoede", "Nigerian English", "warm, friendly, conversational"),
    "charon": ("Charon", "Nigerian English", "calm, reassuring, conversational"),
    "kore": ("Kore", "British English", "clear, warm, articulate"),
    "orus": ("Orus", "Irish", "friendly, warm"),
    "sulafat": ("Sulafat", "British", "warm, articulate"),
    "erinome": ("Erinome", "Irish", "warm, expressive"),
}

LOCALE_ACCENT_OVERRIDE: dict[str, str] = {
    "pidgin": "Nigerian Pidgin English",
    "yoruba": "Nigerian Yoruba-inflected English",
    "hausa": "Nigerian Hausa-inflected English",
    "igbo": "Nigerian Igbo-inflected English",
}


def pcm_to_wav(pcm_bytes: bytes, sample_rate: int = 24000) -> bytes:
    """Wrap mono 16-bit little-endian PCM in a 44-byte RIFF/WAVE header so browsers play it natively."""
    data_len = len(pcm_bytes)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_len,
        b"WAVE",
        b"fmt ",
        16,               # Subchunk1Size (PCM)
        1,                # AudioFormat (1 = PCM)
        1,                # NumChannels (1 = Mono)
        sample_rate,      # SampleRate
        sample_rate * 2,  # ByteRate (SampleRate * NumChannels * BitsPerSample/8)
        2,                # BlockAlign (NumChannels * BitsPerSample/8)
        16,               # BitsPerSample
        b"data",
        data_len,
    )
    return header + pcm_bytes


def wav_seconds(wav_bytes: bytes) -> float:
    if len(wav_bytes) < 44:
        return 0.0
    byte_rate = struct.unpack_from("<I", wav_bytes, 28)[0]
    return (len(wav_bytes) - 44) / byte_rate if byte_rate > 0 else 0.0


def longest_plausible_seconds(text: str) -> float:
    word_count = len([w for w in re.split(r"\s+", text.strip()) if w])
    return word_count * 0.8 + 6.0


class GeminiNeuralTTSService:
    """Synthesizes natural human speech via Gemini 3.8 Neural TTS with LRU caching."""

    CACHE_SIZE = 80

    def __init__(self, api_key: str | None = None) -> None:
        _load_env_files()
        self.api_key = (
            api_key
            or os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
            or ""
        ).strip()
        primary = os.environ.get("GEMINI_TTS_MODEL", "gemini-3.8-flash-lite-tts").strip()
        self.models = list(
            dict.fromkeys([primary, "gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts", "gemini-2.5-flash-preview-tts"])
        )
        self._cache: OrderedDict[str, dict[str, Any]] = OrderedDict()

    def resolve_voice_and_style(self, voice_id: str = "ada", locale: str = "English") -> tuple[str, str]:
        cleaned_voice = (voice_id or "ada").strip().lower()
        gemini_voice, default_accent, tone = VOICE_PERSONA_MAP.get(
            cleaned_voice, VOICE_PERSONA_MAP["ada"]
        )
        cleaned_locale = (locale or "English").strip().lower()
        accent = LOCALE_ACCENT_OVERRIDE.get(cleaned_locale, default_accent)
        style_tag = f"[{accent} accent, {tone}, speaking naturally to a student in a lab]"
        return (gemini_voice, style_tag)

    async def synthesize(
        self,
        text: str,
        *,
        voice_id: str = "ada",
        locale: str = "English",
    ) -> dict[str, Any]:
        """Synthesize `text` into a base64 WAV payload using Gemini 3.8 Neural TTS."""
        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValueError("Cannot synthesize empty text")
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured for neural TTS")

        gemini_voice, style_tag = self.resolve_voice_and_style(voice_id, locale)
        cache_key = hashlib.sha256(
            json.dumps([self.models[0], gemini_voice, style_tag, cleaned_text]).encode("utf-8")
        ).hexdigest()

        if cache_key in self._cache:
            hit = self._cache.pop(cache_key)
            self._cache[cache_key] = hit
            return {**hit, "voiceId": voice_id, "geminiVoice": gemini_voice, "cached": True}

        last_err: Exception | None = None
        async with httpx.AsyncClient(timeout=18.0) as client:
            for model in self.models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                    payload = {
                        "contents": [
                            {
                                "role": "user",
                                "parts": [{"text": f"{style_tag} {cleaned_text}"}],
                            }
                        ],
                        "generationConfig": {
                            "responseModalities": ["AUDIO"],
                            "speechConfig": {
                                "voiceConfig": {
                                    "prebuiltVoiceConfig": {"voiceName": gemini_voice}
                                }
                            },
                        },
                    }
                    resp = await client.post(url, params={"key": self.api_key}, json=payload)
                    if resp.status_code in (401, 403) and not self.api_key.startswith("AIza"):
                        resp = await client.post(
                            url,
                            headers={"Authorization": f"Bearer {self.api_key}"},
                            json=payload,
                        )
                    resp.raise_for_status()
                    data = resp.json()

                    parts = (
                        data.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [])
                    )
                    inline = next(
                        (p.get("inlineData") for p in parts if p.get("inlineData", {}).get("data")),
                        None,
                    )
                    if not inline:
                        raise RuntimeError(f"No audio inlineData returned by {model}")

                    mime_type = (inline.get("mimeType") or "").lower()
                    raw_bytes = base64.b64decode(inline["data"])

                    if not mime_type.startswith("audio/wav") and not mime_type.startswith("audio/x-wav"):
                        rate_match = re.search(r"rate=(\d+)", mime_type)
                        sample_rate = int(rate_match.group(1)) if rate_match else 24000
                        wav_bytes = pcm_to_wav(raw_bytes, sample_rate)
                    else:
                        wav_bytes = raw_bytes

                    result = {
                        "audio": base64.b64encode(wav_bytes).decode("ascii"),
                        "mimeType": "audio/wav",
                        "model": model,
                        "durationSeconds": round(wav_seconds(wav_bytes), 2),
                    }
                    self._cache[cache_key] = result
                    while len(self._cache) > self.CACHE_SIZE:
                        self._cache.popitem(last=False)

                    return {
                        **result,
                        "voiceId": voice_id,
                        "geminiVoice": gemini_voice,
                        "cached": False,
                    }
                except Exception as exc:
                    last_err = exc
                    logger.warning("Gemini Neural TTS via %s failed: %s", model, exc)

        raise RuntimeError(f"Gemini Neural TTS failed across all models: {last_err}")


GLOBAL_TTS_SERVICE = GeminiNeuralTTSService()
