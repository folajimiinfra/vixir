import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';

type Tab = 'signin' | 'create';
type Role = 'student' | 'teacher' | 'admin';

interface LabCarouselSlide {
  id: string;
  discipline: string;
  badgeClass: string;
  dotColor: string;
  accentBar: string;
  title: string;
  apparatusSummary: string;
  telemetry: { label: string; value: string; tone?: string }[];
  calcLines: {
    formulaVar: string;
    formulaRest: string;
    workingLine: string;
    extraWorkingLine: string;
    resultLine: string;
  };
  renderSvg: () => React.ReactNode;
}

const LAB_CAROUSEL_SLIDES: LabCarouselSlide[] = [
  {
    id: 'physics',
    discipline: 'PHYSICS LAB · MECHANICS & OSCILLATIONS',
    badgeClass: 'bg-[#172554] text-[#93C5FD] border-[#1D4ED8]/50',
    dotColor: 'bg-[#3B82F6]',
    accentBar: 'bg-[#3B82F6]',
    title: 'Simple Pendulum — Determination of Acceleration Due to Gravity g',
    apparatusSummary:
      'Retort stand · split cork · 80.0 cm inextensible thread · spherical brass bob · 0.01 s digital stopwatch · metre rule',
    telemetry: [
      { label: 'Effective Length L', value: '0.800 m (80.0 cm)', tone: 'text-[#E6EBF5]' },
      { label: '20 Oscillations t₂₀', value: '35.88 s (T = 1.794 s)', tone: 'text-[#7DD3FC]' },
      { label: 'Period Squared T²', value: '3.218 s²', tone: 'text-[#FDBA74]' },
    ],
    calcLines: {
      formulaVar: 'g = 4π² / slope',
      formulaRest: '   where T = 2π √(L / g)  ⇒  T² = (4π² / g) · L',
      workingLine: 'slope (T² vs L) = (3.218 − 1.608) / (0.800 − 0.400) = 4.020 s² m⁻¹',
      extraWorkingLine:
        'Least-squares linear fit across 6 lengths (L = 0.30 m to 0.80 m) · r² = 0.9994 · zero parallax verified',
      resultLine: 'g = 39.478 / 4.020 = 9.82 m s⁻² ✓ within 0.1% of standard 9.81 m s⁻² (10 / 10 marks)',
    },
    renderSvg: () => (
      <svg viewBox="0 0 640 215" className="w-full h-auto block">
        {/* Left Panel: Full Retort Stand, Split Cork, Swinging Pendulum & Fiducial Marker */}
        <rect x="8" y="8" width="285" height="199" rx="10" fill="#080E1A" stroke="#1E2A42" />
        <text x="22" y="26" fill="#60A5FA" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          BENCH APPARATUS · SHM OSCILLATOR
        </text>
        {/* Bench base */}
        <rect x="28" y="186" width="244" height="8" rx="3" fill="#22304A" />
        {/* Tall Retort Stand */}
        <rect x="44" y="178" width="76" height="9" rx="2" fill="#334155" />
        <rect x="64" y="36" width="8" height="144" rx="2" fill="#475569" />
        <rect x="66" y="40" width="112" height="7" rx="2" fill="#64748B" />
        {/* Split cork */}
        <rect x="158" y="45" width="18" height="14" rx="2" fill="#A16207" stroke="#FDE047" strokeWidth="1" />
        {/* Equilibrium vertical fiducial line */}
        <line x1="167" y1="59" x2="167" y2="180" stroke="#334155" strokeWidth="1.4" strokeDasharray="4 4" />
        <path d="M167 95 A36 36 0 0 0 184 91" fill="none" stroke="#38BDF8" strokeWidth="1.8" />
        <text x="192" y="90" fill="#7DD3FC" fontSize="10" fontFamily="JetBrains Mono, monospace">
          θ = 8.0° (&lt;10°)
        </text>
        {/* Swinging bob */}
        <g className="pendulum-swing" style={{ transformOrigin: '167px 59px' }}>
          <line x1="167" y1="59" x2="202" y2="158" stroke="#E2E8F0" strokeWidth="2" />
          <circle cx="202" cy="158" r="13" fill="#F97316" stroke="#FDBA74" strokeWidth="2" />
        </g>
        <text x="156" y="178" fill="#93A0B8" fontSize="9" fontFamily="JetBrains Mono, monospace">
          Fiducial centre mark
        </text>

        {/* Right Panel: High-Resolution T² vs L Linear Regression Graph */}
        <rect x="305" y="8" width="327" height="199" rx="10" fill="#080E1A" stroke="#1E2A42" />
        <text x="320" y="26" fill="#7DD3FC" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          LIVE PLOT · PERIOD SQUARED T² (s²) VS LENGTH L (m)
        </text>
        {/* Grid lines */}
        {[55, 85, 115, 145].map((gy) => (
          <line key={gy} x1="345" y1={gy} x2="610" y2={gy} stroke="#142038" strokeWidth="1" />
        ))}
        {[395, 445, 495, 545, 595].map((gx) => (
          <line key={gx} x1={gx} y1="40" x2={gx} y2="172" stroke="#142038" strokeWidth="1" />
        ))}
        {/* Axes */}
        <line x1="345" y1="172" x2="612" y2="172" stroke="#475569" strokeWidth="1.5" />
        <line x1="345" y1="40" x2="345" y2="172" stroke="#475569" strokeWidth="1.5" />
        {/* Regression Line */}
        <line x1="355" y1="165" x2="600" y2="46" stroke="#38BDF8" strokeWidth="2.4" />
        {/* 6 Plotted Data Points */}
        {[
          { x: 375, y: 155 },
          { x: 418, y: 134 },
          { x: 460, y: 114 },
          { x: 502, y: 93 },
          { x: 545, y: 73 },
          { x: 588, y: 52 },
        ].map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="4.2" fill="#FDBA74" stroke="#0B1220" strokeWidth="1.4" />
        ))}
        {/* Large Slope Triangle */}
        <path d="M418 134 L545 134 L545 73" fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="485" y="149" textAnchor="middle" fill="#4ADE80" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
          ΔL = 0.400 m · ΔT² = 1.610 s²
        </text>
        <text x="478" y="192" textAnchor="middle" fill="#93A0B8" fontSize="9" fontFamily="JetBrains Mono, monospace">
          Effective Length L (0.20 m → 0.90 m)
        </text>
      </svg>
    ),
  },
  {
    id: 'chemistry',
    discipline: 'CHEMISTRY LAB · VOLUMETRIC & QUALITATIVE ANALYSIS',
    badgeClass: 'bg-[#431407] text-[#FDBA74] border-[#EA580C]/50',
    dotColor: 'bg-[#F97316]',
    accentBar: 'bg-[#F97316]',
    title: 'Acid–Base Titration — Standardizing Hydrochloric Acid with Na₂CO₃',
    apparatusSummary:
      '50.00 cm³ Class A burette · 25.0 cm³ bulb pipette · conical flask on white porcelain tile · methyl orange indicator',
    telemetry: [
      { label: 'Concordant Titre V_A', value: '24.50 cm³ (±0.05)', tone: 'text-[#FDBA74]' },
      { label: 'Pipette Aliquot V_B', value: '25.00 cm³ Na₂CO₃', tone: 'text-[#E6EBF5]' },
      { label: 'End-Point pH Jump', value: 'pH 3.7 (Orange-Pink)', tone: 'text-[#4ADE80]' },
    ],
    calcLines: {
      formulaVar: 'C_A · V_A / (C_B · V_B) = n_A / n_B',
      formulaRest: '   |   Na₂CO₃(aq) + 2HCl(aq) → 2NaCl(aq) + H₂O(l) + CO₂(g)',
      workingLine: 'C_A = (2 × 0.0500 mol dm⁻³ × 25.00 cm³) / 24.50 cm³ = 0.1020 mol dm⁻³',
      extraWorkingLine:
        'Concordant burette table: Rough 24.80 · Titre I 24.50 · Titre II 24.50 · Titre III 24.45 cm³ (all to 2 d.p.)',
      resultLine: 'C_A = 0.102 mol dm⁻³ · Mass conc = 0.102 × 36.5 = 3.72 g dm⁻³ ✓ (10 / 10 marks)',
    },
    renderSvg: () => (
      <svg viewBox="0 0 640 215" className="w-full h-auto block">
        {/* Left Panel: Burette on Retort Stand + Conical Flask on White Tile + Meniscus Reader */}
        <rect x="8" y="8" width="285" height="199" rx="10" fill="#080E1A" stroke="#1E2A42" />
        <text x="22" y="26" fill="#FDBA74" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          VOLUMETRIC BENCH · MENISCUS AT EYE LEVEL
        </text>
        <rect x="44" y="186" width="212" height="7" rx="3" fill="#E2E8F0" />
        {/* Burette column */}
        <rect x="136" y="34" width="18" height="84" rx="2" fill="#121A2B" stroke="#93C5FD" strokeWidth="1.6" />
        <rect x="138" y="54" width="14" height="63" fill="#38BDF8" fillOpacity="0.4" />
        <path d="M138 54 Q145 58 152 54" fill="none" stroke="#BAE6FD" strokeWidth="2" />
        {/* PTFE Stopcock */}
        <rect x="128" y="118" width="34" height="6" rx="2" fill="#F97316" />
        <circle cx="145" cy="133" r="3" fill="#38BDF8" className="animate-ping" />
        {/* Conical Flask */}
        <path
          d="M136 138 L154 138 L154 152 L178 186 L112 186 L136 152 Z"
          fill="#FB923C"
          fillOpacity="0.4"
          stroke="#F8FAFC"
          strokeWidth="1.8"
        />
        {/* Magnified Meniscus Callout */}
        <circle cx="232" cy="76" r="34" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.6" />
        <path d="M208 72 Q232 84 256 72" fill="none" stroke="#38BDF8" strokeWidth="2.2" />
        <line x1="204" y1="80" x2="260" y2="80" stroke="#4ADE80" strokeDasharray="3 2" strokeWidth="1.4" />
        <text x="232" y="96" textAnchor="middle" fill="#4ADE80" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
          24.50 cm³
        </text>

        {/* Right Panel: Sigmoidal pH Titration Curve & Equivalence Point */}
        <rect x="305" y="8" width="327" height="199" rx="10" fill="#080E1A" stroke="#1E2A42" />
        <text x="320" y="26" fill="#FDBA74" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          pH TITRATION CURVE · EQUIVALENCE AT 24.50 cm³
        </text>
        {[55, 85, 115, 145].map((gy) => (
          <line key={gy} x1="345" y1={gy} x2="610" y2={gy} stroke="#142038" strokeWidth="1" />
        ))}
        <line x1="345" y1="172" x2="612" y2="172" stroke="#475569" strokeWidth="1.5" />
        <line x1="345" y1="40" x2="345" y2="172" stroke="#475569" strokeWidth="1.5" />
        {/* Methyl orange transition band */}
        <rect x="346" y="118" width="264" height="22" fill="#F97316" fillOpacity="0.14" />
        <path
          d="M352 52 C405 55, 462 64, 476 82 L480 144 C488 158, 540 162, 602 164"
          fill="none"
          stroke="#F97316"
          strokeWidth="2.6"
        />
        <line x1="478" y1="40" x2="478" y2="172" stroke="#4ADE80" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="478" cy="128" r="5" fill="#4ADE80" stroke="#080E1A" strokeWidth="1.5" />
        <text x="545" y="125" textAnchor="middle" fill="#4ADE80" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
          End-point V_A = 24.50 cm³
        </text>
        <text x="478" y="192" textAnchor="middle" fill="#93A0B8" fontSize="9" fontFamily="JetBrains Mono, monospace">
          Volume of 0.102 M HCl added from burette (cm³)
        </text>
      </svg>
    ),
  },
  {
    id: 'biology',
    discipline: 'BIOLOGY LAB · HUMAN ANATOMY & MAMMALIAN DISSECTION',
    badgeClass: 'bg-[#052E16] text-[#86EFAC] border-[#16A34A]/50',
    dotColor: 'bg-[#22C55E]',
    accentBar: 'bg-[#22C55E]',
    title: '6-System Medical Atlas, 18-Organ Dissection & Renal/Cardiac Telemetry',
    apparatusSummary:
      'Engraved Folio Atlas · 18-Organ Rabbit/Rat Dissection · Lead II P-QRS-T ECG · Nephron GFR & Alveolar O₂',
    telemetry: [
      { label: 'Cardiac Output CO', value: '5.04 L/min (72 bpm)', tone: 'text-[#FCA5A5]' },
      { label: 'Glomerular Filtration', value: '125 mL/min (NFP +10)', tone: 'text-[#FDBA74]' },
      { label: 'Alveolar SpO₂ / PO₂', value: '98% · 104 mmHg', tone: 'text-[#4ADE80]' },
    ],
    calcLines: {
      formulaVar: 'CO = HR × SV',
      formulaRest: '   |   NFP = P_GC − (P_BC + π_GC) = 55 − (15 + 30) = +10 mmHg',
      workingLine: 'CO = 72 beats min⁻¹ × 0.070 dm³ beat⁻¹ = 5.04 dm³ min⁻¹ · GFR = 125 mL min⁻¹ (180 L/day)',
      extraWorkingLine:
        'PCT selectively reabsorbs 100% glucose & amino acids · Loop of Henle counter-current multiplier + ADH AQP-2',
      resultLine: 'Homeostasis verified ✓ Left ventricle 3× thicker (120 mmHg systemic vs 25 mmHg pulmonary)',
    },
    renderSvg: () => (
      <svg viewBox="0 0 640 215" className="w-full h-auto block">
        {/* Left Panel: Detailed Anatomical Torso Cutaway (Lungs, 4-Chamber Heart, Liver, Stomach, Kidneys) */}
        <rect x="8" y="8" width="285" height="199" rx="10" fill="#080E1A" stroke="#1E2A42" />
        <text x="22" y="26" fill="#4ADE80" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          6-SYSTEM ANATOMICAL CUTAWAY ATLAS
        </text>
        {/* Trachea */}
        <line x1="150" y1="36" x2="150" y2="72" stroke="#E2E8F0" strokeWidth="7" strokeLinecap="round" />
        {/* Right & Left Lungs */}
        <path
          d="M140 58 C108 56, 92 84, 94 114 C98 126, 128 122, 142 110 Z M160 58 C192 56, 208 84, 206 114 C202 126, 172 122, 158 110 Z"
          fill="#38BDF8"
          fillOpacity="0.45"
          stroke="#7DD3FC"
          strokeWidth="1.6"
        />
        {/* 4-Chamber Heart */}
        <path
          d="M150 84 C138 74, 132 98, 154 114 C172 98, 164 74, 150 84 Z"
          fill="#DC2626"
          stroke="#FCA5A5"
          strokeWidth="1.8"
        />
        {/* Diaphragm Dome */}
        <path d="M90 124 Q150 106 210 124" fill="none" stroke="#4ADE80" strokeWidth="3" />
        {/* Multi-lobed Liver, Gallbladder & Stomach */}
        <path d="M96 128 Q126 118 152 130 L136 154 Q102 154 96 128 Z" fill="#991B1B" stroke="#F87171" strokeWidth="1.4" />
        <ellipse cx="124" cy="150" rx="6" ry="3.5" fill="#22C55E" />
        <path d="M156 126 C184 124, 196 142, 182 156 C170 164, 152 158, 156 126 Z" fill="#EC4899" fillOpacity="0.75" stroke="#F9A8D4" strokeWidth="1.4" />
        {/* Paired Kidneys & Aorta/Vena Cava */}
        <line x1="147" y1="112" x2="147" y2="194" stroke="#EF4444" strokeWidth="2.6" />
        <line x1="153" y1="112" x2="153" y2="194" stroke="#3B82F6" strokeWidth="2.6" />
        <ellipse cx="122" cy="174" rx="9" ry="13" fill="#EA580C" stroke="#FDBA74" strokeWidth="1.4" />
        <ellipse cx="178" cy="174" rx="9" ry="13" fill="#EA580C" stroke="#FDBA74" strokeWidth="1.4" />

        {/* Right Panel: Live Lead II P-QRS-T ECG Trace & Nephron Counter-Current Telemetry */}
        <rect x="305" y="8" width="327" height="199" rx="10" fill="#080E1A" stroke="#1E2A42" />
        <text x="320" y="26" fill="#4ADE80" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          LEAD II ECG (P-QRS-T) &amp; NEPHRON OSMOLARITY
        </text>
        {[60, 95, 130, 165].map((gy) => (
          <line key={gy} x1="325" y1={gy} x2="615" y2={gy} stroke="#13223B" strokeWidth="1" />
        ))}
        <path
          d="M325 112 L348 112 Q358 96 368 112 L380 112 L386 124 L395 54 L404 136 L412 112 L428 112 Q442 88 456 112 L488 112 Q498 96 508 112 L520 112 L526 124 L535 54 L544 136 L552 112 L568 112 Q582 88 596 112 L615 112"
          fill="none"
          stroke="#4ADE80"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="358" y="90" fill="#86EFAC" fontSize="9" textAnchor="middle">P</text>
        <text x="395" y="48" fill="#86EFAC" fontSize="9" textAnchor="middle">R</text>
        <text x="383" y="140" fill="#86EFAC" fontSize="8" textAnchor="middle">Q</text>
        <text x="407" y="146" fill="#86EFAC" fontSize="8" textAnchor="middle">S</text>
        <text x="442" y="84" fill="#86EFAC" fontSize="9" textAnchor="middle">T</text>
        <text x="470" y="190" textAnchor="middle" fill="#93A0B8" fontSize="9" fontFamily="JetBrains Mono, monospace">
          SA Node 72 bpm · Cortex 300 → Medulla 1200 mOsm/L
        </text>
      </svg>
    ),
  },
  {
    id: 'electronics',
    discipline: 'ELECTRONICS LAB · CIRCUIT & OHM’S LAW WORKBENCH',
    badgeClass: 'bg-[#042F2E] text-[#5EEAD4] border-[#0D9488]/50',
    dotColor: 'bg-[#14B8A6]',
    accentBar: 'bg-[#14B8A6]',
    title: "Verifying Ohm's Law — Resistance & Resistivity of Nichrome Wire X",
    apparatusSummary:
      '3.0 V DC supply · 0–20 Ω sliding rheostat · series ammeter (0–1 A) · parallel voltmeter (0–3 V) · 100 cm wire X',
    telemetry: [
      { label: 'Potential Diff V', value: '1.06 V (±0.01 V)', tone: 'text-[#FDBA74]' },
      { label: 'Series Current I', value: '0.225 A (225 mA)', tone: 'text-[#5EEAD4]' },
      { label: 'Wire X Temp', value: '27.0 °C (α = 0.0004/K)', tone: 'text-[#E6EBF5]' },
    ],
    calcLines: {
      formulaVar: 'R_X = ΔV / ΔI',
      formulaRest: '   |   ρ = (R_X · A) / L = (R_X · π d²) / (4 L)',
      workingLine: 'slope (V vs I) = (1.88 V − 0.47 V) / (0.400 A − 0.100 A) = 4.70 Ω',
      extraWorkingLine:
        'SWG 28 Nichrome wire diameter d = 0.376 mm (A = 1.11 × 10⁻⁷ m²) · L = 1.000 m · Key opened between readings',
      resultLine: 'R_X = 4.70 Ω ± 0.03 Ω · ρ = 5.22 × 10⁻⁷ Ω m ✓ Ohmic linearity confirmed',
    },
    renderSvg: () => (
      <svg viewBox="0 0 640 215" className="w-full h-auto block">
        {/* Left Panel: Complete Schematic Loop with Rheostat, Series Ammeter & Parallel Voltmeter */}
        <rect x="8" y="8" width="285" height="199" rx="10" fill="#080E1A" stroke="#1E2A42" />
        <text x="22" y="26" fill="#5EEAD4" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          SCHEMATIC LOOP · CURRENT 0.225 A
        </text>
        <rect x="38" y="58" width="204" height="114" fill="none" stroke="#38BDF8" strokeWidth="2" />
        {/* Animated current flow dashes */}
        <rect x="38" y="58" width="204" height="114" fill="none" stroke="#5EEAD4" strokeWidth="2.2" strokeDasharray="5 12" />
        {/* Rheostat zig-zag on top branch */}
        <rect x="82" y="48" width="84" height="20" fill="#080E1A" />
        <path
          d="M82 58 L90 48 L100 68 L110 48 L120 68 L130 48 L140 68 L150 48 L158 58 L166 58"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="2"
        />
        <text x="124" y="42" textAnchor="middle" fill="#5EEAD4" fontSize="9" fontFamily="JetBrains Mono, monospace">
          Rh = 8.0 Ω
        </text>
        {/* Series Ammeter A */}
        <circle cx="204" cy="58" r="14" fill="#121A2B" stroke="#4ADE80" strokeWidth="2" />
        <text x="204" y="62" textAnchor="middle" fill="#4ADE80" fontSize="11" fontWeight="700">A</text>
        {/* Test Wire X on right vertical branch */}
        <rect x="234" y="92" width="16" height="46" rx="3" fill="#1C2A47" stroke="#FDBA74" strokeWidth="2" />
        <text x="226" y="119" textAnchor="end" fill="#FDBA74" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
          X (4.7Ω)
        </text>
        {/* Parallel Voltmeter V */}
        <path d="M242 82 L274 82 L274 148 L242 148" fill="none" stroke="#F472B6" strokeWidth="1.6" />
        <circle cx="274" cy="115" r="13" fill="#121A2B" stroke="#F472B6" strokeWidth="2" />
        <text x="274" y="119" textAnchor="middle" fill="#F472B6" fontSize="11" fontWeight="700">V</text>

        {/* Right Panel: V vs I Linear Ohmic Plot */}
        <rect x="305" y="8" width="327" height="199" rx="10" fill="#080E1A" stroke="#1E2A42" />
        <text x="320" y="26" fill="#5EEAD4" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          OHMIC V–I CHARACTERISTIC · SLOPE = 4.70 Ω
        </text>
        {[55, 85, 115, 145].map((gy) => (
          <line key={gy} x1="345" y1={gy} x2="610" y2={gy} stroke="#142038" strokeWidth="1" />
        ))}
        <line x1="345" y1="172" x2="612" y2="172" stroke="#475569" strokeWidth="1.5" />
        <line x1="345" y1="40" x2="345" y2="172" stroke="#475569" strokeWidth="1.5" />
        <line x1="345" y1="172" x2="596" y2="48" stroke="#2DD4BF" strokeWidth="2.4" />
        {[0.18, 0.36, 0.54, 0.72, 0.9].map((t, idx) => (
          <circle
            key={idx}
            cx={345 + t * 250}
            cy={172 - t * 124}
            r="4.2"
            fill="#5EEAD4"
            stroke="#080E1A"
            strokeWidth="1.4"
          />
        ))}
        <text x="478" y="192" textAnchor="middle" fill="#93A0B8" fontSize="9" fontFamily="JetBrains Mono, monospace">
          Current I (0.00 A → 0.50 A) · P = 239 mW
        </text>
      </svg>
    ),
  },
  {
    id: 'engineering',
    discipline: 'ENGINEERING LAB · SOLID MECHANICS & STRUCTURES',
    badgeClass: 'bg-[#3B0764] text-[#D8B4FE] border-[#9333EA]/50',
    dotColor: 'bg-[#A855F7]',
    accentBar: 'bg-[#A855F7]',
    title: "3D Cantilever Beam Deflection — Euler–Bernoulli Young's Modulus E",
    apparatusSummary:
      'Structural steel cantilever (L = 600 mm, b = 25.0 mm, d = 5.00 mm) · 0.01 mm plunger dial indicator · slotted weights',
    telemetry: [
      { label: 'Applied Tip Load F', value: '19.62 N (2.00 kg)', tone: 'text-[#FDBA74]' },
      { label: 'Dial Gauge Deflection δ', value: '3.36 mm (±0.01 mm)', tone: 'text-[#D8B4FE]' },
      { label: 'Max Bending Stress σ', value: '112.9 MPa (< σ_y)', tone: 'text-[#4ADE80]' },
    ],
    calcLines: {
      formulaVar: 'E = (F · L³) / (3 · I · δ)',
      formulaRest: '   where Second Moment of Area I = (b · d³) / 12',
      workingLine: 'I = (0.025 m × (0.005 m)³) / 12 = 2.604 × 10⁻¹⁰ m⁴ · L³ = (0.600 m)³ = 0.216 m³',
      extraWorkingLine:
        'Linear elastic compliance Δδ / ΔF = 0.1713 mm N⁻¹ · Unloading zero return = 0.00 mm (zero plastic yield)',
      resultLine: 'E = 19.62 × 0.216 / (3 × 2.604×10⁻¹⁰ × 0.00336) = 205.4 GPa ✓ structural steel',
    },
    renderSvg: () => (
      <svg viewBox="0 0 640 215" className="w-full h-auto block">
        {/* Left Panel: Rigid Anchor Wall + Deflected Cantilever Beam + Dial Indicator + Hanging Load */}
        <rect x="8" y="8" width="285" height="199" rx="10" fill="#080E1A" stroke="#1E2A42" />
        <text x="22" y="26" fill="#D8B4FE" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          CANTILEVER RIG · L = 600 mm · δ = 3.36 mm
        </text>
        {/* Fixed Rigid Wall Clamp */}
        <rect x="24" y="44" width="26" height="132" rx="3" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        {/* Undeformed neutral axis reference */}
        <line x1="50" y1="84" x2="256" y2="84" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />
        {/* Elastic Deflected Beam Curve colored by von Mises bending stress */}
        <path
          d="M50 84 C112 84, 184 102, 252 132"
          fill="none"
          stroke="url(#beamStressGrad)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="beamStressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        {/* Dial Test Indicator above tip */}
        <circle cx="252" cy="54" r="16" fill="#121A2B" stroke="#D8B4FE" strokeWidth="1.8" />
        <line x1="252" y1="54" x2="261" y2="47" stroke="#FDBA74" strokeWidth="2" />
        <line x1="252" y1="70" x2="252" y2="128" stroke="#CBD5E1" strokeWidth="1.8" />
        {/* Slotted Mass Hanger at Free End */}
        <line x1="252" y1="132" x2="252" y2="162" stroke="#E2E8F0" strokeWidth="2" />
        <rect x="238" y="162" width="28" height="20" rx="3" fill="#F59E0B" stroke="#FDE68A" strokeWidth="1.2" />
        <text x="150" y="186" textAnchor="middle" fill="#D8B4FE" fontSize="9" fontFamily="JetBrains Mono, monospace">
          F = 19.62 N (2.0 kg) · σ_max at root
        </text>

        {/* Right Panel: Load F vs Tip Deflection δ Plot */}
        <rect x="305" y="8" width="327" height="199" rx="10" fill="#080E1A" stroke="#1E2A42" />
        <text x="320" y="26" fill="#D8B4FE" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          ELASTIC COMPLIANCE · DEFLECTION δ VS LOAD F
        </text>
        {[55, 85, 115, 145].map((gy) => (
          <line key={gy} x1="345" y1={gy} x2="610" y2={gy} stroke="#142038" strokeWidth="1" />
        ))}
        <line x1="345" y1="172" x2="612" y2="172" stroke="#475569" strokeWidth="1.5" />
        <line x1="345" y1="40" x2="345" y2="172" stroke="#475569" strokeWidth="1.5" />
        <line x1="345" y1="172" x2="598" y2="48" stroke="#C084FC" strokeWidth="2.4" />
        {[0.25, 0.5, 0.75, 1.0].map((t, idx) => (
          <circle
            key={idx}
            cx={345 + t * 250}
            cy={172 - t * 122}
            r="4.5"
            fill="#FDBA74"
            stroke="#080E1A"
            strokeWidth="1.4"
          />
        ))}
        <text x="478" y="192" textAnchor="middle" fill="#93A0B8" fontSize="9" fontFamily="JetBrains Mono, monospace">
          Applied Load F (0 N → 20 N) · Young’s Modulus E = 205.4 GPa
        </text>
      </svg>
    ),
  },
];

