package org.vixir.experiment;

public record ExperimentSummary(
        String id,
        String title,
        String subject,
        Integer latestVersion,
        String[] curricula
) {
    public static ExperimentSummary from(Experiment e, ExperimentVersion ev) {
        return new ExperimentSummary(
                e.getId(), e.getTitle(), e.getSubject(),
                e.getLatestPublishedVersion(),
                ev != null ? ev.getCurricula() : new String[0]);
    }
}
