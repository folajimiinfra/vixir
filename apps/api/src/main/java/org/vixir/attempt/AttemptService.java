package org.vixir.attempt;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.assignment.Assignment;
import org.vixir.assignment.AssignmentRepository;
import org.vixir.attempt.event.AttemptEventRepository;
import org.vixir.attempt.event.AttemptEvent;
import org.vixir.common.ApiException;
import org.vixir.common.AppClock;
import org.vixir.experiment.ExperimentRepository;
import org.vixir.experiment.ExperimentVersionRepository;
import org.vixir.school.EnrolmentRepository;

@Service
public class AttemptService {

    private final AttemptRepository attemptRepo;
    private final AssignmentRepository assignmentRepo;
    private final ExperimentRepository experimentRepo;
    private final ExperimentVersionRepository versionRepo;
    private final EnrolmentRepository enrolmentRepo;
    private final AttemptEventRepository eventRepo;
    private final AppClock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    public AttemptService(AttemptRepository attemptRepo,
                          AssignmentRepository assignmentRepo,
                          ExperimentRepository experimentRepo,
                          ExperimentVersionRepository versionRepo,
                          EnrolmentRepository enrolmentRepo,
                          AttemptEventRepository eventRepo,
                          AppClock clock) {
        this.attemptRepo = attemptRepo;
        this.assignmentRepo = assignmentRepo;
        this.experimentRepo = experimentRepo;
        this.versionRepo = versionRepo;
        this.enrolmentRepo = enrolmentRepo;
        this.eventRepo = eventRepo;
        this.clock = clock;
    }

    /** Start or resume a graded attempt for an assignment (Req 7.1–7.3). */
    @Transactional
    public AttemptBootstrap startOrResume(UUID userId, UUID assignmentId) {
        var assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> ApiException.notFound("ASSIGNMENT_NOT_FOUND", "Assignment not found"));

        // Must be published
        if (!"PUBLISHED".equals(assignment.getStatus())) {
            throw ApiException.conflict("ASSIGNMENT_NOT_OPEN", "Assignment is not published");
        }

        // Due date check (Req 6.5)
        if (clock.now().isAfter(assignment.getDueAt())) {
            throw ApiException.conflict("DUE_DATE_PASSED", "Assignment due date has passed");
        }

        // Student must be enrolled
        if (!enrolmentRepo.existsByIdClassIdAndIdUserId(assignment.getClassId(), userId)) {
            throw ApiException.notFound("ASSIGNMENT_NOT_FOUND", "Assignment not found");
        }

        // Req 7.3 — resume in-progress attempt
        var existing = attemptRepo.findByAssignmentIdAndUserIdAndState(assignmentId, userId, "IN_PROGRESS");
        if (existing.isPresent()) {
            var attempt = existing.get();
            var events = eventRepo.findByAttemptIdOrderBySeqAsc(attempt.getId());
            return bootstrapFor(attempt, assignment, events);
        }

        // Req 7.2 — attempt limit
        int used = attemptRepo.countAttemptsForAssignment(assignmentId, userId);
        if (assignment.getAttemptsAllowed() > 0 && used >= assignment.getAttemptsAllowed()) {
            throw ApiException.conflict("ATTEMPT_LIMIT_REACHED", "Attempt limit reached for this assignment");
        }

