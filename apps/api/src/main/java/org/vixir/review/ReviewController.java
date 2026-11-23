package org.vixir.review;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vixir.assignment.AssignmentService;
import org.vixir.common.ApiException;

@Tag(name = "Review")
@RestController
@RequestMapping("/api/v1")
public class ReviewController {

    private final ReleaseService releaseService;
    private final AnalyticsService analyticsService;
    private final FlagService flagService;
    private final AssignmentService assignmentService;

    public ReviewController(ReleaseService releaseService,
                             AnalyticsService analyticsService,
                             FlagService flagService,
                             AssignmentService assignmentService) {
        this.releaseService = releaseService;
        this.analyticsService = analyticsService;
        this.flagService = flagService;
        this.assignmentService = assignmentService;
    }

    // ---- Student report (Req 12.6) ----

    @Operation(summary = "Get my marked report", description = "Student, own attempt only, and only after the teacher has released marks (404 before that).")
    @GetMapping("/attempts/{id}/report")
    MarkReportResponse report(@PathVariable UUID id,
                                          @AuthenticationPrincipal Jwt jwt) {
        return releaseService.getReport(id, uid(jwt));
    }

    // ---- Teacher results (Req 12.1) ----

    @Operation(summary = "Get assignment results", description = "Teacher (owner or co-teacher). Per-student state and score, score histogram, per-criterion averages, open flag count.")
    @GetMapping("/assignments/{id}/results")
    AnalyticsService.AssignmentResults results(@PathVariable UUID id,
                                                @AuthenticationPrincipal Jwt jwt) {
        // Ownership check
        var assignment = assignmentService.get(id, uid(jwt));
        return analyticsService.resultsForAssignment(assignment);
    }

    // ---- Analytics (Req 12.2) ----

    @Operation(summary = "Get assignment analytics", description = "Teacher (owner or co-teacher). Results plus the most common reasons marks were lost.")
    @GetMapping("/assignments/{id}/analytics")
    Map<String, Object> analytics(@PathVariable UUID id,
                                   @AuthenticationPrincipal Jwt jwt) {
        var assignment = assignmentService.get(id, uid(jwt)); // ownership
        var results = analyticsService.resultsForAssignment(assignment);
        var mistakes = analyticsService.commonMistakes(id);
        return Map.of("results", results, "commonMistakes", mistakes);
    }

    // ---- Override / comment (Req 12.3–12.4) ----

    @Operation(summary = "Override a criterion score or add a comment", description = "Send either criterionKey + score + reason to override one criterion (the total is recomputed and the change is audited), or comment to set the teacher comment.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(mediaType = "application/json", examples = {
            @ExampleObject(name = "override", value = "{\"criterionKey\": \"sig_figs\", \"score\": 2, \"reason\": \"Accepted 3 s.f.\"}"),
            @ExampleObject(name = "comment", value = "{\"comment\": \"Good graph, check your units.\"}")}))
    @PatchMapping("/submissions/{id}/mark")
    ResponseEntity<MarkReportResponse> patchMark(@PathVariable UUID id,
                                      @AuthenticationPrincipal Jwt jwt,
                                      @RequestBody Map<String, Object> body) {
        UUID teacherId = uid(jwt);
        if (body.containsKey("criterionKey")) {
            if (!(body.get("criterionKey") instanceof String key) || key.isBlank()) {
                throw ApiException.unprocessable("INVALID_CRITERION_KEY", "criterionKey must be a non-empty string");
            }
            if (!(body.get("score") instanceof Number n) || n.doubleValue() != Math.rint(n.doubleValue())) {
                throw ApiException.unprocessable("INVALID_SCORE", "score must be a whole number");
            }
            String reason = body.get("reason") instanceof String r ? r : "";
            var mark = releaseService.overrideCriterion(id, key, n.intValue(), reason, teacherId);
            return ResponseEntity.ok(releaseService.reportFor(mark));
        }
        if (body.containsKey("comment")) {
            if (!(body.get("comment") instanceof String comment)) {
                throw ApiException.unprocessable("INVALID_COMMENT", "comment must be a string");
            }
            var mark = releaseService.addComment(id, comment, teacherId);
            return ResponseEntity.ok(releaseService.reportFor(mark));
        }
        throw ApiException.unprocessable("MISSING_FIELDS", "Send criterionKey and score, or comment");
    }

    // ---- Release (Req 12.5) ----

    @Operation(summary = "Release marks to students", description = "Teacher (owner or co-teacher). Moves every MARKED attempt to RELEASED.")
    @ApiResponse(responseCode = "204", description = "Released")
    @PostMapping("/assignments/{id}/release")
    ResponseEntity<Void> release(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        assignmentService.get(id, uid(jwt)); // ownership
        releaseService.releaseAssignment(id, uid(jwt));
        return ResponseEntity.noContent().build();
    }

    // ---- Flags (Req 11.3) ----

    @Operation(summary = "List open review flags", description = "Teacher (owner or co-teacher). Flags such as duplicate readings or statistical outliers.")
    @GetMapping("/assignments/{id}/flags")
    List<FlagResponse> flags(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        assignmentService.get(id, uid(jwt)); // ownership
        return flagService.flagRepo().findOpenFlagsForAssignment(id).stream().map(FlagResponse::from).toList();
    }

    @Operation(summary = "Resolve a review flag")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"note\": \"Checked with the student, readings are genuine.\"}")))
    @PatchMapping("/flags/{id}")
    FlagResponse resolveFlag(@PathVariable UUID id,
                            @AuthenticationPrincipal Jwt jwt,
                            @RequestBody Map<String, String> body) {
        return FlagResponse.from(flagService.resolve(id, uid(jwt), body.get("note")));
    }

    private UUID uid(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }
}
