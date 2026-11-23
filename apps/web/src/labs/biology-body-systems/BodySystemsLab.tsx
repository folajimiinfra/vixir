import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LabLayout } from '../../lab-shell/LabLayout';
import {
  AnatomicalAtlasPlate,
  type AtlasViewMode,
  type OrganCallout,
  type SystemKey,
} from './AnatomicalAtlasPlate';

type PhysioState =
  | 'resting'
  | 'walking'
  | 'sprint'
  | 'hypoxia'
  | 'dehydration';

type HydrationLevel = 'dehydrated' | 'normal' | 'hydrated';

const SYSTEM_META: {
  key: SystemKey;
  name: string;
  sub: string;
  dot: string;
}[] = [
  {
    key: 'skeletal',
    name: 'Skeletal (Osteology)',
    sub: '206 bones · axial & appendicular',
    dot: 'bg-[#F8FAFC]',
  },
  {
    key: 'muscular',
    name: 'Muscular (Myology / Écorché)',
    sub: 'striated skeletal muscle bellies',
    dot: 'bg-[#DC2626]',
  },
  {
    key: 'respiratory',
    name: 'Respiratory (Pulmonary)',
    sub: 'trachea, 5 lung lobes & alveoli',
    dot: 'bg-[#38BDF8]',
  },
  {
    key: 'circulatory',
    name: 'Circulatory (Cardiovascular)',
    sub: '4-chamber heart, arteries & veins',
    dot: 'bg-[#EF4444]',
  },
  {
    key: 'digestive',
    name: 'Digestive & Hepato-Biliary',
    sub: 'stomach, liver, pancreas & gut',
    dot: 'bg-[#F472B6]',
  },
  {
    key: 'renal',
    name: 'Renal & Excretory',
    sub: 'kidneys, nephrons, ureters & bladder',
    dot: 'bg-[#FB923C]',
  },
  {
    key: 'nervous',
    name: 'Nervous (CNS & PNS)',
    sub: 'brain, spinal cord & nerve plexuses',
    dot: 'bg-[#FACC15]',
  },
];

const PHYSIO_STATES: Record<
  PhysioState,
  {
    label: string;
    bpm: number;
    breaths: number;
    cardiacOutputLMin: string;
    spo2: number;
    gfrMlMin: number;
    adhLevel: string;
    urineOsm: number;
    summary: string;
  }
> = {
  resting: {
    label: 'Resting',
    bpm: 72,
    breaths: 14,
    cardiacOutputLMin: '5.0',
    spo2: 98,
    gfrMlMin: 125,
    adhLevel: 'Baseline (2.0 pg/mL)',
    urineOsm: 600,
    summary:
      'Parasympathetic vagal tone keeps SA node pacing at 72 bpm. Alveolar PO₂ = 104 mmHg saturates haemoglobin to 98%, and baseline renal perfusion filters 125 mL/min at the glomerulus.',
  },
  walking: {
    label: 'Walking',
    bpm: 98,
    breaths: 20,
    cardiacOutputLMin: '9.2',
    spo2: 98,
    gfrMlMin: 118,
    adhLevel: 'Moderate (3.1 pg/mL)',
    urineOsm: 680,
    summary:
      'Skeletal muscle pump and mild sympathetic activation increase venous return (Frank–Starling law) and tidal volume to match aerobic ATP demand in lower-limb musculature.',
  },
  sprint: {
    label: 'Sprint / Exercise',
    bpm: 164,
    breaths: 38,
    cardiacOutputLMin: '21.5',
    spo2: 95,
    gfrMlMin: 82,
    adhLevel: 'Elevated (7.5 pg/mL)',
    urineOsm: 890,
    summary:
      'Sympathetic adrenaline surges cardiac output > 4×. Blood shunts away from splanchnic/renal beds toward active skeletal muscles; rising plasma CO₂ and H⁺ stimulate the medulla oblongata respiratory centre.',
  },
  hypoxia: {
    label: 'High-Altitude Hypoxia',
    bpm: 118,
    breaths: 28,
    cardiacOutputLMin: '8.4',
    spo2: 86,
    gfrMlMin: 110,
    adhLevel: 'Normal (2.4 pg/mL)',
    urineOsm: 580,
    summary:
      'Low atmospheric PO₂ drops arterial oxygen tension, triggering carotid body chemoreceptors to drive hyperventilation. Over days, renal peritubular cells secrete Erythropoietin (EPO) to stimulate red blood cell synthesis in bone marrow.',
  },
  dehydration: {
    label: 'Dehydration / High ADH',
    bpm: 94,
    breaths: 17,
    cardiacOutputLMin: '4.6',
    spo2: 98,
    gfrMlMin: 92,
    adhLevel: 'High Surge (14.8 pg/mL)',
    urineOsm: 1180,
    summary:
      'Hypothalamic osmoreceptors detect high plasma osmolarity and trigger posterior pituitary ADH (vasopressin) release, inserting Aquaporin-2 channels into the renal collecting duct to reabsorb water and produce hypertonic urine.',
  },
};

