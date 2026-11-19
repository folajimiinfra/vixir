import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mic, X } from 'lucide-react';

// E1 — Vix Connect Screen
export function VixConnectScreen() {
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [screenOn, setScreenOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [voice, setVoice] = useState<'ada' | 'tunde' | 'grace'>('ada');
  const [connected, setConnected] = useState(false);

  return (
    <div className="min-h-screen bg-[#070B14] text-[#E6EBF5] flex items-center justify-center p-6">
      <div className="max-w-[920px] w-full bg-[#0B1220] border border-[#1E2A42] rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
        {/* Left Orb & Connection Steps */}
        <div className="md:col-span-5 p-8 sm:p-10 border-b md:border-b-0 md:border-r border-[#1E2A42] flex flex-col items-center justify-center text-center">
          {/* Glowing Vix Orb */}
          <div className="relative mb-6">
            <div
              className={`w-40 h-40 rounded-full flex items-center justify-center border ${
                connected
                  ? 'border-[#F97316]/60 shadow-[0_0_50px_rgba(249,115,22,0.45)]'
                  : 'border-[#22304A]'
              }`}
            >
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center"
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
                        className="w-1.5 rounded-full bg-[#0B1220]"
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

          <h1 className="font-display text-2xl font-bold text-white mb-2">Vix</h1>
          <p className="text-xs text-[#93A0B8] leading-relaxed max-w-[260px] mb-6">
            Your lab guide. Vix can see your lab screen, explain any part of it, and talk you
            through the practical.
          </p>

          <ul className="space-y-2 text-xs text-left w-full max-w-[210px]">
            {[
              'Joining secure room',
              'Sharing lab screen',
              'Vix is reading your bench',
              'Connected',
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
        </div>

        {/* Right Permissions & Voice Selection */}
        <div className="md:col-span-7 p-8 sm:p-10 space-y-5">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-1">
              BEFORE YOU CALL
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              What can Vix use?
            </h2>
          </div>

          <div className="space-y-3">
            {/* Microphone Toggle */}
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-4 flex items-center justify-between gap-4">
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

            {/* See my lab screen Toggle */}
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">See my lab screen</div>
                <div className="text-xs text-[#93A0B8] mt-0.5">
                  Vix reads the bench, instruments and panels so it can point at things.
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

            {/* Camera Toggle */}
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">Camera</div>
                <div className="text-xs text-[#93A0B8] mt-0.5">
                  Optional — show Vix real apparatus or your written work.
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

          {/* Voice Selection */}
          <div>
            <div className="text-xs font-bold text-white mb-2">Voice</div>
            <div className="grid grid-cols-3 gap-2.5">
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
                    className={`text-left rounded-xl p-3 border transition-colors cursor-pointer ${
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

          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 text-xs text-[#93A0B8] leading-relaxed">
            Vix only sees the Vixir lab, never other tabs or apps. In graded and exam attempts
            Vix explains the screen but won’t give readings or answers. Calls are not recorded
            unless your school turns that on.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate('/lab/physics/pendulum')}
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
                Call Vix
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/lab/vix/tour')}
                className="sm:col-span-8 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-xs font-bold transition-colors cursor-pointer"
              >
                Open the lab with Vix →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// E2 — Vix Spotlight Tour Screen
type TourRegionId =
  | 'top-bar'
  | 'tools'
  | 'apparatus'
  | 'bench'
  | 'instruments'
  | 'log'
  | 'data';

const TOUR_STEPS: {
  id: TourRegionId;
  chip: string;
  heading: string;
  caption: string;
}[] = [
  {
    id: 'top-bar',
    chip: 'Top bar',
    heading: 'POINTING AT · TOP BAR',
    caption:
      'At the top you can see which experiment and attempt you are in, switch between the five laboratories, or move to Analyse results once your readings are complete.',
  },
  {
    id: 'tools',
    chip: 'Tools',
    heading: 'POINTING AT · BENCH TOOLS',
    caption:
      'The left tool rail lets you switch between pointer mode, ruler alignment, scale magnification and your lab notebook.',
  },
  {
    id: 'apparatus',
    chip: 'Apparatus',
    heading: 'POINTING AT · APPARATUS TRAY',
    caption:
      'Every piece of equipment on your bench is listed here with its resolution, along with the current simulation seed and conditions.',
  },
  {
    id: 'bench',
    chip: 'Bench',
    heading: 'POINTING AT · LAB BENCH',
    caption:
      'This is your bench. The orange ball is the bob — it swings from the split cork. The scale on the right is the metre rule you read the length from. Keep your eye level with it.',
  },
  {
    id: 'instruments',
    chip: 'Instruments',
    heading: 'POINTING AT · INSTRUMENT DOCK',
    caption:
      'Use these sliders to change length L and release angle θ₀, start and stop the 0.01 s stopwatch, and record each trial into your table.',
  },
  {
    id: 'log',
    chip: 'Log',
    heading: 'POINTING AT · EVENT LOG',
    caption:
      'Every adjustment and reading is timestamped in the log strip below the bench so your teacher can replay your practical technique.',
  },
  {
    id: 'data',
    chip: 'Data',
    heading: 'POINTING AT · DATA PANEL',
    caption:
      'Your recorded readings and a live preview of T² against L appear on the right as you work.',
  },
];

export function VixTourScreen() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(3); // Default step 4 / 7: Bench (matching E2-vix-tour.png)
  const [question, setQuestion] = useState('');
  const [lang, setLang] = useState('English');

  const currentStep = TOUR_STEPS[stepIdx] ?? TOUR_STEPS[3]!;

  return (
    <div className="min-h-screen bg-[#070B14] text-[#E6EBF5] flex flex-col relative overflow-hidden">
      {/* Dimmed Lab Header */}
      <header
        className={`border-b border-[#1E2A42] px-4 py-2.5 flex items-center justify-between transition-opacity ${
          currentStep.id === 'top-bar' ? 'opacity-100 ring-2 ring-[#FDBA74]' : 'opacity-30'
        }`}
      >
        <div>
          <div className="font-display text-sm font-bold text-[#E6EBF5]">
            Simple pendulum — determination of g
          </div>
          <div className="text-xs text-[#93A0B8]">Graded · attempt 1 of 2</div>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs text-[#93A0B8] bg-[#121A2B] border border-[#22304A] rounded-full px-4 py-1.5">
          <span>Physics</span>
          <span>Chemistry</span>
          <span>Electronics</span>
          <span>Engineering</span>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-[#121A2B] border border-[#22304A] text-xs text-[#93A0B8] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F97316]" />
          Vix is on
        </div>
      </header>

      {/* Main Layout with Spotlight on Active Region */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr_320px] min-h-0">
        {/* Left Apparatus column */}
        <div
          className={`border-r border-[#1E2A42] p-4 space-y-2.5 transition-opacity ${
            currentStep.id === 'apparatus' || currentStep.id === 'tools'
              ? 'opacity-100 ring-2 ring-[#FDBA74]'
              : 'opacity-25'
          }`}
        >
          <div className="text-[11px] font-bold uppercase text-[#93A0B8]">APPARATUS</div>
          {['Retort stand', 'Split cork', 'String + bob', 'Metre rule', 'Stopwatch'].map(
            (name) => (
              <div
                key={name}
                className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2.5 text-xs text-[#C9D3E6]"
              >
                {name}
              </div>
            )
          )}
        </div>

        {/* Center Bench with glowing Spotlight frame */}
        <div className="flex flex-col p-3">
          <div
            className={`flex-1 lab-grid-bg rounded-xl flex items-center justify-center relative transition-all ${
              currentStep.id === 'bench'
                ? 'border-2 border-[#FDBA74] shadow-[0_0_40px_rgba(249,115,22,0.35)] opacity-100'
                : 'border border-[#1E2A42] opacity-35'
            }`}
          >
            <svg viewBox="0 0 600 420" className="w-full max-w-[560px] h-auto">
              <rect x="100" y="360" width="380" height="10" rx="3" fill="#3A4A68" />
              <rect x="155" y="70" width="10" height="290" fill="#3A4A68" />
              <rect x="155" y="76" width="150" height="9" rx="2" fill="#55688C" />

              {/* Pendulum string & bob */}
              <line x1="295" y1="90" x2="322" y2="305" stroke="#E6EBF5" strokeWidth="2" />
              <circle cx="322" cy="308" r="13" fill="#F97316" />

              {/* Metre rule */}
              <rect x="415" y="96" width="16" height="264" rx="2" fill="#D9C39A" />

              {/* Vix visual pointers on the bob & scale */}
              <circle
                cx="322"
                cy="308"
                r="26"
                fill="none"
                stroke="#FDBA74"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              <line
                x1="342"
                y1="288"
                x2="365"
                y2="258"
                stroke="#FDBA74"
                strokeWidth="2"
              />
              <rect x="360" y="236" width="90" height="24" rx="6" fill="#FDBA74" />
              <text
                x="405"
                y="252"
                textAnchor="middle"
                fill="#0B1220"
                fontSize="12"
                fontWeight="700"
              >
                the bob
              </text>

              <circle
                cx="423"
                cy="308"
                r="18"
                fill="none"
                stroke="#FDBA74"
                strokeWidth="1.8"
                strokeDasharray="4 4"
              />
            </svg>
          </div>

          {/* Dimmed Bottom Dock & Log */}
          <div
            className={`mt-3 grid grid-cols-3 gap-3 transition-opacity ${
              currentStep.id === 'instruments'
                ? 'opacity-100 ring-2 ring-[#FDBA74] rounded-xl p-2'
                : 'opacity-25'
            }`}
          >
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 text-xs text-[#93A0B8]">
              Length L · release angle θ₀ sliders
            </div>
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 text-xs text-[#93A0B8]">
              <div>Stopwatch</div>
              <div className="font-mono text-2xl mt-1">00.00 s</div>
            </div>
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 text-xs text-[#93A0B8]">
              Release · Eye level · Record
            </div>
          </div>

          <div
            className={`mt-2 font-mono text-xs text-[#93A0B8] px-2 py-1 transition-opacity ${
              currentStep.id === 'log' ? 'opacity-100 text-[#FDBA74]' : 'opacity-30'
            }`}
          >
            log &gt; Bench ready. Pendulum released at θ₀ = 8°.
          </div>
        </div>

        {/* Right Data Panel (dimmed behind Vix floating card) */}
        <div
          className={`border-l border-[#1E2A42] p-4 transition-opacity ${
            currentStep.id === 'data' ? 'opacity-100 ring-2 ring-[#FDBA74]' : 'opacity-25'
          }`}
        >
          <div className="flex gap-4 text-xs text-[#93A0B8] mb-3">
            <span>Readings</span>
            <span>Notebook</span>
            <span>Assistant</span>
          </div>
          <div className="h-32 bg-[#121A2B] border border-[#22304A] rounded-xl mb-3" />
          <div className="h-36 bg-[#121A2B] border border-[#22304A] rounded-xl" />
        </div>
      </div>

      {/* Floating Vix Lab Guide Card (bottom-right, matching E2-vix-tour.png) */}
      <aside
        aria-label="Vix lab guide"
        className="fixed bottom-5 right-5 w-[calc(100%-2.5rem)] max-w-[380px] bg-[#0D1526] border border-[#22304A] rounded-2xl p-5 shadow-[0_24px_60px_rgba(0,0,0,0.65)] space-y-4 z-30"
      >
        {/* Top Row: Vix Orb + Title + Language dropdown */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
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
              <div className="font-display text-sm font-bold text-white">
                Vix · lab guide
              </div>
              <div className="text-[11px] text-[#4ADE80]">Explaining · sees your bench</div>
            </div>
          </div>

          <select
            aria-label="Vix language"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-[#121A2B] border border-[#22304A] rounded-lg px-2.5 py-1 text-xs text-[#E6EBF5]"
          >
            <option value="English">English</option>
            <option value="Pidgin">Pidgin</option>
            <option value="Yoruba">Yorùbá</option>
            <option value="Hausa">Hausa</option>
            <option value="Igbo">Igbo</option>
          </select>
        </div>

        {/* Step Counter & Caption */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-[#FDBA74] mb-1.5">
            <span>{currentStep.heading}</span>
            <span className="font-mono text-[#93A0B8]">
              {stepIdx + 1} / {TOUR_STEPS.length}
            </span>
          </div>
          <p className="text-xs text-[#E6EBF5] leading-relaxed">{currentStep.caption}</p>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-[#1E2A42] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#F97316] transition-all"
            style={{ width: `${((stepIdx + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Back / Say again / Next buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() =>
              setStepIdx((prev) => (prev > 0 ? prev - 1 : TOUR_STEPS.length - 1))
            }
            className="py-2 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-white cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(
                  new SpeechSynthesisUtterance(currentStep.caption)
                );
              }
            }}
            className="py-2 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-white cursor-pointer"
          >
            Say again
          </button>
          <button
            type="button"
            onClick={() => setStepIdx((prev) => (prev + 1) % TOUR_STEPS.length)}
            className="py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-xs font-bold cursor-pointer"
          >
            Next
          </button>
        </div>

        {/* Ask about a part of the screen chips */}
        <div>
          <div className="text-[11px] text-[#93A0B8] mb-2">
            Ask about a part of the screen
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOUR_STEPS.map((st, idx) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStepIdx(idx)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  stepIdx === idx
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Hold to speak to Vix"
            className="w-9 h-9 rounded-full bg-[#1C2A47] border border-[#3B82F6]/40 flex items-center justify-center text-[#60A5FA] shrink-0 cursor-pointer"
          >
            <Mic className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='Or type: "what is this orange ball?"'
            className="flex-1 bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#6B778C] focus:outline-none focus:border-[#F97316]"
          />
          <button
            type="button"
            aria-label="End Vix call"
            onClick={() => navigate('/lab/physics/pendulum')}
            className="w-9 h-9 rounded-full bg-[#7F1D1D] hover:bg-[#991B1B] flex items-center justify-center text-white shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-[#6B778C] leading-snug">
          Graded mode: Vix explains the screen and asks questions — it never gives readings or
          answers.
        </p>
      </aside>
    </div>
  );
}
