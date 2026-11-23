package org.vixir.review;

import static org.assertj.core.api.Assertions.assertThat;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.vixir.assignment.Assignment;
import org.vixir.assignment.AssignmentRepository;
import org.vixir.attempt.Attempt;
import org.vixir.attempt.AttemptRepository;
import org.vixir.common.BaseIntegrationTest;
import org.vixir.marking.Mark;
import org.vixir.marking.MarkCriterion;
import org.vixir.marking.MarkCriterionRepository;
import org.vixir.marking.MarkRepository;
import org.vixir.school.Institution;
import org.vixir.school.InstitutionRepository;
import org.vixir.school.SchoolClass;
import org.vixir.school.SchoolClassRepository;
import org.vixir.submission.Submission;
import org.vixir.submission.SubmissionRepository;

/**
 * Only the teacher of a submission's class may override its marks, comment on it or resolve its flags;
 * only teachers may create classes; internal Vix endpoints accept only service tokens.
 */
class ReviewAuthorizationTest extends BaseIntegrationTest {

    // Must match vixir.service-secret in BaseIntegrationTest
    private static final String SERVICE_SECRET = "test-only-service-secret-0123456789abcdef";

    @Autowired InstitutionRepository institutionRepo;
    @Autowired SchoolClassRepository classRepo;
    @Autowired AssignmentRepository assignmentRepo;
    @Autowired AttemptRepository attemptRepo;
    @Autowired SubmissionRepository submissionRepo;
    @Autowired MarkRepository markRepo;
    @Autowired MarkCriterionRepository criterionRepo;
    @Autowired ReviewFlagRepository flagRepo;

    String ownerToken;        // teaches the class
    String otherTeacherToken; // teaches nothing here
    String studentToken;      // made the submission
    UUID submissionId;
    UUID flagId;

