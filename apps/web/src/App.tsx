import { BrowserRouter, Route, Routes } from 'react-router';
import { Landing } from './routes/Landing';
import { Auth } from './routes/Auth';
import { LabWorkspace } from './routes/LabWorkspace';
import {
  StudentDashboardScreen,
  LabsHubScreen,
  ExperimentLibraryScreen,
  ExperimentBriefingScreen,
  ApparatusEncyclopediaScreen,
} from './routes/StudentScreens';
import {
  SafetyCheckScreen,
  ApparatusSetupScreen,
  ExamStartScreen,
} from './routes/PrelabScreens';
import { VixConnectScreen, VixTourScreen } from './routes/VixScreens';
import {
  ResultsGraphScreen,
  ReviewSubmitScreen,
  MarkedReportScreen,
  BenchReplayScreen,
} from './routes/PostlabScreens';
import {
  TeacherDashboardScreen,
  AssignExperimentScreen,
  ClassResultsScreen,
  ExperimentBuilderScreen,
  InstitutionAdminScreen,
} from './routes/TeacherAdminScreens';
import { NotFound } from './routes/NotFound';
import { Placeholder } from './routes/Placeholder';
import { screens } from './routes/screens';

export function renderScreenByCode(code: string) {
  switch (code) {
    case 'A1':
      return <Landing />;
    case 'A2':
      return <Auth />;
    case 'B1':
      return <StudentDashboardScreen />;
    case 'B2':
      return <LabsHubScreen />;
    case 'B3':
      return <ExperimentLibraryScreen />;
    case 'B4':
      return <ExperimentBriefingScreen />;
    case 'B5':
      return <ApparatusEncyclopediaScreen />;
    case 'C1':
      return <SafetyCheckScreen />;
    case 'C2':
      return <ApparatusSetupScreen />;
    case 'C3':
      return <ExamStartScreen />;
    case 'D1':
    case 'D2':
    case 'D3':
    case 'D4':
    case 'D5':
    case 'D6':
    case 'D7':
      return <LabWorkspace labCode={code} />;
    case 'E1':
      return <VixConnectScreen />;
    case 'E2':
      return <VixTourScreen />;
    case 'F1':
      return <ResultsGraphScreen />;
    case 'F2':
      return <ReviewSubmitScreen />;
    case 'F3':
      return <MarkedReportScreen />;
    case 'F4':
      return <BenchReplayScreen />;
    case 'G1':
      return <TeacherDashboardScreen />;
    case 'G2':
      return <AssignExperimentScreen />;
    case 'G3':
      return <ClassResultsScreen />;
    case 'G4':
      return <ExperimentBuilderScreen />;
    case 'H1':
      return <InstitutionAdminScreen />;
    default: {
      const s = screens.find((sc) => sc.code === code) ?? screens[0]!;
      return <Placeholder screen={s} />;
    }
  }
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All 28 Canonical Screen Routes (A1–I2) */}
        {screens.map((s) => (
          <Route key={s.code} path={s.path} element={renderScreenByCode(s.code)} />
        ))}

        {/* Dynamic Parameterized Routes & Alias Paths */}
        <Route path="/lab/physics/refraction" element={<LabWorkspace labCode="refraction" />} />
        <Route path="/lab/physics/moments" element={<LabWorkspace labCode="moments" />} />
        <Route
          path="/lab/chemistry/qualitative-analysis"
          element={<LabWorkspace labCode="qualitative-analysis" />}
        />
        <Route path="/lab/biology/food-tests" element={<LabWorkspace labCode="food-tests" />} />
        <Route path="/experiments/:slug" element={<ExperimentBriefingScreen />} />
        <Route path="/attempt/:id/results" element={<ResultsGraphScreen />} />
        <Route path="/attempt/:id/submit" element={<ReviewSubmitScreen />} />
        <Route path="/attempt/:id/report" element={<MarkedReportScreen />} />
        <Route path="/attempt/:id/replay" element={<BenchReplayScreen />} />
        <Route path="/exam/:id/start" element={<ExamStartScreen />} />
        <Route path="/teacher/assignments/:id/results" element={<ClassResultsScreen />} />

        {/* Alias Routes from structure.md */}
        <Route path="/app/labs" element={<LabsHubScreen />} />
        <Route path="/app/library" element={<ExperimentLibraryScreen />} />
        <Route path="/app/apparatus" element={<ApparatusEncyclopediaScreen />} />
        <Route path="/app/x/:slug" element={<ExperimentBriefingScreen />} />
        <Route path="/app/x/:slug/prelab" element={<SafetyCheckScreen />} />
        <Route path="/app/x/:slug/setup" element={<ApparatusSetupScreen />} />
        <Route path="/app/x/:slug/exam" element={<ExamStartScreen />} />
        <Route path="/app/x/:slug/lab" element={<LabWorkspace labCode="D1" />} />
        <Route path="/app/x/:slug/results" element={<ResultsGraphScreen />} />
        <Route path="/app/x/:slug/submit" element={<ReviewSubmitScreen />} />
        <Route path="/app/attempts/:attemptId" element={<MarkedReportScreen />} />
        <Route path="/app/attempts/:attemptId/replay" element={<BenchReplayScreen />} />
        <Route path="/teach" element={<TeacherDashboardScreen />} />
        <Route path="/teach/assign" element={<AssignExperimentScreen />} />
        <Route path="/teach/classes/:classId" element={<ClassResultsScreen />} />
        <Route path="/teach/builder" element={<ExperimentBuilderScreen />} />

        {/* 404 Not Found */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
