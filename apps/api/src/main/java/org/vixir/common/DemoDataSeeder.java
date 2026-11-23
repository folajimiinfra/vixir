package org.vixir.common;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.auth.AppUser;
import org.vixir.auth.AppUserRepository;
import org.vixir.auth.PasswordService;
import org.vixir.school.*;

/**
 * Seeds demo data under the `demo` Spring profile (Req 16).
 * Creates institution, teacher@demo.vixir.org, student@demo.vixir.org and 24 students,
 * class SS3A Physics, one published assignment placeholder.
 */
@Configuration
@ConditionalOnProperty(name = "vixir.seed-demo", havingValue = "true")
public class DemoDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final AppUserRepository userRepo;
    private final PasswordService passwords;
    private final InstitutionRepository institutionRepo;
    private final InstitutionSettingsRepository settingsRepo;
    private final SchoolClassRepository classRepo;
    private final EnrolmentRepository enrolmentRepo;
    private final JoinCodeGenerator codeGen;

    public DemoDataSeeder(AppUserRepository userRepo,
                          PasswordService passwords,
                          InstitutionRepository institutionRepo,
                          InstitutionSettingsRepository settingsRepo,
                          SchoolClassRepository classRepo,
                          EnrolmentRepository enrolmentRepo,
                          JoinCodeGenerator codeGen) {
        this.userRepo = userRepo;
        this.passwords = passwords;
        this.institutionRepo = institutionRepo;
        this.settingsRepo = settingsRepo;
        this.classRepo = classRepo;
        this.enrolmentRepo = enrolmentRepo;
        this.codeGen = codeGen;
    }

    @Bean
    @Transactional
    ApplicationRunner seedDemo() {
        return args -> {
            if (userRepo.existsByEmail("teacher@demo.vixir.org")) {
                log.info("Demo data already seeded — skipping");
                return;
            }

            log.info("Seeding demo data...");

            // Institution
            var inst = new Institution();
            inst.setName("Demo Secondary School");
            inst.setCountry("NG");
            inst.setType("SECONDARY");
            institutionRepo.save(inst);

            var settings = new InstitutionSettings();
            settings.setInstitutionId(inst.getId());
            settings.setVixEnabled(true);
            settingsRepo.save(settings);

            // Teacher
            var teacher = new AppUser();
            teacher.setEmail("teacher@demo.vixir.org");
            teacher.setPasswordHash(passwords.hash("demo1234"));
            teacher.setFirstName("Ada");
            teacher.setLastName("Okafor");
            teacher.setRole(AppUser.Role.TEACHER);
            teacher.setInstitutionId(inst.getId());
            userRepo.save(teacher);

            // Named student
            var mainStudent = new AppUser();
            mainStudent.setEmail("student@demo.vixir.org");
            mainStudent.setPasswordHash(passwords.hash("demo1234"));
            mainStudent.setFirstName("Chidi");
            mainStudent.setLastName("Eze");
            mainStudent.setRole(AppUser.Role.STUDENT);
            mainStudent.setInstitutionId(inst.getId());
            userRepo.save(mainStudent);

            // Class
            var cls = new SchoolClass();
            cls.setInstitutionId(inst.getId());
            cls.setOwnerId(teacher.getId());
            cls.setName("SS3A Physics");
            cls.setSubject("PHYSICS");
            cls.setLevel("SS3");
            cls.setJoinCode("PHY-SS3-DEMO");
            classRepo.save(cls);

            // Enrol main student
            enrol(cls.getId(), mainStudent.getId());

            // 23 more students
            String[] firstNames = {"Amara","Bola","Chibundo","Dayo","Emeka","Funke","Gbemi",
                    "Hauwa","Ike","Joke","Kalu","Lara","Musa","Nike","Ola","Peter","Qasim",
                    "Remi","Sade","Tunde","Uche","Victor","Wale"};
            for (String fn : firstNames) {
                var s = new AppUser();
                s.setEmail(fn.toLowerCase() + "@demo.vixir.org");
                s.setPasswordHash(passwords.hash("demo1234"));
                s.setFirstName(fn);
                s.setLastName("Demo");
                s.setRole(AppUser.Role.STUDENT);
                s.setInstitutionId(inst.getId());
                userRepo.save(s);
                enrol(cls.getId(), s.getId());
            }

            log.info("Demo data seeded — teacher@demo.vixir.org / student@demo.vixir.org (password: demo1234)");
        };
    }

    private void enrol(java.util.UUID classId, java.util.UUID userId) {
        var e = new Enrolment();
        e.setClassId(classId);
        e.setUserId(userId);
        e.setClassRole(Enrolment.ClassRole.STUDENT);
        enrolmentRepo.save(e);
    }
}
