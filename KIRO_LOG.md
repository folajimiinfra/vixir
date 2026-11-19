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
