import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LabLayout } from '../../lab-shell/LabLayout';

type DissectionStep = 1 | 2 | 3 | 4 | 5;
type InstrumentId = 'pins' | 'scalpel' | 'scissors' | 'lens' | 'seeker';
type SpecimenSpecies = 'rabbit' | 'rat';
type PlateTheme = 'textbook-cream' | 'dark-bench';

type OrganId =
  | 'trachea'
  | 'heart'
  | 'lungs'
  | 'liver'
  | 'gall-bladder'
  | 'colon'
  | 'rectum'
  | 'bladder'
  | 'diaphragm'
  | 'stomach'
  | 'pancreas'
  | 'spleen'
  | 'small-intestine'
  | 'ovary'
  | 'kidney'
  | 'mesentery'
  | 'ureter'
  | 'anus';

interface DissectionOrgan {
  id: OrganId;
  label: string;
  name: string;
  latinName: string;
  system: string;
  side: 'left' | 'right';
  anchorX: number;
  anchorY: number;
  labelY: number;
  description: string;
  spotIt: string;
  examAdaptation: string;
}

const DISSECTION_ORGANS: DissectionOrgan[] = [
  // Left-column labels (top to bottom, matching the reference Rabbit Anatomy 101 plate)
  {
    id: 'trachea',
    label: 'trachea',
    name: 'Trachea (Windpipe)',
    latinName: 'Trachea cartilaginea',
    system: 'RESPIRATORY SYSTEM',
    side: 'left',
    anchorX: 356,
    anchorY: 162,
    labelY: 162,
    description:
      'Flexible tubular airway reinforced by incomplete C-shaped hyaline cartilage rings that conduct air from the larynx down to the bronchi.',
    spotIt: 'Segmented pale ringed tube descending down the midline of the neck into the anterior thorax.',
    examAdaptation:
      'Cartilage C-rings prevent collapse under negative inspiratory pressure; ciliated epithelium sweeps mucus upward.',
  },
  {
    id: 'heart',
    label: 'heart',
    name: 'Heart (4-Chambered)',
    latinName: 'Cor mammalianum',
    system: 'CIRCULATORY SYSTEM',
    side: 'left',
    anchorX: 356,
    anchorY: 222,
    labelY: 196,
    description:
      'Conical four-chambered muscular pump enclosed in the pericardium between the lungs; drives double circulation through pulmonary and systemic arches.',
    spotIt: 'Bright crimson conical organ with a yellow coronary sulcus and red aortic arch in the centre of the thorax.',
    examAdaptation:
      'Complete interventricular septum prevents mixing of oxygenated and deoxygenated blood (endothermy).',
  },
  {
    id: 'lungs',
    label: 'lungs',
    name: 'Lungs (Right & Left Lobes)',
    latinName: 'Pulmones',
    system: 'RESPIRATORY SYSTEM',
    side: 'left',
    anchorX: 322,
    anchorY: 238,
    labelY: 230,
    description:
      'Spongy, elastic vascular organs filling the pleural cavities on either side of the heart where alveolar gas exchange occurs.',
    spotIt: 'Paired stippled rose-violet lobes cradling the heart above the dome of the diaphragm.',
    examAdaptation:
      'Millions of thin-walled, moist, vascularized alveoli provide a huge surface-area-to-volume ratio for O₂/CO₂ diffusion.',
  },
  {
    id: 'liver',
    label: 'liver',
    name: 'Liver (Multi-Lobed)',
    latinName: 'Hepar',
    system: 'DIGESTIVE & METABOLIC',
    side: 'left',
    anchorX: 318,
    anchorY: 286,
    labelY: 266,
    description:
      'Largest visceral gland divided into 4–5 overlapping dark reddish-brown lobes fitted against the concave surface of the diaphragm. Secretes bile, stores glycogen, and detoxifies blood.',
    spotIt: 'Large overlapping terracotta/red-brown lobes immediately posterior to the diaphragm dome.',
    examAdaptation:
      'Receives nutrient-rich blood directly from the gut via the hepatic portal vein for homeostatic glucose regulation and deamination.',
  },
  {
    id: 'gall-bladder',
    label: 'gall bladder',
    name: 'Gall bladder',
    latinName: 'Vesica biliaris',
    system: 'DIGESTIVE SYSTEM',
    side: 'left',
    anchorX: 312,
    anchorY: 314,
    labelY: 302,
    description:
      'Pear-shaped green membranous sac embedded under the right central lobe of the liver; stores and concentrates alkaline bile before releasing it via the bile duct into the duodenum.',
    spotIt: 'Distinctive bright olive-green pouch peeking from beneath the right lobe of the liver.',
    examAdaptation:
      'Bile salts physically emulsify large lipid globules into micro-droplets to increase surface area for pancreatic lipase (Note: present in rabbit, absent in rat).',
  },
  {
    id: 'colon',
    label: 'colon',
    name: 'Caecum & Sacculated Colon',
    latinName: 'Caecum et Colon haustratum',
    system: 'DIGESTIVE SYSTEM',
    side: 'left',
    anchorX: 310,
    anchorY: 424,
    labelY: 356,
    description:
      'Wide, sacculated (haustrated) large intestine and blind-ending spiral caecum housing symbiotic cellulolytic bacteria that ferment plant cellulose and reabsorb water and electrolytes.',
    spotIt: 'Prominent segmented blue-grey sacculated coils with transverse constrictions (haustra) on the left and centre of the abdomen.',
    examAdaptation:
      'Exceptionally large caecum and sacculated colon in lagomorphs (rabbits) enable hindgut microbial fermentation of cellulose.',
  },
  {
    id: 'rectum',
    label: 'rectum',
    name: 'Rectum',
    latinName: 'Intestinum rectum',
    system: 'DIGESTIVE SYSTEM',
    side: 'left',
    anchorX: 334,
    anchorY: 492,
    labelY: 410,
    description:
      'Terminal straight posterior segment of the large intestine descending through the pelvic canal; molds undigested residue into dry faecal pellets.',
    spotIt: 'Beaded tubular tract descending toward the pelvic outlet behind the bladder.',
    examAdaptation:
      'Intense mucosal water reabsorption conserves body water and forms compact faecal pellets.',
  },
  {
    id: 'bladder',
    label: 'bladder',
    name: 'Urinary bladder',
    latinName: 'Vesica urinaria',
    system: 'EXCRETORY SYSTEM',
    side: 'left',
    anchorX: 354,
    anchorY: 544,
    labelY: 462,
    description:
      'Distensible pyriform muscular sac lined with transitional epithelium at the posterior ventral floor of the abdomen that stores urine delivered by the ureters.',
    spotIt: 'Golden-amber pear-shaped pouch lying ventrally at the caudal pelvic midline.',
    examAdaptation:
      'Transitional epithelium stretches from 6 cell layers to 2 without tearing as urine volume increases.',
  },

  // Right-column labels (top to bottom, matching the reference Rabbit Anatomy 101 plate)
  {
    id: 'diaphragm',
    label: 'diaphragm',
    name: 'Diaphragm',
    latinName: 'Diaphragma thoracis',
    system: 'RESPIRATORY SYSTEM',
    side: 'right',
    anchorX: 404,
    anchorY: 264,
    labelY: 204,
    description:
      'Dome-shaped musculotendinous partition separating the anterior thoracic cavity (heart and lungs) from the posterior abdominal (peritoneal) cavity.',
    spotIt: 'Curved muscular arch stretched between the base of the lungs and the anterior convex surface of the liver.',
    examAdaptation:
      'Diagnostic mammalian feature; flattens on contraction to increase thoracic volume and draw air into the lungs.',
  },
  {
    id: 'stomach',
    label: 'stomach',
    name: 'Stomach',
    latinName: 'Ventriculus (Gaster)',
    system: 'DIGESTIVE SYSTEM',
    side: 'right',
    anchorX: 382,
    anchorY: 320,
    labelY: 238,
    description:
      'Large J-shaped smooth-muscle sac (cardiac, fundus, and pyloric regions) tucked beneath the left lobes of the liver; churns food with gastric juice (HCl and pepsin).',
    spotIt: 'Smooth, curved violet-rose/blue-grey sac with surface blood vessels on the animal’s upper left side.',
    examAdaptation:
      'Three layers of smooth muscle (longitudinal, circular, oblique) churn bolus into acidic chyme; pyloric sphincter regulates exit.',
  },
  {
    id: 'pancreas',
    label: 'pancreas',
    name: 'Pancreas',
    latinName: 'Pancreas',
    system: 'DIGESTIVE & ENDOCRINE',
    side: 'right',
    anchorX: 364,
    anchorY: 350,
    labelY: 272,
    description:
      'Diffuse, lobulated golden-yellow dual gland suspended in the mesentery loop between the stomach and duodenum; secretes digestive enzymes and insulin/glucagon.',
    spotIt: 'Feathery yellow glandular tissue nestled inside the U-shaped duodenal loop below the stomach.',
    examAdaptation:
      'Exocrine acini secrete amylase, trypsinogen, and lipase into the pancreatic duct; endocrine Islets of Langerhans secrete insulin into blood.',
  },
  {
    id: 'spleen',
    label: 'spleen',
    name: 'Spleen',
    latinName: 'Lien (Splen)',
    system: 'LYMPHATIC & CIRCULATORY',
    side: 'right',
    anchorX: 404,
    anchorY: 344,
    labelY: 306,
    description:
      'Elongated dark crimson-maroon lymphoid organ attached to the greater curvature of the stomach by the gastrosplenic ligament; recycles aged erythrocytes and stores platelets/lymphocytes.',
    spotIt: 'Slender, flat dark-red tongue-like strip along the outer left rim of the stomach.',
    examAdaptation:
      'Red pulp phagocytoses senescent red blood cells (120-day lifespan) and salvages iron for haemoglobin synthesis.',
  },
  {
    id: 'small-intestine',
    label: 'small intestine',
    name: 'Small intestine',
    latinName: 'Intestinum tenue (Duodenum et Ileum)',
    system: 'DIGESTIVE SYSTEM',
    side: 'right',
    anchorX: 382,
    anchorY: 388,
    labelY: 340,
    description:
      'Long, slender convoluted tube (duodenum, jejunum, and ileum) where enzymatic digestion concludes and monosaccharides, amino acids, and fatty acids are absorbed across villi.',
    spotIt: 'Smooth folded blue-turquoise/pink intestinal loops occupying the right and central abdominal cavity.',
    examAdaptation:
      'Great length (~3 m in rabbit) and dense internal villi/microvilli maximize absorptive surface area.',
  },
  {
    id: 'ovary',
    label: 'ovary',
    name: 'Ovary / Gonad',
    latinName: 'Ovarium',
    system: 'REPRODUCTIVE & ENDOCRINE',
    side: 'right',
    anchorX: 374,
    anchorY: 432,
    labelY: 376,
    description:
      'Paired oval yellowish gonad situated caudal to the kidneys; produces ova (Graafian follicles) and secretes oestrogen and progesterone.',
    spotIt: 'Small lobulated golden-yellow oval body suspended near the posterior pole of the kidney.',
    examAdaptation:
      'Releases secondary oocytes into the funnel-shaped infundibulum of the oviduct (Fallopian tube).',
  },
  {
    id: 'kidney',
    label: 'kidney',
    name: 'Kidney',
    latinName: 'Ren',
    system: 'EXCRETORY SYSTEM',
    side: 'right',
    anchorX: 378,
    anchorY: 454,
    labelY: 412,
    description:
      'Paired bean-shaped retroperitoneal organs anchored against the dorsal body wall (right kidney sits slightly more anterior than the left); filters urea, salts, and water from blood.',
    spotIt: 'Smooth dark reddish-brown bean-shaped organ tucked dorsally behind the intestinal coils.',
    examAdaptation:
      'Contains ~1 million nephrons across outer cortex and inner medullary pyramids for counter-current osmoregulation.',
  },
  {
    id: 'mesentery',
    label: 'mesentery',
    name: 'Mesentery',
    latinName: 'Mesenterium',
    system: 'DIGESTIVE & VASCULAR',
    side: 'right',
    anchorX: 432,
    anchorY: 472,
    labelY: 448,
    description:
      'Double-layered fan-shaped fold of translucent serous peritoneum suspending the small intestine from the dorsal body wall and carrying branching mesenteric arteries, hepatic portal veins, lacteals, and nerves.',
    spotIt: 'Web-like olive-green translucent fan spread out on the lower right, traced with branching red/blue vessels.',
    examAdaptation:
      'Prevents intestinal tangling (volvulus) during peristalsis while routing absorbed nutrients straight into the hepatic portal circulation.',
  },
  {
    id: 'ureter',
    label: 'ureter',
    name: 'Ureter',
    latinName: 'Ureter',
    system: 'EXCRETORY SYSTEM',
    side: 'right',
    anchorX: 368,
    anchorY: 504,
    labelY: 484,
    description:
      'Slender muscular duct emerging from the concave renal hilum (pelvis) of each kidney and propelling urine by peristalsis into the dorsal wall of the urinary bladder.',
    spotIt: 'Fine pale tube running posteriorly along the dorsal psoas muscle from the kidney to the bladder.',
    examAdaptation:
      'Oblique entry into the bladder wall acts as a one-way flap valve preventing vesicoureteral reflux of urine.',
  },
  {
    id: 'anus',
    label: 'anus',
    name: 'Anus',
    latinName: 'Anus',
    system: 'DIGESTIVE SYSTEM',
    side: 'right',
    anchorX: 356,
    anchorY: 574,
    labelY: 522,
    description:
      'Terminal posterior opening of the digestive tract guarded by internal (involuntary smooth) and external (voluntary striated) anal sphincter muscles for egestion.',
    spotIt: 'Posterior midline aperture immediately ventral to the base of the tail.',
    examAdaptation:
      'Dual sphincter control regulates egestion of undigested cellulose pellets (and caecotrophy in lagomorphs).',
  },
];

