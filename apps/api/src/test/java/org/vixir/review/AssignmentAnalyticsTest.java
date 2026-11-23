package org.vixir.review;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.vixir.common.BaseIntegrationTest;
import org.vixir.school.Enrolment;
import org.vixir.school.EnrolmentRepository;

/** enrolledCount counts the students of the assignment's class, on both results and analytics (Req 12.1–12.2). */
class AssignmentAnalyticsTest extends BaseIntegrationTest {

    @Autowired EnrolmentRepository enrolmentRepo;

    @Test
    void enrolledCountMatchesClassStudentsOnResultsAndAnalytics() {
        String teacher = register(unique("teacher"), "password123", "TEACHER", "Teach");

        var cls = http.exchange("/api/v1/classes", HttpMethod.POST,
                bearerRequest(teacher, Map.of("name", "SS2 Physics", "subject", "PHYSICS", "level", "SS2")), Map.class);
        assertThat(cls.getStatusCode().value()).isEqualTo(201);
        UUID classId = UUID.fromString((String) cls.getBody().get("id"));
        String joinCode = (String) cls.getBody().get("joinCode");

        // Three students join; a co-teacher is enrolled too and must not be counted
        for (int i = 0; i < 3; i++) {
            String student = register(unique("student"), "password123", "STUDENT", "S" + i);
            int status = http.exchange("/api/v1/classes/join", HttpMethod.POST,
                    bearerRequest(student, Map.of("code", joinCode)), Map.class).getStatusCode().value();
            assertThat(status).isEqualTo(200);
        }
        var coTeacher = new Enrolment();
        coTeacher.setClassId(classId);
        coTeacher.setUserId(subjectOf(register(unique("co"), "password123", "TEACHER", "Co")));
        coTeacher.setClassRole(Enrolment.ClassRole.CO_TEACHER);
        enrolmentRepo.save(coTeacher);

        // A second class with its own student, so a wrong class id can't accidentally give 3
        var other = http.exchange("/api/v1/classes", HttpMethod.POST,
                bearerRequest(teacher, Map.of("name", "Other", "subject", "PHYSICS", "level", "SS3")), Map.class);
        String otherStudent = register(unique("other"), "password123", "STUDENT", "O");
        http.exchange("/api/v1/classes/join", HttpMethod.POST,
                bearerRequest(otherStudent, Map.of("code", other.getBody().get("joinCode"))), Map.class);

        Instant now = Instant.now();
        var assignment = http.exchange("/api/v1/assignments", HttpMethod.POST, bearerRequest(teacher, Map.of(
                "classId", classId.toString(),
                "experimentId", "phy.pendulum.g",
                "experimentVersion", 1,
                "mode", "GRADED",
                "opensAt", now.minus(1, ChronoUnit.DAYS).toString(),
                "dueAt", now.plus(1, ChronoUnit.DAYS).toString())), Map.class);
        assertThat(assignment.getStatusCode().value()).isEqualTo(201);
        String assignmentId = (String) assignment.getBody().get("id");

        var results = http.exchange("/api/v1/assignments/" + assignmentId + "/results", HttpMethod.GET,
                bearerRequest(teacher), Map.class);
        assertThat(results.getStatusCode().value()).isEqualTo(200);
        assertThat(((Number) results.getBody().get("enrolledCount")).longValue()).isEqualTo(3);

        var analytics = http.exchange("/api/v1/assignments/" + assignmentId + "/analytics", HttpMethod.GET,
                bearerRequest(teacher), Map.class);
        assertThat(analytics.getStatusCode().value()).isEqualTo(200);
        @SuppressWarnings("unchecked")
        var analyticsResults = (Map<String, Object>) analytics.getBody().get("results");
        assertThat(((Number) analyticsResults.get("enrolledCount")).longValue()).isEqualTo(3);
    }

    private static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@example.com";
    }
}
