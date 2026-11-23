package org.vixir.submission;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    Optional<Submission> findByAttemptId(UUID attemptId);

    Optional<Submission> findByIdempotencyKey(String idempotencyKey);

    /** Find submissions in the same assignment with the same readings hash. */
    @Query("""
        SELECT s FROM Submission s
        JOIN org.vixir.attempt.Attempt a ON s.attemptId = a.id
        WHERE a.assignmentId = :assignmentId AND s.readingsHash = :hash
        """)
    List<Submission> findByAssignmentAndHash(UUID assignmentId, String hash);

    @Query("""
        SELECT COUNT(s) FROM Submission s
        JOIN org.vixir.attempt.Attempt a ON s.attemptId = a.id
        WHERE a.assignmentId = :assignmentId
        """)
    long countByAssignmentId(UUID assignmentId);
}
