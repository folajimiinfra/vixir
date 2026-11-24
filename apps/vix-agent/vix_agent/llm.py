"""Pluggable Multi-Provider LLM Brain for Vix Agent (Real LLM calls only — zero simulation).

Supports switching or chaining across popular LLM providers:
- Google Gemini (`gemini`: gemini-2.5-flash, gemini-3.8-flash, gemini-2.5-pro)
- Anthropic Claude (`anthropic`: claude-sonnet-4-5, claude-3-7-sonnet-latest, claude-3-5-sonnet-latest, claude-3-5-haiku-latest)
- OpenAI (`openai`: gpt-4o, gpt-4o-mini, gpt-4.1, o3-mini)
- Groq (`groq`: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768)
- DeepSeek (`deepseek`: deepseek-chat, deepseek-reasoner)
- Mistral AI (`mistral`: mistral-large-latest, mistral-small-latest, pixtral-12b-2409)
- OpenRouter (`openrouter`: google/gemini-2.5-flash, anthropic/claude-3.7-sonnet, etc.)
- Together AI (`together`: meta-llama/Llama-3.3-70B-Instruct-Turbo, Qwen/Qwen2.5-72B-Instruct-Turbo)
- xAI Grok (`xai`: grok-2-latest, grok-2-vision-latest)
- Local Ollama / vLLM (`ollama`: llama3.2, qwen2.5, gemma2, llava)
"""
from __future__ import annotations

import asyncio
import concurrent.futures
import logging
import os
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import httpx

from .contracts import LLMProviderName

logger = logging.getLogger("vix.llm")

DEFAULT_TIMEOUT_S = 12.0  # Per-turn LLM timeout supporting Gemini 3 & Gemini 4 Argon
RETRY_DELAY_S = 0.5       # Req 9 AC1: 500 ms retry delay


def _load_env_files() -> None:
    """Load environment variables from apps/vix-agent/.env and workspace root .env if present."""
    here = Path(__file__).resolve().parent
    candidates = [
        here.parent / ".env",
        here.parent.parent.parent / ".env",
    ]
    for env_path in candidates:
        if not env_path.is_file():
            continue
        try:
            for raw_line in env_path.read_text(encoding="utf-8").splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                key = k.strip()
                val = v.strip().strip("\"'")
                if key and val and not os.environ.get(key):
                    os.environ[key] = val
        except Exception as exc:
            logger.debug("Could not read %s: %s", env_path, exc)


_load_env_files()


@dataclass(frozen=True)
class ProviderPreset:
    name: LLMProviderName
    display_name: str
    default_model: str
    fast_model: str
    vision_model: str
    env_key: str
    alt_env_keys: tuple[str, ...] = ()
    base_url: str = ""
    popular_models: tuple[str, ...] = ()


