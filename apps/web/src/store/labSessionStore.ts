import { create } from 'zustand';
import {
  createRng,
  readScale,
  readStopwatch,
  linearFit,
  pendulumPeriod,
  type LinearFit,
} from '../../../../packages/sim-core/src/index';
import {
  getStoredAccessToken,
  getStoredUser,
  vixirApi,
  type AttemptEventItem,
} from '../lib/api';

export interface PendulumResultRow {
  sn: number;
  lengthM: number;
  t1: number;
  t2: number;
  tMean: string;
  periodT: string;
  periodT2: string;
  oscillations: number;
}

export interface BenchReplayEvent {
  time: string;
  label: string;
  lengthCm: number;
  stopwatchS: string;
  angleDeg: number;
  flagged?: boolean;
}

export interface PrecautionsState {
  parallax: boolean;
  smallAngle: boolean;
  centreSwing: boolean;
  extra: string;
}

export interface AutoMarkCriterion {
  key: string;
  name: string;
  awarded: number;
  max: number;
  score: string;
  pct: number;
  color: string;
  reason: string;
}

export interface AutoMarkSummary {
  total: number;
  maxTotal: number;
  grade: string;
  slope: number;
  gFromSlope: number;
  criteria: AutoMarkCriterion[];
  warningsCount: number;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function makeClientEventUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getDraftStorageKey(): string {
  const user = getStoredUser();
  return `vixir_pendulum_draft_${user?.id || 'guest'}`;
}

function persistLocalDraft(data: {
  attemptId: string;
  seed: string;
  lastEventSeq: number;
  pendulumRows: PendulumResultRow[];
  replayEvents: BenchReplayEvent[];
  precautions: PrecautionsState;
  gValue: string;
}) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(getDraftStorageKey(), JSON.stringify(data));
    }
  } catch {
    // ignore quota errors
  }
}

function loadLocalDraft(): Partial<{
  attemptId: string;
  seed: string;
  lastEventSeq: number;
  pendulumRows: PendulumResultRow[];
  replayEvents: BenchReplayEvent[];
  precautions: PrecautionsState;
  gValue: string;
}> | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(getDraftStorageKey());
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Reconstruct rows & replay log from persisted PostgreSQL AttemptEvents in ascending seq order. */
function reconstructRowsFromEvents(events: AttemptEventItem[]): {
  rows: PendulumResultRow[];
  replayEvents: BenchReplayEvent[];
  maxSeq: number;
} {
  let rows: PendulumResultRow[] = [];
  const replayEvents: BenchReplayEvent[] = [];
  let maxSeq = 0;

  for (const ev of events) {
    if (ev.seq > maxSeq) maxSeq = ev.seq;
    const payload = (ev.payload || {}) as Record<string, unknown>;

    if (ev.type === 'READINGS_CLEARED') {
      rows = [];
      replayEvents.push({
        time: String(payload.time || '00:00'),
        label: 'Cleared readings table',
        lengthCm: 40,
        stopwatchS: '0.00 s',
        angleDeg: 0,
      });
    } else if (ev.type === 'READING_DELETED') {
      const targetLen = Number(payload.lengthM);
      const targetSn = Number(payload.sn);
      if (Number.isFinite(targetLen)) {
        rows = rows.filter((r) => Math.abs(r.lengthM - targetLen) > 0.005);
      } else if (Number.isFinite(targetSn)) {
        rows = rows.filter((r) => r.sn !== targetSn);
      }
      rows = rows.map((r, i) => ({ ...r, sn: i + 1 }));
    } else if (ev.type === 'READING_RECORDED') {
      const rowData = payload.row as Partial<PendulumResultRow> | undefined;
      if (rowData && Number.isFinite(Number(rowData.lengthM))) {
        const lengthM = Number(rowData.lengthM);
        const t1 = Number(rowData.t1 ?? 0);
        const t2 = Number(rowData.t2 ?? t1);
        const tMean = String(rowData.tMean ?? ((t1 + t2) / 2).toFixed(2));
        const oscillations = Number(rowData.oscillations ?? 20);
        const periodT = String(
          rowData.periodT ?? (Number(tMean) / Math.max(1, oscillations)).toFixed(3)
        );
        const periodT2 = String(
          rowData.periodT2 ?? (Number(periodT) * Number(periodT)).toFixed(3)
        );

        const existingIdx = rows.findIndex((r) => Math.abs(r.lengthM - lengthM) < 0.015);
        const built: PendulumResultRow = {
          sn: existingIdx >= 0 ? rows[existingIdx]!.sn : rows.length + 1,
          lengthM,
          t1,
          t2,
          tMean,
          periodT,
          periodT2,
          oscillations,
        };
        if (existingIdx >= 0) {
          rows = rows.map((r, i) => (i === existingIdx ? built : r));
        } else {
          rows = [...rows, built];
        }

        replayEvents.push({
          time: String(payload.time || `${String(ev.seq).padStart(2, '0')}:00`),
          label: `Recorded L = ${(lengthM * 100).toFixed(1)} cm, t̄ = ${tMean} s`,
          lengthCm: Number((lengthM * 100).toFixed(1)),
          stopwatchS: `${tMean} s`,
          angleDeg: Number(payload.angleDeg ?? 8),
          flagged: Array.isArray(payload.flags) && payload.flags.length > 0,
        });
      }
    }
  }

  return { rows, replayEvents, maxSeq };
}

