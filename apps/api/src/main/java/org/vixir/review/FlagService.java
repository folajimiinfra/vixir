package org.vixir.review;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.attempt.AttemptRepository;
import org.vixir.common.ApiException;
import org.vixir.marking.Mark;
import org.vixir.marking.MarkRepository;
import org.vixir.submission.Submission;
import org.vixir.submission.SubmissionRepository;

/**
 * Raises DUPLICATE_READINGS (Req 11.1) and OUTLIER_RESULT flags (Req 11.2).
 * Called by MarkingService after marking completes.
 */
@Service
public class FlagService {

    private final ReviewFlagRepository flagRepo;
    private final SubmissionRepository submissionRepo;
    private final AttemptRepository attemptRepo;
    private final MarkRepository markRepo;
    private final AuditLogRepository auditRepo;
    private final ReviewAccess access;

    public FlagService(ReviewFlagRepository flagRepo,
                       SubmissionRepository submissionRepo,
                       AttemptRepository attemptRepo,
                       MarkRepository markRepo,
                       AuditLogRepository auditRepo,
                       ReviewAccess access) {
        this.access = access;
        this.flagRepo = flagRepo;
        this.submissionRepo = submissionRepo;
        this.attemptRepo = attemptRepo;
        this.markRepo = markRepo;
        this.auditRepo = auditRepo;
    }

    /** Raise DUPLICATE_READINGS flag when two submissions share the same hash (Req 11.1). */
    @Transactional
    public void checkDuplicateReadings(UUID submissionId) {
        var submission = submissionRepo.findById(submissionId).orElse(null);
        if (submission == null) return;

        var attempt = attemptRepo.findById(submission.getAttemptId()).orElse(null);
        if (attempt == null || attempt.getAssignmentId() == null) return;

        List<Submission> duplicates = submissionRepo.findByAssignmentAndHash(
                attempt.getAssignmentId(), submission.getReadingsHash());

        if (duplicates.size() > 1) {
            for (Submission dup : duplicates) {
                boolean alreadyFlagged = flagRepo.findBySubmissionId(dup.getId()).stream()
                        .anyMatch(f -> "DUPLICATE_READINGS".equals(f.getType()));
                if (!alreadyFlagged) {
                    raiseFlag(dup.getId(), "DUPLICATE_READINGS",
                            Map.of("duplicateOf", submissionId.toString()));
                }
            }
        }
    }

    /** Raise OUTLIER_RESULT when implied value > 3 MADs from class median (Req 11.2). */
    @Transactional
    public void checkOutlier(UUID submissionId, UUID assignmentId) {
        // All mark totals for this assignment in one query (was: every submission on the platform, then N+1)
        List<Double> scores = markRepo.findTotalsByAssignmentId(assignmentId).stream()
                .map(Integer::doubleValue)
                .sorted()
                .toList();

        if (scores.size() < 4) return; // too few to compute meaningful outliers

        double median = percentile(scores, 50);
        List<Double> absDevs = scores.stream().map(v -> Math.abs(v - median)).sorted().toList();
        double mad = percentile(absDevs, 50);
        if (mad < 1e-10) return; // all identical — no outliers

        Mark mark = markRepo.findBySubmissionId(submissionId).orElse(null);
        if (mark == null) return;

        double z = Math.abs(mark.getTotal() - median) / mad;
        if (z > 3.0) {
            boolean alreadyFlagged = flagRepo.findBySubmissionId(submissionId).stream()
                    .anyMatch(f -> "OUTLIER_RESULT".equals(f.getType()));
            if (!alreadyFlagged) {
                raiseFlag(submissionId, "OUTLIER_RESULT",
                        Map.of("score", mark.getTotal(), "classMedian", median, "madZ", z));
            }
        }
    }

    /** Resolve a flag with a note (Req 11.3). */
    @Transactional
    public ReviewFlag resolve(UUID flagId, UUID resolverId, String note) {
        var flag = flagRepo.findById(flagId)
                .orElseThrow(() -> ApiException.notFound("FLAG_NOT_FOUND", "Flag not found"));
        access.requireTeacherOfSubmission(flag.getSubmissionId(), resolverId, "FLAG_NOT_FOUND");
        flag.setStatus("RESOLVED");
        flag.setResolvedBy(resolverId);
        flagRepo.save(flag);

        var audit = new AuditLog();
        audit.setActorId(resolverId);
        audit.setAction("FLAG_RESOLVED");
        audit.setEntityType("review_flag");
        audit.setEntityId(flagId.toString());
        audit.setDetail(Map.of("note", note != null ? note : ""));
        auditRepo.save(audit);

        return flag;
    }

    /** Package-visible accessor for the controller. */
    ReviewFlagRepository flagRepo() { return flagRepo; }

    // ---- helpers ----

    private void raiseFlag(UUID submissionId, String type, Map<String, Object> detail) {
        var flag = new ReviewFlag();
        flag.setSubmissionId(submissionId);
        flag.setType(type);
        flag.setDetail(detail);
        flagRepo.save(flag);
    }

    private double percentile(List<Double> sorted, int pct) {
        if (sorted.isEmpty()) return 0;
        int idx = (int) Math.ceil(pct / 100.0 * sorted.size()) - 1;
        return sorted.get(Math.max(0, Math.min(idx, sorted.size() - 1)));
    }
}
