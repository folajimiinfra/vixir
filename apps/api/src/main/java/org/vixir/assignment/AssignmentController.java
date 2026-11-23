package org.vixir.assignment;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Assignments")
@RestController
@RequestMapping("/api/v1")
public class AssignmentController {

    private final AssignmentService service;

    public AssignmentController(AssignmentService service) {
        this.service = service;
    }

    @Operation(summary = "Create an assignment", description = "Owner or co-teacher of classId only. dueAt must be after opensAt; the experiment version must be PUBLISHED. Defaults: noiseLevel=REALISTIC, attemptsAllowed=2, releasePolicy=MANUAL.")
    @ApiResponse(responseCode = "201", description = "Assignment created")
    @PostMapping("/assignments")
    ResponseEntity<AssignmentResponse> create(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody CreateAssignmentRequest req) {
        var a = service.create(uid(jwt), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(AssignmentResponse.from(a));
    }

    @Operation(summary = "List assignments for a class", description = "Owner or co-teacher of the class only.")
    @GetMapping("/assignments")
    List<AssignmentResponse> list(@AuthenticationPrincipal Jwt jwt,
                                   @RequestParam UUID classId) {
        return service.listForClass(classId, uid(jwt)).stream()
                .map(AssignmentResponse::from).toList();
    }

    @Operation(summary = "Get an assignment", description = "Owner or co-teacher of the class only.")
    @GetMapping("/assignments/{id}")
    AssignmentResponse get(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return AssignmentResponse.from(service.get(id, uid(jwt)));
    }

    @Operation(summary = "Publish an assignment", description = "Makes it visible to enrolled students.")
    @PostMapping("/assignments/{id}/publish")
    AssignmentResponse publish(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return AssignmentResponse.from(service.publish(id, uid(jwt)));
    }

    @Operation(summary = "Close an assignment", description = "No new attempts can be started.")
    @PostMapping("/assignments/{id}/close")
    AssignmentResponse close(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return AssignmentResponse.from(service.close(id, uid(jwt)));
    }

    /** Student dashboard — Req 6.4 */
    @Operation(summary = "List my assignments (student dashboard)", description = "Published assignments for every class the caller is enrolled in.")
    @GetMapping("/me/assignments")
    List<AssignmentResponse> myAssignments(@AuthenticationPrincipal Jwt jwt) {
        return service.listForStudent(uid(jwt)).stream()
                .map(AssignmentResponse::from).toList();
    }

    private UUID uid(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }
}
