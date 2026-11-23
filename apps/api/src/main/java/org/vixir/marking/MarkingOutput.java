package org.vixir.marking;

import java.util.List;

/** Full marking result for one submission. Pure value type. */
public record MarkingOutput(
        int total,
        int maxTotal,
        List<CriterionResult> criteria
) {}
