"""Chapter 6 & 7 Knowledge and Memory Architecture for Vix Agent.

Implements patterns from Michael Albada's *Building Applications with AI Agents*:
1. `LabKnowledgeGraph` (Ch. 6 GraphRAG, pp. 128–132): Multi-hop entity-relationship traversal across
   Physics, Chemistry, Biology, Electronics, and Engineering laboratories.
2. `SelfNoteTaker` (Ch. 6 Note-Taking, Fig. 6-5, p. 133): Generates interleaved margin self-notes on
   the live ScreenMap, simulation telemetry, and question before producing the final answer.
3. `WorkingMemory` (Ch. 6 Short-Term & Episodic Memory): Tracks multi-turn dialogue history,
   inspected regions, and diagnosed student misconceptions per session.
4. `ReflexionAndExpeLMemory` (Ch. 7 Nonparametric Learning — Reflexion pp. 137–140 & ExpeL pp. 141–143):
   Stores self-critique plans (`Plan: ...`) from failed/blocked drafts and distills high-level rules
   via `AGREE`, `EDIT`, `ADD`, and `REMOVE` operations.
"""
from __future__ import annotations

import re
import time
from collections import deque
from dataclasses import dataclass, field

from .contracts import ExperimentContext, Mode, ScreenMap
from .llm import LLMBrain

# =============================================================================
# 1. Multi-Hop Laboratory Knowledge Graph (Ch. 6 GraphRAG)
# =============================================================================


@dataclass(frozen=True)
class KGNode:
    id: str
    kind: str  # "Concept" | "Formula" | "Apparatus" | "Warning" | "Precaution" | "Lab"
    name: str
    discipline: str
    properties: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class KGEdge:
    source: str
    relation: str  # "GOVERNED_BY" | "MEASURED_BY" | "CAUSED_BY" | "MITIGATED_BY" | "AFFECTS" | "PART_OF"
    target: str
    detail: str = ""


