"""Rule half of the Policy_Guard (vix-agent Req 6). The LLM classifier half lives in graph/policy.py."""
from __future__ import annotations

import re
from collections.abc import Iterable

from .contracts import Mode

_DEFAULT_UNITS = (
    r"m/s\^?2|m\s?s-?2|m\s?s⁻²|s-?2\s?m-?1|s²\s?m⁻¹|"
    r"cm³|cm3|dm³|dm3|mol\s?dm-?3|mol/dm3|g\s?dm-?3|"
    r"s²|s\^?2|ms|s|cm|mm|m|kg|g|n|kn|a|ma|v|mv|ω|ohms?|gpa|mpa|kpa|pa|hz|khz|°c|°|%"
)
_NUMBER_WITH_UNIT = re.compile(
    rf"(?<![\w.])-?\d+(?:[.,]\d+)?\s?(?:{_DEFAULT_UNITS})(?![a-z])",
    re.IGNORECASE,
)
_DECIMAL_NUMBER = re.compile(r"(?<![\w.])-?\d+\.\d+(?![\w.])")
_ANSWER_PHRASES = re.compile(
    r"\b("
    r"the answer is|the correct (?:answer|value|reading|slope|period|result) is|"
    r"your (?:g|value|slope|result|titre|reading|concentration|period|resistance|deflection) (?:is|should be|equals|=)|"
    r"(?:g|slope|titre|resistance|concentration|period|t\^?2|t²)\s*(?:=|is about|is roughly|is approximately|equals)\s*-?\d|"
    r"that(?:'s| is) (?:correct|right|wrong|incorrect)|your reading is (?:correct|right|wrong)"
    r")",
    re.IGNORECASE,
)
_FORBIDDEN_ACTIONS = re.compile(
    r"\b("
    r"i(?:'ve| have) (?:submitted|changed|recorded|adjusted|moved|set)|"
    r"let me (?:submit|change|record|adjust|move|set)|"
    r"i will (?:submit|change|record|adjust) (?:it|that|the)"
    r")\b",
    re.IGNORECASE,
)


def violates(
    message: str,
    mode: Mode,
    extra_units: Iterable[str] | None = None,
    extra_symbols: Iterable[str] | None = None,
) -> str | None:
    """Return a reason string if the message breaks the mode policy, else None (Req 6 AC1, AC3, AC5)."""
    if not message:
        return None

    if _FORBIDDEN_ACTIONS.search(message):
        return "claims to act on the experiment"

    if mode == "GRADED":
        if _ANSWER_PHRASES.search(message):
            return "states an answer or validates a reading"
        if _NUMBER_WITH_UNIT.search(message):
            return "states a measured or derived value with units"
        if _DECIMAL_NUMBER.search(message):
            return "states a decimal numeric value in graded mode"

        if extra_units:
            escaped_units = "|".join(re.escape(u.strip()) for u in extra_units if u.strip())
            if escaped_units:
                dyn_pat = re.compile(
                    rf"(?<![\w.])-?\d+(?:[.,]\d+)?\s?(?:{escaped_units})(?![a-z])",
                    re.IGNORECASE,
                )
                if dyn_pat.search(message):
                    return "states a value with experiment unit"

        if extra_symbols:
            escaped_syms = "|".join(re.escape(s.strip()) for s in extra_symbols if s.strip())
            if escaped_syms:
                sym_pat = re.compile(
                    rf"\b(?:{escaped_syms})\s*(?:=|is|equals)\s*-?\d",
                    re.IGNORECASE,
                )
                if sym_pat.search(message):
                    return "states a value for an experiment quantity symbol"

    return None
