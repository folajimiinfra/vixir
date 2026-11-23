package org.vixir.assignment;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assignment")
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "class_id", nullable = false)
    private UUID classId;

    @Column(name = "experiment_id", nullable = false)
    private String experimentId;

    @Column(name = "experiment_version", nullable = false)
    private int experimentVersion;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(nullable = false)
    private String mode = "GRADED";

    @Column(nullable = false)
    private String status = "DRAFT";

    private String instructions;

    @Column(name = "noise_level", nullable = false)
    private String noiseLevel = "REALISTIC";

    @Column(name = "attempts_allowed", nullable = false)
    private int attemptsAllowed = 2;

    @Column(name = "release_policy", nullable = false)
    private String releasePolicy = "MANUAL";

    @Column(name = "opens_at", nullable = false)
    private Instant opensAt;

    @Column(name = "due_at", nullable = false)
    private Instant dueAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public String getExperimentId() { return experimentId; }
    public void setExperimentId(String experimentId) { this.experimentId = experimentId; }
    public int getExperimentVersion() { return experimentVersion; }
    public void setExperimentVersion(int experimentVersion) { this.experimentVersion = experimentVersion; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getNoiseLevel() { return noiseLevel; }
    public void setNoiseLevel(String noiseLevel) { this.noiseLevel = noiseLevel; }
    public int getAttemptsAllowed() { return attemptsAllowed; }
    public void setAttemptsAllowed(int attemptsAllowed) { this.attemptsAllowed = attemptsAllowed; }
    public String getReleasePolicy() { return releasePolicy; }
    public void setReleasePolicy(String releasePolicy) { this.releasePolicy = releasePolicy; }
    public Instant getOpensAt() { return opensAt; }
    public void setOpensAt(Instant opensAt) { this.opensAt = opensAt; }
    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
    public Instant getCreatedAt() { return createdAt; }
}
