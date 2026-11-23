package org.vixir.assignment;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

    List<Assignment> findByClassIdOrderByDueAtAsc(UUID classId);

    /** All published assignments for classes a student is enrolled in. */
    @Query("""
        SELECT a FROM Assignment a
        JOIN org.vixir.school.Enrolment e ON e.id.classId = a.classId
        WHERE e.id.userId = :userId AND a.status = 'PUBLISHED'
        ORDER BY a.dueAt ASC
        """)
    List<Assignment> findPublishedForStudent(UUID userId);
}
