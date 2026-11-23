package org.vixir.common;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import java.lang.reflect.GenericArrayType;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.TypeVariable;
import java.lang.reflect.WildcardType;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * Controllers return DTO records, never JPA entities (steering: java-backend.md). Walks every handler's
 * declared return type through generics, arrays and record components.
 */
class NoEntityInResponsesTest extends BaseIntegrationTest {

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    RequestMappingHandlerMapping mappings;

    @Test
    void noHandlerReturnsAnEntity() {
        List<String> offenders = new ArrayList<>();
        mappings.getHandlerMethods().forEach((info, handler) -> {
            if (!handler.getBeanType().getPackageName().startsWith("org.vixir")) return;
            String path = handler.getBeanType().getSimpleName() + "#" + handler.getMethod().getName();
            findEntities(handler.getMethod().getGenericReturnType(), path, new HashSet<>(), offenders);
        });
        assertThat(offenders).as("handlers exposing JPA entities").isEmpty();
    }

    @Test
    @SuppressWarnings("unchecked")
    void attemptAndEventJsonHaveNoInternalFields() {
        String token = register("dto-" + UUID.randomUUID() + "@example.com", "password123", "STUDENT", "Dto");
        var start = http.exchange("/api/v1/attempts", HttpMethod.POST,
                bearerRequest(token, Map.of("experimentId", "phy.pendulum.g")), Map.class);
        String attemptId = (String) start.getBody().get("attemptId");

        var event = Map.of("events", List.of(Map.of(
                "clientEventId", UUID.randomUUID().toString(), "seq", 1, "type", "APPARATUS_PLACED",
                "payload", Map.of("apparatus", "retort_stand"))));
        assertThat(http.exchange("/api/v1/attempts/" + attemptId + "/events", HttpMethod.POST,
                bearerRequest(token, event), Map.class).getStatusCode().value()).isEqualTo(200);

        Map<String, Object> attempt = http.exchange("/api/v1/attempts/" + attemptId, HttpMethod.GET,
                bearerRequest(token), Map.class).getBody();
        assertThat(attempt).containsEntry("id", attemptId).containsEntry("experimentId", "phy.pendulum.g");
        assertThat(attempt).doesNotContainKeys("seed", "anonTokenHash", "deviceId", "userId");

        List<Map<String, Object>> events = http.exchange("/api/v1/attempts/" + attemptId + "/events",
                HttpMethod.GET, bearerRequest(token), List.class).getBody();
        assertThat(events).hasSize(1);
        assertThat(events.get(0)).containsEntry("seq", 1).containsEntry("type", "APPARATUS_PLACED")
                .containsKeys("clientEventId", "payload", "serverTs")
                .doesNotContainKeys("id", "attemptId");
    }

    private static void findEntities(Type type, String path, Set<Type> seen, List<String> offenders) {
        if (type == null || !seen.add(type)) return;
        if (type instanceof ParameterizedType p) {
            findEntities(p.getRawType(), path, seen, offenders);
            for (Type arg : p.getActualTypeArguments()) findEntities(arg, path, seen, offenders);
        } else if (type instanceof GenericArrayType g) {
            findEntities(g.getGenericComponentType(), path, seen, offenders);
        } else if (type instanceof WildcardType w) {
            for (Type b : w.getUpperBounds()) findEntities(b, path, seen, offenders);
        } else if (type instanceof TypeVariable<?> v) {
            for (Type b : v.getBounds()) findEntities(b, path, seen, offenders);
        } else if (type instanceof Class<?> c) {
            if (c.isArray()) {
                findEntities(c.getComponentType(), path, seen, offenders);
            } else if (c.isAnnotationPresent(Entity.class) || c.isAnnotationPresent(Embeddable.class)) {
                offenders.add(path + " -> " + c.getSimpleName());
            } else if (c.isRecord()) {
                for (var rc : c.getRecordComponents()) findEntities(rc.getGenericType(), path, seen, offenders);
            }
        }
    }
}
