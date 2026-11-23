/**
 * Full-Stack Typed REST Client for Vixir Backend API (`apps/api` on port 8081).
 * Matches `apps/api/openapi.json` and `.kiro/steering/contracts.md`.
 */

export const API_BASE_URL =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ||
    'http://localhost:8081').replace(/\/+$/, '');

const ACCESS_TOKEN_KEY = 'vixir_access_token';
const CURRENT_USER_KEY = 'vixir_current_user';
const ACTIVE_ATTEMPT_KEY = 'vixir_active_attempt';

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type PracticalMode = 'PRACTICE' | 'GRADED' | 'EXAM';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: string;
  locale: string;
  institutionId: string | null;
  createdAt?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  classCode?: string;
  institutionName?: string;
}

export interface ClassSummary {
  id: string;
  institutionId?: string;
  ownerId?: string;
  name: string;
  subject: string;
  level: string;
  joinCode: string;
  studentCount?: number;
  createdAt?: string;
}

export interface AssignmentSummary {
  id: string;
  classId: string;
  experimentId: string;
  experimentVersion: number;
  title: string;
  mode: PracticalMode;
  opensAt: string;
  dueAt: string;
  timeLimitMinutes: number | null;
  noiseLevel: string;
  attemptsAllowed: number;
  releasePolicy: string;
  status: string;
}

export interface CreateAssignmentPayload {
  classId: string;
  experimentId: string;
  experimentVersion?: number;
  title: string;
  mode: PracticalMode;
  opensAt: string;
  dueAt: string;
  timeLimitMinutes?: number | null;
  noiseLevel?: 'NONE' | 'LOW' | 'REALISTIC';
  attemptsAllowed?: number;
  releasePolicy?: 'IMMEDIATE' | 'ON_DUE_DATE' | 'MANUAL';
}

export interface ExperimentSummary {
  id: string;
  subject: string;
  title: string;
  latestPublishedVersion: number | null;
  level?: string;
  summary?: string;
}

export interface AttemptEventInput {
  clientEventId: string;
  seq: number;
  tsMs: number;
  kind: string;
  payload: Record<string, unknown>;
}

export interface AttemptEventItem {
  seq: number;
  tsMs: number;
  kind: string;
  payload: Record<string, unknown>;
}

export interface AttemptBootstrap {
  attemptId: string;
  mode: PracticalMode;
  attemptNo: number;
  seed: string;
  experiment: {
    id: string;
    version: number;
    config: unknown;
  };
  resume: {
    lastEventSeq: number;
    events: AttemptEventItem[];
  } | null;
}

export interface MarkCriterionView {
  criterionKey: string;
  awarded: number;
  max: number;
  reason: string;
  overridden: boolean;
}

export interface MarkView {
  submissionId: string;
  total: number;
  maxTotal: number;
  markerVersion: string;
  teacherComment: string | null;
  reviewed: boolean;
  markedAt: string;
  releasedAt: string | null;
}

export interface MarkReportResponse {
  mark: MarkView;
  criteria: MarkCriterionView[];
}

export interface StudentResultRow {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  attemptId: string | null;
  submissionId: string | null;
  state: string;
  score: number | null;
  maxScore: number;
  flagCount: number;
  submittedAt: string | null;
}

export interface AssignmentResultsResponse {
  assignmentId: string;
  title: string;
  maxScore: number;
  totalStudents: number;
  submittedCount: number;
  markedCount: number;
  releasedCount: number;
  openFlagCount: number;
  histogram: number[];
  criterionAverages: Record<string, number>;
  students: StudentResultRow[];
}

export interface FlagResponse {
  id: string;
  submissionId: string;
  kind: string;
  detail: Record<string, unknown>;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
}

export interface VixBootstrapResponse {
  sessionId: string;
  room: string;
  token: string;
  livekitUrl: string;
}

// ---- Token & User Session Helpers ----

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredAccessToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getStoredAttempt(): AttemptBootstrap | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(ACTIVE_ATTEMPT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AttemptBootstrap;
  } catch {
    return null;
  }
}

export function setStoredAttempt(attempt: AttemptBootstrap | null): void {
  if (typeof window === 'undefined') return;
  if (attempt) {
    window.sessionStorage.setItem(ACTIVE_ATTEMPT_KEY, JSON.stringify(attempt));
  } else {
    window.sessionStorage.removeItem(ACTIVE_ATTEMPT_KEY);
  }
}

