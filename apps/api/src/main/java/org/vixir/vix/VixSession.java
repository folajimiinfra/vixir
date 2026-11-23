package org.vixir.vix;

import java.util.Map;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "vix_session")
public class VixSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "attempt_id")
    private UUID attemptId;

    @Column(nullable = false)
    private String room;

    @Column(nullable = false)
    private String mode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> consent;

    @Column(nullable = false)
    private String voice = "ada";

    @Column(nullable = false)
    private String locale = "en";

    @Column(nullable = false)
    private int turns = 0;

    @Column(name = "transcript_retained", nullable = false)
    private boolean transcriptRetained = false;

    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "ended_at")
    private Instant endedAt;

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getAttemptId() { return attemptId; }
    public void setAttemptId(UUID attemptId) { this.attemptId = attemptId; }
    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public Map<String, Object> getConsent() { return consent; }
    public void setConsent(Map<String, Object> consent) { this.consent = consent; }
    public String getVoice() { return voice; }
    public void setVoice(String voice) { this.voice = voice; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public int getTurns() { return turns; }
    public void setTurns(int turns) { this.turns = turns; }
    public boolean isTranscriptRetained() { return transcriptRetained; }
    public void setTranscriptRetained(boolean transcriptRetained) { this.transcriptRetained = transcriptRetained; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }
}
