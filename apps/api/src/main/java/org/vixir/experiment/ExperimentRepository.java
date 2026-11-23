package org.vixir.experiment;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExperimentRepository extends JpaRepository<Experiment, String> {

    @Query("""
        SELECT e FROM Experiment e
        WHERE (:subject IS NULL OR e.subject = :subject)
        AND e.latestPublishedVersion IS NOT NULL
        """)
    List<Experiment> findPublished(String subject);
}
