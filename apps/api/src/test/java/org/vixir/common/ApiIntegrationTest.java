package org.vixir.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Boots the whole API against a real Postgres (Docker), runs Flyway, checks public endpoints and auth. */
@Testcontainers
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
            "vixir.jwt-secret=test-only-jwt-secret-0123456789abcdef0123",
            "vixir.service-secret=test-only-service-secret-0123456789abcdef"
        })
class ApiIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired TestRestTemplate http;
    @Autowired JdbcTemplate jdbc;

    @Test
    void pingIsPublic() {
        var res = http.getForEntity("/api/v1/ping", String.class);
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody()).contains("\"status\":\"ok\"");
    }

    @Test
    void healthIsUp() {
        assertThat(http.getForEntity("/actuator/health", String.class).getBody()).contains("UP");
    }

    @Test
    void protectedEndpointsNeedAToken() {
        assertThat(http.getForEntity("/api/v1/me", String.class).getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void flywayCreatedTheSchema() {
        Integer tables = jdbc.queryForObject(
            "select count(*) from information_schema.tables where table_schema = 'public' and table_name in "
                + "('app_user','school_class','attempt','attempt_event','submission','mark','vix_session')", Integer.class);
        assertThat(tables).isEqualTo(7);
    }
}
