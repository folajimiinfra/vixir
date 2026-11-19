---
inclusion: fileMatch
fileMatchPattern: "apps/web/**,docs/design/**"
---
# Screen designs (where to look before building UI)

Every screen has a code (A1–I2). Its design render is `docs/design/screens/<code>-<slug>.png` (states: `--<state>` suffix). The full table of code → route → spec → design files is in `docs/design/README.md` and in code at `apps/web/src/routes/screens.ts`.

Rules:
- Before building or changing a screen, open its design PNG(s) and match layout, spacing, colours and copy. Use tokens from `packages/ui` (see ui-design.md), not hex values copied from the image.
- Name route components after the code and slug: `apps/web/src/routes/B1-student-dashboard/index.tsx` exporting `StudentDashboard`; lab benches under `apps/web/src/labs/<lab-id>/`.
- Put `data-testid="screen-<code>"` on each screen's root element so Playwright tests and Vix tours can find it.
- Static images come from `apps/web/public`: `/illustrations/<code>-<slug>.svg`, `/apparatus/<id>.svg` (manifest `/apparatus/index.json`), `/illustrations/logo.svg`.
- Lab benches are live React SVG driven by sim-core, not the static SVG snapshots; use the snapshots only for thumbnails and empty states.

Quick index:

- A1 Landing page — `/` — spec `landing` — `A1-landing.png`
- A2 Sign in / sign up — `/auth` — spec `frontend-app` — `A2-auth.png`, `A2-auth--create-account.png`
- B1 Student dashboard — `/app` — spec `frontend-app` — `B1-student-dashboard.png`
- B2 Labs hub — `/app/labs` — spec `frontend-app` — `B2-labs-hub.png`
- B3 Experiment library — `/app/library` — spec `frontend-app` — `B3-experiment-library.png`
- B4 Experiment briefing — `/app/x/:experimentId` — spec `frontend-app` — `B4-experiment-briefing.png`
- B5 Apparatus encyclopedia — `/app/apparatus` — spec `apparatus-encyclopedia` — `B5-apparatus-encyclopedia.png`
- C1 Pre-lab safety check — `/app/x/:experimentId/prelab` — spec `chemistry-titration` — `C1-prelab-safety-check.png`, `C1-prelab-safety-check--ready.png`
- C2 Apparatus setup — `/app/x/:experimentId/setup` — spec `physics-pendulum` — `C2-apparatus-setup.png`, `C2-apparatus-setup--complete.png`
- C3 Exam mode start — `/app/x/:experimentId/exam` — spec `frontend-app` — `C3-exam-mode-start.png`, `C3-exam-mode-start--started.png`
- D1 Physics lab — simple pendulum — `/app/x/:experimentId/lab` — spec `physics-pendulum` — `D1-lab-physics-pendulum.png`
- D2 Chemistry lab — acid–base titration — `/app/x/:experimentId/lab` — spec `chemistry-titration` — `D2-lab-chemistry-titration.png`
- D3 Biology lab — journey of food — `/app/x/:experimentId/lab` — spec `biology-digestion` — `D3-lab-biology-digestion.png`
- D4 Biology lab — virtual dissection — `/app/x/:experimentId/lab` — spec `frontend-app` — `D4-lab-biology-dissection.png`, `D4-lab-biology-dissection--identify-organs.png`
- D5 Biology lab — body systems — `/app/x/:experimentId/lab` — spec `frontend-app` — `D5-lab-biology-body-systems.png`
- D6 Electronics lab — Ohm’s law — `/app/x/:experimentId/lab` — spec `electronics-ohms-law` — `D6-lab-electronics-ohms-law.png`
- D7 Engineering lab — beam deflection — `/app/x/:experimentId/lab` — spec `engineering-beam` — `D7-lab-engineering-beam.png`, `D7-lab-engineering-beam--front-elevation.png`
- E1 Call Vix — `?vix=connect` — spec `vix-guide` — `E1-vix-connect.png`, `E1-vix-connect--connected.png`
- E2 Vix explains the workspace — `?vix=tour` — spec `vix-guide` — `E2-vix-tour.png`
- F1 Results & graph — `/app/x/:experimentId/results` — spec `frontend-app` — `F1-results-graph.png`
- F2 Review & submit — `/app/x/:experimentId/submit` — spec `frontend-app` — `F2-review-submit.png`, `F2-review-submit--submitted.png`
- F3 Marked report — `/app/attempts/:attemptId` — spec `frontend-app` — `F3-marked-report.png`
- F4 Bench replay — `/app/attempts/:attemptId/replay` — spec `frontend-app` — `F4-bench-replay.png`
- G1 Teacher dashboard — `/teach` — spec `frontend-app` — `G1-teacher-dashboard.png`
- G2 Assign experiment — `/teach/assign` — spec `frontend-app` — `G2-assign-experiment.png`
- G3 Class results & analytics — `/teach/classes/:classId` — spec `frontend-app` — `G3-class-results.png`
- G4 Experiment builder — `/teach/builder` — spec `frontend-app` — `G4-experiment-builder.png`
- H1 Institution admin — `/admin` — spec `frontend-app` — `H1-institution-admin.png`
- I1 Mobile — student home — `/app` — spec `offline-pwa` — `I1-mobile-home.png`
- I2 Mobile — lab — `/app/x/:experimentId/lab` — spec `offline-pwa` — `I2-mobile-lab.png`
