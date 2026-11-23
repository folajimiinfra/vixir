package org.vixir.school;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "institution_settings")
public class InstitutionSettings {

    @Id
    @Column(name = "institution_id")
    private UUID institutionId;

    @Column(name = "vix_enabled", nullable = false)
    private boolean vixEnabled = true;

    @Column(name = "vix_transcripts_retained", nullable = false)
    private boolean vixTranscriptsRetained = false;

    @Column(name = "default_noise_level", nullable = false)
    private String defaultNoiseLevel = "REALISTIC";

    @Column(name = "default_locale", nullable = false)
    private String defaultLocale = "en";

    public UUID getInstitutionId() { return institutionId; }
    public void setInstitutionId(UUID institutionId) { this.institutionId = institutionId; }
    public boolean isVixEnabled() { return vixEnabled; }
    public void setVixEnabled(boolean vixEnabled) { this.vixEnabled = vixEnabled; }
    public boolean isVixTranscriptsRetained() { return vixTranscriptsRetained; }
    public void setVixTranscriptsRetained(boolean v) { this.vixTranscriptsRetained = v; }
    public String getDefaultNoiseLevel() { return defaultNoiseLevel; }
    public void setDefaultNoiseLevel(String defaultNoiseLevel) { this.defaultNoiseLevel = defaultNoiseLevel; }
    public String getDefaultLocale() { return defaultLocale; }
    public void setDefaultLocale(String defaultLocale) { this.defaultLocale = defaultLocale; }
}
