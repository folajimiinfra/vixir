package org.vixir.review;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.attempt.Attempt;
import org.vixir.attempt.AttemptRepository;
import org.vixir.common.ApiException;
import org.vixir.marking.Mark;
import org.vixir.marking.MarkCriterion;
import org.vixir.marking.MarkCriterionRepository;
import org.vixir.marking.MarkRepository;
import org.vixir.submission.SubmissionRepository;

/**
 * Teacher mark override, comment, release (Req 12.3–12.6).
 */
@Service
public class ReleaseService {

    private final AttemptRepository attemptRepo;
    private final SubmissionRepository submissionRepo;
    private final MarkRepository markRepo;
    private final MarkCriterionRepository criterionRepo;
    private final AuditLogRepository auditRepo;
    private final ReviewAccess access;

    public ReleaseService(AttemptRepository attemptRepo,
                          SubmissionRepository submissionRepo,
                          MarkRepository markRepo,
                          MarkCriterionRepository criterionRepo,
                          AuditLogRepository auditRepo,
                          ReviewAccess access) {
        this.attemptRepo = attemptRepo;
        this.submissionRepo = submissionRepo;
        this.markRepo = markRepo;
        this.criterionRepo = criterionRepo;
        this.auditRepo = auditRepo;
        this.access = access;
    }

    /** Override a criterion score (Req 12.3). */
    @Transactional
    public Mark overrideCriterion(UUID submissionId, String criterionKey, int newScore,
                                   String reason, UUID teacherId) {
        access.requireTeacherOfSubmission(submissionId, teacherId, "MARK_NOT_FOUND");
        var mark = markRepo.findBySubmissionId(submissionId)
                .orElseThrow(() -> ApiException.notFound("MARK_NOT_FOUND", "Mark not found"));

        MarkCriterion mc = criterionRepo.findByMarkId(mark.getId()).stream()
                .filter(c -> c.getCriterionKey().equals(criterionKey))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("CRITERION_NOT_FOUND", "Criterion not found"));

        if (newScore < 0 || newScore > mc.getMax()) {
            throw ApiException.unprocessable("SCORE_OUT_OF_RANGE",
                    "score must be between 0 and " + mc.getMax() + " for criterion " + criterionKey);
        }
        mc.setAwarded(newScore);
        mc.setReason(reason);
        mc.setOverridden(true);
        criterionRepo.save(mc);

        // Recompute total
        int newTotal = criterionRepo.findByMarkId(mark.getId()).stream()
                .mapToInt(MarkCriterion::getAwarded).sum();
        mark.setTotal(newTotal);
        mark.setReviewedBy(teacherId);
        markRepo.save(mark);

        // Audit log
        var audit = new AuditLog();
        audit.setActorId(teacherId);
        audit.setAction("MARK_OVERRIDDEN");
        audit.setEntityType("submission");
        audit.setEntityId(submissionId.toString());
        audit.setDetail(Map.of("criterionKey", criterionKey, "newScore", newScore, "reason", reason));
        auditRepo.save(audit);

        return mark;
    }

    /** Add or update teacher comment (Req 12.4). */
    @Transactional
    public Mark addComment(UUID submissionId, String comment, UUID teacherId) {
        access.requireTeacherOfSubmission(submissionId, teacherId, "MARK_NOT_FOUND");
        var mark = markRepo.findBySubmissionId(submissionId)
                .orElseThrow(() -> ApiException.notFound("MARK_NOT_FOUND", "Mark not found"));
        mark.setTeacherComment(comment);
        mark.setReviewedBy(teacherId);
        return markRepo.save(mark);
    }

    /** Release all MARKED attempts for an assignment (Req 12.5). */
    @Transactional
    public void releaseAssignment(UUID assignmentId, UUID teacherId) {
        Instant now = Instant.now();
        List<Attempt> attempts = attemptRepo.findByAssignmentId(assignmentId);
        for (Attempt attempt : attempts) {
            if (!"MARKED".equals(attempt.getState())) continue;
            attempt.setState("RELEASED");
            attemptRepo.save(attempt);

            submissionRepo.findByAttemptId(attempt.getId()).ifPresent(s ->
                    markRepo.findBySubmissionId(s.getId()).ifPresent(m -> {
                        m.setReleasedAt(now);
                        markRepo.save(m);
                    }));
        }

        var audit = new AuditLog();
        audit.setActorId(teacherId);
        audit.setAction("MARKS_RELEASED");
        audit.setEntityType("assignment");
        audit.setEntityId(assignmentId.toString());
        audit.setDetail(Map.of());
        auditRepo.save(audit);
    }

    /** Student reads their own report only when attempt is RELEASED (Req 12.6). */
    public MarkReportResponse getReport(UUID attemptId, UUID requesterId) {
        var attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found"));

        if (!requesterId.equals(attempt.getUserId())) {
            throw ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found");
        }
        if (!"RELEASED".equals(attempt.getState())) {
            throw ApiException.notFound("ATTEMPT_NOT_FOUND", "Report not yet released");
        }

        var submission = submissionRepo.findByAttemptId(attemptId)
                .orElseThrow(() -> ApiException.notFound("SUBMISSION_NOT_FOUND", "Submission not found"));
        var mark = markRepo.findBySubmissionId(submission.getId())
                .orElseThrow(() -> ApiException.notFound("MARK_NOT_FOUND", "Mark not found"));
        return reportFor(mark);
    }

    /** A mark with its criteria, as returned to clients. */
    public MarkReportResponse reportFor(Mark mark) {
        return MarkReportResponse.from(mark, criterionRepo.findByMarkId(mark.getId()));
    }

}
