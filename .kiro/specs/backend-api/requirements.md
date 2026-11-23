# Requirements Document

## Introduction
**Feature:** Backend API (Java 21 + Spring Boot)

`apps/api` is the single backend for Vixir. It owns identity, schools and classes, the experiment catalogue, assignments, attempts and their event logs, submissions, authoritative marking, teacher review, Vix session bootstrap and admin. It serves the React web app and the Python Vix agent. The data model is defined in steering `data-model.md` and every request/response shape in steering `contracts.md`; this spec states the behaviour.

Priorities: P0 = needed for the Kiroween demo (Dec 4, 2026). P1 = after P0 is green. P2 = after the hackathon.

## Glossary
- **API**: the Spring Boot application in `apps/api`.
- **Principal**: the authenticated user (id, role, institutionId) from the access JWT.
- **Owner teacher**: the teacher who owns a class, or a CO_TEACHER enrolled in it.
- **Attempt**: one run of one experiment version by one user (see data model).
- **Marker**: the pure-Java rubric evaluator in `org.vixir.marking`.
- **Implied value**: the derived quantity (g, concentration, E, R) computed by the Marker from the student's OWN readings.
- **Service token**: JWT with scope `vix-agent` used by the Vix agent.

## Requirements

### Requirement 1: Registration and sign-in (P0)
**User Story:** As a student, teacher or admin, I want to create an account and sign in, so that my work is saved and I see the right tools.

#### Acceptance Criteria
1. WHEN a registration request has a valid email, password of at least 8 characters, names and role THE API SHALL create an ACTIVE user and return 201 with access token and refresh cookie.
2. WHEN the role is STUDENT and a class code is supplied THE API SHALL enrol the new user in that class in the same transaction.
3. IF the class code does not match an unarchived class THEN THE API SHALL return 422 `CLASS_CODE_INVALID` and create nothing.
4. IF the email is already used THEN THE API SHALL return 409 `EMAIL_TAKEN`.
5. WHEN valid credentials are posted to `/auth/login` THE API SHALL return a 15-minute access JWT and set a 30-day rotating refresh cookie (httpOnly, Secure, SameSite=Lax).
6. WHEN a Google ID token is posted to `/auth/google` THE API SHALL verify it against `GOOGLE_CLIENT_ID`, sign in the matching user or create one, and return tokens.
7. WHEN `/auth/refresh` is called with a valid refresh token THE API SHALL issue a new pair and revoke the old refresh token.
8. IF a revoked refresh token is reused THEN THE API SHALL revoke its whole token family and return 401 `REFRESH_REUSED`.
9. THE API SHALL hash passwords with argon2id and never log passwords or tokens.
10. IF a user is DISABLED THEN THE API SHALL refuse sign-in with 403 `USER_DISABLED`.
11. THE API SHALL rate-limit `/auth/*` to 10 requests per minute per IP and per email.

### Requirement 2: Authorization (P0)
**User Story:** As a school, I want each person to see only what they should, so that student data stays private.

#### Acceptance Criteria
1. THE API SHALL require a valid access JWT on every `/api/v1/**` endpoint except `/auth/*`, `GET /experiments/**`, `GET /vix/tours/**`, anonymous practice and `/actuator/health`.
2. THE API SHALL allow a STUDENT to read and write only their own attempts, submissions and marks.
3. THE API SHALL allow a TEACHER to read attempts, submissions and marks only for classes where they are the owner teacher.
4. THE API SHALL allow an ADMIN to manage users, classes and settings only within their own institution.
5. IF a principal requests a resource outside these rules THEN THE API SHALL return 404 (not 403) so resource existence is not revealed.
6. THE API SHALL enforce these rules in the service layer with method security, and SHALL have an integration test per rule.

### Requirement 3: Institutions, users and settings (P0 minimal, P1 full)
**User Story:** As an institution admin, I want to set up my school and its people, so that teachers and students can start quickly.

