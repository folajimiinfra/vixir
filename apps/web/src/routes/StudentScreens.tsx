import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  APPARATUS_CATALOG,
  type EncyclopediaItem,
} from './apparatusCatalog';
import { useAuth } from '../context/AuthContext';
import {
  getStoredAccessToken,
  getStoredAttempt,
  vixirApi,
  type AssignmentSummary,
  type ClassSummary,
  type MarkReportResponse,
} from '../lib/api';
import { useLabSessionStore, computeAutoMark } from '../store/labSessionStore';

type StudentNavKey =
  | 'dashboard'
  | 'labs'
  | 'experiments'
  | 'encyclopedia'
  | 'notebook'
  | 'assignments'
  | 'grades'
  | 'settings';

function StudentSidebar({
  active,
  syncStatus = 'synced',
  onRetrySync,
}: {
  active: StudentNavKey;
  syncStatus?: 'loading' | 'synced' | 'error';
  onRetrySync?: () => void;
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const navItems: { id: StudentNavKey; label: string; to: string }[] = [
    { id: 'dashboard', label: 'Dashboard', to: '/app' },
    { id: 'labs', label: 'Laboratories (5 labs)', to: '/labs' },
    { id: 'experiments', label: 'Experiments', to: '/library' },
    { id: 'encyclopedia', label: 'Encyclopedia', to: '/apparatus' },
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

      <div className="mt-6 md:mt-0 space-y-2.5">
        {user && (
          <div className="px-3 py-2.5 rounded-xl bg-[#F5F7FA] border border-[#E3E8EF] text-xs">
            <div className="font-bold text-[#0E1726] truncate">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-[11px] text-[#6B778C] truncate">{user.email}</div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/auth');
              }}
              className="mt-2 text-[11px] font-semibold text-[#C4321C] hover:underline cursor-pointer"
            >
              Sign out
            </button>
          </div>
        )}
        {syncStatus === 'loading' ? (
          <div className="px-3 py-2.5 rounded-xl bg-[#EAEFFE] text-[#1D4ED8] text-[11px] font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2448D8] animate-ping shrink-0" />
            <span>Syncing with Vixir API...</span>
          </div>
        ) : syncStatus === 'error' ? (
          <div className="px-3 py-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#C4321C] text-[11px] font-medium flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C4321C] shrink-0" />
              <span>API offline</span>
            </div>
            {onRetrySync && (
              <button
                type="button"
                onClick={onRetrySync}
                className="font-bold underline cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <div className="px-3 py-2.5 rounded-xl bg-[#E6F6EE] text-[#0F7B45] text-[11px] font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0F7B45] shrink-0" />
            <span>Connected to Vixir API</span>
          </div>
        )}
      </div>
    </aside>
  );
}

const EXPERIMENT_META_BY_ID: Record<
  string,
  { title: string; subject: string; badgeClass: string; route: string }
> = {
  'phy.pendulum.g': {
    title: 'Simple pendulum — determination of g',
    subject: 'PHYSICS',
    badgeClass: 'bg-[#EAEFFE] text-[#1D4ED8]',
    route: '/lab/physics/pendulum',
  },
  'chem.titration': {
    title: 'Acid–base titration: HCl vs Na₂CO₃',
    subject: 'CHEMISTRY',
    badgeClass: 'bg-[#FEF0E6] text-[#B45309]',
    route: '/lab/chemistry/titration/safety',
  },
  'elec.ohms-law': {
    title: 'Verifying Ohm’s law',
    subject: 'ELECTRONICS',
    badgeClass: 'bg-[#E0F8F5] text-[#0F766E]',
    route: '/lab/electronics/ohms-law',
  },
};

// B1 — Student Dashboard (with explicit Loading, Error/Offline, Empty, and Success states)
export function StudentDashboardScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { user, refreshProfile } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getStoredAccessToken()));
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [apiAssignments, setApiAssignments] = useState<AssignmentSummary[]>([]);
  const [apiClasses, setApiClasses] = useState<ClassSummary[]>([]);
  const [latestReport, setLatestReport] = useState<MarkReportResponse | null>(null);

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [startingAssignmentId, setStartingAssignmentId] = useState<string | null>(null);

  const submittedAt = useLabSessionStore((s) => s.submittedAt);
  const rows = useLabSessionStore((s) => s.pendulumRows);
  const precautions = useLabSessionStore((s) => s.precautions);
  const gValue = useLabSessionStore((s) => s.gValue);

  const loadDashboardData = async () => {
    if (!getStoredAccessToken()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    try {
      await refreshProfile();
      const [assignmentsList, classesList] = await Promise.all([
        vixirApi.listMyAssignments(),
        vixirApi.listClasses(),
      ]);
      setApiAssignments(assignmentsList);
      setApiClasses(classesList);

      const activeAttempt = getStoredAttempt();
      if (activeAttempt?.attemptId) {
        const rep = await vixirApi.getMarkReport(activeAttempt.attemptId).catch(() => null);
        if (rep) setLatestReport(rep);
      }
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setFetchError(
        (err as Error).message ||
          'Could not load your classes and assignments from Vixir API (:8081). Check your network connection.'
      );
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const handleJoinClassCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim();
    if (!code) return;
    setIsJoiningClass(true);
    setJoinFeedback(null);
    try {
      const cls = await vixirApi.joinClass(code);
      setJoinFeedback({
        tone: 'success',
        text: `Joined ${cls.name} (${cls.joinCode})! Loading your class assignments...`,
      });
      setJoinCodeInput('');
      await loadDashboardData();
    } catch (err) {
      setJoinFeedback({
        tone: 'error',
        text: (err as Error).message || `Could not join class with code "${code}".`,
      });
    } finally {
      setIsJoiningClass(false);
    }
  };

  const handleStartAssignedPractical = async (assignment: AssignmentSummary) => {
    setStartingAssignmentId(assignment.id);
    const meta = EXPERIMENT_META_BY_ID[assignment.experimentId] ?? {
      title: assignment.title || assignment.experimentId,
      subject: 'PHYSICS',
      badgeClass: 'bg-[#EAEFFE] text-[#1D4ED8]',
      route: '/lab/physics/pendulum',
    };
    try {
      const bootstrap = await vixirApi.startAttempt({ assignmentId: assignment.id });
      useLabSessionStore.setState({
        attemptId: bootstrap.attemptId,
        seed: bootstrap.seed,
      });
    } catch {
      // Proceed to lab bench even if attempt already active
    } finally {
      setStartingAssignmentId(null);
      navigate(meta.route);
    }
  };

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : 'Student';
  const initials = user
    ? `${user.firstName?.[0] || 'S'}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'ST';
  const classSubtitle =
    apiClasses.length > 0
      ? apiClasses.map((c) => `${c.name} (${c.joinCode})`).join(' · ')
      : user?.email || 'Not enrolled in a class yet';

  const q = search.trim().toLowerCase();
  const filteredAssignments = apiAssignments.filter((a) => {
    if (!q) return true;
    const meta = EXPERIMENT_META_BY_ID[a.experimentId];
    const title = (a.title || meta?.title || a.experimentId).toLowerCase();
    return title.includes(q) || a.experimentId.toLowerCase().includes(q);
  });

  // Check if the student has any real submitted attempt in this session or from the API
  const hasSubmittedAttempt = Boolean(submittedAt || latestReport);
  const localAutoMark = computeAutoMark(rows, precautions, gValue);

  const syncStatus: 'loading' | 'synced' | 'error' = isLoading
    ? 'loading'
    : fetchError
      ? 'error'
      : 'synced';

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] flex flex-col md:flex-row">
      <StudentSidebar
        active="dashboard"
        syncStatus={syncStatus}
        onRetrySync={() => {
          void loadDashboardData();
        }}
      />

      <main className="flex-1 p-6 sm:p-8 max-w-[1160px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <div className="text-xs text-[#475467] mb-0.5">{classSubtitle}</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0E1726]">
              Good evening, {displayName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleJoinClassCode} className="flex items-center gap-1.5">
              <input
                type="text"
                aria-label="Join class with code"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Join class code (e.g. PHY-SS3-DEMO)"
                className="w-52 px-3 py-2 rounded-xl bg-white border border-[#D0D7E2] text-xs font-mono text-[#0E1726] placeholder:text-[#6B778C]"
              />
              <button
                type="submit"
                disabled={isJoiningClass || !joinCodeInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
              >
                {isJoiningClass ? 'Joining...' : 'Join class'}
              </button>
            </form>
            <input
              type="search"
              aria-label="Search experiments"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments..."
              className="w-52 sm:w-60 px-3.5 py-2 rounded-xl bg-white border border-[#D0D7E2] text-xs text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8]"
            />
            <div className="w-9 h-9 rounded-full bg-[#FDECE3] text-[#9A3412] text-xs font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
          </div>
        </div>

        {/* Join Class Feedback Banner */}
        {joinFeedback && (
          <div
            role="status"
            className={`mb-5 px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              joinFeedback.tone === 'success'
                ? 'bg-[#E6F6EE] border-[#A7F3D0] text-[#0F7B45]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#C4321C]'
            }`}
          >
            <span>{joinFeedback.text}</span>
            <button
              type="button"
              onClick={() => setJoinFeedback(null)}
              className="text-xs underline ml-3 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Network / API Error State Banner */}
        {fetchError && (
          <div
            role="alert"
            className="mb-6 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="font-display text-sm font-bold text-[#991B1B] mb-0.5">
                Could not sync with Vixir API
              </div>
              <p className="text-xs text-[#C4321C]">{fetchError}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                void loadDashboardData();
              }}
              className="px-4 py-2 rounded-xl bg-[#C4321C] hover:bg-[#991B1B] text-white text-xs font-semibold shrink-0 cursor-pointer"
            >
              Retry connection
            </button>
          </div>
        )}

        {/* Section 1: Assigned Practicals (Due this week) — 4 Explicit States: Loading, Error, Empty, Success */}
        <section className="mb-7">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-display text-base font-bold text-[#0E1726]">
              Due this week
            </h2>
            {!isLoading && (
              <span className="text-xs text-[#6B778C]">
                {apiClasses.length} enrolled class{apiClasses.length === 1 ? '' : 'es'} ·{' '}
                {apiAssignments.length} active assignment{apiAssignments.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {isLoading ? (
            /* 1. LOADING STATE */
            <div
              aria-label="Loading assignments"
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-[#E3E8EF] p-5 space-y-3 animate-pulse"
                >
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-[#E3E8EF] rounded-full" />
                    <div className="h-4 w-24 bg-[#E3E8EF] rounded" />
                  </div>
                  <div className="h-5 w-3/4 bg-[#E3E8EF] rounded" />
                  <div className="h-3 w-1/2 bg-[#E3E8EF] rounded" />
                  <div className="h-2 w-full bg-[#E3E8EF] rounded-full" />
                  <div className="flex justify-between pt-2">
                    <div className="h-4 w-24 bg-[#E3E8EF] rounded" />
                    <div className="h-8 w-24 bg-[#E3E8EF] rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            /* 2. EMPTY STATE (No fake hardcoded assignments for newly registered students!) */
            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-7 text-center max-w-2xl mx-auto my-2 space-y-3">
              <div className="font-display text-lg font-bold text-[#0E1726]">
                {apiClasses.length === 0
                  ? 'You have not joined a class yet'
                  : 'No assignments due this week'}
              </div>
              <p className="text-xs text-[#475467] leading-relaxed max-w-lg mx-auto">
                {apiClasses.length === 0
                  ? 'Enter the class join code your teacher shared with you (for example PHY-SS3-DEMO for the demo SS3A Physics class) to load your assigned practicals, or explore the 5 virtual laboratories in open practice mode.'
                  : 'Your teacher has not published any active assignments for your enrolled class yet. You can run open practice experiments in the Laboratories hub while you wait.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {apiClasses.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setJoinCodeInput('PHY-SS3-DEMO');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#EAEFFE] hover:bg-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold cursor-pointer"
                  >
                    Fill demo code (PHY-SS3-DEMO)
                  </button>
                )}
                <Link
                  to="/labs"
                  className="px-4 py-2.5 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold transition-colors"
                >
                  Explore 5 Virtual Laboratories →
                </Link>
              </div>
            </div>
          ) : (
            /* 3. SUCCESS STATE (Real assignments fetched from PostgreSQL on :8081) */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {filteredAssignments.map((asgn) => {
                const meta = EXPERIMENT_META_BY_ID[asgn.experimentId] ?? {
                  title: asgn.title || asgn.experimentId,
                  subject: 'PHYSICS',
                  badgeClass: 'bg-[#EAEFFE] text-[#1D4ED8]',
                  route: '/lab/physics/pendulum',
                };
                const dueDateStr = asgn.dueAt
                  ? new Date(asgn.dueAt).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Upcoming';

                return (
                  <div
                    key={asgn.id}
                    className="bg-white rounded-2xl border border-[#E3E8EF] p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold mb-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full uppercase ${meta.badgeClass}`}
                        >
                          {meta.subject} · {asgn.mode}
                        </span>
                        <span className="text-[#B54708]">Due {dueDateStr}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-[#0E1726] mb-1">
                        {asgn.title || meta.title}
                      </h3>
                      <p className="text-xs text-[#475467] mb-4">
                        {asgn.attemptsAllowed} attempts allowed · {asgn.noiseLevel.toLowerCase()} noise
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#F1F4F9]">
                      <span className="text-xs text-[#475467] font-mono">
                        {asgn.status}
                      </span>
                      <button
                        type="button"
                        disabled={startingAssignmentId === asgn.id}
                        onClick={() => {
                          void handleStartAssignedPractical(asgn);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {startingAssignmentId === asgn.id
                          ? 'Starting...'
                          : 'Start practical →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom Grid: Recent results + Practical skills (Dynamic with Loading & Empty States) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Recent results */}
          <section className="lg:col-span-8 bg-white rounded-2xl border border-[#E3E8EF] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                Recent results
              </h2>
              {hasSubmittedAttempt && (
                <Link
                  to="/attempt/demo/report"
                  className="text-xs font-semibold text-[#2448D8] hover:underline"
                >
                  View marked report →
                </Link>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map((r) => (
                  <div key={r} className="h-10 bg-[#F1F4F9] rounded-xl" />
                ))}
              </div>
            ) : !hasSubmittedAttempt ? (
              <div className="rounded-xl bg-[#F9FAFC] border border-dashed border-[#D0D7E2] p-6 text-center space-y-2">
                <div className="font-display text-sm font-bold text-[#0E1726]">
                  No graded submissions yet
                </div>
                <p className="text-xs text-[#475467] max-w-md mx-auto leading-relaxed">
                  Complete and submit a practical attempt from your assignments or the
                  laboratories hub to see your marked report and score history here.
                </p>
              </div>
            ) : (
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
                        Simple pendulum — determination of g
                      </td>
                      <td className="py-3.5 text-[#475467]">
                        {submittedAt
                          ? new Date(submittedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Today'}
                      </td>
                      <td className="py-3.5 font-mono text-[#0E1726]">
                        g = {gValue} m s⁻²
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to="/attempt/demo/report"
                          className="px-2.5 py-1 rounded-md bg-[#E6F6EE] text-[#0F7B45] font-mono font-bold"
                        >
                          {latestReport ? latestReport.mark.total : localAutoMark.total} /{' '}
                          {latestReport ? latestReport.mark.maxTotal : localAutoMark.maxTotal}
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Practical skills */}
          <section className="lg:col-span-4 bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-[#0E1726]">
              Practical skills
            </h2>

            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="h-6 bg-[#F1F4F9] rounded" />
                ))}
              </div>
            ) : !hasSubmittedAttempt ? (
              <div className="rounded-xl bg-[#F9FAFC] border border-dashed border-[#D0D7E2] p-5 text-center space-y-1.5">
                <div className="text-xs font-bold text-[#0E1726]">
                  No skill profile recorded yet
                </div>
                <p className="text-[11px] text-[#475467] leading-relaxed">
                  Your WAEC/NECO practical skill breakdown (Taking readings, Significant
                  figures, Graph plotting, and Precautions) unlocks after your first
                  submitted practical.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 text-xs">
                  {localAutoMark.criteria.slice(0, 4).map((c) => {
                    const pct = Math.round((c.awarded / Math.max(1, c.max)) * 100);
                    return (
                      <div key={c.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[#0E1726] font-medium truncate pr-2">
                            {c.name}
                          </span>
                          <span className="font-mono font-bold text-[#0E1726]">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 bg-[#E3E8EF] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 70 ? 'bg-[#2448D8]' : 'bg-[#B54708]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-[#FEF5EE] rounded-xl p-3.5 text-xs text-[#9A3412] leading-relaxed">
                  <strong>Tip from Vix:</strong> Always state at least three physical
                  precautions (eye-level reading, small swing angle &lt; 10°, and timing
                  from the equilibrium fiducial mark).
                </div>
              </>
            )}
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

// B5 — Comprehensive 120+ Apparatus Encyclopedia (/apparatus)
const INITIAL_VISIBLE_COUNT = 6;
const PAGE_STEP = 6;

type EncyclopediaDetailTab = 'overview' | 'anatomy' | 'handling';

export function ApparatusEncyclopediaScreen() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState('compound-microscope');
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_VISIBLE_COUNT);
  const [rotated, setRotated] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [detailTab, setDetailTab] = useState<EncyclopediaDetailTab>('overview');

  const isSearching = searchQuery.trim().length > 0;
  const q = searchQuery.trim().toLowerCase();

  // Search and filter across all 120+ laboratory apparatus items
  const matchedItems = APPARATUS_CATALOG.filter((item) => {
    const matchesSubject =
      filter === 'All' ||
      item.subject === filter ||
      item.subtitle.toLowerCase().includes(filter.toLowerCase());

    const matchesSearch =
      !isSearching ||
      item.name.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.primaryUses.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.spotInLab.toLowerCase().includes(q) ||
      item.parts.some(
        (p) => p.part.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)
      );

    return matchesSubject && matchesSearch;
  });

  // When searching, show all matching items immediately; otherwise show 6 spacious cards with "See more (+6)"
  const displayedItems = isSearching
    ? matchedItems
    : matchedItems.slice(0, visibleLimit);

  const remainingCount = Math.max(0, matchedItems.length - displayedItems.length);

  const selectedItem =
    APPARATUS_CATALOG.find((i) => i.id === selectedId) ??
    displayedItems[0] ??
    APPARATUS_CATALOG[0]!;

  const subjectBadgeClass: Record<EncyclopediaItem['subject'], string> = {
    Physics: 'bg-[#EAEFFE] text-[#1D4ED8]',
    Chemistry: 'bg-[#FEF0E6] text-[#B45309]',
    Biology: 'bg-[#E6F6EE] text-[#15803D]',
    Electronics: 'bg-[#E0F8F5] text-[#0F766E]',
    Engineering: 'bg-[#F3E8FF] text-[#7E22CE]',
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] flex flex-col md:flex-row">
      {/* Sidebar with "Encyclopedia" active */}
      <StudentSidebar active="encyclopedia" />

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#E3E8EF]">
          <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Link to="/labs" className="font-semibold text-[#2448D8] hover:underline">
                ← Labs
              </Link>
              <span className="text-[#6B778C]">
                {APPARATUS_CATALOG.length} laboratory apparatus across 5 disciplines
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

        <main className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 mb-7 pb-5 border-b border-[#E3E8EF]">
            <div>
              <h1 className="font-display text-3xl font-bold text-[#0E1726] mb-1.5">
                Apparatus encyclopedia
              </h1>
              <p className="text-sm text-[#475467] max-w-2xl">
                {APPARATUS_CATALOG.length} laboratory instruments across Biology, Physics,
                Chemistry, Electronics, and Engineering. Select any card to inspect its
                specifications, anatomy, and WAEC/NECO handling guidelines.
              </p>
            </div>

            {/* Single Clean Bar: Search Input + 6 Discipline Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="search"
                  aria-label="Search apparatus"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder={`Search all ${APPARATUS_CATALOG.length} apparatus (e.g. micropipette, oscilloscope, burette)...`}
                  className="w-72 sm:w-80 px-4 py-2 rounded-full bg-white border border-[#D0D7E2] text-xs text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:border-[#2448D8]"
                />
              </div>
              {['All', 'Biology', 'Physics', 'Chemistry', 'Electronics', 'Engineering'].map(
                (subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => {
                      setFilter(subj);
                      setVisibleLimit(INITIAL_VISIBLE_COUNT);
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
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

          {/* 2-Column Airy Layout: Left 6 Spacious Cards + Right 3-Tab Detail Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* Left Column: 6 Spacious Cards + See More (+6) */}
            <div className="lg:col-span-5 space-y-4">
              {displayedItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E3E8EF] p-8 text-center space-y-2">
                  <div className="font-display text-sm font-bold text-[#0E1726]">
                    No apparatus matched &ldquo;{searchQuery}&rdquo;
                  </div>
                  <p className="text-xs text-[#475467]">
                    Try searching for micropipette, autoclave, oscilloscope, burette, caliper, or
                    spectrophotometer.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilter('All');
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#2448D8] text-white text-xs font-semibold cursor-pointer"
                  >
                    Reset search &amp; filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-[760px] overflow-y-auto pr-1">
                  {displayedItems.map((item) => {
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
                        className={`text-left rounded-2xl p-5 bg-white transition-all cursor-pointer flex flex-col justify-between ${
                          active
                            ? 'border-2 border-[#2448D8] shadow-sm'
                            : 'border border-[#E3E8EF] hover:border-[#93A0B8]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${subjectBadgeClass[item.subject]}`}
                          >
                            {item.subject}
                          </span>
                          <span className="font-mono text-[11px] text-[#6B778C]">
                            #{item.number}
                          </span>
                        </div>

                        <div className="h-28 flex items-center justify-center my-2">
                          <img
                            src={item.file}
                            alt={item.name}
                            className="max-h-24 w-auto object-contain"
                          />
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#F1F4F9]">
                          <div className="text-xs font-bold text-[#0E1726] leading-snug">
                            {item.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Clean See More (+6) Pagination Bar */}
              {!isSearching && matchedItems.length > INITIAL_VISIBLE_COUNT && (
                <div className="bg-white rounded-2xl border border-[#E3E8EF] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#475467]">
                    Showing <strong className="text-[#0E1726]">{displayedItems.length}</strong> of{' '}
                    <strong className="text-[#0E1726]">{matchedItems.length}</strong> apparatus
                  </div>

                  <div className="flex items-center gap-2">
                    {remainingCount > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleLimit((prev) =>
                              Math.min(matchedItems.length, prev + PAGE_STEP)
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          See more (+{Math.min(PAGE_STEP, remainingCount)})
                        </button>
                        {remainingCount > PAGE_STEP && (
                          <button
                            type="button"
                            onClick={() => setVisibleLimit(matchedItems.length)}
                            className="px-3 py-2 rounded-xl bg-[#F5F7FA] hover:bg-[#EDF1F7] border border-[#D0D7E2] text-xs font-semibold text-[#0E1726] transition-colors cursor-pointer"
                          >
                            Show all ({matchedItems.length})
                          </button>
                        )}
                      </>
                    )}

                    {displayedItems.length > INITIAL_VISIBLE_COUNT && (
                      <button
                        type="button"
                        onClick={() => setVisibleLimit(INITIAL_VISIBLE_COUNT)}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] text-xs font-semibold text-[#475467] cursor-pointer"
                      >
                        Show less
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Clean 3-Tab Detail Panel */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E3E8EF] overflow-hidden">
              {/* Isometric Drawing Stage */}
              <div className="bg-[#F9FAFC] border-b border-[#E3E8EF] p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#475467]">
                      #{selectedItem.number} of {APPARATUS_CATALOG.length}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${subjectBadgeClass[selectedItem.subject]}`}
                    >
                      {selectedItem.subject}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#E3E8EF] text-xs font-medium text-[#475467]">
                      {selectedItem.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoomed(!zoomed)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EDF1F7] border border-[#D0D7E2] text-xs font-semibold text-[#0E1726] cursor-pointer"
                    >
                      {zoomed ? 'Reset zoom' : 'Zoom ×1.25'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotated(!rotated)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EDF1F7] border border-[#D0D7E2] text-xs font-semibold text-[#0E1726] cursor-pointer"
                    >
                      Rotate view
                    </button>
                  </div>
                </div>

                <div className="h-[250px] flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedItem.file}
                    alt={selectedItem.name}
                    className={`max-h-[235px] w-auto object-contain transition-transform duration-300 ${
                      rotated ? '-scale-x-100' : ''
                    } ${zoomed ? 'scale-125' : ''}`}
                  />
                </div>
              </div>

              {/* Header + 3 Clean Detail Tabs */}
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0E1726] mb-1">
                      {selectedItem.name}
                    </h2>
                    <div className="text-xs font-medium text-[#6B778C]">
                      {selectedItem.subtitle}
                    </div>
                  </div>
                  <Link
                    to={selectedItem.practiseTo}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold transition-colors shrink-0"
                  >
                    Practise with it →
                  </Link>
                </div>

                {/* 3-Tab Switcher */}
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#F5F7FA] border border-[#E3E8EF]">
                  {(
                    [
                      { id: 'overview', label: 'Overview & Specs' },
                      { id: 'anatomy', label: `Anatomy & Parts (${selectedItem.parts.length})` },
                      { id: 'handling', label: 'Handling & Exam Tips' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDetailTab(tab.id)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        detailTab === tab.id
                          ? 'bg-white text-[#0E1726] shadow-xs border border-[#E3E8EF]'
                          : 'text-[#475467] hover:text-[#0E1726]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab 1: Overview & Specs */}
                {detailTab === 'overview' && (
                  <div className="space-y-5">
                    <p className="text-sm text-[#475467] leading-relaxed">
                      {selectedItem.description}
                    </p>

                    <div className="rounded-xl bg-[#EAEFFE]/60 border border-[#2448D8]/20 p-4 text-xs text-[#0E1726] leading-relaxed">
                      <strong className="text-[#1D4ED8] uppercase tracking-wider text-[11px] block mb-1">
                        Primary Laboratory Uses
                      </strong>
                      {selectedItem.primaryUses}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="rounded-xl bg-[#F5F7FA] border border-[#E3E8EF] p-4">
                        <div className="text-[10px] font-bold uppercase text-[#6B778C] mb-1">
                          Resolution / Least count
                        </div>
                        <div className="font-mono text-xs font-bold text-[#0E1726]">
                          {selectedItem.specs.resolution}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#F5F7FA] border border-[#E3E8EF] p-4">
                        <div className="text-[10px] font-bold uppercase text-[#6B778C] mb-1">
                          Range / Capacity
                        </div>
                        <div className="font-mono text-xs font-semibold text-[#0E1726]">
                          {selectedItem.specs.range}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#F5F7FA] border border-[#E3E8EF] p-4">
                        <div className="text-[10px] font-bold uppercase text-[#6B778C] mb-1">
                          Zero error &amp; calibration check
                        </div>
                        <div className="text-xs font-medium text-[#0E1726] leading-snug">
                          {selectedItem.specs.zeroError}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#F5F7FA] border border-[#E3E8EF] p-4">
                        <div className="text-[10px] font-bold uppercase text-[#6B778C] mb-1">
                          Materials &amp; construction
                        </div>
                        <div className="text-xs font-medium text-[#0E1726] leading-snug">
                          {selectedItem.specs.material}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#F9FAFC] border border-[#E3E8EF] p-4 text-xs text-[#475467]">
                      Spot it in a real lab:{' '}
                      <strong className="text-[#0E1726]">{selectedItem.spotInLab}</strong>
                    </div>
                  </div>
                )}

                {/* Tab 2: Anatomy & Parts */}
                {detailTab === 'anatomy' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[#E3E8EF] overflow-hidden">
                      <div className="bg-[#F5F7FA] px-4 py-3 border-b border-[#E3E8EF] text-xs font-bold text-[#0E1726]">
                        Functional anatomy &amp; labelled parts
                      </div>
                      <div className="divide-y divide-[#E3E8EF] text-xs">
                        {selectedItem.parts.map((p) => (
                          <div
                            key={p.part}
                            className="px-4 py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-2"
                          >
                            <span className="sm:col-span-4 font-bold text-[#1D4ED8]">
                              {p.part}
                            </span>
                            <span className="sm:col-span-8 text-[#475467] leading-relaxed">
                              {p.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#F9FAFC] border border-[#E3E8EF] p-4 text-xs text-[#475467]">
                      Spot it in a real lab:{' '}
                      <strong className="text-[#0E1726]">{selectedItem.spotInLab}</strong>
                    </div>
                  </div>
                )}

                {/* Tab 3: Handling & Exam Tips */}
                {detailTab === 'handling' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#F5F7FA] border border-[#E3E8EF] rounded-xl p-5">
                      <h3 className="font-display text-xs font-bold text-[#0E1726] mb-3">
                        How to handle &amp; read it (step by step)
                      </h3>
                      <ol className="space-y-2.5 text-xs text-[#475467] list-decimal list-inside leading-relaxed">
                        {selectedItem.handling.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-[#FEF5EE] border border-[#F9D7C4] rounded-xl p-5">
                      <h3 className="font-display text-xs font-bold text-[#9A3412] mb-3">
                        Mistakes examiners look for (marking penalties)
                      </h3>
                      <ul className="space-y-2.5 text-xs text-[#9A3412] list-disc list-inside leading-relaxed">
                        {selectedItem.mistakes.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
