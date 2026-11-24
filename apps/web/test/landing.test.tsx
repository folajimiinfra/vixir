import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Landing } from '../src/routes/Landing';
import { Auth } from '../src/routes/Auth';
import { AuthProvider, RequireAuth } from '../src/context/AuthContext';
import { DesktopOnlyGate } from '../src/components/DesktopOnlyGate';
import { setStoredAccessToken } from '../src/lib/api';
import { LabWorkspace } from '../src/routes/LabWorkspace';
import {
  StudentDashboardScreen,
  LabsHubScreen,
  ExperimentLibraryScreen,
  ApparatusEncyclopediaScreen,
} from '../src/routes/StudentScreens';
import {
  ResultsGraphScreen,
  ReviewSubmitScreen,
  MarkedReportScreen,
  BenchReplayScreen,
} from '../src/routes/PostlabScreens';
import {
  TeacherDashboardScreen,
  ClassResultsScreen,
  InstitutionAdminScreen,
} from '../src/routes/TeacherAdminScreens';
import { NotFound } from '../src/routes/NotFound';
import { useLabSessionStore, computeAutoMark } from '../src/store/labSessionStore';

describe('A1 Landing', () => {
  it('renders headline, Try-the-pendulum CTA, inline swinging bob SVG, and no pricing', () => {
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('heading', { name: /Every student deserves a real practical/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Try the pendulum lab/i })).toBeInTheDocument();
    expect(screen.getByTestId('hero-pendulum-bob')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/pricing|per seat|\$\/month/i);
  });
});

