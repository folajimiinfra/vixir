package org.vixir.auth;

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
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vixir.common.ApiException;

/**
 * Authentication endpoints (Req 1).
 * Access token returned in body; refresh token in httpOnly Secure SameSite=Lax cookie `vx_refresh`.
 */
@Tag(name = "Auth")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String REFRESH_COOKIE = "vx_refresh";
    private static final int REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

    private final AuthService authService;
    private final AppUserRepository userRepo;

    public AuthController(AuthService authService, AppUserRepository userRepo) {
        this.authService = authService;
        this.userRepo = userRepo;
    }

    @Operation(summary = "Register with email and password", description = "Creates a STUDENT, TEACHER or ADMIN account. A STUDENT may pass classCode to join a class at sign-up. Rate limited.")
    @ApiResponse(responseCode = "201", description = "Access token in body; refresh token set as vx_refresh cookie", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"accessToken\": \"eyJ...\", \"tokenType\": \"Bearer\"}")))
    @SecurityRequirements()
    @PostMapping("/register")
    ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest req,
                                                  HttpServletResponse res) {
        var pair = authService.register(req);
        setRefreshCookie(res, pair.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(tokenBody(pair.accessToken()));
    }

    @Operation(summary = "Sign in with email and password", description = "Rate limited.")
    @ApiResponse(responseCode = "200", description = "Access token in body; refresh token set as vx_refresh cookie", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"accessToken\": \"eyJ...\", \"tokenType\": \"Bearer\"}")))
    @SecurityRequirements()
    @PostMapping("/login")
    ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req,
                                               HttpServletResponse res) {
        var pair = authService.login(req);
        setRefreshCookie(res, pair.refreshToken());
        return ResponseEntity.ok(tokenBody(pair.accessToken()));
    }

    @Operation(summary = "Sign in with a Google ID token", description = "Creates a STUDENT account on first sign-in.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"idToken\": \"<google-id-token>\"}")))
    @ApiResponse(responseCode = "200", description = "Access token in body; refresh token set as vx_refresh cookie", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"accessToken\": \"eyJ...\", \"tokenType\": \"Bearer\"}")))
    @SecurityRequirements()
    @PostMapping("/google")
    ResponseEntity<Map<String, Object>> google(@RequestBody Map<String, String> body,
                                                HttpServletResponse res) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.isBlank()) {
            throw ApiException.unprocessable("MISSING_ID_TOKEN", "idToken is required");
        }
        var pair = authService.googleSignIn(idToken);
        setRefreshCookie(res, pair.refreshToken());
        return ResponseEntity.ok(tokenBody(pair.accessToken()));
    }

    @Operation(summary = "Rotate tokens using the refresh cookie", description = "Reads the vx_refresh cookie, returns a new access token and sets a new refresh cookie.")
    @ApiResponse(responseCode = "200", description = "Access token in body; refresh token set as vx_refresh cookie", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"accessToken\": \"eyJ...\", \"tokenType\": \"Bearer\"}")))
    @SecurityRequirement(name = "refreshCookie")
    @PostMapping("/refresh")
    ResponseEntity<Map<String, Object>> refresh(HttpServletRequest req, HttpServletResponse res) {
        String refreshToken = extractRefreshCookie(req);
        var pair = authService.refresh(refreshToken);
        setRefreshCookie(res, pair.refreshToken());
        return ResponseEntity.ok(tokenBody(pair.accessToken()));
    }

    @Operation(summary = "Sign out", description = "Revokes the caller's refresh tokens (when a valid bearer token is sent) and clears the refresh cookie.")
    @ApiResponse(responseCode = "204", description = "Signed out")
    @PostMapping("/logout")
    ResponseEntity<Void> logout(@AuthenticationPrincipal Jwt jwt, HttpServletResponse res) {
        if (jwt != null) {
            UUID userId = UUID.fromString(jwt.getSubject());
            authService.logout(userId);
        }
        clearRefreshCookie(res);
        return ResponseEntity.noContent().build();
    }

    // ---- /me ----

    @io.swagger.v3.oas.annotations.Hidden
    @GetMapping("/../../me")   // mapped via separate method below
    ResponseEntity<UserResponse> me(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        var user = userRepo.findById(userId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
        return ResponseEntity.ok(UserResponse.from(user));
    }

    // ---- helpers ----

    private Map<String, Object> tokenBody(String accessToken) {
        return Map.of("accessToken", accessToken, "tokenType", "Bearer");
    }

    private void setRefreshCookie(HttpServletResponse res, String token) {
        var cookie = new Cookie(REFRESH_COOKIE, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge(REFRESH_MAX_AGE);
        cookie.setAttribute("SameSite", "Lax");
        res.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse res) {
        var cookie = new Cookie(REFRESH_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge(0);
        res.addCookie(cookie);
    }

    private String extractRefreshCookie(HttpServletRequest req) {
        if (req.getCookies() == null) {
            throw ApiException.unauthorized("MISSING_REFRESH_TOKEN", "No refresh cookie present");
        }
        return Arrays.stream(req.getCookies())
                .filter(c -> REFRESH_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElseThrow(() -> ApiException.unauthorized("MISSING_REFRESH_TOKEN", "No refresh cookie present"));
    }
}
