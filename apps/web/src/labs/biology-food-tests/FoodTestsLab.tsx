import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LabLayout } from '../../lab-shell/LabLayout';

type FoodSampleId = 'cassava' | 'glucose' | 'albumen' | 'groundnut' | 'milk';
type FoodReagentId = 'iodine' | 'benedict' | 'biuret' | 'sudan3';

interface FoodReactionOutcome {
  colorHex: string;
  topRingHex?: string;
  needsHeat?: boolean;
  observation: string;
  inference: string;
  positive: boolean;
}

interface FoodSampleConfig {
  id: FoodSampleId;
  name: string;
  nutrients: string;
  baseHex: string;
  outcomes: Record<FoodReagentId, FoodReactionOutcome>;
}

const FOOD_SAMPLES: Record<FoodSampleId, FoodSampleConfig> = {
  cassava: {
    id: 'cassava',
    name: 'Sample A · Cassava suspension',
    nutrients: 'Starch (polysaccharide)',
    baseHex: '#E2E8F0',
    outcomes: {
      iodine: {
        colorHex: '#1E1B4B',
        observation: 'Turns deep blue-black immediately on adding 2 drops of iodine solution.',
        inference: 'Starch is present (+).',
        positive: true,
      },
      benedict: {
        colorHex: '#38BDF8',
        needsHeat: true,
        observation: 'Remains light blue even after heating in a boiling water bath.',
        inference: 'Reducing sugar is absent (–).',
        positive: false,
      },
      biuret: {
        colorHex: '#60A5FA',
        observation: 'Remains pale blue with NaOH(aq) + 1% CuSO₄(aq).',
        inference: 'Protein is absent (–).',
        positive: false,
      },
      sudan3: {
        colorHex: '#FCA5A5',
        observation: 'Red dye disperses uniformly; no distinct red oil layer at top.',
        inference: 'Fats & oils absent (–).',
        positive: false,
      },
    },
  },
  glucose: {
    id: 'glucose',
    name: 'Sample B · Glucose / ripe banana extract',
    nutrients: 'Reducing sugar (monosaccharide)',
    baseHex: '#F1F5F9',
    outcomes: {
      iodine: {
        colorHex: '#D97706',
        observation: 'Retains the yellowish-brown colour of iodine solution.',
        inference: 'Starch is absent (–).',
        positive: false,
      },
      benedict: {
        colorHex: '#EA580C',
        needsHeat: true,
        observation:
          'On heating in boiling water bath: blue → green → yellow → brick-red precipitate.',
        inference: 'Reducing sugar is present (+).',
        positive: true,
      },
      biuret: {
        colorHex: '#60A5FA',
        observation: 'Remains light blue.',
        inference: 'Protein is absent (–).',
        positive: false,
      },
      sudan3: {
        colorHex: '#FCA5A5',
        observation: 'No separate red-stained oil layer formed.',
        inference: 'Lipids absent (–).',
        positive: false,
      },
    },
  },
  albumen: {
    id: 'albumen',
    name: 'Sample C · Raw egg albumen solution',
    nutrients: 'Soluble protein',
    baseHex: '#FEF9C3',
    outcomes: {
      iodine: {
        colorHex: '#D97706',
        observation: 'Yellow-brown colour of iodine persists.',
        inference: 'Starch is absent (–).',
        positive: false,
      },
      benedict: {
        colorHex: '#38BDF8',
        needsHeat: true,
        observation: 'Remains blue after heating.',
        inference: 'Reducing sugar is absent (–).',
        positive: false,
      },
      biuret: {
        colorHex: '#9333EA',
        observation: 'Turns distinct violet / purple on adding NaOH(aq) and drops of CuSO₄(aq).',
        inference: 'Protein (peptide bonds) present (+).',
        positive: true,
      },
      sudan3: {
        colorHex: '#FCA5A5',
        observation: 'No red oil ring formed.',
        inference: 'Lipids absent (–).',
        positive: false,
      },
    },
  },
  groundnut: {
    id: 'groundnut',
    name: 'Sample D · Groundnut / palm kernel extract',
    nutrients: 'Lipids (fats & oils)',
    baseHex: '#FEF08A',
    outcomes: {
      iodine: {
        colorHex: '#D97706',
        observation: 'Yellow-brown iodine layer.',
        inference: 'Starch is absent (–).',
        positive: false,
      },
      benedict: {
        colorHex: '#38BDF8',
        needsHeat: true,
        observation: 'Remains blue.',
        inference: 'Reducing sugar is absent (–).',
        positive: false,
      },
      biuret: {
        colorHex: '#60A5FA',
        observation: 'No purple colouration.',
        inference: 'Protein is absent (–).',
        positive: false,
      },
      sudan3: {
        colorHex: '#FEF08A',
        topRingHex: '#DC2626',
        observation: 'A distinct bright red-stained oil layer floats at the meniscus.',
        inference: 'Fats & oils (lipids) present (+).',
        positive: true,
      },
    },
  },
  milk: {
    id: 'milk',
    name: 'Sample X · Whole milk specimen (composite)',
    nutrients: 'Contains reducing sugar (lactose), protein (casein), and lipid',
    baseHex: '#F8FAFC',
    outcomes: {
      iodine: {
        colorHex: '#D97706',
        observation: 'Remains yellowish-brown.',
        inference: 'Starch is absent (–).',
        positive: false,
      },
      benedict: {
        colorHex: '#F97316',
        needsHeat: true,
        observation: 'Forms orange-red precipitate on heating in water bath.',
        inference: 'Reducing sugar (lactose) present (+).',
        positive: true,
      },
      biuret: {
        colorHex: '#A855F7',
        observation: 'Turns lilac-purple on mixing with Biuret reagents.',
        inference: 'Protein (casein/whey) present (+).',
        positive: true,
      },
      sudan3: {
        colorHex: '#F1F5F9',
        topRingHex: '#EF4444',
        observation: 'Red-stained cream/fat ring separates at the top of the suspension.',
        inference: 'Milk fat / lipids present (+).',
        positive: true,
      },
    },
  },
};

