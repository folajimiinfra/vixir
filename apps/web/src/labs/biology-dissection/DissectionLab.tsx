import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LabLayout } from '../../lab-shell/LabLayout';

type DissectionStep = 1 | 2 | 3 | 4 | 5;
type InstrumentId = 'pins' | 'scalpel' | 'scissors' | 'lens' | 'seeker';
type OrganId =
  | 'heart'
  | 'lungs'
  | 'liver'
  | 'stomach'
  | 'small-intestine'
  | 'caecum'
  | 'kidneys'
  | 'urinary-bladder';

interface OrganDetail {
  id: OrganId;
  name: string;
  system: string;
  description: string;
  spotIt: string;
}

const ORGANS: OrganDetail[] = [
  {
    id: 'heart',
    name: 'Heart',
    system: 'CIRCULATORY SYSTEM',
    description: 'Four-chambered muscular pump that circulates oxygenated blood to the body and deoxygenated blood to the lungs.',
    spotIt: 'conical red organ between the pink lungs in the thorax',
  },
  {
    id: 'lungs',
    name: 'Lungs',
    system: 'RESPIRATORY SYSTEM',
    description: 'Spongy pink lobes where gas exchange of oxygen and carbon dioxide takes place across alveoli.',
    spotIt: 'paired pale-pink lobes on either side of the heart',
  },
  {
    id: 'liver',
    name: 'Liver',
    system: 'DIGESTIVE SYSTEM',
    description: 'Makes bile, stores glycogen and removes toxins.',
    spotIt: 'largest organ, dark red-brown, just below the diaphragm',
  },
  {
    id: 'stomach',
    name: 'Stomach',
    system: 'DIGESTIVE SYSTEM',
    description: 'J-shaped muscular sac that churns food with hydrochloric acid and pepsin.',
    spotIt: 'pale cream sac tucked beneath the left lobe of the liver',
  },
  {
    id: 'small-intestine',
    name: 'Small intestine',
    system: 'DIGESTIVE SYSTEM',
    description: 'Long coiled tube (duodenum and ileum) where digestion finishes and nutrients are absorbed.',
    spotIt: 'pink folded loops filling the centre of the abdomen',
  },
  {
    id: 'caecum',
    name: 'Caecum',
    system: 'DIGESTIVE SYSTEM',
    description: 'Large blind-ending sac containing bacteria that break down cellulose in herbivorous and omnivorous mammals.',
    spotIt: 'olive-brown pouch on the lower left of the abdominal cavity',
  },
  {
    id: 'kidneys',
    name: 'Kidneys',
    system: 'EXCRETORY SYSTEM',
    description: 'Filter urea, excess water and salts from the blood to form urine.',
    spotIt: 'bean-shaped dark red organs against the dorsal body wall',
  },
  {
    id: 'urinary-bladder',
    name: 'Urinary bladder',
    system: 'EXCRETORY SYSTEM',
    description: 'Collects and stores urine received from the kidneys via the ureters.',
    spotIt: 'small rounded pale sac at the posterior end of the abdomen',
  },
];

const STEP_BANNERS: Record<DissectionStep, string> = {
  1: 'Step 1 — choose the right instrument to fix the specimen to the tray.',
  2: 'Step 2 — select the scalpel to make a shallow midline incision.',
  3: 'Step 3 — use scissors & forceps to lift and open the body wall.',
  4: 'Step 4 — use the hand lens and the list to identify each organ.',
  5: 'Step 5 — trace vessels with the seeker and review your labelled diagram.',
};