class LabKnowledgeGraph:
    """In-memory multi-hop Knowledge Graph spanning all 5 Vixir science & engineering laboratories."""

    def __init__(self) -> None:
        self.nodes: dict[str, KGNode] = {}
        self.edges: list[KGEdge] = []
        self._adj: dict[str, list[KGEdge]] = {}
        self._build_canonical_science_graph()

    def add_node(
        self,
        node_id: str,
        kind: str,
        name: str,
        discipline: str,
        **props: str,
    ) -> None:
        self.nodes[node_id] = KGNode(
            id=node_id,
            kind=kind,
            name=name,
            discipline=discipline,
            properties=props,
        )
        self._adj.setdefault(node_id, [])

    def add_edge(self, source: str, relation: str, target: str, detail: str = "") -> None:
        edge = KGEdge(source=source, relation=relation, target=target, detail=detail)
        self.edges.append(edge)
        self._adj.setdefault(source, []).append(edge)
        # Also index reverse edge for undirected multi-hop neighborhood traversal
        rev = KGEdge(source=target, relation=f"INV_{relation}", target=source, detail=detail)
        self._adj.setdefault(target, []).append(rev)

    def _build_canonical_science_graph(self) -> None:
        # --- PHYSICS LAB ---
        self.add_node(
            "shm",
            "Concept",
            "Simple Harmonic Motion (SHM)",
            "Physics",
            definition="Periodic oscillation where restoring acceleration is proportional to displacement and directed toward equilibrium.",
        )
        self.add_node(
            "pendulum_formula",
            "Formula",
            "T = 2π√(L/g) and T² = (4π²/g)·L",
            "Physics",
            slope_meaning="Slope of T² against L equals 4π²/g, so g = 4π² / slope.",
        )
        self.add_node(
            "small_angle_approx",
            "Concept",
            "Small-Angle Approximation (sin θ ≈ θ)",
            "Physics",
            limit="Valid when angular displacement θ is kept under 10 degrees.",
        )
        self.add_node(
            "warning_angle_over_10",
            "Warning",
            "ANGLE_OVER_10 (Amplitude > 10°)",
            "Physics",
            symptom="Pendulum swung through a wide angle where sin θ ≠ θ, making period T longer than ideal SHM.",
        )
        self.add_node(
            "warning_parallax",
            "Warning",
            "PARALLAX (Line-of-sight scale error)",
            "All",
            symptom="Observer eye is not perpendicular to the metre rule or burette meniscus graduation.",
        )
        self.add_node(
            "precaution_20_swings",
            "Precaution",
            "Timing 20 Complete Oscillations",
            "Physics",
            rationale="Divides human start/stop reaction time uncertainty (~0.2 s) by 20 across a single period T = t/20.",
        )
        self.add_node(
            "fiducial_mark",
            "Apparatus",
            "Vertical Fiducial Reference Mark",
            "Physics",
            usage="Placed at the equilibrium centre of swing where bob velocity is maximum, minimizing timing uncertainty.",
        )
        self.add_node(
            "snells_law",
            "Formula",
            "Snell's Law n = sin i / sin r",
            "Physics",
            detail="Ratio of sine of angle of incidence to sine of angle of refraction is constant for a given medium.",
        )
        self.add_node(
            "moments_principle",
            "Formula",
            "Principle of Moments: Σ(F × d)_clockwise = Σ(F × d)_anticlockwise",
            "Physics",
            detail="For a beam in rotational equilibrium on a knife-edge fulcrum, clockwise moments equal anticlockwise moments.",
        )

        self.add_edge("shm", "GOVERNED_BY", "pendulum_formula", "Squaring T gives linear T² vs L graph")
        self.add_edge("pendulum_formula", "DEPENDS_ON", "small_angle_approx", "Requires sin θ ≈ θ in radians")
        self.add_edge("warning_angle_over_10", "VIOLATES", "small_angle_approx", "Large swing introduces non-linear anharmonic error")
        self.add_edge("precaution_20_swings", "REDUCES_ERROR_IN", "pendulum_formula", "Lowers random reaction-time error in T")
        self.add_edge("fiducial_mark", "SUPPORTS", "precaution_20_swings", "Fastest crossing point at equilibrium centre")

        # --- CHEMISTRY LAB ---
        self.add_node(
            "titration_stoichiometry",
            "Formula",
            "C_A · V_A / (C_B · V_B) = n_A / n_B",
            "Chemistry",
            detail="Relates molar concentrations and volumes of acid and base at the stoichiometric equivalence point.",
        )
        self.add_node(
            "concordant_titres",
            "Concept",
            "Concordant Titres (within ±0.10 cm³)",
            "Chemistry",
            detail="Two or more accurate burette titres agreeing within 0.10 cm³ (recorded to 2 decimal places), excluding the rough titre.",
        )
        self.add_node(
            "meniscus_reading",
            "Precaution",
            "Bottom of Concave Meniscus at Eye Level",
            "Chemistry",
            detail="Read colourless or dilute aqueous solutions at the bottom of the concave meniscus perpendicular to the burette scale.",
        )
        self.add_node(
            "warning_overshoot",
            "Warning",
            "OVERSHOOT (Passed Titration End-Point)",
            "Chemistry",
            symptom="Acid added too rapidly near equivalence point without drop-by-drop swirling on the white tile.",
        )
        self.add_edge("concordant_titres", "INPUT_TO", "titration_stoichiometry", "Average V_A computed only from concordant runs")
        self.add_edge("meniscus_reading", "MITIGATES", "warning_parallax", "Eye-level reading prevents parallax shift in V_A")
        self.add_edge("warning_overshoot", "AFFECTS", "concordant_titres", "Causes artificially high titre volume V_A")

        # --- BIOLOGY LAB ---
        self.add_node(
            "nephron_ultrafiltration",
            "Concept",
            "Glomerular Ultrafiltration & ADH Osmoregulation",
            "Biology",
            detail="Afferent arteriole wider than efferent arteriole creates high hydrostatic pressure; PCT reabsorbs 100% glucose; Loop of Henle + ADH regulate water.",
        )
        self.add_node(
            "alveolar_diffusion",
            "Concept",
            "Fick's Law Alveolar Gas Exchange (O₂ / CO₂)",
            "Biology",
            detail="Large surface area, one-cell-thick squamous epithelium, moist surfactant lining, and dense capillary network maintain steep partial-pressure gradient.",
        )
        self.add_node(
            "mammalian_dissection",
            "Concept",
            "Mammalian (Rabbit / Rat) Ventral Visceral Morphology",
            "Biology",
            detail="Thoracic cavity (trachea, heart, lungs) separated by muscular diaphragm from abdominal viscera (4-lobed liver, gall bladder, stomach, duodenum, pancreas, spleen, sacculated caecum/colon, mesentery, kidneys, ureters, bladder).",
        )
        self.add_node(
            "enzyme_kinetics",
            "Concept",
            "Enzymatic Digestion Optimum Temperature (37°C) & pH",
            "Biology",
            detail="Salivary amylase (pH ~6.8–7.0), gastric pepsin (pH ~1.5–2.0 with HCl), pancreatic lipase (pH ~8.0 with bile emulsification); denatures above 45–50°C.",
        )

        # --- ELECTRONICS LAB ---
        self.add_node(
            "ohms_law",
            "Formula",
            "Ohm's Law V = I · R and Resistivity ρ = R · A / L",
            "Electronics",
            detail="Current I through a metallic conductor is directly proportional to potential difference V provided temperature remains constant.",
        )
        self.add_node(
            "meter_wiring",
            "Precaution",
            "Ammeter in Series (Low R) · Voltmeter in Parallel (High R)",
            "Electronics",
            detail="Ammeter has very low resistance to avoid dropping current; Voltmeter has very high resistance to draw negligible current.",
        )
        self.add_node(
            "joule_heating",
            "Warning",
            "Joule Heating Temperature Drift in Test Wire X",
            "Electronics",
            symptom="Leaving plug key K closed continuously heats nichrome/constantan wire, increasing resistance R = R₀(1 + αΔT) and curving V–I plot.",
        )
        self.add_edge("joule_heating", "VIOLATES", "ohms_law", "Constant-temperature condition broken if key K is left closed")
        self.add_edge("meter_wiring", "SUPPORTS", "ohms_law", "Prevents loading error on V and I measurements")

        # --- ENGINEERING LAB ---
        self.add_node(
            "euler_bernoulli_beam",
            "Formula",
            "Cantilever Tip Deflection δ = (F · L³) / (3 · E · I) with I = (b · d³) / 12",
            "Engineering",
            detail="Tip deflection scales linearly with load F and cubically with span L; Young's modulus E = (F · L³) / (3 · I · δ).",
        )
        self.add_node(
            "dial_gauge_zeroing",
            "Precaution",
            "Zero Dial Indicator & Tap Bench for Plunger Stiction",
            "Engineering",
            detail="Zero bezel under dead-weight preload and record both loading and unloading curves to confirm elastic recovery.",
        )
        self.add_edge("dial_gauge_zeroing", "SUPPORTS", "euler_bernoulli_beam", "Eliminates zero offset and hysteresis in δ")

    def query_multihop(self, query: str, extra_terms: list[str] | None = None, max_hops: int = 2) -> list[str]:
        """Traverse up to `max_hops` from matched seed nodes and return structured GraphRAG facts."""
        combined = f"{query} {' '.join(extra_terms or [])}".lower()
        tokens = {tok for tok in re.split(r"\W+", combined) if len(tok) > 2}

        seed_Scores: list[tuple[str, int]] = []
        for nid, node in self.nodes.items():
            haystack = f"{node.id} {node.name} {node.discipline} {' '.join(node.properties.values())}".lower()
            hits = sum(2 if tok in node.name.lower() else 1 for tok in tokens if tok in haystack)
            if hits > 0:
                seed_Scores.append((nid, hits))

        seed_Scores.sort(key=lambda item: item[1], reverse=True)
        seeds = [nid for nid, _ in seed_Scores[:3]]
        if not seeds:
            return []

        visited_nodes: set[str] = set()
        facts: list[str] = []
        frontier = list(seeds)

        for _hop in range(max_hops):
            next_frontier: list[str] = []
            for nid in frontier:
                if nid in visited_nodes:
                    continue
                visited_nodes.add(nid)
                node = self.nodes.get(nid)
                if not node:
                    continue
                props_str = "; ".join(f"{k}: {v}" for k, v in node.properties.items())
                facts.append(f"[{node.kind}] {node.name} ({node.discipline}) — {props_str}")

                for edge in self._adj.get(nid, []):
                    target_node = self.nodes.get(edge.target)
                    if not target_node:
                        continue
                    if not edge.relation.startswith("INV_"):
                        facts.append(
                            f"  ↳ ({node.name}) -[{edge.relation}]-> ({target_node.name}): {edge.detail}"
                        )
                    if edge.target not in visited_nodes:
                        next_frontier.append(edge.target)
            frontier = next_frontier

        return facts[:8]


