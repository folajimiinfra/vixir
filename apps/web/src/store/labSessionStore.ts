import { create } from 'zustand';
import {
  createRng,
  readScale,
  readStopwatch,
  linearFit,
  pendulumPeriod,
  type LinearFit,
} from '../../../../packages/sim-core/src/index';
import { getStoredAccessToken, vixirApi } from '../lib/api';

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

const DEFAULT_PENDULUM_ROWS: PendulumResultRow[] = [
  { sn: 1, lengthM: 0.4, t1: 25.44, t2: 25.52, tMean: '25.48', periodT: '1.274', periodT2: '1.623', oscillations: 20 },
  { sn: 2, lengthM: 0.5, t1: 28.28, t2: 28.34, tMean: '28.31', periodT: '1.416', periodT2: '2.005', oscillations: 20 },
  { sn: 3, lengthM: 0.6, t1: 31.24, t2: 31.3, tMean: '31.27', periodT: '1.564', periodT2: '2.45', oscillations: 20 },
  { sn: 4, lengthM: 0.7, t1: 33.6, t2: 33.66, tMean: '33.63', periodT: '1.682', periodT2: '2.829', oscillations: 20 },
  { sn: 5, lengthM: 0.8, t1: 35.88, t2: 35.92, tMean: '35.90', periodT: '1.795', periodT2: '3.222', oscillations: 20 },
  { sn: 6, lengthM: 0.9, t1: 38.04, t2: 38.1, tMean: '38.07', periodT: '1.904', periodT2: '3.625', oscillations: 20 },
];

const DEFAULT_REPLAY_EVENTS: BenchReplayEvent[] = [
  { time: '00:00', label: 'Entered setup', lengthCm: 40, stopwatchS: '0.00 s', angleDeg: 0 },
  { time: '01:42', label: 'Set-up complete (7 items)', lengthCm: 40, stopwatchS: '0.00 s', angleDeg: 0 },
  { time: '03:05', label: 'Released bob at θ₀ = 8°', lengthCm: 40, stopwatchS: '0.00 s', angleDeg: 8 },
  { time: '03:21', label: 'Stopwatch start', lengthCm: 40, stopwatchS: '0.00 s', angleDeg: 7 },
  { time: '03:47', label: 'Stopwatch stop — 25.48 s, 20 osc.', lengthCm: 40, stopwatchS: '25.48 s', angleDeg: 5 },
  { time: '04:02', label: 'Recorded L = 40.0 cm', lengthCm: 40, stopwatchS: '25.48 s', angleDeg: 4 },
  { time: '06:30', label: 'Changed length → 50 cm', lengthCm: 50, stopwatchS: '0.00 s', angleDeg: 5 },
  { time: '07:18', label: 'Stopwatch stop — 27.02 s, 19 osc.', lengthCm: 50, stopwatchS: '27.02 s', angleDeg: 6, flagged: true },
  { time: '07:40', label: 'Reading discarded, repeated', lengthCm: 50, stopwatchS: '0.00 s', angleDeg: 8 },
  { time: '08:24', label: 'Recorded L = 50.0 cm, 28.31 s', lengthCm: 50, stopwatchS: '28.31 s', angleDeg: 4 },
  { time: '12:55', label: 'Eye above scale while reading 60 cm', lengthCm: 60, stopwatchS: '0.00 s', angleDeg: 3, flagged: true },
  { time: '13:10', label: 'Recorded L = 60.4 cm (parallax)', lengthCm: 60.4, stopwatchS: '31.27 s', angleDeg: 2 },
];

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

  // 1. Readings & repeats (6 marks)
  const readingCount = rows.length;
  const readingsAwarded = Math.min(6, readingCount);
  const readingsReason =
    readingCount >= 6
      ? `${readingCount} lengths, each timed twice. Repeats agree within 0.1 s — good technique.`
      : readingCount === 0
        ? 'No readings recorded yet. Record at least 6 distinct lengths on the bench.'
        : `${readingCount} of 6 expected lengths recorded. Take at least 6 distinct lengths from 40 cm to 90 cm.`;

  // 2. Table & significant figures (3 marks)
  const badDpRows = rows.filter((r) => (r.periodT2.split('.')[1] || '').length !== 3);
  const sigFigAwarded =
    readingCount === 0 ? 0 : badDpRows.length === 0 ? 3 : badDpRows.length === 1 ? 2 : 1;
  const sigFigReason =
    readingCount === 0
      ? 'No table rows recorded yet.'
      : badDpRows.length === 0
        ? 'All derived T and T² values recorded consistently to 3 decimal places.'
        : `Row ${badDpRows[0]!.sn}: T² written as ${badDpRows[0]!.periodT2}. Keep 3 decimal places to match the rest of the column (${Number(badDpRows[0]!.periodT2).toFixed(3)}).`;

  // 3. Graph (5 marks)
  const graphAwarded =
    readingCount >= 5 ? 5 : readingCount >= 3 ? 3 : readingCount >= 2 ? 2 : 0;
  const graphReason =
    readingCount >= 5
      ? 'Axes labelled with units, sensible scale using more than half the grid, points plotted accurately, best-fit line balanced.'
      : readingCount >= 2
        ? `${readingCount} points plotted on T² vs L axes. Record at least 5–6 points for full graph marks.`
        : 'At least 2 data points are required to plot a line of best fit.';

  // 4. Slope & value of g (4 marks)
  const userG = Number(gValueStr);
  const hasValidG = readingCount >= 2 && Number.isFinite(userG) && userG > 0;
  const gDiff = hasValidG ? Math.abs(userG - 9.81) : 99;
  const slopeAwarded = !hasValidG ? 0 : gDiff <= 0.25 ? 4 : gDiff <= 0.5 ? 3 : 2;
  const slopeReason = !hasValidG
    ? 'Record at least 2 lengths and compute g = 4π² / slope from your plotted points.'
    : `Large triangle used; slope ${slope.toFixed(2)} s² m⁻¹ gives g = ${userG.toFixed(
        2
      )} m s⁻², consistent with your data.`;

  // 5. Precautions (2 marks)
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
      pct: 100,
      color: 'bg-[#0F7B45]',
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

