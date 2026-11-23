package org.vixir.vix;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vix_message")
public class VixMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "vix_session_id", nullable = false)
    private UUID vixSessionId;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private String text;

    @Column(name = "policy_blocked", nullable = false)
    private boolean policyBlocked = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public UUID getVixSessionId() { return vixSessionId; }
    public void setVixSessionId(UUID vixSessionId) { this.vixSessionId = vixSessionId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public boolean isPolicyBlocked() { return policyBlocked; }
    public void setPolicyBlocked(boolean policyBlocked) { this.policyBlocked = policyBlocked; }
    public Instant getCreatedAt() { return createdAt; }
}
