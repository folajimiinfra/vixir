package org.vixir.vix;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.*;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Issues LiveKit room-access JWTs directly (avoids SDK version uncertainty).
 * Format per LiveKit JWT spec: HS256, claims: video grant object + sub + iss + exp.
 * Grants: canPublish + canSubscribe, scoped to one room (Req 13.1).
 */
@Component
public class LiveKitTokenFactory {

    @Value("${LIVEKIT_API_KEY:devkey}")
    private String apiKey;

    @Value("${LIVEKIT_API_SECRET:devsecret-min-32chars-padding-pad}")
    private String apiSecret;

    @Value("${LIVEKIT_URL:wss://localhost:7880}")
    private String livekitUrl;

    private static final int TOKEN_TTL_SECONDS = 30 * 60; // 30 min — Req 13.1

    public record TokenResult(String token, String room, String livekitUrl) {}

    public TokenResult issueStudentToken(UUID sessionId, UUID userId, boolean mic, boolean screen) {
        String room = "vix-" + sessionId;
        try {
            var now = System.currentTimeMillis() / 1000;
            var videoGrant = Map.of(
                    "room", room,
                    "roomJoin", true,
                    "canPublish", true,
                    "canSubscribe", true,
                    "canPublishData", true
            );

            var claims = new JWTClaimsSet.Builder()
                    .issuer(apiKey)
                    .subject(userId.toString())
                    .issueTime(new Date(now * 1000))
                    .expirationTime(new Date((now + TOKEN_TTL_SECONDS) * 1000))
                    .claim("video", videoGrant)
                    .claim("name", userId.toString())
                    .build();

            var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            jwt.sign(new MACSigner(apiSecret.getBytes(StandardCharsets.UTF_8)));
            return new TokenResult(jwt.serialize(), room, livekitUrl);
        } catch (JOSEException e) {
            throw new RuntimeException("Failed to generate LiveKit token", e);
        }
    }
}
