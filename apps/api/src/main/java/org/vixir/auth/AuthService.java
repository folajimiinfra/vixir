package org.vixir.auth;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTClaimsVerifier;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.common.ApiException;
import org.vixir.common.AppClock;
import org.vixir.school.SchoolClassRepository;
import org.vixir.school.EnrolmentRepository;
import org.vixir.school.Enrolment;
import org.vixir.school.InstitutionService;

/**
 * Registration, login, Google sign-in, refresh rotation (Req 1).
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final AppUserRepository userRepo;
    private final RefreshTokenRepository refreshRepo;
    private final PasswordService passwords;
    private final TokenService tokens;
    private final AppClock clock;
    private final SchoolClassRepository classRepo;
    private final EnrolmentRepository enrolmentRepo;
    private final InstitutionService institutionService;

    @Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    public AuthService(AppUserRepository userRepo,
                       RefreshTokenRepository refreshRepo,
                       PasswordService passwords,
                       TokenService tokens,
                       AppClock clock,
                       SchoolClassRepository classRepo,
                       EnrolmentRepository enrolmentRepo,
                       InstitutionService institutionService) {
        this.institutionService = institutionService;
        this.userRepo = userRepo;
        this.refreshRepo = refreshRepo;
        this.passwords = passwords;
        this.tokens = tokens;
        this.clock = clock;
        this.classRepo = classRepo;
        this.enrolmentRepo = enrolmentRepo;
    }

    public record TokenPair(String accessToken, String refreshToken) {}

    @Transactional
    public TokenPair register(RegisterRequest req) {
        // Req 1.4 — duplicate email
        if (userRepo.existsByEmail(req.email())) {
            throw ApiException.conflict("EMAIL_TAKEN", "Email is already registered");
        }

        // Req 1.3 — validate class code when student provides one
        if (req.role() == AppUser.Role.STUDENT && req.classCode() != null) {
            classRepo.findByJoinCodeIgnoreCaseAndArchivedAtIsNull(req.classCode())
                    .orElseThrow(() -> ApiException.unprocessable("CLASS_CODE_INVALID",
                            "Class code does not match an active class"));
        }

        var user = new AppUser();
        user.setEmail(req.email());
        user.setPasswordHash(passwords.hash(req.password()));
        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setRole(req.role());
        userRepo.save(user);

        // Req 3.1 — an admin's registration creates their institution. A self-registered teacher gets a
        // personal one too, otherwise they could not create classes (school_class.institution_id is NOT NULL).
        if (req.role() == AppUser.Role.ADMIN || req.role() == AppUser.Role.TEACHER) {
            institutionService.createFor(user, req.institutionName());
        }

        // Req 1.2 — enrol student in class within same transaction
        if (req.role() == AppUser.Role.STUDENT && req.classCode() != null) {
            var cls = classRepo.findByJoinCodeIgnoreCaseAndArchivedAtIsNull(req.classCode()).get();
            var enrolment = new Enrolment();
            enrolment.setClassId(cls.getId());
            enrolment.setUserId(user.getId());
            enrolment.setClassRole(Enrolment.ClassRole.STUDENT);
            enrolmentRepo.save(enrolment);
        }

        return issueTokenPair(user);
    }

    @Transactional
    public TokenPair login(LoginRequest req) {
        var user = userRepo.findByEmail(req.email())
                .orElseThrow(() -> ApiException.unauthorized("INVALID_CREDENTIALS", "Invalid email or password"));

        // Req 1.10
        if (user.getStatus() == AppUser.UserStatus.DISABLED) {
            throw ApiException.forbidden("USER_DISABLED", "Account has been disabled");
        }

        if (!passwords.verify(req.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("INVALID_CREDENTIALS", "Invalid email or password");
        }

        user.setLastLoginAt(clock.now());
        return issueTokenPair(user);
    }

    @Transactional
    public TokenPair googleSignIn(String idTokenString) {
        JWTClaimsSet payload = verifyGoogleToken(idTokenString);
        String googleSub = payload.getSubject();

        var user = userRepo.findByGoogleSub(googleSub).orElseGet(() -> {
            var newUser = new AppUser();
            newUser.setGoogleSub(googleSub);
            try {
                newUser.setEmail(payload.getStringClaim("email"));
                String given = payload.getStringClaim("given_name");
                String family = payload.getStringClaim("family_name");
                newUser.setFirstName(given != null ? given : "");
                newUser.setLastName(family != null ? family : "");
            } catch (java.text.ParseException e) {
                newUser.setFirstName("");
                newUser.setLastName("");
            }
            newUser.setRole(AppUser.Role.STUDENT);
            return userRepo.save(newUser);
        });

        if (user.getStatus() == AppUser.UserStatus.DISABLED) {
            throw ApiException.forbidden("USER_DISABLED", "Account has been disabled");
        }

        user.setLastLoginAt(clock.now());
        return issueTokenPair(user);
    }

    @Transactional
    public TokenPair refresh(String incomingRefreshToken) {
        var result = tokens.rotate(incomingRefreshToken);
        var user = userRepo.findById(result.userId())
                .orElseThrow(() -> ApiException.unauthorized("INVALID_REFRESH_TOKEN", "User not found"));

        if (user.getStatus() == AppUser.UserStatus.DISABLED) {
            throw ApiException.forbidden("USER_DISABLED", "Account has been disabled");
        }

        String newAccess  = tokens.issueAccessToken(user);
        String newRefresh = tokens.issueRefreshToken(user, result.familyId());
        return new TokenPair(newAccess, newRefresh);
    }

    @Transactional
    public void logout(UUID userId) {
        refreshRepo.revokeAllForUser(userId);
    }

    // ---- helpers ----

    private TokenPair issueTokenPair(AppUser user) {
        String access  = tokens.issueAccessToken(user);
        String refresh = tokens.issueRefreshToken(user, null);
        return new TokenPair(access, refresh);
    }

    private JWTClaimsSet verifyGoogleToken(String idTokenString) {
        try {
            ConfigurableJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
            JWSKeySelector<SecurityContext> keySelector = new JWSVerificationKeySelector<>(
                    JWSAlgorithm.RS256,
                    new RemoteJWKSet<>(new URL("https://www.googleapis.com/oauth2/v3/certs")));
            processor.setJWSKeySelector(keySelector);
            Set<String> requiredClaims = new HashSet<>(Set.of("sub", "email", "aud"));
            processor.setJWTClaimsSetVerifier(new DefaultJWTClaimsVerifier<>(
                    new JWTClaimsSet.Builder().audience(googleClientId).build(),
                    requiredClaims));
            return processor.process(idTokenString, null);
        } catch (Exception e) {
            throw ApiException.unauthorized("INVALID_GOOGLE_TOKEN", "Google ID token is invalid: " + e.getMessage());
        }
    }
}
