package org.vixir.attempt.event;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadingRepository extends JpaRepository<Reading, UUID> {

    Optional<Reading> findByAttemptIdAndRowIndex(UUID attemptId, int rowIndex);

    List<Reading> findByAttemptIdOrderByRowIndexAsc(UUID attemptId);
}