export function computeRegressionForRows(rows: PendulumResultRow[]): LinearFit {
  const validPoints = rows
    .map((r) => ({ x: r.lengthM, y: Number(r.periodT2) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.y > 0);
  if (validPoints.length < 2) {
    return { slope: 0, intercept: 0, r2: 0 };
  }
  try {
    return linearFit(validPoints);
  } catch {
    return { slope: 0, intercept: 0, r2: 0 };
  }
}

export function computeAutoMark(
  rows: PendulumResultRow[],
  precautions: PrecautionsState,
  gValueStr: string
): AutoMarkSummary {
  const fit = computeRegressionForRows(rows);
  const slope = Number(fit.slope.toFixed(2));
  const gFromSlope =
    fit.slope > 0.1
      ? Number(((4 * Math.PI * Math.PI) / fit.slope).toFixed(2))
      : 0;

  const readingCount = rows.length;
  const readingsAwarded = Math.min(6, readingCount);
  const readingsReason =
    readingCount >= 6
      ? `${readingCount} lengths, each timed twice. Repeats agree within 0.1 s — good technique.`
      : readingCount === 0
        ? 'No readings recorded yet. Record at least 6 distinct lengths on the bench.'
        : `${readingCount} of 6 expected lengths recorded. Take at least 6 distinct lengths from 40 cm to 90 cm.`;

  const badDpRows = rows.filter((r) => (r.periodT2.split('.')[1] || '').length !== 3);
  const sigFigAwarded =
    readingCount === 0 ? 0 : badDpRows.length === 0 ? 3 : badDpRows.length === 1 ? 2 : 1;
  const sigFigReason =
    readingCount === 0
      ? 'No table rows recorded yet.'
      : badDpRows.length === 0
        ? 'All derived T and T² values recorded consistently to 3 decimal places.'
        : `Row ${badDpRows[0]!.sn}: T² written as ${badDpRows[0]!.periodT2}. Keep 3 decimal places to match the rest of the column (${Number(badDpRows[0]!.periodT2).toFixed(3)}).`;

  const graphAwarded =
    readingCount >= 5 ? 5 : readingCount >= 3 ? 3 : readingCount >= 2 ? 2 : 0;
  const graphReason =
    readingCount >= 5
      ? 'Axes labelled with units, sensible scale using more than half the grid, points plotted accurately, best-fit line balanced.'
      : readingCount >= 2
        ? `${readingCount} points plotted on T² vs L axes. Record at least 5–6 points for full graph marks.`
        : 'At least 2 data points are required to plot a line of best fit.';

  const userG = Number(gValueStr);
  const hasValidG = readingCount >= 2 && Number.isFinite(userG) && userG > 0;
  const gDiff = hasValidG ? Math.abs(userG - 9.81) : 99;
  const slopeAwarded = !hasValidG ? 0 : gDiff <= 0.25 ? 4 : gDiff <= 0.5 ? 3 : 2;
  const slopeReason = !hasValidG
    ? 'Record at least 2 lengths and compute g = 4π² / slope from your plotted points.'
    : `Large triangle used; slope ${slope.toFixed(2)} s² m⁻¹ gives g = ${userG.toFixed(
        2
      )} m s⁻², consistent with your data.`;

  const statedCount =
    (precautions.parallax ? 1 : 0) +
    (precautions.smallAngle ? 1 : 0) +
    (precautions.centreSwing ? 1 : 0) +
    (precautions.extra.trim().length > 8 ? 1 : 0);
  const precAwarded = statedCount >= 3 ? 2 : statedCount >= 1 ? 1 : 0;
  const precReason =
    statedCount >= 3
      ? 'Three valid physical precautions stated (parallax, small angle < 10°, and equilibrium timing).'
      : 'Parallax and small angle stated. Missing: timing from the centre (equilibrium position) of the swing.';

  const criteria: AutoMarkCriterion[] = [
    {
      key: 'readings',
      name: 'Readings & repeats',
      awarded: readingsAwarded,
      max: 6,
      score: `${readingsAwarded}/6`,
      pct: Math.round((readingsAwarded / 6) * 100),
      color: readingsAwarded === 6 ? 'bg-[#0F7B45]' : 'bg-[#B54708]',
      reason: readingsReason,
    },
    {
      key: 'sigfigs',
      name: 'Table & significant figures',
      awarded: sigFigAwarded,
      max: 3,
      score: `${sigFigAwarded}/3`,
      pct: Math.round((sigFigAwarded / 3) * 100),
      color: sigFigAwarded === 3 ? 'bg-[#0F7B45]' : 'bg-[#B54708]',
      reason: sigFigReason,
    },
    {
      key: 'graph',
      name: 'Graph',
      awarded: graphAwarded,
      max: 5,
      score: `${graphAwarded}/5`,
      pct: Math.round((graphAwarded / 5) * 100),
      color: graphAwarded >= 5 ? 'bg-[#0F7B45]' : 'bg-[#B54708]',
      reason: graphReason,
    },
    {
      key: 'slope',
      name: 'Slope & value of g',
      awarded: slopeAwarded,
      max: 4,
      score: `${slopeAwarded}/4`,
      pct: Math.round((slopeAwarded / 4) * 100),
      color: slopeAwarded >= 3 ? 'bg-[#0F7B45]' : 'bg-[#B54708]',
      reason: slopeReason,
    },
    {
      key: 'precautions',
      name: 'Precautions',
      awarded: precAwarded,
      max: 2,
      score: `${precAwarded}/2`,
      pct: Math.round((precAwarded / 2) * 100),
      color: precAwarded === 2 ? 'bg-[#0F7B45]' : 'bg-[#B54708]',
      reason: precReason,
    },
  ];

  const total = criteria.reduce((s, c) => s + c.awarded, 0);
  const maxTotal = 20;
  const grade = total >= 16 ? 'A' : total >= 14 ? 'B' : total >= 11 ? 'C' : 'D';
  const warningsCount =
    (badDpRows.length > 0 ? 1 : 0) + (statedCount < 3 ? 1 : 0);

  return {
    total,
    maxTotal,
    grade,
    slope,
    gFromSlope,
    criteria,
    warningsCount,
  };
}

// Serialized promise chain so sequential PostgreSQL event ingestion never races on `seq`
let dbSyncQueue: Promise<void> = Promise.resolve();

interface LabSessionState {
  attemptId: string;
  seed: string;
  lastEventSeq: number;
  callCount: number;
  pendulumRows: PendulumResultRow[];
  replayEvents: BenchReplayEvent[];
  precautions: PrecautionsState;
  gValue: string;
  submissionId: string;
  submittedAt: string | null;
  apiSyncStatus: 'synced' | 'offline-queued' | 'syncing';
  hydratedForUserId: string | null;
  hydrateFromBackend: () => Promise<void>;
  measureDeterministicTrial: (opts: {
    lengthCm: number;
    theta0Deg: number;
    oscillations: number;
    eyeLevel: boolean;
    rawStopwatchS?: number;
  }) => {
    measuredLengthCm: number;
    t1: number;
    t2: number;
    tMean: number;
    periodT: number;
    periodT2: number;
  };
  recordPendulumTrial: (opts: {
    lengthCm: number;
    theta0Deg: number;
    oscillations: number;
    eyeLevel: boolean;
    rawStopwatchS?: number;
  }) => PendulumResultRow;
  removePendulumRow: (sn: number) => void;
  updateResultCell: (sn: number, field: 'tMean' | 'periodT' | 'periodT2', val: string) => void;
  fixAllDecimalPlaces: () => void;
  setPrecautions: (updater: (prev: PrecautionsState) => PrecautionsState) => void;
  setGValue: (val: string) => void;
  clearPendulumRows: () => void;
  appendReplayEvent: (ev: Omit<BenchReplayEvent, 'time'> & { time?: string }) => void;
  submitAttemptToApi: () => Promise<void>;
}

export const useLabSessionStore = create<LabSessionState>((set, get) => {
  const saveSnapshot = () => {
    const s = get();
    persistLocalDraft({
      attemptId: s.attemptId,
      seed: s.seed,
      lastEventSeq: s.lastEventSeq,
      pendulumRows: s.pendulumRows,
      replayEvents: s.replayEvents,
      precautions: s.precautions,
      gValue: s.gValue,
    });
  };

  /** Ensure an IN_PROGRESS attempt exists in PostgreSQL and ingest one sequential event. */
  const enqueueBackendEvent = (
    type: 'READING_RECORDED' | 'READING_DELETED' | 'READINGS_CLEARED',
    payload: Record<string, unknown>
  ) => {
    if (!getStoredAccessToken()) return;
    set({ apiSyncStatus: 'syncing' });

    dbSyncQueue = dbSyncQueue.then(async () => {
      try {
        let targetAttemptId = get().attemptId;
        let currentSeq = get().lastEventSeq;

        if (!UUID_REGEX.test(targetAttemptId)) {
          // Check for an existing IN_PROGRESS pendulum attempt first so we resume instead of duplicating
          const attempts = await vixirApi.listMyAttempts().catch(() => []);
          const existing = attempts.find(
            (a) => a.experimentId === 'phy.pendulum.g' && a.state === 'IN_PROGRESS'
          );
          if (existing) {
            targetAttemptId = existing.id;
            currentSeq = existing.lastEventSeq;
            set({ attemptId: targetAttemptId, lastEventSeq: currentSeq });
          } else {
            const bootstrap = await vixirApi.startAttempt({
              experimentId: 'phy.pendulum.g',
            });
            targetAttemptId = bootstrap.attemptId;
            currentSeq = bootstrap.resume?.lastEventSeq ?? 0;
            set({
              attemptId: targetAttemptId,
              seed: bootstrap.seed,
              lastEventSeq: currentSeq,
            });
          }
        }

        const nextSeq = currentSeq + 1;
        await vixirApi.ingestAttemptEvents(targetAttemptId, [
          {
            clientEventId: makeClientEventUuid(),
            seq: nextSeq,
            type,
            simTimeMs: nextSeq * 1500,
            clientTs: new Date().toISOString(),
            payload,
          },
        ]);
        set({ lastEventSeq: nextSeq, apiSyncStatus: 'synced' });
        saveSnapshot();
      } catch {
        set({ apiSyncStatus: 'offline-queued' });
      }
    });
  };

  return {
    attemptId: 'demo',
    seed: 'A7F3-0142',
    lastEventSeq: 0,
    callCount: 0,
    pendulumRows: [],
    replayEvents: [],
    precautions: {
      parallax: false,
      smallAngle: false,
      centreSwing: false,
      extra: '',
    },
    gValue: '',
    submissionId: 'VX-7KQ2-0142-A1',
    submittedAt: null,
    apiSyncStatus: 'synced',
    hydratedForUserId: null,

    hydrateFromBackend: async () => {
      const user = getStoredUser();
      const userKey = user?.id || 'guest';

      // 1. Immediately hydrate from user-scoped localStorage so navigation never flickers empty
      const local = loadLocalDraft();
      if (local && Array.isArray(local.pendulumRows) && get().pendulumRows.length === 0) {
        set({
          attemptId: local.attemptId || get().attemptId,
          seed: local.seed || get().seed,
          lastEventSeq: local.lastEventSeq ?? get().lastEventSeq,
          pendulumRows: local.pendulumRows,
          replayEvents: local.replayEvents || [],
          precautions: local.precautions || get().precautions,
          gValue: local.gValue ?? get().gValue,
          hydratedForUserId: userKey,
        });
      }

      if (!getStoredAccessToken()) return;

      // 2. Reconcile with PostgreSQL `attempt` + `attempt_event` rows on :8081
      try {
        set({ apiSyncStatus: 'syncing' });
        const attempts = await vixirApi.listMyAttempts();
        const activeAttempt = attempts.find(
          (a) => a.experimentId === 'phy.pendulum.g' && a.state === 'IN_PROGRESS'
        );
        if (!activeAttempt) {
          set({ apiSyncStatus: 'synced', hydratedForUserId: userKey });
          return;
        }

        const events = await vixirApi.getAttemptEvents(activeAttempt.id);
        const { rows, replayEvents, maxSeq } = reconstructRowsFromEvents(events);
        const fit = computeRegressionForRows(rows);
        const computedG =
          rows.length >= 2 && fit.slope > 0.1
            ? ((4 * Math.PI * Math.PI) / fit.slope).toFixed(2)
            : '';

        set({
          attemptId: activeAttempt.id,
          lastEventSeq: Math.max(activeAttempt.lastEventSeq, maxSeq),
          pendulumRows: rows,
          replayEvents,
          gValue: computedG || get().gValue,
          apiSyncStatus: 'synced',
          hydratedForUserId: userKey,
        });
        saveSnapshot();
      } catch {
        set({ apiSyncStatus: 'offline-queued' });
      }
    },

    clearPendulumRows: () => {
      set({
        pendulumRows: [],
        replayEvents: [],
        gValue: '',
        submittedAt: null,
      });
      saveSnapshot();
      enqueueBackendEvent('READINGS_CLEARED', {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    },

    removePendulumRow: (sn) => {
      const existing = get().pendulumRows;
      const removed = existing.find((r) => r.sn === sn);
      const updated = existing
        .filter((r) => r.sn !== sn)
        .map((r, idx) => ({ ...r, sn: idx + 1 }));

      const fit = computeRegressionForRows(updated);
      const nextG =
        updated.length >= 2 && fit.slope > 0.1
          ? ((4 * Math.PI * Math.PI) / fit.slope).toFixed(2)
          : '';

      set({
        pendulumRows: updated,
        gValue: nextG,
      });
      saveSnapshot();

      if (removed) {
        enqueueBackendEvent('READING_DELETED', {
          sn,
          lengthM: removed.lengthM,
        });
      }
    },

    measureDeterministicTrial: ({
      lengthCm,
      theta0Deg,
      oscillations,
      eyeLevel,
      rawStopwatchS,
    }) => {
      const state = get();
      const nextCall = state.callCount + 1;
      set({ callCount: nextCall });

      const rootRng = createRng(`${state.seed}/trial-${nextCall}`);
      const scaleRng = rootRng.fork('metre-rule');
      const swRng = rootRng.fork('stopwatch');

      const measuredLengthCm = readScale(
        lengthCm,
        { resolution: 0.1, parallaxBound: 0.4 },
        scaleRng,
        { eyeLevel, zeroed: true }
      );

      const truePeriod = pendulumPeriod(lengthCm / 100, 9.81, theta0Deg);
      const trueElapsed = oscillations * truePeriod;

      const t1 =
        rawStopwatchS && rawStopwatchS >= 2
          ? Number(rawStopwatchS.toFixed(2))
          : readStopwatch(trueElapsed, { resolution: 0.01, reactionSigma: 0.08 }, swRng);
      const t2 = readStopwatch(
        trueElapsed,
        { resolution: 0.01, reactionSigma: 0.08 },
        swRng.fork('repeat-2')
      );

      const tMean = Number(((t1 + t2) / 2).toFixed(2));
      const periodT = Number((tMean / oscillations).toFixed(3));
      const periodT2 = Number((periodT * periodT).toFixed(3));

      return {
        measuredLengthCm,
        t1,
        t2,
        tMean,
        periodT,
        periodT2,
      };
    },

    recordPendulumTrial: (opts) => {
      const measured = get().measureDeterministicTrial(opts);
      const lengthM = Number((measured.measuredLengthCm / 100).toFixed(3));
      const existingRows = get().pendulumRows;

      const existingIdx = existingRows.findIndex(
        (r) => Math.abs(r.lengthM - lengthM) < 0.015
      );

      let updatedRows: PendulumResultRow[];
      let targetRow: PendulumResultRow;

      if (existingIdx >= 0) {
        targetRow = {
          ...existingRows[existingIdx]!,
          lengthM,
          t1: measured.t1,
          t2: measured.t2,
          tMean: measured.tMean.toFixed(2),
          periodT: measured.periodT.toFixed(3),
          periodT2: measured.periodT2.toFixed(3),
          oscillations: opts.oscillations,
        };
        updatedRows = existingRows.map((r, i) => (i === existingIdx ? targetRow : r));
      } else {
        targetRow = {
          sn: existingRows.length + 1,
          lengthM,
          t1: measured.t1,
          t2: measured.t2,
          tMean: measured.tMean.toFixed(2),
          periodT: measured.periodT.toFixed(3),
          periodT2: measured.periodT2.toFixed(3),
          oscillations: opts.oscillations,
        };
        updatedRows = [...existingRows, targetRow];
      }

      const fit = computeRegressionForRows(updatedRows);
      const nextG =
        updatedRows.length >= 2 && fit.slope > 0.1
          ? ((4 * Math.PI * Math.PI) / fit.slope).toFixed(2)
          : get().gValue;

      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const flags: string[] = [];
      if (!opts.eyeLevel) flags.push('PARALLAX');
      if (opts.theta0Deg > 10) flags.push('ANGLE_OVER_10');

      const newReplay: BenchReplayEvent = {
        time: timeStr,
        label: `Recorded L = ${measured.measuredLengthCm.toFixed(1)} cm, t̄ = ${measured.tMean.toFixed(2)} s${
          !opts.eyeLevel ? ' (parallax)' : ''
        }`,
        lengthCm: measured.measuredLengthCm,
        stopwatchS: `${measured.tMean.toFixed(2)} s`,
        angleDeg: opts.theta0Deg,
        flagged: flags.length > 0,
      };

      set({
        pendulumRows: updatedRows,
        gValue: nextG,
        replayEvents: [...get().replayEvents, newReplay],
      });
      saveSnapshot();

      // Persist immediately to PostgreSQL `attempt_event` & `reading` tables on :8081!
      enqueueBackendEvent('READING_RECORDED', {
        rowIndex: targetRow.sn - 1,
        row: targetRow,
        flags,
        angleDeg: opts.theta0Deg,
        time: timeStr,
      });

      return targetRow;
    },

    updateResultCell: (sn, field, val) => {
      set((state) => ({
        pendulumRows: state.pendulumRows.map((r) =>
          r.sn === sn ? { ...r, [field]: val } : r
        ),
      }));
      saveSnapshot();
    },

    fixAllDecimalPlaces: () => {
      set((state) => ({
        pendulumRows: state.pendulumRows.map((r) => ({
          ...r,
          tMean: Number(r.tMean).toFixed(2),
          periodT: Number(r.periodT).toFixed(3),
          periodT2: Number(r.periodT2).toFixed(3),
        })),
      }));
      saveSnapshot();
    },

    setPrecautions: (updater) => {
      set((state) => ({
        precautions: updater(state.precautions),
      }));
      saveSnapshot();
    },

    setGValue: (val) => {
      set({ gValue: val });
      saveSnapshot();
    },

    appendReplayEvent: (ev) => {
      set((state) => {
        const idx = state.replayEvents.length + 1;
        const time = ev.time ?? `${String(idx).padStart(2, '0')}:00`;
        return {
          replayEvents: [
            ...state.replayEvents,
            {
              time,
              label: ev.label,
              lengthCm: ev.lengthCm,
              stopwatchS: ev.stopwatchS,
              angleDeg: ev.angleDeg,
              flagged: ev.flagged,
            },
          ],
        };
      });
      saveSnapshot();
    },

    submitAttemptToApi: async () => {
      set({ apiSyncStatus: 'syncing' });
      // Wait for any pending READING_RECORDED events to finish flushing first
      await dbSyncQueue.catch(() => {});

      const state = get();
      const submittedAt = new Date().toISOString();
      const resultsPayload = {
        seed: state.seed,
        rows: state.pendulumRows,
        precautions: state.precautions,
        gValue: Number(state.gValue) || 9.82,
      };

      try {
        let targetAttemptId = state.attemptId;
        if (!UUID_REGEX.test(targetAttemptId)) {
          const bootstrap = getStoredAccessToken()
            ? await vixirApi.startAttempt({ experimentId: 'phy.pendulum.g' })
            : await vixirApi.startAnonymousAttempt('phy.pendulum.g');
          targetAttemptId = bootstrap.attemptId;
          set({ attemptId: targetAttemptId });
        }

        const data = await vixirApi.submitAttempt(
          targetAttemptId,
          {
            results: resultsPayload,
            declarationAccepted: true,
            clientSubmittedAt: submittedAt,
          },
          `idem-${targetAttemptId}`
        );
        set({
          apiSyncStatus: 'synced',
          submittedAt,
          submissionId: data.submissionId ?? state.submissionId,
        });
        saveSnapshot();
        return;
      } catch {
        // Offline / dev fallback
      }

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(
            `vixir_submission_${state.attemptId}`,
            JSON.stringify({ ...resultsPayload, submittedAt })
          );
        }
      } catch {
        // Ignore storage quota errors
      }

      set({
        apiSyncStatus: 'offline-queued',
        submittedAt,
      });
    },
  };
});
