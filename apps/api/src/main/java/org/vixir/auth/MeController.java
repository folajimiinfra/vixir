package org.vixir.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vixir.common.ApiException;

/** GET /me and PATCH /me (profile, locale). */
@Tag(name = "Me")
@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    private final AppUserRepository userRepo;

    public MeController(AppUserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @Operation(summary = "Get the signed-in user")
    @GetMapping
    ResponseEntity<UserResponse> get(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(UserResponse.from(resolveUser(jwt)));
    }

    @Operation(summary = "Update the signed-in user's profile", description = "Only non-null fields are changed.")
    @PatchMapping
    ResponseEntity<UserResponse> patch(@AuthenticationPrincipal Jwt jwt,
                                        @RequestBody PatchMeRequest req) {
        var user = resolveUser(jwt);
        if (req.firstName() != null)  user.setFirstName(req.firstName());
        if (req.lastName() != null)   user.setLastName(req.lastName());
        if (req.locale() != null)     user.setLocale(req.locale());
        userRepo.save(user);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    private AppUser resolveUser(Jwt jwt) {
        return userRepo.findById(UUID.fromString(jwt.getSubject()))
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
    }

    public record PatchMeRequest(String firstName, String lastName, String locale) {}
}
