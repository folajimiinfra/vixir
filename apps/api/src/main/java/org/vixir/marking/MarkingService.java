package org.vixir.marking;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.attempt.Attempt;
import org.vixir.attempt.AttemptRepository;
import org.vixir.attempt.event.Reading;
import org.vixir.attempt.event.ReadingRepository;
import org.vixir.experiment.ExperimentVersionRepository;
import org.vixir.experiment.RubricRepository;
import org.vixir.submission.MarkingRequestedEvent;
import org.vixir.submission.Submission;
import org.vixir.submission.SubmissionRepository;

/**
 * Orchestrates marking: listens to MarkingRequestedEvent, runs the pure Marker,
 * persists results, sets attempt state, recovers SUBMITTED-without-mark on startup (Req 10.1–10.9).
 */
@Service
public class MarkingService {

    private static final Logger log = LoggerFactory.getLogger(MarkingService.class);

    private final SubmissionRepository submissionRepo;
    private final AttemptRepository attemptRepo;
    private final ReadingRepository readingRepo;
    private final MarkRepository markRepo;
    private final MarkCriterionRepository criterionRepo;
    private final ExperimentVersionRepository versionRepo;
    private final RubricRepository rubricRepo;
    private final ObjectMapper mapper;

    // Bounded executor so marking doesn't monopolise the request thread pool (Req 15.7)
    private final ExecutorService executor = Executors.newFixedThreadPool(
            Math.max(2, Runtime.getRuntime().availableProcessors()));

    public MarkingService(SubmissionRepository submissionRepo,
                          AttemptRepository attemptRepo,
                          ReadingRepository readingRepo,
                          MarkRepository markRepo,
                          MarkCriterionRepository criterionRepo,
                          ExperimentVersionRepository versionRepo,
                          RubricRepository rubricRepo,
                          ObjectMapper mapper) {
        this.submissionRepo = submissionRepo;
        this.attemptRepo = attemptRepo;
        this.readingRepo = readingRepo;
        this.markRepo = markRepo;
        this.criterionRepo = criterionRepo;
        this.versionRepo = versionRepo;
        this.rubricRepo = rubricRepo;
        this.mapper = mapper;
    }

    /** Triggered by submission — enqueues asynchronously (Req 9.5). */
    @EventListener
    public void onMarkingRequested(MarkingRequestedEvent event) {
        executor.submit(() -> markSafely(event.submissionId()));
    }

    /** Recover SUBMITTED attempts with no mark on startup (design §Recovery). */
    @EventListener(ApplicationStartedEvent.class)
    public void recoverOnStartup() {
        attemptRepo.findSubmittedWithoutMark().forEach(a -> {
            submissionRepo.findByAttemptId(a.getId())
                    .ifPresent(s -> executor.submit(() -> markSafely(s.getId())));
        });
    }

    private void markSafely(UUID submissionId) {
        try {
            mark(submissionId);
        } catch (Exception e) {
            log.error("Marking failed for submission {}: {}", submissionId, e.getMessage(), e);
        }
    }

    @Transactional
    public void mark(UUID submissionId) {
        // Idempotent — skip if already marked
        if (markRepo.findBySubmissionId(submissionId).isPresent()) return;

        Submission submission = submissionRepo.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));
        Attempt attempt = attemptRepo.findById(submission.getAttemptId())
                .orElseThrow(() -> new IllegalArgumentException("Attempt not found"));

        List<Reading> readingRows = readingRepo.findByAttemptIdOrderByRowIndexAsc(attempt.getId());
        var rubric = rubricRepo.findByExperimentIdAndVersion(
                attempt.getExperimentId(), attempt.getExperimentVersion()).orElse(null);
        var expVersion = versionRepo.findByExperimentIdAndVersion(
                attempt.getExperimentId(), attempt.getExperimentVersion()).orElse(null);

        if (rubric == null || expVersion == null) {
            log.warn("Cannot mark submission {} — missing rubric or experiment version", submissionId);
            return;
        }

        // Build MarkingInput
        List<Map<String, Object>> readings = readingRows.stream()
                .map(r -> mapper.<Map<String, Object>>convertValue(r.getValues(),
                        mapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class)))
                .toList();

        @SuppressWarnings("unchecked")
        Map<String, Object> results = mapper.convertValue(submission.getResults(),
                mapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> criteria = mapper.convertValue(rubric.getCriteria(),
                mapper.getTypeFactory().constructCollectionType(List.class, Map.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> config = mapper.convertValue(expVersion.getConfig(),
                mapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> analysis = (Map<String, Object>) config.getOrDefault("analysis", Map.of());

        List<Set<String>> precautionKeywordSets = extractPrecautionKeywordSets(config);

        var input = new MarkingInput(readings, results, criteria, analysis, precautionKeywordSets);

        // Run pure evaluator (Req 10.7 — deterministic)
        MarkingOutput output = Marker.evaluate(input);

        // Persist MARK
        var mark = new Mark();
        mark.setSubmissionId(submissionId);
        mark.setTotal(output.total());
        mark.setMaxTotal(output.maxTotal());
        mark.setMarkerVersion(Marker.VERSION);
        markRepo.save(mark);

        // Persist MARK_CRITERION rows
        for (CriterionResult cr : output.criteria()) {
            var mc = new MarkCriterion();
            mc.setMarkId(mark.getId());
            mc.setCriterionKey(cr.key());
            mc.setAwarded(cr.awarded());
            mc.setMax(cr.max());
            mc.setReason(cr.reason());
            criterionRepo.save(mc);
        }

        // Req 10.9 — advance attempt state
        String releasePolicy = getReleasePolicy(attempt);
        attempt.setState("AUTO".equals(releasePolicy) ? "RELEASED" : "MARKED");
        if ("RELEASED".equals(attempt.getState())) {
            mark.setReleasedAt(Instant.now());
            markRepo.save(mark);
        }
        attemptRepo.save(attempt);

        log.info("Marked submission {} → {}/{} (attempt state: {})",
                submissionId, output.total(), output.maxTotal(), attempt.getState());
    }

    // ---- helpers ----

    @SuppressWarnings("unchecked")
    private List<Set<String>> extractPrecautionKeywordSets(Map<String, Object> config) {
        Object precautions = config.get("precautions");
        if (!(precautions instanceof List)) return List.of();
        List<Set<String>> result = new ArrayList<>();
        for (Object p : (List<?>) precautions) {
            if (p instanceof Map<?,?> pm) {
                Object kwObj = pm.get("keywords");
                if (kwObj instanceof List<?> kwList) {
                    Set<String> kws = new HashSet<>();
                    kwList.forEach(k -> kws.add(k.toString()));
                    result.add(kws);
                }
            }
        }
        return result;
    }

    private String getReleasePolicy(Attempt attempt) {
        if (attempt.getAssignmentId() == null) return "AUTO";
        // We'd normally look up the assignment but to avoid a circular dep we return MANUAL as default
        return "MANUAL";
    }
}