# =============================================================================
# 2. Note-Taking & Working Memory (Ch. 6 Fig. 6-5 Self-Notes + Short-Term Memory)
# =============================================================================


@dataclass
class TurnMemoryEntry:
    turn_index: int
    user_text: str
    intent: str
    vix_reply: str
    target_ids: list[str]
    self_note: str
    timestamp: float = field(default_factory=time.time)


class WorkingMemory:
    """Per-session Working Memory tracking multi-turn dialogue, inspected regions, and self-notes."""

    def __init__(self, max_turns: int = 12) -> None:
        self.turns: deque[TurnMemoryEntry] = deque(maxlen=max_turns)
        self.inspected_regions: list[str] = []
        self.active_warnings_addressed: set[str] = set()

    def record_turn(
        self,
        *,
        user_text: str,
        intent: str,
        vix_reply: str,
        target_ids: list[str],
        self_note: str,
    ) -> None:
        idx = (self.turns[-1].turn_index + 1) if self.turns else 1
        self.turns.append(
            TurnMemoryEntry(
                turn_index=idx,
                user_text=user_text,
                intent=intent,
                vix_reply=vix_reply,
                target_ids=list(target_ids),
                self_note=self_note,
            )
        )
        for tid in target_ids:
            if tid not in self.inspected_regions:
                self.inspected_regions.append(tid)

    def format_recent_history(self, last_n: int = 4) -> str:
        if not self.turns:
            return "No prior turns in this session."
        recent = list(self.turns)[-last_n:]
        lines: list[str] = []
        for t in recent:
            lines.append(
                f"Turn {t.turn_index} | Student: \"{t.user_text}\" | Intent: {t.intent} | "
                f"Spotlight: {t.target_ids} | Vix: \"{t.vix_reply}\""
            )
        return "\n".join(lines)


