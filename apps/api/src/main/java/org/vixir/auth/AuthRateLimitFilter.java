package org.vixir.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Fixed-window rate limiter on /api/v1/auth/**: N requests/minute per client IP, plus N/minute per email
 * on login and register (Req 1.11).
 *
 * <p>The client IP is {@code request.getRemoteAddr()}. X-Forwarded-For is never read here: behind a proxy,
 * set {@code server.forward-headers-strategy=native} (the default in application.yml) so Tomcat rewrites the
 * remote address from X-Forwarded-For only when the request came from a trusted internal proxy. Reading the
 * header directly would let any client pick its own "IP" and bypass the limit.
 *
 * <p>The email comes from the JSON body (that is how login/register send it). The body is buffered so the
 * controller can still read it.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;
    private static final int MAX_BODY_BYTES = 16 * 1024;   // auth bodies are a few hundred bytes
    private static final int EVICT_THRESHOLD = 50_000;     // prune expired windows past this many keys
    private static final Set<String> EMAIL_PATHS = Set.of("/api/v1/auth/login", "/api/v1/auth/register");

    private final int limit;
    private final ObjectMapper mapper = new ObjectMapper();
    private final ConcurrentHashMap<String, long[]> windows = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(@Value("${vixir.auth-rate-limit-per-minute:10}") int limit) {
        this.limit = limit;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/v1/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        if (!tryConsume("ip:" + request.getRemoteAddr())) {
            reject(response);
            return;
        }

        HttpServletRequest forward = request;
        if ("POST".equalsIgnoreCase(request.getMethod()) && EMAIL_PATHS.contains(request.getRequestURI())) {
            byte[] body = request.getInputStream().readNBytes(MAX_BODY_BYTES + 1);
            if (body.length > MAX_BODY_BYTES) {
                response.setStatus(HttpStatus.PAYLOAD_TOO_LARGE.value());
                writeProblem(response, 413, "PAYLOAD_TOO_LARGE", "Request body too large");
                return;
            }
            String email = emailFrom(body);
            if (email != null && !tryConsume("email:" + email)) {
                reject(response);
                return;
            }
            forward = new CachedBodyRequest(request, body);
        }

        chain.doFilter(forward, response);
    }

    /** Lower-cased, trimmed "email" field of a JSON body, or null if absent or not JSON. */
    private String emailFrom(byte[] body) {
        if (body.length == 0) return null;
        try {
            JsonNode node = mapper.readTree(body);
            JsonNode email = node == null ? null : node.get("email");
            if (email == null || !email.isTextual() || email.asText().isBlank()) return null;
            return email.asText().trim().toLowerCase(Locale.ROOT);
        } catch (IOException e) {
            return null; // malformed JSON: the controller will answer 400
        }
    }

    /** Returns true if the request is allowed (and counts it). */
    private boolean tryConsume(String key) {
        long now = System.currentTimeMillis();
        if (windows.size() > EVICT_THRESHOLD) {
            windows.values().removeIf(w -> now - w[0] > WINDOW_MS);
        }
        long[] slot = windows.compute(key, (k, v) -> {
            if (v == null || now - v[0] > WINDOW_MS) return new long[]{ now, 0 };
            return v;
        });
        synchronized (slot) {
            if (slot[1] >= limit) return false;
            slot[1]++;
            return true;
        }
    }

    private static void reject(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", "60");
        writeProblem(response, 429, "RATE_LIMIT_EXCEEDED", "Too many requests; try again in a minute");
    }

    private static void writeProblem(HttpServletResponse response, int status, String code, String detail)
            throws IOException {
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.getWriter().write("{\"status\":" + status + ",\"code\":\"" + code + "\",\"detail\":\"" + detail + "\"}");
    }

    /** Request whose body has already been read into memory, so it can be read again downstream. */
    static final class CachedBodyRequest extends HttpServletRequestWrapper {
        private final byte[] body;

        CachedBodyRequest(HttpServletRequest request, byte[] body) {
            super(request);
            this.body = body;
        }

        @Override
        public ServletInputStream getInputStream() {
            var in = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                @Override public int read() { return in.read(); }
                @Override public int read(byte[] b, int off, int len) { return in.read(b, off, len); }
                @Override public boolean isFinished() { return in.available() == 0; }
                @Override public boolean isReady() { return true; }
                @Override public void setReadListener(ReadListener listener) { throw new UnsupportedOperationException(); }
            };
        }

        @Override
        public BufferedReader getReader() {
            String enc = getCharacterEncoding();
            var cs = enc != null ? java.nio.charset.Charset.forName(enc) : StandardCharsets.UTF_8;
            return new BufferedReader(new InputStreamReader(getInputStream(), cs));
        }

        @Override
        public int getContentLength() { return body.length; }

        @Override
        public long getContentLengthLong() { return body.length; }
    }
}
