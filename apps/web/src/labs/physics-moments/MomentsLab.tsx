import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LabLayout } from '../../lab-shell/LabLayout';

interface MomentsReading {
  id: number;
  knownMassG: number;
  d1Cm: number;
  d2Cm: number;
  calcUnknownG: number;
}

const INITIAL_MOMENTS_READINGS: MomentsReading[] = [];

export function MomentsLab() {
  const navigate = useNavigate();
  const [pivotCm, setPivotCm] = useState(50.0);
  const [knownMassG, setKnownMassG] = useState<50 | 100 | 150>(50);
  const [d1Cm, setD1Cm] = useState(35.0); // Distance of known mass M1 from pivot (left arm)
  const [d2Cm, setD2Cm] = useState(26.9); // Distance of unknown mass X from pivot (right arm)
  const [readings, setReadings] = useState<MomentsReading[]>(INITIAL_MOMENTS_READINGS);
  const [logMsg, setLogMsg] = useState(
    'log > Metre rule balanced horizontally on knife-edge at G = 50.0 cm before suspending masses.'
  );

  // True unknown mass X = 65.0 g, metre rule mass = 110.0 g acting at 50.0 cm
  const trueUnknownMassG = 65.0;
  const ruleMassG = 110.0;
  const ruleCgCm = 50.0;

  // Anticlockwise moment (left of pivot) vs Clockwise moment (right of pivot) in g·cm
  const ruleOffset = pivotCm - ruleCgCm; // positive if pivot > 50 (CG is left of pivot => ACW)
  const acwMoment = knownMassG * d1Cm + (ruleOffset > 0 ? ruleMassG * ruleOffset : 0);
  const cwMoment =
    trueUnknownMassG * d2Cm + (ruleOffset < 0 ? ruleMassG * Math.abs(ruleOffset) : 0);

  const netMoment = cwMoment - acwMoment; // positive => tilts clockwise (right side down)
  const tiltDeg = Math.max(-14, Math.min(14, netMoment / 140));
  const isBalanced = Math.abs(netMoment) <= 25;

  const handleAutoBalance = () => {
    // Solve for d2Cm so cwMoment = acwMoment
    const ruleContribution =
      ruleOffset > 0 ? ruleMassG * ruleOffset : -ruleMassG * Math.abs(ruleOffset);
    const targetCw = knownMassG * d1Cm + ruleContribution;
    const exactD2 = Math.max(5, Math.min(46, Number((targetCw / trueUnknownMassG).toFixed(1))));
    setD2Cm(exactD2);
    setLogMsg(
      `log > Sliding loop adjusted until metre rule balanced horizontally at d₁ = ${d1Cm.toFixed(1)} cm, d₂ = ${exactD2.toFixed(1)} cm.`
    );
  };

  const handleRecordReading = () => {
    const calcUnknownG = Number(((knownMassG * d1Cm) / Math.max(1, d2Cm)).toFixed(1));
    const next: MomentsReading = {
      id: readings.length + 1,
      knownMassG,
      d1Cm,
      d2Cm,
      calcUnknownG,
    };
    setReadings((prev) => [...prev, next]);
    setLogMsg(
      `log > Recorded equilibrium reading #${next.id}: d₁ = ${d1Cm.toFixed(1)} cm, d₂ = ${d2Cm.toFixed(1)} cm → X = ${calcUnknownG.toFixed(1)} g.`
    );
  };

  const meanUnknownG =
    readings.reduce((s, r) => s + r.calcUnknownG, 0) / Math.max(1, readings.length);

  // SVG coordinates: 100 cm rule mapped to 480px width (x = 80 to 560)
  const cmToPx = (cm: number) => 80 + (cm / 100) * 480;
  const pivotX = cmToPx(pivotCm);
  const pivotY = 215;

  const leftMassCm = Math.max(2, pivotCm - d1Cm);
  const rightMassCm = Math.min(98, pivotCm + d2Cm);
  const leftMassX = cmToPx(leftMassCm);
  const rightMassX = cmToPx(rightMassCm);

  return (
    <LabLayout
      experimentTitle="Principle of moments with a metre rule"
      subtitle="Physics · Statics · Determination of unknown mass X"
      activeLab="physics"
      nextStepLabel="Analyse results →"
      onNextStep={() => navigate('/attempt/demo/results')}
      toolRail={[
        { id: 'pointer', label: 'Slide thread loops', icon: 'pointer', active: true },
        { id: 'ruler', label: 'Check knife-edge CG', icon: 'ruler' },
        { id: 'gauge', label: 'Spirit level balance', icon: 'gauge', active: isBalanced },
      ]}
      leftTray={
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2">
              KNOWN MASS M₁ (LEFT ARM)
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {([50, 100, 150] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setKnownMassG(m);
                    setLogMsg(`log > Changed standard slotted mass M₁ to ${m} g.`);
                  }}
                  className={`py-2 rounded-xl border text-xs font-mono font-bold cursor-pointer ${
                    knownMassG === m
                      ? 'bg-[#1C2A47] border-[#3B82F6] text-[#60A5FA]'
                      : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6]'
                  }`}
                >
                  {m} g
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2A42] space-y-2">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8]">
              APPARATUS ON BENCH
            </div>
            {[
              { name: 'Uniform metre rule', sub: '0–100 cm · CG at 50.0 cm' },
              { name: 'Hardwood knife-edge', sub: `fulcrum at ${pivotCm.toFixed(1)} cm` },
              { name: 'Standard mass M₁', sub: `${knownMassG}.0 g on thread loop` },
              { name: 'Unknown body X', sub: 'brass cylinder on right loop' },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2"
              >
                <div className="text-xs font-semibold text-[#E6EBF5]">{item.name}</div>
                <div className="text-[11px] text-[#93A0B8]">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      }
      bottomDock={
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#93A0B8]">Left arm distance d₁ (known M₁)</span>
                <span className="font-mono font-bold text-[#60A5FA]">
                  {d1Cm.toFixed(1)} cm (mark {leftMassCm.toFixed(1)} cm)
                </span>
              </div>
              <input
                type="range"
                aria-label="Left arm distance d1 in cm"
                min={10}
                max={45}
                step={0.5}
                value={d1Cm}
                onChange={(e) => setD1Cm(Number(e.target.value))}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#93A0B8]">Right arm distance d₂ (unknown X)</span>
                <span className="font-mono font-bold text-[#FDBA74]">
                  {d2Cm.toFixed(1)} cm (mark {rightMassCm.toFixed(1)} cm)
                </span>
              </div>
              <input
                type="range"
                aria-label="Right arm distance d2 in cm"
                min={8}
                max={45}
                step={0.1}
                value={d2Cm}
                onChange={(e) => setD2Cm(Number(e.target.value))}
                className="w-full accent-[#F97316] cursor-pointer"
              />
            </div>
          </div>

          <div className="md:col-span-4 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#93A0B8]">Fulcrum position G</span>
              <span className="font-mono font-bold text-[#E6EBF5]">
                {pivotCm.toFixed(1)} cm
              </span>
            </div>
            <input
              type="range"
              aria-label="Knife edge pivot position in cm"
              min={45}
              max={55}
              step={0.5}
              value={pivotCm}
              onChange={(e) => setPivotCm(Number(e.target.value))}
              className="w-full accent-[#60A5FA] cursor-pointer my-1.5"
            />
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-[#0B1220] rounded-lg p-1.5">
                <div className="text-[10px] text-[#93A0B8]">ACW Moment</div>
                <div className="text-[#60A5FA]">{acwMoment.toFixed(0)} g·cm</div>
              </div>
              <div className="bg-[#0B1220] rounded-lg p-1.5">
                <div className="text-[10px] text-[#93A0B8]">CW Moment</div>
                <div className="text-[#FDBA74]">{cwMoment.toFixed(0)} g·cm</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between gap-2">
            <button
              type="button"
              onClick={handleAutoBalance}
              className="w-full py-2 rounded-xl bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#FDBA74] cursor-pointer"
            >
              Slide X to exact balance
            </button>
            <button
              type="button"
              onClick={handleRecordReading}
              className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
            >
              Record (d₁={d1Cm.toFixed(1)}, d₂={d2Cm.toFixed(1)})
            </button>
          </div>
        </div>
      }
      logMessage={logMsg}
      rightPanel={
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#93A0B8]">
                MOMENTS TABLE
              </h2>
              <span className="font-mono text-xs text-[#4ADE80]">
                X̄ = {meanUnknownG.toFixed(1)} g
              </span>
            </div>

            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl overflow-hidden">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="bg-[#172236] text-[#93A0B8] border-b border-[#22304A]">
                    <th className="py-2 px-2 text-left">M₁/g</th>
                    <th className="py-2 px-2 text-left">d₁/cm</th>
                    <th className="py-2 px-2 text-left">d₂/cm</th>
                    <th className="py-2 px-2 text-right">X/g</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A42]">
                  {readings.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 px-2 text-white">{r.knownMassG}</td>
                      <td className="py-1.5 px-2 text-[#60A5FA]">{r.d1Cm.toFixed(1)}</td>
                      <td className="py-1.5 px-2 text-[#FDBA74]">{r.d2Cm.toFixed(1)}</td>
                      <td className="py-1.5 px-2 text-right text-[#4ADE80] font-bold">
                        {r.calcUnknownG.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-white">Graph of d₂ against d₁</span>
              <span className="font-mono text-[11px] text-[#60A5FA]">
                slope = M₁ / X
              </span>
            </div>
            <svg viewBox="0 0 260 165" className="w-full h-auto">
              <line x1="32" y1="15" x2="32" y2="138" stroke="#3A4A68" strokeWidth="1.2" />
              <line x1="32" y1="138" x2="245" y2="138" stroke="#3A4A68" strokeWidth="1.2" />
              <text x="140" y="158" textAnchor="middle" fill="#93A0B8" fontSize="9">
                d₁ / cm
              </text>
              <text
                x="11"
                y="76"
                textAnchor="middle"
                fill="#93A0B8"
                fontSize="9"
                transform="rotate(-90 11 76)"
              >
                d₂ / cm
              </text>
              {readings.map((r) => {
                const cx = 32 + (r.d1Cm / 50) * 200;
                const cy = 138 - (r.d2Cm / 50) * 115;
                return (
                  <circle
                    key={r.id}
                    cx={cx}
                    cy={cy}
                    r="3.5"
                    fill="#F97316"
                    stroke="#0B1220"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      }
    >
      {/* Top Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="px-3 py-1.5 rounded-xl bg-[#121A2B]/90 border border-[#22304A] font-mono text-xs">
          ΣM(ACW) = {acwMoment.toFixed(0)} g·cm · ΣM(CW) = {cwMoment.toFixed(0)} g·cm · Tilt ={' '}
          {tiltDeg.toFixed(1)}°
        </div>
        <div
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
            isBalanced
              ? 'bg-[#122D1F] border-[#22C55E] text-[#4ADE80]'
              : 'bg-[#3A2112] border-[#F97316] text-[#FDBA74]'
          }`}
        >
          {isBalanced ? 'HORIZONTAL EQUILIBRIUM ✓' : 'UNBALANCED — ADJUST LOOP d₂'}
        </div>
      </div>

      {/* Main Knife-Edge & Tilting Metre Rule SVG */}
      <div className="flex-1 flex items-center justify-center">
        <svg
          viewBox="0 0 640 390"
          className="w-full max-w-[640px] h-auto"
          role="img"
          aria-label="Metre rule balanced on knife-edge fulcrum with suspended masses M1 and X"
        >
          {/* Bench surface */}
          <rect x="40" y="340" width="560" height="14" rx="4" fill="#22304A" />

          {/* Hardwood Knife-Edge Prism */}
          <polygon
            points={`${pivotX},${pivotY} ${pivotX - 28},340 ${pivotX + 28},340`}
            fill="#8A6A4A"
            stroke="#D9C39A"
            strokeWidth="1.5"
          />
          <text
            x={pivotX}
            y="366"
            textAnchor="middle"
            fill="#FDBA74"
            fontSize="11"
            fontFamily="JetBrains Mono, monospace"
          >
            Fulcrum G = {pivotCm.toFixed(1)} cm
          </text>

          {/* Tilting Metre Rule Group rotated around (pivotX, pivotY) */}
          <g transform={`rotate(${tiltDeg} ${pivotX} ${pivotY})`}>
            {/* Wooden 100 cm Metre Rule */}
            <rect
              x="80"
              y={pivotY - 18}
              width="480"
              height="18"
              rx="2"
              fill="#D9C39A"
              stroke="#8A6A4A"
              strokeWidth="1.5"
            />

            {/* Centimetre graduations every 10 cm */}
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((cm) => {
              const x = cmToPx(cm);
              return (
                <g key={cm}>
                  <line
                    x1={x}
                    y1={pivotY - 18}
                    x2={x}
                    y2={pivotY - 11}
                    stroke="#1E293B"
                    strokeWidth="1.2"
                  />
                  <text
                    x={x}
                    y={pivotY - 3}
                    textAnchor="middle"
                    fill="#1E293B"
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                  >
                    {cm}
                  </text>
                </g>
              );
            })}

            {/* Dimension arrow for d1 */}
            <line
              x1={leftMassX}
              y1={pivotY - 32}
              x2={pivotX}
              y2={pivotY - 32}
              stroke="#60A5FA"
              strokeWidth="1.5"
            />
            <text
              x={(leftMassX + pivotX) / 2}
              y={pivotY - 38}
              textAnchor="middle"
              fill="#60A5FA"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
            >
              d₁ = {d1Cm.toFixed(1)} cm
            </text>

            {/* Dimension arrow for d2 */}
            <line
              x1={pivotX}
              y1={pivotY - 32}
              x2={rightMassX}
              y2={pivotY - 32}
              stroke="#FDBA74"
              strokeWidth="1.5"
            />
            <text
              x={(pivotX + rightMassX) / 2}
              y={pivotY - 38}
              textAnchor="middle"
              fill="#FDBA74"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
            >
              d₂ = {d2Cm.toFixed(1)} cm
            </text>

            {/* Left Thread Loop & Known Mass M1 */}
            <line
              x1={leftMassX}
              y1={pivotY - 18}
              x2={leftMassX}
              y2={pivotY + 68}
              stroke="#E6EBF5"
              strokeWidth="1.8"
            />
            <rect
              x={leftMassX - 20}
              y={pivotY + 68}
              width="40"
              height="36"
              rx="5"
              fill="#3B82F6"
              stroke="#93C5FD"
              strokeWidth="1.5"
            />
            <text
              x={leftMassX}
              y={pivotY + 90}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              {knownMassG}g
            </text>

            {/* Right Thread Loop & Unknown Mass X */}
            <line
              x1={rightMassX}
              y1={pivotY - 18}
              x2={rightMassX}
              y2={pivotY + 68}
              stroke="#E6EBF5"
              strokeWidth="1.8"
            />
            <rect
              x={rightMassX - 20}
              y={pivotY + 68}
              width="40"
              height="38"
              rx="5"
              fill="#F97316"
              stroke="#FDBA74"
              strokeWidth="1.5"
            />
            <text
              x={rightMassX}
              y={pivotY + 91}
              textAnchor="middle"
              fill="#0B1220"
              fontSize="12"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="800"
            >
              X
            </text>
          </g>
        </svg>
      </div>
    </LabLayout>
  );
}
