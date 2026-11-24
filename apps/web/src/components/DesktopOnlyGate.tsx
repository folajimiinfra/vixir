import React, { useEffect, useState } from 'react';

const MIN_DESKTOP_WIDTH = 1024;
const MIN_SHORT_EDGE = 540;
const MOBILE_PHONE_UA_RE =
  /(android.*mobile|iphone|ipod|blackberry|iemobile|opera mini|windows phone|mobile safari)/i;

/**
 * Detect mobile phones or small viewports in BOTH portrait and rotated landscape orientations.
 * Ensures practical workbenches and assessments only render on desktop/laptop screens.
 */
export function isBlockedSmallOrPhoneDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  if (MOBILE_PHONE_UA_RE.test(ua)) {
    return true;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (vw > 0 && vw < MIN_DESKTOP_WIDTH) {
    return true;
  }
  if (vw > 0 && vh > 0 && Math.min(vw, vh) < MIN_SHORT_EDGE) {
    return true;
  }

  // Catch phones in landscape or "Request Desktop Site" mode via coarse touch pointer + small physical screen short edge
  const hasCoarsePointer =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const screenMin =
    typeof window.screen !== 'undefined'
      ? Math.min(window.screen.width || 0, window.screen.height || 0)
      : 0;
  if (hasCoarsePointer && screenMin > 0 && screenMin < 600) {
    return true;
  }

  return false;
}

export function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState<boolean>(() => isBlockedSmallOrPhoneDevice());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const evaluate = () => setBlocked(isBlockedSmallOrPhoneDevice());
    evaluate();
    window.addEventListener('resize', evaluate, { passive: true });
    window.addEventListener('orientationchange', evaluate, { passive: true });
    return () => {
      window.removeEventListener('resize', evaluate);
      window.removeEventListener('orientationchange', evaluate);
    };
  }, []);

  if (blocked) {
    return (
      <main
        role="alert"
        className="fixed inset-0 z-[9999] bg-white text-[#111827] flex items-center justify-center p-6 text-center select-none"
      >
        <p className="text-base font-medium tracking-tight">
          Please use your computer to view this page.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
