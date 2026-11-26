# Vixir — open-source virtual practical laboratory

Browser-based practical laboratory built for Kiroween 2026 so secondary and university students can run realistic practicals — with real instrument errors, seeded randomness, authoritative server-side marking, and a full-duplex voice guide (Vix) — without needing a fully stocked physical lab. MIT licensed.

## Active disciplines

- **Physics:** Simple pendulum (`phy.pendulum.g`), glass block refraction, principle of moments
- **Chemistry:** Acid–base titration (`chem.titration`), qualitative salt analysis
- **Electronics:** Verifying Ohm's law (`elec.ohms-law`) interactive schematic workbench
- **Engineering:** 3D orbit simply supported beam deflection (`eng.beam`), 30° isometric drawing studio
- **Biology:** Coming soon (currently gated in the UI while the 4 core disciplines lead the release)
- **Apparatus Encyclopedia:** 123 searchable laboratory instruments with specs, anatomy, SOPs, and WAEC/NECO marking tips

> **Browser note:** Use **Google Chrome** (or a Chromium browser) on desktop for full-duplex Vix voice audio and spotlight tours.

## Repo layout

| Path | What | Owner |
|---|---|---|
| `apps/web` | React 19 + Vite + TypeScript PWA (`A1`–`I2`, manifest + service worker) | Frontend |
| `apps/api` | Java 21 + Spring Boot 3.5 API, PostgreSQL 17, Flyway, pure-Java `Marker` | Backend |
| `apps/vix-agent` | Python LiveKit Agents + 18-node LangGraph + Gemini Live duplex bridge (`:8090`) | Shared |
| `packages/sim-core` | Seeded RNG, instrument noise models, OLS regression (`fast-check` property tests) | Frontend |
| `packages/experiments` | Schema-validated experiment configs (`phy.pendulum.g`, `chem.titration`, `elec.ohms-law`, `eng.beam`) | Both |
| `packages/screen-map` | Vix `ScreenMap` + whitelisted RPC types | Frontend |
| `packages/ui` | Shared accessible UI components and design tokens | Frontend |
| `packages/marking-fixtures` | Shared marking test vectors across Java `Marker` and TS preview | Both |
| `.kiro/` | Steering, specs, tasks, and hooks (**committed** per Kiroween rules) | Both |

## Run it locally

Prerequisites: Node 22 + pnpm 10, Java 21, Docker or Podman, and Python 3.12+ with `uv`.

```bash
cp .env.example .env
pnpm install

# 1. Start PostgreSQL (:5432) and Spring Boot API (:8081)
docker compose up -d --build
# Verify: curl http://localhost:8081/api/v1/ping

# 2. Start Vix Voice & Guide Agent (:8090) in another terminal
cd apps/vix-agent && uv sync && uv run python -m vix_agent.server
# Verify: curl http://localhost:8090/health

# 3. Start Web App (:5173) from the repo root in another terminal
pnpm dev
```

To run the API outside Docker against the Compose Postgres container instead:

```bash
docker compose up -d postgres
cd apps/api && SPRING_PROFILES_ACTIVE=demo ./gradlew bootRun
```

### Demo credentials (`demo` profile)

When `SPRING_PROFILES_ACTIVE=demo` is active (the default in `docker-compose.yml`), `DemoDataSeeder` creates **Demo Secondary School** with class **SS3A Physics** (join code `PHY-SS3-DEMO`) and 25 seeded accounts:

| Role | Email / Matric No. | Password |
|---|---|---|
| Teacher | `teacher@demo.vixir.org` | `demo1234` |
| Student | `student@demo.vixir.org` (or matric `2025/16/16/0416`) | `demo1234` |

## Checks (same as CI)

```bash
pnpm validate:experiments                 # validate experiment JSON configs vs experiment.schema.json
pnpm turbo run typecheck test build       # web + packages (Vitest + fast-check property tests)
cd apps/api && ./gradlew build            # Java: jqwik properties + Testcontainers integration tests
cd apps/vix-agent && uv run ruff check . && uv run pytest -q
```

## CI/CD & Production Hosting

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | PRs and push to `main` | Path-filtered web/packages, Java API, Python agent checks + `.kiro/` presence check |
| `security.yml` | PRs and push to `main` | Gitleaks secret scan + Semgrep SAST |
| `deploy.yml` | Push to `main` / manual | Gated by Gitleaks, Semgrep, and all 3 test suites → Firebase Hosting + Render deploy hooks |
| `keepalive.yml` | Every 10 minutes | Liveness poll against Render API (`/actuator/health`) and Vix Agent (`/health`) |

### Hosting setup (Firebase Hosting + Render Blueprint)

1. **Backend & Agent — Render (`render.yaml`):** Connect the repo as a Blueprint on Render to provision `vixir-db` (PostgreSQL), `vixir-api` (`apps/api/Dockerfile`, health check `/actuator/health`), and `vixir-vix-agent` (`apps/vix-agent/Dockerfile`, health check `/health`). Set `VIXIR_WEB_ORIGINS`, `VIX_CORS_ORIGINS`, and `GEMINI_API_KEY` in Render, then add `RENDER_API_DEPLOY_HOOK` and `RENDER_AGENT_DEPLOY_HOOK` to GitHub Secrets.
2. **Frontend — Firebase Hosting (`firebase.json`, `.firebaserc`):** Add `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `VITE_API_URL`, and `VITE_VIX_AGENT_URL` to GitHub Secrets so `deploy.yml` builds and publishes `apps/web/dist` automatically on `main`.
3. **Vix Voice (optional LiveKit room tokens):** Set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` in both the API and Vix Agent environments.

## Kiro

Start with `.kiro/README.md`. See `KIRO_LOG.md` for the complete log of steering files, specs, hooks, and property-based tests used to build Vixir.
