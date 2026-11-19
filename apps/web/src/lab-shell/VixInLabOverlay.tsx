import { useState } from 'react';
import { Link } from 'react-router';
import { Mic, X, Sparkles, Volume2, Eye } from 'lucide-react';
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

interface TourStepConfig {
  id: VixTargetRegion;
  chip: string;
  heading: string;
  getCaption: (lab: SubjectLab, title: string, lang: VixLanguage) => string;
}

const LAB_BENCH_EXPLANATIONS: Record<SubjectLab, Record<VixLanguage, string>> = {
  physics: {
    English:
      'This is your Physics bench. Watch the apparatus closely, keep your eye level with the scale to avoid parallax error, and time at least 20 oscillations from the centre of the swing.',
    Pidgin:
      'Na your Physics bench be dis. Make sure say your eye level straight with the ruler scale so parallax error no go enter, and count 20 complete swings from the middle.',
    Yoruba:
      'Èyí ni tábìlì ìwádìí Physics rẹ. Rí i dájú pé ojú rẹ dọ́gba pẹ̀lú òṣùwọ̀n kí àṣìṣe parallax má baà wáyé.',
    Hausa:
      'Wannan shi ne teburin gwajin Physics ɗinka. Daidaita idonka da ma’aunin don guje wa kuskuren parallax.',
    Igbo:
      'Nke a bụ tebụlụ nyocha Physics gị. Debe anya gị nhata naọnụ ọgụgụ ruler ka ị gbanarị mperi parallax.',
  },
  chemistry: {
    English:
      'This is your Chemistry titration & analysis bench. Read the bottom of the meniscus at eye level inside the ×8 magnifier, and swirl the conical flask continuously near the end-point.',
    Pidgin:
      'Na your Chemistry bench be dis. Look the bottom of the meniscus well inside the ×8 zoom glass, and dey shake the conical flask gently as the colour wan change.',
    Yoruba:
      'Èyí ni tábìlì Chemistry rẹ. Ka ìsàlẹ̀ meniscus ní ìbámu pẹ̀lú ojú rẹ kí o sì máa mì flask náà.',
    Hausa:
      'Wannan shi ne teburin Chemistry. Karanta ƙasan meniscus daidai da idonka kuma ka girgiza flask ɗin a hankali.',
    Igbo:
      'Nke a bụ tebụlụ Chemistry gị. Gụọ ala meniscus n’ogo anya gị ma na-ekwe flask ahụ nwayọọ.',
  },
  biology: {
    English:
      'This is your Biology specimen and physiological stage. Click any organ or tissue layer to inspect its structure, enzymes, or reagent colour change.',
    Pidgin:
      'Na your Biology bench be dis. Click any organ or test tube make you see how the enzyme or reagent colour dey work.',
    Yoruba:
      'Èyí ni tábìlì Biology rẹ. Tẹ eyíkèyí ẹ̀yà ara tàbí ìdánwò oúnjẹ láti rí bí ó ṣe ń ṣiṣẹ́.',
    Hausa:
      'Wannan shi ne teburin Biology. Danna kowane ɓangaren jiki ko gwajin abinci don ganin yadda yake aiki.',
    Igbo:
      'Nke a bụ tebụlụ Biology gị. Pịa akụkụ ahụ ọ bụla ma ọ bụ ule nri ka ị hụ ka ọ na-arụ ọrụ.',
  },
  electronics: {
    English:
      'This is your Electronics circuit workbench. Check ammeter (series) and voltmeter (parallel) connections before closing key K, and open the key between readings so the wire does not overheat.',
    Pidgin:
      'Na your Electronics circuit bench be dis. Check say ammeter dey series and voltmeter dey parallel before you close key K, and open am back make wire no hot.',
    Yoruba:
      'Èyí ni tábìlì Electronics rẹ. Rí i dájú pé ammeter wà ní series àti voltmeter ní parallel kí o tó ti bọ́tìnì K.',
    Hausa:
      'Wannan shi ne teburin Electronics. Tabbatar ammeter yana series kuma voltmeter yana parallel kafin rufe maɓallin K.',
    Igbo:
      'Nke a bụ tebụlụ Electronics gị. Hụ na ammeter nọ na series na voltmeter nọ na parallel tupu ị mechie key K.',
  },
  engineering: {
    English:
      'This is your Engineering structures rig. Drag on the bench to orbit the 3D view, zero the dial gauge before loading, and tap the bench lightly to release plunger stiction.',
    Pidgin:
      'Na your Engineering test rig be dis. Drag the screen make you turn the 3D view 360°, zero the dial gauge first, and tap the bench small make the needle settle.',
    Yoruba:
      'Èyí ni tábìlì Engineering rẹ. Fà ojú ìwòran náà láti yí 3D ká, kí o sì tẹ dial gauge sí òdo kí o tó gbé ìwọ̀n lé e.',
    Hausa:
      'Wannan shi ne teburin Engineering. Ja allon don juya 3D, saita dial gauge zuwa sifili kafin ɗora nauyi.',
    Igbo:
      'Nke a bụ tebụlụ Engineering gị. Dọrọ ihuenyo ahụ ka ị tụgharịa 3D, ma debe dial gauge na efu tupu ị tinye ibu.',
  },
};

