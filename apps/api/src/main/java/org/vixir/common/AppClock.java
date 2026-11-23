package org.vixir.common;

import java.time.Instant;
import org.springframework.stereotype.Component;

/** Injectable clock — swap with a fixed clock in tests. */
@Component
public class AppClock {
    public Instant now() {
        return Instant.now();
    }
}
