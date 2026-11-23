# Implementation Plan — `apparatus-encyclopedia`

- [x] 1. Apparatus Catalog & Isometric SVGs (`B5`)
  - [x] 1.1 Copy and index isometric apparatus SVGs in `apps/web/public/apparatus/` (`index.json` + equipment SVGs) (_Req 1_)
  - [x] 1.2 Add dedicated `Encyclopedia` navigation item in `StudentSidebar` (_Req 2_)
  - [x] 1.3 Expand catalog (`apparatusCatalog.ts`) to 53 essential laboratory apparatus items across all 5 disciplines (`Physics`, `Chemistry`, `Biology`, `Electronics`, `Engineering`) and 7 functional categories (`Measuring & Volumetric`, `Glassware & Containers`, `Heating & Thermal`, `Support & Handling`, `Microscopy & Specimen`, `Electrical & Circuit`, `Safety & PPE`) (_Req 3_)
  - [x] 1.4 Implement curated initial view (8 items) with `See more (+10)` / `Show all (53)` / `Show less` pagination and instant full-catalog search across all 53 apparatus (_Req 3, 4_)
  - [x] 1.5 Render interactive stage (`Zoom ×1.25`, `Rotate view`, `Hide/Show labels`), Primary Laboratory Uses banner, 4-tile technical specification strip, anatomy parts breakdown table, step-by-step SOP, and WAEC/NECO marking penalties (_Req 4, 5_)
  - [x] 1.6 Expand `apparatusCatalog.ts` to 123 complete apparatus items (25+ Biology, 25+ Physics, 25+ Chemistry, 25+ Electronics, 10+ Engineering) and redesign `ApparatusEncyclopediaScreen` with a single discipline filter row, 6 spacious cards (`See more (+6)`), and 3 tabbed detail views (`Overview & Specs`, `Anatomy & Parts`, `Handling & Exam Tips`) (_Req 3, 4, 5_)