export const VIX_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'top-bar',
    chip: 'Top bar',
    heading: 'POINTING AT · TOP BAR',
    getCaption: (_lab, title, lang) =>
      lang === 'Pidgin'
        ? `For the top bar, you fit see "${title}", switch between the 5 laboratories, or click Analyse results when your table complete.`
        : `At the top bar you can see "${title}", switch between the five laboratories, or move to Analyse results once your readings are complete.`,
  },
  {
    id: 'tool-rail',
    chip: 'Tools',
    heading: 'POINTING AT · BENCH TOOLS',
    getCaption: (_lab, _title, lang) =>
      lang === 'Pidgin'
        ? 'The left tool rail dey help you change between pointer mode, ruler alignment, zoom glass, and your lab notebook.'
        : 'The left tool rail lets you switch between pointer mode, ruler alignment, scale magnification, and your lab notebook.',
  },
  {
    id: 'apparatus-tray',
    chip: 'Apparatus',
    heading: 'POINTING AT · APPARATUS TRAY',
    getCaption: (_lab, _title, lang) =>
      lang === 'Pidgin'
        ? 'Every apparatus wey dey your bench show for here with im resolution, plus the deterministic seed for your practical.'
        : 'Every piece of equipment on your bench is listed here with its resolution, along with the current simulation seed and conditions.',
  },
  {
    id: 'bench',
    chip: 'Bench',
    heading: 'POINTING AT · LAB BENCH',
    getCaption: (lab, _title, lang) => LAB_BENCH_EXPLANATIONS[lab][lang],
  },
  {
    id: 'instrument-dock',
    chip: 'Instruments',
    heading: 'POINTING AT · INSTRUMENT DOCK',
    getCaption: (_lab, _title, lang) =>
      lang === 'Pidgin'
        ? 'Use these controls under the bench to adjust variables, run your timer or burette tap, and record each trial inside your table.'
        : 'Use the controls in the bottom instrument dock to adjust variables, operate timers or meters, and record each reading into your table.',
  },
  {
    id: 'event-log',
    chip: 'Log',
    heading: 'POINTING AT · EVENT LOG',
    getCaption: (_lab, _title, lang) =>
      lang === 'Pidgin'
        ? 'Every move and reading wey you take dey enter this log strip with timestamp so your teacher fit replay your practical.'
        : 'Every adjustment and reading is timestamped in the log strip below the bench so your teacher can replay your practical technique.',
  },
  {
    id: 'data-panel',
    chip: 'Data',
    heading: 'POINTING AT · DATA PANEL',
    getCaption: (_lab, _title, lang) =>
      lang === 'Pidgin'
        ? 'Your recorded readings table, live graph preview, and notebook notes dey show for the right panel as you dey work.'
        : 'Your recorded readings, live graph preview, and lab notebook appear on the right panel as you work.',
  },
];

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
  const [micOn, setMicOn] = useState(true);
  const [screenOn, setScreenOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [voice, setVoice] = useState<'ada' | 'tunde' | 'grace'>('ada');
  const [connected, setConnected] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connect to Vix lab guide"
      className="fixed inset-0 z-50 bg-[#070B14]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="max-w-[900px] w-full bg-[#0B1220] border border-[#1E2A42] rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-[0_32px_64px_rgba(0,0,0,0.75)] relative">
        {/* Top-right close button */}
        <button
          type="button"
          aria-label="Close Vix modal"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] flex items-center justify-center text-[#93A0B8] hover:text-white cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Orb & Connection Steps */}
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
                {connected ? (
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

          <h2 className="font-display text-2xl font-bold text-white mb-1.5">Vix</h2>
          <p className="text-xs text-[#93A0B8] leading-relaxed max-w-[250px] mb-5">
            In-lab voice &amp; spotlight guide for{' '}
            <strong className="text-[#E6EBF5]">{experimentTitle}</strong>.
          </p>

          <ul className="space-y-2 text-xs text-left w-full max-w-[210px]">
            {[
              'Joining secure room',
              'Sharing live lab bench',
              'Vix is reading your apparatus',
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

        {/* Right Permissions & Voice Selection */}
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
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">Microphone</div>
                <div className="text-xs text-[#93A0B8] mt-0.5">
                  Talk to Vix out loud. Hold the mic button to speak.
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

            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">See my lab screen</div>
                <div className="text-xs text-[#93A0B8] mt-0.5">
                  Vix highlights your active bench, instruments, and data panel live.
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

            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex items-center justify-between gap-4">
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

          <div>
            <div className="text-xs font-bold text-white mb-2">Voice</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ada' as const, name: 'Ada', desc: 'Warm · Nigerian English' },
                { id: 'tunde' as const, name: 'Tunde', desc: 'Calm · Nigerian English' },
                { id: 'grace' as const, name: 'Grace', desc: 'Clear · British English' },
              ].map((v) => {
                const active = voice === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVoice(v.id)}
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

          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 text-xs text-[#93A0B8] leading-relaxed">
            Vix only sees the Vixir lab, never other tabs or apps. In graded and exam attempts
            Vix explains the screen and Socratic method without giving away final answers.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="sm:col-span-4 py-3 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Not now
            </button>
            {!connected ? (
              <button
                type="button"
                onClick={() => setConnected(true)}
                className="sm:col-span-8 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-xs font-bold transition-colors cursor-pointer"
              >
                Connect Vix to bench
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
  stepIdx,
  onSelectStep,
  dimNonActive,
  onToggleDim,
  onEndCall,
}: VixSpotlightFloatingCardProps) {
  const [lang, setLang] = useState<VixLanguage>('English');
  const [question, setQuestion] = useState('');
  const [customReply, setCustomReply] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const currentStep = VIX_TOUR_STEPS[stepIdx] ?? VIX_TOUR_STEPS[3]!;
  const captionText =
    customReply ?? currentStep.getCaption(activeLab, experimentTitle, lang);

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAskQuestion = (qText: string) => {
    const q = qText.trim().toLowerCase();
    if (!q) return;

    let reply = '';
    if (q.includes('parallax') || q.includes('eye') || q.includes('scale') || q.includes('meniscus')) {
      reply =
        'To avoid parallax error, always align your line of sight perpendicular to the scale markings (or bottom of the meniscus) before recording a value.';
      onSelectStep(3);
    } else if (q.includes('precaution') || q.includes('error')) {
      reply =
        'Good question! Examiners look for at least 3 physical precautions: e.g., avoiding parallax error, checking zero error before starting, and repeating trials for concordant/mean readings.';
      onSelectStep(6);
    } else if (q.includes('slope') || q.includes('graph') || q.includes('table')) {
      reply =
        'Keep consistent decimal places in every column of your table, and when you move to Analyse results, pick two points far apart on your best-fit line for a large slope triangle.';
      onSelectStep(6);
    } else if (q.includes('seed') || q.includes('apparatus')) {
      reply =
        'Your apparatus tray lists every instrument with its least count (resolution) and the deterministic attempt seed so your teacher can reproduce your exact bench.';
      onSelectStep(2);
    } else {
      reply = `In "${experimentTitle}", focus on taking consistent repeat measurements using the instrument dock, watching the bench indicator closely, and logging at least 5–6 data points.`;
    }

    setCustomReply(reply);
    setQuestion('');
    speakText(reply);
  };

  return (
    <aside
      aria-label="Vix live in-lab guide"
      className="fixed bottom-5 right-5 w-[calc(100%-2.5rem)] max-w-[385px] bg-[#0D1526]/95 backdrop-blur-md border border-[#F97316]/60 rounded-2xl p-5 shadow-[0_24px_60px_rgba(0,0,0,0.75)] space-y-3.5 z-40"
    >
      {/* Top Row: Vix Orb + Title + Language dropdown */}
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
                  className="w-0.5 bg-[#0B1220] rounded-full"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="font-display text-sm font-bold text-white flex items-center gap-1.5">
              <span>Vix · {voice[0]?.toUpperCase() + voice.slice(1)}</span>
              <span className="px-1.5 py-0.5 rounded bg-[#231915] border border-[#9A3412] text-[10px] text-[#FDBA74]">
                LIVE
              </span>
            </div>
            <div className="text-[11px] text-[#4ADE80]">
              Explaining · sees your {activeLab} bench
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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

      {/* Step Counter & Caption */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-[#FDBA74] mb-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {customReply ? 'VIX ANSWER · BENCH CONTEXT' : currentStep.heading}
          </span>
          <span className="font-mono text-[#93A0B8]">
            {stepIdx + 1} / {VIX_TOUR_STEPS.length}
          </span>
        </div>
        <p className="text-xs text-[#E6EBF5] leading-relaxed">{captionText}</p>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-[#1E2A42] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#F97316] transition-all"
          style={{ width: `${((stepIdx + 1) / VIX_TOUR_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Back / Say again / Next buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            setCustomReply(null);
            onSelectStep(stepIdx > 0 ? stepIdx - 1 : VIX_TOUR_STEPS.length - 1);
          }}
          className="py-2 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-white cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => speakText(captionText)}
          className="py-2 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5 text-[#FDBA74]" />
          Say again
        </button>
        <button
          type="button"
          onClick={() => {
            setCustomReply(null);
            onSelectStep((stepIdx + 1) % VIX_TOUR_STEPS.length);
          }}
          className="py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-xs font-bold cursor-pointer"
        >
          Next
        </button>
      </div>

      {/* Ask about a part of the screen chips */}
      <div>
        <div className="text-[11px] text-[#93A0B8] mb-1.5">
          Point Vix at a region of your active bench
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VIX_TOUR_STEPS.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setCustomReply(null);
                onSelectStep(idx);
              }}
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

      {/* Mic + Text Input + End Call */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskQuestion(question);
        }}
        className="flex items-center gap-2"
      >
        <button
          type="button"
          aria-label="Hold to speak to Vix"
          onClick={() => {
            setIsListening(!isListening);
            if (!isListening) {
              handleAskQuestion('How do I avoid parallax error on this bench?');
            }
          }}
          className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
            isListening
              ? 'bg-[#F97316] border-[#FDBA74] text-[#0B1220]'
              : 'bg-[#1C2A47] border-[#3B82F6]/40 text-[#60A5FA]'
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder='Ask Vix: "how do I avoid parallax?"'
          className="flex-1 bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#6B778C] focus:outline-none focus:border-[#F97316]"
        />
        <button
          type="button"
          aria-label="End Vix call"
          onClick={onEndCall}
          className="w-9 h-9 rounded-full bg-[#7F1D1D] hover:bg-[#991B1B] flex items-center justify-center text-white shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
}
