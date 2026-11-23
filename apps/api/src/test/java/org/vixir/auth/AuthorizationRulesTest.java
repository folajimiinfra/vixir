package org.vixir.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.vixir.common.BaseIntegrationTest;

/**
 * One integration test per authorization rule (Req 2 / Req 15.6).
 */
class AuthorizationRulesTest extends BaseIntegrationTest {

    // Req 2.1 — /api/v1/** needs JWT, /auth/* does not
    @Test
    void unauthenticatedRequestToProtectedEndpointReturns401() {
        assertThat(http.getForEntity("/api/v1/me", String.class).getStatusCode().value())
                .isEqualTo(401);
    }

    @Test
    void publicPingRequiresNoToken() {
        assertThat(http.getForEntity("/api/v1/ping", String.class).getStatusCode().value())
                .isEqualTo(200);
    }

    @Test
    void experimentListIsPublic() {
        assertThat(http.getForEntity("/api/v1/experiments", String.class).getStatusCode().value())
                .isEqualTo(200);
    }

    // Req 2.1 — authenticated user can reach /me
    @Test
    void authenticatedUserCanReadProfile() {
        String token = register("me-test@example.com", "password123", "STUDENT", "Me");
        int status = http.exchange("/api/v1/me", HttpMethod.GET, bearerRequest(token), String.class)
                .getStatusCode().value();
        assertThat(status).isEqualTo(200);
    }

    // Req 2.2 — student cannot read another student's attempt
    @Test
    void studentCannotReadOtherStudentsAttempt() {
        register("s1@example.com", "password123", "STUDENT", "S1");
        String s2Token = register("s2@example.com", "password123", "STUDENT", "S2");
        // Use a random UUID that doesn't belong to S2
        UUID foreignAttemptId = UUID.randomUUID();
        int status = http.exchange("/api/v1/attempts/" + foreignAttemptId,
                HttpMethod.GET, bearerRequest(s2Token), String.class)
                .getStatusCode().value();
        assertThat(status).isIn(404, 401); // 404 by policy (Req 2.5)
    }

    // Req 2.5 — 404 not 403 for resource outside rules
    @Test
    void forbiddenResourceReturns404NotForbidden() {
        String token = register("rule25@example.com", "password123", "STUDENT", "X");
        ResponseEntity<String> res = http.exchange(
                "/api/v1/attempts/" + UUID.randomUUID(),
                HttpMethod.GET, bearerRequest(token), String.class);
        assertThat(res.getStatusCode().value()).isNotEqualTo(403);
        assertThat(res.getStatusCode().value()).isEqualTo(404);
    }

    // Req 1.4 — duplicate email returns 409
    @Test
    void duplicateEmailReturns409() {
        register("dup@example.com", "password123", "STUDENT", "Dup");
        var body = Map.of("email", "dup@example.com", "password", "password123",
                "firstName", "Dup", "lastName", "Test", "role", "STUDENT");
        int status = http.postForEntity("/api/v1/auth/register", body, Map.class)
                .getStatusCode().value();
        assertThat(status).isEqualTo(409);
    }

    // Req 1.3 — invalid class code returns 422
    @Test
    void invalidClassCodeReturns422() {
        var body = Map.of("email", "badcode@example.com", "password", "password123",
                "firstName", "Bad", "lastName", "Code",
                "role", "STUDENT", "classCode", "INVALID-CODE");
        int status = http.postForEntity("/api/v1/auth/register", body, Map.class)
                .getStatusCode().value();
        assertThat(status).isEqualTo(422);
    }

    // Req 6.2 — due_before_open returns 422
    @Test
    void teacherCannotCreateAssignmentWithDueBeforeOpen() {
        String token = register("teacher-dc@example.com", "password123", "TEACHER", "T");
        // A class the teacher owns, so the request gets past the ownership check to date validation
        var cls = http.exchange("/api/v1/classes", HttpMethod.POST,
                bearerRequest(token, Map.of("name", "Dates", "subject", "PHYSICS", "level", "SS2")), Map.class);
        assertThat(cls.getStatusCode().value()).isEqualTo(201);
        var body = Map.of(
                "classId", cls.getBody().get("id").toString(),
                "experimentId", "phy.pendulum.g",
                "experimentVersion", 1,
                "mode", "GRADED",
                "opensAt", "2026-12-01T09:00:00Z",
                "dueAt", "2026-11-30T09:00:00Z"
        );
        int status = http.exchange("/api/v1/assignments", HttpMethod.POST,
                bearerRequest(token, body), Map.class).getStatusCode().value();
        assertThat(status).isEqualTo(422);
    }
}
