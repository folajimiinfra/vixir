package org.vixir.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * Accepts either a school email address or a matric / admission number in {@code email}.
 */
public record LoginRequest(
        @NotBlank String email,
        @NotBlank String password
) {}
