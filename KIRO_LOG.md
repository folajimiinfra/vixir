# How we used Kiro

Honest, specific log of how Kiro specs, steering files, hooks, and property-based tests shaped Vixir for Kiroween 2026.

## Summary of Kiro Features Used

### Steering (`.kiro/steering/`)
- **Always-on (`inclusion: always`):** `product.md` (core pedagogy: simulate the practical, imperfect readings are a feature, real-world visual transfer), `tech.md` (stack versions and CI checks), `structure.md` (monorepo boundaries).
- **File-scoped:** `contracts.md` (REST, event log, ScreenMap, Vix RPCs), `data-model.md` (PostgreSQL ERD), `java-backend.md` (Spring Boot modular monolith rules), `simulation-realism.md` (seeded RNG, zero error, parallax, reaction time), `ui-design.md` (light portal `#F5F7FA` vs dark lab `#0B1220` tokens), `screens.md` (canonical screens `A1`–`I2`), `vix-safety.md` (GRADED-mode no-answer-leak guardrails).

### Specs (`.kiro/specs/`)
- **Layer specs:** `frontend-app` (`requirements.md` + `tasks.md`), `backend-api` (`requirements.md` + `design.md` + `tasks.md`), `vix-agent` (`requirements.md` + `design.md` + `tasks.md`).
- **Feature specs:** `lab-shell` (`requirements.md` + `tasks.md`), `vix-guide` (`requirements.md` + `tasks.md`), `apparatus-encyclopedia` (`requirements.md` + `design.md` + `tasks.md`), `landing`, `physics-pendulum`, `chemistry-titration`, `biology-digestion`, `electronics-ohms-law`, `engineering-beam`, `offline-pwa`.
- Spec review tightened the `contracts.md` ScreenMap size cap (16 KB), the `VIX_DISABLED_EXAM` / `VIX_DISABLED_INSTITUTION` backend gates, and the dark-lab token split enforced across `D1`–`D7`.

### Property-Based Tests
- **TypeScript (`fast-check` in `packages/sim-core/test/`):**
  - `rng.props.test.ts` — determinism for equal seeds, output bounds in `[0, 1)`, and forked-stream independence from extra parent draws.
  - `pendulum.props.test.ts` — strict monotonicity of period with length, `T²/L` within 1% of `4π²/g` at small angles, and stopwatch resolution rounding bounded by reaction-time error.
- **Java (`jqwik` in `apps/api/src/test/java/org/vixir/`):**
  - `marking/MarkerProperties.java` — marking determinism, criterion bounds `0 ≤ awarded ≤ max` with `total = Σ awarded`, and monotonicity of derived-value score as error increases.
  - `school/JoinCodeGeneratorProperties.java` — format validation (`SUBJ-LEVEL-XXXX`), exclusion of ambiguous characters (`0/O/1/I/L`), and uniqueness across 10,000 generated codes.
- **Python (`hypothesis` in `apps/vix-agent/tests/test_policy.py`):**
  - `test_graded_blocks_any_number_with_unit` — verifies `PolicyGuard` blocks any decimal value paired with lab units (`s`, `cm`, `m/s^2`, `cm³`, `mol dm-3`, `V`, `A`, `GPa`, `mm`) in `GRADED` mode, plus 42-turn evaluation coverage in `apps/vix-agent/evals/physics_pendulum_evals.json`.

### Hooks (`.kiro/hooks/`)
- `lint-on-save.json` (`PostFileSave`) — runs `pnpm lint` to catch TypeScript/lint regressions immediately.
- `web-test-on-save.json` (`PostFileSave`, `apps/web/src/**`) — runs `pnpm --filter @vixir/web typecheck` whenever frontend source changes.
- `sim-core-test-on-save.json` (`PostFileSave`, `packages/sim-core/**`) — runs `pnpm --filter @vixir/sim-core test` (including `fast-check` property suites) on simulation edits.

### MCP & External Tooling
- Standard GitHub Actions workflows (`.github/workflows/ci.yml`, `security.yml`, `deploy.yml`, `keepalive.yml`) enforce `.kiro/` presence, Semgrep SAST, Gitleaks secret scanning, and multi-stack test gates before Firebase Hosting and Render deployment.

---

## Timeline Log

