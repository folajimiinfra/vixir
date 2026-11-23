package org.vixir.submission;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.vixir.attempt.Attempt;
import org.vixir.attempt.AttemptRepository;
import org.vixir.assignment.Assignment;
import org.vixir.assignment.AssignmentRepository;
import org.vixir.common.ApiException;
import org.vixir.common.BaseIntegrationTest;
import org.vixir.school.Institution;
import org.vixir.school.InstitutionRepository;
import org.vixir.school.SchoolClass;
import org.vixir.school.SchoolClassRepository;

/**
 * Req 9.4 — offline submission with client_submitted_at before due_at is accepted as not-late.
 */
class OfflineLateSubmissionTest extends BaseIntegrationTest {

    @Autowired AttemptRepository attemptRepo;
    @Autowired AssignmentRepository assignmentRepo;
    @Autowired SubmissionRepository submissionRepo;
    @Autowired SubmissionService submissionService;
    @Autowired InstitutionRepository institutionRepo;
    @Autowired SchoolClassRepository classRepo;

    @Test
    void offlineSubmissionBeforeDueNotMarkedLate() {
        // Set up minimal entities
        var inst = new Institution();
        inst.setName("Test School");
        inst.setType("SECONDARY");
        institutionRepo.save(inst);

        var cls = new SchoolClass();
        cls.setInstitutionId(inst.getId());
        UUID ownerId = registerUserId("TEACHER");
        cls.setOwnerId(ownerId);
        cls.setName("Test Class");
        cls.setSubject("PHYSICS");
        cls.setLevel("SS3");
        cls.setJoinCode("PHY-SS3-OFFL");
        classRepo.save(cls);

        Instant dueAt = Instant.now().minus(1, ChronoUnit.HOURS); // 1 hour in the past
        var assignment = new Assignment();
        assignment.setClassId(cls.getId());
        assignment.setExperimentId("phy.pendulum.g");
        assignment.setExperimentVersion(1);
        assignment.setCreatedBy(ownerId);
        assignment.setMode("GRADED");
        assignment.setStatus("PUBLISHED");
        assignment.setNoiseLevel("REALISTIC");
        assignment.setAttemptsAllowed(2);
        assignment.setReleasePolicy("MANUAL");
        assignment.setOpensAt(dueAt.minus(2, ChronoUnit.HOURS));
        assignment.setDueAt(dueAt);
        assignmentRepo.save(assignment);

        UUID userId = registerUserId("STUDENT");
        var attempt = new Attempt();
        attempt.setUserId(userId);
        attempt.setAssignmentId(assignment.getId());
        attempt.setExperimentId("phy.pendulum.g");
        attempt.setExperimentVersion(1);
        attempt.setMode("GRADED");
        attempt.setSeed(new byte[16]);
        attemptRepo.save(attempt);

        // Submit with clientSubmittedAt 10 minutes before due_at (offline scenario)
        var req = new SubmitRequest(
                java.util.Map.of(), // empty results
                true,
                dueAt.minus(10, ChronoUnit.MINUTES)
        );

        // Should NOT throw even though server time is after due_at
        assertThatCode(() ->
                submissionService.submit(attempt.getId(), userId, req, null)
        ).doesNotThrowAnyException();

        var submission = submissionRepo.findByAttemptId(attempt.getId()).orElseThrow();
        assertThat(submission.isLate()).isFalse();
    }

    @Test
    void normalLateSubmissionIsRejected() {
        var inst = new Institution();
        inst.setName("Test School 2");
        inst.setType("SECONDARY");
        institutionRepo.save(inst);

        var cls = new SchoolClass();
        cls.setInstitutionId(inst.getId());
        UUID ownerId = registerUserId("TEACHER");
        cls.setOwnerId(ownerId);
        cls.setName("Late Class");
        cls.setSubject("CHEMISTRY");
        cls.setLevel("SS3");
        cls.setJoinCode("CHE-SS3-LATE");
        classRepo.save(cls);

        Instant dueAt = Instant.now().minus(1, ChronoUnit.HOURS);
        var assignment = new Assignment();
        assignment.setClassId(cls.getId());
        assignment.setExperimentId("phy.pendulum.g");
        assignment.setExperimentVersion(1);
        assignment.setCreatedBy(ownerId);
        assignment.setMode("GRADED");
        assignment.setStatus("PUBLISHED");
        assignment.setNoiseLevel("REALISTIC");
        assignment.setAttemptsAllowed(2);
        assignment.setReleasePolicy("MANUAL");
        assignment.setOpensAt(dueAt.minus(2, ChronoUnit.HOURS));
        assignment.setDueAt(dueAt);
        assignmentRepo.save(assignment);

        UUID userId = registerUserId("STUDENT");
        var attempt = new Attempt();
        attempt.setUserId(userId);
        attempt.setAssignmentId(assignment.getId());
        attempt.setExperimentId("phy.pendulum.g");
        attempt.setExperimentVersion(1);
        attempt.setMode("GRADED");
        attempt.setSeed(new byte[16]);
        attemptRepo.save(attempt);

        // No clientSubmittedAt — normal late submission, should be rejected
        var req = new SubmitRequest(java.util.Map.of(), true, null);

        try {
            submissionService.submit(attempt.getId(), userId, req, null);
            org.junit.jupiter.api.Assertions.fail("Expected DUE_DATE_PASSED");
        } catch (ApiException e) {
            assertThat(e.getCode()).isEqualTo("DUE_DATE_PASSED");
        }
    }
}
