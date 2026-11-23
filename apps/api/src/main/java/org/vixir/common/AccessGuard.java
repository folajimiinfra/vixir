package org.vixir.common;

import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.vixir.assignment.AssignmentRepository;
import org.vixir.attempt.AttemptRepository;
import org.vixir.school.Enrolment;
import org.vixir.school.EnrolmentRepository;
import org.vixir.school.SchoolClassRepository;
import org.vixir.submission.SubmissionRepository;

/**
 * Spring Security method-level access beans (Req 2).
 * Usage: @PreAuthorize("@access.canReadAttempt(#id, authentication)")
 *
 * Returns false (→ 403 → mapped to 404 by GlobalExceptionHandler) when access is denied.
 */
@Component("access")
public class AccessGuard {

    private final AttemptRepository attemptRepo;
    private final SubmissionRepository submissionRepo;
    private final SchoolClassRepository classRepo;
    private final EnrolmentRepository enrolmentRepo;
    private final AssignmentRepository assignmentRepo;

    public AccessGuard(AttemptRepository attemptRepo,
                       SubmissionRepository submissionRepo,
                       SchoolClassRepository classRepo,
                       EnrolmentRepository enrolmentRepo,
                       AssignmentRepository assignmentRepo) {
        this.assignmentRepo = assignmentRepo;
        this.attemptRepo = attemptRepo;
        this.submissionRepo = submissionRepo;
        this.classRepo = classRepo;
        this.enrolmentRepo = enrolmentRepo;
    }

    /** Req 2.2: student reads/writes only their own attempt; teacher can read class attempts. */
    public boolean canReadAttempt(UUID attemptId, Authentication auth) {
        var attempt = attemptRepo.findById(attemptId).orElse(null);
        if (attempt == null) return false;
        UUID uid = userId(auth);
        String role = role(auth);
        if (uid.equals(attempt.getUserId())) return true;
        // Teacher can read attempts in their classes
        if ("TEACHER".equals(role) && attempt.getAssignmentId() != null) {
            return isOwnerTeacherOfAttempt(attempt.getAssignmentId(), uid);
        }
        return false;
    }

    /** Req 2.3: teacher reads marks only for their class. */
    public boolean canReadSubmission(UUID submissionId, Authentication auth) {
        var sub = submissionRepo.findById(submissionId).orElse(null);
        if (sub == null) return false;
        return canReadAttempt(sub.getAttemptId(), auth);
    }

    /** Req 2.4: admin operates only within their institution. */
    public boolean isSameInstitution(UUID targetInstitutionId, Authentication auth) {
        Jwt jwt = (Jwt) auth.getPrincipal();
        String instClaim = jwt.getClaimAsString("inst");
        if (instClaim == null) return false;
        return UUID.fromString(instClaim).equals(targetInstitutionId);
    }

    // ---- helpers ----

    private UUID userId(Authentication auth) {
        return UUID.fromString(((Jwt) auth.getPrincipal()).getSubject());
    }

    private String role(Authentication auth) {
        return ((Jwt) auth.getPrincipal()).getClaimAsString("role");
    }

    private boolean isOwnerTeacherOfAttempt(UUID assignmentId, UUID teacherId) {
        // The teacher must own, or co-teach, the class this particular assignment belongs to.
        var assignment = assignmentRepo.findById(assignmentId).orElse(null);
        if (assignment == null) return false;
        var cls = classRepo.findById(assignment.getClassId()).orElse(null);
        if (cls == null) return false;
        if (teacherId.equals(cls.getOwnerId())) return true;
        return enrolmentRepo.findByIdClassIdAndIdUserId(cls.getId(), teacherId)
                .map(e -> e.getClassRole() == Enrolment.ClassRole.CO_TEACHER)
                .orElse(false);
    }
}
