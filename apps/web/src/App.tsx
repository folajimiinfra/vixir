import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider, RequireAuth } from './context/AuthContext';
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

/**
 * Only Landing (A1), Auth (A2), and the public Pendulum Demo (D1 & C2) are public.
 * All other student, laboratory, teacher, and admin routes require authentication.
 */
const PUBLIC_SCREEN_CODES = new Set(['A1', 'A2', 'D1', 'C2']);

function protectElement(element: React.ReactNode, code?: string) {
  if (code && PUBLIC_SCREEN_CODES.has(code)) {
    return element;
  }
  return <RequireAuth>{element}</RequireAuth>;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Canonical Screen Routes (A1, A2, D1, C2 are public; all others require auth) */}
          {screens.map((s) => (
            <Route
              key={s.code}
              path={s.path}
              element={protectElement(renderScreenByCode(s.code), s.code)}
            />
          ))}

          {/* Protected Dynamic Parameterized Routes & Secondary Labs */}
          <Route
            path="/lab/physics/refraction"
            element={protectElement(<LabWorkspace labCode="refraction" />)}
          />
          <Route
            path="/lab/physics/moments"
            element={protectElement(<LabWorkspace labCode="moments" />)}
          />
          <Route
            path="/lab/chemistry/qualitative-analysis"
            element={protectElement(<LabWorkspace labCode="qualitative-analysis" />)}
          />
          <Route
            path="/lab/biology/food-tests"
            element={protectElement(<LabWorkspace labCode="food-tests" />)}
          />
          <Route
            path="/experiments/:slug"
            element={protectElement(<ExperimentBriefingScreen />)}
          />
          <Route
            path="/attempt/:id/results"
            element={protectElement(<ResultsGraphScreen />)}
          />
          <Route
            path="/attempt/:id/submit"
            element={protectElement(<ReviewSubmitScreen />)}
          />
          <Route
            path="/attempt/:id/report"
            element={protectElement(<MarkedReportScreen />)}
          />
          <Route
            path="/attempt/:id/replay"
            element={protectElement(<BenchReplayScreen />)}
          />
          <Route path="/exam/:id/start" element={protectElement(<ExamStartScreen />)} />
          <Route
            path="/teacher/assignments/:id/results"
            element={protectElement(<ClassResultsScreen />)}
          />

          {/* Protected Alias Routes */}
          <Route path="/app/labs" element={protectElement(<LabsHubScreen />)} />
          <Route
            path="/app/library"
            element={protectElement(<ExperimentLibraryScreen />)}
          />
          <Route
            path="/app/apparatus"
            element={protectElement(<ApparatusEncyclopediaScreen />)}
          />
          <Route
            path="/app/x/:slug"
            element={protectElement(<ExperimentBriefingScreen />)}
          />
          <Route
            path="/app/x/:slug/prelab"
            element={protectElement(<SafetyCheckScreen />)}
          />
          <Route
            path="/app/x/:slug/setup"
            element={protectElement(<ApparatusSetupScreen />)}
          />
          <Route path="/app/x/:slug/exam" element={protectElement(<ExamStartScreen />)} />
          <Route
            path="/app/x/:slug/lab"
            element={protectElement(<LabWorkspace labCode="D1" />)}
          />
          <Route
            path="/app/x/:slug/results"
            element={protectElement(<ResultsGraphScreen />)}
          />
          <Route
            path="/app/x/:slug/submit"
            element={protectElement(<ReviewSubmitScreen />)}
          />
          <Route
            path="/app/attempts/:attemptId"
            element={protectElement(<MarkedReportScreen />)}
          />
          <Route
            path="/app/attempts/:attemptId/replay"
            element={protectElement(<BenchReplayScreen />)}
          />
          <Route path="/teach" element={protectElement(<TeacherDashboardScreen />)} />
          <Route
            path="/teach/assign"
            element={protectElement(<AssignExperimentScreen />)}
          />
          <Route
            path="/teach/classes/:classId"
            element={protectElement(<ClassResultsScreen />)}
          />
          <Route
            path="/teach/builder"
            element={protectElement(<ExperimentBuilderScreen />)}
          />

          {/* 404 Not Found */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
