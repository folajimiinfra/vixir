package org.vixir.attempt;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "attempt")
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId; // nullable for anonymous

    @Column(name = "assignment_id")
    private UUID assignmentId; // nullable for free practice

    @Column(name = "experiment_id", nullable = false)
    private String experimentId;

    @Column(name = "experiment_version", nullable = false)
    private int experimentVersion;

    @Column(nullable = false)
    private String mode;

    @Column(name = "attempt_no", nullable = false)
    private int attemptNo = 1;

    @Column(nullable = false)
    private byte[] seed;

    @Column(nullable = false)
    private String state = "IN_PROGRESS";

    @Column(name = "last_event_seq", nullable = false)
    private int lastEventSeq = 0;

    @Column(name = "device_id")
    private UUID deviceId;

    @Column(name = "anon_token_hash")
    private String anonTokenHash;

    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "client_submitted_at")
    private Instant clientSubmittedAt;

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getAssignmentId() { return assignmentId; }
    public void setAssignmentId(UUID assignmentId) { this.assignmentId = assignmentId; }
    public String getExperimentId() { return experimentId; }
    public void setExperimentId(String experimentId) { this.experimentId = experimentId; }
    public int getExperimentVersion() { return experimentVersion; }
    public void setExperimentVersion(int experimentVersion) { this.experimentVersion = experimentVersion; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public int getAttemptNo() { return attemptNo; }
    public void setAttemptNo(int attemptNo) { this.attemptNo = attemptNo; }
    public byte[] getSeed() { return seed; }
    public void setSeed(byte[] seed) { this.seed = seed; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public int getLastEventSeq() { return lastEventSeq; }
    public void setLastEventSeq(int lastEventSeq) { this.lastEventSeq = lastEventSeq; }
    public UUID getDeviceId() { return deviceId; }
    public void setDeviceId(UUID deviceId) { this.deviceId = deviceId; }
    public String getAnonTokenHash() { return anonTokenHash; }
    public void setAnonTokenHash(String anonTokenHash) { this.anonTokenHash = anonTokenHash; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public Instant getClientSubmittedAt() { return clientSubmittedAt; }
    public void setClientSubmittedAt(Instant clientSubmittedAt) { this.clientSubmittedAt = clientSubmittedAt; }
}
