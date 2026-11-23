import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LabLayout } from '../../lab-shell/LabLayout';

interface RefractionReading {
  id: number;
  iDeg: number;
  rDeg: number;
  sinI: number;
  sinR: number;
  nCalc: number;
  dispCm: number;
}

const INITIAL_READINGS: RefractionReading[] = [
  { id: 1, iDeg: 20, rDeg: 13.2, sinI: 0.342, sinR: 0.228, nCalc: 1.5, dispCm: 0.88 },
  { id: 2, iDeg: 30, rDeg: 19.5, sinI: 0.5, sinR: 0.334, nCalc: 1.497, dispCm: 1.39 },
  { id: 3, iDeg: 40, rDeg: 25.4, sinI: 0.643, sinR: 0.429, nCalc: 1.499, dispCm: 1.98 },
];

type GlassMaterial = {
  id: 'crown' | 'flint' | 'perspex';
  name: string;
  n: number;
  tint: string;
};

const MATERIALS: Record<'crown' | 'flint' | 'perspex', GlassMaterial> = {
  crown: { id: 'crown', name: 'Crown glass', n: 1.5, tint: 'rgba(96, 165, 250, 0.16)' },
  flint: { id: 'flint', name: 'Dense flint glass', n: 1.62, tint: 'rgba(167, 139, 250, 0.18)' },
  perspex: { id: 'perspex', name: 'Acrylic / Perspex', n: 1.49, tint: 'rgba(52, 211, 153, 0.14)' },
};

