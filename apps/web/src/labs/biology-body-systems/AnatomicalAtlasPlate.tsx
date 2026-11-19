import React from 'react';

export type SystemKey =
  | 'skeletal'
  | 'muscular'
  | 'respiratory'
  | 'circulatory'
  | 'digestive'
  | 'renal'
  | 'nervous';

export type AtlasViewMode = 'engraved-folio' | 'clinical-atlas' | 'xray' | 'morphology-grid';

export interface OrganCallout {
  id: string;
  figNum: string;
  label: string;
  system: SystemKey;
  side: 'left' | 'right';
  anchorX: number;
  anchorY: number;
  labelY: number;
  latinName: string;
  functionSummary: string;
  clinicalNote: string;
  examFact: string;
}

interface AnatomicalAtlasPlateProps {
  layers: Record<SystemKey, boolean>;
  viewMode: AtlasViewMode;
  quizMode: boolean;
  revealedQuizIds: Record<string, boolean>;
  visibleCallouts: OrganCallout[];
  selectedCallout: OrganCallout;
  onSelectCallout: (id: string) => void;
  bpm: number;
}

const MORPHOLOGY_PANELS: {
  id: string;
  fig: string;
  title: string;
  latin: string;
  calloutId: string;
  caption: string;
  renderSvg: (stroke: string, accent: string) => React.ReactNode;
}[] = [
  {
    id: 'panel-cervical',
    fig: 'STUDY I',
    title: 'Cervical Spine, Cranium & Sternocleidomastoid',
    latin: 'Vertebrae Cervicales (C1–C7) & M. Sternocleidomastoideus',
    calloutId: 'cranium',
    caption: 'Atlas (C1) & Axis (C2) pivot joint with carotid sheath and laryngeal cartilages.',
    renderSvg: (stroke, accent) => (
      <g fill="none" stroke={stroke} strokeLinecap="round">
        {/* Skull profile & cervical curve */}
        <path d="M52 24 C34 22, 26 42, 34 58 C38 66, 46 72, 54 74 L56 84 L74 82 L76 68 C88 60, 92 34, 74 24 Z" strokeWidth="1.8" />
        <path d="M40 46 C44 43, 50 43, 53 47 M35 58 L46 60" strokeWidth="1.3" />
        {/* Cervical vertebrae stack */}
        {[78, 86, 94, 102, 110, 118, 126].map((y, i) => (
          <g key={y}>
            <rect x={56 + i * 0.8} y={y} width="15" height="6" rx="2" strokeWidth="1.4" />
            <line x1={71 + i * 0.8} y1={y + 3} x2={80 + i * 1.1} y2={y + 5} strokeWidth="1.2" />
          </g>
        ))}
        {/* Sternocleidomastoid muscle striations */}
        <path d="M68 68 C62 92, 48 116, 38 138 M74 70 C68 95, 58 118, 52 138 M71 69 C65 93, 53 117, 45 138" stroke={accent} strokeWidth="1.3" opacity="0.85" />
        {/* Clavicle bar */}
        <path d="M22 138 Q56 132 98 140" strokeWidth="2.4" />
      </g>
    ),
  },
  {
    id: 'panel-thorax-anterior',
    fig: 'STUDY II',
    title: 'Anterior Thoracic Cage, Sternum & Costal Cartilages',
    latin: 'Cavea Thoracica Anterior (Costae I–X)',
    calloutId: 'rib-cage',
    caption: 'Manubrium, gladiolus, xiphoid process and hyaline costal arches expanding in inspiration.',
    renderSvg: (stroke, accent) => (
      <g fill="none" stroke={stroke} strokeLinecap="round">
        {/* Clavicles */}
        <path d="M60 26 Q36 20 14 28 M60 26 Q84 20 106 28" strokeWidth="2.4" />
        {/* Sternum */}
        <path d="M54 26 L66 26 L64 42 L65 88 L60 100 L55 88 L56 42 Z" strokeWidth="1.7" />
        {/* 8 Rib pairs with costal cartilage */}
        {[34, 44, 54, 64, 74, 84, 94, 104].map((ry, i) => {
          const w = 28 + (i < 5 ? i * 5 : (8 - i) * 4);
          return (
            <g key={ry}>
              <path d={`M55 ${ry} C${42 - i} ${ry - 2}, ${60 - w} ${ry + 6}, ${60 - w + 4} ${ry + 18}`} strokeWidth="1.8" />
              <path d={`M65 ${ry} C${78 + i} ${ry - 2}, ${60 + w} ${ry + 6}, ${60 + w - 4} ${ry + 18}`} strokeWidth="1.8" />
              <path d={`M${60 - w + 4} ${ry + 18} Q46 ${ry + 16} 55 ${Math.min(92, ry + 6)}`} stroke={accent} strokeWidth="1.1" strokeDasharray="2 2" />
              <path d={`M${60 + w - 4} ${ry + 18} Q74 ${ry + 16} 65 ${Math.min(92, ry + 6)}`} stroke={accent} strokeWidth="1.1" strokeDasharray="2 2" />
            </g>
          );
        })}
        {/* Diaphragm dome */}
        <path d="M22 114 Q60 92 98 114" stroke={accent} strokeWidth="2" />
      </g>
    ),
  },
  {
    id: 'panel-scapula-posterior',
    fig: 'STUDY III',
    title: 'Posterior Scapula, Glenoid & Rotator Cuff Mechanics',
    latin: 'Scapula, Acromion & Articulatio Humeri',
    calloutId: 'clavicle-sternum',
    caption: 'Dorsal thoracic spine (T1–T12), triangular scapular blades, acromion spine and humeral head.',
    renderSvg: (stroke, accent) => (
      <g fill="none" stroke={stroke} strokeLinecap="round">
        {/* Spinous processes */}
        {Array.from({ length: 12 }, (_, i) => 20 + i * 10).map((y) => (
          <rect key={y} x="56" y={y} width="8" height="7" rx="1.5" strokeWidth="1.4" />
        ))}
        {/* Left & Right Scapular blades */}
        <path d="M48 34 L20 32 L26 82 L48 64 Z" strokeWidth="1.8" />
        <path d="M72 34 L100 32 L94 82 L72 64 Z" strokeWidth="1.8" />
        {/* Spine of scapula */}
        <path d="M48 44 L16 34 M72 44 L104 34" strokeWidth="2.2" />
        {/* Humeral heads & shafts */}
        <circle cx="15" cy="40" r="6" strokeWidth="1.8" />
        <line x1="14" y1="46" x2="10" y2="128" strokeWidth="3.2" />
        <circle cx="105" cy="40" r="6" strokeWidth="1.8" />
        <line x1="106" y1="46" x2="110" y2="128" strokeWidth="3.2" />
        {/* Trapezius & Rhomboid muscle lines */}
        <path d="M56 24 L24 34 M56 42 L28 54 M64 24 L96 34 M64 42 L92 54" stroke={accent} strokeWidth="1.1" opacity="0.8" />
      </g>
    ),
  },
  {
    id: 'panel-heart-coronary',
    fig: 'STUDY IV',
    title: 'Myocardium, Aortic Arch & Coronary Vasculature',
    latin: 'Cor, Arcus Aortae & Arteriae Coronariae',
    calloutId: 'heart-chambers',
    caption: '4-chamber double-circulation pump showing ascending aorta, pulmonary trunk and coronary arteries.',
    renderSvg: (stroke, accent) => (
      <g fill="none" stroke={stroke} strokeLinecap="round">
        {/* Aortic Arch & 3 superior branches */}
        <path d="M54 62 C52 28, 78 28, 76 58 L76 132" stroke={accent} strokeWidth="3.5" />
        <path d="M58 34 L54 16 M64 32 L64 14 M70 35 L74 17" stroke={accent} strokeWidth="2" />
        {/* Superior & Inferior Vena Cava */}
        <path d="M42 22 L42 64 M44 108 L44 136" strokeWidth="3" />
        {/* Heart ventricular contour */}
        <path d="M40 58 C26 62, 26 98, 46 112 C62 124, 86 122, 82 92 C80 72, 68 56, 40 58 Z" strokeWidth="2.2" />
        {/* Anterior interventricular coronary artery & branches */}
        <path d="M56 64 C58 82, 64 98, 72 116 M58 78 L44 88 M62 92 L76 96 M52 72 L36 76" stroke={accent} strokeWidth="1.5" />
      </g>
    ),
  },
  {
    id: 'panel-elbow-forearm',
    fig: 'STUDY V',
    title: 'Brachium, Hinge Elbow Joint, Radius & Ulna',
    latin: 'Articulatio Cubiti (Biceps Brachii, Radius & Ulna)',
    calloutId: 'humerus-forearm',
    caption: 'Antagonistic biceps/triceps lever acting across the trochlear hinge joint; radial pronation.',
    renderSvg: (stroke, accent) => (
      <g fill="none" stroke={stroke} strokeLinecap="round">
        {/* Humerus shaft & distal condyles */}
        <line x1="36" y1="16" x2="48" y2="74" strokeWidth="4.2" />
        <ellipse cx="50" cy="76" rx="8" ry="5" strokeWidth="1.8" />
        {/* Radius & Ulna */}
        <path d="M46 78 L88 126" strokeWidth="2.8" />
        <path d="M54 78 L96 120" strokeWidth="2.4" />
        {/* Biceps brachii belly & tendon insertion on radial tuberosity */}
        <path d="M42 22 C58 36, 64 56, 58 78 M44 26 C54 38, 58 56, 56 76" stroke={accent} strokeWidth="1.6" />
        {/* Triceps posterior belly */}
        <path d="M32 24 C24 44, 30 62, 44 76" stroke={accent} strokeWidth="1.3" strokeDasharray="3 2" />
      </g>
    ),
  },
  {
    id: 'panel-viscera-digestive',
    fig: 'STUDY VI',
    title: 'Hepato-Biliary Tract, Gastric Rugae & Duodenal Loop',
    latin: 'Hepar, Vesica Biliaris, Gaster & Pancreas',
    calloutId: 'stomach-pancreas',
    caption: 'Bi-lobed liver, cystic/common bile duct, J-shaped stomach with mucosal rugae, and pancreatic duct.',
    renderSvg: (stroke, accent) => (
      <g fill="none" stroke={stroke} strokeLinecap="round">
        {/* Bi-lobed liver */}
        <path d="M18 44 Q46 30 72 48 L52 72 Q22 72 18 44 Z" strokeWidth="2" />
        {/* Gallbladder & common bile duct */}
        <ellipse cx="42" cy="68" rx="7" ry="4" stroke={accent} strokeWidth="1.6" />
        <path d="M49 68 L62 84" stroke={accent} strokeWidth="1.4" />
        {/* Stomach with internal longitudinal rugae folds */}
        <path d="M68 32 L68 48 C94 46, 106 72, 92 94 C78 108, 58 102, 54 90 C62 80, 72 64, 68 48" strokeWidth="2" />
        <path d="M74 58 C88 58, 94 74, 84 88 M70 66 C80 68, 84 78, 76 88" stroke={accent} strokeWidth="1.1" />
        {/* Duodenal C-loop & Pancreas */}
        <path d="M54 90 C44 92, 44 114, 62 118 L92 116" strokeWidth="2.4" />
        <path d="M58 98 Q78 96 92 104 Q76 110 58 104 Z" stroke={accent} strokeWidth="1.4" />
      </g>
    ),
  },
  {
    id: 'panel-pelvis-femur',
    fig: 'STUDY VII',
    title: 'Pelvic Girdle, Sacrum & Acetabular Hip Socket',
    latin: 'Pelvis Ossea, Os Sacrum & Caput Femoris',
    calloutId: 'pelvic-girdle',
    caption: 'Iliac crest, sacroiliac joint, obturator foramen, pubic symphysis and ball-and-socket femoral head.',
    renderSvg: (stroke, accent) => (
      <g fill="none" stroke={stroke} strokeLinecap="round">
        {/* Lumbar L4-L5 & Sacrum */}
        <rect x="52" y="18" width="16" height="8" rx="2" strokeWidth="1.6" />
        <rect x="51" y="28" width="18" height="8" rx="2" strokeWidth="1.6" />
        <path d="M46 38 L74 38 L65 72 L55 72 Z" strokeWidth="1.8" />
        {/* Left & Right Iliac Wings */}
        <path d="M46 40 C20 22, 12 58, 32 78 L54 86 L66 86 L88 78 C108 58, 100 22, 74 40" strokeWidth="2.2" />
        {/* Obturator foramina */}
        <ellipse cx="44" cy="84" rx="7" ry="5" strokeWidth="1.4" />
        <ellipse cx="76" cy="84" rx="7" ry="5" strokeWidth="1.4" />
        {/* Femoral heads, necks, greater trochanters & shafts */}
        <circle cx="28" cy="76" r="6" stroke={accent} strokeWidth="1.8" />
        <path d="M24 80 L14 90 L22 136" strokeWidth="3.4" />
        <circle cx="92" cy="76" r="6" stroke={accent} strokeWidth="1.8" />
        <path d="M96 80 L106 90 L98 136" strokeWidth="3.4" />
      </g>
    ),
  },
  {
    id: 'panel-knee-synovial',
    fig: 'STUDY VIII',
    title: 'Synovial Knee Joint, Patella, Cruciate Ligaments & Tibia',
    latin: 'Articulatio Genus (Femur, Patella, Tibia & Fibula)',
    calloutId: 'femur-tibia',
    caption: 'Femoral condyles, sesamoid patella in quadriceps tendon, meniscus cartilage, ACL/PCL and tibia/fibula.',
    renderSvg: (stroke, accent) => (
      <g fill="none" stroke={stroke} strokeLinecap="round">
        {/* Distal Femur & Condyles */}
        <path d="M54 16 L52 58 C40 62, 40 76, 52 76 L68 76 C80 76, 80 62, 68 58 L66 16" strokeWidth="2.4" />
        {/* Patella & Quadriceps/Patellar tendon */}
        <ellipse cx="60" cy="66" rx="8" ry="10" stroke={accent} strokeWidth="2" />
        <path d="M56 18 L58 56 M64 18 L62 56 M60 76 L60 98" stroke={accent} strokeWidth="1.4" />
        {/* Cruciate ligaments X */}
        <path d="M50 68 L70 84 M70 68 L50 84" stroke={accent} strokeWidth="1.4" />
        {/* Proximal Tibia plateau & lateral Fibula */}
        <path d="M44 84 L76 84 L70 136 M50 84 L54 136" strokeWidth="2.4" />
        <path d="M40 90 L44 136" strokeWidth="1.7" />
      </g>
    ),
  },
];

