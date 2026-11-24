import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Mic, X, Sparkles, Eye, Cpu, Crosshair } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLabSessionStore } from '../store/labSessionStore';
import type { SubjectLab } from './LabLayout';

export type VixTargetRegion =
  | 'top-bar'
  | 'tool-rail'
  | 'apparatus-tray'
  | 'bench'
  | 'instrument-dock'
  | 'event-log'
  | 'data-panel';

export type VixLanguage = 'English' | 'Pidgin' | 'Yoruba' | 'Hausa' | 'Igbo';

export interface VixPointerTarget {
  x: number;
  y: number;
  regionId: VixTargetRegion | null;
  elementId: string | null;
  tag: string;
  label: string;
  value: string | null;
  textSnippet: string | null;
  svgPart: string | null;
  bbox: [number, number, number, number];
}

export const VIX_BRAIN_OPTIONS = [
  { id: 'gemini/gemini-3.1-flash-live-preview', label: 'Gemini 3.1 Flash Live (Realtime Audio)' },
  { id: 'gemini/gemini-3.8-flash', label: 'Gemini 3.8 Flash (Google)' },
  { id: 'gemini/gemini-4-argon', label: 'Gemini 4 Argon (Google)' },
  { id: 'anthropic/claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet (Anthropic)' },
  { id: 'openai/gpt-4o', label: 'GPT-4o (OpenAI)' },
  { id: 'groq/llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq)' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3 (DeepSeek)' },
  { id: 'mistral/mistral-large-latest', label: 'Mistral Large (Mistral)' },
] as const;

const VIX_AGENT_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_VIX_AGENT_URL ||
  'http://localhost:8090';

// =============================================================================
// Real-Time Synchronized Neural Audio + Word-by-Word Live Typewriter Engine
// (Talking and typing happen simultaneously at the exact same moment!)
// =============================================================================

let activeNeuralAudio: HTMLAudioElement | null = null;
let lastAudioEndedAt = 0;
let activeTypewriterTimer: number | null = null;
let audioGenerationSeq = 0;
const neuralAudioCache = new Map<string, string>();
const speakingListeners = new Set<(speaking: boolean) => void>();

function notifySpeakingState(speaking: boolean) {
  for (const listener of speakingListeners) {
    listener(speaking);
  }
}

export function subscribeVixSpeaking(fn: (speaking: boolean) => void): () => void {
  speakingListeners.add(fn);
  return () => {
    speakingListeners.delete(fn);
  };
}

function clearTypewriterTimer() {
  if (activeTypewriterTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(activeTypewriterTimer);
    activeTypewriterTimer = null;
  }
}

/** Immediately cancel any active or queued Vix speech (natural voice barge-in). */
export function stopVixNeuralAudio() {
  audioGenerationSeq += 1;
  clearTypewriterTimer();
  if (activeNeuralAudio) {
    try {
      activeNeuralAudio.pause();
      activeNeuralAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeNeuralAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  notifySpeakingState(false);
}

async function fetchSentenceAudioDataUri(
  sentence: string,
  voice: 'ada' | 'tunde' | 'grace',
  locale: string
): Promise<string | null> {
  const cleaned = sentence.trim();
  if (!cleaned) return null;
  const cacheKey = `${voice}::${locale}::${cleaned}`;
  const cached = neuralAudioCache.get(cacheKey);
  if (cached) return cached;

  const resp = await fetch(`${VIX_AGENT_URL}/vix/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: cleaned, voice, locale }),
  });
  if (!resp.ok) return null;
  const payload = await resp.json();
  if (!payload?.audio) return null;
  const uri = `data:${payload.mimeType || 'audio/wav'};base64,${payload.audio}`;
  neuralAudioCache.set(cacheKey, uri);
  return uri;
}

/**
 * Plays a single sentence WAV and drives `onProgressText(partialSentence)` word-by-word
 * in lockstep with `audio.currentTime / audio.duration` so Vix talks and types at the exact same time!
 */
function playSingleDataUriWithLiveTyping(
  dataUri: string,
  sentenceText: string,
  prefixText: string,
  expectedGen: number,
  onProgressText?: (liveText: string) => void
): Promise<boolean> {
  return new Promise((resolve) => {
    if (audioGenerationSeq !== expectedGen || typeof Audio === 'undefined') {
      resolve(false);
      return;
    }

    const words = sentenceText.trim().split(/\s+/).filter(Boolean);
    const audio = new Audio(dataUri);
    activeNeuralAudio = audio;

    const finish = (ok: boolean) => {
      clearTypewriterTimer();
      if (audioGenerationSeq === expectedGen && onProgressText) {
        const fullSoFar = prefixText ? `${prefixText} ${sentenceText}` : sentenceText;
        onProgressText(fullSoFar);
      }
      if (activeNeuralAudio === audio) {
        activeNeuralAudio = null;
        lastAudioEndedAt = performance.now();
      }
      resolve(ok);
    };

    audio.onplay = () => {
      if (audioGenerationSeq !== expectedGen) return;
      notifySpeakingState(true);
      if (!onProgressText || words.length === 0) return;

      // Reveal first word immediately when audio starts playing
      const firstWord = prefixText ? `${prefixText} ${words[0]}` : words[0]!;
      onProgressText(firstWord);

      clearTypewriterTimer();
      const startTime = performance.now();
      activeTypewriterTimer = window.setInterval(() => {
        if (audioGenerationSeq !== expectedGen) {
          clearTypewriterTimer();
          return;
        }
        const dur =
          Number.isFinite(audio.duration) && audio.duration > 0.2
            ? audio.duration
            : Math.max(1.5, words.length * 0.34);
        const cur =
          audio.currentTime > 0
            ? audio.currentTime
            : (performance.now() - startTime) / 1000;
        const frac = Math.min(1, Math.max(0.05, cur / dur));
        const wordCount = Math.max(1, Math.ceil(frac * words.length));
        const partial = words.slice(0, wordCount).join(' ');
        onProgressText(prefixText ? `${prefixText} ${partial}` : partial);
      }, 55);
    };

    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    audio.play().catch(() => finish(false));
  });
}

/**
 * Plays inline base64 WAV audio returned directly inside /vix/session/start, /vix/turn, or /vix/voice-turn
 * (0 ms extra network fetch!) while revealing words in real time. Falls back to /vix/tts if audio is omitted.
 */
export async function playVixNeuralAudio(
  text: string,
  voice: 'ada' | 'tunde' | 'grace' = 'ada',
  locale: string = 'English',
  _preSplitSentences?: string[],
  onLiveTextUpdate?: (typedSoFar: string) => void,
  inlineAudio?: { audio: string; mimeType?: string } | null
): Promise<boolean> {
  const cleaned = text.trim();
  if (!cleaned || typeof window === 'undefined' || typeof Audio === 'undefined') {
    onLiveTextUpdate?.(cleaned);
    return false;
  }

  stopVixNeuralAudio();
  const myGen = audioGenerationSeq;

  let uri: string | null = null;
  if (inlineAudio?.audio) {
    uri = `data:${inlineAudio.mimeType || 'audio/wav'};base64,${inlineAudio.audio}`;
    neuralAudioCache.set(`${voice}::${locale}::${cleaned}`, uri);
  } else {
    uri = await fetchSentenceAudioDataUri(cleaned, voice, locale).catch(() => null);
  }
  if (audioGenerationSeq !== myGen) return false;

  if (!uri) {
    onLiveTextUpdate?.(cleaned);
    notifySpeakingState(false);
    return false;
  }

  const ok = await playSingleDataUriWithLiveTyping(
    uri,
    cleaned,
    '',
    myGen,
    onLiveTextUpdate
  );

  if (audioGenerationSeq === myGen) {
    onLiveTextUpdate?.(cleaned);
    notifySpeakingState(false);
  }
  return ok;
}

// =============================================================================
// Deep DOM & SVG Hit-Test Inspector ("Point Anywhere on Screen")
// =============================================================================

export function inspectDomElementAt(clientX: number, clientY: number): VixPointerTarget | null {
  if (typeof document === 'undefined') return null;
  const rawEl = document.elementFromPoint(clientX, clientY);
  if (!rawEl) return null;

  // Ignore clicks inside the Vix floating card or Vix modal itself
  if (rawEl.closest('[aria-label="Vix live in-lab guide"]') || rawEl.closest('[role="dialog"]')) {
    return null;
  }

  // 1. First priority: any explicit [data-vix-element] annotation on a circuit node, terminal pin, wire, organ, or apparatus
  const explicitVixEl = rawEl.closest('[data-vix-element]');
  const explicitDesc = explicitVixEl?.getAttribute('data-vix-element') || '';

  // 2. Nearest interactive or labelled DOM/SVG element
  const focusEl =
    explicitVixEl ||
    rawEl.closest('button, input, select, textarea, a, label, tr, [aria-label], [title], g') ||
    rawEl;

  const regionEl = rawEl.closest('[data-vix-id]');
  const regionId = (regionEl?.getAttribute('data-vix-id') as VixTargetRegion | null) || null;

  const rect = focusEl.getBoundingClientRect();
  const bbox: [number, number, number, number] = [
    Math.round(rect.left),
    Math.round(rect.top),
    Math.max(18, Math.round(rect.width)),
    Math.max(18, Math.round(rect.height)),
  ];

  const tag = focusEl.tagName.toLowerCase();

  const ariaLabel =
    explicitDesc ||
    focusEl.getAttribute('aria-label') ||
    focusEl.getAttribute('title') ||
    rawEl.getAttribute('aria-label') ||
    rawEl.getAttribute('title') ||
    '';

  let value: string | null = null;
  if (focusEl instanceof HTMLInputElement || focusEl instanceof HTMLSelectElement) {
    value = focusEl.value;
  }

  // Extract SVG group text labels if present
  let svgPart: string | null = explicitDesc || null;
  if (!svgPart) {
    const svgGroup = rawEl.closest('g');
    if (svgGroup) {
      const groupAttr = svgGroup.getAttribute('data-vix-element');
      if (groupAttr) {
        svgPart = groupAttr;
      } else {
        const svgTexts = Array.from(svgGroup.querySelectorAll('text'))
          .map((t) => (t.textContent || '').trim())
          .filter(Boolean);
        if (svgTexts.length > 0) {
          svgPart = svgTexts.slice(0, 4).join(' · ');
        }
      }
    }
  }

  const rawText = ((focusEl as HTMLElement).innerText || focusEl.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
  const textSnippet = (explicitDesc || rawText).slice(0, 110) || null;

  const label =
    explicitDesc ||
    ariaLabel ||
    svgPart ||
    (rawText.length > 0 && rawText.length <= 65 ? rawText : '') ||
    (regionId ? `${tag} in ${regionId}` : tag);

  return {
    x: Math.round(clientX),
    y: Math.round(clientY),
    regionId,
    elementId: regionId ? `${regionId}.${tag}` : tag,
    tag,
    label: label.slice(0, 100),
    value,
    textSnippet,
    svgPart,
    bbox,
  };
}

// =============================================================================
// Comprehensive, Fine-Grained 7-Region Tour Explanations per Lab
// =============================================================================

interface TourStepConfig {
  id: VixTargetRegion;
  chip: string;
  heading: string;
  getCaption: (lab: SubjectLab, title: string, lang: VixLanguage) => string;
}

const DETAILED_TOUR_CAPTIONS: Record<
  VixTargetRegion,
  Record<SubjectLab, string>
> = {
  'top-bar': {
    physics:
      'At the top bar you see your active practical title, the 5-discipline lab switcher (Physics, Chemistry, Biology, Electronics, Engineering), the Vix status button, and the Plot T² vs L button to move to your graph sheet once your table is complete.',
    chemistry:
      'At the top bar you see your titration or qualitative salt practical title, the 5-discipline lab switcher, the Vix guide toggle, and the Analyse Titre button for your stoichiometric calculations.',
    biology:
      'At the top bar you can switch between Enzymatic Digestion, Mammalian Dissection, the 6-System Human Anatomy Atlas, and Biochemical Food Tests, or move to your practical report.',
    electronics:
      "At the top bar you see Verifying Ohm's Law, the 5-discipline lab switcher, the Schematic versus 3D Bench view toggle, the Vix live status pill, and the Plot V–I button to analyse your resistance graph.",
    engineering:
      'At the top bar you see your 3D Cantilever Beam Deflection practical title, the 5-discipline lab switcher, the Vix toggle, and the Plot F vs δ button to compute Young’s Modulus.',
  },
  'tool-rail': {
    physics:
      'The far-left tool rail contains 5 interactive bench instruments: Pointer (V) for direct manipulation, Precision Ruler (M) with ±0.05 cm vernier cursor, Optical Magnifier Loupe (Z) for zero-parallax viewing, your WAEC/NECO Lab Notebook (N), and the Auxiliary Split-Lap Stopwatch (T).',
    chemistry:
      'The far-left tool rail gives you 5 bench tools: Pointer (V), Meniscus Scale Ruler (M), ×8 Eye-Level Magnifier Loupe (Z) to read the bottom of the concave meniscus without parallax, your Lab Notebook (N), and a Reaction Stopwatch (T).',
    biology:
      'The far-left tool rail provides 5 biological tools: Pointer (V) to select organs or tubes, Millimetre Caliper Ruler (M), ×1.20 Magnifying Lens (Z), your Dissection & Observation Notebook (N), and an Incubation Timer (T).',
    electronics:
      'The far-left tool rail gives you 5 circuit workbench tools: Pointer (V) to drag components, Precision Wire Scale (M), Schematic Magnifier Loupe (Z), your Circuit Precautions Notebook (N), and a Heating Timer (T).',
    engineering:
      'The far-left tool rail provides 5 structural testing tools: Pointer (V) to orbit the 3D rig, Span Ruler (M), Dial Gauge Magnifier (Z), your Engineering Notebook (N), and a Loading Timer (T).',
  },
  'apparatus-tray': {
    physics:
      'The left apparatus tray lists every instrument on your bench—the cast-iron retort stand, split cork, inextensible thread, spherical brass bob, metre rule (±0.5 mm), and 0.01 s digital stopwatch—along with your deterministic simulation seed.',
    chemistry:
      'The left apparatus tray lists your 50.00 cm³ Class A burette (±0.05 cm³), 25.0 cm³ bulb pipette, 250 cm³ conical flask, white porcelain tile, and acid-base indicators (methyl orange and phenolphthalein).',
    biology:
      'The left tray controls your specimen layers, physiological states, dissecting kit instruments (T-pins, surgical scalpel, blunt-sharp scissors, ×10 hand lens, blunt seeker), and water-bath temperature.',
    electronics:
      'The left tray has 4 Workbench Mode buttons (Move/Edit, Wire Pins, Scope Probe, Calibrate), the 6 core circuit components (3.0 V dry cells E, plug key K, 0–20 Ω sliding rheostat Rh, 0–1 A ammeter A, 0–3 V voltmeter V, test wire X), extra add-on parts (+Resistor 5Ω, +Si Diode, +Green LED, +100µF Cap), and Wire X alloy (Nichrome, Constantan, Copper) and length L (20–120 cm) controls.',
    engineering:
      'The left tray lets you select the beam alloy (Structural Steel, Aluminium 6061, Brass), adjust cantilever span L, width b, and thickness d, and add slotted masses to the free-end hanger.',
  },
  bench: {
    physics:
      'This center canvas is your live pendulum bench. The brass bob hangs from the split cork on the retort stand beside the vertical metre rule. Displace the bob by a small angle under 10 degrees and count 20 complete oscillations past the vertical fiducial mark.',
    chemistry:
      'This center canvas is your titration bench. The clamped burette delivers acid into the conical flask resting on a white porcelain tile while the magnified meniscus window lets you read volume to 0.05 cm³ at eye level.',
    biology:
      'This center stage displays your high-detail anatomical specimen with clickable horizontal leader-line callouts, view-mode switchers, and quiz mode.',
    electronics:
      'This center dot-grid canvas is your interactive circuit builder. It shows the DC battery E on the left, sliding rheostat Rh (with draggable cyan wiper arrow) and series ammeter A along the top, test resistance wire X with parallel voltmeter V on the right, and plug switch key K at the bottom. Every component has glowing teal Terminal Pins A and B that you can click or drag to wire, plus Rotate, Delete, Reset, and centered Zoom controls.',
    engineering:
      'This center viewport renders your 3D cantilever beam rig with real-time von Mises bending stress colours, rigid wall clamp, free-end slotted weight hanger, and plunger dial indicator.',
  },
  'instrument-dock': {
    physics:
      'The bottom instrument dock houses yourLength L slider (30–100 cm), release angle θ₀ control, the 0.01 s digital stopwatch (Start, Stop, Reset), and the Record trial button.',
    chemistry:
      'The bottom instrument dock provides the burette stopcock flow buttons (Fast stream, Slow drop, Single 0.05 cm³ drop), flask swirl toggle, Refill to 0.00 cm³ button, and Record titre button.',
    biology:
      'The bottom dock walks you sequentially through the practical stages—from pinning the specimen and making the midline incision to unfurling the mesentery and checking biological drawing rules.',
    electronics:
      'The bottom instrument dock displays two large analogue moving-coil dial meters—the 0–1 A Series Ammeter on the left and the 0–3 V Parallel Voltmeter in the middle—alongside the Rheostat slider Rh (0–20 Ω), DC Supply EMF slider E (1.5–6.0 V), the Open/Close Key (K) button, and the blue Record V and I button.',
    engineering:
      'The bottom instrument dock shows the magnified 0.01 mm dial test indicator face, the Zero Bezel button, the Tap Bench button (to release plunger stiction), and the Record Deflection button.',
  },
  'event-log': {
    physics:
      'This bottom event log strip timestamps every length change, release angle, and recorded oscillation time so your practical procedure can be reviewed step by step.',
    chemistry:
      'This bottom event log strip records every burette refill, drop addition, indicator colour transition, and recorded titre volume.',
    biology:
      'This bottom log strip tracks each dissection stage, organ inspection, and reagent test observation.',
    electronics:
      'This bottom event log strip records every component added, terminal wire connected, rheostat wiper adjustment, key toggle, and V–I reading in real time.',
    engineering:
      'This bottom event log strip timestamps every load increment, dial gauge zeroing, and recorded tip deflection.',
  },
  'data-panel': {
    physics:
      'The right data panel holds your recorded table of S/N, Length L (cm), t₁ (s), t₂ (s), Mean t (s), Period T (s), and T² (s²), plus your live T² vs L regression plot and Socratic lab assistant prompt.',
    chemistry:
      'The right data panel holds your WAEC titration table (Rough, Titre I, Titre II, Titre III with Initial, Final, and Volume of Acid used to 2 decimal places) and concordant average check.',
    biology:
      'The right inspector panel displays anatomical and physiological details, magnified Alveolar O₂/CO₂ and Nephron ADH osmoregulation insets, live Lead II P-QRS-T ECG, and exam key facts.',
    electronics:
      'The right data panel contains your Readings table (S/N, Rh/Ω, I/A, V/V, and calculated resistance ratio V/I), the Live V-against-I linear regression graph showing slope in Ω and power P in mW, the live Wire X temperature monitor (°C) warning you if Joule heating occurs, and the Socratic Lab Assistant card.',
    engineering:
      'The right data panel contains your Load F (N) vs Deflection δ (mm) table, linear elastic compliance plot, and computed Young’s Modulus E in GPa.',
  },
};

export const VIX_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'top-bar',
    chip: 'Top bar',
    heading: 'POINTING AT · TOP BAR',
    getCaption: (lab) => DETAILED_TOUR_CAPTIONS['top-bar'][lab],
  },
  {
    id: 'tool-rail',
    chip: 'Tools',
    heading: 'POINTING AT · BENCH TOOLS',
    getCaption: (lab) => DETAILED_TOUR_CAPTIONS['tool-rail'][lab],
  },
  {
    id: 'apparatus-tray',
    chip: 'Apparatus',
    heading: 'POINTING AT · APPARATUS TRAY',
    getCaption: (lab) => DETAILED_TOUR_CAPTIONS['apparatus-tray'][lab],
  },
  {
    id: 'bench',
    chip: 'Bench',
    heading: 'POINTING AT · LAB BENCH',
    getCaption: (lab) => DETAILED_TOUR_CAPTIONS.bench[lab],
  },
  {
    id: 'instrument-dock',
    chip: 'Instruments',
    heading: 'POINTING AT · INSTRUMENT DOCK',
    getCaption: (lab) => DETAILED_TOUR_CAPTIONS['instrument-dock'][lab],
  },
  {
    id: 'event-log',
    chip: 'Log',
    heading: 'POINTING AT · EVENT LOG',
    getCaption: (lab) => DETAILED_TOUR_CAPTIONS['event-log'][lab],
  },
  {
    id: 'data-panel',
    chip: 'Data',
    heading: 'POINTING AT · DATA PANEL',
    getCaption: (lab) => DETAILED_TOUR_CAPTIONS['data-panel'][lab],
  },
];

/** Build a live contracts.md §4 ScreenMap from the current DOM `[data-vix-id]` elements + active PointerTarget. */
export function collectLiveDomScreenMap(
  activeLab: SubjectLab,
  experimentTitle: string,
  mode: 'PRACTICE' | 'GRADED' = 'PRACTICE',
  pointerTarget: VixPointerTarget | null = null
) {
  const regionConfigs: {
    id: VixTargetRegion;
    label: string;
    kind: 'panel' | 'instrument' | 'control' | 'apparatus' | 'chart' | 'table';
  }[] = [
    { id: 'top-bar', label: 'Top lab header bar', kind: 'panel' },
    { id: 'tool-rail', label: 'Left bench tool rail', kind: 'control' },
    { id: 'apparatus-tray', label: 'Apparatus tray & parameters', kind: 'apparatus' },
    { id: 'bench', label: `${activeLab} interactive lab bench`, kind: 'panel' },
    { id: 'instrument-dock', label: 'Bottom instrument control dock', kind: 'instrument' },
    { id: 'event-log', label: 'Timestamped practical event log', kind: 'panel' },
    { id: 'data-panel', label: 'Readings table & live plot panel', kind: 'table' },
  ];

  const regions = regionConfigs.map((cfg) => {
    const el =
      typeof document !== 'undefined'
        ? document.querySelector(`[data-vix-id="${cfg.id}"]`)
        : null;
    const rect = el ? el.getBoundingClientRect() : null;
    const rawText = el ? (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140) : '';
    const summary =
      mode === 'GRADED' ? rawText.replace(/-?\d+(?:\.\d+)?/g, '[redacted]') : rawText;

    return {
      id: cfg.id,
      label: cfg.label,
      kind: cfg.kind,
      bbox: rect
        ? [
            Math.round(rect.left),
            Math.round(rect.top),
            Math.max(10, Math.round(rect.width)),
            Math.max(10, Math.round(rect.height)),
          ]
        : [0, 0, 300, 200],
      visible: rect ? rect.width > 0 && rect.height > 0 : true,
      summary: summary || `${cfg.label} for ${experimentTitle}`,
    };
  });

  const screenCodeMap: Record<SubjectLab, string> = {
    physics: 'D1',
    chemistry: 'D2',
    biology: 'D4',
    electronics: 'D6',
    engineering: 'D7',
  };

  // Compute REAL live readingsCount & recorded parameters from Zustand store and live DOM (NEVER hardcoded!)
  const routePath =
    typeof window !== 'undefined' ? window.location.pathname : `/lab/${activeLab}`;
  let liveReadingsCount = 0;
  let recordedSummary: string[] = [];

  if (activeLab === 'physics' && routePath.includes('pendulum')) {
    const storeRows = useLabSessionStore.getState().pendulumRows;
    liveReadingsCount = storeRows.length;
    recordedSummary = storeRows.map((r) => `${(r.lengthM * 100).toFixed(1)}cm`);
  } else if (typeof document !== 'undefined') {
    const dataPanelEl = document.querySelector('[data-vix-id="data-panel"]');
    const panelText = dataPanelEl?.textContent || '';
    const countMatch = panelText.match(/Readings\s*\((\d+)\)/i);
    if (countMatch) {
      liveReadingsCount = Number(countMatch[1]);
    } else if (dataPanelEl) {
      liveReadingsCount = dataPanelEl.querySelectorAll('tbody tr').length;
    }
  }

  return {
    v: 1 as const,
    screen: screenCodeMap[activeLab] || 'D1',
    route: routePath,
    mode,
    experiment: {
      id: `${activeLab}.practical`,
      title: experimentTitle,
      step: liveReadingsCount >= 5 ? 'GRAPH' : liveReadingsCount > 0 ? 'READINGS' : 'SETUP',
    },
    viewport: {
      w: typeof window !== 'undefined' ? window.innerWidth : 1440,
      h: typeof window !== 'undefined' ? window.innerHeight : 900,
    },
    regions,
    pointerTarget,
    sim: {
      released: true,
      warnings: [],
      readingsCount: liveReadingsCount,
      readingsTarget: 6,
      recordedLengths: recordedSummary,
    },
    lastEvents: [],
  };
}

interface VixConnectModalProps {
  experimentTitle: string;
  onClose: () => void;
  onStartTour: (voice: 'ada' | 'tunde' | 'grace') => void;
}

export function VixConnectModal({
  experimentTitle,
  onClose,
  onStartTour,
}: VixConnectModalProps) {
  const { user } = useAuth();
  const studentFirstName = user?.firstName || 'Student';
  const [micOn, setMicOn] = useState(true);
  const [screenOn, setScreenOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [voice, setVoice] = useState<'ada' | 'tunde' | 'grace'>('ada');
  const [brain, setBrain] = useState<string>('gemini/gemini-3.8-flash');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [liveTypedGreeting, setLiveTypedGreeting] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch(`${VIX_AGENT_URL}/health`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('offline'))))
      .then((data) => {
        if (!cancelled) {
          setAgentStatus('online');
          if (data?.defaultBrain) setBrain(data.defaultBrain);
        }
      })
      .catch(() => {
        if (!cancelled) setAgentStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * When the student selects a voice (Ada, Tunde, or Grace) or clicks Connect Vix to bench,
   * Vix introduces itself, explains what it will and cannot do, and asks if they want a full tour
   * while speaking and typing simultaneously in real time!
   */
  const triggerVoiceSelfIntroduction = async (selectedVoice: 'ada' | 'tunde' | 'grace') => {
    setVoice(selectedVoice);
    setConnected(true);
    setConnecting(true);
    setLiveTypedGreeting('Vix is preparing voice...');

    try {
      const resp = await fetch(`${VIX_AGENT_URL}/vix/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: studentFirstName,
          mode: 'PRACTICE',
          locale: 'en',
          voice: selectedVoice,
          brain,
          experimentTitle,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (typeof window !== 'undefined' && data.sessionId) {
          window.sessionStorage.setItem('vix_session_id', data.sessionId);
          window.sessionStorage.setItem('vix_brain', brain);
        }
        if (data.greeting) {
          setConnecting(false);
          // Speak and type word-for-word at the exact same time!
          await playVixNeuralAudio(
            data.greeting,
            selectedVoice,
            'English',
            data.sentences,
            (partialText) => {
              setLiveTypedGreeting(partialText);
            }
          );
          return;
        }
      }
    } catch {
      // Fallback self-introduction if server is offline
    }

    const personaName =
      selectedVoice === 'tunde' ? 'Tunde' : selectedVoice === 'grace' ? 'Grace' : 'Ada';
    const fallbackIntro = `Hello ${studentFirstName}! I am Vix, speaking in ${personaName}'s voice as your AI laboratory guide for ${experimentTitle}. I can see every component, terminal pin, meter, and slider on your screen, help you draw or wire setups, and guide you with Socratic questions—though I will never give away final graded answers or submit your report for you. Would you like me to take you on a complete spotlight tour of every detail on this workspace?`;
    setConnecting(false);
    await playVixNeuralAudio(
      fallbackIntro,
      selectedVoice,
      'English',
      undefined,
      (partialText) => {
        setLiveTypedGreeting(partialText);
      }
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connect to Vix lab guide"
      className="fixed inset-0 z-50 bg-[#070B14]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="max-w-[920px] w-full bg-[#0B1220] border border-[#1E2A42] rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-[0_32px_64px_rgba(0,0,0,0.75)] relative">
        <button
          type="button"
          aria-label="Close Vix modal"
          onClick={() => {
            stopVixNeuralAudio();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] flex items-center justify-center text-[#93A0B8] hover:text-white cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Orb & Live Synchronized Speech + Typing Introduction */}
        <div className="md:col-span-5 p-7 sm:p-9 border-b md:border-b-0 md:border-r border-[#1E2A42] flex flex-col items-center justify-center text-center">
          <div className="relative mb-5">
            <div
              className={`w-36 h-36 rounded-full flex items-center justify-center border transition-all ${
                connected
                  ? 'border-[#F97316]/60 shadow-[0_0_50px_rgba(249,115,22,0.45)]'
                  : 'border-[#22304A]'
              }`}
            >
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background:
                    'radial-gradient(circle at 35% 30%, #FDBA74 0%, #F97316 60%, #9A3412 100%)',
                }}
              >
                {connected || connecting ? (
                  <div className="flex items-center gap-1.5 h-10">
                    {[24, 14, 28, 16, 22, 12, 26].map((h, idx) => (
                      <span
                        key={idx}
                        className="w-1.5 rounded-full bg-[#0B1220] animate-pulse"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 7 }, (_, idx) => (
                      <span
                        key={idx}
                        className="w-1.5 h-3 rounded-full bg-[#0B1220]"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display text-2xl font-bold text-white">Vix</h2>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                agentStatus === 'online'
                  ? 'bg-[#052E16] text-[#4ADE80] border border-[#16A34A]/40'
                  : 'bg-[#1E293B] text-[#94A3B8]'
              }`}
            >
              {agentStatus === 'online' ? 'DUPLEX ONLINE (:8090)' : 'LOCAL TOUR'}
            </span>
          </div>
          <p className="text-xs text-[#93A0B8] leading-relaxed max-w-[260px] mb-4">
            Full-duplex voice &amp; point-anywhere guide for{' '}
            <strong className="text-[#E6EBF5]">{experimentTitle}</strong>.
          </p>

          {liveTypedGreeting && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#121A2B] border border-[#F97316]/50 text-xs text-[#E6EBF5] text-left leading-relaxed w-full">
              <div className="font-mono text-[10px] text-[#FDBA74] uppercase mb-1 flex items-center justify-between">
                <span>VIX ({voice.toUpperCase()}) · LIVE SPEECH &amp; TRANSCRIPT</span>
                <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-ping" />
              </div>
              <p>{liveTypedGreeting}</p>
            </div>
          )}

          <ul className="space-y-2 text-xs text-left w-full max-w-[210px]">
            {[
              'Joining LiveKit / Pipecat duplex stream',
              'Sharing live DOM & SVG pointer map',
              'Natural voice barge-in enabled',
              'Connected to active session',
            ].map((step) => (
              <li key={step} className="flex items-center gap-2.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    connected ? 'bg-[#4ADE80]' : 'bg-[#2C3B59]'
                  }`}
                />
                <span className={connected ? 'text-[#E6EBF5]' : 'text-[#6B778C]'}>
                  {step}
                </span>
              </li>
            ))}
          </ul>

          <Link
            to="/lab/vix/connect"
            className="mt-5 text-[11px] font-semibold text-[#60A5FA] hover:underline"
          >
            Open standalone Vix screen →
          </Link>
        </div>

        {/* Right Permissions, Brain Selector & Voice Selection */}
        <div className="md:col-span-7 p-7 sm:p-9 space-y-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-1">
              BEFORE YOU CALL
            </div>
            <h3 className="font-display text-xl font-bold text-white">
              What can Vix use on this bench?
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">Microphone (Natural Voice Barge-In)</div>
                <div className="text-xs text-[#93A0B8] mt-0.5">
                  Speak naturally anytime—your voice interrupts Vix automatically.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={micOn}
                aria-label="Toggle microphone"
                onClick={() => setMicOn(!micOn)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                  micOn ? 'bg-[#F97316]' : 'bg-[#22304A]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    micOn ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">See my lab screen &amp; cursor pointer</div>
                <div className="text-xs text-[#93A0B8] mt-0.5">
                  Point or click any component, pin, or slider and ask &ldquo;What is this?&rdquo;
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={screenOn}
                aria-label="Toggle see my lab screen"
                onClick={() => setScreenOn(!screenOn)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                  screenOn ? 'bg-[#F97316]' : 'bg-[#22304A]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    screenOn ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">Camera</div>
                <div className="text-xs text-[#93A0B8] mt-0.5">
                  Optional — show Vix real apparatus or your written notebook.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={cameraOn}
                aria-label="Toggle camera"
                onClick={() => setCameraOn(!cameraOn)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                  cameraOn ? 'bg-[#F97316]' : 'bg-[#22304A]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    cameraOn ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Pluggable LLM Brain Selector */}
          <div>
            <label
              htmlFor="vix-brain-select"
              className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5 text-[#F97316]" />
              <span>LLM Brain (Gemini 3.8 / Gemini 4 Argon / Claude / OpenAI / Groq)</span>
            </label>
            <select
              id="vix-brain-select"
              value={brain}
              onChange={(e) => {
                setBrain(e.target.value);
                if (typeof window !== 'undefined') {
                  window.sessionStorage.setItem('vix_brain', e.target.value);
                }
              }}
              className="w-full bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2 text-xs font-mono text-[#E6EBF5] focus:outline-none focus:border-[#F97316]"
            >
              {VIX_BRAIN_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} ({opt.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs font-bold text-white mb-2">
              Select Voice — Vix will introduce itself &amp; offer a full workspace tour
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ada' as const, name: 'Ada (Aoede)', desc: 'Warm · Nigerian English' },
                { id: 'tunde' as const, name: 'Tunde (Charon)', desc: 'Calm · Nigerian English' },
                { id: 'grace' as const, name: 'Grace (Kore)', desc: 'Clear · British English' },
              ].map((v) => {
                const active = voice === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      void triggerVoiceSelfIntroduction(v.id);
                    }}
                    className={`text-left rounded-xl p-2.5 border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#2B170A] border-[#F97316] text-white'
                        : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6] hover:border-[#3A4A68]'
                    }`}
                  >
                    <div className="text-xs font-bold">{v.name}</div>
                    <div className="text-[11px] text-[#93A0B8] mt-0.5 leading-snug">
                      {v.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                stopVixNeuralAudio();
                onClose();
              }}
              className="sm:col-span-4 py-3 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Not now
            </button>
            {!connected ? (
              <button
                type="button"
                disabled={connecting}
                onClick={() => {
                  void triggerVoiceSelfIntroduction(voice);
                }}
                className="sm:col-span-8 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-xs font-bold transition-colors cursor-pointer"
              >
                {connecting ? 'Connecting to Vix Agent...' : 'Connect Vix to bench'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStartTour(voice)}
                className="sm:col-span-8 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-xs font-bold transition-colors cursor-pointer"
              >
                Start live spotlight tour →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface VixSpotlightFloatingCardProps {
  activeLab: SubjectLab;
  experimentTitle: string;
  voice: 'ada' | 'tunde' | 'grace';
  onChangeVoice?: (voice: 'ada' | 'tunde' | 'grace') => void;
  stepIdx: number;
  onSelectStep: (idx: number) => void;
  dimNonActive: boolean;
  onToggleDim: () => void;
  onEndCall: () => void;
}

const VIX_WS_URL = VIX_AGENT_URL.replace(/^http/, 'ws');

/** Convert a Float32 mic buffer from inputSampleRate (e.g. 48kHz) to 16kHz Int16 PCM ArrayBuffer for Gemini Live. */
function downsampleFloat32ToPcm16k(input: Float32Array, inputSampleRate: number): ArrayBuffer {
  const targetRate = 16000;
  const ratio = inputSampleRate / targetRate;
  const outLen = Math.max(1, Math.floor(input.length / ratio));
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcIdx = Math.min(input.length - 1, Math.floor(i * ratio));
    const s = Math.max(-1, Math.min(1, input[srcIdx] || 0));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out.buffer;
}

export function VixSpotlightFloatingCard({
  activeLab,
  experimentTitle,
  voice,
  onChangeVoice,
  stepIdx,
  onSelectStep,
  dimNonActive,
  onToggleDim,
  onEndCall,
}: VixSpotlightFloatingCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const activeLabRef = useRef(activeLab);
  const experimentTitleRef = useRef(experimentTitle);
  const isAuthenticatedRef = useRef(isAuthenticated);
  activeLabRef.current = activeLab;
  experimentTitleRef.current = experimentTitle;
  isAuthenticatedRef.current = isAuthenticated;
  const studentFirstName = user?.firstName || 'Student';
  const [lang, setLang] = useState<VixLanguage>('English');
  const [brain, setBrain] = useState<string>('gemini/gemini-3.1-flash-live-preview');
  const [question, setQuestion] = useState('');
  const [customReply, setCustomReply] = useState<string | null>(null);
  const [liveTypedCaption, setLiveTypedCaption] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [isLoadingTurn, setIsLoadingTurn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecordingSpeech, setIsRecordingSpeech] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [heardTranscript, setHeardTranscript] = useState<string | null>(null);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  // "Point Anywhere on Screen" laser pointer mode & tracked target
  const [pointModeActive, setPointModeActive] = useState(false);
  const [pointedTarget, setPointedTarget] = useState<VixPointerTarget | null>(null);
  const [vixGuideBeacon, setVixGuideBeacon] = useState<{
    targetId: string;
    label: string;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const hoverTargetRef = useRef<VixPointerTarget | null>(null);
  const pointedElementRef = useRef<Element | null>(null);
  const beaconTargetIdRef = useRef<string | null>(null);
  const beaconScrollTimersRef = useRef<number[]>([]);

  const GUIDE_LABELS: Record<string, string> = {
    'top-back': 'Back to Laboratories',
    'top-title': 'Experiment Title & Practical Switcher',
    'top-labs': 'Laboratory Discipline Switcher',
    'top-vix': 'Vix Live Voice Toggle',
    'top-next': 'Analyse Results & Plot Graph',
    'top-bar': 'Top Navigation Bar',
    'tool-rail': 'Left Bench Tool Rail (5 Tools)',
    'apparatus-tray': 'Left Apparatus Tray & Conditions',
    bench: 'Center Interactive Lab Bench',
    'instrument-dock': 'Bottom Instrument Controls & Stopwatch',
    'event-log': 'Timestamped Event Log',
    'data-panel': 'Right Readings Table & Live Graph',
  };

  const findVixGuideElement = (targetId: string): Element | null => {
    if (typeof document === 'undefined' || !targetId) return null;
    return (
      document.querySelector(`[data-vix-part="${targetId}"]`) ||
      document.querySelector(`[data-vix-id="${targetId}"]`)
    );
  };

  const isElementOffscreen = (rect: DOMRect): boolean => {
    if (typeof window === 'undefined') return false;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;
    const vertOff =
      rect.height < vh - margin * 2
        ? rect.top < margin || rect.bottom > vh - margin
        : rect.bottom < margin || rect.top > vh - margin;
    const horizOff =
      rect.width < vw - margin * 2
        ? rect.left < margin || rect.right > vw - margin
        : rect.right < margin || rect.left > vw - margin;
    return vertOff || horizOff;
  };

  const clearBeaconScrollTimers = () => {
    for (const id of beaconScrollTimersRef.current) {
      window.clearTimeout(id);
    }
    beaconScrollTimersRef.current = [];
  };

  const measureAndSetGuideBeacon = (targetId: string, label: string, el: Element) => {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    setVixGuideBeacon({
      targetId,
      label,
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  };

  const moveVixGuideBeacon = (targetId: string, customLabel?: string) => {
    if (typeof document === 'undefined' || !targetId) return;
    const el = findVixGuideElement(targetId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const label = customLabel || GUIDE_LABELS[targetId] || targetId;
    beaconTargetIdRef.current = targetId;
    clearBeaconScrollTimers();
    measureAndSetGuideBeacon(targetId, label, el);

    if (isElementOffscreen(rect) && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      const resync = () => {
        if (beaconTargetIdRef.current !== targetId) return;
        const currentEl = findVixGuideElement(targetId);
        if (currentEl) measureAndSetGuideBeacon(targetId, label, currentEl);
      };
      beaconScrollTimersRef.current = [
        window.setTimeout(resync, 180),
        window.setTimeout(resync, 450),
      ];
    }

    const regionKey = targetId.startsWith('top-') ? 'top-bar' : targetId;
    const idx = VIX_TOUR_STEPS.findIndex(
      (s) => s.id === regionKey || regionKey.startsWith(s.id)
    );
    if (idx !== -1) onSelectStep(idx);
  };

  useEffect(() => {
    return () => clearBeaconScrollTimers();
  }, []);

  const hasActiveHighlight = Boolean(vixGuideBeacon) || Boolean(pointedTarget);
  useEffect(() => {
    if (typeof window === 'undefined' || !hasActiveHighlight) return;
    let rafId: number | null = null;

    const syncHighlightRects = () => {
      rafId = null;
      setVixGuideBeacon((prev) => {
        if (!prev) return prev;
        const el = findVixGuideElement(prev.targetId);
        if (!el) return prev;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return prev;
        const left = Math.round(rect.left);
        const top = Math.round(rect.top);
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        if (
          prev.left === left &&
          prev.top === top &&
          prev.width === width &&
          prev.height === height
        ) {
          return prev;
        }
        return { ...prev, left, top, width, height };
      });

      setPointedTarget((prev) => {
        if (!prev) return prev;
        const el = pointedElementRef.current;
        if (!el || !el.isConnected) return prev;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return prev;
        const left = Math.round(rect.left);
        const top = Math.round(rect.top);
        const width = Math.max(18, Math.round(rect.width));
        const height = Math.max(18, Math.round(rect.height));
        const dx = left - prev.bbox[0];
        const dy = top - prev.bbox[1];
        if (
          dx === 0 &&
          dy === 0 &&
          prev.bbox[2] === width &&
          prev.bbox[3] === height
        ) {
          return prev;
        }
        return {
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
          bbox: [left, top, width, height],
        };
      });
    };

    const scheduleSync = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(syncHighlightRects);
    };

    window.addEventListener('scroll', scheduleSync, { capture: true, passive: true });
    window.addEventListener('resize', scheduleSync, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleSync, true);
      window.removeEventListener('resize', scheduleSync);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [hasActiveHighlight]);

  /**
   * Scan the full cumulative assistant transcript for region mentions and anchor each cue
   * proportionally to the hardware audio clock (`(charIndex / totalChars) * totalReceivedAudioSec`)
   * so the visual highlight glides right on the exact word Vix is speaking aloud.
   */
  const syncPointerFromSpokenText = (spoken: string) => {
    turnTranscriptLengthRef.current = Math.max(turnTranscriptLengthRef.current, spoken.length);
    const lower = spoken.toLowerCase();
    const rules: Array<[string, RegExp]> = [
      ['top-back', /\b(back arrow|back button|return to laboratories|left arrow)\b/g],
      ['top-title', /\b(experiment title|practical title|practical dropdown|dropdown|switch practical)\b/g],
      ['top-labs', /\b(lab switcher|discipline switcher|switch between physics|biology is coming soon)\b/g],
      ['top-next', /\b(analyse results|analyse button|plot graph button|plot v|next step button)\b/g],
      ['top-vix', /\b(call vix button|vix toggle|vix is on|end the call)\b/g],
      ['tool-rail', /\b(tool rail|far left|five icons|column of five|vernier ruler|magnifier|loupe|bench tools)\b/g],
      ['apparatus-tray', /\b(apparatus tray|rig setup|equipment list|simulation seed|conditions|left panel)\b/g],
      ['bench', /\b(in the center|center is the bench|center bench|main bench|the bench|pendulum bench|circuit canvas|center canvas|interactive bench|beam rig|middle of the screen)\b/g],
      ['instrument-dock', /\b(instrument dock|bottom controls|slider|stopwatch|record reading|record deflection|bottom dock|ammeter.*voltmeter|load on hanger|dial gauge|zero gauge)\b/g],
      ['event-log', /\b(event log|log strip|timestamped log|bottom log)\b/g],
      ['data-panel', /\b(readings table|load.?deflection table|data panel|live graph|live preview|right panel|right side|notebook tab)\b/g],
    ];

    const matches: Array<{ targetId: string; index: number }> = [];
    for (const [tid, pat] of rules) {
      let m: RegExpExecArray | null;
      while ((m = pat.exec(lower)) !== null) {
        matches.push({ targetId: tid, index: m.index });
      }
    }
    matches.sort((a, b) => a.index - b.index);

    const ctx = playbackCtxRef.current;
    const startSec = turnAudioStartTimeRef.current;
    const totalReceivedAudioSec =
      ctx && startSec !== null ? Math.max(0.5, nextPlayTimeRef.current - startSec) : 0;
    const totalChars = Math.max(1, spoken.length);

    for (const m of matches) {
      const bucket = Math.floor(m.index / 32);
      const key = `${m.targetId}@${bucket}`;
      if (seenSpokenMatchesRef.current.has(key)) continue;
      seenSpokenMatchesRef.current.add(key);

      const estimatedSec =
        totalReceivedAudioSec > 0
          ? (m.index / totalChars) * totalReceivedAudioSec
          : Math.max(0.15, m.index / 16.5);

      // Snap any earlier pre-speech RPC cue for the same target to this exact character index
      const existingRpc = turnCueQueueRef.current.find(
        (c) => c.targetId === m.targetId && c.source === 'rpc'
      );
      if (existingRpc) {
        existingRpc.charIndex = m.index;
        existingRpc.triggerAtSec = estimatedSec;
        existingRpc.source = 'text';
      } else {
        enqueueAudioSyncedBeacon(m.targetId, undefined, estimatedSec, 'text', m.index);
      }
    }
  };

  // Silence follow-up & auto-end countdown timing constants
  const SILENCE_FOLLOWUP_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes between follow-up check-ins
  const MAX_SILENCE_FOLLOWUPS = 3; // 3 follow-up check-ins before announcing session end
  const AUTO_END_COUNTDOWN_SECONDS = 60; // 60-second cancelable countdown before auto-exit

  // Full-Duplex Live WebSocket + Web Audio Capture & 24kHz Playback Scheduler refs
  const liveWsRef = useRef<WebSocket | null>(null);
  const micMutedRef = useRef<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isVixAudioActiveRef = useRef<boolean>(false);

  // Hardware-audio-clock cue timeline (keeps visual indicator strictly locked to heard speech)
  const turnAudioStartTimeRef = useRef<number | null>(null);
  const turnTranscriptLengthRef = useRef<number>(0);
  const turnCueQueueRef = useRef<
    Array<{
      targetId: string;
      label?: string;
      triggerAtSec: number;
      source: 'rpc' | 'text';
      charIndex?: number;
    }>
  >([]);
  const seenSpokenMatchesRef = useRef<Set<string>>(new Set());
  const turnRpcCountRef = useRef<number>(0);
  const audioCueIntervalRef = useRef<number | null>(null);
  const preAudioFallbackTimerRef = useRef<number | null>(null);

  // Silence follow-up check-in & 60s auto-end countdown refs/state
  const onEndCallRef = useRef(onEndCall);
  onEndCallRef.current = onEndCall;
  const turnFinishedRef = useRef<boolean>(false);
  const followUpCountRef = useRef<number>(0);
  const silenceTimerRef = useRef<number | null>(null);
  const awaitingClosingCountdownRef = useRef<boolean>(false);
  const closingFallbackTimerRef = useRef<number | null>(null);
  const endCountdownIntervalRef = useRef<number | null>(null);
  const endCountdownSecRef = useRef<number | null>(null);
  const speechInterruptFramesRef = useRef<number>(0);
  const [endCountdownSec, setEndCountdownSec] = useState<number | null>(null);
  const [silenceCheckAttempt, setSilenceCheckAttempt] = useState<number>(0);

  const stopAudioCueTicker = () => {
    if (audioCueIntervalRef.current !== null) {
      window.clearInterval(audioCueIntervalRef.current);
      audioCueIntervalRef.current = null;
    }
    if (preAudioFallbackTimerRef.current !== null) {
      window.clearTimeout(preAudioFallbackTimerRef.current);
      preAudioFallbackTimerRef.current = null;
    }
  };

  const clearScheduledGuideBeacons = () => {
    stopAudioCueTicker();
    turnCueQueueRef.current = [];
    seenSpokenMatchesRef.current.clear();
    turnRpcCountRef.current = 0;
    turnTranscriptLengthRef.current = 0;
    turnAudioStartTimeRef.current = null;
  };

  const drainDueAudioCues = () => {
    const ctx = playbackCtxRef.current;
    const startSec = turnAudioStartTimeRef.current;
    if (!ctx || startSec === null || turnCueQueueRef.current.length === 0) return;

    const elapsedSec = Math.max(0, ctx.currentTime - startSec);
    const totalReceivedAudioSec = Math.max(0, nextPlayTimeRef.current - startSec);
    const totalChars = turnTranscriptLengthRef.current;

    // Continuously recalibrate text-anchored cues against Vix's actual measured speaking rate!
    if (totalReceivedAudioSec >= 0.4 && totalChars >= 12) {
      for (const cue of turnCueQueueRef.current) {
        if (cue.charIndex !== undefined) {
          cue.triggerAtSec = Math.max(0.1, (cue.charIndex / totalChars) * totalReceivedAudioSec);
        }
      }
    }

    turnCueQueueRef.current.sort((a, b) => a.triggerAtSec - b.triggerAtSec);

    let firedLatest: { targetId: string; label?: string } | null = null;
    while (
      turnCueQueueRef.current.length > 0 &&
      turnCueQueueRef.current[0]!.triggerAtSec <= elapsedSec + 0.08
    ) {
      const due = turnCueQueueRef.current.shift()!;
      firedLatest = { targetId: due.targetId, label: due.label };
    }
    if (firedLatest) {
      moveVixGuideBeacon(firedLatest.targetId, firedLatest.label);
    }
    if (turnCueQueueRef.current.length === 0 && audioCueIntervalRef.current !== null) {
      window.clearInterval(audioCueIntervalRef.current);
      audioCueIntervalRef.current = null;
    }
  };

  const ensureAudioCueTicker = () => {
    if (audioCueIntervalRef.current !== null || typeof window === 'undefined') return;
    audioCueIntervalRef.current = window.setInterval(drainDueAudioCues, 60);
  };

  const enqueueAudioSyncedBeacon = (
    targetId: string,
    customLabel: string | undefined,
    triggerAtSec: number,
    source: 'rpc' | 'text',
    charIndex?: number
  ) => {
    if (!targetId) return;
    turnCueQueueRef.current.push({
      targetId,
      label: customLabel,
      triggerAtSec,
      source,
      charIndex,
    });
    turnCueQueueRef.current.sort((a, b) => a.triggerAtSec - b.triggerAtSec);

    if (isVixAudioActiveRef.current && turnAudioStartTimeRef.current !== null) {
      ensureAudioCueTicker();
      drainDueAudioCues();
    } else if (preAudioFallbackTimerRef.current === null && typeof window !== 'undefined') {
      // Safety fallback only for silent/text-only turns where no audio ever arrives
      preAudioFallbackTimerRef.current = window.setTimeout(() => {
        preAudioFallbackTimerRef.current = null;
        if (!isVixAudioActiveRef.current && turnCueQueueRef.current.length > 0) {
          const next = turnCueQueueRef.current.shift()!;
          moveVixGuideBeacon(next.targetId, next.label);
        }
      }, 1500);
    }
  };

  const scheduleGuideBeaconFromRpc = (targetId: string, customLabel?: string) => {
    if (!targetId) return;
    const ctx = playbackCtxRef.current;
    const rpcIdx = turnRpcCountRef.current;
    turnRpcCountRef.current += 1;

    // If audio is already playing, schedule at the end of currently queued audio (right where Vix is about to speak).
    // If Gemini emitted a burst of spotlight_region RPCs BEFORE audio started, hold the 1st cue for t=0.15s of
    // audio and space extra burst cues conservatively (4.5s apart) until outputTranscription snaps them to the exact word!
    let triggerAtSec: number;
    if (isVixAudioActiveRef.current && ctx && turnAudioStartTimeRef.current !== null) {
      const queuedOffsetSec = Math.max(0, nextPlayTimeRef.current - turnAudioStartTimeRef.current);
      triggerAtSec = Math.max(0.15, queuedOffsetSec - 0.15);
    } else {
      triggerAtSec = rpcIdx === 0 ? 0.15 : rpcIdx * 4.5;
    }

    enqueueAudioSyncedBeacon(targetId, customLabel, triggerAtSec, 'rpc');
  };

  const clearSilenceTimers = () => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (closingFallbackTimerRef.current !== null) {
      window.clearTimeout(closingFallbackTimerRef.current);
      closingFallbackTimerRef.current = null;
    }
    if (endCountdownIntervalRef.current !== null) {
      window.clearInterval(endCountdownIntervalRef.current);
      endCountdownIntervalRef.current = null;
    }
  };

  const resetUserActivity = () => {
    clearSilenceTimers();
    followUpCountRef.current = 0;
    awaitingClosingCountdownRef.current = false;
    endCountdownSecRef.current = null;
    speechInterruptFramesRef.current = 0;
    setSilenceCheckAttempt(0);
    setEndCountdownSec(null);
  };

  const startAutoEndCountdown = () => {
    if (endCountdownIntervalRef.current !== null) return;
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (closingFallbackTimerRef.current !== null) {
      window.clearTimeout(closingFallbackTimerRef.current);
      closingFallbackTimerRef.current = null;
    }
    awaitingClosingCountdownRef.current = false;
    endCountdownSecRef.current = AUTO_END_COUNTDOWN_SECONDS;
    setEndCountdownSec(AUTO_END_COUNTDOWN_SECONDS);

    endCountdownIntervalRef.current = window.setInterval(() => {
      const next = (endCountdownSecRef.current ?? 1) - 1;
      if (next <= 0) {
        clearSilenceTimers();
        endCountdownSecRef.current = null;
        setEndCountdownSec(null);
        stopLiveSession();
        onEndCallRef.current();
        return;
      }
      endCountdownSecRef.current = next;
      setEndCountdownSec(next);
    }, 1000);
  };

  const armSilenceFollowUpTimer = () => {
    const ws = liveWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (
      isVixAudioActiveRef.current ||
      awaitingClosingCountdownRef.current ||
      endCountdownSecRef.current !== null
    ) {
      return;
    }
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
    }

    silenceTimerRef.current = window.setTimeout(() => {
      silenceTimerRef.current = null;
      const activeWs = liveWsRef.current;
      if (!activeWs || activeWs.readyState !== WebSocket.OPEN) return;
      if (isVixAudioActiveRef.current || endCountdownSecRef.current !== null) return;

      if (followUpCountRef.current < MAX_SILENCE_FOLLOWUPS) {
        const nextAttempt = followUpCountRef.current + 1;
        followUpCountRef.current = nextAttempt;
        setSilenceCheckAttempt(nextAttempt);
        turnFinishedRef.current = false;
        activeWs.send(
          JSON.stringify({
            type: 'silence_checkin',
            attempt: nextAttempt,
            maxAttempts: MAX_SILENCE_FOLLOWUPS,
          })
        );
      } else {
        awaitingClosingCountdownRef.current = true;
        turnFinishedRef.current = false;
        activeWs.send(
          JSON.stringify({
            type: 'silence_ending',
            countdownSeconds: AUTO_END_COUNTDOWN_SECONDS,
          })
        );
        // Safety fallback so 60s countdown starts even if audio delivery stalls
        closingFallbackTimerRef.current = window.setTimeout(() => {
          if (awaitingClosingCountdownRef.current) {
            startAutoEndCountdown();
          }
        }, 12000);
      }
    }, SILENCE_FOLLOWUP_INTERVAL_MS);
  };

  const handleVixAudioDrained = () => {
    if (!turnFinishedRef.current) return;
    // If Vix spoke slightly faster than estimated, land cleanly on the final pending cue of the turn
    if (turnCueQueueRef.current.length > 0) {
      const lastCue = turnCueQueueRef.current[turnCueQueueRef.current.length - 1]!;
      moveVixGuideBeacon(lastCue.targetId, lastCue.label);
    }
    clearScheduledGuideBeacons();
    if (awaitingClosingCountdownRef.current) {
      startAutoEndCountdown();
    } else {
      armSilenceFollowUpTimer();
    }
  };

  const flushLiveAudioPlayback = () => {
    clearScheduledGuideBeacons();
    for (const node of activeSourceNodesRef.current) {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // ignore already stopped
      }
    }
    activeSourceNodesRef.current.clear();
    nextPlayTimeRef.current = 0;
    isVixAudioActiveRef.current = false;
    setIsSpeakingAudio(false);
  };

  const schedulePcm24kChunk = (pcmArrayBuffer: ArrayBuffer) => {
    if (typeof window === 'undefined' || pcmArrayBuffer.byteLength < 2) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
      playbackCtxRef.current = new AudioCtx({ sampleRate: 24000 });
    }
    const ctx = playbackCtxRef.current;
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    const int16 = new Int16Array(pcmArrayBuffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i]! / 32768;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now + 0.015, nextPlayTimeRef.current);
    const wasIdle = activeSourceNodesRef.current.size === 0 || turnAudioStartTimeRef.current === null;
    if (wasIdle) {
      turnAudioStartTimeRef.current = startAt;
      if (preAudioFallbackTimerRef.current !== null) {
        window.clearTimeout(preAudioFallbackTimerRef.current);
        preAudioFallbackTimerRef.current = null;
      }
    }
    nextPlayTimeRef.current = startAt + audioBuffer.duration;

    activeSourceNodesRef.current.add(src);
    isVixAudioActiveRef.current = true;
    setIsSpeakingAudio(true);

    if (turnCueQueueRef.current.length > 0) {
      ensureAudioCueTicker();
    }

    src.onended = () => {
      activeSourceNodesRef.current.delete(src);
      if (activeSourceNodesRef.current.size === 0) {
        isVixAudioActiveRef.current = false;
        setIsSpeakingAudio(false);
        handleVixAudioDrained();
      }
    };

    src.start(startAt);
  };

  const stopLiveSession = () => {
    clearSilenceTimers();
    flushLiveAudioPlayback();
    if (liveWsRef.current) {
      try {
        if (liveWsRef.current.readyState === WebSocket.OPEN) {
          liveWsRef.current.send(JSON.stringify({ type: 'end' }));
        }
        liveWsRef.current.close();
      } catch {
        // ignore
      }
      liveWsRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
      } catch {
        // ignore
      }
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
    if (captureCtxRef.current) {
      captureCtxRef.current.close().catch(() => {});
      captureCtxRef.current = null;
    }
    if (playbackCtxRef.current) {
      playbackCtxRef.current.close().catch(() => {});
      playbackCtxRef.current = null;
    }
    setLiveConnected(false);
    setIsListening(false);
    setIsRecordingSpeech(false);
    setMicLevel(0);
  };

  const startLiveMicrophoneStream = async () => {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const capCtx = new AudioCtx();
      captureCtxRef.current = capCtx;
      if (capCtx.state === 'suspended') {
        await capCtx.resume().catch(() => {});
      }

      const source = capCtx.createMediaStreamSource(stream);
      const processor = capCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;
      const silentGain = capCtx.createGain();
      silentGain.gain.value = 0;

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(capCtx.destination);

      setIsListening(true);
      micMutedRef.current = false;

      processor.onaudioprocess = (ev) => {
        if (micMutedRef.current) {
          setMicLevel(0);
          return;
        }
        const ws = liveWsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const input = ev.inputBuffer.getChannelData(0);
        let sumSq = 0;
        for (let i = 0; i < input.length; i++) {
          const v = input[i]!;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / input.length);
        const pct = Math.min(100, Math.round(rms * 420));
        setMicLevel(pct);
        setIsRecordingSpeech(rms > 0.03);

        // If student speaks during the 60s exit countdown or closing notice, immediately cancel exit!
        if (
          (endCountdownSecRef.current !== null || awaitingClosingCountdownRef.current) &&
          rms > 0.045
        ) {
          speechInterruptFramesRef.current += 1;
          if (speechInterruptFramesRef.current >= 2) {
            resetUserActivity();
          }
        } else {
          speechInterruptFramesRef.current = 0;
        }

        // Smart Speaker-Echo Gate that STILL allows real barge-in!
        // When Vix is silent: stream every audio frame continuously to Gemini 3.1 Live.
        // When Vix is speaking: suppress low speaker-bleed (<0.055), but if student speaks up (>0.055),
        // stream it straight through so Gemini 3.1 Live triggers native mid-sentence interruption!
        if (isVixAudioActiveRef.current && rms < 0.055) {
          return;
        }

        const pcm16k = downsampleFloat32ToPcm16k(input, capCtx.sampleRate);
        ws.send(pcm16k);
      };
    } catch {
      setIsListening(false);
    }
  };

  // Connect full-duplex Gemini 3.1 Flash Live WebSocket on mount (and reconnect if voice or language changes)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;
    let cancelled = false;
    let screenSyncTimer: number | null = null;

    const bootTimer = window.setTimeout(() => {
      if (cancelled) return;
      const params = new URLSearchParams({
        firstName: studentFirstName,
        voice,
        locale: lang,
        mode: 'PRACTICE',
        experimentTitle,
        isAuthenticated: String(Boolean(isAuthenticatedRef.current)),
      });
      const ws = new WebSocket(`${VIX_WS_URL}/vix/live?${params.toString()}`);
      ws.binaryType = 'arraybuffer';
      liveWsRef.current = ws;
      setIsLoadingTurn(true);

      ws.onopen = () => {
        if (cancelled) {
          ws.close();
          return;
        }
        const liveMap = collectLiveDomScreenMap(activeLab, experimentTitle, 'PRACTICE');
        ws.send(
          JSON.stringify({
            type: 'init',
            firstName: studentFirstName,
            isAuthenticated: Boolean(isAuthenticatedRef.current),
            voice,
            locale: lang,
            experimentTitle,
            screenMap: liveMap,
          })
        );
        void startLiveMicrophoneStream();

        // Periodically sync fresh ScreenMap (using refs so navigation never drops the live call!)
        screenSyncTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'screenmap',
                screenMap: collectLiveDomScreenMap(
                  activeLabRef.current,
                  experimentTitleRef.current,
                  'PRACTICE',
                  pointedTarget ?? hoverTargetRef.current
                ),
              })
            );
          }
        }, 2500);
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        if (ev.data instanceof ArrayBuffer) {
          setIsLoadingTurn(false);
          schedulePcm24kChunk(ev.data);
          return;
        }
        if (typeof ev.data === 'string') {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'live_ready') {
              setLiveConnected(true);
              setIsLoadingTurn(false);
            } else if (msg.type === 'interrupted') {
              // Instant native barge-in cutoff + cancel any silence countdown!
              flushLiveAudioPlayback();
              resetUserActivity();
              turnFinishedRef.current = false;
              setLastIntent('interrupted');
            } else if (msg.type === 'turn_complete') {
              turnFinishedRef.current = true;
              if (activeSourceNodesRef.current.size === 0) {
                handleVixAudioDrained();
              }
            } else if (msg.type === 'transcript') {
              if (msg.role === 'user' && msg.text) {
                resetUserActivity();
                setHeardTranscript(msg.text);
              } else if (msg.role === 'assistant' && msg.text) {
                turnFinishedRef.current = false;
                setIsLoadingTurn(false);
                setCustomReply(msg.text);
                setLiveTypedCaption(msg.text);
                syncPointerFromSpokenText(msg.text);
              }
            } else if (msg.type === 'rpc') {
              if (msg.method === 'spotlight' || msg.method === 'pointAt') {
                const targetId = String(
                  msg.payload?.regionId || msg.payload?.elementId || ''
                );
                const customLbl = msg.payload?.label ? String(msg.payload.label) : undefined;
                scheduleGuideBeaconFromRpc(targetId, customLbl);
              } else if (msg.method === 'buildSetup') {
                window.dispatchEvent(
                  new CustomEvent('vix:build-setup', { detail: msg.payload || {} })
                );
              } else if (msg.method === 'navigate' && msg.payload?.to) {
                const dest = String(msg.payload.to);
                if (!dest.includes('/biology')) {
                  // Keep live voice call continuously connected across navigation!
                  navigate(dest);
                }
              }
            } else if (msg.type === 'bench_control') {
              // Vix directly operates the REAL lab bench controls in Live Tutorial Sandbox Mode!
              window.dispatchEvent(
                new CustomEvent('vix:bench-control', {
                  detail: { action: msg.action, params: msg.params || {} },
                })
              );
              setLastIntent(
                msg.action === 'end_tutorial_sandbox' ? 'live' : 'tutorial_sandbox'
              );
            } else if (msg.type === 'ui_action') {
              if (msg.action === 'start_tour') {
                if (!dimNonActive) onToggleDim();
                onSelectStep(0);
                setLastIntent('studio_tour');
              }
            } else if (msg.type === 'error') {
              setIsLoadingTurn(false);
              setCustomReply(msg.detail || 'Live voice connection error.');
            }
          } catch {
            // ignore non-json
          }
        }
      };

      ws.onclose = () => {
        if (!cancelled) {
          setLiveConnected(false);
          setIsLoadingTurn(false);
        }
      };
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(bootTimer);
      if (screenSyncTimer !== null) window.clearInterval(screenSyncTimer);
      stopLiveSession();
    };
  }, [voice, lang]);

  // Whenever the student navigates or logs in/out, seamlessly update Vix over the SAME live WebSocket!
  useEffect(() => {
    const ws = liveWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const timer = window.setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          type: 'page_changed',
          route: location.pathname,
          pageTitle: location.pathname.startsWith('/auth')
            ? 'Sign In / Create Account'
            : experimentTitle,
          isAuthenticated: Boolean(isAuthenticated),
          firstName: user?.firstName || 'Student',
          screenMap: collectLiveDomScreenMap(activeLab, experimentTitle, 'PRACTICE'),
        })
      );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [location.pathname, activeLab, experimentTitle, isAuthenticated, user?.firstName]);

  // Track live cursor hover across the lab bench
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let lastSample = 0;
    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastSample < 120) return;
      lastSample = now;
      const target = inspectDomElementAt(e.clientX, e.clientY);
      if (target) hoverTargetRef.current = target;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  // "Point" mode (or Alt+Click anywhere on screen) pins the laser beacon & asks Vix live over WebSocket!
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onWindowClick = (e: MouseEvent) => {
      if (!pointModeActive && !e.altKey) return;
      const target = inspectDomElementAt(e.clientX, e.clientY);
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      resetUserActivity();

      const rawEl = document.elementFromPoint(e.clientX, e.clientY);
      const focusEl =
        rawEl?.closest('[data-vix-element]') ||
        rawEl?.closest('button, input, select, textarea, a, label, tr, [aria-label], [title], g') ||
        rawEl;
      pointedElementRef.current = focusEl ?? null;
      setPointedTarget(target);
      setPointModeActive(false);

      if (focusEl && typeof focusEl.scrollIntoView === 'function') {
        const rect = focusEl.getBoundingClientRect();
        if (isElementOffscreen(rect)) {
          focusEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          const resyncPointed = () => {
            if (pointedElementRef.current !== focusEl || !focusEl.isConnected) return;
            const nextRect = focusEl.getBoundingClientRect();
            if (nextRect.width <= 0 || nextRect.height <= 0) return;
            const left = Math.round(nextRect.left);
            const top = Math.round(nextRect.top);
            const width = Math.max(18, Math.round(nextRect.width));
            const height = Math.max(18, Math.round(nextRect.height));
            setPointedTarget((prev) =>
              prev
                ? {
                    ...prev,
                    x: prev.x + (left - prev.bbox[0]),
                    y: prev.y + (top - prev.bbox[1]),
                    bbox: [left, top, width, height],
                  }
                : prev
            );
          };
          window.setTimeout(resyncPointed, 180);
          window.setTimeout(resyncPointed, 450);
        }
      }

      if (target.regionId) {
        const idx = VIX_TOUR_STEPS.findIndex((s) => s.id === target.regionId);
        if (idx !== -1) onSelectStep(idx);
      }

      flushLiveAudioPlayback();
      const ws = liveWsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'pointer', pointerTarget: target, askNow: true }));
      }
    };

    window.addEventListener('click', onWindowClick, true);
    return () => window.removeEventListener('click', onWindowClick, true);
  });

  const currentStep = VIX_TOUR_STEPS[stepIdx] ?? VIX_TOUR_STEPS[3]!;
  const stepDefaultCaption = currentStep.getCaption(activeLab, experimentTitle, lang);
  const displayedCaption =
    liveTypedCaption ?? customReply ?? stepDefaultCaption;

  const handleAskQuestion = async (qText: string) => {
    const q = qText.trim();
    if (!q) return;
    resetUserActivity();
    flushLiveAudioPlayback();
    setQuestion('');
    setHeardTranscript(q);

    const ws = liveWsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Send latest ScreenMap first so Gemini Live has exact counts, then send the text turn!
      ws.send(
        JSON.stringify({
          type: 'screenmap',
          screenMap: collectLiveDomScreenMap(
            activeLab,
            experimentTitle,
            'PRACTICE',
            pointedTarget ?? hoverTargetRef.current
          ),
        })
      );
      ws.send(JSON.stringify({ type: 'text', text: q }));
      setIsLoadingTurn(true);
    }
  };

  const handleNaturalBargeIn = () => {
    flushLiveAudioPlayback();
  };

  const stopHardwareMicrophone = () => {
    stopLiveSession();
  };

  const handleToggleConversationalMic = () => {
    if (isSpeakingAudio) {
      flushLiveAudioPlayback();
    }
    micMutedRef.current = !micMutedRef.current;
    setIsListening(!micMutedRef.current);
  };

  return (
    <>
      {/* Animated Vix Guide Pointer & Spotlight Box that smoothly glides to each exact side & sub-component! */}
      {vixGuideBeacon && (
        <div
          className="fixed inset-0 pointer-events-none z-40"
          aria-hidden="true"
        >
          <div
            style={{
              left: Math.max(2, vixGuideBeacon.left - 3),
              top: Math.max(2, vixGuideBeacon.top - 3),
              width: vixGuideBeacon.width + 6,
              height: vixGuideBeacon.height + 6,
            }}
            className="fixed rounded-xl border-2 border-[#F97316] bg-[#F97316]/8 shadow-[0_0_28px_rgba(249,115,22,0.55)] transition-all duration-300 ease-out"
          />
          {(() => {
            const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
            const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
            const isCompactTop = vixGuideBeacon.top < 90 && vixGuideBeacon.height < 120;
            const isCompactBottom =
              vixGuideBeacon.top + vixGuideBeacon.height > vh - 140 &&
              vixGuideBeacon.height < 260;
            const isRight = vixGuideBeacon.left > vw * 0.6;
            const rawTop = isCompactTop
              ? vixGuideBeacon.top + vixGuideBeacon.height + 10
              : isCompactBottom
                ? vixGuideBeacon.top - 38
                : vixGuideBeacon.top + 12;
            const badgeTop = Math.min(vh - 48, Math.max(12, rawTop));
            const badgeLeft = isRight
              ? Math.max(12, vixGuideBeacon.left - 240)
              : Math.min(
                  vw - 270,
                  Math.max(
                    12,
                    vixGuideBeacon.left +
                      (vixGuideBeacon.width < 120 ? vixGuideBeacon.width + 10 : 12)
                  )
                );
            return (
              <div
                style={{ left: badgeLeft, top: badgeTop }}
                className="fixed px-3 py-1.5 rounded-full bg-[#0B1220]/95 border border-[#F97316] text-xs font-semibold text-[#FDBA74] shadow-xl flex items-center gap-2 transition-all duration-300 ease-out"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] animate-ping shrink-0" />
                <span className="whitespace-nowrap">Vix → {vixGuideBeacon.label}</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Live Laser Pointer Beacon & Bounding Box when student points at any screen element */}
      {pointedTarget && (
        <div
          className="fixed inset-0 pointer-events-none z-30"
          aria-hidden="true"
        >
          <div
            style={{
              left: pointedTarget.bbox[0],
              top: pointedTarget.bbox[1],
              width: pointedTarget.bbox[2],
              height: pointedTarget.bbox[3],
            }}
            className="fixed rounded-lg border-2 border-[#F97316] bg-[#F97316]/10 shadow-[0_0_24px_rgba(249,115,22,0.55)] transition-all duration-200"
          />
          <div
            style={{
              left: Math.min(
                (typeof window !== 'undefined' ? window.innerWidth : 1200) - 240,
                Math.max(12, pointedTarget.x + 10)
              ),
              top: Math.max(12, pointedTarget.y - 32),
            }}
            className="fixed px-2.5 py-1 rounded-full bg-[#0B1220]/95 border border-[#F97316] text-[11px] font-mono text-[#FDBA74] shadow-lg flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
            <span className="truncate max-w-[210px]">
              Pointing: {pointedTarget.label}
              {pointedTarget.value ? ` (${pointedTarget.value})` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Full-screen crosshair cursor overlay when "Point" mode is armed */}
      {pointModeActive && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#F97316] text-[#0B1220] text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Crosshair className="w-4 h-4" />
          <span>
            Click ANY component, terminal pin, slider, organ, or table cell on your screen to ask Vix!
          </span>
          <button
            type="button"
            onClick={() => setPointModeActive(false)}
            className="ml-1 px-2 py-0.5 rounded-full bg-[#0B1220] text-white text-[10px] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      <aside
        aria-label="Vix live in-lab guide"
        className="fixed bottom-5 right-5 w-[calc(100%-2.5rem)] max-w-[415px] bg-[#0D1526]/95 backdrop-blur-md border border-[#F97316]/60 rounded-2xl p-5 shadow-[0_24px_60px_rgba(0,0,0,0.75)] space-y-3.5 z-40"
      >
        {/* Top Row: Vix Orb + Duplex Status + Point & Ask + Language */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.5)]"
              style={{
                background:
                  'radial-gradient(circle at 35% 30%, #FDBA74 0%, #F97316 65%, #9A3412 100%)',
              }}
            >
              <div className="flex items-center gap-0.5">
                {[12, 7, 15, 9, 13].map((h, i) => (
                  <span
                    key={i}
                    className={`w-0.5 bg-[#0B1220] rounded-full ${
                      isSpeakingAudio || isListening ? 'animate-pulse' : ''
                    }`}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                <span>Vix · {voice[0]?.toUpperCase() + voice.slice(1)}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#231915] border border-[#9A3412] text-[10px] text-[#FDBA74]">
                  {isSpeakingAudio ? 'SPEAKING' : isListening ? 'LISTENING' : 'LIVE'}
                </span>
              </div>
              <div className="text-[11px] text-[#4ADE80] font-mono truncate max-w-[175px]">
                {liveConnected ? 'LIVE STREAM · 3.1 Flash' : brain}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPointModeActive((p) => !p)}
              title="Point anywhere on your screen and Vix will identify & explain that exact component or pin"
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                pointModeActive
                  ? 'bg-[#F97316] border-[#FDBA74] text-[#0B1220]'
                  : 'bg-[#121A2B] border-[#22304A] text-[#FDBA74] hover:border-[#F97316]'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Point</span>
            </button>

            <button
              type="button"
              onClick={onToggleDim}
              title={dimNonActive ? 'Disable spotlight dimming' : 'Enable spotlight dimming'}
              className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                dimNonActive
                  ? 'bg-[#2B170A] border-[#F97316] text-[#FDBA74]'
                  : 'bg-[#121A2B] border-[#22304A] text-[#93A0B8]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <select
              aria-label="Vix language"
              value={lang}
              onChange={(e) => {
                setLang(e.target.value as VixLanguage);
                setCustomReply(null);
                setLiveTypedCaption(null);
              }}
              className="bg-[#121A2B] border border-[#22304A] rounded-lg px-2 py-1 text-xs text-[#E6EBF5]"
            >
              <option value="English">English</option>
              <option value="Pidgin">Pidgin</option>
              <option value="Yoruba">Yorùbá</option>
              <option value="Hausa">Hausa</option>
              <option value="Igbo">Igbo</option>
            </select>
          </div>
        </div>

        {/* Hot-Swap LLM Brain + Voice Selector Row */}
        <div className="grid grid-cols-12 gap-1.5">
          <div className="col-span-8 flex items-center gap-1.5 bg-[#121A2B] border border-[#22304A] rounded-xl px-2.5 py-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
            <select
              aria-label="Active LLM brain"
              value={brain}
              onChange={(e) => {
                setBrain(e.target.value);
                if (typeof window !== 'undefined') {
                  window.sessionStorage.setItem('vix_brain', e.target.value);
                }
              }}
              className="w-full bg-transparent text-[11px] font-mono text-[#E6EBF5] focus:outline-none"
            >
              {VIX_BRAIN_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-[#0B1220]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <select
            aria-label="Vix voice persona"
            value={voice}
            onChange={(e) => {
              const nextVoice = e.target.value as 'ada' | 'tunde' | 'grace';
              onChangeVoice?.(nextVoice);
            }}
            className="col-span-4 bg-[#121A2B] border border-[#22304A] rounded-xl px-2 py-1.5 text-[11px] font-semibold text-[#FDBA74] focus:outline-none focus:border-[#F97316]"
          >
            <option value="ada" className="bg-[#0B1220]">Ada (NG)</option>
            <option value="tunde" className="bg-[#0B1220]">Tunde (NG)</option>
            <option value="grace" className="bg-[#0B1220]">Grace (UK)</option>
          </select>
        </div>

        {/* Live Microphone VAD Voice Level & Heard Transcript Pill */}
        {isListening && (
          <div className="flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl bg-[#0B1220] border border-[#22304A] text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isRecordingSpeech
                    ? 'bg-[#F97316] animate-ping'
                    : 'bg-[#4ADE80]'
                }`}
              />
              <span className="text-[#C9D3E6] truncate">
                {isLoadingTurn
                  ? 'Vix heard you — replying...'
                  : isRecordingSpeech
                    ? 'Hearing you speak...'
                    : heardTranscript
                      ? `You: "${heardTranscript}"`
                      : 'Mic active — just talk naturally'}
              </span>
            </div>
            <div className="w-16 h-1.5 bg-[#1E2A42] rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-[#4ADE80] transition-all duration-75"
                style={{ width: `${Math.max(8, micLevel)}%` }}
              />
            </div>
          </div>
        )}

        {/* 60-Second Auto-End Countdown Banner (after 3 unanswered 3-min check-ins) */}
        {endCountdownSec !== null && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#3B1219] border border-[#F97316] text-[11px]">
            <span className="text-[#FDBA74] leading-snug">
              Ending session in{' '}
              <strong className="font-mono text-white">{endCountdownSec}s</strong> — speak or
              interrupt to stay
            </span>
            <button
              type="button"
              onClick={() => {
                resetUserActivity();
                const ws = liveWsRef.current;
                if (ws && ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'text', text: "I'm still here, let's continue." }));
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] font-bold text-[10px] cursor-pointer shrink-0"
            >
              I&apos;m here
            </button>
          </div>
        )}

        {silenceCheckAttempt > 0 && endCountdownSec === null && (
          <div className="px-3 py-1 rounded-lg bg-[#121A2B] border border-[#22304A] text-[10px] font-mono text-[#93A0B8]">
            Follow-up check-in {silenceCheckAttempt}/{MAX_SILENCE_FOLLOWUPS} · waiting for your response
          </div>
        )}

        {/* Pointed Element Pill */}
        {pointedTarget && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#1C1613] border border-[#F97316]/50 text-[11px]">
            <span className="text-[#FDBA74] truncate">
              📍 Pointing at: <strong className="text-white">{pointedTarget.label}</strong>
              {pointedTarget.value ? ` (${pointedTarget.value})` : ''}
            </span>
            <button
              type="button"
              onClick={() => {
                pointedElementRef.current = null;
                setPointedTarget(null);
              }}
              className="text-[#93A0B8] hover:text-white font-mono text-[10px] cursor-pointer shrink-0"
            >
              Clear ×
            </button>
          </div>
        )}

        {/* Step Counter & Synchronized Live Speech/Typing Caption */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-[#FDBA74] mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {isLoadingTurn
                ? `THINKING · ${brain.toUpperCase()}...`
                : customReply
                  ? `VIX (${lastIntent?.toUpperCase() || 'LLM'}) · ${currentStep.chip.toUpperCase()}`
                  : currentStep.heading}
            </span>
            <span className="font-mono text-[#93A0B8]">
              {stepIdx + 1} / {VIX_TOUR_STEPS.length}
            </span>
          </div>
          <p className="text-xs text-[#E6EBF5] leading-relaxed">
            {isLoadingTurn ? 'Reading your live pointer & ScreenMap...' : displayedCaption}
          </p>

         
        </div>

        {/* Progress Bar (visible during active studio tour) */}
        {lastIntent === 'studio_tour' && (
          <div className="h-1 bg-[#1E2A42] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F97316] transition-all duration-300"
              style={{ width: `${((stepIdx + 1) / VIX_TOUR_STEPS.length) * 100}%` }}
            />
          </div>
        )}

        {/* Full-Duplex Mic + Text Input + End Call */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleAskQuestion(question);
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            aria-label="Hold to speak to Vix"
            onClick={handleToggleConversationalMic}
            title={
              isListening
                ? 'Listening continuously — just talk naturally to interrupt Vix'
                : 'Turn on natural conversational microphone'
            }
            className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
              isListening
                ? 'bg-[#F97316] border-[#FDBA74] text-[#0B1220] animate-pulse'
                : 'bg-[#1C2A47] border-[#3B82F6]/40 text-[#60A5FA]'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='Speak naturally, point anywhere, or type...'
            className="flex-1 bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#6B778C] focus:outline-none focus:border-[#F97316]"
          />
          <button
            type="button"
            aria-label="End Vix call"
            onClick={() => {
              handleNaturalBargeIn();
              stopHardwareMicrophone();
              onEndCall();
            }}
            className="w-9 h-9 rounded-full bg-[#7F1D1D] hover:bg-[#991B1B] flex items-center justify-center text-white shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </>
  );
}
