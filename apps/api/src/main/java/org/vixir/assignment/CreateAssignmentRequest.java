package org.vixir.assignment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record CreateAssignmentRequest(
        @NotNull UUID classId,
        @NotBlank String experimentId,
        @NotNull int experimentVersion,
        @NotBlank String mode,
        String instructions,
        String noiseLevel,
        Integer attemptsAllowed,
        String releasePolicy,
        @NotNull Instant opensAt,
        @NotNull Instant dueAt
) {}
