package org.vixir.auth;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String matricNo,
        String firstName,
        String lastName,
        AppUser.Role role,
        AppUser.UserStatus status,
        String locale,
        UUID institutionId,
        Instant createdAt
) {
    public static UserResponse from(AppUser u) {
        String displayEmail = u.getEmail() != null ? u.getEmail() : u.getMatricNo();
        return new UserResponse(u.getId(), displayEmail, u.getMatricNo(), u.getFirstName(), u.getLastName(),
                u.getRole(), u.getStatus(), u.getLocale(), u.getInstitutionId(), u.getCreatedAt());
    }
}