export function Auth() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'create' ? 'create' : 'signin';
  const initialRole = (searchParams.get('role') as Role) || 'student';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [role, setRole] = useState<Role>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Continuous auto-scrolling carousel state (moves on its own every 4.2 seconds)
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % LAB_CAROUSEL_SLIDES.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = LAB_CAROUSEL_SLIDES[slideIndex] ?? LAB_CAROUSEL_SLIDES[0]!;

  const navigate = useNavigate();
  const nextRoute = searchParams.get('next');

  // Validates school email (e.g. adaora@kings.edu.ng) OR matric/admission number (e.g. 2025/PHY/0142)
  const validateEmailOrMatric = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return 'Enter your school email or matric / admission number';
    }
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
    const isMatric =
      /^[A-Za-z0-9]{2,}[/-][A-Za-z0-9/-]{3,}$/.test(trimmed) ||
      (/^[A-Za-z0-9]{6,20}$/.test(trimmed) && /\d/.test(trimmed) && /[A-Za-z]/.test(trimmed));
    if (!isEmail && !isMatric) {
      return 'Enter a valid school email (e.g. adaora@kings.edu.ng) or matric number (e.g. 2025/PHY/0142)';
    }
    return null;
  };

  const validatePassword = (raw: string, requireComplexity = false): string | null => {
    if (!raw) {
      return 'Enter your password';
    }
    if (raw.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (requireComplexity && (!/[A-Za-z]/.test(raw) || !/\d/.test(raw))) {
      return 'Password must include at least one letter and one number';
    }
    return null;
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    const emailErr = validateEmailOrMatric(email);
    if (emailErr) nextErrors.email = emailErr;

    const passErr = validatePassword(password, false);
    if (passErr) nextErrors.password = passErr;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    if (nextRoute) {
      navigate(nextRoute);
      return;
    }
    if (email.toLowerCase().includes('teacher') || email.toLowerCase().includes('bello')) {
      navigate('/teacher');
    } else if (email.toLowerCase().includes('admin')) {
      navigate('/admin');
    } else {
      navigate('/app');
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 3 || !trimmedName.includes(' ')) {
      nextErrors.fullName = 'Enter your full name (first and last name)';
    }

    const emailErr = validateEmailOrMatric(email);
    if (emailErr) nextErrors.email = emailErr;

    const passErr = validatePassword(password, true);
    if (passErr) nextErrors.password = passErr;

    const trimmedCode = code.trim();
    if (trimmedCode && !/^[A-Za-z0-9-]{4,24}$/.test(trimmedCode)) {
      nextErrors.code = 'Enter a valid code (4–24 letters, numbers, or hyphens)';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    if (nextRoute) {
      navigate(nextRoute);
      return;
    }
    if (role === 'student') navigate('/app');
    else if (role === 'teacher') navigate('/teacher');
    else navigate('/admin');
  };

  const getCodeFieldLabel = () => {
    if (role === 'student') return 'Class code';
    if (role === 'teacher') return 'Department invite code';
    return 'Institution setup code';
  };

  const getCodePlaceholder = () => {
    if (role === 'student') return 'e.g. PHY-SS3-7KQ2';
    if (role === 'teacher') return 'e.g. DEPT-PHY-2026';
    return 'e.g. INST-KCL-2026';
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F5F7FA]">
      {/* Left dark panel — Full-width & full-height auto-scrolling 5-Lab Bench & Calculation Showcase */}
      <div className="lg:col-span-6 bg-[#0B1220] text-[#E6EBF5] p-6 sm:p-10 xl:p-12 flex flex-col justify-between gap-6">
        {/* Top Brand Row */}
        <div className="flex items-center justify-between w-full">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img
              src="/illustrations/logo.svg"
              alt=""
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-display font-bold text-xl text-white tracking-tight">
              Vixir
            </span>
          </Link>

         
        </div>

        {/* Full-Width Center Content & Auto-Scrolling Carousel Card */}
        <div className="w-full flex-1 flex flex-col justify-center space-y-5">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl xl:text-[42px] font-bold text-white leading-[1.12] tracking-tight mb-2.5">
              Your lab bench is ready.
            </h1>
            <p className="text-sm sm:text-base text-[#93A0B8] leading-relaxed">
              Sign in with the account your school or department created, or join a class with the
              code your teacher gave you.
            </p>
          </div>

          
          {/* Full-Panel Carousel Card: Bench Simulation + 3-Tile Telemetry + Workbook Calculation */}
          <div className="w-full bg-[#121A2B] border border-[#22304A] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-block px-3 py-1 rounded-full border text-[11px] font-bold tracking-wider uppercase ${activeSlide.badgeClass}`}
              >
                {activeSlide.discipline}
              </span>
              <div className="flex items-center gap-1.5">
                {LAB_CAROUSEL_SLIDES.map((s, idx) => (
                  <span
                    key={s.id}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === slideIndex ? `w-7 ${activeSlide.accentBar}` : 'w-2 bg-[#22304A]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                {activeSlide.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#93A0B8] mt-1">
                {activeSlide.apparatusSummary}
              </p>
            </div>

            {/* Wide Full-Bleed Live Mini-Bench & Regression Plot SVG */}
            <div className="w-full bg-[#0B1220] border border-[#1E2A42] rounded-xl p-2.5">
              {activeSlide.renderSvg()}
            </div>

            {/* 3-Column Live Instrument Telemetry Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {activeSlide.telemetry.map((t) => (
                <div
                  key={t.label}
                  className="bg-[#0B1220] border border-[#1E2A42] rounded-xl px-3.5 py-2.5"
                >
                  <div className="text-[10px] uppercase tracking-wider text-[#93A0B8] mb-0.5">
                    {t.label}
                  </div>
                  <div className={`font-mono text-xs sm:text-sm font-bold ${t.tone ?? 'text-white'}`}>
                    {t.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Multi-Line Live Calculation & Auto-Marking Terminal Card */}
            <div className="w-full bg-[#090E1A] border border-[#22304A] rounded-xl p-4 font-mono text-xs sm:text-[13px] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#6B778C] pb-1.5 border-b border-[#1E2A42]">
                <span>LIVE WORKBOOK CALCULATION &amp; WAEC / NECO AUTO-MARKING</span>
                <span>
                  AUTO-SCROLL · {slideIndex + 1} / {LAB_CAROUSEL_SLIDES.length}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[#FDBA74] font-bold">
                  {activeSlide.calcLines.formulaVar}
                </span>
                <span className="text-[#C9D3E6]">{activeSlide.calcLines.formulaRest}</span>
              </div>
              <div className="text-[#C9D3E6]">{activeSlide.calcLines.workingLine}</div>
              <div className="text-[#93A0B8] text-xs">
                {activeSlide.calcLines.extraWorkingLine}
              </div>
              <div className="text-[#4ADE80] font-semibold pt-0.5">
                {activeSlide.calcLines.resultLine}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#6B778C] w-full">
          <span>Works offline once installed · Data stays with your institution</span>
          <span className="font-mono text-[11px]">WAEC · NECO · JAMB · NUC</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[440px]">
          {/* Segmented Pill Toggle */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="bg-[#E8ECF2] p-1 rounded-xl grid grid-cols-2 mb-7"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signin'}
              onClick={() => {
                setTab('signin');
                setErrors({});
              }}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'signin'
                  ? 'bg-white text-[#0E1726] shadow-xs'
                  : 'text-[#475467] hover:text-[#0E1726]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'create'}
              onClick={() => {
                setTab('create');
                setErrors({});
              }}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'create'
                  ? 'bg-white text-[#0E1726] shadow-xs'
                  : 'text-[#475467] hover:text-[#0E1726]'
              }`}
            >
              Create account
            </button>
          </div>

          {tab === 'signin' ? (
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0E1726] mb-6">
                Welcome back
              </h2>

              <form onSubmit={handleSignIn} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-xs font-semibold text-[#0E1726] mb-1.5"
                  >
                    Email or matric / admission number
                  </label>
                  <input
                    id="signin-email"
                    type="text"
                    aria-invalid={Boolean(errors.email)}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="e.g. 2025/PHY/0142"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-[#C4321C] focus:ring-[#C4321C]'
                        : 'border-[#D0D7E2] focus:ring-[#2448D8]'
                    }`}
                  />
                  {errors.email && (
                    <p role="alert" className="text-xs font-medium text-[#C4321C] mt-1.5">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signin-password"
                    className="block text-xs font-semibold text-[#0E1726] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      aria-invalid={Boolean(errors.password)}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="••••••••"
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 pr-10 ${
                        errors.password
                          ? 'border-[#C4321C] focus:ring-[#C4321C]'
                          : 'border-[#D0D7E2] focus:ring-[#2448D8]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B778C] hover:text-[#0E1726]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p role="alert" className="text-xs font-medium text-[#C4321C] mt-1.5">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="inline-flex items-center gap-2 text-[#0E1726] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      className="rounded border-[#D0D7E2] text-[#2448D8] focus:ring-[#2448D8]"
                    />
                    <span>Keep me signed in on this device</span>
                  </label>
                  <a
                    href="#forgot-password"
                    onClick={(e) => e.preventDefault()}
                    className="text-[#2448D8] hover:underline font-medium"
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-sm font-semibold transition-colors mt-2 cursor-pointer"
                >
                  Sign in
                </button>
              </form>

              <div className="relative my-6 flex items-center justify-center">
                <div className="border-t border-[#D0D7E2] w-full" />
                <span className="bg-[#F5F7FA] px-3 text-xs text-[#6B778C]">or</span>
                <div className="border-t border-[#D0D7E2] w-full" />
              </div>

              <button
                type="button"
                onClick={() => navigate('/app')}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-[#EDF1F7] border border-[#D0D7E2] text-[#0E1726] text-sm font-semibold transition-colors cursor-pointer"
              >
                Continue with school SSO
              </button>

              <p className="text-center text-xs text-[#475467] mt-6">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => setTab('create')}
                  className="text-[#2448D8] font-semibold hover:underline cursor-pointer"
                >
                  Create an account
                </button>{' '}
                or{' '}
                <Link
                  to="/lab/physics/pendulum"
                  className="text-[#2448D8] font-semibold hover:underline"
                >
                  try a lab without signing in →
                </Link>
              </p>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0E1726] mb-1">
                Create your account
              </h2>
              <p className="text-xs text-[#475467] mb-5">
                Pick your role so we set up the right workspace.
              </p>

              {/* Role selector */}
              <div
                role="radiogroup"
                aria-label="Role"
                className="grid grid-cols-3 gap-2.5 mb-5"
              >
                {(
                  [
                    { id: 'student', title: 'Student', sub: 'Run practicals' },
                    { id: 'teacher', title: 'Teacher', sub: 'Assign & mark' },
                    { id: 'admin', title: 'Admin', sub: 'School setup' },
                  ] as const
                ).map((r) => {
                  const selected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setRole(r.id)}
                      className={`text-left p-3 rounded-xl transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#EAEFFE] border-2 border-[#2448D8]'
                          : 'bg-white border border-[#D0D7E2] hover:border-[#93A0B8]'
                      }`}
                    >
                      <div className="font-display text-sm font-bold text-[#0E1726]">
                        {r.title}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          selected ? 'text-[#2448D8] font-medium' : 'text-[#475467]'
                        }`}
                      >
                        {r.sub}
                      </div>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleCreateAccount} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="create-name"
                    className="block text-xs font-semibold text-[#0E1726] mb-1.5"
                  >
                    Full name
                  </label>
                  <input
                    id="create-name"
                    type="text"
                    aria-invalid={Boolean(errors.fullName)}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    placeholder="e.g. Adaora Nwosu"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 ${
                      errors.fullName
                        ? 'border-[#C4321C] focus:ring-[#C4321C]'
                        : 'border-[#D0D7E2] focus:ring-[#2448D8]'
                    }`}
                  />
                  {errors.fullName && (
                    <p role="alert" className="text-xs font-medium text-[#C4321C] mt-1.5">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="create-email"
                    className="block text-xs font-semibold text-[#0E1726] mb-1.5"
                  >
                    School email or admission number
                  </label>
                  <input
                    id="create-email"
                    type="text"
                    aria-invalid={Boolean(errors.email)}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="e.g. adaora.nwosu@kings.edu.ng"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-[#C4321C] focus:ring-[#C4321C]'
                        : 'border-[#D0D7E2] focus:ring-[#2448D8]'
                    }`}
                  />
                  {errors.email && (
                    <p role="alert" className="text-xs font-medium text-[#C4321C] mt-1.5">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="create-password"
                    className="block text-xs font-semibold text-[#0E1726] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="create-password"
                      type={showPassword ? 'text' : 'password'}
                      aria-invalid={Boolean(errors.password)}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="At least 8 characters (letters & numbers)"
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 pr-10 ${
                        errors.password
                          ? 'border-[#C4321C] focus:ring-[#C4321C]'
                          : 'border-[#D0D7E2] focus:ring-[#2448D8]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B778C] hover:text-[#0E1726]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p role="alert" className="text-xs font-medium text-[#C4321C] mt-1.5">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="create-code"
                      className="block text-xs font-semibold text-[#0E1726]"
                    >
                      {getCodeFieldLabel()}
                    </label>
                    <span className="text-xs text-[#6B778C]">
                      optional — join a class now or later
                    </span>
                  </div>
                  <input
                    id="create-code"
                    type="text"
                    aria-invalid={Boolean(errors.code)}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (errors.code) setErrors((prev) => ({ ...prev, code: '' }));
                    }}
                    placeholder={getCodePlaceholder()}
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-mono text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 ${
                      errors.code
                        ? 'border-[#C4321C] focus:ring-[#C4321C]'
                        : 'border-[#D0D7E2] focus:ring-[#2448D8]'
                    }`}
                  />
                  {errors.code && (
                    <p role="alert" className="text-xs font-medium text-[#C4321C] mt-1.5">
                      {errors.code}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-sm font-semibold transition-colors mt-2 cursor-pointer"
                >
                  Create account →
                </button>
              </form>

              <p className="text-center text-xs text-[#475467] mt-6">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="text-[#2448D8] font-semibold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
