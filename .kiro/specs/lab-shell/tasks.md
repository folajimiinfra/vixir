# Implementation Plan — `lab-shell`

- [x] 1. Dark Workspace Shell (`LabLayout.tsx`)
  - [x] 1.1 Implement `#0B1220` header with back button, experiment title, practical dropdown switcher, 5-subject pill switcher (`Physics`, `Chemistry`, `Biology`, `Electronics`, `Engineering`), `Call Vix` pill, and primary next-step CTA (_Req 1, 2_)
  - [x] 1.2 Implement left tool rail (`pointer`, `ruler`, `zoom`, `note`, `clock`, `flask`, `alert`, `wave`, `pen`, `gauge`) and 216px apparatus tray with `data-vix-id` attributes (_Req 3_)
  - [x] 1.3 Implement center bench canvas (`lab-grid-bg` / `lab-dot-bg`), bottom instrument dock, and `aria-live="polite"` timestamped event log strip (_Req 4, 5_)
  - [x] 1.4 Implement right data panel and in-place `VixInLabOverlay` spotlight tour highlighting (`data-vix-id` targets) (_Req 6, 7_)
