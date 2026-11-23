package org.vixir.submission;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Submissions")
@RestController
@RequestMapping("/api/v1/attempts/{attemptId}")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    /** POST /api/v1/attempts/{id}/submit — Req 9.1, 9.5. Returns 202 within 500 ms. */
    @Operation(summary = "Submit an attempt for marking", description = "Returns 202 at once; marking runs in the background. Send an Idempotency-Key header so retries do not create duplicate submissions. Own attempts only.")
    @ApiResponse(responseCode = "202", description = "Accepted for marking", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"submissionId\": \"3f6c2a1e-5b7d-4c11-9a0e-2d4f8b9c1a23\"}")))
    @PostMapping("/submit")
    ResponseEntity<Map<String, Object>> submit(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody SubmitRequest req) {

        UUID userId = UUID.fromString(jwt.getSubject());
        var submission = submissionService.submit(attemptId, userId, req, idempotencyKey);
        return ResponseEntity.accepted()
                .body(Map.of("submissionId", submission.getId().toString()));
    }
}