const STEP_BANNERS: Record<DissectionStep, string> = {
  1: 'Step 1 — Pin the narcotized specimen ventral-side up on the dissecting board through all four paws.',
  2: 'Step 2 — Use forceps & scalpel to lift the ventral skin and make a shallow midline incision from pubis to lower jaw.',
  3: 'Step 3 — Reflect the skin and cut along the muscular body wall (linea alba) and rib cartilages without puncturing viscera.',
  4: 'Step 4 — Gently unfurl the vascular mesentery fan to the side and identify all 18 in-situ thoracic and abdominal structures.',
  5: 'Step 5 — Trace ducts with the seeker and verify your WAEC/NECO biological drawing rules (horizontal leader lines, no crossing).',
};

export function DissectionLab() {
  const navigate = useNavigate();
  const [step, setStep] = useState<DissectionStep>(4);
  const [species, setSpecies] = useState<SpecimenSpecies>('rabbit');
  const [plateTheme, setPlateTheme] = useState<PlateTheme>('textbook-cream');
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>('lens');
  const [selectedOrgan, setSelectedOrgan] = useState<OrganId>('liver');
  const [panelMode, setPanelMode] = useState<'learn' | 'quiz'>('learn');
  const [revealedQuizOrgans, setRevealedQuizOrgans] = useState<Record<string, boolean>>({});

  const isOpened = step >= 3;
  const activeOrgan =
    DISSECTION_ORGANS.find((o) => o.id === selectedOrgan) ?? DISSECTION_ORGANS[3]!;

  const handleSelectInstrument = (inst: InstrumentId) => {
    setSelectedInstrument(inst);
    if (inst === 'pins' && step === 1) setStep(2);
    else if (inst === 'scalpel' && step === 2) setStep(3);
    else if (inst === 'scissors' && step === 3) setStep(4);
    else if (inst === 'lens' && step < 4) setStep(4);
    else if (inst === 'seeker') setStep(5);
  };

  const handleSelectOrgan = (id: OrganId) => {
    if (!isOpened) setStep(4);
    setSelectedOrgan(id);
    if (panelMode === 'quiz') {
      setRevealedQuizOrgans((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const isCream = plateTheme === 'textbook-cream';

  return (
    <LabLayout
      experimentTitle={
        species === 'rabbit'
          ? 'Dissection of a Mammal (Rabbit — Oryctolagus cuniculus) · Ventral View'
          : 'Dissection of a Mammal (Rat — Rattus norvegicus) · Ventral View'
      }
      subtitle="Biology · 18 in-situ visceral structures · WAEC / NECO practical atlas"
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
            Human Anatomy Atlas
          </Link>
        </div>
      }
      leftTray={
        <div className="flex flex-col justify-between h-full gap-4">
          <div className="space-y-4">
            {/* Specimen Species Switcher */}
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2">
                MAMMALIAN SPECIMEN
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSpecies('rabbit')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    species === 'rabbit'
                      ? 'bg-[#4ADE80] border-[#4ADE80] text-[#0B1220]'
                      : 'bg-[#121A2B] border-[#22304A] text-[#E6EBF5]'
                  }`}
                >
                  Rabbit (Lagomorph)
                </button>
                <button
                  type="button"
                  onClick={() => setSpecies('rat')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    species === 'rat'
                      ? 'bg-[#4ADE80] border-[#4ADE80] text-[#0B1220]'
                      : 'bg-[#121A2B] border-[#22304A] text-[#E6EBF5]'
                  }`}
                >
                  Albino Rat (Rodent)
                </button>
              </div>
            </div>

            {/* Dissecting Kit Instruments */}
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2">
                DISSECTING KIT INSTRUMENTS
              </div>
              <div className="space-y-1.5">
                {[
                  { id: 'pins' as const, name: 'Dissecting T-pins', sub: 'pin paws at 45° angle' },
                  { id: 'scalpel' as const, name: 'Surgical scalpel', sub: 'midline ventral skin cut' },
                  {
                    id: 'scissors' as const,
                    name: 'Blunt-sharp scissors & forceps',
                    sub: 'lift & open abdominal wall',
                  },
                  { id: 'lens' as const, name: 'Hand lens (×10)', sub: 'inspect gall bladder & ovary' },
                  { id: 'seeker' as const, name: 'Blunt seeker / probe', sub: 'unfurl mesentery & ureters' },
                ].map((inst) => {
                  const active = selectedInstrument === inst.id;
                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => handleSelectInstrument(inst.id)}
                      className={`w-full text-left rounded-xl px-3 py-2 border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#122D1F] border-[#4ADE80] text-[#E6EBF5]'
                          : 'bg-[#121A2B] border-[#22304A] text-[#E6EBF5] hover:border-[#3A4A68]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{inst.name}</div>
                      <div className="text-[10px] text-[#93A0B8]">{inst.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 text-[11px] text-[#93A0B8] leading-relaxed">
            <strong className="text-white block mb-0.5">WAEC Dissection Rule:</strong>
            Always lift the abdominal muscle wall upward with forceps and insert the{' '}
            <strong className="text-[#4ADE80]">blunt lower blade</strong> of the scissors so you do
            not puncture the underlying caecum or stomach.
          </div>
        </div>
      }
      bottomDock={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { s: 1, label: '1 Pin specimen' },
                { s: 2, label: '2 Midline skin cut' },
                { s: 3, label: '3 Open body wall' },
                { s: 4, label: '4 Unfurl & identify (18)' },
                { s: 5, label: '5 Biological drawing rules' },
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
        <div className="flex flex-col justify-between h-full gap-3">
          <div className="space-y-3">
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
                Learn (18 Structures)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPanelMode('quiz');
                  setRevealedQuizOrgans({});
                }}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  panelMode === 'quiz'
                    ? 'bg-[#FACC15] text-[#0B1220]'
                    : 'text-[#93A0B8] hover:text-[#E6EBF5]'
                }`}
              >
                Quiz Mode (Hide Labels)
              </button>
            </div>

            {/* Organ info card */}
            {isOpened ? (
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#4ADE80]">
                    {activeOrgan.system}
                  </span>
                  <span className="font-mono text-[11px] italic text-[#93A0B8]">
                    {activeOrgan.latinName}
                  </span>
                </div>
                <h2 className="font-display text-lg font-bold text-white">
                  {activeOrgan.name}
                </h2>
                <p className="text-xs text-[#C9D3E6] leading-relaxed">
                  {activeOrgan.description}
                </p>
                <div className="rounded-lg bg-[#0B1220] border border-[#1E2A42] p-2 text-xs text-[#93A0B8] leading-relaxed">
                  <strong className="text-[#E6EBF5]">Spot it in situ:</strong> {activeOrgan.spotIt}
                </div>
                <div className="rounded-lg bg-[#122D1F]/70 border border-[#166534] p-2 text-xs text-[#BBF7D0] leading-relaxed">
                  <strong className="text-[#4ADE80]">Structural Adaptation:</strong>{' '}
                  {activeOrgan.examAdaptation}
                </div>
              </div>
            ) : (
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 text-xs text-[#93A0B8] leading-relaxed">
                Internal visceral organs are exposed once you open the body wall (Step 3 or 4).
                Click <strong className="text-white">4 Unfurl &amp; identify (18)</strong> below or
                select any structure button.
              </div>
            )}

            {/* 18 Organ Quick Selector Grid */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#93A0B8] mb-1.5">
                All 18 In-Situ Structures (Click to highlight)
              </div>
              <div className="grid grid-cols-3 gap-1.5 max-h-[185px] overflow-y-auto pr-1">
                {DISSECTION_ORGANS.map((org) => {
                  const isSelected = selectedOrgan === org.id && isOpened;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => handleSelectOrgan(org.id)}
                      className={`text-left px-2 py-1.5 rounded-lg border text-[11px] font-medium truncate transition-colors cursor-pointer capitalize ${
                        isSelected
                          ? 'bg-[#122D1F] border-[#4ADE80] text-[#E6EBF5] font-semibold'
                          : isOpened
                            ? 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6] hover:border-[#3A4A68]'
                            : 'bg-[#121A2B]/60 border-[#1E2A42] text-[#6B778C]'
                      }`}
                    >
                      {org.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/lab/biology/body-systems')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Compare with Human Anatomy Atlas →
          </button>
        </div>
      }
    >
      {/* Top Bar: Step Instruction + Textbook Cream / Dark Bench Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#121A2B]/90 border border-[#22304A] rounded-xl py-2 px-3.5 text-xs z-10">
        <span className="font-semibold text-[#E6EBF5]">{STEP_BANNERS[step]}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPlateTheme('textbook-cream')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
              isCream
                ? 'bg-[#FEF3C7] text-[#1E293B]'
                : 'bg-[#0B1220] text-[#93A0B8] hover:text-white'
            }`}
          >
            Textbook Atlas Plate
          </button>
          <button
            type="button"
            onClick={() => setPlateTheme('dark-bench')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
              !isCream
                ? 'bg-[#4ADE80] text-[#0B1220]'
                : 'bg-[#0B1220] text-[#93A0B8] hover:text-white'
            }`}
          >
            Dark Wax Tray
          </button>
        </div>
      </div>

      {/* Main High-Realism Ventral Mammalian Dissection Illustration (Rabbit / Rat) */}
      <div className="flex-1 flex items-center justify-center my-1.5">
        <div
          className={`w-full rounded-2xl border overflow-hidden transition-colors ${
            isCream
              ? 'bg-[#FAF8F0] border-[#D6D0B8] shadow-inner'
              : 'bg-[#0D131F] border-[#22304A]'
          }`}
        >
          <svg
            viewBox="0 0 720 650"
            className="w-full h-auto max-h-[545px]"
            role="img"
            aria-label={`${species === 'rabbit' ? 'Rabbit' : 'Rat'} specimen ventral dissection showing trachea, heart, lungs, diaphragm, liver, gall bladder, stomach, pancreas, spleen, small intestine, colon, mesentery, kidney, ovary, ureter, bladder, rectum and anus`}
          >
            <defs>
              {/* Realistic Organ Gradients matching the Rabbit Anatomy 101 Reference Plate */}
              <linearGradient id="furBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={species === 'rabbit' ? '#7B7977' : '#C9B9AC'} />
                <stop offset="50%" stopColor={species === 'rabbit' ? '#ABA8A4' : '#EFE6DF'} />
                <stop offset="100%" stopColor={species === 'rabbit' ? '#6E6C6A' : '#B8A698'} />
              </linearGradient>
              <linearGradient id="lungPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="50%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#581C87" />
              </linearGradient>
              <linearGradient id="liverBrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C2785C" />
                <stop offset="55%" stopColor="#8F4B34" />
                <stop offset="100%" stopColor="#5C2B1B" />
              </linearGradient>
              <linearGradient id="stomachBlueRoseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="55%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>
              <linearGradient id="colonBlueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="50%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>
              <linearGradient id="ileumCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="60%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#0369A1" />
              </linearGradient>
              <linearGradient id="mesenteryGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A3E635" stopOpacity="0.65" />
                <stop offset="60%" stopColor="#4D7C0F" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#15803D" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Warm Yellow-Cream Scientific Band behind Left & Right Callout Columns (Directly matching the user's Rabbit Anatomy 101 screenshot!) */}
            {isCream ? (
              <g>
                <rect x="0" y="0" width="720" height="650" fill="#FAF9F2" />
                {/* Left yellow label backdrop band */}
                <rect x="12" y="132" width="320" height="360" rx="4" fill="#F6F0B2" opacity="0.85" />
                {/* Right yellow label backdrop band */}
                <rect x="360" y="182" width="348" height="368" rx="4" fill="#F6F0B2" opacity="0.85" />
              </g>
            ) : (
              <g>
                <rect x="16" y="14" width="688" height="622" rx="18" fill="#182232" stroke="#334155" strokeWidth="3" />
                <rect x="28" y="26" width="664" height="598" rx="12" fill="#1F2922" />
              </g>
            )}

            {/* =====================================================================
                1. REALISTIC FURRED MAMMALIAN BODY, TILTED HEAD, INCISORS, WHISKERS,
                   EARS & OUTSTRETCHED CLAWED FORELIMBS / HINDLIMBS
               ===================================================================== */}
            <g stroke="#27272A" strokeLinecap="round" strokeLinejoin="round">
              {/* Long Lagomorph Ears (Pinnae) folded back behind head (or shorter rounded ears for Rat) */}
              {species === 'rabbit' ? (
                <g>
                  <path
                    d="M326 48 C294 14, 264 6, 256 18 C250 28, 282 54, 316 74 Z"
                    fill="url(#furBodyGrad)"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M298 32 C278 18, 264 16, 264 22 C266 30, 286 46, 308 60"
                    fill="#D6A2A8"
                    opacity="0.65"
                  />
                  <path
                    d="M386 48 C418 14, 448 6, 456 18 C462 28, 430 54, 396 74 Z"
                    fill="url(#furBodyGrad)"
                    strokeWidth="1.6"
                  />
                </g>
              ) : (
                <g>
                  <ellipse cx="312" cy="58" rx="14" ry="18" transform="rotate(-25 312 58)" fill="#E7C9BA" strokeWidth="1.5" />
                  <ellipse cx="400" cy="58" rx="14" ry="18" transform="rotate(25 400 58)" fill="#E7C9BA" strokeWidth="1.5" />
                </g>
              )}

              {/* Outstretched Left & Right Forelimbs with Fur Serrations, Digits & Claws */}
              <path
                d="M294 176 C268 146, 250 112, 232 76 L214 54 L218 68 L204 56 L212 72 L198 66 L208 80 L196 80 L212 92 C226 132, 240 168, 264 214 Z"
                fill="url(#furBodyGrad)"
                strokeWidth="1.7"
              />
              <path
                d="M418 176 C444 146, 462 112, 480 76 L498 54 L494 68 L508 56 L500 72 L514 66 L504 80 L516 80 L500 92 C486 132, 472 168, 448 214 Z"
                fill="url(#furBodyGrad)"
                strokeWidth="1.7"
              />

              {/* Outstretched Left & Right Muscular Hindlimbs & Tail */}
              <path
                d="M276 476 C252 512, 246 562, 254 624 L286 634 C294 596, 308 568, 336 566 L356 632 L378 632 L374 566 C402 568, 416 596, 424 634 L456 624 C464 562, 458 512, 434 476 Z"
                fill="url(#furBodyGrad)"
                strokeWidth="1.7"
              />
              {/* Fluffy White Undertail (Rabbit scut) or Long Scaly Tail (Rat) */}
              {species === 'rabbit' ? (
                <path
                  d="M336 574 Q356 558 376 574 L382 628 Q356 638 330 628 Z"
                  fill="#F1F5F9"
                  stroke="#64748B"
                  strokeWidth="1.3"
                />
              ) : (
                <path
                  d="M356 574 Q366 612 348 642"
                  fill="none"
                  stroke="#D6B3A3"
                  strokeWidth="8"
                />
              )}

              {/* Ventral Tilted Head, Chin, Parted Lips, Chisel Incisors & Vibrissae Whiskers */}
              <path
                d="M354 14 C332 16, 314 38, 312 68 C306 94, 304 126, 294 156 L418 156 C408 126, 406 94, 400 68 C398 38, 380 16, 354 14 Z"
                fill="url(#furBodyGrad)"
                strokeWidth="1.7"
              />
              {/* Cleft Upper Lip & Exposed White Chisel Incisors */}
              <path
                d="M342 36 Q356 24 370 36 Q356 48 342 36 Z"
                fill="#991B1B"
                stroke="#27272A"
                strokeWidth="1.3"
              />
              <rect x="350" y="29" width="5.5" height="9" rx="1" fill="#F8FAFC" stroke="#27272A" strokeWidth="1" />
              <rect x="356" y="29" width="5.5" height="9" rx="1" fill="#F8FAFC" stroke="#27272A" strokeWidth="1" />
              {/* Lateral eye bulge on tilted head */}
              <path d="M380 28 C388 30, 392 38, 384 42 C378 38, 376 32, 380 28 Z" fill="#18181B" />
              <circle cx="384" cy="34" r="2" fill="#F8FAFC" />

              {/* Tactile Vibrissae (Whiskers) sweeping left and right */}
              <g stroke="#3F3F46" strokeWidth="0.9" fill="none">
                <path d="M332 28 Q296 14 268 18" />
                <path d="M330 34 Q292 26 262 34" />
                <path d="M332 40 Q298 38 272 48" />
                <path d="M380 26 Q412 12 438 16" />
                <path d="M384 32 Q418 24 444 30" />
                <path d="M382 38 Q414 36 436 44" />
              </g>

              {/* Outer Torso Fur Flaps */}
              <path
                d="M294 156 C252 216, 240 384, 276 492 L434 492 C470 384, 458 216, 418 156 Z"
                fill="url(#furBodyGrad)"
                strokeWidth="1.8"
              />
              {/* Fine fur hatch texture lines along body sides and thighs */}
              <g stroke="#3F3F46" strokeWidth="0.8" opacity="0.55">
                <path d="M270 210 L258 228 M262 260 L252 282 M258 320 L250 344 M264 380 L256 406 M278 498 L266 526 M290 520 L278 552 M442 210 L454 228 M450 260 L460 282 M454 320 L462 344 M448 380 L456 406 M432 498 L444 526 M420 520 L432 552" />
              </g>
            </g>

            {/* Step 1 & 2 Closed Body Wall View */}
            {!isOpened && (
              <g>
                <ellipse
                  cx="356"
                  cy="332"
                  rx="82"
                  ry="168"
                  fill={step === 2 ? '#FCA5A5' : 'url(#furBodyGrad)'}
                  stroke="#3F3F46"
                  strokeWidth="1.6"
                />
                {step === 2 && (
                  <g>
                    {/* Linea alba midline incision guide */}
                    <line
                      x1="356"
                      y1="146"
                      x2="356"
                      y2="518"
                      stroke="#991B1B"
                      strokeWidth="3"
                      strokeDasharray="8 5"
                    />
                    <text
                      x="356"
                      y="325"
                      textAnchor="middle"
                      fill="#7F1D1D"
                      fontSize="11"
                      fontWeight="700"
                    >
                      LINEA ALBA INCISION LINE
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* =====================================================================
                2. OPENED THORACIC & ABDOMINAL CAVITY WITH RETRACTED SKIN / MUSCLE
                   WALL FLAPS & ALL 18 SHADED IN-SITU VISCERAL ORGANS (Step 3..5)
               ===================================================================== */}
            {isOpened && (
              <g>
                {/* Retracted Outer Skin & Inner Pink Muscular Abdominal/Thoracic Body-Wall Flaps */}
                <path
                  d="M356 122 C314 146, 266 198, 256 266 C248 324, 248 412, 276 488 C298 532, 336 562, 356 572 C376 562, 414 532, 436 488 C464 412, 464 324, 456 266 C446 198, 398 146, 356 122 Z"
                  fill="#F9A8D4"
                  stroke="#831843"
                  strokeWidth="2"
                />
                {/* Inner Muscular Layer Flap & Cut Costal Rib Margin */}
                <path
                  d="M356 134 C322 158, 278 206, 270 268 C262 326, 264 408, 288 480 C308 524, 340 552, 356 560 C372 552, 404 524, 424 480 C448 408, 450 326, 442 268 C434 206, 390 158, 356 134 Z"
                  fill="#9F1239"
                  stroke="#4C0519"
                  strokeWidth="1.8"
                />
                {/* Dark Coelomic Cavity Shadow Interior */}
                <path
                  d="M356 144 C328 168, 290 212, 282 270 C274 326, 276 404, 298 474 C316 516, 342 544, 356 552 C370 544, 396 516, 414 474 C436 404, 438 326, 430 270 C422 212, 384 168, 356 144 Z"
                  fill="#2A1215"
                />

                {/* -----------------------------------------------------------------
                    ORGAN 1: TRACHEA (Cartilaginous C-Ringed Windpipe)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('trachea')}
                  className="cursor-pointer"
                >
                  <rect
                    x="348"
                    y="134"
                    width="16"
                    height="56"
                    rx="7"
                    fill="#E2E8F0"
                    stroke={selectedOrgan === 'trachea' ? '#22C55E' : '#334155'}
                    strokeWidth={selectedOrgan === 'trachea' ? '3' : '1.5'}
                  />
                  {[142, 150, 158, 166, 174, 182].map((ty) => (
                    <path
                      key={ty}
                      d={`M349 ${ty} Q356 ${ty + 3} 363 ${ty}`}
                      fill="none"
                      stroke="#64748B"
                      strokeWidth="1.8"
                    />
                  ))}
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 3: LUNGS (Paired Stippled Violet-Rose Thoracic Lobes)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('lungs')}
                  className="cursor-pointer"
                >
                  {/* Right Lung (Left side of diagram) */}
                  <path
                    d="M342 188 C320 186, 296 222, 296 254 C298 264, 326 260, 346 252 Z"
                    fill="url(#lungPurpleGrad)"
                    stroke={selectedOrgan === 'lungs' ? '#22C55E' : '#3B0764'}
                    strokeWidth={selectedOrgan === 'lungs' ? '3' : '1.6'}
                  />
                  {/* Left Lung (Right side of diagram) */}
                  <path
                    d="M370 188 C392 186, 416 222, 416 254 C414 264, 386 260, 366 252 Z"
                    fill="url(#lungPurpleGrad)"
                    stroke={selectedOrgan === 'lungs' ? '#22C55E' : '#3B0764'}
                    strokeWidth={selectedOrgan === 'lungs' ? '3' : '1.6'}
                  />
                  {/* Stippled alveolar surface texture */}
                  <g fill="#F3E8FF" opacity="0.45">
                    <circle cx="318" cy="224" r="1.5" />
                    <circle cx="326" cy="236" r="1.5" />
                    <circle cx="312" cy="242" r="1.5" />
                    <circle cx="332" cy="218" r="1.5" />
                    <circle cx="392" cy="224" r="1.5" />
                    <circle cx="384" cy="236" r="1.5" />
                    <circle cx="398" cy="244" r="1.5" />
                    <circle cx="378" cy="218" r="1.5" />
                  </g>
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 2: HEART (Conical 4-Chambered Heart + Coronary Vessels & Aorta)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('heart')}
                  className="cursor-pointer"
                >
                  {/* Aortic Arch & Superior Vena Cava */}
                  <path
                    d="M352 192 C350 174, 366 174, 364 192"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="5"
                  />
                  <path
                    d="M342 198 C336 218, 344 242, 358 248 C372 242, 376 216, 368 198 C362 190, 348 190, 342 198 Z"
                    fill="#DC2626"
                    stroke={selectedOrgan === 'heart' ? '#22C55E' : '#450A0A'}
                    strokeWidth={selectedOrgan === 'heart' ? '3' : '1.6'}
                  />
                  {/* Epicardial fat & coronary sulcus */}
                  <path
                    d="M348 204 C354 218, 360 230, 362 244 M354 218 L344 226"
                    fill="none"
                    stroke="#FACC15"
                    strokeWidth="1.6"
                  />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 9: DIAPHRAGM (Curved Muscular Dome Partition)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('diaphragm')}
                  className="cursor-pointer"
                >
                  <path
                    d="M286 266 Q356 238 426 266"
                    fill="none"
                    stroke={selectedOrgan === 'diaphragm' ? '#22C55E' : '#FB7185'}
                    strokeWidth={selectedOrgan === 'diaphragm' ? '6' : '4.5'}
                    strokeLinecap="round"
                  />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 4: LIVER (Overlapping 4-Lobed Reddish-Brown Hepatic Mass)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('liver')}
                  className="cursor-pointer"
                >
                  {/* Right lateral & medial hepatic lobes */}
                  <path
                    d="M284 268 C294 252, 336 250, 354 266 C348 296, 314 316, 286 306 C278 296, 280 278, 284 268 Z"
                    fill="url(#liverBrownGrad)"
                    stroke={selectedOrgan === 'liver' ? '#22C55E' : '#27120B'}
                    strokeWidth={selectedOrgan === 'liver' ? '3' : '1.6'}
                  />
                  {/* Left medial & lateral hepatic lobes overlapping stomach */}
                  <path
                    d="M350 264 C374 252, 412 258, 424 278 C428 298, 398 310, 368 296 C356 290, 348 278, 350 264 Z"
                    fill="url(#liverBrownGrad)"
                    stroke={selectedOrgan === 'liver' ? '#22C55E' : '#27120B'}
                    strokeWidth={selectedOrgan === 'liver' ? '3' : '1.6'}
                  />
                  {/* Interlobar cleft line */}
                  <path d="M322 260 C326 278, 320 294, 308 304" fill="none" stroke="#3E1D12" strokeWidth="1.4" />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 5: GALL BLADDER (Vivid Olive-Green Pear Sac under Liver)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('gall-bladder')}
                  className="cursor-pointer"
                >
                  <path
                    d="M298 308 C296 318, 312 326, 322 316 C326 310, 316 302, 298 308 Z"
                    fill="#65A30D"
                    stroke={selectedOrgan === 'gall-bladder' ? '#22C55E' : '#1A2E05'}
                    strokeWidth={selectedOrgan === 'gall-bladder' ? '3' : '1.5'}
                  />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 10: STOMACH (Large J-Shaped Curved Gastric Sac)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('stomach')}
                  className="cursor-pointer"
                >
                  <path
                    d="M342 296 C378 286, 416 296, 416 322 C416 346, 382 356, 348 344 C332 338, 326 322, 336 310 C344 316, 356 312, 342 296 Z"
                    fill="url(#stomachBlueRoseGrad)"
                    stroke={selectedOrgan === 'stomach' ? '#22C55E' : '#1E1B4B'}
                    strokeWidth={selectedOrgan === 'stomach' ? '3' : '1.6'}
                  />
                  {/* Gastric serosal blood vessels */}
                  <path
                    d="M356 322 C372 318, 392 320, 404 328 M374 320 L370 336 M388 322 L386 338"
                    fill="none"
                    stroke="#312E81"
                    strokeWidth="1.1"
                    opacity="0.7"
                  />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 12: SPLEEN (Dark Maroon Strip along Greater Curvature)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('spleen')}
                  className="cursor-pointer"
                >
                  <path
                    d="M394 342 C408 334, 422 340, 418 352 C412 362, 394 356, 394 342 Z"
                    fill="#881337"
                    stroke={selectedOrgan === 'spleen' ? '#22C55E' : '#4C0519'}
                    strokeWidth={selectedOrgan === 'spleen' ? '3' : '1.5'}
                  />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 11: PANCREAS (Diffuse Golden-Yellow Lobulated Gland in Duodenal Loop)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('pancreas')}
                  className="cursor-pointer"
                >
                  <path
                    d="M342 344 Q366 338 386 348 Q372 362 344 356 Z"
                    fill="#FACC15"
                    stroke={selectedOrgan === 'pancreas' ? '#22C55E' : '#713F12'}
                    strokeWidth={selectedOrgan === 'pancreas' ? '3' : '1.4'}
                  />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 16: MESENTERY (Unfurled Fan-Shaped Membrane with Vascular Tree)
                    Spread out on the lower right exactly like the Rabbit Anatomy 101 plate!
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('mesentery')}
                  className="cursor-pointer"
                >
                  <path
                    d="M394 446 C428 438, 464 434, 488 438 C482 470, 474 494, 466 512 C436 508, 404 496, 384 476 Z"
                    fill="url(#mesenteryGreenGrad)"
                    stroke={selectedOrgan === 'mesentery' ? '#22C55E' : '#14532D'}
                    strokeWidth={selectedOrgan === 'mesentery' ? '3' : '1.5'}
                  />
                  {/* Branching Mesenteric Arteries & Portal Veins inside the Mesentery Fan */}
                  <path
                    d="M394 464 C422 458, 452 452, 478 448 M416 460 L468 468 M428 466 L464 486 M406 472 L452 498"
                    fill="none"
                    stroke="#991B1B"
                    strokeWidth="1.4"
                    opacity="0.8"
                  />
                  {/* Bordering Ileum loop framing the mesentery fan */}
                  <path
                    d="M392 444 C430 434, 466 430, 492 436 C496 462, 482 496, 470 516 C438 514, 404 502, 382 480"
                    fill="none"
                    stroke="url(#ileumCyanGrad)"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 6: CAECUM & SACCULATED (HAUSTRATED) COLON
                    Large segmented blue-grey spiral coils with haustra pouches on the left
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('colon')}
                  className="cursor-pointer"
                >
                  {/* Outer & Inner Sacculated Haustrated Coils */}
                  <path
                    d="M312 328 C286 336, 280 398, 294 452 C304 486, 336 492, 344 456 C352 422, 336 376, 318 364"
                    fill="none"
                    stroke="url(#colonBlueGrad)"
                    strokeWidth="26"
                    strokeLinecap="round"
                  />
                  {/* Haustral segmentation crease lines across the colon */}
                  <g
                    stroke={selectedOrgan === 'colon' ? '#4ADE80' : '#0F172A'}
                    strokeWidth={selectedOrgan === 'colon' ? '2.4' : '1.6'}
                    fill="none"
                  >
                    <path d="M286 352 Q302 346 318 356" />
                    <path d="M278 372 Q296 368 314 376" />
                    <path d="M276 392 Q294 388 312 396" />
                    <path d="M278 412 Q296 408 314 416" />
                    <path d="M282 432 Q300 426 318 434" />
                    <path d="M288 452 Q306 444 322 452" />
                    <path d="M302 472 Q316 458 328 468" />
                    <path d="M326 442 Q342 438 354 446" />
                    <path d="M328 422 Q344 418 356 426" />
                    <path d="M324 402 Q340 398 352 406" />
                  </g>
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 13: SMALL INTESTINE (Duodenum, Jejunum & Ileum Convolutions)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('small-intestine')}
                  className="cursor-pointer"
                >
                  <path
                    d="M332 346 C318 356, 334 382, 358 378 C384 374, 404 358, 404 382 C404 406, 362 398, 364 422 C366 446, 402 426, 396 456 C390 482, 354 476, 356 504 C358 526, 384 522, 394 504"
                    fill="none"
                    stroke="url(#ileumCyanGrad)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {selectedOrgan === 'small-intestine' && (
                    <path
                      d="M332 346 C318 356, 334 382, 358 378 C384 374, 404 358, 404 382 C404 406, 362 398, 364 422 C366 446, 402 426, 396 456"
                      fill="none"
                      stroke="#4ADE80"
                      strokeWidth="2.5"
                    />
                  )}
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 14: OVARY / GONAD (Yellow Lobulated Body above Kidney)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('ovary')}
                  className="cursor-pointer"
                >
                  <ellipse
                    cx="374"
                    cy="432"
                    rx="7"
                    ry="5"
                    fill="#FACC15"
                    stroke={selectedOrgan === 'ovary' ? '#22C55E' : '#713F12'}
                    strokeWidth={selectedOrgan === 'ovary' ? '3' : '1.4'}
                  />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 15: KIDNEY (Bean-Shaped Retroperitoneal Organ)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('kidney')}
                  className="cursor-pointer"
                >
                  <path
                    d="M376 442 C390 440, 394 468, 376 468 C368 468, 368 458, 372 454 C368 448, 368 442, 376 442 Z"
                    fill="#FACC15"
                    stroke={selectedOrgan === 'kidney' ? '#22C55E' : '#713F12'}
                    strokeWidth={selectedOrgan === 'kidney' ? '3' : '1.6'}
                  />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 17: URETER (Slender Duct from Kidney Hilum to Bladder)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('ureter')}
                  className="cursor-pointer"
                >
                  <path
                    d="M374 466 Q370 504 360 536"
                    fill="none"
                    stroke={selectedOrgan === 'ureter' ? '#22C55E' : '#FEF08A'}
                    strokeWidth={selectedOrgan === 'ureter' ? '3.5' : '2.2'}
                  />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 7: RECTUM (Descending Pelvic Tract)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('rectum')}
                  className="cursor-pointer"
                >
                  <path
                    d="M336 474 L344 548"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="11"
                    strokeLinecap="round"
                  />
                  {selectedOrgan === 'rectum' && (
                    <path d="M336 474 L344 548" fill="none" stroke="#22C55E" strokeWidth="3" />
                  )}
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 8: URINARY BLADDER (Pyriform Golden-Amber Sac at Pelvic Floor)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('bladder')}
                  className="cursor-pointer"
                >
                  <path
                    d="M344 536 C344 524, 368 524, 368 536 C368 548, 360 558, 356 560 C352 558, 344 548, 344 536 Z"
                    fill="#FACC15"
                    stroke={selectedOrgan === 'bladder' ? '#22C55E' : '#854D0E'}
                    strokeWidth={selectedOrgan === 'bladder' ? '3' : '1.6'}
                  />
                </g>

                {/* -----------------------------------------------------------------
                    ORGAN 18: ANUS (Posterior Terminal Opening)
                   ----------------------------------------------------------------- */}
                <g
                  onClick={() => handleSelectOrgan('anus')}
                  className="cursor-pointer"
                >
                  <circle
                    cx="356"
                    cy="574"
                    r="6"
                    fill="#713F12"
                    stroke={selectedOrgan === 'anus' ? '#22C55E' : '#FDE047'}
                    strokeWidth={selectedOrgan === 'anus' ? '3' : '1.5'}
                  />
                </g>
              </g>
            )}

            {/* =====================================================================
                3. SYMMETRIC LEFT & RIGHT TEXTBOOK LEADER-LINE CALLOUTS (All 18 Structures)
                   Directly matching the typography and leader lines of Rabbit Anatomy 101
               ===================================================================== */}
            {isOpened &&
              DISSECTION_ORGANS.map((org) => {
                const isSelected = selectedOrgan === org.id;
                const isRevealed =
                  panelMode === 'learn' || Boolean(revealedQuizOrgans[org.id]);

                const textX = org.side === 'left' ? 128 : 584;
                const lineStartX = org.side === 'left' ? 134 : 578;

                return (
                  <g
                    key={org.id}
                    onClick={() => handleSelectOrgan(org.id)}
                    className="cursor-pointer"
                  >
                    {/* Crisp Diagonal/Horizontal Leader Line from Label to Organ */}
                    <line
                      x1={lineStartX}
                      y1={org.labelY}
                      x2={org.anchorX}
                      y2={org.anchorY}
                      stroke={
                        isSelected
                          ? '#16A34A'
                          : isCream
                            ? '#27272A'
                            : '#94A3B8'
                      }
                      strokeWidth={isSelected ? '2.2' : '1.15'}
                    />

                    {/* Target dot on the organ */}
                    <circle
                      cx={org.anchorX}
                      cy={org.anchorY}
                      r={isSelected ? '4.5' : '2.8'}
                      fill={isSelected ? '#22C55E' : isCream ? '#18181B' : '#F8FAFC'}
                    />

                    {/* Clean Sans-Serif Textbook Label */}
                    <text
                      x={textX}
                      y={org.labelY + 4}
                      textAnchor={org.side === 'left' ? 'end' : 'start'}
                      fill={
                        isSelected
                          ? isCream
                            ? '#15803D'
                            : '#4ADE80'
                          : isCream
                            ? '#27272A'
                            : '#E2E8F0'
                      }
                      fontSize="13.5"
                      fontWeight={isSelected ? '700' : '500'}
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      {isRevealed ? org.label : '❓ click to reveal'}
                    </text>
                  </g>
                );
              })}
          </svg>
        </div>
      </div>
    </LabLayout>
  );
}