export function DissectionLab() {
  const navigate = useNavigate();
  const [step, setStep] = useState<DissectionStep>(4);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>('lens');
  const [selectedOrgan, setSelectedOrgan] = useState<OrganId>('liver');
  const [panelMode, setPanelMode] = useState<'learn' | 'quiz'>('learn');

  const isOpened = step >= 3;
  const activeOrgan = ORGANS.find((o) => o.id === selectedOrgan) ?? ORGANS[2]!;

  const handleSelectInstrument = (inst: InstrumentId) => {
    setSelectedInstrument(inst);
    if (inst === 'pins' && step === 1) setStep(2);
    else if (inst === 'scalpel' && step === 2) setStep(3);
    else if (inst === 'scissors' && step === 3) setStep(4);
    else if (inst === 'lens' && step < 4) setStep(4);
    else if (inst === 'seeker') setStep(5);
  };

  return (
    <LabLayout
      experimentTitle="Dissection of a mammal (rat) — ventral view"
      subtitle="Biology · virtual specimen · no animal is harmed"
      activeLab="biology"
      mode="practice"
      headerRightExtra={
        <div className="hidden sm:flex items-center gap-2">
          <Link
            to="/lab/biology/digestion"
            className="px-3.5 py-1.5 rounded-full bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors"
          >
            Digestion
          </Link>
          <Link
            to="/lab/biology/body-systems"
            className="px-3.5 py-1.5 rounded-full bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors"
          >
            Body systems
          </Link>
        </div>
      }
      leftTray={
        <div className="flex flex-col justify-between h-full gap-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2.5">
              INSTRUMENTS — PICK THE RIGHT ONE
            </div>
            <div className="space-y-2">
              {[
                { id: 'pins' as const, name: 'Dissecting pins', sub: 'hold the specimen flat' },
                { id: 'scalpel' as const, name: 'Scalpel', sub: 'make the first shallow cut' },
                {
                  id: 'scissors' as const,
                  name: 'Scissors & forceps',
                  sub: 'lift and open the body wall',
                },
                { id: 'lens' as const, name: 'Hand lens', sub: 'examine small structures' },
                { id: 'seeker' as const, name: 'Seeker / probe', sub: 'trace tubes and vessels' },
              ].map((inst) => {
                const active = selectedInstrument === inst.id;
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => handleSelectInstrument(inst.id)}
                    className={`w-full text-left rounded-xl px-3 py-2.5 border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#122D1F] border-[#4ADE80] text-[#E6EBF5]'
                        : 'bg-[#121A2B] border-[#22304A] text-[#E6EBF5] hover:border-[#3A4A68]'
                    }`}
                  >
                    <div className="text-xs font-semibold">{inst.name}</div>
                    <div className="text-[11px] text-[#93A0B8]">{inst.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 text-[11px] text-[#93A0B8] leading-relaxed">
            In a real lab: wear gloves, cut away from yourself, and keep the scalpel blade
            shallow so you don’t damage the organs beneath.
          </div>
        </div>
      }
      bottomDock={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { s: 1, label: '1 Pin the specimen' },
                { s: 2, label: '2 Midline cut' },
                { s: 3, label: '3 Open body wall' },
                { s: 4, label: '4 Identify organs' },
                { s: 5, label: '5 Draw & label' },
              ] as const
            ).map((item) => {
              const isCurrent = step === item.s;
              const isDone = step > item.s;
              return (
                <button
                  key={item.s}
                  type="button"
                  onClick={() => setStep(item.s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#4ADE80] text-[#0B1220]'
                      : isDone
                        ? 'bg-[#122D1F] text-[#4ADE80] border border-[#166534]'
                        : 'bg-[#121A2B] text-[#93A0B8] border border-[#22304A]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setStep((prev) => (prev < 5 ? ((prev + 1) as DissectionStep) : 1))}
            className="px-4 py-1.5 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#0B1220] text-xs font-bold transition-colors cursor-pointer"
          >
            Next step →
          </button>
        </div>
      }
      rightPanel={
        <div className="flex flex-col justify-between h-full gap-4">
          <div className="space-y-3.5">
            {/* Learn / Quiz toggle */}
            <div className="bg-[#121A2B] border border-[#22304A] p-1 rounded-xl grid grid-cols-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPanelMode('learn')}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  panelMode === 'learn'
                    ? 'bg-[#4ADE80] text-[#0B1220]'
                    : 'text-[#93A0B8] hover:text-[#E6EBF5]'
                }`}
              >
                Learn
              </button>
              <button
                type="button"
                onClick={() => setPanelMode('quiz')}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  panelMode === 'quiz'
                    ? 'bg-[#4ADE80] text-[#0B1220]'
                    : 'text-[#93A0B8] hover:text-[#E6EBF5]'
                }`}
              >
                Quiz me
              </button>
            </div>

            {/* Organ Grid */}
            <div className="grid grid-cols-2 gap-2">
              {ORGANS.map((org) => {
                const isSelected = selectedOrgan === org.id && isOpened;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      if (!isOpened) setStep(4);
                      setSelectedOrgan(org.id);
                    }}
                    className={`text-left px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#122D1F] border-[#4ADE80] text-[#E6EBF5] font-semibold'
                        : isOpened
                          ? 'bg-[#121A2B] border-[#22304A] text-[#E6EBF5] hover:border-[#3A4A68]'
                          : 'bg-[#121A2B]/60 border-[#1E2A42] text-[#6B778C]'
                    }`}
                  >
                    {org.name}
                  </button>
                );
              })}
            </div>

            {/* Organ info card */}
            {isOpened ? (
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-bold tracking-wider uppercase text-[#4ADE80]">
                  {activeOrgan.system}
                </div>
                <h2 className="font-display text-lg font-bold text-white">
                  {activeOrgan.name}
                </h2>
                <p className="text-xs text-[#C9D3E6] leading-relaxed">
                  {activeOrgan.description}
                </p>
                <p className="text-xs text-[#93A0B8] leading-relaxed pt-1">
                  <strong className="text-[#E6EBF5]">Spot it:</strong> {activeOrgan.spotIt}
                </p>
              </div>
            ) : (
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 text-xs text-[#93A0B8] leading-relaxed">
                Organs unlock after you open the body cavity (step 4). Click “4 Identify organs”
                below or use the instruments in order.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/lab/biology/body-systems')}
            className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Compare with the human body →
          </button>
        </div>
      }
    >
      {/* Top Instruction Banner */}
      <div className="bg-[#121A2B]/90 border border-[#22304A] rounded-xl py-2 px-4 text-center text-xs font-semibold text-[#E6EBF5] z-10">
        {STEP_BANNERS[step]}
      </div>

      {/* Main Dissection Wax Tray SVG matching D4-biology-rat-dissection-opened.svg */}
      <div className="flex-1 flex items-center justify-center my-2">
        <svg
          viewBox="0 0 600 520"
          className="w-full max-w-[540px] h-auto max-h-[450px]"
          role="img"
          aria-label={`Rat specimen pinned on a dissecting tray, step ${step} of 5`}
        >
          {/* Wax Dissecting Tray */}
          <rect
            x="40"
            y="24"
            width="520"
            height="476"
            rx="22"
            fill="#1F2937"
            stroke="#4B5563"
            strokeWidth="4"
          />
          <rect x="56" y="40" width="488" height="444" rx="14" fill="#2F3A2C" />

          {/* Tail & Limbs */}
          <path
            d="M300 410 Q310 450 290 470 Q270 492 300 506"
            fill="none"
            stroke="#D6B3A3"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <ellipse
            cx="226"
            cy="168"
            rx="16"
            ry="34"
            transform="rotate(40 226 168)"
            fill="#E7C9BA"
          />
          <ellipse
            cx="374"
            cy="168"
            rx="16"
            ry="34"
            transform="rotate(-40 374 168)"
            fill="#E7C9BA"
          />
          <ellipse
            cx="232"
            cy="378"
            rx="17"
            ry="38"
            transform="rotate(-35 232 378)"
            fill="#E7C9BA"
          />
          <ellipse
            cx="368"
            cy="378"
            rx="17"
            ry="38"
            transform="rotate(35 368 378)"
            fill="#E7C9BA"
          />

          {/* Head */}
          <ellipse cx="300" cy="96" rx="34" ry="46" fill="#E7C9BA" />
          <ellipse cx="282" cy="66" rx="6" ry="4" fill="#3F2A2A" />
          <ellipse cx="318" cy="66" rx="6" ry="4" fill="#3F2A2A" />

          {/* Torso Body */}
          <ellipse cx="300" cy="262" rx="92" ry="152" fill="#EBD0C2" />

          {/* Step 2 Midline incision line */}
          {step === 2 && (
            <line
              x1="300"
              y1="130"
              x2="300"
              y2="395"
              stroke="#991B1B"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
          )}

          {/* Opened Body Cavity & Internal Organs (Step 3..5) */}
          {isOpened && (
            <g>
              <ellipse cx="300" cy="262" rx="80" ry="138" fill="#7A2E2E" />
              {/* Trachea */}
              <line
                x1="300"
                y1="132"
                x2="300"
                y2="176"
                stroke="#F1F5F9"
                strokeWidth="7"
                strokeDasharray="3 2"
              />
              {/* Lungs */}
              <ellipse
                cx="270"
                cy="194"
                rx="24"
                ry="28"
                fill="#F9A8D4"
                stroke={selectedOrgan === 'lungs' ? '#4ADE80' : 'transparent'}
                strokeWidth="3"
                className="cursor-pointer"
                onClick={() => setSelectedOrgan('lungs')}
              />
              <ellipse
                cx="330"
                cy="194"
                rx="24"
                ry="28"
                fill="#F9A8D4"
                stroke={selectedOrgan === 'lungs' ? '#4ADE80' : 'transparent'}
                strokeWidth="3"
                className="cursor-pointer"
                onClick={() => setSelectedOrgan('lungs')}
              />
              {/* Heart */}
              <path
                d="M300 186 C 286 178, 282 200, 300 216 C 318 200, 314 178, 300 186 Z"
                fill="#DC2626"
                stroke={selectedOrgan === 'heart' ? '#4ADE80' : 'transparent'}
                strokeWidth="3"
                className="cursor-pointer"
                onClick={() => setSelectedOrgan('heart')}
              />
              {/* Diaphragm */}
              <path d="M226 228 Q300 214 374 228" fill="none" stroke="#FCA5A5" strokeWidth="3" />
              {/* Liver */}
              <path
                d="M232 236 Q300 226 368 236 Q372 268 340 276 Q300 284 252 274 Q228 264 232 236 Z"
                fill="#7F1D1D"
                stroke={
                  selectedOrgan === 'liver' ? '#4ADE80' : 'rgba(74,222,128,0.4)'
                }
                strokeWidth="3.5"
                className="cursor-pointer"
                onClick={() => setSelectedOrgan('liver')}
              />
              {/* Stomach */}
              <ellipse
                cx="338"
                cy="282"
                rx="26"
                ry="16"
                fill="#E9D5B5"
                stroke={selectedOrgan === 'stomach' ? '#4ADE80' : 'transparent'}
                strokeWidth="3"
                className="cursor-pointer"
                onClick={() => setSelectedOrgan('stomach')}
              />
              {/* Kidneys */}
              <ellipse
                cx="248"
                cy="300"
                rx="12"
                ry="18"
                fill="#9F1239"
                stroke={selectedOrgan === 'kidneys' ? '#4ADE80' : 'transparent'}
                strokeWidth="3"
                className="cursor-pointer"
                onClick={() => setSelectedOrgan('kidneys')}
              />
              <ellipse
                cx="352"
                cy="312"
                rx="12"
                ry="18"
                fill="#9F1239"
                stroke={selectedOrgan === 'kidneys' ? '#4ADE80' : 'transparent'}
                strokeWidth="3"
                className="cursor-pointer"
                onClick={() => setSelectedOrgan('kidneys')}
              />
              {/* Small intestine */}
              <path
                d="M266 304 q14 -12 28 0 t28 0 t28 0 M262 322 q14 -12 28 0 t28 0 t28 0 M266 340 q14 -12 28 0 t28 0 t28 0 M270 358 q14 -12 28 0 t28 0"
                fill="none"
                stroke="#FBCFE8"
                strokeWidth="9"
                strokeLinecap="round"
                className="cursor-pointer"
                onClick={() => setSelectedOrgan('small-intestine')}
              />
              {/* Caecum */}
              <ellipse
                cx="248"
                cy="352"
                rx="18"
                ry="24"
                fill="#C4A484"
                stroke={selectedOrgan === 'caecum' ? '#4ADE80' : 'transparent'}
                strokeWidth="3"
                className="cursor-pointer"
                onClick={() => setSelectedOrgan('caecum')}
              />
              {/* Urinary bladder */}
              <ellipse
                cx="300"
                cy="388"
                rx="14"
                ry="12"
                fill="#FDE68A"
                stroke={selectedOrgan === 'urinary-bladder' ? '#4ADE80' : 'transparent'}
                strokeWidth="3"
                className="cursor-pointer"
                onClick={() => setSelectedOrgan('urinary-bladder')}
              />

              {/* Folded Skin Flaps */}
              <g transform="translate(-70 0) scale(0.65 1)">
                <path
                  d="M300 112 L300 412 Q214 400 210 262 Q214 124 300 112 Z"
                  fill="#EBD0C2"
                  opacity="0.85"
                />
              </g>
              <g transform="translate(175 0) scale(0.65 1)">
                <path
                  d="M300 112 L300 412 Q386 400 390 262 Q386 124 300 112 Z"
                  fill="#EBD0C2"
                  opacity="0.85"
                />
              </g>
            </g>
          )}

          {/* Dissecting Pins */}
          {[
            { x: 196, y: 140 },
            { x: 404, y: 140 },
            { x: 204, y: 414 },
            { x: 396, y: 414 },
          ].map((pin, idx) => (
            <g key={idx} transform={`translate(${pin.x} ${pin.y})`}>
              <line x1="0" y1="0" x2="0" y2="-22" stroke="#CBD5E1" strokeWidth="2" />
              {step >= 2 && <circle cx="0" cy="-24" r="6" fill="#EF4444" />}
            </g>
          ))}

          {/* Green Organ Labels (Steps 4 & 5) */}
          {step >= 4 && (
            <g fontFamily="Inter, sans-serif" fontSize="12" fontWeight="600" fill="#BBF7D0">
              <g onClick={() => setSelectedOrgan('heart')} className="cursor-pointer">
                <line x1="300" y1="200" x2="120" y2="200" stroke="#86EFAC" strokeWidth="1" />
                <rect x="71" y="190" width="49" height="20" rx="5" fill="#0E2A1A" stroke="#166534" />
                <text x="78" y="204">Heart</text>
              </g>
              <g onClick={() => setSelectedOrgan('lungs')} className="cursor-pointer">
                <line x1="330" y1="194" x2="480" y2="194" stroke="#86EFAC" strokeWidth="1" />
                <rect x="480" y="184" width="49" height="20" rx="5" fill="#0E2A1A" stroke="#166534" />
                <text x="487" y="198">Lungs</text>
              </g>
              <g onClick={() => setSelectedOrgan('liver')} className="cursor-pointer">
                <line x1="300" y1="256" x2="120" y2="256" stroke="#86EFAC" strokeWidth="1" />
                <rect x="71" y="246" width="49" height="20" rx="5" fill="#0E2A1A" stroke="#166534" />
                <text x="78" y="260">Liver</text>
              </g>
              <g onClick={() => setSelectedOrgan('stomach')} className="cursor-pointer">
                <line x1="338" y1="282" x2="480" y2="282" stroke="#86EFAC" strokeWidth="1" />
                <rect x="480" y="272" width="63" height="20" rx="5" fill="#0E2A1A" stroke="#166534" />
                <text x="487" y="286">Stomach</text>
              </g>
              <g onClick={() => setSelectedOrgan('kidneys')} className="cursor-pointer">
                <line x1="352" y1="312" x2="480" y2="312" stroke="#86EFAC" strokeWidth="1" />
                <rect x="480" y="302" width="63" height="20" rx="5" fill="#0E2A1A" stroke="#166534" />
                <text x="487" y="316">Kidneys</text>
              </g>
              <g onClick={() => setSelectedOrgan('small-intestine')} className="cursor-pointer">
                <line x1="300" y1="330" x2="480" y2="330" stroke="#86EFAC" strokeWidth="1" />
                <rect x="480" y="320" width="106" height="20" rx="5" fill="#0E2A1A" stroke="#166534" />
                <text x="487" y="334">Small intestine</text>
              </g>
              <g onClick={() => setSelectedOrgan('caecum')} className="cursor-pointer">
                <line x1="248" y1="352" x2="120" y2="352" stroke="#86EFAC" strokeWidth="1" />
                <rect x="64" y="342" width="56" height="20" rx="5" fill="#0E2A1A" stroke="#166534" />
                <text x="71" y="356">Caecum</text>
              </g>
              <g onClick={() => setSelectedOrgan('urinary-bladder')} className="cursor-pointer">
                <line x1="300" y1="388" x2="120" y2="388" stroke="#86EFAC" strokeWidth="1" />
                <rect x="20" y="378" width="100" height="20" rx="5" fill="#0E2A1A" stroke="#166534" />
                <text x="27" y="392">Urinary bladder</text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </LabLayout>
  );
}