PROVIDER_CATALOG: dict[LLMProviderName, ProviderPreset] = {
    "gemini": ProviderPreset(
        name="gemini",
        display_name="Google Gemini",
        default_model="gemini-3.8-flash",
        fast_model="gemini-3.1-flash-lite-preview",
        vision_model="gemini-4-argon",
        env_key="GEMINI_API_KEY",
        alt_env_keys=("GOOGLE_API_KEY",),
        base_url="https://generativelanguage.googleapis.com/v1beta",
        popular_models=(
            "gemini-4-argon",
            "gemini-3.8-flash",
            "gemini-3.1-flash-lite-preview",
        ),
    ),
    "anthropic": ProviderPreset(
        name="anthropic",
        display_name="Anthropic Claude",
        default_model="claude-3-5-sonnet-latest",
        fast_model="claude-3-5-haiku-latest",
        vision_model="claude-3-5-sonnet-latest",
        env_key="ANTHROPIC_API_KEY",
        base_url="https://api.anthropic.com/v1",
        popular_models=(
            "claude-sonnet-4-5",
            "claude-haiku-4-5",
            "claude-3-7-sonnet-latest",
            "claude-3-5-sonnet-latest",
            "claude-3-5-haiku-latest",
        ),
    ),
    "openai": ProviderPreset(
        name="openai",
        display_name="OpenAI GPT",
        default_model="gpt-4o",
        fast_model="gpt-4o-mini",
        vision_model="gpt-4o",
        env_key="OPENAI_API_KEY",
        base_url="https://api.openai.com/v1",
        popular_models=(
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4.1",
            "gpt-4.1-mini",
            "o3-mini",
        ),
    ),
    "groq": ProviderPreset(
        name="groq",
        display_name="Groq LPU",
        default_model="llama-3.3-70b-versatile",
        fast_model="llama-3.1-8b-instant",
        vision_model="llama-3.2-90b-vision-preview",
        env_key="GROQ_API_KEY",
        base_url="https://api.groq.com/openai/v1",
        popular_models=(
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "llama-3.2-90b-vision-preview",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
        ),
    ),
    "deepseek": ProviderPreset(
        name="deepseek",
        display_name="DeepSeek",
        default_model="deepseek-chat",
        fast_model="deepseek-chat",
        vision_model="deepseek-chat",
        env_key="DEEPSEEK_API_KEY",
        base_url="https://api.deepseek.com/v1",
        popular_models=(
            "deepseek-chat",
            "deepseek-reasoner",
        ),
    ),
    "mistral": ProviderPreset(
        name="mistral",
        display_name="Mistral AI",
        default_model="mistral-large-latest",
        fast_model="mistral-small-latest",
        vision_model="pixtral-12b-2409",
        env_key="MISTRAL_API_KEY",
        base_url="https://api.mistral.ai/v1",
        popular_models=(
            "mistral-large-latest",
            "mistral-small-latest",
            "pixtral-12b-2409",
            "codestral-latest",
        ),
    ),
    "openrouter": ProviderPreset(
        name="openrouter",
        display_name="OpenRouter (200+ Models)",
        default_model="google/gemini-3.8-flash",
        fast_model="google/gemini-3.1-flash-lite-preview",
        vision_model="google/gemini-4-argon",
        env_key="OPENROUTER_API_KEY",
        base_url="https://openrouter.ai/api/v1",
        popular_models=(
            "google/gemini-4-argon",
            "google/gemini-3.8-flash",
            "anthropic/claude-3.7-sonnet",
            "openai/gpt-4o-mini",
            "meta-llama/llama-3.3-70b-instruct",
            "qwen/qwen-2.5-72b-instruct",
            "deepseek/deepseek-chat",
        ),
    ),
    "together": ProviderPreset(
        name="together",
        display_name="Together AI",
        default_model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
        fast_model="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        vision_model="meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
        env_key="TOGETHER_API_KEY",
        base_url="https://api.together.xyz/v1",
        popular_models=(
            "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
            "Qwen/Qwen2.5-72B-Instruct-Turbo",
        ),
    ),
    "xai": ProviderPreset(
        name="xai",
        display_name="xAI Grok",
        default_model="grok-2-latest",
        fast_model="grok-2-latest",
        vision_model="grok-2-vision-latest",
        env_key="XAI_API_KEY",
        base_url="https://api.x.ai/v1",
        popular_models=(
            "grok-2-latest",
            "grok-2-vision-latest",
        ),
    ),
    "ollama": ProviderPreset(
        name="ollama",
        display_name="Local Ollama / vLLM",
        default_model="llama3.2",
        fast_model="llama3.2",
        vision_model="llava",
        env_key="OLLAMA_API_KEY",
        base_url="http://localhost:11434/v1",
        popular_models=(
            "llama3.2",
            "qwen2.5",
            "gemma2",
            "llava",
            "mistral",
            "phi4",
        ),
    ),
}


def list_supported_brains() -> list[dict[str, Any]]:
    """Return metadata for all supported real LLM providers and their models."""
    _load_env_files()
    result: list[dict[str, Any]] = []
    for preset in PROVIDER_CATALOG.values():
        has_key = bool(_resolve_api_key(preset.name)) or preset.name == "ollama"
        result.append(
            {
                "provider": preset.name,
                "displayName": preset.display_name,
                "defaultModel": preset.default_model,
                "fastModel": preset.fast_model,
                "visionModel": preset.vision_model,
                "popularModels": list(preset.popular_models),
                "envKey": preset.env_key,
                "configured": has_key,
            }
        )
    return result


def _resolve_api_key(provider: LLMProviderName, explicit_key: str | None = None) -> str | None:
    if explicit_key:
        return explicit_key
    _load_env_files()
    preset = PROVIDER_CATALOG.get(provider)
    if not preset or not preset.env_key:
        return None
    val = os.environ.get(preset.env_key)
    if val:
        return val
    for alt in preset.alt_env_keys:
        alt_val = os.environ.get(alt)
        if alt_val:
            return alt_val
    return None


