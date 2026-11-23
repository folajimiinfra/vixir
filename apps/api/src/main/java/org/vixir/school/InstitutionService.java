package org.vixir.school;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.auth.AppUser;
import org.vixir.auth.AppUserRepository;

/**
 * Creates institutions for people who sign up on their own (Req 3.1).
 * An ADMIN's registration creates their school; a TEACHER who registers without a school gets a personal
 * institution so they can create classes straight away. Both start with the default settings:
 * Vix enabled, transcripts not retained, noise REALISTIC, locale en (the InstitutionSettings defaults).
 */
@Service
public class InstitutionService {

    static final int MAX_NAME_LENGTH = 120;

    private final InstitutionRepository institutionRepo;
    private final InstitutionSettingsRepository settingsRepo;
    private final AppUserRepository userRepo;

    public InstitutionService(InstitutionRepository institutionRepo,
                              InstitutionSettingsRepository settingsRepo,
                              AppUserRepository userRepo) {
        this.institutionRepo = institutionRepo;
        this.settingsRepo = settingsRepo;
        this.userRepo = userRepo;
    }

    /**
     * Creates an institution with default settings, makes {@code owner} a member and saves the owner.
     * {@code requestedName} may be null or blank, in which case a name is derived from the owner.
     */
    @Transactional
    public Institution createFor(AppUser owner, String requestedName) {
        var inst = new Institution();
        inst.setName(nameFor(owner, requestedName));
        // A self-registered teacher's institution is personal, not a real school.
        inst.setType(owner.getRole() == AppUser.Role.ADMIN ? "SECONDARY" : "OTHER");
        institutionRepo.save(inst);

        var settings = new InstitutionSettings();
        settings.setInstitutionId(inst.getId());
        settingsRepo.save(settings);

        owner.setInstitutionId(inst.getId());
        userRepo.save(owner);
        return inst;
    }

    static String nameFor(AppUser owner, String requestedName) {
        if (requestedName != null && !requestedName.isBlank()) {
            String name = requestedName.trim();
            return name.length() > MAX_NAME_LENGTH ? name.substring(0, MAX_NAME_LENGTH) : name;
        }
        String person = (owner.getFirstName() + " " + owner.getLastName()).trim();
        return owner.getRole() == AppUser.Role.ADMIN ? person + "'s school" : person + "'s classes";
    }
}
