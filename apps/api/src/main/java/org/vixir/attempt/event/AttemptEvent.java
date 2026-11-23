package org.vixir.attempt.event;

import java.util.Map;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "attempt_event")
public class AttemptEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attempt_id", nullable = false)
    private UUID attemptId;

    @Column(name = "client_event_id", nullable = false)
    private UUID clientEventId;

    @Column(nullable = false)
    private int seq;

    @Column(nullable = false)
    private String type;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> payload;

    @Column(name = "sim_time_ms")
    private Long simTimeMs;

    @Column(name = "client_ts")
    private Instant clientTs;

    @Column(name = "server_ts", nullable = false, updatable = false)
    private Instant serverTs = Instant.now();

    public Long getId() { return id; }
    public UUID getAttemptId() { return attemptId; }
    public void setAttemptId(UUID attemptId) { this.attemptId = attemptId; }
    public UUID getClientEventId() { return clientEventId; }
    public void setClientEventId(UUID clientEventId) { this.clientEventId = clientEventId; }
    public int getSeq() { return seq; }
    public void setSeq(int seq) { this.seq = seq; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }
    public Long getSimTimeMs() { return simTimeMs; }
    public void setSimTimeMs(Long simTimeMs) { this.simTimeMs = simTimeMs; }
    public Instant getClientTs() { return clientTs; }
    public void setClientTs(Instant clientTs) { this.clientTs = clientTs; }
    public Instant getServerTs() { return serverTs; }
}
