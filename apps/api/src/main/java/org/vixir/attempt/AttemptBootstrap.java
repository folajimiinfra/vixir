package org.vixir.attempt;

import java.util.List;
import java.util.UUID;
import org.vixir.attempt.event.AttemptEvent;

/** Response shape for POST /attempts — contracts.md §2. */
public record AttemptBootstrap(
        UUID attemptId,
        String mode,
        int attemptNo,
        String seed,              // base64-encoded 16 bytes
        ExperimentRef experiment,
        ResumeInfo resume         // null for new attempts
) {
    public record ExperimentRef(String id, int version, Object config) {}
    public record ResumeInfo(int lastEventSeq, List<org.vixir.attempt.event.AttemptEventResponse> events) {}
}
