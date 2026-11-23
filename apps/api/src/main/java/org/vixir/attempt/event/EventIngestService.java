package org.vixir.attempt.event;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.attempt.Attempt;
import org.vixir.attempt.AttemptRepository;
import org.vixir.common.ApiException;

/**
 * Batch event ingest with idempotency and gap detection (Req 8.1–8.7).
 */
@Service
public class EventIngestService {

    private static final int MAX_PAYLOAD_BYTES = 8 * 1024; // 8 KB

    private final AttemptRepository attemptRepo;
    private final AttemptEventRepository eventRepo;
    private final ReadingRepository readingRepo;
    private final ObjectMapper mapper;

    public EventIngestService(AttemptRepository attemptRepo,
                               AttemptEventRepository eventRepo,
                               ReadingRepository readingRepo,
                               ObjectMapper mapper) {
        this.attemptRepo = attemptRepo;
        this.eventRepo = eventRepo;
        this.readingRepo = readingRepo;
        this.mapper = mapper;
    }

    public record IngestResult(List<Integer> accepted, List<Integer> duplicates, int lastEventSeq) {}

    @Transactional
    public IngestResult ingest(UUID attemptId, UUID userId, List<EventIngestRequest.EventDto> batch) {
        if (batch.size() > 200) {
            throw ApiException.unprocessable("BATCH_TOO_LARGE", "Maximum 200 events per batch");
        }

        var attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found"));

        // Ownership (Req 2.2)
        if (!userId.equals(attempt.getUserId())) {
            throw ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found");
        }

        // Req 8.4 — attempt must be IN_PROGRESS
        if (!"IN_PROGRESS".equals(attempt.getState())) {
            throw ApiException.conflict("ATTEMPT_LOCKED", "Attempt is not in progress");
        }

        List<Integer> accepted   = new ArrayList<>();
        List<Integer> duplicates = new ArrayList<>();

        for (var dto : batch) {
            // Req 8.7 — payload size check
            try {
                String payloadJson = mapper.writeValueAsString(dto.payload());
                if (payloadJson.getBytes().length > MAX_PAYLOAD_BYTES) {
                    throw ApiException.payloadTooLarge("EVENT_TOO_LARGE",
                            "Event payload exceeds 8 KB at seq " + dto.seq());
                }
            } catch (ApiException e) {
                throw e;
            } catch (Exception ignored) {}

            // Req 8.2 — idempotency by (attempt_id, client_event_id)
            if (eventRepo.existsByAttemptIdAndClientEventId(attemptId, dto.clientEventId())) {
                duplicates.add(dto.seq());
                continue;
            }

            // Req 8.3 — gap detection: expected seq = lastEventSeq + 1
            int expectedSeq = attempt.getLastEventSeq() + 1;
            if (dto.seq() != expectedSeq) {
                throw ApiException.conflict("EVENT_GAP",
                        "Expected seq " + expectedSeq + " but got " + dto.seq());
            }

            // Store event
            var event = new AttemptEvent();
            event.setAttemptId(attemptId);
            event.setClientEventId(dto.clientEventId());
            event.setSeq(dto.seq());
            event.setType(dto.type());
            event.setPayload(dto.payload() != null ? dto.payload() : java.util.Map.of());
            event.setSimTimeMs(dto.simTimeMs());
            event.setClientTs(dto.clientTs());
            eventRepo.save(event);

            attempt.setLastEventSeq(dto.seq());
            accepted.add(dto.seq());

            // Req 8.5 — READING_RECORDED upserts reading row
            if ("READING_RECORDED".equals(dto.type())) {
                upsertReading(attemptId, dto);
            }
        }

        attemptRepo.save(attempt);
        return new IngestResult(accepted, duplicates, attempt.getLastEventSeq());
    }

    public List<AttemptEvent> getEvents(UUID attemptId, UUID requesterId, Integer afterSeq) {
        var attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found"));
        if (!requesterId.equals(attempt.getUserId())) {
            throw ApiException.notFound("ATTEMPT_NOT_FOUND", "Attempt not found");
        }
        if (afterSeq != null) {
            return eventRepo.findByAttemptIdAndSeqGreaterThanOrderBySeqAsc(attemptId, afterSeq);
        }
        return eventRepo.findByAttemptIdOrderBySeqAsc(attemptId);
    }

    // ---- helpers ----

    @SuppressWarnings("unchecked")
    private void upsertReading(UUID attemptId, EventIngestRequest.EventDto dto) {
        try {
            JsonNode payloadNode = mapper.valueToTree(dto.payload());
            JsonNode rowNode = payloadNode.get("row");
            if (rowNode == null) return;

            // row_index from payload or seq-based fallback
            int rowIndex = dto.seq() - 1; // seq is 1-based
            if (payloadNode.has("rowIndex")) rowIndex = payloadNode.get("rowIndex").asInt();

            String[] flags = {};
            if (payloadNode.has("flags")) {
                List<String> fl = new ArrayList<>();
                payloadNode.get("flags").forEach(f -> fl.add(f.asText()));
                flags = fl.toArray(new String[0]);
            }

            final int finalRowIndex = rowIndex;
            final String[] finalFlags = flags;
            var reading = readingRepo.findByAttemptIdAndRowIndex(attemptId, rowIndex)
                    .orElseGet(() -> {
                        var r = new Reading();
                        r.setAttemptId(attemptId);
                        r.setRowIndex(finalRowIndex);
                        return r;
                    });
            reading.setValues(mapper.convertValue(rowNode, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {}));
            reading.setFlags(finalFlags);
            readingRepo.save(reading);
        } catch (Exception e) {
            // Don't fail ingest if reading upsert has an issue
        }
    }
}
