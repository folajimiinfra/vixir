package org.vixir.vix;

import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.attempt.Attempt;
import org.vixir.attempt.AttemptRepository;
import org.vixir.auth.AppUser;
import org.vixir.auth.AppUserRepository;
import org.vixir.common.ApiException;
import org.vixir.school.InstitutionSettingsRepository;

/**
 * Vix session bootstrap (Req 13).
 */
@Service
public class VixSessionService {

    private final VixSessionRepository sessionRepo;
    private final VixMessageRepository messageRepo;
    private final AttemptRepository attemptRepo;
    private final AppUserRepository userRepo;
    private final InstitutionSettingsRepository settingsRepo;
    private final LiveKitTokenFactory tokenFactory;

    public VixSessionService(VixSessionRepository sessionRepo,
                              VixMessageRepository messageRepo,
                              AttemptRepository attemptRepo,
                              AppUserRepository userRepo,
                              InstitutionSettingsRepository settingsRepo,
                              LiveKitTokenFactory tokenFactory) {
        this.sessionRepo = sessionRepo;
        this.messageRepo = messageRepo;
        this.attemptRepo = attemptRepo;
        this.userRepo = userRepo;
        this.settingsRepo = settingsRepo;
        this.tokenFactory = tokenFactory;
    }

    public record VixBootstrap(
            UUID sessionId,
            String livekitUrl,
            String token,
            String room,
            String mode,
            String scriptedTourUrl
    ) {}

    @Transactional
    public VixBootstrap bootstrap(UUID userId, VixBootstrapRequest req) {
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));

        // Req 13.3 — institution-level Vix kill switch
        if (user.getInstitutionId() != null) {
            settingsRepo.findById(user.getInstitutionId()).ifPresent(settings -> {
                if (!settings.isVixEnabled()) {
                    throw ApiException.forbidden("VIX_DISABLED_INSTITUTION",
                            "Vix is disabled for this institution");
                }
            });
        }

        // Req 13.2 — exam mode forbidden
        Attempt attempt = null;
        if (req.attemptId() != null) {
            attempt = attemptRepo.findById(req.attemptId())
                    .orElseThrow(() -> ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found"));
            // Req 2.2 — only your own attempt; same 404 so existence isn't revealed
            if (!userId.equals(attempt.getUserId())) {
                throw ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found");
            }
            if ("EXAM".equals(attempt.getMode())) {
                throw ApiException.conflict("VIX_DISABLED_EXAM", "Vix is not available in exam mode");
            }
        }

        // Determine transcript retention from institution settings
        boolean retain = user.getInstitutionId() != null &&
                settingsRepo.findById(user.getInstitutionId())
                        .map(s -> s.isVixTranscriptsRetained()).orElse(false);

        var session = new VixSession();
        session.setUserId(userId);
        session.setAttemptId(req.attemptId());
        session.setMode(req.attemptId() != null ? "GRADED" : "PRACTICE");
        session.setConsent(req.consent() != null ? req.consent() : java.util.Map.of());
        session.setVoice(req.voice() != null ? req.voice() : "ada");
        session.setLocale(req.locale() != null ? req.locale() : user.getLocale());
        session.setTranscriptRetained(retain);

        @SuppressWarnings("unchecked")
        Map<String, Object> consentMap = req.consent() instanceof Map<?,?>
                ? (Map<String, Object>) req.consent() : Map.of();
        boolean mic    = Boolean.TRUE.equals(consentMap.get("mic"));
        boolean screen = Boolean.TRUE.equals(consentMap.get("screen"));

        var tk = tokenFactory.issueStudentToken(UUID.randomUUID(), userId, mic, screen);
        session.setRoom(tk.room());
        sessionRepo.save(session);

        // Scripted fallback tour for this screen, pinned to the attempt's experiment when there is one
        String tourUrl = null;
        if (req.screen() != null && !req.screen().isBlank()) {
            tourUrl = "/api/v1/vix/tours/" + java.net.URLEncoder.encode(req.screen(), java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20");
            if (attempt != null) {
                tourUrl += "?experimentId=" + java.net.URLEncoder.encode(attempt.getExperimentId(), java.nio.charset.StandardCharsets.UTF_8);
            }
        }
        return new VixBootstrap(session.getId(), tk.livekitUrl(), tk.token(),
                tk.room(), session.getMode(), tourUrl);
    }

    @Transactional
    public void endSession(UUID sessionId, UUID userId, int turns) {
        var session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> ApiException.notFound("SESSION_NOT_FOUND", "Session not found"));
        if (!userId.equals(session.getUserId())) {
            throw ApiException.notFound("SESSION_NOT_FOUND", "Session not found");
        }
        session.setEndedAt(java.time.Instant.now());
        session.setTurns(turns);
        sessionRepo.save(session);
    }

    @Transactional
    public void storeMessage(UUID sessionId, String role, String text, boolean policyBlocked) {
        var session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> ApiException.notFound("SESSION_NOT_FOUND", "Session not found"));
        if (!session.isTranscriptRetained()) {
            session.setTurns(session.getTurns() + 1);
            sessionRepo.save(session);
            return;
        }
        var msg = new VixMessage();
        msg.setVixSessionId(sessionId);
        msg.setRole(role);
        msg.setText(text);
        msg.setPolicyBlocked(policyBlocked);
        messageRepo.save(msg);
    }

    public VixSession getSession(UUID sessionId) {
        return sessionRepo.findById(sessionId)
                .orElseThrow(() -> ApiException.notFound("SESSION_NOT_FOUND", "Session not found"));
    }
}