    @BeforeEach
    void setUp() {
        ownerToken = register(unique("owner"), "password123", "TEACHER", "Owner");
        otherTeacherToken = register(unique("other"), "password123", "TEACHER", "Other");
        studentToken = register(unique("student"), "password123", "STUDENT", "Stu");

        var inst = new Institution();
        inst.setName("Review School");
        inst.setType("SECONDARY");
        institutionRepo.save(inst);

        var cls = new SchoolClass();
        cls.setInstitutionId(inst.getId());
        cls.setOwnerId(subjectOf(ownerToken));
        cls.setName("Review class");
        cls.setSubject("PHYSICS");
        cls.setLevel("SS2");
        cls.setJoinCode("PHY-SS2-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        classRepo.save(cls);

        Instant now = Instant.now();
        var assignment = new Assignment();
        assignment.setClassId(cls.getId());
        assignment.setExperimentId("phy.pendulum.g");
        assignment.setExperimentVersion(1);
        assignment.setCreatedBy(subjectOf(ownerToken));
        assignment.setMode("GRADED");
        assignment.setStatus("PUBLISHED");
        assignment.setNoiseLevel("REALISTIC");
        assignment.setAttemptsAllowed(2);
        assignment.setReleasePolicy("MANUAL");
        assignment.setOpensAt(now.minus(2, ChronoUnit.DAYS));
        assignment.setDueAt(now.plus(2, ChronoUnit.DAYS));
        assignmentRepo.save(assignment);

        var attempt = new Attempt();
        attempt.setUserId(subjectOf(studentToken));
        attempt.setAssignmentId(assignment.getId());
        attempt.setExperimentId("phy.pendulum.g");
        attempt.setExperimentVersion(1);
        attempt.setMode("GRADED");
        attempt.setSeed(new byte[16]);
        attempt.setState("MARKED");
        attemptRepo.save(attempt);

        var submission = new Submission();
        submission.setAttemptId(attempt.getId());
        submission.setResults(Map.of());
        submission.setReadingsHash("hash-" + UUID.randomUUID());
        submission.setDeclarationAccepted(true);
        submissionRepo.save(submission);
        submissionId = submission.getId();

        var mark = new Mark();
        mark.setSubmissionId(submissionId);
        mark.setTotal(3);
        mark.setMaxTotal(5);
        mark.setMarkerVersion("test");
        markRepo.save(mark);

        var criterion = new MarkCriterion();
        criterion.setMarkId(mark.getId());
        criterion.setCriterionKey("sig_figs");
        criterion.setAwarded(3);
        criterion.setMax(5);
        criterion.setReason("auto");
        criterionRepo.save(criterion);

        var flag = new ReviewFlag();
        flag.setSubmissionId(submissionId);
        flag.setType("OUTLIER_RESULT");
        flag.setDetail(Map.of());
        flagRepo.save(flag);
        flagId = flag.getId();
    }

    // ---- mark override / comment ----

    @Test
    void studentCannotOverrideTheirOwnMark() {
        assertThat(patchMark(studentToken, Map.of("criterionKey", "sig_figs", "score", 5))).isEqualTo(404);
        assertThat(awarded()).isEqualTo(3);
    }

    @Test
    void teacherOfAnotherClassCannotOverrideOrComment() {
        assertThat(patchMark(otherTeacherToken, Map.of("criterionKey", "sig_figs", "score", 5))).isEqualTo(404);
        assertThat(patchMark(otherTeacherToken, Map.of("comment", "hi"))).isEqualTo(404);
        assertThat(awarded()).isEqualTo(3);
    }

    @Test
    void classTeacherCanOverrideAndTotalIsRecomputed() {
        assertThat(patchMark(ownerToken, Map.of("criterionKey", "sig_figs", "score", 4, "reason", "ok"))).isEqualTo(200);
        assertThat(awarded()).isEqualTo(4);
        assertThat(markRepo.findBySubmissionId(submissionId).orElseThrow().getTotal()).isEqualTo(4);
    }

    @Test
    void scoreOutsideCriterionRangeIsRejected() {
        assertThat(patchMark(ownerToken, Map.of("criterionKey", "sig_figs", "score", 6))).isEqualTo(422);
        assertThat(patchMark(ownerToken, Map.of("criterionKey", "sig_figs", "score", -1))).isEqualTo(422);
        assertThat(patchMark(ownerToken, Map.of("criterionKey", "sig_figs"))).isEqualTo(422);
        assertThat(patchMark(ownerToken, Map.of("criterionKey", "sig_figs", "score", "five"))).isEqualTo(422);
        assertThat(awarded()).isEqualTo(3);
    }

    // ---- flags ----

    @Test
    void onlyClassTeacherCanResolveFlag() {
        assertThat(resolveFlag(studentToken)).isEqualTo(404);
        assertThat(resolveFlag(otherTeacherToken)).isEqualTo(404);
        assertThat(flagRepo.findById(flagId).orElseThrow().getStatus()).isEqualTo("OPEN");

        assertThat(resolveFlag(ownerToken)).isEqualTo(200);
        assertThat(flagRepo.findById(flagId).orElseThrow().getStatus()).isEqualTo("RESOLVED");
    }

    // ---- class creation ----

    @Test
    void studentCannotCreateClass() {
        var body = Map.of("name", "Mine", "subject", "PHYSICS", "level", "SS2");
        int status = http.exchange("/api/v1/classes", HttpMethod.POST,
                bearerRequest(studentToken, body), Map.class).getStatusCode().value();
        assertThat(status).isEqualTo(403);
    }

    // ---- internal Vix endpoints ----

    @Test
    void internalEndpointsAcceptOnlyServiceTokens() {
        String url = "/api/v1/internal/vix/sessions/" + UUID.randomUUID() + "/context";
        Instant exp = Instant.now().plus(5, ChronoUnit.MINUTES);

        // Valid service token: passes security, then 404 because the session doesn't exist
        assertThat(getWithBearer(url, serviceToken("vix-agent", exp))).isEqualTo(404);
        // User access token, wrong scope, no expiry, expired, no token: all rejected
        assertThat(getWithBearer(url, ownerToken)).isEqualTo(401);
        assertThat(getWithBearer(url, serviceToken("something-else", exp))).isEqualTo(403);
        assertThat(getWithBearer(url, serviceToken("vix-agent", null))).isEqualTo(401);
        assertThat(getWithBearer(url, serviceToken("vix-agent", Instant.now().minus(5, ChronoUnit.MINUTES)))).isEqualTo(401);
        assertThat(http.getForEntity(url, String.class).getStatusCode().value()).isEqualTo(401);
    }

    // ---- helpers ----

    private int patchMark(String token, Map<String, Object> body) {
        return http.exchange("/api/v1/submissions/" + submissionId + "/mark", HttpMethod.PATCH,
                bearerRequest(token, body), String.class).getStatusCode().value();
    }

    private int resolveFlag(String token) {
        return http.exchange("/api/v1/flags/" + flagId, HttpMethod.PATCH,
                bearerRequest(token, Map.of("note", "checked")), String.class).getStatusCode().value();
    }

    private int awarded() {
        var mark = markRepo.findBySubmissionId(submissionId).orElseThrow();
        return criterionRepo.findByMarkId(mark.getId()).get(0).getAwarded();
    }

    private int getWithBearer(String url, String token) {
        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return http.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class).getStatusCode().value();
    }

    private static String serviceToken(String scope, Instant exp) {
        try {
            var claims = new JWTClaimsSet.Builder().subject("vix-agent").claim("scope", scope);
            if (exp != null) claims.expirationTime(Date.from(exp));
            var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims.build());
            jwt.sign(new MACSigner(SERVICE_SECRET.getBytes(StandardCharsets.UTF_8)));
            return jwt.serialize();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@example.com";
    }
}
