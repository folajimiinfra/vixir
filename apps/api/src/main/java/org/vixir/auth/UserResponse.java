package org.vixir.auth;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String role,
        String status,
        String locale,
        UUID institutionId,
        Instant createdAt
) {
    public static UserResponse from(AppUser u) {
        return new UserResponse(
                u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(),
                u.getRole().name(), u.getStatus().name(), u.getLocale(),
                u.getInstitutionId(), u.getCreatedAt());
    }
}
