import { ReactNode, useState } from 'react';
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

const LAB_TABS: { id: SubjectLab; label: string; to: string; activeClass: string }[] = [
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

  // In-Lab Vix state: 'closed' | 'connect' | 'tour'
  const [vixMode, setVixMode] = useState<'closed' | 'connect' | 'tour'>('closed');
  const [vixVoice, setVixVoice] = useState<'ada' | 'tunde' | 'grace'>('ada');
  const [vixStepIdx, setVixStepIdx] = useState(3); // Default to Bench
  const [dimNonActive, setDimNonActive] = useState(true);

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
      setVixMode('connect');
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
    <div className="min-h-screen bg-[#0B1220] text-[#E6EBF5] flex flex-col select-none relative">
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

        {/* Center: 5-Lab Pill Switcher */}
        <nav
          aria-label="Laboratory switcher"
          className="hidden xl:flex items-center bg-[#121A2B] border border-[#22304A] rounded-full p-1 gap-0.5"
        >
          {LAB_TABS.map((tab) => {
            const isActive = tab.id === activeLab;
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
          {toolRail && toolRail.length > 0 && (
            <aside
              data-vix-id="tool-rail"
              aria-label="Bench tools"
              className={`w-12 bg-[#0B1220] border-r border-[#1E2A42] py-3 flex flex-col items-center gap-2 shrink-0 ${getRegionHighlightClass(
                'tool-rail'
              )}`}
            >
              {toolRail.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  aria-label={tool.label}
                  title={tool.label}
                  onClick={tool.onClick}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                    tool.active
                      ? toolRailAccent
                      : 'text-[#93A0B8] hover:text-[#E6EBF5] hover:bg-[#121A2B]'
                  }`}
                >
                  {renderToolIcon(tool.icon)}
                </button>
              ))}
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
            className={`flex-1 relative flex flex-col justify-between p-4 min-h-[420px] ${
              dotGrid ? 'lab-dot-bg' : 'lab-grid-bg'
            } ${getRegionHighlightClass('bench')}`}
          >
            {children}
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
          stepIdx={vixStepIdx}
          onSelectStep={(idx) => setVixStepIdx(idx)}
          dimNonActive={dimNonActive}
          onToggleDim={() => setDimNonActive((d) => !d)}
          onEndCall={() => setVixMode('closed')}
        />
      )}
    </div>
  );
}
