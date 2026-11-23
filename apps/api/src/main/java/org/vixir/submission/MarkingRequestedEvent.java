package org.vixir.submission;

import java.util.UUID;

/** Published when a submission is stored; consumed by MarkingService. */
public record MarkingRequestedEvent(UUID submissionId) {}
