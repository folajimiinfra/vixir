import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { LabLayout } from '../../lab-shell/LabLayout';
import {
  pendulumPeriod,
  pendulumAngle,
} from '../../../../../packages/sim-core/src/index';
import { useLabSessionStore } from '../../store/labSessionStore';

interface PendulumReading {
  id: number;
  lengthCm: number;
  timeS: number;
  oscillations: number;
  periodS: number;
  periodSquared: number;
}

const INITIAL_READINGS: PendulumReading[] = [
  { id: 1, lengthCm: 40.0, timeS: 25.48, oscillations: 20, periodS: 1.274, periodSquared: 1.623 },
  { id: 2, lengthCm: 50.0, timeS: 28.31, oscillations: 20, periodS: 1.416, periodSquared: 2.004 },
  { id: 3, lengthCm: 60.0, timeS: 31.27, oscillations: 20, periodS: 1.564, periodSquared: 2.445 },
];

export function PendulumLab() {
  const navigate = useNavigate();
  const recordPendulumTrial = useLabSessionStore((s) => s.recordPendulumTrial);
  const seed = useLabSessionStore((s) => s.seed);
  const [lengthCm, setLengthCm] = useState(70.0);
  const [releaseAngle, setReleaseAngle] = useState(8);
  const [isSwinging, setIsSwinging] = useState(true);
  const [currentAngle, setCurrentAngle] = useState(7.9);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0.0);
  const [oscCount, setOscCount] = useState(0);
  const [eyeLevel, setEyeLevel] = useState(true);
  const [protractorPlaced, setProtractorPlaced] = useState(false);
  const [activeTab, setActiveTab] = useState<'readings' | 'notebook' | 'assistant'>('readings');
  const [notebookText, setNotebookText] = useState(
    'Length measured from bottom of split cork to centre of brass bob. Timing started as bob passes equilibrium marker.'
  );
  const [readings, setReadings] = useState<PendulumReading[]>(INITIAL_READINGS);
  const [logMsg, setLogMsg] = useState('log > Bench ready. Pendulum released at θ₀ = 8°.');

  const swingStartRef = useRef<number>(performance.now());
  const swStartRef = useRef<number>(0);

  // True physical period T = 2π √(L/g) * (1 + θ₀²/16) via @vixir/sim-core
  const gLocal = 9.81;
  const lengthM = lengthCm / 100;
  const truePeriod = pendulumPeriod(lengthM, gLocal, releaseAngle);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isSwinging || prefersReducedMotion) {
      setCurrentAngle(isSwinging ? releaseAngle : 0);
      return;
    }

    let frameId: number;
    swingStartRef.current = performance.now();

    const animate = (now: number) => {
      const elapsedSec = ((now - swingStartRef.current) / 1000) * speed;
      const theta = pendulumAngle(releaseAngle, truePeriod, elapsedSec, 250);
      setCurrentAngle(theta);

      if (stopwatchRunning) {
        const swElapsed = ((now - swStartRef.current) / 1000) * speed;
        setStopwatchTime(swElapsed);
        setOscCount(Math.floor(swElapsed / truePeriod));
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isSwinging, releaseAngle, truePeriod, speed, stopwatchRunning]);

  const handleToggleStopwatch = () => {
    if (!stopwatchRunning) {
      if (!isSwinging) {
        setIsSwinging(true);
      }
      swStartRef.current = performance.now() - (stopwatchTime * 1000) / speed;
      setStopwatchRunning(true);
      setLogMsg(`log > Stopwatch started at L = ${lengthCm.toFixed(1)} cm.`);
    } else {
      setStopwatchRunning(false);
      setLogMsg(
        `log > Stopwatch stopped — ${stopwatchTime.toFixed(2)} s (${oscCount} oscillations).`
      );
    }
  };

  const handleResetStopwatch = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setOscCount(0);
    setLogMsg('log > Stopwatch reset to 0.00 s.');
  };

  const handleToggleSwing = () => {
    if (isSwinging) {
      setIsSwinging(false);
      setStopwatchRunning(false);
      setCurrentAngle(0);
      setLogMsg('log > Bob stopped at equilibrium position.');
    } else {
      swingStartRef.current = performance.now();
      setIsSwinging(true);
      setLogMsg(`log > Pendulum released at θ₀ = ${releaseAngle}°.`);
    }
  };

  const handleRecordReading = () => {
    const n = oscCount >= 5 ? oscCount : 20;
    const syncedRow = recordPendulumTrial({
      lengthCm,
      theta0Deg: releaseAngle,
      oscillations: n,
      eyeLevel,
      rawStopwatchS: stopwatchTime >= 2 ? stopwatchTime : undefined,
    });

    const recordedL = Number((syncedRow.lengthM * 100).toFixed(1));
    const measuredTime = Number(syncedRow.tMean);
    const T = Number(syncedRow.periodT);
    const T2 = Number(syncedRow.periodT2);

    const nextReading: PendulumReading = {
      id: readings.length + 1,
      lengthCm: recordedL,
      timeS: measuredTime,
      oscillations: n,
      periodS: T,
      periodSquared: T2,
    };

    setReadings((prev) => [...prev, nextReading]);
    setLogMsg(
      `log > [Seed #${seed}] Recorded L = ${recordedL.toFixed(1)} cm, t = ${measuredTime.toFixed(2)} s (${n} osc), T = ${T.toFixed(3)} s.`
    );
  };

  // Bench SVG geometry matching D1-physics-pendulum-bench.svg
  const pivotX = 260;
  const pivotY = 92;
  // Map lengthCm (40..90) to pixel length (160..305)
  const pxLen = 110 + ((lengthCm - 30) / 70) * 210;
  const visualAngleRad = (currentAngle * 1.45 * Math.PI) / 180;
  const bobX = pivotX + pxLen * Math.sin(visualAngleRad);
  const bobY = pivotY + pxLen * Math.cos(visualAngleRad);

  return (
    <LabLayout
      experimentTitle="Simple pendulum — determination of g"
      subtitle="Graded · attempt 1 of 2 · autosaved"
      activeLab="physics"
      mode="graded"
      headerRightExtra={
        <span className="hidden sm:inline-block font-mono text-xs text-[#93A0B8] mr-1">
          Session 18:42
        </span>
      }
      nextStepLabel="Analyse results →"
      onNextStep={() => navigate('/attempt/demo/results')}
      toolRail={[
        { id: 'pointer', label: 'Select / interact', icon: 'pointer', active: true },
        { id: 'ruler', label: 'Measure length', icon: 'ruler' },
        { id: 'zoom', label: 'Inspect scale', icon: 'zoom' },
        { id: 'note', label: 'Lab notes', icon: 'note' },
        { id: 'clock', label: 'Timing log', icon: 'clock' },
      ]}
      toolRailAccent="bg-[#1C2A47] text-[#60A5FA]"
      leftTray={
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2.5">
              APPARATUS · {protractorPlaced ? '7 OF 7' : '6 OF 7'} PLACED
            </div>
            <div className="space-y-2">
              {[
                { name: 'Retort stand', sub: 'with boss & clamp' },
                { name: 'Split cork', sub: 'grips string at pivot' },
                { name: 'String + bob', sub: '≈ 50 g brass bob' },
                { name: 'Metre rule', sub: '0.1 cm divisions' },
                { name: 'Stopwatch', sub: '0.01 s resolution' },
                { name: 'Plumb line', sub: 'marks equilibrium' },
              ].map((item) => (
                <div
                  key={item.name}
                  className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2"
                >
                  <div className="text-xs font-semibold text-[#E6EBF5]">{item.name}</div>
                  <div className="text-[11px] text-[#93A0B8]">{item.sub}</div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setProtractorPlaced(!protractorPlaced);
                  setLogMsg(
                    !protractorPlaced
                      ? 'log > Protractor placed at pivot to check small-angle condition.'
                      : 'log > Protractor returned to tray.'
                  );
                }}
                className={`w-full text-left rounded-xl px-3 py-2 transition-colors ${
                  protractorPlaced
                    ? 'bg-[#121A2B] border border-[#22304A]'
                    : 'border border-dashed border-[#2C3B59] hover:border-[#60A5FA]'
                }`}
              >
                <div className="text-xs font-semibold text-[#C9D3E6]">Protractor</div>
                <div className="text-[11px] text-[#93A0B8]">
                  {protractorPlaced ? 'placed at pivot ✓' : 'drag onto bench'}
                </div>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2A42]">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2">
              CONDITIONS
            </div>
            <div className="font-mono text-[11px] text-[#93A0B8] space-y-1">
              <div>g(local) hidden</div>
              <div>Air drag: on</div>
              <div>Noise: realistic</div>
              <div>Seed: #A7F3-0142</div>
            </div>
          </div>
        </div>
      }
      bottomDock={
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          {/* Sliders card */}
          <div className="md:col-span-5 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#93A0B8]">Clamp height → length L</span>
                <span className="font-mono font-semibold text-[#E6EBF5]">
                  {lengthCm.toFixed(1)} cm
                </span>
              </div>
              <input
                type="range"
                aria-label="Pendulum length L in cm"
                min={40}
                max={90}
                step={5}
                value={lengthCm}
                onChange={(e) => {
                  const nextL = Number(e.target.value);
                  setLengthCm(nextL);
                  setLogMsg(`log > Changed length L → ${nextL.toFixed(1)} cm.`);
                }}
                className="w-full accent-[#F97316] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#93A0B8]">Release angle θ₀</span>
                <span className="font-mono font-semibold text-[#E6EBF5]">{releaseAngle}°</span>
              </div>
              <input
                type="range"
                aria-label="Release angle in degrees"
                min={2}
                max={20}
                step={1}
                value={releaseAngle}
                onChange={(e) => {
                  const nextA = Number(e.target.value);
                  setReleaseAngle(nextA);
                  setLogMsg(
                    nextA > 10
                      ? `log > Warning: θ₀ = ${nextA}° exceeds 10° small-angle approximation.`
                      : `log > Release angle set to θ₀ = ${nextA}°.`
                  );
                }}
                className="w-full accent-[#F97316] cursor-pointer"
              />
            </div>
          </div>

          {/* Stopwatch card */}
          <div className="md:col-span-4 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#93A0B8]">Stopwatch</span>
              <span className="font-mono text-[#93A0B8]">
                osc. passed: <strong className="text-[#E6EBF5]">{oscCount}</strong>
              </span>
            </div>

            <div className="font-mono text-3xl font-semibold text-[#FDBA74] my-1.5">
              {stopwatchTime.toFixed(2)} s
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleToggleStopwatch}
                className="py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] font-semibold text-xs transition-colors cursor-pointer"
              >
                {stopwatchRunning ? 'Stop' : 'Start'}
              </button>
              <button
                type="button"
                onClick={handleResetStopwatch}
                className="py-2 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-[#E6EBF5] font-semibold text-xs transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="md:col-span-3 flex flex-col justify-between gap-2">
            <button
              type="button"
              onClick={handleToggleSwing}
              className="w-full py-2.5 px-3 rounded-xl bg-[#22304A] hover:bg-[#2C3E5E] text-[#E6EBF5] text-xs font-semibold transition-colors cursor-pointer"
            >
              {isSwinging ? 'Stop the bob' : 'Release the bob'}
            </button>

            <button
              type="button"
              onClick={() => {
                setEyeLevel(!eyeLevel);
                setLogMsg(
                  !eyeLevel
                    ? 'log > Eye aligned level with scale (no parallax).'
                    : 'log > Warning: Eye off-level — parallax offset active.'
                );
              }}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                eyeLevel
                  ? 'bg-[#121A2B] border-[#22304A] text-[#E6EBF5]'
                  : 'bg-[#3A2112] border-[#F97316] text-[#FDBA74]'
              }`}
            >
              {eyeLevel ? 'Eye: level with scale' : 'Eye: off-level (parallax)'}
            </button>

            <button
              type="button"
              onClick={handleRecordReading}
              className="w-full py-2.5 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Record reading
            </button>
          </div>
        </div>
      }
      logMessage={logMsg}
      rightPanel={
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-[#1E2A42] text-xs font-semibold">
            {(['readings', 'notebook', 'assistant'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`flex-1 pb-2.5 capitalize transition-colors border-b-2 cursor-pointer ${
                  activeTab === t
                    ? 'border-[#F97316] text-[#E6EBF5]'
                    : 'border-transparent text-[#93A0B8] hover:text-[#E6EBF5]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {activeTab === 'readings' && (
            <>
              {/* Readings Table */}
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1E2A42] text-[#93A0B8] text-[11px]">
                      <th className="py-2 px-2.5 text-left">L/cm</th>
                      <th className="py-2 px-2 text-right">t/s</th>
                      <th className="py-2 px-1.5 text-right">n</th>
                      <th className="py-2 px-2 text-right">T/s</th>
                      <th className="py-2 px-2.5 text-right">T²/s²</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-[#1E2A42]/60 last:border-b-0 text-[#E6EBF5]"
                      >
                        <td className="py-1.5 px-2.5">{r.lengthCm.toFixed(1)}</td>
                        <td className="py-1.5 px-2 text-right">{r.timeS.toFixed(2)}</td>
                        <td className="py-1.5 px-1.5 text-right text-[#93A0B8]">
                          {r.oscillations}
                        </td>
                        <td className="py-1.5 px-2 text-right">{r.periodS.toFixed(3)}</td>
                        <td className="py-1.5 px-2.5 text-right text-[#FDBA74]">
                          {r.periodSquared.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Live preview chart */}
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
                <div className="text-xs text-[#93A0B8] mb-2">Live preview · T² against L</div>
                <svg viewBox="0 0 260 155" className="w-full h-auto">
                  {/* Axes */}
                  <line x1="32" y1="15" x2="32" y2="125" stroke="#3A4A68" strokeWidth="1" />
                  <line x1="32" y1="125" x2="245" y2="125" stroke="#3A4A68" strokeWidth="1" />
                  <text
                    x="138"
                    y="144"
                    fill="#93A0B8"
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    L / m (0.3 – 1.0)
                  </text>
                  <text
                    x="10"
                    y="75"
                    fill="#93A0B8"
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                    transform="rotate(-90 10 75)"
                  >
                    T² / s²
                  </text>

                  {/* Plot points */}
                  {readings.map((r) => {
                    const lM = r.lengthCm / 100;
                    const cx = 32 + ((lM - 0.3) / 0.7) * 205;
                    const cy = 125 - (Math.min(r.periodSquared, 4.0) / 4.0) * 100;
                    return (
                      <circle key={r.id} cx={cx} cy={cy} r="3.5" fill="#FDBA74" />
                    );
                  })}
                </svg>
              </div>
            </>
          )}

          {activeTab === 'notebook' && (
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 space-y-2">
              <label
                htmlFor="pendulum-notes"
                className="block text-xs font-semibold text-[#C9D3E6]"
              >
                Observations &amp; precautions
              </label>
              <textarea
                id="pendulum-notes"
                rows={6}
                value={notebookText}
                onChange={(e) => setNotebookText(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#22304A] rounded-lg p-2.5 text-xs text-[#E6EBF5] focus:outline-none focus:border-[#60A5FA]"
              />
            </div>
          )}

          {activeTab === 'assistant' && (
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#60A5FA]">
                LAB ASSISTANT
              </div>
              <p className="text-xs text-[#C9D3E6] leading-relaxed">
                Why do we time 20 complete oscillations and divide by 20, instead of timing just
                a single swing?
              </p>
            </div>
          )}
        </div>
      }
    >
      {/* Top overlay row inside Bench */}
      <div className="flex items-center justify-between gap-2 z-10">
        <div className="px-3 py-1 rounded-full bg-[#121A2B]/90 border border-[#22304A] text-xs text-[#E6EBF5]">
          {isSwinging
            ? `Swinging · T ≈ ${truePeriod.toFixed(2)} s (hidden in graded mode)`
            : 'Stopped at equilibrium · Ready to release'}
        </div>

        <div className="flex items-center bg-[#121A2B] border border-[#22304A] rounded-lg p-0.5 text-xs font-mono">
          {([1, 2, 5] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                speed === s
                  ? 'bg-[#2563EB] text-white font-semibold'
                  : 'text-[#93A0B8] hover:text-[#E6EBF5]'
              }`}
            >
              ×{s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Pendulum Apparatus SVG (stationed retort stand + metre rule, ONLY string & bob swing) */}
      <div className="flex-1 flex items-center justify-center my-2">
        <svg
          viewBox="0 0 600 440"
          className="w-full max-w-[660px] h-auto max-h-[430px]"
          role="img"
          aria-label={`Simple pendulum bench with length ${lengthCm.toFixed(1)} cm and angle ${currentAngle.toFixed(1)} degrees`}
        >
          <defs>
            <radialGradient id="labBobGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="55%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#9A3412" />
            </radialGradient>
          </defs>

          {/* Bench surface bar */}
          <rect x="60" y="410" width="480" height="12" rx="3" fill="#22304A" />

          {/* Retort stand base */}
          <rect x="90" y="398" width="90" height="14" rx="3" fill="#3A4A68" />
          {/* Retort stand vertical rod */}
          <rect x="128" y="60" width="12" height="340" rx="2" fill="#3A4A68" />
          {/* Horizontal clamp arm */}
          <rect x="134" y="70" width="140" height="10" rx="3" fill="#55688C" />
          {/* Split cork at pivot */}
          <rect x="248" y="72" width="24" height="20" rx="3" fill="#8A6A4A" />

          {/* Vertical equilibrium plumb line */}
          <line
            x1={pivotX}
            y1={pivotY}
            x2={pivotX}
            y2="404"
            stroke="#3A4A68"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />

          {/* Angle protractor arc + live θ readout */}
          <path
            d="M 260 152 A 60 60 0 0 0 320 92"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="1.2"
            opacity="0.7"
          />
          <path
            d="M 200 92 A 60 60 0 0 0 260 152"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="1.2"
            opacity="0.4"
          />
          <text
            x="284"
            y="124"
            fill="#93A0B8"
            fontSize="12"
            fontFamily="JetBrains Mono, monospace"
          >
            θ = {Math.abs(currentAngle).toFixed(1)}°
          </text>

          {/* Swinging Pendulum String */}
          <line
            x1={pivotX}
            y1={pivotY}
            x2={bobX}
            y2={bobY}
            stroke="#E6EBF5"
            strokeWidth="2"
          />

          {/* Swinging Brass Bob */}
          <circle cx={bobX} cy={bobY} r="15" fill="url(#labBobGrad)" />

          {/* Bob shadow on bench */}
          <ellipse cx={bobX} cy="410" rx="12" ry="3" fill="#000" opacity="0.35" />

          {/* Wooden Metre Rule on right */}
          <rect x="450" y="92" width="22" height="316" rx="2" fill="#D9C39A" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => {
            const ty = 92 + tick * 31.6;
            const isMajor = tick % 2 === 0;
            return (
              <line
                key={tick}
                x1="450"
                y1={ty}
                x2={isMajor ? 464 : 458}
                y2={ty}
                stroke="#3F2E1E"
                strokeWidth="1"
              />
            );
          })}

          {/* Eye-level alignment indicator above metre rule */}
          <g transform="translate(470, 62)">
            <circle cx="0" cy="0" r="11" fill="#121A2B" stroke="#3A4A68" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="4" fill={eyeLevel ? '#4ADE80' : '#F97316'} />
          </g>

          {/* Horizontal measurement guide line & readout pill */}
          <line
            x1={bobX - 24}
            y1={bobY}
            x2="472"
            y2={bobY}
            stroke="#F97316"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <rect
            x="478"
            y={bobY - 12}
            width="80"
            height="24"
            rx="6"
            fill="#F97316"
          />
          <text
            x="518"
            y={bobY + 4}
            textAnchor="middle"
            fill="#0B1220"
            fontSize="12"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="700"
          >
            {lengthCm.toFixed(1)} cm
          </text>
        </svg>
      </div>
    </LabLayout>
  );
}