export function AnatomicalAtlasPlate({
  layers,
  viewMode,
  quizMode,
  revealedQuizIds,
  visibleCallouts,
  selectedCallout,
  onSelectCallout,
}: AnatomicalAtlasPlateProps) {
  const isFolio = viewMode === 'engraved-folio';
  const isXray = viewMode === 'xray';

  // If user selected the 8-Panel Regional Morphology Study Sheet (matching Image 1)
  if (viewMode === 'morphology-grid') {
    return (
      <div className="w-full bg-[#1C1F24] border border-[#343A46] rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E3440] pb-2.5">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-[#CBD5E1]">
              TABULA MORPHOLOGICA I–VIII · REGIONAL OSTEOLOGY &amp; MYOLOGY SHEET
            </div>
            <div className="text-xs text-[#94A3B8]">
              Chalk-and-bone comparative morphology studies — click any study plate to inspect its
              biomechanics and clinical notes.
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-[#282D37] border border-[#475569] font-mono text-[10px] text-[#E2E8F0]">
            8 Regional Plates
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MORPHOLOGY_PANELS.map((panel) => {
            const active = selectedCallout.id === panel.calloutId;
            return (
              <button
                key={panel.id}
                type="button"
                onClick={() => onSelectCallout(panel.calloutId)}
                className={`text-left rounded-xl p-2.5 border transition-all cursor-pointer flex flex-col justify-between ${
                  active
                    ? 'bg-[#262B35] border-[#F8FAFC] shadow-md'
                    : 'bg-[#15181D] border-[#2C323D] hover:border-[#64748B]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] mb-1">
                    <span>{panel.fig}</span>
                    <span className="text-[#E2E8F0]">{active ? '● ACTIVE' : 'INSPECT'}</span>
                  </div>
                  <div className="bg-[#23272F] rounded-lg border border-[#333946] p-1.5 mb-2">
                    <svg viewBox="0 0 120 150" className="w-full h-36">
                      {panel.renderSvg('#F1F5F9', '#FDBA74')}
                    </svg>
                  </div>
                  <div className="text-xs font-bold text-[#F8FAFC] leading-snug mb-0.5">
                    {panel.title}
                  </div>
                  <div className="text-[10px] italic text-[#94A3B8] mb-1">{panel.latin}</div>
                </div>
                <div className="text-[10px] text-[#CBD5E1] leading-relaxed line-clamp-2">
                  {panel.caption}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Palette for Vintage Engraved Folio (Image 2) vs Clinical Dark Atlas vs X-Ray Fluoroscopy
  const bgFill = isFolio ? '#DFC9A1' : isXray ? '#040B16' : '#08101E';
  const inkStroke = isFolio ? '#261C14' : isXray ? '#38BDF8' : '#CBD5E1';
  const mutedInk = isFolio ? '#5C4736' : isXray ? '#0284C7' : '#475569';
  const boneFill = isFolio ? '#EFE3C8' : isXray ? '#BAE6FD' : '#E2E8F0';
  const boneStroke = isFolio ? '#3B2B1E' : isXray ? '#38BDF8' : '#94A3B8';
  const muscleFill = isFolio ? '#A94032' : isXray ? '#0EA5E9' : '#B91C1C';
  const muscleStroke = isFolio ? '#4A1B14' : isXray ? '#7DD3FC' : '#F87171';
  const skinFill = isFolio ? '#E7D4B1' : isXray ? '#0EA5E9' : '#FDE7D6';

  return (
    <div
      className={`w-full rounded-2xl border overflow-hidden transition-colors ${
        isFolio
          ? 'bg-[#DFC9A1] border-[#8C6D46] shadow-inner'
          : 'bg-[#08101E] border-[#1E2F4D]'
      }`}
    >
      <svg
        viewBox="0 0 720 740"
        className="w-full h-auto max-h-[620px]"
        role="img"
        aria-label="Medical-grade human anatomy atlas showing skeletal, muscular, respiratory, circulatory, digestive, renal and nervous systems with horizontal leader lines and surrounding anatomical vignettes"
      >
        <defs>
          {/* Parchment & X-Ray Gradients */}
          <radialGradient id="folioVignette" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#EAD8B5" />
            <stop offset="75%" stopColor="#DFC9A1" />
            <stop offset="100%" stopColor="#C7AD7F" />
          </radialGradient>
          <radialGradient id="xrayBacklight" cx="50%" cy="46%" r="54%">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="realisticBone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isFolio ? '#C7B28E' : isXray ? '#38BDF8' : '#94A3B8'} />
            <stop offset="50%" stopColor={boneFill} />
            <stop offset="100%" stopColor={isFolio ? '#B8A07A' : isXray ? '#0284C7' : '#64748B'} />
          </linearGradient>
          <linearGradient id="realisticLung" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isFolio ? '#C67D6B' : isXray ? '#38BDF8' : '#60A5FA'} />
            <stop offset="100%" stopColor={isFolio ? '#8E493A' : isXray ? '#0369A1' : '#1D4ED8'} />
          </linearGradient>
          <linearGradient id="realisticMuscle" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isFolio ? '#8F3326' : '#991B1B'} />
            <stop offset="50%" stopColor={isFolio ? '#BE4F3E' : '#DC2626'} />
            <stop offset="100%" stopColor={isFolio ? '#75271C' : '#7F1D1D'} />
          </linearGradient>
        </defs>

        {/* Plate Background */}
        <rect
          x="0"
          y="0"
          width="720"
          height="740"
          fill={isFolio ? 'url(#folioVignette)' : bgFill}
        />
        {!isFolio && <rect x="0" y="0" width="720" height="740" fill="url(#xrayBacklight)" />}

        {/* Engraved Double Folio Border & Header Title Block (like Image 2) */}
        <rect
          x="10"
          y="10"
          width="700"
          height="720"
          fill="none"
          stroke={inkStroke}
          strokeWidth="2"
          opacity={isFolio ? 0.75 : 0.35}
        />
        <rect
          x="15"
          y="15"
          width="690"
          height="710"
          fill="none"
          stroke={inkStroke}
          strokeWidth="0.8"
          opacity={isFolio ? 0.6 : 0.25}
        />

        {/* Folio Header Inscription */}
        <text
          x="360"
          y="31"
          textAnchor="middle"
          fill={inkStroke}
          fontSize="10"
          fontWeight="700"
          letterSpacing="2.5"
        >
          TABULA ANATOMICA CORPORIS HUMANI · MORPHOLOGIA &amp; MYOLOGIA
        </text>

        {/* Vertical Graduated Anthropometry Ruler Scales on Left (X=174) & Right (X=546) of Central Figure */}
        <g stroke={mutedInk} strokeWidth="0.8" opacity={isFolio ? 0.8 : 0.45}>
          <line x1="176" y1="45" x2="176" y2="700" />
          <line x1="544" y1="45" x2="544" y2="700" />
          {Array.from({ length: 37 }, (_, i) => 50 + i * 18).map((y, idx) => {
            const cm = 180 - idx * 5;
            const isMajor = idx % 2 === 0;
            return (
              <g key={y}>
                <line x1={isMajor ? 168 : 172} y1={y} x2="176" y2={y} />
                <line x1="544" y1={y} x2={isMajor ? 552 : 548} y2={y} />
                {isMajor && (
                  <>
                    <text
                      x="165"
                      y={y + 3}
                      textAnchor="end"
                      fill={mutedInk}
                      fontSize="7"
                      stroke="none"
                    >
                      {cm}
                    </text>
                    <text
                      x="555"
                      y={y + 3}
                      textAnchor="start"
                      fill={mutedInk}
                      fontSize="7"
                      stroke="none"
                    >
                      {cm}
                    </text>
                  </>
                )}
              </g>
            );
          })}
          {/* Vitruvian 8-Head Proportion Horizon Lines */}
          {[122, 202, 282, 362, 442, 522, 602].map((hy) => (
            <line
              key={hy}
              x1="176"
              y1={hy}
              x2="544"
              y2={hy}
              strokeDasharray="2 5"
              strokeOpacity="0.45"
            />
          ))}
        </g>

        {/* =========================================================================
            LEFT & RIGHT ENGRAVED MARGINAL ANATOMICAL VIGNETTES (Fig. I – Fig. VI)
            Matching the surrounding botanical/anatomical sub-drawings in Image 2
           ========================================================================= */}
        <g opacity={isFolio ? 0.92 : 0.72}>
          {/* Fig. I (Top-Left): Cranial Base & Cerebral Vascular Circle of Willis */}
          <g
            transform="translate(24, 52)"
            onClick={() => onSelectCallout('brain-cns')}
            className="cursor-pointer"
          >
            <rect
              x="0"
              y="0"
              width="126"
              height="94"
              rx="4"
              fill={isFolio ? '#E5D1AA' : '#0D1729'}
              stroke={mutedInk}
              strokeWidth="0.9"
            />
            <text x="63" y="13" textAnchor="middle" fill={inkStroke} fontSize="7.5" fontWeight="700">
              FIG. I · ENCEPHALON &amp; NERVI
            </text>
            <ellipse
              cx="63"
              cy="48"
              rx="34"
              ry="26"
              fill={isFolio ? '#D6B88D' : '#1E293B'}
              stroke={inkStroke}
              strokeWidth="1.3"
            />
            {/* Cerebral gyri & cerebellum foliations */}
            <path
              d="M63 22 L63 74 M38 38 Q50 32 61 42 M65 42 Q76 32 88 38 M36 50 Q50 45 61 52 M65 52 Q78 45 90 50 M42 62 Q52 68 61 62 M65 62 Q74 68 84 62"
              fill="none"
              stroke={inkStroke}
              strokeWidth="1.1"
            />
            {/* Cranial nerve roots radiating */}
            <path
              d="M58 46 L42 30 M68 46 L84 30 M56 56 L36 62 M70 56 L90 62"
              stroke={muscleFill}
              strokeWidth="1.2"
            />
            <text x="63" y="87" textAnchor="middle" fill={mutedInk} fontSize="7" fontStyle="italic">
              Basis Cranii &amp; Arbor Vitae
            </text>
          </g>

          {/* Fig. II (Mid-Left): Bronchial Tree & Pulmonary Alveolar Lobules */}
          <g
            transform="translate(24, 558)"
            onClick={() => onSelectCallout('lungs-lobes')}
            className="cursor-pointer"
          >
            <rect
              x="0"
              y="0"
              width="126"
              height="136"
              rx="4"
              fill={isFolio ? '#E5D1AA' : '#0D1729'}
              stroke={mutedInk}
              strokeWidth="0.9"
            />
            <text x="63" y="13" textAnchor="middle" fill={inkStroke} fontSize="7.5" fontWeight="700">
              FIG. II · ARBOR BRONCHIALIS
            </text>
            {/* Trachea with C-rings branching into finely ramified bronchial tree */}
            <line x1="63" y1="22" x2="63" y2="54" stroke={inkStroke} strokeWidth="5" />
            {[26, 32, 38, 44, 50].map((ry) => (
              <line key={ry} x1="60" y1={ry} x2="66" y2={ry} stroke={boneFill} strokeWidth="1.2" />
            ))}
            {/* Left & Right Lung contour with branching bronchioles */}
            <path
              d="M58 38 C32 38, 22 72, 26 106 C30 116, 52 114, 58 98 Z M68 38 C94 38, 104 72, 100 106 C96 116, 74 114, 68 98 Z"
              fill="url(#realisticLung)"
              fillOpacity="0.45"
              stroke={inkStroke}
              strokeWidth="1.3"
            />
            <path
              d="M63 54 L44 68 L32 82 M44 68 L48 94 M44 68 L34 62 M63 54 L82 68 L94 82 M82 68 L78 94 M82 68 L92 62"
              fill="none"
              stroke={inkStroke}
              strokeWidth="1.4"
            />
            <text x="63" y="128" textAnchor="middle" fill={mutedInk} fontSize="7" fontStyle="italic">
              Pulmones &amp; Diaphragma
            </text>
          </g>

          {/* Fig. III (Top-Right): Cardiac Chambers, Valves & Coronary Vessels */}
          <g
            transform="translate(570, 52)"
            onClick={() => onSelectCallout('heart-chambers')}
            className="cursor-pointer"
          >
            <rect
              x="0"
              y="0"
              width="126"
              height="94"
              rx="4"
              fill={isFolio ? '#E5D1AA' : '#0D1729'}
              stroke={mutedInk}
              strokeWidth="0.9"
            />
            <text x="63" y="13" textAnchor="middle" fill={inkStroke} fontSize="7.5" fontWeight="700">
              FIG. III · COR &amp; AORTA
            </text>
            {/* Aortic arch + Vena Cava + Heart with coronary tree */}
            <path
              d="M56 42 C54 22, 74 22, 74 42"
              fill="none"
              stroke={muscleFill}
              strokeWidth="4"
            />
            <path
              d="M46 38 C32 42, 34 68, 64 78 C88 70, 88 42, 70 38 Z"
              fill={muscleFill}
              fillOpacity="0.75"
              stroke={inkStroke}
              strokeWidth="1.3"
            />
            <path
              d="M58 42 C60 54, 66 64, 70 74 M60 54 L48 60 M64 62 L76 64"
              fill="none"
              stroke={boneFill}
              strokeWidth="1.2"
            />
            <text x="63" y="88" textAnchor="middle" fill={mutedInk} fontSize="7" fontStyle="italic">
              Ventriculus Sinister &amp; Dexter
            </text>
          </g>

          {/* Fig. IV (Bottom-Right): Renal Medullary Pyramids & Arterial Plexus */}
          <g
            transform="translate(570, 558)"
            onClick={() => onSelectCallout('kidneys')}
            className="cursor-pointer"
          >
            <rect
              x="0"
              y="0"
              width="126"
              height="136"
              rx="4"
              fill={isFolio ? '#E5D1AA' : '#0D1729'}
              stroke={mutedInk}
              strokeWidth="0.9"
            />
            <text x="63" y="13" textAnchor="middle" fill={inkStroke} fontSize="7.5" fontWeight="700">
              FIG. IV · RENES &amp; PLEXUS
            </text>
            {/* Left & Right Kidneys connected to Abdominal Aorta & Vena Cava */}
            <line x1="60" y1="24" x2="60" y2="112" stroke={muscleFill} strokeWidth="3.2" />
            <line x1="66" y1="24" x2="66" y2="112" stroke="#1D4ED8" strokeWidth="3.2" />
            <path
              d="M42 44 C24 42, 22 78, 42 78 C48 78, 48 66, 44 60 C48 54, 48 44, 42 44 Z"
              fill={muscleFill}
              fillOpacity="0.8"
              stroke={inkStroke}
              strokeWidth="1.3"
            />
            <path
              d="M84 44 C102 42, 104 78, 84 78 C78 78, 78 66, 82 60 C78 54, 78 44, 84 44 Z"
              fill={muscleFill}
              fillOpacity="0.8"
              stroke={inkStroke}
              strokeWidth="1.3"
            />
            <line x1="46" y1="60" x2="60" y2="60" stroke={muscleFill} strokeWidth="2" />
            <line x1="66" y1="60" x2="80" y2="60" stroke="#1D4ED8" strokeWidth="2" />
            {/* Ureters & Bladder */}
            <path d="M45 66 Q54 92 58 104 M81 66 Q72 92 68 104" fill="none" stroke={inkStroke} strokeWidth="1.2" />
            <ellipse cx="63" cy="108" rx="9" ry="7" fill={boneFill} stroke={inkStroke} strokeWidth="1.2" />
            <text x="63" y="128" textAnchor="middle" fill={mutedInk} fontSize="7" fontStyle="italic">
              Cortex, Medulla &amp; Ureteres
            </text>
          </g>
        </g>

        {/* =========================================================================
            CENTRAL FULL-LENGTH REALISTIC HUMAN ÉCORCHÉ & ANATOMICAL FIGURE (X = 360)
           ========================================================================= */}
        <g>
          {/* 1. Realistic Human Silhouette & Subcutaneous Contour */}
          <g
            fill={skinFill}
            fillOpacity={isFolio ? 0.55 : isXray ? 0.08 : 0.11}
            stroke={inkStroke}
            strokeWidth={isFolio ? '1.6' : '1.3'}
            strokeOpacity={isFolio ? 0.85 : 0.42}
          >
            {/* Realistic Head, Ears, Neck & Trapezius Slope */}
            <path d="M360 46 C340 46, 330 62, 332 82 C328 83, 326 90, 332 94 C334 106, 344 116, 360 118 C376 116, 386 106, 388 94 C394 90, 392 83, 388 82 C390 62, 380 46, 360 46 Z" />
            {/* Full-Body Muscular Silhouette: Deltoids, Biceps, Forearms, Hands, Torso, Thighs, Calves, Feet */}
            <path d="M344 115 L342 132 C322 140, 290 144, 274 162 C262 176, 256 202, 248 236 C238 268, 224 304, 214 338 L194 358 L200 364 L214 354 L206 376 L212 380 L222 358 L218 382 L225 382 L232 356 L236 372 L242 370 L238 342 C252 308, 266 274, 276 244 C284 222, 290 202, 296 196 L300 262 C298 294, 292 326, 288 364 C284 406, 290 456, 296 504 C294 548, 298 598, 304 646 L290 676 L322 678 L326 646 C332 598, 336 550, 336 504 C340 458, 348 422, 354 394 L366 394 C372 422, 380 458, 384 504 C384 550, 388 598, 394 646 L398 678 L430 676 L416 646 C422 598, 426 548, 424 504 C430 456, 436 406, 432 364 C428 326, 422 294, 420 262 L424 196 C430 202, 436 222, 444 244 C454 274, 468 308, 482 342 L478 370 L484 372 L488 356 L495 382 L502 382 L498 358 L508 380 L514 376 L506 354 L520 364 L526 358 L506 338 C496 304, 482 268, 472 236 C464 202, 458 176, 446 162 C430 144, 398 140, 378 132 L376 115 Z" />
          </g>

          {/* 2. Realistic Facial Features & Split-Head Myology (Frontalis, Orbicularis Oculi, Zygomaticus, Sternocleidomastoid) */}
          <g stroke={inkStroke} fill="none" opacity={isFolio ? 0.85 : 0.65}>
            {/* Left side of face: anatomical eyes, nose bridge, philtrum & lips; Right side: écorché facial muscles */}
            <path d="M360 48 L360 118" strokeWidth="0.7" strokeDasharray="2 2" />
            {/* Eyes & brows */}
            <path d="M340 74 Q348 70 355 74 M365 74 Q372 70 380 74" strokeWidth="1.3" />
            <ellipse cx="348" cy="78" rx="5" ry="2.8" strokeWidth="1.1" />
            <circle cx="348" cy="78" r="1.5" fill={inkStroke} />
            <ellipse cx="372" cy="78" rx="5" ry="2.8" strokeWidth="1.1" />
            <circle cx="372" cy="78" r="1.5" fill={inkStroke} />
            {/* Nose & Mouth */}
            <path d="M360 74 L357 91 L363 91" strokeWidth="1.1" />
            <path d="M350 100 Q360 97 370 100 Q360 105 350 100 Z" strokeWidth="1.1" />
            {/* Right Hemifacial Muscle Striations (Frontalis, Orbicularis Oculi, Masseter) */}
            <path
              d="M363 54 L363 70 M368 55 L370 70 M374 58 L377 71 M364 84 Q376 86 384 78 M368 94 L383 88 M370 102 L382 96"
              stroke={muscleFill}
              strokeWidth="0.9"
            />
            {/* Sternocleidomastoid V-muscles in neck */}
            <path
              d="M338 108 L356 146 M343 112 L358 146 M382 108 L364 146 M377 112 L362 146"
              stroke={muscleFill}
              strokeWidth="1.3"
            />
          </g>

          {/* =====================================================================
              LAYER A: ÉCORCHÉ MUSCULAR SYSTEM (Deltoid, Pectoralis cut-away, Biceps,
              Forearm Flexors, Quadriceps Femoris, Sartorius, Gastrocnemius/Tibialis)
             ===================================================================== */}
          {layers.muscular && (
            <g opacity={isXray ? 0.25 : 0.88}>
              {/* Left & Right Deltoid, Biceps Brachii & Brachioradialis with striated muscle fibres */}
              <path
                d="M304 146 C282 148, 266 168, 262 198 C272 192, 288 182, 300 172 Z M416 146 C438 148, 454 168, 458 198 C448 192, 432 182, 420 172 Z"
                fill="url(#realisticMuscle)"
                stroke={muscleStroke}
                strokeWidth="1.1"
              />
              {/* Left & Right Biceps/Brachialis & Forearm Flexor Bellies */}
              <path
                d="M266 196 C256 218, 252 240, 256 260 C268 248, 278 224, 286 196 Z M454 196 C464 218, 468 240, 464 260 C452 248, 442 224, 434 196 Z"
                fill="url(#realisticMuscle)"
                stroke={muscleStroke}
                strokeWidth="1.1"
              />
              <path
                d="M254 262 C240 284, 232 312, 226 338 L236 340 C248 316, 260 290, 268 264 Z M466 262 C480 284, 488 312, 494 338 L484 340 C472 316, 460 290, 452 264 Z"
                fill="url(#realisticMuscle)"
                stroke={muscleStroke}
                strokeWidth="1"
              />

              {/* Left Thigh Écorché: Rectus Femoris (bipennate feather striations), Vastus Lateralis, Vastus Medialis, Sartorius */}
              <path
                d="M296 376 C288 416, 290 462, 302 496 L326 496 C338 462, 344 416, 336 376 Z"
                fill="url(#realisticMuscle)"
                fillOpacity="0.82"
                stroke={muscleStroke}
                strokeWidth="1.2"
              />
              {/* Bipennate Rectus Femoris muscle fiber hatching */}
              <path
                d="M314 384 L314 488 M314 396 L300 412 M314 410 L298 426 M314 424 L298 440 M314 438 L300 454 M314 452 L302 468 M314 396 L328 412 M314 410 L330 426 M314 424 L330 440 M314 438 L328 454 M314 452 L326 468"
                stroke={boneFill}
                strokeWidth="0.8"
                opacity="0.65"
              />
              {/* Sartorius strap muscle */}
              <path
                d="M294 368 C312 406, 326 448, 332 496"
                fill="none"
                stroke={boneFill}
                strokeWidth="2.2"
                opacity="0.7"
              />

              {/* Right Thigh & Lower Leg Gastrocnemius / Tibialis Anterior Bellies */}
              <path
                d="M384 376 C376 416, 382 462, 394 496 L418 496 C430 462, 432 416, 424 376 Z"
                fill="url(#realisticMuscle)"
                fillOpacity="0.55"
                stroke={muscleStroke}
                strokeWidth="1.1"
              />
              <path
                d="M300 518 C294 552, 298 594, 308 634 L322 634 C330 594, 332 552, 326 518 Z M394 518 C388 552, 390 594, 398 634 L412 634 C422 594, 426 552, 420 518 Z"
                fill="url(#realisticMuscle)"
                fillOpacity="0.68"
                stroke={muscleStroke}
                strokeWidth="1.1"
              />
            </g>
          )}

          {/* =====================================================================
              LAYER 1: SKELETAL SYSTEM (Cranium, Clavicles, Sternum, 12-Pair Ribcage,
              Spine, Humerus, Radius/Ulna, Pelvis, Femur, Patella, Tibia/Fibula)
             ===================================================================== */}
          {layers.skeletal && (
            <g>
              {/* Vertebral Column C1–L5 & Sacrum */}
              {Array.from({ length: 19 }, (_, i) => 118 + i * 13.5).map((vy, idx) => (
                <g key={vy}>
                  <rect
                    x={352 - (idx > 12 ? 2 : 0)}
                    y={vy}
                    width={idx > 12 ? 20 : 16}
                    height="9"
                    rx="2.5"
                    fill="url(#realisticBone)"
                    stroke={boneStroke}
                    strokeWidth="1"
                  />
                  {/* Transverse processes */}
                  <line
                    x1={347}
                    y1={vy + 4.5}
                    x2={373}
                    y2={vy + 4.5}
                    stroke={boneStroke}
                    strokeWidth="1.4"
                  />
                </g>
              ))}
              {/* Sacrum with sacral foramina */}
              <path
                d="M342 372 L378 372 L366 410 L354 410 Z"
                fill="url(#realisticBone)"
                stroke={boneStroke}
                strokeWidth="1.3"
              />

              {/* S-Shaped Clavicles & 3-Part Sternum (Manubrium, Body, Xiphoid) */}
              <path
                d="M354 146 C332 138, 304 140, 286 150 M366 146 C388 138, 416 140, 434 150"
                fill="none"
                stroke="url(#realisticBone)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M352 146 L368 146 L365 166 L366 232 L360 246 L354 232 L355 166 Z"
                fill="url(#realisticBone)"
                stroke={boneStroke}
                strokeWidth="1.2"
              />

              {/* 12-Pair Rib Cage (Exposed Anteriorly & Cutaway to Reveal Viscera) */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => {
                const ry = 156 + r * 12.5;
                const w = 48 + (r < 5 ? r * 3.5 : (9 - r) * 3);
                return (
                  <g key={r}>
                    <path
                      d={`M354 ${ry} C${336 - r} ${ry - 2}, ${360 - w} ${ry + 5}, ${360 - w + 8} ${ry + 17}`}
                      fill="none"
                      stroke="url(#realisticBone)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M366 ${ry} C${384 + r} ${ry - 2}, ${360 + w} ${ry + 5}, ${360 + w - 8} ${ry + 17}`}
                      fill="none"
                      stroke="url(#realisticBone)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* Upper Limb Bones: Humerus, Radius, Ulna & Carpal/Metacarpal Phalanges */}
              <g stroke="url(#realisticBone)" strokeLinecap="round" fill="none">
                <line x1="286" y1="156" x2="262" y2="254" strokeWidth="6.5" />
                <circle cx="286" cy="156" r="6" fill="url(#realisticBone)" stroke={boneStroke} strokeWidth="1" />
                <circle cx="262" cy="254" r="5" fill="url(#realisticBone)" stroke={boneStroke} strokeWidth="1" />
                <line x1="259" y1="258" x2="226" y2="342" strokeWidth="3.8" />
                <line x1="265" y1="258" x2="234" y2="342" strokeWidth="3.4" />

                <line x1="434" y1="156" x2="458" y2="254" strokeWidth="6.5" />
                <circle cx="434" cy="156" r="6" fill="url(#realisticBone)" stroke={boneStroke} strokeWidth="1" />
                <circle cx="458" cy="254" r="5" fill="url(#realisticBone)" stroke={boneStroke} strokeWidth="1" />
                <line x1="461" y1="258" x2="494" y2="342" strokeWidth="3.8" />
                <line x1="455" y1="258" x2="486" y2="342" strokeWidth="3.4" />
              </g>

              {/* Pelvic Girdle (Iliac Crests, Ischial Tuberosity, Pubic Symphysis & Acetabulum) */}
              <path
                d="M342 368 C306 346, 290 382, 312 408 L352 416 L368 416 L408 408 C430 382, 414 346, 378 368 Z"
                fill="url(#realisticBone)"
                fillOpacity="0.65"
                stroke={boneStroke}
                strokeWidth="2.2"
              />
              <ellipse cx="332" cy="404" rx="8" ry="5.5" fill={bgFill} stroke={boneStroke} strokeWidth="1.2" />
              <ellipse cx="388" cy="404" rx="8" ry="5.5" fill={bgFill} stroke={boneStroke} strokeWidth="1.2" />

              {/* Lower Limb Bones: Femoral Head/Neck, Femur Shaft, Patella, Tibia & Fibula */}
              <g stroke="url(#realisticBone)" strokeLinecap="round" fill="none">
                {/* Left Femur, Patella, Tibia, Fibula */}
                <circle cx="314" cy="402" r="6.5" fill="url(#realisticBone)" stroke={boneStroke} strokeWidth="1" />
                <path d="M312 406 L304 416 L314 504" strokeWidth="7.5" />
                <circle cx="314" cy="508" r="6.5" fill="url(#realisticBone)" stroke={boneStroke} strokeWidth="1.2" />
                <line x1="316" y1="516" x2="314" y2="646" strokeWidth="6" />
                <line x1="307" y1="518" x2="306" y2="646" strokeWidth="3" />

                {/* Right Femur, Patella, Tibia, Fibula */}
                <circle cx="406" cy="402" r="6.5" fill="url(#realisticBone)" stroke={boneStroke} strokeWidth="1" />
                <path d="M408 406 L416 416 L406 504" strokeWidth="7.5" />
                <circle cx="406" cy="508" r="6.5" fill="url(#realisticBone)" stroke={boneStroke} strokeWidth="1.2" />
                <line x1="404" y1="516" x2="406" y2="646" strokeWidth="6" />
                <line x1="413" y1="518" x2="414" y2="646" strokeWidth="3" />
              </g>
            </g>
          )}

          {/* =====================================================================
              LAYER 2: RESPIRATORY SYSTEM (Larynx, C-Ring Trachea, 5 Lung Lobes,
              Bronchial Tree & Diaphragm Dome)
             ===================================================================== */}
          {layers.respiratory && (
            <g>
              {/* Thyroid/Cricoid Larynx & C-Ring Trachea */}
              <line x1="360" y1="114" x2="360" y2="178" stroke={boneFill} strokeWidth="8.5" strokeLinecap="round" />
              {[120, 128, 136, 144, 152, 160, 168].map((ty) => (
                <line key={ty} x1="356" y1={ty} x2="364" y2={ty} stroke={boneStroke} strokeWidth="1.6" />
              ))}

              {/* Right Lung (3 lobes) & Left Lung (2 lobes + cardiac notch) */}
              <path
                d="M350 166 C322 162, 304 196, 304 242 C304 264, 326 268, 350 252 Z"
                fill="url(#realisticLung)"
                fillOpacity="0.78"
                stroke={inkStroke}
                strokeWidth="1.5"
              />
              {/* Right Lung horizontal & oblique interlobar fissures */}
              <path
                d="M306 208 Q328 212 350 206 M308 242 Q330 232 350 226"
                fill="none"
                stroke={boneFill}
                strokeWidth="1.1"
                strokeDasharray="3 2"
              />

              {/* Left Lung */}
              <path
                d="M370 166 C398 162, 416 196, 416 242 C416 264, 394 268, 382 252 C386 232, 380 218, 370 212 Z"
                fill="url(#realisticLung)"
                fillOpacity="0.78"
                stroke={inkStroke}
                strokeWidth="1.5"
              />
              {/* Internal Bronchial Ramifications */}
              <path
                d="M360 176 L334 196 L318 214 M334 196 L328 238 M360 176 L386 196 L402 214 M386 196 L394 238"
                fill="none"
                stroke={boneFill}
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Muscular Thoracic Diaphragm Dome */}
              <path
                d="M302 264 Q360 240 418 264"
                fill="none"
                stroke={muscleFill}
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* =====================================================================
              LAYER 3: DIGESTIVE & HEPATO-BILIARY SYSTEM (Liver, Gallbladder,
              Stomach with Rugae, Pancreas, Coiled Jejunum/Ileum & Haustrated Colon)
             ===================================================================== */}
          {layers.digestive && (
            <g>
              {/* Bi-lobed Liver (Right Upper Quadrant) */}
              <path
                d="M306 266 Q336 252 368 270 L346 302 Q314 302 306 266 Z"
                fill={isFolio ? '#7D2E22' : '#991B1B'}
                stroke={inkStroke}
                strokeWidth="1.5"
              />
              {/* Pear-shaped Green Gallbladder */}
              <ellipse
                cx="336"
                cy="296"
                rx="7"
                ry="4.5"
                fill="#15803D"
                stroke="#86EFAC"
                strokeWidth="1.2"
              />

              {/* J-Shaped Stomach (Left Upper Quadrant) */}
              <path
                d="M368 262 C398 260, 412 284, 396 306 C384 318, 362 314, 356 302 C364 292, 372 278, 368 262 Z"
                fill={isFolio ? '#C26D53' : '#DB2777'}
                stroke={inkStroke}
                strokeWidth="1.5"
              />
              {/* Yellow Pancreas in Duodenal C-loop */}
              <path
                d="M356 308 Q378 304 394 314 Q376 322 356 314 Z"
                fill="#EAB308"
                stroke={inkStroke}
                strokeWidth="1.1"
              />

              {/* Haustrated Ascending, Transverse & Descending Colon */}
              <path
                d="M320 378 L320 322 Q360 314 400 322 L400 378 L360 392 L360 408"
                fill="none"
                stroke={isFolio ? '#8C4A38' : '#BE185D'}
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Coiled Small Intestine (Duodenum, Jejunum, Ileum) */}
              <path
                d="M336 334 Q360 326 384 336 Q334 346 384 356 Q336 368 380 376"
                fill="none"
                stroke={isFolio ? '#D6987C' : '#F472B6'}
                strokeWidth="5.5"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* =====================================================================
              LAYER 4: RENAL & EXCRETORY SYSTEM (Kidneys, Renal Vessels, Ureters, Bladder)
             ===================================================================== */}
          {layers.renal && (
            <g>
              {/* Left & Right Retroperitoneal Kidneys */}
              <path
                d="M332 300 C316 298, 314 328, 332 328 C338 328, 338 318, 335 314 C338 308, 338 300, 332 300 Z"
                fill="#C2410C"
                stroke={boneFill}
                strokeWidth="1.5"
              />
              <path
                d="M388 300 C404 298, 406 328, 388 328 C382 328, 382 318, 385 314 C382 308, 382 300, 388 300 Z"
                fill="#C2410C"
                stroke={boneFill}
                strokeWidth="1.5"
              />
              {/* Ureters & Urinary Bladder */}
              <path
                d="M336 316 Q346 358 353 386 M384 316 Q374 358 367 386"
                fill="none"
                stroke="#FDBA74"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <ellipse
                cx="360"
                cy="392"
                rx="13"
                ry="10"
                fill="#EA580C"
                stroke={boneFill}
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* =====================================================================
              LAYER 5: CIRCULATORY / CARDIOVASCULAR SYSTEM (4-Chamber Heart,
              Aortic Arch, Carotid/Brachial/Renal/Femoral Arteries & Venous Tree)
             ===================================================================== */}
          {layers.circulatory && (
            <g>
              {/* Systemic Arterial Tree (Crimson Red) */}
              <g fill="none" stroke="#DC2626" strokeWidth="2.6" strokeLinecap="round">
                {/* Aortic Arch & Descending Dorsal Aorta */}
                <path d="M366 212 C364 180, 382 180, 374 210 L364 368" />
                {/* Common Carotid Arteries to Head/Brain */}
                <path d="M368 186 L366 120 L352 72 M368 186 L372 72" />
                {/* Subclavian, Brachial, Radial & Ulnar Arteries */}
                <path d="M366 160 L292 166 L262 254 L232 342 M366 160 L428 166 L458 254 L488 342" />
                {/* Renal Arteries */}
                <path d="M364 314 L336 314 M364 314 L384 314" />
                {/* Common Iliac, Femoral, Popliteal & Tibial Arteries */}
                <path d="M364 368 L322 416 L316 512 L314 642 M364 368 L398 416 L404 512 L406 642" />
              </g>

              {/* Systemic Venous Tree (Venous Blue) */}
              <g
                fill="none"
                stroke="#1D4ED8"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.9"
              >
                {/* Superior & Inferior Vena Cava & Jugular Veins */}
                <path d="M352 74 L352 368" />
                {/* Subclavian, Cephalic/Basilic Arm Veins */}
                <path d="M352 164 L286 172 L256 254 L224 342 M352 164 L422 172 L452 254 L482 342" />
                {/* Femoral & Great Saphenous Leg Veins */}
                <path d="M352 368 L312 416 L308 512 L306 642 M352 368 L390 416 L396 512 L398 642" />
              </g>

              {/* 4-Chamber Heart with Coronary Branches & Left-Pointing Apex */}
              <path
                d="M365 202 C348 188, 340 216, 370 238 C394 218, 384 188, 365 202 Z"
                fill="#B91C1C"
                stroke="#FCA5A5"
                strokeWidth="2"
              />
              <path
                d="M364 206 C366 216, 370 226, 374 234 M366 218 L356 222"
                fill="none"
                stroke="#FEF08A"
                strokeWidth="1.2"
              />
              <circle cx="368" cy="216" r="4" fill="#FCA5A5" className="animate-ping" />
            </g>
          )}

          {/* =====================================================================
              LAYER 6: NERVOUS SYSTEM (Cerebrum, Cerebellum, Spinal Cord,
              Brachial & Sciatic Nerve Plexuses)
             ===================================================================== */}
          {layers.nervous && (
            <g>
              {/* Brain Hemispheres & Gyri */}
              <path
                d="M336 62 C338 44, 382 44, 384 62 C386 76, 376 84, 360 84 C344 84, 334 76, 336 62 Z"
                fill="#FACC15"
                fillOpacity="0.65"
                stroke="#CA8A04"
                strokeWidth="1.8"
              />
              {/* Spinal Cord & Peripheral Plexuses */}
              <g
                fill="none"
                stroke={isFolio ? '#B45309' : '#FACC15'}
                strokeWidth="2"
                opacity="0.92"
              >
                <path d="M360 84 L360 368" strokeWidth="3.2" />
                <path d="M360 148 L286 156 L258 254 L228 342 M360 148 L434 156 L462 254 L492 342" />
                <path d="M360 368 L318 424 L312 524 L310 642 M360 368 L402 424 L408 524 L410 642" />
              </g>
            </g>
          )}
        </g>

        {/* =========================================================================
            PIN-SHARP CALLIGRAPHIC LEADER-LINE CALLOUTS (LEFT & RIGHT COLUMNS)
           ========================================================================= */}
        {visibleCallouts.map((c) => {
          const isSelected = c.id === selectedCallout.id;
          const isRevealed = !quizMode || Boolean(revealedQuizIds[c.id]);

          // Map old 540-wide X coordinates (centered at 270) to our 720-wide plate (centered at 360)
          const mappedAnchorX = c.anchorX + 90;
          const mappedAnchorY = c.anchorY + 14;
          const mappedLabelY = c.labelY + 72;

          const boxX = c.side === 'left' ? 22 : 562;
          const lineEndX = c.side === 'left' ? 158 : 562;
          const kneeX = c.side === 'left' ? 196 : 524;

          return (
            <g
              key={c.id}
              onClick={() => onSelectCallout(c.id)}
              className="cursor-pointer"
            >
              {/* Leader line from anatomical structure -> knee -> horizontal margin shelf */}
              <polyline
                points={`${mappedAnchorX},${mappedAnchorY} ${kneeX},${mappedLabelY} ${lineEndX},${mappedLabelY}`}
                fill="none"
                stroke={
                  isSelected
                    ? isFolio
                      ? '#991B1B'
                      : '#4ADE80'
                    : isFolio
                      ? '#3B2B1E'
                      : '#64748B'
                }
                strokeWidth={isSelected ? '1.9' : '1.1'}
                strokeDasharray={isSelected ? undefined : '2.5 2'}
              />

              {/* Target anatomical pin point */}
              <circle
                cx={mappedAnchorX}
                cy={mappedAnchorY}
                r={isSelected ? '4.5' : '3.2'}
                fill={
                  isSelected
                    ? isFolio
                      ? '#991B1B'
                      : '#4ADE80'
                    : isFolio
                      ? '#261C14'
                      : '#38BDF8'
                }
                stroke={boneFill}
                strokeWidth="1.2"
              />

              {/* Callout Label Plaque */}
              <rect
                x={boxX}
                y={mappedLabelY - 10}
                width="136"
                height="20"
                rx="4"
                fill={
                  isSelected
                    ? isFolio
                      ? '#8F3326'
                      : '#132A24'
                    : isFolio
                      ? '#EAD8B5'
                      : '#0F172A'
                }
                stroke={
                  isSelected
                    ? isFolio
                      ? '#261C14'
                      : '#4ADE80'
                    : isFolio
                      ? '#6E553C'
                      : '#22304A'
                }
                strokeWidth={isSelected ? '1.6' : '1'}
              />

              <text
                x={c.side === 'left' ? boxX + 6 : boxX + 130}
                y={mappedLabelY + 3}
                textAnchor={c.side === 'left' ? 'start' : 'end'}
                fill={
                  isSelected
                    ? '#FFFFFF'
                    : isRevealed
                      ? isFolio
                        ? '#20160E'
                        : '#E2E8F0'
                      : '#D97706'
                }
                fontSize="8.3"
                fontWeight={isSelected ? '700' : '600'}
              >
                {isRevealed ? `${c.figNum} · ${c.label}` : `${c.figNum} · ❓ Reveal`}
              </text>
            </g>
          );
        })}

        {/* Plate Footer Caption */}
        <text
          x="360"
          y="718"
          textAnchor="middle"
          fill={mutedInk}
          fontSize="8.5"
          fontStyle="italic"
        >
          Fig. Generalis — Cutaway Écorché &amp; Visceral Morphology (Scale 1 : 10 · 180 cm Vitruvian
          Canon)
        </text>
      </svg>
    </div>
  );
}
