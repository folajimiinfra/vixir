"""Pydantic mirror of steering contracts.md §4–7. Keep in sync with packages/screen-map/src/index.ts."""
from __future__ import annotations

import json
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

Mode = Literal["PRACTICE", "GRADED", "EXAM"]
RegionKind = Literal["panel", "instrument", "control", "apparatus", "chart", "table"]
RpcMethod = Literal[
    "spotlight",
    "pointAt",
    "startTour",
    "tourStep",
    "endTour",
    "openPanel",
    "showCaption",
    "buildSetup",
]
RPC_METHODS: tuple[RpcMethod, ...] = (
    "spotlight",
    "pointAt",
    "startTour",
    "tourStep",
    "endTour",
    "openPanel",
    "showCaption",
    "buildSetup",
)

Intent = Literal[
    "explain_screen",
    "explain_region",
    "what_next",
    "concept",
    "safety",
    "tour_nav",
    "build_setup",
    "off_topic",
    "forbidden",
]

LLMProviderName = Literal[
    "gemini",
    "anthropic",
    "openai",
    "groq",
    "deepseek",
    "mistral",
    "openrouter",
    "together",
    "xai",
    "ollama",
]

MAX_SCREENMAP_BYTES = 16 * 1024  # 16 KB cap per contracts.md §4


class Region(BaseModel):
    id: str
    label: str
    kind: RegionKind
    bbox: tuple[int, int, int, int]
    visible: bool
    summary: str | None = None


class ExperimentRef(BaseModel):
    id: str
    title: str
    step: str


class PointerTarget(BaseModel):
    """Exact DOM or SVG element where the student is pointing, hovering, or clicking on screen."""

    x: int
    y: int
    regionId: str | None = None
    elementId: str | None = None
    tag: str = "div"
    label: str = ""
    value: str | None = None
    textSnippet: str | None = None
    svgPart: str | None = None
    bbox: tuple[int, int, int, int] | None = None


class ScreenMap(BaseModel):
    v: Literal[1] = 1
    screen: str
    route: str
    mode: Mode
    experiment: ExperimentRef | None = None
    viewport: dict[str, int]
    regions: list[Region] = Field(default_factory=list)
    pointerTarget: PointerTarget | None = None
    sim: dict[str, Any] | None = None
    lastEvents: list[dict[str, Any]] | None = None

    @field_validator("viewport")
    @classmethod
    def _validate_viewport(cls, value: dict[str, int]) -> dict[str, int]:
        if "w" not in value or "h" not in value:
            raise ValueError("viewport must contain 'w' and 'h'")
        return value

    def has_id(self, region_or_element_id: str) -> bool:
        """Check whether a regionId or dot-prefixed elementId exists in this ScreenMap."""
        if not region_or_element_id:
            return False
        return any(
            r.id == region_or_element_id or region_or_element_id.startswith(r.id + ".")
            for r in self.regions
        )

    def visible_regions(self) -> list[Region]:
        """Return only regions with visible=True."""
        return [r for r in self.regions if r.visible]

    @classmethod
    def parse_validated_payload(cls, raw_payload: str | bytes | dict[str, Any]) -> ScreenMap:
        """Validate that an incoming ScreenMap is <= 16 KB and conforms to contracts §4."""
        if isinstance(raw_payload, (str, bytes)):
            raw_bytes = raw_payload.encode("utf-8") if isinstance(raw_payload, str) else raw_payload
            if len(raw_bytes) > MAX_SCREENMAP_BYTES:
                raise ValueError(
                    f"ScreenMap payload size {len(raw_bytes)} exceeds 16 KB limit ({MAX_SCREENMAP_BYTES})"
                )
            data = json.loads(raw_bytes.decode("utf-8"))
            return cls.model_validate(data)
        encoded = json.dumps(raw_payload).encode("utf-8")
        if len(encoded) > MAX_SCREENMAP_BYTES:
            raise ValueError(f"ScreenMap dict size {len(encoded)} exceeds 16 KB limit")
        return cls.model_validate(raw_payload)


class TourStep(BaseModel):
    regionId: str
    caption: str


class TourState(BaseModel):
    tourId: str
    steps: list[TourStep] = Field(default_factory=list)
    index: int = 0
    active: bool = True

    def clamp_index(self, new_index: int) -> int:
        if not self.steps:
            return 0
        return max(0, min(len(self.steps) - 1, new_index))


class RpcCall(BaseModel):
    method: RpcMethod
    payload: dict[str, Any] = Field(default_factory=dict)


class ProcedureStep(BaseModel):
    step: str | int | None = None
    id: str | None = None
    title: str | None = None
    description: str = ""
    regionId: str | None = None


class ExperimentContext(BaseModel):
    id: str = "phy.pendulum.g"
    title: str = "Simple pendulum — determination of g"
    briefing: str | None = None
    theory: str | None = None
    procedure: list[dict[str, Any]] = Field(default_factory=list)
    precautions: list[str] = Field(default_factory=list)
    hazards: list[str] = Field(default_factory=list)
    glossary: dict[str, str] = Field(default_factory=dict)
    variables: list[str] = Field(default_factory=list)
    units: list[str] = Field(default_factory=list)


class ConsentFlags(BaseModel):
    mic: bool = True
    screen: bool = False
    camera: bool = False


class SessionContext(BaseModel):
    mode: Mode
    locale: str = "en"
    firstName: str
    voice: Literal["ada", "tunde", "grace"] = "ada"
    institutionId: str | None = None
    vixDisabledInstitution: bool = False
    transcriptsRetained: bool = False
    consent: ConsentFlags = Field(default_factory=ConsentFlags)
    experiment: dict[str, Any] | None = None
    screenTours: dict[str, list[TourStep]] | None = None

    def get_experiment_context(self) -> ExperimentContext:
        if not self.experiment:
            return ExperimentContext()
        return ExperimentContext.model_validate(self.experiment)
