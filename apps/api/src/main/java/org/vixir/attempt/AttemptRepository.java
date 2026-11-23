package org.vixir.attempt;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AttemptRepository extends JpaRepository<Attempt, UUID> {

    /** Resume: find the student's existing IN_PROGRESS attempt for an assignment. */
    Optional<Attempt> findByAssignmentIdAndUserIdAndState(UUID assignmentId, UUID userId, String state);

    /** Count completed or in-progress attempts by user for an assignment. */
    @Query("SELECT COUNT(a) FROM Attempt a WHERE a.assignmentId = :assignmentId AND a.userId = :userId AND a.state != 'ABANDONED'")
    int countAttemptsForAssignment(UUID assignmentId, UUID userId);

    /** Find all attempts in SUBMITTED state with no mark (for restart recovery). */
    @Query("SELECT a FROM Attempt a WHERE a.state = 'SUBMITTED' AND NOT EXISTS " +
           "(SELECT 1 FROM Mark m JOIN Submission s ON m.submissionId = s.id WHERE s.attemptId = a.id)")
    List<Attempt> findSubmittedWithoutMark();

    List<Attempt> findByAssignmentId(UUID assignmentId);

    List<Attempt> findByUserIdOrderByStartedAtDesc(UUID userId);
}
