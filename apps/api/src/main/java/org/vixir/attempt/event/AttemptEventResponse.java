package org.vixir.attempt.event;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** A logged attempt event, in the AttemptEvent shape of contracts.md §3 plus the server timestamp. */
public record AttemptEventResponse(
        UUID clientEventId,
        int seq,
        String type,
        Long simTimeMs,
        Instant clientTs,
        Instant serverTs,
        Map<String, Object> payload
) {
    public static AttemptEventResponse from(AttemptEvent e) {
        return new AttemptEventResponse(e.getClientEventId(), e.getSeq(), e.getType(), e.getSimTimeMs(),
                e.getClientTs(), e.getServerTs(), e.getPayload());
    }
}