#### Acceptance Criteria
1. (P0) THE API SHALL create an institution with default settings (Vix enabled, transcripts not retained, noise REALISTIC, locale en) when its first admin registers.
2. (P1) WHEN an admin uploads a CSV of users (first_name, last_name, role, email or matric_no, class_code) THE API SHALL validate every row, create valid users with one-time passwords, and return a per-row report.
3. (P1) WHEN an admin disables a user THE API SHALL set status DISABLED, revoke their refresh tokens and write an audit_log entry.
4. (P1) THE API SHALL let an admin read and update institution settings, and SHALL apply `vix_enabled` to all new Vix sessions immediately.
5. (P2) WHEN an admin requests a data export for a user THE API SHALL produce a JSON archive of that user's data within 24 hours.

### Requirement 4: Classes and enrolment (P0)
**User Story:** As a teacher, I want to create classes and let students join with a code, so that I can assign practicals to groups.

#### Acceptance Criteria
1. WHEN a teacher creates a class with name, subject and level THE API SHALL generate a unique join code of the form `SUBJ-LEVEL-XXXX` (4 characters from an unambiguous alphabet).
2. WHEN a student posts a valid join code to `/classes/join` THE API SHALL enrol them as STUDENT and return the class.
3. IF the student is already enrolled THEN THE API SHALL return 200 with the class and create no duplicate.
4. WHEN an owner teacher rotates the join code THE API SHALL invalidate the old code immediately.
5. THE API SHALL let an owner teacher list enrolled students and remove a student from the class.
6. THE API SHALL let a teacher list their classes with student counts, and a student list their classes.

### Requirement 5: Experiment catalogue (P0)
**User Story:** As a student or teacher, I want to browse experiments by subject, level and curriculum, so that I can find the right practical.

#### Acceptance Criteria
1. WHEN the API starts THE API SHALL load every config in `packages/experiments`, validate it against `experiment.schema.json`, and upsert EXPERIMENT and EXPERIMENT_VERSION rows.
2. IF any config is invalid THEN THE API SHALL fail startup and log the file and failing path.
3. THE API SHALL list PUBLISHED experiments filtered by subject, level and curriculum, with title, aim, estimated minutes and version.
4. THE API SHALL return a specific experiment version's full config, procedure, precautions and rubric summary.
5. THE API SHALL never change a PUBLISHED version in place; edits create a new version.

### Requirement 6: Assignments (P0)
**User Story:** As a teacher, I want to assign an experiment to my classes with a due date and mode, so that every student practises.

#### Acceptance Criteria
1. WHEN an owner teacher creates an assignment with class, experiment version, mode, opens_at, due_at, attempts_allowed, noise level and release policy THE API SHALL save it as DRAFT.
2. IF due_at is not after opens_at THEN THE API SHALL return 422 `DUE_BEFORE_OPEN`.
3. WHEN the teacher publishes an assignment THE API SHALL set status PUBLISHED and make it visible to every enrolled student.
4. THE API SHALL let a student list their assignments ordered by due_at with status (NOT_STARTED, IN_PROGRESS, SUBMITTED, MARKED, RELEASED) and progress.
5. WHEN the due time passes THE API SHALL refuse new attempts and submissions for that assignment with 409 `DUE_DATE_PASSED`, except offline submissions under Requirement 9.4.
6. THE API SHALL let a teacher close an assignment early.

### Requirement 7: Attempts (P0)
**User Story:** As a student, I want to start, leave and resume a practical without losing my bench.

#### Acceptance Criteria
1. WHEN a student starts an attempt on a published, open assignment within its attempt limit THE API SHALL create an attempt with a 16-byte cryptographically random seed and return the bootstrap in `contracts.md` §2.
2. IF the attempt limit is reached THEN THE API SHALL return 409 `ATTEMPT_LIMIT_REACHED`.
3. WHEN a student has an IN_PROGRESS attempt for the assignment THE API SHALL return it with its event log for resume instead of creating a new one.
4. THE API SHALL allow free practice attempts (no assignment, mode PRACTICE) for any published experiment.
5. (P0) THE API SHALL allow anonymous practice attempts from the landing page, without a user, limited to 20 per IP per hour, deleted after 24 hours.
6. THE API SHALL never return the experiment's hidden values; only the seed and config (the web derives them).

### Requirement 8: Event log ingest (P0)
**User Story:** As a teacher, I want every bench action stored reliably, even from patchy connections, so that I can review how work was done.

