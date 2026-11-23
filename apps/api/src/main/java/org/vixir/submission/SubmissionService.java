package org.vixir.submission;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.assignment.Assignment;
import org.vixir.assignment.AssignmentRepository;
import org.vixir.attempt.Attempt;
import org.vixir.attempt.AttemptRepository;
import org.vixir.attempt.event.ReadingRepository;
import org.vixir.common.ApiException;
import org.vixir.common.AppClock;

/**
 * Validates, locks and stores a submission, computes readings_hash, enqueues marking (Req 9).
 */
@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepo;
    private final AttemptRepository attemptRepo;
    private final AssignmentRepository assignmentRepo;
    private final ReadingRepository readingRepo;
    private final ApplicationEventPublisher events;
    private final AppClock clock;
    private final ObjectMapper mapper;

    public SubmissionService(SubmissionRepository submissionRepo,
                              AttemptRepository attemptRepo,
                              AssignmentRepository assignmentRepo,
                              ReadingRepository readingRepo,
                              ApplicationEventPublisher events,
                              AppClock clock,
                              ObjectMapper mapper) {
        this.submissionRepo = submissionRepo;
        this.attemptRepo = attemptRepo;
        this.assignmentRepo = assignmentRepo;
        this.readingRepo = readingRepo;
        this.events = events;
        this.clock = clock;
        this.mapper = mapper;
    }

    @Transactional
    public Submission submit(UUID attemptId, UUID userId, SubmitRequest req, String idempotencyKey) {
        // Req 9.6 — idempotency
        if (idempotencyKey != null) {
            var existing = submissionRepo.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) return existing.get();
        }

        var attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found"));

        // Ownership
        if (!userId.equals(attempt.getUserId())) {
            throw ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found");
        }

        // Must be IN_PROGRESS
        if (!"IN_PROGRESS".equals(attempt.getState())) {
            throw ApiException.conflict("ATTEMPT_LOCKED", "Attempt is already submitted");
        }

        // Req 9.2 — declaration required
        if (!req.declarationAccepted()) {
            throw ApiException.unprocessable("DECLARATION_REQUIRED", "Declaration must be accepted to submit");
        }

        Instant now = clock.now();
        boolean late = false;

        // Due date logic (Req 9.4 offline late)
        if (attempt.getAssignmentId() != null) {
            var assignment = assignmentRepo.findById(attempt.getAssignmentId()).orElse(null);
            if (assignment != null) {
                if (now.isAfter(assignment.getDueAt())) {
                    // Check offline case: client_submitted_at before due_at
                    Instant clientTs = req.clientSubmittedAt();
                    if (clientTs != null && clientTs.isBefore(assignment.getDueAt())) {
                        late = false; // Req 9.4 — not late, but needs review flag
                    } else {
                        // Req 6.5 — refuse normal late submission
                        throw ApiException.conflict("DUE_DATE_PASSED", "Assignment due date has passed");
                    }
                }
            }
        }

        // Req 9.3 — compute readings_hash
        String readingsHash = computeReadingsHash(attemptId);

        // Lock attempt
        attempt.setState("SUBMITTED");
        attempt.setSubmittedAt(now);
        attempt.setClientSubmittedAt(req.clientSubmittedAt());
        attemptRepo.save(attempt);

        // Store submission
        var submission = new Submission();
        submission.setAttemptId(attemptId);
        submission.setResults(req.results());
        submission.setReadingsHash(readingsHash);
        submission.setDeclarationAccepted(true);
        submission.setLate(late);
        if (idempotencyKey != null) submission.setIdempotencyKey(idempotencyKey);
        submissionRepo.save(submission);

        // Req 9.5 — enqueue marking
        events.publishEvent(new MarkingRequestedEvent(submission.getId()));

        return submission;
    }

    // ---- helpers ----

    private String computeReadingsHash(UUID attemptId) {
        try {
            var readings = readingRepo.findByAttemptIdOrderByRowIndexAsc(attemptId);
            // Normalise: sort rows by rowIndex, serialise values consistently
            var normalised = mapper.writeValueAsString(readings.stream()
                    .map(r -> new Object[] { r.getRowIndex(), r.getValues() })
                    .toList());
            var digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(
                    digest.digest(normalised.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute readings hash", e);
        }
    }
}
