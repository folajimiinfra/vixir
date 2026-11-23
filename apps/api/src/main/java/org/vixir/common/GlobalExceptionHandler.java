package org.vixir.common;

import java.net.URI;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/** RFC 9457 problem details for all error responses. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ProblemDetail> handleApi(ApiException ex, WebRequest req) {
        var pd = problem(ex.getStatus(), ex.getCode(), ex.getMessage(), req);
        return ResponseEntity.status(ex.getStatus()).body(pd);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex, WebRequest req) {
        List<Map<String, String>> errors = ex.getBindingResult().getAllErrors().stream()
                .map(e -> {
                    if (e instanceof FieldError fe) {
                        return Map.of("field", fe.getField(), "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "invalid");
                    }
                    return Map.of("message", e.getDefaultMessage() != null ? e.getDefaultMessage() : "invalid");
                })
                .toList();
        var pd = problem(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Request validation failed", req);
        pd.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(pd);
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ProblemDetail> handleAuth(AuthenticationException ex, WebRequest req) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(problem(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", ex.getMessage(), req));
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ProblemDetail> handleAccess(AccessDeniedException ex, WebRequest req) {
        // Return 404 to avoid revealing resource existence (Req 2.5)
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(problem(HttpStatus.NOT_FOUND, "NOT_FOUND", "Resource not found", req));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ProblemDetail> handleGeneric(Exception ex, WebRequest req) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.internalServerError()
                .body(problem(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", req));
    }

    private ProblemDetail problem(HttpStatus status, String code, String detail, WebRequest req) {
        var pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setType(URI.create("https://vixir.org/errors/" + code.toLowerCase().replace('_', '-')));
        pd.setProperty("code", code);
        pd.setProperty("instance", req.getDescription(false).replace("uri=", ""));
        return pd;
    }
}
