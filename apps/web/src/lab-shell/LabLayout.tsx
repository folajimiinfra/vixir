import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  ChevronLeft,
  MousePointer,
  Ruler,
  ZoomIn,
  FileText,
  Clock,
  FlaskConical,
  AlertTriangle,
  Activity,
  PenTool,
  Gauge,
} from 'lucide-react';
import {
  VixConnectModal,
  VixSpotlightFloatingCard,
  VIX_TOUR_STEPS,
  type VixTargetRegion,
} from './VixInLabOverlay';

export type SubjectLab = 'physics' | 'chemistry' | 'biology' | 'electronics' | 'engineering';

export interface ToolRailItem {
  id: string;
  label: string;
  icon: 'pointer' | 'ruler' | 'zoom' | 'note' | 'clock' | 'flask' | 'alert' | 'wave' | 'pen' | 'gauge';
  active?: boolean;
  onClick?: () => void;
}

export interface LabLayoutProps {
  experimentTitle: string;
  subtitle?: string;
  activeLab?: SubjectLab;
  mode?: 'practice' | 'graded' | 'exam';
  attemptNumber?: number;
  headerRightExtra?: ReactNode;
  onCallVix?: () => void;
  onNextStep?: () => void;
  nextStepLabel?: string;
  nextStepTo?: string;
  nextStepDisabled?: boolean;
  toolRail?: ToolRailItem[];
  toolRailAccent?: string;
  leftTray?: ReactNode;
  children: ReactNode;
  bottomDock?: ReactNode;
  logMessage?: string;
  rightPanel?: ReactNode;
  dotGrid?: boolean;
}

const LAB_TABS: {
  id: SubjectLab;
  label: string;
  to: string;
  activeClass: string;
  disabled?: boolean;
}[] = [
  {
    id: 'physics',
    label: 'Physics',
    to: '/lab/physics/pendulum',
    activeClass: 'bg-[#1C2A47] text-[#60A5FA]',
  },
  {
    id: 'chemistry',
    label: 'Chemistry',
    to: '/lab/chemistry/titration',
    activeClass: 'bg-[#3A2112] text-[#FDBA74]',
  },
  {
    id: 'biology',
    label: 'Biology',
    to: '/lab/biology/digestion',
    activeClass: 'bg-[#122D1F] text-[#4ADE80]',
    disabled: true,
  },
  {
    id: 'electronics',
    label: 'Electronics',
    to: '/lab/electronics/ohms-law',
    activeClass: 'bg-[#112D2B] text-[#5EEAD4]',
  },
  {
    id: 'engineering',
    label: 'Engineering',
    to: '/lab/engineering/beam',
    activeClass: 'bg-[#291A42] text-[#D8B4FE]',
  },
];

const SUB_EXPERIMENTS_BY_LAB: Record<
  SubjectLab,
  { label: string; to: string }[]
> = {
  physics: [
    { label: 'Simple pendulum', to: '/lab/physics/pendulum' },
    { label: 'Glass block refraction', to: '/lab/physics/refraction' },
    { label: 'Principle of moments', to: '/lab/physics/moments' },
  ],
  chemistry: [
    { label: 'Acid–base titration', to: '/lab/chemistry/titration' },
    { label: 'Qualitative salt analysis', to: '/lab/chemistry/qualitative-analysis' },
  ],
  biology: [
    { label: 'Digestive tract', to: '/lab/biology/digestion' },
    { label: 'Rat dissection', to: '/lab/biology/dissection' },
    { label: 'Body systems', to: '/lab/biology/body-systems' },
    { label: 'Food tests', to: '/lab/biology/food-tests' },
  ],
  electronics: [
    { label: 'Ohm’s law & circuit bench', to: '/lab/electronics/ohms-law' },
  ],
  engineering: [
    { label: '3D Beam deflection', to: '/lab/engineering/beam' },
  ],
};

function renderToolIcon(icon: ToolRailItem['icon']) {
  switch (icon) {
    case 'pointer':
      return <MousePointer className="w-4 h-4" />;
    case 'ruler':
      return <Ruler className="w-4 h-4" />;
    case 'zoom':
      return <ZoomIn className="w-4 h-4" />;
    case 'note':
      return <FileText className="w-4 h-4" />;
    case 'clock':
      return <Clock className="w-4 h-4" />;
    case 'flask':
      return <FlaskConical className="w-4 h-4" />;
    case 'alert':
      return <AlertTriangle className="w-4 h-4" />;
    case 'wave':
      return <Activity className="w-4 h-4" />;
    case 'pen':
      return <PenTool className="w-4 h-4" />;
    case 'gauge':
      return <Gauge className="w-4 h-4" />;
  }
}

