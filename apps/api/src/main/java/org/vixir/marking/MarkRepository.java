package org.vixir.marking;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MarkRepository extends JpaRepository<Mark, UUID> {
    Optional<Mark> findBySubmissionId(UUID submissionId);

    /** Mark totals for every marked submission of one assignment, in a single query. */
    @Query("""
        select m.total from Mark m, org.vixir.submission.Submission s, org.vixir.attempt.Attempt a
        where m.submissionId = s.id and s.attemptId = a.id and a.assignmentId = :assignmentId
        """)
    List<Integer> findTotalsByAssignmentId(@Param("assignmentId") UUID assignmentId);

    /** Mark total per attempt for every marked submission of one assignment, in a single query. */
    @Query("""
        select s.attemptId as attemptId, m.total as total
        from Mark m, org.vixir.submission.Submission s, org.vixir.attempt.Attempt a
        where m.submissionId = s.id and s.attemptId = a.id and a.assignmentId = :assignmentId
        """)
    List<AttemptTotal> findAttemptTotalsByAssignmentId(@Param("assignmentId") UUID assignmentId);

    interface AttemptTotal {
        UUID getAttemptId();
        int getTotal();
    }
}
