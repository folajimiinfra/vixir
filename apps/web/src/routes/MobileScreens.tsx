import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  WifiOff,
  Home,
  FlaskConical,
  FileText,
  User,
  ChevronLeft,
  MessageCircle,
} from 'lucide-react';

// I1 — Mobile Student Home (offline) (/m)
export function MobileHomeScreen() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] flex flex-col justify-between max-w-md mx-auto border-x border-[#E3E8EF]">
      <div className="p-5 space-y-5">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/illustrations/logo.svg" alt="" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-bold text-xl text-[#0E1726]">Vixir</span>
          </Link>
          <div className="w-10 h-10 rounded-full bg-[#FDECE3] text-[#9A3412] text-xs font-bold flex items-center justify-center">
            AO
          </div>
        </header>

        {/* Offline Banner */}
        <div className="bg-[#FEF5EE] border border-[#F9D7C4] rounded-2xl px-4 py-3 flex items-center gap-3 text-xs font-medium text-[#9A3412]">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You’re offline. Results will sync later.</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-[#0E1726]">Hi, Adaeze</h1>

        {/* Active Assignment Card */}
        <div className="bg-[#0B1220] text-white rounded-2xl p-5 space-y-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#FDBA74] mb-1">
              DUE WED · PHYSICS
            </div>
            <h2 className="font-display text-xl font-bold text-white leading-snug">
              Simple pendulum — determination of g
            </h2>
          </div>

          <div className="h-2 bg-[#1E2A42] rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-[#F97316] rounded-full" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#93A0B8]">3 of 6 readings</span>
            <Link
              to="/m/lab/physics/pendulum"
              className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-xs font-bold transition-colors"
            >
              Continue
            </Link>
          </div>
        </div>

        {/* Downloaded for offline */}
        <section className="space-y-3">
          <h2 className="font-display text-base font-bold text-[#0E1726]">
            Downloaded for offline
          </h2>

          <Link
            to="/lab/chemistry/titration"
            className="bg-white rounded-2xl border border-[#E3E8EF] p-4 flex items-center gap-3.5 block"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FEF0E6] text-[#B45309] font-mono text-xs font-bold flex items-center justify-center shrink-0">
              C₁V₁
            </div>
            <div>
              <div className="font-display text-sm font-bold text-[#0E1726]">
                Acid–base titration
              </div>
              <div className="text-xs text-[#475467]">Chemistry · due Fri · 4.2 MB</div>
            </div>
          </Link>

          <Link
            to="/lab/electronics/ohms-law"
            className="bg-white rounded-2xl border border-[#E3E8EF] p-4 flex items-center gap-3.5 block"
          >
            <div className="w-11 h-11 rounded-xl bg-[#E0F8F5] text-[#0F766E] font-mono text-xs font-bold flex items-center justify-center shrink-0">
              V=IR
            </div>
            <div>
              <div className="font-display text-sm font-bold text-[#0E1726]">
                Verifying Ohm’s law
              </div>
              <div className="text-xs text-[#475467]">Electronics · due Mon · 3.1 MB</div>
            </div>
          </Link>

          <Link
            to="/attempt/demo/report"
            className="bg-white rounded-2xl border border-[#E3E8EF] p-4 flex items-center justify-between block"
          >
            <div>
              <div className="font-display text-sm font-bold text-[#0E1726]">
                Last grade
              </div>
              <div className="text-xs text-[#475467]">
                Refraction through a glass block
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-[#E6F6EE] text-[#0F7B45] font-mono text-sm font-bold">
              17/20
            </span>
          </Link>
        </section>
      </div>

      {/* Bottom Tab Bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className="bg-white border-t border-[#E3E8EF] px-4 py-2.5 grid grid-cols-4 text-[11px] font-semibold"
      >
        <Link to="/m" className="flex flex-col items-center gap-1 text-[#2448D8]">
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link to="/labs" className="flex flex-col items-center gap-1 text-[#475467]">
          <FlaskConical className="w-5 h-5" />
          <span>Labs</span>
        </Link>
        <Link
          to="/attempt/demo/report"
          className="flex flex-col items-center gap-1 text-[#475467]"
        >
          <FileText className="w-5 h-5" />
          <span>Notebook</span>
        </Link>
        <Link to="/app" className="flex flex-col items-center gap-1 text-[#475467]">
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}

// I2 — Mobile Lab Workspace (/m/lab/physics/pendulum)
export function MobileLabScreen() {
  const navigate = useNavigate();
  const [lengthCm, setLengthCm] = useState(70.0);
  const [angleDeg, setAngleDeg] = useState(8.0);
  const [timing, setTiming] = useState(false);
  const [timeVal, setTimeVal] = useState<number | null>(null);
  const [rows, setRows] = useState([
    { length: 40.0, t: 25.48, t2: 1.623 },
    { length: 50.0, t: 28.31, t2: 2.004 },
    { length: 60.0, t: 31.27, t2: 2.445 },
  ]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    let frameId: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      setAngleDeg(9 * Math.cos(3.8 * t));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleReleaseStart = () => {
    if (!timing) {
      setTiming(true);
      const T = 2 * Math.PI * Math.sqrt(lengthCm / 100 / 9.81);
      setTimeVal(Number((20 * T).toFixed(2)));
    } else {
      setTiming(false);
      const tRecorded =
        timeVal ?? Number((20 * 2 * Math.PI * Math.sqrt(lengthCm / 100 / 9.81)).toFixed(2));
      const T = tRecorded / 20;
      setRows((prev) => [
        ...prev,
        { length: lengthCm, t: tRecorded, t2: Number((T * T).toFixed(3)) },
      ]);
      setTimeVal(null);
    }
  };

  const pivotX = 165;
  const pivotY = 36;
  const pxLen = 105 + ((lengthCm - 40) / 50) * 85;
  const rad = (angleDeg * Math.PI) / 180;
  const bobX = pivotX + pxLen * Math.sin(rad);
  const bobY = pivotY + pxLen * Math.cos(rad);
  const remaining = Math.max(0, 6 - rows.length);

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E6EBF5] flex flex-col justify-between max-w-md mx-auto p-4">
      <div className="space-y-4">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <Link
            to="/m"
            aria-label="Back to mobile home"
            className="w-10 h-10 rounded-xl bg-[#121A2B] border border-[#22304A] flex items-center justify-center text-[#E6EBF5]"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="text-center">
            <h1 className="font-display text-sm font-bold text-white">Simple pendulum</h1>
            <div className="text-[11px] text-[#FDBA74]">Offline · saved on device</div>
          </div>
          <button
            type="button"
            aria-label="Ask Vix"
            onClick={() => navigate('/lab/vix/connect')}
            className="w-10 h-10 rounded-xl bg-[#121A2B] border border-[#22304A] flex items-center justify-center text-[#E6EBF5] cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </header>

        {/* Compact Pendulum Bench */}
        <div className="lab-grid-bg rounded-2xl border border-[#1E2A42] p-3">
          <svg
            viewBox="0 0 330 245"
            className="w-full h-auto"
            role="img"
            aria-label={`Mobile simple pendulum bench set to ${lengthCm.toFixed(1)} cm`}
          >
            <rect x="42" y="16" width="8" height="215" fill="#3A4A68" />
            <rect x="42" y="16" width="175" height="7" rx="2" fill="#55688C" />
            <rect x="158" y="23" width="14" height="11" rx="2" fill="#8A6A4A" />

            <line
              x1={pivotX}
              y1={pivotY}
              x2={pivotX}
              y2="220"
              stroke="#3A4A68"
              strokeWidth="1.2"
              strokeDasharray="3 4"
            />

            <line
              x1={pivotX}
              y1={pivotY}
              x2={bobX}
              y2={bobY}
              stroke="#E6EBF5"
              strokeWidth="1.8"
            />
            <circle
              cx={bobX}
              cy={bobY}
              r="11"
              fill="#F97316"
              stroke="#FDBA74"
              strokeWidth="1.5"
            />

            <rect x="262" y="34" width="12" height="192" rx="2" fill="#D9C39A" />
            <line
              x1="260"
              y1={bobY}
              x2="280"
              y2={bobY}
              stroke="#F97316"
              strokeWidth="2"
            />
            <text
              x="252"
              y={bobY - 4}
              textAnchor="end"
              fill="#FDBA74"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
            >
              {lengthCm.toFixed(1)} cm
            </text>
          </svg>
        </div>

        {/* 2 Readout Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#121A2B] border border-[#22304A] rounded-2xl p-3.5">
            <div className="text-xs text-[#93A0B8] mb-1">Length, L</div>
            <div className="font-mono text-xl font-bold text-white">
              {lengthCm.toFixed(1)} cm
            </div>
          </div>
          <div className="bg-[#121A2B] border border-[#22304A] rounded-2xl p-3.5">
            <div className="text-xs text-[#93A0B8] mb-1">t (20 osc.)</div>
            <div className="font-mono text-xl font-bold text-[#FDBA74]">
              {timeVal !== null ? `${timeVal.toFixed(2)} s` : '—'}
            </div>
          </div>
        </div>

        {/* Large Touch Controls */}
        <div className="grid grid-cols-12 gap-2.5">
          <button
            type="button"
            aria-label="Decrease length by 10 cm"
            onClick={() => setLengthCm((l) => Math.max(40, l - 10))}
            className="col-span-2 py-3.5 rounded-2xl bg-[#121A2B] border border-[#22304A] font-mono text-lg font-bold text-white cursor-pointer"
          >
            –
          </button>
          <button
            type="button"
            onClick={handleReleaseStart}
            className="col-span-8 py-3.5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-sm font-bold transition-colors cursor-pointer"
          >
            {timing ? 'Record reading' : 'Release & start'}
          </button>
          <button
            type="button"
            aria-label="Increase length by 10 cm"
            onClick={() => setLengthCm((l) => Math.min(90, l + 10))}
            className="col-span-2 py-3.5 rounded-2xl bg-[#121A2B] border border-[#22304A] font-mono text-lg font-bold text-white cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Readings Table */}
        <div className="bg-[#121A2B] border border-[#22304A] rounded-2xl overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2A42] text-[#93A0B8]">
                <th className="py-2.5 px-3.5 text-left">L / cm</th>
                <th className="py-2.5 px-3.5 text-center">t / s</th>
                <th className="py-2.5 px-3.5 text-right">T² / s²</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2A42]">
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3.5 text-white">{r.length.toFixed(1)}</td>
                  <td className="py-2.5 px-3.5 text-center text-white">
                    {r.t.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-[#FDBA74]">
                    {r.t2.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom CTA */}
      <button
        type="button"
        onClick={() => navigate('/attempt/demo/results')}
        className="w-full mt-5 py-3.5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors cursor-pointer"
      >
        {remaining > 0
          ? `Go to graph (${remaining} more readings)`
          : 'Go to graph (all 6 readings complete)'}
      </button>
    </div>
  );
}