class SelfNoteTaker:
    """Ch. 6 Note-Taking workflow (Fig. 6-5): generates margin self-notes on context & question before answering."""

    @staticmethod
    def build_deterministic_context_notes(
        user_text: str,
        screen: ScreenMap | None,
        experiment: ExperimentContext,
        mode: Mode,
        kg_facts: list[str],
    ) -> str:
        notes: list[str] = []
        notes.append(f"[Mode Note] Session is in {mode} mode ({'NEVER reveal numbers, readings, slopes, or validate values' if mode == 'GRADED' else 'Guide Socratically without operating controls'}).")

        if screen:
            vis = [f"{r.id} ({r.label})" for r in screen.regions if r.visible]
            notes.append(f"[Screen Note] Screen={screen.screen}, Step={screen.experiment.step if screen.experiment else 'READINGS'}, Visible={', '.join(vis[:7])}.")
            if screen.pointerTarget:
                pt = screen.pointerTarget
                notes.append(
                    f"[Pointer Note] Student is actively pointing at screen coordinates ({pt.x}, {pt.y}) -> "
                    f"element='{pt.label or pt.tag}' (tag={pt.tag}, regionId='{pt.regionId or 'bench'}', "
                    f"value='{pt.value or ''}', svgPart='{pt.svgPart or ''}', text='{pt.textSnippet or ''}')."
                )
            if screen.sim:
                warnings = screen.sim.get("warnings") or []
                rc = screen.sim.get("readingsCount", 0)
                rt = screen.sim.get("readingsTarget", 6)
                notes.append(
                    f"[Telemetry Note] Readings progress: {rc}/{rt} trials recorded. Active warnings: {warnings if warnings else 'None'}."
                )
        else:
            notes.append(f"[Screen Note] ScreenMap absent; ground response in {experiment.title} briefing.")

        if kg_facts:
            notes.append(f"[GraphRAG Note] {kg_facts[0]}")

        notes.append(f"[Pedagogical Goal] Address student query \"{user_text}\" in <= 3 sentences and conclude with 1 Socratic guiding question.")
        return "\n".join(notes)


