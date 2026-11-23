package org.vixir.school;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "enrolment")
public class Enrolment {

    @EmbeddedId
    private EnrolmentId id = new EnrolmentId();

    @Column(name = "class_role", nullable = false)
    @Enumerated(EnumType.STRING)
    private ClassRole classRole = ClassRole.STUDENT;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt = Instant.now();

    public enum ClassRole { STUDENT, CO_TEACHER }

    @Embeddable
    public static class EnrolmentId implements Serializable {
        @Column(name = "class_id")
        private UUID classId;
        @Column(name = "user_id")
        private UUID userId;

        public UUID getClassId() { return classId; }
        public void setClassId(UUID classId) { this.classId = classId; }
        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof EnrolmentId that)) return false;
            return Objects.equals(classId, that.classId) && Objects.equals(userId, that.userId);
        }
        @Override public int hashCode() { return Objects.hash(classId, userId); }
    }

    // convenience setters that keep the embeddable in sync
    public UUID getClassId() { return id.getClassId(); }
    public void setClassId(UUID classId) { id.setClassId(classId); }
    public UUID getUserId() { return id.getUserId(); }
    public void setUserId(UUID userId) { id.setUserId(userId); }
    public ClassRole getClassRole() { return classRole; }
    public void setClassRole(ClassRole classRole) { this.classRole = classRole; }
    public Instant getJoinedAt() { return joinedAt; }
    public EnrolmentId getId() { return id; }
}