def detect_default_provider() -> LLMProviderName:
    """Detect the preferred real LLM provider from VIX_LLM_PROVIDER or available API keys."""
    _load_env_files()
    env_provider = os.environ.get("VIX_LLM_PROVIDER", "").strip().lower()
    if env_provider in PROVIDER_CATALOG:
        return env_provider  # type: ignore[return-value]

    priority_order: tuple[LLMProviderName, ...] = (
        "gemini",
        "anthropic",
        "openai",
        "groq",
        "deepseek",
        "mistral",
        "openrouter",
        "together",
        "xai",
    )
    for prov in priority_order:
        if _resolve_api_key(prov):
            return prov

    if os.environ.get("OLLAMA_BASE_URL"):
        return "ollama"

    return "gemini"


def parse_brain_spec(
    brain: str | None = None,
    provider: LLMProviderName | None = None,
    model: str | None = None,
) -> tuple[LLMProviderName, str]:
    """Parse a brain specification such as 'gemini/gemini-2.5-flash', 'claude', 'openai/gpt-4o', etc."""
    aliases: dict[str, LLMProviderName] = {
        "google": "gemini",
        "gemini": "gemini",
        "claude": "anthropic",
        "anthropic": "anthropic",
        "openai": "openai",
        "gpt": "openai",
        "groq": "groq",
        "deepseek": "deepseek",
        "mistral": "mistral",
        "openrouter": "openrouter",
        "together": "together",
        "xai": "xai",
        "grok": "xai",
        "ollama": "ollama",
        "local": "ollama",
    }

    if brain and "/" in brain:
        prefix, rest = brain.split("/", 1)
        mapped = aliases.get(prefix.strip().lower())
        if mapped:
            return mapped, rest.strip() or PROVIDER_CATALOG[mapped].default_model

    if brain:
        cleaned = brain.strip().lower()
        if cleaned in aliases:
            prov = aliases[cleaned]
            resolved_model = (
                model
                or os.environ.get("VIX_LLM_MODEL")
                or PROVIDER_CATALOG[prov].default_model
            )
            return prov, resolved_model
        if cleaned.startswith("gemini"):
            return "gemini", brain.strip()
        if cleaned.startswith("claude"):
            return "anthropic", brain.strip()
        if cleaned.startswith(("gpt-", "o1", "o3")):
            return "openai", brain.strip()
        if cleaned.startswith("deepseek"):
            return "deepseek", brain.strip()
        if cleaned.startswith(("mistral", "pixtral", "codestral")):
            return "mistral", brain.strip()
        if cleaned.startswith("grok"):
            return "xai", brain.strip()

    resolved_provider = provider or detect_default_provider()
    if resolved_provider not in PROVIDER_CATALOG:
        resolved_provider = "gemini"
    resolved_model = (
        model
        or os.environ.get("VIX_LLM_MODEL")
        or PROVIDER_CATALOG[resolved_provider].default_model
    )
    return resolved_provider, resolved_model


@dataclass
class LLMConfig:
    provider: LLMProviderName = field(default_factory=detect_default_provider)
    model: str = ""
    fast_model: str = ""
    api_key: str | None = None
    base_url: str | None = None
    temperature: float = 0.25
    max_tokens: int = 350
    timeout_s: float = DEFAULT_TIMEOUT_S
    fallback_providers: list[LLMProviderName] = field(default_factory=list)

    def __post_init__(self) -> None:
        if self.provider not in PROVIDER_CATALOG:
            self.provider = detect_default_provider()
        preset = PROVIDER_CATALOG[self.provider]
        if not self.model:
            self.model = os.environ.get("VIX_LLM_MODEL") or preset.default_model
        if not self.fast_model:
            self.fast_model = os.environ.get("VIX_FAST_MODEL") or preset.fast_model
        if not self.api_key:
            self.api_key = _resolve_api_key(self.provider)
        if not self.base_url:
            if self.provider == "ollama":
                self.base_url = os.environ.get("OLLAMA_BASE_URL", preset.base_url)
            else:
                self.base_url = preset.base_url