# =============================================================================
# 3. Nonparametric Learning: Reflexion & ExpeL Insight Memory (Ch. 7 pp. 137–143)
# =============================================================================


class ReflexionAndExpeLMemory:
    """Implements Ch. 7 Reflexion (`Plan: ...` self-critique buffer) and ExpeL insight distillation."""

    def __init__(self, max_reflections: int = 4) -> None:
        self.reflections: deque[str] = deque(maxlen=max_reflections)
        # Seeded high-level ExpeL distilled rules (can be promoted/edited via AGREE/EDIT/ADD/REMOVE)
        self.distilled_insights: list[str] = [
            "RULE 1: Always anchor explanations to a visible ScreenMap regionId using spotlight or pointAt so the student sees what Vix is describing.",
            "RULE 2: In GRADED mode, replace any specific numerical measurements or thresholds with conceptual relationships and ask the student to substitute their own recorded values.",
            "RULE 3: When sim.warnings is non-empty, turn the primary warning into a Socratic question about experimental technique rather than a blunt error message.",
            "RULE 4: Keep spoken turns to at most 3 concise sentences ending with a single guiding question.",
        ]

    def format_active_coaching_context(self) -> str:
        sections: list[str] = [
            "Distilled Pedagogical Rules (ExpeL):",
            *(f"  - {rule}" for rule in self.distilled_insights),
        ]
        if self.reflections:
            sections.append("Recent Self-Critique Reflections (Reflexion Plan Buffer):")
            for idx, ref in enumerate(self.reflections, 1):
                sections.append(f"  - Reflection {idx}: {ref}")
        return "\n".join(sections)

    def generate_reflexion_plan(
        self,
        brain: LLMBrain,
        *,
        user_query: str,
        failed_draft: str,
        critic_feedback: str,
        mode: Mode,
    ) -> str:
        """Run the 3-part Ch. 7 Reflexion prompt (Framing + Instruction + Failed Transcript -> 'Plan:')."""
        prompt = (
            "You are given a past attempt in which your response as Vix failed the pedagogical or academic integrity rubric.\n"
            "Do not summarize the environment; focus on what strategic step or constraint you missed and devise a concise corrective plan after 'Plan:'.\n\n"
            f"Instruction:\nRespond to student query \"{user_query}\" in {mode} mode in <= 3 sentences ending with a Socratic question and zero policy leaks.\n\n"
            f"Trial Transcript:\n"
            f"Action: draft_reply[{failed_draft}]\n"
            f"Observation (Critic Feedback): {critic_feedback}\n"
            f"STATUS: FAIL\n"
            "Plan:"
        )
        plan = brain.generate_sync(
            prompt,
            system="You are a Reflexion meta-reasoner (Ch. 7). Output a 1-sentence corrective strategy.",
            fast=True,
            temperature=0.1,
            max_tokens=110,
        ).strip()
        clean_plan = plan.replace("Plan:", "").strip()
        self.reflections.append(clean_plan)
        return clean_plan


# Singleton Knowledge Graph shared across sessions
GLOBAL_LAB_KG = LabKnowledgeGraph()
