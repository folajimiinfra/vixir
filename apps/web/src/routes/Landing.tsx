import { useEffect, useState } from 'react';
import { Link } from 'react-router';

function HeroPendulumCard() {
  // Smooth simple harmonic motion around the pivot (135, 38)
  // Only the string, bob, and angle indicator swing; the frame, ruler, and cards stay stationary.
  const [angleDeg, setAngleDeg] = useState(6.0);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAngleDeg(6.0);
      return;
    }

    let frameId: number;
    const start = performance.now();
    // Period T = 1.564 s for L = 0.60 m
    const periodMs = 1564;
    const maxAngle = 12; // visual degrees for clear motion while displaying physical 6° amplitude

    const tick = (now: number) => {
      const elapsed = now - start;
      const phase = (2 * Math.PI * elapsed) / periodMs;
      setAngleDeg(maxAngle * Math.cos(phase));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const pivotX = 125;
  const pivotY = 38;
  const stringLen = 132;
  const rad = (angleDeg * Math.PI) / 180;
  // Screen coordinates: +angle swings right
  const bobX = pivotX + stringLen * Math.sin(rad);
  const bobY = pivotY + stringLen * Math.cos(rad);

  // Arc at radius 56 from vertical (pivotX, pivotY + 56) to string point
  const arcR = 56;
  const arcStartX = pivotX;
  const arcStartY = pivotY + arcR;
  const arcEndX = pivotX + arcR * Math.sin(rad);
  const arcEndY = pivotY + arcR * Math.cos(rad);
  const sweepFlag = angleDeg >= 0 ? 0 : 1;
  const displayAngle = Math.round(Math.abs(angleDeg / 2));

  return (
    <div
      className="bg-[#0B1220] rounded-2xl border border-[#22304A] shadow-[0_24px_48px_rgba(11,18,32,0.22)] p-5 text-[#E6EBF5]"
      data-vix-id="hero-pendulum-card"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E2A42]">
        <span className="text-xs font-semibold text-[#E6EBF5]">
          Simple pendulum · Determination of g
        </span>
        <span className="text-xs font-mono text-[#93A0B8]">Trial 3 of 6</span>
      </div>

      {/* Card Body: Bench SVG on left, 3 live readouts on right */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-7 flex justify-center">
          <svg
            viewBox="0 0 250 210"
            className="w-full max-w-[270px] h-auto"
            role="img"
            aria-label="Animated simple pendulum swinging from a split cork clamp"
          >
            <defs>
              <radialGradient id="heroBobGrad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FDBA74" />
                <stop offset="55%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#9A3412" />
              </radialGradient>
            </defs>

            {/* Stationary top support bar */}
            <rect x="35" y="26" width="180" height="6" rx="2" fill="#3A4A68" />

            {/* Stationary split cork at pivot */}
            <rect x="116" y="32" width="18" height="9" rx="2" fill="#55688C" />

            {/* Stationary vertical equilibrium reference line */}
            <line
              x1={pivotX}
              y1={pivotY}
              x2={pivotX}
              y2="188"
              stroke="#3A4A68"
              strokeWidth="1.2"
              strokeDasharray="3 4"
            />

            {/* Dynamic angle arc between equilibrium and string */}
            {Math.abs(angleDeg) > 0.5 && (
              <path
                d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 ${sweepFlag} ${arcEndX.toFixed(1)} ${arcEndY.toFixed(1)}`}
                fill="none"
                stroke="#FDBA74"
                strokeWidth="1.2"
              />
            )}
            <text
              x={pivotX + (angleDeg >= 0 ? 12 : -36)}
              y={pivotY + 50}
              fill="#FDBA74"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              θ={displayAngle}°
            </text>

            {/* Swinging string (anchored at stationary pivot, end follows bob) */}
            <line
              x1={pivotX}
              y1={pivotY}
              x2={bobX}
              y2={bobY}
              stroke="#E6EBF5"
              strokeWidth="1.75"
              strokeLinecap="round"
            />

            {/* Swinging pendulum bob */}
            <circle
              cx={bobX}
              cy={bobY}
              r="11"
              fill="url(#heroBobGrad)"
              data-testid="hero-pendulum-bob"
            />

            {/* Stationary bottom bench base */}
            <rect x="35" y="192" width="180" height="4" rx="2" fill="#22304A" />
          </svg>
        </div>

        {/* Right: 3 Readout Panels */}
        <div className="sm:col-span-5 space-y-2.5">
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3.5 py-2.5">
            <div className="text-[11px] text-[#93A0B8] mb-0.5">Length, L</div>
            <div className="font-mono text-lg font-medium text-[#E6EBF5]">60.0 cm</div>
          </div>

          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3.5 py-2.5">
            <div className="text-[11px] text-[#93A0B8] mb-0.5">Time for 20 oscillations</div>
            <div className="font-mono text-lg font-medium text-[#FDBA74]">31.27 s</div>
          </div>

          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3.5 py-2.5">
            <div className="text-[11px] text-[#93A0B8] mb-0.5">Period, T</div>
            <div className="font-mono text-lg font-medium text-[#E6EBF5]">1.564 s</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#0E1726]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#E3E8EF] sticky top-0 z-30">
        <div className="max-w-[1240px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/illustrations/logo.svg"
              alt=""
              className="w-7 h-7 rounded-[7px]"
            />
            <span className="font-display font-bold text-lg text-[#0E1726] tracking-tight">
              Vixir
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#475467]"
          >
            <a href="#how-it-works" className="hover:text-[#0E1726] transition-colors">
              How it works
            </a>
            <Link to="/library" className="hover:text-[#0E1726] transition-colors">
              Experiments
            </Link>
            <a href="#for-institutions" className="hover:text-[#0E1726] transition-colors">
              For institutions
            </a>
            <a href="#open-source" className="hover:text-[#0E1726] transition-colors">
              Open source
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/auth"
              className="text-sm font-semibold text-[#0E1726] hover:text-[#2448D8] transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/auth?tab=create"
              className="px-4 py-2 rounded-lg bg-[#2448D8] hover:bg-[#1B38B0] text-white text-sm font-semibold transition-colors"
            >
              Request a demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#F5F7FA] border-b border-[#E3E8EF] py-14 md:py-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6">
              <span className="inline-block px-3 py-1 rounded-full bg-[#EAEFFE] text-[#2448D8] text-xs font-semibold mb-5">
                Virtual practical laboratory
              </span>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[52px] font-bold text-[#0E1726] leading-[1.08] tracking-[-0.025em] mb-5">
                Every student deserves a real practical.
              </h1>

              <p className="text-base sm:text-lg text-[#475467] leading-relaxed mb-7 max-w-xl">
                Vixir is a browser-based lab for physics, chemistry, biology, electronics and
                engineering. Students set up apparatus, take imperfect readings, plot graphs and
                get their lab reports marked — on any device, even offline.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-5">
                <Link
                  to="/auth"
                  className="px-5 py-3 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-sm font-semibold transition-colors"
                >
                  Get started free
                </Link>
                <Link
                  to="/lab/physics/pendulum"
                  className="px-5 py-3 rounded-xl bg-white hover:bg-[#EDF1F7] text-[#0E1726] border border-[#E3E8EF] text-sm font-semibold transition-colors"
                >
                  Try the pendulum lab
                </Link>
              </div>

              <p className="text-xs text-[#6B778C]">
                Built around WAEC, NECO and university first-year practical manuals.
              </p>
            </div>

            {/* Right Interactive Pendulum Card */}
            <div className="lg:col-span-6">
              <HeroPendulumCard />
            </div>
          </div>
        </div>
      </section>

      {/* Problem / What Vixir Does / The Result */}
      <section className="bg-white border-b border-[#E3E8EF] py-16">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#B54708] mb-2">
                THE PROBLEM
              </div>
              <h2 className="font-display text-2xl font-bold text-[#0E1726] mb-3 leading-snug">
                Labs are expensive. Practicals are rationed.
              </h2>
              <p className="text-sm text-[#475467] leading-relaxed">
                Many schools share one set of apparatus between whole classes. Students see a
                demonstration, then sit an exam where they must do it themselves.
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#2448D8] mb-2">
                WHAT VIXIR DOES
              </div>
              <h2 className="font-display text-2xl font-bold text-[#0E1726] mb-3 leading-snug">
                Simulates the practical, not just the physics.
              </h2>
              <p className="text-sm text-[#475467] leading-relaxed">
                Instruments have resolution, zero error and human timing lag. Students learn to
                repeat, average, tabulate and judge error — the skills practical exams actually
                test.
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#0F7B45] mb-2">
                THE RESULT
              </div>
              <h2 className="font-display text-2xl font-bold text-[#0E1726] mb-3 leading-snug">
                Every student, every experiment, marked.
              </h2>
              <p className="text-sm text-[#475467] leading-relaxed">
                Teachers assign practicals to the whole class and get step-by-step marked reports
                back, with analytics that show where students go wrong.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How a Vixir practical works */}
      <section id="how-it-works" className="bg-[#F5F7FA] border-b border-[#E3E8EF] py-16">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-[#0E1726] mb-8">
            How a Vixir practical works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                num: '01',
                title: 'Set up the apparatus',
                desc: 'Drag clamps, wires, burettes and meters onto the bench. Wrong connections behave like they would in a real lab.',
              },
              {
                num: '02',
                title: 'Take real readings',
                desc: "Read scales, start and stop the stopwatch yourself. Each student's data is unique, so results can't be copied.",
              },
              {
                num: '03',
                title: 'Tabulate and plot',
                desc: 'Fill the results table, choose axes and scale, draw the line of best fit and calculate the slope.',
              },
              {
                num: '04',
                title: 'Get marked, step by step',
                desc: "Readings, significant figures, graph, calculation and precautions are each marked against the student's own data.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-2xl border border-[#E3E8EF] p-6"
              >
                <div className="font-mono text-xs font-semibold text-[#2448D8] mb-3">
                  {step.num}
                </div>
                <h3 className="font-display text-base font-bold text-[#0E1726] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#475467] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Laboratories in one browser tab */}
      <section className="bg-[#0B1220] text-[#E6EBF5] py-16">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-white mb-2">
            Five laboratories in one browser tab
          </h2>
          <p className="text-sm text-[#93A0B8] mb-8">
            Starting with the practicals students are examined on.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link
              to="/lab/physics/pendulum"
              className="bg-[#121A2B] border border-[#22304A] hover:border-[#3B82F6] rounded-2xl p-5 transition-colors block"
            >
              <h3 className="font-display text-base font-bold text-[#60A5FA] mb-2">Physics</h3>
              <p className="text-xs text-[#93A0B8] leading-relaxed">
                Simple pendulum · Refraction through a glass block · Ohm’s law · Metre-rule
                moments · Specific heat capacity
              </p>
            </Link>

            <Link
              to="/lab/chemistry/titration"
              className="bg-[#121A2B] border border-[#22304A] hover:border-[#F97316] rounded-2xl p-5 transition-colors block"
            >
              <h3 className="font-display text-base font-bold text-[#FDBA74] mb-2">Chemistry</h3>
              <p className="text-xs text-[#93A0B8] leading-relaxed">
                Acid–base titration · Qualitative analysis · Rates of reaction · Heat of
                neutralisation
              </p>
            </Link>

            <Link
              to="/lab/biology/digestion"
              className="bg-[#121A2B] border border-[#22304A] hover:border-[#22C55E] rounded-2xl p-5 transition-colors block"
            >
              <h3 className="font-display text-base font-bold text-[#4ADE80] mb-2">Biology</h3>
              <p className="text-xs text-[#93A0B8] leading-relaxed">
                Journey of food (digestion) · Dissection of a mammal (rat) · Human body systems ·
                Food tests
              </p>
            </Link>

            <Link
              to="/lab/electronics/ohms-law"
              className="bg-[#121A2B] border border-[#22304A] hover:border-[#14B8A6] rounded-2xl p-5 transition-colors block"
            >
              <h3 className="font-display text-base font-bold text-[#5EEAD4] mb-2">
                Electronics
              </h3>
              <p className="text-xs text-[#93A0B8] leading-relaxed">
                Circuit breadboard · Diode &amp; transistor characteristics · RC charging · Logic
                gates
              </p>
            </Link>

            <Link
              to="/lab/engineering/beam"
              className="bg-[#121A2B] border border-[#22304A] hover:border-[#A855F7] rounded-2xl p-5 transition-colors block"
            >
              <h3 className="font-display text-base font-bold text-[#D8B4FE] mb-2">
                Engineering
              </h3>
              <p className="text-xs text-[#93A0B8] leading-relaxed">
                Beam deflection · Tensile testing · Fluid flow &amp; Bernoulli · Gear trains
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Built for the whole institution */}
      <section id="for-institutions" className="bg-[#F5F7FA] border-b border-[#E3E8EF] py-16">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-[#0E1726] mb-8">
            Built for the whole institution
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
              <h3 className="font-display text-base font-bold text-[#0E1726] mb-2">Students</h3>
              <p className="text-sm text-[#475467] leading-relaxed">
                Unlimited practice before exams, a lab notebook that keeps every result, and a
                Socratic assistant that asks questions instead of giving answers.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
              <h3 className="font-display text-base font-bold text-[#0E1726] mb-2">
                Teachers &amp; lecturers
              </h3>
              <p className="text-sm text-[#475467] leading-relaxed">
                Assign a practical to 200 students in a minute. Auto-marked reports, class-wide
                error analysis, and an editor to build your own experiments.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
              <h3 className="font-display text-base font-bold text-[#0E1726] mb-2">
                Institutions
              </h3>
              <p className="text-sm text-[#475467] leading-relaxed">
                School-wide rollout, usage reports for accreditation visits, and a local-server
                mode for campuses with weak internet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section id="open-source" className="bg-white border-b border-[#E3E8EF] py-16">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6">
              <span className="inline-block px-3 py-1 rounded-full bg-[#E6F6EE] text-[#0F7B45] text-xs font-semibold mb-4">
                Open source
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0E1726] leading-tight mb-4">
                Free for every school. Open for everyone to improve.
              </h2>
              <p className="text-sm sm:text-base text-[#475467] leading-relaxed mb-6 max-w-xl">
                Vixir’s code and experiment library are open source. Schools can use it, host it
                on their own server, and teachers and developers can add new experiments for
                everyone.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://github.com/vixir-labs/vixir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#0E1726] hover:bg-[#1E293B] text-white text-sm font-semibold transition-colors"
                >
                  View on GitHub
                </a>
                <a
                  href="https://github.com/vixir-labs/vixir/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#EDF1F7] text-[#0E1726] border border-[#E3E8EF] text-sm font-semibold transition-colors"
                >
                  Contribute an experiment
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F9FAFB] rounded-2xl border border-[#E3E8EF] p-5">
                <h3 className="font-display text-sm font-bold text-[#0E1726] mb-1">
                  Use it free
                </h3>
                <p className="text-xs text-[#475467] leading-relaxed">
                  No barriers for students, teachers or institutions.
                </p>
              </div>
              <div className="bg-[#F9FAFB] rounded-2xl border border-[#E3E8EF] p-5">
                <h3 className="font-display text-sm font-bold text-[#0E1726] mb-1">
                  Host it yourself
                </h3>
                <p className="text-xs text-[#475467] leading-relaxed">
                  Run it on a school server, even without internet.
                </p>
              </div>
              <div className="bg-[#F9FAFB] rounded-2xl border border-[#E3E8EF] p-5">
                <h3 className="font-display text-sm font-bold text-[#0E1726] mb-1">
                  Add experiments
                </h3>
                <p className="text-xs text-[#475467] leading-relaxed">
                  Every practical is a config file anyone can write and share.
                </p>
              </div>
              <div className="bg-[#F9FAFB] rounded-2xl border border-[#E3E8EF] p-5">
                <h3 className="font-display text-sm font-bold text-[#0E1726] mb-1">
                  Translate it
                </h3>
                <p className="text-xs text-[#475467] leading-relaxed">
                  Help bring Vixir to more languages and curricula.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B1220] text-[#93A0B8] py-6">
        <div className="max-w-[1240px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-display font-bold text-sm text-white">Vixir</span>
          <span>Virtual Practical Laboratory · Open Source</span>
        </div>
      </footer>
    </main>
  );
}
