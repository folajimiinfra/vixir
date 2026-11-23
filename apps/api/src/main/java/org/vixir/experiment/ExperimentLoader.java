package org.vixir.experiment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.common.VixirProperties;

/**
 * Loads experiment configs from packages/experiments at startup, validates them against
 * experiment.schema.json, and upserts EXPERIMENT + EXPERIMENT_VERSION + RUBRIC rows (Req 5.1–5.2).
 */
@Component
public class ExperimentLoader {

    private static final Logger log = LoggerFactory.getLogger(ExperimentLoader.class);

    private final VixirProperties props;
    private final ExperimentRepository experimentRepo;
    private final ExperimentVersionRepository versionRepo;
    private final RubricRepository rubricRepo;
    private final ObjectMapper mapper;

    public ExperimentLoader(VixirProperties props,
                            ExperimentRepository experimentRepo,
                            ExperimentVersionRepository versionRepo,
                            RubricRepository rubricRepo,
                            ObjectMapper mapper) {
        this.props = props;
        this.experimentRepo = experimentRepo;
        this.versionRepo = versionRepo;
        this.rubricRepo = rubricRepo;
        this.mapper = mapper;
    }

    @EventListener(ApplicationStartedEvent.class)
    @Transactional
    public void load() {
        Path dir = Paths.get(props.experimentsDir());
        if (!Files.isDirectory(dir)) {
            log.warn("Experiments directory not found at {}; skipping load", dir.toAbsolutePath());
            return;
        }

        // Load schema
        Path schemaPath = dir.resolve("experiment.schema.json");
        if (!Files.exists(schemaPath)) {
            log.warn("experiment.schema.json not found at {}; skipping validation", schemaPath);
        }

        var schemaFactory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7);
        com.networknt.schema.JsonSchema schema = null;
        if (Files.exists(schemaPath)) {
            try (var is = new FileInputStream(schemaPath.toFile())) {
                schema = schemaFactory.getSchema(is);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to load experiment.schema.json: " + e.getMessage(), e);
            }
        }

        // Walk experiment subdirectories
        File[] subDirs = dir.toFile().listFiles(File::isDirectory);
        if (subDirs == null) return;

        for (File expDir : subDirs) {
            File[] versionFiles = expDir.listFiles(f -> f.getName().matches("v\\d+\\.json"));
            if (versionFiles == null) continue;
            Arrays.sort(versionFiles);

            for (File vf : versionFiles) {
                loadVersionFile(vf, schema);
            }
        }

        log.info("Experiment catalogue loaded from {}", dir.toAbsolutePath());
    }

    private void loadVersionFile(File file, com.networknt.schema.JsonSchema schema) {
        try {
            JsonNode node = mapper.readTree(file);

            // Validate against schema (Req 5.2 — fail startup on invalid)
            if (schema != null) {
                Set<ValidationMessage> errors = schema.validate(node);
                if (!errors.isEmpty()) {
                    String msg = errors.stream().map(ValidationMessage::getMessage)
                            .collect(Collectors.joining(", "));
                    throw new IllegalStateException(
                            "Invalid experiment config in " + file.getPath() + ": " + msg);
                }
            }

            String id      = node.get("id").asText();
            int version    = node.get("version").asInt();
            String subject = node.get("subject").asText();
            String title   = node.get("title").asText();

            // Upsert EXPERIMENT row
            var experiment = experimentRepo.findById(id).orElseGet(() -> {
                var e = new Experiment();
                e.setId(id);
                return e;
            });
            experiment.setSubject(subject.toUpperCase());
            experiment.setTitle(title);

            // Upsert EXPERIMENT_VERSION
            var evId = new ExperimentVersion.ExperimentVersionId();
            evId.setExperimentId(id);
            evId.setVersion(version);

            var ev = versionRepo.findById(evId).orElseGet(() -> {
                var v = new ExperimentVersion();
                v.setExperimentId(id);
                v.setVersion(version);
                return v;
            });
            ev.setConfig(mapper.convertValue(node, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {}));
            ev.setStatus("PUBLISHED");
            ev.setPublishedAt(Instant.now());

            // curricula array
            if (node.has("curricula")) {
                List<String> curricula = new java.util.ArrayList<>();
                node.get("curricula").forEach(c -> curricula.add(c.asText()));
                ev.setCurricula(curricula.toArray(new String[0]));
            }

            // Parent row first: experiment_version.experiment_id references experiment(id).
            experiment.setLatestPublishedVersion(version);
            experimentRepo.saveAndFlush(experiment);
            versionRepo.save(ev);

            // Upsert RUBRIC from rubric section
            if (node.has("rubric")) {
                JsonNode rubricNode = node.get("rubric");
                var rubric = rubricRepo.findByExperimentIdAndVersion(id, version).orElseGet(() -> {
                    var r = new Rubric();
                    r.setExperimentId(id);
                    r.setVersion(version);
                    return r;
                });
                rubric.setCriteria(mapper.convertValue(rubricNode.get("criteria"), new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {}));
                int maxTotal = 0;
                if (rubricNode.has("criteria")) {
                    for (JsonNode c : rubricNode.get("criteria")) {
                        if (c.has("max")) maxTotal += c.get("max").asInt();
                    }
                }
                rubric.setMaxTotal(Math.max(maxTotal, 1));
                rubricRepo.save(rubric);
            }

            log.info("Loaded experiment {} v{}", id, version);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load experiment file " + file.getPath() + ": " + e.getMessage(), e);
        }
    }
}
