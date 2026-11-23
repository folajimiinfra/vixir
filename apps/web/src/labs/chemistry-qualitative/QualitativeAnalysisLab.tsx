import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LabLayout } from '../../lab-shell/LabLayout';

type SaltId = 'C' | 'D' | 'E' | 'F';
type ReagentId =
  | 'naoh_drop'
  | 'naoh_excess'
  | 'nh3_drop'
  | 'nh3_excess'
  | 'bacl2_hcl'
  | 'agno3_hno3'
  | 'heat_dry';

interface SaltReaction {
  tubeFill: string;
  pptColor: string | null;
  gasText: string | null;
  observation: string;
  inference: string;
}

interface SaltSample {
  id: SaltId;
  code: string;
  formula: string;
  appearance: string;
  baseSolutionColor: string;
  reactions: Record<ReagentId, SaltReaction>;
}

const SALT_SAMPLES: Record<SaltId, SaltSample> = {
  C: {
    id: 'C',
    code: 'Sample C (WAEC specimen)',
    formula: 'CuSO₄ · 5H₂O',
    appearance: 'Blue crystalline solid; dissolves in water to form a pale blue solution',
    baseSolutionColor: '#38BDF8',
    reactions: {
      naoh_drop: {
        tubeFill: '#38BDF8',
        pptColor: '#0284C7',
        gasText: null,
        observation: 'Light blue gelatinous precipitate formed.',
        inference: 'Cu²⁺ ions present.',
      },
      naoh_excess: {
        tubeFill: '#38BDF8',
        pptColor: '#0284C7',
        gasText: null,
        observation: 'Light blue precipitate is insoluble in excess NaOH(aq).',
        inference: 'Cu²⁺ confirmed.',
      },
      nh3_drop: {
        tubeFill: '#38BDF8',
        pptColor: '#0369A1',
        gasText: null,
        observation: 'Pale blue precipitate formed on adding a few drops of NH₃(aq).',
        inference: 'Cu²⁺ ions present.',
      },
      nh3_excess: {
        tubeFill: '#1D4ED8',
        pptColor: null,
        gasText: null,
        observation: 'Precipitate dissolves in excess NH₃(aq) to give a deep blue solution.',
        inference: '[Cu(NH₃)₄]²⁺ complex formed — Cu²⁺ confirmed.',
      },
      bacl2_hcl: {
        tubeFill: '#7DD3FC',
        pptColor: '#F8FAFC',
        gasText: null,
        observation: 'Thick white precipitate formed; insoluble in excess dilute HCl.',
        inference: 'SO₄²⁻ (tetraoxosulphate(VI) ion) confirmed.',
      },
      agno3_hno3: {
        tubeFill: '#38BDF8',
        pptColor: null,
        gasText: null,
        observation: 'No visible precipitate with AgNO₃(aq) + dilute HNO₃.',
        inference: 'Cl⁻, Br⁻, I⁻ absent.',
      },
      heat_dry: {
        tubeFill: '#E2E8F0',
        pptColor: '#F1F5F9',
        gasText: 'Colourless droplets condense at top of tube',
        observation: 'Blue crystals turn white amorphous powder; water droplets condense.',
        inference: 'Hydrated salt (water of crystallisation present).',
      },
    },
  },
  D: {
    id: 'D',
    code: 'Sample D (Iron(II) salt)',
    formula: 'FeSO₄ · 7H₂O',
    appearance: 'Pale green crystals; dissolves to form a pale green aqueous solution',
    baseSolutionColor: '#86EFAC',
    reactions: {
      naoh_drop: {
        tubeFill: '#86EFAC',
        pptColor: '#15803D',
        gasText: null,
        observation: 'Dirty green gelatinous precipitate formed.',
        inference: 'Fe²⁺ ions present.',
      },
      naoh_excess: {
        tubeFill: '#86EFAC',
        pptColor: '#166534',
        gasText: 'Turns reddish-brown at rim on standing in air',
        observation: 'Dirty green precipitate insoluble in excess; oxidises to brown at top.',
        inference: 'Fe²⁺ confirmed (aerial oxidation to Fe³⁺).',
      },
      nh3_drop: {
        tubeFill: '#86EFAC',
        pptColor: '#15803D',
        gasText: null,
        observation: 'Dirty green precipitate formed.',
        inference: 'Fe²⁺ ions present.',
      },
      nh3_excess: {
        tubeFill: '#86EFAC',
        pptColor: '#15803D',
        gasText: null,
        observation: 'Dirty green precipitate insoluble in excess NH₃(aq).',
        inference: 'Fe²⁺ confirmed.',
      },
      bacl2_hcl: {
        tubeFill: '#BBF7D0',
        pptColor: '#F8FAFC',
        gasText: null,
        observation: 'White precipitate formed; insoluble in dilute HCl.',
        inference: 'SO₄²⁻ confirmed.',
      },
      agno3_hno3: {
        tubeFill: '#86EFAC',
        pptColor: null,
        gasText: null,
        observation: 'No visible reaction.',
        inference: 'Halide ions absent.',
      },
      heat_dry: {
        tubeFill: '#9A3412',
        pptColor: '#7C2D12',
        gasText: 'Choking SO₂ / SO₃ fumes turn moist blue litmus red',
        observation: 'Green crystals turn brown residue with acidic choking fumes.',
        inference: 'Decomposes to Fe₂O₃ + SO₂ + SO₃.',
      },
    },
  },
  E: {
    id: 'E',
    code: 'Sample E (Amphoteric / carbonate)',
    formula: 'ZnCl₂(aq)',
    appearance: 'White deliquescent solid; colourless aqueous solution',
    baseSolutionColor: '#CBD5E1',
    reactions: {
      naoh_drop: {
        tubeFill: '#CBD5E1',
        pptColor: '#F8FAFC',
        gasText: null,
        observation: 'White gelatinous precipitate formed.',
        inference: 'Zn²⁺, Al³⁺, or Pb²⁺ present.',
      },
      naoh_excess: {
        tubeFill: '#E2E8F0',
        pptColor: null,
        gasText: null,
        observation: 'White precipitate dissolves in excess NaOH(aq) to form a colourless solution.',
        inference: 'Zn²⁺, Al³⁺, or Pb²⁺ (amphoteric hydroxide).',
      },
      nh3_drop: {
        tubeFill: '#CBD5E1',
        pptColor: '#F8FAFC',
        gasText: null,
        observation: 'White gelatinous precipitate formed.',
        inference: 'Zn²⁺ or Al³⁺ present.',
      },
      nh3_excess: {
        tubeFill: '#E2E8F0',
        pptColor: null,
        gasText: null,
        observation: 'White precipitate dissolves readily in excess NH₃(aq).',
        inference: 'Zn²⁺ confirmed ([Zn(NH₃)₄]²⁺).',
      },
      bacl2_hcl: {
        tubeFill: '#CBD5E1',
        pptColor: null,
        gasText: null,
        observation: 'No precipitate formed.',
        inference: 'SO₄²⁻ absent.',
      },
      agno3_hno3: {
        tubeFill: '#CBD5E1',
        pptColor: '#F8FAFC',
        gasText: 'Soluble in excess NH₃(aq)',
        observation: 'Curdy white precipitate insoluble in dilute HNO₃.',
        inference: 'Cl⁻ (chloride ion) confirmed.',
      },
      heat_dry: {
        tubeFill: '#F8FAFC',
        pptColor: '#E2E8F0',
        gasText: null,
        observation: 'White solid fuses on gentle heating.',
        inference: 'Stable zinc halide salt.',
      },
    },
  },
  F: {
    id: 'F',
    code: 'Sample F (Ammonium halide)',
    formula: 'NH₄Cl',
    appearance: 'White crystalline powder; colourless aqueous solution',
    baseSolutionColor: '#CBD5E1',
    reactions: {
      naoh_drop: {
        tubeFill: '#CBD5E1',
        pptColor: null,
        gasText: null,
        observation: 'No precipitate formed in the cold.',
        inference: 'Metallic cations forming insoluble hydroxides absent.',
      },
      naoh_excess: {
        tubeFill: '#CBD5E1',
        pptColor: null,
        gasText: 'NH₃ gas turns moist red litmus blue + dense white fumes with HCl',
        observation: 'On warming with NaOH(aq), colourless gas with choking smell evolved.',
        inference: 'NH₄⁺ (ammonium ion) confirmed.',
      },
      nh3_drop: {
        tubeFill: '#CBD5E1',
        pptColor: null,
        gasText: null,
        observation: 'No visible change.',
        inference: 'No reaction with aqueous ammonia.',
      },
      nh3_excess: {
        tubeFill: '#CBD5E1',
        pptColor: null,
        gasText: null,
        observation: 'No visible change.',
        inference: 'No precipitate.',
      },
      bacl2_hcl: {
        tubeFill: '#CBD5E1',
        pptColor: null,
        gasText: null,
        observation: 'No precipitate.',
        inference: 'SO₄²⁻ absent.',
      },
      agno3_hno3: {
        tubeFill: '#CBD5E1',
        pptColor: '#F8FAFC',
        gasText: null,
        observation: 'White precipitate insoluble in dilute HNO₃, soluble in NH₃(aq).',
        inference: 'Cl⁻ confirmed.',
      },
      heat_dry: {
        tubeFill: '#F8FAFC',
        pptColor: '#FFFFFF',
        gasText: 'White sublimate forms on cool upper walls of boiling tube',
        observation: 'Solid sublimes without melting and re-deposits on cooler upper glass.',
        inference: 'Sublimable ammonium salt (NH₄Cl).',
      },
    },
  },
};

