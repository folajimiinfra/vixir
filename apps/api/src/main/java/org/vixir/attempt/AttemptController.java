package org.vixir.attempt;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vixir.common.ApiException;

@Tag(name = "Attempts")
@RestController
@RequestMapping("/api/v1/attempts")
public class AttemptController {

    private static final String ANON_COOKIE = "vx_anon";

    private final AttemptService attemptService;

    public AttemptController(AttemptService attemptService) {
        this.attemptService = attemptService;
    }

    /** Start or resume a graded attempt (Req 7.1–7.3) or free practice (Req 7.4). */
    @Operation(summary = "Start or resume an attempt", description = "Send assignmentId to start or resume a graded attempt, or experimentId for free practice. Returns the seed and experiment config; for a resumed attempt, also the events logged so far.")
    @ApiResponse(responseCode = "201", description = "Attempt bootstrap")
    @PostMapping
    ResponseEntity<AttemptBootstrap> start(@AuthenticationPrincipal Jwt jwt,
                                            @RequestBody StartAttemptRequest req) {
        UUID userId = UUID.fromString(jwt.getSubject());
        AttemptBootstrap bootstrap;
        if (req.assignmentId() != null) {
            bootstrap = attemptService.startOrResume(userId, req.assignmentId());
        } else if (req.experimentId() != null) {
            bootstrap = attemptService.startPractice(userId, req.experimentId());
        } else {
            throw ApiException.unprocessable("MISSING_FIELDS", "Either assignmentId or experimentId required");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(bootstrap);
    }

    /** Anonymous practice from the landing page (Req 7.5). */
    @Operation(summary = "Start anonymous practice", description = "Public (landing page). Sets or reads the httpOnly vx_anon cookie that identifies the anonymous user.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"experimentId\": \"phy.pendulum.g\"}")))
    @ApiResponse(responseCode = "201", description = "Attempt bootstrap")
    @SecurityRequirements()
    @PostMapping("/anonymous")
    ResponseEntity<AttemptBootstrap> startAnonymous(@RequestBody Map<String, String> body,
                                                      HttpServletRequest req,
                                                      HttpServletResponse res) {
        String experimentId = body.get("experimentId");
        if (experimentId == null || experimentId.isBlank()) {
            throw ApiException.unprocessable("MISSING_FIELDS", "experimentId required");
        }

        String anonToken = getOrCreateAnonToken(req, res);
        String tokenHash = sha256(anonToken);
        var bootstrap = attemptService.startAnonymous(experimentId, tokenHash);
        return ResponseEntity.status(HttpStatus.CREATED).body(bootstrap);
    }

    @Operation(summary = "List the authenticated student's own attempts", description = "Returns all attempts (IN_PROGRESS and SUBMITTED) for the current student, newest first.")
    @GetMapping("/me")
    ResponseEntity<List<AttemptResponse>> listMine(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                attemptService.listForUser(userId).stream().map(AttemptResponse::from).toList());
    }

    @Operation(summary = "Get an attempt", description = "Own attempts only.")
    @GetMapping("/{id}")
    ResponseEntity<AttemptResponse> get(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        UUID userId = jwt != null ? UUID.fromString(jwt.getSubject()) : null;
        return ResponseEntity.ok(AttemptResponse.from(attemptService.getForUser(id, userId)));
    }

    // ---- helpers ----

    private String getOrCreateAnonToken(HttpServletRequest req, HttpServletResponse res) {
        if (req.getCookies() != null) {
            var existing = Arrays.stream(req.getCookies())
                    .filter(c -> ANON_COOKIE.equals(c.getName()))
                    .findFirst();
            if (existing.isPresent()) return existing.get().getValue();
        }
        // Create a new random token
        byte[] raw = new byte[24];
        new java.security.SecureRandom().nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        var cookie = new Cookie(ANON_COOKIE, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/v1/attempts/anonymous");
        cookie.setMaxAge(24 * 60 * 60);
        cookie.setAttribute("SameSite", "Lax");
        res.addCookie(cookie);
        return token;
    }

    private static String sha256(String input) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(
                    digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public record StartAttemptRequest(UUID assignmentId, String experimentId) {}
}
