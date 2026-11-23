import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { LabLayout } from '../../lab-shell/LabLayout';

type Stage =
  | 'mouth'
  | 'oesophagus'
  | 'stomach'
  | 'small-intestine'
  | 'large-intestine'
  | 'rectum';
type FoodType = 'bread' | 'beans' | 'groundnut-oil';

interface EnzymeRow {
  enzyme: string;
  actsOn: string;
  produces: string;
}

interface StageInfo {
  name: string;
  eyebrow: string;
  realTime: string;
  description: string;
  pH: string;
  movement: string;
  enzymes: Record<FoodType, EnzymeRow[]>;
  question: string;
  bolusPos: { cx: number; cy: number };
}

const STAGES: Stage[] = [
  'mouth',
  'oesophagus',
  'stomach',
  'small-intestine',
  'large-intestine',
  'rectum',
];

const STAGE_DATA: Record<Stage, StageInfo> = {
  mouth: {
    name: 'Mouth',
    eyebrow: 'MECHANICAL + CHEMICAL DIGESTION',
    realTime: '15–30 seconds',
    description:
      'Teeth chew food into smaller pieces (mastication) while salivary glands secrete saliva to moisten the bolus and begin starch breakdown.',
    pH: 'pH ≈ 6.8–7.0',
    movement: 'Movement: chewing & swallowing',
    enzymes: {
      bread: [{ enzyme: 'Salivary amylase (ptyalin)', actsOn: 'Cooked starch', produces: 'Maltose' }],
      beans: [],
      'groundnut-oil': [],
    },
    question: 'Why does bread taste slightly sweet if you chew it for a long time before swallowing?',
    bolusPos: { cx: 250, cy: 88 },
  },
  oesophagus: {
    name: 'Oesophagus',
    eyebrow: 'PERISTALTIC TRANSPORT',
    realTime: '6–10 seconds',
    description:
      'Wave-like contractions of circular and longitudinal muscle (peristalsis) push the food bolus down into the stomach through the cardiac sphincter.',
    pH: 'pH ≈ 6.8',
    movement: 'Movement: peristalsis',
    enzymes: {
      bread: [],
      beans: [],
      'groundnut-oil': [],
    },
    question: 'Can peristalsis move food to the stomach even if a person is upside down? Why?',
    bolusPos: { cx: 252, cy: 190 },
  },
  stomach: {
    name: 'Stomach',
    eyebrow: 'CHEMICAL + MECHANICAL DIGESTION',
    realTime: '2–4 hours',
    description:
      'The muscular wall churns food with gastric juice. Hydrochloric acid kills microbes and gives pepsin the acid it needs to start breaking down proteins. Food becomes a liquid called chyme.',
    pH: 'pH ≈ 1.5–2',
    movement: 'Movement: churning',
    enzymes: {
      bread: [],
      beans: [
        { enzyme: 'Pepsin (+ HCl)', actsOn: 'Proteins', produces: 'Peptones & polypeptides' },
      ],
      'groundnut-oil': [],
    },
    question: 'Why does salivary amylase stop working once food reaches the stomach?',
    bolusPos: { cx: 286, cy: 280 },
  },
  'small-intestine': {
    name: 'Small intestine',
    eyebrow: 'COMPLETE DIGESTION + ABSORPTION',
    realTime: '3–5 hours',
    description:
      'Bile from the liver emulsifies fats and neutralises stomach acid. Pancreatic and intestinal enzymes finish breaking nutrients down so villi can absorb them into blood and lymph.',
    pH: 'pH ≈ 7.5–8.5',
    movement: 'Movement: peristalsis & villi absorption',
    enzymes: {
      bread: [
        { enzyme: 'Pancreatic amylase', actsOn: 'Starch', produces: 'Maltose' },
        { enzyme: 'Maltase', actsOn: 'Maltose', produces: 'Glucose' },
      ],
      beans: [
        { enzyme: 'Trypsin', actsOn: 'Proteins', produces: 'Polypeptides' },
        { enzyme: 'Erepsin (peptidase)', actsOn: 'Polypeptides', produces: 'Amino acids' },
      ],
      'groundnut-oil': [
        { enzyme: 'Bile salts + Lipase', actsOn: 'Emulsified fats', produces: 'Fatty acids & glycerol' },
      ],
    },
    question: 'How is the wall of a villus adapted for rapid absorption of digested food?',
    bolusPos: { cx: 255, cy: 410 },
  },
  'large-intestine': {
    name: 'Large intestine',
    eyebrow: 'WATER & MINERAL ABSORPTION',
    realTime: '12–24 hours',
    description:
      'Undigested fibre and water pass into the colon. Most remaining water and mineral salts are absorbed back into the bloodstream, leaving semi-solid faeces.',
    pH: 'pH ≈ 6.0–7.0',
    movement: 'Movement: slow mass peristalsis',
    enzymes: {
      bread: [],
      beans: [],
      'groundnut-oil': [],
    },
    question: 'What happens to the body if the large intestine fails to reabsorb water properly?',
    bolusPos: { cx: 172, cy: 400 },
  },
  rectum: {
    name: 'Rectum & anus',
    eyebrow: 'STORAGE & EGESTION',
    realTime: 'until egestion',
    description:
      'Semi-solid undigested waste (faeces) is stored temporarily in the rectum before being egested through the anal sphincter.',
    pH: 'pH ≈ 7.0',
    movement: 'Movement: egestion',
    enzymes: {
      bread: [],
      beans: [],
      'groundnut-oil': [],
    },
    question: 'Why is the removal of faeces called egestion rather than excretion?',
    bolusPos: { cx: 256, cy: 532 },
  },
};

