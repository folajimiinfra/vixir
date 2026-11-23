package org.vixir.marking;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "mark_criterion")
public class MarkCriterion {

    @EmbeddedId
    private MarkCriterionId id = new MarkCriterionId();

    @Column(nullable = false)
    private int awarded;

    @Column(nullable = false)
    private int max;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private boolean overridden = false;

    @Embeddable
    public static class MarkCriterionId implements Serializable {
        @Column(name = "mark_id")
        private UUID markId;
        @Column(name = "criterion_key")
        private String criterionKey;

        @Override public boolean equals(Object o) {
            if (!(o instanceof MarkCriterionId that)) return false;
            return Objects.equals(markId, that.markId) && Objects.equals(criterionKey, that.criterionKey);
        }
        @Override public int hashCode() { return Objects.hash(markId, criterionKey); }
        public UUID getMarkId() { return markId; }
        public void setMarkId(UUID markId) { this.markId = markId; }
        public String getCriterionKey() { return criterionKey; }
        public void setCriterionKey(String criterionKey) { this.criterionKey = criterionKey; }
    }

    // convenience
    public UUID getMarkId() { return id.getMarkId(); }
    public void setMarkId(UUID markId) { id.setMarkId(markId); }
    public String getCriterionKey() { return id.getCriterionKey(); }
    public void setCriterionKey(String k) { id.setCriterionKey(k); }
    public int getAwarded() { return awarded; }
    public void setAwarded(int awarded) { this.awarded = awarded; }
    public int getMax() { return max; }
    public void setMax(int max) { this.max = max; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public boolean isOverridden() { return overridden; }
    public void setOverridden(boolean overridden) { this.overridden = overridden; }
    public MarkCriterionId getId() { return id; }
}
