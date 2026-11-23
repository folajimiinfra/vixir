package org.vixir.common;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "vixir")
public record VixirProperties(
        String jwtSecret,
        String serviceSecret,
        String webOrigins,
        String experimentsDir
) {}
