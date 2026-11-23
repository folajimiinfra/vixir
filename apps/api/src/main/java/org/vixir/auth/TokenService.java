package org.vixir.auth;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import com.nimbusds.jwt.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.common.ApiException;
import org.vixir.common.AppClock;
import org.vixir.common.VixirProperties;

/**
 * Issues and validates access JWTs (HS256) and rotating refresh tokens (Req 1.5–1.8).
 * Access JWT claims: sub (userId), role, inst (institutionId), scope.
 */
@Service
public class TokenService {

    private static final long ACCESS_TTL_SECONDS  = 15 * 60;          // 15 min
    private static final long REFRESH_TTL_SECONDS = 30L * 24 * 3600;  // 30 days

    private final VixirProperties props;
    private final AppClock clock;
    private final RefreshTokenRepository refreshRepo;
    private final SecureRandom random = new SecureRandom();

    public TokenService(VixirProperties props, AppClock clock, RefreshTokenRepository refreshRepo) {
        this.props = props;
        this.clock = clock;
        this.refreshRepo = refreshRepo;
    }

    // ---- access token ----

    public String issueAccessToken(AppUser user) {
        try {
            Instant now = clock.now();
            var claims = new JWTClaimsSet.Builder()
                    .subject(user.getId().toString())
                    .claim("role", user.getRole().name())
                    .claim("inst", user.getInstitutionId() != null ? user.getInstitutionId().toString() : null)
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(now.plusSeconds(ACCESS_TTL_SECONDS)))
                    .build();
            var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            jwt.sign(new MACSigner(keyBytes(props.jwtSecret())));
            return jwt.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Failed to sign access token", e);
        }
    }

    /** Verifies an access token and returns its claims, or throws 401. */
    public JWTClaimsSet parseAccessToken(String token) {
        try {
            var jwt = SignedJWT.parse(token);
            if (!jwt.verify(new MACVerifier(keyBytes(props.jwtSecret())))) {
                throw ApiException.unauthorized("INVALID_TOKEN", "Token signature invalid");
            }
            if (jwt.getJWTClaimsSet().getExpirationTime().before(Date.from(clock.now()))) {
                throw ApiException.unauthorized("TOKEN_EXPIRED", "Access token expired");
            }
            return jwt.getJWTClaimsSet();
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw ApiException.unauthorized("INVALID_TOKEN", "Cannot parse token");
        }
    }

    /** Same as above but validates the service-to-service secret and scope. */
    public JWTClaimsSet parseServiceToken(String token) {
        try {
            var jwt = SignedJWT.parse(token);
            if (!jwt.verify(new MACVerifier(keyBytes(props.serviceSecret())))) {
                throw ApiException.unauthorized("INVALID_SERVICE_TOKEN", "Service token signature invalid");
            }
            var claims = jwt.getJWTClaimsSet();
            if (!"vix-agent".equals(claims.getStringClaim("scope"))) {
                throw ApiException.unauthorized("INVALID_SERVICE_TOKEN", "Missing vix-agent scope");
            }
            if (claims.getExpirationTime() == null
                    || !claims.getExpirationTime().toInstant().isAfter(clock.now())) {
                throw ApiException.unauthorized("INVALID_SERVICE_TOKEN", "Service token missing exp or expired");
            }
            return claims;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw ApiException.unauthorized("INVALID_SERVICE_TOKEN", "Cannot parse service token");
        }
    }

    // ---- refresh token ----

    @Transactional
    public String issueRefreshToken(AppUser user, UUID familyId) {
        byte[] raw = new byte[32];
        random.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);

        var rt = new RefreshToken();
        rt.setUserId(user.getId());
        rt.setTokenHash(sha256(token));
        rt.setFamilyId(familyId != null ? familyId : UUID.randomUUID());
        rt.setExpiresAt(clock.now().plusSeconds(REFRESH_TTL_SECONDS));
        refreshRepo.save(rt);
        return token;
    }

    /**
     * Rotates a refresh token: validates, revokes the old one, issues a new one in the same family.
     * Returns [newRefreshToken, userId].
     * On reuse of a revoked token, revokes the whole family (Req 1.8).
     */
    @Transactional
    public RotationResult rotate(String incomingToken) {
        String hash = sha256(incomingToken);
        var stored = refreshRepo.findByTokenHash(hash)
                .orElseThrow(() -> ApiException.unauthorized("INVALID_REFRESH_TOKEN", "Refresh token not found"));

        Instant now = clock.now();

        if (stored.getRevokedAt() != null) {
            // Reuse detected — revoke entire family
            refreshRepo.findAllByFamilyId(stored.getFamilyId())
                    .forEach(t -> { if (t.getRevokedAt() == null) t.setRevokedAt(now); });
            throw ApiException.unauthorized("REFRESH_REUSED", "Refresh token reuse detected; please log in again");
        }

        if (!stored.isActive(now)) {
            throw ApiException.unauthorized("REFRESH_EXPIRED", "Refresh token has expired");
        }

        // Revoke current token and issue a new one in the same family
        stored.setRevokedAt(now);
        return new RotationResult(stored.getUserId(), stored.getFamilyId());
    }

    public record RotationResult(UUID userId, UUID familyId) {}

    // ---- helpers ----

    private static byte[] keyBytes(String secret) {
        return secret.getBytes(StandardCharsets.UTF_8);
    }

    static String sha256(String input) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
