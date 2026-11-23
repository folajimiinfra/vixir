"""State definitions for Vix LangGraph (`VixState` with Ch. 5–8 Memory, GraphRAG, AutoGen A2A Trace & Reflexion)."""
from __future__ import annotations

from typing import Any, Literal

from typing_extensions import TypedDict

from ..contracts import (
    ExperimentContext,
    Intent,
    LLMProviderName,
    Mode,
    RpcCall,
    ScreenMap,
    TourState,
)


class VixState(TypedDict, total=False):
    """Canonical LangGraph state for Vix enhanced with Ch. 6 Self-Notes, GraphRAG, Ch. 7 Reflexion & Ch. 8 Multi-Agent Trace."""

    session_id: str
    mode: Literal["PRACTICE", "GRADED"]
    locale: str
    first_name: str
    experiment: ExperimentContext
    screen: ScreenMap | None
    frame_b64: str | None
    consent_screen: bool
    user_text: str
    intent: Intent
    target_ids: list[str]
    target_confidence: float
    tour: TourState | None
    retrieved_passages: list[str]
    # Ch. 6 Note-Taking, Working Memory & Multi-Hop GraphRAG
    self_notes: str
    conversation_history: str
    kg_facts: list[str]
    # Ch. 8 AutoGen Multi-Agent Consultation Trace & Actor-Critic Evaluation
    agent_trace: list[dict[str, Any]]
    critic_score: int
    critic_feedback: str
    # Ch. 7 Reflexion Self-Critique Plans
    reflexion_plans: list[str]
    draft: str
    rpc_plan: list[RpcCall]
    reply: str
    blocked: bool
    violation_reason: str | None
    rewrite_attempts: int
    prompt_id: str
    llm_brain: str
    turn_count: int
    transcripts_retained: bool
    institution_id: str | None
    timings_ms: dict[str, float]


class MultiAgentState(TypedDict, total=False):
    """State for the multi-agent Coordinator LangGraph."""

    user_query: str
    user_mode: Mode
    screen_map: ScreenMap | None
    screen_analysis: dict[str, Any] | None
    experiment_context: dict[str, Any] | None
    content_results: dict[str, Any] | None
    safety_warnings: list[str] | None
    safety_message: str | None
    policy_blocked: bool
    policy_violation_reason: str | None
    intent: Intent
    target_ids: list[str]
    rpc_plan: list[RpcCall]
    tour: TourState | None
    self_notes: str
    kg_facts: list[str]
    agent_trace: list[dict[str, Any]]
    critic_score: int
    reflexion_plans: list[str]
    response: str
    speech_queue: list[str]
    speech_locale: str | None
    pending_messages: list[Any]
    completed_messages: list[Any]
    llm_provider: LLMProviderName
    llm_model: str
    session_id: str
    experiment_id: str
    locale: str
    first_name: str
    turn_count: int
    max_turns: int
    max_duration_minutes: int


DEFAULT_PENDULUM_CONTEXT = ExperimentContext(
    id="phy.pendulum.g",
    title="Simple pendulum — determination of g",
    briefing=(
        "Determine the acceleration due to gravity g using a simple pendulum of varying lengths L "
        "from 30.0 cm to 80.0 cm by timing 20 complete small-angle oscillations."
    ),
    theory=(
        "For small angular displacements (theta < 10 degrees), a simple pendulum executes simple harmonic motion "
        "with period T = 2*pi*sqrt(L/g). Squaring both sides gives T^2 = (4*pi^2 / g)*L, so a graph of T^2 "
        "against L is a straight line through the origin with slope S = 4*pi^2 / g."
    ),
    procedure=[
        {"step": "SETUP", "description": "Clamp the split cork firmly and measure effective length L from the bottom of the cork to the centre of the brass bob."},
        {"step": "DISPLACE", "description": "Displace the pendulum bob laterally by a small angle (under 10 degrees) so it swings in a single vertical plane."},
        {"step": "READINGS", "description": "Release the bob and start the stopwatch as the string passes the vertical fiducial mark. Time 20 complete oscillations twice (t1 and t2) for at least 5 lengths L."},
        {"step": "GRAPH", "description": "Compute mean time t, period T = t/20, and T^2 for each length L, then plot T^2 on the vertical axis against L on the horizontal axis."},
    ],
    precautions=[
        "Keep the angular amplitude of oscillation small (less than 10 degrees) so the motion stays simple harmonic.",
        "Measure effective length L from the bottom of the split cork to the centre of gravity of the bob, avoiding parallax error on the metre rule.",
        "Start and stop the stopwatch as the string passes the vertical equilibrium fiducial mark where speed is maximum.",
        "Ensure the pendulum swings in one vertical plane without conical wobbling or draughts from fans.",
    ],
    hazards=[
        "Clamp the heavy retort stand base securely on the bench so it cannot tip over while the bob swings.",
    ],
    glossary={
        "period": "The time T taken for one complete back-and-forth oscillation (T = t / N).",
        "simple harmonic motion": "Periodic motion in which restoring acceleration is directly proportional to displacement and directed toward equilibrium.",
        "parallax error": "Apparent shift in scale reading when the observer's eye is not perpendicular to the graduation mark.",
        "fiducial mark": "A vertical reference marker placed at the equilibrium centre to count oscillation passes accurately.",
        "effective length": "Distance L from the point of suspension at the bottom of the split cork to the centre of mass of the pendulum bob.",
    },
    variables=["L", "t", "T", "T^2", "g", "slope"],
    units=["cm", "m", "s", "s^2", "m/s^2", "m s-2"],
)

