package org.vixir.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Accepts either a school email address or a matric / admission number in {@code email} (and optional {@code matricNo}).
 */
public record RegisterRequest(
        @NotBlank @Size(max = 120) String email,
        @NotBlank @Size(min = 8, max = 128) String password,
        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,
        @NotNull AppUser.Role role,
        String classCode,
        @Size(max = 120) String institutionName,
        @Size(max = 64) String matricNo
) {
    public RegisterRequest(
            String email,
            String password,
            String firstName,
            String lastName,
            AppUser.Role role,
            String classCode,
            String institutionName
    ) {
        this(email, password, firstName, lastName, role, classCode, institutionName, null);
    }
}