#### Acceptance Criteria
1. WHEN a batch of up to 200 events is posted for an IN_PROGRESS attempt owned by the principal THE API SHALL store each new event and return accepted and duplicate seqs.
2. THE API SHALL treat an event with an existing (attempt_id, client_event_id) as a duplicate and not store it again.
3. IF a batch contains a seq gap THEN THE API SHALL store the contiguous prefix and return 409 `EVENT_GAP` with the expected next seq.
4. IF the attempt is not IN_PROGRESS THEN THE API SHALL return 409 `ATTEMPT_LOCKED`.
5. WHEN a READING_RECORDED event is stored THE API SHALL also upsert the READING row for that row_index.
6. THE API SHALL return events after a given seq for resume and for bench replay.
7. THE API SHALL accept event payloads up to 8 KB each and reject larger ones with 413.

### Requirement 9: Submission (P0)
**User Story:** As a student, I want to submit my results and know they were received, so that I can be marked.

#### Acceptance Criteria
1. WHEN a student submits results with declaration accepted THE API SHALL validate the results against the experiment's results schema, lock the attempt (SUBMITTED), store the submission and return a submission ID.
2. IF the declaration is not accepted THEN THE API SHALL return 422 `DECLARATION_REQUIRED`.
3. THE API SHALL compute `readings_hash` from the normalised readings at submission.
4. WHEN an offline submission arrives after due_at with a client_submitted_at before due_at and all its events were created before due_at THE API SHALL accept it, set `late = false`, and raise a LATE_OFFLINE review flag.
5. WHEN a submission is stored THE API SHALL enqueue marking and return 202 within 500 ms.
6. THE API SHALL make submit idempotent by `Idempotency-Key`.

### Requirement 10: Authoritative marking (P0)
**User Story:** As a teacher, I want each student marked step by step against their own data, so that marking is fair and fast.

#### Acceptance Criteria
1. WHEN a submission is enqueued THE Marker SHALL score every rubric criterion and save MARK and MARK_CRITERION rows with a one-sentence reason each, within 60 seconds.
2. THE Marker SHALL compute the Implied value from the student's own readings by least-squares regression on the experiment's plot axes.
3. THE Marker SHALL award the derived-value marks WHEN the student's stated value is within the experiment tolerance of the Implied value.
4. THE Marker SHALL check every derived cell for arithmetic consistency (relative error ≤ 0.5% plus rounding) and significant figures against the experiment's rules.
5. THE Marker SHALL check the slope triangle spans at least half the plotted range of x.
6. THE Marker SHALL score precautions by matching the student's stated precautions to the experiment's precaution list (keyword sets per precaution).
7. THE Marker SHALL be deterministic: the same submission and marker_version always give the same marks.
8. THE Marker SHALL pass every vector in `packages/marking-fixtures`.
9. WHEN marking completes and release_policy is AUTO THE API SHALL set the attempt to RELEASED; WHEN MANUAL THE API SHALL set it to MARKED.
10. THE Marker SHALL have no Spring or database dependencies inside the evaluator so it can be property-tested with jqwik.

### Requirement 11: Review flags (P0 basic, P1 full)
**User Story:** As a teacher, I want suspicious or unusual work highlighted, so that I review only what needs me.

#### Acceptance Criteria
1. WHEN two submissions in the same assignment share a readings_hash THE API SHALL raise DUPLICATE_READINGS on both.
2. WHEN a student's Implied value is more than 3 robust standard deviations (median absolute deviation) from the class median THE API SHALL raise OUTLIER_RESULT.
3. THE API SHALL let an owner teacher list open flags for an assignment and resolve them with a note recorded in audit_log.

### Requirement 12: Teacher results, analytics and release (P0)
**User Story:** As a teacher, I want class-wide results and common mistakes, so that I can teach what the class got wrong.

