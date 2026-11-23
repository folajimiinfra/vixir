package org.vixir.assignment;

import java.time.Instant;
import java.util.UUID;

public record AssignmentResponse(
        UUID id,
        UUID classId,
        String experimentId,
        int experimentVersion,
        String mode,
        String status,
        String noiseLevel,
        int attemptsAllowed,
        String releasePolicy,
        Instant opensAt,
        Instant dueAt,
        Instant createdAt
) {
    public static AssignmentResponse from(Assignment a) {
        return new AssignmentResponse(a.getId(), a.getClassId(), a.getExperimentId(),
                a.getExperimentVersion(), a.getMode(), a.getStatus(), a.getNoiseLevel(),
                a.getAttemptsAllowed(), a.getReleasePolicy(), a.getOpensAt(), a.getDueAt(),
                a.getCreatedAt());
    }
}
