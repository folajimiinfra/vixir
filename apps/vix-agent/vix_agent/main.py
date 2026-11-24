"""Worker entrypoint for Vix (LiveKit Agents + LangGraph + Multi-Provider LLM Brain).

Run:
    uv run python -m vix_agent.main dev
"""
from __future__ import annotations

import logging
from typing import Any

from livekit.agents import Agent, JobContext, WorkerOptions, cli
from livekit.agents.voice import AgentSession as VoiceSession

from .contracts import LLMProviderName
from .graph.build import build_multi_agent_graph, build_vix_graph, create_agent_pool
from .graph.nodes import process_user_query as _graph_process_user_query
from .llm import LLMBrain, create_llm_brain, list_supported_brains
from .multi_agent import MultiAgentState, create_multi_agent_state
from .session import HEALTH_REGISTRY, VixSessionRunner, log_worker_startup

logger = logging.getLogger("vix")

AGENT_POOL = create_agent_pool()


async def entrypoint(ctx: JobContext) -> None:
    """Main LiveKit worker entrypoint for the Vix agent (`agent_name="vix"`)."""
    brain = create_llm_brain()
    log_worker_startup(brain)

    await ctx.connect()
    logger.info("vix joined room %s using brain %s", ctx.room.name, brain.identifier)

    session = VoiceSession()
    session_id = getattr(ctx.room, "name", "vix-session")
    runner = VixSessionRunner(
        session_id=session_id,
        brain=brain,
        speak_fn=lambda text: session.say(text),
    )

    await runner.start()
    await session.start(room=ctx.room, agent=Agent(instructions=get_instructions()))


def get_instructions() -> str:
    """Get the system instructions for the Vix voice agent."""
    return (
        "You are Vix, a warm, brief lab guide for secondary and university students in Nigeria. "
        "Explain the lab screen and guide the practical with Socratic questions. "
        "Never give readings or answers in graded mode. "
        "Always prioritize safety and keep turns to at most 3 sentences."
    )


def process_user_query(
    query: str,
    *,
    brain: str | None = None,
    provider: LLMProviderName | None = None,
    model: str | None = None,
    **kwargs: Any,
) -> dict[str, Any]:
    """Process a user query through the Vix LangGraph with any selected LLM brain.

    Args:
        query: The student's spoken or typed question.
        brain: Optional brain spec such as 'gemini/gemini-2.5-flash', 'anthropic/claude-3-5-sonnet-latest',
               'openai/gpt-4o', 'groq/llama-3.3-70b-versatile', 'deepseek/deepseek-chat', 'ollama/llama3.2'.
        provider: Optional provider name ('gemini', 'anthropic', 'openai', 'groq', 'deepseek', 'mistral', 'openrouter', 'ollama', 'stub').
        model: Optional model ID for the provider.
        **kwargs: Additional state parameters (screen_map, mode, session_id, experiment_id, locale).
    """
    active_brain = create_llm_brain(brain=brain, provider=provider, model=model)
    return _graph_process_user_query(
        query=query,
        screen_map=kwargs.get("screen_map"),
        mode=kwargs.get("mode", "PRACTICE"),
        session_id=kwargs.get("session_id", "session-default"),
        experiment_id=kwargs.get("experiment_id", "phy.pendulum.g"),
        locale=kwargs.get("locale", "en"),
        first_name=kwargs.get("first_name", "Student"),
        brain=active_brain.identifier,
    )


__all__ = [
    "AGENT_POOL",
    "HEALTH_REGISTRY",
    "LLMBrain",
    "MultiAgentState",
    "VixSessionRunner",
    "build_multi_agent_graph",
    "build_vix_graph",
    "create_llm_brain",
    "create_multi_agent_state",
    "entrypoint",
    "get_instructions",
    "list_supported_brains",
    "process_user_query",
]


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, agent_name="vix"))
