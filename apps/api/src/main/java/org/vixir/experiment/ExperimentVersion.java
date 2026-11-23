package org.vixir.experiment;

import java.util.Map;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "experiment_version")
public class ExperimentVersion {

    @EmbeddedId
    private ExperimentVersionId id = new ExperimentVersionId();

    @Column(nullable = false)
    private String status = "DRAFT";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> config;

    @Column(columnDefinition = "text[]")
    private String[] curricula = {};

    @Column(columnDefinition = "text[]")
    private String[] level = {};

    @Column(name = "author_id")
    private UUID authorId;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Embeddable
    public static class ExperimentVersionId implements Serializable {
        @Column(name = "experiment_id")
        private String experimentId;

        @Column(name = "version")
        private int version;

        public String getExperimentId() { return experimentId; }
        public void setExperimentId(String experimentId) { this.experimentId = experimentId; }
        public int getVersion() { return version; }
        public void setVersion(int version) { this.version = version; }

        @Override public boolean equals(Object o) {
            if (!(o instanceof ExperimentVersionId that)) return false;
            return version == that.version && Objects.equals(experimentId, that.experimentId);
        }
        @Override public int hashCode() { return Objects.hash(experimentId, version); }
    }

    public ExperimentVersionId getId() { return id; }
    public String getExperimentId() { return id.getExperimentId(); }
    public void setExperimentId(String experimentId) { id.setExperimentId(experimentId); }
    public int getVersion() { return id.getVersion(); }
    public void setVersion(int version) { id.setVersion(version); }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Map<String, Object> getConfig() { return config; }
    public void setConfig(Map<String, Object> config) { this.config = config; }
    public String[] getCurricula() { return curricula; }
    public void setCurricula(String[] curricula) { this.curricula = curricula; }
    public String[] getLevel() { return level; }
    public void setLevel(String[] level) { this.level = level; }
    public UUID getAuthorId() { return authorId; }
    public void setAuthorId(UUID authorId) { this.authorId = authorId; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
}