OHMS_LAW_CONTEXT = ExperimentContext(
    id="elec.ohms-law",
    title="Verifying Ohm's law — resistance of wire X",
    briefing=(
        "Determine the resistance R of test wire X (nichrome, constantan, or copper) by varying current I "
        "with a sliding rheostat Rh, measuring potential difference V across X with a parallel voltmeter and "
        "series current I with an ammeter, and plotting V against I."
    ),
    theory=(
        "Ohm's law states that the current I flowing through a metallic conductor is directly proportional to "
        "the potential difference V across its ends (V = I * R), provided temperature and other physical conditions "
        "remain constant. The slope of V against I gives the resistance R, and resistivity rho = R * A / L."
    ),
    procedure=[
        {"step": "CIRCUIT", "description": "Connect the DC battery supply E, plug key K, sliding rheostat Rh, ammeter A, and test wire X in series, and connect the voltmeter V in parallel across wire X."},
        {"step": "CLOSE_KEY", "description": "Close plug key K and adjust the rheostat slider Rh to obtain a suitable current reading I on the ammeter and potential difference V on the voltmeter."},
        {"step": "READINGS", "description": "Record at least 5 pairs of ammeter (I) and voltmeter (V) readings for different rheostat settings, opening key K between readings so wire X does not overheat."},
        {"step": "GRAPH", "description": "Plot potential difference V on the vertical axis against current I on the horizontal axis and determine the resistance R from the slope."},
    ],
    precautions=[
        "Connect the ammeter in series and the voltmeter in parallel across test wire X, observing correct positive and negative terminal polarity.",
        "Open the plug key K immediately after taking each reading so Joule heating does not raise the temperature and resistance of wire X.",
        "Ensure all terminal connections are tight and check the ammeter and voltmeter for zero error before closing key K.",
    ],
    hazards=[
        "Do not set the rheostat to zero resistance at high EMF, as excessive current will overheat test wire X and may damage the ammeter.",
    ],
    glossary={
        "rheostat": "A variable sliding wire-wound resistor (0-20 ohms) used to vary total circuit resistance and adjust series current I.",
        "ammeter": "A low-resistance current-measuring instrument always connected in series with the circuit loop.",
        "voltmeter": "A high-resistance potential-difference measuring instrument always connected in parallel across the component under test.",
        "plug key": "A metallic switch (K) closed only briefly while taking readings to prevent Joule heating in wire X.",
        "terminal pin": "A connection node (Pin A or Pin B) on each circuit component where copper jumper leads attach to complete the electrical loop.",
    },
    variables=["V", "I", "R", "Rh", "E", "L", "slope"],
    units=["V", "A", "mA", "Ω", "ohms", "cm", "°C", "mW"],
)

