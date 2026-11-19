# Implementation Plan — `frontend-app`

- [x] 1. Public & Authentication Screens (`A1`, `A2`)
  - [x] 1.1 Build `A1` Landing page with dark `#0B1220` hero, inline `HeroPendulumCard` SVG with stationary frame and swinging bob around split-cork pivot, 5-lab dark showcase, and zero pricing references (_Req 1, 2_)
  - [x] 1.2 Build `A2` Auth split screen with `Sign in` and `Create account` tabs, role selector (`Student`, `Teacher`, `Admin`), and join code fields (_Req 3_)

- [x] 2. Student Core Screens (`B1`–`B5`)
  - [x] 2.1 Implement `StudentSidebar` with dedicated `Apparatus encyclopedia` menu item and offline sync status pill (_Req 4_)
  - [x] 2.2 Build `B1` Student Dashboard, `B2` Laboratories Hub (5 labs), `B3` Experiment Library with curriculum & discipline filters, and `B4` Experiment Briefing (_Req 4, 5, 6_)
  - [x] 2.3 Build `B5` Apparatus Encyclopedia with 21 verbose apparatus items across all 5 disciplines (Physics, Chemistry, Biology, Electronics, Engineering) (_Req 7_)

- [x] 3. Pre-Lab & Exam Entry Screens (`C1`–`C3`)
  - [x] 3.1 Build `C1` Pre-lab Safety & Readiness Check with interactive PPE chips and 3-question check (_Req 8_)
  - [x] 3.2 Build `C2` Apparatus Setup with click-to-place bench regions and zero-error checklist (_Req 9_)
  - [x] 3.3 Build `C3` Exam Mode Start with timed lockdown banner and integrity confirmation (_Req 10_)

- [x] 4. Interactive Lab Workspaces (`D1`–`D7` + Secondary Practicals)
  - [x] 4.1 Implement `D1` Physics Simple Pendulum, `D2` Chemistry Titration, `D3` Biology Digestive System, `D4` Rat Dissection, `D5` Body Systems Explorer, `D6` Electronics Ohm's Law Circuit Workbench, and `D7` 3D Orbit Beam Deflection (_Req 11–17_)
  - [x] 4.2 Add secondary interactive practicals: Glass Block Refraction, Principle of Moments, Qualitative Salt Analysis, and Biochemical Food Tests (_Req 11, 12, 13_)

- [x] 5. Vix Guide & Post-Lab Flow (`E1`–`E2`, `F1`–`F4`)
  - [x] 5.1 Build `E1` Vix Connect, `E2` Spotlight Tour, and In-Lab `VixInLabOverlay` inside `LabLayout` (_Req 18, 19_)
  - [x] 5.2 Build `F1` Results Table & Graph, `F2` Review & Submit, `F3` Marked Report, and `F4` Bench Replay wired to `useLabSessionStore` and `@vixir/sim-core` (_Req 20–23_)

- [x] 6. Teacher, Admin, Mobile & 404 (`G1`–`G4`, `H1`, `I1`–`I2`, `404`)
  - [x] 6.1 Build `G1` Teacher Dashboard, `G2` Assign Experiment, `G3` Class Results, `G4` Experiment Builder, and `H1` Institution Admin (_Req 24–28_)
  - [x] 6.2 Build `I1` Mobile Home, `I2` Mobile Lab, and Diagnostic 404 NotFound route (_Req 29, 30_)