const ORGAN_CALLOUTS: OrganCallout[] = [
  {
    id: 'cranium',
    figNum: '1',
    label: 'Cranium & Mandible',
    system: 'skeletal',
    side: 'left',
    anchorX: 250,
    anchorY: 46,
    labelY: 94,
    latinName: 'Cranium et Mandibula',
    functionSummary:
      '8 fused cranial vault bones joined by immovable fibrous sutures encase the brain; the hinged mandible articulates at the temporomandibular joint (TMJ) for mastication.',
    clinicalNote:
      'Fontanelles in infants allow cranial growth before ossifying into rigid coronal, sagittal, and lambdoid sutures.',
    examFact: 'Axial skeleton · fixed suture joints (synarthroses) except the movable mandible.',
  },
  {
    id: 'trachea-bronchi',
    figNum: '2',
    label: 'Trachea & C-Rings',
    system: 'respiratory',
    side: 'left',
    anchorX: 270,
    anchorY: 132,
    labelY: 128,
    latinName: 'Trachea et Bronchi Principales',
    functionSummary:
      '16–20 incomplete hyaline cartilage C-rings prevent airway collapse during negative-pressure inspiration; lined by ciliated pseudostratified epithelium and goblet cells.',
    clinicalNote:
      'The right main bronchus is wider, shorter, and more vertical than the left.',
    examFact: 'C-rings are open posteriorly where trachealis smooth muscle abuts the oesophagus.',
  },
  {
    id: 'aortic-arch',
    figNum: '3',
    label: 'Aortic Arch & Arteries',
    system: 'circulatory',
    side: 'left',
    anchorX: 274,
    anchorY: 184,
    labelY: 162,
    latinName: 'Arcus Aortae et Arteriae',
    functionSummary:
      'Elastic muscular artery carrying high-pressure oxygenated blood from the left ventricle to carotid (brain), subclavian (arms), coronary (heart muscle), renal, and femoral branches.',
    clinicalNote:
      'Thick tunica media rich in elastin fibres recoils during diastole (Windkessel effect) to maintain continuous blood flow.',
    examFact: 'All arteries carry oxygenated blood EXCEPT the pulmonary artery (and umbilical artery in foetus).',
  },
  {
    id: 'rib-cage',
    figNum: '4',
    label: 'Thoracic Cage (12 Pairs)',
    system: 'skeletal',
    side: 'left',
    anchorX: 224,
    anchorY: 194,
    labelY: 196,
    latinName: 'Cavea Thoracica (Costae I–XII)',
    functionSummary:
      '12 pairs of curved ribs (Pairs 1–7 true ribs, 8–10 false ribs, 11–12 floating ribs) shield the heart and lungs and elevate via external intercostal muscles during inspiration.',
    clinicalNote:
      'Upward and outward "bucket-handle" rib elevation increases thoracic volume and drops intrapleural pressure.',
    examFact: 'Articulates posteriorly with T1–T12 thoracic vertebrae and anteriorly via hyaline costal cartilage.',
  },
  {
    id: 'liver-gallbladder',
    figNum: '5',
    label: 'Liver & Gallbladder',
    system: 'digestive',
    side: 'left',
    anchorX: 244,
    anchorY: 278,
    labelY: 230,
    latinName: 'Hepar et Vesica Biliaris',
    functionSummary:
      'Largest internal gland: synthesizes bile salts (stored in the green gallbladder to emulsify lipids), regulates blood glucose (glycogenesis/glycogenolysis), and deaminates excess amino acids into urea.',
    clinicalNote:
      'The hepatic portal vein carries nutrient-rich blood directly from the small intestine villi to the liver before general circulation.',
    examFact: 'Bile contains NO enzymes — it physically emulsifies fats into micro-droplets and neutralizes acidic chyme.',
  },
  {
    id: 'humerus-forearm',
    figNum: '6',
    label: 'Humerus, Radius & Ulna',
    system: 'skeletal',
    side: 'left',
    anchorX: 172,
    anchorY: 248,
    labelY: 264,
    latinName: 'Humerus, Radius et Ulna',
    functionSummary:
      'Ball-and-socket glenohumeral joint at the shoulder gives 360° circumduction; hinge joint at the elbow (trochlear notch of ulna) flexes/extends while the radius pivots for pronation/supination.',
    clinicalNote:
      'Biceps brachii (flexor) and triceps brachii (extensor) act as an antagonistic muscle pair across the elbow.',
    examFact: 'Lateral bone in anatomical position = Radius (thumb side); medial bone = Ulna (little-finger side).',
  },
  {
    id: 'diaphragm',
    figNum: '7',
    label: 'Thoracic Diaphragm',
    system: 'respiratory',
    side: 'left',
    anchorX: 245,
    anchorY: 254,
    labelY: 298,
    latinName: 'Diaphragma Thoracis',
    functionSummary:
      'Musculotendinous dome separating the thoracic cavity from the abdominal cavity; innervated by the phrenic nerve (C3–C5). Contracts and flattens downward during inhalation.',
    clinicalNote:
      'According to Boyle’s Law (P₁V₁ = P₂V₂), diaphragm contraction expands thoracic volume and drops intrapulmonary pressure below atmospheric.',
    examFact: 'Unique mammalian characteristic: muscular diaphragm dividing coelom into thorax and abdomen.',
  },
  {
    id: 'kidneys',
    figNum: '8',
    label: 'Kidneys (Cortex/Medulla)',
    system: 'renal',
    side: 'left',
    anchorX: 244,
    anchorY: 304,
    labelY: 332,
    latinName: 'Renes (Cortex et Medulla Renalis)',
    functionSummary:
      'Paired retroperitoneal organs (~1 million nephrons each) performing ultrafiltration at the glomerulus, selective reabsorption in the PCT, and osmoregulation via the Loop of Henle and collecting duct.',
    clinicalNote:
      'All plasma glucose and amino acids are 100% selectively reabsorbed in the Proximal Convoluted Tubule (PCT) via Na⁺ co-transport.',
    examFact: 'Ultrafiltration is driven by high hydrostatic blood pressure because the afferent arteriole is wider than the efferent arteriole.',
  },
  {
    id: 'small-large-intestine',
    figNum: '9',
    label: 'Ileum (Villi) & Colon',
    system: 'digestive',
    side: 'left',
    anchorX: 266,
    anchorY: 344,
    labelY: 366,
    latinName: 'Intestinum Tenue et Colon',
    functionSummary:
      'The 6 m coiled duodenum/jejunum/ileum completes chemical digestion and absorbs glucose & amino acids into capillary villi and fatty acids/glycerol into lacteals; the colon reabsorbs water.',
    clinicalNote:
      'Finger-like villi and brush-border microvilli multiply absorptive surface area > 600-fold.',
    examFact: 'Each villus contains a central lymph lacteal (for chylomicron fats) and a rich blood capillary network.',
  },
  {
    id: 'quadriceps-myology',
    figNum: '10',
    label: 'Quadriceps & Sartorius',
    system: 'muscular',
    side: 'left',
    anchorX: 224,
    anchorY: 422,
    labelY: 404,
    latinName: 'M. Quadriceps Femoris et Sartorius',
    functionSummary:
      'Four-headed femoral extensor group (Rectus femoris, Vastus lateralis, Vastus medialis, Vastus intermedius) converging on the patellar tendon to extend the knee joint during locomotion.',
    clinicalNote:
      'Bipennate feather arrangement of rectus femoris muscle fascicles maximizes physiological cross-sectional force.',
    examFact: 'Skeletal striated muscle fibres are multinucleated, voluntary, and rich in myoglobin and mitochondria.',
  },
  {
    id: 'femur-tibia',
    figNum: '11',
    label: 'Femur, Patella & Tibia',
    system: 'skeletal',
    side: 'left',
    anchorX: 226,
    anchorY: 494,
    labelY: 444,
    latinName: 'Femur, Patella, Tibia et Fibula',
    functionSummary:
      'The femur is the longest, strongest bone in the body; articulates at the synovial knee hinge joint protected by the sesamoid patella, transferring load to the medial weight-bearing tibia.',
    clinicalNote:
      'Hyaline articular cartilage and synovial fluid reduce friction coefficient in the knee joint to < 0.005.',
    examFact: 'Patella is a sesamoid bone embedded in the quadriceps femoris tendon.',
  },

  // Right-side callouts
  {
    id: 'brain-cns',
    figNum: '12',
    label: 'Brain (Cerebrum/Medulla)',
    system: 'nervous',
    side: 'right',
    anchorX: 274,
    anchorY: 54,
    labelY: 94,
    latinName: 'Encephalon (Cerebrum et Cerebellum)',
    functionSummary:
      'Cerebral cortex governs voluntary motor action, memory, vision, and reasoning; Cerebellum coordinates balance and muscular posture; Medulla oblongata controls involuntary heartbeat and breathing.',
    clinicalNote:
      'The Hypothalamus beneath the thalamus serves as the master thermostat (37°C) and osmoregulator (ADH).',
    examFact: 'Brain displays outer Grey Matter (cell bodies) and inner White Matter (myelinated axons) — reversed in the spinal cord.',
  },
  {
    id: 'clavicle-sternum',
    figNum: '13',
    label: 'Clavicle & Sternum',
    system: 'skeletal',
    side: 'right',
    anchorX: 295,
    anchorY: 136,
    labelY: 132,
    latinName: 'Clavicula et Sternum',
    functionSummary:
      'The S-shaped clavicle struts the shoulder (scapula) laterally from the manubrium of the sternum, while the sternum anchors the costal cartilages of the true ribs (1–7).',
    clinicalNote:
      'Red bone marrow inside the flat sternum remains a lifelong site of haematopoiesis.',
    examFact: 'Pectoral girdle · transmits upper-limb forces to the axial skeleton.',
  },
  {
    id: 'heart-chambers',
    figNum: '14',
    label: '4-Chamber Heart',
    system: 'circulatory',
    side: 'right',
    anchorX: 280,
    anchorY: 204,
    labelY: 170,
    latinName: 'Cor (Atria et Ventriculi)',
    functionSummary:
      'Dual myogenic pump paced by the Sinoatrial (SA) node: Right heart pumps deoxygenated blood to the low-pressure pulmonary circuit; Left ventricle (thickest wall) pumps oxygenated blood to the systemic circuit.',
    clinicalNote:
      'Bicuspid (mitral) and tricuspid AV valves prevent backflow into atria during ventricular systole ("lub" sound); semilunar valves close in diastole ("dub" sound).',
    examFact: 'Left ventricular myocardium is 3× thicker than right ventricle to generate ~120 mmHg systemic pressure.',
  },
  {
    id: 'lungs-lobes',
    figNum: '15',
    label: 'Right & Left Lungs',
    system: 'respiratory',
    side: 'right',
    anchorX: 310,
    anchorY: 210,
    labelY: 208,
    latinName: 'Pulmo Dexter (3) et Sinister (2)',
    functionSummary:
      'Spongy elastic organs containing ~300 million alveoli (~70 m² total gas-exchange surface area) enclosed in a double-walled serous pleural membrane.',
    clinicalNote:
      'The left lung has 2 lobes and a cardiac notch to accommodate the left-pointing apex of the heart.',
    examFact: 'Adaptations for Fick’s Law: huge surface area, 1-cell-thick squamous epithelium, moist surfactant lining, dense capillary network.',
  },
  {
    id: 'vena-cava',
    figNum: '16',
    label: 'Vena Cava & Veins',
    system: 'circulatory',
    side: 'right',
    anchorX: 262,
    anchorY: 245,
    labelY: 246,
    latinName: 'Vena Cava Superior et Inferior',
    functionSummary:
      'Large, wide-lumen veins equipped with semilunar pocket valves that return low-pressure deoxygenated venous blood from the upper and lower body into the right atrium.',
    clinicalNote:
      'Venous return is assisted by surrounding skeletal muscle contraction and negative thoracic pressure during breathing.',
    examFact: 'Veins have thinner muscular walls, wider lumens, and pocket valves to prevent backflow.',
  },
  {
    id: 'vertebral-column',
    figNum: '17',
    label: 'Vertebral Column (33)',
    system: 'skeletal',
    side: 'right',
    anchorX: 270,
    anchorY: 282,
    labelY: 284,
    latinName: 'Columna Vertebralis (7C · 12T · 5L · 5S · 4Co)',
    functionSummary:
      'Segmented axial column cushioned by fibrocartilage intervertebral discs; houses the spinal cord within the neural canal and supports trunk posture.',
    clinicalNote:
      'C1 (Atlas) permits nodding ("yes") and C2 (Axis with odontoid peg) permits head rotation ("no").',
    examFact: 'Formula: 7 Cervical, 12 Thoracic, 5 Lumbar, 5 fused Sacral, 4 fused Coccygeal.',
  },
  {
    id: 'stomach-pancreas',
    figNum: '18',
    label: 'Stomach & Pancreas',
    system: 'digestive',
    side: 'right',
    anchorX: 294,
    anchorY: 292,
    labelY: 322,
    latinName: 'Gaster et Pancreas',
    functionSummary:
      'Gastric glands secrete HCl (pH 1.5–2.0, killing bacteria and activating pepsinogen → pepsin for protein digestion). Below it, the dual exocrine/endocrine pancreas secretes amylase, trypsin, lipase, and insulin/glucagon.',
    clinicalNote:
      'Goblet cells coat the stomach rugae with alkaline mucus to prevent self-digestion (peptic ulceration).',
    examFact: 'Pancreatic Islets of Langerhans secrete Insulin (β-cells) and Glucagon (α-cells) into blood.',
  },
  {
    id: 'pelvic-girdle',
    figNum: '19',
    label: 'Pelvis & Acetabulum',
    system: 'skeletal',
    side: 'right',
    anchorX: 306,
    anchorY: 364,
    labelY: 360,
    latinName: 'Pelvis Ossea (Coxae et Sacrum)',
    functionSummary:
      'Two coxal (hip) bones fused posteriorly to the sacrum and anteriorly at the pubic symphysis; forms the deep cup-shaped acetabulum socket for the head of the femur.',
    clinicalNote:
      'Transmits the entire weight of the upper body equally down both lower limbs and cradles pelvic viscera.',
    examFact: 'Each innominate hip bone is formed by fusion of Ilium, Ischium, and Pubis.',
  },
  {
    id: 'ureters-bladder',
    figNum: '20',
    label: 'Ureters & Bladder',
    system: 'renal',
    side: 'right',
    anchorX: 270,
    anchorY: 382,
    labelY: 398,
    latinName: 'Ureteres et Vesica Urinaria',
    functionSummary:
      'Peristaltic smooth-muscle tubes (ureters) propel urine from the renal pelvis down into the distensible transitional-epithelium urinary bladder (capacity 400–600 mL) controlled by sphincter muscles.',
    clinicalNote:
      'Stretch receptors in the detrusor muscle wall trigger the spinal micturition reflex.',
    examFact: 'Urine flows from Renal Pelvis → Ureter → Urinary Bladder → Urethra.',
  },
  {
    id: 'spinal-cord-plexuses',
    figNum: '21',
    label: 'Sciatic Nerve Plexus',
    system: 'nervous',
    side: 'right',
    anchorX: 314,
    anchorY: 446,
    labelY: 436,
    latinName: 'Medulla Spinalis et Nervus Ischiadicus',
    functionSummary:
      'Coordinates rapid monosynaptic and polysynaptic spinal reflex arcs (Receptor → Dorsal root sensory neurone → Relay neurone → Ventral root motor neurone → Effector) and branches into 31 pairs of spinal nerves.',
    clinicalNote:
      'Myelin sheaths formed by Schwann cells enable rapid saltatory conduction (~100 m/s) jumping from Node of Ranvier to Node of Ranvier.',
    examFact: 'Dorsal root carries sensory neurones (with dorsal root ganglion); Ventral root carries motor neurones.',
  },
];

