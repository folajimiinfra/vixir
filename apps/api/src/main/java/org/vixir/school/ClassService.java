package org.vixir.school;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.auth.AppUser;
import org.vixir.auth.AppUserRepository;
import org.vixir.common.ApiException;

@Service
public class ClassService {

    private final SchoolClassRepository classRepo;
    private final EnrolmentRepository enrolmentRepo;
    private final AppUserRepository userRepo;
    private final InstitutionService institutionService;
    private final JoinCodeGenerator joinCodeGen;

    public ClassService(SchoolClassRepository classRepo,
                        EnrolmentRepository enrolmentRepo,
                        AppUserRepository userRepo,
                        JoinCodeGenerator joinCodeGen,
                        InstitutionService institutionService) {
        this.institutionService = institutionService;
        this.classRepo = classRepo;
        this.enrolmentRepo = enrolmentRepo;
        this.userRepo = userRepo;
        this.joinCodeGen = joinCodeGen;
    }

    @Transactional
    public SchoolClass create(UUID teacherId, CreateClassRequest req) {
        var teacher = userRepo.findById(teacherId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
        if (teacher.getRole() != AppUser.Role.TEACHER && teacher.getRole() != AppUser.Role.ADMIN) {
            throw ApiException.forbidden("TEACHER_ROLE_REQUIRED", "Only teachers and admins can create classes");
        }
        // Teachers who registered before institutions were created at sign-up have none yet.
        if (teacher.getInstitutionId() == null) {
            institutionService.createFor(teacher, null);
        }

        String code = generateUniqueCode(req.subject(), req.level());
        var cls = new SchoolClass();
        cls.setInstitutionId(teacher.getInstitutionId());
        cls.setOwnerId(teacherId);
        cls.setName(req.name());
        cls.setSubject(req.subject());
        cls.setLevel(req.level());
        cls.setJoinCode(code);
        return classRepo.save(cls);
    }

    @Transactional
    public SchoolClass join(UUID userId, String code) {
        var cls = classRepo.findByJoinCodeIgnoreCaseAndArchivedAtIsNull(code)
                .orElseThrow(() -> ApiException.unprocessable("CLASS_CODE_INVALID",
                        "Class code does not match an active class"));

        // Req 4.3 — idempotent
        if (enrolmentRepo.existsByIdClassIdAndIdUserId(cls.getId(), userId)) {
            return cls;
        }

        var e = new Enrolment();
        e.setClassId(cls.getId());
        e.setUserId(userId);
        e.setClassRole(Enrolment.ClassRole.STUDENT);
        enrolmentRepo.save(e);
        return cls;
    }

    @Transactional
    public String rotateJoinCode(UUID classId, UUID requesterId) {
        var cls = ownedClass(classId, requesterId);
        String code = generateUniqueCode(cls.getSubject(), cls.getLevel());
        cls.setJoinCode(code);
        classRepo.save(cls);
        return code;
    }

    public List<SchoolClass> listForTeacher(UUID teacherId) {
        return classRepo.findByOwnerIdAndArchivedAtIsNull(teacherId);
    }

    public List<SchoolClass> listForStudent(UUID userId) {
        return classRepo.findEnrolledClasses(userId);
    }

    public List<AppUser> listStudents(UUID classId, UUID requesterId) {
        ownedClass(classId, requesterId); // ownership check
        return enrolmentRepo.findByIdClassId(classId).stream()
                .filter(e -> e.getClassRole() == Enrolment.ClassRole.STUDENT)
                .map(e -> userRepo.findById(e.getUserId()).orElseThrow())
                .toList();
    }

    @Transactional
    public void removeStudent(UUID classId, UUID studentId, UUID requesterId) {
        ownedClass(classId, requesterId);
        var key = new Enrolment.EnrolmentId();
        key.setClassId(classId);
        key.setUserId(studentId);
        enrolmentRepo.deleteById(key);
    }

    // ---- helpers ----

    public SchoolClass ownedClass(UUID classId, UUID requesterId) {
        var cls = classRepo.findById(classId)
                .orElseThrow(() -> ApiException.notFound("CLASS_NOT_FOUND", "Class not found"));
        if (!cls.getOwnerId().equals(requesterId)
                && !enrolmentRepo.existsByIdClassIdAndIdUserId(classId, requesterId)) {
            throw ApiException.notFound("CLASS_NOT_FOUND", "Class not found");
        }
        // Only owner or CO_TEACHER can mutate
        if (!cls.getOwnerId().equals(requesterId)) {
            var enrolment = enrolmentRepo.findByIdClassIdAndIdUserId(classId, requesterId).orElse(null);
            if (enrolment == null || enrolment.getClassRole() != Enrolment.ClassRole.CO_TEACHER) {
                throw ApiException.notFound("CLASS_NOT_FOUND", "Class not found");
            }
        }
        return cls;
    }

    private String generateUniqueCode(String subject, String level) {
        for (int i = 0; i < 10; i++) {
            String code = joinCodeGen.next(subject, level);
            if (!classRepo.existsByJoinCode(code)) return code;
        }
        throw new IllegalStateException("Could not generate a unique join code after 10 attempts");
    }

    public record CreateClassRequest(
            String name,
            String subject,
            String level
    ) {}
}
