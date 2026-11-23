package org.vixir.attempt.event;

import java.util.Map;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EventIngestRequest(
        @NotNull @Size(max = 200) List<EventDto> events
) {
    public record EventDto(
            @NotNull UUID clientEventId,
            int seq,
            @NotNull String type,
            Long simTimeMs,
            Instant clientTs,
            Map<String, Object> payload
    ) {}
}
