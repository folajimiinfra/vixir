# How we used Kiro 

Add an entry every time a Kiro feature saves real time or changes the outcome. Keep it honest and specific.

| Date | Who | Feature (spec / steering / hook / MCP / property test / vibe) | What we did | What it saved or caught |
|---|---|---|---|---|
| 2026-11-18 | | Steering | Committed product, tech, structure + 3 scoped steering files | |

## Specs
- List each spec, how many requirements, what changed after review of design.md / tasks.md.

## Property-based tests
- List the properties Kiro turned into fast-check tests and any bug they found.

## Hooks
- Name each hook, its trigger, and one time it fired usefully.

## MCP
- Which servers, what each was used for.
| 2026-11-18 | Kiro | Steering alignment | Fixed YAML front-matter headers for `product.md`, `structure.md`, `tech.md` (removed duplicate `---` blocks) | Clean steering files with consistent `inclusion: always` declarations |
| 2026-11-18 | Kiro | Hooks setup | Created `.kiro/hooks/lint-on-save.json` with `PostFileSave` trigger to run `pnpm lint` | Auto-linting on file save, catching style issues early |
| 2026-11-18 | Kiro | CI workflow | Added `test -f turbo.json` check to CI `web` job before running `pnpm turbo run` | CI fails fast if turbo.json is missing |
| 2026-11-18 | Folajimi | Hooks setup | Created `.kiro/hooks/lint-on-save.json` with `PostFileSave` trigger to run `pnpm lint` | Auto-linting on file save, catching style issues early |
| 2026-11-18 | Folajimi | CI workflow | Added `test -f turbo.json` check to CI `web` job before running `pnpm turbo run` | CI fails fast if turbo.json is missing |
| 2026-11-18 | Folajimi | Asset cleanup | Removed placeholder SVG files: A_logo_vixir.svg, D*.svg lab benches, apparatus SVGs (rule, dial, flask, pipette, retort, vernier) | Preparing for building screens from design images using Haiku 4.5 for vision |
| 2026-11-18 | Folajimi | Screens (A1, A2) | Built A1 Landing and A2 Auth screens from design images using Haiku 4.5 vision | 2 P0 screens complete: responsive hero, value props, 4-step process, institution benefits, OAuth; auth form with role selection and class code |
| 2026-11-18 | Folajimi | Screen A1 & A2 | Built Landing page and Auth screen from design images using Haiku 4.5 vision |
| 2026-11-18 | Folajimi | Dev server | Started Vite dev server on localhost:5173 |
| 2026-11-18 | Folajimi | UI Issues | Found Landing and Auth UIs poorly match design - needs redesign with proper colors and layout |
| 2026-11-18 | Folajimi | UI Fixes | Redesigned A1 Landing and A2 Auth to match design images |
| 2026-11-18 | Folajimi | Colors fixed | Changed to blue (#0B1220) dark background for hero section and lab showcase |
| 2026-11-18 | Folajimi | A2 Auth fixed | Updated to use dark blue (#0B1220) on left panel with proper typography |
| 2026-11-18 | Folajimi | Dev server | Running on localhost:5173 with HMR updates applied |
| 2026-11-18 | Folajimi | Pendulum Animation | Added swinging animation to D1 pendulum SVG in A1 hero section | Animated pendulum bob swinging with keyframe animation |
| 2026-11-18 | Folajimi | SVG Asset | Copied D1-physics-pendulum-bench.svg from Vixir-Screens-and-Assets | Hero section now shows pendulum bench with animated bob |
| 2026-11-18 | Folajimi | CSS Animation | Added @keyframes swing (rotate -5deg to 5deg) in index.css | Pendulum swings back and forth in hero section |
| 2026-11-18 | Folajimi | Dev server | Running on localhost:5173 with HMR updates applied | All changes live-reloaded |
| 2026-11-18 | Folajimi | Pendulum Animation Fix | Bob now swings with transform-origin at pivot point (300, 74) | Bob oscillates to-and-fro while setup stays fixed |
| 2026-11-18 | Folajimi | SVG Animation | Bob group wrapped in <g> with transform-origin attribute | Pendulum string and bob rotate from pivot, not whole SVG |


## 2026-11-18 | Folajimi | Lab Screens D1-D7

**Goal:** Build all lab workspace screens with shared LabLayout shell

**Actions:**
- Created `LabLayout` component with responsive header, tool rail, apparatus tray, bench area, instrument dock, event log strip, and data panel (Readings/Notebook/Assistant tabs)
- Implemented 5 complete lab workspaces following requirements specs:
  - **D1 Physics Pendulum:** Realistic pendulum swing with amplitude decay, manual stopwatch with reaction-time error, oscillation counter, readings table with T² calculation, live preview hint
  - **D2 Chemistry Titration:** Burette with 4 tap settings (closed/dropwise/slow/fast), pH calculation, phenolphthalein indicator color change, titration table with concordance checking, overshoot warnings
  - **D3 Biology Digestion:** Animated food journey through 6 digestive stages, peristaltic/churning animations, food-specific enzyme display, magnified villus view, playback controls with speed options
  - **D6 Electronics Ohm's Law:** Series circuit simulation, wire heating with temperature coefficient, analogue meters with range selection, V-I graph plotting, current flow animation
  - **D7 Engineering Beam:** Isometric and elevation views, material/span selection, dial gauge with settling animation, deflection measurement (loading/unloading), Young's modulus calculation
- Each lab includes realistic instrument behavior: resolution rounding, zero error, parallax error (when eye-level off), reaction time delays
- All apparatus rendered with SVG for scalability and real-world visual transfer
- Created `Button` component in `@vixir/ui` with variant/size props, WCAG 2.2 AA compliant (44px touch targets, proper contrast)
- Added `LabWorkspace` router component to load appropriate lab by experimentId parameter
- Installed `lucide-react` for consistent iconography
- All labs follow strict TypeScript, functional components, named exports conventions

**Result:**
- 5 fully interactive lab workspaces operational at `/app/x/{experimentId}/lab`
- Available experiment IDs: `physics-pendulum`, `chemistry-titration`, `biology-digestion`, `electronics-ohms-law`, `engineering-beam`
- Dev server running successfully on http://localhost:5173/
- Lab shell provides consistent UX across all experiments per lab-shell requirements
- Simulation models ready for seeded RNG integration from `packages/sim-core`
- All components follow product principles: simulate the practical, imperfect readings are a feature, real-world transfer focus

**Next Steps:**
- Integrate with backend API for attempt creation and event logging
- Connect to sim-core package for seeded randomness and instrument models
- Build setup screens (C1 Pre-lab, C2 Apparatus setup)
- Build results/analysis screens (F1 Results & graph, F2 Review & submit)
- Implement Vix guide integration (E1 Call Vix overlay)

## 2026-11-18 | Folajimi | Lab UI Issues & Fix

**Issue Found:**
The initial implementation of lab workspaces (D1-D7) used light theme colors (`bg-neutral-50`, `bg-white`, `text-neutral-600`) instead of the dark theme specified in `ui-design.md` steering file.

**Correct Colors (per ui-design.md):**
- Dark background: `#0B1220` (lab-bg)
- Panel background: `#121A2B` (lab-panel)
- Raised area: `#0E1626` (lab-raised)
- Line color: `#22304A` (lab-line)
- Text color: `#E6EBF5` (lab-text)
- Muted text: `#93A0B8` (lab-muted)

**Actions:**
1. Fixed `LabLayout` component to use dark theme classes (`bg-lab-bg`, `text-lab-text`, `border-lab-line`)
2. Updated all lab components (Pendulum, Titration, Digestion, Ohm's Law, Beam) with proper dark backgrounds
3. Updated control panels, tables, and UI elements with correct color classes
4. Ensured all text, borders, and backgrounds match the dark theme design tokens

**Result:**
- All lab workspaces now use proper dark theme consistent with design specifications
- Apparatus displays in dark panels with clear visual hierarchy
- Data tables have proper dark backgrounds with distinct colors for readings (#2DD4BF)
- Warning states use amber (#C2410C) as per design tokens

**Files Modified:**
- `apps/web/src/lab-shell/LabLayout.tsx`
- `apps/web/src/labs/physics-pendulum/PendulumLab.tsx`
- `apps/web/src/labs/chemistry-titration/TitrationLab.tsx`
- `apps/web/src/labs/biology-digestion/DigestionLab.tsx`
- `apps/web/src/labs/electronics-ohms-law/OhmsLawLab.tsx`
- `apps/web/src/labs/engineering-beam/BeamLab.tsx`

## 2026-11-19 | Kiro | A1 Inline Pendulum Pivot Fix & Design Token Alignment

**Issue Caught via `landing/requirements.md` & `ui-design.md` Steering:**
- Applying a CSS rotation class to an external `<img src="D1-physics-pendulum-bench.svg" />` rotated the entire SVG viewport instead of only the pendulum bob and string.

**Actions:**
- Replaced the external `<img>` in `A1` (`Landing.tsx`) with an inline `HeroPendulumCard` SVG driven by `requestAnimationFrame` simple harmonic motion around the stationary split-cork pivot `(168, 52)` (with `prefers-reduced-motion` guard).
- Loaded `Space Grotesk`, `Inter`, and `JetBrains Mono` in `apps/web/index.html` and mapped `--font-display`, `--font-sans`, `--font-mono`, `lab-grid-bg`, and `lab-dot-bg` in `apps/web/src/index.css`.
- Refined `A2` (`Auth.tsx`) split-screen layout with role-specific join codes (`Student`, `Teacher`, `Admin`) and password visibility toggle.

## 2026-11-19 | Kiro | Spec-Driven Frontend Build (`B1`–`I2`), 21-Item Apparatus Encyclopedia & Interactive Labs

**Kiro Features Used:**
- **Steering (`.kiro/steering/screens.md`, `ui-design.md`, `simulation-realism.md`, `vix-safety.md`)**: Guided light-surface (`#F5F7FA`) vs dark-lab (`#0B1220`) token split, `data-vix-id` spotlight regions, and Socratic graded-mode guardrails.
- **Specs & Task Checklists (`.kiro/specs/frontend-app/tasks.md`, `lab-shell/tasks.md`, `vix-guide/tasks.md`, `apparatus-encyclopedia/tasks.md`)**: Broke all 28 canonical screens (`A1`–`I2`) + 404 route into atomic implementation tasks.
- **Hooks (`.kiro/hooks/sim-core-test-on-save.json`, `web-test-on-save.json`)**: Ran `@vixir/sim-core` fast-check property tests and `@vixir/web` TypeScript typechecks automatically on save.

**Key Deliverables Completed:**
1. **Student & 21-Item Apparatus Encyclopedia (`B1`–`B5`)**:
   - Added dedicated `Apparatus encyclopedia` entry in `StudentSidebar`.
   - Expanded `B5` (`/apparatus`) to 21 verbose apparatus items across all 5 disciplines (`Physics`, `Chemistry`, `Biology`, `Electronics`, `Engineering`) with interactive SVG stage (`Zoom ×1.25`, `Rotate view`, `Hide/Show labels`), 4-tile technical specification strip, anatomy parts breakdown table, step-by-step SOP, and WAEC/NECO marking penalties.
2. **Pre-Lab (`C1`–`C3`), Vix Guide (`E1`–`E2`) & In-Lab Vix Overlay (`VixInLabOverlay.tsx`)**:
   - Wired `Call Vix` inside `LabLayout` to open `E1` Connect and `E2` Live Spotlight Tour directly over any active lab workspace with orange region highlighting, multilingual explanations (`English`, `Pidgin`, `Yorùbá`, `Hausa`, `Igbo`), and Web Speech API readout.
3. **11 Interactive Lab Simulations (`D1`–`D7` + 4 Secondary Practicals)**:
   - Upgraded `D6` Electronics Ohm's Law to a full interactive schematic builder on a dot-grid canvas with draggable components, rheostat wiper, extra components (`+ Resistor 5Ω`, `+ Si Diode`, `+ Green LED`, `+ 100µF Cap`), pin wiring, scope probe, and zero-error calibration.
   - Upgraded `D7` Engineering Beam Deflection with a real-time 3D isometric/orbit projection engine (360° yaw & pitch drag + camera presets).
   - Added 4 secondary interactive benches: *Refraction through a rectangular glass block* (`/lab/physics/refraction`), *Principle of moments* (`/lab/physics/moments`), *Qualitative analysis of salts* (`/lab/chemistry/qualitative-analysis`), and *Biochemical food tests* (`/lab/biology/food-tests`).
4. **Post-Lab (`F1`–`F4`) & `@vixir/sim-core` Deterministic Seeded RNG Store (`labSessionStore.ts`)**:
   - Connected `D1` and `F1`–`F4` to `@vixir/sim-core` (`createRng`, `readScale`, `readStopwatch`, `linearFit`, `pendulumPeriod`, `pendulumAngle`) so bench trials, 3 d.p. significant-figure checks, precautions, auto-marked scores, and timestamped bench replay actions stay synchronized.
5. **Teacher, Admin, Mobile & 404 (`G1`–`G4`, `H1`, `I1`–`I2`, `404`)**:
   - Completed all teacher, institution admin, mobile companion, and diagnostic 404 screens with Vitest test coverage.

## 2026-11-19 | Kiro | 53-Item Essential Laboratory Apparatus Encyclopedia (`B5`) & Pagination

**Spec Updated:** `.kiro/specs/apparatus-encyclopedia/tasks.md`

**Actions:**
- Simplified `StudentSidebar` navigation entry to **`Encyclopedia`** (`/apparatus`).
- Created `apps/web/src/routes/apparatusCatalog.ts` with **53 essential laboratory apparatus items** across all 5 disciplines (`Physics`, `Chemistry`, `Biology`, `Electronics`, `Engineering`) and 7 functional categories (`Measuring & Volumetric`, `Glassware & Containers`, `Heating & Thermal`, `Support & Handling`, `Microscopy & Specimen`, `Electrical & Circuit`, `Safety & PPE`) — covering all 50 standard school science instruments (beaker, measuring cylinder, test tube, test tube holder, conical flask, volumetric flask, pipette, burette, dropper, filter funnel, Bunsen burner, spirit lamp, tripod stand, wire gauze, porcelain crucible, evaporating dish, water bath, heating mantle, retort stand, tongs, spatula, glass rod, mortar & pestle, watch glass, forceps, Vernier caliper, micrometer screw gauge, metre rule, stopwatch, spring balance, ammeter, voltmeter, galvanometer, resistance box, rheostat, compound microscope, dissecting microscope, prepared slides, specimen jar, dissection tray, hand lens, thermometer, laboratory balance, wash bottle, safety goggles, gloves & lab coat, fire extinguisher & first-aid box) plus specialised engineering/biology instruments (potometer, dial gauge, Venturi manometer, breadboard & DMM, rectangular glass block).
- Added progressive pagination to `ApparatusEncyclopediaScreen`: shows 8 curated items initially with **`See more (+10)`**, **`Show all (53)`**, and **`Show less`** controls, while typing in the search input searches across the entire 53-item catalog immediately.

## 2026-11-19 | Kiro | 123-Item Full 4×25+ Apparatus Catalog & Airy 3-Tab Encyclopedia Redesign (`B5`)

**Spec Updated:** `.kiro/specs/apparatus-encyclopedia/tasks.md`

**Actions:**
- Expanded `apps/web/src/routes/apparatusCatalog.ts` from 53 to **123 laboratory apparatus items** covering every item across Biology (25+), Physics (25+), Chemistry (25+), Electronics (25+), and Engineering (10+).
- Redesigned `ApparatusEncyclopediaScreen` (`apps/web/src/routes/StudentScreens.tsx`) for an airy, non-cluttered layout: single top filter row (`All`, `Biology`, `Physics`, `Chemistry`, `Electronics`, `Engineering`), **6 spacious cards** initially with **`See more (+6)`**, and **3 detail tabs** (`Overview & Specs`, `Anatomy & Parts`, `Handling & Exam Tips`).
