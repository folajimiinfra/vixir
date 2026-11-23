package org.vixir.review;

import java.util.UUID;
import org.springframework.stereotype.Component;
import org.vixir.assignment.AssignmentService;
import org.vixir.attempt.AttemptRepository;
import org.vixir.common.ApiException;
import org.vixir.submission.SubmissionRepository;

/**
 * Teacher access to a submission: the caller must own (or co-teach) the class of the assignment
 * the submission was made for. Practice attempts have no assignment, so no teacher can review them.
 * Every failure is a 404 so the caller cannot tell "doesn't exist" from "not yours" (Req 2.3, 2.5).
 */
@Component
class ReviewAccess {

    private final SubmissionRepository submissionRepo;
    private final AttemptRepository attemptRepo;
    private final AssignmentService assignmentService;

    ReviewAccess(SubmissionRepository submissionRepo,
                 AttemptRepository attemptRepo,
                 AssignmentService assignmentService) {
        this.submissionRepo = submissionRepo;
        this.attemptRepo = attemptRepo;
        this.assignmentService = assignmentService;
    }

    /** Throws a 404 with {@code notFoundCode} unless {@code teacherId} teaches the submission's class. */
    void requireTeacherOfSubmission(UUID submissionId, UUID teacherId, String notFoundCode) {
        ApiException notFound = ApiException.notFound(notFoundCode, "Not found");
        var submission = submissionRepo.findById(submissionId).orElseThrow(() -> notFound);
        var attempt = attemptRepo.findById(submission.getAttemptId()).orElseThrow(() -> notFound);
        if (attempt.getAssignmentId() == null) throw notFound;
        try {
            assignmentService.get(attempt.getAssignmentId(), teacherId); // owner or co-teacher, else 404
        } catch (ApiException e) {
            throw notFound;
        }
    }
}
