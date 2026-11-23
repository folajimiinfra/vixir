package org.vixir.attempt;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.vixir.attempt.event.AttemptEventRepository;
import org.vixir.attempt.event.EventIngestService;
import org.vixir.attempt.event.EventIngestRequest;
import org.vixir.common.BaseIntegrationTest;

/**
 * Idempotent ingest: posting the same event batch twice stores each event once (correctness property).
 */
class EventIngestIdempotencyTest extends BaseIntegrationTest {

    @Autowired AttemptRepository attemptRepo;
    @Autowired AttemptEventRepository eventRepo;
    @Autowired EventIngestService ingestService;

    @Test
    void sameEventBatchPostedTwiceStoresOnce() {
        // Create a bare IN_PROGRESS attempt (no assignment, no user to keep test isolated)
        var attempt = new Attempt();
        attempt.setExperimentId("phy.pendulum.g");
        attempt.setExperimentVersion(1);
        attempt.setMode("PRACTICE");
        attempt.setSeed(new byte[16]);
        // We need a userId — create a minimal user via registration first
        // For simplicity, patch userId to null and test service directly with a fake userId
        UUID fakeUserId = registerUserId("STUDENT");
        attempt.setUserId(fakeUserId);
        attemptRepo.save(attempt);

        UUID clientId = UUID.randomUUID();
        var dto = new EventIngestRequest.EventDto(
                clientId, 1, "APPARATUS_PLACED", null, null,
                Map.of("apparatus", "retort_stand"));
        var batch = List.of(dto);

        // First ingest
        var r1 = ingestService.ingest(attempt.getId(), fakeUserId, batch);
        assertThat(r1.accepted()).containsExactly(1);
        assertThat(r1.duplicates()).isEmpty();

        // Second ingest of the same batch
        var r2 = ingestService.ingest(attempt.getId(), fakeUserId, batch);
        assertThat(r2.accepted()).isEmpty();
        assertThat(r2.duplicates()).containsExactly(1);

        // Only one row in the database
        long count = eventRepo.findByAttemptIdOrderBySeqAsc(attempt.getId()).size();
        assertThat(count).isEqualTo(1);
    }

    @Test
    void gapInSeqReturnsEventGapConflict() {
        UUID fakeUserId = registerUserId("STUDENT");
        var attempt = new Attempt();
        attempt.setExperimentId("phy.pendulum.g");
        attempt.setExperimentVersion(1);
        attempt.setMode("PRACTICE");
        attempt.setSeed(new byte[16]);
        attempt.setUserId(fakeUserId);
        attemptRepo.save(attempt);

        // Send seq=2 when last seq is 0 (expects 1)
        var dto = new EventIngestRequest.EventDto(
                UUID.randomUUID(), 2, "APPARATUS_PLACED", null, null, Map.of());

        try {
            ingestService.ingest(attempt.getId(), fakeUserId, List.of(dto));
            org.junit.jupiter.api.Assertions.fail("Expected ApiException for gap");
        } catch (org.vixir.common.ApiException e) {
            assertThat(e.getCode()).isEqualTo("EVENT_GAP");
        }
    }
}
