package org.vixir.attempt.event;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Events")
@RestController
@RequestMapping("/api/v1/attempts/{attemptId}/events")
public class EventController {

    private final EventIngestService ingestService;

    public EventController(EventIngestService ingestService) {
        this.ingestService = ingestService;
    }

    /** Batch ingest (Req 8.1). */
    @Operation(summary = "Upload a batch of attempt events", description = "Up to 200 events per batch. Idempotent by clientEventId, so offline sync can retry safely; duplicates are reported, not stored again. Own attempts only.")
    @PostMapping
    ResponseEntity<EventIngestService.IngestResult> ingest(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody EventIngestRequest req) {
        UUID userId = UUID.fromString(jwt.getSubject());
        var result = ingestService.ingest(attemptId, userId, req.events());
        return ResponseEntity.ok(result);
    }

    /** Fetch events for resume / bench replay (Req 8.6). */
    @Operation(summary = "Get attempt events", description = "For resume and bench replay. Pass afterSeq to fetch only newer events. Own attempts only.")
    @GetMapping
    List<AttemptEventResponse> get(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Integer afterSeq) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ingestService.getEvents(attemptId, userId, afterSeq).stream()
                .map(AttemptEventResponse::from).toList();
    }
}
