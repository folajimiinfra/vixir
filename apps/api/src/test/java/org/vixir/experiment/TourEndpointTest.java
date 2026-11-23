package org.vixir.experiment;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.vixir.common.BaseIntegrationTest;

/** GET /vix/tours/{screenCode} serves real steps from experiment configs (Req 13.7). */
class TourEndpointTest extends BaseIntegrationTest {

    @Test
    @SuppressWarnings("unchecked")
    void servesStepsArrayFromPendulumConfigWithoutAuth() {
        var res = http.getForEntity("/api/v1/vix/tours/D1", Map.class);
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getHeaders().getCacheControl()).isEqualTo("public, max-age=3600");

        var body = res.getBody();
        assertThat(body.get("screenCode")).isEqualTo("D1");
        assertThat(body.get("experimentId")).isEqualTo("phy.pendulum.g");
        assertThat(body.get("experimentVersion")).isEqualTo(1);
        assertThat(body.get("steps")).isInstanceOf(List.class);

        var steps = (List<Map<String, Object>>) body.get("steps");
        assertThat(steps).hasSize(6);
        assertThat(steps.get(0)).containsEntry("regionId", "header").doesNotContainKey("say");
        assertThat((String) steps.get(0).get("caption")).startsWith("This bar shows your experiment");
    }

    @Test
    void experimentIdSelectsThatExperimentsTour() {
        var res = http.getForEntity("/api/v1/vix/tours/D1?experimentId=phy.pendulum.g", Map.class);
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody().get("experimentId")).isEqualTo("phy.pendulum.g");

        var missing = http.getForEntity("/api/v1/vix/tours/D1?experimentId=no.such.experiment", Map.class);
        assertThat(missing.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void unknownScreenIsNotFound() {
        var res = http.getForEntity("/api/v1/vix/tours/Z9", Map.class);
        assertThat(res.getStatusCode().value()).isEqualTo(404);
        assertThat(res.getBody().get("code")).isEqualTo("TOUR_NOT_FOUND");
    }

    @Test
    void stepsForSkipsMalformedStepsAndMissingTours() {
        Map<String, Object> config = Map.of("tours", Map.of("D2", List.of(
                Map.of("regionId", "bench", "caption", "The bench."),
                Map.of("regionId", "no-caption"),
                "not a step",
                Map.of("regionId", "dock", "caption", "The dock."))));

        assertThat(TourService.stepsFor(config, "D2")).containsExactly(
                new TourService.TourStep("bench", "The bench."),
                new TourService.TourStep("dock", "The dock."));
        assertThat(TourService.stepsFor(config, "D3")).isNull();
        assertThat(TourService.stepsFor(Map.of(), "D2")).isNull();
        assertThat(TourService.stepsFor(Map.of("tours", "oops"), "D2")).isNull();
    }
}