export function LabLayout({
  experimentTitle,
  subtitle = 'Graded · attempt 1 of 2 · autosaved',
  activeLab = 'physics',
  mode = 'graded',
  headerRightExtra,
  onCallVix,
  onNextStep,
  nextStepLabel,
  nextStepTo = '/attempt/demo/results',
  nextStepDisabled = false,
  toolRail,
  toolRailAccent = 'bg-[#1C2A47] text-[#60A5FA]',
  leftTray,
  children,
  bottomDock,
  logMessage,
  rightPanel,
  dotGrid = false,
}: LabLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // In-Lab Vix state: 'closed' | 'connect' | 'tour' (auto-reopens seamlessly when Vix switches labs!)
  const [vixMode, setVixMode] = useState<'closed' | 'connect' | 'tour'>(() => {
    if (
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem('vix_auto_reopen') === '1'
    ) {
      window.sessionStorage.removeItem('vix_auto_reopen');
      return 'tour';
    }
    return 'closed';
  });
  const [vixVoice, setVixVoice] = useState<'ada' | 'tunde' | 'grace'>('ada');
  const [vixStepIdx, setVixStepIdx] = useState(3); // Default to Bench
  const [dimNonActive, setDimNonActive] = useState(false);

  // Global Laboratory Right-Click Context Menu
  const [labContextMenu, setLabContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Interactive Tool Rail State (makes every icon on the left tool rail functional with tooltips & bench overlays)
  const defaultRail: ToolRailItem[] = [
    { id: 'pointer', label: 'Select & interact with bench', icon: 'pointer' },
    { id: 'ruler', label: 'Precision ruler & vernier scale', icon: 'ruler' },
    { id: 'zoom', label: 'Magnifier loupe (×1.20 eye-level)', icon: 'zoom' },
    { id: 'note', label: 'Lab notebook & precautions', icon: 'note' },
    { id: 'clock', label: 'Digital stopwatch & lap timer', icon: 'clock' },
  ];
  const effectiveToolRail = toolRail && toolRail.length > 0 ? toolRail : defaultRail;

  const [selectedRailId, setSelectedRailId] = useState<string>(
    effectiveToolRail.find((t) => t.active)?.id ?? effectiveToolRail[0]?.id ?? 'pointer'
  );
  const [hoveredRailId, setHoveredRailId] = useState<string | null>(null);
  const [rulerCursorCm, setRulerCursorCm] = useState<number>(42.5);
  const [labNotesText, setLabNotesText] = useState<string>(
    '• Zero error checked at eye level (no parallax).\n• Repeated readings taken and mean recorded to 2 d.p.'
  );
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [stopwatchLaps, setStopwatchLaps] = useState<number[]>([]);

  useEffect(() => {
    if (!stopwatchRunning) return;
    const t = window.setInterval(() => {
      setStopwatchMs((prev) => prev + 100);
    }, 100);
    return () => window.clearInterval(t);
  }, [stopwatchRunning]);

  const activeRailTool =
    effectiveToolRail.find((t) => t.id === selectedRailId) ?? effectiveToolRail[0]!;
  const isBenchZoomed = activeRailTool?.icon === 'zoom';

  const activeVixRegion: VixTargetRegion | null =
    vixMode === 'tour' ? (VIX_TOUR_STEPS[vixStepIdx]?.id ?? 'bench') : null;

  const getRegionHighlightClass = (region: VixTargetRegion) => {
    if (vixMode !== 'tour') return '';
    if (activeVixRegion === region) {
      return 'ring-2 ring-[#FDBA74] shadow-[0_0_28px_rgba(249,115,22,0.35)] z-10 transition-all';
    }
    return dimNonActive ? 'opacity-40 transition-opacity' : '';
  };

  const handleCallVix = () => {
    if (onCallVix) {
      onCallVix();
      return;
    }
    if (vixMode === 'tour') {
      setVixMode('closed');
    } else {
      // Instant conversational Vix: opens live hands-free assistant directly over the bench without a blocking modal wall
      setVixMode('tour');
    }
  };

  const handleNext = () => {
    if (onNextStep) {
      onNextStep();
    } else if (nextStepTo) {
      navigate(nextStepTo);
    }
  };

  const subExperiments = SUB_EXPERIMENTS_BY_LAB[activeLab] ?? [];

  return (
    <div
      className="min-h-screen bg-[#0B1220] text-[#E6EBF5] flex flex-col select-none relative"
      onClick={() => {
        if (labContextMenu) setLabContextMenu(null);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        const x = Math.min(e.clientX, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 250);
        const y = Math.min(e.clientY, (typeof window !== 'undefined' ? window.innerHeight : 800) - 310);
        setLabContextMenu({ x: Math.max(12, x), y: Math.max(12, y) });
      }}
    >
      {/* Top Lab Header */}
      <header
        data-vix-id="top-bar"
        className={`bg-[#0B1220] border-b border-[#1E2A42] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 ${getRegionHighlightClass(
          'top-bar'
        )}`}
      >
        {/* Left: Back button + Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/labs"
            aria-label="Back to laboratories"
            className="w-9 h-9 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] flex items-center justify-center text-[#C9D3E6] hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-sm sm:text-base font-bold text-[#E6EBF5] truncate">
                {experimentTitle}
              </h1>
              {subExperiments.length > 1 && (
                <select
                  aria-label="Switch practical in this laboratory"
                  value={
                    subExperiments.find((s) => location.pathname.startsWith(s.to))?.to ??
                    subExperiments[0]?.to
                  }
                  onChange={(e) => navigate(e.target.value)}
                  className="hidden md:inline-block bg-[#121A2B] border border-[#22304A] hover:border-[#3A4A68] rounded-lg px-2 py-0.5 text-[11px] font-semibold text-[#C9D3E6] cursor-pointer"
                >
                  {subExperiments.map((exp) => (
                    <option key={exp.to} value={exp.to}>
                      {exp.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-[#93A0B8] truncate">{subtitle}</p>
          </div>
        </div>

        {/* Center: Lab Pill Switcher (Biology grayed out & disabled for now) */}
        <nav
          aria-label="Laboratory switcher"
          className="hidden md:flex items-center bg-[#121A2B] border border-[#22304A] rounded-full p-1 gap-0.5"
        >
          {LAB_TABS.map((tab) => {
            const isActive = tab.id === activeLab;
            if (tab.disabled) {
              return (
                <span
                  key={tab.id}
                  aria-disabled="true"
                  title="Biology lab is coming soon"
                  className="px-3.5 py-1 rounded-full text-xs font-semibold text-[#4B5563] opacity-45 cursor-not-allowed select-none"
                >
                  {tab.label}
                </span>
              );
            }
            return (
              <Link
                key={tab.id}
                to={tab.to}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  isActive
                    ? tab.activeClass
                    : 'text-[#93A0B8] hover:text-[#E6EBF5]'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Extra status/buttons + Call Vix + Next Step */}
        <div className="flex items-center gap-2.5">
          {headerRightExtra}

          {mode !== 'exam' && (
            <button
              type="button"
              onClick={handleCallVix}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                vixMode === 'tour'
                  ? 'bg-[#F97316] border-[#FDBA74] text-[#0B1220] font-bold shadow-[0_0_20px_rgba(249,115,22,0.45)]'
                  : 'bg-[#231915] hover:bg-[#332219] border-[#9A3412] text-[#FDBA74]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  vixMode === 'tour' ? 'bg-[#0B1220] animate-ping' : 'bg-[#F97316]'
                }`}
              />
              {vixMode === 'tour' ? 'Vix is on · End' : 'Call Vix'}
            </button>
          )}

          {nextStepLabel && (
            <button
              type="button"
              onClick={handleNext}
              disabled={nextStepDisabled}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                nextStepDisabled
                  ? 'bg-[#1E2A42] text-[#6B778C] cursor-not-allowed'
                  : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
              }`}
            >
              {nextStepLabel}
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Section: Tool Rail + Apparatus Tray */}
        <div className="flex border-b lg:border-b-0 lg:border-r border-[#1E2A42] shrink-0">
          {effectiveToolRail.length > 0 && (
            <aside
              data-vix-id="tool-rail"
              aria-label="Bench tools"
              className={`w-12 bg-[#0B1220] border-r border-[#1E2A42] py-3 flex flex-col items-center gap-2 shrink-0 relative z-30 ${getRegionHighlightClass(
                'tool-rail'
              )}`}
            >
              {effectiveToolRail.map((tool, idx) => {
                // If the parent lab explicitly controls active tool (more than 1 tool has active boolean defined), respect it; otherwise use selectedRailId
                const hasExplicitController =
                  effectiveToolRail.filter((t) => typeof t.onClick === 'function').length >= 2;
                const isActive = hasExplicitController
                  ? Boolean(tool.active)
                  : selectedRailId === tool.id;
                const isHovered = hoveredRailId === tool.id;

                const toolShortcut =
                  tool.icon === 'pointer'
                    ? 'V'
                    : tool.icon === 'ruler'
                      ? 'M'
                      : tool.icon === 'zoom'
                        ? 'Z'
                        : tool.icon === 'note'
                          ? 'N'
                          : tool.icon === 'clock'
                            ? 'T'
                            : `${idx + 1}`;

                return (
                  <div
                    key={tool.id}
                    className="relative flex items-center"
                    onMouseEnter={() => setHoveredRailId(tool.id)}
                    onMouseLeave={() =>
                      setHoveredRailId((prev) => (prev === tool.id ? null : prev))
                    }
                  >
                    <button
                      type="button"
                      aria-label={tool.label}
                      aria-pressed={isActive}
                      onFocus={() => setHoveredRailId(tool.id)}
                      onBlur={() =>
                        setHoveredRailId((prev) => (prev === tool.id ? null : prev))
                      }
                      onClick={() => {
                        setSelectedRailId((prev) =>
                          prev === tool.id && tool.icon !== 'pointer' ? 'pointer' : tool.id
                        );
                        if (tool.onClick) {
                          tool.onClick();
                        }
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? `${toolRailAccent} ring-1 ring-white/20 shadow-sm`
                          : 'text-[#93A0B8] hover:text-[#E6EBF5] hover:bg-[#121A2B]'
                      }`}
                    >
                      {renderToolIcon(tool.icon)}
                    </button>

                    {/* Instant Floating Vixir Tooltip Pill */}
                    {isHovered && (
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute left-12 z-50 px-3 py-1.5 rounded-xl bg-[#121A2B] border border-[#38BDF8]/50 shadow-[0_10px_28px_rgba(0,0,0,0.65)] whitespace-nowrap flex items-center gap-2.5"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">{tool.label}</div>
                          <div className="text-[10px] text-[#93A0B8]">
                            {isActive ? 'Active on bench — click to toggle' : 'Click to activate tool'}
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-[#0B1220] border border-[#22304A] font-mono text-[10px] text-[#7DD3FC]">
                          {toolShortcut}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </aside>
          )}

          {leftTray && (
            <aside
              data-vix-id="apparatus-tray"
              className={`w-full lg:w-[216px] bg-[#0B1220] p-3.5 flex flex-col justify-between overflow-y-auto ${getRegionHighlightClass(
                'apparatus-tray'
              )}`}
            >
              {leftTray}
            </aside>
          )}
        </div>

        {/* Center Section: Bench Canvas + Instrument Dock + Log Strip */}
        <div className="flex-1 flex flex-col min-w-0">
          <div
            data-vix-id="bench"
            className={`flex-1 relative flex flex-col justify-between p-4 min-h-[420px] overflow-hidden ${
              dotGrid ? 'lab-dot-bg' : 'lab-grid-bg'
            } ${getRegionHighlightClass('bench')}`}
          >
            {/* Active Tool Rail Interactive Overlays (Ruler, Zoom Loupe, Lab Notes, Stopwatch, Safety/Calibration) */}
            {selectedRailId !== 'pointer' && activeRailTool && (
              <div className="z-20 mb-2">
                {/* 1. RULER / SCALE OVERLAY */}
                {activeRailTool.icon === 'ruler' && (
                  <div className="bg-[#121A2B]/95 border border-[#38BDF8]/50 rounded-xl p-3 shadow-lg space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-[#7DD3FC]">
                        PRECISION BENCH RULER &amp; VERNIER SCALE · LEAST COUNT ±0.05 cm
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-white font-bold">
                          Cursor: {rulerCursorCm.toFixed(2)} cm ({(rulerCursorCm * 10).toFixed(1)} mm)
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedRailId('pointer')}
                          className="px-2 py-0.5 rounded bg-[#0B1220] text-[#93A0B8] hover:text-white text-[11px] cursor-pointer"
                        >
                          Close ×
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.05}
                      value={rulerCursorCm}
                      onChange={(e) => setRulerCursorCm(parseFloat(e.target.value))}
                      aria-label="Slide precision ruler cursor in cm"
                      className="w-full accent-[#38BDF8] cursor-pointer"
                    />
                    <div className="flex justify-between font-mono text-[10px] text-[#93A0B8]">
                      <span>0.0 cm</span>
                      <span>20.0 cm</span>
                      <span>40.0 cm</span>
                      <span>60.0 cm</span>
                      <span>80.0 cm</span>
                      <span>100.0 cm</span>
                    </div>
                  </div>
                )}

                {/* 2. ZOOM / MAGNIFIER LOUPE BANNER */}
                {activeRailTool.icon === 'zoom' && (
                  <div className="bg-[#121A2B]/95 border border-[#38BDF8]/50 rounded-xl px-3.5 py-2 shadow-lg flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-[#7DD3FC]">
                      OPTICAL MAGNIFIER LOUPE ACTIVE (×1.15) · Eye-level zero-parallax inspection
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedRailId('pointer')}
                      className="px-2.5 py-1 rounded-lg bg-[#0B1220] border border-[#22304A] text-white font-semibold cursor-pointer"
                    >
                      Reset 100% ×
                    </button>
                  </div>
                )}

                {/* 3. LAB NOTEBOOK & PRECAUTIONS SCRATCHPAD */}
                {activeRailTool.icon === 'note' && (
                  <div className="bg-[#121A2B]/95 border border-[#38BDF8]/50 rounded-xl p-3.5 shadow-lg space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#7DD3FC]">
                        LAB NOTEBOOK &amp; WAEC / NECO PRECAUTIONS PAD ({experimentTitle})
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedRailId('pointer')}
                        className="px-2 py-0.5 rounded bg-[#0B1220] text-[#93A0B8] hover:text-white text-[11px] cursor-pointer"
                      >
                        Hide notes ×
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={labNotesText}
                      onChange={(e) => setLabNotesText(e.target.value)}
                      placeholder="Record your experimental precautions, zero-error checks, and observations..."
                      className="w-full rounded-lg bg-[#0B1220] border border-[#22304A] p-2.5 text-xs font-mono text-[#E6EBF5] focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                )}

                {/* 4. DIGITAL SPLIT-LAP STOPWATCH & TIMING LOG */}
                {activeRailTool.icon === 'clock' && (
                  <div className="bg-[#121A2B]/95 border border-[#38BDF8]/50 rounded-xl p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] font-bold uppercase text-[#7DD3FC]">
                        AUXILIARY STOPWATCH
                      </span>
                      <span className="font-mono text-lg font-bold text-white bg-[#0B1220] px-3 py-1 rounded-lg border border-[#22304A]">
                        {(stopwatchMs / 1000).toFixed(2)} s
                      </span>
                      {stopwatchLaps.length > 0 && (
                        <span className="font-mono text-[11px] text-[#4ADE80]">
                          Laps ({stopwatchLaps.length}):{' '}
                          {stopwatchLaps.map((l) => `${(l / 1000).toFixed(2)}s`).join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStopwatchRunning((r) => !r)}
                        className="px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold cursor-pointer"
                      >
                        {stopwatchRunning ? 'Pause' : 'Start'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStopwatchLaps((prev) => [...prev.slice(-3), stopwatchMs])
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#0B1220] border border-[#22304A] text-[#C9D3E6] cursor-pointer"
                      >
                        Lap
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStopwatchRunning(false);
                          setStopwatchMs(0);
                          setStopwatchLaps([]);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#0B1220] border border-[#22304A] text-[#FCA5A5] cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRailId('pointer')}
                        className="px-2 py-1 rounded-lg bg-[#0B1220] text-[#93A0B8] hover:text-white cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. SAFETY / GLASSWARE / CALIBRATION INSPECTOR (alert, flask, gauge, wave, pen) */}
                {(activeRailTool.icon === 'alert' ||
                  activeRailTool.icon === 'flask' ||
                  activeRailTool.icon === 'gauge' ||
                  activeRailTool.icon === 'wave' ||
                  activeRailTool.icon === 'pen') && (
                  <div className="bg-[#121A2B]/95 border border-[#FDBA74]/50 rounded-xl px-3.5 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-mono font-bold uppercase text-[#FDBA74] mr-2">
                        {activeRailTool.label}:
                      </span>
                      <span className="text-[#C9D3E6]">
                        Apparatus zero-calibrated · Meniscus/scale read at eye level · PPE &amp; safety
                        checks verified ✓
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRailId('pointer')}
                      className="px-2.5 py-1 rounded bg-[#0B1220] text-[#93A0B8] hover:text-white cursor-pointer"
                    >
                      Close ×
                    </button>
                  </div>
                )}
              </div>
            )}

            <div
              className={`flex-1 flex flex-col justify-between transition-transform duration-300 ${
                isBenchZoomed ? 'scale-[1.12] origin-center' : ''
              }`}
            >
              {children}
            </div>
          </div>

          {bottomDock && (
            <div
              data-vix-id="instrument-dock"
              className={`bg-[#0B1220] border-t border-[#1E2A42] p-3 ${getRegionHighlightClass(
                'instrument-dock'
              )}`}
            >
              {bottomDock}
            </div>
          )}

          {logMessage && (
            <div
              data-vix-id="event-log"
              aria-live="polite"
              className={`bg-[#090E1A] border-t border-[#1E2A42] px-4 py-1.5 font-mono text-xs text-[#93A0B8] truncate ${getRegionHighlightClass(
                'event-log'
              )}`}
            >
              {logMessage}
            </div>
          )}
        </div>

        {/* Right Section: Data Panel */}
        {rightPanel && (
          <aside
            data-vix-id="data-panel"
            className={`w-full lg:w-[320px] xl:w-[340px] bg-[#0B1220] border-t lg:border-t-0 lg:border-l border-[#1E2A42] p-3.5 flex flex-col justify-between shrink-0 overflow-y-auto ${getRegionHighlightClass(
              'data-panel'
            )}`}
          >
            {rightPanel}
          </aside>
        )}
      </div>

      {/* In-Lab E1 Vix Connect Modal */}
      {vixMode === 'connect' && (
        <VixConnectModal
          experimentTitle={experimentTitle}
          onClose={() => setVixMode('closed')}
          onStartTour={(selectedVoice) => {
            setVixVoice(selectedVoice);
            setVixStepIdx(3); // Point at Bench first
            setVixMode('tour');
          }}
        />
      )}

      {/* In-Lab E2 Live Spotlight Tour Floating Card */}
      {vixMode === 'tour' && (
        <VixSpotlightFloatingCard
          activeLab={activeLab}
          experimentTitle={experimentTitle}
          voice={vixVoice}
          onChangeVoice={(v) => setVixVoice(v)}
          stepIdx={vixStepIdx}
          onSelectStep={(idx) => setVixStepIdx(idx)}
          dimNonActive={dimNonActive}
          onToggleDim={() => setDimNonActive((d) => !d)}
          onEndCall={() => setVixMode('closed')}
        />
      )}

      {/* Global Laboratory Bench Right-Click Context Menu */}
      {labContextMenu && (
        <div
          role="menu"
          aria-label="Laboratory bench context menu"
          style={{ left: labContextMenu.x, top: labContextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-60 rounded-xl bg-[#121A2B]/98 border border-[#38BDF8]/40 shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-md p-1.5 text-xs text-[#E6EBF5]"
        >
          <div className="px-2.5 py-1.5 border-b border-[#1E2A42] flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
              VIXIR LAB BENCH MENU
            </span>
            <span className="font-mono text-[10px] text-[#93A0B8] capitalize">
              {activeLab}
            </span>
          </div>

          <div className="py-1 space-y-0.5">
            {mode !== 'exam' && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setLabContextMenu(null);
                  setVixMode('connect');
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between text-[#FDBA74] font-semibold cursor-pointer"
              >
                <span>Call Vix AI Lab Guide</span>
                <span className="font-mono text-[10px]">Spotlight</span>
              </button>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setLabContextMenu(null);
                handleNext();
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between cursor-pointer"
            >
              <span>Plot Results &amp; Graph</span>
              <span className="font-mono text-[10px] text-[#93A0B8]">F1 →</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setLabContextMenu(null);
                navigate('/attempt/demo/submit');
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between cursor-pointer"
            >
              <span>Review &amp; Submit Practical</span>
              <span className="font-mono text-[10px] text-[#93A0B8]">F2</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setLabContextMenu(null);
                navigate('/apparatus');
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between cursor-pointer"
            >
              <span>Inspect Apparatus Encyclopedia</span>
              <span className="font-mono text-[10px] text-[#93A0B8]">123 items</span>
            </button>
          </div>

          {subExperiments.length > 1 && (
            <div className="pt-1 border-t border-[#1E2A42]">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#93A0B8]">
                Switch {activeLab} practical
              </div>
              {subExperiments.map((exp) => (
                <button
                  key={exp.to}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setLabContextMenu(null);
                    navigate(exp.to);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] text-[#C9D3E6] hover:text-white cursor-pointer"
                >
                  {exp.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
