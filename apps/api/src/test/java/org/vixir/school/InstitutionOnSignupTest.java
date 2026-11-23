package org.vixir.school;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.vixir.auth.AppUserRepository;
import org.vixir.common.BaseIntegrationTest;

/** Teachers and admins get an institution at sign-up (Req 3.1), so they can create classes. */
class InstitutionOnSignupTest extends BaseIntegrationTest {

    @Autowired AppUserRepository userRepo;
    @Autowired InstitutionRepository institutionRepo;
    @Autowired InstitutionSettingsRepository settingsRepo;

    @Test
    void selfRegisteredTeacherCanCreateClassInTheirOwnInstitution() {
        String token = register(unique("teacher"), "password123", "TEACHER", "Ada");
        UUID instId = userRepo.findById(subjectOf(token)).orElseThrow().getInstitutionId();
        assertThat(instId).isNotNull();
        assertThat(institutionRepo.findById(instId).orElseThrow().getName()).isEqualTo("Ada Test's classes");

        var res = createClass(token);
        assertThat(res.getStatusCode().value()).isEqualTo(201);
        assertThat(res.getBody().get("institutionId")).isEqualTo(instId.toString());
    }

    @Test
    void adminRegistrationCreatesNamedInstitutionWithDefaultSettings() {
        var body = new HashMap<String, Object>(Map.of(
                "email", unique("admin"), "password", "password123",
                "firstName", "Bola", "lastName", "Test", "role", "ADMIN",
                "institutionName", "  Lagos Model College  "));
        var res = http.postForEntity("/api/v1/auth/register", body, Map.class);
        assertThat(res.getStatusCode().value()).isEqualTo(201);

        UUID instId = userRepo.findById(subjectOf((String) res.getBody().get("accessToken")))
                .orElseThrow().getInstitutionId();
        var inst = institutionRepo.findById(instId).orElseThrow();
        assertThat(inst.getName()).isEqualTo("Lagos Model College");

        var settings = settingsRepo.findById(instId).orElseThrow();
        assertThat(settings.isVixEnabled()).isTrue();
        assertThat(settings.isVixTranscriptsRetained()).isFalse();
        assertThat(settings.getDefaultNoiseLevel()).isEqualTo("REALISTIC");
        assertThat(settings.getDefaultLocale()).isEqualTo("en");
    }

    @Test
    void accessTokenCarriesTheNewInstitution() {
        String token = register(unique("teacher"), "password123", "TEACHER", "Inst");
        String payload = new String(java.util.Base64.getUrlDecoder().decode(token.split("\\.")[1]));
        UUID instId = userRepo.findById(subjectOf(token)).orElseThrow().getInstitutionId();
        assertThat(payload).contains("\"inst\":\"" + instId + "\"");
    }

    @Test
    void studentRegistrationCreatesNoInstitution() {
        String token = register(unique("student"), "password123", "STUDENT", "Stu");
        assertThat(userRepo.findById(subjectOf(token)).orElseThrow().getInstitutionId()).isNull();
    }

    @Test
    void teacherWithoutInstitutionFromBeforeTheFixGetsOneOnFirstClass() {
        String token = register(unique("legacy"), "password123", "TEACHER", "Old");
        var user = userRepo.findById(subjectOf(token)).orElseThrow();
        user.setInstitutionId(null); // simulate an account created before this change
        userRepo.save(user);

        var res = createClass(token);
        assertThat(res.getStatusCode().value()).isEqualTo(201);
        UUID instId = userRepo.findById(user.getId()).orElseThrow().getInstitutionId();
        assertThat(instId).isNotNull();
        assertThat(res.getBody().get("institutionId")).isEqualTo(instId.toString());
    }

    @Test
    void overlongInstitutionNameIsRejected() {
        var body = Map.<String, Object>of(
                "email", unique("long"), "password", "password123",
                "firstName", "L", "lastName", "Test", "role", "TEACHER",
                "institutionName", "x".repeat(121));
        assertThat(http.postForEntity("/api/v1/auth/register", body, Map.class).getStatusCode().value())
                .isEqualTo(400);
    }

    private org.springframework.http.ResponseEntity<Map> createClass(String token) {
        return http.exchange("/api/v1/classes", HttpMethod.POST,
                bearerRequest(token, Map.of("name", "SS2 Physics", "subject", "PHYSICS", "level", "SS2")), Map.class);
    }

    private static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@example.com";
    }
}
