package org.vixir.marking;

/** Result for a single rubric criterion. Pure value type. */
public record CriterionResult(
        String key,
        int awarded,
        int max,
        String reason
) {}
