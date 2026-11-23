package org.vixir.experiment;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import org.vixir.common.ApiException;

/**
 * Public read-only experiment catalogue (Req 5.3–5.4).
 * GET /api/v1/experiments and GET /api/v1/experiments/{id}/versions/{v}
 */
@Tag(name = "Experiments")
@SecurityRequirements()
@RestController
@RequestMapping("/api/v1/experiments")
public class ExperimentController {

    private final ExperimentRepository experimentRepo;
    private final ExperimentVersionRepository versionRepo;
    private final RubricRepository rubricRepo;

    public ExperimentController(ExperimentRepository experimentRepo,
                                 ExperimentVersionRepository versionRepo,
                                 RubricRepository rubricRepo) {
        this.experimentRepo = experimentRepo;
        this.versionRepo = versionRepo;
        this.rubricRepo = rubricRepo;
    }

    /** List PUBLISHED experiments, optionally filtered by subject. */
    @Operation(summary = "List published experiments", description = "Public. Optionally filter by subject, e.g. physics.")
    @GetMapping
    List<ExperimentSummary> list(@RequestParam(required = false) String subject) {
        return experimentRepo.findPublished(subject).stream()
                .map(e -> {
                    var ev = e.getLatestPublishedVersion() != null
                            ? versionRepo.findByExperimentIdAndVersion(e.getId(), e.getLatestPublishedVersion()).orElse(null)
                            : null;
                    return ExperimentSummary.from(e, ev);
                })
                .toList();
    }

    /** Full config for a specific version. */
    @Operation(summary = "Get a published experiment version", description = "Public. Returns the full config and rubric.")
    @GetMapping("/{id}/versions/{version}")
    ExperimentVersionDetail getVersion(@PathVariable String id, @PathVariable int version) {
        var ev = versionRepo.findByExperimentIdAndVersion(id, version)
                .filter(v -> "PUBLISHED".equals(v.getStatus()))
                .orElseThrow(() -> ApiException.notFound("EXPERIMENT_NOT_FOUND",
                        "Experiment version not found or not published"));
        var rubric = rubricRepo.findByExperimentIdAndVersion(id, version).orElse(null);
        return ExperimentVersionDetail.from(ev, rubric);
    }

    /** Latest published version shorthand. */
    @Operation(summary = "Get the latest published version of an experiment", description = "Public.")
    @GetMapping("/{id}")
    ExperimentVersionDetail getLatest(@PathVariable String id) {
        var experiment = experimentRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("EXPERIMENT_NOT_FOUND", "Experiment not found"));
        if (experiment.getLatestPublishedVersion() == null) {
            throw ApiException.notFound("EXPERIMENT_NOT_FOUND", "No published version");
        }
        return getVersion(id, experiment.getLatestPublishedVersion());
    }
}
