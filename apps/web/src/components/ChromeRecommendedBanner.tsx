import { useState } from 'react';
import { X } from 'lucide-react';

const DISMISS_KEY = 'vixir_chrome_banner_dismissed';

/**
 * Detect whether the active browser is NOT Google Chrome.
 * Excludes Chromium derivatives (Edge, Opera, Brave, Samsung, Vivaldi, Yandex), Firefox, and Safari.
 * Skips headless JSDOM unless a non-JSDOM UA is explicitly supplied in tests.
 */
export function isNonChromeBrowser(userAgentOverride?: string): boolean {
  if (typeof navigator === 'undefined' && !userAgentOverride) return false;
  const ua = userAgentOverride ?? navigator.userAgent ?? '';
  if (!ua || /jsdom/i.test(ua)) return false;

  const isBrave =
    !userAgentOverride &&
    typeof navigator !== 'undefined' &&
    Boolean((navigator as unknown as { brave?: unknown }).brave);
  if (isBrave) return true;

  const hasChromeToken = /Chrome\/\d+/i.test(ua);
  const isOtherEngine = /(Edg\/|EdgA\/|OPR\/|Opera|Firefox\/|FxiOS|CriOS|SamsungBrowser|Vivaldi|YaBrowser)/i.test(
    ua
  );
  return !(hasChromeToken && !isOtherEngine);
}

export function ChromeRecommendedBanner({
  userAgentOverride,
}: {
  userAgentOverride?: string;
} = {}) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed || !isNonChromeBrowser(userAgentOverride)) {
    return null;
  }

  const handleClose = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore storage restrictions
    }
  };

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-[60] max-w-md flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#1C1917]/95 border border-[#F59E0B]/70 text-[#FDE68A] text-xs font-medium shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm"
    >
      <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
      <span>For the best experience on Vixir, please use Google Chrome.</span>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close Chrome recommendation"
        className="ml-1 p-1 rounded-full text-[#FCD34D] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
