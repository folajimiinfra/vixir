package org.vixir.marking;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Everything the pure Marker needs. Constructed by MarkingService from DB rows.
 * Pure value type — no Spring, no I/O.
 */
public record MarkingInput(
        /** Rows from the READING table: sorted by rowIndex, each is a map of column→value. */
        List<Map<String, Object>> readings,

        /** Student-submitted results from SUBMISSION.results. */
        Map<String, Object> results,

        /**
         * Rubric criteria from the experiment config.
         * Each: { key, label, type, max, rule:{...} }
         */
        List<Map<String, Object>> criteria,

        /**
         * Analysis section from the experiment config.
         * Keys: plot (x-axis, y-axis column names), derive (formula hint), tolerance (fraction).
         */
        Map<String, Object> analysis,

        /**
         * Precaution keyword sets — one Set<String> per expected precaution.
         */
        List<Set<String>> precautionKeywordSets
) {}
