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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.vixir.attempt.AttemptRepository;
import org.vixir.auth.AppUserRepository;
import org.vixir.auth.TokenService;
import org.vixir.common.ApiException;
import org.vixir.experiment.ExperimentVersionRepository;

/**
 * Service-to-service endpoints for the Vix Python agent (Req 13.5–13.6).
 * Secured by service JWT (scope=vix-agent) validated in the filter below.
 */
@Tag(name = "Internal (Vix agent)")
@SecurityRequirement(name = "serviceToken")
@RestController
@RequestMapping("/api/v1/internal/vix/sessions")
public class InternalVixController {

    private final VixSessionService sessionService;
    private final AppUserRepository userRepo;
    private final AttemptRepository attemptRepo;
    private final ExperimentVersionRepository versionRepo;
    private final TokenService tokenService;

    public InternalVixController(VixSessionService sessionService,
                                  AppUserRepository userRepo,
                                  AttemptRepository attemptRepo,
                                  ExperimentVersionRepository versionRepo,
                                  TokenService tokenService) {
        this.sessionService = sessionService;
        this.userRepo = userRepo;
        this.attemptRepo = attemptRepo;
        this.versionRepo = versionRepo;
        this.tokenService = tokenService;
    }

    /** Req 13.5 — agent context. Never returns seed or hidden values in GRADED mode. */
    @Operation(summary = "Get session context for the agent", description = "Mode, locale, the student's first name and the experiment id and version. Never includes the seed, hidden values or readings.")
    @GetMapping("/{id}/context")
    ResponseEntity<Map<String, Object>> context(@PathVariable UUID id,
                                                 @RequestHeader("Authorization") String authHeader) {
        validateServiceToken(authHeader);
        var session = sessionService.getSession(id);
        var user = userRepo.findById(session.getUserId())
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));

        Map<String, Object> experimentContext = Map.of();
        if (session.getAttemptId() != null) {
            var attempt = attemptRepo.findById(session.getAttemptId()).orElse(null);
            if (attempt != null) {
                var ev = versionRepo.findByExperimentIdAndVersion(
                        attempt.getExperimentId(), attempt.getExperimentVersion()).orElse(null);
                if (ev != null) {
                    // Req 13.5 — never return seed, hidden values or readings in GRADED mode
                    experimentContext = Map.of(
                            "id", attempt.getExperimentId(),
                            "version", attempt.getExperimentVersion()
                    );
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "mode", session.getMode(),
                "locale", session.getLocale(),
                "firstName", user.getFirstName(),
                "experiment", experimentContext
        ));
    }

    /** Req 13.6 — store a message (only when transcript retained). */
    @Operation(summary = "Store a transcript message", description = "Stored only when the school has enabled transcript retention.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"role\": \"VIX\", \"text\": \"What do you notice about the period?\", \"policyBlocked\": false}")))
    @ApiResponse(responseCode = "204", description = "Stored or ignored")
    @PostMapping("/{id}/messages")
    ResponseEntity<Void> message(@PathVariable UUID id,
                                  @RequestHeader("Authorization") String authHeader,
                                  @RequestBody Map<String, Object> body) {
        validateServiceToken(authHeader);
        String role     = (String) body.getOrDefault("role", "VIX");
        String text     = (String) body.getOrDefault("text", "");
        boolean blocked = Boolean.TRUE.equals(body.get("policyBlocked"));
        sessionService.storeMessage(id, role, text, blocked);
        return ResponseEntity.noContent().build();
    }

    /** Agent signals end of session. */
    @Operation(summary = "End a session from the agent")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"turns\": 12}")))
    @ApiResponse(responseCode = "204", description = "Ended")
    @PostMapping("/{id}/end")
    ResponseEntity<Void> end(@PathVariable UUID id,
                              @RequestHeader("Authorization") String authHeader,
                              @RequestBody Map<String, Object> body) {
        validateServiceToken(authHeader);
        int turns = body.containsKey("turns") ? ((Number) body.get("turns")).intValue() : 0;
        var session = sessionService.getSession(id);
        sessionService.endSession(id, session.getUserId(), turns);
        return ResponseEntity.noContent().build();
    }

    // ---- helpers ----

    private void validateServiceToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw ApiException.unauthorized("MISSING_SERVICE_TOKEN", "Service token required");
        }
        tokenService.parseServiceToken(authHeader.substring(7));
    }
}
