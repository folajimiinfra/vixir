package org.vixir.school;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SchoolClassRepository extends JpaRepository<SchoolClass, UUID> {

    Optional<SchoolClass> findByJoinCodeIgnoreCaseAndArchivedAtIsNull(String joinCode);

    /** All classes owned by a teacher. */
    List<SchoolClass> findByOwnerIdAndArchivedAtIsNull(UUID ownerId);

    /** All classes a user is enrolled in. */
    @Query("SELECT sc FROM SchoolClass sc JOIN Enrolment e ON e.id.classId = sc.id " +
           "WHERE e.id.userId = :userId AND sc.archivedAt IS NULL")
    List<SchoolClass> findEnrolledClasses(UUID userId);

    boolean existsByJoinCode(String joinCode);
}