export function RefractionLab() {
  const navigate = useNavigate();
  const [materialKey, setMaterialKey] = useState<'crown' | 'flint' | 'perspex'>('crown');
  const [iDeg, setIDeg] = useState(50);
  const [blockWidthCm, setBlockWidthCm] = useState(6.5);
  const [pinAlignmentOffsetDeg, setPinAlignmentOffsetDeg] = useState(0);
  const [showProtractor, setShowProtractor] = useState(true);
  const [showLaserRay, setShowLaserRay] = useState(true);
  const [readings, setReadings] = useState<RefractionReading[]>(INITIAL_READINGS);
  const [logMsg, setLogMsg] = useState(
    'log > Glass block outline ABCD traced on drawing sheet. Pins P₁ and P₂ placed along incident ray at i = 50°.'
  );

  const mat = MATERIALS[materialKey];
  const iRad = (iDeg * Math.PI) / 180;
  const trueSinR = Math.sin(iRad) / mat.n;
  const trueRRad = Math.asin(Math.min(0.999, trueSinR));
  const trueRDeg = (trueRRad * 180) / Math.PI;
  const measuredRDeg = Math.max(2, Number((trueRDeg + pinAlignmentOffsetDeg * 0.4).toFixed(1)));
  const measuredRRad = (measuredRDeg * Math.PI) / 180;

  // Lateral displacement d = t * sin(i - r) / cos(r)
  const lateralDispCm =
    (blockWidthCm * Math.sin(iRad - measuredRRad)) / Math.max(0.1, Math.cos(measuredRRad));

  // SVG coordinates for drawing board
  const blockX = 160;
  const blockY = 135;
  const blockW = 280;
  const blockH = Math.round(blockWidthCm * 22); // ~143px for 6.5 cm
  const entryX = 270;
  const entryY = blockY;

  // Incident ray coming from top-left into (entryX, entryY)
  const rayLenTop = 115;
  const incStartX = entryX - rayLenTop * Math.sin(iRad);
  const incStartY = entryY - rayLenTop * Math.cos(iRad);

  // Pins P1, P2 along incident ray
  const p1X = entryX - 88 * Math.sin(iRad);
  const p1Y = entryY - 88 * Math.cos(iRad);
  const p2X = entryX - 38 * Math.sin(iRad);
  const p2Y = entryY - 38 * Math.cos(iRad);

  // Exit point on bottom face DC
  const exitY = blockY + blockH;
  const exitX = entryX + blockH * Math.tan(measuredRRad);

  // Emergent ray parallel to incident ray (plus any pin misalignment offset)
  const emAngleRad = iRad + (pinAlignmentOffsetDeg * Math.PI) / 180;
  const rayLenBot = 115;
  const emEndX = exitX + rayLenBot * Math.sin(emAngleRad);
  const emEndY = exitY + rayLenBot * Math.cos(emAngleRad);

  // Pins P3, P4 along emergent ray
  const p3X = exitX + 40 * Math.sin(emAngleRad);
  const p3Y = exitY + 40 * Math.cos(emAngleRad);
  const p4X = exitX + 88 * Math.sin(emAngleRad);
  const p4Y = exitY + 88 * Math.cos(emAngleRad);

  const handleRecordReading = () => {
    const sinI = Number(Math.sin(iRad).toFixed(3));
    const sinR = Number(Math.sin(measuredRRad).toFixed(3));
    const nCalc = Number((sinI / Math.max(0.05, sinR)).toFixed(3));
    const next: RefractionReading = {
      id: readings.length + 1,
      iDeg,
      rDeg: measuredRDeg,
      sinI,
      sinR,
      nCalc,
      dispCm: Number(lateralDispCm.toFixed(2)),
    };
    setReadings((prev) => [...prev, next]);
    setLogMsg(
      `log > Recorded trial #${next.id}: i = ${iDeg}°, r = ${measuredRDeg.toFixed(1)}°, sin i / sin r = ${nCalc.toFixed(3)}.`
    );
  };

  const meanN =
    readings.reduce((acc, r) => acc + r.nCalc, 0) / Math.max(1, readings.length);

  return (
    <LabLayout
      experimentTitle="Refraction through a rectangular glass block"
      subtitle="Physics · Optics · Snell’s law & lateral displacement"
      activeLab="physics"
      nextStepLabel="Analyse results →"
      onNextStep={() => navigate('/attempt/demo/results')}
      toolRail={[
        { id: 'pointer', label: 'Place optical pins', icon: 'pointer', active: true },
        {
          id: 'ruler',
          label: 'Toggle protractor',
          icon: 'ruler',
          active: showProtractor,
          onClick: () => setShowProtractor((v) => !v),
        },
        {
          id: 'zoom',
          label: 'Toggle ray box laser',
          icon: 'zoom',
          active: showLaserRay,
          onClick: () => setShowLaserRay((v) => !v),
        },
      ]}
      leftTray={
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2">
              OPTICAL BLOCK MATERIAL
            </div>
            <div className="space-y-1.5">
              {(['crown', 'flint', 'perspex'] as const).map((key) => {
                const item = MATERIALS[key];
                const active = materialKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setMaterialKey(key);
                      setLogMsg(`log > Switched block to ${item.name} (n = ${item.n.toFixed(2)}).`);
                    }}
                    className={`w-full text-left rounded-xl px-3 py-2 border text-xs transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#1C2A47] border-[#3B82F6] text-white'
                        : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6] hover:border-[#3A4A68]'
                    }`}
                  >
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-[11px] text-[#93A0B8] font-mono">
                      n = {item.n.toFixed(2)} · width {blockWidthCm.toFixed(1)} cm
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2A42] space-y-2">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8]">
              APPARATUS ON BOARD
            </div>
            {[
              { name: 'Rectangular block', sub: `${blockWidthCm.toFixed(1)} cm × 11.0 cm` },
              { name: '4 Optical pins', sub: 'P₁, P₂ (object) · P₃, P₄ (search)' },
              { name: 'Drawing board & sheet', sub: 'A4 white sheet pinned flat' },
              { name: 'Protractor & 30 cm rule', sub: '0.5° and 0.1 cm resolution' },
            ].map((a) => (
              <div
                key={a.name}
                className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2"
              >
                <div className="text-xs font-semibold text-[#E6EBF5]">{a.name}</div>
                <div className="text-[11px] text-[#93A0B8]">{a.sub}</div>
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
                <span className="text-[#93A0B8]">Angle of incidence i</span>
                <span className="font-mono font-bold text-[#60A5FA]">{iDeg}°</span>
              </div>
              <input
                type="range"
                aria-label="Angle of incidence i"
                min={15}
                max={65}
                step={5}
                value={iDeg}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setIDeg(val);
                  setLogMsg(`log > Moved pins P₁ and P₂ to incidence angle i = ${val}°.`);
                }}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#93A0B8]">Block width t (AD)</span>
                <span className="font-mono font-bold text-[#E6EBF5]">
                  {blockWidthCm.toFixed(1)} cm
                </span>
              </div>
              <input
                type="range"
                aria-label="Glass block width in cm"
                min={5.0}
                max={8.0}
                step={0.5}
                value={blockWidthCm}
                onChange={(e) => setBlockWidthCm(Number(e.target.value))}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
            </div>
          </div>

          <div className="md:col-span-4 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#93A0B8]">Search pin P₃–P₄ sight alignment</span>
              <span
                className={`font-mono font-bold ${
                  pinAlignmentOffsetDeg === 0 ? 'text-[#4ADE80]' : 'text-[#FDBA74]'
                }`}
              >
                {pinAlignmentOffsetDeg === 0
                  ? 'Collinear ✓'
                  : `${pinAlignmentOffsetDeg > 0 ? '+' : ''}${pinAlignmentOffsetDeg}° off`}
              </span>
            </div>
            <input
              type="range"
              aria-label="Pin alignment fine adjustment"
              min={-4}
              max={4}
              step={1}
              value={pinAlignmentOffsetDeg}
              onChange={(e) => setPinAlignmentOffsetDeg(Number(e.target.value))}
              className="w-full accent-[#F97316] cursor-pointer my-2"
            />
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-[#C9D3E6]">
              <div className="bg-[#0B1220] rounded-lg p-1.5 text-center">
                <div className="text-[10px] text-[#93A0B8]">r</div>
                <div>{measuredRDeg.toFixed(1)}°</div>
              </div>
              <div className="bg-[#0B1220] rounded-lg p-1.5 text-center">
                <div className="text-[10px] text-[#93A0B8]">sin i / sin r</div>
                <div>{(Math.sin(iRad) / Math.sin(measuredRRad)).toFixed(3)}</div>
              </div>
              <div className="bg-[#0B1220] rounded-lg p-1.5 text-center">
                <div className="text-[10px] text-[#93A0B8]">d (disp.)</div>
                <div>{lateralDispCm.toFixed(2)} cm</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowProtractor((p) => !p)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                  showProtractor
                    ? 'bg-[#1C2A47] border-[#3B82F6] text-[#60A5FA]'
                    : 'bg-[#0B1220] border-[#22304A] text-[#93A0B8]'
                }`}
              >
                Protractor
              </button>
              <button
                type="button"
                onClick={() => setPinAlignmentOffsetDeg(0)}
                className="flex-1 py-2 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-white cursor-pointer"
              >
                Align pins
              </button>
            </div>

            <button
              type="button"
              onClick={handleRecordReading}
              className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
            >
              Record i = {iDeg}°, r = {measuredRDeg.toFixed(1)}°
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
                SNELL’S LAW TABLE
              </h2>
              <span className="font-mono text-xs text-[#60A5FA]">
                n̄ = {meanN.toFixed(3)}
              </span>
            </div>

            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl overflow-hidden">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="bg-[#172236] text-[#93A0B8] border-b border-[#22304A]">
                    <th className="py-2 px-2 text-left">i/°</th>
                    <th className="py-2 px-2 text-left">r/°</th>
                    <th className="py-2 px-2 text-left">sin i</th>
                    <th className="py-2 px-2 text-left">sin r</th>
                    <th className="py-2 px-2 text-right">n</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A42]">
                  {readings.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 px-2 text-white">{r.iDeg.toFixed(0)}</td>
                      <td className="py-1.5 px-2 text-[#C9D3E6]">{r.rDeg.toFixed(1)}</td>
                      <td className="py-1.5 px-2 text-[#C9D3E6]">{r.sinI.toFixed(3)}</td>
                      <td className="py-1.5 px-2 text-[#C9D3E6]">{r.sinR.toFixed(3)}</td>
                      <td className="py-1.5 px-2 text-right text-[#60A5FA] font-bold">
                        {r.nCalc.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live sin i vs sin r Plot */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-white">sin i against sin r</span>
              <span className="font-mono text-[11px] text-[#4ADE80]">
                slope n = {meanN.toFixed(2)}
              </span>
            </div>
            <svg viewBox="0 0 260 170" className="w-full h-auto">
              <line x1="32" y1="15" x2="32" y2="142" stroke="#3A4A68" strokeWidth="1.2" />
              <line x1="32" y1="142" x2="245" y2="142" stroke="#3A4A68" strokeWidth="1.2" />
              <text x="140" y="164" textAnchor="middle" fill="#93A0B8" fontSize="9">
                sin r
              </text>
              <text
                x="11"
                y="80"
                textAnchor="middle"
                fill="#93A0B8"
                fontSize="9"
                transform="rotate(-90 11 80)"
              >
                sin i
              </text>

              {/* Best fit line */}
              <line
                x1="32"
                y1="142"
                x2={32 + 0.6 * 200}
                y2={142 - Math.min(1, 0.6 * meanN) * 120}
                stroke="#3B82F6"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {readings.map((r) => {
                const cx = 32 + r.sinR * 200;
                const cy = 142 - r.sinI * 120;
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
      {/* Top Floating Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="px-3 py-1.5 rounded-xl bg-[#121A2B]/90 border border-[#22304A] font-mono text-xs text-[#E6EBF5]">
          {mat.name} (n = {mat.n.toFixed(2)}) · i = {iDeg}° → r = {measuredRDeg.toFixed(1)}° ·
          Lateral shift d = {lateralDispCm.toFixed(2)} cm
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-[#121A2B]/90 border border-[#22304A] text-xs text-[#93A0B8]">
          Pin spacing ≥ 5 cm recommended for WAEC accuracy
        </div>
      </div>

      {/* Main Optical Drawing Board SVG */}
      <div className="flex-1 flex items-center justify-center my-2">
        <svg
          viewBox="0 0 640 420"
          className="w-full max-w-[640px] h-auto"
          role="img"
          aria-label="Optical drawing board with rectangular glass block, normal line, incident and emergent rays, and four optical pins"
        >
          {/* Wooden drawing board & A4 white/slate drawing sheet */}
          <rect
            x="40"
            y="16"
            width="560"
            height="388"
            rx="14"
            fill="#111A2E"
            stroke="#263554"
            strokeWidth="2"
          />
          {/* Corner drawing pins */}
          {[
            [58, 34],
            [582, 34],
            [58, 386],
            [582, 386],
          ].map(([cx, cy], idx) => (
            <circle key={idx} cx={cx} cy={cy} r="5" fill="#F59E0B" />
          ))}

          {/* Rectangular Glass Block ABCD */}
          <rect
            x={blockX}
            y={blockY}
            width={blockW}
            height={blockH}
            rx="4"
            fill={mat.tint}
            stroke="#60A5FA"
            strokeWidth="2"
          />
          <text x={blockX - 16} y={blockY + 4} fill="#93A0B8" fontSize="11" fontWeight="700">
            A
          </text>
          <text
            x={blockX + blockW + 8}
            y={blockY + 4}
            fill="#93A0B8"
            fontSize="11"
            fontWeight="700"
          >
            B
          </text>
          <text
            x={blockX + blockW + 8}
            y={blockY + blockH + 4}
            fill="#93A0B8"
            fontSize="11"
            fontWeight="700"
          >
            C
          </text>
          <text
            x={blockX - 16}
            y={blockY + blockH + 4}
            fill="#93A0B8"
            fontSize="11"
            fontWeight="700"
          >
            D
          </text>

          {/* Normal Line N-N' at point of incidence O */}
          <line
            x1={entryX}
            y1={blockY - 95}
            x2={entryX}
            y2={blockY + blockH + 75}
            stroke="#93A0B8"
            strokeWidth="1.3"
            strokeDasharray="5 4"
          />
          <text x={entryX + 6} y={blockY - 82} fill="#93A0B8" fontSize="10">
            N
          </text>
          <text x={entryX + 6} y={blockY + blockH + 70} fill="#93A0B8" fontSize="10">
            N&apos;
          </text>

          {/* Protractor Overlay at Entry Point O */}
          {showProtractor && (
            <g opacity="0.78">
              <path
                d={`M ${entryX - 68} ${entryY} A 68 68 0 0 1 ${entryX + 68} ${entryY}`}
                fill="rgba(30, 42, 66, 0.45)"
                stroke="#FDBA74"
                strokeWidth="1.2"
              />
              <path
                d={`M ${entryX - 68} ${entryY} A 68 68 0 0 0 ${entryX + 68} ${entryY}`}
                fill="rgba(30, 42, 66, 0.25)"
                stroke="#FDBA74"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* Unrefracted original path (dashed extension showing lateral displacement d) */}
          <line
            x1={entryX}
            y1={entryY}
            x2={entryX + 210 * Math.sin(iRad)}
            y2={entryY + 210 * Math.cos(iRad)}
            stroke="#64748B"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />

          {/* Incident Ray, Refracted Ray, Emergent Ray */}
          {showLaserRay && (
            <>
              {/* Incident Ray */}
              <line
                x1={incStartX}
                y1={incStartY}
                x2={entryX}
                y2={entryY}
                stroke="#F97316"
                strokeWidth="2.4"
              />
              {/* Refracted Ray inside glass */}
              <line
                x1={entryX}
                y1={entryY}
                x2={exitX}
                y2={exitY}
                stroke="#FDBA74"
                strokeWidth="2.4"
              />
              {/* Emergent Ray */}
              <line
                x1={exitX}
                y1={exitY}
                x2={emEndX}
                y2={emEndY}
                stroke="#F97316"
                strokeWidth="2.4"
              />
            </>
          )}

          {/* Optical Pins P1, P2, P3, P4 */}
          {[
            { label: 'P₁', x: p1X, y: p1Y, color: '#EF4444' },
            { label: 'P₂', x: p2X, y: p2Y, color: '#EF4444' },
            { label: 'P₃', x: p3X, y: p3Y, color: '#22C55E' },
            { label: 'P₄', x: p4X, y: p4Y, color: '#22C55E' },
          ].map((pin) => (
            <g key={pin.label}>
              <circle
                cx={pin.x}
                cy={pin.y}
                r="6"
                fill={pin.color}
                stroke="#0B1220"
                strokeWidth="1.5"
              />
              <circle cx={pin.x} cy={pin.y} r="2" fill="#FFFFFF" />
              <text
                x={pin.x + 10}
                y={pin.y + 4}
                fill="#E6EBF5"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
              >
                {pin.label}
              </text>
            </g>
          ))}

          {/* Angle Labels i and r */}
          <text
            x={entryX - 28}
            y={entryY - 34}
            fill="#FDBA74"
            fontSize="11"
            fontFamily="JetBrains Mono, monospace"
          >
            i={iDeg}°
          </text>
          <text
            x={entryX + 8}
            y={entryY + 46}
            fill="#60A5FA"
            fontSize="11"
            fontFamily="JetBrains Mono, monospace"
          >
            r={measuredRDeg.toFixed(1)}°
          </text>

          {/* Eye-level Sighting Box (Bottom-left inset showing P1, P2, P3, P4 collinearity) */}
          <g transform="translate(56, 295)">
            <rect
              x="0"
              y="0"
              width="155"
              height="78"
              rx="10"
              fill="#0B1220"
              stroke="#22304A"
              strokeWidth="1.5"
            />
            <text x="12" y="18" fill="#93A0B8" fontSize="10" fontWeight="700">
              EYE VIEW (LOOKING ALONG DC)
            </text>
            <rect x="16" y="28" width="123" height="36" rx="6" fill="#17253B" />
            {/* Apparent P1 & P2 inside glass */}
            <line x1="77" y1="32" x2="77" y2="58" stroke="#EF4444" strokeWidth="2.5" />
            {/* Search pins P3 & P4 */}
            <line
              x1={77 + pinAlignmentOffsetDeg * 5}
              y1="30"
              x2={77 + pinAlignmentOffsetDeg * 5}
              y2="60"
              stroke="#22C55E"
              strokeWidth="2.5"
            />
            <text
              x="77"
              y="72"
              textAnchor="middle"
              fill={pinAlignmentOffsetDeg === 0 ? '#4ADE80' : '#FDBA74'}
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              {pinAlignmentOffsetDeg === 0
                ? 'P₁–P₂–P₃–P₄ in straight line'
                : 'Parallax / misalignment'}
            </text>
          </g>
        </svg>
      </div>
    </LabLayout>
  );
}
