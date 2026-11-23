package org.vixir.vix;

import java.util.Map;
import java.util.UUID;

public record VixBootstrapRequest(
        UUID attemptId,
        String screen,
        Map<String, Object> consent,
        String voice,
        String locale
) {}
