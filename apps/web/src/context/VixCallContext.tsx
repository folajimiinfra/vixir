import React, { createContext, useContext, useState } from 'react';
import { useLocation } from 'react-router';
import { useAuth } from './AuthContext';
import {
  VixSpotlightFloatingCard,
  VIX_TOUR_STEPS,
  type VixTargetRegion,
} from '../lab-shell/VixInLabOverlay';
import type { SubjectLab } from '../lab-shell/LabLayout';

interface VixCallContextValue {
  isCallActive: boolean;
  voice: 'ada' | 'tunde' | 'grace';
  stepIdx: number;
  dimNonActive: boolean;
  activeRegionId: VixTargetRegion | null;
  openCall: () => void;
  endCall: () => void;
  toggleCall: () => void;
  setVoice: (v: 'ada' | 'tunde' | 'grace') => void;
  setStepIdx: (idx: number) => void;
  toggleDim: () => void;
}

const VixCallContext = createContext<VixCallContextValue | null>(null);

function derivePageContext(pathname: string): {
  activeLab: SubjectLab;
  pageTitle: string;
  isExamRoute: boolean;
  showFloatingLauncher: boolean;
} {
  const p = pathname.toLowerCase();
  if (p.includes('/exam/')) {
    return {
      activeLab: 'physics',
      pageTitle: 'Timed Practical Exam',
      isExamRoute: true,
      showFloatingLauncher: false,
    };
  }
  if (p.includes('/lab/physics/refraction')) {
    return { activeLab: 'physics', pageTitle: 'Refraction through a rectangular glass block', isExamRoute: false, showFloatingLauncher: false };
  }
  if (p.includes('/lab/physics/moments')) {
    return { activeLab: 'physics', pageTitle: 'Principle of moments (metre rule)', isExamRoute: false, showFloatingLauncher: false };
  }
  if (p.includes('/lab/physics/')) {
    return { activeLab: 'physics', pageTitle: 'Simple pendulum — determination of g', isExamRoute: false, showFloatingLauncher: false };
  }
  if (p.includes('/lab/chemistry/qualitative')) {
    return { activeLab: 'chemistry', pageTitle: 'Qualitative analysis of inorganic salts', isExamRoute: false, showFloatingLauncher: false };
  }
  if (p.includes('/lab/chemistry/')) {
    return { activeLab: 'chemistry', pageTitle: 'Acid–base titration: HCl vs Na₂CO₃', isExamRoute: false, showFloatingLauncher: false };
  }
  if (p.includes('/lab/electronics/')) {
    return { activeLab: 'electronics', pageTitle: "Verifying Ohm's law & circuit workbench", isExamRoute: false, showFloatingLauncher: false };
  }
  if (p.includes('/lab/engineering/isometric')) {
    return { activeLab: 'engineering', pageTitle: 'Isometric drawing — 30° CAD studio', isExamRoute: false, showFloatingLauncher: false };
  }
  if (p.includes('/lab/engineering/')) {
    return { activeLab: 'engineering', pageTitle: '3D Cantilever beam deflection — Young’s modulus E', isExamRoute: false, showFloatingLauncher: false };
  }
  if (p.startsWith('/apparatus')) {
    return { activeLab: 'physics', pageTitle: '123-Item Laboratory Apparatus Encyclopedia', isExamRoute: false, showFloatingLauncher: true };
  }
  if (p.startsWith('/labs')) {
    return { activeLab: 'physics', pageTitle: 'Laboratories Hub (Physics, Chemistry, Electronics, Engineering)', isExamRoute: false, showFloatingLauncher: true };
  }
  if (p.startsWith('/library') || p.startsWith('/experiments')) {
    return { activeLab: 'physics', pageTitle: 'Experiment Library & Practical Briefing', isExamRoute: false, showFloatingLauncher: true };
  }
  if (p.includes('/results')) {
    return { activeLab: 'physics', pageTitle: 'Results Table, OLS Best-Fit Graph & Precautions', isExamRoute: false, showFloatingLauncher: true };
  }
  if (p.includes('/submit')) {
    return { activeLab: 'physics', pageTitle: 'Review & Submit Practical Report', isExamRoute: false, showFloatingLauncher: true };
  }
  if (p.includes('/report')) {
    return { activeLab: 'physics', pageTitle: 'Lab Notebook & Marked Practical Report', isExamRoute: false, showFloatingLauncher: true };
  }
  if (p === '/app' || p.startsWith('/app/')) {
    return { activeLab: 'physics', pageTitle: 'Student Dashboard & Class Assignments', isExamRoute: false, showFloatingLauncher: true };
  }
  return {
    activeLab: 'physics',
    pageTitle: 'Vixir Virtual Science Laboratory',
    isExamRoute: false,
    showFloatingLauncher: false,
  };
}

export function VixCallProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [voice, setVoice] = useState<'ada' | 'tunde' | 'grace'>('ada');
  const [stepIdx, setStepIdx] = useState(3);
  const [dimNonActive, setDimNonActive] = useState(false);

  const pageCtx = derivePageContext(location.pathname);
  const activeRegionId =
    isCallActive && !pageCtx.isExamRoute
      ? (VIX_TOUR_STEPS[stepIdx]?.id ?? 'bench')
      : null;

  const openCall = () => {
    if (!pageCtx.isExamRoute) setIsCallActive(true);
  };
  const endCall = () => setIsCallActive(false);
  const toggleCall = () => {
    if (pageCtx.isExamRoute) return;
    setIsCallActive((prev) => !prev);
  };

  return (
    <VixCallContext.Provider
      value={{
        isCallActive: isCallActive && !pageCtx.isExamRoute,
        voice,
        stepIdx,
        dimNonActive,
        activeRegionId,
        openCall,
        endCall,
        toggleCall,
        setVoice,
        setStepIdx,
        toggleDim: () => setDimNonActive((d) => !d),
      }}
    >
      {children}

      {/* Persistent Global Vix Voice Companion — NEVER disconnects when navigating across pages or labs! */}
      {isCallActive && !pageCtx.isExamRoute && (
        <VixSpotlightFloatingCard
          activeLab={pageCtx.activeLab}
          experimentTitle={pageCtx.pageTitle}
          voice={voice}
          onChangeVoice={setVoice}
          stepIdx={stepIdx}
          onSelectStep={setStepIdx}
          dimNonActive={dimNonActive}
          onToggleDim={() => setDimNonActive((d) => !d)}
          onEndCall={endCall}
        />
      )}

      {/* Floating "Ask Vix" Launcher Pill on Student Website Pages (/app, /labs, /library, /apparatus, /attempt/*) */}
      {!isCallActive &&
        isAuthenticated &&
        !pageCtx.isExamRoute &&
        pageCtx.showFloatingLauncher && (
          <button
            type="button"
            onClick={openCall}
            aria-label="Call Vix for help anywhere on Vixir"
            className="fixed bottom-5 right-5 z-40 px-4 py-3 rounded-full bg-[#0B1220] hover:bg-[#121A2B] border border-[#F97316]/70 text-[#FDBA74] text-xs font-bold shadow-[0_12px_36px_rgba(0,0,0,0.45)] flex items-center gap-2.5 cursor-pointer transition-transform hover:scale-105"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] animate-pulse" />
            <span>Ask Vix for help</span>
          </button>
        )}
    </VixCallContext.Provider>
  );
}

export function useVixCall(): VixCallContextValue | null {
  return useContext(VixCallContext);
}
