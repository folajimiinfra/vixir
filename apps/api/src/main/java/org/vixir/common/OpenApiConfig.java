package org.vixir.common;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.security.SecuritySchemes;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI metadata for springdoc. The spec is served at /v3/api-docs and the UI at /swagger-ui.html.
 * A static copy lives in apps/api/openapi.json (regenerate after changing endpoints).
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Vixir API",
                version = "0.1.0",
                description = """
                        REST API for Vixir, the open-source virtual practical laboratory.

                        **Authentication.** Obtain an access token from `POST /api/v1/auth/login` (or `/register`, `/google`)
                        and send it as `Authorization: Bearer <token>`. The refresh token is set as the httpOnly cookie
                        `vx_refresh` (path `/api/v1/auth/refresh`); call `POST /api/v1/auth/refresh` to rotate both.

                        **Errors** use RFC 9457 problem details (`application/problem+json`) with an extra `code` property.
                        Resources the caller may not access return **404**, not 403, so their existence is not revealed.

                        **Internal endpoints** (`/api/v1/internal/**`) are for the Vix agent only and take a service JWT
                        signed with `VIXIR_SERVICE_SECRET` with `scope=vix-agent`.
                        """,
                license = @License(name = "MIT", url = "https://opensource.org/licenses/MIT"),
                contact = @Contact(name = "Vixir")
        ),
        servers = @Server(url = "/", description = "This server"),
        security = @SecurityRequirement(name = "bearerAuth"),
        tags = {
                @Tag(name = "Auth", description = "Register, sign in, refresh and sign out"),
                @Tag(name = "Me", description = "The signed-in user's profile"),
                @Tag(name = "Classes", description = "Classes, join codes and enrolment"),
                @Tag(name = "Assignments", description = "Teacher-set experiments for a class"),
                @Tag(name = "Experiments", description = "Public experiment catalogue"),
                @Tag(name = "Attempts", description = "Starting and resuming lab attempts"),
                @Tag(name = "Events", description = "Attempt event log (offline-safe batch sync)"),
                @Tag(name = "Submissions", description = "Submitting an attempt for marking"),
                @Tag(name = "Review", description = "Teacher results, overrides, release and flags; student reports"),
                @Tag(name = "Vix", description = "Vix voice-guide sessions and scripted tours"),
                @Tag(name = "Internal (Vix agent)", description = "Service-to-service endpoints for the Vix agent"),
                @Tag(name = "System", description = "Health and smoke tests")
        }
)
@SecuritySchemes({
        @SecurityScheme(
                name = "bearerAuth",
                type = SecuritySchemeType.HTTP,
                scheme = "bearer",
                bearerFormat = "JWT",
                description = "Access token from /api/v1/auth/login, /register or /google"),
        @SecurityScheme(
                name = "serviceToken",
                type = SecuritySchemeType.HTTP,
                scheme = "bearer",
                bearerFormat = "JWT",
                description = "Service JWT for the Vix agent (HS256 with VIXIR_SERVICE_SECRET, scope=vix-agent)"),
        @SecurityScheme(
                name = "refreshCookie",
                type = SecuritySchemeType.APIKEY,
                in = SecuritySchemeIn.COOKIE,
                paramName = "vx_refresh",
                description = "httpOnly refresh token cookie set by the auth endpoints")
})
public class OpenApiConfig {
}
