package org.vixir.experiment;

import java.time.Instant;

public record ExperimentVersionDetail(
        String id,
        int version,
        String status,
        Object config,
        Object rubricCriteria,
        int rubricMaxTotal,
        String[] curricula,
        Instant publishedAt
) {
    public static ExperimentVersionDetail from(ExperimentVersion ev, Rubric rubric) {
        return new ExperimentVersionDetail(
                ev.getExperimentId(), ev.getVersion(), ev.getStatus(),
                ev.getConfig(),
                rubric != null ? rubric.getCriteria() : null,
                rubric != null ? rubric.getMaxTotal() : 0,
                ev.getCurricula(), ev.getPublishedAt());
    }
}
