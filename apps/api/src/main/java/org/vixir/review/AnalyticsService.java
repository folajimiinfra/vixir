package org.vixir.review;

import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.vixir.assignment.Assignment;
import org.vixir.attempt.Attempt;
import org.vixir.attempt.AttemptRepository;
import org.vixir.marking.Mark;
import org.vixir.marking.MarkCriterion;
import org.vixir.marking.MarkCriterionRepository;
import org.vixir.marking.MarkRepository;
import org.vixir.school.EnrolmentRepository;
import org.vixir.submission.Submission;
import org.vixir.submission.SubmissionRepository;

/**
 * Class-wide results, histogram and common mistakes (Req 12.1–12.2).
 */
@Service
public class AnalyticsService {

    private final AttemptRepository attemptRepo;
    private final SubmissionRepository submissionRepo;
    private final MarkRepository markRepo;
    private final MarkCriterionRepository criterionRepo;
    private final ReviewFlagRepository flagRepo;
    private final EnrolmentRepository enrolmentRepo;

    public AnalyticsService(AttemptRepository attemptRepo,
                             SubmissionRepository submissionRepo,
                             MarkRepository markRepo,
                             MarkCriterionRepository criterionRepo,
                             ReviewFlagRepository flagRepo,
                             EnrolmentRepository enrolmentRepo) {
        this.attemptRepo = attemptRepo;
        this.submissionRepo = submissionRepo;
        this.markRepo = markRepo;
        this.criterionRepo = criterionRepo;
        this.flagRepo = flagRepo;
        this.enrolmentRepo = enrolmentRepo;
    }

    public record AssignmentResults(
            long enrolledCount,
            long submittedCount,
            List<StudentStatus> perStudent,
            int[] histogram,          // 5 equal buckets 0..max
            Map<String, Double> criterionAverages,
            long openFlagCount
    ) {}

    public record StudentStatus(UUID userId, String state, Integer total) {}

    /**
     * Results for one assignment. Takes the Assignment itself (callers already load it for the ownership
     * check) so the class used for enrolledCount always matches the assignment.
     */
    public AssignmentResults resultsForAssignment(Assignment assignment) {
        UUID assignmentId = assignment.getId();
        long enrolled = enrolmentRepo.countStudents(assignment.getClassId());

        // Two queries for any class size: the assignment's attempts, and the mark total per attempt.
        Map<UUID, Integer> totalByAttempt = new HashMap<>();
        markRepo.findAttemptTotalsByAssignmentId(assignmentId)
                .forEach(t -> totalByAttempt.put(t.getAttemptId(), t.getTotal()));

        // Each student's representative attempt: best state first, then the latest attempt.
        Map<UUID, Attempt> chosen = new TreeMap<>();
        for (Attempt a : attemptRepo.findByAssignmentId(assignmentId)) {
            if (a.getUserId() == null || statePriority(a.getState()) < 0) continue;
            chosen.merge(a.getUserId(), a, (x, y) -> better(x, y) ? x : y);
        }

        List<StudentStatus> statuses = new ArrayList<>();
        List<Integer> scores = new ArrayList<>();
        for (var e : chosen.entrySet()) {
            Integer total = totalByAttempt.get(e.getValue().getId());
            if (total != null) scores.add(total);
            statuses.add(new StudentStatus(e.getKey(), e.getValue().getState(), total));
        }

        int[] histogram = buildHistogram(scores);
        Map<String, Double> criterionAvgs = criterionAverages(assignmentId);
        long openFlags = flagRepo.findOpenFlagsForAssignment(assignmentId).size();

        return new AssignmentResults(enrolled, scores.size(), statuses, histogram, criterionAvgs, openFlags);
    }

    /** RELEASED > MARKED > SUBMITTED > IN_PROGRESS; -1 for states that don't count (ABANDONED). */
    private static int statePriority(String state) {
        return switch (state) {
            case "RELEASED" -> 3;
            case "MARKED" -> 2;
            case "SUBMITTED" -> 1;
            case "IN_PROGRESS" -> 0;
            default -> -1;
        };
    }

    private static boolean better(Attempt x, Attempt y) {
        int px = statePriority(x.getState()), py = statePriority(y.getState());
        return px != py ? px > py : x.getAttemptNo() >= y.getAttemptNo();
    }

    public record CommonMistake(String criterionKey, String reason, double share) {}

    public List<CommonMistake> commonMistakes(UUID assignmentId) {
        // Two queries whatever the data size: this assignment's criterion rows, and its submission count.
        long submissionCount = submissionRepo.countByAssignmentId(assignmentId);
        if (submissionCount == 0) return List.of();

        Map<String, List<String>> lostByKey = new HashMap<>();
        criterionRepo.findByAssignmentId(assignmentId).stream()
                .filter(c -> c.getAwarded() < c.getMax())
                .forEach(c -> lostByKey
                        .computeIfAbsent(c.getCriterionKey(), k -> new ArrayList<>())
                        .add(c.getReason()));

        double total = submissionCount;
        return lostByKey.entrySet().stream()
                // Most-lost first; ties by key so the order is stable
                .sorted(Comparator.comparingInt((Map.Entry<String, List<String>> e) -> e.getValue().size()).reversed()
                        .thenComparing(Map.Entry::getKey))
                .limit(5)
                .map(e -> {
                    // Most common reason
                    String topReason = e.getValue().stream()
                            .collect(Collectors.groupingBy(r -> r, Collectors.counting()))
                            .entrySet().stream()
                            // Most frequent reason; ties go to the alphabetically first
                            .max(Map.Entry.<String, Long>comparingByValue()
                                    .thenComparing(Map.Entry.comparingByKey(Comparator.reverseOrder())))
                            .map(Map.Entry::getKey).orElse("");
                    return new CommonMistake(e.getKey(), topReason, e.getValue().size() / total);
                })
                .toList();
    }

    // ---- helpers ----

    private int[] buildHistogram(List<Integer> scores) {
        int[] h = new int[5];
        if (scores.isEmpty()) return h;
        int maxScore = scores.stream().mapToInt(Integer::intValue).max().orElse(100);
        if (maxScore == 0) return h;
        for (int s : scores) {
            int bucket = Math.min(4, (int) (5.0 * s / (maxScore + 1)));
            h[bucket]++;
        }
        return h;
    }

    Map<String, Double> criterionAverages(UUID assignmentId) {
        // One query for this assignment's criterion rows (was: every submission on the platform, then N+1)
        Map<String, List<Integer>> byKey = new TreeMap<>();
        criterionRepo.findByAssignmentId(assignmentId).forEach(c ->
                byKey.computeIfAbsent(c.getCriterionKey(), k -> new ArrayList<>()).add(c.getAwarded()));
        Map<String, Double> avgs = new LinkedHashMap<>();
        byKey.forEach((k, v) -> avgs.put(k, v.stream().mapToInt(i -> i).average().orElse(0)));
        return avgs;
    }
}
