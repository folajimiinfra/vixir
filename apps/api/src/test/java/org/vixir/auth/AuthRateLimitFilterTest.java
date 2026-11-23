package org.vixir.auth;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.FilterChain;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class AuthRateLimitFilterTest {

    private static final int LIMIT = 3;

    @Test
    void spoofedForwardedForDoesNotBypassIpLimit() throws Exception {
        var filter = new AuthRateLimitFilter(LIMIT);
        for (int i = 0; i < LIMIT; i++) {
            var req = post("/api/v1/auth/refresh", "10.0.0.1", null);
            req.addHeader("X-Forwarded-For", "203.0.113." + i);
            assertThat(run(filter, req, null).getStatus()).isEqualTo(200);
        }
        var req = post("/api/v1/auth/refresh", "10.0.0.1", null);
        req.addHeader("X-Forwarded-For", "198.51.100.99");
        assertThat(run(filter, req, null).getStatus()).isEqualTo(429);
    }

    @Test
    void emailInJsonBodyIsLimitedAcrossIps() throws Exception {
        var filter = new AuthRateLimitFilter(LIMIT);
        String body = "{\"email\":\"Victim@Example.com\",\"password\":\"guess\"}";
        for (int i = 0; i < LIMIT; i++) {
            assertThat(run(filter, post("/api/v1/auth/login", "10.0.1." + i, body), null).getStatus()).isEqualTo(200);
        }
        // Different IP, same email in a different case: still limited
        String sameEmail = "{\"email\":\" victim@example.COM \",\"password\":\"guess\"}";
        assertThat(run(filter, post("/api/v1/auth/login", "10.0.2.1", sameEmail), null).getStatus()).isEqualTo(429);
        // Another email from a fresh IP is unaffected
        String other = "{\"email\":\"someone@example.com\",\"password\":\"x\"}";
        assertThat(run(filter, post("/api/v1/auth/login", "10.0.3.1", other), null).getStatus()).isEqualTo(200);
    }

    @Test
    void bodyIsStillReadableDownstream() throws Exception {
        var filter = new AuthRateLimitFilter(LIMIT);
        String body = "{\"email\":\"a@example.com\",\"password\":\"pw\"}";
        var seen = new AtomicReference<String>();
        run(filter, post("/api/v1/auth/register", "10.0.4.1", body), seen);
        assertThat(seen.get()).isEqualTo(body);
    }

    @Test
    void oversizedBodyIsRejected() throws Exception {
        var filter = new AuthRateLimitFilter(LIMIT);
        String big = "{\"email\":\"a@example.com\",\"pad\":\"" + "x".repeat(20_000) + "\"}";
        assertThat(run(filter, post("/api/v1/auth/login", "10.0.5.1", big), null).getStatus()).isEqualTo(413);
    }

    @Test
    void nonAuthPathsAreNotLimited() throws Exception {
        var filter = new AuthRateLimitFilter(1);
        for (int i = 0; i < 5; i++) {
            assertThat(run(filter, post("/api/v1/classes", "10.0.6.1", "{}"), null).getStatus()).isEqualTo(200);
        }
    }

    // ---- helpers ----

    private static MockHttpServletRequest post(String uri, String remoteAddr, String json) {
        var req = new MockHttpServletRequest("POST", uri);
        req.setRemoteAddr(remoteAddr);
        if (json != null) {
            req.setContentType("application/json");
            req.setContent(json.getBytes(StandardCharsets.UTF_8));
        }
        return req;
    }

    /** Runs the filter; the downstream chain records the body it receives and answers 200. */
    private static MockHttpServletResponse run(AuthRateLimitFilter filter, MockHttpServletRequest req,
                                               AtomicReference<String> seenBody) throws Exception {
        var res = new MockHttpServletResponse();
        FilterChain chain = (rq, rs) -> {
            if (seenBody != null) seenBody.set(new String(rq.getInputStream().readAllBytes(), StandardCharsets.UTF_8));
            ((MockHttpServletResponse) rs).setStatus(200);
        };
        filter.doFilter(req, res, chain);
        return res;
    }
}
