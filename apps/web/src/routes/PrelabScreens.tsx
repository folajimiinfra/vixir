import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check } from 'lucide-react';

// C1 — Pre-lab safety & readiness check
export function SafetyCheckScreen() {
  const navigate = useNavigate();
  const [ppe, setPpe] = useState({ coat: true, goggles: false, gloves: false });
  const [hazardsRead, setHazardsRead] = useState(false);
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);

  const allPpeOn = ppe.coat && ppe.goggles && ppe.gloves;
  const quizPassed = q1 === 0 && q2 === 1;
  const readyToEnter = allPpeOn && hazardsRead && quizPassed;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726]">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#E3E8EF]">
        <div className="max-w-[1140px] mx-auto px-6 h-14 flex items-center justify-between text-xs">
          <Link to="/labs" className="font-semibold text-[#2448D8] hover:underline">
            ← Labs
          </Link>
          <span className="text-[#475467]">
            Chemistry · Acid–base titration · before you enter the lab
          </span>
        </div>
      </header>

      <main className="max-w-[1140px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-5">
            <h1 className="font-display text-3xl font-bold text-[#0E1726]">
              Safety &amp; readiness check
            </h1>

            {/* 1. Protective Equipment */}
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
              <h2 className="font-display text-base font-bold text-[#0E1726] mb-4">
                1 · Put on your protective equipment
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'coat' as const, label: 'Lab coat' },
                  { key: 'goggles' as const, label: 'Safety goggles' },
                  { key: 'gloves' as const, label: 'Gloves' },
                ].map((item) => {
                  const isOn = ppe[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setPpe((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                      }
                      className={`text-left rounded-xl p-4 transition-all cursor-pointer ${
                        isOn
                          ? 'bg-[#E6F6EE] border-2 border-[#0F7B45] text-[#0F7B45]'
                          : 'bg-white border border-dashed border-[#D0D7E2] text-[#0E1726] hover:border-[#2448D8]'
                      }`}
                    >
                      <div className="text-sm font-bold">{item.label}</div>
                      <div className="text-xs mt-0.5 text-[#475467]">
                        {isOn ? <span className="text-[#0F7B45] font-medium">On ✓</span> : 'Tap to put on'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. Know your hazards */}
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
              <h2 className="font-display text-base font-bold text-[#0E1726] mb-4">
                2 · Know your hazards
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="bg-[#FEF5EE] border border-[#F9D7C4] rounded-xl p-4">
                  <div className="text-sm font-bold text-[#9A3412] mb-1">
                    Hydrochloric acid (A)
                  </div>
                  <p className="text-xs text-[#9A3412] leading-relaxed">
                    Irritant to skin and eyes. Rinse spills with plenty of water.
                  </p>
                </div>
                <div className="bg-[#FEF5EE] border border-[#F9D7C4] rounded-xl p-4">
                  <div className="text-sm font-bold text-[#9A3412] mb-1">
                    Sodium hydroxide (B)
                  </div>
                  <p className="text-xs text-[#9A3412] leading-relaxed">
                    Corrosive. Never pipette by mouth — use the pipette filler.
                  </p>
                </div>
              </div>

              <label className="inline-flex items-center gap-2.5 text-xs font-medium text-[#0E1726] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hazardsRead}
                  onChange={(e) => setHazardsRead(e.target.checked)}
                  className="rounded border-[#D0D7E2] text-[#2448D8] focus:ring-[#2448D8]"
                />
                <span>I have read the hazards and know where the eye-wash station is.</span>
              </label>
            </section>

            {/* 3. Quick check */}
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-5">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                3 · Quick check
              </h2>

              <div className="space-y-2">
                <div className="text-xs font-bold text-[#0E1726]">
                  1. Why do you rinse the burette with acid A, not water, before filling it?
                </div>
                {[
                  'So water does not dilute the acid',
                  'To clean off the indicator',
                  'To cool the burette',
                ].map((opt, idx) => {
                  const selected = q1 === idx;
                  const correct = idx === 0;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setQ1(idx)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        selected && correct
                          ? 'bg-[#E6F6EE] border-2 border-[#0F7B45] text-[#0F7B45] font-semibold'
                          : selected
                            ? 'bg-[#FEECEB] border-2 border-[#C4321C] text-[#C4321C]'
                            : 'bg-white border border-[#E3E8EF] text-[#0E1726] hover:bg-[#F5F7FA]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
                {q1 === 0 && (
                  <div className="px-3.5 py-2 rounded-lg bg-[#E6F6EE] text-[#0F7B45] text-xs font-medium">
                    Correct — leftover water would dilute A and make the titre too large.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-[#0E1726]">
                  2. Where do you read the burette?
                </div>
                {[
                  'Top of the meniscus',
                  'Bottom of the meniscus, eye level',
                  'Wherever is clearest',
                ].map((opt, idx) => {
                  const selected = q2 === idx;
                  const correct = idx === 1;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setQ2(idx)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        selected && correct
                          ? 'bg-[#E6F6EE] border-2 border-[#0F7B45] text-[#0F7B45] font-semibold'
                          : selected
                            ? 'bg-[#FEECEB] border-2 border-[#C4321C] text-[#C4321C]'
                            : 'bg-white border border-[#E3E8EF] text-[#0E1726] hover:bg-[#F5F7FA]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
                {q2 === 1 && (
                  <div className="px-3.5 py-2 rounded-lg bg-[#E6F6EE] text-[#0F7B45] text-xs font-medium">
                    Correct — bottom of the meniscus, with your eye level to avoid parallax.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Summary Card */}
          <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-4 sticky top-6">
            <h2 className="font-display text-base font-bold text-[#0E1726]">
              Ready to enter?
            </h2>

            <ul className="space-y-2.5 text-xs">
              {[
                { done: allPpeOn, label: 'Protective equipment on' },
                { done: hazardsRead, label: 'Hazards acknowledged' },
                { done: quizPassed, label: 'Quick check passed' },
              ].map((step) => (
                <li key={step.label} className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      step.done
                        ? 'bg-[#0F7B45] text-white'
                        : 'border-2 border-[#D0D7E2] text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="text-[#0E1726] font-medium">{step.label}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={!readyToEnter}
              onClick={() => navigate('/lab/chemistry/titration')}
              className={`w-full py-3 rounded-xl text-xs font-semibold transition-colors ${
                readyToEnter
                  ? 'bg-[#2448D8] hover:bg-[#1B38B0] text-white cursor-pointer'
                  : 'bg-[#E3E8EF] text-[#6B778C] cursor-not-allowed'
              }`}
            >
              {readyToEnter ? 'Enter the chemistry lab' : 'Complete all steps to enter'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/lab/vix/connect')}
              className="w-full py-3 rounded-xl bg-[#FEF5EE] hover:bg-[#FDECE3] text-[#9A3412] text-xs font-bold transition-colors cursor-pointer"
            >
              Ask Vix about safety
            </button>

            <p className="text-[11px] text-[#6B778C] leading-relaxed">
              Your teacher sees that you completed this check. In the lab, skipping PPE stops the
              experiment.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

// C2 — Apparatus Setup Screen
const SETUP_ITEMS = [
  { id: 'stopwatch', name: 'Stopwatch', sub: 'in your hand' },
  { id: 'string-bob', name: 'String + bob', sub: 'clamped through the cork' },
  { id: 'plumb-line', name: 'Plumb line', sub: 'marks the equilibrium position' },
  { id: 'retort-stand', name: 'Retort stand', sub: 'rigid vertical support' },
  { id: 'split-cork', name: 'Split cork', sub: 'grips the string at the pivot' },
  { id: 'metre-rule', name: 'Metre rule', sub: 'measures length to bob centre' },
  { id: 'boss-clamp', name: 'Boss & clamp', sub: 'holds split cork on stand' },
] as const;

const CHECKLIST_ORDER = [
  { id: 'retort-stand', label: 'Retort stand' },
  { id: 'boss-clamp', label: 'Boss & clamp' },
  { id: 'split-cork', label: 'Split cork' },
  { id: 'string-bob', label: 'String + bob' },
  { id: 'metre-rule', label: 'Metre rule' },
  { id: 'plumb-line', label: 'Plumb line' },
  { id: 'stopwatch', label: 'Stopwatch' },
] as const;

export function ApparatusSetupScreen() {
  const navigate = useNavigate();
  const [placed, setPlaced] = useState<string[]>(['retort-stand', 'boss-clamp']);
  const [log, setLog] = useState('log > Retort stand placed. Boss and clamp attached.');

  const allPlaced = CHECKLIST_ORDER.every((item) => placed.includes(item.id));
  const itemsLeft = CHECKLIST_ORDER.length - placed.length;

  const handleToggleItem = (id: string, name: string) => {
    if (placed.includes(id)) return;
    const next = [...placed, id];
    setPlaced(next);
    setLog(`log > ${name} placed on the bench.`);
  };

  const handlePlaceAll = () => {
    setPlaced(CHECKLIST_ORDER.map((i) => i.id));
    setLog('log > All apparatus in place. String clamped firmly in split cork.');
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E6EBF5] flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#0B1220] border-b border-[#1E2A42] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-base font-bold text-[#E6EBF5]">
            Simple pendulum · Step 1 of 4: Set up the apparatus
          </h1>
          <p className="text-xs text-[#93A0B8]">
            Click items in the tray to place them on the bench, in a sensible order
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3.5 py-1.5 rounded-full bg-[#F97316] text-[#0B1220]">
            1 Set up
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-[#121A2B] border border-[#22304A] text-[#93A0B8]">
            2 Readings
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-[#121A2B] border border-[#22304A] text-[#93A0B8]">
            3 Graph
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-[#121A2B] border border-[#22304A] text-[#93A0B8]">
            4 Report
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/lab/vix/connect')}
          className="px-3.5 py-1.5 rounded-full bg-[#231915] border border-[#9A3412] text-[#FDBA74] text-xs font-semibold cursor-pointer"
        >
          Ask Vix
        </button>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] min-h-0">
        {/* Left Tray */}
        <aside className="bg-[#0B1220] border-r border-[#1E2A42] p-4 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-3">
              <span>TRAY · {itemsLeft} ITEMS LEFT</span>
              {!allPlaced && (
                <button
                  type="button"
                  onClick={handlePlaceAll}
                  className="text-[#60A5FA] hover:underline lowercase font-normal cursor-pointer"
                >
                  place all
                </button>
              )}
            </div>

            <div className="space-y-2">
              {SETUP_ITEMS.map((item) => {
                const isPlaced = placed.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleItem(item.id, item.name)}
                    className={`w-full text-left rounded-xl px-3.5 py-2.5 border transition-colors cursor-pointer ${
                      isPlaced
                        ? 'bg-[#122D1F] border-[#166534] text-[#4ADE80]'
                        : 'bg-[#121A2B] border-[#22304A] hover:border-[#60A5FA] text-[#E6EBF5]'
                    }`}
                  >
                    <div className="text-xs font-semibold">{item.name}</div>
                    <div className="text-[11px] text-[#93A0B8]">
                      {isPlaced ? (
                        <span className="text-[#4ADE80]">on the bench ✓</span>
                      ) : (
                        item.sub
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPlaced([]);
              setLog('log > Bench cleared.');
            }}
            className="w-full py-2.5 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] cursor-pointer"
          >
            Clear the bench
          </button>
        </aside>

        {/* Center Bench */}
        <div className="flex flex-col">
          <div className="flex-1 lab-grid-bg p-6 flex flex-col items-center justify-between">
            <div
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${
                allPlaced
                  ? 'bg-[#122D1F] border-[#166534] text-[#4ADE80]'
                  : 'bg-[#121A2B] border-[#22304A] text-[#E6EBF5]'
              }`}
            >
              {allPlaced
                ? 'All apparatus in place. Check the string is clamped firmly.'
                : 'Next: what should go on the bench now?'}
            </div>

            <svg viewBox="0 0 600 420" className="w-full max-w-[580px] h-auto">
              {/* Bench base */}
              <rect x="80" y="380" width="440" height="12" rx="3" fill="#22304A" />

              {placed.includes('retort-stand') && (
                <>
                  <rect x="108" y="368" width="90" height="14" rx="3" fill="#3A4A68" />
                  <rect x="142" y="70" width="12" height="300" rx="2" fill="#3A4A68" />
                </>
              )}

              {placed.includes('boss-clamp') && (
                <>
                  <rect x="138" y="84" width="22" height="16" rx="3" fill="#64748B" />
                  <rect x="154" y="88" width="156" height="9" rx="3" fill="#55688C" />
                </>
              )}

              {placed.includes('split-cork') && (
                <rect x="286" y="96" width="22" height="14" rx="3" fill="#8A6A4A" />
              )}

              {placed.includes('string-bob') && (
                <>
                  <line x1="297" y1="110" x2="297" y2="295" stroke="#E6EBF5" strokeWidth="2" />
                  <circle cx="297" cy="305" r="13" fill="#F97316" />
                </>
              )}

              {placed.includes('plumb-line') && (
                <>
                  <line
                    x1="360"
                    y1="110"
                    x2="360"
                    y2="365"
                    stroke="#5EEAD4"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <polygon points="355,365 365,365 360,376" fill="#5EEAD4" />
                </>
              )}

              {placed.includes('metre-rule') && (
                <rect x="435" y="110" width="18" height="270" rx="2" fill="#D9C39A" />
              )}

              {placed.includes('stopwatch') && (
                <g transform="translate(96, 326)">
                  <rect
                    x="0"
                    y="0"
                    width="30"
                    height="36"
                    rx="6"
                    fill="#121A2B"
                    stroke="#93A0B8"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="15"
                    cy="18"
                    r="9"
                    fill="none"
                    stroke="#FDBA74"
                    strokeWidth="1.8"
                  />
                </g>
              )}
            </svg>
          </div>

          <div className="bg-[#090E1A] border-t border-[#1E2A42] px-4 py-2 font-mono text-xs text-[#93A0B8]">
            {log}
          </div>
        </div>

        {/* Right Checklist */}
        <aside className="bg-[#0B1220] border-l border-[#1E2A42] p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <h2 className="font-display text-sm font-bold text-[#E6EBF5]">
              Setup checklist
            </h2>
            <ul className="space-y-2.5 text-xs">
              {CHECKLIST_ORDER.map((item) => {
                const done = placed.includes(item.id);
                return (
                  <li key={item.id} className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        done
                          ? 'bg-[#22C55E] text-[#0B1220]'
                          : 'border border-[#3A4A68] text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                    <span className={done ? 'text-[#E6EBF5]' : 'text-[#93A0B8]'}>
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 text-xs text-[#93A0B8] leading-relaxed">
              Setup is marked: the order you assemble things and any unsafe step (like hanging
              the bob before the clamp is tight) are recorded in your bench replay.
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/lab/physics/pendulum')}
            className="w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Setup complete — take readings →
          </button>
        </aside>
      </div>
    </div>
  );
}

// C3 — Exam Mode Start Screen
export function ExamStartScreen() {
  const navigate = useNavigate();
  const [checks, setChecks] = useState([true, true, false, false]);
  const [candidateNumber, setCandidateNumber] = useState('2026/KCL/0142');
  const [started, setStarted] = useState(false);

  const allConfirmed = checks.every(Boolean) && candidateNumber.trim().length > 0;

  if (started) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-[#E6EBF5] flex flex-col items-center justify-center p-6 text-center">
        <div className="font-mono text-6xl sm:text-7xl font-semibold text-[#FDBA74] mb-4">
          44:59
        </div>
        <p className="text-sm text-[#C9D3E6] mb-6">The exam has started.</p>
        <button
          type="button"
          onClick={() => navigate('/lab/physics/pendulum')}
          className="px-6 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-sm font-bold transition-colors cursor-pointer"
        >
          Go to the bench
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E6EBF5] flex items-center justify-center p-6">
      <div className="max-w-[980px] w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Exam Info */}
        <div className="lg:col-span-7 space-y-6">
          <span className="inline-block px-3 py-1 rounded-full bg-[#3B1219] text-[#FCA5A5] text-[11px] font-bold tracking-wider uppercase">
            EXAM MODE · SS3 MOCK PRACTICAL
          </span>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
            Physics Practical — Question 1: Simple pendulum
          </h1>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-4">
              <div className="text-xs text-[#93A0B8] mb-1">Time allowed</div>
              <div className="font-mono text-2xl font-semibold text-white">45:00</div>
            </div>
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-4">
              <div className="text-xs text-[#93A0B8] mb-1">Marks</div>
              <div className="font-mono text-2xl font-semibold text-white">20</div>
            </div>
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-4">
              <div className="text-xs text-[#93A0B8] mb-1">Attempts</div>
              <div className="font-mono text-2xl font-semibold text-white">1</div>
            </div>
          </div>

          <div className="bg-[#121A2B] border border-[#22304A] rounded-2xl p-6 space-y-3">
            <h2 className="font-display text-base font-bold text-white">In exam mode</h2>
            <ul className="space-y-2.5 text-xs text-[#C9D3E6] list-disc list-inside leading-relaxed">
              <li>
                Vix and all hints are switched off. Digital readouts are hidden — read the
                instruments.
              </li>
              <li>
                The lab runs full screen. Leaving the tab is logged and shown to your
                invigilator.
              </li>
              <li>
                Your bench is saved every 10 seconds. If the power goes, sign in again to
                continue.
              </li>
              <li>
                Your apparatus has its own hidden values — your data will differ from your
                neighbour’s.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Confirmation Card */}
        <div className="lg:col-span-5 bg-[#121A2B] border border-[#22304A] rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-white">Before you start</h2>

          <div className="space-y-2.5">
            {[
              'My device is charged or plugged in',
              'I am in my assigned seat',
              'I have paper and pen for rough work',
              'I will not open other tabs or apps',
            ].map((text, idx) => {
              const checked = checks[idx];
              return (
                <button
                  key={text}
                  type="button"
                  onClick={() =>
                    setChecks((prev) => prev.map((c, i) => (i === idx ? !c : c)))
                  }
                  className="w-full text-left px-3.5 py-3 rounded-xl bg-[#0B1220] border border-[#22304A] hover:border-[#3A4A68] flex items-center gap-3 text-xs text-[#E6EBF5] cursor-pointer"
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      checked
                        ? 'bg-[#F97316] text-[#0B1220]'
                        : 'border border-[#3A4A68] text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>{text}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label
              htmlFor="candidate-num"
              className="block text-xs text-[#93A0B8] mb-1.5"
            >
              Candidate number
            </label>
            <input
              id="candidate-num"
              type="text"
              value={candidateNumber}
              onChange={(e) => setCandidateNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1220] border border-[#22304A] font-mono text-xs text-white"
            />
          </div>

          <button
            type="button"
            disabled={!allConfirmed}
            onClick={() => setStarted(true)}
            className={`w-full py-3 rounded-xl text-xs font-bold transition-colors ${
              allConfirmed
                ? 'bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] cursor-pointer'
                : 'bg-[#1E2A42] text-[#93A0B8] cursor-not-allowed'
            }`}
          >
            {allConfirmed ? 'Start timed exam now' : 'Confirm all four to start'}
          </button>

          <p className="text-[11px] text-[#93A0B8]">
            Invigilator: Mr. K. Bello · Room Physics Lab 2
          </p>
        </div>
      </div>
    </div>
  );
}
