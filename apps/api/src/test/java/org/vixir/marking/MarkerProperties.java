package org.vixir.marking;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;
import net.jqwik.api.*;
import net.jqwik.api.constraints.DoubleRange;

/**
 * Property-based tests for the pure Marker (Req 10.7–10.8 / correctness properties).
 */
class MarkerProperties {

    /** Determinism: mark(s) == mark(s) for any submission s. */
    @Property
    void markingIsDeterministic(
            @ForAll @DoubleRange(min = 0.1, max = 10.0) double x1,
            @ForAll @DoubleRange(min = 0.1, max = 10.0) double x2,
            @ForAll @DoubleRange(min = 0.1, max = 20.0) double y1,
            @ForAll @DoubleRange(min = 0.1, max = 20.0) double y2) {
        var input = simpleInput(x1, x2, y1, y2);
        var r1 = Marker.evaluate(input);
        var r2 = Marker.evaluate(input);
        assertThat(r1.total()).isEqualTo(r2.total());
        assertThat(r1.criteria()).hasSize(r2.criteria().size());
    }

    /** Bounds: 0 ≤ awarded ≤ max for every criterion; total = Σ awarded. */
    @Property
    void boundsAlwaysHold(
            @ForAll @DoubleRange(min = 0.1, max = 10.0) double x1,
            @ForAll @DoubleRange(min = 0.1, max = 10.0) double x2,
            @ForAll @DoubleRange(min = 0.1, max = 20.0) double y1,
            @ForAll @DoubleRange(min = 0.1, max = 20.0) double y2) {
        var output = Marker.evaluate(simpleInput(x1, x2, y1, y2));
        int computedTotal = 0;
        for (var c : output.criteria()) {
            assertThat(c.awarded()).isGreaterThanOrEqualTo(0);
            assertThat(c.awarded()).isLessThanOrEqualTo(c.max());
            computedTotal += c.awarded();
        }
        assertThat(output.total()).isEqualTo(computedTotal);
        assertThat(output.total()).isLessThanOrEqualTo(output.maxTotal());
    }

    /** Monotonicity: increasing error in stated derived value never increases its marks. */
    @Property
    void derivedValueMonotonic(
            @ForAll @DoubleRange(min = 1.0, max = 100.0) double implied,
            @ForAll @DoubleRange(min = 0.0, max = 1.0) double smallError,
            @ForAll @DoubleRange(min = 0.1, max = 2.0) double largeError) {
        Assume.that(largeError > smallError);

        double smallStated = implied * (1 + smallError);
        double largeStated = implied * (1 + largeError);

        int scoreSmall = scoreForDerived(implied, smallStated);
        int scoreLarge = scoreForDerived(implied, largeStated);
        assertThat(scoreSmall).isGreaterThanOrEqualTo(scoreLarge);
    }

    // ---- helpers ----

    private MarkingInput simpleInput(double x1, double x2, double y1, double y2) {
        var readings = List.of(
                Map.<String, Object>of("L_cm", x1, "T_s", y1),
                Map.<String, Object>of("L_cm", x2, "T_s", y2)
        );
        var results = Map.<String, Object>of(
                "derivedValue", (y2 - y1) / (x2 - x1 + 1e-10), // slope estimate
                "precautions", List.of(),
                "graphAxes", Map.of("x", "L_cm", "y", "T_s"),
                "graphPoints", readings
        );
        var criteria = List.of(
                Map.<String, Object>of("key", "readings", "type", "readings", "max", 2,
                        "rule", Map.of("minRows", 2)),
                Map.<String, Object>of("key", "derived", "type", "derived", "max", 3, "rule", Map.of())
        );
        var analysis = Map.<String, Object>of("plot", List.of("L_cm", "T_s"), "tolerance", 0.05);
        return new MarkingInput(readings, results, criteria, analysis, List.of());
    }

    private int scoreForDerived(double implied, double stated) {
        var input = new MarkingInput(
                List.of(Map.of("L_cm", 1.0, "T_s", implied),
                        Map.of("L_cm", 2.0, "T_s", implied * 2)),
                Map.of("derivedValue", stated, "precautions", List.of()),
                List.of(Map.of("key", "derived", "type", "derived", "max", 3, "rule", Map.of())),
                Map.of("plot", List.of("L_cm", "T_s"), "tolerance", 0.05),
                List.of()
        );
        return Marker.evaluate(input).criteria().get(0).awarded();
    }
}
