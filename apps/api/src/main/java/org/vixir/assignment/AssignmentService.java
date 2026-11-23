package org.vixir.assignment;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vixir.common.ApiException;
import org.vixir.common.AppClock;
import org.vixir.experiment.ExperimentVersionRepository;
import org.vixir.school.ClassService;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepo;
    private final ExperimentVersionRepository versionRepo;
    private final ClassService classService;
    private final AppClock clock;

    public AssignmentService(AssignmentRepository assignmentRepo,
                             ExperimentVersionRepository versionRepo,
                             ClassService classService,
                             AppClock clock) {
        this.assignmentRepo = assignmentRepo;
        this.versionRepo = versionRepo;
        this.classService = classService;
        this.clock = clock;
    }

    @Transactional
    public Assignment create(UUID teacherId, CreateAssignmentRequest req) {
        // Ownership check — throws 404 if not owner/CO_TEACHER
        classService.ownedClass(req.classId(), teacherId);

        // Req 6.2 — due_at must be after opens_at
        if (!req.dueAt().isAfter(req.opensAt())) {
            throw ApiException.unprocessable("DUE_BEFORE_OPEN", "due_at must be after opens_at");
        }

        // Validate experiment version exists and is published
        versionRepo.findByExperimentIdAndVersion(req.experimentId(), req.experimentVersion())
                .filter(v -> "PUBLISHED".equals(v.getStatus()))
                .orElseThrow(() -> ApiException.unprocessable("EXPERIMENT_NOT_FOUND",
                        "Experiment version not found or not published"));

        var a = new Assignment();
        a.setClassId(req.classId());
        a.setExperimentId(req.experimentId());
        a.setExperimentVersion(req.experimentVersion());
        a.setCreatedBy(teacherId);
        a.setMode(req.mode());
        a.setInstructions(req.instructions());
        a.setNoiseLevel(req.noiseLevel() != null ? req.noiseLevel() : "REALISTIC");
        a.setAttemptsAllowed(req.attemptsAllowed() != null ? req.attemptsAllowed() : 2);
        a.setReleasePolicy(req.releasePolicy() != null ? req.releasePolicy() : "MANUAL");
        a.setOpensAt(req.opensAt());
        a.setDueAt(req.dueAt());
        return assignmentRepo.save(a);
    }

    @Transactional
    public Assignment publish(UUID assignmentId, UUID teacherId) {
        var a = ownedAssignment(assignmentId, teacherId);
        if (!"DRAFT".equals(a.getStatus())) {
            throw ApiException.conflict("ASSIGNMENT_NOT_DRAFT", "Only DRAFT assignments can be published");
        }
        a.setStatus("PUBLISHED");
        return assignmentRepo.save(a);
    }

    @Transactional
    public Assignment close(UUID assignmentId, UUID teacherId) {
        var a = ownedAssignment(assignmentId, teacherId);
        a.setStatus("CLOSED");
        return assignmentRepo.save(a);
    }

    public List<Assignment> listForClass(UUID classId, UUID teacherId) {
        classService.ownedClass(classId, teacherId);
        return assignmentRepo.findByClassIdOrderByDueAtAsc(classId);
    }

    public List<Assignment> listForStudent(UUID studentId) {
        return assignmentRepo.findPublishedForStudent(studentId);
    }

    public Assignment get(UUID assignmentId, UUID requesterId) {
        return ownedAssignment(assignmentId, requesterId);
    }

    // ---- helpers ----

    Assignment ownedAssignment(UUID assignmentId, UUID requesterId) {
        var a = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> ApiException.notFound("ASSIGNMENT_NOT_FOUND", "Assignment not found"));
        // throws 404 if requester is not teacher/CO_TEACHER of the class
        classService.ownedClass(a.getClassId(), requesterId);
        return a;
    }
}
