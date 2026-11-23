package org.vixir.attempt.event;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttemptEventRepository extends JpaRepository<AttemptEvent, Long> {

    boolean existsByAttemptIdAndClientEventId(UUID attemptId, UUID clientEventId);

    Optional<AttemptEvent> findByAttemptIdAndSeq(UUID attemptId, int seq);

    List<AttemptEvent> findByAttemptIdOrderBySeqAsc(UUID attemptId);

    List<AttemptEvent> findByAttemptIdAndSeqGreaterThanOrderBySeqAsc(UUID attemptId, int afterSeq);
}