const REAGENTS: { id: ReagentId; label: string; short: string }[] = [
  { id: 'naoh_drop', label: '+ NaOH(aq) dropwise', short: 'NaOH (drops)' },
  { id: 'naoh_excess', label: '+ NaOH(aq) in excess / warm', short: 'NaOH (excess)' },
  { id: 'nh3_drop', label: '+ NH₃(aq) dropwise', short: 'NH₃ (drops)' },
  { id: 'nh3_excess', label: '+ NH₃(aq) in excess', short: 'NH₃ (excess)' },
  { id: 'bacl2_hcl', label: '+ BaCl₂(aq) + dil. HCl', short: 'BaCl₂ / HCl' },
  { id: 'agno3_hno3', label: '+ AgNO₃(aq) + dil. HNO₃', short: 'AgNO₃ / HNO₃' },
  { id: 'heat_dry', label: 'Heat dry solid in boiling tube', short: 'Dry heat' },
];

interface RecordedObservation {
  id: number;
  sampleId: SaltId;
  test: string;
  observation: string;
  inference: string;
}

export function QualitativeAnalysisLab() {
  const navigate = useNavigate();
  const [sampleId, setSampleId] = useState<SaltId>('C');
  const [activeReagent, setActiveReagent] = useState<ReagentId>('nh3_excess');
  const [litmusPlaced, setLitmusPlaced] = useState(true);
  const [records, setRecords] = useState<RecordedObservation[]>([]);
  const [logMsg, setLogMsg] = useState(
    'log > Added excess NH₃(aq) to Sample C portion — pale blue ppt dissolved to form a deep royal-blue solution.'
  );

  const sample = SALT_SAMPLES[sampleId];
  const reaction = sample.reactions[activeReagent];
  const reagentObj = REAGENTS.find((r) => r.id === activeReagent) ?? REAGENTS[0]!;

  const handleRecordEntry = () => {
    const next: RecordedObservation = {
      id: records.length + 1,
      sampleId,
      test: `${sampleId}(aq) ${reagentObj.label}`,
      observation: reaction.observation,
      inference: reaction.inference,
    };
    setRecords((prev) => [...prev, next]);
    setLogMsg(`log > Logged Test / Observation / Inference #${next.id} for Sample ${sampleId}.`);
  };

  return (
    <LabLayout
      experimentTitle="Qualitative analysis of inorganic salts"
      subtitle="Chemistry · Cation & anion identification · WAEC Test / Observation / Inference"
      activeLab="chemistry"
      nextStepLabel="Analyse results →"
      onNextStep={() => navigate('/attempt/demo/results')}
      toolRailAccent="bg-[#3A2112] text-[#FDBA74]"
      toolRail={[
        { id: 'flask', label: 'Reagent dropper', icon: 'flask', active: true },
        {
          id: 'alert',
          label: 'Moist red/blue litmus paper',
          icon: 'alert',
          active: litmusPlaced,
          onClick: () => setLitmusPlaced((v) => !v),
        },
        { id: 'note', label: 'Observation table', icon: 'note' },
      ]}
      leftTray={
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2">
              UNKNOWN SALT SPECIMEN
            </div>
            <div className="space-y-1.5">
              {(['C', 'D', 'E', 'F'] as const).map((id) => {
                const s = SALT_SAMPLES[id];
                const active = sampleId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSampleId(id);
                      setLogMsg(`log > Selected ${s.code} on test-tube rack.`);
                    }}
                    className={`w-full text-left rounded-xl px-3 py-2 border text-xs transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#3A2112] border-[#F97316] text-white'
                        : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6] hover:border-[#3A4A68]'
                    }`}
                  >
                    <div className="font-bold">{s.code}</div>
                    <div className="text-[11px] text-[#93A0B8] truncate">{s.appearance}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2A42] space-y-1.5">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-1">
              BENCH REAGENTS
            </div>
            {REAGENTS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setActiveReagent(r.id);
                  setLogMsg(
                    `log > Applied "${r.label}" to Sample ${sampleId}: ${sample.reactions[r.id].observation}`
                  );
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                  activeReagent === r.id
                    ? 'bg-[#1C2A47] border-[#3B82F6] text-[#60A5FA] font-semibold'
                    : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6] hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      }
      bottomDock={
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-[11px] font-bold uppercase text-[#FDBA74] mb-1">
              OBSERVATION ({sample.code} · {reagentObj.short})
            </div>
            <p className="text-xs text-[#E6EBF5] leading-relaxed">{reaction.observation}</p>
          </div>

          <div className="md:col-span-4 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-[11px] font-bold uppercase text-[#4ADE80] mb-1">
              CHEMICAL INFERENCE
            </div>
            <p className="text-xs text-[#E6EBF5] leading-relaxed">{reaction.inference}</p>
          </div>

          <div className="md:col-span-3 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between gap-2">
            <button
              type="button"
              onClick={() => setLitmusPlaced((l) => !l)}
              className="w-full py-1.5 rounded-lg bg-[#0B1220] border border-[#22304A] text-xs font-semibold text-[#C9D3E6] cursor-pointer"
            >
              {litmusPlaced ? 'Moist litmus at mouth ✓' : 'Hold moist litmus at mouth'}
            </button>
            <button
              type="button"
              onClick={handleRecordEntry}
              className="w-full py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-[#0B1220] text-xs font-bold cursor-pointer"
            >
              Record in table →
            </button>
          </div>
        </div>
      }
      logMessage={logMsg}
      rightPanel={
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#93A0B8]">
                TEST / OBSERVATION / INFERENCE
              </h2>
              <span className="font-mono text-xs text-[#FDBA74]">
                {records.length} entries
              </span>
            </div>

            <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#FDBA74]">{rec.test}</span>
                    <span className="font-mono text-[10px] text-[#93A0B8]">#{rec.id}</span>
                  </div>
                  <div className="text-[#C9D3E6]">
                    <strong className="text-[#93A0B8]">Obs:</strong> {rec.observation}
                  </div>
                  <div className="text-[#4ADE80]">
                    <strong>Inf:</strong> {rec.inference}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      {/* Top Floating Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="px-3 py-1.5 rounded-xl bg-[#121A2B]/90 border border-[#22304A] font-mono text-xs text-[#E6EBF5]">
          {sample.code} · Active test: {reagentObj.label}
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-[#121A2B]/90 border border-[#22304A] text-xs text-[#4ADE80]">
          Confirmed identity: {sample.formula}
        </div>
      </div>

      {/* Main Test-Tube Rack & Active Reaction Tube SVG */}
      <div className="flex-1 flex items-center justify-center">
        <svg
          viewBox="0 0 640 390"
          className="w-full max-w-[640px] h-auto"
          role="img"
          aria-label="Qualitative analysis test tube rack with reagent dropper, precipitate formation, and moist litmus paper"
        >
          {/* Bench Top */}
          <rect x="40" y="340" width="560" height="14" rx="4" fill="#22304A" />

          {/* Wooden Test-Tube Rack on Left (4 sample portions) */}
          <rect x="65" y="210" width="240" height="12" rx="3" fill="#8A6A4A" />
          <rect x="65" y="328" width="240" height="12" rx="3" fill="#8A6A4A" />
          <rect x="75" y="222" width="10" height="106" fill="#6E5236" />
          <rect x="285" y="222" width="10" height="106" fill="#6E5236" />

          {(['C', 'D', 'E', 'F'] as const).map((id, idx) => {
            const tx = 115 + idx * 46;
            const s = SALT_SAMPLES[id];
            const isSelected = sampleId === id;
            return (
              <g
                key={id}
                onClick={() => setSampleId(id)}
                className="cursor-pointer"
              >
                <rect
                  x={tx - 12}
                  y="175"
                  width="24"
                  height="145"
                  rx="12"
                  fill="rgba(255,255,255,0.06)"
                  stroke={isSelected ? '#F97316' : '#64748B'}
                  strokeWidth={isSelected ? '2.2' : '1.4'}
                />
                <rect
                  x={tx - 10}
                  y="255"
                  width="20"
                  height="63"
                  rx="9"
                  fill={s.baseSolutionColor}
                  opacity="0.75"
                />
                <text
                  x={tx}
                  y="162"
                  textAnchor="middle"
                  fill={isSelected ? '#FDBA74' : '#93A0B8'}
                  fontSize="12"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  {id}
                </text>
              </g>
            );
          })}

          {/* Active Inspection Boiling Tube (Center-Right, magnified) */}
          <g transform="translate(430, 85)">
            {/* Dropper Pipette above tube */}
            <rect x="-5" y="-55" width="10" height="32" rx="3" fill="#F97316" />
            <polygon points="-3,-23 3,-23 1.5,5 -1.5,5" fill="#94A3B8" />
            <circle cx="0" cy="18" r="4" fill="#38BDF8" />
            <circle cx="0" cy="36" r="3.5" fill="#38BDF8" />

            {/* Moist Litmus strip at mouth of tube */}
            {litmusPlaced && (
              <g transform="translate(22, 16)">
                <rect
                  x="0"
                  y="0"
                  width="36"
                  height="10"
                  rx="2"
                  fill={
                    activeReagent === 'naoh_excess' && sampleId === 'F'
                      ? '#3B82F6'
                      : activeReagent === 'heat_dry' && sampleId === 'D'
                        ? '#EF4444'
                        : '#F43F5E'
                  }
                />
                <text x="44" y="9" fill="#93A0B8" fontSize="10">
                  Moist litmus
                </text>
              </g>
            )}

            {/* Boiling Tube Outline */}
            <rect
              x="-28"
              y="20"
              width="56"
              height="215"
              rx="28"
              fill="rgba(255,255,255,0.05)"
              stroke="#CBD5E1"
              strokeWidth="2.2"
            />
            {/* Rim */}
            <ellipse
              cx="0"
              cy="22"
              rx="31"
              ry="5"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="2"
            />

            {/* Solution fill */}
            <rect
              x="-25"
              y="110"
              width="50"
              height="122"
              rx="24"
              fill={reaction.tubeFill}
              opacity="0.82"
            />

            {/* Gelatinous / Crystalline Precipitate Cloud at Bottom */}
            {reaction.pptColor && (
              <g>
                <ellipse
                  cx="0"
                  cy="202"
                  rx="22"
                  ry="24"
                  fill={reaction.pptColor}
                  opacity="0.95"
                />
                <circle cx="-10" cy="184" r="9" fill={reaction.pptColor} opacity="0.85" />
                <circle cx="11" cy="188" r="8" fill={reaction.pptColor} opacity="0.85" />
                <text
                  x="44"
                  y="204"
                  fill="#FDBA74"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  ← Precipitate
                </text>
              </g>
            )}

            {/* Gas bubbles / sublimate callout */}
            {reaction.gasText && (
              <g>
                <circle cx="-8" cy="145" r="3" fill="#FFFFFF" opacity="0.8" />
                <circle cx="6" cy="125" r="3.5" fill="#FFFFFF" opacity="0.8" />
                <circle cx="-4" cy="95" r="4" fill="#FFFFFF" opacity="0.7" />
                <text
                  x="-115"
                  y="75"
                  fill="#FDBA74"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {reaction.gasText}
                </text>
              </g>
            )}

            {/* Bunsen Flame when 'heat_dry' is selected */}
            {activeReagent === 'heat_dry' && (
              <g transform="translate(0, 245)">
                <ellipse cx="0" cy="0" rx="14" ry="22" fill="#F97316" opacity="0.85" />
                <ellipse cx="0" cy="4" rx="7" ry="13" fill="#38BDF8" opacity="0.9" />
              </g>
            )}
          </g>
        </svg>
      </div>
    </LabLayout>
  );
}
