package org.vixir.auth;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findAllByFamilyId(UUID familyId);

    @Modifying
    @Query("UPDATE RefreshToken t SET t.revokedAt = CURRENT_TIMESTAMP WHERE t.userId = :userId AND t.revokedAt IS NULL")
    int revokeAllForUser(UUID userId);
}