const FOOD_REAGENTS: { id: FoodReagentId; name: string; target: string }[] = [
  { id: 'iodine', name: 'Iodine solution (KI/I₂)', target: 'Test for Starch' },
  { id: 'benedict', name: 'Benedict’s solution + heat', target: 'Test for Reducing Sugar' },
  { id: 'biuret', name: 'Biuret (NaOH + 1% CuSO₄)', target: 'Test for Protein' },
  { id: 'sudan3', name: 'Sudan III dye', target: 'Test for Fats & Oils' },
];

interface LoggedFoodTest {
  id: number;
  sampleName: string;
  reagentName: string;
  observation: string;
  inference: string;
  positive: boolean;
}

export function FoodTestsLab() {
  const navigate = useNavigate();
  const [sampleId, setSampleId] = useState<FoodSampleId>('cassava');
  const [reagentId, setReagentId] = useState<FoodReagentId>('iodine');
  const [waterBathOn, setWaterBathOn] = useState(true);
  const [logs, setLogs] = useState<LoggedFoodTest[]>([
    {
      id: 1,
      sampleName: 'Sample A · Cassava',
      reagentName: 'Iodine solution',
      observation: 'Turns deep blue-black',
      inference: 'Starch present (+)',
      positive: true,
    },
    {
      id: 2,
      sampleName: 'Sample B · Glucose',
      reagentName: 'Benedict’s + heat',
      observation: 'Brick-red precipitate formed',
      inference: 'Reducing sugar present (+)',
      positive: true,
    },
  ]);
  const [logMsg, setLogMsg] = useState(
    'log > Added 2 drops of Iodine solution to Sample A (Cassava suspension) → blue-black complex formed.'
  );

  const sample = FOOD_SAMPLES[sampleId];
  const reagent = FOOD_REAGENTS.find((r) => r.id === reagentId) ?? FOOD_REAGENTS[0]!;
  const rawOutcome = sample.outcomes[reagentId];

  // If Benedict's test is selected but water bath is off, it stays blue until heated!
  const unheatedBenedict = reagentId === 'benedict' && !waterBathOn;
  const activeColorHex = unheatedBenedict ? '#38BDF8' : rawOutcome.colorHex;
  const activeObservation = unheatedBenedict
    ? 'Solution turns blue on adding Benedict’s solution. Switch ON the 80°C water bath to complete the reaction.'
    : rawOutcome.observation;
  const activeInference = unheatedBenedict
    ? 'Heating required for Benedict’s reduction reaction.'
    : rawOutcome.inference;

  const handleRecordTest = () => {
    const entry: LoggedFoodTest = {
      id: logs.length + 1,
      sampleName: sample.name.split('·')[0]?.trim() ?? sample.name,
      reagentName: reagent.name.split('(')[0]?.trim() ?? reagent.name,
      observation: activeObservation,
      inference: activeInference,
      positive: !unheatedBenedict && rawOutcome.positive,
    };
    setLogs((prev) => [...prev, entry]);
    setLogMsg(`log > Recorded ${entry.reagentName} on ${entry.sampleName}: ${entry.inference}`);
  };

  return (
    <LabLayout
      experimentTitle="Biochemical food tests — starch, sugar, protein & lipids"
      subtitle="Biology · Nutrition & Biochemistry · WAEC Practical Specimen Analysis"
      activeLab="biology"
      nextStepLabel="Analyse results →"
      onNextStep={() => navigate('/attempt/demo/results')}
      toolRailAccent="bg-[#122D1F] text-[#4ADE80]"
      toolRail={[
        { id: 'flask', label: 'Add reagent drops', icon: 'flask', active: true },
        {
          id: 'gauge',
          label: 'Toggle 80°C water bath',
          icon: 'gauge',
          active: waterBathOn,
          onClick: () => setWaterBathOn((w) => !w),
        },
        { id: 'note', label: 'Food test matrix', icon: 'note' },
      ]}
      leftTray={
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2">
              FOOD SPECIMEN (2 cm³)
            </div>
            <div className="space-y-1.5">
              {(['cassava', 'glucose', 'albumen', 'groundnut', 'milk'] as const).map((id) => {
                const s = FOOD_SAMPLES[id];
                const active = sampleId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSampleId(id);
                      setLogMsg(`log > Pipetted 2 cm³ of ${s.name} into clean test tube.`);
                    }}
                    className={`w-full text-left rounded-xl px-3 py-2 border text-xs transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#122D1F] border-[#22C55E] text-white'
                        : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6] hover:border-[#3A4A68]'
                    }`}
                  >
                    <div className="font-bold">{s.name}</div>
                    <div className="text-[11px] text-[#93A0B8] truncate">{s.nutrients}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2A42] space-y-1.5">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-1">
              REAGENT BOTTLES
            </div>
            {FOOD_REAGENTS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setReagentId(r.id);
                  setLogMsg(`log > Added ${r.name} to ${sample.name}.`);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs border transition-colors cursor-pointer ${
                  reagentId === r.id
                    ? 'bg-[#1C2A47] border-[#3B82F6] text-white'
                    : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6]'
                }`}
              >
                <div className="font-semibold">{r.name}</div>
                <div className="text-[11px] text-[#93A0B8]">{r.target}</div>
              </button>
            ))}
          </div>
        </div>
      }
      bottomDock={
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-[11px] font-bold uppercase text-[#60A5FA] mb-1">
              COLOUR OBSERVATION
            </div>
            <p className="text-xs text-[#E6EBF5] leading-relaxed">{activeObservation}</p>
          </div>

          <div className="md:col-span-4 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-[11px] font-bold uppercase text-[#4ADE80] mb-1">
              NUTRIENT INFERENCE
            </div>
            <p className="text-xs text-[#E6EBF5] leading-relaxed">{activeInference}</p>
          </div>

          <div className="md:col-span-3 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between gap-2">
            <button
              type="button"
              onClick={() => setWaterBathOn((w) => !w)}
              className={`w-full py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                waterBathOn
                  ? 'bg-[#3A2112] border-[#F97316] text-[#FDBA74]'
                  : 'bg-[#0B1220] border-[#22304A] text-[#93A0B8]'
              }`}
            >
              80°C Water bath: {waterBathOn ? 'ON (Heating)' : 'OFF (Cold)'}
            </button>
            <button
              type="button"
              onClick={handleRecordTest}
              className="w-full py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#0B1220] text-xs font-bold cursor-pointer"
            >
              Record observation →
            </button>
          </div>
        </div>
      }
      logMessage={logMsg}
      rightPanel={
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#93A0B8]">
              RECORDED FOOD TESTS
            </h2>
            <span className="font-mono text-xs text-[#4ADE80]">{logs.length} logged</span>
          </div>

          <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
            {logs.map((item) => (
              <div
                key={item.id}
                className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{item.sampleName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.positive
                        ? 'bg-[#122D1F] text-[#4ADE80]'
                        : 'bg-[#1E2A42] text-[#93A0B8]'
                    }`}
                  >
                    {item.positive ? 'POSITIVE +' : 'NEGATIVE –'}
                  </span>
                </div>
                <div className="text-[11px] text-[#60A5FA]">{item.reagentName}</div>
                <div className="text-[#C9D3E6]">{item.observation}</div>
                <div className="text-[#4ADE80] font-semibold">{item.inference}</div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      {/* Top Floating Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="px-3 py-1.5 rounded-xl bg-[#121A2B]/90 border border-[#22304A] font-mono text-xs text-[#E6EBF5]">
          {sample.name} + {reagent.name}
        </div>
        <div
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
            !unheatedBenedict && rawOutcome.positive
              ? 'bg-[#122D1F] border-[#22C55E] text-[#4ADE80]'
              : 'bg-[#121A2B] border-[#22304A] text-[#93A0B8]'
          }`}
        >
          {!unheatedBenedict && rawOutcome.positive
            ? `POSITIVE · ${reagent.target}`
            : `NEGATIVE / UNREACTED`}
        </div>
      </div>

      {/* Main SVG Bench: 4 Reagent Bottles + Active Test Tube in Optional Water Bath */}
      <div className="flex-1 flex items-center justify-center">
        <svg
          viewBox="0 0 640 390"
          className="w-full max-w-[640px] h-auto"
          role="img"
          aria-label="Biology food test bench with reagent bottles, water bath beaker, and active colour-changing test tube"
        >
          <rect x="40" y="340" width="560" height="14" rx="4" fill="#22304A" />

          {/* Left: 4 Reagent Dropper Bottles */}
          {FOOD_REAGENTS.map((r, idx) => {
            const bx = 75 + idx * 64;
            const active = reagentId === r.id;
            const bottleColor =
              r.id === 'iodine'
                ? '#B45309'
                : r.id === 'benedict'
                  ? '#0284C7'
                  : r.id === 'biuret'
                    ? '#6366F1'
                    : '#DC2626';
            return (
              <g
                key={r.id}
                onClick={() => setReagentId(r.id)}
                className="cursor-pointer"
              >
                <rect
                  x={bx}
                  y="245"
                  width="46"
                  height="95"
                  rx="8"
                  fill="#17253B"
                  stroke={active ? '#4ADE80' : '#3A4A68'}
                  strokeWidth={active ? '2.2' : '1.4'}
                />
                <rect
                  x={bx + 4}
                  y="280"
                  width="38"
                  height="55"
                  rx="5"
                  fill={bottleColor}
                  opacity="0.85"
                />
                <rect x={bx + 15} y="226" width="16" height="19" rx="3" fill="#475569" />
                <ellipse cx={bx + 23} cy="218" rx="7" ry="11" fill="#F97316" />
                <text
                  x={bx + 23}
                  y="308"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  {r.id.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Right: Reaction Stage (with 250 cm³ Water Bath Beaker when waterBathOn && benedict) */}
          <g transform="translate(465, 90)">
            {waterBathOn && reagentId === 'benedict' && (
              <g>
                {/* 250 cm³ Water Bath Beaker around the test tube */}
                <rect
                  x="-70"
                  y="75"
                  width="140"
                  height="165"
                  rx="10"
                  fill="rgba(56, 189, 248, 0.12)"
                  stroke="#94A3B8"
                  strokeWidth="2"
                />
                <rect
                  x="-67"
                  y="115"
                  width="134"
                  height="122"
                  rx="8"
                  fill="rgba(56, 189, 248, 0.18)"
                />
                <text
                  x="-58"
                  y="102"
                  fill="#FDBA74"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  80°C Water Bath
                </text>
                {/* Hotplate base */}
                <rect x="-78" y="240" width="156" height="10" rx="3" fill="#EA580C" />
              </g>
            )}

            {/* Active Specimen Test Tube */}
            <rect
              x="-26"
              y="10"
              width="52"
              height="215"
              rx="26"
              fill="rgba(255,255,255,0.06)"
              stroke="#E2E8F0"
              strokeWidth="2.2"
            />
            <ellipse
              cx="0"
              cy="12"
              rx="29"
              ry="4.5"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="2"
            />

            {/* Liquid column inside test tube */}
            <rect
              x="-23"
              y="100"
              width="46"
              height="122"
              rx="22"
              fill={activeColorHex}
              opacity="0.92"
            />

            {/* Optional Sudan III red lipid ring at meniscus */}
            {rawOutcome.topRingHex && (
              <g>
                <rect
                  x="-23"
                  y="98"
                  width="46"
                  height="18"
                  rx="6"
                  fill={rawOutcome.topRingHex}
                />
                <text
                  x="38"
                  y="110"
                  fill="#F87171"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  ← Sudan III red lipid layer
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>
    </LabLayout>
  );
}
