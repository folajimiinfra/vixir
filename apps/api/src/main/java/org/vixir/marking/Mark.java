package org.vixir.marking;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mark")
public class Mark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "submission_id", nullable = false, unique = true)
    private UUID submissionId;

    @Column(nullable = false)
    private int total;

    @Column(name = "max_total", nullable = false)
    private int maxTotal;

    @Column(name = "marker_version", nullable = false)
    private String markerVersion;

    @Column(name = "teacher_comment")
    private String teacherComment;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "marked_at", nullable = false, updatable = false)
    private Instant markedAt = Instant.now();

    @Column(name = "released_at")
    private Instant releasedAt;

    public UUID getId() { return id; }
    public UUID getSubmissionId() { return submissionId; }
    public void setSubmissionId(UUID submissionId) { this.submissionId = submissionId; }
    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }
    public int getMaxTotal() { return maxTotal; }
    public void setMaxTotal(int maxTotal) { this.maxTotal = maxTotal; }
    public String getMarkerVersion() { return markerVersion; }
    public void setMarkerVersion(String markerVersion) { this.markerVersion = markerVersion; }
    public String getTeacherComment() { return teacherComment; }
    public void setTeacherComment(String teacherComment) { this.teacherComment = teacherComment; }
    public UUID getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(UUID reviewedBy) { this.reviewedBy = reviewedBy; }
    public Instant getMarkedAt() { return markedAt; }
    public Instant getReleasedAt() { return releasedAt; }
    public void setReleasedAt(Instant releasedAt) { this.releasedAt = releasedAt; }
}
