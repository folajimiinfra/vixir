package org.vixir.school;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface EnrolmentRepository extends JpaRepository<Enrolment, Enrolment.EnrolmentId> {

    boolean existsByIdClassIdAndIdUserId(UUID classId, UUID userId);

    Optional<Enrolment> findByIdClassIdAndIdUserId(UUID classId, UUID userId);

    List<Enrolment> findByIdClassId(UUID classId);

    @Query("SELECT COUNT(e) FROM Enrolment e WHERE e.id.classId = :classId AND e.classRole = 'STUDENT'")
    long countStudents(UUID classId);
}
