package org.vixir.experiment;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RubricRepository extends JpaRepository<Rubric, UUID> {
    Optional<Rubric> findByExperimentIdAndVersion(String experimentId, int version);
}
