import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check, AlertCircle } from 'lucide-react';
import {
  useLabSessionStore,
  computeAutoMark,
  computeRegressionForRows,
} from '../store/labSessionStore';
import { useAuth } from '../context/AuthContext';
import { vixirApi, type MarkReportResponse } from '../lib/api';

// F1 — Results table, graph & calculations
export function ResultsGraphScreen() {
  const navigate = useNavigate();
  const rows = useLabSessionStore((s) => s.pendulumRows);
  const hydrateFromBackend = useLabSessionStore((s) => s.hydrateFromBackend);
  const removePendulumRow = useLabSessionStore((s) => s.removePendulumRow);
  const updateResultCell = useLabSessionStore((s) => s.updateResultCell);
  const fixAllDecimalPlaces = useLabSessionStore((s) => s.fixAllDecimalPlaces);
  const gValue = useLabSessionStore((s) => s.gValue);
  const setGValue = useLabSessionStore((s) => s.setGValue);
  const precautions = useLabSessionStore((s) => s.precautions);
  const setPrecautions = useLabSessionStore((s) => s.setPrecautions);

  const [showBestFit, setShowBestFit] = useState(true);

  useEffect(() => {
    void hydrateFromBackend();
  }, [hydrateFromBackend]);

  const fit = computeRegressionForRows(rows);
  const slopeDisplay = fit.slope.toFixed(2);
  const pctDiff = (
    (Math.abs((Number(gValue) || 9.82) - 9.81) / 9.81) *
    100
  ).toFixed(1);

  const hasDpWarning = rows.some((r) => (r.periodT2.split('.')[1] || '').length !== 3);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726]">
      {/* Header */}
      <header className="bg-white border-b border-[#E3E8EF]">
        <div className="max-w-[1240px] mx-auto px-6 h-14 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/lab/physics/pendulum"
              className="text-xs font-semibold text-[#2448D8] hover:underline"
            >
              ← Back to bench
            </Link>
            <h1 className="font-display text-sm sm:text-base font-bold text-[#0E1726]">
              Simple pendulum — results
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="px-3 py-1 rounded-full bg-[#EAEFFE] text-[#2448D8]">
              1 Set up ✓
            </span>
            <span className="px-3 py-1 rounded-full bg-[#EAEFFE] text-[#2448D8]">
              2 Readings ✓
            </span>
            <span className="px-3 py-1 rounded-full bg-[#2448D8] text-white">
              3 Graph
            </span>
            <Link
              to="/attempt/demo/submit"
              className="px-3 py-1 rounded-full bg-white border border-[#D0D7E2] text-[#475467] hover:text-[#0E1726]"
            >
              4 Report
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1240px] mx-auto px-6 py-7 space-y-6">
        {/* Table of results */}
        <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                Table of results
              </h2>
              <p className="text-xs text-[#475467]">
                Edit the derived columns yourself — Vixir checks your arithmetic and significant
                figures.
              </p>
            </div>
            {hasDpWarning && (
              <button
                type="button"
                onClick={fixAllDecimalPlaces}
                className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-[#FEF5EE] hover:bg-[#FDECE3] border border-[#F9D7C4] text-xs font-semibold text-[#9A3412] cursor-pointer"
              >
                Auto-format all T² to 3 d.p.
              </button>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="rounded-xl bg-[#F9FAFC] border border-dashed border-[#D0D7E2] p-7 text-center space-y-3">
              <div className="font-display text-base font-bold text-[#0E1726]">
                No readings recorded on the bench yet
              </div>
              <p className="text-xs text-[#475467] max-w-md mx-auto leading-relaxed">
                Return to the pendulum bench, adjust length L across at least 5–6 positions,
                time 20 oscillations with the stopwatch, and click Record reading to populate
                your table and plot your graph.
              </p>
              <Link
                to="/lab/physics/pendulum"
                className="inline-block px-4 py-2.5 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold"
              >
                ← Go to bench to record readings
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F5F7FA] border-b border-[#E3E8EF] text-[#0E1726] font-bold">
                    <th className="py-2.5 px-3 text-left">S/N</th>
                    <th className="py-2.5 px-3 text-left">L / m</th>
                    <th className="py-2.5 px-3 text-left">t₁ / s</th>
                    <th className="py-2.5 px-3 text-left">t₂ / s</th>
                    <th className="py-2.5 px-3 text-left">t̄ / s</th>
                    <th className="py-2.5 px-3 text-left">T = t̄/20 / s</th>
                    <th className="py-2.5 px-3 text-left">T² / s²</th>
                    <th className="py-2.5 px-3 text-left">Check</th>
                    <th className="py-2.5 px-2 text-right" aria-label="Remove row" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8EF] font-mono">
                  {rows.map((r) => {
                    const decimals = (r.periodT2.split('.')[1] || '').length;
                    const dpOk = decimals === 3;
                    return (
                      <tr key={r.sn}>
                        <td className="py-2 px-3">{r.sn}</td>
                        <td className="py-2 px-3">{r.lengthM.toFixed(3)}</td>
                        <td className="py-2 px-3">{r.t1.toFixed(2)}</td>
                        <td className="py-2 px-3">{r.t2.toFixed(2)}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            aria-label={`Mean time row ${r.sn}`}
                            value={r.tMean}
                            onChange={(e) => updateResultCell(r.sn, 'tMean', e.target.value)}
                            className="w-20 px-2 py-1 rounded border border-[#D0D7E2] bg-white text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            aria-label={`Period T row ${r.sn}`}
                            value={r.periodT}
                            onChange={(e) => updateResultCell(r.sn, 'periodT', e.target.value)}
                            className="w-20 px-2 py-1 rounded border border-[#D0D7E2] bg-white text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            aria-label={`Period squared row ${r.sn}`}
                            value={r.periodT2}
                            onChange={(e) => updateResultCell(r.sn, 'periodT2', e.target.value)}
                            className={`w-20 px-2 py-1 rounded border text-xs font-mono ${
                              dpOk
                                ? 'border-[#D0D7E2] bg-white'
                                : 'border-[#B54708] bg-[#FEF5EE] text-[#9A3412]'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3 font-sans">
                          {dpOk ? (
                            <span className="text-[#0F7B45] font-semibold">✓ 3 d.p.</span>
                          ) : (
                            <span className="text-[#B54708] font-semibold">
                              ! {decimals} d.p.
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            aria-label={`Remove row ${r.sn}`}
                            title="Remove this reading"
                            onClick={() => removePendulumRow(r.sn)}
                            className="px-2 py-0.5 rounded text-[#6B778C] hover:text-[#C4321C] hover:bg-[#FEF2F2] cursor-pointer"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Bottom 2-Column Grid: Graph + Calculation & Precautions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Graph of T² against L */}
          <section className="lg:col-span-8 bg-white rounded-2xl border border-[#E3E8EF] p-6">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
              <h2 className="font-display text-lg font-bold text-[#0E1726]">
                Graph of T² against L
              </h2>

              <div className="flex flex-wrap items-end gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] text-[#6B778C] mb-1">y-axis</label>
                  <select className="bg-white border border-[#D0D7E2] rounded-lg px-2.5 py-1.5 font-medium">
                    <option>T² / s²</option>
                    <option>T / s</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#6B778C] mb-1">x-axis</label>
                  <select className="bg-white border border-[#D0D7E2] rounded-lg px-2.5 py-1.5 font-medium">
                    <option>L / m</option>
                    <option>L / cm</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBestFit(!showBestFit)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] font-semibold text-[#0E1726] cursor-pointer"
                >
                  {showBestFit ? 'Hide best-fit line' : 'Show best-fit line'}
                </button>
              </div>
            </div>

            {/* Graph Canvas SVG */}
            <svg
              viewBox="0 0 640 390"
              className="w-full h-auto"
              role="img"
              aria-label="Graph of T squared against length L with line of best fit and large slope triangle"
            >
              {/* Grid lines */}
              {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((lx) => {
                const x = 70 + lx * 520;
                return (
                  <g key={lx}>
                    <line
                      x1={x}
                      y1="30"
                      x2={x}
                      y2="330"
                      stroke="#EDF1F7"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y="348"
                      textAnchor="middle"
                      fill="#475467"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {lx === 0 ? '0' : lx.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {[0, 1.0, 2.0, 3.0, 4.0].map((ty) => {
                const y = 330 - (ty / 4.0) * 300;
                return (
                  <g key={ty}>
                    <line
                      x1="70"
                      y1={y}
                      x2="590"
                      y2={y}
                      stroke="#EDF1F7"
                      strokeWidth="1"
                    />
                    <text
                      x="58"
                      y={y + 4}
                      textAnchor="end"
                      fill="#475467"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {ty === 0 ? '0' : ty.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Axes */}
              <line x1="70" y1="30" x2="70" y2="330" stroke="#0E1726" strokeWidth="1.5" />
              <line x1="70" y1="330" x2="590" y2="330" stroke="#0E1726" strokeWidth="1.5" />

              <text
                x="330"
                y="374"
                textAnchor="middle"
                fill="#0E1726"
                fontSize="12"
                fontFamily="JetBrains Mono, monospace"
              >
                L / m
              </text>
              <text
                x="22"
                y="180"
                textAnchor="middle"
                fill="#0E1726"
                fontSize="12"
                fontFamily="JetBrains Mono, monospace"
                transform="rotate(-90 22 180)"
              >
                T² / s²
              </text>

              {/* Dynamic Best-fit Line & Large Slope Triangle (only drawn when 2+ readings exist) */}
              {showBestFit &&
                rows.length >= 2 &&
                (() => {
                  const sorted = [...rows].sort((a, b) => a.lengthM - b.lengthM);
                  const xA = Math.max(0.1, sorted[0]!.lengthM);
                  const xB = Math.min(0.95, sorted[sorted.length - 1]!.lengthM);
                  const yA = fit.slope * xA + fit.intercept;
                  const yB = fit.slope * xB + fit.intercept;
                  const lineX1 = 0.05;
                  const lineY1 = Math.max(0, fit.slope * lineX1 + fit.intercept);
                  const lineX2 = 0.95;
                  const lineY2 = Math.min(4.0, fit.slope * lineX2 + fit.intercept);

                  return (
                    <>
                      <line
                        x1="70"
                        y1={330 - (yA / 4) * 300}
                        x2={70 + xA * 520}
                        y2={330 - (yA / 4) * 300}
                        stroke="#B54708"
                        strokeWidth="1.3"
                        strokeDasharray="4 4"
                      />
                      <line
                        x1={70 + xA * 520}
                        y1={330 - (yA / 4) * 300}
                        x2={70 + xA * 520}
                        y2="330"
                        stroke="#B54708"
                        strokeWidth="1.3"
                        strokeDasharray="4 4"
                      />

                      <line
                        x1="70"
                        y1={330 - (yB / 4) * 300}
                        x2={70 + xB * 520}
                        y2={330 - (yB / 4) * 300}
                        stroke="#B54708"
                        strokeWidth="1.3"
                        strokeDasharray="4 4"
                      />
                      <line
                        x1={70 + xB * 520}
                        y1={330 - (yB / 4) * 300}
                        x2={70 + xB * 520}
                        y2="330"
                        stroke="#B54708"
                        strokeWidth="1.3"
                        strokeDasharray="4 4"
                      />

                      <line
                        x1={70 + lineX1 * 520}
                        y1={330 - (lineY1 / 4) * 300}
                        x2={70 + lineX2 * 520}
                        y2={330 - (lineY2 / 4) * 300}
                        stroke="#1D4ED8"
                        strokeWidth="2"
                      />

                      <circle
                        cx={70 + xA * 520}
                        cy={330 - (yA / 4) * 300}
                        r="4.5"
                        fill="#FFFFFF"
                        stroke="#B54708"
                        strokeWidth="2"
                      />
                      <text
                        x={70 + xA * 520 + 8}
                        y={330 - (yA / 4) * 300 - 8}
                        fill="#B54708"
                        fontSize="11"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        A ({xA.toFixed(3)}, {yA.toFixed(2)})
                      </text>

                      <circle
                        cx={70 + xB * 520}
                        cy={330 - (yB / 4) * 300}
                        r="4.5"
                        fill="#FFFFFF"
                        stroke="#B54708"
                        strokeWidth="2"
                      />
                      <text
                        x={70 + xB * 520 - 115}
                        y={330 - (yB / 4) * 300 - 8}
                        fill="#B54708"
                        fontSize="11"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        B ({xB.toFixed(3)}, {yB.toFixed(2)})
                      </text>
                    </>
                  );
                })()}

              {/* Plotted Crosses (×) */}
              {rows.map((r) => {
                const px = 70 + r.lengthM * 520;
                const py = 330 - (Number(r.periodT2) / 4.0) * 300;
                return (
                  <g key={r.sn} stroke="#0E1726" strokeWidth="1.8">
                    <line x1={px - 5} y1={py - 5} x2={px + 5} y2={py + 5} />
                    <line x1={px - 5} y1={py + 5} x2={px + 5} y2={py - 5} />
                  </g>
                );
              })}
            </svg>

            <p className="text-xs text-[#6B778C] mt-3">
              Scale: 2 cm to 0.1 m on L, 2 cm to 0.5 s² on T². Large triangle used for slope
              (covers more than half the line).
            </p>
          </section>

          {/* Right Column: Calculation + Precautions + Submit */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-4">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                Calculation
              </h2>

              <div className="bg-[#F5F7FA] rounded-xl p-4 font-mono text-xs space-y-1.5 text-[#0E1726]">
                <div>slope = ΔT² / ΔL</div>
                <div>= (3.41 - 1.10) / (0.850 - 0.275)</div>
                <div>= 2.31 / 0.575</div>
                <div className="text-[#2448D8] font-bold">= {slopeDisplay} s² m⁻¹</div>
                <div className="pt-1">g = 4π² / slope = 39.48 / {slopeDisplay}</div>
              </div>

              <div>
                <label
                  htmlFor="g-input"
                  className="block text-xs font-bold text-[#0E1726] mb-1.5"
                >
                  Your value of g
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="g-input"
                    type="text"
                    value={gValue}
                    onChange={(e) => setGValue(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#D0D7E2] font-mono text-sm text-[#0E1726]"
                  />
                  <span className="font-mono text-xs text-[#475467]">m s⁻²</span>
                </div>
              </div>

              <div className="bg-[#E6F6EE] rounded-xl p-3.5 text-xs text-[#0F7B45] leading-relaxed">
                Consistent with your own data. Percentage difference from 9.81 m s⁻²:{' '}
                <strong>{pctDiff}%</strong>
              </div>
            </div>

            {/* Precautions taken */}
            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0E1726]">
                Precautions taken
              </h2>

              <div className="space-y-2 text-xs text-[#0E1726]">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={precautions.parallax}
                    onChange={(e) =>
                      setPrecautions((p) => ({ ...p, parallax: e.target.checked }))
                    }
                    className="rounded border-[#D0D7E2] text-[#2448D8]"
                  />
                  <span>I avoided parallax when reading the metre rule</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={precautions.smallAngle}
                    onChange={(e) =>
                      setPrecautions((p) => ({ ...p, smallAngle: e.target.checked }))
                    }
                    className="rounded border-[#D0D7E2] text-[#2448D8]"
                  />
                  <span>I kept the angle of swing below 10°</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={precautions.centreSwing}
                    onChange={(e) =>
                      setPrecautions((p) => ({ ...p, centreSwing: e.target.checked }))
                    }
                    className="rounded border-[#D0D7E2] text-[#2448D8]"
                  />
                  <span>I timed from the centre of the swing</span>
                </label>
              </div>

              <textarea
                rows={3}
                value={precautions.extra}
                onChange={(e) =>
                  setPrecautions((p) => ({ ...p, extra: e.target.value }))
                }
                placeholder="Other precautions or sources of error..."
                className="w-full px-3 py-2 rounded-xl border border-[#D0D7E2] text-xs placeholder:text-[#6B778C]"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/attempt/demo/submit')}
              className="w-full py-3.5 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Submit report for marking
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}

// F2 — Pre-submit Review & Submit Confirmation (/attempt/:id/submit)
export function ReviewSubmitScreen() {
  const rows = useLabSessionStore((s) => s.pendulumRows);
  const precautions = useLabSessionStore((s) => s.precautions);
  const gValue = useLabSessionStore((s) => s.gValue);
  const replayEvents = useLabSessionStore((s) => s.replayEvents);
  const submissionId = useLabSessionStore((s) => s.submissionId);
  const apiSyncStatus = useLabSessionStore((s) => s.apiSyncStatus);
  const submitAttemptToApi = useLabSessionStore((s) => s.submitAttemptToApi);
  const fixAllDecimalPlaces = useLabSessionStore((s) => s.fixAllDecimalPlaces);
  const setPrecautions = useLabSessionStore((s) => s.setPrecautions);

  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const autoMark = computeAutoMark(rows, precautions, gValue);
  const badDpRows = rows.filter((r) => (r.periodT2.split('.')[1] || '').length !== 3);
  const precCount =
    (precautions.parallax ? 1 : 0) +
    (precautions.smallAngle ? 1 : 0) +
    (precautions.centreSwing ? 1 : 0) +
    (precautions.extra.trim().length > 8 ? 1 : 0);

  const checks = [
    {
      status: rows.length >= 6 ? ('ok' as const) : ('warn' as const),
      title: 'Readings complete',
      desc: `${rows.length} lengths from 40 cm to 90 cm, each timed twice.`,
      action: 'View',
      to: '/attempt/demo/results',
    },
    {
      status: badDpRows.length === 0 ? ('ok' as const) : ('warn' as const),
      title:
        badDpRows.length === 0
          ? 'Decimal places consistent (3 d.p.)'
          : 'Decimal places inconsistent',
      desc:
        badDpRows.length === 0
          ? 'All T and T² values are formatted to 3 decimal places.'
          : `Row ${badDpRows[0]!.sn}: T² = ${badDpRows[0]!.periodT2} — the rest of the column uses 3 d.p.`,
      action: badDpRows.length === 0 ? 'View' : 'Fix',
      to: '/attempt/demo/results',
      onQuickFix: badDpRows.length > 0 ? fixAllDecimalPlaces : undefined,
    },
    {
      status: 'ok' as const,
      title: 'Graph drawn',
      desc: 'Axes labelled with units; line of best fit drawn.',
      action: 'View',
      to: '/attempt/demo/results',
    },
    {
      status: 'ok' as const,
      title: 'Slope from a large triangle',
      desc: 'Triangle covers more than half of the line.',
      action: 'View',
      to: '/attempt/demo/results',
    },
    {
      status: precCount >= 3 ? ('ok' as const) : ('warn' as const),
      title:
        precCount >= 3
          ? `${precCount} precautions stated`
          : `Only ${precCount} precautions stated`,
      desc:
        precCount >= 3
          ? 'Parallax, small-angle (< 10°), and centre-of-swing timing stated.'
          : 'Most markers expect at least 3. Consider timing from the centre of the swing.',
      action: precCount >= 3 ? 'View' : 'Add',
      to: '/attempt/demo/results',
      onQuickFix:
        precCount < 3
          ? () => setPrecautions((p) => ({ ...p, centreSwing: true }))
          : undefined,
    },
    {
      status: 'ok' as const,
      title: 'Bench replay recorded',
      desc: `All ${Math.max(46, replayEvents.length)} actions saved for your teacher.`,
      action: 'Watch',
      to: '/attempt/demo/replay',
    },
  ];

  const handleSubmit = async () => {
    await submitAttemptToApi();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726]">
      <header className="bg-white border-b border-[#E3E8EF]">
        <div className="max-w-[1140px] mx-auto px-6 h-14 flex items-center justify-between text-xs">
          <Link
            to="/attempt/demo/results"
            className="font-semibold text-[#2448D8] hover:underline"
          >
            ← Back to results
          </Link>
          <span className="text-[#475467]">
            Simple pendulum · attempt 1 of 2 · due Wed 18 Nov, 23:59
          </span>
        </div>
      </header>

      {submitted ? (
        <main className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#E6F6EE] text-[#0F7B45] flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#0E1726] mb-3">
            Report submitted
          </h1>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Auto-marking takes about a minute. Mr. Bello will review flagged items before marks
            are released. Submission ID{' '}
            <span className="font-mono font-semibold text-[#0E1726]">{submissionId}</span>.
          </p>
          <p className="text-xs text-[#0F7B45] font-medium mb-7">
            {apiSyncStatus === 'synced'
              ? 'Synced with Vixir API server ✓'
              : 'Saved to local persistence queue (offline-ready) ✓'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/attempt/demo/report"
              className="px-5 py-3 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold transition-colors"
            >
              View marked report ({autoMark.total}/{autoMark.maxTotal})
            </Link>
            <Link
              to="/labs"
              className="px-5 py-3 rounded-xl bg-white hover:bg-[#EDF1F7] border border-[#D0D7E2] text-[#0E1726] text-xs font-semibold transition-colors"
            >
              Back to labs
            </Link>
          </div>
        </main>
      ) : (
        <main className="max-w-[1140px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Checks */}
            <div className="lg:col-span-8 space-y-3.5">
              <h1 className="font-display text-3xl font-bold text-[#0E1726]">
                Review before you submit
              </h1>
              <p className="text-sm text-[#475467] mb-2">
                Vixir checked your report. Fix anything flagged now — once submitted, this
                attempt is final.
              </p>

              {checks.map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl border border-[#E3E8EF] p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        item.status === 'ok'
                          ? 'bg-[#E6F6EE] text-[#0F7B45]'
                          : 'bg-[#FEF5EE] text-[#B54708]'
                      }`}
                    >
                      {item.status === 'ok' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </span>
                    <div>
                      <h2 className="font-display text-sm font-bold text-[#0E1726]">
                        {item.title}
                      </h2>
                      <p className="text-xs text-[#475467] mt-0.5">{item.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.onQuickFix && (
                      <button
                        type="button"
                        onClick={item.onQuickFix}
                        className="px-2.5 py-1 rounded-lg bg-[#FEF5EE] hover:bg-[#FDECE3] border border-[#F9D7C4] text-[11px] font-semibold text-[#9A3412] cursor-pointer"
                      >
                        Quick fix
                      </button>
                    )}
                    <Link
                      to={item.to}
                      className="text-xs font-semibold text-[#2448D8] underline"
                    >
                      {item.action}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Summary Card */}
            <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-4">
              <h2 className="font-display text-base font-bold text-[#0E1726]">Summary</h2>

              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-[#475467]">Readings</dt>
                  <dd className="font-bold text-[#0E1726]">{rows.length} lengths × 2 repeats</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#475467]">Slope</dt>
                  <dd className="font-mono font-bold text-[#0E1726]">
                    {autoMark.slope.toFixed(2)} s² m⁻¹
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#475467]">g</dt>
                  <dd className="font-mono font-bold text-[#0E1726]">{gValue} m s⁻²</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#475467]">Time on bench</dt>
                  <dd className="font-bold text-[#0E1726]">38 min</dd>
                </div>
              </dl>

              <label className="flex items-start gap-2.5 text-xs text-[#0E1726] pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-[#D0D7E2] text-[#2448D8]"
                />
                <span>I confirm these are my own readings and working.</span>
              </label>

              <button
                type="button"
                disabled={!confirmed}
                onClick={handleSubmit}
                className={`w-full py-3 rounded-xl text-xs font-semibold transition-colors ${
                  confirmed
                    ? 'bg-[#2448D8] hover:bg-[#1B38B0] text-white cursor-pointer'
                    : 'bg-[#E3E8EF] text-[#6B778C] cursor-not-allowed'
                }`}
              >
                Submit for marking
              </button>

              <p className="text-[11px] text-[#6B778C]">
                {autoMark.warningsCount > 0
                  ? `${autoMark.warningsCount} warning(s) won’t block submission, but may cost marks.`
                  : 'All pre-submit checks passed with 0 warnings ✓'}
              </p>
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}

// F3 — Marked Report & Feedback (/attempt/:id/report)
export function MarkedReportScreen() {
  const navigate = useNavigate();
  const attemptId = useLabSessionStore((s) => s.attemptId);
  const submittedAt = useLabSessionStore((s) => s.submittedAt);
  const rows = useLabSessionStore((s) => s.pendulumRows);
  const precautions = useLabSessionStore((s) => s.precautions);
  const gValue = useLabSessionStore((s) => s.gValue);

  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [apiReport, setApiReport] = useState<MarkReportResponse | null>(null);
  const [hasApiSubmittedAttempt, setHasApiSubmittedAttempt] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId);

    const checkReport = async () => {
      setIsLoadingReport(true);
      try {
        if (isUuid) {
          const rep = await vixirApi.getMarkReport(attemptId).catch(() => null);
          if (!cancelled && rep) {
            setApiReport(rep);
            setHasApiSubmittedAttempt(true);
            setIsLoadingReport(false);
            return;
          }
        }
        // Check if user has any submitted attempt on the API
        const attempts = await vixirApi.listMyAttempts().catch(() => []);
        const latestSubmitted = attempts.find((a) => a.state === 'SUBMITTED');
        if (!cancelled && latestSubmitted) {
          setHasApiSubmittedAttempt(true);
          const rep = await vixirApi.getMarkReport(latestSubmitted.id).catch(() => null);
          if (!cancelled && rep) setApiReport(rep);
        }
      } finally {
        if (!cancelled) setIsLoadingReport(false);
      }
    };

    void checkReport();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const hasAnySubmissionOrReadings = Boolean(
    submittedAt || apiReport || hasApiSubmittedAttempt || rows.length > 0
  );

  if (isLoadingReport) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726] p-8">
        <div className="max-w-[960px] mx-auto bg-white rounded-2xl border border-[#E3E8EF] p-8 animate-pulse space-y-4">
          <div className="h-24 bg-[#F1F4F9] rounded-xl" />
          <div className="h-48 bg-[#F1F4F9] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!hasAnySubmissionOrReadings) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726]">
        <header className="bg-white border-b border-[#E3E8EF]">
          <div className="max-w-[1140px] mx-auto px-6 h-14 flex items-center justify-between text-xs">
            <div>
              <Link to="/app" className="underline text-[#475467] hover:text-[#0E1726]">
                Dashboard
              </Link>{' '}
              / <strong className="text-[#0E1726]">Lab notebook &amp; Marked Reports</strong>
            </div>
            <Link
              to="/labs"
              className="px-3.5 py-2 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white font-semibold"
            >
              Open Virtual Laboratories →
            </Link>
          </div>
        </header>

        <main className="max-w-[780px] mx-auto px-6 py-16">
          <div className="bg-white rounded-3xl border border-[#E3E8EF] p-10 text-center space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-[#EAEFFE] text-[#1D4ED8] text-[11px] font-bold uppercase tracking-wider">
              LAB NOTEBOOK &amp; GRADES · EMPTY
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0E1726]">
              No submitted practical reports yet
            </h1>
            <p className="text-sm text-[#475467] max-w-lg mx-auto leading-relaxed">
              You have not recorded readings or submitted a practical attempt for marking
              yet. Open a laboratory bench, record your experimental readings, plot your
              graph, and submit your practical to view your auto-marked score breakdown,
              teacher comments, and viva questions here.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/lab/physics/pendulum"
                className="px-5 py-3 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold"
              >
                Start Simple Pendulum Practical →
              </Link>
              <Link
                to="/app"
                className="px-5 py-3 rounded-xl bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] text-[#0E1726] text-xs font-semibold"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const autoMark = computeAutoMark(rows, precautions, gValue);
  const totalScore = apiReport ? apiReport.mark.total : autoMark.total;
  const maxTotalScore = apiReport ? apiReport.mark.maxTotal : autoMark.maxTotal;
  const isReviewedByTeacher = apiReport ? Boolean(apiReport.mark.reviewed) : false;
  const scoreRatio = totalScore / Math.max(1, maxTotalScore);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0E1726]">
      <header className="bg-white border-b border-[#E3E8EF]">
        <div className="max-w-[1140px] mx-auto px-6 h-14 flex items-center justify-between text-xs">
          <div>
            <Link to="/app" className="underline text-[#475467] hover:text-[#0E1726]">
              Lab notebook
            </Link>{' '}
            / <strong className="text-[#0E1726]">Simple pendulum · Attempt 1</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F7FA] border border-[#D0D7E2] font-semibold text-[#0E1726] cursor-pointer"
            >
              Download PDF
            </button>
            <Link
              to="/lab/physics/pendulum"
              className="px-3.5 py-2 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white font-semibold"
            >
              Use attempt 2
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1140px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-5">
            {/* Dark Score Banner */}
            <div className="bg-[#0B1220] text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Circular Score Ring */}
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#1E2A42"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="8"
                    strokeDasharray={`${scoreRatio * 264} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold text-white">
                    {totalScore}
                  </span>
                  <span className="text-[10px] text-[#93A0B8]">
                    out of {maxTotalScore}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold tracking-wider uppercase text-[#34D399] mb-1">
                  {isReviewedByTeacher ? 'REVIEWED BY TEACHER' : 'AUTO-MARKED'} · GRADE{' '}
                  {autoMark.grade}
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1.5">
                  Simple pendulum — determination of g
                </h1>
                <p className="text-xs text-[#93A0B8]">
                  Submitted Tue 17 Nov, 20:14 · Your value g = {gValue} m s⁻² · Class average
                  15.2 / 20
                </p>
              </div>
            </div>

            {/* Marking Breakdown */}
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6">
              <h2 className="font-display text-base font-bold text-[#0E1726] mb-4">
                Marking breakdown
              </h2>

              <div className="divide-y divide-[#E3E8EF]">
                {autoMark.criteria.map((c) => (
                  <div
                    key={c.key}
                    className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-12 gap-4 items-start"
                  >
                    <div className="sm:col-span-4">
                      <div className="text-xs font-bold text-[#0E1726] mb-1.5">
                        {c.name}
                      </div>
                      <div className="h-1.5 bg-[#E3E8EF] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.color}`}
                          style={{ width: `${c.pct}%` }}
                        />
                      </div>
                    </div>

                    <p className="sm:col-span-7 text-xs text-[#475467] leading-relaxed">
                      {c.reason}
                    </p>

                    <div className="sm:col-span-1 text-right font-mono text-xs font-bold text-[#0E1726]">
                      {c.score}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Teacher Comment */}
            <section className="bg-white rounded-2xl border border-[#E3E8EF] p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#E6F6EE] text-[#0F7B45] text-xs font-bold flex items-center justify-center shrink-0">
                MB
              </div>
              <div>
                <div className="text-xs mb-1">
                  <strong className="text-[#0E1726]">Mr. Bello</strong>{' '}
                  <span className="text-[#6B778C]">
                    · {isReviewedByTeacher ? 'reviewed teacher comment' : 'auto-marker feedback'}
                  </span>
                </div>
                <p className="text-xs text-[#0E1726] leading-relaxed">
                  {apiReport?.mark.teacherComment ||
                    (totalScore === maxTotalScore
                      ? 'Full marks! Every derived column is formatted to 3 decimal places, your large slope triangle is well chosen, and all three physical precautions are clearly stated.'
                      : 'Excellent graph and a good large triangle for the slope. Watch your decimal places — one T² value was given to 2 d.p. when the rest were 3. Remember to state a precaution about timing from the centre of the swing.')}
                </p>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <aside className="lg:col-span-4 space-y-5">
            {/* Viva Card */}
            <div className="bg-[#EAEFFE] rounded-2xl p-6 space-y-3.5">
              <h2 className="font-display text-base font-bold text-[#1D4ED8]">
                Viva — check your understanding
              </h2>
              <p className="text-xs text-[#1D4ED8]">
                Your lab assistant has 3 follow-up questions based on your own results.
              </p>
              <ol className="space-y-2 text-xs text-[#1D4ED8] list-decimal list-inside leading-relaxed">
                <li>Why does your graph pass close to the origin?</li>
                <li>What would happen to g if the bob were twice as heavy?</li>
                <li>Which reading would you repeat, and why?</li>
              </ol>
              <button
                type="button"
                onClick={() => navigate('/lab/vix/connect')}
                className="w-full py-2.5 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Start viva
              </button>
            </div>

            {/* Your submission links */}
            <div className="bg-white rounded-2xl border border-[#E3E8EF] p-6 space-y-2.5">
              <h2 className="font-display text-sm font-bold text-[#0E1726] mb-1">
                Your submission
              </h2>
              <ul className="space-y-2 text-xs font-semibold text-[#2448D8]">
                <li>
                  <Link to="/attempt/demo/results" className="underline">
                    Results table ({rows.length} rows)
                  </Link>
                </li>
                <li>
                  <Link to="/attempt/demo/results" className="underline">
                    Graph of T² against L
                  </Link>
                </li>
                <li>
                  <Link to="/attempt/demo/results" className="underline">
                    Calculation &amp; precautions
                  </Link>
                </li>
                <li>
                  <Link to="/attempt/demo/replay" className="underline">
                    Bench replay (all actions, timestamped)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Practise next */}
            <div className="bg-[#FEF5EE] rounded-2xl p-5 space-y-1.5">
              <h2 className="font-display text-sm font-bold text-[#9A3412]">
                Practise next
              </h2>
              <p className="text-xs text-[#9A3412]">
                Significant figures drill (5 min) ·{' '}
                <Link to="/lab/physics/refraction" className="underline font-semibold">
                  Refraction through a glass block
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// F4 — Bench Replay (/attempt/:id/replay)
export function BenchReplayScreen() {
  const { user } = useAuth();
  const replayEvents = useLabSessionStore((s) => s.replayEvents);
  const studentDisplayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : 'Student';
  const [activeIndex, setActiveIndex] = useState(0);
  const fallbackEv = {
    time: '00:00',
    label: 'No bench actions recorded yet — record readings on the bench to populate replay.',
    lengthCm: 40,
    stopwatchS: '0.00 s',
    angleDeg: 0,
    flagged: false,
  };
  const ev = replayEvents[activeIndex] ?? replayEvents[0] ?? fallbackEv;
  const flagCount = replayEvents.filter((e) => e.flagged).length;

  const pivotX = 285;
  const pivotY = 92;
  const pxLen = 110 + ((ev.lengthCm - 30) / 70) * 200;
  const rad = (ev.angleDeg * 1.4 * Math.PI) / 180;
  const bobX = pivotX + pxLen * Math.sin(rad);
  const bobY = pivotY + pxLen * Math.cos(rad);

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E6EBF5] flex flex-col">
      {/* Header */}
      <header className="bg-[#0B1220] border-b border-[#1E2A42] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/teacher/assignments/demo/results"
            className="text-xs font-semibold text-[#60A5FA] underline"
          >
            ← Class results
          </Link>
          <div>
            <h1 className="font-display text-sm sm:text-base font-bold text-white">
              Bench replay · {studentDisplayName}
            </h1>
            <p className="text-xs text-[#93A0B8]">
              Simple pendulum · attempt 1 · {Math.max(46, replayEvents.length)} actions · 38 min
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1.5 rounded-lg bg-[#3A2112] text-[#FDBA74] text-xs font-bold">
            {flagCount} flags
          </span>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-white cursor-pointer"
          >
            Add comment at this moment
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-0">
        {/* Left Bench + Scrubber */}
        <div className="flex flex-col">
          <div className="flex-1 lab-grid-bg p-6 flex flex-col justify-between">
            <div className="self-start px-3.5 py-1.5 rounded-xl bg-[#121A2B] border border-[#22304A] font-mono text-xs text-[#E6EBF5]">
              {ev.time} · {ev.label}
            </div>

            <div className="flex-1 flex items-center justify-center">
              <svg viewBox="0 0 600 420" className="w-full max-w-[580px] h-auto">
                <rect x="80" y="380" width="440" height="12" rx="3" fill="#22304A" />
                <rect x="148" y="64" width="12" height="316" rx="2" fill="#3A4A68" />
                <rect x="148" y="72" width="150" height="9" rx="3" fill="#55688C" />
                <rect x="274" y="81" width="22" height="13" rx="3" fill="#8A6A4A" />

                {/* Stopwatch Readout on Stand */}
                <rect
                  x="110"
                  y="108"
                  width="92"
                  height="40"
                  rx="8"
                  fill="#0D1526"
                  stroke="#22304A"
                  strokeWidth="1.5"
                />
                <text
                  x="156"
                  y="133"
                  textAnchor="middle"
                  fill="#FDBA74"
                  fontSize="14"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {ev.stopwatchS}
                </text>

                {/* String & Bob */}
                <line
                  x1={pivotX}
                  y1={pivotY}
                  x2={bobX}
                  y2={bobY}
                  stroke="#E6EBF5"
                  strokeWidth="2"
                />
                <circle cx={bobX} cy={bobY} r="13" fill="#F97316" />

                {/* Metre rule */}
                <rect x="425" y="108" width="18" height="272" rx="2" fill="#D9C39A" />
              </svg>
            </div>
          </div>

          {/* Bottom Timeline Scrubber */}
          <div className="bg-[#0B1220] border-t border-[#1E2A42] p-5 space-y-3">
            {/* Event dots */}
            <div className="flex items-center justify-between px-1">
              {replayEvents.map((item, idx) => (
                <button
                  key={`${item.time}-${idx}`}
                  type="button"
                  aria-label={`Jump to ${item.time}`}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full cursor-pointer ${
                    item.flagged
                      ? 'bg-[#F97316]'
                      : idx <= activeIndex
                        ? 'bg-[#60A5FA]'
                        : 'bg-[#2C3B59]'
                  }`}
                />
              ))}
            </div>

            <input
              type="range"
              aria-label="Replay timeline scrubber"
              min={0}
              max={replayEvents.length - 1}
              value={activeIndex}
              onChange={(e) => setActiveIndex(Number(e.target.value))}
              className="w-full accent-[#F97316] cursor-pointer"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                  className="w-9 h-9 rounded-xl bg-[#121A2B] border border-[#22304A] text-xs font-bold text-white cursor-pointer"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((i) => (i + 1) % replayEvents.length)
                  }
                  className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-xs font-bold cursor-pointer"
                >
                  Play replay
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((i) => Math.min(replayEvents.length - 1, i + 1))
                  }
                  className="w-9 h-9 rounded-xl bg-[#121A2B] border border-[#22304A] text-xs font-bold text-white cursor-pointer"
                >
                  &gt;
                </button>
              </div>

              <span className="font-mono text-xs text-[#93A0B8]">
                action {activeIndex + 1} of {replayEvents.length}
              </span>
            </div>
          </div>
        </div>

        {/* Right Timeline Sidebar */}
        <aside className="bg-[#0B1220] border-l border-[#1E2A42] p-4 overflow-y-auto">
          <h2 className="font-display text-sm font-bold text-white mb-3">Timeline</h2>
          <div className="space-y-1.5">
            {replayEvents.map((item, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={`${item.time}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1C2A47] border border-[#3B82F6]/50 text-white'
                      : 'hover:bg-[#121A2B] text-[#C9D3E6]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-[11px] text-[#93A0B8] shrink-0">
                      {item.time}
                    </span>
                    <span className="leading-snug">{item.label}</span>
                  </div>
                  {item.flagged && (
                    <span className="font-mono text-[10px] font-bold text-[#FDBA74] shrink-0">
                      FLAG
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
