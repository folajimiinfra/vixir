import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

type Tab = 'signin' | 'create';
type Role = 'student' | 'teacher' | 'admin';

interface LabCarouselSlide {
  id: string;
  discipline: string;
  badgeClass: string;
  dotColor: string;
  title: string;
  apparatusSummary: string;
  telemetryLeft: { label: string; value: string };
  telemetryRight: { label: string; value: string };
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
    discipline: 'PHYSICS LAB · MECHANICS',
    badgeClass: 'bg-[#172554] text-[#93C5FD] border-[#1D4ED8]/50',
    dotColor: 'bg-[#3B82F6]',
    title: 'Simple Pendulum — Determination of g',
    apparatusSummary: 'Retort stand · split cork · 80.0 cm inextensible thread · brass bob · 0.01 s stopwatch',
    telemetryLeft: { label: 'Effective Length L', value: '0.800 m (80.0 cm)' },
    telemetryRight: { label: '20 Oscillations t₂₀', value: '35.88 s (T = 1.794 s)' },
    calcLines: {
      formulaVar: 'g',
      formulaRest: ' = 4π² / slope',
      workingLine: 'slope (T² vs L) = (3.218 − 1.608) / (0.800 − 0.400) = 4.02 s² m⁻¹',
      extraWorkingLine: 'T² = 3.218 s² at L = 0.800 m · r² = 0.9994 (6 lengths plotted)',
      resultLine: 'g = 9.82 m s⁻² ✓ within 0.1% of standard 9.81 m s⁻²',
    },
    renderSvg: () => (
      <svg viewBox="0 0 360 135" className="w-full h-32">
        {/* Left: Retort stand & swinging pendulum */}
        <rect x="18" y="118" width="136" height="6" rx="2" fill="#22304A" />
        <rect x="28" y="14" width="6" height="104" rx="2" fill="#475569" />
        <rect x="30" y="18" width="68" height="5" rx="2" fill="#64748B" />
        <rect x="86" y="21" width="12" height="9" rx="2" fill="#A16207" />
        {/* Dashed equilibrium vertical */}
        <line x1="92" y1="30" x2="92" y2="112" stroke="#334155" strokeDasharray="3 3" />
        {/* Angle arc */}
        <path d="M92 52 A22 22 0 0 0 102 50" fill="none" stroke="#38BDF8" strokeWidth="1.5" />
        <text x="108" y="48" fill="#7DD3FC" fontSize="8" fontFamily="JetBrains Mono, monospace">
          θ = 8°
        </text>
        {/* Swinging bob */}
        <g className="pendulum-swing" style={{ transformOrigin: '92px 30px' }}>
          <line x1="92" y1="30" x2="114" y2="98" stroke="#E2E8F0" strokeWidth="1.6" />
          <circle cx="114" cy="98" r="9" fill="#F97316" stroke="#FDBA74" strokeWidth="1.5" />
        </g>

        {/* Right: T² vs L Linear Regression Plot */}
        <rect x="182" y="12" width="164" height="108" rx="8" fill="#090F1C" stroke="#1E2A42" />
        <line x1="204" y1="100" x2="332" y2="100" stroke="#475569" strokeWidth="1.2" />
        <line x1="204" y1="24" x2="204" y2="100" stroke="#475569" strokeWidth="1.2" />
        <text x="268" y="114" textAnchor="middle" fill="#93A0B8" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
          Length L (m)
        </text>
        <text x="195" y="32" textAnchor="end" fill="#93A0B8" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
          T²
        </text>
        {/* Best-fit line & 6 data points */}
        <line x1="208" y1="96" x2="324" y2="28" stroke="#38BDF8" strokeWidth="1.8" />
        {[
          { x: 218, y: 90 },
          { x: 238, y: 78 },
          { x: 258, y: 67 },
          { x: 278, y: 55 },
          { x: 298, y: 43 },
          { x: 318, y: 31 },
        ].map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="2.8" fill="#FDBA74" stroke="#0B1220" strokeWidth="1" />
        ))}
        {/* Slope triangle */}
        <path d="M238 78 L298 78 L298 43" fill="none" stroke="#4ADE80" strokeWidth="1.1" strokeDasharray="3 2" />
        <text x="272" y="90" fill="#4ADE80" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
          ΔT²/ΔL = 4.02
        </text>
      </svg>
    ),
  },
  {
    id: 'chemistry',
    discipline: 'CHEMISTRY LAB · VOLUMETRIC ANALYSIS',
    badgeClass: 'bg-[#431407] text-[#FDBA74] border-[#EA580C]/50',
    dotColor: 'bg-[#F97316]',
    title: 'Acid–Base Titration — Standardizing HCl with Na₂CO₃',
    apparatusSummary: '50.00 cm³ Class A burette · 25.0 cm³ bulb pipette · conical flask · white tile · methyl orange',
    telemetryLeft: { label: 'Concordant Titre V_A', value: '24.50 cm³ (±0.05 cm³)' },
    telemetryRight: { label: 'Pipette Aliquot V_B', value: '25.00 cm³ of 0.050 M Na₂CO₃' },
    calcLines: {
      formulaVar: 'C_A · V_A / (C_B · V_B)',
      formulaRest: ' = n_A / n_B = 2 / 1',
      workingLine: 'C_A = (2 × 0.0500 mol dm⁻³ × 25.00 cm³) / 24.50 cm³',
      extraWorkingLine: 'Concordant titres: 24.50 cm³, 24.50 cm³, 24.45 cm³ (2 d.p. verified)',
      resultLine: 'C_A = 0.102 mol dm⁻³ (3.72 g dm⁻³ HCl) ✓ end-point sharp',
    },
    renderSvg: () => (
      <svg viewBox="0 0 360 135" className="w-full h-32">
        {/* Left: Burette + Conical Flask on White Tile */}
        <rect x="24" y="116" width="124" height="6" rx="2" fill="#E2E8F0" />
        <rect x="78" y="10" width="12" height="58" rx="2" fill="#1E293B" stroke="#93C5FD" strokeWidth="1.4" />
        <rect x="79" y="24" width="10" height="43" fill="#38BDF8" fillOpacity="0.45" />
        {/* Burette meniscus & PTFE stopcock */}
        <path d="M79 24 Q84 27 89 24" fill="none" stroke="#BAE6FD" strokeWidth="1.5" />
        <rect x="74" y="68" width="20" height="4" rx="1.5" fill="#F97316" />
        <circle cx="84" cy="79" r="2" fill="#38BDF8" className="animate-ping" />
        {/* Conical flask */}
        <path
          d="M78 82 L90 82 L90 92 L106 114 L62 114 L78 92 Z"
          fill="#FDBA74"
          fillOpacity="0.35"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />
        <text x="114" y="30" fill="#BAE6FD" fontSize="8" fontFamily="JetBrains Mono, monospace">
          24.50 cm³
        </text>

        {/* Right: Sigmoidal pH Titration Equivalence Curve */}
        <rect x="182" y="12" width="164" height="108" rx="8" fill="#090F1C" stroke="#1E2A42" />
        <line x1="204" y1="100" x2="332" y2="100" stroke="#475569" strokeWidth="1.2" />
        <line x1="204" y1="24" x2="204" y2="100" stroke="#475569" strokeWidth="1.2" />
        <path
          d="M208 32 C236 34, 260 38, 266 48 L268 84 C272 92, 298 94, 326 95"
          fill="none"
          stroke="#F97316"
          strokeWidth="2"
        />
        <line x1="267" y1="24" x2="267" y2="100" stroke="#4ADE80" strokeDasharray="3 2" />
        <circle cx="267" cy="66" r="3.5" fill="#4ADE80" />
        <text x="273" y="64" fill="#4ADE80" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
          Eq pt 24.50
        </text>
        <text x="268" y="114" textAnchor="middle" fill="#93A0B8" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
          Titre Volume V_A (cm³)
        </text>
      </svg>
    ),
  },
  {
    id: 'biology',
    discipline: 'BIOLOGY LAB · ANATOMY & PHYSIOLOGY',
    badgeClass: 'bg-[#052E16] text-[#86EFAC] border-[#16A34A]/50',
    dotColor: 'bg-[#22C55E]',
    title: '6-System Human Atlas & Nephron / Cardiac Physiology',
    apparatusSummary: 'Engraved Folio Atlas · 18-Organ Mammalian Dissection · Lead II ECG · Nephron GFR',
    telemetryLeft: { label: 'Cardiac Output CO', value: '72 bpm × 70 mL = 5.04 L/min' },
    telemetryRight: { label: 'Glomerular Filtration', value: 'GFR = 125 mL/min · SpO₂ 98%' },
    calcLines: {
      formulaVar: 'CO = HR × SV',
      formulaRest: '   |   GFR = K_f × (P_GC − P_BC − π_GC)',
      workingLine: 'Net Filtration Pressure = 55 − 15 − 30 = +10 mmHg across basement membrane',
      extraWorkingLine: 'PCT reabsorbs 100% glucose & amino acids · Loop of Henle counter-current',
      resultLine: 'Homeostasis verified ✓ Arterial PO₂ = 104 mmHg · Urine 600 mOsm/L',
    },
    renderSvg: () => (
      <svg viewBox="0 0 360 135" className="w-full h-32">
        {/* Left: Mini Engraved Anatomical Torso + Heart + Lungs + Kidneys */}
        <rect x="18" y="12" width="146" height="108" rx="8" fill="#090F1C" stroke="#1E2A42" />
        {/* Ribcage & Lungs */}
        <path
          d="M78 32 C62 32, 54 50, 56 70 C60 76, 74 74, 82 66 Z M102 32 C118 32, 126 50, 124 70 C120 76, 106 74, 98 66 Z"
          fill="#38BDF8"
          fillOpacity="0.45"
          stroke="#7DD3FC"
          strokeWidth="1.3"
        />
        {/* 4-chamber Heart */}
        <path
          d="M90 48 C82 42, 78 56, 92 66 C104 56, 100 42, 90 48 Z"
          fill="#EF4444"
          stroke="#FCA5A5"
          strokeWidth="1.4"
        />
        {/* Diaphragm & Kidneys */}
        <path d="M54 74 Q90 62 126 74" fill="none" stroke="#4ADE80" strokeWidth="2" />
        <ellipse cx="74" cy="92" rx="7" ry="10" fill="#EA580C" stroke="#FDBA74" strokeWidth="1.2" />
        <ellipse cx="106" cy="92" rx="7" ry="10" fill="#EA580C" stroke="#FDBA74" strokeWidth="1.2" />
        <line x1="90" y1="20" x2="90" y2="112" stroke="#EF4444" strokeWidth="1.8" />

        {/* Right: Live Lead II P-QRS-T ECG & Alveolar O2 curve */}
        <rect x="182" y="12" width="164" height="108" rx="8" fill="#090F1C" stroke="#1E2A42" />
        <text x="194" y="28" fill="#4ADE80" fontSize="8" fontFamily="JetBrains Mono, monospace">
          LEAD II ECG · 72 BPM
        </text>
        <path
          d="M192 74 L208 74 Q214 65 220 74 L228 74 L232 82 L238 42 L244 88 L249 74 L260 74 Q270 60 280 74 L296 74 L300 82 L306 42 L312 88 L317 74 L336 74"
          fill="none"
          stroke="#4ADE80"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <text x="264" y="108" textAnchor="middle" fill="#93A0B8" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
          P-QRS-T Sinus Rhythm · SpO₂ 98%
        </text>
      </svg>
    ),
  },
  {
    id: 'electronics',
    discipline: 'ELECTRONICS LAB · CIRCUIT WORKBENCH',
    badgeClass: 'bg-[#042F2E] text-[#5EEAD4] border-[#0D9488]/50',
    dotColor: 'bg-[#14B8A6]',
    title: "Ohm's Law & Potentiometer Schematic Workbench",
    apparatusSummary: 'DC bench supply · sliding rheostat · standard resistor R · series ammeter · parallel voltmeter',
    telemetryLeft: { label: 'Potential Diff V', value: '2.40 V (±0.01 V)' },
    telemetryRight: { label: 'Series Current I', value: '0.480 A (480 mA)' },
    calcLines: {
      formulaVar: 'R = ΔV / ΔI',
      formulaRest: ' = 1 / slope (I vs V)',
      workingLine: 'R = (2.40 V − 0.40 V) / (0.480 A − 0.080 A) = 5.00 Ω',
      extraWorkingLine: 'Power dissipated P = V · I = 1.152 W · Zero error = 0.00 A',
      resultLine: 'R_measured = 5.00 Ω ± 0.04 Ω ✓ matches 5.0 Ω colour band',
    },
    renderSvg: () => (
      <svg viewBox="0 0 360 135" className="w-full h-32">
        {/* Left: Schematic Loop with Ammeter in series and Voltmeter in parallel */}
        <rect x="18" y="12" width="148" height="108" rx="8" fill="#090F1C" stroke="#1E2A42" />
        <rect x="34" y="34" width="116" height="62" fill="none" stroke="#38BDF8" strokeWidth="1.6" />
        {/* Resistor box R */}
        <rect x="72" y="28" width="40" height="12" rx="2" fill="#121A2B" stroke="#FDBA74" strokeWidth="1.6" />
        <text x="92" y="37" textAnchor="middle" fill="#FDBA74" fontSize="8" fontFamily="JetBrains Mono, monospace">
          R=5.0Ω
        </text>
        {/* Parallel Voltmeter branch */}
        <path d="M62 34 L62 18 L122 18 L122 34" fill="none" stroke="#F472B6" strokeWidth="1.3" />
        <circle cx="92" cy="18" r="7" fill="#090F1C" stroke="#F472B6" strokeWidth="1.4" />
        <text x="92" y="21" textAnchor="middle" fill="#F472B6" fontSize="7.5" fontWeight="700">
          V
        </text>
        {/* Series Ammeter */}
        <circle cx="150" cy="65" r="8" fill="#090F1C" stroke="#4ADE80" strokeWidth="1.5" />
        <text x="150" y="68" textAnchor="middle" fill="#4ADE80" fontSize="8" fontWeight="700">
          A
        </text>

        {/* Right: Ohmic V-I Characteristic Graph */}
        <rect x="182" y="12" width="164" height="108" rx="8" fill="#090F1C" stroke="#1E2A42" />
        <line x1="204" y1="100" x2="332" y2="100" stroke="#475569" strokeWidth="1.2" />
        <line x1="204" y1="24" x2="204" y2="100" stroke="#475569" strokeWidth="1.2" />
        <line x1="204" y1="100" x2="322" y2="28" stroke="#2DD4BF" strokeWidth="2" />
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((t, idx) => (
          <circle
            key={idx}
            cx={204 + t * 114}
            cy={100 - t * 70}
            r="2.8"
            fill="#5EEAD4"
          />
        ))}
        <text x="268" y="114" textAnchor="middle" fill="#93A0B8" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
          Voltage V (Volts) → Slope = 1/R
        </text>
      </svg>
    ),
  },
  {
    id: 'engineering',
    discipline: 'ENGINEERING LAB · SOLID MECHANICS',
    badgeClass: 'bg-[#3B0764] text-[#D8B4FE] border-[#9333EA]/50',
    dotColor: 'bg-[#A855F7]',
    title: "3D Cantilever Beam Deflection — Young's Modulus E",
    apparatusSummary: 'Steel cantilever beam (L = 600 mm, b = 25 mm, d = 5 mm) · 0.01 mm dial gauge · slotted masses',
    telemetryLeft: { label: 'Tip Load F = mg', value: '19.62 N (2.00 kg)' },
    telemetryRight: { label: 'Dial Gauge Deflection δ', value: '3.36 mm (±0.01 mm)' },
    calcLines: {
      formulaVar: 'E = F · L³ / (3 · I · δ)',
      formulaRest: '   where I = b · d³ / 12',
      workingLine: 'I = (0.025 × 0.005³) / 12 = 2.604 × 10⁻¹⁰ m⁴ · L³ = 0.216 m³',
      extraWorkingLine: 'Slope (δ vs F) = 0.171 mm N⁻¹ · Elastic unloading zero-return = 0.00 mm',
      resultLine: 'E = 205.4 GPa ✓ structural carbon steel (200–210 GPa)',
    },
    renderSvg: () => (
      <svg viewBox="0 0 360 135" className="w-full h-32">
        {/* Left: Rigid Clamp Wall + Elastic Deflected Cantilever Beam + Hanging Mass */}
        <rect x="18" y="12" width="150" height="108" rx="8" fill="#090F1C" stroke="#1E2A42" />
        <rect x="26" y="24" width="16" height="84" rx="2" fill="#334155" stroke="#64748B" />
        {/* Undeformed dashed reference */}
        <line x1="42" y1="48" x2="148" y2="48" stroke="#475569" strokeDasharray="3 3" />
        {/* Deflected elastic curve */}
        <path
          d="M42 48 C78 48, 114 58, 146 74"
          fill="none"
          stroke="#C084FC"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Slotted mass hanger at tip */}
        <line x1="146" y1="74" x2="146" y2="96" stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="138" y="96" width="16" height="12" rx="2" fill="#F59E0B" />
        <text x="112" y="40" fill="#D8B4FE" fontSize="8" fontFamily="JetBrains Mono, monospace">
          δ = 3.36 mm
        </text>

        {/* Right: Load F vs Deflection δ Linear Elastic Plot */}
        <rect x="182" y="12" width="164" height="108" rx="8" fill="#090F1C" stroke="#1E2A42" />
        <line x1="204" y1="100" x2="332" y2="100" stroke="#475569" strokeWidth="1.2" />
        <line x1="204" y1="24" x2="204" y2="100" stroke="#475569" strokeWidth="1.2" />
        <line x1="204" y1="100" x2="324" y2="30" stroke="#C084FC" strokeWidth="2" />
        <circle cx="234" cy="82" r="2.8" fill="#FDBA74" />
        <circle cx="264" cy="65" r="2.8" fill="#FDBA74" />
        <circle cx="294" cy="47" r="2.8" fill="#FDBA74" />
        <circle cx="324" cy="30" r="2.8" fill="#FDBA74" />
        <text x="268" y="114" textAnchor="middle" fill="#93A0B8" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
          Load F (N) → E = 205.4 GPa
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

  // Carousel state for the left dark lab & calculation showcase
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % LAB_CAROUSEL_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const activeSlide = LAB_CAROUSEL_SLIDES[slideIndex] ?? LAB_CAROUSEL_SLIDES[0]!;

  const navigate = useNavigate();
  const nextRoute = searchParams.get('next');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
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
    setErrors({});
    if (password && password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' });
      return;
    }
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
      {/* Left dark panel with 5-Laboratory Live Bench & Calculation Carousel */}
      <div
        className="lg:col-span-6 bg-[#0B1220] text-[#E6EBF5] p-8 sm:p-10 lg:p-12 flex flex-col justify-between"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="flex items-center justify-between">
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

          <span className="font-mono text-[11px] text-[#93A0B8]">
            5 Virtual Laboratories · 123 Apparatus
          </span>
        </div>

        <div className="my-8 lg:my-4 max-w-xl">
          <h1 className="font-display text-3xl sm:text-[40px] font-bold text-white leading-[1.12] tracking-tight mb-3">
            Your lab bench is ready.
          </h1>
          <p className="text-sm sm:text-base text-[#93A0B8] leading-relaxed mb-5">
            Sign in with the account your school or department created, or join a class with the
            code your teacher gave you.
          </p>

          {/* 5-Discipline Carousel Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
            {LAB_CAROUSEL_SLIDES.map((s, idx) => {
              const active = idx === slideIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlideIndex(idx)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#192845] border border-[#38BDF8] text-white'
                      : 'bg-[#121A2B] border border-[#22304A] text-[#93A0B8] hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${s.dotColor}`} />
                  {s.id}
                </button>
              );
            })}
          </div>

          {/* Active Carousel Card: Bench Simulation + Telemetry + Terminal Calculation */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wider uppercase mb-1.5 ${activeSlide.badgeClass}`}
                >
                  {activeSlide.discipline}
                </span>
                <h2 className="font-display text-base sm:text-lg font-bold text-white">
                  {activeSlide.title}
                </h2>
                <p className="text-xs text-[#93A0B8] mt-0.5">{activeSlide.apparatusSummary}</p>
              </div>

              {/* Prev / Next Carousel Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label="Previous laboratory slide"
                  onClick={() =>
                    setSlideIndex(
                      (prev) => (prev - 1 + LAB_CAROUSEL_SLIDES.length) % LAB_CAROUSEL_SLIDES.length
                    )
                  }
                  className="w-7 h-7 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] flex items-center justify-center text-[#C9D3E6] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next laboratory slide"
                  onClick={() =>
                    setSlideIndex((prev) => (prev + 1) % LAB_CAROUSEL_SLIDES.length)
                  }
                  className="w-7 h-7 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] flex items-center justify-center text-[#C9D3E6] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Mini-Bench & Regression Plot SVG */}
            <div className="bg-[#0B1220] border border-[#1E2A42] rounded-xl p-2">
              {activeSlide.renderSvg()}
            </div>

            {/* 2-Column Live Instrument Telemetry Strip */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#0B1220] border border-[#1E2A42] rounded-xl px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-[#93A0B8]">
                  {activeSlide.telemetryLeft.label}
                </div>
                <div className="font-mono text-xs sm:text-sm font-bold text-[#E6EBF5]">
                  {activeSlide.telemetryLeft.value}
                </div>
              </div>
              <div className="bg-[#0B1220] border border-[#1E2A42] rounded-xl px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-[#93A0B8]">
                  {activeSlide.telemetryRight.label}
                </div>
                <div className="font-mono text-xs sm:text-sm font-bold text-[#7DD3FC]">
                  {activeSlide.telemetryRight.value}
                </div>
              </div>
            </div>

            {/* Multi-Line Live Calculation & Auto-Marking Terminal Card */}
            <div className="bg-[#090E1A] border border-[#22304A] rounded-xl p-4 font-mono text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#6B778C] pb-1 border-b border-[#1E2A42]">
                <span>LIVE WORKBOOK CALCULATION &amp; AUTO-MARKING</span>
                <span>SLIDE {slideIndex + 1} / {LAB_CAROUSEL_SLIDES.length}</span>
              </div>
              <div className="pt-0.5">
                <span className="text-[#FDBA74] font-bold">
                  {activeSlide.calcLines.formulaVar}
                </span>
                <span className="text-[#C9D3E6]">{activeSlide.calcLines.formulaRest}</span>
              </div>
              <div className="text-[#C9D3E6]">{activeSlide.calcLines.workingLine}</div>
              <div className="text-[#93A0B8] text-[11px]">
                {activeSlide.calcLines.extraWorkingLine}
              </div>
              <div className="text-[#4ADE80] font-semibold pt-0.5">
                {activeSlide.calcLines.resultLine}
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#6B778C]">
          Works offline once installed · Data stays with your institution
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
              onClick={() => setTab('signin')}
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
              onClick={() => setTab('create')}
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

              <form onSubmit={handleSignIn} className="space-y-4">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. 2025/PHY/0142"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8]"
                  />
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8] pr-10"
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

              <form onSubmit={handleCreateAccount} className="space-y-4">
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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Adaora Nwosu"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8]"
                  />
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. adaora.nwosu@kings.edu.ng"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8]"
                  />
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8] pr-10"
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
                    <p className="text-xs text-[#C4321C] mt-1">{errors.password}</p>
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
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={getCodePlaceholder()}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm font-mono text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8]"
                  />
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
