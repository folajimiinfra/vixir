package org.vixir.school;

import java.time.Instant;
import java.util.UUID;

public record ClassResponse(
        UUID id,
        String name,
        String subject,
        String level,
        String joinCode,
        UUID ownerId,
        UUID institutionId,
        long studentCount,
        Instant createdAt
) {
    public static ClassResponse from(SchoolClass c, long studentCount) {
        return new ClassResponse(c.getId(), c.getName(), c.getSubject(), c.getLevel(),
                c.getJoinCode(), c.getOwnerId(), c.getInstitutionId(), studentCount, c.getCreatedAt());
    }
}
