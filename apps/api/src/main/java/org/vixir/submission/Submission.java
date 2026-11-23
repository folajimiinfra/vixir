package org.vixir.submission;

import java.util.Map;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "submission")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "attempt_id", nullable = false, unique = true)
    private UUID attemptId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> results;

    @Column(name = "readings_hash", nullable = false)
    private String readingsHash;

    @Column(name = "declaration_accepted", nullable = false)
    private boolean declarationAccepted;

    @Column(nullable = false)
    private boolean late = false;

    @Column(name = "idempotency_key")
    private String idempotencyKey;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt = Instant.now();

    public UUID getId() { return id; }
    public UUID getAttemptId() { return attemptId; }
    public void setAttemptId(UUID attemptId) { this.attemptId = attemptId; }
    public Map<String, Object> getResults() { return results; }
    public void setResults(Map<String, Object> results) { this.results = results; }
    public String getReadingsHash() { return readingsHash; }
    public void setReadingsHash(String readingsHash) { this.readingsHash = readingsHash; }
    public boolean isDeclarationAccepted() { return declarationAccepted; }
    public void setDeclarationAccepted(boolean declarationAccepted) { this.declarationAccepted = declarationAccepted; }
    public boolean isLate() { return late; }
    public void setLate(boolean late) { this.late = late; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public Instant getSubmittedAt() { return submittedAt; }
}