TITRATION_CONTEXT = ExperimentContext(
    id="chem.titration",
    title="Acid-base titration — standardizing HCl with Na2CO3",
    briefing=(
        "Determine the concentration of hydrochloric acid (HCl) by titrating it from a 50.00 cm3 burette against "
        "25.0 cm3 aliquots of standard 0.050 mol dm-3 sodium carbonate (Na2CO3) solution using methyl orange indicator."
    ),
    theory=(
        "Sodium carbonate neutralizes hydrochloric acid according to Na2CO3 + 2HCl -> 2NaCl + H2O + CO2. "
        "At the stoichiometric equivalence point, (C_A * V_A) / (C_B * V_B) = n_A / n_B = 2 / 1."
    ),
    procedure=[
        {"step": "RINSE", "description": "Rinse the burette with the acid solution and fill it above the zero mark, ensuring the jet is free of air bubbles."},
        {"step": "PIPETTE", "description": "Pipette 25.0 cm3 of standard Na2CO3 base into a clean conical flask on a white tile and add 2 drops of methyl orange indicator."},
        {"step": "TITRATE", "description": "Run acid from the burette while swirling the conical flask until one drop turns the yellow solution permanently orange-pink."},
        {"step": "CONCORDANT", "description": "Repeat the titration to obtain at least two concordant titres agreeing within 0.10 cm3, recorded to two decimal places."},
    ],
    precautions=[
        "Read the bottom of the concave meniscus at eye level to avoid parallax error on the burette scale.",
        "Remove the filter funnel from the top of the burette before taking the initial reading so drops do not fall in during titration.",
        "Flush any air bubble from the burette jet nozzle before recording the initial volume.",
    ],
    hazards=["Wear chemical splash goggles and rinse any acid or alkali spills immediately with water."],
    glossary={
        "concordant titres": "Two or more accurate titration volumes that agree within 0.10 cm3 of each other.",
        "meniscus": "The curved upper surface of a liquid column in a glass tube; read at the bottom of the curve at eye level.",
        "end-point": "The exact drop at which the acid-base indicator changes colour permanently.",
    },
    variables=["V_A", "V_B", "C_A", "C_B"],
    units=["cm³", "cm3", "dm³", "mol dm-3"],
)

DISSECTION_CONTEXT = ExperimentContext(
    id="bio.dissection",
    title="Dissection of a Mammal (Rabbit / Rat) — Ventral View",
    briefing="Pin the specimen ventral-side up, open the abdominal and thoracic cavities along the linea alba, and identify all 18 in-situ visceral organs.",
    theory="Mammals possess a muscular diaphragm dividing the coelom into an anterior thoracic cavity (trachea, heart, lungs) and a posterior peritoneal cavity (liver, gall bladder, stomach, duodenum, pancreas, spleen, ileum, caecum, colon, kidneys, ureters, bladder).",
    procedure=[
        {"step": "PIN", "description": "Pin the specimen dorsal-side down through all four paws at 45 degrees on the wax dissecting board."},
        {"step": "INCISION", "description": "Lift the ventral abdominal skin with forceps and cut along the midline linea alba using the blunt lower blade of the scissors."},
        {"step": "IDENTIFY", "description": "Unfurl the vascular mesentery fan and trace the digestive, respiratory, circulatory, and urogenital structures in situ."},
    ],
    precautions=[
        "Always insert the blunt lower blade of the dissecting scissors beneath the lifted body wall so you do not puncture the underlying stomach or caecum.",
    ],
    hazards=["Handle surgical scalpels and mounted needles away from fingers and wear laboratory gloves."],
    glossary={
        "diaphragm": "Dome-shaped musculotendinous partition separating the thoracic cavity from the abdominal cavity.",
        "mesentery": "Fan-shaped serous peritoneal membrane suspending the small intestine and carrying mesenteric blood vessels and lacteals.",
    },
    variables=[],
    units=["cm", "mm"],
)

BODY_SYSTEMS_CONTEXT = ExperimentContext(
    id="bio.body-systems",
    title="Human Anatomy & Physiology — 6-System Medical Atlas",
    briefing="Explore the Skeletal, Muscular, Respiratory, Circulatory, Digestive, Renal, and Nervous systems, alveolar gas exchange, nephron osmoregulation, and Lead II ECG.",
    theory="Homeostasis integrates pulmonary gas exchange (Fick's law), double circulation (CO = HR * SV), glomerular ultrafiltration, and ADH-regulated water reabsorption in the renal collecting duct.",
    procedure=[
        {"step": "LAYERS", "description": "Toggle or solo the anatomical system layers and inspect any organ or bone via its horizontal leader-line callout."},
        {"step": "INSETS", "description": "Switch to the magnified Alveoli O2/CO2 inset, Nephron ADH osmoregulation inset, or Physiological State simulator."},
    ],
    precautions=["Compare normal resting physiological parameters against exercise, hypoxia, and dehydration states."],
    hazards=[],
    glossary={
        "ultrafiltration": "High-pressure filtration of plasma across the glomerulus into Bowman's capsule due to a wider afferent than efferent arteriole.",
    },
    variables=["BPM", "SpO2", "GFR"],
    units=["bpm", "mL/min", "mmHg", "mOsm/L", "%"],
)

