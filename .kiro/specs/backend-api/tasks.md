# Implementation Plan — `backend-api`

- [x] 1. Authentication, Registration & Security (`org.vixir.auth`)
  - [x] 1.1 Implement email/password and matric/admission-number registration and login with argon2id hashing, 15-min HS256 access JWT, and 30-day rotating `vx_refresh` httpOnly cookie (_Req 1.1–1.5, 1.7–1.10_)
  - [x] 1.2 Implement Google ID token sign-in (`/api/v1/auth/google`) and refresh token reuse family revocation (_Req 1.6, 1.8_)
  - [x] 1.3 Enforce IP and email rate limiting on `/api/v1/auth/*` (`AuthRateLimitFilter` + `AuthRateLimitFilterTest`) (_Req 1.11_)
  - [x] 1.4 Enforce ownership and role authorization in the service layer with 404 masking (`AccessGuard`, `ReviewAccess`, `AuthorizationRulesTest`, `ReviewAuthorizationTest`) (_Req 2_)

- [x] 2. Institutions, Classes & Enrolment (`org.vixir.school`)
  - [x] 2.1 Create institution + default `InstitutionSettings` on admin signup (`InstitutionService`, `InstitutionOnSignupTest`) (_Req 3.1_)
  - [x] 2.2 Implement class creation with unambiguous `SUBJ-LEVEL-XXXX` join codes (`JoinCodeGenerator` + `JoinCodeGeneratorProperties`), `/classes/join`, code rotation, and roster listing/removal (_Req 4_)
  - [ ] 2.3 (P1/P2) Implement admin CSV bulk user import, user disable with audit log, settings endpoints, and data export (_Req 3.2–3.5, Req 14_)

- [x] 3. Experiment Catalogue & Scripted Tours (`org.vixir.experiment`)
  - [x] 3.1 Load and schema-validate `packages/experiments/<id>/v<n>.json` on startup (`ExperimentLoader`), upserting `EXPERIMENT`, `EXPERIMENT_VERSION`, and `RUBRIC` rows (_Req 5.1–5.2_)
  - [x] 3.2 Expose `GET /api/v1/experiments` and version detail endpoints (_Req 5.3–5.5_)
  - [x] 3.3 Serve publicly cacheable scripted Vix tours via `GET /api/v1/vix/tours/{screenCode}` (`TourService`, `TourEndpointTest`) (_Req 13.7_)

- [x] 4. Assignments, Attempts, Event Ingest & Submissions (`org.vixir.assignment`, `org.vixir.attempt`, `org.vixir.submission`)
  - [x] 4.1 Implement assignment creation, publish, close, and student assignment listing (`AssignmentController`, `AssignmentService`) (_Req 6_)
  - [x] 4.2 Implement attempt bootstrap with 16-byte cryptographic seed, resume, anonymous practice attempts, and `GET /api/v1/attempts/me` (`AttemptController`, `AttemptService`) (_Req 7_)
  - [x] 4.3 Implement idempotent event batch ingest with sequence gap detection and `READING` upsert (`EventIngestService`, `EventIngestIdempotencyTest`) (_Req 8_)
  - [x] 4.4 Implement idempotent submission with `readings_hash`, offline-late acceptance with `LATE_OFFLINE` flag, and async marking enqueue (`SubmissionService`, `OfflineLateSubmissionTest`) (_Req 9_)

- [x] 5. Pure Authoritative Marker & Teacher Review (`org.vixir.marking`, `org.vixir.review`)
  - [x] 5.1 Implement pure-Java `Marker`, `Regression`, `SigFigRules`, and `PrecautionMatcher` with zero Spring/DB dependencies and jqwik property tests (`MarkerProperties`) (_Req 10_)
  - [x] 5.2 Implement `MarkingService` orchestration and duplicate/outlier review flags (`FlagService`) (_Req 10.9, Req 11_)
  - [x] 5.3 Implement class results, analytics histogram/common mistakes, criterion score overrides with `audit_log`, teacher comments, and mark release (`ReviewController`, `AnalyticsService`, `ReleaseService`, `AssignmentAnalyticsTest`, `AnalyticsQueryTest`) (_Req 12_)

- [x] 6. Vix Session Bootstrap & Operability (`org.vixir.vix`, `org.vixir.common`)
  - [x] 6.1 Implement `/api/v1/vix/sessions` bootstrap with `EXAM`/`VIX_DISABLED_INSTITUTION` guards, LiveKit token minting, and `/internal/vix/**` service-token endpoints (`VixSessionService`, `LiveKitTokenFactory`, `InternalVixController`, `VixBootstrapTest`) (_Req 13.1–13.6_)
  - [x] 6.2 Configure Flyway migrations, JSON structured logging with `X-Request-Id`, OpenAPI/Swagger UI, `/actuator/health`, CORS, non-root Dockerfile, and `demo` profile seeder (`DemoDataSeeder`, `ApiIntegrationTest`, `NoEntityInResponsesTest`) (_Req 15, Req 16_)
