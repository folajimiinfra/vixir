import { ReactNode, useState } from 'react';
import { Button } from '@vixir/ui';
import { ChevronRight, Phone, Menu } from 'lucide-react';
import { color } from '@vixir/ui';

interface LabLayoutProps {
  experimentTitle: string;
  mode: 'practice' | 'graded' | 'exam';
  attemptNumber: number;
  children: ReactNode;
  onCallVix?: () => void;
  onNextStep?: () => void;
  nextStepLabel?: string;
  nextStepDisabled?: boolean;
}

export function LabLayout({
  experimentTitle,
  mode,
  attemptNumber,
  children,
  onCallVix,
  onNextStep,
  nextStepLabel = 'Continue',
  nextStepDisabled = false,
}: LabLayoutProps) {
  const [activeTab, setActiveTab] = useState<'readings' | 'notebook' | 'assistant'>('readings');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showAssistant = mode === 'practice';
  const showCallVix = mode !== 'exam';

  return (
    <div className="flex flex-col h-screen bg-lab-bg font-body text-lab-text">
      {/* Header */}
      <header className="bg-lab-panel border-b border-lab-line px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-lab-muted" />
          </button>
          <div>
            <h1 className="font-heading text-lg font-semibold text-lab-text">{experimentTitle}</h1>
            <div className="flex items-center gap-3 text-sm text-lab-muted">
              <span className="capitalize font-medium">{mode}</span>
              <span>•</span>
              <span>Attempt {attemptNumber}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lab Switcher - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            <LabButton label="Physics" active />
            <LabButton label="Chemistry" />
            <LabButton label="Biology" />
            <LabButton label="Electronics" />
            <LabButton label="Engineering" />
          </div>

          {showCallVix && onCallVix && (
            <Button
              onClick={onCallVix}
              variant="outline"
              size="sm"
              className="gap-2 border-lab-line text-lab-text hover:bg-lab-panel"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Call Vix</span>
            </Button>
          )}

          {onNextStep && (
            <Button
              onClick={onNextStep}
              disabled={nextStepDisabled}
              size="sm"
              className="gap-2"
            >
              {nextStepLabel}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Lab Switcher */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-lab-panel border-b border-lab-line px-4 py-3 flex flex-wrap gap-2">
          <LabButton label="Physics" active />
          <LabButton label="Chemistry" />
          <LabButton label="Biology" />
          <LabButton label="Electronics" />
          <LabButton label="Engineering" />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Bench Area (Left/Top) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-lab-bg">
          {/* Apparatus Tray & Tool Rail */}
          <div className="bg-lab-raised border-b border-lab-line p-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-medium text-lab-muted whitespace-nowrap">Apparatus:</span>
            {/* Apparatus items rendered by children */}
          </div>

          {/* Bench & Instrument Dock */}
          <div className="flex-1 overflow-auto p-4">
            {children}
          </div>

          {/* Event Log Strip */}
          <div className="bg-lab-bg border-t border-lab-line px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-lab-muted">
              <span className="font-medium">Last action:</span>
              <span>No events yet</span>
            </div>
          </div>
        </div>

        {/* Data Panel (Right/Bottom) */}
        <aside className="w-full lg:w-96 bg-lab-panel border-t lg:border-t-0 lg:border-l border-lab-line flex flex-col shadow-lg">
          {/* Tabs */}
          <div className="flex border-b border-lab-line">
            <TabButton
              label="Readings"
              active={activeTab === 'readings'}
              onClick={() => setActiveTab('readings')}
            />
            <TabButton
              label="Notebook"
              active={activeTab === 'notebook'}
              onClick={() => setActiveTab('notebook')}
            />
            {showAssistant && (
              <TabButton
                label="Assistant"
                active={activeTab === 'assistant'}
                onClick={() => setActiveTab('assistant')}
              />
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === 'readings' && (
              <div className="space-y-2">
                <p className="text-sm text-lab-muted">No readings recorded yet.</p>
              </div>
            )}
            {activeTab === 'notebook' && (
              <div className="space-y-2">
                <p className="text-sm text-lab-muted">Your notes will appear here.</p>
              </div>
            )}
            {activeTab === 'assistant' && showAssistant && (
              <div className="space-y-2">
                <p className="text-sm text-lab-muted">
                  Assistant hints will appear here as you work through the experiment.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function LabButton({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
        active
          ? 'bg-blue-500/20 text-blue-300'
          : 'text-lab-muted hover:bg-lab-line hover:text-lab-text'
      }`}
    >
      {label}
    </button>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'text-blue-300 border-b-2 border-blue-500'
          : 'text-lab-muted hover:text-lab-text hover:bg-lab-bg'
      }`}
    >
      {label}
    </button>
  );
}