BEAM_CONTEXT = ExperimentContext(
    id="eng.beam",
    title="3D Cantilever Beam Deflection — Young's Modulus E",
    briefing="Measure tip deflection delta of a structural cantilever beam under incremental slotted loads F using a 0.01 mm plunger dial indicator to determine Young's modulus E.",
    theory="By Euler-Bernoulli beam theory, cantilever tip deflection is delta = (F * L^3) / (3 * E * I), where the second moment of area I = (b * d^3) / 12.",
    procedure=[
        {"step": "ZERO", "description": "Clamp the cantilever beam at span L, seat the dial indicator plunger vertically at the free tip, and rotate the bezel to zero."},
        {"step": "LOAD", "description": "Apply incremental slotted masses, tap the bench lightly to overcome plunger stiction, and record both loading and unloading deflections."},
    ],
    precautions=[
        "Tap the frame lightly before reading the dial indicator to overcome plunger friction.",
        "Record both loading and unloading deflections to verify the beam remained within its linear elastic limit.",
    ],
    hazards=["Stand clear of the suspended weight hanger in case slotted masses slip."],
    glossary={
        "second moment of area": "Geometric bending stiffness parameter I = b * d^3 / 12 of a rectangular cross-section.",
    },
    variables=["F", "L", "δ", "E", "I", "σ"],
    units=["N", "mm", "m", "GPa", "MPa"],
)


def resolve_experiment_context(
    screen: ScreenMap | None,
    explicit_experiment: ExperimentContext | None = None,
) -> ExperimentContext:
    """Resolve the authoritative ExperimentContext from the live ScreenMap route/screen/title so Vix always matches the active lab."""
    if screen is not None:
        key_text = f"{screen.screen} {screen.route} {screen.experiment.title if screen.experiment else ''} {screen.experiment.id if screen.experiment else ''}".lower()
        if any(k in key_text for k in ("d6", "ohm", "electronics", "circuit", "rheostat")):
            return OHMS_LAW_CONTEXT
        if any(k in key_text for k in ("d2", "titration", "qualitative", "chemistry", "burette")):
            return TITRATION_CONTEXT
        if any(k in key_text for k in ("d4", "dissection", "rabbit", "rat")):
            return DISSECTION_CONTEXT
        if any(k in key_text for k in ("d5", "body-systems", "anatomy", "nephron")):
            return BODY_SYSTEMS_CONTEXT
        if any(k in key_text for k in ("d7", "beam", "cantilever", "engineering", "deflection")):
            return BEAM_CONTEXT
        if any(k in key_text for k in ("d3", "digestion", "food-tests", "enzyme", "biology")):
            return ExperimentContext(
                id="bio.digestion",
                title=screen.experiment.title if screen.experiment else "Enzymatic Digestion & Biochemical Food Tests",
                briefing="Investigate the effect of temperature and pH on digestive enzymes and identify starch, reducing sugars, proteins, and lipids.",
                theory="Enzymes have an optimum temperature (~37°C) and pH (amylase pH 7, pepsin pH 2, lipase pH 8) above which thermal denaturation alters the active site.",
                precautions=["Maintain water-bath temperature steadily and use clean droppers for each reagent."],
            )
    return explicit_experiment or DEFAULT_PENDULUM_CONTEXT


def create_vix_state(
    user_text: str,
    *,
    mode: Literal["PRACTICE", "GRADED"] = "PRACTICE",
    screen: ScreenMap | None = None,
    experiment: ExperimentContext | None = None,
    session_id: str = "session-default",
    first_name: str = "Student",
    locale: str = "en",
    tour: TourState | None = None,
    frame_b64: str | None = None,
    consent_screen: bool = False,
    llm_brain: str = "gemini/gemini-3.8-flash",
    turn_count: int = 1,
    transcripts_retained: bool = False,
    institution_id: str | None = "inst-default",
    conversation_history: str = "",
    reflexion_plans: list[str] | None = None,
) -> VixState:
    resolved_exp = resolve_experiment_context(screen, experiment)
    return VixState(
        session_id=session_id,
        mode=mode,
        locale=locale,
        first_name=first_name,
        experiment=resolved_exp,
        screen=screen,
        frame_b64=frame_b64,
        consent_screen=consent_screen,
        user_text=user_text,
        intent="what_next",
        target_ids=[],
        target_confidence=0.0,
        tour=tour,
        retrieved_passages=[],
        self_notes="",
        conversation_history=conversation_history,
        kg_facts=[],
        agent_trace=[],
        critic_score=10,
        critic_feedback="",
        reflexion_plans=list(reflexion_plans or []),
        draft="",
        rpc_plan=[],
        reply="",
        blocked=False,
        violation_reason=None,
        rewrite_attempts=0,
        prompt_id="v1",
        llm_brain=llm_brain,
        turn_count=turn_count,
        transcripts_retained=transcripts_retained,
        institution_id=institution_id,
        timings_ms={},
    )
