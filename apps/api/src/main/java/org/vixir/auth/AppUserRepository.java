package org.vixir.auth;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByEmailIgnoreCase(String email);
    Optional<AppUser> findByMatricNoIgnoreCase(String matricNo);
    Optional<AppUser> findByGoogleSub(String googleSub);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByMatricNoIgnoreCase(String matricNo);
}
