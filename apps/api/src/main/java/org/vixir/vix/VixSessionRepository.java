package org.vixir.vix;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VixSessionRepository extends JpaRepository<VixSession, UUID> {}
