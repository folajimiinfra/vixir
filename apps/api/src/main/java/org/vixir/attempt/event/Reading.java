package org.vixir.attempt.event;

import java.util.Map;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "reading")
public class Reading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "attempt_id", nullable = false)
    private UUID attemptId;

    @Column(name = "row_index", nullable = false)
    private int rowIndex;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "values", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> values;

    @Column(columnDefinition = "text[]")
    private String[] flags = {};

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt = Instant.now();

    public UUID getId() { return id; }
    public UUID getAttemptId() { return attemptId; }
    public void setAttemptId(UUID attemptId) { this.attemptId = attemptId; }
    public int getRowIndex() { return rowIndex; }
    public void setRowIndex(int rowIndex) { this.rowIndex = rowIndex; }
    public Map<String, Object> getValues() { return values; }
    public void setValues(Map<String, Object> values) { this.values = values; }
    public String[] getFlags() { return flags; }
    public void setFlags(String[] flags) { this.flags = flags; }
    public Instant getRecordedAt() { return recordedAt; }
}
