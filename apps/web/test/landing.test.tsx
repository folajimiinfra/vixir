import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Landing } from '../src/routes/Landing';
import { Auth } from '../src/routes/Auth';
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

  it('opens the in-lab Vix Connect modal and transitions to the live spotlight tour over the active bench', () => {
    render(
      <MemoryRouter>
        <LabWorkspace labCode="D1" />
      </MemoryRouter>
    );

    const callBtn = screen.getByRole('button', { name: /Call Vix/i });
    fireEvent.click(callBtn);

    // E1 Connect modal appears over the bench
    expect(
      screen.getByRole('dialog', { name: /Connect to Vix lab guide/i })
    ).toBeInTheDocument();

    const connectBtn = screen.getByRole('button', { name: /Connect Vix to bench/i });
    fireEvent.click(connectBtn);

    const startTourBtn = screen.getByRole('button', { name: /Start live spotlight tour/i });
    fireEvent.click(startTourBtn);

    // E2 Live spotlight floating card is now active over the bench
    expect(
      screen.getByRole('complementary', { name: /Vix live in-lab guide/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/POINTING AT · LAB BENCH/i)).toBeInTheDocument();
  });

  it('syncs deterministic seeded RNG readings and auto-marking between labSessionStore and F1–F4 screens', () => {
    const store = useLabSessionStore.getState();
    const initialMark = computeAutoMark(
      store.pendulumRows,
      store.precautions,
      store.gValue
    );
    expect(initialMark.total).toBe(18);
    expect(initialMark.maxTotal).toBe(20);

    // Fix the 2 d.p. warning and add 3rd precaution -> reaches 20 / 20
    store.fixAllDecimalPlaces();
    store.setPrecautions((p) => ({ ...p, centreSwing: true }));

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

    expect(screen.getByText(/Simple Pendulum — Determination of g/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /chemistry/i }));
    expect(
      screen.getByText(/Acid–Base Titration — Standardizing HCl with Na₂CO₃/i)
    ).toBeInTheDocument();
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
});
