package org.vixir.review;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.vixir.marking.Mark;
import org.vixir.marking.MarkCriterion;

/**
 * A mark with its per-criterion results: the student's released report, and what a teacher gets back after
 * overriding a criterion or commenting.
 */
public record MarkReportResponse(MarkView mark, List<CriterionView> criteria) {

    /** The mark itself. Leaves out the internal id and which teacher reviewed it. */
    public record MarkView(
            UUID submissionId,
            int total,
            int maxTotal,
            String markerVersion,
            String teacherComment,
            boolean reviewed,
            Instant markedAt,
            Instant releasedAt
    ) {}

    public record CriterionView(String criterionKey, int awarded, int max, String reason, boolean overridden) {}

    public static MarkReportResponse from(Mark mark, List<MarkCriterion> criteria) {
        var view = new MarkView(mark.getSubmissionId(), mark.getTotal(), mark.getMaxTotal(), mark.getMarkerVersion(),
                mark.getTeacherComment(), mark.getReviewedBy() != null, mark.getMarkedAt(), mark.getReleasedAt());
        var criterionViews = criteria.stream()
                .sorted(java.util.Comparator.comparing(MarkCriterion::getCriterionKey))
                .map(c -> new CriterionView(c.getCriterionKey(), c.getAwarded(), c.getMax(), c.getReason(),
                        c.isOverridden()))
                .toList();
        return new MarkReportResponse(view, criterionViews);
    }
}
