package org.vixir.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.*;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base class: boots the API against a real Postgres, provides HTTP helpers.
 * The container is a singleton shared by every test class (stopped by Testcontainers' Ryuk at JVM exit).
 * Don't use @Testcontainers/@Container here: that stops the container after each class while Spring
 * keeps reusing the cached context, so later classes would talk to a dead database.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        // Fixed test secrets (HS256 needs >= 32 bytes) so tests don't depend on the developer's .env or CI env.
        properties = {
                "vixir.jwt-secret=test-only-jwt-secret-0123456789abcdef0123",
                "vixir.service-secret=test-only-service-secret-0123456789abcdef",
                // Every test registers from 127.0.0.1 in one shared context; the default 10/min would trip.
                "vixir.auth-rate-limit-per-minute=10000",
                "LIVEKIT_API_KEY=test-livekit-key",
                "LIVEKIT_API_SECRET=test-only-livekit-secret-0123456789abcdef",
                "LIVEKIT_URL=wss://livekit.test"
        })
public abstract class BaseIntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:17-alpine");

    static {
        postgres.start();
    }

    @Autowired
    protected TestRestTemplate http;

    protected HttpEntity<Object> bearerRequest(String token, Object body) {
        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    protected HttpEntity<Void> bearerRequest(String token) {
        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }

    /** Register a user and return the access token. */
    protected String register(String email, String password, String role, String firstName) {
        var body = java.util.Map.of(
                "email", email, "password", password,
                "firstName", firstName, "lastName", "Test", "role", role);
        var res = http.postForEntity("/api/v1/auth/register", body, java.util.Map.class);
        return (String) res.getBody().get("accessToken");
    }

    /** Register a user with a unique email and return their id (the access token's subject). */
    protected java.util.UUID registerUserId(String role) {
        String email = role.toLowerCase() + "-" + java.util.UUID.randomUUID() + "@example.com";
        return subjectOf(register(email, "password123", role, "Test"));
    }

    /** The user id (sub claim) inside an access token. */
    protected java.util.UUID subjectOf(String token) {
        String payload = new String(java.util.Base64.getUrlDecoder().decode(token.split("\\.")[1]),
                java.nio.charset.StandardCharsets.UTF_8);
        var m = java.util.regex.Pattern.compile("\"sub\"\\s*:\\s*\"([^\"]+)\"").matcher(payload);
        if (!m.find()) throw new IllegalStateException("No sub claim in access token");
        return java.util.UUID.fromString(m.group(1));
    }
}