const VIX_BIO_QA: { q: string; a: string }[] = [
  {
    q: 'Why is the left ventricle wall 3× thicker than the right ventricle?',
    a: 'The right ventricle only pumps blood a short distance through the low-resistance pulmonary circuit to the lungs (~25 mmHg), whereas the left ventricle must generate ~120 mmHg systolic pressure to propel oxygenated blood through the entire systemic circulation from head to toes.',
  },
  {
    q: 'How does the nephron reabsorb water when you are dehydrated?',
    a: 'First, the Loop of Henle acts as a counter-current multiplier, pumping Na⁺ and Cl⁻ out of the ascending limb to make the renal medulla hypertonic. Then, posterior pituitary ADH binds to the collecting duct wall and inserts Aquaporin-2 channels, drawing water out by osmosis into the vasa recta.',
  },
  {
    q: 'What generates the high hydrostatic pressure for glomerular ultrafiltration?',
    a: 'The afferent arteriole entering the glomerulus has a significantly wider lumen diameter than the efferent arteriole leaving it. This bottleneck builds high capillary hydrostatic pressure (~55 mmHg) that forces water, glucose, urea, and mineral ions through the basement membrane into Bowman’s capsule while retaining plasma proteins and blood cells.',
  },
  {
    q: 'How do the diaphragm and intercostal muscles cause inspiration?',
    a: 'During inhalation, the external intercostal muscles contract to lift the rib cage upward and outward while the diaphragm contracts and flattens downward. This increases thoracic volume, decreases intrapulmonary pressure below atmospheric pressure (Boyle’s Law), and draws air into the alveoli.',
  },
];