        var attempt = newAttempt(userId, assignment, used + 1);
        return bootstrapFor(attempt, assignment, List.of());
    }

    /** Free practice attempt — no assignment, any published experiment (Req 7.4). */
    @Transactional
    public AttemptBootstrap startPractice(UUID userId, String experimentId) {
        var experiment = experimentRepo.findById(experimentId)
                .orElseThrow(() -> ApiException.notFound("EXPERIMENT_NOT_FOUND", "Experiment not found"));
        if (experiment.getLatestPublishedVersion() == null) {
            throw ApiException.notFound("EXPERIMENT_NOT_FOUND", "No published version");
        }
        int version = experiment.getLatestPublishedVersion();
        var ev = versionRepo.findByExperimentIdAndVersion(experimentId, version).orElseThrow();

        var attempt = new Attempt();
        attempt.setUserId(userId);
        attempt.setExperimentId(experimentId);
        attempt.setExperimentVersion(version);
        attempt.setMode("PRACTICE");
        attempt.setSeed(randomSeed());
        attemptRepo.save(attempt);

        return new AttemptBootstrap(attempt.getId(), "PRACTICE", 1,
                Base64.getEncoder().encodeToString(attempt.getSeed()),
                new AttemptBootstrap.ExperimentRef(experimentId, version, ev.getConfig()),
                null);
    }

    /** Anonymous landing-page practice (Req 7.5). Token bound via cookie. */
    @Transactional
    public AttemptBootstrap startAnonymous(String experimentId, String anonTokenHash) {
        var experiment = experimentRepo.findById(experimentId)
                .orElseThrow(() -> ApiException.notFound("EXPERIMENT_NOT_FOUND", "Experiment not found"));
        if (experiment.getLatestPublishedVersion() == null) {
            throw ApiException.notFound("EXPERIMENT_NOT_FOUND", "No published version");
        }
        int version = experiment.getLatestPublishedVersion();
        var ev = versionRepo.findByExperimentIdAndVersion(experimentId, version).orElseThrow();

        var attempt = new Attempt();
        attempt.setExperimentId(experimentId);
        attempt.setExperimentVersion(version);
        attempt.setMode("PRACTICE");
        attempt.setSeed(randomSeed());
        attempt.setAnonTokenHash(anonTokenHash);
        attemptRepo.save(attempt);

        return new AttemptBootstrap(attempt.getId(), "PRACTICE", 1,
                Base64.getEncoder().encodeToString(attempt.getSeed()),
                new AttemptBootstrap.ExperimentRef(experimentId, version, ev.getConfig()),
                null);
    }

    public Attempt getForUser(UUID attemptId, UUID userId) {
        var attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found"));
        if (userId != null && !userId.equals(attempt.getUserId())) {
            throw ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found");
        }
        return attempt;
    }

    public List<Attempt> listForUser(UUID userId) {
        return attemptRepo.findByUserIdOrderByStartedAtDesc(userId);
    }

    // ---- helpers ----

    private Attempt newAttempt(UUID userId, Assignment assignment, int attemptNo) {
        var a = new Attempt();
        a.setUserId(userId);
        a.setAssignmentId(assignment.getId());
        a.setExperimentId(assignment.getExperimentId());
        a.setExperimentVersion(assignment.getExperimentVersion());
        a.setMode(assignment.getMode());
        a.setAttemptNo(attemptNo);
        a.setSeed(randomSeed());
        return attemptRepo.save(a);
    }

    private AttemptBootstrap bootstrapFor(Attempt attempt, Assignment assignment, List<AttemptEvent> events) {
        var ev = versionRepo.findByExperimentIdAndVersion(
                attempt.getExperimentId(), attempt.getExperimentVersion()).orElseThrow();

        AttemptBootstrap.ResumeInfo resume = null;
        if (!events.isEmpty()) {
            resume = new AttemptBootstrap.ResumeInfo(attempt.getLastEventSeq(),
                    events.stream().map(org.vixir.attempt.event.AttemptEventResponse::from).toList());
        }

        return new AttemptBootstrap(
                attempt.getId(), attempt.getMode(), attempt.getAttemptNo(),
                Base64.getEncoder().encodeToString(attempt.getSeed()),
                new AttemptBootstrap.ExperimentRef(attempt.getExperimentId(),
                        attempt.getExperimentVersion(), ev.getConfig()),
                resume);
    }

    private byte[] randomSeed() {
        byte[] seed = new byte[16];
        secureRandom.nextBytes(seed);
        return seed;
    }
}
