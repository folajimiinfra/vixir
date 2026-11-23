package org.vixir.experiment;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.common.ApiException;

/**
 * Scripted Vix tours per screen code, read from the {@code tours} section of published experiment configs
 * (Req 13.7). The browser plays them with speech synthesis when the agent is unreachable.
 * Config shape: {@code "tours": { "D1": [ { "regionId": "...", "caption": "..." } ] }}, the same step
 * shape as the startTour RPC in contracts.md.
 */
@Service
public class TourService {

    public record TourStep(String regionId, String caption) {}

    public record Tour(String screenCode, String experimentId, int experimentVersion, List<TourStep> steps) {}

    private final ExperimentRepository experimentRepo;
    private final ExperimentVersionRepository versionRepo;

    public TourService(ExperimentRepository experimentRepo, ExperimentVersionRepository versionRepo) {
        this.experimentRepo = experimentRepo;
        this.versionRepo = versionRepo;
    }

    /**
     * The tour for {@code screenCode}, from the latest published version of {@code experimentId} when given,
     * otherwise from the first published experiment (by id) that defines one. 404 TOUR_NOT_FOUND if none does.
     */
    @Transactional(readOnly = true)
    public Tour tour(String screenCode, String experimentId) {
        List<Experiment> candidates = experimentRepo.findPublished(null).stream()
                .filter(e -> experimentId == null || experimentId.equals(e.getId()))
                .sorted(Comparator.comparing(Experiment::getId))
                .toList();

        for (Experiment e : candidates) {
            var version = versionRepo.findByExperimentIdAndVersion(e.getId(), e.getLatestPublishedVersion())
                    .orElse(null);
            if (version == null) continue;
            List<TourStep> steps = stepsFor(version.getConfig(), screenCode);
            if (steps != null) {
                return new Tour(screenCode, e.getId(), version.getVersion(), steps);
            }
        }
        throw ApiException.notFound("TOUR_NOT_FOUND", "No scripted tour for screen " + screenCode);
    }

    /** Steps for one screen, or null if the config has no tour for it. Malformed steps are skipped. */
    static List<TourStep> stepsFor(Map<String, Object> config, String screenCode) {
        if (config == null || !(config.get("tours") instanceof Map<?, ?> tours)) return null;
        if (!(tours.get(screenCode) instanceof List<?> rawSteps)) return null;
        List<TourStep> steps = new ArrayList<>();
        for (Object raw : rawSteps) {
            if (raw instanceof Map<?, ?> step
                    && step.get("regionId") instanceof String regionId
                    && step.get("caption") instanceof String caption) {
                steps.add(new TourStep(regionId, caption));
            }
        }
        return steps;
    }
}
