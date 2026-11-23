package org.vixir.submission;

import java.util.Map;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record SubmitRequest(
        @NotNull Map<String, Object> results,
        boolean declarationAccepted,
        Instant clientSubmittedAt
) {}
