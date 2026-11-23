package org.vixir.school;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vixir.auth.AppUser;
import org.vixir.auth.UserResponse;
import org.vixir.common.PageResponse;

@Tag(name = "Classes")
@RestController
@RequestMapping("/api/v1/classes")
public class ClassController {

    private final ClassService classService;

    public ClassController(ClassService classService) {
        this.classService = classService;
    }

    @Operation(summary = "Create a class", description = "The caller becomes the class owner. A join code is generated.")
    @ApiResponse(responseCode = "201", description = "Class created")
    @PostMapping
    ResponseEntity<ClassResponse> create(@AuthenticationPrincipal Jwt jwt,
                                          @Valid @RequestBody CreateBody body) {
        var cls = classService.create(userId(jwt), new ClassService.CreateClassRequest(
                body.name(), body.subject(), body.level()));
        return ResponseEntity.status(HttpStatus.CREATED).body(ClassResponse.from(cls, 0));
    }

    @Operation(summary = "List my classes", description = "Teachers and admins get the classes they own; students get the classes they are enrolled in.")
    @GetMapping
    List<ClassResponse> list(@AuthenticationPrincipal Jwt jwt) {
        String role = jwt.getClaimAsString("role");
        UUID uid = userId(jwt);
        List<SchoolClass> classes = switch (role) {
            case "TEACHER", "ADMIN" -> classService.listForTeacher(uid);
            default -> classService.listForStudent(uid);
        };
        return classes.stream().map(c -> ClassResponse.from(c, 0)).toList();
    }

    @Operation(summary = "Join a class with a join code")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"code\": \"PHY-SS2-7KQ4\"}")))
    @PostMapping("/join")
    ResponseEntity<ClassResponse> join(@AuthenticationPrincipal Jwt jwt,
                                        @RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            throw org.vixir.common.ApiException.unprocessable("CLASS_CODE_INVALID", "code is required");
        }
        var cls = classService.join(userId(jwt), code);
        return ResponseEntity.ok(ClassResponse.from(cls, 0));
    }

    @Operation(summary = "Rotate a class join code", description = "Owner or co-teacher only. The old code stops working.")
    @ApiResponse(responseCode = "200", description = "New join code", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"joinCode\": \"PHY-SS2-9XB2\"}")))
    @PostMapping("/{id}/join-code/rotate")
    Map<String, String> rotateCode(@PathVariable UUID id,
                                    @AuthenticationPrincipal Jwt jwt) {
        String newCode = classService.rotateJoinCode(id, userId(jwt));
        return Map.of("joinCode", newCode);
    }

    @Operation(summary = "List students in a class", description = "Owner or co-teacher only.")
    @GetMapping("/{id}/students")
    List<UserResponse> students(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return classService.listStudents(id, userId(jwt))
                .stream().map(UserResponse::from).toList();
    }

    @Operation(summary = "Remove a student from a class", description = "Owner or co-teacher only.")
    @ApiResponse(responseCode = "204", description = "Removed")
    @DeleteMapping("/{id}/students/{studentId}")
    ResponseEntity<Void> removeStudent(@PathVariable UUID id,
                                        @PathVariable UUID studentId,
                                        @AuthenticationPrincipal Jwt jwt) {
        classService.removeStudent(id, studentId, userId(jwt));
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }

    public record CreateBody(
            @NotBlank String name,
            @NotBlank String subject,
            @NotBlank String level
    ) {}
}