describe('Lab Workspaces & Core Screens', () => {
  it('renders D1–D7 and all 4 new secondary interactive lab workspaces without error', () => {
    const codes = [
      'D1',
      'D2',
      'D3',
      'D4',
      'D5',
      'D6',
      'D7',
      'refraction',
      'moments',
      'qualitative-analysis',
      'food-tests',
    ] as const;
    for (const code of codes) {
      const { unmount } = render(
        <MemoryRouter>
          <LabWorkspace labCode={code} />
        </MemoryRouter>
      );
      unmount();
    }
  });

  it('opens the live conversational Vix floating guide immediately over the active bench on Call Vix', () => {
    render(
      <MemoryRouter>
        <LabWorkspace labCode="D1" />
      </MemoryRouter>
    );

    const callBtn = screen.getByRole('button', { name: /Call Vix/i });
    fireEvent.click(callBtn);

    // Live conversational Vix floating card opens immediately without a blocking modal wall or cluttered tour pills
    expect(
      screen.getByRole('complementary', { name: /Vix live in-lab guide/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/POINTING AT · LAB BENCH/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Speak naturally, point anywhere, or type/i)
    ).toBeInTheDocument();
  });

  it('starts with an empty readings table (0/20) and reaches 20/20 as trials and precautions are recorded', () => {
    const store = useLabSessionStore.getState();
    store.clearPendulumRows();
    const initialMark = computeAutoMark(
      useLabSessionStore.getState().pendulumRows,
      useLabSessionStore.getState().precautions,
      useLabSessionStore.getState().gValue
    );
    expect(initialMark.total).toBe(0);
    expect(initialMark.maxTotal).toBe(20);

    // Record 6 trials dynamically on the bench (40..90 cm) and check all 3 precautions -> reaches 20 / 20
    for (const lengthCm of [40, 50, 60, 70, 80, 90]) {
      store.recordPendulumTrial({
        lengthCm,
        theta0Deg: 8,
        oscillations: 20,
        eyeLevel: true,
      });
    }
    store.fixAllDecimalPlaces();
    store.setPrecautions(() => ({
      parallax: true,
      smallAngle: true,
      centreSwing: true,
      extra: '',
    }));

    const updatedState = useLabSessionStore.getState();
    const fullMark = computeAutoMark(
      updatedState.pendulumRows,
      updatedState.precautions,
      updatedState.gValue
    );
    expect(fullMark.total).toBe(20);
    expect(fullMark.warningsCount).toBe(0);
  });

  it('renders Student, Post-lab, Teacher, and Admin screens matching design specs', () => {
    const views = [
      <StudentDashboardScreen key="b1" />,
      <LabsHubScreen key="b2" />,
      <ExperimentLibraryScreen key="b3" />,
      <ApparatusEncyclopediaScreen key="b5" />,
      <ResultsGraphScreen key="f1" />,
      <ReviewSubmitScreen key="f2" />,
      <MarkedReportScreen key="f3" />,
      <BenchReplayScreen key="f4" />,
      <TeacherDashboardScreen key="g1" />,
      <ClassResultsScreen key="g3" />,
      <InstitutionAdminScreen key="h1" />,
      <NotFound key="404" />,
    ];

    for (const view of views) {
      const { unmount } = render(<MemoryRouter>{view}</MemoryRouter>);
      unmount();
    }
  });

  it('shows Encyclopedia in sidebar, paginates 6 spacious cards with See more (+6), switches 3 detail tabs, and searches across all 123 apparatus', () => {
    render(
      <MemoryRouter>
        <ApparatusEncyclopediaScreen />
      </MemoryRouter>
    );

    // Sidebar item is named "Encyclopedia"
    expect(screen.getByRole('link', { name: 'Encyclopedia' })).toBeInTheDocument();

    // Initially shows 6 spacious cards and a "See more (+6)" button
    const seeMoreBtn = screen.getByRole('button', { name: /See more \(\+6\)/i });
    expect(seeMoreBtn).toBeInTheDocument();

    // Clicking "See more (+6)" expands visible items from 6 to 12
    fireEvent.click(seeMoreBtn);
    expect(screen.getByRole('button', { name: /Show less/i })).toBeInTheDocument();

    // 3 detail tabs: Overview & Specs, Anatomy & Parts, Handling & Exam Tips
    fireEvent.click(screen.getByRole('button', { name: /Anatomy & Parts/i }));
    expect(screen.getByText(/Functional anatomy & labelled parts/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Handling & Exam Tips/i }));
    expect(screen.getByText(/Mistakes examiners look for/i)).toBeInTheDocument();

    // Searching across the 123-item catalog finds newly added apparatus immediately
    const searchInput = screen.getByRole('searchbox', { name: /Search apparatus/i });
    fireEvent.change(searchInput, { target: { value: 'oscilloscope' } });
    expect(screen.getByText(/Digital storage oscilloscope/i)).toBeInTheDocument();
  });

  it('renders D5 6-System Medical Anatomy Atlas with leader lines, X-Ray mode, Alveoli/Nephron insets, and Vix Bio-AI simulator', () => {
    render(
      <MemoryRouter>
        <LabWorkspace labCode="D5" />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Human Anatomy & Physiology — 6-System Medical Atlas/i)
    ).toBeInTheDocument();

    // Switch View Mode to X-Ray / Fluoroscopy and toggle Quiz Mode
    fireEvent.click(screen.getByRole('button', { name: /X-Ray \/ Fluoroscopy/i }));
    fireEvent.click(screen.getByRole('button', { name: /Quiz Mode \(Hide Labels\)/i }));
    expect(screen.getByText(/Quiz Mode: ON/i)).toBeInTheDocument();

    // Switch Physiological State to High-Altitude Hypoxia
    fireEvent.click(screen.getByRole('button', { name: /High-Altitude Hypoxia/i }));
    expect(screen.getByText('86%')).toBeInTheDocument();

    // Inspect Alveoli O2, Nephron ADH, and Vix Bio-AI tabs
    fireEvent.click(screen.getByRole('button', { name: /Alveoli O₂/i }));
    expect(screen.getByText(/Magnified Alveolus & Pulmonary Capillary/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Nephron' }));
    expect(screen.getByText(/Nephron Ultrafiltration & ADH Control/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dehydrated' }));
    expect(screen.getByText(/1200 mOsm\/L/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Vix Bio-AI/i }));
    expect(screen.getByText(/SOCRATIC BIOLOGY EXAM Q&A/i)).toBeInTheDocument();
  });

  it('renders D4 Mammalian (Rabbit & Rat) Ventral Dissection Atlas with all 18 in-situ visceral organs and leader lines', () => {
    render(
      <MemoryRouter>
        <LabWorkspace labCode="D4" />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Dissection of a Mammal \(Rabbit — Oryctolagus cuniculus\)/i)
    ).toBeInTheDocument();

    // Verify key structures from the 18-organ ventral dissection plate
    fireEvent.click(screen.getByRole('button', { name: 'gall bladder' }));
    expect(screen.getByText(/Vesica biliaris/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'mesentery' }));
    expect(screen.getByText(/Mesenterium/i)).toBeInTheDocument();

    // Switch between Rabbit and Albino Rat specimen
    fireEvent.click(screen.getByRole('button', { name: /Albino Rat/i }));
    expect(
      screen.getByText(/Dissection of a Mammal \(Rat — Rattus norvegicus\)/i)
    ).toBeInTheDocument();
  });

  it('cycles the 5-lab calculation carousel on Auth and opens custom lab context menu on right-click in OhmsLawLab', () => {
    const { unmount } = render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Simple Pendulum — Determination of Acceleration Due to Gravity g/i)
    ).toBeInTheDocument();

    // Verify Sign in form validation rejects invalid email/matric ("jj") and short password ("12")
    fireEvent.change(screen.getByLabelText(/Email or matric \/ admission number/i), {
      target: { value: 'jj' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: '12' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));
    expect(
      screen.getByText(/Enter a valid school email .* or matric number/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter>
        <LabWorkspace labCode="D1" />
      </MemoryRouter>
    );

    // Hovering a left tool-rail button displays its floating tooltip
    const rulerBtn = screen.getByRole('button', { name: /Measure length/i });
    fireEvent.mouseEnter(rulerBtn.parentElement!);
    expect(screen.getByRole('tooltip')).toHaveTextContent(/Measure length/i);

    // Clicking the tool-rail buttons activates the Ruler, Lab Notes, and Timing Log widgets
    fireEvent.click(rulerBtn);
    expect(
      screen.getByText(/PRECISION BENCH RULER & VERNIER SCALE/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Lab notes/i }));
    expect(
      screen.getByText(/LAB NOTEBOOK & WAEC \/ NECO PRECAUTIONS PAD/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Timing log/i }));
    expect(screen.getByText(/AUXILIARY STOPWATCH/i)).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter>
        <LabWorkspace labCode="D6" />
      </MemoryRouter>
    );

    const canvasSvg = screen.getByRole('img', { name: /Interactive circuit builder/i });
    fireEvent.contextMenu(canvasSvg, { clientX: 250, clientY: 200 });
    expect(screen.getByRole('menu', { name: /Circuit workbench context menu/i })).toBeInTheDocument();
    expect(screen.getByText(/CIRCUIT WORKBENCH MENU/i)).toBeInTheDocument();
  });

  it('displays the authenticated user name from AuthProvider and guards protected routes with RequireAuth', () => {
    setStoredAccessToken('mock-jwt-token');
    const { unmount } = render(
      <AuthProvider
        initialUser={{
          id: 'u-1',
          email: 'student@demo.vixir.org',
          firstName: 'Chidi',
          lastName: 'Eze',
          role: 'STUDENT',
          status: 'ACTIVE',
          locale: 'en',
          institutionId: 'inst-1',
        }}
      >
        <MemoryRouter>
          <RequireAuth>
            <StudentDashboardScreen />
          </RequireAuth>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Good evening, Chidi Eze/i)).toBeInTheDocument();
    expect(screen.queryByText(/Adaeze/i)).not.toBeInTheDocument();
    unmount();
    setStoredAccessToken(null);
  });

  it('renders Engineering Isometric Drawing 30° CAD studio with 2H crate builder and 1st/3rd-angle views', () => {
    render(
      <MemoryRouter>
        <LabWorkspace labCode="isometric" />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('img', { name: /Interactive 30-degree isometric technical drawing board/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Box-in 2H Crate/i }));
    expect(screen.getByText('12')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /3rd ∠/i }));
    expect(screen.getByText(/3rd Angle/i)).toBeInTheDocument();
  });

  it('blocks phone screens in portrait and rotated landscape while allowing desktop viewports', () => {
    const origW = window.innerWidth;
    const origH = window.innerHeight;
    const setViewport = (w: number, h: number) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: w });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: h });
    };

    try {
      // Portrait phone
      setViewport(390, 844);
      const { unmount: u1 } = render(
        <DesktopOnlyGate>
          <div>Desktop Content</div>
        </DesktopOnlyGate>
      );
      expect(screen.getByText('Please use your computer to view this page.')).toBeInTheDocument();
      expect(screen.queryByText('Desktop Content')).not.toBeInTheDocument();
      u1();

      // Rotated landscape phone (even wide viewport with short height)
      setViewport(1100, 430);
      const { unmount: u2 } = render(
        <DesktopOnlyGate>
          <div>Desktop Content</div>
        </DesktopOnlyGate>
      );
      expect(screen.getByText('Please use your computer to view this page.')).toBeInTheDocument();
      expect(screen.queryByText('Desktop Content')).not.toBeInTheDocument();
      u2();

      // Desktop screen
      setViewport(1280, 800);
      const { unmount: u3 } = render(
        <DesktopOnlyGate>
          <div>Desktop Content</div>
        </DesktopOnlyGate>
      );
      expect(screen.getByText('Desktop Content')).toBeInTheDocument();
      u3();
    } finally {
      setViewport(origW, origH);
    }
  });
});