export function BodySystemsLab() {
  const navigate = useNavigate();

  const [layers, setLayers] = useState<Record<SystemKey, boolean>>({
    skeletal: true,
    muscular: true,
    respiratory: true,
    circulatory: true,
    digestive: true,
    renal: true,
    nervous: true,
  });

  const [viewMode, setViewMode] = useState<AtlasViewMode>('engraved-folio');
  const [quizMode, setQuizMode] = useState(false);
  const [revealedQuizIds, setRevealedQuizIds] = useState<Record<string, boolean>>({});
  const [physioState, setPhysioState] = useState<PhysioState>('resting');
  const [hydration, setHydration] = useState<HydrationLevel>('normal');
  const [selectedCalloutId, setSelectedCalloutId] = useState<string>('heart-chambers');
  const [rightInspectorTab, setRightInspectorTab] = useState<
    'organ' | 'alveoli' | 'nephron' | 'vix-ai'
  >('organ');
  const [activeQaIndex, setActiveQaIndex] = useState(0);

  const toggleLayer = (key: SystemKey) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const soloSystem = (key: SystemKey) => {
    setLayers({
      skeletal: key === 'skeletal',
      muscular: key === 'muscular',
      respiratory: key === 'respiratory',
      circulatory: key === 'circulatory',
      digestive: key === 'digestive',
      renal: key === 'renal',
      nervous: key === 'nervous',
    });
    const firstForSystem = ORGAN_CALLOUTS.find((c) => c.system === key);
    if (firstForSystem) {
      setSelectedCalloutId(firstForSystem.id);
    }
  };

  const enableAllSystems = () => {
    setLayers({
      skeletal: true,
      muscular: true,
      respiratory: true,
      circulatory: true,
      digestive: true,
      renal: true,
      nervous: true,
    });
  };

  const physio = PHYSIO_STATES[physioState];

  const visibleCallouts = ORGAN_CALLOUTS.filter((c) => layers[c.system]);
  const selectedCallout =
    ORGAN_CALLOUTS.find((c) => c.id === selectedCalloutId) ??
    visibleCallouts[0] ??
    ORGAN_CALLOUTS[0]!;

  const nephronMetrics =
    hydration === 'dehydrated'
      ? {
          adhPgMl: '14.8 pg/mL (High ADH)',
          urineOsm: '1200 mOsm/L',
          urineColor: '#D97706',
        }
      : hydration === 'hydrated'
        ? {
            adhPgMl: '0.6 pg/mL (Suppressed ADH)',
            urineOsm: '140 mOsm/L',
            urineColor: '#FEF08A',
          }
        : {
            adhPgMl: '2.2 pg/mL (Normal baseline)',
            urineOsm: '600 mOsm/L',
            urineColor: '#FBBF24',
          };

  return (
    <LabLayout
      experimentTitle="Human Anatomy & Physiology — 6-System Medical Atlas"
      subtitle="Biology · Engraved Folio · 8-Plate Morphology Sheet · Clinical X-Ray"
      activeLab="biology"
      mode="practice"
      headerRightExtra={
        <div className="hidden sm:flex items-center gap-2">
          <Link
            to="/lab/biology/digestion"
            className="px-3 py-1.5 rounded-full bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors"
          >
            Digestion Lab
          </Link>
          <Link
            to="/lab/biology/dissection"
            className="px-3 py-1.5 rounded-full bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors"
          >
            Dissection Lab
          </Link>
          <Link
            to="/lab/biology/food-tests"
            className="px-3 py-1.5 rounded-full bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors"
          >
            Food Tests
          </Link>
        </div>
      }
      leftTray={
        <div className="space-y-4">
          {/* Anatomical System Layers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8]">
                ANATOMICAL LAYERS
              </span>
              <button
                type="button"
                onClick={enableAllSystems}
                className="text-[11px] font-semibold text-[#38BDF8] hover:underline cursor-pointer"
              >
                Show all
              </button>
            </div>

            <div className="space-y-1.5">
              {SYSTEM_META.map((item) => {
                const on = layers[item.key];
                return (
                  <div
                    key={item.key}
                    className={`rounded-xl px-2.5 py-1.5 border flex items-center justify-between gap-2 transition-colors ${
                      on
                        ? 'bg-[#121A2B] border-[#3A4A68] text-[#E6EBF5]'
                        : 'bg-[#0B1220] border-[#1E2A42] text-[#6B778C]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleLayer(item.key)}
                      className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          on ? item.dot : 'bg-[#3A4A68]'
                        }`}
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{item.name}</div>
                        <div className="text-[10px] text-[#93A0B8] truncate">{item.sub}</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => soloSystem(item.key)}
                      title={`Solo ${item.name}`}
                      className="px-2 py-0.5 rounded bg-[#192338] hover:bg-[#24324F] text-[10px] font-semibold text-[#93A0B8] hover:text-white shrink-0 cursor-pointer"
                    >
                      Solo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Physiological & Clinical State Simulator */}
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2">
              VIX BIO-AI PHYSIOLOGICAL STATE
            </div>
            <div className="grid grid-cols-1 gap-1.5 mb-3">
              {(Object.keys(PHYSIO_STATES) as PhysioState[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPhysioState(st)}
                  className={`px-3 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    physioState === st
                      ? 'bg-[#4ADE80] text-[#0B1220]'
                      : 'bg-[#121A2B] border border-[#22304A] text-[#E6EBF5] hover:border-[#3A4A68]'
                  }`}
                >
                  <span>{PHYSIO_STATES[st].label}</span>
                  <span className="font-mono text-[11px] opacity-85">
                    {PHYSIO_STATES[st].bpm} bpm
                  </span>
                </button>
              ))}
            </div>

            {/* Live Vitals Telemetry Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-2">
                <div className="text-[10px] text-[#93A0B8]">Heart rate</div>
                <div className="font-mono text-sm font-bold text-[#FCA5A5]">
                  {physio.bpm} bpm
                </div>
              </div>
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-2">
                <div className="text-[10px] text-[#93A0B8]">Ventilation</div>
                <div className="font-mono text-sm font-bold text-[#7DD3FC]">
                  {physio.breaths} /min
                </div>
              </div>
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-2">
                <div className="text-[10px] text-[#93A0B8]">Arterial SpO₂</div>
                <div className="font-mono text-sm font-bold text-[#4ADE80]">
                  {physio.spo2}%
                </div>
              </div>
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-2">
                <div className="text-[10px] text-[#93A0B8]">Renal GFR</div>
                <div className="font-mono text-sm font-bold text-[#FDBA74]">
                  {physio.gfrMlMin} mL/m
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/lab/biology/dissection')}
            className="w-full text-left rounded-xl px-3 py-2 border border-dashed border-[#2C3B59] hover:border-[#4ADE80] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#4ADE80] shrink-0" />
            <span className="text-xs font-semibold text-[#C9D3E6]">
              Open Mammalian Dissection Lab →
            </span>
          </button>
        </div>
      }
      rightPanel={
        <div className="space-y-4">
          {/* 4-Tab Medical Inspector Switcher */}
          <div className="bg-[#121A2B] border border-[#22304A] p-1 rounded-xl grid grid-cols-4 text-[11px] font-semibold">
            {(
              [
                { id: 'organ', label: 'Atlas Info' },
                { id: 'alveoli', label: 'Alveoli O₂' },
                { id: 'nephron', label: 'Nephron' },
                { id: 'vix-ai', label: 'Vix Bio-AI' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRightInspectorTab(t.id)}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  rightInspectorTab === t.id
                    ? 'bg-[#4ADE80] text-[#0B1220]'
                    : 'text-[#93A0B8] hover:text-[#E6EBF5]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Live ECG (P-QRS-T) Telemetry Strip */}
          <div className="bg-[#08101E] border border-[#1E2F4D] rounded-xl p-3">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-mono font-bold text-[#4ADE80] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-ping" />
                LEAD II ECG · P-QRS-T
              </span>
              <span className="font-mono text-[#FCA5A5]">
                {physio.bpm} bpm · CO {physio.cardiacOutputLMin} L/min
              </span>
            </div>
            <svg viewBox="0 0 280 54" className="w-full h-12">
              <g stroke="#13223B" strokeWidth="0.7">
                <line x1="0" y1="14" x2="280" y2="14" />
                <line x1="0" y1="28" x2="280" y2="28" />
                <line x1="0" y1="42" x2="280" y2="42" />
                <line x1="70" y1="0" x2="70" y2="54" />
                <line x1="140" y1="0" x2="140" y2="54" />
                <line x1="210" y1="0" x2="210" y2="54" />
              </g>
              <path
                d="M 4 32 L 22 32 Q 30 23 38 32 L 48 32 L 53 39 L 60 7 L 67 46 L 73 32 L 86 32 Q 98 18 110 32 L 138 32 Q 146 23 154 32 L 164 32 L 169 39 L 176 7 L 183 46 L 189 32 L 202 32 Q 214 18 226 32 L 276 32"
                fill="none"
                stroke="#4ADE80"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="30" y="20" fill="#86EFAC" fontSize="8" textAnchor="middle">
                P
              </text>
              <text x="60" y="7" fill="#86EFAC" fontSize="8" textAnchor="middle">
                R
              </text>
              <text x="51" y="49" fill="#86EFAC" fontSize="7" textAnchor="middle">
                Q
              </text>
              <text x="69" y="51" fill="#86EFAC" fontSize="7" textAnchor="middle">
                S
              </text>
              <text x="98" y="18" fill="#86EFAC" fontSize="8" textAnchor="middle">
                T
              </text>
            </svg>
          </div>

          {/* TAB 1: Selected Organ / Bone Medical Atlas Info */}
          {rightInspectorTab === 'organ' && (
            <div className="space-y-3.5">
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#192338] border border-[#2E4063] text-[10px] font-bold uppercase tracking-wider text-[#7DD3FC]">
                    Fig. {selectedCallout.figNum} · {selectedCallout.system}
                  </span>
                  <span className="font-mono text-[11px] italic text-[#93A0B8]">
                    {selectedCallout.latinName}
                  </span>
                </div>

                <h2 className="font-display text-lg font-bold text-white">
                  {selectedCallout.label}
                </h2>

                <p className="text-xs text-[#C9D3E6] leading-relaxed">
                  {selectedCallout.functionSummary}
                </p>

                <div className="rounded-lg bg-[#0B1220] border border-[#1E2A42] p-2.5 text-xs text-[#93C5FD]">
                  <strong className="text-white block text-[10px] uppercase tracking-wider mb-0.5">
                    Clinical &amp; Physiological Note
                  </strong>
                  {selectedCallout.clinicalNote}
                </div>

                <div className="rounded-lg bg-[#1C271E] border border-[#2E4F34] p-2.5 text-xs text-[#86EFAC]">
                  <strong className="text-[#4ADE80] block text-[10px] uppercase tracking-wider mb-0.5">
                    WAEC / NECO / JAMB Exam Key Fact
                  </strong>
                  {selectedCallout.examFact}
                </div>
              </div>

              {/* Quick Organ Selector Pills */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#93A0B8] mb-2">
                  Click any structure ({visibleCallouts.length} visible)
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-[190px] overflow-y-auto pr-1">
                  {visibleCallouts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCalloutId(c.id)}
                      className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] font-medium truncate transition-colors cursor-pointer ${
                        selectedCallout.id === c.id
                          ? 'bg-[#192845] border-[#38BDF8] text-white'
                          : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6] hover:border-[#3A4A68]'
                      }`}
                    >
                      {c.figNum}. {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Magnified Alveolar Sac & Capillary Gas Exchange Inset */}
          {rightInspectorTab === 'alveoli' && (
            <div className="space-y-3">
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">
                    Magnified Alveolus &amp; Pulmonary Capillary
                  </span>
                  <span className="font-mono text-[11px] text-[#7DD3FC]">
                    SpO₂ {physio.spo2}%
                  </span>
                </div>

                <svg viewBox="0 0 260 175" className="w-full h-auto bg-[#08101E] rounded-lg p-1">
                  <circle
                    cx="130"
                    cy="76"
                    r="48"
                    fill="#0F2942"
                    stroke="#38BDF8"
                    strokeWidth="3"
                    strokeDasharray="6 3"
                  />
                  <text
                    x="130"
                    y="48"
                    textAnchor="middle"
                    fill="#BAE6FD"
                    fontSize="8.5"
                    fontWeight="700"
                  >
                    ALVEOLAR AIR SAC
                  </text>
                  <text x="130" y="60" textAnchor="middle" fill="#7DD3FC" fontSize="7.5">
                    PO₂ = 104 mmHg · PCO₂ = 40 mmHg
                  </text>

                  <path
                    d="M 22 108 Q 62 152 130 152 Q 198 152 238 108"
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="22"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 22 108 Q 62 152 130 152 Q 198 152 238 108"
                    fill="none"
                    stroke="url(#capGrad)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="50%" stopColor="#9333EA" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>

                  <ellipse cx="52" cy="130" rx="7" ry="4.5" fill="#60A5FA" />
                  <ellipse cx="96" cy="144" rx="7" ry="4.5" fill="#A855F7" />
                  <ellipse cx="148" cy="145" rx="7" ry="4.5" fill="#F87171" />
                  <ellipse cx="198" cy="132" rx="7" ry="4.5" fill="#EF4444" />

                  <path d="M 105 82 L 105 126" stroke="#4ADE80" strokeWidth="2.2" />
                  <text x="86" y="102" fill="#4ADE80" fontSize="8.5" fontWeight="700">
                    O₂ ↓
                  </text>

                  <path d="M 155 126 L 155 82" stroke="#FBBF24" strokeWidth="2.2" />
                  <text x="174" y="102" fill="#FBBF24" fontSize="8.5" fontWeight="700">
                    ↑ CO₂
                  </text>

                  <text x="34" y="96" fill="#93C5FD" fontSize="7.5">
                    Deoxygenated
                  </text>
                  <text x="224" y="96" fill="#FCA5A5" fontSize="7.5" textAnchor="end">
                    Oxygenated (HbO₈)
                  </text>
                </svg>

                <p className="text-xs text-[#C9D3E6] mt-2.5 leading-relaxed">
                  Across the <strong className="text-white">0.5 µm respiratory membrane</strong>{' '}
                  (1-cell squamous alveolar wall + basement membrane + capillary endothelium),{' '}
                  <strong className="text-[#4ADE80]">O₂ diffuses down its partial-pressure gradient</strong>{' '}
                  into red blood cells to form oxyhaemoglobin, while{' '}
                  <strong className="text-[#FBBF24]">CO₂ (from plasma HCO₃⁻)</strong> diffuses into
                  the alveolar air to be exhaled.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Interactive Magnified Nephron (GFR & ADH Osmoregulation) */}
          {rightInspectorTab === 'nephron' && (
            <div className="space-y-3">
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Nephron Ultrafiltration &amp; ADH Control
                  </span>
                  <span className="font-mono text-[11px] text-[#FDBA74]">
                    GFR {physio.gfrMlMin} mL/min
                  </span>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-[#93A0B8] mb-1.5">
                    Hydration &amp; Pituitary ADH State
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'dehydrated', label: 'Dehydrated' },
                        { id: 'normal', label: 'Normal' },
                        { id: 'hydrated', label: 'Hydrated' },
                      ] as const
                    ).map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setHydration(h.id)}
                        className={`py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          hydration === h.id
                            ? 'bg-[#FB923C] text-[#0B1220]'
                            : 'bg-[#0B1220] border border-[#22304A] text-[#C9D3E6]'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                <svg viewBox="0 0 265 180" className="w-full h-auto bg-[#08101E] rounded-lg p-1">
                  <line
                    x1="8"
                    y1="74"
                    x2="256"
                    y2="74"
                    stroke="#334155"
                    strokeDasharray="4 4"
                  />
                  <text x="14" y="16" fill="#94A3B8" fontSize="7.5" fontWeight="700">
                    RENAL CORTEX
                  </text>
                  <text x="14" y="86" fill="#94A3B8" fontSize="7.5" fontWeight="700">
                    RENAL MEDULLA (Hypertonic gradient)
                  </text>

                  <path d="M 16 42 L 42 42" stroke="#EF4444" strokeWidth="5" />
                  <circle cx="52" cy="44" r="11" fill="#DC2626" stroke="#FCA5A5" strokeWidth="1.5" />
                  <path d="M 52 32 L 52 18 L 82 18" fill="none" stroke="#EF4444" strokeWidth="2" />

                  <path
                    d="M 54 30 C 34 30, 34 58, 54 58 L 76 48 Q 92 34 106 50 L 106 146 Q 106 164 122 164 Q 138 164 138 146 L 138 50 Q 154 34 172 48 L 204 48 L 204 166"
                    fill="none"
                    stroke={nephronMetrics.urineColor}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />

                  <text x="52" y="69" textAnchor="middle" fill="#FCA5A5" fontSize="7.5">
                    Glomerulus
                  </text>
                  <text x="95" y="34" textAnchor="middle" fill="#FDE68A" fontSize="7.5">
                    PCT (100% Glu)
                  </text>
                  <text x="122" y="175" textAnchor="middle" fill="#FDBA74" fontSize="7.5">
                    Loop of Henle (Na⁺Cl⁻)
                  </text>
                  <text x="166" y="34" textAnchor="middle" fill="#FDE68A" fontSize="7.5">
                    DCT
                  </text>
                  <text x="233" y="96" textAnchor="middle" fill="#38BDF8" fontSize="7.5">
                    Collecting
                  </text>
                  <text x="233" y="106" textAnchor="middle" fill="#38BDF8" fontSize="7.5">
                    Duct (ADH)
                  </text>

                  <text x="182" y="120" fill="#38BDF8" fontSize="8" fontWeight="700">
                    {hydration === 'dehydrated'
                      ? 'H₂O ⇐⇐⇐'
                      : hydration === 'normal'
                        ? 'H₂O ⇐'
                        : 'H₂O ←'}
                  </text>
                </svg>

                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="bg-[#0B1220] border border-[#1E2A42] rounded-lg p-2">
                    <div className="text-[10px] text-[#93A0B8]">Plasma ADH</div>
                    <div className="font-mono font-bold text-[#7DD3FC]">
                      {nephronMetrics.adhPgMl}
                    </div>
                  </div>
                  <div className="bg-[#0B1220] border border-[#1E2A42] rounded-lg p-2">
                    <div className="text-[10px] text-[#93A0B8]">Urine Osmolarity</div>
                    <div className="font-mono font-bold text-[#FDBA74]">
                      {nephronMetrics.urineOsm}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Vix Bio-AI Clinical & Exam Q&A */}
          {rightInspectorTab === 'vix-ai' && (
            <div className="space-y-3">
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#4ADE80]">
                  VIX BIO-AI · LIVE STATE ANALYSIS ({physio.label})
                </div>
                <p className="text-xs text-[#C9D3E6] leading-relaxed">{physio.summary}</p>
              </div>

              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#FDBA74]">
                  SOCRATIC BIOLOGY EXAM Q&amp;A
                </div>
                <div className="space-y-1.5">
                  {VIX_BIO_QA.map((item, idx) => (
                    <button
                      key={item.q}
                      type="button"
                      onClick={() => setActiveQaIndex(idx)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeQaIndex === idx
                          ? 'bg-[#192845] border border-[#38BDF8] text-white'
                          : 'bg-[#0B1220] border border-[#1E2A42] text-[#93A0B8] hover:text-white'
                      }`}
                    >
                      {item.q}
                    </button>
                  ))}
                </div>
                <div className="rounded-lg bg-[#08101E] border border-[#1E2F4D] p-3 text-xs text-[#E6EBF5] leading-relaxed">
                  {VIX_BIO_QA[activeQaIndex]?.a}
                </div>
              </div>
            </div>
          )}
        </div>
      }
    >
      {/* Center Medical-Grade Anatomical Atlas Stage */}
      <div className="flex-1 flex flex-col justify-between min-h-[580px]">
        {/* Top Atlas Control Strip: 4 View Modes + Quiz Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#1E2A42]">
          <div className="flex flex-wrap items-center gap-1.5 bg-[#121A2B] border border-[#22304A] p-1 rounded-xl">
            {(
              [
                { id: 'engraved-folio', label: 'Vintage Engraved Folio' },
                { id: 'morphology-grid', label: '8-Plate Morphology Sheet' },
                { id: 'clinical-atlas', label: 'Medical Atlas (Colour)' },
                { id: 'xray', label: 'X-Ray / Fluoroscopy' },
              ] as const
            ).map((vm) => (
              <button
                key={vm.id}
                type="button"
                onClick={() => setViewMode(vm.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === vm.id
                    ? 'bg-[#38BDF8] text-[#0B1220]'
                    : 'text-[#93A0B8] hover:text-white'
                }`}
              >
                {vm.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setQuizMode((prev) => !prev);
                setRevealedQuizIds({});
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                quizMode
                  ? 'bg-[#FACC15] border-[#FACC15] text-[#0B1220]'
                  : 'bg-[#121A2B] border-[#22304A] text-[#E6EBF5] hover:border-[#38BDF8]'
              }`}
            >
              {quizMode ? 'Quiz Mode: ON (Click labels to reveal)' : 'Quiz Mode (Hide Labels)'}
            </button>
          </div>
        </div>

        {/* Main Engraved Folio / Morphology Sheet / Clinical Atlas Render */}
        <div className="flex-1 flex items-center justify-center py-2">
          <AnatomicalAtlasPlate
            layers={layers}
            viewMode={viewMode}
            quizMode={quizMode}
            revealedQuizIds={revealedQuizIds}
            visibleCallouts={visibleCallouts}
            selectedCallout={selectedCallout}
            bpm={physio.bpm}
            onSelectCallout={(id) => {
              setSelectedCalloutId(id);
              setRightInspectorTab('organ');
              if (quizMode) {
                setRevealedQuizIds((prev) => ({ ...prev, [id]: !prev[id] }));
              }
            }}
          />
        </div>

        {/* Bottom Status Bar */}
        <div className="pt-2 border-t border-[#1E2A42] flex flex-wrap items-center justify-between gap-2 text-xs text-[#93A0B8]">
          <div>
            Active structure:{' '}
            <strong className="text-white">
              Fig. {selectedCallout.figNum} · {selectedCallout.label}
            </strong>{' '}
            <span className="italic text-[#7DD3FC]">({selectedCallout.latinName})</span>
          </div>
          <div className="font-mono text-[11px]">
            {Object.values(layers).filter(Boolean).length} of 7 layers active ·{' '}
            {visibleCallouts.length} anatomical callouts
          </div>
        </div>
      </div>
    </LabLayout>
  );
}
