package org.vixir.review;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import jakarta.persistence.EntityManagerFactory;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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
 * Common mistakes and criterion averages read only the assignment's own rows, in a fixed number of queries
 * no matter how many submissions exist (they used to scan every submission on the platform, then N+1).
 */
class AnalyticsQueryTest extends BaseIntegrationTest {

    @Autowired AnalyticsService analytics;
    @Autowired FlagService flagService;
    @Autowired ReviewFlagRepository flagRepo;
    @Autowired EntityManagerFactory emf;
    @Autowired InstitutionRepository institutionRepo;
    @Autowired SchoolClassRepository classRepo;
    @Autowired AssignmentRepository assignmentRepo;
    @Autowired AttemptRepository attemptRepo;
    @Autowired SubmissionRepository submissionRepo;
    @Autowired MarkRepository markRepo;
    @Autowired MarkCriterionRepository criterionRepo;

    UUID teacherId;
    Assignment assignmentA;
    Assignment assignmentB;

    @BeforeEach
    void setUp() {
        teacherId = registerUserId("TEACHER");
        var inst = new Institution();
        inst.setName("Analytics School");
        inst.setType("SECONDARY");
        institutionRepo.save(inst);
        var cls = new SchoolClass();
        cls.setInstitutionId(inst.getId());
        cls.setOwnerId(teacherId);
        cls.setName("Analytics");
        cls.setSubject("PHYSICS");
        cls.setLevel("SS2");
        cls.setJoinCode("PHY-SS2-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        classRepo.save(cls);
        assignmentA = assignment(cls.getId());
        assignmentB = assignment(cls.getId());

        // Assignment A: three marked submissions and one not yet marked (counts in the share denominator)
        submit(assignmentA, criteria("sig_figs", 3, 5, "too few s.f.", "graph", 3, 4, "no units"));
        submit(assignmentA, criteria("sig_figs", 2, 5, "too few s.f.", "graph", 2, 4, "no units"));
        submit(assignmentA, criteria("sig_figs", 5, 5, "ok", "graph", 3, 4, "no title"));
        submit(assignmentA, null);
        // Assignment B must not leak into A's numbers
        submit(assignmentB, criteria("sig_figs", 0, 5, "other assignment", "graph", 0, 4, "other assignment"));
    }

    @Test
    void commonMistakesUseOnlyThisAssignment() {
        var mistakes = analytics.commonMistakes(assignmentA.getId());

        assertThat(mistakes).hasSize(2);
        // graph lost marks on 3 of 4 submissions, sig_figs on 2 of 4
        assertThat(mistakes.get(0).criterionKey()).isEqualTo("graph");
        assertThat(mistakes.get(0).reason()).isEqualTo("no units");
        assertThat(mistakes.get(0).share()).isCloseTo(0.75, within(1e-9));
        assertThat(mistakes.get(1).criterionKey()).isEqualTo("sig_figs");
        assertThat(mistakes.get(1).reason()).isEqualTo("too few s.f.");
        assertThat(mistakes.get(1).share()).isCloseTo(0.5, within(1e-9));
    }

    @Test
    void criterionAveragesUseOnlyThisAssignment() {
        Map<String, Double> avgs = analytics.criterionAverages(assignmentA.getId());
        assertThat(avgs.keySet()).containsExactly("graph", "sig_figs");
        assertThat(avgs.get("graph")).isCloseTo(8.0 / 3, within(1e-9));
        assertThat(avgs.get("sig_figs")).isCloseTo(10.0 / 3, within(1e-9));
    }

    @Test
    void noSubmissionsMeansNoMistakes() {
        var empty = assignment(assignmentA.getClassId());
        assertThat(analytics.commonMistakes(empty.getId())).isEmpty();
        assertThat(analytics.criterionAverages(empty.getId())).isEmpty();
    }

    @Test
    void queryCountDoesNotGrowWithSubmissions() {
        long before = queriesFor(() -> {
            analytics.commonMistakes(assignmentA.getId());
            analytics.criterionAverages(assignmentA.getId());
        });

        // Ten more marked submissions on A, and ten on B (the old code scanned the whole table)
        for (int i = 0; i < 10; i++) {
            submit(assignmentA, criteria("sig_figs", 1, 5, "too few s.f.", "graph", 4, 4, "ok"));
            submit(assignmentB, criteria("sig_figs", 1, 5, "x", "graph", 1, 4, "y"));
        }

        long after = queriesFor(() -> {
            analytics.commonMistakes(assignmentA.getId());
            analytics.criterionAverages(assignmentA.getId());
        });

        assertThat(after).isEqualTo(before);
        assertThat(after).isLessThanOrEqualTo(3); // count + criteria (mistakes) + criteria (averages)
    }

    @Test
    void outlierIsFlaggedFromThisAssignmentsScoresOnly() {
        var outlierAssignment = assignment(assignmentA.getClassId());
        // Class scores 10-12 out of 20, and one 1/20: median 11, MAD 1, so 1/20 is 10 MADs out
        for (int score : new int[]{10, 10, 11, 11, 12, 12}) {
            submit(outlierAssignment, criteria("score", score, 20, "r"));
        }
        UUID low = submit(outlierAssignment, criteria("score", 1, 20, "r"));
        UUID normal = submit(outlierAssignment, criteria("score", 12, 20, "r"));

        flagService.checkOutlier(low, outlierAssignment.getId());
        flagService.checkOutlier(normal, outlierAssignment.getId());

        assertThat(flagRepo.findBySubmissionId(low)).extracting(ReviewFlag::getType).containsExactly("OUTLIER_RESULT");
        assertThat(flagRepo.findBySubmissionId(normal)).isEmpty();
    }

    @Test
    void outlierCheckQueryCountDoesNotGrowWithOtherAssignments() {
        UUID sub = submit(assignmentA, criteria("sig_figs", 4, 5, "r", "graph", 4, 4, "r"));
        long before = queriesFor(() -> flagService.checkOutlier(sub, assignmentA.getId()));
        for (int i = 0; i < 10; i++) {
            submit(assignmentB, criteria("sig_figs", 1, 5, "x", "graph", 1, 4, "y"));
        }
        long after = queriesFor(() -> flagService.checkOutlier(sub, assignmentA.getId()));
        assertThat(after).isEqualTo(before);
    }

    @Test
    void resultsPickEachStudentsBestThenLatestAttempt() {
        var a = assignment(assignmentA.getClassId());
        UUID markedThenRetrying = registerUserId("STUDENT");
        attemptFor(a, markedThenRetrying, 1, "MARKED", criteria("score", 8, 20, "r"));
        attemptFor(a, markedThenRetrying, 2, "IN_PROGRESS", null);

        UUID twoMarked = registerUserId("STUDENT"); // used to crash: two MARKED attempts for one student
        attemptFor(a, twoMarked, 1, "MARKED", criteria("score", 5, 20, "r"));
        attemptFor(a, twoMarked, 2, "MARKED", criteria("score", 7, 20, "r"));

        UUID waiting = registerUserId("STUDENT");
        attemptFor(a, waiting, 1, "SUBMITTED", null);

        UUID gaveUp = registerUserId("STUDENT");
        attemptFor(a, gaveUp, 1, "ABANDONED", null);

        var results = analytics.resultsForAssignment(a);
        var byUser = new java.util.HashMap<UUID, AnalyticsService.StudentStatus>();
        results.perStudent().forEach(st -> byUser.put(st.userId(), st));

        assertThat(byUser).containsOnlyKeys(markedThenRetrying, twoMarked, waiting);
        assertThat(byUser.get(markedThenRetrying)).isEqualTo(new AnalyticsService.StudentStatus(markedThenRetrying, "MARKED", 8));
        assertThat(byUser.get(twoMarked)).isEqualTo(new AnalyticsService.StudentStatus(twoMarked, "MARKED", 7));
        assertThat(byUser.get(waiting)).isEqualTo(new AnalyticsService.StudentStatus(waiting, "SUBMITTED", null));
        assertThat(results.submittedCount()).isEqualTo(2);
        // Stable order: by user id
        assertThat(results.perStudent()).extracting(AnalyticsService.StudentStatus::userId).isSorted();
    }

    @Test
    void resultsQueryCountDoesNotGrowWithClassSize() {
        long before = queriesFor(() -> analytics.resultsForAssignment(assignmentA));
        for (int i = 0; i < 10; i++) {
            submit(assignmentA, criteria("sig_figs", 3, 5, "r", "graph", 2, 4, "r"));
        }
        long after = queriesFor(() -> analytics.resultsForAssignment(assignmentA));
        assertThat(after).isEqualTo(before);
    }

    // ---- helpers ----

    private long queriesFor(Runnable action) {
        Statistics stats = emf.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();
        action.run();
        long count = stats.getPrepareStatementCount();
        stats.setStatisticsEnabled(false);
        return count;
    }

    private Assignment assignment(UUID classId) {
        Instant now = Instant.now();
        var a = new Assignment();
        a.setClassId(classId);
        a.setExperimentId("phy.pendulum.g");
        a.setExperimentVersion(1);
        a.setCreatedBy(teacherId);
        a.setMode("GRADED");
        a.setStatus("PUBLISHED");
        a.setNoiseLevel("REALISTIC");
        a.setAttemptsAllowed(2);
        a.setReleasePolicy("MANUAL");
        a.setOpensAt(now.minus(1, ChronoUnit.DAYS));
        a.setDueAt(now.plus(1, ChronoUnit.DAYS));
        return assignmentRepo.save(a);
    }

    /** key, awarded, max, reason — repeated. */
    private static Map<String, Object[]> criteria(Object... v) {
        Map<String, Object[]> m = new LinkedHashMap<>();
        for (int i = 0; i < v.length; i += 4) m.put((String) v[i], new Object[]{v[i + 1], v[i + 2], v[i + 3]});
        return m;
    }

    /** One student's submission for the assignment, marked with the given criteria (null = not marked yet). */
    private UUID submit(Assignment assignment, Map<String, Object[]> criteria) {
        return attemptFor(assignment, registerUserId("STUDENT"), 1, criteria == null ? "SUBMITTED" : "MARKED", criteria);
    }

    /** An attempt in the given state; a submission unless IN_PROGRESS/ABANDONED, marked when criteria is set. */
    private UUID attemptFor(Assignment assignment, UUID userId, int attemptNo, String state,
                            Map<String, Object[]> criteria) {
        var attempt = new Attempt();
        attempt.setUserId(userId);
        attempt.setAssignmentId(assignment.getId());
        attempt.setExperimentId("phy.pendulum.g");
        attempt.setExperimentVersion(1);
        attempt.setMode("GRADED");
        attempt.setSeed(new byte[16]);
        attempt.setAttemptNo(attemptNo);
        attempt.setState(state);
        attemptRepo.save(attempt);
        if ("IN_PROGRESS".equals(state) || "ABANDONED".equals(state)) return null;

        var submission = new Submission();
        submission.setAttemptId(attempt.getId());
        submission.setResults(Map.of());
        submission.setReadingsHash("hash-" + UUID.randomUUID());
        submission.setDeclarationAccepted(true);
        submissionRepo.save(submission);
        if (criteria == null) return submission.getId();

        int total = criteria.values().stream().mapToInt(c -> (int) c[0]).sum();
        int max = criteria.values().stream().mapToInt(c -> (int) c[1]).sum();
        var mark = new Mark();
        mark.setSubmissionId(submission.getId());
        mark.setTotal(total);
        mark.setMaxTotal(max);
        mark.setMarkerVersion("test");
        markRepo.save(mark);

        criteria.forEach((key, c) -> {
            var mc = new MarkCriterion();
            mc.setMarkId(mark.getId());
            mc.setCriterionKey(key);
            mc.setAwarded((int) c[0]);
            mc.setMax((int) c[1]);
            mc.setReason((String) c[2]);
            criterionRepo.save(mc);
        });
        return submission.getId();
    }
}
