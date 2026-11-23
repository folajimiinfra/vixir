package org.vixir.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotNull AppUser.Role role,
        String classCode,  // optional; required when role == STUDENT and you want to join
        @Size(max = 120, message = "Institution name must be at most 120 characters")
        String institutionName  // optional; TEACHER/ADMIN only. Defaults to a name derived from the user.
) {}