class LLMBrain:
    """Unified multi-provider real LLM brain for Vix with retry, timeout, vision, and provider failover."""

    def __init__(self, config: LLMConfig | None = None, **kwargs: Any) -> None:
        if config is not None:
            self.config = config
        else:
            brain_spec = kwargs.pop("brain", None)
            prov, mod = parse_brain_spec(
                brain=brain_spec,
                provider=kwargs.pop("provider", None),
                model=kwargs.pop("model", None),
            )
            self.config = LLMConfig(provider=prov, model=mod, **kwargs)

    @property
    def provider(self) -> LLMProviderName:
        return self.config.provider

    @property
    def model(self) -> str:
        return self.config.model

    @property
    def identifier(self) -> str:
        return f"{self.config.provider}/{self.config.model}"

    def switch_brain(
        self,
        brain: str | None = None,
        provider: LLMProviderName | None = None,
        model: str | None = None,
        api_key: str | None = None,
    ) -> str:
        """Dynamically hot-swap the active LLM provider/model at runtime."""
        prov, mod = parse_brain_spec(brain=brain, provider=provider, model=model)
        preset = PROVIDER_CATALOG[prov]
        self.config = LLMConfig(
            provider=prov,
            model=mod,
            fast_model=preset.fast_model,
            api_key=api_key or _resolve_api_key(prov),
            base_url=preset.base_url,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            timeout_s=self.config.timeout_s,
            fallback_providers=self.config.fallback_providers,
        )
        return self.identifier

    async def generate(
        self,
        prompt: str,
        *,
        system: str | None = None,
        fast: bool = False,
        frame_b64: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        json_mode: bool = False,
        context_fallback: str | None = None,
    ) -> str:
        """Generate a completion from the real LLM provider with 1 retry after 500ms (Req 9 AC1, AC6)."""
        active_model = self.config.fast_model if fast else self.config.model
        temp = self.config.temperature if temperature is None else temperature
        tokens = self.config.max_tokens if max_tokens is None else max_tokens

        providers_to_try: list[tuple[LLMProviderName, str, str | None, str | None]] = []
        if self.config.api_key or self.config.provider == "ollama":
            providers_to_try.append(
                (self.config.provider, active_model, self.config.api_key, self.config.base_url)
            )

        # Add any configured fallback providers that have API keys set
        chain = list(self.config.fallback_providers)
        for auto_fb in ("gemini", "openai", "anthropic", "groq"):
            if auto_fb not in chain and auto_fb != self.config.provider:
                chain.append(auto_fb)  # type: ignore[arg-type]

        for fb_prov in chain:
            if fb_prov in PROVIDER_CATALOG:
                fb_preset = PROVIDER_CATALOG[fb_prov]
                fb_key = _resolve_api_key(fb_prov)
                if fb_key or fb_prov == "ollama":
                    providers_to_try.append(
                        (
                            fb_prov,
                            fb_preset.fast_model if fast else fb_preset.default_model,
                            fb_key,
                            fb_preset.base_url,
                        )
                    )

        if not providers_to_try:
            raise RuntimeError(
                f"No API key configured for LLM provider '{self.config.provider}'. "
                f"Set {PROVIDER_CATALOG[self.config.provider].env_key} in .env."
            )

        last_err: Exception | None = None
        for prov, mod, api_key, base_url in providers_to_try:
            for attempt in range(2):  # Req 9 AC1: 1 retry after 500ms
                try:
                    text = await asyncio.wait_for(
                        self._call_provider(
                            provider=prov,
                            model=mod,
                            api_key=api_key,
                            base_url=base_url or PROVIDER_CATALOG[prov].base_url,
                            prompt=prompt,
                            system=system,
                            frame_b64=frame_b64,
                            temperature=temp,
                            max_tokens=tokens,
                            json_mode=json_mode,
                        ),
                        timeout=self.config.timeout_s,
                    )
                    if text and text.strip():
                        return text.strip()
                except Exception as exc:
                    last_err = exc
                    logger.warning(
                        "LLM %s/%s attempt %d failed: %s",
                        prov,
                        mod,
                        attempt + 1,
                        exc,
                    )
                    if attempt == 0:
                        await asyncio.sleep(RETRY_DELAY_S)

        if context_fallback is not None:
            # Req 9 AC1: when LLM call and its retry both fail/timeout, return brief context answer
            return context_fallback

        raise RuntimeError(f"All LLM attempts failed across configured providers: {last_err}")

    def generate_sync(
        self,
        prompt: str,
        *,
        system: str | None = None,
        fast: bool = False,
        frame_b64: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        json_mode: bool = False,
        context_fallback: str | None = None,
    ) -> str:
        """Synchronous wrapper around generate() for LangGraph sync nodes."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        coro = self.generate(
            prompt,
            system=system,
            fast=fast,
            frame_b64=frame_b64,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=json_mode,
            context_fallback=context_fallback,
        )

        if loop and loop.is_running():
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result(timeout=self.config.timeout_s * 2 + 2.0)

        return asyncio.run(coro)

    async def transcribe_audio(
        self,
        audio_b64: str,
        mime_type: str = "audio/webm",
        locale: str = "English",
    ) -> str:
        """Transcribe student microphone audio using Gemini 3.1/3.8 native multimodal audio understanding."""
        api_key = _resolve_api_key("gemini", self.config.api_key)
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is required for multimodal audio transcription")

        clean_b64 = audio_b64.split(",", 1)[-1].strip()
        clean_mime = (mime_type or "audio/webm").split(";")[0].strip()
        model = PROVIDER_CATALOG["gemini"].fast_model  # gemini-3.1-flash-lite-preview
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

        payload: dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "inlineData": {
                                "mimeType": clean_mime,
                                "data": clean_b64,
                            }
                        },
                        {
                            "text": (
                                f"You are a verbatim speech-to-text transcriber for a science laboratory student (language: {locale}). "
                                "Transcribe ONLY the exact human speech clearly audible in this WAV clip. "
                                "CRITICAL: Never invent, guess, or hallucinate words if the clip contains only background noise, static, breathing, tapping, or unintelligible audio—in that case output strictly: [SILENCE]"
                            )
                        },
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "maxOutputTokens": 180,
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, params={"key": api_key}, json=payload)
            if resp.status_code in (401, 403) and not api_key.startswith("AIza"):
                resp = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {api_key}"},
                    json=payload,
                )
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates") or []
            if not candidates:
                return ""
            parts = candidates[0].get("content", {}).get("parts", [])
            text = "".join(
                p.get("text", "") for p in parts if not p.get("thought", False)
            ).strip()
            if "[SILENCE]" in text.upper():
                return ""
            return text

    async def stream_sentences(
        self,
        prompt: str,
        *,
        system: str | None = None,
        context_fallback: str | None = None,
    ) -> AsyncIterator[tuple[str, bool]]:
        """Yield (sentence, is_final) pairs for sentence-boundary policy gating and showCaption RPC."""
        full_reply = await self.generate(
            prompt, system=system, context_fallback=context_fallback
        )
        sentences = split_into_sentences(full_reply)
        if not sentences:
            yield ("", True)
            return
        for idx, sentence in enumerate(sentences):
            is_last = idx == len(sentences) - 1
            yield (sentence, is_last)

    async def _call_provider(
        self,
        *,
        provider: LLMProviderName,
        model: str,
        api_key: str | None,
        base_url: str,
        prompt: str,
        system: str | None,
        frame_b64: str | None,
        temperature: float,
        max_tokens: int,
        json_mode: bool = False,
    ) -> str:
        if provider == "gemini":
            return await self._call_gemini(
                model=model,
                api_key=api_key or "",
                base_url=base_url,
                prompt=prompt,
                system=system,
                frame_b64=frame_b64,
                temperature=temperature,
                max_tokens=max_tokens,
                json_mode=json_mode,
            )
        if provider == "anthropic":
            return await self._call_anthropic(
                model=model,
                api_key=api_key or "",
                base_url=base_url,
                prompt=prompt,
                system=system,
                frame_b64=frame_b64,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        return await self._call_openai_compatible(
            provider=provider,
            model=model,
            api_key=api_key or "ollama",
            base_url=base_url,
            prompt=prompt,
            system=system,
            frame_b64=frame_b64,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=json_mode,
        )

    async def _call_gemini(
        self,
        *,
        model: str,
        api_key: str,
        base_url: str,
        prompt: str,
        system: str | None,
        frame_b64: str | None,
        temperature: float,
        max_tokens: int,
        json_mode: bool = False,
    ) -> str:
        url = f"{base_url.rstrip('/')}/models/{model}:generateContent"
        parts: list[dict[str, Any]] = []
        if frame_b64:
            clean_b64 = frame_b64.split(",", 1)[-1]
            parts.append(
                {
                    "inlineData": {
                        "mimeType": "image/jpeg",
                        "data": clean_b64,
                    }
                }
            )
        parts.append({"text": prompt})

        gen_cfg: dict[str, Any] = {
            "temperature": temperature,
            "maxOutputTokens": max(512, max_tokens),
            "thinkingConfig": {"thinkingBudget": 0},
        }
        if json_mode:
            gen_cfg["responseMimeType"] = "application/json"

        payload: dict[str, Any] = {
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": gen_cfg,
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}

        async with httpx.AsyncClient(timeout=self.config.timeout_s) as client:
            resp = await client.post(url, params={"key": api_key}, json=payload)
            if resp.status_code in (401, 403) and not api_key.startswith("AIza"):
                resp = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {api_key}"},
                    json=payload,
                )
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates") or []
            if not candidates:
                return ""
            content_parts = candidates[0].get("content", {}).get("parts", [])
            # Filter out internal thought blocks if returned by thinking models
            text_chunks = [
                p.get("text", "")
                for p in content_parts
                if not p.get("thought", False) and "text" in p
            ]
            if not text_chunks and content_parts:
                text_chunks = [p.get("text", "") for p in content_parts]
            return "".join(text_chunks)

    async def _call_anthropic(
        self,
        *,
        model: str,
        api_key: str,
        base_url: str,
        prompt: str,
        system: str | None,
        frame_b64: str | None,
        temperature: float,
        max_tokens: int,
    ) -> str:
        url = f"{base_url.rstrip('/')}/messages"
        content: list[dict[str, Any]] = []
        if frame_b64:
            clean_b64 = frame_b64.split(",", 1)[-1]
            content.append(
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": clean_b64,
                    },
                }
            )
        content.append({"type": "text", "text": prompt})

        payload: dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": content}],
        }
        if system:
            payload["system"] = system

        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        async with httpx.AsyncClient(timeout=self.config.timeout_s) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            blocks = data.get("content") or []
            return "".join(b.get("text", "") for b in blocks if b.get("type") == "text")

    async def _call_openai_compatible(
        self,
        *,
        provider: LLMProviderName,
        model: str,
        api_key: str,
        base_url: str,
        prompt: str,
        system: str | None,
        frame_b64: str | None,
        temperature: float,
        max_tokens: int,
        json_mode: bool = False,
    ) -> str:
        url = f"{base_url.rstrip('/')}/chat/completions"
        messages: list[dict[str, Any]] = []
        if system:
            messages.append({"role": "system", "content": system})

        if frame_b64:
            clean_b64 = frame_b64.split(",", 1)[-1]
            user_content: Any = [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{clean_b64}"},
                },
            ]
        else:
            user_content = prompt

        messages.append({"role": "user", "content": user_content})

        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode and provider in ("openai", "groq", "deepseek", "mistral"):
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        if provider == "openrouter":
            headers["HTTP-Referer"] = "https://vixir.edu.ng"
            headers["X-Title"] = "Vixir Virtual Science Lab"

        async with httpx.AsyncClient(timeout=self.config.timeout_s) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            choices = data.get("choices") or []
            if not choices:
                return ""
            return choices[0].get("message", {}).get("content", "") or ""


def split_into_sentences(text: str) -> list[str]:
    """Split a reply into clean sentences for streaming TTS and sentence-boundary policy checks."""
    cleaned = text.strip()
    if not cleaned:
        return []
    parts = re.split(r"(?<=[.!?])\s+", cleaned)
    return [p.strip() for p in parts if p.strip()]


def create_llm_brain(
    brain: str | None = None,
    *,
    provider: LLMProviderName | None = None,
    model: str | None = None,
    api_key: str | None = None,
    fallback_providers: list[LLMProviderName] | None = None,
    **kwargs: Any,
) -> LLMBrain:
    """Factory function to create a real LLMBrain for any supported provider."""
    prov, mod = parse_brain_spec(brain=brain, provider=provider, model=model)
    cfg = LLMConfig(
        provider=prov,
        model=mod,
        api_key=api_key,
        fallback_providers=fallback_providers or [],
        **kwargs,
    )
    return LLMBrain(config=cfg)
