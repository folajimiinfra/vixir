package org.vixir.experiment;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExperimentVersionRepository extends JpaRepository<ExperimentVersion, ExperimentVersion.ExperimentVersionId> {

    @Query("SELECT ev FROM ExperimentVersion ev WHERE ev.id.experimentId = :experimentId AND ev.status = 'PUBLISHED' ORDER BY ev.id.version DESC")
    List<ExperimentVersion> findPublishedVersions(String experimentId);

    @Query("SELECT ev FROM ExperimentVersion ev WHERE ev.id.experimentId = :experimentId AND ev.id.version = :version")
    Optional<ExperimentVersion> findByExperimentIdAndVersion(String experimentId, int version);
}