#### Acceptance Criteria
1. THE API SHALL return for an assignment: enrolled count, submitted count, per-student status and total, a score histogram in 5 buckets, average per rubric criterion, and open flag count.
2. THE API SHALL return the five most common lost-mark reasons with the share of submissions affected.
3. WHEN a teacher overrides a criterion score with a reason THE API SHALL update MARK_CRITERION (overridden = true), recompute the total and write an audit_log entry.
4. WHEN a teacher adds a comment THE API SHALL store it on the MARK.
5. WHEN a teacher releases marks for an assignment THE API SHALL set released_at on every MARKED submission and move attempts to RELEASED.
6. THE API SHALL let a student read their report only when the attempt is RELEASED.

### Requirement 13: Vix session bootstrap (P0)
**User Story:** As a student, I want to call Vix safely, so that I get help without breaking exam rules.

#### Acceptance Criteria
1. WHEN a student requests a Vix session THE API SHALL check institution settings and attempt mode, create a VIX_SESSION, and return the bootstrap in `contracts.md` §6 with a LiveKit token valid for 30 minutes, scoped to one room, publish audio and screen-share and subscribe only.
2. IF the attempt mode is EXAM THEN THE API SHALL refuse with 409 `VIX_DISABLED_EXAM`.
3. IF the institution has Vix disabled THEN THE API SHALL refuse with 403 `VIX_DISABLED_INSTITUTION`.
4. THE API SHALL dispatch the Vix agent to the room using LiveKit agent dispatch with metadata `{ sessionId }`.
5. WHEN the agent calls the internal context endpoint with a valid service token THE API SHALL return mode, locale, first name and experiment procedure, precautions and tours — and never the seed, hidden values or the student's readings in GRADED mode.
6. WHERE transcript retention is enabled THE API SHALL store VIX_MESSAGE rows sent by the agent; otherwise it SHALL store only the turn count.
7. THE API SHALL serve scripted tours per screen code from experiment configs and `tours/*.json`, publicly cacheable.

### Requirement 14: Admin overview (P1)
**User Story:** As an admin, I want to see usage, so that I can report to my principal or accreditation team.

#### Acceptance Criteria
1. THE API SHALL return per institution: active students, teachers, classes, practicals completed this term by subject, and Vix sessions this term.
2. THE API SHALL return the audit log filtered by actor, action and date.

### Requirement 15: Operability (P0)
**User Story:** As the team, I want the API easy to run, test and debug, so that we ship on time.

#### Acceptance Criteria
1. THE API SHALL start locally with `docker compose up` (Postgres + API) and seed demo data under the `demo` profile.
2. THE API SHALL expose `/actuator/health` (liveness, readiness including the database) and Prometheus metrics.
3. THE API SHALL log JSON with a request id on every line and propagate `X-Request-Id`.
4. THE API SHALL publish OpenAPI at `/v3/api-docs` and Swagger UI at `/swagger-ui` outside production.
5. THE API SHALL allow CORS only from configured web origins.
6. THE API SHALL apply all schema changes through Flyway, and `./gradlew test` SHALL run them against Testcontainers Postgres.
7. THE API SHALL respond within 300 ms p95 for reads and 500 ms p95 for writes at 100 concurrent users on one 1 vCPU / 1 GB container.

### Requirement 16: Demo seed (P0)
**User Story:** As a judge, I want to log in and see a realistic class immediately.

#### Acceptance Criteria
1. WHEN the `demo` profile runs THE API SHALL create institution "Demo Secondary School", teacher `teacher@demo.vixir.org`, student `student@demo.vixir.org`, class "SS3A Physics" with 24 students, one published pendulum assignment and one titration assignment.
2. THE demo seed SHALL include 18 submitted and marked pendulum attempts generated by running the simulation with varied seeds and realistic human errors, including one duplicate pair and one outlier.

## Correctness properties (jqwik)
- Marking determinism: mark(s) == mark(s) for any submission s.
- Bounds: 0 ≤ awarded ≤ max for every criterion; total = Σ awarded.
- Self-consistency: a submission generated directly from simulated readings with exact arithmetic gets full marks on readings, table, graph and derived value.
- Monotonicity: increasing the error in the stated derived value never increases its marks.
- Idempotent ingest: posting the same event batch twice stores each event once.
- Join codes: generated codes are unique across 10,000 generations and contain no ambiguous characters (0/O, 1/I/L).
