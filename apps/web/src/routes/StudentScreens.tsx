import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

type StudentNavKey =
  | 'dashboard'
  | 'labs'
  | 'experiments'
  | 'encyclopedia'
  | 'notebook'
  | 'assignments'
  | 'grades'
  | 'settings';

function StudentSidebar({ active }: { active: StudentNavKey }) {
  const navItems: { id: StudentNavKey; label: string; to: string }[] = [
    { id: 'dashboard', label: 'Dashboard', to: '/app' },
    { id: 'labs', label: 'Laboratories (5 labs)', to: '/labs' },
    { id: 'experiments', label: 'Experiments', to: '/library' },
    { id: 'encyclopedia', label: 'Apparatus encyclopedia', to: '/apparatus' },
    { id: 'notebook', label: 'Lab notebook', to: '/attempt/demo/report' },
    { id: 'assignments', label: 'Assignments', to: '/labs' },
    { id: 'grades', label: 'Grades', to: '/attempt/demo/report' },
    { id: 'settings', label: 'Settings', to: '/app' },
  ];

  return (
    <aside className="w-full md:w-[228px] bg-white border-b md:border-b-0 md:border-r border-[#E3E8EF] p-4 flex flex-col justify-between shrink-0">
      <div>
        <Link to="/" className="flex items-center gap-2.5 px-2 mb-6">
          <img src="/illustrations/logo.svg" alt="" className="w-7 h-7 rounded-[7px]" />
          <span className="font-display font-bold text-lg text-[#0E1726]">Vixir</span>
        </Link>

        <nav aria-label="Student navigation" className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                to={item.to}
                className={`block px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#EAEFFE] text-[#2448D8]'
                    : 'text-[#475467] hover:bg-[#F5F7FA] hover:text-[#0E1726]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 md:mt-0 px-3 py-2.5 rounded-xl bg-[#E6F6EE] text-[#0F7B45] text-[11px] font-medium flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#0F7B45] shrink-0" />
        <span>All results synced · 2 min ago</span>
      </div>
    </aside>
  );
}

// B1 — Student Dashboard
export function StudentDashboardScreen() {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] flex flex-col md:flex-row">
      <StudentSidebar active="dashboard" />

      <main className="flex-1 p-6 sm:p-8 max-w-[1160px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <div className="text-xs text-[#475467] mb-0.5">
              SS3 Science · Kings College, Lagos
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0E1726]">
              Good evening, Adaeze
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="search"
              aria-label="Search experiments"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search experiments..."
              className="w-56 sm:w-64 px-3.5 py-2 rounded-xl bg-white border border-[#D0D7E2] text-xs text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8]"
            />
            <div className="w-9 h-9 rounded-full bg-[#FDECE3] text-[#9A3412] text-xs font-bold flex items-center justify-center shrink-0">
              AO
            </div>
          </div>
        </div>

        {/* Due this week */}
        <section className="mb-7">
          <h2 className="font-display text-base font-bold text-[#0E1726] mb-3.5">
            Due this week
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1: Physics */}
            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAEFFE] text-[#1D4ED8] uppercase">
                    PHYSICS
                  </span>
                  <span className="text-[#B54708]">Due Wed, 18 Nov</span>
                </div>
                <h3 className="font-display text-base font-bold text-[#0E1726] mb-1">
                  Simple pendulum — determination of g
                </h3>
                <p className="text-xs text-[#475467] mb-4">
                  Mr. Bello · 6 trials · WAEC-style report
                </p>
                <div className="h-2 bg-[#E3E8EF] rounded-full overflow-hidden mb-3">
                  <div className="h-full w-1/2 bg-[#2448D8] rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#475467]">3 of 6 readings taken</span>
                <Link
                  to="/lab/physics/pendulum"
                  className="px-4 py-2 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold transition-colors"
                >
                  Continue
                </Link>
              </div>
            </div>

            {/* Card 2: Chemistry */}
            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FEF0E6] text-[#B45309] uppercase">
                    CHEMISTRY
                  </span>
                  <span className="text-[#475467]">Due Fri, 20 Nov</span>
                </div>
                <h3 className="font-display text-base font-bold text-[#0E1726] mb-1">
                  Acid–base titration: HCl vs NaOH
                </h3>
                <p className="text-xs text-[#475467] mb-4">
                  Mrs. Adeyemi · 3 concordant titres
                </p>
                <div className="h-2 bg-[#E3E8EF] rounded-full overflow-hidden mb-3" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#475467]">Not started</span>
                <Link
                  to="/lab/chemistry/titration/safety"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] text-[#0E1726] text-xs font-semibold transition-colors"
                >
                  Open briefing
                </Link>
              </div>
            </div>

            {/* Card 3: Electronics */}
            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E0F8F5] text-[#0F766E] uppercase">
                    ELECTRONICS
                  </span>
                  <span className="text-[#475467]">Due Mon, 23 Nov</span>
                </div>
                <h3 className="font-display text-base font-bold text-[#0E1726] mb-1">
                  Verifying Ohm’s law
                </h3>
                <p className="text-xs text-[#475467] mb-4">
                  Mr. Bello · 8 readings · I–V graph
                </p>
                <div className="h-2 bg-[#E3E8EF] rounded-full overflow-hidden mb-3" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#475467]">Not started</span>
                <Link
                  to="/experiments/simple-pendulum"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] text-[#0E1726] text-xs font-semibold transition-colors"
                >
                  Open briefing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Grid: Recent results + Practical skills */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Recent results */}
          <section className="lg:col-span-8 bg-white rounded-2xl border border-[#E3E8EF] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                Recent results
              </h2>
              <Link
                to="/attempt/demo/report"
                className="text-xs font-semibold text-[#2448D8] hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E3E8EF] text-[11px] font-bold uppercase text-[#6B778C]">
                    <th className="py-2.5 text-left">EXPERIMENT</th>
                    <th className="py-2.5 text-left">SUBMITTED</th>
                    <th className="py-2.5 text-left">RESULT</th>
                    <th className="py-2.5 text-right">SCORE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8EF]">
                  <tr>
                    <td className="py-3.5 font-semibold text-[#0E1726]">
                      Refraction through a glass block
                    </td>
                    <td className="py-3.5 text-[#475467]">11 Nov</td>
                    <td className="py-3.5 font-mono text-[#0E1726]">n = 1.49</td>
                    <td className="py-3.5 text-right">
                      <span className="px-2.5 py-1 rounded-md bg-[#E6F6EE] text-[#0F7B45] font-mono font-bold">
                        17 / 20
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-semibold text-[#0E1726]">
                      Principle of moments (metre rule)
                    </td>
                    <td className="py-3.5 text-[#475467]">4 Nov</td>
                    <td className="py-3.5 font-mono text-[#0E1726]">m = 48.6 g</td>
                    <td className="py-3.5 text-right">
                      <span className="px-2.5 py-1 rounded-md bg-[#FEF0E6] text-[#B54708] font-mono font-bold">
                        12 / 20
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-semibold text-[#0E1726]">
                      Rates of reaction (Na₂S₂O₃ + HCl)
                    </td>
                    <td className="py-3.5 text-[#475467]">28 Oct</td>
                    <td className="py-3.5 font-mono text-[#0E1726]">1/t ∝ [S₂O₃²⁻]</td>
                    <td className="py-3.5 text-right">
                      <span className="px-2.5 py-1 rounded-md bg-[#E6F6EE] text-[#0F7B45] font-mono font-bold">
                        18 / 20
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Practical skills */}
          <section className="lg:col-span-4 bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-[#0E1726]">
              Practical skills
            </h2>

            <div className="space-y-3 text-xs">
              {[
                { label: 'Taking readings', pct: 86, color: 'bg-[#2448D8]' },
                { label: 'Significant figures', pct: 71, color: 'bg-[#2448D8]' },
                { label: 'Graph plotting', pct: 64, color: 'bg-[#2448D8]' },
                { label: 'Stating precautions', pct: 42, color: 'bg-[#B54708]' },
              ].map((skill) => (
                <div key={skill.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#0E1726] font-medium">{skill.label}</span>
                    <span className="font-mono font-bold text-[#0E1726]">{skill.pct}%</span>
                  </div>
                  <div className="h-2 bg-[#E3E8EF] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${skill.color}`}
                      style={{ width: `${skill.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#FEF5EE] rounded-xl p-3.5 text-xs text-[#9A3412] leading-relaxed">
              <strong>Tip from your lab assistant:</strong> you often skip parallax and
              zero-error precautions. Try the 5-minute “Precautions” drill.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// B2 — Laboratories Hub (/labs)
export function LabsHubScreen() {
  const navigate = useNavigate();

  const labCards = [
    {
      name: 'Physics',
      count: '4 practicals',
      desc: 'Mechanics, optics, heat and waves on a configurable bench.',
      headerBg: 'bg-[#EAEFFE]',
      titleColor: 'text-[#1D4ED8]',
      to: '/lab/physics/pendulum',
      buttonLabel: 'Open Physics lab',
      items: [
        { title: 'Simple pendulum', to: '/lab/physics/pendulum', badge: 'Assigned', badgeClass: 'bg-[#EAEFFE] text-[#1D4ED8]' },
        { title: 'Refraction through a glass block', to: '/lab/physics/refraction', badge: 'Done', badgeClass: 'bg-[#E6F6EE] text-[#0F7B45]' },
        { title: 'Principle of moments', to: '/lab/physics/moments', badge: 'Done', badgeClass: 'bg-[#E6F6EE] text-[#0F7B45]' },
        { title: 'Specific heat capacity', to: '/lab/physics/pendulum', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
      ],
    },
    {
      name: 'Chemistry',
      count: '4 practicals',
      desc: 'Titrations, qualitative analysis and rates, with safety built in.',
      headerBg: 'bg-[#FEF0E6]',
      titleColor: 'text-[#B45309]',
      to: '/lab/chemistry/titration',
      buttonLabel: 'Open Chemistry lab',
      items: [
        { title: 'Acid–base titration', to: '/lab/chemistry/titration', badge: 'Offline', badgeClass: 'bg-[#FEF0E6] text-[#B54708]' },
        { title: 'Qualitative analysis of salts', to: '/lab/chemistry/qualitative-analysis', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
        { title: 'Rates of reaction', to: '/lab/chemistry/titration', badge: 'Done', badgeClass: 'bg-[#E6F6EE] text-[#0F7B45]' },
        { title: 'Heat of neutralisation', to: '/lab/chemistry/titration', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
      ],
    },
    {
      name: 'Biology',
      count: '4 practicals',
      desc: 'Animated anatomy, virtual dissection and the journey of food.',
      headerBg: 'bg-[#E6F6EE]',
      titleColor: 'text-[#15803D]',
      to: '/lab/biology/digestion',
      buttonLabel: 'Open Biology lab',
      items: [
        { title: 'Journey of food (digestion)', to: '/lab/biology/digestion', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
        { title: 'Dissection of a rat', to: '/lab/biology/dissection', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
        { title: 'Human body systems', to: '/lab/biology/body-systems', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
        { title: 'Food tests', to: '/lab/biology/food-tests', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
      ],
    },
    {
      name: 'Electronics',
      count: '4 practicals',
      desc: 'Circuits with real meters, ranges, heating and component tolerances.',
      headerBg: 'bg-[#E0F8F5]',
      titleColor: 'text-[#0F766E]',
      to: '/lab/electronics/ohms-law',
      buttonLabel: 'Open Electronics lab',
      items: [
        { title: 'Verifying Ohm’s law', to: '/lab/electronics/ohms-law', badge: 'Offline', badgeClass: 'bg-[#FEF0E6] text-[#B54708]' },
        { title: 'Diode I–V characteristics', to: '/lab/electronics/ohms-law', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
        { title: 'RC charging', to: '/lab/electronics/ohms-law', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
        { title: 'Logic gates', to: '/lab/electronics/ohms-law', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
      ],
    },
    {
      name: 'Engineering',
      count: '4 practicals',
      desc: 'Test rigs for structures, materials, fluids and machines.',
      headerBg: 'bg-[#F3E8FF]',
      titleColor: 'text-[#7E22CE]',
      to: '/lab/engineering/beam',
      buttonLabel: 'Open Engineering lab',
      items: [
        { title: 'Beam deflection', to: '/lab/engineering/beam', badge: 'Offline', badgeClass: 'bg-[#FEF0E6] text-[#B54708]' },
        { title: 'Tensile test', to: '/lab/engineering/beam', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
        { title: 'Bernoulli’s theorem', to: '/lab/engineering/beam', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
        { title: 'Gear trains', to: '/lab/engineering/beam', badge: 'New', badgeClass: 'bg-[#EDF1F7] text-[#475467]' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] flex flex-col md:flex-row">
      <StudentSidebar active="labs" />

      <main className="flex-1 p-6 sm:p-8 max-w-[1160px]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#0E1726] mb-1">
              Your laboratories
            </h1>
            <p className="text-sm text-[#475467]">
              Five labs, one bench. Pick up where you stopped, or open a new practical.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3.5 py-1.5 rounded-full bg-[#E6F6EE] text-[#0F7B45] text-xs font-semibold inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0F7B45]" />
              3 practicals downloaded for offline
            </span>
            <button
              type="button"
              onClick={() => navigate('/lab/vix/connect')}
              className="px-3.5 py-1.5 rounded-full bg-[#FEF5EE] text-[#9A3412] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
              Ask Vix which lab to start
            </button>
          </div>
        </div>

        {/* Resume Banner */}
        <div className="bg-[#0B1220] text-white rounded-2xl p-6 mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#FDBA74] mb-1">
              RESUME · PHYSICS LAB
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-1">
              Simple pendulum — 3 of 6 readings taken
            </h2>
            <p className="text-xs text-[#93A0B8]">
              Bench saved 14 min ago · due Wed 18 Nov
            </p>
          </div>

          <Link
            to="/lab/physics/pendulum"
            className="px-5 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-xs font-bold transition-colors self-start sm:self-center"
          >
            Back to the bench
          </Link>
        </div>

        {/* Lab Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {labCards.map((lab) => (
            <div
              key={lab.name}
              className="bg-white rounded-2xl border border-[#E3E8EF] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className={`${lab.headerBg} p-5`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <h2 className={`font-display text-lg font-bold ${lab.titleColor}`}>
                      {lab.name}
                    </h2>
                    <span className={`font-mono text-xs ${lab.titleColor}`}>
                      {lab.count}
                    </span>
                  </div>
                  <p className={`text-xs ${lab.titleColor} opacity-90 leading-relaxed`}>
                    {lab.desc}
                  </p>
                </div>

                <ul className="divide-y divide-[#E3E8EF] px-5 py-2 text-xs">
                  {lab.items.map((item) => (
                    <li
                      key={item.title}
                      className="py-2.5 flex items-center justify-between gap-2"
                    >
                      <Link
                        to={item.to}
                        className="font-medium text-[#0E1726] hover:text-[#2448D8] hover:underline"
                      >
                        {item.title}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.badgeClass}`}
                      >
                        {item.badge}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 pt-2">
                <Link
                  to={lab.to}
                  className="block w-full py-2.5 text-center rounded-xl bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] text-xs font-semibold text-[#0E1726] transition-colors"
                >
                  {lab.buttonLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// B3 — Experiment Library (/library)
const LIBRARY_EXPERIMENTS = [
  {
    slug: 'simple-pendulum',
    subject: 'Physics',
    formula: 'T² ∝ L',
    bannerBg: 'bg-[#EAEFFE]',
    formulaColor: 'text-[#1D4ED8]',
    title: 'Simple pendulum — determination of g',
    desc: 'Find g from the slope of a T² against L graph.',
    meta: '35 min   SS2–SS3   Assigned',
  },
  {
    slug: 'glass-block-refraction',
    subject: 'Physics',
    formula: 'n = sin i / sin r',
    bannerBg: 'bg-[#EAEFFE]',
    formulaColor: 'text-[#1D4ED8]',
    title: 'Refraction through a rectangular glass block',
    desc: 'Trace rays with pins and find the refractive index.',
    meta: '40 min   SS2–SS3   Completed',
  },
  {
    slug: 'principle-of-moments',
    subject: 'Physics',
    formula: 'ΣM = 0',
    bannerBg: 'bg-[#EAEFFE]',
    formulaColor: 'text-[#1D4ED8]',
    title: 'Principle of moments with a metre rule',
    desc: 'Balance a metre rule and find an unknown mass.',
    meta: '30 min   SS1–SS3   Completed',
  },
  {
    slug: 'acid-base-titration',
    subject: 'Chemistry',
    formula: 'C₁V₁ = C₂V₂',
    bannerBg: 'bg-[#FEF0E6]',
    formulaColor: 'text-[#B45309]',
    title: 'Acid–base titration: HCl vs NaOH',
    desc: 'Find the concentration of an acid from concordant titres.',
    meta: '45 min   SS2–SS3   Assigned',
  },
  {
    slug: 'qualitative-analysis',
    subject: 'Chemistry',
    formula: 'Cu²⁺ · SO₄²⁻',
    bannerBg: 'bg-[#FEF0E6]',
    formulaColor: 'text-[#B45309]',
    title: 'Qualitative analysis of salts',
    desc: 'Identify cations and anions from test observations.',
    meta: '40 min   SS3   New',
  },
  {
    slug: 'journey-of-food',
    subject: 'Biology',
    formula: 'Amylase → Pepsin',
    bannerBg: 'bg-[#E6F6EE]',
    formulaColor: 'text-[#15803D]',
    title: 'Journey of food through the human digestive tract',
    desc: 'Follow enzymatic breakdown and pH from mouth to ileum.',
    meta: '30 min   SS1–SS3   Interactive',
  },
  {
    slug: 'rat-dissection',
    subject: 'Biology',
    formula: 'Rattus norvegicus',
    bannerBg: 'bg-[#E6F6EE]',
    formulaColor: 'text-[#15803D]',
    title: 'Dissection of a mammal (rat)',
    desc: 'Guided 5-stage virtual dissection and thoracic/abdominal anatomy.',
    meta: '45 min   SS2–SS3   Interactive',
  },
  {
    slug: 'food-tests',
    subject: 'Biology',
    formula: 'I₂ · Benedict · Biuret',
    bannerBg: 'bg-[#E6F6EE]',
    formulaColor: 'text-[#15803D]',
    title: 'Biochemical food tests — starch, sugar, protein & lipids',
    desc: 'Test food specimens with Iodine, Benedict’s, Biuret, and Sudan III.',
    meta: '35 min   SS1–SS3   New',
  },
  {
    slug: 'ohms-law',
    subject: 'Electronics',
    formula: 'V = IR',
    bannerBg: 'bg-[#E0F8F5]',
    formulaColor: 'text-[#0F766E]',
    title: 'Verifying Ohm’s law',
    desc: 'Plot V against I and find the resistance of a wire.',
    meta: '30 min   SS2 · 100L   Assigned',
  },
  {
    slug: 'diode-iv',
    subject: 'Electronics',
    formula: 'I = I₀(e^(V/Vt) - 1)',
    bannerBg: 'bg-[#E0F8F5]',
    formulaColor: 'text-[#0F766E]',
    title: 'Diode I–V characteristics',
    desc: 'Measure forward and reverse bias behaviour.',
    meta: '35 min   100L · ND   New',
  },
  {
    slug: 'beam-deflection',
    subject: 'Engineering',
    formula: 'δ = WL³ / 48EI',
    bannerBg: 'bg-[#F3E8FF]',
    formulaColor: 'text-[#7E22CE]',
    title: 'Deflection of a simply supported beam',
    desc: 'Relate load to mid-span deflection and find E.',
    meta: '45 min   ND · 200L   New',
  },
  {
    slug: 'bernoulli-apparatus',
    subject: 'Engineering',
    formula: 'p + ½ρv² = C',
    bannerBg: 'bg-[#F3E8FF]',
    formulaColor: 'text-[#7E22CE]',
    title: 'Bernoulli’s theorem apparatus',
    desc: 'Measure pressure heads along a venturi tube.',
    meta: '40 min   ND · 200L   New',
  },
];

export function ExperimentLibraryScreen() {
  const [filter, setFilter] = useState('All');
  const [curriculum, setCurriculum] = useState('WAEC / NECO (SS1–SS3)');

  const filtered =
    filter === 'All'
      ? LIBRARY_EXPERIMENTS
      : LIBRARY_EXPERIMENTS.filter((e) => e.subject === filter);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] flex flex-col md:flex-row">
      <StudentSidebar active="experiments" />

      <main className="flex-1 p-6 sm:p-8 max-w-[1160px]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#0E1726] mb-1">
              Experiment library
            </h1>
            <p className="text-sm text-[#475467]">
              Pick an experiment to practise, or open one your teacher assigned.
            </p>
          </div>

          <div>
            <label
              htmlFor="curriculum-select"
              className="block text-[11px] font-semibold text-[#475467] mb-1"
            >
              Curriculum
            </label>
            <select
              id="curriculum-select"
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
              className="bg-white border border-[#D0D7E2] rounded-xl px-3.5 py-2 text-xs font-medium text-[#0E1726]"
            >
              <option value="WAEC / NECO (SS1–SS3)">WAEC / NECO (SS1–SS3)</option>
              <option value="JAMB / UTME">JAMB / UTME</option>
              <option value="University 100L / ND">University 100L / ND</option>
            </select>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {['All', 'Physics', 'Chemistry', 'Biology', 'Electronics', 'Engineering'].map((subj) => (
            <button
              key={subj}
              type="button"
              onClick={() => setFilter(subj)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                filter === subj
                  ? 'bg-[#0E1726] text-white'
                  : 'bg-white border border-[#D0D7E2] text-[#0E1726] hover:bg-[#EDF1F7]'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#6B778C] mb-4">{filtered.length} experiments</div>

        {/* Experiment Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((exp) => (
            <Link
              key={exp.slug}
              to={`/experiments/${exp.slug}`}
              className="bg-white rounded-2xl border border-[#E3E8EF] hover:border-[#2448D8] overflow-hidden flex flex-col justify-between transition-colors group"
            >
              <div>
                <div
                  className={`${exp.bannerBg} h-24 flex items-center justify-center px-4 font-mono text-xl font-semibold ${exp.formulaColor}`}
                >
                  {exp.formula}
                </div>
                <div className="p-5">
                  <div
                    className={`text-[10px] font-bold tracking-wider uppercase mb-1 ${exp.formulaColor}`}
                  >
                    {exp.subject}
                  </div>
                  <h2 className="font-display text-sm font-bold text-[#0E1726] group-hover:text-[#2448D8] mb-1.5 leading-snug">
                    {exp.title}
                  </h2>
                  <p className="text-xs text-[#475467] leading-relaxed">{exp.desc}</p>
                </div>
              </div>

              <div className="px-5 pb-4 text-[11px] text-[#6B778C] whitespace-pre">
                {exp.meta}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

// B4 — Experiment Briefing (/experiments/:slug)
export function ExperimentBriefingScreen() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const labRoute =
    slug === 'acid-base-titration'
      ? '/lab/chemistry/titration/safety'
      : slug === 'qualitative-analysis'
        ? '/lab/chemistry/qualitative-analysis'
        : slug === 'glass-block-refraction'
          ? '/lab/physics/refraction'
          : slug === 'principle-of-moments'
            ? '/lab/physics/moments'
            : slug === 'journey-of-food'
              ? '/lab/biology/digestion'
              : slug === 'rat-dissection'
                ? '/lab/biology/dissection'
                : slug === 'food-tests'
                  ? '/lab/biology/food-tests'
                  : slug === 'ohms-law' || slug === 'diode-iv'
                    ? '/lab/electronics/ohms-law'
                    : slug === 'beam-deflection' || slug === 'bernoulli-apparatus'
                      ? '/lab/engineering/beam'
                      : '/lab/physics/pendulum';

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726]">
      {/* Top Breadcrumb Bar */}
      <header className="bg-white border-b border-[#E3E8EF]">
        <div className="max-w-[1140px] mx-auto px-6 h-14 flex items-center justify-between text-xs">
          <div className="text-[#475467]">
            <Link to="/library" className="underline hover:text-[#0E1726]">
              Experiments
            </Link>{' '}
            /{' '}
            <Link to="/library" className="underline hover:text-[#0E1726]">
              Physics
            </Link>{' '}
            / <strong className="text-[#0E1726]">Simple pendulum</strong>
          </div>
          <Link to="/app" className="font-semibold text-[#2448D8] hover:underline">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-[1140px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-5">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#EAEFFE] text-[#1D4ED8] text-[11px] font-bold tracking-wider uppercase mb-3">
                PHYSICS · MECHANICS · SS2–SS3
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0E1726] mb-2">
                Simple pendulum — determination of g
              </h1>
              <p className="text-sm text-[#475467] leading-relaxed">
                Measure the period of a simple pendulum at six lengths, plot T² against L, and
                use the slope to find the acceleration due to gravity.
              </p>
            </div>

            {/* Apparatus */}
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
              <h2 className="font-display text-base font-bold text-[#0E1726] mb-3.5">
                Apparatus
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'Retort stand & clamp', sub: 'with split cork' },
                  { name: 'Metal bob', sub: 'mass ≈ 50 g' },
                  { name: 'Light inextensible string', sub: 'up to 120 cm' },
                  { name: 'Metre rule', sub: 'resolution 0.1 cm' },
                  { name: 'Stopwatch', sub: 'resolution 0.01 s' },
                  { name: 'Protractor', sub: 'keep θ < 10°' },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="rounded-xl border border-[#E3E8EF] p-3"
                  >
                    <div className="text-xs font-bold text-[#0E1726]">{item.name}</div>
                    <div className="text-[11px] text-[#475467] mt-0.5">{item.sub}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Theory */}
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0E1726]">Theory</h2>
              <p className="text-xs text-[#475467]">
                For small angles of swing, the period of a simple pendulum depends only on its
                length and on g:
              </p>
              <div className="bg-[#0B1220] text-[#E6EBF5] rounded-xl px-5 py-3.5 font-mono text-sm flex flex-wrap items-center gap-6">
                <span>T = 2π √(L / g)</span>
                <span className="text-[#FDBA74]">T² = (4π² / g) · L</span>
                <span className="text-[#C9D3E6]">⇒ g = 4π² / slope</span>
              </div>
            </section>

            {/* Procedure */}
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
              <h2 className="font-display text-base font-bold text-[#0E1726] mb-3">
                Procedure
              </h2>
              <ol className="space-y-2.5 text-xs text-[#0E1726] list-decimal list-inside leading-relaxed">
                <li>
                  Clamp the string between the split cork and set the effective length L = 40.0
                  cm, measured to the centre of the bob.
                </li>
                <li>
                  Displace the bob through a small angle (under 10°) and release it without
                  pushing.
                </li>
                <li>Time 20 complete oscillations. Repeat once and take the average.</li>
                <li>Calculate the period T = t / 20 and T².</li>
                <li>Repeat for L = 50, 60, 70, 80 and 90 cm.</li>
                <li>Plot T² against L, draw the line of best fit and find its slope.</li>
              </ol>
            </section>

            {/* Precautions */}
            <section className="bg-[#FEF5EE] border border-[#F9D7C4] rounded-2xl p-6">
              <h2 className="font-display text-base font-bold text-[#9A3412] mb-2.5">
                Precautions you will be marked on
              </h2>
              <ul className="space-y-2 text-xs text-[#9A3412] list-disc list-inside">
                <li>Avoid parallax error when reading the metre rule.</li>
                <li>Keep the angle of swing small.</li>
                <li>Start timing from the centre of the swing, not the extreme.</li>
                <li>Ensure the string is clamped firmly and does not slip.</li>
              </ul>
            </section>
          </div>

          {/* Right Column */}
          <aside className="lg:col-span-4 space-y-5">
            {/* Assignment details */}
            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-4">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                Your assignment
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[#6B778C]">Set by</div>
                  <div className="font-bold text-[#0E1726]">Mr. Bello</div>
                </div>
                <div>
                  <div className="text-[#6B778C]">Due</div>
                  <div className="font-bold text-[#B54708]">Wed, 18 Nov</div>
                </div>
                <div>
                  <div className="text-[#6B778C]">Attempts</div>
                  <div className="font-bold text-[#0E1726]">1 of 2</div>
                </div>
                <div>
                  <div className="text-[#6B778C]">Marks</div>
                  <div className="font-bold text-[#0E1726]">20</div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => navigate(labRoute)}
                  className="w-full py-3 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Enter the lab
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/lab/physics/pendulum/setup')}
                  className="w-full py-3 rounded-xl bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] text-[#0E1726] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Practice mode (not graded)
                </button>
              </div>
            </div>

            {/* Marking Breakdown */}
            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                How you’ll be marked
              </h2>
              <ul className="divide-y divide-[#E3E8EF] text-xs">
                {[
                  { label: 'Readings & repeats', marks: 6 },
                  { label: 'Table & significant figures', marks: 3 },
                  { label: 'Graph (axes, scale, points, line)', marks: 5 },
                  { label: 'Slope & value of g', marks: 4 },
                  { label: 'Precautions', marks: 2 },
                ].map((c) => (
                  <li
                    key={c.label}
                    className="py-2 flex items-center justify-between text-[#0E1726]"
                  >
                    <span>{c.label}</span>
                    <span className="font-mono font-semibold">{c.marks}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pre-lab check */}
            <div className="bg-[#EAEFFE] rounded-2xl p-5 space-y-3">
              <h2 className="font-display text-sm font-bold text-[#1D4ED8]">
                Pre-lab check
              </h2>
              <p className="text-xs text-[#1D4ED8] leading-relaxed">
                Why do we time 20 oscillations instead of one?
              </p>
              <button
                type="button"
                onClick={() => navigate('/lab/physics/pendulum/setup')}
                className="w-full py-2.5 rounded-xl bg-white text-[#1D4ED8] text-xs font-bold hover:bg-[#F5F7FA] transition-colors cursor-pointer"
              >
                Answer 3 quick questions
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// B5 — Verbose Apparatus Encyclopedia (/apparatus)
export interface EncyclopediaItem {
  id: string;
  name: string;
  subtitle: string;
  subject: 'Physics' | 'Chemistry' | 'Biology' | 'Electronics' | 'Engineering';
  file: string;
  practiseTo: string;
  description: string;
  specs: {
    resolution: string;
    range: string;
    zeroError: string;
    material: string;
  };
  parts: { part: string; role: string }[];
  handling: string[];
  mistakes: string[];
  spotInLab: string;
}

const APPARATUS_ITEMS: EncyclopediaItem[] = [
  {
    id: 'compound-microscope',
    name: 'Compound light microscope',
    subtitle: 'Biology',
    subject: 'Biology',
    file: '/apparatus/compound-microscope.svg',
    practiseTo: '/lab/biology/dissection',
    description:
      'A dual-lens optical instrument that uses visible light transmitted through a thin specimen slide, magnifying it first through an objective lens (×4, ×10, ×40) and then through an ocular eyepiece (×10) for total magnification of ×40 to ×400.',
    specs: {
      resolution: '≈ 0.2 µm optical limit',
      range: '×40, ×100, ×400 total magnification',
      zeroError: 'Centre condenser & start on low-power ×4 objective',
      material: 'Enamelled cast-iron stand + achromatic glass optics',
    },
    parts: [
      { part: 'Eyepiece (ocular lens ×10)', role: 'Further magnifies the real image formed by the objective lens.' },
      { part: 'Revolving nosepiece & objectives', role: 'Holds scanning (×4), low (×10) and high-power (×40) lenses; clicks into alignment.' },
      { part: 'Mechanical stage & clips', role: 'Holds the glass microscope slide flat over the condenser aperture.' },
      { part: 'Iris diaphragm & condenser', role: 'Controls the cone of light and contrast passing through the specimen.' },
      { part: 'Coarse & fine focus knobs', role: 'Coarse knob moves stage rapidly at ×4; fine knob sharpens focus at ×40 without cracking the slide.' },
    ],
    handling: [
      'Carry with two hands — one gripping the curved C-arm and the other supporting the heavy horseshoe base.',
      'Rotate the nosepiece until the lowest power objective (×4, red ring) clicks into position.',
      'Clip the prepared slide onto the stage and watch from the side while lowering the tube with the coarse knob.',
      'Look through the eyepiece and turn the coarse knob slowly upward until the specimen comes into focus.',
      'Adjust the iris diaphragm for crisp contrast, then switch to ×10 or ×40 and use the fine focus knob only.',
    ],
    mistakes: [
      'Using the coarse adjustment knob under high power (×40), driving the objective lens through the cover slip.',
      'Focusing downward while looking into the eyepiece instead of watching from the side.',
      'Leaving the iris diaphragm wide open on unstained transparent cells, washing out all contrast.',
      'Drawing biological diagrams with sketchy shading instead of clear continuous lines and magnification labels.',
    ],
    spotInLab: 'Heavy horseshoe base with inclined eyepiece tube, triple revolving nosepiece and coarse/fine focus wheels.',
  },
  {
    id: 'dissecting-kit',
    name: 'Dissecting kit & wax tray',
    subtitle: 'Biology',
    subject: 'Biology',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/biology/dissection',
    description:
      'A complete zoological and botanical dissection set comprising an aluminium tray lined with black paraffin wax, surgical scalpel, blunt and fine forceps, iris scissors, mounted seeker probe, dissecting pins and a ×10 hand lens.',
    specs: {
      resolution: '×10 folding hand lens',
      range: 'Vertebrate, invertebrate & floral specimens',
      zeroError: 'Pin specimen flat at 45° outward slant so pins do not block view',
      material: 'Surgical stainless steel + paraffin wax tray',
    },
    parts: [
      { part: 'Wax dissecting tray', role: 'Anchors dissecting pins firmly and holds water/saline to float delicate organs.' },
      { part: 'Surgical scalpel', role: 'Makes the initial shallow skin incision; never used deep inside the body cavity.' },
      { part: 'Scissors & blunt forceps', role: 'Lifts the abdominal body wall away from underlying viscera while cutting.' },
      { part: 'Seeker (blunt bent probe)', role: 'Separates connective tissue and traces blood vessels or ducts without puncturing them.' },
      { part: 'Dissecting pins', role: 'Inserted at 45° outward angle to hold skin flaps and limbs flat against the wax.' },
    ],
    handling: [
      'Lay the specimen ventral-side up on the wax bed and pin the four limbs at a 45° outward angle.',
      'Grip the skin at the lower midline with forceps, make a small nick, and cut forward with round-tipped scissors keeping the lower blade lifted.',
      'Pin back the body wall flaps symmetrically and flood the cavity with water to float organs clearly.',
      'Use the blunt seeker — never a sharp scalpel point — to trace the oesophagus, bile duct, ureters and blood vessels.',
    ],
    mistakes: [
      'Plunging the scalpel blade deep into the abdomen and puncturing the liver, stomach or caecum.',
      'Pinning vertically (90°) so the pins pull out of the wax or obstruct your hand lens.',
      'Cutting blood vessels before identifying the hepatic portal vein, vena cava and dorsal aorta.',
    ],
    spotInLab: 'Canvas roll or metal case of stainless-steel instruments alongside a dark wax-filled metal dish.',
  },
  {
    id: 'potometer',
    name: 'Bubble potometer (transpiration)',
    subtitle: 'Biology',
    subject: 'Biology',
    file: '/apparatus/potometer.svg',
    practiseTo: '/lab/biology/digestion',
    description:
      'An apparatus that measures the rate of water uptake by a leafy plant shoot (an accurate proxy for transpiration rate) by timing the movement of an air bubble along a graduated capillary tube.',
    specs: {
      resolution: '1.0 mm capillary scale (≈ 0.01 cm³)',
      range: '0 – 150 mm bubble travel',
      zeroError: 'Open reservoir tap to push air bubble back to 0 mm mark',
      material: 'Borosilicate capillary tubing + rubber bung',
    },
    parts: [
      { part: 'Leafy shoot in rubber bung', role: 'Transpires water from stomata, pulling water column up the xylem.' },
      { part: 'Reservoir funnel & stopcock tap', role: 'Lets water into the capillary tube to push the air bubble back to zero for repeat runs.' },
      { part: 'Graduated capillary tube', role: 'Narrow bore magnifies small volume uptake into measurable linear distance (mm/min).' },
      { part: 'Beaker of water', role: 'Supplies water at the open end; lowered momentarily to draw in a single air bubble.' },
    ],
    handling: [
      'Cut the last 2 cm of the woody plant stem obliquely under water to prevent air locks (embolism) in the xylem vessels.',
      'Assemble the shoot into the rubber bung under water and seal all joints with petroleum jelly (Vaseline).',
      'Dry the leaves gently with filter paper — wet leaves suppress stomatal transpiration.',
      'Introduce one small air bubble by lifting the capillary end out of the beaker for a second, then submerge it again.',
      'Time how far the trailing edge of the bubble moves in 5 minutes; open the reservoir tap to reset to zero and repeat.',
    ],
    mistakes: [
      'Cutting the plant stem in air instead of under water, trapping air bubbles inside the xylem.',
      'Failing to seal the rubber bung with petroleum jelly so air leaks in and the bubble stalls.',
      'Leaving water droplets on the leaves, which blocks stomata and gives an artificially low rate.',
    ],
    spotInLab: 'H-shaped glass capillary assembly mounted on a wooden backing board with a leafy twig in the top bung.',
  },
  {
    id: 'petri-slides',
    name: 'Petri dish, slides & cover slips',
    subtitle: 'Biology',
    subject: 'Biology',
    file: '/apparatus/petri-slides.svg',
    practiseTo: '/lab/biology/digestion',
    description:
      'Shallow cylindrical glass/plastic culture dishes for agar plates or specimen washing, paired with 75×25 mm optical glass slides and 0.17 mm ultra-thin cover slips for wet-mount microscopy.',
    specs: {
      resolution: '0.17 mm cover-slip thickness (No. 1.5)',
      range: '75 × 25 mm slide · 90 mm Petri dish',
      zeroError: 'Wipe slide free of fingerprints and air bubbles before viewing',
      material: 'Soda-lime / borosilicate optical glass',
    },
    parts: [
      { part: 'Petri dish & lid', role: 'Holds sterile nutrient agar for microbiology or water for floating plant epidermis sections.' },
      { part: '75 × 25 mm glass slide', role: 'Flat optical platform supporting the specimen and mounting medium (water/glycerol/stain).' },
      { part: '22 × 22 mm cover slip', role: 'Flattens the liquid drop into an even layer and protects the objective lens from stain.' },
      { part: 'Mounted needle', role: 'Lowers the cover slip slowly at a 45° angle so air escapes without trapping silver-ringed bubbles.' },
    ],
    handling: [
      'Place one small drop of water or stain (iodine for starch/onion cells, methylene blue for cheek cells) in the centre of a clean slide.',
      'Lay a single-cell-thick peel (never a folded chunk) flat in the drop using fine forceps.',
      'Rest one edge of the cover slip against the drop at 45° and lower it gently with a mounted needle.',
      'Blot any excess stain around the edges of the cover slip with a strip of filter paper.',
    ],
    mistakes: [
      'Dropping the cover slip flat onto the specimen, trapping dark-ringed circular air bubbles.',
      'Mounting a thick, folded piece of tissue so cells overlap and light cannot pass through.',
      'Flooding the top of the cover slip with stain, which corrodes the ×40 objective lens.',
    ],
    spotInLab: 'Flat rectangular glass strips in a slotted box next to a small square box of paper-thin glass cover slips.',
  },
  {
    id: 'retort-stand',
    name: 'Retort stand, boss & clamp',
    subtitle: 'All labs',
    subject: 'Physics',
    file: '/apparatus/retort-stand.svg',
    practiseTo: '/lab/physics/pendulum',
    description:
      'A heavy cast-iron base with a vertical steel rod. The bosshead locks onto the rod at any height and holds a cork-lined three-finger clamp or split cork.',
    specs: {
      resolution: 'Adjustable height 5 – 75 cm',
      range: 'Holds loads up to 2.0 kg over base foot',
      zeroError: 'Check verticality with a plumb line before measuring height',
      material: 'Enamelled cast-iron base + chrome-plated steel rod',
    },
    parts: [
      { part: 'Heavy cast-iron base', role: 'Lowers the centre of gravity so suspended pendulums, springs or burettes cannot tip.' },
      { part: 'Vertical steel rod', role: 'Rigid column along which bossheads slide to adjust apparatus height.' },
      { part: 'Bosshead (double clamp block)', role: 'Two perpendicular V-grooves with thumbscrews locking the clamp stem to the vertical rod.' },
      { part: 'Cork-lined clamp jaws', role: 'Grips glassware or a split cork firmly without cracking glass or letting string slip.' },
    ],
    handling: [
      'Place the heavy base flat on the bench with the suspended load positioned directly over the base foot — never facing away from it.',
      'Slide the bosshead to the required height and tighten the vertical-rod thumbscrew first.',
      'Grip the split cork or glassware gently in the cork-lined clamp jaws without overtightening.',
    ],
    mistakes: [
      'Clamping the load on the side away from the base foot so the entire stand tips over during oscillation.',
      'Leaving the split cork loose so the pendulum string slips and changes effective length L.',
    ],
    spotInLab: 'Heavy grey or black base with a tall vertical rod and two thumbscrews on the bosshead.',
  },
  {
    id: 'burette',
    name: 'Burette (50 cm³)',
    subtitle: 'Chemistry',
    subject: 'Chemistry',
    file: '/apparatus/burette.svg',
    practiseTo: '/lab/chemistry/titration',
    description:
      'A long graduated glass tube marked from 0.00 cm³ at the top to 50.00 cm³ near the stopcock tap, in 0.1 cm³ divisions. In WAEC, NECO and university practicals, burette readings must always be recorded to 2 decimal places ending in .00 or .05.',
    specs: {
      resolution: '0.05 cm³ (half of 0.1 cm³ smallest division)',
      range: '0.00 – 50.00 cm³',
      zeroError: 'Clear air bubble from jet tip before recording initial reading',
      material: 'Class A / B borosilicate glass + PTFE stopcock',
    },
    parts: [
      { part: '0.0 cm³ top zero mark', role: 'Measures volume delivered downward (you do not have to start exactly at 0.00 cm³).' },
      { part: '0.1 cm³ graduation lines', role: 'Etched rings around the tube enabling estimation to the nearest 0.05 cm³.' },
      { part: 'Concave meniscus', role: 'Aqueous solutions curve downward; always read the bottom of the meniscus at eye level.' },
      { part: 'PTFE stopcock (tap)', role: 'Controls flow rate from fast stream down to single 0.05 cm³ drops near end point.' },
      { part: 'Jet tip', role: 'Fine nozzle below the tap; must be completely filled with liquid with no trapped air bubble.' },
    ],
    handling: [
      'Rinse with distilled water, then rinse with 5–10 cm³ of the acid/titrant it will hold (never leave water inside).',
      'Clamp vertically, fill above the 0 mark using a small funnel, then immediately remove the funnel.',
      'Open the tap briefly over a waste beaker to expel the air bubble from the jet tip.',
      'Bring your eye level with the bottom of the concave meniscus (hold a white card behind it) and record to 2 d.p. (e.g. 0.40 cm³).',
    ],
    mistakes: [
      'Leaving the funnel in the top of the burette while titrating (drops from the funnel stem alter the volume).',
      'Starting a titration with an air bubble trapped in the jet tip below the tap.',
      'Recording burette readings to 1 decimal place (e.g. 24.2 cm³ instead of 24.20 cm³) — loses table accuracy marks.',
      'Reading the top of the meniscus or reading from above/below (parallax error).',
    ],
    spotInLab: 'Clamped vertically on a retort stand with a white porcelain tile beneath.',
  },
  {
    id: 'conical-flask',
    name: 'Conical flask (250 cm³)',
    subtitle: 'Chemistry',
    subject: 'Chemistry',
    file: '/apparatus/conical-flask.svg',
    practiseTo: '/lab/chemistry/titration',
    description:
      'An Erlenmeyer titration flask with a flat base, sloping conical walls and a narrow cylindrical neck designed so the reaction mixture can be swirled continuously during titration without splashing out.',
    specs: {
      resolution: 'Reaction vessel (nominal 250 cm³)',
      range: 'Holds 25.0 cm³ aliquot + up to 50 cm³ titrant',
      zeroError: 'Rinse with distilled water only — never with the aliquot solution',
      material: 'Heat-resistant borosilicate glass',
    },
    parts: [
      { part: 'Narrow cylindrical neck', role: 'Easy to grip between thumb and fingers for wrist-swirling under the burette tip.' },
      { part: 'Sloping conical walls', role: 'Deflects splashed liquid back down into the bulk solution and accepts wash-bottle rinsing.' },
      { part: 'Flat transparent base', role: 'Rests on a white porcelain tile so the faintest indicator colour change is visible.' },
    ],
    handling: [
      'Wash thoroughly and rinse with distilled water only (leftover pure water does not change the number of moles pipetted into it).',
      'Drain 25.0 cm³ of base from the volumetric pipette into the flask and add exactly 2–3 drops of indicator.',
      'Place on a white porcelain tile and swirl continuously while adding titrant from the burette.',
      'Near the end point, wash down any drops clinging to the inside walls using a wash bottle of distilled water.',
    ],
    mistakes: [
      'Rinsing the conical flask with the base solution before pipetting (adds extra moles of base and inflates the titre).',
      'Adding a squirt (10+ drops) of indicator instead of 2–3 drops (indicators are weak acids/bases and shift the end point).',
    ],
    spotInLab: 'Resting on a white porcelain tile directly under the burette jet tip.',
  },
  {
    id: 'volumetric-pipette',
    name: 'Volumetric pipette (25.0 cm³)',
    subtitle: 'Chemistry',
    subject: 'Chemistry',
    file: '/apparatus/volumetric-pipette.svg',
    practiseTo: '/lab/chemistry/titration',
    description:
      'A single-volume transfer pipette with a central cylindrical bulb and one etched ring on the upper stem, calibrated to deliver ("TD" at 20 °C) an exact 25.00 cm³ aliquot with ±0.03 cm³ accuracy.',
    specs: {
      resolution: 'Fixed 25.00 cm³ ± 0.03 cm³',
      range: 'Single calibrated volume (25.0 cm³ or 20.0 cm³)',
      zeroError: 'Accounted for in calibration — never blow out the last drop in the tip',
      material: 'Borosilicate glass + rubber safety pipette filler',
    },
    parts: [
      { part: 'Safety pipette filler bulb', role: 'Three-valve rubber bulb (A: expel air, S: suck liquid, E: empty) — replaces mouth pipetting.' },
      { part: 'Single etched graduation ring', role: 'Marks exact 25.00 cm³ volume when the bottom of the meniscus rests on the ring at eye level.' },
      { part: 'Central expansion bulb', role: 'Holds most of the 25 cm³ volume while keeping the upper stem narrow for high precision.' },
      { part: 'Tapered delivery tip', role: 'Calibrated to retain one small drop by surface tension after touching the flask wall.' },
    ],
    handling: [
      'Rinse with distilled water, then rinse with a small portion of the solution to be pipetted.',
      'Fit the safety pipette filler and draw solution 2–3 cm above the graduation ring, keeping the tip well below the liquid surface.',
      'Release pressure gently until the bottom of the meniscus rests tangential to the graduation ring at eye level.',
      'Transfer to the conical flask, allow to drain vertically under gravity, and touch the tip against the inner glass wall for 3 seconds.',
    ],
    mistakes: [
      'Pipetting corrosive or toxic reagents by mouth.',
      'Blowing out the small drop remaining in the tip after draining (that drop is outside the calibrated 25.00 cm³).',
      'Letting the pipette tip rise above the liquid surface while sucking, drawing liquid up into the rubber filler.',
    ],
    spotInLab: 'Slender glass tube with a single central bulb and one etched ring on the upper stem.',
  },
  {
    id: 'beaker',
    name: 'Beaker (250 cm³)',
    subtitle: 'Chemistry · Physics · Biology',
    subject: 'Chemistry',
    file: '/apparatus/beaker.svg',
    practiseTo: '/lab/chemistry/titration',
    description:
      'A flat-bottomed cylindrical borosilicate glass vessel with a pouring spout used for holding stock reagents, decanting, heating liquids on a wire gauze and rough volume transfers (±5% accuracy only).',
    specs: {
      resolution: '± 12 cm³ (approximate guide markings only)',
      range: '50 – 250 cm³',
      zeroError: 'Not a volumetric measuring instrument',
      material: 'Pyrex / borosilicate glass (low thermal expansion)',
    },
    parts: [
      { part: 'Pouring spout (beak)', role: 'Directs liquid in a clean stream without dribbling down the outer glass wall.' },
      { part: 'Approximate volume markings', role: 'Indicates rough fill level (±5%); never used for quantitative titration volumes.' },
      { part: 'Flat heat-resistant base', role: 'Sits evenly on a ceramic-centred wire gauze for heating over a Bunsen burner.' },
    ],
    handling: [
      'Label beakers clearly with a wax pencil (e.g. "Acid A", "Base B", "Waste") before pouring colourless solutions.',
      'Rinse with a few cm³ of the stock solution before filling so residual water does not dilute the reagent.',
      'Pour along a glass stirring rod when transferring liquids to avoid splashing.',
    ],
    mistakes: [
      'Measuring 25 cm³ of base for a titration using a beaker instead of a volumetric pipette.',
      'Confusing unlabelled colourless acid and base beakers on the bench.',
    ],
    spotInLab: 'Wide cylindrical glass cup with a pouring lip and white enamel volume markings.',
  },
  {
    id: 'bunsen-burner',
    name: 'Bunsen burner, tripod & wire gauze',
    subtitle: 'Chemistry · Biology',
    subject: 'Chemistry',
    file: '/apparatus/bunsen-burner.svg',
    practiseTo: '/lab/chemistry/titration',
    description:
      'A laboratory gas burner that mixes flammable gas (LPG/methane) with controlled amounts of air through a rotating collar to produce either a visible yellow safety flame or a hot, non-luminous blue heating flame.',
    specs: {
      resolution: 'Air-hole collar: 0% (yellow safety) to 100% (roaring blue)',
      range: 'Flame temperature 300 °C (luminous) to 1,200 °C (non-luminous)',
      zeroError: 'Always close air hole completely before lighting',
      material: 'Brass barrel + cast-iron base + iron tripod + ceramic gauze',
    },
    parts: [
      { part: 'Barrel (chimney)', role: 'Mixes gas and primary air upward before combustion at the top rim.' },
      { part: 'Rotating air-hole collar', role: 'Adjusts the volume of primary air premixed with gas; closed = yellow flame, open = blue flame.' },
      { part: 'Hottest zone (tip of inner blue cone)', role: 'Region of complete combustion (~1,200 °C) where test tubes or crucibles are heated.' },
      { part: 'Wire gauze on tripod stand', role: 'Spreads heat uniformly across the flat base of a beaker or flask to prevent thermal cracking.' },
    ],
    handling: [
      'Check the rubber gas hose for cracks, connect firmly to the bench gas tap, and rotate the collar to close the air hole completely.',
      'Light the match or striker first, hold it to the side of the barrel rim, and turn on the gas tap to produce a yellow safety flame.',
      'Open the air-hole collar gradually until a clean, non-luminous two-cone blue flame forms for heating.',
      'Whenever you pause heating, close the air hole back to the visible yellow safety flame so no one reaches into an invisible blue flame.',
    ],
    mistakes: [
      'Lighting the burner with the air hole open, causing "strike-back" where the flame burns at the bottom gas jet and makes the metal barrel dangerously hot.',
      'Heating glassware in the yellow luminous flame, coating the glass in black carbon soot.',
      'Leaving an unattended burner on the invisible blue flame.',
    ],
    spotInLab: 'Vertical metal chimney on a round base connected by ribbed rubber tubing to a yellow bench gas tap.',
  },
  {
    id: 'test-tube-rack',
    name: 'Test-tube rack, test tubes & boiling tube',
    subtitle: 'Chemistry · Biology',
    subject: 'Chemistry',
    file: '/apparatus/test-tube-rack.svg',
    practiseTo: '/lab/biology/digestion',
    description:
      'A wooden or polypropylene rack holding thin-walled test tubes (15×150 mm) for qualitative cation/anion and food tests (Benedict’s, Biuret, iodine) alongside wider boiling tubes (25×150 mm) designed for vigorous heating without bumping.',
    specs: {
      resolution: '1 – 2 cm³ sample depth (≈ 2 cm in tube)',
      range: 'Test tube 15 cm³ · Boiling tube 45 cm³',
      zeroError: 'Always run a distilled-water blank alongside colour tests',
      material: 'Borosilicate glass + hardwood rack + spring holder',
    },
    parts: [
      { part: 'Standard test tubes', role: 'Hold small 1–2 cm³ aliquots for dropwise addition of NaOH(aq), NH₃(aq), AgNO₃ or BaCl₂.' },
      { part: 'Wide-mouth boiling tube', role: 'Wider diameter prevents superheated liquid from ejecting ("bumping") out of the mouth when heated.' },
      { part: 'Wooden/wire test-tube holder', role: 'Grips the tube 2 cm below the rim during heating over a Bunsen flame.' },
      { part: 'Drying pegs on rack', role: 'Support washed tubes inverted so rinse water drains completely without contamination.' },
    ],
    handling: [
      'Use only 1–2 cm depth of test solution; overfilling makes mixing impossible and wastes reagent.',
      'Add precipitating reagents (NaOH or NH₃) dropwise first while shaking gently, then in excess to test whether the precipitate dissolves.',
      'When heating a boiling tube, grip it near the top with a holder, tilt at 45°, point the mouth away from everyone, and move it in and out of the flame.',
    ],
    mistakes: [
      'Filling a test tube halfway before adding reagent, leaving no room to test solubility "in excess".',
      'Pointing the mouth of a heated boiling tube toward yourself or a classmate.',
      'Recording a transparent coloured solution as a "precipitate" (a precipitate is cloudy/opaque).',
    ],
    spotInLab: 'Two-tier slotted stand with vertical drying pins holding narrow and wide round-bottomed glass tubes.',
  },
  {
    id: 'metre-rule',
    name: 'Metre rule (100 cm)',
    subtitle: 'Physics · Engineering',
    subject: 'Physics',
    file: '/apparatus/metre-rule.svg',
    practiseTo: '/lab/physics/pendulum',
    description:
      'A 100.0 cm hardwood or stainless-steel rule graduated in centimetres and millimetres (0.1 cm). Used for pendulum lengths, spring extensions, optical bench distances and as a uniform beam in Principle of Moments experiments.',
    specs: {
      resolution: '0.1 cm (1 mm) — always record to 1 d.p. in cm (e.g. 60.0 cm)',
      range: '0.0 – 100.0 cm',
      zeroError: 'Avoid worn 0.0 cm end; read between two interior marks (e.g. 10.0 cm and 70.0 cm)',
      material: 'Seasoned boxwood / hardwood or tempered stainless steel',
    },
    parts: [
      { part: '1 mm (0.1 cm) graduation ticks', role: 'Smallest division on the scale; determines the mandatory 1 d.p. in cm (or 3 d.p. in m) recording rule.' },
      { part: 'Dual opposing scales', role: 'Allows reading left-to-right or right-to-left; always check which scale you are reading.' },
      { part: 'Centre of gravity (G ≈ 50.0 cm)', role: 'Balance point on a knife-edge fulcrum before hanging masses in moments practicals.' },
    ],
    handling: [
      'Mount vertically next to the pendulum or spring using a second retort clamp and check verticality with a plumb line.',
      'Use a set-square or horizontal pointer riding on the scale to transfer the centre of the bob to the rule edge.',
      'Position your eye perpendicular to the scale at the reading mark to eliminate parallax error.',
      'If the zero end is chipped or worn, start from the 1.0 cm or 10.0 cm mark and subtract.',
    ],
    mistakes: [
      'Recording metre-rule readings as whole numbers (e.g. 60 cm instead of 60.0 cm) — loses precision marks.',
      'Measuring pendulum length to the top hook of the bob instead of its centre of mass.',
      'Assuming a metre rule balances at 50.0 cm without balancing it unloaded on the knife edge first.',
    ],
    spotInLab: '100 cm hardwood rule with centimetre and millimetre graduations along both long edges.',
  },
  {
    id: 'micrometer',
    name: 'Micrometer screw gauge (0.01 mm)',
    subtitle: 'Physics · Engineering',
    subject: 'Physics',
    file: '/apparatus/micrometer.svg',
    practiseTo: '/lab/electronics/ohms-law',
    description:
      'A high-precision screw-thread calliper used to measure the diameter of resistance wires (e.g. SWG 28 nichrome wire), pendulum bobs and thin sheets to 0.01 mm (0.001 cm). One full turn of the 50-division thimble advances the spindle by 0.50 mm.',
    specs: {
      resolution: '0.01 mm (0.001 cm)',
      range: '0.00 – 25.00 mm',
      zeroError: 'Close anvil & spindle via ratchet; note ±0.01 mm offset from datum line',
      material: 'Hardened steel anvil/spindle + insulated U-frame',
    },
    parts: [
      { part: 'Anvil & spindle faces', role: 'Precision-ground flat jaws between which the wire or sphere is gripped.' },
      { part: 'Sleeve (main scale)', role: 'Graduated in whole millimetres above the datum line and 0.5 mm half-millimetres below it.' },
      { part: 'Thimble (50 circular divisions)', role: 'Each division equals 0.50 mm / 50 = 0.01 mm; added to the sleeve reading.' },
      { part: 'Ratchet stop', role: 'Clicks at a constant torque (3 clicks) so you never crush the wire or spring the U-frame.' },
    ],
    handling: [
      'Wipe the anvil and spindle faces clean with tissue paper, close them using the ratchet stop until it clicks 3 times, and record the zero error.',
      'Open the jaws, place the wire between anvil and spindle, and close using the ratchet stop (never force the thimble barrel directly).',
      'Read the last visible 0.5 mm mark on the sleeve, add (thimble division × 0.01 mm), and subtract the zero error.',
      'Measure the wire diameter at 3 different positions along its length and in two perpendicular directions to check for non-circularity.',
    ],
    mistakes: [
      'Tightening by the main thimble instead of the ratchet stop, flattening soft copper/nichrome wire and introducing a false zero error.',
      'Missing the 0.50 mm half-millimetre mark visible on the lower half of the sleeve scale.',
      'Taking only a single diameter reading instead of averaging 3–4 readings along the wire.',
    ],
    spotInLab: 'Horseshoe U-frame with a rotating graduated thimble and small clicking ratchet knob at the end.',
  },
  {
    id: 'vernier-caliper',
    name: 'Vernier caliper (0.1 mm / 0.02 mm)',
    subtitle: 'Engineering · Physics',
    subject: 'Engineering',
    file: '/apparatus/vernier-caliper.svg',
    practiseTo: '/lab/engineering/beam',
    description:
      'A sliding calliper with outside jaws, inside jaws and a depth blade that combines a main millimetre scale with a sliding vernier scale to measure beam width, pendulum bob diameter and cylinder internal depth to 0.01 cm (0.1 mm) or 0.02 mm.',
    specs: {
      resolution: '0.01 cm (0.1 mm) or 0.02 mm (50-division vernier)',
      range: '0.00 – 15.00 cm (0 – 150 mm)',
      zeroError: 'Close jaws completely and check whether vernier 0 aligns with main 0',
      material: 'Satin-chrome stainless steel',
    },
    parts: [
      { part: 'Outside jaws', role: 'Grip the external diameter of a pendulum bob, cylinder or test beam width.' },
      { part: 'Inside (upper) jaws', role: 'Measure the internal bore diameter of a beaker, calorimeter or pipe.' },
      { part: 'Depth probe blade', role: 'Protrudes from the tail end as the slider moves to measure hole or vessel depth.' },
      { part: 'Vernier sliding scale', role: '10 divisions spanning 9 mm (0.1 mm resolution) or 50 divisions spanning 49 mm (0.02 mm resolution).' },
    ],
    handling: [
      'Clean and close the jaws completely; record any positive or negative zero error.',
      'Grip the object squarely between the flat middle flats of the outside jaws (not the sharp tips) and lock the thumb clamp.',
      'Read the main scale in cm/mm immediately to the left of the vernier zero mark.',
      'Find which vernier graduation line aligns dead-straight with a main-scale line, multiply by the least count, and add to the main reading.',
    ],
    mistakes: [
      'Reading the main scale at the leading metal edge of the sliding jaw instead of at the vernier 0 line.',
      'Viewing the vernier coincidence mark at an angle (parallax causes you to pick the neighbouring division).',
    ],
    spotInLab: 'Stainless steel rule with fixed and sliding jaws for outside, inside and depth measurements.',
  },
  {
    id: 'glass-block',
    name: 'Rectangular glass block & optical pins',
    subtitle: 'Physics',
    subject: 'Physics',
    file: '/apparatus/glass-block.svg',
    practiseTo: '/lab/physics/pendulum',
    description:
      'A polished optical crown-glass slab (typically 115 × 65 × 20 mm, refractive index n ≈ 1.50) used with four vertical optical sighting pins on a soft drawing board to verify Snell’s Law (n = sin i / sin r) and measure lateral displacement.',
    specs: {
      resolution: 'Protractor ±0.5° · Pin spacing ≥ 5.0 cm',
      range: 'Angle of incidence i = 15° to 60°',
      zeroError: 'Re-align block onto traced pencil outline before every sighting',
      material: 'Optical crown glass + brass/steel sighting pins',
    },
    parts: [
      { part: 'Opposite parallel polished faces', role: 'Refract the ray at entry and exit so the emergent ray is parallel to the incident ray.' },
      { part: 'Frosted side edges', role: 'Prevent stray internal reflections through the non-working sides.' },
      { part: 'Incident pins (P₁ & P₂)', role: 'Define the incident ray at angle i to the normal; must be spaced at least 5 cm apart.' },
      { part: 'Search pins (P₃ & P₄)', role: 'Placed on the emergent side while sighting through the block so all four pin bases appear in one line.' },
    ],
    handling: [
      'Pin a sheet of plain white paper to the soft drawing board, place the glass block centrally, and trace its exact outline with a sharp pencil.',
      'Remove the block, construct a 90° normal N near the left third of the upper face, and draw incident rays at i = 20°, 30°, 40°, 50°, 60°.',
      'Stick pins P₁ and P₂ vertically on the incident line at least 5 cm apart.',
      'Replace the block accurately on its outline, close one eye, look through the lower glass face at the bases of P₁ and P₂, and insert P₃ and P₄ in line.',
    ],
    mistakes: [
      'Placing optical pins closer than 4–5 cm apart, which magnifies angular drawing error when joining the pinholes.',
      'Sighting the tops of the pins instead of their bases where they enter the paper (tilted pins give wrong rays).',
      'Measuring the angle of incidence i between the ray and the glass surface instead of between the ray and the 90° normal.',
    ],
    spotInLab: 'Heavy transparent rectangular glass slab with two clear long faces and two frosted end faces.',
  },
  {
    id: 'calorimeter',
    name: 'Copper calorimeter & thermometer',
    subtitle: 'Physics · Chemistry',
    subject: 'Physics',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/physics/pendulum',
    description:
      'A thin-walled polished copper cup housed inside a cotton-wool lagged wooden jacket with a copper loop stirrer and lid, used to determine specific heat capacity of solids/liquids and enthalpy of neutralisation with minimal heat loss.',
    specs: {
      resolution: 'Thermometer 0.5 °C · Electronic balance 0.1 g',
      range: 'specific heat capacity of copper c ≈ 390 J kg⁻¹ K⁻¹',
      zeroError: 'Stir continuously and record highest steady temperature reached',
      material: 'Polished electrolytic copper + cotton-wool lagging + wooden jacket',
    },
    parts: [
      { part: 'Polished inner copper vessel', role: 'Known low specific heat capacity (390 J kg⁻¹ K⁻¹) and shiny surface that minimises radiation heat loss.' },
      { part: 'Cotton-wool lagging & wooden box', role: 'Traps still air around the copper vessel to prevent conduction and convection heat exchange.' },
      { part: 'Insulated lid & copper stirrer', role: 'Prevents evaporation/convection from the water surface and equalises temperature throughout the liquid.' },
      { part: 'Mercury/alcohol thermometer', role: 'Suspended in the liquid (not touching the bottom) to read initial and final equilibrium temperatures.' },
    ],
    handling: [
      'Weigh the dry, empty inner copper calorimeter together with its copper stirrer (mass m₁).',
      'Fill halfway with water, re-weigh (mass m₂), place inside the lagged jacket, cover with the lid and record steady initial temperature θ₁.',
      'Transfer the heated solid rapidly (shaking off boiling water drops) or run current through the immersion coil while stirring gently up and down.',
      'Watch the thermometer thread at eye level and record the maximum steady equilibrium temperature θ₂.',
    ],
    mistakes: [
      'Splashing hot water or carrying boiling water droplets on the string when transferring a heated metal block into the calorimeter.',
      'Using the glass thermometer bulb as a stirrer (thin glass bulb shatters easily).',
      'Forgetting to include the heat capacity of the copper calorimeter itself (m₁ · c_copper · Δθ) in the heat balance equation.',
    ],
    spotInLab: 'Shiny reddish-brown copper cup nested inside a larger wooden box stuffed with cotton wool.',
  },
  {
    id: 'voltmeter',
    name: 'Analogue voltmeter & ammeter',
    subtitle: 'Electronics · Physics',
    subject: 'Electronics',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/electronics/ohms-law',
    description:
      'Moving-coil permanent-magnet bench meters. The Ammeter has very low internal resistance and connects in series to measure current I; the Voltmeter has high multiplier resistance and connects in parallel to measure potential difference V.',
    specs: {
      resolution: '0–1 A (0.02 A/div) · 0–3 V (0.05 V/div)',
      range: 'Dual range binding posts (e.g. 0–1 A / 0–3 A and 0–3 V / 0–15 V)',
      zeroError: 'Adjust front mechanical zero-screw with circuit key open',
      material: 'D’Arsonval moving coil + anti-parallax mirror scale',
    },
    parts: [
      { part: 'Black (–) common terminal', role: 'Connected toward the negative terminal of the battery/power supply.' },
      { part: 'Red (+) range terminals', role: 'Selects full-scale deflection (e.g. 3 V or 15 V); always match the scale you read to the terminal wired.' },
      { part: 'Mechanical zero-adjust screw', role: 'Small slotted screw below the window that zeroes the pointer when no current flows.' },
      { part: 'Curved scale & anti-parallax mirror', role: 'Align the pointer with its reflection in the mirror strip so your eye is dead perpendicular.' },
    ],
    handling: [
      'With the key open, check that the pointer rests exactly on 0; turn the zero screw gently with a screwdriver if offset.',
      'Wire the Ammeter in series and the Voltmeter in parallel across Test Wire X, observing polarity (+ to +) so the needle does not kick backward.',
      'Tap the key closed momentarily to check that the needle deflects forward and stays within full scale.',
      'Calculate the value of 1 small division (Range / total divisions) before recording readings.',
    ],
    mistakes: [
      'Connecting the high-resistance voltmeter in series (blocks current) or the low-resistance ammeter in parallel (short-circuits the cell).',
      'Wiring into the 3 V terminal post while reading numbers off the top 15 V scale arc.',
      'Reversing + and – leads so the needle slams backward against the zero stop pin.',
    ],
    spotInLab: 'Sloping black bench case with a curved V or A scale and red/black terminal binding posts.',
  },
  {
    id: 'rheostat',
    name: 'Sliding rheostat (variable resistor)',
    subtitle: 'Electronics · Physics',
    subject: 'Electronics',
    file: '/apparatus/rheostat.svg',
    practiseTo: '/lab/electronics/ohms-law',
    description:
      'A coil of oxidised constantan or nichrome wire wound tightly around an insulating ceramic cylinder with a spring-loaded metal slider on an upper brass rail, used to vary circuit resistance smoothly from 0 Ω to maximum rated resistance.',
    specs: {
      resolution: 'Continuous stepless sliding contact',
      range: '0 – 20 Ω (max current 2.5 A)',
      zeroError: 'Clean slider contacts; connect one bottom terminal + one top terminal',
      material: 'Ceramic core + oxidised resistance wire + brass slider bar',
    },
    parts: [
      { part: 'Top terminal (connected to slider rail)', role: 'Collects current after it passes through the active fraction of the wire coil into the sliding wiper.' },
      { part: 'Two bottom terminals (ends of coil)', role: 'Connected to the two ends of the resistance winding; use only ONE bottom terminal for variable resistance.' },
      { part: 'Sliding contact wiper', role: 'Moves along the upper brass bar to lengthen or shorten the resistance wire path in circuit.' },
    ],
    handling: [
      'Connect one wire to ONE of the bottom end terminals and the second wire to the TOP slider-bar terminal at the opposite end.',
      'Slide the wiper to maximum resistance (furthest from the wired bottom terminal) before closing the circuit key for the first time.',
      'Move the slider in 5–6 even steps to spread your (I, V) readings across the full range of the meters.',
    ],
    mistakes: [
      'Connecting both circuit wires to the two bottom terminals (turns the rheostat into a fixed resistor so moving the slider does nothing).',
      'Connecting both wires to the top bar (short-circuits the rheostat to 0 Ω and overheats the circuit).',
      'Leaving the plug key closed between readings while the wire heats up and changes resistance.',
    ],
    spotInLab: 'Cylindrical grey wire-wound tube on two end brackets with a black slider block riding on a top metal rod.',
  },
  {
    id: 'breadboard-dmm',
    name: 'Solderless breadboard & digital multimeter',
    subtitle: 'Electronics',
    subject: 'Electronics',
    file: '/apparatus/breadboard-dmm.svg',
    practiseTo: '/lab/electronics/ohms-law',
    description:
      'A reusable prototyping board with internal nickel-silver spring clips arranged in 5-hole vertical terminal columns and horizontal power buses, paired with a 3½-digit Digital Multimeter (DMM) for measuring DC/AC voltage, current, resistance and diode drop.',
    specs: {
      resolution: '2.54 mm (0.1 inch) pin pitch · DMM 0.01 V / 0.1 mA / 0.1 Ω',
      range: '200 mV – 600 V · 200 µA – 10 A · 200 Ω – 20 MΩ',
      zeroError: 'Touch DMM probes together on 200 Ω range and subtract lead resistance (~0.2 Ω)',
      material: 'ABS polymer housing + phosphor-bronze/nickel-silver contact clips',
    },
    parts: [
      { part: 'Horizontal power rails (+ red / – blue)', role: 'Run along the top and bottom edges to distribute Vcc and Ground across the board.' },
      { part: '5-hole terminal columns (A–E, F–J)', role: 'Each column of 5 holes is electrically connected underneath; insert different leads in different columns.' },
      { part: 'Central IC ravine (isolation channel)', role: '7.62 mm gap separating top (A–E) and bottom (F–J) halves so DIP ICs straddle without shorting pins.' },
      { part: 'DMM COM, VΩmA & 10A sockets', role: 'Black lead always stays in COM; red lead moves to 10A jack for high-current measurement.' },
    ],
    handling: [
      'Insert the two legs of a resistor, diode or LED into two different vertical 5-hole columns (never the same 5-hole column).',
      'To measure resistance with the DMM, disconnect the power supply first and place probes across the component.',
      'To measure current with the DMM, break the circuit branch and connect the meter in series so current flows through the DMM.',
    ],
    mistakes: [
      'Plugging both legs of a resistor or LED into the same 5-hole vertical strip (short-circuits the component directly).',
      'Switching the DMM to Current (mA/10A) mode and touching the probes in parallel across a battery (blows the internal DMM fuse immediately).',
      'Measuring resistance (Ω) while circuit power is still switched on.',
    ],
    spotInLab: 'White perforated plastic board with red/blue edge stripes next to a handheld yellow-cased digital meter.',
  },
  {
    id: 'dial-gauge',
    name: 'Dial gauge on magnetic stand',
    subtitle: 'Engineering',
    subject: 'Engineering',
    file: '/apparatus/dial-gauge.svg',
    practiseTo: '/lab/engineering/beam',
    description:
      'A precision rack-and-pinion mechanical comparator mounted on a switchable permanent-magnet stand. Vertical movement of the spring-loaded plunger is magnified by a gear train so 1.00 mm of travel rotates the main pointer one full 360° revolution (100 divisions of 0.01 mm).',
    specs: {
      resolution: '0.01 mm (10 µm) per outer dial division',
      range: '0.00 – 10.00 mm (10 revolutions on inner counter)',
      zeroError: 'Rotate outer bezel ring to align 0 with pointer under tare load',
      material: 'Hardened stainless-steel rack & plunger + V-grooved magnetic base',
    },
    parts: [
      { part: 'Spring-loaded contact plunger', role: 'Rests perpendicular to the top mid-span of the test beam and tracks downward deflection.' },
      { part: 'Outer 0–100 scale & rotatable bezel', role: '100 divisions = 1.00 mm per turn (0.01 mm/div); outer ring turns to zero the gauge.' },
      { part: 'Inner revolution-counter sub-dial', role: 'Counts whole millimetres (0–10 mm) so you know how many full turns the main needle has made.' },
      { part: 'Switchable ON/OFF magnetic base', role: 'Locks the stand rigidly to the steel test frame when switched ON.' },
    ],
    handling: [
      'Place the magnetic block on the rigid steel base frame and turn the rotary switch to ON.',
      'Adjust the cross-arm so the plunger rests vertically (90°) on the centre of the beam with 1–2 mm of initial preload travel.',
      'With the empty load hanger attached, tap the bench lightly, loosen the bezel clamp, and rotate the dial face until 0 aligns with the needle.',
      'After adding or removing each 100 g slotted mass, tap the bench lightly to free any plunger stiction and read whole mm + (outer division × 0.01 mm).',
    ],
    mistakes: [
      'Mounting the plunger at an angle θ to the vertical (introduces cosine error: reading = δ / cos θ).',
      'Setting the plunger with zero preload so it runs out of downward travel as the beam sags.',
      'Reading only the main needle and forgetting to add whole millimetres from the small inner revolution counter.',
    ],
    spotInLab: 'Circular clock-face gauge clamped to a chrome vertical post on a heavy black ON/OFF magnetic block.',
  },
  {
    id: 'venturi-manometer',
    name: 'Venturi tube & multi-tube manometer',
    subtitle: 'Engineering · Physics',
    subject: 'Engineering',
    file: '/apparatus/venturi-manometer.svg',
    practiseTo: '/lab/engineering/beam',
    description:
      'A horizontal clear acrylic converging-diverging Venturi section fitted with vertical piezometer manometer tubes along its length to demonstrate Bernoulli’s Theorem (p/ρg + v²/2g + z = H) and measure flow rate from the throat pressure head drop.',
    specs: {
      resolution: '1 mm H₂O static pressure head on manometer backboard',
      range: '0 – 400 mm H₂O piezometer head',
      zeroError: 'Bleed all air bubbles and level all tubes at static no-flow condition',
      material: 'Machined clear PMMA acrylic Venturi + glass piezometer bank',
    },
    parts: [
      { part: 'Converging inlet cone (14°–21°)', role: 'Accelerates fluid smoothly into the throat while converting static pressure head into velocity head.' },
      { part: 'Cylindrical Venturi throat', role: 'Minimum cross-sectional area A₂ where velocity v₂ is maximum and piezometer head h₂ is minimum.' },
      { part: 'Gradual diverging diffuser (5°–7°)', role: 'Decelerates flow and recovers static pressure head with minimal eddy head loss.' },
      { part: 'Vertical piezometer tubes', role: 'Display local static pressure head h = p / (ρg) in mm of water at 5–11 stations along the tube.' },
    ],
    handling: [
      'Open the inlet supply valve and outlet control valve to purge all trapped air pockets from the Venturi tube and manometer lines.',
      'Close the outlet valve momentarily with water inside to verify all piezometer menisci settle at the same horizontal datum level.',
      'Set a steady flow rate so the upstream tube reads near the top of the board and the throat tube reads near the bottom without drawing in air.',
      'Record every piezometer height h_i at eye level and time the collection of a known volume V in the measuring tank to find actual discharge Q.',
    ],
    mistakes: [
      'Taking piezometer readings while air bubbles are trapped in the connecting tubes (damps and offsets the water column height).',
      'Confusing static pressure head h with velocity head v²/2g when plotting the Hydraulic Grade Line (HGL) and Total Energy Line (TEL).',
    ],
    spotInLab: 'Horizontal waisted Perspex pipe connected to a vertical bank of parallel water-level glass tubes against a millimetre scale.',
  },
];

export function ApparatusEncyclopediaScreen() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState('compound-microscope');
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [rotated, setRotated] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [hideLabels, setHideLabels] = useState(false);

  const visibleItems = APPARATUS_ITEMS.filter((item) => {
    const matchesSubject =
      filter === 'All' || item.subject === filter || item.subtitle.includes(filter);
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const selectedItem =
    APPARATUS_ITEMS.find((i) => i.id === selectedId) ??
    visibleItems[0] ??
    APPARATUS_ITEMS[0]!;

  const subjectBadgeClass: Record<EncyclopediaItem['subject'], string> = {
    Physics: 'bg-[#EAEFFE] text-[#1D4ED8]',
    Chemistry: 'bg-[#FEF0E6] text-[#B45309]',
    Biology: 'bg-[#E6F6EE] text-[#15803D]',
    Electronics: 'bg-[#E0F8F5] text-[#0F766E]',
    Engineering: 'bg-[#F3E8FF] text-[#7E22CE]',
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] flex flex-col md:flex-row">
      {/* Dedicated Sidebar with Apparatus Encyclopedia active */}
      <StudentSidebar active="encyclopedia" />

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#E3E8EF]">
          <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Link to="/labs" className="font-semibold text-[#2448D8] hover:underline">
                ← Labs
              </Link>
              <span className="text-[#6B778C]">
                {APPARATUS_ITEMS.length} real laboratory instruments across 5 disciplines
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/lab/vix/connect')}
              className="px-3.5 py-1.5 rounded-full bg-[#FEF5EE] text-[#9A3412] font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
              Ask Vix about this apparatus
            </button>
          </div>
        </header>

        <main className="max-w-[1280px] mx-auto px-6 py-7">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-[#0E1726] mb-1.5">
                Apparatus encyclopedia
              </h1>
              <p className="text-sm text-[#475467] max-w-2xl">
                Know the real equipment before you meet it. Every piece is drawn in isometric view
                with its parts labelled, technical specifications, step-by-step handling, and the
                exact mistakes WAEC, NECO and university examiners penalise.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                aria-label="Search apparatus"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search microscope, burette..."
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#D0D7E2] text-xs text-[#0E1726] placeholder:text-[#6B778C]"
              />
              {['All', 'Biology', 'Physics', 'Chemistry', 'Electronics', 'Engineering'].map(
                (subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setFilter(subj)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      filter === subj
                        ? 'bg-[#0E1726] text-white'
                        : 'bg-white border border-[#D0D7E2] text-[#0E1726] hover:bg-[#EDF1F7]'
                    }`}
                  >
                    {subj}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 2-Column Layout: Left Cards Grid + Right Verbose Detail View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 2-col Grid of Apparatus */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 max-h-[860px] overflow-y-auto pr-1">
              {visibleItems.map((item) => {
                const active = item.id === selectedItem.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      setRotated(false);
                      setZoomed(false);
                    }}
                    className={`text-left rounded-2xl p-3.5 bg-white transition-all cursor-pointer ${
                      active
                        ? 'border-2 border-[#2448D8] shadow-xs'
                        : 'border border-[#E3E8EF] hover:border-[#93A0B8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${subjectBadgeClass[item.subject]}`}
                      >
                        {item.subject}
                      </span>
                      <span className="font-mono text-[10px] text-[#6B778C]">
                        {item.specs.resolution.split(' ')[0]}
                      </span>
                    </div>
                    <div className="h-24 flex items-center justify-center my-2">
                      <img
                        src={item.file}
                        alt={item.name}
                        className="max-h-22 w-auto object-contain"
                      />
                    </div>
                    <div className="text-xs font-bold text-[#0E1726] leading-snug">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-[#6B778C] mt-0.5">{item.subtitle}</div>
                  </button>
                );
              })}
            </div>

            {/* Right Verbose Detail Panel */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E3E8EF] overflow-hidden">
              {/* Isometric Drawing Stage */}
              <div className="bg-[#F9FAFC] border-b border-[#E3E8EF] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${subjectBadgeClass[selectedItem.subject]}`}
                    >
                      {selectedItem.subject}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white border border-[#E3E8EF] text-xs text-[#475467]">
                      Isometric view · not to scale
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoomed(!zoomed)}
                      className="px-3 py-1 rounded-lg bg-white hover:bg-[#EDF1F7] border border-[#D0D7E2] text-xs font-semibold text-[#0E1726] cursor-pointer"
                    >
                      {zoomed ? 'Reset zoom' : 'Zoom ×1.25'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotated(!rotated)}
                      className="px-3 py-1 rounded-lg bg-white hover:bg-[#EDF1F7] border border-[#D0D7E2] text-xs font-semibold text-[#0E1726] cursor-pointer"
                    >
                      Rotate view
                    </button>
                    <button
                      type="button"
                      onClick={() => setHideLabels(!hideLabels)}
                      className="px-3 py-1 rounded-lg bg-white hover:bg-[#EDF1F7] border border-[#D0D7E2] text-xs font-semibold text-[#0E1726] cursor-pointer"
                    >
                      {hideLabels ? 'Show labels' : 'Hide labels'}
                    </button>
                  </div>
                </div>

                <div className="h-[290px] flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedItem.file}
                    alt={selectedItem.name}
                    className={`max-h-[275px] w-auto object-contain transition-transform duration-300 ${
                      rotated ? '-scale-x-100' : ''
                    } ${zoomed ? 'scale-125' : ''}`}
                  />
                </div>
              </div>

              {/* Detail Copy & Technical Specifications */}
              <div className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0E1726] mb-1.5">
                      {selectedItem.name}
                    </h2>
                    <p className="text-sm text-[#475467] leading-relaxed">
                      {selectedItem.description}
                    </p>
                  </div>
                  <Link
                    to={selectedItem.practiseTo}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold transition-colors shrink-0"
                  >
                    Practise with it →
                  </Link>
                </div>

                {/* 4-Tile Technical Specification Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="rounded-xl bg-[#F5F7FA] border border-[#E3E8EF] p-3">
                    <div className="text-[10px] font-bold uppercase text-[#6B778C] mb-0.5">
                      Resolution / Least count
                    </div>
                    <div className="font-mono text-xs font-bold text-[#0E1726]">
                      {selectedItem.specs.resolution}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F5F7FA] border border-[#E3E8EF] p-3">
                    <div className="text-[10px] font-bold uppercase text-[#6B778C] mb-0.5">
                      Range / Capacity
                    </div>
                    <div className="font-mono text-xs font-semibold text-[#0E1726]">
                      {selectedItem.specs.range}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F5F7FA] border border-[#E3E8EF] p-3">
                    <div className="text-[10px] font-bold uppercase text-[#6B778C] mb-0.5">
                      Zero error &amp; check
                    </div>
                    <div className="text-xs font-medium text-[#0E1726] leading-snug">
                      {selectedItem.specs.zeroError}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F5F7FA] border border-[#E3E8EF] p-3">
                    <div className="text-[10px] font-bold uppercase text-[#6B778C] mb-0.5">
                      Construction
                    </div>
                    <div className="text-xs font-medium text-[#0E1726] leading-snug">
                      {selectedItem.specs.material}
                    </div>
                  </div>
                </div>

                {/* Labelled Anatomy & Parts Breakdown */}
                {!hideLabels && (
                  <div className="rounded-xl border border-[#E3E8EF] overflow-hidden">
                    <div className="bg-[#F5F7FA] px-4 py-2.5 border-b border-[#E3E8EF] text-xs font-bold text-[#0E1726]">
                      Anatomy &amp; functional parts
                    </div>
                    <div className="divide-y divide-[#E3E8EF] text-xs">
                      {selectedItem.parts.map((p) => (
                        <div
                          key={p.part}
                          className="px-4 py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2"
                        >
                          <span className="sm:col-span-4 font-bold text-[#1D4ED8]">
                            {p.part}
                          </span>
                          <span className="sm:col-span-8 text-[#475467]">{p.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* How to handle it + Mistakes examiners look for */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#F5F7FA] rounded-xl p-4">
                    <h3 className="font-display text-xs font-bold text-[#0E1726] mb-2.5">
                      How to handle &amp; read it (step by step)
                    </h3>
                    <ol className="space-y-2 text-xs text-[#475467] list-decimal list-inside leading-relaxed">
                      {selectedItem.handling.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="bg-[#FEF5EE] rounded-xl p-4">
                    <h3 className="font-display text-xs font-bold text-[#9A3412] mb-2.5">
                      Mistakes examiners look for (marking penalties)
                    </h3>
                    <ul className="space-y-2 text-xs text-[#9A3412] list-disc list-inside leading-relaxed">
                      {selectedItem.mistakes.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="text-xs text-[#475467] pt-1">
                  Spot it in a real lab:{' '}
                  <strong className="text-[#0E1726]">{selectedItem.spotInLab}</strong>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
