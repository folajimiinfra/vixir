import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  getStoredAccessToken,
  vixirApi,
  type ClassSummary,
  type PracticalMode,
} from '../lib/api';

function TeacherSidebar({ active }: { active: 'dashboard' | 'classes' | 'assignments' | 'marking' | 'builder' | 'library' }) {
  const items = [
    { id: 'dashboard' as const, label: 'Dashboard', to: '/teacher' },
    { id: 'classes' as const, label: 'Classes', to: '/teacher' },
    { id: 'assignments' as const, label: 'Assignments', to: '/teacher/assignments/new' },
    { id: 'marking' as const, label: 'Marking', to: '/teacher/assignments/demo/results', badge: '12' },
    { id: 'builder' as const, label: 'Experiment builder', to: '/teacher/builder' },
    { id: 'library' as const, label: 'Library', to: '/library' },
  ];

  return (
    <aside className="w-full md:w-[220px] bg-[#0B1220] text-[#E6EBF5] p-4 flex flex-col justify-between shrink-0">
      <div>
        <Link to="/" className="flex items-center gap-2.5 px-2 mb-6">
          <img src="/illustrations/logo.svg" alt="" className="w-7 h-7 rounded-[7px]" />
          <span className="font-display font-bold text-lg text-white">Vixir</span>
          <span className="text-xs text-[#93A0B8]">Teacher</span>
        </Link>

        <nav aria-label="Teacher navigation" className="space-y-1">
          {items.map((item) => {
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                to={item.to}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-[#1C2A47] text-white'
                    : 'text-[#C9D3E6] hover:bg-[#121A2B] hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-[#F97316] text-[#0B1220] text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

// G1 — Teacher Dashboard (/teacher)
export function TeacherDashboardScreen() {
  const navigate = useNavigate();
  const [apiClasses, setApiClasses] = useState<ClassSummary[]>([]);

  useEffect(() => {
    if (!getStoredAccessToken()) return;
    let cancelled = false;
    vixirApi
      .listClasses()
      .then((list) => {
        if (!cancelled && list.length > 0) setApiClasses(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] flex flex-col md:flex-row">
      <TeacherSidebar active="dashboard" />

      <main className="flex-1 p-6 sm:p-8 max-w-[1160px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#475467] mb-0.5">
              Physics Department · First term 2026/27
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0E1726]">
              Welcome, Mr. Bello
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate('/teacher/assignments/new')}
            className="px-5 py-3 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-center"
          >
            + Assign an experiment
          </button>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E3E8EF] p-5">
            <div className="text-xs text-[#475467] mb-1">Active assignments</div>
            <div className="font-display text-3xl font-bold text-[#0E1726] mb-1">4</div>
            <div className="text-xs text-[#6B778C]">across 3 classes</div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E3E8EF] p-5">
            <div className="text-xs text-[#475467] mb-1">Awaiting your review</div>
            <div className="font-display text-3xl font-bold text-[#B54708] mb-1">12</div>
            <div className="text-xs text-[#6B778C]">flagged by auto-marker</div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E3E8EF] p-5">
            <div className="text-xs text-[#475467] mb-1">Average score</div>
            <div className="font-display text-3xl font-bold text-[#0E1726] mb-1">
              15.2<span className="text-base font-normal text-[#6B778C]">/20</span>
            </div>
            <div className="text-xs text-[#6B778C]">simple pendulum, SS3A</div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E3E8EF] p-5">
            <div className="text-xs text-[#475467] mb-1">Completion</div>
            <div className="font-display text-3xl font-bold text-[#0E1726] mb-1">78%</div>
            <div className="text-xs text-[#6B778C]">of assigned practicals</div>
          </div>
        </div>

        {/* Active assignments table */}
        <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-[#0E1726]">
              Active assignments
            </h2>
            <Link
              to="/teacher/assignments/new"
              className="text-xs font-semibold text-[#2448D8] underline"
            >
              Manage
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E3E8EF] text-[11px] font-bold uppercase text-[#6B778C]">
                  <th className="py-2.5 text-left">EXPERIMENT</th>
                  <th className="py-2.5 text-left">CLASS</th>
                  <th className="py-2.5 text-left">DUE</th>
                  <th className="py-2.5 text-left">SUBMITTED</th>
                  <th className="py-2.5 text-left">AVG</th>
                  <th className="py-2.5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8EF]">
                <tr>
                  <td className="py-3.5 font-semibold text-[#0E1726]">
                    Simple pendulum — determination of g
                  </td>
                  <td className="py-3.5 text-[#475467]">SS3A Physics</td>
                  <td className="py-3.5 text-[#B54708] font-medium">Wed 18 Nov</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-28 h-2 bg-[#E3E8EF] rounded-full overflow-hidden">
                        <div className="h-full w-4/5 bg-[#2448D8] rounded-full" />
                      </div>
                      <span className="font-mono text-[#475467]">34/42</span>
                    </div>
                  </td>
                  <td className="py-3.5 font-mono font-semibold text-[#0E1726]">15.2 / 20</td>
                  <td className="py-3.5 text-right">
                    <Link
                      to="/teacher/assignments/demo/results"
                      className="font-semibold text-[#2448D8] underline"
                    >
                      Results
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold text-[#0E1726]">
                    Verifying Ohm’s law
                  </td>
                  <td className="py-3.5 text-[#475467]">SS3B Physics</td>
                  <td className="py-3.5 text-[#475467]">Mon 23 Nov</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-28 h-2 bg-[#E3E8EF] rounded-full overflow-hidden">
                        <div className="h-full w-2/5 bg-[#2448D8] rounded-full" />
                      </div>
                      <span className="font-mono text-[#475467]">16/39</span>
                    </div>
                  </td>
                  <td className="py-3.5 font-mono font-semibold text-[#0E1726]">16.4 / 20</td>
                  <td className="py-3.5 text-right">
                    <Link
                      to="/teacher/assignments/demo/results"
                      className="font-semibold text-[#2448D8] underline"
                    >
                      Results
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom 2-Col Grid: Common Mistakes + My Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <section className="lg:col-span-6 bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-3">
            <h2 className="font-display text-base font-bold text-[#0E1726]">
              Most common mistakes this week
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="px-4 py-3 rounded-xl bg-[#FEF5EE] text-[#9A3412] flex items-center justify-between font-medium">
                <span>Timing not started at equilibrium position</span>
                <span className="font-mono font-bold">61%</span>
              </div>
              <div className="px-4 py-3 rounded-xl bg-[#F5F7FA] text-[#0E1726] flex items-center justify-between font-medium">
                <span>Inconsistent decimal places in T²</span>
                <span className="font-mono font-bold">38%</span>
              </div>
              <div className="px-4 py-3 rounded-xl bg-[#F5F7FA] text-[#0E1726] flex items-center justify-between font-medium">
                <span>Small triangle used for slope</span>
                <span className="font-mono font-bold">27%</span>
              </div>
            </div>

            <div className="pt-1">
              <Link
                to="/teacher/assignments/demo/results"
                className="text-xs font-semibold text-[#2448D8] underline"
              >
                See full analysis →
              </Link>
            </div>
          </section>

          <section className="lg:col-span-6 bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-3">
            <h2 className="font-display text-base font-bold text-[#0E1726]">My classes</h2>

            <div className="space-y-2.5">
              {(apiClasses.length > 0
                ? apiClasses.map((c) => ({
                    name: c.name,
                    students: c.studentCount ?? 24,
                    code: c.joinCode,
                  }))
                : [
                    { name: 'SS3A Physics', students: 42, code: 'PHY-SS3-7KQ2' },
                    { name: 'SS3B Physics', students: 39, code: 'PHY-SS3-2MV8' },
                    { name: 'SS2 Science', students: 51, code: 'SCI-SS2-9TR4' },
                  ]
              ).map((cls) => (
                <div
                  key={cls.code}
                  className="rounded-xl border border-[#E3E8EF] p-3.5 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-[#0E1726]">{cls.name}</div>
                    <div className="text-[11px] text-[#6B778C] mt-0.5">
                      {cls.students} students · code{' '}
                      <span className="font-mono">{cls.code}</span>
                    </div>
                  </div>
                  <Link
                    to="/teacher/assignments/demo/results"
                    className="text-xs font-semibold text-[#475467] hover:text-[#2448D8]"
                  >
                    Open
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// G2 — Assign an Experiment (/teacher/assignments/new)
export function AssignExperimentScreen() {
  const navigate = useNavigate();
  const [experiment, setExperiment] = useState('Simple pendulum — determination of g');
  const [instructions, setInstructions] = useState(
    'Use lengths from 40 cm to 90 cm in steps of 10 cm. Show all working for the slope.'
  );
  const [classes, setClasses] = useState({ ss3a: true, ss3b: true, ss2: false });
  const [mode, setMode] = useState<'practice' | 'graded' | 'exam'>('graded');
  const [noiseLevel, setNoiseLevel] = useState(2); // 0=Ideal, 1=Low, 2=Realistic, 3=Harsh
  const [uniqueValues, setUniqueValues] = useState(true);
  const [recordReplay, setRecordReplay] = useState(true);
  const [autoRelease, setAutoRelease] = useState(false);

  const selectedClassCount =
    (classes.ss3a ? 1 : 0) + (classes.ss3b ? 1 : 0) + (classes.ss2 ? 1 : 0);
  const totalStudents =
    (classes.ss3a ? 42 : 0) + (classes.ss3b ? 39 : 0) + (classes.ss2 ? 51 : 0);

  const handlePublishToStudents = async () => {
    if (getStoredAccessToken()) {
      try {
        const myClasses = await vixirApi.listClasses();
        const targetClass = myClasses[0];
        if (targetClass) {
          const now = new Date();
          const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const created = await vixirApi.createAssignment({
            classId: targetClass.id,
            experimentId: 'phy.pendulum.g',
            experimentVersion: 1,
            title: experiment,
            mode: mode.toUpperCase() as PracticalMode,
            opensAt: now.toISOString(),
            dueAt: due.toISOString(),
            noiseLevel: noiseLevel === 0 ? 'NONE' : noiseLevel === 1 ? 'LOW' : 'REALISTIC',
            attemptsAllowed: 2,
            releasePolicy: autoRelease ? 'IMMEDIATE' : 'MANUAL',
          });
          await vixirApi.publishAssignment(created.id).catch(() => {});
        }
      } catch {
        // Fallback to demo results screen when offline
      }
    }
    navigate('/teacher/assignments/demo/results');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726]">
      <header className="bg-white border-b border-[#E3E8EF]">
        <div className="max-w-[1140px] mx-auto px-6 h-14 flex items-center justify-between text-xs">
          <Link to="/teacher" className="font-semibold text-[#2448D8] underline">
            ← Teacher dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/teacher')}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] font-semibold text-[#0E1726] cursor-pointer"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => {
                void handlePublishToStudents();
              }}
              className="px-4 py-2 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white font-semibold cursor-pointer"
            >
              Publish to students
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1140px] mx-auto px-6 py-8">
        <h1 className="font-display text-3xl font-bold text-[#0E1726] mb-6">
          Assign an experiment
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form Sections */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. Experiment */}
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-4">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                1 · Experiment
              </h2>

              <div>
                <label
                  htmlFor="assign-exp"
                  className="block text-xs font-bold text-[#0E1726] mb-1.5"
                >
                  Experiment
                </label>
                <select
                  id="assign-exp"
                  value={experiment}
                  onChange={(e) => setExperiment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D0D7E2] text-xs font-medium text-[#0E1726]"
                >
                  <option>Simple pendulum — determination of g</option>
                  <option>Acid–base titration: HCl vs NaOH</option>
                  <option>Verifying Ohm’s law</option>
                  <option>Deflection of a simply supported beam</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="assign-instr"
                  className="block text-xs font-bold text-[#0E1726] mb-1.5"
                >
                  Instructions to students (optional)
                </label>
                <textarea
                  id="assign-instr"
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D0D7E2] text-xs text-[#0E1726]"
                />
              </div>
            </section>

            {/* 2. Who and when */}
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-4">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                2 · Who and when
              </h2>

              <div>
                <div className="text-xs font-bold text-[#0E1726] mb-2">Classes</div>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { key: 'ss3a' as const, label: 'SS3A (42)' },
                    { key: 'ss3b' as const, label: 'SS3B (39)' },
                    { key: 'ss2' as const, label: 'SS2 Science (51)' },
                  ].map((c) => {
                    const checked = classes[c.key];
                    return (
                      <label
                        key={c.key}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                          checked
                            ? 'bg-[#EAEFFE] border-2 border-[#2448D8] text-[#0E1726]'
                            : 'bg-white border border-[#D0D7E2] text-[#0E1726]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setClasses((p) => ({ ...p, [c.key]: e.target.checked }))
                          }
                          className="rounded border-[#D0D7E2] text-[#2448D8]"
                        />
                        <span>{c.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0E1726] mb-1.5">
                    Opens
                  </label>
                  <input
                    type="text"
                    defaultValue="Mon 16 Nov, 08:00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D0D7E2] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0E1726] mb-1.5">
                    Due
                  </label>
                  <input
                    type="text"
                    defaultValue="Wed 18 Nov, 23:59"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D0D7E2] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0E1726] mb-1.5">
                    Attempts
                  </label>
                  <select className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D0D7E2] text-xs">
                    <option>2 (best counts)</option>
                    <option>1 (single attempt)</option>
                    <option>Unlimited</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 3. Lab conditions */}
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-4">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                3 · Lab conditions
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'practice' as const, title: 'Practice', sub: 'Not marked, assistant on' },
                  { id: 'graded' as const, title: 'Graded', sub: 'Marked, hints limited' },
                  { id: 'exam' as const, title: 'Exam', sub: 'Timed, assistant off' },
                ].map((m) => {
                  const active = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`text-left rounded-xl p-3.5 transition-all cursor-pointer ${
                        active
                          ? 'bg-[#EAEFFE] border-2 border-[#2448D8]'
                          : 'bg-white border border-[#D0D7E2]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#0E1726]">{m.title}</div>
                      <div className="text-[11px] text-[#475467] mt-0.5">{m.sub}</div>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E1726] mb-2">
                  Instrument noise level
                </label>
                <input
                  type="range"
                  aria-label="Instrument noise level"
                  min={0}
                  max={3}
                  step={1}
                  value={noiseLevel}
                  onChange={(e) => setNoiseLevel(Number(e.target.value))}
                  className="w-full accent-[#2448D8] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#6B778C] mt-1">
                  <span>Ideal</span>
                  <span>Low</span>
                  <span>Realistic</span>
                  <span>Harsh</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#0E1726] pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uniqueValues}
                    onChange={(e) => setUniqueValues(e.target.checked)}
                    className="rounded border-[#D0D7E2] text-[#2448D8]"
                  />
                  <span>Give each student a unique bob mass and pivot zero-error</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordReplay}
                    onChange={(e) => setRecordReplay(e.target.checked)}
                    className="rounded border-[#D0D7E2] text-[#2448D8]"
                  />
                  <span>Record a bench replay for review</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRelease}
                    onChange={(e) => setAutoRelease(e.target.checked)}
                    className="rounded border-[#D0D7E2] text-[#2448D8]"
                  />
                  <span>Release marks to students automatically</span>
                </label>
              </div>
            </section>
          </div>

          {/* Right Summary Card */}
          <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-[#0E1726]">Summary</h2>

            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-[#475467]">Students</dt>
                <dd className="font-bold text-[#0E1726]">
                  {totalStudents} in {selectedClassCount} classes
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#475467]">Window</dt>
                <dd className="font-bold text-[#0E1726]">2 days 16 h</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#475467]">Mode</dt>
                <dd className="font-bold text-[#0E1726] capitalize">{mode}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#475467]">Lab assistant</dt>
                <dd className="font-bold text-[#0E1726]">
                  {mode === 'exam' ? 'Off' : 'Questions only'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#475467]">Marks</dt>
                <dd className="font-bold text-[#0E1726]">20 (default rubric)</dd>
              </div>
            </dl>

            <div>
              <Link
                to="/teacher/builder"
                className="text-xs font-semibold text-[#2448D8] underline"
              >
                Edit rubric in builder
              </Link>
            </div>

            <div className="bg-[#F5F7FA] rounded-xl p-3.5 text-[11px] text-[#475467] leading-relaxed">
              Students without internet can download the assignment and submit when they
              reconnect, before the due time.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// G3 — Class Results & Analytics (/teacher/assignments/:id/results)
export function ClassResultsScreen() {
  const [tab, setTab] = useState<'all' | 'review' | 'unsubmitted'>('all');

  const students = [
    {
      name: 'Adaeze Okafor',
      status: 'Submitted',
      g: '9.82',
      score: '18 / 20',
      flag: '2 d.p. in row 3',
      needsReview: false,
    },
    {
      name: 'Chinedu Eze',
      status: 'Needs review',
      g: '9.12',
      score: '13 / 20',
      flag: '19 osc timed as 20',
      needsReview: true,
    },
    {
      name: 'Zainab Musa',
      status: 'Submitted',
      g: '9.78',
      score: '19 / 20',
      flag: '—',
      needsReview: false,
    },
    {
      name: 'Tunde Bakare',
      status: 'Needs review',
      g: '10.42',
      score: '11 / 20',
      flag: 'Parallax offset +0.4 cm',
      needsReview: true,
    },
  ];

  const visibleStudents =
    tab === 'all'
      ? students
      : tab === 'review'
        ? students.filter((s) => s.needsReview)
        : [];

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726]">
      <header className="bg-white border-b border-[#E3E8EF]">
        <div className="max-w-[1240px] mx-auto px-6 h-14 flex flex-wrap items-center justify-between gap-4 text-xs">
          <Link to="/teacher" className="font-semibold text-[#2448D8] underline">
            ← Teacher dashboard
          </Link>

          <div className="flex items-center gap-2.5">
            <span className="text-[#475467]">Class</span>
            <select className="bg-white border border-[#D0D7E2] rounded-xl px-3 py-1.5 font-medium">
              <option>SS3A Physics</option>
              <option>SS3B Physics</option>
            </select>
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] font-semibold text-[#0E1726] cursor-pointer"
            >
              Export CSV
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white font-semibold cursor-pointer"
            >
              Release marks
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1240px] mx-auto px-6 py-8 space-y-6">
        <div>
          <div className="text-xs text-[#475467] mb-0.5">SS3A Physics · due Wed 18 Nov</div>
          <h1 className="font-display text-3xl font-bold text-[#0E1726]">
            Simple pendulum — class results
          </h1>
        </div>

        {/* 3 Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Score distribution */}
          <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
            <h2 className="font-display text-sm font-bold text-[#0E1726] mb-5">
              Score distribution <span className="font-normal text-[#6B778C]">· 34 submitted</span>
            </h2>

            <div className="grid grid-cols-5 gap-2.5 items-end h-36 pt-6">
              {[
                { range: '0–7', count: 2, h: 16 },
                { range: '8–11', count: 4, h: 32 },
                { range: '12–15', count: 11, h: 86 },
                { range: '16–18', count: 13, h: 100 },
                { range: '19–20', count: 4, h: 32 },
              ].map((bar) => (
                <div key={bar.range} className="flex flex-col items-center">
                  <span className="font-mono text-[11px] text-[#0E1726] mb-1">
                    {bar.count}
                  </span>
                  <div
                    className="w-full bg-[#1D4ED8] rounded-md"
                    style={{ height: `${bar.h}px` }}
                  />
                  <span className="font-mono text-[10px] text-[#6B778C] mt-2">
                    {bar.range}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Values of g found */}
          <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
            <h2 className="font-display text-sm font-bold text-[#0E1726] mb-3">
              Values of g found
            </h2>
            <svg viewBox="0 0 300 130" className="w-full h-auto">
              {/* Shaded tolerance band around 9.81 */}
              <rect x="122" y="25" width="56" height="62" fill="#E6F6EE" />
              <line
                x1="150"
                y1="22"
                x2="150"
                y2="87"
                stroke="#0F7B45"
                strokeWidth="1.2"
                strokeDasharray="3 2"
              />
              <text
                x="150"
                y="17"
                textAnchor="middle"
                fill="#0F7B45"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                9.81
              </text>

              {/* Axis */}
              <line x1="20" y1="87" x2="280" y2="87" stroke="#93A0B8" strokeWidth="1" />
              {[
                { x: 25, label: '9.0' },
                { x: 87, label: '9.4' },
                { x: 150, label: '9.8' },
                { x: 212, label: '10.2' },
                { x: 274, label: '10.6' },
              ].map((t) => (
                <text
                  key={t.label}
                  x={t.x}
                  y="102"
                  textAnchor="middle"
                  fill="#6B778C"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {t.label}
                </text>
              ))}
              <text
                x="150"
                y="120"
                textAnchor="middle"
                fill="#475467"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                g / m s⁻²
              </text>

              {/* Outlier dots */}
              <circle cx="58" cy="76" r="4" fill="#B54708" />
              <circle cx="244" cy="76" r="4" fill="#B54708" />

              {/* Clustered valid dots */}
              {[
                [126, 65],
                [134, 75],
                [138, 52],
                [142, 68],
                [146, 42],
                [149, 77],
                [152, 60],
                [155, 48],
                [158, 72],
                [162, 56],
                [166, 78],
                [172, 66],
              ].map(([cx, cy], idx) => (
                <circle key={idx} cx={cx} cy={cy} r="3.5" fill="#4F6BED" />
              ))}
            </svg>
            <p className="text-[11px] text-[#475467] mt-1">
              Shaded band = within 2% of 9.81. Orange points are flagged for review.
            </p>
          </section>

          {/* Average by criterion */}
          <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-3">
            <h2 className="font-display text-sm font-bold text-[#0E1726]">
              Average by criterion
            </h2>
            {[
              { label: 'Readings', pct: 88, color: 'bg-[#2448D8]' },
              { label: 'Table & s.f.', pct: 71, color: 'bg-[#2448D8]' },
              { label: 'Graph', pct: 76, color: 'bg-[#2448D8]' },
              { label: 'Slope & g', pct: 69, color: 'bg-[#2448D8]' },
              { label: 'Precautions', pct: 39, color: 'bg-[#B54708]' },
            ].map((c) => (
              <div key={c.label} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#0E1726]">{c.label}</span>
                  <span className="font-mono text-[#0E1726]">{c.pct}%</span>
                </div>
                <div className="h-2 bg-[#E3E8EF] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.color}`}
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Students Table */}
        <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="font-display text-base font-bold text-[#0E1726]">Students</h2>

            <div className="bg-[#EDF1F7] p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'review' as const, label: 'Needs review' },
                { id: 'unsubmitted' as const, label: 'Not submitted' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    tab === t.id
                      ? 'bg-white text-[#0E1726] shadow-xs'
                      : 'text-[#475467] hover:text-[#0E1726]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E3E8EF] text-[11px] font-bold uppercase text-[#6B778C]">
                  <th className="py-2.5 text-left">STUDENT</th>
                  <th className="py-2.5 text-left">STATUS</th>
                  <th className="py-2.5 text-left">G / M S⁻²</th>
                  <th className="py-2.5 text-left">SCORE</th>
                  <th className="py-2.5 text-left">FLAG</th>
                  <th className="py-2.5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8EF]">
                {visibleStudents.map((st) => (
                  <tr key={st.name}>
                    <td className="py-3.5 font-semibold text-[#0E1726]">{st.name}</td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          st.needsReview
                            ? 'bg-[#FEF0E6] text-[#B54708]'
                            : 'bg-[#E6F6EE] text-[#0F7B45]'
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono">{st.g}</td>
                    <td className="py-3.5 font-mono font-bold">{st.score}</td>
                    <td className="py-3.5 text-[#475467]">{st.flag}</td>
                    <td className="py-3.5 text-right space-x-3">
                      <Link
                        to="/attempt/demo/replay"
                        className="font-semibold text-[#2448D8] underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

// G4 — Experiment Builder (/teacher/builder)
export function ExperimentBuilderScreen() {
  const navigate = useNavigate();
  const [section, setSection] = useState('Variables');
  const [swRes, setSwRes] = useState('0.01 s');
  const [swSigma, setSwSigma] = useState('0.09 s');
  const [ruleRes, setRuleRes] = useState('0.1 cm');
  const [ruleParallax, setRuleParallax] = useState('±0.3 cm');

  const jsonPreview = `{
  "id": "phy.pendulum.g",
  "title": "Simple pendulum - g",
  "subject": "physics",
  "curricula": ["waec", "neco"],
  "model": "builtin:pendulum@1",
  "variables": {
    "L": { "role": "independent",
           "range": [0.3, 1.0], "unit": "m" },
    "theta": { "role": "controlled",
               "default": 8, "unit": "deg" },
    "m": { "role": "random",
           "range": [0.04, 0.06] }
  },
  "instruments": {
    "stopwatch": { "res": 0.01,
                   "reactionSigma": 0.09 },
    "metreRule": { "res": 0.001,
                   "parallax": 0.003 }
  },
  "analysis": {
    "plot": ["L", "T^2"],
    "derive": "g = 4*pi^2 / slope",
    "tolerance": 0.03
  },
  "rubric": "rubrics/waec-mechanics"
}`;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E3E8EF] px-6 h-14 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Link to="/teacher" className="font-semibold text-[#2448D8] underline">
            ← Back
          </Link>
          <h1 className="font-display text-base font-bold text-[#0E1726]">
            Experiment builder
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-[#FEF0E6] text-[#B54708] font-mono text-[11px] font-bold">
            DRAFT · v3
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/lab/physics/pendulum')}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] font-semibold text-[#0E1726] cursor-pointer"
          >
            Test in lab
          </button>
          <button
            type="button"
            onClick={() => navigate('/library')}
            className="px-4 py-2 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white font-semibold cursor-pointer"
          >
            Publish to library
          </button>
        </div>
      </header>

      {/* 3-Column Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[200px_1fr_340px] min-h-0">
        {/* Left Builder Nav */}
        <aside className="bg-white border-r border-[#E3E8EF] p-4 space-y-1">
          {[
            'Details',
            'Apparatus',
            'Variables',
            'Instruments & noise',
            'Physics model',
            'Rubric',
            'Preview',
          ].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSection(item)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                section === item
                  ? 'bg-[#EAEFFE] text-[#2448D8]'
                  : 'text-[#475467] hover:bg-[#F5F7FA] hover:text-[#0E1726]'
              }`}
            >
              {item}
            </button>
          ))}
        </aside>

        {/* Center Editor */}
        <main className="p-6 space-y-5 overflow-y-auto">
          {/* Variables Table */}
          <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
            <h2 className="font-display text-base font-bold text-[#0E1726] mb-4">
              Variables
            </h2>
            <table className="w-full text-xs mb-4">
              <thead>
                <tr className="border-b border-[#E3E8EF] text-[11px] font-bold uppercase text-[#6B778C]">
                  <th className="py-2 text-left">SYMBOL</th>
                  <th className="py-2 text-left">NAME</th>
                  <th className="py-2 text-left">ROLE</th>
                  <th className="py-2 text-left">RANGE</th>
                  <th className="py-2 text-left">UNIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8EF]">
                <tr>
                  <td className="py-3 font-mono font-semibold">L</td>
                  <td className="py-3">Effective length</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-[#EAEFFE] text-[#1D4ED8] font-mono text-[11px]">
                      independent
                    </span>
                  </td>
                  <td className="py-3 font-mono">0.30 – 1.00</td>
                  <td className="py-3 font-mono">m</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono font-semibold">t</td>
                  <td className="py-3">Time for 20 oscillations</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-[#FEF0E6] text-[#B45309] font-mono text-[11px]">
                      measured
                    </span>
                  </td>
                  <td className="py-3 font-mono">computed</td>
                  <td className="py-3 font-mono">s</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono font-semibold">θ</td>
                  <td className="py-3">Angle of release</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-[#EDF1F7] text-[#475467] font-mono text-[11px]">
                      controlled
                    </span>
                  </td>
                  <td className="py-3 font-mono">2 – 15</td>
                  <td className="py-3 font-mono">°</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono font-semibold">m</td>
                  <td className="py-3">Bob mass</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-[#EDF1F7] text-[#475467] font-mono text-[11px]">
                      per-student random
                    </span>
                  </td>
                  <td className="py-3 font-mono">0.040 – 0.060</td>
                  <td className="py-3 font-mono">kg</td>
                </tr>
              </tbody>
            </table>

            <button
              type="button"
              className="px-3.5 py-2 rounded-xl border border-dashed border-[#D0D7E2] text-xs font-semibold text-[#0E1726] hover:bg-[#F5F7FA] cursor-pointer"
            >
              + Add variable
            </button>
          </section>

          {/* Instruments & noise */}
          <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
            <h2 className="font-display text-base font-bold text-[#0E1726] mb-4">
              Instruments &amp; noise
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E3E8EF] p-4 space-y-3">
                <h3 className="font-display text-sm font-bold text-[#0E1726]">
                  Stopwatch
                </h3>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475467]">Resolution</span>
                  <input
                    type="text"
                    aria-label="Stopwatch resolution"
                    value={swRes}
                    onChange={(e) => setSwRes(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-[#D0D7E2] font-mono text-xs"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475467]">Reaction time σ</span>
                  <input
                    type="text"
                    aria-label="Stopwatch reaction sigma"
                    value={swSigma}
                    onChange={(e) => setSwSigma(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-[#D0D7E2] font-mono text-xs"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E3E8EF] p-4 space-y-3">
                <h3 className="font-display text-sm font-bold text-[#0E1726]">
                  Metre rule
                </h3>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475467]">Resolution</span>
                  <input
                    type="text"
                    aria-label="Metre rule resolution"
                    value={ruleRes}
                    onChange={(e) => setRuleRes(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-[#D0D7E2] font-mono text-xs"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475467]">Parallax (if eye off-level)</span>
                  <input
                    type="text"
                    aria-label="Metre rule parallax"
                    value={ruleParallax}
                    onChange={(e) => setRuleParallax(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-[#D0D7E2] font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Physics model */}
          <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-3">
            <h2 className="font-display text-base font-bold text-[#0E1726]">
              Physics model
            </h2>
            <div className="bg-[#0B1220] text-[#E6EBF5] rounded-xl p-4 font-mono text-xs space-y-1.5">
              <div className="text-[#93A0B8]">
                // true value (large-angle correction included)
              </div>
              <div>T = 2π·√(L/g)·(1 + θ²/16)</div>
              <div>t_measured = 20·T + noise.stopwatch()</div>
            </div>
            <p className="text-xs text-[#6B778C]">
              Choose from built-in models (pendulum, Ohm’s law, Snell’s law, titration, beam
              deflection) or write a custom TypeScript model.
            </p>
          </section>
        </main>

        {/* Right Live JSON Preview */}
        <aside className="bg-[#0B1220] text-[#E6EBF5] p-5 font-mono text-xs overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E2A42]">
            <span className="font-bold text-white">pendulum.experiment.json</span>
            <span className="text-[#4ADE80]">valid ✓</span>
          </div>
          <pre className="text-[11px] leading-relaxed text-[#C9D3E6] whitespace-pre-wrap">
            {jsonPreview}
          </pre>
        </aside>
      </div>
    </div>
  );
}

// H1 — Institution Admin Console (/admin)
export function InstitutionAdminScreen() {
  const [search, setSearch] = useState('');

  const people = [
    { name: 'Mr. Kunle Bello', role: 'Teacher', dept: 'Physics', active: 'Today' },
    { name: 'Mrs. Bisi Adeyemi', role: 'Teacher', dept: 'Chemistry', active: 'Yesterday' },
    { name: 'Adaeze Okafor', role: 'Student', dept: 'SS3A', active: 'Today' },
    { name: 'Chinedu Eze', role: 'Student', dept: 'SS3A', active: '3 days ago' },
  ].filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.dept.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] flex flex-col md:flex-row">
      {/* Left Dark Admin Sidebar */}
      <aside className="w-full md:w-[220px] bg-[#0B1220] text-[#E6EBF5] p-4 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 px-2 mb-6">
          <img src="/illustrations/logo.svg" alt="" className="w-7 h-7 rounded-[7px]" />
          <span className="font-display font-bold text-lg text-white">Vixir</span>
          <span className="text-xs text-[#93A0B8]">Admin</span>
        </Link>

        <nav aria-label="Admin navigation" className="space-y-1">
          {[
            { label: 'Overview', active: true },
            { label: 'People', active: false },
            { label: 'Departments & classes', active: false },
            { label: 'Licences & billing', active: false },
            { label: 'Reports', active: false },
            { label: 'Integrations', active: false },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                item.active
                  ? 'bg-[#1C2A47] text-white'
                  : 'text-[#C9D3E6] hover:bg-[#121A2B] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 max-w-[1160px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#475467] mb-0.5">
              School plan · renews 10 Jan 2027
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0E1726]">
              Kings College, Lagos
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] text-xs font-semibold text-[#0E1726] cursor-pointer"
            >
              Download accreditation report
            </button>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold cursor-pointer"
            >
              Import users (CSV)
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E3E8EF] p-5">
            <div className="text-xs text-[#475467] mb-1">Student seats used</div>
            <div className="font-display text-3xl font-bold text-[#0E1726] mb-2">
              612 <span className="text-base font-normal text-[#6B778C]">/ 700</span>
            </div>
            <div className="h-1.5 bg-[#E3E8EF] rounded-full overflow-hidden">
              <div className="h-full w-[87%] bg-[#2448D8] rounded-full" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E3E8EF] p-5">
            <div className="text-xs text-[#475467] mb-1">Teachers</div>
            <div className="font-display text-3xl font-bold text-[#0E1726] mb-1">18</div>
            <div className="text-xs text-[#6B778C]">across 4 departments</div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E3E8EF] p-5">
            <div className="text-xs text-[#475467] mb-1">
              Practicals completed this term
            </div>
            <div className="font-display text-3xl font-bold text-[#0E1726] mb-1">
              2,318
            </div>
            <div className="text-xs text-[#6B778C]">3.8 per student</div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E3E8EF] p-5">
            <div className="text-xs text-[#475467] mb-1">Local lab server</div>
            <div className="font-display text-2xl font-bold text-[#0F7B45] mb-1">
              Online
            </div>
            <div className="text-xs text-[#6B778C]">last sync 14 min ago</div>
          </div>
        </div>

        {/* Bottom 2-Col Grid: People + Usage/Integrations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* People Table */}
          <section className="lg:col-span-8 bg-white rounded-2xl border border-[#E3E8EF] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-base font-bold text-[#0E1726]">People</h2>
              <input
                type="search"
                aria-label="Search people"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full sm:w-56 px-3.5 py-2 rounded-xl bg-white border border-[#D0D7E2] text-xs"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E3E8EF] text-[11px] font-bold uppercase text-[#6B778C]">
                    <th className="py-2.5 text-left">NAME</th>
                    <th className="py-2.5 text-left">ROLE</th>
                    <th className="py-2.5 text-left">DEPARTMENT / CLASS</th>
                    <th className="py-2.5 text-left">LAST ACTIVE</th>
                    <th className="py-2.5 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8EF]">
                  {people.map((p) => (
                    <tr key={p.name}>
                      <td className="py-3.5 font-semibold text-[#0E1726]">{p.name}</td>
                      <td className="py-3.5 text-[#475467]">{p.role}</td>
                      <td className="py-3.5 text-[#475467]">{p.dept}</td>
                      <td className="py-3.5 text-[#475467]">{p.active}</td>
                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          className="font-semibold text-[#2448D8] underline cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right Column: Usage by subject + Integrations */}
          <div className="lg:col-span-4 space-y-5">
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                Usage by subject
              </h2>
              {[
                { name: 'Physics', count: '1,104', pct: 92 },
                { name: 'Chemistry', count: '782', pct: 68 },
                { name: 'Electronics', count: '301', pct: 28 },
                { name: 'Engineering', count: '131', pct: 14 },
              ].map((s) => (
                <div key={s.name} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#0E1726]">{s.name}</span>
                    <span className="font-mono text-[#0E1726]">{s.count}</span>
                  </div>
                  <div className="h-2 bg-[#E3E8EF] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2448D8] rounded-full"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </section>

            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                Integrations
              </h2>
              <ul className="divide-y divide-[#E3E8EF] text-xs">
                <li className="py-2.5 flex items-center justify-between">
                  <span>Google Workspace sign-in</span>
                  <span className="text-[#0F7B45] font-semibold">Connected</span>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span>Moodle (LTI 1.3)</span>
                  <button
                    type="button"
                    className="text-[#2448D8] font-semibold underline cursor-pointer"
                  >
                    Connect
                  </button>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span>School management system (CSV sync)</span>
                  <button
                    type="button"
                    className="text-[#2448D8] font-semibold underline cursor-pointer"
                  >
                    Set up
                  </button>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
