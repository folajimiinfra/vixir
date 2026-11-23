"""Chapter 5 & Chapter 8 Multi-Agent Architecture for Vix Agent.

Implements the multi-agent patterns from Michael Albada's *Building Applications with AI Agents*:
- `SupervisorAgent` (Ch. 8 Manager & Hierarchical Coordination + Ch. 5 Query Decomposition)
- `ScreenPerceptionSpecialist` (Spatial & Visual UI Specialist with ScreenMap/Vision tools)
- `PedagogyGraphRAGSpecialist` (Curriculum & Hybrid GraphRAG + BM25 Socratic Specialist)
- `DiagnosticsAndSafetySpecialist` (Sim Telemetry, Error Diagnosis & Lab Safety Specialist)
- `AutoGenLabTeam` (AutoGen-style Conversational GroupChat & Agent-to-Agent Protocol)
- `PedagogicalCriticAgent` (Ch. 8 Actor-Critic Quality Gate + Ch. 7 Reflexion Self-Critique Loop)
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Any, Literal

from .contracts import ExperimentContext, Intent, Mode, RpcCall, ScreenMap
from .llm import split_into_sentences
from .memory import GLOBAL_LAB_KG
from .policy import violates
from .rpc import RpcDispatcher, validate_rpc_call
from .screen import resolve_screen_reference

logger = logging.getLogger("vix.agents")

SpecialistName = Literal[
    "screen_perception",
    "pedagogy_graphrag",
    "diagnostics_safety",
    "bench_architect",
]


@dataclass
class AgentTraceMessage:
    """Structured Agent-to-Agent (A2A) protocol message exchanged in AutoGenLabTeam."""

    sender: str
    recipient: str
    phase: Literal["decompose", "tool_call", "specialist_report", "critic_eval", "reflexion", "synthesis"]
    content: str
    tool_calls: list[str] = field(default_factory=list)
    proposed_rpcs: list[RpcCall] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "sender": self.sender,
            "recipient": self.recipient,
            "phase": self.phase,
            "content": self.content,
            "toolCalls": self.tool_calls,
            "proposedRpcs": [r.model_dump() for r in self.proposed_rpcs],
        }


@dataclass
class CriticEvaluation:
    """Ch. 8 Actor-Critic rubric score (1–10) and actionable feedback."""

    score: int
    approved: bool
    policy_clean: bool
    has_socratic_question: bool
    concise_for_voice: bool
    screen_grounded: bool
    feedback: str


class ScreenPerceptionSpecialist:
    """Specialist Agent 1: Owns ScreenMap geometry, spotlight/pointAt RPCs, and Vision disambiguation."""

    name = "ScreenPerceptionSpecialist"
    tools = ("resolve_screen_reference", "spotlight", "pointAt", "startTour", "tourStep", "openPanel")

    def analyze(
        self,
        user_text: str,
        screen: ScreenMap | None,
    ) -> AgentTraceMessage:
        tool_calls: list[str] = []
        proposed_rpcs: list[RpcCall] = []

        if screen is None:
            return AgentTraceMessage(
                sender=self.name,
                recipient="SupervisorAgent",
                phase="specialist_report",
                content="ScreenMap is currently absent; advise student verbally without dispatching spotlight RPCs.",
                tool_calls=["check_screenmap_presence() -> None"],
                proposed_rpcs=[],
            )

        target_ids, confidence = resolve_screen_reference(user_text, screen)
        tool_calls.append(f"resolve_screen_reference('{user_text[:40]}') -> ids={target_ids}, conf={confidence:.2f}")

        chosen_id = target_ids[0] if target_ids else (screen.visible_regions()[0].id if screen.visible_regions() else "")
        matched_reg = next(
            (r for r in screen.regions if r.id == chosen_id or chosen_id.startswith(r.id + ".")),
            None,
        )

        if chosen_id and screen.has_id(chosen_id):
            if "." in chosen_id and not any(r.id == chosen_id for r in screen.regions):
                label = matched_reg.label if matched_reg else chosen_id
                proposed_rpcs.append(RpcDispatcher.point_at(chosen_id, label))
                tool_calls.append(f"pointAt(elementId='{chosen_id}', label='{label}')")
            else:
                proposed_rpcs.append(RpcDispatcher.spotlight(chosen_id))
                tool_calls.append(f"spotlight(regionId='{chosen_id}')")

        desc = (
            f"Target region '{matched_reg.id}' ({matched_reg.label}, kind={matched_reg.kind}, bbox={list(matched_reg.bbox)}): {matched_reg.summary or 'active on bench'}"
            if matched_reg
            else f"Visible regions: {[r.id for r in screen.visible_regions()]}"
        )
        if screen.pointerTarget:
            pt = screen.pointerTarget
            desc += (
                f" | Student cursor/pointer at ({pt.x}, {pt.y}) is pointing directly at: "
                f"label='{pt.label}', tag=<{pt.tag}>, value='{pt.value or ''}', "
                f"svgPart='{pt.svgPart or ''}', textSnippet='{pt.textSnippet or ''}'."
            )
            tool_calls.append(
                f"inspect_pointer_target(x={pt.x}, y={pt.y}) -> '{pt.label or pt.textSnippet or pt.tag}'"
            )
        return AgentTraceMessage(
            sender=self.name,
            recipient="SupervisorAgent",
            phase="specialist_report",
            content=desc,
            tool_calls=tool_calls,
            proposed_rpcs=proposed_rpcs,
        )


class PedagogyGraphRAGSpecialist:
    """Specialist Agent 2: Owns Multi-Hop LabKnowledgeGraph (GraphRAG) + BM25 Curriculum Retrieval."""

    name = "PedagogyGraphRAGSpecialist"
    tools = ("query_knowledge_graph_multihop", "retrieve_bm25_passages", "build_socratic_scaffold")

    def analyze(
        self,
        user_text: str,
        experiment: ExperimentContext,
        bm25_passages: list[str],
        screen: ScreenMap | None,
    ) -> tuple[AgentTraceMessage, list[str]]:
        warnings = (screen.sim.get("warnings") or []) if (screen and screen.sim) else []
        kg_facts = GLOBAL_LAB_KG.query_multihop(user_text, extra_terms=[experiment.title, *warnings], max_hops=2)

        tool_calls = [
            f"query_knowledge_graph_multihop('{user_text[:36]}', hops=2) -> {len(kg_facts)} graph facts",
            f"retrieve_bm25_passages('{experiment.id}') -> {len(bm25_passages)} curriculum passages",
        ]

        summary_lines: list[str] = []
        if kg_facts:
            summary_lines.append("GraphRAG Multi-Hop Facts:\n" + "\n".join(f"  {f}" for f in kg_facts[:4]))
        if bm25_passages:
            summary_lines.append("BM25 Curriculum Passages:\n" + "\n".join(f"  - {p}" for p in bm25_passages[:2]))

        report_text = "\n".join(summary_lines) if summary_lines else f"Experiment theory: {experiment.theory or experiment.briefing or experiment.title}"
        msg = AgentTraceMessage(
            sender=self.name,
            recipient="SupervisorAgent",
            phase="specialist_report",
            content=report_text,
            tool_calls=tool_calls,
        )
        return (msg, kg_facts)


class DiagnosticsAndSafetySpecialist:
    """Specialist Agent 3: Owns Simulation Telemetry (`sim`), Error Diagnosis, and WAEC/NECO Precautions."""

    name = "DiagnosticsAndSafetySpecialist"
    tools = ("inspect_sim_telemetry", "diagnose_active_warnings", "verify_experiment_precautions")

    def analyze(
        self,
        screen: ScreenMap | None,
        experiment: ExperimentContext,
    ) -> AgentTraceMessage:
        tool_calls: list[str] = ["inspect_sim_telemetry()"]
        proposed_rpcs: list[RpcCall] = []

        warnings: list[str] = []
        readings_count = 0
        readings_target = 6
        step_name = "READINGS"

        if screen:
            if screen.experiment:
                step_name = screen.experiment.step
            if screen.sim:
                warnings = list(screen.sim.get("warnings") or [])
                readings_count = int(screen.sim.get("readingsCount") or 0)
                readings_target = int(screen.sim.get("readingsTarget") or 6)

        if warnings:
            tool_calls.append(f"diagnose_active_warnings({warnings})")
        if readings_count >= readings_target and screen and screen.has_id("data-panel"):
            proposed_rpcs.append(RpcDispatcher.open_panel("readings"))
            tool_calls.append("openPanel('readings')")

        precautions_str = "; ".join(experiment.precautions[:3]) if experiment.precautions else "Read scales at eye level to avoid parallax."
        diag_report = (
            f"Step={step_name} | Readings={readings_count}/{readings_target} | "
            f"Active Warnings={warnings if warnings else 'None'} | "
            f"Key Precautions={precautions_str}"
        )
        return AgentTraceMessage(
            sender=self.name,
            recipient="SupervisorAgent",
            phase="specialist_report",
            content=diag_report,
            tool_calls=tool_calls,
            proposed_rpcs=proposed_rpcs,
        )


class BenchArchitectSpecialist:
    """Specialist Agent 4: Draws and wires circuit topologies and apparatus setups on the bench when asked by the student."""

    name = "BenchArchitectSpecialist"
    tools = ("synthesize_circuit_topology", "place_and_wire_nodes", "buildSetup")

    def build_blueprint(self, user_text: str, screen: ScreenMap | None) -> AgentTraceMessage:
        q = user_text.lower()

        # Standard base loop nodes around center (320, 200)
        nodes: list[dict[str, Any]] = [
            {"id": "bat1", "kind": "battery", "label": "E", "x": 110, "y": 210, "rotation": 90, "value": 3.0, "unit": "V"},
            {"id": "rh1", "kind": "rheostat", "label": "Rh", "x": 230, "y": 80, "rotation": 0, "value": 8.0, "unit": "Ω"},
            {"id": "amm1", "kind": "ammeter", "label": "A", "x": 380, "y": 80, "rotation": 0, "value": 0.05, "unit": "Ω"},
            {"id": "wire1", "kind": "wireX", "label": "X", "x": 460, "y": 210, "rotation": 90, "value": 4.7, "unit": "Ω"},
            {"id": "volt1", "kind": "voltmeter", "label": "V", "x": 555, "y": 210, "rotation": 90, "value": 10000, "unit": "Ω"},
            {"id": "key1", "kind": "key", "label": "K", "x": 280, "y": 330, "rotation": 0, "value": 1, "unit": ""},
        ]
        wires: list[dict[str, Any]] = [
            {"id": "w1", "fromNode": "bat1", "fromTerm": "a", "toNode": "rh1", "toTerm": "a"},
            {"id": "w2", "fromNode": "rh1", "fromTerm": "b", "toNode": "amm1", "toTerm": "a"},
            {"id": "w3", "fromNode": "amm1", "fromTerm": "b", "toNode": "wire1", "toTerm": "a"},
            {"id": "w4", "fromNode": "wire1", "fromTerm": "b", "toNode": "key1", "toTerm": "b"},
            {"id": "w5", "fromNode": "key1", "fromTerm": "a", "toNode": "bat1", "toTerm": "b"},
            {"id": "w6", "fromNode": "wire1", "fromTerm": "a", "toNode": "volt1", "toTerm": "a", "parallel": True},
            {"id": "w7", "fromNode": "wire1", "fromTerm": "b", "toNode": "volt1", "toTerm": "b", "parallel": True},
        ]
        summary = "Standard Ohm's law circuit with series ammeter and parallel voltmeter"

        if "parallel" in q or "two resistor" in q or "branch" in q:
            nodes.append({"id": "res-par", "kind": "resistor", "label": "R2", "x": 350, "y": 210, "rotation": 90, "value": 5.0, "unit": "Ω"})
            wires.append({"id": "w-par1", "fromNode": "wire1", "fromTerm": "a", "toNode": "res-par", "toTerm": "a", "parallel": True})
            wires.append({"id": "w-par2", "fromNode": "wire1", "fromTerm": "b", "toNode": "res-par", "toTerm": "b", "parallel": True})
            summary = "Parallel resistor branch (R2 || Wire X) with series ammeter and parallel voltmeter"

        if "led" in q:
            nodes.append({"id": "led1", "kind": "led", "label": "LED1", "x": 280, "y": 210, "rotation": 0, "value": 1.8, "unit": "V"})
            wires.append({"id": "w-led1", "fromNode": "rh1", "fromTerm": "b", "toNode": "led1", "toTerm": "a"})
            wires.append({"id": "w-led2", "fromNode": "led1", "fromTerm": "b", "toNode": "key1", "toTerm": "b"})
            summary = "Indicator LED branch wired with current-limiting rheostat"

        if "diode" in q or "rectifier" in q:
            nodes.append({"id": "diode1", "kind": "diode", "label": "D1", "x": 310, "y": 145, "rotation": 0, "value": 0.65, "unit": "V"})
            wires.append({"id": "w-d1", "fromNode": "rh1", "fromTerm": "b", "toNode": "diode1", "toTerm": "a"})
            wires.append({"id": "w-d2", "fromNode": "diode1", "fromTerm": "b", "toNode": "amm1", "toTerm": "a"})
            summary = "Forward-biased silicon diode (D1) series characteristic circuit"

        if "capacitor" in q or re.search(r"\brc\b", q):
            nodes.append({"id": "cap1", "kind": "capacitor", "label": "C1", "x": 360, "y": 210, "rotation": 0, "value": 100, "unit": "µF"})
            wires.append({"id": "w-c1", "fromNode": "wire1", "fromTerm": "a", "toNode": "cap1", "toTerm": "a", "parallel": True})
            wires.append({"id": "w-c2", "fromNode": "wire1", "fromTerm": "b", "toNode": "cap1", "toTerm": "b", "parallel": True})
            summary = "RC parallel smoothing capacitor (100 µF) across load"

        if "ammeter" in q and ("second" in q or "two" in q or "another" in q):
            nodes.append({"id": "amm2", "kind": "ammeter", "label": "A2", "x": 180, "y": 330, "rotation": 0, "value": 0.05, "unit": "Ω"})
            wires = [w for w in wires if w["id"] != "w5"]
            wires.append({"id": "w5a", "fromNode": "key1", "fromTerm": "a", "toNode": "amm2", "toTerm": "b"})
            wires.append({"id": "w5b", "fromNode": "amm2", "fromTerm": "a", "toNode": "bat1", "toTerm": "b"})
            summary = "Dual series ammeters (A and A2) verifying current conservation around the loop"

        build_rpc = RpcCall(
            method="buildSetup",
            payload={
                "action": "build_circuit",
                "summary": summary,
                "nodes": nodes,
                "wires": wires,
            },
        )
        if screen and screen.has_id("bench"):
            proposed = [build_rpc, RpcDispatcher.spotlight("bench")]
        else:
            proposed = [build_rpc]

        return AgentTraceMessage(
            sender=self.name,
            recipient="SupervisorAgent",
            phase="tool_call",
            content=f"Synthesized schematic topology: {summary} ({len(nodes)} nodes, {len(wires)} wires).",
            tool_calls=[
                f"synthesize_circuit_topology('{user_text[:40]}')",
                f"buildSetup(nodes={len(nodes)}, wires={len(wires)})",
            ],
            proposed_rpcs=proposed,
        )


class PedagogicalCriticAgent:
    """Ch. 8 Actor-Critic Quality Gate (pp. 182–183): Evaluates candidate outputs on a 4-part rubric."""

    name = "PedagogicalCriticAgent"

    def evaluate(
        self,
        candidate: str,
        *,
        mode: Mode,
        intent: Intent,
        experiment: ExperimentContext,
        screen: ScreenMap | None,
        rpc_plan: list[RpcCall],
    ) -> CriticEvaluation:
        issues: list[str] = []
        score = 10

        # 1. Academic Integrity / Policy Rule Check (Hard constraint)
        violation = violates(
            candidate,
            mode,
            extra_units=experiment.units,
            extra_symbols=experiment.variables,
        )
        policy_clean = violation is None
        if not policy_clean:
            score -= 6
            issues.append(f"Policy violation ({violation}): remove all numeric measurements/answers or action claims.")

        # 2. Socratic Question Check (for pedagogical intents)
        has_question = "?" in candidate
        if intent in ("concept", "what_next", "explain_region", "safety", "forbidden") and not has_question:
            score -= 2
            issues.append("Missing Socratic guiding question at the end of the turn.")

        # 3. Voice Conciseness Check (<= 3 sentences per Req 4 AC7 & system.txt)
        sentences = split_into_sentences(candidate)
        concise = 1 <= len(sentences) <= 4
        if len(sentences) > 4:
            score -= 2
            issues.append(f"Response has {len(sentences)} sentences; trim to at most 3 concise sentences for voice TTS.")

        # 4. Screen Grounding Check (all RPC regionIds exist in ScreenMap)
        screen_grounded = all(validate_rpc_call(c, screen)[0] for c in rpc_plan)
        if not screen_grounded:
            score -= 2
            issues.append("One or more RPC target IDs do not exist in the current ScreenMap.")

        approved = policy_clean and score >= 8
        feedback = "Approved by PedagogicalCriticAgent." if approved else " ".join(issues)
        return CriticEvaluation(
            score=max(1, score),
            approved=approved,
            policy_clean=policy_clean,
            has_socratic_question=has_question,
            concise_for_voice=concise,
            screen_grounded=screen_grounded,
            feedback=feedback,
        )


class AutoGenLabTeam:
    """Combines LangGraph Supervisor routing with AutoGen-style multi-specialist consultation & Actor-Critic Reflexion."""

    def __init__(self) -> None:
        self.screen_specialist = ScreenPerceptionSpecialist()
        self.pedagogy_specialist = PedagogyGraphRAGSpecialist()
        self.diagnostics_specialist = DiagnosticsAndSafetySpecialist()
        self.architect_specialist = BenchArchitectSpecialist()
        self.critic = PedagogicalCriticAgent()

    def select_specialists_for_intent(self, intent: Intent, user_text: str) -> list[SpecialistName]:
        """Supervisor task decomposition (Ch. 8 Principles: Task Decomposition, Specialization & Parsimony)."""
        q = user_text.lower()
        is_compound = (" and " in q or " also " in q or " why " in q) and len(q.split()) >= 8

        if intent == "build_setup":
            return ["bench_architect", "pedagogy_graphrag"]
        if intent == "explain_region":
            return ["screen_perception", "pedagogy_graphrag"] if is_compound else ["screen_perception"]
        if intent == "what_next":
            return ["diagnostics_safety", "screen_perception", "pedagogy_graphrag"]
        if intent == "concept":
            return ["pedagogy_graphrag", "diagnostics_safety"] if is_compound else ["pedagogy_graphrag"]
        if intent == "safety":
            return ["diagnostics_safety", "pedagogy_graphrag"]
        if intent == "explain_screen":
            return ["screen_perception"]
        return ["pedagogy_graphrag"]

    def run_consultation(
        self,
        *,
        intent: Intent,
        user_text: str,
        screen: ScreenMap | None,
        experiment: ExperimentContext,
        bm25_passages: list[str],
    ) -> tuple[list[AgentTraceMessage], list[str], list[RpcCall]]:
        """Execute an AutoGen-style consultation across selected specialists and collect their A2A messages."""
        selected = self.select_specialists_for_intent(intent, user_text)
        trace: list[AgentTraceMessage] = [
            AgentTraceMessage(
                sender="SupervisorAgent",
                recipient=", ".join(selected),
                phase="decompose",
                content=f"Decomposed query (intent={intent}) to specialists: {', '.join(selected)}",
            )
        ]

        kg_facts: list[str] = []
        merged_rpcs: list[RpcCall] = []

        if "bench_architect" in selected:
            b_msg = self.architect_specialist.build_blueprint(user_text, screen)
            trace.append(b_msg)
            merged_rpcs.extend(b_msg.proposed_rpcs)

        if "screen_perception" in selected:
            s_msg = self.screen_specialist.analyze(user_text, screen)
            trace.append(s_msg)
            merged_rpcs.extend(s_msg.proposed_rpcs)

        if "pedagogy_graphrag" in selected:
            p_msg, facts = self.pedagogy_specialist.analyze(user_text, experiment, bm25_passages, screen)
            trace.append(p_msg)
            kg_facts.extend(facts)

        if "diagnostics_safety" in selected:
            d_msg = self.diagnostics_specialist.analyze(screen, experiment)
            trace.append(d_msg)
            for rpc in d_msg.proposed_rpcs:
                if not any(existing.method == rpc.method for existing in merged_rpcs):
                    merged_rpcs.append(rpc)

        return (trace, kg_facts, merged_rpcs)
