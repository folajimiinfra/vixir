import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Mic, X, Sparkles, Volume2, Eye, Cpu, Crosshair } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  { id: 'gemini/gemini-3.8-flash', label: 'Gemini 3.8 Flash (Google)' },
  { id: 'gemini/gemini-4-argon', label: 'Gemini 4 Argon (Google)' },
  { id: 'gemini/gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite (Ultra-Fast)' },
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
 * Synthesizes the full reply as ONE seamless continuous Gemini 3.8 Neural TTS WAV clip
 * (no choppy gaps or pitch jumps between sentences) and reveals words in real-time lockstep with playback.
 */
export async function playVixNeuralAudio(
  text: string,
  voice: 'ada' | 'tunde' | 'grace' = 'ada',
  locale: string = 'English',
  _preSplitSentences?: string[],
  onLiveTextUpdate?: (typedSoFar: string) => void
): Promise<boolean> {
  const cleaned = text.trim();
  if (!cleaned || typeof window === 'undefined' || typeof Audio === 'undefined') {
    onLiveTextUpdate?.(cleaned);
    return false;
  }

  stopVixNeuralAudio();
  const myGen = audioGenerationSeq;

  const uri = await fetchSentenceAudioDataUri(cleaned, voice, locale).catch(() => null);
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

  return {
    v: 1 as const,
    screen: screenCodeMap[activeLab] || 'D1',
    route: typeof window !== 'undefined' ? window.location.pathname : `/lab/${activeLab}`,
    mode,
    experiment: {
      id: `${activeLab}.practical`,
      title: experimentTitle,
      step: 'READINGS',
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
      readingsCount: 2,
      readingsTarget: 6,
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
  const { user } = useAuth();
  const studentFirstName = user?.firstName || 'Student';
  const [lang, setLang] = useState<VixLanguage>('English');
  const [brain, setBrain] = useState<string>(() =>
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem('vix_brain') || 'gemini/gemini-3.8-flash'
      : 'gemini/gemini-3.8-flash'
  );
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

  // "Point Anywhere on Screen" laser pointer mode & tracked target
  const [pointModeActive, setPointModeActive] = useState(false);
  const [pointedTarget, setPointedTarget] = useState<VixPointerTarget | null>(null);
  const hoverTargetRef = useRef<VixPointerTarget | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vadTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [showTrace, setShowTrace] = useState(false);
  const [agentMeta, setAgentMeta] = useState<{
    criticScore?: number;
    kgFacts?: string[];
    agentTrace?: Array<{ sender: string; recipient: string; phase: string; content: string }>;
    selfNotes?: string;
    reflexionPlans?: string[];
    llmMs?: number;
  } | null>(null);

  useEffect(() => {
    return subscribeVixSpeaking((speaking) => {
      setIsSpeakingAudio(speaking);
    });
  }, []);

  // Track live cursor hover across the lab bench so deictic "What is this?" always knows what the mouse is over
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let lastSample = 0;
    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastSample < 100) return;
      lastSample = now;
      const target = inspectDomElementAt(e.clientX, e.clientY);
      if (target) {
        hoverTargetRef.current = target;
      }
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  // When "Point" mode is active (or Alt+Click anywhere on screen), clicking any component/pin/slider pins the beacon & asks Vix!
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onWindowClick = (e: MouseEvent) => {
      if (!pointModeActive && !e.altKey) return;
      const target = inspectDomElementAt(e.clientX, e.clientY);
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      setPointedTarget(target);
      setPointModeActive(false);

      if (target.regionId) {
        const idx = VIX_TOUR_STEPS.findIndex((s) => s.id === target.regionId);
        if (idx !== -1) onSelectStep(idx);
      }

      void handleAskQuestion(
        `Explain this specific component or terminal pin I clicked on: "${target.label}". What is its exact role in ${experimentTitle} and how do I use it?`,
        target
      );
    };

    window.addEventListener('click', onWindowClick, true);
    return () => window.removeEventListener('click', onWindowClick, true);
  });

  const currentStep = VIX_TOUR_STEPS[stepIdx] ?? VIX_TOUR_STEPS[3]!;
  const stepDefaultCaption = currentStep.getCaption(activeLab, experimentTitle, lang);
  const displayedCaption =
    liveTypedCaption ?? customReply ?? stepDefaultCaption;

  /** Natural voice barge-in interruption */
  const handleNaturalBargeIn = () => {
    stopVixNeuralAudio();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoadingTurn(false);
  };

  /** Speak text AND type it out word-by-word simultaneously as the voice plays! */
  const speakAndTypeSimultaneously = async (text: string, sentences?: string[]) => {
    await playVixNeuralAudio(text, voice, lang, sentences, (typedSoFar) => {
      setLiveTypedCaption(typedSoFar);
    });
  };

  const handleSelectTourStepAndSpeak = (newIdx: number) => {
    handleNaturalBargeIn();
    setCustomReply(null);
    setLiveTypedCaption(null);
    onSelectStep(newIdx);
    const stepObj = VIX_TOUR_STEPS[newIdx] ?? VIX_TOUR_STEPS[3]!;
    const cap = stepObj.getCaption(activeLab, experimentTitle, lang);
    void speakAndTypeSimultaneously(cap);
  };

  const handleAskQuestion = async (
    qText: string,
    explicitPointer?: VixPointerTarget | null
  ) => {
    const q = qText.trim();
    if (!q) return;

    // 1. Preempt any in-flight speech or turn (Natural Barge-In)
    handleNaturalBargeIn();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingTurn(true);
    setLiveTypedCaption(null);
    setQuestion('');

    const activePointer = explicitPointer ?? pointedTarget ?? hoverTargetRef.current;

    try {
      const screenMap = collectLiveDomScreenMap(
        activeLab,
        experimentTitle,
        'PRACTICE',
        activePointer
      );
      const sessionId =
        typeof window !== 'undefined'
          ? window.sessionStorage.getItem('vix_session_id') || 'live-web-session'
          : 'live-web-session';

      const t0 = performance.now();
      const resp = await fetch(`${VIX_AGENT_URL}/vix/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId,
          query: q,
          mode: 'PRACTICE',
          locale: lang,
          brain,
          screenMap,
          pointerTarget: activePointer,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const llmMs = Math.round(performance.now() - t0);
        const reply: string = data.reply || 'Let us examine that step on your bench.';
        setLastIntent(data.intent || null);
        setAgentMeta({
          criticScore: data.criticScore,
          kgFacts: data.kgFacts,
          agentTrace: data.agentTrace,
          selfNotes: data.selfNotes,
          reflexionPlans: data.reflexionPlans,
          llmMs,
        });

        // Execute any spotlight/pointAt/buildSetup RPC returned by the Vix LangGraph
        const rpcs: Array<{ method: string; payload?: Record<string, unknown> }> =
          data.rpcPlan || [];
        for (const call of rpcs) {
          if (call.method === 'buildSetup' && typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('vix:build-setup', { detail: call.payload || {} })
            );
          }
          if (call.method === 'spotlight' || call.method === 'pointAt') {
            const targetId = String(
              call.payload?.regionId || call.payload?.elementId || ''
            );
            const matchedStepIdx = VIX_TOUR_STEPS.findIndex(
              (s) => s.id === targetId || targetId.startsWith(s.id)
            );
            if (matchedStepIdx !== -1) {
              onSelectStep(matchedStepIdx);
            }
          }
        }

        // Keep customReply stored, and start speaking + typing word-for-word at the exact same instant!
        setCustomReply(reply);
        setLiveTypedCaption('...');
        setIsLoadingTurn(false);
        await speakAndTypeSimultaneously(reply, data.sentences);
        return;
      }
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') {
        return;
      }
    }

    setIsLoadingTurn(false);
    setCustomReply(
      'Vix agent server (:8090) could not be reached. Ensure vix-agent is running to query Gemini live.'
    );
  };

  const sendRecordedVoiceBlobToVix = async (blob: Blob, mimeType: string) => {
    if (blob.size < 1200) return;

    const base64Audio = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = typeof reader.result === 'string' ? reader.result : '';
        resolve(res.split(',', 2)[1] || '');
      };
      reader.readAsDataURL(blob);
    });
    if (!base64Audio) return;

    handleNaturalBargeIn();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoadingTurn(true);
    setLiveTypedCaption(null);

    const activePointer = pointedTarget ?? hoverTargetRef.current;

    try {
      const screenMap = collectLiveDomScreenMap(
        activeLab,
        experimentTitle,
        'PRACTICE',
        activePointer
      );
      const sessionId =
        typeof window !== 'undefined'
          ? window.sessionStorage.getItem('vix_session_id') || 'live-web-session'
          : 'live-web-session';

      const t0 = performance.now();
      const resp = await fetch(`${VIX_AGENT_URL}/vix/voice-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId,
          audio: base64Audio,
          mimeType,
          mode: 'PRACTICE',
          locale: lang,
          brain,
          screenMap,
          pointerTarget: activePointer,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.silence || !data.reply) {
          setIsLoadingTurn(false);
          return;
        }
        const llmMs = Math.round(performance.now() - t0);
        if (data.transcript) {
          setHeardTranscript(data.transcript);
        }
        const reply: string = data.reply;
        setLastIntent(data.intent || null);
        setAgentMeta({
          criticScore: data.criticScore,
          kgFacts: data.kgFacts,
          agentTrace: data.agentTrace,
          selfNotes: data.selfNotes,
          reflexionPlans: data.reflexionPlans,
          llmMs,
        });

        const rpcs: Array<{ method: string; payload?: Record<string, unknown> }> =
          data.rpcPlan || [];
        for (const call of rpcs) {
          if (call.method === 'buildSetup' && typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('vix:build-setup', { detail: call.payload || {} })
            );
          }
          if (call.method === 'spotlight' || call.method === 'pointAt') {
            const targetId = String(
              call.payload?.regionId || call.payload?.elementId || ''
            );
            const matchedStepIdx = VIX_TOUR_STEPS.findIndex(
              (s) => s.id === targetId || targetId.startsWith(s.id)
            );
            if (matchedStepIdx !== -1) {
              onSelectStep(matchedStepIdx);
            }
          }
        }

        setCustomReply(reply);
        setLiveTypedCaption('...');
        setIsLoadingTurn(false);
        await speakAndTypeSimultaneously(reply, data.sentences);
        return;
      }
    } catch {
      // ignore abort or transient error
    }
    setIsLoadingTurn(false);
  };

  const stopHardwareMicrophone = () => {
    if (vadTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    recognitionRef.current?.stop();
    setIsListening(false);
    setIsRecordingSpeech(false);
    setMicLevel(0);
  };

  const startHardwareMicrophoneWithVAD = async () => {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      return false;
    }

    try {
      stopHardwareMicrophone();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm';

      const timeDomain = new Uint8Array(analyser.fftSize);
      let speakingFrames = 0;
      let silenceFrames = 0;
      let speechStartedAt = 0;

      const beginSegmentRecording = () => {
        if (
          !mediaStreamRef.current ||
          (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording')
        ) {
          return;
        }
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            recordedChunksRef.current.push(ev.data);
          }
        };
        recorder.onstop = () => {
          const chunks = recordedChunksRef.current;
          recordedChunksRef.current = [];
          setIsRecordingSpeech(false);
          if (chunks.length > 0) {
            const blob = new Blob(chunks, { type: mimeType });
            void sendRecordedVoiceBlobToVix(blob, mimeType);
          }
        };
        recorder.start(150);
        speechStartedAt = performance.now();
        setIsRecordingSpeech(true);
      };

      setIsListening(true);

      vadTimerRef.current = window.setInterval(() => {
        analyser.getByteTimeDomainData(timeDomain);
        let sumSq = 0;
        for (let i = 0; i < timeDomain.length; i++) {
          const norm = (timeDomain[i]! - 128) / 128;
          sumSq += norm * norm;
        }
        const rms = Math.sqrt(sumSq / timeDomain.length);
        const pct = Math.min(100, Math.round(rms * 380));
        setMicLevel(pct);

        // Echo-Shield: while Vix is playing audio out of laptop speakers (or within 350ms of room reverb),
        // pause VAD auto-trigger so speaker echo NEVER chops Vix's own voice mid-sentence!
        // (Student can still click the Mic button or type at any moment to interrupt immediately.)
        const inSpeakerEchoGuard =
          Boolean(activeNeuralAudio) || performance.now() - lastAudioEndedAt < 350;
        if (inSpeakerEchoGuard) {
          speakingFrames = 0;
          silenceFrames = 0;
          setMicLevel(0);
          return;
        }

        const isRecordingNow =
          mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording';

        const threshold = 0.028;

        if (rms > threshold) {
          speakingFrames += 1;
          silenceFrames = 0;

          if (speakingFrames >= 2 && !isRecordingNow) {
            beginSegmentRecording();
          }
        } else {
          speakingFrames = 0;
          if (isRecordingNow) {
            silenceFrames += 1;
            const elapsedMs = performance.now() - speechStartedAt;
            // ~540 ms of silence after speaking (or max 14s utterance) -> send audio turn to Vix immediately!
            if (silenceFrames >= 9 || elapsedMs > 14000) {
              silenceFrames = 0;
              try {
                mediaRecorderRef.current?.stop();
              } catch {
                // ignore
              }
            }
          }
        }
      }, 60);

      return true;
    } catch {
      return false;
    }
  };

  // Automatically start the real hardware microphone + VAD AND live greeting when the Vix card opens!
  useEffect(() => {
    let cancelled = false;
    void startHardwareMicrophoneWithVAD();

    const greetImmediately = async () => {
      try {
        const resp = await fetch(`${VIX_AGENT_URL}/vix/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: studentFirstName,
            mode: 'PRACTICE',
            locale: lang,
            voice,
            brain,
            experimentTitle,
          }),
        });
        if (!cancelled && resp.ok) {
          const data = await resp.json();
          if (typeof window !== 'undefined' && data.sessionId) {
            window.sessionStorage.setItem('vix_session_id', data.sessionId);
          }
          if (data.greeting) {
            setCustomReply(data.greeting);
            await speakAndTypeSimultaneously(data.greeting, data.sentences);
          }
        }
      } catch {
        // Keep bench explanation visible if offline
      }
    };
    void greetImmediately();

    return () => {
      cancelled = true;
      stopVixNeuralAudio();
      stopHardwareMicrophone();
    };
  }, []);

  const handleToggleConversationalMic = async () => {
    if (typeof window === 'undefined') return;

    if (isSpeakingAudio) {
      handleNaturalBargeIn();
    }

    // If currently recording a speech segment and user taps mic, finalize and send immediately
    if (
      isListening &&
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      return;
    }

    if (isListening) {
      stopHardwareMicrophone();
      return;
    }

    const started = await startHardwareMicrophoneWithVAD();
    if (!started) {
      setIsListening((prev) => !prev);
      void handleAskQuestion('What should I do next on this bench?');
    }
  };

  return (
    <>
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
              <div className="text-[11px] text-[#4ADE80] font-mono truncate max-w-[160px]">
                {brain} {agentMeta?.llmMs ? `· ${agentMeta.llmMs}ms` : ''}
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
                {isRecordingSpeech
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

        {/* Pointed Element Pill */}
        {pointedTarget && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#1C1613] border border-[#F97316]/50 text-[11px]">
            <span className="text-[#FDBA74] truncate">
              📍 Pointing at: <strong className="text-white">{pointedTarget.label}</strong>
              {pointedTarget.value ? ` (${pointedTarget.value})` : ''}
            </span>
            <button
              type="button"
              onClick={() => setPointedTarget(null)}
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

          {/* Multi-Agent Reasoning Trace Inspector */}
          {agentMeta && (
            <div className="mt-2 pt-2 border-t border-[#1E2A42]">
              <button
                type="button"
                onClick={() => setShowTrace((s) => !s)}
                className="w-full flex items-center justify-between text-[10px] font-mono text-[#7DD3FC] hover:underline cursor-pointer"
              >
                <span>
                  {showTrace ? '▾ Hide' : '▸ Inspect'} Multi-Agent Trace (
                  {agentMeta.agentTrace?.length || 0} agents · {agentMeta.kgFacts?.length || 0}{' '}
                  GraphRAG hops · Critic {agentMeta.criticScore ?? 10}/10)
                </span>
              </button>
              {showTrace && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-[#080E1A] border border-[#1E2A42] p-2.5 space-y-2 text-[10px] font-mono text-[#C9D3E6]">
                  {agentMeta.agentTrace?.map((m, i) => (
                    <div key={i} className="border-b border-[#142038] pb-1.5 last:border-0">
                      <div className="text-[#FDBA74] font-bold">
                        [{m.phase.toUpperCase()}] {m.sender} → {m.recipient}
                      </div>
                      <div className="text-[#93A0B8] whitespace-pre-wrap leading-snug">
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {agentMeta.kgFacts && agentMeta.kgFacts.length > 0 && (
                    <div>
                      <div className="text-[#4ADE80] font-bold">GraphRAG Multi-Hop Traversal:</div>
                      {agentMeta.kgFacts.slice(0, 3).map((f, idx) => (
                        <div key={idx} className="text-[#93A0B8] truncate">
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-[#1E2A42] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#F97316] transition-all"
            style={{ width: `${((stepIdx + 1) / VIX_TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Clean Back / Say again / Next buttons (No artificial Interrupt button — natural speech barge-in only!) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() =>
              handleSelectTourStepAndSpeak(
                stepIdx > 0 ? stepIdx - 1 : VIX_TOUR_STEPS.length - 1
              )
            }
            className="py-2 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-white cursor-pointer"
          >
            Back
          </button>

          <button
            type="button"
            onClick={() => {
              void speakAndTypeSimultaneously(customReply ?? stepDefaultCaption);
            }}
            className="py-2 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Volume2 className={`w-3.5 h-3.5 text-[#FDBA74] ${isSpeakingAudio ? 'animate-bounce' : ''}`} />
            Say again
          </button>

          <button
            type="button"
            onClick={() =>
              handleSelectTourStepAndSpeak((stepIdx + 1) % VIX_TOUR_STEPS.length)
            }
            className="py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-xs font-bold cursor-pointer"
          >
            Next
          </button>
        </div>

        {/* Region Spotlight Chips + Worked Analogous Example Quick Action */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#93A0B8]">
              Tour a region or see a worked example
            </span>
            <button
              type="button"
              onClick={() => {
                void handleAskQuestion(
                  'Show me how to handle this practical step-by-step using a worked example from another lab so I can practice myself.'
                );
              }}
              className="px-2.5 py-1 rounded-full bg-[#1C2A47] hover:bg-[#24375E] border border-[#3B82F6]/40 text-[10px] font-semibold text-[#93C5FD] cursor-pointer shrink-0"
            >
              Worked example (another lab)
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {VIX_TOUR_STEPS.map((st, idx) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSelectTourStepAndSpeak(idx)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                  stepIdx === idx && !customReply
                    ? 'bg-[#F97316] text-[#0B1220]'
                    : 'bg-[#121A2B] border border-[#22304A] text-[#C9D3E6] hover:text-white'
                }`}
              >
                {st.chip}
              </button>
            ))}
          </div>
        </div>

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