// ---- Core Fetch Wrapper with Bearer Auth & 401 Cookie Refresh ----

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retryOn401 = true
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getStoredAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resp = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (resp.status === 401 && retryOn401 && !path.includes('/auth/')) {
    try {
      const refreshResp = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshResp.ok) {
        const refreshed = (await refreshResp.json()) as AuthTokenResponse;
        if (refreshed.accessToken) {
          setStoredAccessToken(refreshed.accessToken);
          return apiRequest<T>(path, options, false);
        }
      }
    } catch {
      // Refresh failed; proceed to throw original 401
    }
  }

  if (!resp.ok) {
    let errBody: { code?: string; detail?: string; title?: string } = {};
    try {
      errBody = await resp.json();
    } catch {
      // ignore non-json body
    }
    const err = new Error(
      errBody.detail || errBody.title || `API request failed with HTTP ${resp.status}`
    ) as Error & { status?: number; code?: string };
    err.status = resp.status;
    err.code = errBody.code;
    throw err;
  }

  if (resp.status === 204) {
    return undefined as T;
  }
  return (await resp.json()) as T;
}

export const vixirApi = {
  // 1. Auth & Me
  async login(email: string, password: string): Promise<UserProfile> {
    const tokenRes = await apiRequest<AuthTokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredAccessToken(tokenRes.accessToken);
    const me = await this.getMe();
    setStoredUser(me);
    return me;
  },

  async register(payload: RegisterPayload): Promise<UserProfile> {
    const tokenRes = await apiRequest<AuthTokenResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredAccessToken(tokenRes.accessToken);
    const me = await this.getMe();
    setStoredUser(me);
    return me;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest<void>('/api/v1/auth/logout', { method: 'POST' }, false);
    } finally {
      setStoredAccessToken(null);
      setStoredUser(null);
    }
  },

  async getMe(): Promise<UserProfile> {
    const user = await apiRequest<UserProfile>('/api/v1/me');
    setStoredUser(user);
    return user;
  },

  async patchMe(patch: {
    firstName?: string;
    lastName?: string;
    locale?: string;
  }): Promise<UserProfile> {
    const user = await apiRequest<UserProfile>('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setStoredUser(user);
    return user;
  },

  // 2. Classes & Roster
  async listClasses(): Promise<ClassSummary[]> {
    return apiRequest<ClassSummary[]>('/api/v1/classes');
  },

  async createClass(body: {
    name: string;
    subject: string;
    level: string;
  }): Promise<ClassSummary> {
    return apiRequest<ClassSummary>('/api/v1/classes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async joinClass(code: string): Promise<ClassSummary> {
    return apiRequest<ClassSummary>('/api/v1/classes/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async rotateJoinCode(classId: string): Promise<{ joinCode: string }> {
    return apiRequest<{ joinCode: string }>(
      `/api/v1/classes/${encodeURIComponent(classId)}/join-code/rotate`,
      { method: 'POST' }
    );
  },

  async listClassStudents(classId: string): Promise<UserProfile[]> {
    return apiRequest<UserProfile[]>(
      `/api/v1/classes/${encodeURIComponent(classId)}/students`
    );
  },

  // 3. Experiments & Assignments
  async listExperiments(subject?: string): Promise<ExperimentSummary[]> {
    const q = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    return apiRequest<ExperimentSummary[]>(`/api/v1/experiments${q}`);
  },

  async getExperiment(id: string): Promise<unknown> {
    return apiRequest<unknown>(`/api/v1/experiments/${encodeURIComponent(id)}`);
  },

  async listMyAssignments(): Promise<AssignmentSummary[]> {
    return apiRequest<AssignmentSummary[]>('/api/v1/me/assignments');
  },

  async listClassAssignments(classId: string): Promise<AssignmentSummary[]> {
    return apiRequest<AssignmentSummary[]>(
      `/api/v1/assignments?classId=${encodeURIComponent(classId)}`
    );
  },

  async createAssignment(payload: CreateAssignmentPayload): Promise<AssignmentSummary> {
    return apiRequest<AssignmentSummary>('/api/v1/assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async publishAssignment(assignmentId: string): Promise<AssignmentSummary> {
    return apiRequest<AssignmentSummary>(
      `/api/v1/assignments/${encodeURIComponent(assignmentId)}/publish`,
      { method: 'POST' }
    );
  },

  // 4. Attempts, Events & Submissions
  async startAttempt(body: {
    assignmentId?: string;
    experimentId?: string;
  }): Promise<AttemptBootstrap> {
    const bootstrap = await apiRequest<AttemptBootstrap>('/api/v1/attempts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setStoredAttempt(bootstrap);
    return bootstrap;
  },

  async startAnonymousAttempt(experimentId: string): Promise<AttemptBootstrap> {
    const bootstrap = await apiRequest<AttemptBootstrap>('/api/v1/attempts/anonymous', {
      method: 'POST',
      body: JSON.stringify({ experimentId }),
    });
    setStoredAttempt(bootstrap);
    return bootstrap;
  },

  async ingestAttemptEvents(
    attemptId: string,
    events: AttemptEventInput[]
  ): Promise<{ accepted: number; duplicates: number }> {
    return apiRequest<{ accepted: number; duplicates: number }>(
      `/api/v1/attempts/${encodeURIComponent(attemptId)}/events`,
      {
        method: 'POST',
        body: JSON.stringify({ events }),
      }
    );
  },

  async getAttemptEvents(
    attemptId: string,
    afterSeq?: number
  ): Promise<AttemptEventItem[]> {
    const q = typeof afterSeq === 'number' ? `?afterSeq=${afterSeq}` : '';
    return apiRequest<AttemptEventItem[]>(
      `/api/v1/attempts/${encodeURIComponent(attemptId)}/events${q}`
    );
  },

  async submitAttempt(
    attemptId: string,
    payload: {
      results: Record<string, unknown>;
      declarationAccepted: boolean;
      clientSubmittedAt?: string;
    },
    idempotencyKey?: string
  ): Promise<{ submissionId: string }> {
    return apiRequest<{ submissionId: string }>(
      `/api/v1/attempts/${encodeURIComponent(attemptId)}/submit`,
      {
        method: 'POST',
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
        body: JSON.stringify({
          ...payload,
          clientSubmittedAt: payload.clientSubmittedAt || new Date().toISOString(),
        }),
      }
    );
  },

  async getMarkReport(attemptId: string): Promise<MarkReportResponse> {
    return apiRequest<MarkReportResponse>(
      `/api/v1/attempts/${encodeURIComponent(attemptId)}/report`
    );
  },

  // 5. Teacher Review, Analytics & Flag Resolution
  async getAssignmentResults(assignmentId: string): Promise<AssignmentResultsResponse> {
    return apiRequest<AssignmentResultsResponse>(
      `/api/v1/assignments/${encodeURIComponent(assignmentId)}/results`
    );
  },

  async getAssignmentAnalytics(
    assignmentId: string
  ): Promise<{ results: AssignmentResultsResponse; commonMistakes: unknown[] }> {
    return apiRequest<{ results: AssignmentResultsResponse; commonMistakes: unknown[] }>(
      `/api/v1/assignments/${encodeURIComponent(assignmentId)}/analytics`
    );
  },

  async getAssignmentFlags(assignmentId: string): Promise<FlagResponse[]> {
    return apiRequest<FlagResponse[]>(
      `/api/v1/assignments/${encodeURIComponent(assignmentId)}/flags`
    );
  },

  async resolveFlag(flagId: string, note: string): Promise<FlagResponse> {
    return apiRequest<FlagResponse>(`/api/v1/flags/${encodeURIComponent(flagId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    });
  },

  async patchSubmissionMark(
    submissionId: string,
    body:
      | { criterionKey: string; score: number; reason: string }
      | { comment: string }
  ): Promise<MarkReportResponse> {
    return apiRequest<MarkReportResponse>(
      `/api/v1/submissions/${encodeURIComponent(submissionId)}/mark`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      }
    );
  },

  async releaseAssignmentMarks(assignmentId: string): Promise<void> {
    return apiRequest<void>(
      `/api/v1/assignments/${encodeURIComponent(assignmentId)}/release`,
      { method: 'POST' }
    );
  },

  // 6. Vix Session Bootstrap & Scripted Tours
  async bootstrapVixSession(body: {
    attemptId?: string;
    screen: string;
    consent: { mic: boolean; screen: boolean; camera: boolean };
  }): Promise<VixBootstrapResponse> {
    return apiRequest<VixBootstrapResponse>('/api/v1/vix/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async endVixSession(sessionId: string, turns: number): Promise<void> {
    return apiRequest<void>(
      `/api/v1/vix/sessions/${encodeURIComponent(sessionId)}/end`,
      {
        method: 'POST',
        body: JSON.stringify({ turns }),
      }
    );
  },

  async getScriptedTour(
    screenCode: string,
    experimentId?: string
  ): Promise<{ screen: string; steps: Array<{ regionId: string; caption: string }> }> {
    const q = experimentId ? `?experimentId=${encodeURIComponent(experimentId)}` : '';
    return apiRequest<{
      screen: string;
      steps: Array<{ regionId: string; caption: string }>;
    }>(`/api/v1/vix/tours/${encodeURIComponent(screenCode)}${q}`);
  },
};
