package org.vixir.vix;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Vix")
@RestController
@RequestMapping("/api/v1/vix")
public class VixController {

    private final VixSessionService sessionService;
    private final org.vixir.experiment.TourService tourService;

    public VixController(VixSessionService sessionService, org.vixir.experiment.TourService tourService) {
        this.sessionService = sessionService;
        this.tourService = tourService;
    }

    /** Bootstrap a Vix session (Req 13.1). */
    @Operation(summary = "Start a Vix session", description = "Returns a LiveKit room token. Refused for exam-mode attempts and when the institution has disabled Vix; the client should then fall back to the scripted tour.")
    @ApiResponse(responseCode = "201", description = "Session bootstrap")
    @PostMapping("/sessions")
    ResponseEntity<VixSessionService.VixBootstrap> bootstrap(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody VixBootstrapRequest req) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sessionService.bootstrap(userId, req));
    }

    /** Student ends their own session. */
    @Operation(summary = "End my Vix session", description = "Optional body with the number of turns, e.g. turns: 12.")
    @ApiResponse(responseCode = "204", description = "Ended")
    @PostMapping("/sessions/{id}/end")
    ResponseEntity<Void> end(@PathVariable UUID id,
                              @AuthenticationPrincipal Jwt jwt,
                              @RequestBody(required = false) Map<String, Object> body) {
        int turns = body != null && body.containsKey("turns")
                ? ((Number) body.get("turns")).intValue() : 0;
        sessionService.endSession(id, UUID.fromString(jwt.getSubject()), turns);
        return ResponseEntity.noContent().build();
    }

    /** Scripted tours — public, cacheable (Req 13.7). */
    @Operation(summary = "Get the scripted tour for a screen", description = "Public, cacheable for 1 hour. Steps come from the tours section of the latest published experiment config. Pass experimentId to choose an experiment; otherwise the first published experiment (by id) with a tour for the screen is used. 404 TOUR_NOT_FOUND when no experiment has one.")
    @SecurityRequirements()
    @GetMapping("/tours/{screenCode}")
    ResponseEntity<org.vixir.experiment.TourService.Tour> tour(
            @PathVariable String screenCode,
            @RequestParam(required = false) String experimentId) {
        return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=3600")
                .body(tourService.tour(screenCode, experimentId));
    }
}