export function DigestionLab() {
  const navigate = useNavigate();
  const [selectedFood, setSelectedFood] = useState<FoodType>('bread');
  const [currentStage, setCurrentStage] = useState<Stage>('stomach');
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);

  const stageIndex = STAGES.indexOf(currentStage);
  const stageInfo = STAGE_DATA[currentStage];
  const activeEnzymes = stageInfo.enzymes[selectedFood];

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isPlaying || prefersReducedMotion) return;

    const intervalMs = 3500 / speed;
    const timer = setInterval(() => {
      setCurrentStage((prev) => {
        const idx = STAGES.indexOf(prev);
        const nextStage = STAGES[idx + 1];
        if (nextStage) return nextStage;
        return 'mouth';
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed]);

  const progressPercent = ((stageIndex + 1) / STAGES.length) * 100;

  return (
    <LabLayout
      experimentTitle="The journey of food — human digestive system"
      subtitle="Biology · animated model · practice"
      activeLab="biology"
      mode="practice"
      headerRightExtra={
        <div className="hidden sm:flex items-center gap-2">
          <Link
            to="/lab/biology/dissection"
            className="px-3.5 py-1.5 rounded-full bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors"
          >
            Dissection
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
        <div className="space-y-5">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2.5">
              FEED THE MODEL
            </div>
            <div className="space-y-2">
              {[
                { id: 'bread' as const, name: 'Bread', sub: 'mostly starch (carbohydrate)' },
                { id: 'beans' as const, name: 'Beans', sub: 'mostly protein' },
                { id: 'groundnut-oil' as const, name: 'Groundnut oil', sub: 'fat and oil (lipid)' },
              ].map((food) => {
                const active = selectedFood === food.id;
                return (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => setSelectedFood(food.id)}
                    className={`w-full text-left rounded-xl px-3 py-2.5 border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#122D1F] border-[#4ADE80] text-[#E6EBF5]'
                        : 'bg-[#121A2B] border-[#22304A] text-[#E6EBF5] hover:border-[#3A4A68]'
                    }`}
                  >
                    <div className="text-xs font-semibold">{food.name}</div>
                    <div className="text-[11px] text-[#93A0B8]">{food.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2.5">
              ORGANS — JUMP TO
            </div>
            <div className="space-y-1.5">
              {STAGES.map((st, idx) => {
                const isCurrent = st === currentStage;
                const isPassed = idx <= stageIndex;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setCurrentStage(st)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#122D1F] border border-[#22C55E] text-[#E6EBF5]'
                        : 'text-[#C9D3E6] hover:bg-[#121A2B]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isPassed ? 'bg-[#4ADE80]' : 'bg-[#3A4A68]'
                      }`}
                    />
                    <span>{STAGE_DATA[st].name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      }
      bottomDock={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#0B1220] text-xs font-bold transition-colors cursor-pointer"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentStage('mouth');
                setIsPlaying(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-[#E6EBF5] text-xs font-semibold transition-colors cursor-pointer"
            >
              Swallow again
            </button>
          </div>

          {/* Progress bar across digestive tract */}
          <div className="flex-1 min-w-[220px] max-w-xl mx-2">
            <div className="h-2 bg-[#1E2A42] rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-[#4ADE80] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#93A0B8]">
              <span>Mouth</span>
              <span>Stomach</span>
              <span>Small intestine</span>
              <span>Large intestine</span>
              <span>Egestion</span>
            </div>
          </div>

          {/* Speed selector */}
          <div className="flex items-center bg-[#121A2B] border border-[#22304A] rounded-lg p-0.5 text-xs font-mono">
            {([1, 2, 4] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  speed === s
                    ? 'bg-[#4ADE80] text-[#0B1220] font-bold'
                    : 'text-[#93A0B8] hover:text-[#E6EBF5]'
                }`}
              >
                ×{s}
              </button>
            ))}
          </div>
        </div>
      }
      rightPanel={
        <div className="flex flex-col justify-between h-full gap-4">
          <div className="space-y-3.5">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#4ADE80] mb-1">
                {stageInfo.eyebrow}
              </div>
              <h2 className="font-display text-xl font-bold text-white mb-2">
                {stageInfo.name}
              </h2>
              <p className="text-xs text-[#C9D3E6] leading-relaxed">{stageInfo.description}</p>
            </div>

            {/* Enzyme table */}
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 border-b border-[#1E2A42] px-3 py-2 text-[11px] text-[#93A0B8]">
                <span>Enzyme / juice</span>
                <span>Acts on</span>
                <span>Produces</span>
              </div>
              {activeEnzymes.length > 0 ? (
                <div className="divide-y divide-[#1E2A42]">
                  {activeEnzymes.map((row) => (
                    <div
                      key={row.enzyme}
                      className="grid grid-cols-3 px-3 py-2 text-xs text-[#E6EBF5] gap-1"
                    >
                      <span className="font-semibold text-[#4ADE80]">{row.enzyme}</span>
                      <span>{row.actsOn}</span>
                      <span>{row.produces}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2.5 text-xs text-[#93A0B8]">
                  No digestive enzymes here — movement and water absorption only.
                </div>
              )}
            </div>

            {/* pH and movement pills */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#121A2B] border border-[#22304A] text-xs text-[#C9D3E6]">
                {stageInfo.pH}
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#121A2B] border border-[#22304A] text-xs text-[#C9D3E6]">
                {stageInfo.movement}
              </span>
            </div>

            {/* Check yourself */}
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#60A5FA] mb-1.5">
                CHECK YOURSELF
              </div>
              <p className="text-xs text-[#C9D3E6] leading-relaxed">{stageInfo.question}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/library')}
            className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer leading-snug"
          >
            Next: food tests practical (starch, sugar, protein, fat)
          </button>
        </div>
      }
    >
      {/* Top Bench Badges */}
      <div className="flex items-center justify-between z-10">
        <span className="px-3 py-1 rounded-full bg-[#122D1F] border border-[#166534] text-xs font-semibold text-[#4ADE80]">
          Now in: {stageInfo.name}
        </span>
        <span className="px-3 py-1 rounded-full bg-[#121A2B] border border-[#22304A] font-mono text-xs text-[#C9D3E6]">
          real time ≈ {stageInfo.realTime}
        </span>
      </div>

      {/* Main Human Digestive System SVG matching D3-biology-digestive-system.svg */}
      <div className="flex-1 flex items-center justify-center my-1">
        <svg
          viewBox="0 0 500 600"
          className="w-full max-w-[460px] h-auto max-h-[470px]"
          role="img"
          aria-label={`Human digestive system with food moving through the ${stageInfo.name}`}
        >
          {/* Head & Torso silhouette */}
          <circle
            cx="250"
            cy="62"
            r="44"
            fill="#FDE7D6"
            opacity="0.12"
            stroke="#FDE7D6"
            strokeOpacity="0.35"
          />
          <path
            d="M226 104 L226 128 L150 150 Q120 160 122 200 L132 540 Q140 580 200 584 L300 584 Q360 580 368 540 L378 200 Q380 160 350 150 L274 128 L274 104 Z"
            fill="#FDE7D6"
            opacity="0.08"
            stroke="#FDE7D6"
            strokeOpacity="0.3"
          />

          {/* Mouth & Salivary glands */}
          <path
            d="M232 84 Q250 96 268 84"
            fill="none"
            stroke={currentStage === 'mouth' ? '#4ADE80' : '#F87171'}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <ellipse cx="214" cy="96" rx="8" ry="5" fill="#FBBF24" opacity="0.7" />
          <ellipse cx="286" cy="96" rx="8" ry="5" fill="#FBBF24" opacity="0.7" />

          {/* Oesophagus peristaltic segments */}
          {[
            { cx: 250.0, cy: 135, r: 6.5 },
            { cx: 250.5, cy: 145, r: 8.0 },
            { cx: 251.0, cy: 155, r: 8.6 },
            { cx: 251.6, cy: 165, r: 8.0 },
            { cx: 252.1, cy: 175, r: 6.4 },
            { cx: 252.6, cy: 185, r: 4.7 },
            { cx: 253.1, cy: 195, r: 3.5 },
            { cx: 253.7, cy: 205, r: 3.6 },
            { cx: 254.2, cy: 215, r: 4.7 },
            { cx: 254.7, cy: 225, r: 6.5 },
            { cx: 255.2, cy: 235, r: 8.0 },
            { cx: 255.7, cy: 245, r: 8.6 },
          ].map((seg, i) => (
            <circle
              key={i}
              cx={seg.cx}
              cy={seg.cy}
              r={seg.r}
              fill="#F9A8D4"
              stroke={currentStage === 'oesophagus' ? '#4ADE80' : 'none'}
              strokeWidth="1.5"
            />
          ))}

          {/* Liver */}
          <path
            d="M150 252 Q170 228 236 236 Q262 244 258 276 Q250 316 214 320 Q170 322 152 296 Q140 274 150 252 Z"
            fill="#9F3B32"
            stroke="#7F1D1D"
            strokeWidth="3"
          />

          {/* Gall bladder */}
          <ellipse
            cx="226"
            cy="312"
            rx="9"
            ry="12"
            fill="#4D7C0F"
            stroke="#A3E635"
            strokeWidth="1"
          />

          {/* Stomach */}
          <g>
            <path
              d="M256 248 C 286 236, 340 250, 334 296 C 328 332, 292 338, 272 326 C 262 318, 260 302, 268 288 C 274 274, 262 262, 256 248 Z"
              fill="#F472B6"
              stroke={currentStage === 'stomach' ? '#4ADE80' : '#BE185D'}
              strokeWidth="3"
            />
            <path
              d="M272 270 Q300 262 318 286 M276 300 Q300 296 316 310"
              fill="none"
              stroke="#BE185D"
              strokeWidth="1.5"
              opacity="0.7"
            />
          </g>

          {/* Pancreas */}
          <path
            d="M232 336 Q270 330 318 338"
            fill="none"
            stroke="#FCD34D"
            strokeWidth="9"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Large Intestine */}
          <path
            d="M172 474 L172 346 L330 346 L330 478 Q326 500 292 506 L262 518"
            fill="none"
            stroke={currentStage === 'large-intestine' ? '#4ADE80' : '#B45309'}
            strokeWidth="22"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Small Intestine */}
          <path
            d="M258 338 L215 365 L300 375 L215 395 L300 410 L215 425 L300 440 L215 455 L195 472"
            fill="none"
            stroke={currentStage === 'small-intestine' ? '#4ADE80' : '#FB7185'}
            strokeWidth="14"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Rectum & Anus */}
          <path
            d="M262 518 L252 546"
            fill="none"
            stroke={currentStage === 'rectum' ? '#4ADE80' : '#92400E'}
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Active Food Bolus Marker */}
          <circle
            cx={stageInfo.bolusPos.cx}
            cy={stageInfo.bolusPos.cy}
            r="8.5"
            fill="#FDBA74"
            stroke="#FFFFFF"
            strokeWidth="2"
          />

          {/* Callout Labels */}
          <g fontFamily="Inter, sans-serif" fontSize="11" fill="#C9D3E6">
            <text x="380" y="92">Mouth &amp; salivary glands</text>
            <line x1="294" y1="96" x2="376" y2="90" stroke="#3A4A68" />

            <text x="380" y="190">Oesophagus</text>
            <line x1="258" y1="190" x2="376" y2="188" stroke="#3A4A68" />

            <text x="380" y="270">Stomach</text>
            <line x1="336" y1="276" x2="376" y2="268" stroke="#3A4A68" />

            <text x="20" y="250">Liver</text>
            <line x1="52" y1="246" x2="150" y2="262" stroke="#3A4A68" />

            <text x="20" y="320">Gall bladder</text>
            <line x1="92" y1="316" x2="216" y2="314" stroke="#3A4A68" />

            <text x="380" y="338">Pancreas</text>
            <line x1="320" y1="338" x2="376" y2="336" stroke="#3A4A68" />

            <text x="380" y="420">Small intestine</text>
            <line x1="300" y1="415" x2="376" y2="416" stroke="#3A4A68" />

            <text x="20" y="420">Large intestine</text>
            <line x1="110" y1="416" x2="162" y2="416" stroke="#3A4A68" />

            <text x="300" y="560">Rectum &amp; anus</text>
            <line x1="256" y1="546" x2="298" y2="556" stroke="#3A4A68" />
          </g>
        </svg>
      </div>
    </LabLayout>
  );
}
