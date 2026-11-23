package org.vixir.attempt;

import java.time.Instant;
import java.util.UUID;

/**
 * An attempt as returned by GET /attempts/{id}. Leaves out the seed (the client gets it once, from the
 * start/resume bootstrap), the anonymous-token hash, the device id and the owner id.
 */
public record AttemptResponse(
        UUID id,
        UUID assignmentId,
        String experimentId,
        int experimentVersion,
        String mode,
        int attemptNo,
        String state,
        int lastEventSeq,
        Instant startedAt,
        Instant submittedAt
) {
    public static AttemptResponse from(Attempt a) {
        return new AttemptResponse(a.getId(), a.getAssignmentId(), a.getExperimentId(), a.getExperimentVersion(),
                a.getMode(), a.getAttemptNo(), a.getState(), a.getLastEventSeq(), a.getStartedAt(),
                a.getSubmittedAt());
    }
}
