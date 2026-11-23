import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { LabLayout } from '../../lab-shell/LabLayout';

type TapSetting = 'closed' | 'dropwise' | 'slow' | 'fast';

interface TitreRow {
  id: number;
  label: string;
  initial: number;
  final: number;
  titre: number;
  concordant?: boolean;
}

const INITIAL_TITRATIONS: TitreRow[] = [
  { id: 1, label: 'Rough', initial: 0.0, final: 24.65, titre: 24.65, concordant: false },
  { id: 2, label: '1st', initial: 0.2, final: 24.4, titre: 24.2, concordant: true },
];

export function TitrationLab() {
  const navigate = useNavigate();
  const [initialReading, setInitialReading] = useState(0.4);
  const [buretteReading, setBuretteReading] = useState(19.0);
  const [tapSetting, setTapSetting] = useState<TapSetting>('closed');
  const [indicator, setIndicator] = useState<'Phenolphthalein' | 'Methyl orange'>('Phenolphthalein');
  const [swirled, setSwirled] = useState(true);
  const [titrations, setTitrations] = useState<TitreRow[]>(INITIAL_TITRATIONS);
  const [logMsg, setLogMsg] = useState(
    'log > Flask 3 prepared: 25.0 cm³ of B + 2 drops phenolphthalein.'
  );

  const lastTickRef = useRef<number>(0);

  // Equivalence volume = 24.20 cm³ (gives titre = 24.20 cm³, so final reading = 24.60 cm³ when initial = 0.40)
  const equivalenceTitre = 24.2;
  const volumeDelivered = Math.max(0, buretteReading - initialReading);

  const flowRates: Record<TapSetting, number> = {
    closed: 0,
    dropwise: 0.08,
    slow: 0.45,
    fast: 1.6,
  };

  const calculatePH = (volAdded: number): number => {
    const diff = equivalenceTitre - volAdded;
    if (diff > 0.05) {
      return Math.min(13.0, Math.max(8.3, 11.2 + Math.log10(diff / 10)));
    }
    if (Math.abs(diff) <= 0.05) {
      return 7.0;
    }
    return Math.max(1.4, 3.2 - Math.log10(-diff + 0.1));
  };

  const pH = calculatePH(volumeDelivered);

  useEffect(() => {
    if (tapSetting === 'closed' || buretteReading >= 50) {
      lastTickRef.current = 0;
      return;
    }

    let frameId: number;
    const step = (now: number) => {
      if (!lastTickRef.current) lastTickRef.current = now;
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setBuretteReading((prev) => {
        const next = Math.min(50.0, prev + flowRates[tapSetting] * dt);
        return next;
      });
      if (dt > 0) setSwirled(false);

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [tapSetting, buretteReading]);

  const handleSetTap = (nextTap: TapSetting) => {
    setTapSetting(nextTap);
    setLogMsg(
      nextTap === 'closed'
        ? `log > Tap closed at ${buretteReading.toFixed(2)} cm³.`
        : `log > Tap set to ${nextTap} (${flowRates[nextTap]} cm³ s⁻¹).`
    );
  };

  const handleSwirl = () => {
    setSwirled(true);
    setLogMsg('log > Conical flask swirled — indicator colour uniform.');
  };

  const handleRefillAndNewFlask = () => {
    setTapSetting('closed');
    setInitialReading(0.0);
    setBuretteReading(0.0);
    setSwirled(true);
    setLogMsg(
      `log > Burette refilled to 0.00 cm³. Fresh 25.0 cm³ of B pipetted into clean flask.`
    );
  };

  const handleRecordFinal = () => {
    setTapSetting('closed');
    const roundedFinal = Math.round(buretteReading * 20) / 20;
    const titre = Number((roundedFinal - initialReading).toFixed(2));
    const idx = titrations.length;
    const label = idx === 0 ? 'Rough' : idx === 1 ? '1st' : idx === 2 ? '2nd' : `${idx}th`;
    const isConcordant = titrations.some(
      (t) => t.label !== 'Rough' && Math.abs(t.titre - titre) <= 0.1
    );

    const newRow: TitreRow = {
      id: titrations.length + 1,
      label,
      initial: initialReading,
      final: roundedFinal,
      titre,
      concordant: isConcordant,
    };

    setTitrations((prev) => [...prev, newRow]);
    setLogMsg(
      `log > Recorded ${label} titration: initial ${initialReading.toFixed(2)} cm³, final ${roundedFinal.toFixed(2)} cm³, titre ${titre.toFixed(2)} cm³.`
    );
  };

  // Liquid height inside burette (0 cm³ is at y=30, 50 cm³ is at y=330)
  const liquidTopY = 30 + (buretteReading / 50) * 300;
  const liquidHeight = Math.max(0, 336 - liquidTopY);

  // Solution colour in flask
  const getSolutionFill = () => {
    if (indicator === 'Phenolphthalein') {
      if (pH >= 8.4) return 'rgba(236, 72, 153, 0.80)';
      if (pH >= 7.8) return 'rgba(244, 114, 182, 0.42)';
      return 'rgba(203, 213, 225, 0.18)';
    } else {
      if (pH >= 4.4) return 'rgba(250, 204, 21, 0.72)';
      if (pH >= 3.2) return 'rgba(251, 146, 60, 0.75)';
      return 'rgba(239, 68, 68, 0.75)';
    }
  };

  // Dot on pH curve (V(acid) 0..40 maps to x 35..235, pH 1..14 maps to y 112..25)
  const curveDotX = 35 + (Math.min(volumeDelivered, 40) / 40) * 200;
  const curveDotY = 112 - ((pH - 1) / 13) * 87;

  return (
    <LabLayout
      experimentTitle="Acid–base titration: HCl vs NaOH"
      subtitle="Graded · find the concentration of acid A · autosaved"
      activeLab="chemistry"
      mode="graded"
      headerRightExtra={
        <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-[#121A2B] border border-[#22304A] text-xs text-[#C9D3E6]">
          Lab coat ✓ · Goggles ✓
        </span>
      }
      nextStepLabel="Calculate →"
      onNextStep={() => navigate('/attempt/demo/results')}
      toolRail={[
        { id: 'pointer', label: 'Interact', icon: 'pointer', active: true },
        { id: 'flask', label: 'Glassware', icon: 'flask' },
        { id: 'zoom', label: 'Meniscus magnifier', icon: 'zoom' },
        { id: 'alert', label: 'Hazard sheet', icon: 'alert' },
        { id: 'note', label: 'Lab notebook', icon: 'note' },
      ]}
      toolRailAccent="bg-[#3A2112] text-[#FDBA74]"
      leftTray={
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2.5">
              APPARATUS
            </div>
            <div className="space-y-2">
              {[
                { name: 'Burette, 50 cm³', sub: '± 0.05 cm³ · rinsed with acid A' },
                { name: 'Pipette, 25.0 cm³', sub: 'rinsed with base B' },
                { name: 'Conical flask, 250 cm³', sub: 'rinsed with distilled water' },
                { name: 'White tile · retort stand', sub: 'on bench' },
              ].map((item) => (
                <div
                  key={item.name}
                  className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2.5"
                >
                  <div className="text-xs font-semibold text-[#E6EBF5]">{item.name}</div>
                  <div className="text-[11px] text-[#93A0B8] leading-snug mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2">
              REAGENTS
            </div>
            <div className="space-y-2">
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2.5">
                <div className="text-xs font-semibold text-[#E6EBF5]">A · HCl (aq)</div>
                <div className="text-[11px] text-[#93A0B8]">concentration unknown</div>
              </div>
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2.5">
                <div className="text-xs font-semibold text-[#E6EBF5]">B · NaOH (aq)</div>
                <div className="text-[11px] text-[#93A0B8]">0.100 mol dm⁻³</div>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="indicator-select"
              className="block text-[11px] text-[#93A0B8] mb-1.5"
            >
              Indicator (2 drops)
            </label>
            <select
              id="indicator-select"
              value={indicator}
              onChange={(e) =>
                setIndicator(e.target.value as 'Phenolphthalein' | 'Methyl orange')
              }
              className="w-full bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2 text-xs text-[#E6EBF5] focus:outline-none focus:border-[#F97316]"
            >
              <option value="Phenolphthalein">Phenolphthalein</option>
              <option value="Methyl orange">Methyl orange</option>
            </select>
          </div>
        </div>
      }
      bottomDock={
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          {/* Burette tap controls */}
          <div className="md:col-span-6 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between space-y-2.5">
            <div className="text-xs text-[#93A0B8]">Burette tap</div>
            <div className="grid grid-cols-4 gap-2">
              {(['closed', 'dropwise', 'slow', 'fast'] as TapSetting[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSetTap(mode)}
                  className={`py-2 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    tapSetting === mode
                      ? 'bg-[#F97316] text-[#0B1220]'
                      : 'bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-[#E6EBF5]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleSwirl}
                className="py-2 px-2.5 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors cursor-pointer"
              >
                Swirl flask
              </button>
              <button
                type="button"
                onClick={handleRefillAndNewFlask}
                className="py-2 px-2.5 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors cursor-pointer leading-tight"
              >
                Refill &amp; new flask
              </button>
              <button
                type="button"
                onClick={handleRecordFinal}
                className="py-2 px-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Record final
              </button>
            </div>
          </div>

          {/* Burette reading */}
          <div className="md:col-span-3 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-xs text-[#93A0B8]">Burette reading</div>
            <div className="font-mono text-3xl font-semibold text-[#FDBA74] my-1">
              {buretteReading.toFixed(2)}
            </div>
            <div className="text-xs font-mono text-[#93A0B8]">
              cm³ · initial {initialReading.toFixed(2)}
            </div>
          </div>

          {/* pH probe */}
          <div className="md:col-span-3 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-xs text-[#93A0B8]">pH probe (practice only)</div>
            <div className="font-mono text-3xl font-semibold text-[#E6EBF5] my-1">
              {pH.toFixed(2)}
            </div>
            <div className="text-xs font-mono text-[#93A0B8]">25.0 °C</div>
          </div>
        </div>
      }
      logMessage={logMsg}
      rightPanel={
        <div className="space-y-3.5">
          <div>
            <h2 className="font-display text-sm font-bold text-[#E6EBF5] mb-2">
              Titration table
            </h2>
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1E2A42] text-[#93A0B8] text-[11px]">
                    <th className="py-2 px-2.5 text-left">Burette / cm³</th>
                    <th className="py-2 px-2 text-right">Initial</th>
                    <th className="py-2 px-2 text-right">Final</th>
                    <th className="py-2 px-2.5 text-right">Titre</th>
                  </tr>
                </thead>
                <tbody>
                  {titrations.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#1E2A42]/60 last:border-b-0 text-[#E6EBF5]"
                    >
                      <td className="py-1.5 px-2.5 font-sans font-medium">{row.label}</td>
                      <td className="py-1.5 px-2 text-right">{row.initial.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right">{row.final.toFixed(2)}</td>
                      <td className="py-1.5 px-2.5 text-right text-[#FDBA74] font-semibold">
                        {row.titre.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 text-xs text-[#C9D3E6] leading-relaxed">
            Record at least two accurate titres within 0.10 cm³ of each other.
          </div>

          {/* pH curve */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-xs text-[#93A0B8] mb-2">pH curve · this flask</div>
            <svg viewBox="0 0 260 145" className="w-full h-auto">
              <line x1="35" y1="15" x2="35" y2="115" stroke="#3A4A68" strokeWidth="1" />
              <line x1="35" y1="115" x2="240" y2="115" stroke="#3A4A68" strokeWidth="1" />
              <line
                x1="35"
                y1="68"
                x2="240"
                y2="68"
                stroke="#3A4A68"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x="138"
                y="135"
                fill="#93A0B8"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                V(acid) / cm³ (0 – 40)
              </text>
              <text
                x="12"
                y="68"
                fill="#93A0B8"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
                transform="rotate(-90 12 68)"
              >
                pH
              </text>
              {/* Sigmoidal titration curve */}
              <path
                d="M 35 24 Q 130 28 153 38 C 156 42, 156 96, 160 100 Q 185 108 238 110"
                fill="none"
                stroke="#FDBA74"
                strokeWidth="1.75"
              />
              {/* Current volume marker */}
              <circle cx={curveDotX} cy={curveDotY} r="3.5" fill="#FFFFFF" />
            </svg>
          </div>

          {/* Lab Assistant */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#60A5FA] mb-1.5">
              LAB ASSISTANT
            </div>
            <p className="text-xs text-[#C9D3E6] leading-relaxed">
              Near the end point, the pink fades more slowly after each drop. What should you
              change about how fast you add acid?
            </p>
          </div>
        </div>
      }
    >
      {/* Top Status Pill on Bench */}
      <div className="flex items-center justify-between z-10">
        <div className="px-3 py-1 rounded-full bg-[#121A2B]/90 border border-[#22304A] text-xs text-[#E6EBF5]">
          Titration {titrations.length}nd · tap {tapSetting}
        </div>
        {!swirled && (
          <div className="px-3 py-1 rounded-full bg-[#3A2112] border border-[#F97316] text-xs text-[#FDBA74]">
            Local colour streak — swirl flask
          </div>
        )}
      </div>

      {/* Main Burette + Conical Flask + Meniscus ×8 SVG matching D2-chemistry-titration-bench.svg */}
      <div className="flex-1 flex items-center justify-center my-1">
        <svg
          viewBox="0 0 600 460"
          className="w-full max-w-[660px] h-auto max-h-[430px]"
          role="img"
          aria-label={`Burette above a conical flask on a white tile; burette reads ${buretteReading.toFixed(2)} cubic centimetres`}
        >
          {/* Bench surface */}
          <rect x="60" y="440" width="480" height="12" rx="3" fill="#22304A" />
          {/* Retort stand base */}
          <rect x="170" y="428" width="90" height="14" rx="3" fill="#3A4A68" />
          {/* Retort stand vertical rod */}
          <rect x="206" y="20" width="10" height="410" fill="#3A4A68" />
          {/* Boss & clamp */}
          <rect x="212" y="120" width="80" height="10" rx="3" fill="#55688C" />
          <rect x="280" y="112" width="24" height="26" rx="4" fill="#8A6A4A" />

          {/* Burette glass column */}
          <rect
            x="289"
            y="26"
            width="22"
            height="312"
            rx="4"
            fill="#C9D3E6"
            opacity="0.12"
            stroke="#93A0B8"
            strokeWidth="1"
          />

          {/* Acid liquid column inside burette */}
          <rect
            x="291"
            y={liquidTopY}
            width="18"
            height={liquidHeight}
            fill="#93C5FD"
            opacity="0.35"
          />

          {/* Curved meniscus line at top of liquid column */}
          <path
            d={`M 291 ${liquidTopY} Q 300 ${liquidTopY + 4} 309 ${liquidTopY}`}
            fill="none"
            stroke="#BFDBFE"
            strokeWidth="1.5"
          />

          {/* Burette scale graduations 0..50 */}
          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((mark) => {
            const y = 30 + (mark / 50) * 300;
            const isLabelled = mark % 10 === 0;
            return (
              <g key={mark}>
                <line
                  x1="311"
                  y1={y}
                  x2={isLabelled ? 320 : 316}
                  y2={y}
                  stroke="#93A0B8"
                  strokeWidth="1"
                />
                {isLabelled && (
                  <text
                    x="324"
                    y={y + 3}
                    fill="#93A0B8"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {mark}
                  </text>
                )}
              </g>
            );
          })}

          {/* Stopcock & jet tip */}
          <rect x="296" y="338" width="8" height="18" fill="#C9D3E6" opacity="0.3" />
          <rect x="287" y="342" width="26" height="8" rx="3" fill="#F97316" />
          <path d="M298 356 L302 356 L301 372 L299 372 Z" fill="#C9D3E6" opacity="0.4" />

          {/* Falling drops when tap is open */}
          {tapSetting !== 'closed' && (
            <>
              <circle cx="300" cy="382" r="2.5" fill="#93C5FD" />
              <circle cx="300" cy="396" r="2.2" fill="#93C5FD" opacity="0.75" />
            </>
          )}

          {/* Conical Flask outline */}
          <path
            d="M286 372 L314 372 L314 392 L352 428 Q356 436 346 438 L254 438 Q244 436 248 428 L286 392 Z"
            fill="#C9D3E6"
            opacity="0.10"
            stroke="#93A0B8"
            strokeWidth="1.2"
          />

          {/* Solution inside Conical Flask */}
          <path
            d="M273 404 L327 404 L350 430 Q352 436 346 437 L254 437 Q248 436 250 430 Z"
            fill={getSolutionFill()}
          />

          {/* White porcelain tile under flask */}
          <rect x="232" y="438" width="136" height="4" fill="#F1F5F9" />

          {/* Magnified Meniscus ×8 Circle Inset */}
          <g transform="translate(470 150)">
            <circle cx="0" cy="0" r="62" fill="#0B1220" stroke="#F97316" strokeWidth="2" />
            {[-32, -24, -16, -8, 0, 8, 16, 24, 32].map((dy) => (
              <line
                key={dy}
                x1="-20"
                y1={dy}
                x2={dy === 0 ? 10 : 2}
                y2={dy}
                stroke="#93A0B8"
                strokeWidth="1"
              />
            ))}
            <text
              x="16"
              y="3"
              fill="#C9D3E6"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              {buretteReading.toFixed(1)}
            </text>
            <path d="M-40 -4 Q-20 10 0 -4" fill="none" stroke="#93C5FD" strokeWidth="2" />
            <line
              x1="-48"
              y1="3"
              x2="12"
              y2="3"
              stroke="#F97316"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <text
              x="0"
              y="78"
              fill="#FDBA74"
              fontSize="11"
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
            >
              meniscus ×8
            </text>
          </g>
        </svg>
      </div>
    </LabLayout>
  );
}