| Date | Who | Feature | What we did | What it saved or caught |
|---|---|---|---|---|
| 2026-11-18 | Team | Steering | Committed always-on (`product`, `tech`, `structure`) and scoped steering files | Shared source of truth across frontend, Java API, and Python agent |
| 2026-11-18 | Kiro | Steering alignment | Fixed duplicate YAML front-matter headers in `product.md`, `structure.md`, `tech.md` | Clean `inclusion: always` declarations loaded reliably |
| 2026-11-18 | Folajimi / Kiro | Hooks & CI | Created `.kiro/hooks/lint-on-save.json`, `web-test-on-save.json`, `sim-core-test-on-save.json` and added `test -f turbo.json` + `.kiro` checks in `ci.yml` | Caught type errors on save and enforced Kiroween `.kiro` requirement in CI |
| 2026-11-18 | Folajimi | Screens A1 & A2 | Built Landing (`A1`) and Auth (`A2`) from design references; fixed dark hero (`#0B1220`) and pendulum pivot rotation | Aligned UI colors/layout with `ui-design.md` |
| 2026-11-18 | Folajimi | Lab Shell & D1–D7 | Built `LabLayout` and initial interactive labs; caught light-theme mismatch and migrated all benches to `#0B1220` dark tokens | Consistent dark-bench ergonomics across all practicals |
| 2026-11-19 | Kiro | Specs & Frontend (`B1`–`I2`) | Completed 28 canonical screens, 123-item Apparatus Encyclopedia (`B5`), `@vixir/sim-core` deterministic store, 4 secondary practicals, and upgraded `D4`/`D5`/`D6`/`D7` | Full end-to-end student, teacher, and admin UI with Vitest coverage |
| 2026-11-20 – 2026-11-23 | MrBost / Folajimi | Backend API (`apps/api`) | Hardened Spring Boot 3.5 API (PR #11): argon2id auth, rotating refresh cookies, rate limiting, Flyway schema, `ExperimentLoader`, pure-Java `Marker` + jqwik tests, `TourService`, `GET /api/v1/attempts/me`, matric/admission login, and Testcontainers integration tests | Authoritative, deterministic server-side marking and PostgreSQL persistence |
| 2026-11-23 | Folajimi | Full-Stack Wiring | Wired `apps/web` to `apps/api` (`:8081`): `AuthProvider` + `RequireAuth` guard, live dashboard/library/report states (zero hardcoded cards), per-row reading persistence to `attempt_event`, and `F3` mark release/review | Replaced prototype state with real PostgreSQL-backed attempts and marks |
| 2026-11-23 – 2026-11-24 | Folajimi | Vix Agent (`apps/vix-agent`) | Built 18-node multi-agent LangGraph, 42-turn eval set, aiohttp HTTP/WS server (`:8090`), and full-duplex Gemini 3.1 Flash Live audio-to-audio WebSocket with 16 kHz PCM capture, real-time `spotlight`, `switch_lab`, and dynamic Tutorial Sandbox bench construction | Eliminated push-TTS latency and STT hallucinations; hands-free persistent call across routes |
| 2026-11-24 – 2026-11-25 | Folajimi | Isometric CAD, Scope & Polish | Added 30° Isometric Drawing Studio (`D8`), desktop-only phone gate, portal-wide page-aware Vix tours, non-Chrome audio warning badge, and scoped Biology labs as "Coming soon" | Focused hackathon demo on 4 polished, high-reliability disciplines (Physics, Chemistry, Electronics, Engineering) |
| 2026-11-24 – 2026-11-26 | Folajimi | Deployment, Security & PWA | Added Firebase Hosting + Render Blueprint (`render.yaml`), blocking Semgrep + Gitleaks security gate, non-root API container, 10-min Render keep-alive poller, PWA manifest + service worker, and shared experiment configs/marking fixtures for Titration, Ohm's Law, and Beam | Production-deployed stack with automated security/test gates and 4 schema-validated experiments |

---

## Detailed Milestones (Nov 18–19 Archive)

### 2026-11-18 — Lab Screens D1–D7 & Dark Theme Alignment
- Created `LabLayout` component with responsive header, tool rail, apparatus tray, bench area, instrument dock, event log strip, and data panel (Readings/Notebook/Assistant tabs).
- Migrated all initial light-theme lab workspaces to the `ui-design.md` dark palette (`#0B1220` lab-bg, `#121A2B` lab-panel, `#0E1626` lab-raised, `#22304A` lab-line, `#E6EBF5` lab-text, `#2DD4BF` readings, `#C2410C` warnings).

### 2026-11-19 — Spec-Driven Frontend Build (`B1`–`I2`), 123-Item Apparatus Encyclopedia & Interactive Labs
- Replaced external hero pendulum `<img>` in `A1` (`Landing.tsx`) with inline `requestAnimationFrame` SHM SVG around stationary pivot `(168, 52)` with `prefers-reduced-motion` support.
- Expanded `apps/web/src/routes/apparatusCatalog.ts` to **123 laboratory apparatus items** across 5 disciplines with search, pagination, and 3-tab detail view (`Overview & Specs`, `Anatomy & Parts`, `Handling & Exam Tips`).
- Connected `D1` and `F1`–`F4` to `@vixir/sim-core` (`createRng`, `readScale`, `readStopwatch`, `linearFit`, `pendulumPeriod`, `pendulumAngle`).
- Upgraded `D6` Electronics Ohm's Law to a draggable dot-grid schematic builder with extra components and zero-error calibration, and `D7` Engineering Beam Deflection to a 360° 3D orbit projection engine.
- Built `D4` Mammalian Ventral Dissection and `D5` 6-System Medical Anatomy Atlas (currently gated as "Coming soon" in UI navigation while Chemistry, Physics, Electronics, and Engineering lead the hackathon demo).
