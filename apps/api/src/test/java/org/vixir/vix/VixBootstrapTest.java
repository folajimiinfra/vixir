package org.vixir.vix;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.vixir.common.BaseIntegrationTest;

/** POST /vix/sessions: own attempts only (Req 2.2) and a scripted tour URL pinned to the experiment. */
class VixBootstrapTest extends BaseIntegrationTest {

    @Test
    void cannotStartVixSessionOnAnotherStudentsAttempt() {
        String owner = register(unique("owner"), "password123", "STUDENT", "Own");
        String other = register(unique("other"), "password123", "STUDENT", "Oth");
        String attemptId = startPractice(owner);

        var res = bootstrap(other, Map.of("attemptId", attemptId, "screen", "D1"));
        assertThat(res.getStatusCode().value()).isEqualTo(404);
        assertThat(res.getBody().get("code")).isEqualTo("ATTEMPT_NOT_FOUND");
    }

    @Test
    void ownAttemptGetsSessionAndExperimentPinnedTourUrl() {
        String student = register(unique("student"), "password123", "STUDENT", "Stu");
        String attemptId = startPractice(student);

        var res = bootstrap(student, Map.of("attemptId", attemptId, "screen", "D1"));
        assertThat(res.getStatusCode().value()).isEqualTo(201);
        assertThat(res.getBody().get("scriptedTourUrl"))
                .isEqualTo("/api/v1/vix/tours/D1?experimentId=phy.pendulum.g");
    }

    @Test
    void noScreenMeansNoTourUrl() {
        String student = register(unique("student"), "password123", "STUDENT", "Stu");
        var res = bootstrap(student, Map.of());
        assertThat(res.getStatusCode().value()).isEqualTo(201);
        assertThat(res.getBody()).doesNotContainKey("scriptedTourUrl");
    }

    private String startPractice(String token) {
        var res = http.exchange("/api/v1/attempts", HttpMethod.POST,
                bearerRequest(token, Map.of("experimentId", "phy.pendulum.g")), Map.class);
        assertThat(res.getStatusCode().value()).isEqualTo(201);
        return (String) res.getBody().get("attemptId");
    }

    private org.springframework.http.ResponseEntity<Map> bootstrap(String token, Map<String, Object> body) {
        return http.exchange("/api/v1/vix/sessions", HttpMethod.POST, bearerRequest(token, body), Map.class);
    }

    private static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@example.com";
    }
}