interface LabSessionState {
  attemptId: string;
  seed: string;
  callCount: number;
  pendulumRows: PendulumResultRow[];
  replayEvents: BenchReplayEvent[];
  precautions: PrecautionsState;
  gValue: string;
  submissionId: string;
  submittedAt: string | null;
  apiSyncStatus: 'synced' | 'offline-queued' | 'syncing';
  /** Sample a deterministic pendulum trial using @vixir/sim-core seeded RNG */
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
  updateResultCell: (sn: number, field: 'tMean' | 'periodT' | 'periodT2', val: string) => void;
  fixAllDecimalPlaces: () => void;
  setPrecautions: (updater: (prev: PrecautionsState) => PrecautionsState) => void;
  setGValue: (val: string) => void;
  clearPendulumRows: () => void;
  appendReplayEvent: (ev: Omit<BenchReplayEvent, 'time'> & { time?: string }) => void;
  submitAttemptToApi: () => Promise<void>;
}

export const useLabSessionStore = create<LabSessionState>((set, get) => ({
  attemptId: 'demo',
  seed: 'A7F3-0142',
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

  clearPendulumRows: () =>
    set({
      pendulumRows: [],
      replayEvents: [],
      gValue: '',
      submittedAt: null,
    }),

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

    // Check if there's already a row at this lengthM (within 0.01m), or append
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
    const nextG = ((4 * Math.PI * Math.PI) / Math.max(0.5, fit.slope)).toFixed(2);

    const nowMin = 14 + get().replayEvents.length;
    const newReplay: BenchReplayEvent = {
      time: `${String(nowMin).padStart(2, '0')}:15`,
      label: `Recorded L = ${measured.measuredLengthCm.toFixed(1)} cm, t̄ = ${measured.tMean.toFixed(2)} s${
        !opts.eyeLevel ? ' (parallax)' : ''
      }`,
      lengthCm: measured.measuredLengthCm,
      stopwatchS: `${measured.tMean.toFixed(2)} s`,
      angleDeg: opts.theta0Deg,
      flagged: !opts.eyeLevel || opts.theta0Deg > 10,
    };

    set({
      pendulumRows: updatedRows,
      gValue: nextG,
      replayEvents: [...get().replayEvents, newReplay],
    });

    return targetRow;
  },

  updateResultCell: (sn, field, val) => {
    set((state) => ({
      pendulumRows: state.pendulumRows.map((r) =>
        r.sn === sn ? { ...r, [field]: val } : r
      ),
    }));
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
  },

  setPrecautions: (updater) => {
    set((state) => ({
      precautions: updater(state.precautions),
    }));
  },

  setGValue: (val) => set({ gValue: val }),

  appendReplayEvent: (ev) => {
    set((state) => {
      const idx = state.replayEvents.length + 14;
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
  },

  submitAttemptToApi: async () => {
    set({ apiSyncStatus: 'syncing' });
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
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          targetAttemptId
        );
      if (!isUuid) {
        const bootstrap = getStoredAccessToken()
          ? await vixirApi.startAttempt({ experimentId: 'phy.pendulum.g' })
          : await vixirApi.startAnonymousAttempt('phy.pendulum.g');
        targetAttemptId = bootstrap.attemptId;
        set({ attemptId: targetAttemptId });
      }

      // Batch upload replay events (idempotent by clientEventId)
      const eventsBatch = state.replayEvents.slice(0, 200).map((ev, idx) => ({
        clientEventId: `${targetAttemptId}-ev-${idx + 1}`,
        seq: idx + 1,
        tsMs: (idx + 1) * 1500,
        kind: ev.flagged ? 'WARNING' : 'READING_RECORDED',
        payload: {
          time: ev.time,
          label: ev.label,
          lengthCm: ev.lengthCm,
          stopwatchS: ev.stopwatchS,
          angleDeg: ev.angleDeg,
        },
      }));
      if (eventsBatch.length > 0 && getStoredAccessToken()) {
        await vixirApi.ingestAttemptEvents(targetAttemptId, eventsBatch).catch(() => {});
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
      return;
    } catch {
      // Offline / dev fallback: persist in localStorage queue
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
}));
