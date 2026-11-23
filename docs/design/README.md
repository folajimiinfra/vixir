# Vixir design references

Rendered from the Vixir design canvas (https://claude.ai/artifact/5aXMLGBe5VVwqSuSj8myPP). Every file is named `<screen-code>-<slug>.png`; a `--<state>` suffix shows the same screen in another state. Retina (2×) PNGs: divide pixel sizes by 2 for CSS px. Desktop frames are 1440 px wide, mobile 390 px.

The same list lives in code at `apps/web/src/routes/screens.ts` (route, spec and design files per code).

| Code | Screen | Route | Spec | Design files |
|---|---|---|---|---|
| A1 | Landing page | `/` | `landing` | [A1-landing.png](screens/A1-landing.png) |
| A2 | Sign in / sign up | `/auth` | `frontend-app` | [A2-auth.png](screens/A2-auth.png)<br>[A2-auth--create-account.png](screens/A2-auth--create-account.png) |
| B1 | Student dashboard | `/app` | `frontend-app` | [B1-student-dashboard.png](screens/B1-student-dashboard.png) |
| B2 | Labs hub | `/app/labs` | `frontend-app` | [B2-labs-hub.png](screens/B2-labs-hub.png) |
| B3 | Experiment library | `/app/library` | `frontend-app` | [B3-experiment-library.png](screens/B3-experiment-library.png) |
| B4 | Experiment briefing | `/app/x/:experimentId` | `frontend-app` | [B4-experiment-briefing.png](screens/B4-experiment-briefing.png) |
| B5 | Apparatus encyclopedia | `/app/apparatus` | `apparatus-encyclopedia` | [B5-apparatus-encyclopedia.png](screens/B5-apparatus-encyclopedia.png) |
| C1 | Pre-lab safety check | `/app/x/:experimentId/prelab` | `chemistry-titration` | [C1-prelab-safety-check.png](screens/C1-prelab-safety-check.png)<br>[C1-prelab-safety-check--ready.png](screens/C1-prelab-safety-check--ready.png) |
| C2 | Apparatus setup | `/app/x/:experimentId/setup` | `physics-pendulum` | [C2-apparatus-setup.png](screens/C2-apparatus-setup.png)<br>[C2-apparatus-setup--complete.png](screens/C2-apparatus-setup--complete.png) |
| C3 | Exam mode start | `/app/x/:experimentId/exam` | `frontend-app` | [C3-exam-mode-start.png](screens/C3-exam-mode-start.png)<br>[C3-exam-mode-start--started.png](screens/C3-exam-mode-start--started.png) |
| D1 | Physics lab — simple pendulum | `/app/x/:experimentId/lab` | `physics-pendulum` | [D1-lab-physics-pendulum.png](screens/D1-lab-physics-pendulum.png) |
| D2 | Chemistry lab — acid–base titration | `/app/x/:experimentId/lab` | `chemistry-titration` | [D2-lab-chemistry-titration.png](screens/D2-lab-chemistry-titration.png) |
| D3 | Biology lab — journey of food | `/app/x/:experimentId/lab` | `biology-digestion` | [D3-lab-biology-digestion.png](screens/D3-lab-biology-digestion.png) |
| D4 | Biology lab — virtual dissection | `/app/x/:experimentId/lab` | `frontend-app` | [D4-lab-biology-dissection.png](screens/D4-lab-biology-dissection.png)<br>[D4-lab-biology-dissection--identify-organs.png](screens/D4-lab-biology-dissection--identify-organs.png) |
| D5 | Biology lab — body systems | `/app/x/:experimentId/lab` | `frontend-app` | [D5-lab-biology-body-systems.png](screens/D5-lab-biology-body-systems.png) |
| D6 | Electronics lab — Ohm’s law | `/app/x/:experimentId/lab` | `electronics-ohms-law` | [D6-lab-electronics-ohms-law.png](screens/D6-lab-electronics-ohms-law.png) |
| D7 | Engineering lab — beam deflection | `/app/x/:experimentId/lab` | `engineering-beam` | [D7-lab-engineering-beam.png](screens/D7-lab-engineering-beam.png)<br>[D7-lab-engineering-beam--front-elevation.png](screens/D7-lab-engineering-beam--front-elevation.png) |
| E1 | Call Vix | `?vix=connect` | `vix-guide` | [E1-vix-connect.png](screens/E1-vix-connect.png)<br>[E1-vix-connect--connected.png](screens/E1-vix-connect--connected.png) |
| E2 | Vix explains the workspace | `?vix=tour` | `vix-guide` | [E2-vix-tour.png](screens/E2-vix-tour.png) |
| F1 | Results & graph | `/app/x/:experimentId/results` | `frontend-app` | [F1-results-graph.png](screens/F1-results-graph.png) |
| F2 | Review & submit | `/app/x/:experimentId/submit` | `frontend-app` | [F2-review-submit.png](screens/F2-review-submit.png)<br>[F2-review-submit--submitted.png](screens/F2-review-submit--submitted.png) |
| F3 | Marked report | `/app/attempts/:attemptId` | `frontend-app` | [F3-marked-report.png](screens/F3-marked-report.png) |
| F4 | Bench replay | `/app/attempts/:attemptId/replay` | `frontend-app` | [F4-bench-replay.png](screens/F4-bench-replay.png) |
| G1 | Teacher dashboard | `/teach` | `frontend-app` | [G1-teacher-dashboard.png](screens/G1-teacher-dashboard.png) |
| G2 | Assign experiment | `/teach/assign` | `frontend-app` | [G2-assign-experiment.png](screens/G2-assign-experiment.png) |
| G3 | Class results & analytics | `/teach/classes/:classId` | `frontend-app` | [G3-class-results.png](screens/G3-class-results.png) |
| G4 | Experiment builder | `/teach/builder` | `frontend-app` | [G4-experiment-builder.png](screens/G4-experiment-builder.png) |
| H1 | Institution admin | `/admin` | `frontend-app` | [H1-institution-admin.png](screens/H1-institution-admin.png) |
| I1 | Mobile — student home | `/app` | `offline-pwa` | [I1-mobile-home.png](screens/I1-mobile-home.png) |
| I2 | Mobile — lab | `/app/x/:experimentId/lab` | `offline-pwa` | [I2-mobile-lab.png](screens/I2-mobile-lab.png) |

## Assets (in `apps/web/public`, served from the site root)

| Path | What | Used by |
|---|---|---|
| `/illustrations/logo.svg` | Vixir logo mark | all screens, favicon |
| `/illustrations/D1-physics-pendulum-bench.svg` | Pendulum bench illustration | D1, A1 hero, B2 |
| `/illustrations/D2-chemistry-titration-bench.svg` | Titration bench | D2, B2 |
| `/illustrations/D3-biology-digestive-system.svg` | Digestive system model | D3, B2 |
| `/illustrations/D4-biology-rat-dissection-opened.svg` | Dissection, body wall opened | D4, B2 |
| `/illustrations/D5-biology-body-systems.svg` | Body systems model | D5, B2 |
| `/illustrations/D6-electronics-ohms-law-circuit.svg` | Ohm's law circuit | D6, B2 |
| `/illustrations/D7-engineering-beam-rig-isometric.svg` | Isometric beam test rig | D7, B2 |
| `/apparatus/<id>.svg` + `/apparatus/index.json` | 10 isometric apparatus drawings, labelled | B5 |

The SVGs are static snapshots of the animated canvas designs, for reference, thumbnails and offline use. The live lab benches are React SVG components driven by `packages/sim-core`, so their parts can move.

## Using these with Kiro

- Building a screen: in Kiro chat, attach its image with `#File docs/design/screens/<code>-<slug>.png` and name the spec, e.g. *"Build B1 from #File docs/design/screens/B1-student-dashboard.png following frontend-app Requirement 6.1"*.
- Steering file `.kiro/steering/screens.md` tells Kiro where these files are whenever it works in `apps/web`.
