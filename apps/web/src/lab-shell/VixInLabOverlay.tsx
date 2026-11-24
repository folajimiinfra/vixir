import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
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

/**
 * Downsample mono Float32 PCM chunks to 16 kHz 16-bit signed PCM and wrap in a standard 44-byte RIFF/WAVE header.
 * Pure uncompressed `audio/wav` works identically across Zen Browser, Firefox, Chrome, and Safari with 100% Gemini STT fidelity.
 */
function encodePcmChunksToWavBlob(chunks: Float32Array[], inputSampleRate: number): Blob {
  const totalInSamples = chunks.reduce((acc, c) => acc + c.length, 0);
  const merged = new Float32Array(totalInSamples);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }

  const targetRate = 16000;
  const ratio = inputSampleRate / targetRate;
  const outLen = Math.max(1, Math.floor(totalInSamples / ratio));
  const buffer = new ArrayBuffer(44 + outLen * 2);
  const view = new DataView(buffer);

  const writeStr = (pos: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(pos + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + outLen * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM subchunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeStr(36, 'data');
  view.setUint32(40, outLen * 2, true);

  for (let i = 0; i < outLen; i++) {
    const srcIdx = Math.min(totalInSamples - 1, Math.floor(i * ratio));
    const s = Math.max(-1, Math.min(1, merged[srcIdx] || 0));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

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

  // Interactive Animated Worked Example Visual Walkthrough (shows an analogous DIFFERENT lab step by step!)
  const [workedExampleOpen, setWorkedExampleOpen] = useState(false);
  const [workedStepIdx, setWorkedStepIdx] = useState(0);

  // "Point Anywhere on Screen" laser pointer mode & tracked target
  const [pointModeActive, setPointModeActive] = useState(false);
  const [pointedTarget, setPointedTarget] = useState<VixPointerTarget | null>(null);
  const hoverTargetRef = useRef<VixPointerTarget | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isGreetingRef = useRef<boolean>(true);
  const isProcessingTurnRef = useRef<boolean>(false);
  const autoWalkCancelRef = useRef<boolean>(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const forceFlushSpeechRef = useRef<(() => void) | null>(null);

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

  /** Natural voice barge-in interruption (also stops any running autonomous tour/example) */
  const handleNaturalBargeIn = () => {
    autoWalkCancelRef.current = true;
    stopVixNeuralAudio();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoadingTurn(false);
  };

  /** Speak text AND type it out word-by-word simultaneously as the voice plays! */
  const speakAndTypeSimultaneously = async (
    text: string,
    sentences?: string[],
    inlineAudio?: { audio: string; mimeType?: string } | null
  ) => {
    await playVixNeuralAudio(
      text,
      voice,
      lang,
      sentences,
      (typedSoFar) => {
        setLiveTypedCaption(typedSoFar);
      },
      inlineAudio
    );
  };

  // Interactive 4-step analogous lab walkthrough (Hooke's Law Spiral Spring when on Pendulum; Pendulum when on Electronics/Chemistry/etc.)
  const isAnalogousSpring = activeLab === 'physics';
  const WORKED_EXAMPLE_STEPS = isAnalogousSpring
    ? [
        {
          title: 'Step 1 · Vary the independent variable cleanly',
          caption:
            'In this analogous Hookes Law spring lab, hang slotted masses one by one (50 g, 100 g, 150 g, 200 g) and wait for the spring to settle before reading.',
          loadG: 100,
          extCm: 4.0,
          pts: [{ x: 0.5, y: 2.0 }],
        },
        {
          title: 'Step 2 · Read scale at eye level & repeat',
          caption:
            'Keep your eye strictly perpendicular to the metre rule pointer to avoid parallax error, and repeat during unloading to take a reliable mean reading.',
          loadG: 200,
          extCm: 8.0,
          pts: [
            { x: 0.5, y: 2.0 },
            { x: 1.0, y: 4.0 },
            { x: 1.5, y: 6.1 },
            { x: 2.0, y: 8.0 },
          ],
        },
        {
          title: 'Step 3 · Plot points & draw a balanced line of best fit',
          caption:
            'Plot Force on the vertical axis against extension on the horizontal axis using more than half the grid, balancing scattered points evenly above and below the line.',
          loadG: 250,
          extCm: 10.0,
          pts: [
            { x: 0.5, y: 2.0 },
            { x: 1.0, y: 4.0 },
            { x: 1.5, y: 6.1 },
            { x: 2.0, y: 8.0 },
            { x: 2.5, y: 10.0 },
          ],
        },
        {
          title: 'Step 4 · Use a large slope triangle to find the physical constant',
          caption:
            'Choose two well-separated vertices A and B on the best-fit line, compute change in y over change in x to obtain the spring constant k, then apply this exact method on your own pendulum bench!',
          loadG: 300,
          extCm: 12.0,
          pts: [
            { x: 0.5, y: 2.0 },
            { x: 1.0, y: 4.0 },
            { x: 1.5, y: 6.1 },
            { x: 2.0, y: 8.0 },
            { x: 2.5, y: 10.0 },
            { x: 3.0, y: 12.0 },
          ],
        },
      ]
    : [
        {
          title: 'Step 1 · Set up & check zero error',
          caption:
            'In this analogous Simple Pendulum lab, measure length L from the bottom of the split cork to the centre of the bob and confirm the stopwatch reads zero.',
          loadG: 100,
          extCm: 4.0,
          pts: [{ x: 0.5, y: 2.0 }],
        },
        {
          title: 'Step 2 · Take repeated measurements across 5–6 values',
          caption:
            'Time 20 complete small-angle oscillations twice at each length, average t1 and t2, and tabulate your derived columns to consistent decimal places.',
          loadG: 200,
          extCm: 8.0,
          pts: [
            { x: 0.5, y: 2.0 },
            { x: 1.0, y: 4.0 },
            { x: 1.5, y: 6.1 },
            { x: 2.0, y: 8.0 },
          ],
        },
        {
          title: 'Step 3 · Plot your linear graph',
          caption:
            'Plot T squared on the vertical axis against length L on the horizontal axis and draw a single straight line of best fit balancing points evenly.',
          loadG: 250,
          extCm: 10.0,
          pts: [
            { x: 0.5, y: 2.0 },
            { x: 1.0, y: 4.0 },
            { x: 1.5, y: 6.1 },
            { x: 2.0, y: 8.0 },
            { x: 2.5, y: 10.0 },
          ],
        },
        {
          title: 'Step 4 · Extract slope from a large triangle & apply to your bench',
          caption:
            'Read two wide vertices A and B directly off the best-fit line to calculate the gradient and physical constant, then repeat this exact discipline on your own lab bench!',
          loadG: 300,
          extCm: 12.0,
          pts: [
            { x: 0.5, y: 2.0 },
            { x: 1.0, y: 4.0 },
            { x: 1.5, y: 6.1 },
            { x: 2.0, y: 8.0 },
            { x: 2.5, y: 10.0 },
            { x: 3.0, y: 12.0 },
          ],
        },
      ];

  /** 100% Autonomous 4-Step Animated Worked Example — advances automatically with zero clicks! */
  const runAutonomousWorkedExample = async () => {
    handleNaturalBargeIn();
    autoWalkCancelRef.current = false;
    isProcessingTurnRef.current = true;
    setWorkedExampleOpen(true);

    for (let i = 0; i < WORKED_EXAMPLE_STEPS.length; i++) {
      if (autoWalkCancelRef.current) break;
      setWorkedStepIdx(i);
      const stepObj = WORKED_EXAMPLE_STEPS[i]!;
      setCustomReply(stepObj.caption);
      setLastIntent('worked_example');
      await speakAndTypeSimultaneously(stepObj.caption);
      if (autoWalkCancelRef.current) break;
      await new Promise((r) => window.setTimeout(r, 450));
    }

    isProcessingTurnRef.current = false;
  };

  /** 100% Autonomous 7-Region Studio Tour — moves spotlight & narrates every region automatically with zero clicks! */
  const runAutonomousStudioTour = async () => {
    handleNaturalBargeIn();
    autoWalkCancelRef.current = false;
    isProcessingTurnRef.current = true;
    setWorkedExampleOpen(false);
    if (!dimNonActive) onToggleDim();

    for (let i = 0; i < VIX_TOUR_STEPS.length; i++) {
      if (autoWalkCancelRef.current) break;
      onSelectStep(i);
      const stepObj = VIX_TOUR_STEPS[i]!;
      const cap = stepObj.getCaption(activeLab, experimentTitle, lang);
      setCustomReply(null);
      setLastIntent('studio_tour');
      await speakAndTypeSimultaneously(cap);
      if (autoWalkCancelRef.current) break;
      await new Promise((r) => window.setTimeout(r, 450));
    }

    if (!autoWalkCancelRef.current) {
      const outro =
        'That completes our quick tour of the lab studio. Just speak naturally or point at anything whenever you want help!';
      setCustomReply(outro);
      await speakAndTypeSimultaneously(outro);
    }
    isProcessingTurnRef.current = false;
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
          firstName: studentFirstName,
          query: q,
          mode: 'PRACTICE',
          locale: lang,
          voice,
          brain,
          includeAudio: true,
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

        // Execute autonomous live UI workflows returned by Vix (no clicking required!)
        if (data.uiAction === 'open_worked_example') {
          setIsLoadingTurn(false);
          void runAutonomousWorkedExample();
          return;
        }
        if (data.uiAction === 'start_tour') {
          setIsLoadingTurn(false);
          void runAutonomousStudioTour();
          return;
        }

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

        // Start speaking + typing word-for-word IMMEDIATELY using the inline audio (0ms extra fetch!)
        setCustomReply(reply);
        setLiveTypedCaption('...');
        setIsLoadingTurn(false);
        await speakAndTypeSimultaneously(
          reply,
          data.sentences,
          data.audio ? { audio: data.audio, mimeType: data.mimeType } : null
        );
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
    // Reject tiny clicks, breaths, or < 4 KB noise bursts
    if (blob.size < 4000 || isProcessingTurnRef.current) return;

    isProcessingTurnRef.current = true;
    const base64Audio = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = typeof reader.result === 'string' ? reader.result : '';
        resolve(res.split(',', 2)[1] || '');
      };
      reader.readAsDataURL(blob);
    });
    if (!base64Audio) {
      isProcessingTurnRef.current = false;
      return;
    }

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
          firstName: studentFirstName,
          audio: base64Audio,
          mimeType,
          mode: 'PRACTICE',
          locale: lang,
          voice,
          brain,
          includeAudio: true,
          screenMap,
          pointerTarget: activePointer,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.silence || !data.reply) {
          setIsLoadingTurn(false);
          isProcessingTurnRef.current = false;
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

        if (data.uiAction === 'open_worked_example') {
          setIsLoadingTurn(false);
          isProcessingTurnRef.current = false;
          void runAutonomousWorkedExample();
          return;
        }
        if (data.uiAction === 'start_tour') {
          setIsLoadingTurn(false);
          isProcessingTurnRef.current = false;
          void runAutonomousStudioTour();
          return;
        }

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
        await speakAndTypeSimultaneously(
          reply,
          data.sentences,
          data.audio ? { audio: data.audio, mimeType: data.mimeType } : null
        );
        isProcessingTurnRef.current = false;
        return;
      }
    } catch {
      // ignore abort or transient error
    }
    setIsLoadingTurn(false);
    isProcessingTurnRef.current = false;
  };

  const stopHardwareMicrophone = () => {
    forceFlushSpeechRef.current = null;
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
      } catch {
        // ignore
      }
      scriptProcessorRef.current = null;
    }
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
      !navigator.mediaDevices?.getUserMedia
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
          channelCount: 1,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => {});
      }

      const source = audioCtx.createMediaStreamSource(stream);
      // Capture raw mono Float32 PCM frames (4096 samples ≈ 85ms at 48kHz) so we encode crystal-clear 16kHz WAV!
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      const preRingBuffer: Float32Array[] = [];
      let speechChunks: Float32Array[] = [];
      let isCapturing = false;
      let speakingFrames = 0;
      let silenceFrames = 0;
      let peakDuringCapture = 0;

      const flushCapturedSpeech = () => {
        if (!isCapturing) return;
        isCapturing = false;
        setIsRecordingSpeech(false);
        const captured = speechChunks;
        const peak = peakDuringCapture;
        speechChunks = [];
        speakingFrames = 0;
        silenceFrames = 0;
        peakDuringCapture = 0;

        const totalSamples = captured.reduce((acc, c) => acc + c.length, 0);
        const durationSec = totalSamples / Math.max(8000, audioCtx.sampleRate);
        // Require at least 0.45s of clear audible speech above noise floor
        if (durationSec >= 0.45 && peak >= 0.05) {
          const wavBlob = encodePcmChunksToWavBlob(captured, audioCtx.sampleRate);
          void sendRecordedVoiceBlobToVix(wavBlob, 'audio/wav');
        }
      };

      forceFlushSpeechRef.current = flushCapturedSpeech;
      setIsListening(true);

      processor.onaudioprocess = (ev) => {
        const input = ev.inputBuffer.getChannelData(0);
        const frameCopy = new Float32Array(input.length);
        frameCopy.set(input);

        let sumSq = 0;
        let framePeak = 0;
        for (let i = 0; i < frameCopy.length; i++) {
          const v = frameCopy[i]!;
          sumSq += v * v;
          const absV = Math.abs(v);
          if (absV > framePeak) framePeak = absV;
        }
        const rms = Math.sqrt(sumSq / frameCopy.length);

        // Echo-Shield, Greeting Guard & In-Flight Turn Lock
        const inGuard =
          isGreetingRef.current ||
          isProcessingTurnRef.current ||
          Boolean(activeNeuralAudio) ||
          performance.now() - lastAudioEndedAt < 650;
        if (inGuard) {
          speakingFrames = 0;
          silenceFrames = 0;
          if (isCapturing) {
            isCapturing = false;
            speechChunks = [];
            setIsRecordingSpeech(false);
          }
          setMicLevel(0);
          return;
        }

        const pct = Math.min(100, Math.round(rms * 420));
        setMicLevel(pct);

        // Maintain 4-frame (~340ms) pre-speech ring buffer so the first syllable is never clipped!
        if (!isCapturing) {
          preRingBuffer.push(frameCopy);
          if (preRingBuffer.length > 4) preRingBuffer.shift();
        }

        const speechThreshold = 0.032;

        if (rms > speechThreshold) {
          speakingFrames += 1;
          silenceFrames = 0;

          if (!isCapturing && speakingFrames >= 2) {
            isCapturing = true;
            peakDuringCapture = framePeak;
            speechChunks = [...preRingBuffer, frameCopy];
            setIsRecordingSpeech(true);
          } else if (isCapturing) {
            if (framePeak > peakDuringCapture) peakDuringCapture = framePeak;
            speechChunks.push(frameCopy);
          }
        } else {
          speakingFrames = 0;
          if (isCapturing) {
            speechChunks.push(frameCopy);
            silenceFrames += 1;
            const totalSamples = speechChunks.reduce((acc, c) => acc + c.length, 0);
            const durSec = totalSamples / Math.max(8000, audioCtx.sampleRate);
            // ~750ms of silence (9 frames of 85ms) or max 14s utterance -> encode WAV and send!
            if (silenceFrames >= 9 || durSec >= 14.0) {
              flushCapturedSpeech();
            }
          }
        }
      };

      return true;
    } catch {
      return false;
    }
  };

  // Debounce mount by 80ms so React StrictMode dev double-mount never fires TWO duplicate greetings or VAD loops!
  useEffect(() => {
    let cancelled = false;
    isGreetingRef.current = true;

    const bootTimer = window.setTimeout(() => {
      if (cancelled) return;
      void startHardwareMicrophoneWithVAD();

      const greetImmediately = async () => {
        try {
          const liveMap = collectLiveDomScreenMap(activeLab, experimentTitle, 'PRACTICE');
          const resp = await fetch(`${VIX_AGENT_URL}/vix/session/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: studentFirstName,
              mode: 'PRACTICE',
              locale: lang,
              voice,
              brain,
              includeAudio: true,
              experimentTitle,
              screenMap: liveMap,
            }),
          });
          if (!cancelled && resp.ok) {
            const data = await resp.json();
            if (typeof window !== 'undefined' && data.sessionId) {
              window.sessionStorage.setItem('vix_session_id', data.sessionId);
            }
            if (data.greeting) {
              setCustomReply(data.greeting);
              await speakAndTypeSimultaneously(
                data.greeting,
                data.sentences,
                data.audio ? { audio: data.audio, mimeType: data.mimeType } : null
              );
            }
          }
        } catch {
          // Keep bench explanation visible if offline
        } finally {
          isGreetingRef.current = false;
        }
      };
      void greetImmediately();
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(bootTimer);
      isGreetingRef.current = false;
      isProcessingTurnRef.current = false;
      stopVixNeuralAudio();
      stopHardwareMicrophone();
    };
  }, []);

  const handleToggleConversationalMic = async () => {
    if (typeof window === 'undefined') return;

    if (isSpeakingAudio) {
      handleNaturalBargeIn();
    }

    // If currently recording a speech segment and user taps mic, finalize and send WAV immediately
    if (isListening && isRecordingSpeech && forceFlushSpeechRef.current) {
      forceFlushSpeechRef.current();
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

      {/* Interactive Animated Worked Example Visual Walkthrough Panel (Analogous Different Lab!) */}
      {workedExampleOpen &&
        (() => {
          const wStep = WORKED_EXAMPLE_STEPS[workedStepIdx] ?? WORKED_EXAMPLE_STEPS[0]!;
          const springCoilsY = 34 + wStep.extCm * 4.5;
          return (
            <div
              role="dialog"
              aria-label="Vix Interactive Worked Example Walkthrough"
              className="fixed bottom-5 left-5 sm:left-16 z-40 w-[calc(100%-2.5rem)] max-w-[450px] bg-[#0B1220]/96 backdrop-blur-md border-2 border-[#38BDF8]/70 rounded-2xl p-4 shadow-[0_24px_60px_rgba(0,0,0,0.8)] space-y-3 text-[#E6EBF5]"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#1E2A42] pb-2">
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                    LIVE WORKED EXAMPLE · {isAnalogousSpring ? "HOOKE'S LAW SPRING LAB" : 'PENDULUM ANALOGY'}
                  </div>
                  <div className="font-display text-sm font-bold text-white">
                    {wStep.title}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkedExampleOpen(false)}
                  className="px-2 py-1 rounded-lg bg-[#121A2B] hover:bg-[#192338] text-xs text-[#93A0B8] hover:text-white cursor-pointer"
                >
                  Close ×
                </button>
              </div>

              {/* Animated Analogous Apparatus + Live Regression Plot SVG */}
              <div className="bg-[#080E1A] border border-[#1E2A42] rounded-xl p-2">
                <svg viewBox="0 0 380 140" className="w-full h-36">
                  {/* Left: Analogous Spring-Mass Apparatus stretching per step */}
                  <rect x="20" y="12" width="90" height="5" rx="2" fill="#64748B" />
                  <line x1="28" y1="17" x2="28" y2="128" stroke="#475569" strokeWidth="4" />
                  {/* Stretched coil spring */}
                  <path
                    d={`M 75 17 L 75 24 L 66 ${24 + (springCoilsY - 24) * 0.2} L 84 ${
                      24 + (springCoilsY - 24) * 0.4
                    } L 66 ${24 + (springCoilsY - 24) * 0.6} L 84 ${
                      24 + (springCoilsY - 24) * 0.8
                    } L 75 ${springCoilsY}`}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2.2"
                  />
                  {/* Mass hanger & slotted weight */}
                  <rect
                    x="61"
                    y={springCoilsY}
                    width="28"
                    height="18"
                    rx="3"
                    fill="#F97316"
                    stroke="#FDBA74"
                    strokeWidth="1.5"
                  />
                  <text
                    x="75"
                    y={springCoilsY + 12}
                    textAnchor="middle"
                    fill="#0B1220"
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {wStep.loadG}g
                  </text>
                  {/* Eye-level horizontal scale pointer */}
                  <line
                    x1="89"
                    y1={springCoilsY + 9}
                    x2="132"
                    y2={springCoilsY + 9}
                    stroke="#4ADE80"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                  <rect x="132" y="18" width="12" height="108" rx="2" fill="#B4986B" />
                  <text
                    x="138"
                    y={springCoilsY + 12}
                    fill="#4ADE80"
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    e={wStep.extCm.toFixed(1)}cm
                  </text>

                  {/* Right: Live Worked Example Graph + Large Slope Triangle (Steps 3 & 4) */}
                  <rect x="176" y="10" width="194" height="120" rx="8" fill="#0B1220" stroke="#1E2A42" />
                  <line x1="198" y1="112" x2="354" y2="112" stroke="#475569" strokeWidth="1.2" />
                  <line x1="198" y1="22" x2="198" y2="112" stroke="#475569" strokeWidth="1.2" />

                  {/* Best-fit line appears from Step 3 onward */}
                  {workedStepIdx >= 2 && (
                    <line
                      x1="198"
                      y1="112"
                      x2="348"
                      y2="28"
                      stroke="#38BDF8"
                      strokeWidth="2"
                    />
                  )}
                  {/* Large Slope Triangle appears on Step 4 */}
                  {workedStepIdx >= 3 && (
                    <>
                      <path
                        d="M 226 96 L 326 96 L 326 40"
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="1.6"
                        strokeDasharray="4 3"
                      />
                      <circle cx="226" cy="96" r="3.5" fill="#F97316" />
                      <circle cx="326" cy="40" r="3.5" fill="#F97316" />
                      <text x="276" y="107" textAnchor="middle" fill="#FDBA74" fontSize="8" fontFamily="JetBrains Mono, monospace">
                        Large ΔF / Δe triangle → k
                      </text>
                    </>
                  )}
                  {/* Plotted points */}
                  {wStep.pts.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={198 + (pt.x / 3.2) * 150}
                      cy={112 - (pt.y / 13) * 86}
                      r="3.2"
                      fill="#4ADE80"
                    />
                  ))}
                  <text x="276" y="124" textAnchor="middle" fill="#93A0B8" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
                    Analogous Graph · Force vs Extension
                  </text>
                </svg>
              </div>

              <p className="text-xs text-[#C9D3E6] leading-relaxed">{wStep.caption}</p>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="font-mono text-[11px] text-[#93A0B8]">
                  Step {workedStepIdx + 1} / {WORKED_EXAMPLE_STEPS.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleNaturalBargeIn();
                      setWorkedExampleOpen(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#4ADE80] hover:bg-[#22C55E] text-[#0B1220] text-xs font-bold cursor-pointer"
                  >
                    Try on my own bench ✓
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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
