package org.vixir.review;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** A review flag for teachers (duplicate readings, outlier result, ...). */
public record FlagResponse(
        UUID id,
        UUID submissionId,
        String type,
        Map<String, Object> detail,
        String status,
        UUID resolvedBy,
        Instant createdAt
) {
    public static FlagResponse from(ReviewFlag f) {
        return new FlagResponse(f.getId(), f.getSubmissionId(), f.getType(), f.getDetail(), f.getStatus(),
                f.getResolvedBy(), f.getCreatedAt());
    }
}
