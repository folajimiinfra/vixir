import { ReactNode, useState } from 'react';
import { Button } from '@vixir/ui';
import { ChevronRight, Phone, Menu } from 'lucide-react';

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
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">{experimentTitle}</h1>
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span className="capitalize">{mode}</span>
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
              className="gap-2"
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
        <div className="lg:hidden bg-white border-b border-neutral-200 px-4 py-3 flex flex-wrap gap-2">
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Apparatus Tray & Tool Rail */}
          <div className="bg-neutral-100 border-b border-neutral-200 p-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-medium text-neutral-600 whitespace-nowrap">Apparatus:</span>
            {/* Apparatus items rendered by children */}
          </div>

          {/* Bench & Instrument Dock */}
          <div className="flex-1 overflow-auto p-4">
            {children}
          </div>

          {/* Event Log Strip */}
          <div className="bg-neutral-50 border-t border-neutral-200 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span className="font-medium">Last action:</span>
              <span>No events yet</span>
            </div>
          </div>
        </div>

        {/* Data Panel (Right/Bottom) */}
        <aside className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-neutral-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-neutral-200">
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
                <p className="text-sm text-neutral-600">No readings recorded yet.</p>
              </div>
            )}
            {activeTab === 'notebook' && (
              <div className="space-y-2">
                <p className="text-sm text-neutral-600">Your notes will appear here.</p>
              </div>
            )}
            {activeTab === 'assistant' && showAssistant && (
              <div className="space-y-2">
                <p className="text-sm text-neutral-600">
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
          ? 'bg-blue-100 text-blue-900'
          : 'text-neutral-600 hover:bg-neutral-100'
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
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
      }`}
    >
      {label}
    </button>
  );
}
