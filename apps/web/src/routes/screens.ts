/** Every screen on the Vixir canvas, by code. See `.kiro/steering/screens.md` and `docs/design/screens/`. */
export interface ScreenDef {
  code: string;
  title: string;
  path: string;
  png: string;
  spec: string;
}

export const screens: ScreenDef[] = [
  { code: 'A1', title: 'Landing page', path: '/', png: 'A1-landing.png', spec: 'landing' },
  { code: 'A2', title: 'Sign in / Create account', path: '/auth', png: 'A2-auth.png', spec: 'auth-and-tenancy' },
  { code: 'B1', title: 'Student dashboard', path: '/app', png: 'B1-student-dashboard.png', spec: 'frontend-app' },
  { code: 'B2', title: 'Laboratories hub (5 labs)', path: '/labs', png: 'B2-labs-hub.png', spec: 'frontend-app' },
  { code: 'B3', title: 'Experiment library', path: '/library', png: 'B3-experiment-library.png', spec: 'frontend-app' },
  { code: 'B4', title: 'Experiment briefing', path: '/experiments/simple-pendulum', png: 'B4-experiment-briefing.png', spec: 'frontend-app' },
  { code: 'B5', title: 'Apparatus encyclopedia', path: '/apparatus', png: 'B5-apparatus-encyclopedia.png', spec: 'apparatus-encyclopedia' },
  { code: 'C1', title: 'Pre-lab safety & readiness check', path: '/lab/chemistry/titration/safety', png: 'C1-prelab-safety-check.png', spec: 'chemistry-titration' },
  { code: 'C2', title: 'Apparatus setup step', path: '/lab/physics/pendulum/setup', png: 'C2-apparatus-setup.png', spec: 'physics-pendulum' },
  { code: 'C3', title: 'Exam mode — before you start', path: '/exam/demo/start', png: 'C3-exam-mode-start.png', spec: 'teacher-and-classes' },
  { code: 'D1', title: 'Physics lab — Simple pendulum', path: '/lab/physics/pendulum', png: 'D1-lab-physics-pendulum.png', spec: 'physics-pendulum' },
  { code: 'D2', title: 'Chemistry lab — Acid–base titration', path: '/lab/chemistry/titration', png: 'D2-lab-chemistry-titration.png', spec: 'chemistry-titration' },
  { code: 'D3', title: 'Biology lab — Journey of food', path: '/lab/biology/digestion', png: 'D3-lab-biology-digestion.png', spec: 'biology-digestion' },
  { code: 'D4', title: 'Biology lab — Virtual rat dissection', path: '/lab/biology/dissection', png: 'D4-lab-biology-dissection.png', spec: 'biology-dissection' },
  { code: 'D5', title: 'Biology lab — Human body systems', path: '/lab/biology/body-systems', png: 'D5-lab-biology-body-systems.png', spec: 'biology-body-systems' },
  { code: 'D6', title: "Electronics lab — Verifying Ohm's law", path: '/lab/electronics/ohms-law', png: 'D6-lab-electronics-ohms-law.png', spec: 'electronics-ohms-law' },
  { code: 'D7', title: 'Engineering lab — Beam deflection', path: '/lab/engineering/beam', png: 'D7-lab-engineering-beam.png', spec: 'engineering-beam' },
  { code: 'E1', title: 'Vix — voice & vision connect', path: '/lab/vix/connect', png: 'E1-vix-connect.png', spec: 'vix-guide' },
  { code: 'E2', title: 'Vix — live spotlight tour', path: '/lab/vix/tour', png: 'E2-vix-tour.png', spec: 'vix-guide' },
  { code: 'F1', title: 'Results table, graph & calculations', path: '/attempt/demo/results', png: 'F1-results-graph.png', spec: 'marking-and-reports' },
  { code: 'F2', title: 'Pre-submit review', path: '/attempt/demo/submit', png: 'F2-review-submit.png', spec: 'marking-and-reports' },
  { code: 'F3', title: 'Marked report & feedback', path: '/attempt/demo/report', png: 'F3-marked-report.png', spec: 'marking-and-reports' },
  { code: 'F4', title: 'Bench replay (teacher & student)', path: '/attempt/demo/replay', png: 'F4-bench-replay.png', spec: 'marking-and-reports' },
  { code: 'G1', title: 'Teacher dashboard', path: '/teacher', png: 'G1-teacher-dashboard.png', spec: 'teacher-and-classes' },
  { code: 'G2', title: 'Assign an experiment', path: '/teacher/assignments/new', png: 'G2-assign-experiment.png', spec: 'teacher-and-classes' },
  { code: 'G3', title: 'Class results & analytics', path: '/teacher/assignments/demo/results', png: 'G3-class-results.png', spec: 'teacher-and-classes' },
  { code: 'G4', title: 'Experiment builder', path: '/teacher/builder', png: 'G4-experiment-builder.png', spec: 'experiment-builder' },
  { code: 'H1', title: 'Institution admin console', path: '/admin', png: 'H1-institution-admin.png', spec: 'auth-and-tenancy' },
  { code: 'I1', title: 'Mobile student home (offline)', path: '/m', png: 'I1-mobile-home.png', spec: 'offline-pwa' },
  { code: 'I2', title: 'Mobile lab workspace', path: '/m/lab/physics/pendulum', png: 'I2-mobile-lab.png', spec: 'offline-pwa' },
];
