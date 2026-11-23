"""Build the canonical Vix LangGraph (design.md §Graph) and Multi-Agent Coordinator Graph."""
from __future__ import annotations

from collections.abc import Callable

from langgraph.graph import END, StateGraph

from .nodes import (
    act_node,
    build_setup_node,
    classify_intent_node,
    content_retrieval_node,
    explain_region_node,
    log_turn_node,
    look_at_frame_node,
    navigate_tour_node,
    next_step_hint_node,
    plan_tour_node,
    policy_check_node,
    policy_guard_node,
    redirect_node,
    refresh_screen_node,
    refuse_kindly_node,
    resolve_target_node,
    retrieve_content_node,
    rewrite_node,
    router_node,
    safe_question_node,
    safety_answer_node,
    safety_check_node,
    screen_analysis_node,
    socratic_answer_node,
    speech_synthesis_node,
    worked_example_node,
)
from .state import MultiAgentState, VixState


def _route_by_intent(state: VixState) -> str:
    intent = state.get("intent", "what_next")
    mapping = {
        "explain_screen": "plan_tour",
        "tour_nav": "navigate_tour",
        "explain_region": "resolve_target",
        "what_next": "next_step_hint",
        "concept": "retrieve_content",
        "safety": "safety_answer",
        "build_setup": "build_setup",
        "worked_example": "worked_example",
        "off_topic": "redirect",
        "forbidden": "refuse_kindly",
    }
    return mapping.get(intent, "next_step_hint")


def _route_after_resolve(state: VixState) -> str:
    confidence = float(state.get("target_confidence") or 0.0)
    consent_screen = bool(state.get("consent_screen"))
    has_frame = bool(state.get("frame_b64"))
    if confidence < 0.7 and consent_screen and has_frame:
        return "look_at_frame"
    return "explain_region"


def _route_after_policy_guard(state: VixState) -> str:
    # If reply passed policy guard, proceed to act
    if state.get("reply"):
        return "act"
    attempts = int(state.get("rewrite_attempts") or 0)
    if attempts == 0:
        return "rewrite"
    return "safe_question"


def build_vix_graph():
    """Compile the canonical 18-node Vix StateGraph matching design.md §Graph."""
    workflow = StateGraph(VixState)

    workflow.add_node("refresh_screen", refresh_screen_node)
    workflow.add_node("classify_intent", classify_intent_node)
    workflow.add_node("plan_tour", plan_tour_node)
    workflow.add_node("navigate_tour", navigate_tour_node)
    workflow.add_node("resolve_target", resolve_target_node)
    workflow.add_node("look_at_frame", look_at_frame_node)
    workflow.add_node("explain_region", explain_region_node)
    workflow.add_node("next_step_hint", next_step_hint_node)
    workflow.add_node("retrieve_content", retrieve_content_node)
    workflow.add_node("socratic_answer", socratic_answer_node)
    workflow.add_node("safety_answer", safety_answer_node)
    workflow.add_node("build_setup", build_setup_node)
    workflow.add_node("worked_example", worked_example_node)
    workflow.add_node("redirect", redirect_node)
    workflow.add_node("refuse_kindly", refuse_kindly_node)
    workflow.add_node("policy_guard", policy_guard_node)
    workflow.add_node("rewrite", rewrite_node)
    workflow.add_node("safe_question", safe_question_node)
    workflow.add_node("act", act_node)
    workflow.add_node("log_turn", log_turn_node)

    workflow.add_edge("__start__", "refresh_screen")
    workflow.add_edge("refresh_screen", "classify_intent")

    workflow.add_conditional_edges(
        "classify_intent",
        _route_by_intent,
        {
            "plan_tour": "plan_tour",
            "navigate_tour": "navigate_tour",
            "resolve_target": "resolve_target",
            "next_step_hint": "next_step_hint",
            "retrieve_content": "retrieve_content",
            "safety_answer": "safety_answer",
            "build_setup": "build_setup",
            "worked_example": "worked_example",
            "redirect": "redirect",
            "refuse_kindly": "refuse_kindly",
        },
    )

    workflow.add_conditional_edges(
        "resolve_target",
        _route_after_resolve,
        {
            "look_at_frame": "look_at_frame",
            "explain_region": "explain_region",
        },
    )
    workflow.add_edge("look_at_frame", "explain_region")
    workflow.add_edge("retrieve_content", "socratic_answer")

    for producer in (
        "plan_tour",
        "navigate_tour",
        "explain_region",
        "next_step_hint",
        "socratic_answer",
        "safety_answer",
        "build_setup",
        "worked_example",
        "redirect",
        "refuse_kindly",
    ):
        workflow.add_edge(producer, "policy_guard")

    workflow.add_conditional_edges(
        "policy_guard",
        _route_after_policy_guard,
        {
            "act": "act",
            "rewrite": "rewrite",
            "safe_question": "safe_question",
        },
    )
    workflow.add_edge("rewrite", "policy_guard")
    workflow.add_edge("safe_question", "act")
    workflow.add_edge("act", "log_turn")
    workflow.add_edge("log_turn", END)

    return workflow.compile()


def build_multi_agent_graph():
    """Compile the multi-agent Coordinator graph."""
    workflow = StateGraph(MultiAgentState)

    workflow.add_node("router", router_node)
    workflow.add_node("screen_analysis", screen_analysis_node)
    workflow.add_node("content_retrieval", content_retrieval_node)
    workflow.add_node("safety_check", safety_check_node)
    workflow.add_node("policy_check", policy_check_node)
    workflow.add_node("speech_synthesis", speech_synthesis_node)

    workflow.add_edge("__start__", "router")
    workflow.add_edge("router", "screen_analysis")
    workflow.add_edge("screen_analysis", "content_retrieval")
    workflow.add_edge("content_retrieval", "safety_check")
    workflow.add_edge("safety_check", "policy_check")
    workflow.add_edge("policy_check", "speech_synthesis")
    workflow.add_edge("speech_synthesis", END)

    return workflow.compile()


def build_debug_graph():
    """Build a debug version of the multi-agent graph."""
    return build_multi_agent_graph()


def create_agent_pool() -> dict[str, Callable]:
    """Create a pool of specialized agent node functions."""
    return {
        "screen_agent": screen_analysis_node,
        "content_agent": content_retrieval_node,
        "safety_agent": safety_check_node,
        "policy_agent": policy_check_node,
        "voice_agent": speech_synthesis_node,
    }
