package org.vixir.review;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReviewFlagRepository extends JpaRepository<ReviewFlag, UUID> {

    List<ReviewFlag> findBySubmissionId(UUID submissionId);

    @Query("""
        SELECT rf FROM ReviewFlag rf
        JOIN org.vixir.submission.Submission s ON rf.submissionId = s.id
        JOIN org.vixir.attempt.Attempt a ON s.attemptId = a.id
        WHERE a.assignmentId = :assignmentId AND rf.status = 'OPEN'
        """)
    List<ReviewFlag> findOpenFlagsForAssignment(UUID assignmentId);
}
