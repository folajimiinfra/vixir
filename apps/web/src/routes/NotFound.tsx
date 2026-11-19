import { Link, useLocation } from 'react-router';

export function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#E3E8EF]">
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
            <Link to="/labs" className="hover:text-[#0E1726] transition-colors">
              Laboratories
            </Link>
            <Link to="/library" className="hover:text-[#0E1726] transition-colors">
              Experiments
            </Link>
            <Link to="/apparatus" className="hover:text-[#0E1726] transition-colors">
              Apparatus
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-sm font-semibold text-[#0E1726] hover:text-[#2448D8] transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/app"
              className="px-4 py-2 rounded-lg bg-[#2448D8] hover:bg-[#1B38B0] text-white text-sm font-semibold transition-colors"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main 404 Content */}
      <main className="flex-1 flex items-center py-12 md:py-20">
        <div className="max-w-[1140px] mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Copy & Actions */}
            <div className="lg:col-span-6 space-y-5">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF0E6] text-[#B54708] font-mono text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                404 · BENCH NOT FOUND
              </span>

              <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#0E1726] leading-[1.1] tracking-tight">
                This experiment isn’t on the bench.
              </h1>

              <p className="text-base text-[#475467] leading-relaxed max-w-lg">
                We couldn’t find a practical, briefing or report at{' '}
                <code className="px-2 py-0.5 rounded-md bg-white border border-[#E3E8EF] font-mono text-xs text-[#0E1726]">
                  {location.pathname}
                </code>
                . The link may have moved, or your role may not have access to this route.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/"
                  className="px-5 py-3 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-sm font-semibold transition-colors"
                >
                  Back to homepage
                </Link>
                <Link
                  to="/labs"
                  className="px-5 py-3 rounded-xl bg-white hover:bg-[#EDF1F7] border border-[#D0D7E2] text-[#0E1726] text-sm font-semibold transition-colors"
                >
                  Open laboratories hub
                </Link>
                <Link
                  to="/lab/physics/pendulum"
                  className="px-5 py-3 rounded-xl bg-white hover:bg-[#EDF1F7] border border-[#D0D7E2] text-[#0E1726] text-sm font-semibold transition-colors"
                >
                  Try the pendulum lab
                </Link>
              </div>

              {/* Quick Jump Links */}
              <div className="pt-4 border-t border-[#E3E8EF]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#6B778C] mb-3">
                  Jump directly to a workspace
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-semibold">
                  <Link
                    to="/app"
                    className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E3E8EF] hover:border-[#2448D8] text-[#0E1726] transition-colors"
                  >
                    Student dashboard →
                  </Link>
                  <Link
                    to="/library"
                    className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E3E8EF] hover:border-[#2448D8] text-[#0E1726] transition-colors"
                  >
                    Experiment library →
                  </Link>
                  <Link
                    to="/apparatus"
                    className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E3E8EF] hover:border-[#2448D8] text-[#0E1726] transition-colors"
                  >
                    Apparatus guide →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Dark Laboratory Diagnostic Card */}
            <div className="lg:col-span-6">
              <div className="bg-[#0B1220] rounded-2xl border border-[#22304A] shadow-[0_24px_48px_rgba(11,18,32,0.2)] overflow-hidden text-[#E6EBF5]">
                {/* Card Top Bar */}
                <div className="px-5 py-3.5 border-b border-[#1E2A42] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#E6EBF5]">
                    Diagnostic bench · Unassigned route
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#3A2112] text-[#FDBA74] font-mono text-[11px]">
                    STATUS 404
                  </span>
                </div>

                {/* Bench Illustration: Snapped Pendulum String & Detached Bob on Bench */}
                <div className="lab-grid-bg p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    <div className="sm:col-span-7 flex justify-center">
                      <svg
                        viewBox="0 0 260 220"
                        className="w-full max-w-[270px] h-auto"
                        role="img"
                        aria-label="Retort stand with a snapped pendulum string and bob resting on the bench"
                      >
                        <defs>
                          <radialGradient id="notFoundBobGrad" cx="35%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#FDBA74" />
                            <stop offset="55%" stopColor="#F97316" />
                            <stop offset="100%" stopColor="#9A3412" />
                          </radialGradient>
                        </defs>

                        {/* Bench surface */}
                        <rect x="24" y="196" width="212" height="8" rx="2" fill="#22304A" />

                        {/* Retort stand */}
                        <rect x="38" y="188" width="54" height="10" rx="2" fill="#3A4A68" />
                        <rect x="58" y="28" width="8" height="162" rx="2" fill="#3A4A68" />
                        <rect x="62" y="34" width="90" height="7" rx="2" fill="#55688C" />
                        <rect x="132" y="38" width="16" height="12" rx="2" fill="#8A6A4A" />

                        {/* Dashed expected equilibrium line */}
                        <line
                          x1="140"
                          y1="50"
                          x2="140"
                          y2="194"
                          stroke="#3A4A68"
                          strokeWidth="1.2"
                          strokeDasharray="3 4"
                        />

                        {/* Snapped upper string fragment */}
                        <path
                          d="M 140 50 L 140 94 L 136 101 L 143 107"
                          fill="none"
                          stroke="#E6EBF5"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />

                        {/* Warning ring around snap point */}
                        <circle
                          cx="140"
                          cy="104"
                          r="16"
                          fill="none"
                          stroke="#F97316"
                          strokeWidth="1.4"
                          strokeDasharray="4 3"
                        />
                        <text
                          x="164"
                          y="108"
                          fill="#FDBA74"
                          fontSize="10"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          string slipped
                        </text>

                        {/* Detached bob resting on bench */}
                        <circle
                          cx="176"
                          cy="184"
                          r="12"
                          fill="url(#notFoundBobGrad)"
                        />
                        <path
                          d="M 164 188 Q 152 192 142 194"
                          fill="none"
                          stroke="#E6EBF5"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    {/* Diagnostic Readouts */}
                    <div className="sm:col-span-5 space-y-2.5">
                      <div className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3.5 py-2.5">
                        <div className="text-[11px] text-[#93A0B8] mb-0.5">Error code</div>
                        <div className="font-mono text-lg font-bold text-[#FDBA74]">
                          404
                        </div>
                      </div>

                      <div className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3.5 py-2.5">
                        <div className="text-[11px] text-[#93A0B8] mb-0.5">
                          Apparatus state
                        </div>
                        <div className="font-mono text-sm font-medium text-[#E6EBF5]">
                          Not clamped
                        </div>
                      </div>

                      <div className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3.5 py-2.5">
                        <div className="text-[11px] text-[#93A0B8] mb-0.5">Precaution</div>
                        <div className="text-xs text-[#C9D3E6] leading-snug">
                          Check the route URL or pick a lab from the hub.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Event Log Strip */}
                <div className="bg-[#090E1A] border-t border-[#1E2A42] px-5 py-2.5 font-mono text-xs text-[#93A0B8]">
                  log &gt; Route &quot;{location.pathname}&quot; did not match any bench or
                  experiment.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0B1220] text-[#93A0B8] py-5">
        <div className="max-w-[1240px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-display font-bold text-sm text-white">Vixir</span>
          <span>Virtual Practical Laboratory · Open Source</span>
        </div>
      </footer>
    </div>
  );
}
