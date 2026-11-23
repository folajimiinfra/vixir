package org.vixir.marking;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MarkCriterionRepository extends JpaRepository<MarkCriterion, MarkCriterion.MarkCriterionId> {
    // markId lives inside the embedded primary key, so a derived query name can't resolve it.
    @Query("select c from MarkCriterion c where c.id.markId = :markId")
    List<MarkCriterion> findByMarkId(@Param("markId") UUID markId);

    /** Every criterion result for every marked submission of one assignment, in a single query. */
    @Query("""
        select c from MarkCriterion c, Mark m, org.vixir.submission.Submission s, org.vixir.attempt.Attempt a
        where c.id.markId = m.id and m.submissionId = s.id and s.attemptId = a.id
          and a.assignmentId = :assignmentId
        """)
    List<MarkCriterion> findByAssignmentId(@Param("assignmentId") UUID assignmentId);
}
