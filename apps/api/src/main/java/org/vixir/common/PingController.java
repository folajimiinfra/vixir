package org.vixir.common;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public smoke-test endpoint used by CI and the deploy health check. */
@Tag(name = "System")
@RestController
@RequestMapping("/api/v1")
public class PingController {
    @Operation(summary = "Smoke test", description = "Public. Used by CI and deploy checks.")
    @SecurityRequirements()
    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of("status", "ok", "service", "vixir-api", "time", Instant.now().toString());
    }
}
