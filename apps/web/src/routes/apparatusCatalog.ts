export type ApparatusDiscipline =
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Electronics'
  | 'Engineering';

export type ApparatusCategory =
  | 'Measuring & Volumetric'
  | 'Glassware & Containers'
  | 'Heating & Thermal'
  | 'Support & Handling'
  | 'Microscopy & Specimen'
  | 'Electrical & Circuit'
  | 'Safety & PPE';

export interface EncyclopediaItem {
  id: string;
  number: number;
  name: string;
  subtitle: string;
  subject: ApparatusDiscipline;
  category: ApparatusCategory;
  file: string;
  practiseTo: string;
  primaryUses: string;
  description: string;
  specs: {
    resolution: string;
    range: string;
    zeroError: string;
    material: string;
  };
  parts: { part: string; role: string }[];
  handling: string[];
  mistakes: string[];
  spotInLab: string;
}

export const APPARATUS_CATALOG: EncyclopediaItem[] = [
  // 1. Compound light microscope
  {
    id: 'compound-microscope',
    number: 1,
    name: 'Compound light microscope',
    subtitle: 'Biology · Microscopy',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/compound-microscope.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Observing cells, plant/animal tissues, microorganisms, and prepared biological slides at ×40–×400.',
    description:
      'A dual-lens optical instrument that uses visible light transmitted through a thin specimen slide, magnifying it first through an objective lens (×4, ×10, ×40) and then through an ocular eyepiece (×10) for total magnification of ×40 to ×400.',
    specs: {
      resolution: '≈ 0.2 µm optical limit',
      range: '×40, ×100, ×400 magnification',
      zeroError: 'Centre condenser & start on ×4 objective',
      material: 'Enamelled cast-iron stand + achromatic optics',
    },
    parts: [
      { part: 'Eyepiece (ocular lens ×10)', role: 'Further magnifies the real image formed by the objective lens.' },
      { part: 'Revolving nosepiece & objectives', role: 'Holds scanning (×4), low (×10) and high-power (×40) lenses; clicks into alignment.' },
      { part: 'Mechanical stage & clips', role: 'Holds the glass microscope slide flat over the condenser aperture.' },
      { part: 'Iris diaphragm & condenser', role: 'Controls the cone of light and contrast passing through the specimen.' },
      { part: 'Coarse & fine focus knobs', role: 'Coarse knob moves stage rapidly at ×4; fine knob sharpens focus at ×40.' },
    ],
    handling: [
      'Carry with two hands — one gripping the C-arm and the other supporting the horseshoe base.',
      'Rotate the nosepiece until the lowest power objective (×4) clicks into position.',
      'Clip the slide onto the stage and watch from the side while lowering the tube with the coarse knob.',
      'Look through the eyepiece and turn the coarse knob slowly upward until the specimen comes into focus.',
      'Switch to ×10 or ×40 and use the fine focus knob only.',
    ],
    mistakes: [
      'Using the coarse adjustment knob under high power (×40), cracking the cover slip.',
      'Focusing downward while looking into the eyepiece instead of watching from the side.',
      'Leaving the iris diaphragm wide open on unstained transparent cells, washing out contrast.',
    ],
    spotInLab: 'Heavy horseshoe base with inclined eyepiece tube, triple revolving nosepiece and coarse/fine focus wheels.',
  },

  // 2. Burette (50 cm³)
  {
    id: 'burette',
    number: 2,
    name: 'Burette (50 cm³)',
    subtitle: 'Chemistry · Volumetric',
    subject: 'Chemistry',
    category: 'Measuring & Volumetric',
    file: '/apparatus/burette.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Accurately dispensing variable volumes of liquid titrant dropwise during acid–base and redox titrations.',
    description:
      'A long, uniform-bore graduated glass tube fitted with a precision PTFE stopcock tap at the bottom, calibrated to deliver variable liquid volumes down to 0.05 cm³.',
    specs: {
      resolution: '0.05 cm³ (half a 0.1 cm³ division)',
      range: '0.00 – 50.00 cm³ (reads top-down)',
      zeroError: 'Expel air bubble from jet & remove funnel before reading',
      material: 'Class A borosilicate glass + PTFE stopcock',
    },
    parts: [
      { part: 'Graduated barrel (0 at top)', role: 'Measures volume delivered by subtracting initial reading from final reading.' },
      { part: 'PTFE stopcock key', role: 'Controls flow rate from full stream down to single hanging drops.' },
      { part: 'Capillary jet tip', role: 'Must be completely filled with liquid (no air bubble) before taking initial reading.' },
    ],
    handling: [
      'Rinse the burette with distilled water, then with 5–10 cm³ of the solution it will contain.',
      'Clamp vertically in a retort stand and fill above the zero mark using a small funnel.',
      'Remove the funnel immediately so drops do not fall in during the titration.',
      'Open the tap briefly to flush any air bubble out of the jet, then read the bottom of the meniscus at eye level to 2 decimal places.',
    ],
    mistakes: [
      'Leaving the filter funnel in the top of the burette while titrating.',
      'Recording burette readings to 1 decimal place (24.5) instead of 2 d.p. (24.50 cm³).',
      'Forgetting to flush the air bubble trapped below the stopcock tap.',
    ],
    spotInLab: 'Long narrow glass tube with 0 at the top, 50 at the bottom, and a white plastic tap above a fine tip.',
  },

  // 3. Vernier caliper
  {
    id: 'vernier-caliper',
    number: 3,
    name: 'Vernier caliper',
    subtitle: 'Physics · Engineering',
    subject: 'Engineering',
    category: 'Measuring & Volumetric',
    file: '/apparatus/vernier-caliper.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Measuring external diameter, internal bore diameter, depth, and step thickness of rods, pipes, and bobs to 0.01 cm.',
    description:
      'A sliding precision calliper combining a main millimetre beam scale with an auxiliary 10- or 50-division Vernier sliding scale to interpolate fractional subdivisions.',
    specs: {
      resolution: '0.1 mm (0.01 cm) or 0.02 mm',
      range: '0 – 150 mm (0 – 15.00 cm)',
      zeroError: 'Close jaws fully and check if Vernier 0 aligns with main 0',
      material: 'Hardened satin-chrome stainless steel',
    },
    parts: [
      { part: 'Outside jaws (lower)', role: 'Grip external surfaces of cylinders, pendulum bobs, and beam cross-sections.' },
      { part: 'Inside jaws (upper)', role: 'Measure internal bore diameter of pipes, calorimeters, and hollow tubes.' },
      { part: 'Depth rod (tail blade)', role: 'Protrudes from the end of the beam to measure depth of blind holes.' },
      { part: 'Main scale & Vernier scale', role: 'Main scale reads mm before Vernier zero; Vernier coinciding line gives 0.1 mm fraction.' },
    ],
    handling: [
      'Wipe the jaws clean, close them gently, and record any zero error.',
      'Close the outside jaws squarely onto the workpiece without tilting.',
      'Read the main scale mark immediately to the left of the Vernier zero, then add the coinciding Vernier division × 0.01 cm.',
    ],
    mistakes: [
      'Reading the main scale at the end of the sliding jaw frame instead of at the Vernier zero line.',
      'Writing Vernier caliper readings in cm to only 1 decimal place (2.4 cm) instead of 2 d.p. (2.43 cm).',
    ],
    spotInLab: 'Stainless-steel ruler with two pairs of jaws (upper and lower) and a sliding thumb wheel.',
  },

  // 4. Analogue voltmeter & ammeter
  {
    id: 'analogue-meter',
    number: 4,
    name: 'Analogue ammeter & voltmeter',
    subtitle: 'Electronics · Physics',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Measuring electric current in amperes (Ammeter in series) and potential difference in volts (Voltmeter in parallel).',
    description:
      'Moving-coil d’Arsonval bench meters with dual-range binding posts, anti-parallax mirror arc, and a mechanical zero-adjust screw.',
    specs: {
      resolution: '0.02 A (0–1 A) · 0.05 V (0–3 V)',
      range: 'Ammeter 0–1 A / 0–3 A · Voltmeter 0–3 V / 0–15 V',
      zeroError: 'Turn front slotted screw until pointer rests on 0',
      material: 'Bakelite desk casing + jeweled moving-coil movement',
    },
    parts: [
      { part: 'Knife-edge pointer & mirror scale', role: 'Align pointer with its reflection in the mirror strip to eliminate parallax.' },
      { part: 'Mechanical zero-adjust screw', role: 'Resets the unpowered pointer exactly onto the zero mark.' },
      { part: 'Common (–) & range (+) terminals', role: 'Black terminal is negative; red terminals select the full-scale range.' },
    ],
    handling: [
      'With the circuit switched off, check that the pointer rests on zero.',
      'Connect the Ammeter in SERIES and the Voltmeter in PARALLEL across the component.',
      'Close the key briefly, align your eye so the pointer hides its mirror reflection, and open the key immediately after reading.',
    ],
    mistakes: [
      'Connecting the low-resistance ammeter in parallel across the battery, blowing its fuse.',
      'Reading the upper 0–15 V scale when wired into the 3 V terminal post.',
    ],
    spotInLab: 'Slanted desktop meter box with a curved scale window, mirror arc, and one black plus two red terminal posts.',
  },

  // 5. Beaker (250 cm³)
  {
    id: 'beaker',
    number: 5,
    name: 'Beaker (250 cm³)',
    subtitle: 'Chemistry · Biology',
    subject: 'Chemistry',
    category: 'Glassware & Containers',
    file: '/apparatus/beaker.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Holding, mixing, decanting, and heating liquids or acting as a water bath on a tripod and gauze.',
    description:
      'A straight-sided cylindrical borosilicate glass container with a flat bottom and pouring spout lip, designed for holding, stirring, heating, and decanting liquids.',
    specs: {
      resolution: 'Approximate markings (± 5% tolerance)',
      range: '50 – 250 cm³ working volume',
      zeroError: 'Never use for accurate volumetric measurement',
      material: 'Low-expansion borosilicate glass (Pyrex)',
    },
    parts: [
      { part: 'Pouring spout (beak)', role: 'Directs liquid in a clean stream down a glass stirring rod without dribbling.' },
      { part: 'Uniform cylindrical walls', role: 'Allows easy stirring and serves as a water bath on a tripod and wire gauze.' },
      { part: 'Approximate graduation lines', role: 'Indicates rough fill level only (±5%).' },
    ],
    handling: [
      'Use a beaker to hold stock solutions at your bench before pipetting or filling a burette.',
      'When heating on a Bunsen burner, rest the beaker on a wire gauze over a tripod stand.',
      'When pouring, hold a glass rod against the spout to guide the liquid smoothly.',
    ],
    mistakes: [
      'Measuring out 25 cm³ of alkali for a titration using a beaker instead of a pipette.',
      'Heating a beaker directly in a roaring Bunsen flame without a wire gauze.',
    ],
    spotInLab: 'Wide cylindrical glass cup with a small pouring lip and white volume markings.',
  },

  // 6. Measuring cylinder (100 cm³)
  {
    id: 'measuring-cylinder',
    number: 6,
    name: 'Measuring cylinder (100 cm³)',
    subtitle: 'Chemistry · Physics · Biology',
    subject: 'Chemistry',
    category: 'Measuring & Volumetric',
    file: '/apparatus/burette.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Measuring and transferring specific volumes of liquids with moderate accuracy, and finding irregular solid volumes by water displacement.',
    description:
      'A tall, narrow graduated glass or polypropylene cylinder mounted on a wide hexagonal base for measuring liquid volumes to ±0.5 cm³ or ±1.0 cm³.',
    specs: {
      resolution: '1.0 cm³ (100 cm³ cylinder) · 0.2 cm³ (10 cm³)',
      range: '10 cm³, 50 cm³, 100 cm³, 250 cm³ sizes',
      zeroError: 'Place on a flat horizontal bench and read bottom of meniscus',
      material: 'Borosilicate glass or polymethylpentene (PMP)',
    },
    parts: [
      { part: 'Hexagonal anti-roll base', role: 'Prevents the tall cylinder from rolling off the bench if knocked.' },
      { part: 'Pouring spout & plastic bumper collar', role: 'Spout pours cleanly; collar protects rim if tipped over.' },
      { part: 'Graduated scale (reads bottom-up)', role: 'Calibrated "In" (To Contain, TC) at 20°C.' },
    ],
    handling: [
      'Stand the measuring cylinder on a flat, horizontal bench — never hold it in your hand while reading.',
      'Pour liquid in slowly until near the desired mark, then use a dropper to bring the bottom of the meniscus to the line at eye level.',
      'For irregular solids (Archimedes’ displacement), record initial water volume V₁, slide the solid in gently at an angle to avoid splashing, and record V₂.',
    ],
    mistakes: [
      'Using a measuring cylinder instead of a volumetric pipette for primary titration aliquots.',
      'Holding the cylinder up in the air at an angle to read the meniscus.',
      'Dropping a heavy metal bob vertically into a glass cylinder and cracking the base.',
    ],
    spotInLab: 'Tall narrow graduated tube standing on a wide hexagonal glass or plastic foot.',
  },

  // 7. Conical flask (250 cm³)
  {
    id: 'conical-flask',
    number: 7,
    name: 'Conical flask / Erlenmeyer (250 cm³)',
    subtitle: 'Chemistry · Titration',
    subject: 'Chemistry',
    category: 'Glassware & Containers',
    file: '/apparatus/conical-flask.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Swirling reaction mixtures during titrations without spilling, heating liquids, and collecting filtrates under a funnel.',
    description:
      'A flat-bottomed borosilicate glass vessel with inward-sloping conical sides and a cylindrical neck that lets you swirl reaction mixtures vigorously without spilling.',
    specs: {
      resolution: 'Approximate markings (± 5% — not volumetric)',
      range: '250 cm³ nominal capacity',
      zeroError: 'Rinse with distilled water ONLY (never with analyte)',
      material: 'Thermal-shock-resistant borosilicate glass',
    },
    parts: [
      { part: 'Narrow cylindrical neck', role: 'Easy to grip while swirling; supports a filter funnel.' },
      { part: 'Sloping conical walls', role: 'Deflects swirling liquid inward so drops cannot splash out.' },
      { part: 'Flat base on white tile', role: 'Rests on a white porcelain tile to make indicator colour transitions sharp.' },
    ],
    handling: [
      'Between titrations, rinse thoroughly with tap water and finish with distilled water.',
      'Never rinse the conical flask with the solution to be pipetted into it.',
      'Add 2–3 drops only of acid–base indicator and swirl continuously with one hand while controlling the burette tap with the other.',
    ],
    mistakes: [
      'Rinsing the conical flask with the alkali/acid solution before pipetting, increasing the moles present.',
      'Adding 15–20 drops of indicator instead of 2–3 drops.',
    ],
    spotInLab: 'Triangular-profile glass flask with a flat base and narrow neck.',
  },

  // 8. Volumetric pipette (25.0 cm³)
  {
    id: 'volumetric-pipette',
    number: 8,
    name: 'Volumetric bulb pipette (25.0 cm³)',
    subtitle: 'Chemistry · Volumetric',
    subject: 'Chemistry',
    category: 'Measuring & Volumetric',
    file: '/apparatus/volumetric-pipette.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Measuring and transferring a single fixed aliquot volume (25.0 cm³ or 20.0 cm³) of liquid with high precision.',
    description:
      'A single-volume precision transfer glass tube with a central cylindrical bulb and a single etched ring graduation mark on the upper stem.',
    specs: {
      resolution: 'Fixed volume ± 0.03 cm³ (Class A)',
      range: '25.0 cm³ (or 20.0 cm³) single aliquot',
      zeroError: 'Do NOT blow out the final drop remaining in the tip',
      material: 'Borosilicate glass + rubber safety filler bulb',
    },
    parts: [
      { part: 'Safety pipette filler bulb', role: 'Draws liquid up safely by suction valves — never pipette by mouth.' },
      { part: 'Etched graduation ring', role: 'Defines the exact 25.00 cm³ volume when the bottom of the meniscus rests on it.' },
      { part: 'Tapered delivery jet', role: 'Calibrated to retain one small drop by surface tension after drainage.' },
    ],
    handling: [
      'Rinse with distilled water, then rinse with a small portion of the solution to be measured.',
      'Draw liquid 2 cm above the etched line using a pipette filler, then lower the meniscus smoothly onto the ring at eye level.',
      'Drain vertically into the conical flask and touch the tip against the inner glass wall for 3 seconds.',
      'Leave the small residual drop inside the tip — the pipette is calibrated "To Deliver" (TD).',
    ],
    mistakes: [
      'Pipetting by mouth instead of using a safety pipette filler.',
      'Blowing out the last drop left in the nozzle, delivering more than 25.00 cm³.',
    ],
    spotInLab: 'Slender glass tube with a fat middle bulb and a single white ring etched on the upper stem.',
  },

  // 9. Retort stand, boss & clamp
  {
    id: 'retort-stand',
    number: 9,
    name: 'Retort stand, bosshead & clamp',
    subtitle: 'All laboratories',
    subject: 'Physics',
    category: 'Support & Handling',
    file: '/apparatus/retort-stand.svg',
    practiseTo: '/lab/physics/pendulum',
    primaryUses: 'Supporting burettes, pendulums, round-bottom flasks, thermometers, and glass condensers at any height.',
    description:
      'A heavy cast-iron rectangular base with a vertical steel rod, die-cast bosshead, and cork-lined three-prong clamp.',
    specs: {
      resolution: 'Continuous vertical & angular positioning',
      range: '0 – 75 cm rod height',
      zeroError: 'Position suspended load over the heavy base foot',
      material: 'Enamelled cast-iron base + chrome-plated steel rod',
    },
    parts: [
      { part: 'Cast-iron base plate', role: 'Lowers the centre of gravity so tall setups do not topple.' },
      { part: 'Bosshead (double T-screw block)', role: 'Locks onto the vertical rod and holds the clamp arm.' },
      { part: 'Cork-lined clamp jaws', role: 'Cushions glass burettes and split corks so tightening does not crack glass.' },
    ],
    handling: [
      'Always orient the clamp arm directly over the heavy base plate so the load’s centre of gravity falls inside the footprint.',
      'Tighten the clamp jaws onto glassware until snug on the cork liner — never over-tighten.',
    ],
    mistakes: [
      'Swinging the clamp arm 180° away from the base foot so the entire stand tips forward.',
      'Clamping bare metal jaws onto a glass burette or thermometer without cork pads.',
    ],
    spotInLab: 'Heavy blue/grey rectangular iron base with a tall silver rod and thumb-screw clamps.',
  },

  // 10. Metre rule (100 cm)
  {
    id: 'metre-rule',
    number: 10,
    name: 'Metre rule / Meter scale (100 cm)',
    subtitle: 'Physics · Mechanics & Optics',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/metre-rule.svg',
    practiseTo: '/lab/physics/pendulum',
    primaryUses: 'Measuring lengths up to 100.0 cm in pendulum and optics experiments, or acting as a uniform beam in Principle of Moments.',
    description:
      'A 1.000 m boxwood or steel scale graduated every 1 mm (0.1 cm) along both edges, used for linear measurement and moments equilibrium.',
    specs: {
      resolution: '1 mm (0.1 cm)',
      range: '0.0 – 100.0 cm (1.000 m)',
      zeroError: 'Start at 1.0 cm mark and subtract if 0 cm end is worn',
      material: 'Seasoned hardwood / boxwood or satin stainless steel',
    },
    parts: [
      { part: 'Millimetre graduations (0.1 cm)', role: 'Smallest division is 0.1 cm; all readings must be recorded to 1 d.p. in cm.' },
      { part: 'Centre of gravity (≈ 50.0 cm)', role: 'Balance point on a knife-edge before hanging masses in moments experiments.' },
    ],
    handling: [
      'Inspect the 0.0 cm end for wear; if rounded, measure from the 1.0 cm mark and subtract 1.0 cm.',
      'Place the graduated edge flush against the object and align your eye perpendicular to the scale mark.',
      'Record every reading to 1 decimal place in centimetres (e.g. 60.0 cm).',
    ],
    mistakes: [
      'Reading at an oblique angle (parallax error).',
      'Recording whole numbers (60 cm) instead of 60.0 cm.',
    ],
    spotInLab: '1-metre wooden or steel bar with dual opposing 0–100 cm millimetre scales.',
  },

  // 11. Micrometer screw gauge (0.01 mm)
  {
    id: 'micrometer',
    number: 11,
    name: 'Micrometer screw gauge (0.01 mm)',
    subtitle: 'Physics · Engineering',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/micrometer.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Measuring the diameter of resistance wires, pendulum bobs, thin metal sheets, and ball bearings to 0.01 mm.',
    description:
      'A high-precision screw-thread calliper with a 0.50 mm pitch lead screw and a 50-division circular thimble scale.',
    specs: {
      resolution: '0.01 mm (0.001 cm)',
      range: '0.00 – 25.00 mm',
      zeroError: 'Close anvil & spindle via ratchet and record offset (±0.01 mm)',
      material: 'Forged steel C-frame + carbide-tipped anvil/spindle',
    },
    parts: [
      { part: 'Anvil & spindle faces', role: 'Precision-ground flat faces that close onto the wire or sphere.' },
      { part: 'Sleeve (main scale with 0.5 mm half-marks)', role: 'Upper marks read whole mm; lower marks indicate whether 0.50 mm has passed.' },
      { part: 'Thimble (50 circular divisions)', role: 'Each division equals 0.01 mm.' },
      { part: 'Ratchet stop knob', role: 'Slips with three clicks at constant torque so you never squash the wire.' },
    ],
    handling: [
      'Clean the anvil and spindle faces, close using the ratchet stop (3 clicks), and record the zero error.',
      'Turn the ratchet stop until it clicks 3 times on the wire; read sleeve + thimble × 0.01 mm and subtract zero error.',
      'Measure the wire at 3 positions at right angles to check for ovality.',
    ],
    mistakes: [
      'Tightening with the main thimble barrel instead of the ratchet knob, flattening the wire.',
      'Missing the 0.50 mm half-millimetre line visible on the lower half of the sleeve.',
    ],
    spotInLab: 'Horseshoe-shaped metal frame with a knurled rotating barrel and a small clicking ratchet tip.',
  },

  // 12. Bunsen burner
  {
    id: 'bunsen-burner',
    number: 12,
    name: 'Bunsen burner, tripod & wire gauze',
    subtitle: 'Chemistry · Biology',
    subject: 'Chemistry',
    category: 'Heating & Thermal',
    file: '/apparatus/bunsen-burner.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Heating solutions, boiling water baths, sterilising loops, and performing dry-tube thermal decomposition.',
    description:
      'A gas-fuelled laboratory burner with a rotatable air-hole collar that controls primary air mixing to switch between a visible yellow safety flame and a clean blue roaring heating flame.',
    specs: {
      resolution: 'Flame regimes: safety (~300°C) to roaring (~1,200°C)',
      range: 'Variable gas-tap & air-collar control',
      zeroError: 'Always close air hole before lighting with a splint/striker',
      material: 'Cast alloy base + brass chimney + steel tripod + ceramic gauze',
    },
    parts: [
      { part: 'Rotating air-hole collar', role: 'Closed = luminous yellow safety flame; open = non-luminous blue heating flame.' },
      { part: 'Chimney (barrel)', role: 'Mixes gas and air before ignition at the top rim.' },
      { part: 'Steel tripod & ceramic wire gauze', role: 'Spreads heat evenly across the flat bottom of a beaker or flask.' },
    ],
    handling: [
      'Twist the collar to close the air hole completely before turning on the gas tap.',
      'Light the burner with a flint striker or splint to obtain the visible yellow safety flame.',
      'Open the air collar to get a clean blue flame for heating; return to the yellow safety flame whenever unattended.',
    ],
    mistakes: [
      'Lighting the burner with the air hole open, causing the flame to "strike back" to the base jet.',
      'Leaving an invisible blue flame unattended on the open bench.',
    ],
    spotInLab: 'Metal chimney on a circular base connected by rubber tubing to a yellow bench gas tap.',
  },

  // 13. Test tube & boiling tube rack
  {
    id: 'test-tube-rack',
    number: 13,
    name: 'Test tubes, boiling tube & rack',
    subtitle: 'Chemistry · Biology',
    subject: 'Chemistry',
    category: 'Glassware & Containers',
    file: '/apparatus/test-tube-rack.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Holding, mixing, and heating small chemical or biological samples during qualitative salt analysis and food tests.',
    description:
      'A wooden or polypropylene stand holding standard 16×150 mm glass test tubes for cold reagent tests and wider 24×150 mm borosilicate boiling tubes for heating liquids.',
    specs: {
      resolution: 'Qualitative (~1–2 cm³ working sample depth)',
      range: 'Test tube ≈ 15 cm³ · Boiling tube ≈ 45 cm³',
      zeroError: 'Never fill a tube more than one-third full when heating',
      material: 'Borosilicate glass tubes + hardwood rack',
    },
    parts: [
      { part: 'Standard test tubes (16 mm)', role: 'Used for room-temperature cation/anion precipitate tests and food tests.' },
      { part: 'Wide-bore boiling tube (24 mm)', role: 'Prevents violent "bumping" and boil-over when heating liquids in a flame.' },
      { part: 'Drying pegs & rack holes', role: 'Holds active tubes upright and drains washed tubes inverted.' },
    ],
    handling: [
      'Use only 1–2 cm depth of test solution for qualitative analysis so excess reagent can easily dissolve amphoteric precipitates.',
      'When heating a boiling tube, hold it at a 45° angle in a wooden holder, point the mouth away from everyone, and waft gently through the flame.',
    ],
    mistakes: [
      'Heating a narrow test tube half-full of liquid over a stationary flame, causing boiling liquid to shoot out.',
      'Pointing the mouth of a heated boiling tube toward yourself or a classmate.',
    ],
    spotInLab: 'Two-tier wooden stand with circular holes and upright drying pegs holding round-bottomed glass tubes.',
  },

  // 14. Dial gauge on magnetic stand
  {
    id: 'dial-gauge',
    number: 14,
    name: 'Dial test indicator (0.01 mm) on magnetic stand',
    subtitle: 'Engineering · Structures',
    subject: 'Engineering',
    category: 'Measuring & Volumetric',
    file: '/apparatus/dial-gauge.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Measuring small vertical deflections (δ) of loaded beams, shaft run-out, and structural bending to 0.01 mm.',
    description:
      'A rack-and-pinion mechanical displacement gauge that converts small vertical plunger travel into pointer rotation on a 100-division circular dial.',
    specs: {
      resolution: '0.01 mm per outer division',
      range: '0.00 – 10.00 mm (10 revolutions)',
      zeroError: 'Rotate outer bezel ring to align 0 with pointer after preload',
      material: 'Hardened steel rack/pinion + switchable magnetic V-base',
    },
    parts: [
      { part: 'Spring-loaded contact plunger', role: 'Rests perpendicular on the top surface of the beam at mid-span.' },
      { part: 'Outer dial (0.01 mm) & revolution counter', role: 'Small inner hand counts whole mm; large outer hand reads 0.01 mm.' },
      { part: 'Rotatable bezel & lock screw', role: 'Twists the scale face to zero the gauge under preload.' },
      { part: 'Switchable magnetic V-base', role: 'Locks rigidly onto the steel test bed when switched to ON.' },
    ],
    handling: [
      'Switch the magnetic base to ON and lower the gauge until the plunger compresses by ~1–2 mm preload.',
      'Rotate the outer bezel ring until the zero mark aligns with the large pointer.',
      'After adding or removing each load, tap the bench lightly to overcome plunger friction (stiction) before reading.',
    ],
    mistakes: [
      'Mounting the plunger at an angle instead of 90° vertical (cosine error).',
      'Forgetting to read the small inner revolution-counter hand and misreporting 2.34 mm as 0.34 mm.',
    ],
    spotInLab: 'Round watch-like dial face with a bottom plunger pin held on a red/black magnetic block.',
  },

  // 15. Sliding rheostat
  {
    id: 'rheostat',
    number: 15,
    name: 'Sliding rheostat (variable resistor)',
    subtitle: 'Electronics · Physics',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/rheostat.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Varying circuit current smoothly in Ohm’s law experiments or acting as a three-terminal potential divider.',
    description:
      'A coil of oxidised resistance wire wound tightly around an insulating ceramic cylinder with a sliding phosphor-bronze wiper contact riding on an upper metal bar.',
    specs: {
      resolution: 'Continuous stepless resistance adjustment',
      range: '0 – 20 Ω (5 A max) or 0 – 100 Ω',
      zeroError: 'Start with slider at MAXIMUM resistance before closing key',
      material: 'Ceramic former + Constantan/Nichrome coil + brass slider',
    },
    parts: [
      { part: 'Upper terminal (wiper bar)', role: 'Connects to the sliding contact; must be used as one of the two series terminals.' },
      { part: 'Two lower end terminals', role: 'Connected to the two ends of the resistance coil.' },
      { part: 'Insulated sliding wiper', role: 'Moves along the top bar to vary the active length of resistance wire in circuit.' },
    ],
    handling: [
      'To use as a variable resistor in series, connect ONE lower terminal and the UPPER slider bar terminal.',
      'Slide the wiper to the maximum-resistance end before closing the circuit switch.',
      'Move the slider in steps to obtain 6–8 evenly spaced current and voltage pairs.',
    ],
    mistakes: [
      'Connecting both wires to the two lower terminals, fixing resistance at maximum so moving the slider does nothing.',
      'Connecting both wires to the two ends of the top bar, creating a 0 Ω short circuit.',
    ],
    spotInLab: 'Dark grey ribbed cylinder on two metal feet with a sliding block on a shiny top rail.',
  },

  // 16. Rectangular glass block & optical pins
  {
    id: 'glass-block',
    number: 16,
    name: 'Rectangular glass block & optical pins',
    subtitle: 'Physics · Optics',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/glass-block.svg',
    practiseTo: '/lab/physics/refraction',
    primaryUses: 'Tracing light rays to verify Snell’s Law (n = sin i / sin r), refractive index, and lateral displacement.',
    description:
      'A polished crown-glass slab (n ≈ 1.50) with two clear opposite parallel faces and two frosted edges, used with four steel optical pins on a softwood drawing board.',
    specs: {
      resolution: 'Protractor 0.5° · Rule 0.1 cm',
      range: 'i = 15° to 60° · refractive index n ≈ 1.50',
      zeroError: 'Re-align block exactly inside its traced pencil outline ABCD',
      material: 'Optical crown glass + softwood board + steel pins',
    },
    parts: [
      { part: 'Polished parallel faces (AB & DC)', role: 'Refract incident and emergent rays cleanly with lateral shift.' },
      { part: 'Object pins (P₁, P₂) & search pins (P₃, P₄)', role: 'Spaced at least 5 cm apart to define incident and emergent ray paths.' },
    ],
    handling: [
      'Trace the outline ABCD of the glass block sharply in pencil before placing any pins.',
      'Stick object pins P₁ and P₂ vertically into the board at least 5 cm apart along the incident line.',
      'Look through face DC at eye level and align search pins P₃ and P₄ until all four pin bases appear in one straight line.',
    ],
    mistakes: [
      'Placing optical pins closer than 3 cm together, magnifying angular drawing error.',
      'Sighting the tops of tilted pins instead of the bases where the pins enter the paper.',
    ],
    spotInLab: 'Thick heavy transparent glass brick stored in a padded box with long steel pins.',
  },

  // 17. Copper calorimeter & thermometer
  {
    id: 'calorimeter',
    number: 17,
    name: 'Copper calorimeter, lagging & thermometer',
    subtitle: 'Physics · Chemistry',
    subject: 'Physics',
    category: 'Heating & Thermal',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/physics/pendulum',
    primaryUses: 'Measuring specific heat capacity of solids/liquids by method of mixtures and heat of neutralisation.',
    description:
      'A cylindrical copper vessel suspended inside an outer wooden jacket packed with felt/cotton lagging, fitted with a wooden lid, copper loop stirrer, and thermometer.',
    specs: {
      resolution: 'Thermometer 0.5°C (or 0.1°C) · Balance 0.1 g',
      range: '–10°C to 110°C · 150 cm³ capacity',
      zeroError: 'Stir continuously and record highest steady temperature θ_max',
      material: 'Polished copper (c = 390 J kg⁻¹ K⁻¹) + felt lagging',
    },
    parts: [
      { part: 'Inner polished copper vessel', role: 'Known specific heat capacity and rapid thermal equilibrium.' },
      { part: 'Felt lagging & outer wooden jacket', role: 'Minimises heat loss by conduction and convection.' },
      { part: 'Copper ring stirrer', role: 'Circulates water vertically so temperature is uniform throughout.' },
    ],
    handling: [
      'Weigh the clean, dry inner copper calorimeter with its copper stirrer (m₁), then half-fill with water and re-weigh (m₂).',
      'Transfer the heated solid rapidly into the water without splashing, close the lid, and stir gently.',
      'Watch the thermometer at eye level and record the highest steady equilibrium temperature reached.',
    ],
    mistakes: [
      'Stirring with the fragile glass thermometer bulb instead of the copper ring stirrer.',
      'Resting the thermometer bulb on the hot metal bottom of the calorimeter instead of mid-liquid.',
    ],
    spotInLab: 'Shiny reddish-brown copper cup nested inside a wider wooden cylinder with a slotted wooden lid.',
  },

  // 18. Solderless breadboard & digital multimeter
  {
    id: 'breadboard-dmm',
    number: 18,
    name: 'Solderless breadboard & digital multimeter',
    subtitle: 'Electronics · Circuits',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/breadboard-dmm.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Prototyping semiconductor, diode, RC, and logic-gate circuits and measuring V, I, and R digitally.',
    description:
      'An 830-tie-point prototyping board with internal spring clips paired with a 3½-digit handheld Digital Multimeter (DMM).',
    specs: {
      resolution: 'DMM: 1 mV / 0.1 mA / 0.1 Ω · 2.54 mm grid',
      range: 'DC 200 mV–600 V · 200 µA–10 A · 200 Ω–20 MΩ',
      zeroError: 'Touch DMM probes together in Ω mode to check lead resistance',
      material: 'ABS breadboard + nickel-silver clips + LCD DMM',
    },
    parts: [
      { part: 'Terminal strips (columns a–e, f–j)', role: '5 holes in each half-row are connected internally; central ravine isolates DIP ICs.' },
      { part: 'Power distribution rails (+ and –)', role: 'Run horizontally along the top and bottom edges for Vcc and Ground.' },
      { part: 'DMM rotary range selector & 3 jacks', role: 'COM (black), V/Ω/mA (red), and unfused 10 A (high current).' },
    ],
    handling: [
      'Straddle ICs across the central ravine and never plug both legs of a resistor into the same 5-hole vertical group.',
      'Before measuring current with the DMM, verify the red lead is in the mA or 10 A jack and wire the meter in series.',
    ],
    mistakes: [
      'Plugging both leads of a component into the same 5-hole column, short-circuiting it.',
      'Trying to measure voltage across a battery while the DMM red probe is still plugged into the 10 A current jack.',
    ],
    spotInLab: 'White perforated plastic board with red/blue side stripes next to a handheld yellow/dark-blue digital meter.',
  },

  // 19. Venturi tube & multi-tube manometer
  {
    id: 'venturi-manometer',
    number: 19,
    name: 'Venturi tube & multi-tube manometer',
    subtitle: 'Engineering · Fluid Mechanics',
    subject: 'Engineering',
    category: 'Measuring & Volumetric',
    file: '/apparatus/venturi-manometer.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Measuring static pressure head h along a converging–diverging duct to verify Bernoulli’s theorem.',
    description:
      'A clear acrylic converging–diverging flow duct fitted with static pressure tappings connected to a vertical bank of piezometer manometer tubes.',
    specs: {
      resolution: 'Manometer head: 1 mm H₂O · Rotameter: 0.2 L/min',
      range: '0 – 400 mm water head · 0 – 25 L/min flow',
      zeroError: 'Bleed all air bubbles; verify all tubes read equal height at Q = 0',
      material: 'Machined acrylic Venturi duct + glass piezometer bank',
    },
    parts: [
      { part: 'Converging inlet, throat & diffuser', role: 'Accelerates fluid at the narrow throat (lowering static head) and recovers pressure downstream.' },
      { part: 'Multi-tube piezometer manometer bank', role: 'Displays static pressure head h_i (mm H₂O) at each cross-section simultaneously.' },
    ],
    handling: [
      'Purge all air bubbles from the manometer lines and confirm all water columns stand at the same datum level at zero flow.',
      'Set steady flow and read the bottom of the meniscus in every manometer tube at eye level.',
    ],
    mistakes: [
      'Taking manometer readings while air bubbles are trapped in the connecting tubes.',
      'Using diameter ratio (d₁/d₂) instead of area ratio (d₁/d₂)² in the continuity equation.',
    ],
    spotInLab: 'Horizontal clear plastic pipe that pinches narrow in the middle, wired to 6–8 vertical water tubes on a backing scale.',
  },

  // 20. Dissecting kit & wax tray
  {
    id: 'dissecting-kit',
    number: 20,
    name: 'Dissecting kit & wax tray',
    subtitle: 'Biology · Zoology & Anatomy',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Pinning, opening, and tracing internal organs in vertebrate (rat/frog) and floral dissections.',
    description:
      'A complete zoological and botanical dissection set comprising an aluminium tray lined with black paraffin wax, surgical scalpel, forceps, iris scissors, seeker probe, and dissecting pins.',
    specs: {
      resolution: '×10 folding hand lens',
      range: 'Vertebrate, invertebrate & floral specimens',
      zeroError: 'Pin specimen flat at 45° outward slant',
      material: 'Surgical stainless steel + paraffin wax tray',
    },
    parts: [
      { part: 'Wax dissecting tray', role: 'Anchors dissecting pins firmly and holds water/saline to float delicate organs.' },
      { part: 'Scissors & blunt forceps', role: 'Lifts the abdominal body wall away from underlying viscera while cutting.' },
      { part: 'Seeker (blunt bent probe)', role: 'Traces blood vessels or ducts without puncturing them.' },
    ],
    handling: [
      'Pin the specimen limbs at a 45° outward angle on the wax bed.',
      'Lift the abdominal wall with forceps and cut forward with round-tipped scissors.',
      'Flood the cavity with water to float organs and trace vessels with the blunt seeker.',
    ],
    mistakes: [
      'Plunging the sharp scalpel deep into the abdomen and puncturing the liver or stomach.',
      'Pinning vertically (90°) so pins pull out or block visibility.',
    ],
    spotInLab: 'Canvas roll of stainless-steel instruments alongside a dark wax-filled metal dish.',
  },

  // 21. Bubble potometer
  {
    id: 'potometer',
    number: 21,
    name: 'Bubble potometer (transpiration)',
    subtitle: 'Biology · Plant Physiology',
    subject: 'Biology',
    category: 'Measuring & Volumetric',
    file: '/apparatus/potometer.svg',
    practiseTo: '/lab/biology/digestion',
    primaryUses: 'Measuring the rate of water uptake and transpiration of a leafy shoot under varying light, wind, or humidity.',
    description:
      'An apparatus that measures water uptake by a leafy plant shoot by timing the movement of an air bubble along a graduated capillary tube.',
    specs: {
      resolution: '1.0 mm capillary scale (≈ 0.01 cm³)',
      range: '0 – 150 mm bubble travel',
      zeroError: 'Open reservoir tap to push air bubble back to 0 mm mark',
      material: 'Borosilicate capillary tubing + rubber bung',
    },
    parts: [
      { part: 'Leafy shoot in airtight rubber bung', role: 'Transpires water from stomata, pulling the water column up.' },
      { part: 'Reservoir funnel & stopcock tap', role: 'Resets the air bubble to the zero mark for repeat trials.' },
      { part: 'Graduated capillary tube', role: 'Converts small volume uptake into linear distance (mm/min).' },
    ],
    handling: [
      'Cut the plant stem obliquely under water to prevent xylem air locks and seal the bung with Vaseline.',
      'Introduce one small air bubble and time its travel over 5 minutes; reset with the reservoir tap and repeat.',
    ],
    mistakes: [
      'Cutting the plant stem in air instead of under water.',
      'Failing to seal the rubber bung airtightly.',
    ],
    spotInLab: 'H-shaped glass capillary assembly on a backing board with a leafy shoot in the top bung.',
  },

  // 22. Petri dish, slides & cover slips
  {
    id: 'petri-slides',
    number: 22,
    name: 'Petri dish, glass slides & cover slips',
    subtitle: 'Biology · Microbiology & Microscopy',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/petri-slides.svg',
    practiseTo: '/lab/biology/digestion',
    primaryUses: 'Culturing microorganisms on agar plates and preparing wet-mount microscopy specimens.',
    description:
      'Shallow cylindrical glass/plastic culture dishes for agar plates or specimen washing, paired with 75×25 mm glass slides and 0.17 mm cover slips.',
    specs: {
      resolution: '0.17 mm cover-slip thickness (No. 1.5)',
      range: '75 × 25 mm slide · 90 mm Petri dish',
      zeroError: 'Lower cover slip at 45° with a mounted needle to exclude air bubbles',
      material: 'Soda-lime / borosilicate optical glass',
    },
    parts: [
      { part: 'Petri dish & overlapping lid', role: 'Holds sterile nutrient agar or water for floating plant sections.' },
      { part: '75 × 25 mm slide & 22 mm cover slip', role: 'Flattens wet-mount specimens and protects the microscope objective.' },
    ],
    handling: [
      'Place a single-cell-thick peel flat in a drop of stain on the slide.',
      'Rest one edge of the cover slip at 45° and lower gently with a mounted needle to avoid air bubbles.',
    ],
    mistakes: [
      'Dropping the cover slip flat and trapping dark-ringed circular air bubbles.',
    ],
    spotInLab: 'Round flat covered glass dishes alongside rectangular glass slide boxes.',
  },

  // 23. Volumetric flask (250 cm³)
  {
    id: 'volumetric-flask',
    number: 23,
    name: 'Volumetric flask (250 cm³ standard flask)',
    subtitle: 'Chemistry · Standard Solutions',
    subject: 'Chemistry',
    category: 'Measuring & Volumetric',
    file: '/apparatus/conical-flask.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Preparing standard solutions of an exact molar concentration and diluting stock solutions to a precise total volume.',
    description:
      'A pear-shaped, flat-bottomed flask with a long narrow neck bearing a single precision-etched calibration line and a ground-glass or polypropylene stopper.',
    specs: {
      resolution: 'Single calibrated volume ± 0.15 cm³ (Class A, 250 cm³)',
      range: '100 cm³, 250 cm³, 500 cm³, 1000 cm³ fixed sizes',
      zeroError: 'Use a dropper for the last 2 cm³ so you do not overshoot the line',
      material: 'Borosilicate glass + polyethylene snap stopper',
    },
    parts: [
      { part: 'Long narrow neck with etched ring', role: 'Small neck diameter makes any small volume change produce a large height change at the mark.' },
      { part: 'Airtight stopper', role: 'Allows the flask to be inverted 10–15 times to homogenise the solution.' },
      { part: 'Pear-shaped bulb & flat base', role: 'Holds the bulk of the liquid volume stably on the bench.' },
    ],
    handling: [
      'Dissolve the weighed solute completely in a small beaker first, then transfer quantitatively into the volumetric flask via a funnel.',
      'Wash the beaker, glass rod, and funnel 3 times with distilled water into the flask.',
      'Swirl to mix, add distilled water up to 1 cm below the neck mark, and use a dropper to bring the bottom of the meniscus onto the etched ring.',
      'Stopper tightly and invert 10 times to ensure uniform concentration.',
    ],
    mistakes: [
      'Dumping solid crystals directly into the volumetric flask where they stick in the narrow neck.',
      'Overshooting the etched mark with a wash bottle (the entire solution must be discarded and remade).',
      'Heating a volumetric flask over a flame, permanently distorting its calibrated volume.',
    ],
    spotInLab: 'Flat-bottomed pear-shaped flask with a very tall thin neck, one etched line, and a plastic stopper.',
  },

  // 24. Test tube holder
  {
    id: 'test-tube-holder',
    number: 24,
    name: 'Test tube holder (wooden / wire spring clip)',
    subtitle: 'Chemistry · Biology',
    subject: 'Chemistry',
    category: 'Support & Handling',
    file: '/apparatus/test-tube-rack.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Safely gripping a test tube or boiling tube while heating it over a Bunsen burner flame or water bath.',
    description:
      'A wooden clothes-peg-style clamp or self-closing spring-steel wire grip with a sliding tension ring that holds hot glass tubes away from your fingers.',
    specs: {
      resolution: 'Fits 12 – 28 mm tube diameters',
      range: 'Safe standoff length 15 – 20 cm',
      zeroError: 'Clamp 2 cm below the top rim of the tube (never in the flame)',
      material: 'Seasoned hardwood with steel spring or plated spring wire',
    },
    parts: [
      { part: 'Contoured gripping jaws', role: 'Curved to cradle cylindrical glass test tubes and boiling tubes securely.' },
      { part: 'Sliding metal tension collar / spring', role: 'Locks the jaws closed so squeezing the handle does not accidentally open them.' },
    ],
    handling: [
      'Clamp the holder around the upper neck of the test tube, about 1.5–2 cm below the lip.',
      'Hold the wooden handle at the far end so your hand stays well clear of steam and the burner flame.',
      'Keep the wooden jaws out of the direct Bunsen flame so they do not char.',
    ],
    mistakes: [
      'Gripping the handle right over the spring pivot where squeezing actually opens the jaws and drops the hot tube.',
      'Clamping the tube at the bottom where the flame burns the wooden jaws.',
    ],
    spotInLab: 'Long wooden spring clip with curved jaws and a sliding metal ring.',
  },

  // 25. Dropper / Pasteur pipette
  {
    id: 'dropper',
    number: 25,
    name: 'Reagent dropper (Pasteur teat pipette)',
    subtitle: 'Chemistry · Biology',
    subject: 'Chemistry',
    category: 'Measuring & Volumetric',
    file: '/apparatus/volumetric-pipette.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Adding indicators (phenolphthalein, methyl orange), stains (iodine), or qualitative reagents one drop at a time.',
    description:
      'A short glass or graduated polyethylene tube fitted with a flexible rubber teat bulb for dispensing small liquid volumes dropwise (≈ 0.05 cm³ per drop).',
    specs: {
      resolution: '1 drop ≈ 0.05 cm³ (20 drops ≈ 1 cm³)',
      range: '0.5 – 3.0 cm³ bulb draw',
      zeroError: 'Keep vertical — never invert with liquid inside the rubber teat',
      material: 'Soda-lime glass + natural rubber teat or LDPE',
    },
    parts: [
      { part: 'Flexible rubber teat bulb', role: 'Squeezed before immersion to draw liquid into the glass stem.' },
      { part: 'Drawn capillary nozzle', role: 'Forms uniform ~0.05 cm³ droplets when squeezed gently.' },
    ],
    handling: [
      'Squeeze the rubber bulb BEFORE dipping the tip into the reagent bottle so you do not bubble air through the stock reagent.',
      'Hold the dropper vertically above the receiving test tube without touching the inner glass wall.',
      'Never turn a filled dropper upside down, or corrosive reagent will run into the rubber teat.',
    ],
    mistakes: [
      'Touching the dropper tip into the test solution and then putting it back into the stock reagent bottle (cross-contamination).',
      'Holding the dropper horizontally so acid runs into the rubber bulb.',
    ],
    spotInLab: 'Small glass tube topped with an orange or black squeezable rubber bulb.',
  },

  // 26. Filter funnel
  {
    id: 'filter-funnel',
    number: 26,
    name: 'Filter funnel & filter paper',
    subtitle: 'Chemistry · Separation',
    subject: 'Chemistry',
    category: 'Glassware & Containers',
    file: '/apparatus/conical-flask.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Pouring liquids safely into narrow-necked burettes/volumetric flasks and separating insoluble precipitates (residue) from filtrate.',
    description:
      'A 60°-cone borosilicate glass funnel with a narrow delivery stem, used with fluted or quadrant-folded cellulose filter paper for gravity filtration.',
    specs: {
      resolution: 'Whatman No. 1 retention ≈ 11 µm particles',
      range: '50 mm – 100 mm cone diameter',
      zeroError: 'Keep liquid level 5 mm below the top edge of the filter paper',
      material: 'Borosilicate glass + ashless cellulose filter paper',
    },
    parts: [
      { part: '60° conical bowl', role: 'Matches the geometry of a quadrant-folded circular filter paper cone (3 layers on one side, 1 on the other).' },
      { part: 'Ground bevelled stem', role: 'Touches the inside wall of the receiving beaker so filtrate runs down smoothly without splashing.' },
    ],
    handling: [
      'Fold a circular filter paper in half, then in quarters, open into a 3-layer/1-layer cone, seat it in the funnel, and moisten with a drop of distilled water.',
      'Pour the suspension down a glass stirring rod into the 3-layer side of the paper cone, keeping the liquid level below the paper rim.',
      'Always remove the funnel from the top of a burette immediately after filling.',
    ],
    mistakes: [
      'Poking the glass stirring rod through the wet apex of the filter paper cone, ruining the filtration.',
      'Filling the funnel above the rim of the filter paper so unfiltered suspension bypasses down the glass wall.',
    ],
    spotInLab: 'Cone-shaped glass funnel sitting alongside round white boxes of circular filter paper.',
  },

  // 27. Spirit lamp
  {
    id: 'spirit-lamp',
    number: 27,
    name: 'Spirit lamp (alcohol burner)',
    subtitle: 'Chemistry · Biology',
    subject: 'Biology',
    category: 'Heating & Thermal',
    file: '/apparatus/bunsen-burner.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Providing gentle, portable flame heating in laboratories without piped gas or for leaf-decolourising and slide warming.',
    description:
      'A heavy glass or stainless-steel reservoir filled with methylated spirit (denatured ethanol) feeding a braided cotton wick through a brass screw collar, fitted with a snuffer cap.',
    specs: {
      resolution: 'Gentle luminous flame (~500–600°C)',
      range: '60 – 150 cm³ methylated spirit reservoir',
      zeroError: 'Extinguish with the metal snuffer cap — NEVER blow out',
      material: 'Thick faceted soda-lime glass or stainless steel + cotton wick',
    },
    parts: [
      { part: 'Heavy faceted reservoir', role: 'Holds methylated spirit with a wide footprint to resist tipping.' },
      { part: 'Braided cotton wick & brass holder', role: 'Draws alcohol upward by capillary action; trimmed to 5 mm above the tube.' },
      { part: 'Snuffer cap', role: 'Starves the flame of oxygen to extinguish it safely and prevents alcohol evaporation.' },
    ],
    handling: [
      'Check that the lamp is no more than three-quarters full and wipe any spilled alcohol off the outside before lighting.',
      'Never refill a lit or hot spirit lamp — wait until completely cool.',
      'Extinguish the flame by placing the snuffer cap straight over the wick.',
    ],
    mistakes: [
      'Blowing out a spirit lamp with your mouth, which can push flame down into the vapour space of the reservoir.',
      'Using a spirit lamp near an open water bath of flammable ethanol during chlorophyll extraction.',
    ],
    spotInLab: 'Short, squat glass bottle with a woven rope wick sticking out of a brass neck and a domed metal cap.',
  },

  // 28. Tripod stand
  {
    id: 'tripod-stand',
    number: 28,
    name: 'Tripod stand',
    subtitle: 'Chemistry · Physics · Biology',
    subject: 'Chemistry',
    category: 'Support & Handling',
    file: '/apparatus/bunsen-burner.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Supporting wire gauze, beakers, conical flasks, evaporating dishes, and clay-pipe triangles above a Bunsen burner.',
    description:
      'A three-legged iron support ring with outward-splayed legs sized to straddle a standard Bunsen burner or spirit lamp.',
    specs: {
      resolution: 'Fixed burner clearance height (≈ 15–20 cm)',
      range: '100 – 150 mm top ring diameter',
      zeroError: 'Always let cool before touching; pick up by the lower leg only',
      material: 'Cast iron top ring + zinc-plated mild steel legs',
    },
    parts: [
      { part: 'Circular iron top ring', role: 'Holds a square of wire gauze or a porcelain clay-pipe triangle.' },
      { part: 'Three splayed steel legs', role: 'Provide three-point stability on any bench surface while clearing the Bunsen base.' },
    ],
    handling: [
      'Centre the tripod directly over the unlit Bunsen burner and place the wire gauze flat on the ring before setting down the beaker.',
      'After turning off the burner, allow the tripod to cool for 5–10 minutes on a heatproof mat; if you must move it, grip the very bottom of one leg with tongs.',
    ],
    mistakes: [
      'Grabbing the top ring of a tripod bare-handed right after extinguishing the burner (hot iron looks identical to cold iron).',
    ],
    spotInLab: 'Three-legged metal ring standing over a Bunsen burner.',
  },

  // 29. Wire gauze
  {
    id: 'wire-gauze',
    number: 29,
    name: 'Wire gauze (ceramic-centred mesh)',
    subtitle: 'Chemistry · Biology',
    subject: 'Chemistry',
    category: 'Heating & Thermal',
    file: '/apparatus/bunsen-burner.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Supporting flat-bottomed glassware on a tripod stand and diffusing the Bunsen flame evenly to prevent thermal shock cracking.',
    description:
      'A 125×125 mm square of woven iron wire mesh with a compressed circular white ceramic-fibre (asbestos-free) centre disc.',
    specs: {
      resolution: 'Uniform heat distribution across 100 mm circle',
      range: '125 × 125 mm or 150 × 150 mm square',
      zeroError: 'Inspect for holes or flaking before placing glassware',
      material: 'Galvanised steel mesh + non-asbestos ceramic-fibre disc',
    },
    parts: [
      { part: 'Woven steel wire mesh', role: 'Supports the weight of full beakers and conical flasks over the open tripod ring.' },
      { part: 'Ceramic-fibre centre disc', role: 'Absorbs and radiates heat uniformly so a localised flame jet does not crack the glass base.' },
    ],
    handling: [
      'Place the wire gauze centred on the tripod ring with the ceramic disc directly above the burner chimney.',
      'Handle with crucible tongs while hot and rest on a heatproof mat.',
    ],
    mistakes: [
      'Heating a flat-bottomed beaker directly on a tripod without wire gauze, causing thermal-stress fracture.',
    ],
    spotInLab: 'Square metal wire screen with a flat white chalky circle pressed into the middle.',
  },

  // 30. Porcelain crucible & lid
  {
    id: 'crucible',
    number: 30,
    name: 'Porcelain crucible & lid',
    subtitle: 'Chemistry · Quantitative Gravimetric',
    subject: 'Chemistry',
    category: 'Heating & Thermal',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Heating solids to red heat (e.g., oxidising Mg ribbon to MgO or driving off water of crystallisation) to find empirical formulas.',
    description:
      'A small, cup-shaped glazed porcelain container with a loose-fitting lidded cover capable of withstanding direct roaring Bunsen temperatures up to 1,150°C on a pipe-clay triangle.',
    specs: {
      resolution: 'Used with 0.01 g or 0.001 g analytical balance',
      range: '15 – 50 cm³ capacity · up to 1,150°C',
      zeroError: 'Heat empty to constant mass & cool in a desiccator before weighing',
      material: 'High-alumina glazed refractory porcelain',
    },
    parts: [
      { part: 'Refractory porcelain cup', role: 'Holds metal ribbon or hydrated salt directly in the hottest cone of a roaring Bunsen flame.' },
      { part: 'Ring-handle porcelain lid', role: 'Lifted slightly with tongs to admit controlled bursts of oxygen while trapping white oxide smoke (MgO).' },
    ],
    handling: [
      'Support the crucible inside a pipe-clay triangle resting on a tripod stand (never on wire gauze, which blocks the high heat needed).',
      'When burning magnesium ribbon to find the formula of MgO, lift the lid slightly with crucible tongs every 30 seconds to let air in, then close immediately so white MgO smoke does not escape.',
      'Always allow the crucible to cool completely before placing it on an electronic balance.',
    ],
    mistakes: [
      'Leaving the crucible lid off while burning magnesium, losing dense white MgO fumes and giving a low oxygen mass.',
      'Placing a red-hot crucible directly on a cold bench or balance pan (shatters the porcelain and ruins the load cell).',
    ],
    spotInLab: 'Tiny white china cup with a matching slightly oversized lid with a small ring handle on top.',
  },

  // 31. Evaporating dish
  {
    id: 'evaporating-dish',
    number: 31,
    name: 'Evaporating dish (porcelain basin)',
    subtitle: 'Chemistry · Crystallisation',
    subject: 'Chemistry',
    category: 'Heating & Thermal',
    file: '/apparatus/petri-slides.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Evaporating excess solvent from an aqueous solution to concentrate it to the crystallisation point or recover dissolved solids.',
    description:
      'A wide, shallow, open glazed-porcelain bowl with a pouring lip that maximises liquid surface area for rapid solvent evaporation over a water bath or gauze.',
    specs: {
      resolution: 'Wide surface-to-volume ratio for evaporation',
      range: '50 – 150 cm³ working volume',
      zeroError: 'Stop direct heating at crystallisation point to avoid spitting',
      material: 'Glazed chemical porcelain',
    },
    parts: [
      { part: 'Wide shallow bowl', role: 'Exposes a large liquid surface area so water vapour escapes rapidly without boiling violently.' },
      { part: 'Pouring spout lip', role: 'Allows mother liquor to be decanted off formed crystals.' },
    ],
    handling: [
      'To prepare hydrated crystals (e.g., CuSO₄·5H₂O), heat the filtrate in an evaporating dish until a drop on a cold glass rod forms crystals (crystallisation point), then turn off the burner and leave to cool slowly.',
      'For gentle final evaporation without spitting or decomposing hydrated salts, place the evaporating dish on top of a beaker of boiling water (steam bath).',
    ],
    mistakes: [
      'Boiling a solution of hydrated copper(II) sulphate completely to dryness over a fierce flame, dehydrating the blue crystals into white anhydrous powder and causing hot solid to spit out.',
    ],
    spotInLab: 'White shallow porcelain cereal-bowl shape with a small pouring lip.',
  },

  // 32. Thermostatic water bath
  {
    id: 'water-bath',
    number: 32,
    name: 'Thermostatic water bath',
    subtitle: 'Biology · Chemistry',
    subject: 'Biology',
    category: 'Heating & Thermal',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Maintaining test tubes at a constant temperature (e.g., 37°C for enzyme digestion or 80–100°C for Benedict’s reducing sugar test) and safely heating flammable solvents like ethanol.',
    description:
      'An electrically heated insulated stainless-steel tank (or a 250 cm³ beaker of water on a tripod) that surrounds test tubes with warm water for uniform, flame-free temperature control.',
    specs: {
      resolution: '± 0.5°C digital thermostat (or ± 1°C with thermometer)',
      range: 'Ambient + 5°C up to 100°C',
      zeroError: 'Equilibrate tubes in the bath for 5 min before mixing enzyme & substrate',
      material: 'Stainless-steel chamber + PID immersion heater + gable lid',
    },
    parts: [
      { part: 'Insulated water chamber & perforated rack', role: 'Submerges test tubes evenly up to the level of the reaction mixture.' },
      { part: 'Thermostat & digital readout', role: 'Holds physiological 37.0°C (human enzymes) or 80°C (Benedict’s test).' },
    ],
    handling: [
      'Keep the water level above the liquid level inside your test tubes, and top up with distilled water so the heating element never runs dry.',
      'In enzyme rate experiments (e.g., salivary amylase on starch), equilibrate the enzyme tube and starch tube separately at 37°C for 5 minutes BEFORE mixing them.',
      'Always use a hot water bath — never a naked Bunsen flame — when boiling a leaf in ethanol to remove chlorophyll.',
    ],
    mistakes: [
      'Mixing cold enzyme and cold substrate immediately and then putting the tube into the 37°C bath (the reaction runs at the wrong temperature while warming up).',
      'Heating ethanol directly over a Bunsen flame instead of in a water bath after turning the burner off.',
    ],
    spotInLab: 'Rectangular stainless-steel tank with a temperature dial and a submerged test-tube rack.',
  },

  // 33. Electric heating mantle
  {
    id: 'heating-mantle',
    number: 33,
    name: 'Electric heating mantle',
    subtitle: 'Chemistry · Organic Distillation',
    subject: 'Chemistry',
    category: 'Heating & Thermal',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Providing uniform, flameless electrical heating to round-bottom flasks during reflux and fractional distillation of flammable organic liquids.',
    description:
      'A hemispherical fibreglass fabric cavity embedded with nichrome resistance heating coils and an electronic power regulator, contoured to cradle a round-bottom flask.',
    specs: {
      resolution: 'Stepless 0–100% proportional power dial',
      range: 'Fits 100 cm³, 250 cm³, or 500 cm³ round-bottom flasks (up to 450°C)',
      zeroError: 'Never switch on empty without a flask & boiling chips',
      material: 'Spun aluminium housing + woven glass-fibre heating basket',
    },
    parts: [
      { part: 'Hemispherical woven glass-fibre basket', role: 'Conforms to the lower half of a round-bottom flask to prevent hot spots.' },
      { part: 'Simmerstat power controller & heater lamp', role: 'Regulates heating duty cycle without any open flame hazard.' },
    ],
    handling: [
      'Match the flask size (e.g., 250 cm³) to the mantle cavity size and add 2–3 anti-bumping granules before heating.',
      'Support the neck of the round-bottom flask with a retort clamp and position the mantle on a lab jack so the heat source can be lowered quickly if boiling becomes too vigorous.',
    ],
    mistakes: [
      'Spilling liquid inside the woven fibreglass mantle cavity while plugged into mains power.',
      'Forgetting to add anti-bumping granules to a round-bottom flask before heating.',
    ],
    spotInLab: 'Cylindrical metal bowl with a soft woven white fabric pocket in the middle and a numbered rotary heat knob.',
  },

  // 34. Laboratory tongs
  {
    id: 'laboratory-tongs',
    number: 34,
    name: 'Laboratory crucible & beaker tongs',
    subtitle: 'Chemistry · Safety & Handling',
    subject: 'Chemistry',
    category: 'Support & Handling',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Gripping red-hot porcelain crucibles, lifting hot crucible lids, holding magnesium ribbon in a flame, and moving hot beakers or wire gauze.',
    description:
      'Long scissor-hinged steel or nickel-plated iron pincers with curved serrated bow jaws near the pivot and tapered tips for lifting crucible lids.',
    specs: {
      resolution: 'Jaw opening 10 – 75 mm',
      range: '200 – 250 mm overall length',
      zeroError: 'Pre-warm tips briefly so cold metal does not thermal-shock a red-hot crucible',
      material: 'Forged stainless steel or nickel-plated mild steel',
    },
    parts: [
      { part: 'Curved bow jaws', role: 'Encircle the tapered waist of a porcelain crucible securely.' },
      { part: 'Corrugated pincer tips', role: 'Grip the small ring handle on top of a crucible lid or hold metal ribbon.' },
      { part: 'Scissor finger loops', role: 'Keep the operator’s hand 20 cm away from radiant heat.' },
    ],
    handling: [
      'Cradle a crucible around its middle using the curved bow section of the tongs — do not pinch the fragile vertical rim of a full crucible with the tips.',
      'When setting hot tongs down on the bench, place them on a heatproof mat with the hot tips pointing inward.',
    ],
    mistakes: [
      'Using bare metal crucible tongs to lift a large heavy glass beaker full of boiling water (use rubber-sleeved beaker tongs instead so the glass does not slip).',
    ],
    spotInLab: 'Long metal scissor-like tool with a bowed diamond-shaped opening behind pointed tips.',
  },

  // 35. Laboratory spatula
  {
    id: 'spatula',
    number: 35,
    name: 'Laboratory spatula (Nuffield / Chattaway)',
    subtitle: 'Chemistry · Solid Reagents',
    subject: 'Chemistry',
    category: 'Support & Handling',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Scooping, transferring, and weighing small quantities of powdered or crystalline solid chemicals from reagent bottles.',
    description:
      'A corrosion-resistant 18/8 stainless-steel strip with a flat blade at one end and a shallow spoon scoop or upturned trough at the other.',
    specs: {
      resolution: '1 level ”spatula measure” ≈ 0.2 – 0.5 g solid',
      range: '150 – 200 mm length',
      zeroError: 'Wipe clean & dry between every reagent bottle',
      material: 'Austenitic 304 stainless steel or nickel',
    },
    parts: [
      { part: 'Spoon / trough end', role: 'Scoops free-flowing powders and crystals without spilling.' },
      { part: 'Flat blade end', role: 'Breaks up caked salts and scrapes small grains onto a watch glass on a balance.' },
    ],
    handling: [
      'Always wipe the spatula clean and dry with tissue before dipping into any reagent bottle.',
      'Tap the index finger gently against the spatula shaft over the weighing boat to add crystals grain by grain.',
      'Never return excess chemical from your weighing boat back into the stock reagent bottle.',
    ],
    mistakes: [
      'Using the same unwashed spatula across two reagent bottles, contaminating the entire stock jar for the class.',
    ],
    spotInLab: 'Slender silver metal strip flattened at one end and slightly cupped like a tiny spoon at the other.',
  },

  // 36. Glass stirring rod
  {
    id: 'glass-rod',
    number: 36,
    name: 'Glass stirring rod',
    subtitle: 'Chemistry · Mixing & Decanting',
    subject: 'Chemistry',
    category: 'Support & Handling',
    file: '/apparatus/volumetric-pipette.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Stirring solutions to dissolve solutes, guiding liquids while decanting into a funnel, and spot-testing drops on litmus paper.',
    description:
      'A solid cylindrical borosilicate glass rod (6 mm diameter, 200 mm long) with both ends fire-polished smooth to prevent scratching glassware.',
    specs: {
      resolution: 'Fire-polished rounded ends',
      range: '150 – 250 mm length × 6 mm diameter',
      zeroError: 'Rinse with distilled water before touching litmus or indicator paper',
      material: 'Solid borosilicate glass (optional rubber policeman tip)',
    },
    parts: [
      { part: 'Solid borosilicate shaft', role: 'Chemically inert in concentrated acids, alkalis, and organic solvents.' },
      { part: 'Fire-polished hemispherical ends', role: 'Prevent scratching the inside of beakers, which would create fracture lines on heating.' },
    ],
    handling: [
      'Stir with a circular wrist motion keeping the rod away from the fragile beaker walls.',
      'To test pH with litmus paper, dip the clean glass rod into the test solution and touch one drop onto the paper — never drop the paper strip into the test tube.',
      'When pouring from a beaker into a filter funnel, hold the glass rod vertically against the beaker spout so liquid flows smoothly down the rod.',
    ],
    mistakes: [
      'Using a glass thermometer as a stirring rod and snapping the mercury/alcohol bulb.',
      'Leaving a long glass rod standing inside an empty tall measuring cylinder or small beaker where its weight tips the vessel over.',
    ],
    spotInLab: 'Clear solid glass stick with rounded smooth ends.',
  },

  // 37. Mortar and pestle
  {
    id: 'mortar-pestle',
    number: 37,
    name: 'Porcelain mortar and pestle',
    subtitle: 'Chemistry · Biology',
    subject: 'Chemistry',
    category: 'Support & Handling',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Crushing and grinding coarse crystalline salts to speed dissolution, or macerating plant tissues (cassava, groundnut, leaves) with sand/water for food and pigment extraction.',
    description:
      'A thick-walled heavy porcelain bowl (mortar) with a rough unglazed interior floor paired with a club-shaped porcelain grinding rod (pestle).',
    specs: {
      resolution: 'Produces fine homogeneous powder or tissue homogenate',
      range: '80 – 130 mm bowl diameter',
      zeroError: 'Grind with circular wrist pressure — never pound like a hammer',
      material: 'Heavy vitrified porcelain (unglazed grinding surfaces)',
    },
    parts: [
      { part: 'Thick-walled mortar bowl with spout', role: 'Rough unglazed inner bottom grips crystals and plant tissue during shearing.' },
      { part: 'Club-shaped pestle', role: 'Rounded unglazed head crushes solids against the mortar wall with a rotary motion.' },
    ],
    handling: [
      'Break large lumps with firm downward pressure, then grind with a circular rotary motion of the pestle against the bottom and sides.',
      'When extracting food nutrients or leaf pigments in Biology, add a pinch of washed sharp sand and 5 cm³ of distilled water (or acetone) to shear cell walls effectively.',
      'Grind only one chemical at a time — never grind oxidising agents (like chlorates or nitrates) with combustible solids.',
    ],
    mistakes: [
      'Pounding the pestle vertically like a hammer, cracking the porcelain mortar in half and scattering sharp shards.',
    ],
    spotInLab: 'Heavy thick white porcelain bowl with a matching club-shaped porcelain grinder.',
  },

  // 38. Watch glass
  {
    id: 'watch-glass',
    number: 38,
    name: 'Watch glass',
    subtitle: 'Chemistry · Biology',
    subject: 'Chemistry',
    category: 'Glassware & Containers',
    file: '/apparatus/petri-slides.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Weighing small quantities of solid chemicals, air-drying crystals, slow evaporation of volatile drops, and covering a beaker to stop spattering.',
    description:
      'A circular, slightly concave piece of soda-lime or borosilicate glass originally shaped like a pocket-watch crystal.',
    specs: {
      resolution: 'Open concave inspection surface',
      range: '60 mm – 100 mm diameter',
      zeroError: 'Tare (zero) the balance after placing the dry watch glass on the pan',
      material: 'Fire-polished soda-lime or borosilicate glass',
    },
    parts: [
      { part: 'Shallow concave dish', role: 'Keeps powdered solids or liquid drops pooled in the centre during weighing or observation.' },
      { part: 'Ground smooth rim', role: 'Sits cleanly over the top of a beaker while leaving the beaker spout slightly vented for steam.' },
    ],
    handling: [
      'Place the clean dry watch glass on the electronic balance and press TARE (0.00 g) before adding your solid with a spatula.',
      'In Biology or Chemistry spot tests, place the clear watch glass over a sheet of black paper to see white precipitates clearly, or over white paper to see coloured changes.',
    ],
    mistakes: [
      'Heating a thin soda-lime watch glass directly in a roaring Bunsen flame (it will crack immediately).',
    ],
    spotInLab: 'Shallow curved circular glass disc with no vertical walls.',
  },

  // 39. Forceps
  {
    id: 'forceps',
    number: 39,
    name: 'Laboratory forceps (blunt & fine tweezers)',
    subtitle: 'Biology · Chemistry',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Peeling single-cell plant epidermis (onion/leaf), lifting abdominal body walls during dissection, handling sodium metal or filter paper discs, and picking up gram weights.',
    description:
      'Spring-tensioned stainless-steel pincers with serrated interior tips (blunt thumb forceps for tissue grip; fine watchmaker forceps for microscopy).',
    specs: {
      resolution: 'Fine tip width 0.5 – 2.0 mm',
      range: '115 – 150 mm length',
      zeroError: 'Grip tissue gently without crushing cellular structure',
      material: 'Non-magnetic surgical stainless steel',
    },
    parts: [
      { part: 'Serrated opposing tips', role: 'Hold slippery biological membranes or damp filter paper discs without slipping.' },
      { part: 'Ribbed thumb grip & spring heel', role: 'Provides tactile control over pinching force.' },
    ],
    handling: [
      'Use fine-pointed forceps to peel a transparent single-cell epidermal strip from the inner concave scale of an onion bulb.',
      'In Chemistry, always use dry forceps — never bare fingers — to handle reactive alkali metals (Na, K) or litmus paper strips.',
    ],
    mistakes: [
      'Pinching delicate plant or animal specimens so hard that the serrated teeth crush the tissue under the microscope.',
    ],
    spotInLab: 'Metal tweezers with ridged finger grips and textured inner tips.',
  },

  // 40. Stopwatch
  {
    id: 'stopwatch',
    number: 40,
    name: 'Stopwatch (digital / mechanical 0.01 s)',
    subtitle: 'Physics · Chemistry · Biology',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/physics/pendulum',
    primaryUses: 'Timing 20 oscillations of a simple pendulum, measuring reaction times in rates of reaction (disappearing cross), and timing bubble travel in a potometer.',
    description:
      'A quartz-crystal digital or crown-wound mechanical timer displaying elapsed minutes, seconds, and hundredths of a second (0.01 s).',
    specs: {
      resolution: '0.01 s (digital) or 0.1 s / 0.2 s (analogue)',
      range: '00:00.00 to 59:59.99',
      zeroError: 'Human reaction time ≈ ±0.15 s → time ≥ 20 oscillations to divide error by 20',
      material: 'ABS shock-resistant case + quartz oscillator',
    },
    parts: [
      { part: 'Start / Stop button (right)', role: 'Starts and stops cumulative timing with tactile click feedback.' },
      { part: 'Lap / Reset button (left)', role: 'Resets display to 00.00 s before the next trial.' },
    ],
    handling: [
      'Always reset the display to 00.00 s before starting a trial.',
      'In pendulum experiments, place a fiducial marker (plumb line or chalk mark) at the equilibrium centre of the swing, count "3, 2, 1, 0 (START)" as the bob passes the centre, and stop on count "20".',
      'Take at least two repeat timings (t₁ and t₂) that agree within 0.1–0.2 s and calculate the mean t̄.',
    ],
    mistakes: [
      'Starting the count at "1" when pressing Start instead of "0", resulting in only 19 oscillations instead of 20.',
      'Timing from the extreme end of the swing where the bob pauses momentarily, instead of the fast equilibrium centre.',
    ],
    spotInLab: 'Handheld digital timer on a neck lanyard with Start/Stop and Reset top buttons.',
  },

  // 41. Spring balance
  {
    id: 'spring-balance',
    number: 41,
    name: 'Spring balance (Newton force meter)',
    subtitle: 'Physics · Mechanics',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/vernier-caliper.svg',
    practiseTo: '/lab/physics/moments',
    primaryUses: 'Measuring weight (W = mg), frictional pull force, upthrust in Archimedes’ principle, and verifying Hooke’s law.',
    description:
      'A calibrated helical steel spring enclosed in a tubular metal or transparent acrylic housing with a pointer riding along dual Newton (N) and gram (g) scales.',
    specs: {
      resolution: '0.1 N (0–10 N meter) or 0.02 N (0–2.5 N meter)',
      range: '0 – 2.5 N, 0 – 10 N (1 kg), 0 – 25 N',
      zeroError: 'Hold in working orientation (vertical/horizontal) and slide zero nut',
      material: 'Tempered steel helical spring + anodised aluminium tube',
    },
    parts: [
      { part: 'Top suspension ring & zero-adjust nut', role: 'Shifts the scale sleeve slightly to zero the pointer before loading.' },
      { part: 'Calibrated helical spring & indicator tab', role: 'Extends linearly with applied load within its elastic limit (F = kx).' },
      { part: 'Lower load hook', role: 'Suspends the test mass or pulls a friction block along a horizontal plane.' },
    ],
    handling: [
      'Zero the spring balance in the exact orientation you will use it: vertically for weight/upthrust (so the hook’s own weight is zeroed), or horizontally on the bench for sliding friction.',
      'Read the pointer position at eye level only after any vertical bouncing has stopped.',
    ],
    mistakes: [
      'Zeroing the spring balance vertically and then using it horizontally to measure friction, introducing a systematic negative zero error.',
      'Overloading the spring beyond full scale and permanently stretching it past its elastic limit.',
    ],
    spotInLab: 'Cylindrical tube with a top ring, a bottom hook, and an internal spring moving a pointer along a Newton scale.',
  },

  // 42. Galvanometer
  {
    id: 'galvanometer',
    number: 42,
    name: 'Centre-zero galvanometer',
    subtitle: 'Physics · Electronics',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Detecting small bidirectional currents (µA) and locating the null balance point (I_G = 0) in a Wheatstone bridge, metre bridge, or potentiometer.',
    description:
      'A high-sensitivity moving-coil current detector with its zero mark at the centre of the scale (30–0–30 divisions) so the pointer can deflect left or right depending on current direction.',
    specs: {
      resolution: '≈ 10 – 20 µA per division',
      range: '30 – 0 – 30 divisions (bidirectional)',
      zeroError: 'Adjust front screw until pointer rests on central 0',
      material: 'Moving-coil suspension + protective shunt resistor',
    },
    parts: [
      { part: 'Centre-zero scale (30–0–30)', role: 'Shows both magnitude and direction of out-of-balance bridge current.' },
      { part: 'Jockey contact terminal', role: 'Connected to a knife-edge sliding jockey on a 100 cm potentiometer or metre-bridge wire.' },
    ],
    handling: [
      'Tap the jockey lightly onto the bridge wire — never scrape the jockey along the wire, which destroys its uniform cross-section.',
      'Touch the jockey near the two ends of the bridge wire first to verify that the galvanometer deflects in opposite directions (left at 0 cm, right at 100 cm).',
      'Use a protective series resistor during initial search, then bypass it for the final sharp null point.',
    ],
    mistakes: [
      'Dragging the metal jockey along the Constantan wire under pressure, scraping the wire thin.',
      'Passing a large current directly through an unshunted galvanometer and bending the pointer.',
    ],
    spotInLab: 'Desktop meter identical in shape to an ammeter, marked with a large "G" and a "0" in the middle of the scale.',
  },

  // 43. Resistance box
  {
    id: 'resistance-box',
    number: 43,
    name: 'Standard resistance box (plug / decade type)',
    subtitle: 'Physics · Electronics',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/rheostat.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Providing known standard resistances (1 Ω to 1,000 Ω) in metre-bridge, potentiometer, and Ohm’s law verification circuits.',
    description:
      'A wooden box housing precision non-inductively wound Manganin wire coils connected across gaps in a heavy brass top plate; removing a tapered brass plug inserts that coil’s resistance into the circuit.',
    specs: {
      resolution: '1 Ω (or 0.1 Ω) steps · ± 0.1% accuracy',
      range: '0 – 100 Ω or 0 – 1,000 Ω',
      zeroError: 'Twist every inserted brass plug firmly so contact resistance is 0 Ω',
      material: 'Mahogany case + heavy brass blocks + Manganin coils',
    },
    parts: [
      { part: 'Tapered brass plugs with ebonite handles', role: 'When pushed in with a slight twist, they short-circuit the gap (0 Ω); when pulled out, current flows through the coil underneath.' },
      { part: 'Infinity (∞) plug (if fitted)', role: 'Opens the circuit completely when removed.' },
    ],
    handling: [
      'Before taking any reading, press and twist every remaining brass plug slightly to ensure tight metal-to-metal contact.',
      'Total resistance in circuit equals the SUM of the numbers stamped beside the empty holes where plugs have been removed.',
      'Keep the tapered brass plugs clean and grease-free — never touch the brass taper with oily fingers.',
    ],
    mistakes: [
      'Adding up the plugs that are IN the box instead of the plugs that have been REMOVED.',
      'Leaving inserted plugs loose in their sockets, adding 1–2 Ω of stray contact resistance.',
    ],
    spotInLab: 'Polished wooden box with two rows of black-handled brass pegs stamped 1, 2, 2, 5, 10, 20, 50 Ω.',
  },

  // 44. Dissecting microscope
  {
    id: 'dissecting-microscope',
    number: 44,
    name: 'Dissecting microscope (stereo microscope)',
    subtitle: 'Biology · Zoology & Botany',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/compound-microscope.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Providing an upright, three-dimensional stereoscopic view of whole insects, flower parts, seeds, and small dissections at ×10–×40.',
    description:
      'A low-power binocular optical microscope that uses reflected incident light (as well as transmitted light) to produce an unreversed 3D image with a long working distance for forceps and scalpels.',
    specs: {
      resolution: '3D stereoscopic depth perception',
      range: '×10 to ×40 total magnification',
      zeroError: 'Adjust interpupillary distance & left dioptre ring for both eyes',
      material: 'Die-cast pillar stand + dual Greenough optical paths',
    },
    parts: [
      { part: 'Binocular eyepieces', role: 'Deliver slightly different viewing angles to left and right eyes for true 3D depth.' },
      { part: 'Reversible black/white stage plate', role: 'Provides high contrast behind pale or dark opaque specimens.' },
      { part: 'Long working distance (~80 mm)', role: 'Leaves ample room between objective and stage to manipulate dissecting needles.' },
    ],
    handling: [
      'Choose the white stage side for dark specimens (insects, seeds) or the black side for pale structures (floral ovules, fungi).',
      'Adjust the binocular tubes to match your eye spacing so the two circles merge into a single 3D field.',
    ],
    mistakes: [
      'Trying to view bacteria or individual onion cells at ×400 on a stereo dissecting microscope (use a compound microscope instead).',
    ],
    spotInLab: 'Dual-eyepiece microscope with a wide open gap above a flat circular black-and-white base plate.',
  },

  // 45. Prepared microscope slides
  {
    id: 'prepared-slides',
    number: 45,
    name: 'Prepared histological microscope slides',
    subtitle: 'Biology · Histology & Cytology',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/petri-slides.svg',
    practiseTo: '/lab/biology/digestion',
    primaryUses: 'Studying permanent stained transverse sections (T.S.) of dicot/monocot stems, roots, mammalian ileum villi, blood smears, and mitosis stages.',
    description:
      'Microtome-sliced biological tissue sections (4–10 µm thick) differentially stained (e.g., haematoxylin & eosin or safranin & fast green) and permanently sealed under a cover slip with Canada balsam.',
    specs: {
      resolution: '4 – 10 µm microtome section thickness',
      range: '75 × 25 × 1.0 mm standard optical glass',
      zeroError: 'Hold by edges only; verify label side faces upward on stage',
      material: 'Optical glass + differential histological stains + resin mount',
    },
    parts: [
      { part: 'Differential tissue stain', role: 'Colours nuclei, lignified xylem walls (red), and cellulose phloem (green/blue) distinctly.' },
      { part: 'Identification label', role: 'States specimen name, section plane (T.S. = transverse, L.S. = longitudinal), and stain.' },
    ],
    handling: [
      'Hold the slide by its outer glass edges only so fingerprints do not smudge the cover slip.',
      'Always examine the entire section at low power (×4) first to draw a low-power plan diagram of tissue zones (without individual cells), before switching to ×40 for high-power cell detail.',
    ],
    mistakes: [
      'Placing the slide upside down on the stage so the ×40 objective cannot focus through the thick 1 mm glass base.',
      'Drawing thousands of tiny cells in a WAEC low-power plan diagram instead of clean tissue distribution outlines.',
    ],
    spotInLab: 'Hinged wooden slotted box filled with numbered glass slides bearing pink/purple stained tissue dots.',
  },

  // 46. Specimen jar
  {
    id: 'specimen-jar',
    number: 46,
    name: 'Museum specimen preservation jar',
    subtitle: 'Biology · Taxonomy & Morphology',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/beaker.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Preserving and displaying whole zoological and botanical specimens (tapeworm, Tilapia, Agama lizard, fern sporophyte) for taxonomic identification and drawing.',
    description:
      'A clear glass cylindrical or rectangular museum jar filled with preservative fluid (70% ethanol or buffered formalin) with the specimen mounted on a glass backing plate.',
    specs: {
      resolution: 'Macroscopic external morphology & taxonomy',
      range: '250 cm³ to 2,000 cm³ sealed display jars',
      zeroError: 'Calculate drawing magnification M = length of drawing / length of specimen',
      material: 'Clear museum glass + ground lid + 70% ethanol preservative',
    },
    parts: [
      { part: 'Airtight ground-glass lid', role: 'Prevents evaporation of volatile ethanol/formalin preservative.' },
      { part: 'Glass mounting plate & silk tie', role: 'Holds soft specimens upright so dorsal and ventral diagnostic features are visible.' },
    ],
    handling: [
      'When drawing a preserved specimen in WAEC/NECO practical Biology, measure the actual specimen length in cm using a ruler, make a large clear unshaded line drawing (at least 8–10 cm long), and state the magnification (e.g. ×1.5 or ×2).',
      'If removing a specimen from preservative into a Petri dish, use forceps and wear gloves in a well-ventilated space.',
    ],
    mistakes: [
      'Omitting the title or magnification (×M) on biological specimen drawings (costs 2 marks automatically).',
      'Using crossed label guidelines or arrowheads on biological drawing labels.',
    ],
    spotInLab: 'Tall sealed glass jars on Biology shelves containing preserved fishes, worms, reptiles, and plant organs.',
  },

  // 47. Hand lens
  {
    id: 'hand-lens',
    number: 47,
    name: 'Folding hand lens (magnifying glass ×10)',
    subtitle: 'Biology · Geology',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/petri-slides.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Examining floral parts, insect mouthparts/venation, fern sori, soil particles, and internal organs during rat dissection.',
    description:
      'A biconvex optical glass lens (typically ×5 or ×10 magnification) mounted in a protective folding metal or plastic bezel frame.',
    specs: {
      resolution: '×5 (f ≈ 50 mm) or ×10 (f ≈ 25 mm) magnification',
      range: '20 – 50 mm lens diameter',
      zeroError: 'Hold lens close to your EYE and bring specimen up into focus',
      material: 'Ground biconvex crown glass + chrome folding case',
    },
    parts: [
      { part: 'Biconvex magnifying lens', role: 'Produces a virtual, upright, magnified image when the object is inside the focal length.' },
      { part: 'Swing-out protective casing', role: 'Serves as a handle in use and shields the lens from scratches in your pocket.' },
    ],
    handling: [
      'For a high-power ×10 loupe, hold the lens 2–3 cm from your eye and move the specimen (or bend down toward the dissecting tray) until the image snaps into sharp focus under good light.',
    ],
    mistakes: [
      'Holding a ×10 hand lens at arm’s length like a Sherlock Holmes prop, which produces an inverted blurry image.',
    ],
    spotInLab: 'Small circular folding pocket glass or black-rimmed magnifying lens on a handle.',
  },

  // 48. Laboratory thermometer
  {
    id: 'thermometer',
    number: 48,
    name: 'Laboratory thermometer (–10°C to 110°C)',
    subtitle: 'Physics · Chemistry · Biology',
    subject: 'Physics',
    category: 'Heating & Thermal',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Measuring temperature of liquids in calorimetry, heat of neutralisation, rates of reaction, enzyme baths, and boiling/melting point determinations.',
    description:
      'A sealed thick-walled glass capillary stem with a thin-walled sensing bulb filled with red-dyed alcohol or mercury, graduated every 1.0°C or 0.5°C.',
    specs: {
      resolution: '1.0°C (read to 0.5°C) or 0.5°C',
      range: '–10°C to 110°C (total or 76 mm immersion)',
      zeroError: 'Check ice point (0.0°C in melting ice) & keep bulb submerged while reading',
      material: 'Borosilicate capillary stem + red spirit / mercury bulb',
    },
    parts: [
      { part: 'Thin-walled sensing bulb', role: 'Conducts heat rapidly into the thermometric liquid; fragile and never used to stir.' },
      { part: 'Anti-roll triangular top cap & ring', role: 'Prevents rolling off the bench and allows suspension from a retort clamp by thread.' },
    ],
    handling: [
      'Suspend the thermometer vertically from a retort stand clamp so the bulb sits in the middle of the liquid without touching the hot bottom or walls of the beaker/calorimeter.',
      'Keep the bulb immersed in the liquid while reading the meniscus at eye level.',
    ],
    mistakes: [
      'Lifting the thermometer out of the hot water into the air to read it (evaporative cooling drops the reading immediately).',
      'Using a laboratory thermometer like a clinical thermometer (a lab thermometer has no constriction and drops as soon as removed).',
    ],
    spotInLab: '30 cm slender glass rod with a red or silver bulb at the bottom and a yellow/white degree scale.',
  },

  // 49. Laboratory balance
  {
    id: 'laboratory-balance',
    number: 49,
    name: 'Laboratory balance (electronic / triple-beam)',
    subtitle: 'Chemistry · Physics · Biology',
    subject: 'Chemistry',
    category: 'Measuring & Volumetric',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/physics/moments',
    primaryUses: 'Measuring the mass of solid reagents for standard solutions, weighing calorimeters, pendulum bobs, and transpiration potometer setups.',
    description:
      'A strain-gauge electronic top-pan balance (0.01 g resolution) or mechanical triple-beam sliding-poise balance (0.1 g resolution) with a stainless-steel weighing pan.',
    specs: {
      resolution: '0.01 g (electronic) · 0.1 g (triple-beam)',
      range: '0.00 – 500.00 g (or 610.0 g with attachment weights)',
      zeroError: 'Level spirit bubble & press TARE / ZERO with empty watch glass',
      material: 'Strain-gauge load cell + stainless pan + draft shield',
    },
    parts: [
      { part: 'Stainless-steel weighing pan', role: 'Receives the watch glass or weighing boat — never place raw chemicals directly on the metal pan.' },
      { part: 'TARE / ZERO button', role: 'Subtracts the mass of the empty container so the display reads net solute mass directly.' },
      { part: 'Spirit level bubble & levelling feet', role: 'Must be centred so gravity acts perpendicular to the load cell.' },
    ],
    handling: [
      'Check that the balance sits on a vibration-free bench away from ceiling-fan drafts.',
      'Place a clean watch glass or weighing boat on the pan, press TARE to read 0.00 g, and add solid gently with a spatula.',
      'Never weigh hot objects — convective air currents above a hot crucible make the reading artificially light and unstable.',
    ],
    mistakes: [
      'Pouring corrosive powders directly onto the bare metal pan without a watch glass or weighing boat.',
      'Weighing a hot crucible or calorimeter before it has cooled to room temperature.',
    ],
    spotInLab: 'Compact digital scale with a round silver pan and glowing LCD display (or 3-beam mechanical scale).',
  },

  // 50. Wash bottle
  {
    id: 'wash-bottle',
    number: 50,
    name: 'Distilled water squeeze wash bottle',
    subtitle: 'Chemistry · Biology',
    subject: 'Chemistry',
    category: 'Glassware & Containers',
    file: '/apparatus/conical-flask.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Washing splashes down the inner walls of a conical flask near the titration end-point, quantitative transfer into a volumetric flask, and rinsing electrodes/glassware.',
    description:
      'A flexible low-density polyethylene (LDPE) squeeze bottle fitted with an angled delivery tube and fine jet nozzle that directs a controlled stream of distilled/deionised water.',
    specs: {
      resolution: 'Fine directed rinse stream',
      range: '250 cm³ or 500 cm³ capacity',
      zeroError: 'Fill with DISTILLED water only — never tap water',
      material: 'Translucent LDPE bottle + polypropylene angled spout',
    },
    parts: [
      { part: 'Flexible LDPE squeeze body', role: 'Hand pressure forces distilled water up the internal dip tube.' },
      { part: 'Fine angled jet nozzle', role: 'Directs a thin rinse stream around the neck of a conical flask or burette tip.' },
    ],
    handling: [
      'Near the end-point of a titration, use the wash bottle to rinse any droplets of titrant clinging to the inside walls of the conical flask down into the bulk solution (adding distilled water does not change the moles of reactant in the flask).',
    ],
    mistakes: [
      'Filling a wash bottle with tap water instead of distilled water, introducing chloride, calcium, and carbonate ions into qualitative analysis tests.',
    ],
    spotInLab: 'Soft translucent white plastic bottle with a curved swan-neck spout sticking out of the cap.',
  },

  // 51. Safety goggles
  {
    id: 'safety-goggles',
    number: 51,
    name: 'Chemical splash safety goggles',
    subtitle: 'All laboratories · PPE',
    subject: 'Chemistry',
    category: 'Safety & PPE',
    file: '/apparatus/petri-slides.svg',
    practiseTo: '/lab/chemistry/titration/safety',
    primaryUses: 'Protecting the eyes from acid/alkali splashes, boiling liquid spatter, glass shards, and snapping tensioned wires.',
    description:
      'Indirect-vented polycarbonate wrap-around eye goggles with a soft PVC facial seal rated to EN 166 / ANSI Z87.1 for chemical splash and impact protection.',
    specs: {
      resolution: 'EN 166 3 (liquid splash) + B (medium impact)',
      range: 'Full periorbital wrap-around seal',
      zeroError: 'Wear continuously from entering the wet bench until washing up is finished',
      material: 'Anti-fog polycarbonate lens + indirect-vent PVC shroud',
    },
    parts: [
      { part: 'Impact-resistant polycarbonate lens', role: 'Stops flying glass fragments or snapping wire under tension.' },
      { part: 'Indirect hooded vents', role: 'Allow air circulation to prevent fogging while blocking straight-line liquid splashes.' },
    ],
    handling: [
      'Put safety goggles over your eyes (or over prescription spectacles) before pouring any reagent or lighting a burner.',
      'Keep goggles on while washing glassware at the sink — most chemical splashes happen during cleanup.',
    ],
    mistakes: [
      'Pushing safety goggles up onto your forehead while reading a burette or heating a test tube.',
    ],
    spotInLab: 'Clear wrap-around plastic goggles with covered side vents and an elastic head strap.',
  },

  // 52. Laboratory gloves & coat
  {
    id: 'lab-coat-gloves',
    number: 52,
    name: 'Laboratory coat & nitrile gloves',
    subtitle: 'Chemistry · Biology · PPE',
    subject: 'Biology',
    category: 'Safety & PPE',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/chemistry/titration/safety',
    primaryUses: 'Protecting skin and street clothing from corrosive reagents, biological stains, and preserved dissection specimens.',
    description:
      'A knee-length 100% cotton or flame-retardant polycotton buttoned lab coat paired with powder-free disposable nitrile examination gloves.',
    specs: {
      resolution: 'EN 374 chemical & microorganism barrier',
      range: 'Buttoned cuff-to-knee coverage',
      zeroError: 'Remove gloves before touching door handles, pens, or your face',
      material: 'Heavy-drill cotton twill + powder-free nitrile rubber',
    },
    parts: [
      { part: 'Snap-button cotton front & long sleeves', role: 'Absorbs spills before they reach skin and can be stripped off rapidly in an emergency.' },
      { part: 'Textured-fingertip nitrile gloves', role: 'Provide wet grip on glass test tubes while blocking acids, stains, and formalin.' },
    ],
    handling: [
      'Keep your lab coat buttoned up while working at the bench and roll long hair back.',
      'Peel disposable gloves off inside-out before leaving the laboratory and wash your hands with soap and water.',
    ],
    mistakes: [
      'Wearing loose open sleeves that catch on a tripod stand or sweep through a Bunsen burner flame.',
    ],
    spotInLab: 'White knee-length buttoned coat hanging by the lab entrance alongside boxes of blue/purple nitrile gloves.',
  },

  // 53. Fire extinguisher & first aid box
  {
    id: 'fire-safety-kit',
    number: 53,
    name: 'Fire extinguisher, fire blanket & first-aid box',
    subtitle: 'All laboratories · Emergency Safety',
    subject: 'Chemistry',
    category: 'Safety & PPE',
    file: '/apparatus/bunsen-burner.svg',
    practiseTo: '/lab/chemistry/titration/safety',
    primaryUses: 'Controlling small laboratory fires (solvent, electrical, or gas), smothering clothing fires, and treating minor cuts or thermal/chemical burns.',
    description:
      'A wall-mounted carbon dioxide (CO₂, black band) or ABC dry-powder (blue band) fire extinguisher, woven glass-fibre fire blanket, eye-wash station, and stocked first-aid kit.',
    specs: {
      resolution: 'PASS technique: Pull · Aim · Squeeze · Sweep',
      range: 'Class B (flammable liquids) & Electrical (CO₂)',
      zeroError: 'Locate nearest extinguisher, eye-wash, and main gas shut-off valve before starting',
      material: 'High-pressure steel cylinder + woven fibreglass blanket',
    },
    parts: [
      { part: 'CO₂ extinguisher (black label & insulated horn)', role: 'Extinguishes electrical and flammable-liquid fires without leaving residue; never hold the freezing horn bare-handed.' },
      { part: 'Sterile eye-wash bottle & burn dressings', role: 'Flushes chemical splashes from the eye for at least 15 minutes.' },
    ],
    handling: [
      'For a small contained fire in a beaker or evaporating dish, turn off the gas tap and smother it with a damp cloth, watch glass, or fire blanket.',
      'For chemical splashes to skin or eye, flood immediately with cool running water for 10–15 minutes before applying any dressing.',
    ],
    mistakes: [
      'Spraying a water extinguisher onto an electrical fire, burning oil, or reactive alkali metal (sodium/potassium) fire.',
    ],
    spotInLab: 'Red cylinder with a black horn and a green white-cross first-aid cabinet mounted near the laboratory exit door.',
  },

  // 54. Cover slips
  {
    id: 'cover-slips',
    number: 54,
    name: 'Cover slips (borosilicate No. 1 glass)',
    subtitle: 'Biology · Microscopy',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/petri-slides.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Flattening wet-mount biological specimens into a single optical plane and protecting the microscope objective lens from staining liquids.',
    description:
      'Ultra-thin (0.13–0.17 mm) optical borosilicate glass squares (22 × 22 mm) lowered at 45° over a drop of water or stain on a microscope slide.',
    specs: {
      resolution: 'No. 1 thickness (0.13 – 0.17 mm)',
      range: '18 × 18 mm or 22 × 22 mm square',
      zeroError: 'Lower at 45° with a mounted needle to exclude silver air bubbles',
      material: 'Optical borosilicate sheet glass',
    },
    parts: [
      { part: '0.15 mm optical glass square', role: 'Matched to the spherical aberration correction of ×40 objectives.' },
      { part: 'Capillary edge seal', role: 'Draws mounting fluid evenly across the specimen without trapping air.' },
    ],
    handling: [
      'Hold the cover slip by its edges between thumb and forefinger to avoid fingerprints.',
      'Rest one edge beside the drop of stain on the slide and support the opposite edge with a mounted needle at 45°.',
      'Lower the needle slowly so the liquid front pushes air out ahead of it.',
    ],
    mistakes: [
      'Dropping the cover slip flat from above, trapping dark-ringed air bubbles over the cells.',
      'Pressing the cover slip with a thumb instead of tapping gently with the back of a pencil.',
    ],
    spotInLab: 'Tiny square plastic box holding 100 paper-thin glass squares that bend slightly if pinched.',
  },

  // 55. Micropipette (P20 / P200 / P1000)
  {
    id: 'micropipette',
    number: 55,
    name: 'Micropipette (adjustable variable-volume)',
    subtitle: 'Biology · Molecular & Biochemistry',
    subject: 'Biology',
    category: 'Measuring & Volumetric',
    file: '/apparatus/volumetric-pipette.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Aspirating and dispensing microlitre (µL) volumes of enzymes, DNA templates, buffers, and reagents in PCR and biochemical assays.',
    description:
      'An air-displacement piston pipette with a digital micrometer volume counter, two-stop plunger button (first stop for aspiration, second stop for blow-out), and disposable tip ejector.',
    specs: {
      resolution: '0.1 µL (P20) · 1 µL (P200 / P1000)',
      range: 'P20 (2–20 µL) · P200 (20–200 µL) · P1000 (100–1000 µL)',
      zeroError: 'Never dial outside the rated µL window; press to first stop before immersing',
      material: 'PVDF ergonomic handle + stainless piston + polypropylene shaft',
    },
    parts: [
      { part: 'Two-stop plunger button', role: 'First stop calibrates exact aspiration volume; second stop blows out residual film.' },
      { part: 'Volume adjustment thumbwheel & counter', role: 'Sets the exact microlitre volume within the pipette range.' },
      { part: 'Tip ejector collar', role: 'Discards contaminated polypropylene tips hands-free into a sharps/biohazard bin.' },
    ],
    handling: [
      'Press a sterile disposable tip firmly onto the shaft cone.',
      'Depress the plunger to the FIRST stop before dipping the tip 2–3 mm below the liquid surface.',
      'Release the plunger slowly and smoothly to aspirate without drawing air bubbles into the barrel.',
      'To dispense, touch the tip against the inner wall of the receiving microtube, press to the first stop, pause, then press to the SECOND stop (blow-out).',
    ],
    mistakes: [
      'Pressing to the second stop before aspirating, which draws 15–25% excess liquid.',
      'Laying a filled micropipette flat on the bench, letting liquid run back into the piston shaft.',
    ],
    spotInLab: 'Contoured handheld dispenser with a 3-digit thumbwheel window and a side ejector lever.',
  },

  // 56. Pipette tips
  {
    id: 'pipette-tips',
    number: 56,
    name: 'Pipette tips (sterile racked polypropylene)',
    subtitle: 'Biology · Molecular & Biochemistry',
    subject: 'Biology',
    category: 'Measuring & Volumetric',
    file: '/apparatus/volumetric-pipette.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Forming a disposable, cross-contamination-free liquid chamber on the end of a micropipette.',
    description:
      'Colour-coded virgin polypropylene disposable cones housed in 96-well autoclavable flip-top racks (clear 10/20 µL, yellow 200 µL, blue 1000 µL), optionally fitted with aerosol barrier filters.',
    specs: {
      resolution: 'Graduated reference rings at 10, 50, 100, 200, 1000 µL',
      range: '0.5 – 10 µL (clear) · 20 – 200 µL (yellow) · 100 – 1000 µL (blue)',
      zeroError: 'Change to a fresh tip between every reagent to prevent cross-contamination',
      material: 'Hydrophobic medical-grade virgin polypropylene',
    },
    parts: [
      { part: 'Tapered sealing collar', role: 'Forms an airtight seal onto the micropipette nose cone.' },
      { part: 'Aerosol barrier filter (filter tips)', role: 'Blocks PCR amplicon aerosols from entering the pipette shaft.' },
    ],
    handling: [
      'Open the tip rack lid only at the moment of pickup and close it immediately to maintain sterility.',
      'Press the micropipette vertically into the tip with a gentle quarter-turn — never hammer the shaft.',
    ],
    mistakes: [
      'Reusing the same pipette tip across different enzyme or substrate tubes, ruining the control blank.',
    ],
    spotInLab: 'Hinged plastic 96-hole box filled with neat rows of yellow or blue conical plastic tips.',
  },

  // 57. Serological pipette
  {
    id: 'serological-pipette',
    number: 57,
    name: 'Serological pipette (graduated blow-out)',
    subtitle: 'Biology · Cell Culture & Microbiology',
    subject: 'Biology',
    category: 'Measuring & Volumetric',
    file: '/apparatus/volumetric-pipette.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Transferring 1 cm³ to 25 cm³ of culture broth, saline, buffers, and cell suspensions using a pipette controller.',
    description:
      'A straight, uniform-bore sterile polystyrene or glass tube graduated right down to the jet tip (blow-out calibration) with a cotton plug filter at the top neck.',
    specs: {
      resolution: '0.1 cm³ (on 5 cm³ & 10 cm³ pipettes)',
      range: '1 cm³, 2 cm³, 5 cm³, 10 cm³, 25 cm³',
      zeroError: 'Check double ring at top — last drop must be blown out',
      material: 'Optical polystyrene or borosilicate glass + cotton aerosol plug',
    },
    parts: [
      { part: 'Cotton aerosol plug neck', role: 'Prevents liquid from being over-drawn into the rubber bulb or motorized pipette aid.' },
      { part: 'Dual bidirectional graduations', role: 'Reads both volume aspirated and volume dispensed.' },
    ],
    handling: [
      'Insert the cotton-plugged end into a pipette filler bulb or motorized controller.',
      'Aspirate above the desired graduation, adjust the meniscus at eye level, and dispense cleanly.',
    ],
    mistakes: [
      'Mouth-pipetting biological cultures or chemical reagents instead of using a mechanical pipette filler.',
    ],
    spotInLab: 'Long straight plastic or glass tube with colour-coded neck bands and a white cotton plug inside the top.',
  },

  // 58. Centrifuge
  {
    id: 'centrifuge',
    number: 58,
    name: 'Laboratory benchtop centrifuge',
    subtitle: 'Biology · Chemistry · Separation',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Separating cells, organelles, precipitates, and blood plasma/serum into pellet and supernatant fractions by high-speed centrifugal force (RCF).',
    description:
      'An enclosed motor-driven fixed-angle or swing-bucket rotor spinning balanced tubes at 1,000–14,000 rpm inside an interlocked safety bowl.',
    specs: {
      resolution: '100 rpm / 10 × g steps',
      range: '500 – 14,000 rpm (up to 16,000 × g)',
      zeroError: 'Always balance opposite rotor slots with equal mass tubes (±0.01 g)',
      material: 'Anodized aluminium rotor + interlocking steel safety chamber',
    },
    parts: [
      { part: 'Fixed-angle or swing-bucket rotor', role: 'Holds numbered tube positions symmetrically around the drive spindle.' },
      { part: 'Electromagnetic lid interlock', role: 'Prevents the lid from opening until the rotor has come to a complete standstill.' },
    ],
    handling: [
      'Always place tubes of equal mass (using a water balance tube if necessary) directly opposite each other (180°) in the rotor.',
      'Close the safety lid until the latch clicks, set speed (rpm or ×g) and time, and stay beside the unit until it reaches full speed smoothly.',
    ],
    mistakes: [
      'Running an unbalanced single tube, causing violent vibration and rotor shaft damage.',
      'Balancing tubes by eye (volume) when the liquids have different densities.',
    ],
    spotInLab: 'Domed benchtop machine with a latched circular lid and an angled numbered metal rotor inside.',
  },

  // 59. Microcentrifuge tubes (Eppendorf tubes)
  {
    id: 'microcentrifuge-tubes',
    number: 59,
    name: 'Microcentrifuge tubes (1.5 mL Eppendorf tubes)',
    subtitle: 'Biology · Molecular Biology',
    subject: 'Biology',
    category: 'Glassware & Containers',
    file: '/apparatus/test-tube-rack.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Holding small-volume (50 µL – 1.5 mL) enzyme digests, DNA extractions, and pelleted cells during high-speed microcentrifugation.',
    description:
      'Conical-bottomed virgin polypropylene microtubes with an attached snap-seal hinge cap, frosted writing panel, and moulded volume markings at 0.1, 0.5, 1.0, and 1.5 mL.',
    specs: {
      resolution: 'Moulded graduations at 0.1, 0.5, 1.0, 1.5 mL',
      range: '0.5 mL, 1.5 mL, or 2.0 mL capacity',
      zeroError: 'Orient all hinge tabs outward in the rotor so pellets form on the same wall',
      material: 'Autoclavable high-clarity polypropylene (rated to 20,000 × g)',
    },
    parts: [
      { part: 'Attached snap-lock hinge cap', role: 'Seals tightly against aerosol leakage during vortexing and centrifugation.' },
      { part: 'Conical pellet tip', role: 'Concentrates tiny cell or DNA precipitates into a visible pinpoint pellet.' },
    ],
    handling: [
      'Label both the frosted side panel and the flat cap top with permanent alcohol-resistant marker.',
      'Point the hinge tabs outward when loading the rotor so you always know the pellet lies directly under the hinge side.',
    ],
    mistakes: [
      'Leaving the snap cap partially unclicked, causing the cap to shear off inside the spinning rotor.',
    ],
    spotInLab: 'Thumb-sized translucent plastic conical tube with a flip-top attached lid.',
  },

  // 60. Incubator
  {
    id: 'incubator',
    number: 60,
    name: 'Microbiological laboratory incubator',
    subtitle: 'Biology · Microbiology & Enzyme Kinetics',
    subject: 'Biology',
    category: 'Heating & Thermal',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Maintaining agar Petri dishes, bacterial cultures, and enzymatic reactions at a constant physiological temperature (typically 37.0°C or 25.0°C).',
    description:
      'A double-walled, thermally insulated chamber with a PID microprocessor thermostat, inner glass viewing door, and perforated stainless-steel shelves.',
    specs: {
      resolution: '0.1°C digital PID temperature stability',
      range: 'Ambient + 5°C to 70.0°C (standard 37.0°C for mammalian flora)',
      zeroError: 'Verify shelf temperature against an independent calibrated thermometer',
      material: '304 stainless-steel inner chamber + tempered inner glass door',
    },
    parts: [
      { part: 'PID digital temperature controller', role: 'Holds chamber temperature within ±0.2°C of the setpoint.' },
      { part: 'Inner glass observation door', role: 'Lets you inspect cultures without dumping warm chamber air.' },
    ],
    handling: [
      'Invert inoculated agar Petri dishes (agar side UP) before placing them on the incubator shelf so condensation droplets do not fall onto colonies.',
      'Tape dishes shut with two short breathable strips along opposite edges — never seal completely airtight unless culturing anaerobes.',
    ],
    mistakes: [
      'Incubating school microbial plates at 37°C when culturing unknown environmental swabs (use 25°C to avoid selecting human pathogens).',
      'Placing agar plates right-side up so lid condensation floods and smears the bacterial streaks.',
    ],
    spotInLab: 'Insulated cabinet with an outer metal door, an inner glass door, and a glowing red 37.0°C readout.',
  },

  // 61. Autoclave
  {
    id: 'autoclave',
    number: 61,
    name: 'Autoclave (steam pressure sterilizer)',
    subtitle: 'Biology · Sterilization & Microbiology',
    subject: 'Biology',
    category: 'Heating & Thermal',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Sterilizing nutrient agar media, glassware, pipette tips, and biohazardous waste using saturated steam under pressure (121°C at 103 kPa / 15 psi for 15–20 min).',
    description:
      'A heavy-walled pressure vessel that purges air and fills with pressurized saturated steam to kill vegetative bacteria, viruses, fungi, and heat-resistant endospores.',
    specs: {
      resolution: '1°C / 1 kPa pressure gauge',
      range: '121°C at 15 psi (103 kPa) for 15–20 min · up to 134°C',
      zeroError: 'Check autoclave indicator tape turns diagonal black stripes after cycle',
      material: 'Heavy-gauge 316L stainless-steel pressure vessel + safety relief valve',
    },
    parts: [
      { part: 'Radial locking lid & pressure gauge', role: 'Seals the vessel and indicates internal steam pressure in psi / kPa.' },
      { part: 'Air-purge & safety relief valves', role: 'Evacuates trapped air pockets so pure saturated steam reaches every surface.' },
    ],
    handling: [
      'Loosen screw caps on media bottles by half a turn before autoclaving so expanding steam does not shatter the glass.',
      'Apply a strip of beige autoclave indicator tape; verify that dark diagonal bars appear after the 121°C cycle.',
      'Wait until the pressure gauge returns to 0 psi and liquid cools below 80°C before opening the chamber.',
    ],
    mistakes: [
      'Autoclaving tightly sealed screw-cap bottles, causing explosive glass failure.',
      'Venting pressure too rapidly on liquid media, causing superheated agar to boil over violently.',
    ],
    spotInLab: 'Heavy stainless-steel cylindrical pressure chamber with radial locking wheel and pressure dial.',
  },

  // 62. Biosafety cabinet
  {
    id: 'biosafety-cabinet',
    number: 62,
    name: 'Biosafety cabinet (Class II laminar flow hood)',
    subtitle: 'Biology · Sterile Technique & PPE',
    subject: 'Biology',
    category: 'Safety & PPE',
    file: '/apparatus/retort-stand.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Providing a HEPA-filtered sterile laminar air curtain that protects both the biological culture from contamination and the operator from infectious aerosols.',
    description:
      'An enclosed stainless-steel workstation using a front intake air grille, vertical HEPA-filtered laminar downflow, and HEPA exhaust filtration with a toughened sliding glass sash.',
    specs: {
      resolution: '99.99% HEPA filtration at 0.3 µm particles',
      range: '0.45 m/s inflow velocity · 20 cm working sash height',
      zeroError: 'Run blower 10 min before work; never block front intake grille with notebooks',
      material: '304 stainless-steel work deck + H14 HEPA filters + UV germicidal lamp',
    },
    parts: [
      { part: 'Front air-barrier intake grille', role: 'Draws room air downward so aerosols inside the hood cannot escape toward the user.' },
      { part: 'Supply & exhaust H14 HEPA filters', role: 'Bathe the work surface in sterile particle-free air and scrub exhaust air.' },
    ],
    handling: [
      'Turn off the UV germicidal lamp, switch on the blower fan + white light for 10 minutes, and wipe the deck with 70% ethanol.',
      'Work at least 10 cm behind the front intake grille with slow, deliberate arm movements.',
    ],
    mistakes: [
      'Lighting a high-flame Bunsen burner inside a HEPA laminar flow cabinet (turbulence disrupts the sterile curtain and heat damages the HEPA filter).',
      'Leaving the UV sterilizing lamp switched on while hands or eyes are near the sash.',
    ],
    spotInLab: 'Wide hooded stainless workbench with a sliding glass front sash and perforated front air grille.',
  },

  // 63. Inoculating loop
  {
    id: 'inoculating-loop',
    number: 63,
    name: 'Inoculating loop (nichrome / platinum wire loop)',
    subtitle: 'Biology · Aseptic Microbiology',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Aseptically transferring and quadrant-streaking a calibrated film of bacterial broth onto nutrient agar Petri dishes for single-colony isolation.',
    description:
      'A fine nichrome or platinum-iridium wire twisted into a closed 2–3 mm terminal loop and mounted in an insulated aluminium handle.',
    specs: {
      resolution: 'Calibrated 1 µL or 10 µL liquid film loop',
      range: '2 mm – 4 mm loop diameter',
      zeroError: 'Flame to glowing red-hot and cool on sterile agar edge before touching cells',
      material: '80/20 Nichrome resistance wire + anodized insulated chuck handle',
    },
    parts: [
      { part: 'Closed 3 mm nichrome wire loop', role: 'Holds a thin meniscus film of bacterial suspension by surface tension.' },
      { part: 'Insulated collet handle', role: 'Stays cool in the fingers while the wire tip is flamed red-hot.' },
    ],
    handling: [
      'Hold the wire steeply in the blue roaring cone of a Bunsen flame until the entire wire glows bright red-orange.',
      'Let the loop cool in air for 10 seconds (or touch a blank edge of the agar) before picking up bacteria.',
      'Glide the loop gently flat across the agar in a zig-zag quadrant streak without gouging the gel, then re-flame before putting it down.',
    ],
    mistakes: [
      'Dipping a red-hot loop directly into the bacterial culture, sizzling and killing the cells while spattering aerosols.',
      'Digging the tip perpendicular into the soft agar surface and tearing it.',
    ],
    spotInLab: 'Slender metal rod handle ending in a thin wire with a tiny 3 mm circle at the very tip.',
  },

  // 64. Hemocytometer
  {
    id: 'hemocytometer',
    number: 64,
    name: 'Hemocytometer (Neubauer cell counting chamber)',
    subtitle: 'Biology · Microscopy & Cell Biology',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/petri-slides.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Counting the concentration of blood cells, yeast cells, or microalgae per cm³ (cells/mL) under a compound microscope.',
    description:
      'A thick optical-glass slide laser-etched with two perpendicular 3 × 3 mm Neubauer grid networks and paired with a precision ground coverslip resting on 0.100 mm support pillars.',
    specs: {
      resolution: '1 large corner square = 0.1 mm³ = 10⁻⁴ mL',
      range: '9 large squares (1 × 1 mm) subdivided into 400 small squares',
      zeroError: 'Count cells touching top & left border lines; exclude bottom & right borders',
      material: 'Heavy optical crown glass + laser-etched rhodium grid',
    },
    parts: [
      { part: 'Laser-etched Neubauer 3×3 mm grid', role: 'Defines an exact 0.100 mm depth × 1.0 mm² area (= 10⁻⁴ mL) per corner square.' },
      { part: 'V-shaped capillary loading notch', role: 'Draws 10 µL of cell suspension smoothly under the coverslip by capillary action.' },
    ],
    handling: [
      'Seat the thick ground hemocytometer coverslip onto the moistened support rails until Newton rings appear.',
      'Touch a micropipette tip to the V-groove to fill the chamber in one smooth capillary wave without overflowing into the moat.',
      'Count cells in the 4 large corner squares using the North/West inclusion rule, take the mean, and multiply by 10⁴ × dilution factor = cells/mL.',
    ],
    mistakes: [
      'Using an ordinary thin microscope cover slip instead of the thick precision-flat hemocytometer cover glass.',
      'Counting cells on all four boundary lines of a square, inflating the cell density.',
    ],
    spotInLab: 'Extra-thick glass slide with H-shaped moats and a mirror-like silver square in the centre.',
  },

  // 65. Cell strainer
  {
    id: 'cell-strainer',
    number: 65,
    name: 'Cell strainer (nylon mesh 40 / 70 / 100 µm)',
    subtitle: 'Biology · Tissue Dissociation',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/petri-slides.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Filtering macerated plant or animal tissue homogenates to obtain a uniform single-cell suspension free of fibrous clumps.',
    description:
      'A sterile polypropylene basket frame moulded with a precision woven nylon monofilament mesh (40 µm blue, 70 µm white, or 100 µm yellow) designed to seat inside a 50 mL conical centrifuge tube.',
    specs: {
      resolution: '40 µm, 70 µm, or 100 µm uniform pore mesh',
      range: 'Fits standard 50 mL conical centrifuge tubes',
      zeroError: 'Pre-wet nylon mesh with buffer before pouring cell suspension',
      material: 'Medical polypropylene ring + woven nylon monofilament mesh',
    },
    parts: [
      { part: 'Monofilament nylon micropore mesh', role: 'Retains tissue debris and cell aggregates larger than the rated micron pore size.' },
      { part: 'Extended thumb-grip tab & venting lip', role: 'Allows aseptic handling with forceps and prevents air-locking during filtration.' },
    ],
    handling: [
      'Seat the strainer basket into the mouth of a labelled 50 mL tube by holding only the extended rim tab.',
      'Pipette the digested tissue suspension gently through the pre-wetted mesh and rinse with cold buffer.',
    ],
    mistakes: [
      'Forcing solid tissue chunks through the mesh with a metal spatula, tearing the calibrated nylon pores.',
    ],
    spotInLab: 'Small colour-coded plastic cup with a fine translucent nylon gauze bottom and a flat thumb tab.',
  },

  // 66. Scalpel
  {
    id: 'scalpel',
    number: 66,
    name: 'Surgical scalpel (No. 3 / No. 4 handle & blade)',
    subtitle: 'Biology · Dissection & Sectioning',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Making clean anatomical skin incisions during vertebrate dissection and cutting thin transverse/longitudinal stem sections for microscopy.',
    description:
      'A ribbed stainless-steel surgical handle (No. 3 or No. 4) with a bayonet slot that locks replaceable sterile carbon-steel blades (No. 10 curved belly or No. 11 pointed tip).',
    specs: {
      resolution: 'Razor-honed surgical cutting edge',
      range: 'No. 3 handle (blades 10–15) · No. 4 handle (blades 20–24)',
      zeroError: 'Always fit or remove blades using artery forceps — never bare fingers',
      material: 'Surgical stainless-steel handle + high-carbon steel blade',
    },
    parts: [
      { part: 'Bayonet mounting tang', role: 'Locks the slotted scalpel blade onto the front nose of the handle.' },
      { part: 'Curved belly cutting edge', role: 'Slices skin and fascia cleanly with controlled draw strokes rather than stabbing.' },
    ],
    handling: [
      'Hold the scalpel like a violin bow or pen and slice away from your non-dominant hand while holding tissue with forceps.',
      'When cutting thin plant stem sections, keep both the stem and blade wet with water and draw the blade toward you in one smooth sweep.',
    ],
    mistakes: [
      'Pulling a dull scalpel blade off the handle with bare fingers instead of forceps.',
      'Sawing deeply into a dissection specimen before lifting the body wall with forceps, puncturing the underlying viscera.',
    ],
    spotInLab: 'Flat corrugated stainless handle with a removable razor-sharp curved steel blade at the front.',
  },

  // 67. Dissecting scissors
  {
    id: 'dissecting-scissors',
    number: 67,
    name: 'Dissecting scissors (fine blunt/sharp surgical)',
    subtitle: 'Biology · Dissection',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Extending ventral midline incisions through the body wall and rib cage during rat, frog, or fish dissection without puncturing underlying organs.',
    description:
      'Stainless-steel surgical scissors featuring one blunt probe-tipped lower blade (inserted beneath the body wall) and one sharp upper cutting blade.',
    specs: {
      resolution: 'Fine 115 mm or 140 mm straight/iris blades',
      range: 'Blunt-sharp or fine sharp-sharp point configurations',
      zeroError: 'Always insert the BLUNT blade underneath the abdominal wall, pointing slightly upward',
      material: 'Martensitic surgical stainless steel',
    },
    parts: [
      { part: 'Blunt lower probe blade', role: 'Slides safely under the lifted abdominal muscle wall without piercing the intestine.' },
      { part: 'Pivot screw & finger rings', role: 'Provide smooth shearing leverage through cartilage and muscle.' },
    ],
    handling: [
      'Lift the skin or abdominal wall upward with toothed forceps, snip a small entry hole, and slide the blunt lower blade inside.',
      'Keep the lower blade angled upward against the inner body wall while cutting along the linea alba.',
    ],
    mistakes: [
      'Pointing the scissor tips downward into the abdominal cavity and perforating the stomach or caecum.',
    ],
    spotInLab: 'Bright stainless-steel surgical scissors in a canvas roll kit, often with one rounded tip and one pointed tip.',
  },

  // 68. Glass slides staining rack
  {
    id: 'staining-rack',
    number: 68,
    name: 'Glass slides staining rack & Coplin jar',
    subtitle: 'Biology · Histology & Gram Staining',
    subject: 'Biology',
    category: 'Microscopy & Specimen',
    file: '/apparatus/petri-slides.svg',
    practiseTo: '/lab/biology/dissection',
    primaryUses: 'Supporting microscope slides horizontally over a sink tray during Gram staining, methylene blue, iodine, or eosin differential staining.',
    description:
      'A pair of parallel corrosion-resistant stainless-steel or glass rods bridged across a staining sink (or a grooved vertical glass Coplin staining jar) that holds 5–20 microscope slides level.',
    specs: {
      resolution: 'Level horizontal bridge (50 mm rail spacing)',
      range: 'Holds 5 – 20 standard 75 × 25 mm slides',
      zeroError: 'Level the parallel rods so stain pools evenly over the smear without running off',
      material: '316 stainless-steel parallel bridge + grooved soda-lime Coplin jar',
    },
    parts: [
      { part: 'Parallel bridge rails', role: 'Support standard 75 mm slides level above the drain tray during timed flooding.' },
      { part: 'Grooved Coplin immersion slots', role: 'Hold slides vertically apart when immersing in alcohol dehydrating baths.' },
    ],
    handling: [
      'Lay heat-fixed slides flat across the two parallel rails with the specimen smear facing UP.',
      'Flood the smear with stain for the exact timed interval, then tilt the slide with forceps and rinse gently with a wash bottle directed above the smear.',
    ],
    mistakes: [
      'Squirt-blasting the water jet directly onto the delicate cell smear, washing the cells off the glass.',
    ],
    spotInLab: 'Two parallel metal rods bridged over an enamel tray (or a ribbed glass jar with internal vertical slots).',
  },

  // 69. PCR thermocycler
  {
    id: 'pcr-thermocycler',
    number: 69,
    name: 'PCR thermocycler (thermal cycler)',
    subtitle: 'Biology · Genetics & Molecular Biology',
    subject: 'Biology',
    category: 'Heating & Thermal',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Amplifying specific DNA sequences millions-fold via Polymerase Chain Reaction (Denaturation 95°C → Annealing 55°C → Extension 72°C).',
    description:
      'A Peltier-driven 96-well aluminium block with a heated compression lid (105°C) that cycles PCR reaction tubes rapidly and accurately through programmed temperature stages.',
    specs: {
      resolution: '0.1°C block uniformity · 3–5°C/s ramp rate',
      range: '4.0°C – 99.9°C across 25–40 programmed cycles',
      zeroError: 'Enable 105°C heated lid so reaction droplets do not condense in the tube cap',
      material: 'Silver/aluminium Peltier 96-well block + heated compression lid',
    },
    parts: [
      { part: '96-well Peltier thermal block', role: 'Heats and cools thin-walled 0.2 mL PCR tubes rapidly between 95°C, 55°C, and 72°C.' },
      { part: 'Heated compression lid (105°C)', role: 'Prevents water evaporation and condensation at the top of the reaction tube.' },
    ],
    handling: [
      'Assemble master mix (DNA template, primers, dNTPs, Taq polymerase, Mg²⁺ buffer) on ice in thin-walled 0.2 mL PCR tubes.',
      'Tap tubes or spin briefly so all liquid sits at the bottom cone, seat firmly into the block, and close the heated lid.',
    ],
    mistakes: [
      'Using thick-walled standard 1.5 mL tubes instead of thin-walled 0.2 mL PCR tubes, preventing the core liquid from reaching 95°C.',
    ],
    spotInLab: 'Compact digital benchtop unit with a flip-down heated lid covering a 96-hole metal block.',
  },

  // 70. Force sensor
  {
    id: 'force-sensor',
    number: 70,
    name: 'Digital force sensor (strain-gauge load cell)',
    subtitle: 'Physics · Mechanics & Dynamics',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/vernier-caliper.svg',
    practiseTo: '/lab/physics/moments',
    primaryUses: 'Measuring dynamic tension, compression, impulse (∫F dt), Newton’s third-law collision pairs, and simple harmonic restoring forces.',
    description:
      'A Wheatstone-bridge strain-gauge load cell fitted with a reversible hook/bumper attachment that samples pull and push forces up to 1000 Hz.',
    specs: {
      resolution: '0.01 N (on ±10 N scale) · 0.05 N (on ±50 N scale)',
      range: '±10 N or ±50 N switchable dual range',
      zeroError: 'Press ZERO / TARE with the sensor already clamped in its working orientation',
      material: 'Machined aluminium flexure beam + 4-arm strain gauge bridge',
    },
    parts: [
      { part: 'Threaded hook & rubber bumper stud', role: 'Transfers axial tension (pull) or compression (push) directly to the flexure beam.' },
      { part: 'Hardware Tare / Zero button', role: 'Nulls out the weight of the hook attachment at the exact angle of use.' },
    ],
    handling: [
      'Orient the force sensor at the exact angle it will be used during the experiment before pressing the Zero button.',
      'Apply forces strictly along the axis of the hook shaft — side loads introduce cosine error and can bend the flexure.',
    ],
    mistakes: [
      'Zeroing the sensor horizontally on the bench and then hanging it vertically (the weight of the metal hook shifts the baseline).',
    ],
    spotInLab: 'Rectangular sensor pod with a rod clamp hole and a metal hook protruding from one end.',
  },

  // 71. Motion sensor
  {
    id: 'motion-sensor',
    number: 71,
    name: 'Ultrasonic motion sensor (rangefinder)',
    subtitle: 'Physics · Kinematics & SHM',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/dial-gauge.svg',
    practiseTo: '/lab/physics/pendulum',
    primaryUses: 'Plotting real-time displacement x(t), velocity v(t), and acceleration a(t) graphs of dynamics carts, falling objects, and oscillating masses.',
    description:
      'A time-of-flight ultrasonic transducer emitting 49 kHz acoustic pulses from a gold foil diaphragm and timing the echo return to compute distance x = ½ v_sound · Δt.',
    specs: {
      resolution: '1 mm position resolution at 20–50 Hz sampling',
      range: '0.15 m – 6.0 m (15 cm minimum dead zone)',
      zeroError: 'Keep target at least 15 cm away from the gold transducer grille',
      material: 'Piezoelectric/electrostatic gold transducer + pivoting beam housing',
    },
    parts: [
      { part: 'Gold electrostatic transducer disc', role: 'Emits ultrasonic clicks and detects the reflected echo from the nearest object.' },
      { part: 'Narrow / wide beam selector switch', role: 'Narrow beam rejects stray reflections from dynamics track side rails.' },
    ],
    handling: [
      'Clip the motion sensor at the end of the dynamics track and angle the transducer face slightly upward so it sees the cart rather than the track bed.',
      'Keep the cart at least 15 cm away from the sensor face to stay outside the ultrasonic ringing dead zone.',
    ],
    mistakes: [
      'Letting the cart come closer than 15 cm to the transducer, causing spurious distance spikes.',
      'Leaving arms, cables, or retort stands inside the 15° ultrasonic cone.',
    ],
    spotInLab: 'Pivoting plastic module with a round gold mesh speaker circle that makes a rapid ticking sound when active.',
  },

  // 72. Photogate timer
  {
    id: 'photogate-timer',
    number: 72,
    name: 'Infrared photogate timer',
    subtitle: 'Physics · Mechanics & Pendulum Timing',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/dial-gauge.svg',
    practiseTo: '/lab/physics/pendulum',
    primaryUses: 'Measuring instantaneous velocity of a picket-fence flag, free-fall acceleration g, and reaction-time-free pendulum periods to 0.1 ms.',
    description:
      'A U-shaped horseshoe fork housing an infrared LED transmitter on one arm and a fast phototransistor receiver on the opposite arm that triggers whenever an opaque flag interrupts the beam.',
    specs: {
      resolution: '0.0001 s (0.1 ms) crystal-controlled gate timing',
      range: 'Gate mode (flag duration Δt) · Pulse mode · Pendulum mode',
      zeroError: 'Measure flag width d with Vernier calipers so v = d / Δt is accurate',
      material: 'Moulded polycarbonate U-fork + 880 nm IR emitter/detector pair',
    },
    parts: [
      { part: 'Infrared emitter & detector arms', role: 'Creates an invisible optical beam across the 75 mm U-gap.' },
      { part: 'Status LED indicator', role: 'Lights red the instant the infrared beam is blocked by the bob or card flag.' },
    ],
    handling: [
      'Position the U-gate so the pendulum bob or cart interruptor flag passes cleanly through the centre perpendicular to the IR beam.',
      'Measure the exact width d of the interruptor card with Vernier calipers to calculate instantaneous speed v = d / Δt.',
    ],
    mistakes: [
      'Letting the interruptor flag pass diagonally through the beam or swing into the plastic fork arms.',
    ],
    spotInLab: 'Black U-shaped horseshoe sensor clamped to a stand with a tiny red LED on top.',
  },

  // 73. Pendulum apparatus
  {
    id: 'pendulum-apparatus',
    number: 73,
    name: 'Simple pendulum apparatus (bob, split cork & stand)',
    subtitle: 'Physics · Oscillations & Determination of g',
    subject: 'Physics',
    category: 'Support & Handling',
    file: '/apparatus/retort-stand.svg',
    practiseTo: '/lab/physics/pendulum',
    primaryUses: 'Investigating simple harmonic motion T = 2π√(L/g) and determining the local acceleration due to gravity g from the slope of T² vs L.',
    description:
      'A heavy brass or steel spherical bob suspended by a light inextensible cotton thread gripped tightly inside a longitudinal split cork held in a retort clamp.',
    specs: {
      resolution: 'Effective length L measured to ±0.1 cm (centre of gravity of bob)',
      range: 'L = 20.0 cm to 120.0 cm · amplitude θ < 10°',
      zeroError: 'Add bob radius r to string length so L = l_string + r',
      material: 'Solid turned brass bob + split cork jaws + cast-iron retort stand',
    },
    parts: [
      { part: 'Split cork in retort clamp', role: 'Defines a sharp, non-slipping pivot point at the bottom face of the cork.' },
      { part: 'Spherical brass pendulum bob', role: 'Concentrates mass at a well-defined centre of gravity with low air drag.' },
      { part: 'Vertical fiducial reference mark', role: 'Chalk line or optical pin placed behind the equilibrium centre to count passes.' },
    ],
    handling: [
      'Measure the effective length L from the bottom face of the split cork to the CENTRE OF GRAVITY of the spherical bob.',
      'Displace the bob by a small angle (θ < 10°) in a single vertical plane and release gently without pushing.',
      'Start and stop the stopwatch as the string passes the vertical fiducial mark at maximum speed, timing 20 complete oscillations twice.',
    ],
    mistakes: [
      'Measuring string length only to the top hook of the bob instead of the centre of mass of the bob.',
      'Starting the stopwatch at the extreme end of the swing where the bob pauses momentarily.',
      'Swinging the bob through a large angle (> 15°) or in an elliptical conical path.',
    ],
    spotInLab: 'Tall retort stand clamping a split cork with a thin thread and a shiny brass sphere hanging above the floor.',
  },

  // 74. Inclined plane
  {
    id: 'inclined-plane',
    number: 74,
    name: 'Inclined plane with adjustable angle quadrant & roller',
    subtitle: 'Physics · Mechanics & Friction',
    subject: 'Physics',
    category: 'Support & Handling',
    file: '/apparatus/metre-rule.svg',
    practiseTo: '/lab/physics/moments',
    primaryUses: 'Determining the coefficient of static and kinetic friction (µ = tan θ), resolving weight into mg sin θ and mg cos θ, and studying acceleration down a ramp.',
    description:
      'A hinged planed hardwood or anodized aluminium board fitted with a degree-graduated protractor quadrant, a low-friction end pulley, and a scale pan.',
    specs: {
      resolution: '0.5° angle scale + 1 mm linear scale',
      range: '0° – 45° adjustable inclination angle θ',
      zeroError: 'Keep the towing cord strictly parallel to the inclined surface',
      material: 'Seasoned mahogany/aluminium ramp + brass ball-bearing end pulley',
    },
    parts: [
      { part: 'Hinged ramp board & degree arc', role: 'Sets and reads the angle of inclination θ (or height h and hypotenuse L).' },
      { part: 'Adjustable end pulley', role: 'Guides the string from the sliding block to the hanging weight pan parallel to the board.' },
    ],
    handling: [
      'Wipe the ramp surface free of dust and adjust the pulley height so the string runs parallel to the inclined plane.',
      'Tap the board gently when finding the limiting static friction angle (angle of repose θ_s where µ_s = tan θ_s).',
    ],
    mistakes: [
      'Allowing the towing string to slope upward or downward relative to the ramp surface, altering the normal reaction R.',
    ],
    spotInLab: 'Hinged wooden or metal ramp with a curved protractor bracket and a small pulley wheel at the top end.',
  },

  // 75. Pulley system
  {
    id: 'pulley-system',
    number: 75,
    name: 'Block and tackle pulley system (sheave blocks)',
    subtitle: 'Physics · Simple Machines & Efficiency',
    subject: 'Physics',
    category: 'Support & Handling',
    file: '/apparatus/retort-stand.svg',
    practiseTo: '/lab/physics/moments',
    primaryUses: 'Determining Mechanical Advantage (MA = Load/Effort), Velocity Ratio (VR), and mechanical efficiency η = (MA/VR) × 100% of single and multi-sheave pulleys.',
    description:
      'Upper fixed and lower movable aluminium or brass pulley blocks containing 1, 2, or 3 low-friction ball-bearing sheaves threaded with a continuous inextensible cord.',
    specs: {
      resolution: 'VR = number of cord segments supporting the movable lower block',
      range: 'VR = 2, 3, 4, or 6 sheave configurations',
      zeroError: 'Oil sheave bearings lightly and weigh the lower movable block if finding net efficiency',
      material: 'Die-cast aluminium frames + brass ball-bearing grooved sheaves',
    },
    parts: [
      { part: 'Fixed upper sheave block', role: 'Hooks to the overhead retort beam and redirects the effort pull.' },
      { part: 'Movable lower sheave block', role: 'Rises with the load L, supported by n tensioned cord strands (VR = n).' },
    ],
    handling: [
      'Thread the cord cleanly through the sheaves so no two strands rub or cross against each other.',
      'Measure the steady effort E needed to raise each load L at constant slow speed without jerking.',
    ],
    mistakes: [
      'Reading the spring balance while accelerating the effort hand rapidly downward instead of pulling at steady speed.',
    ],
    spotInLab: 'Pair of multi-wheeled metal pulley blocks suspended from a tall stand with slotted masses hanging below.',
  },

  // 76. Dynamics track
  {
    id: 'dynamics-track',
    number: 76,
    name: 'Low-friction dynamics track & carts',
    subtitle: 'Physics · Newton’s Second Law & Collisions',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/metre-rule.svg',
    practiseTo: '/lab/physics/moments',
    primaryUses: 'Verifying conservation of linear momentum (m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂), elastic vs inelastic collisions, and F = ma.',
    description:
      'A rigid 1.2 m or 2.0 m extruded aluminium track with precision grooves, levelling screws, a built-in millimetre scale, and low-friction ball-bearing wheeled carts with magnetic and Velcro bumpers.',
    specs: {
      resolution: '1 mm integrated track scale',
      range: '1.20 m or 2.00 m track length · 250 g standard cart mass',
      zeroError: 'Level track with levelling screws until a stationary cart shows zero drift',
      material: 'Anodized extruded aluminium beam + low-inertia ball-bearing carts',
    },
    parts: [
      { part: 'Extruded aluminium V-groove rails', role: 'Keep the dynamics carts rolling along a straight 1-D axis without steering drag.' },
      { part: 'Magnetic & Velcro end bumpers', role: 'Provide nearly 100% elastic repulsion (magnets) or completely inelastic sticking (Velcro).' },
    ],
    handling: [
      'Place a cart at the centre of the track and adjust the end levelling feet until it remains completely stationary.',
      'Use magnetic bumpers facing each other for elastic collisions, or flip one cart to use the Velcro pads for inelastic collisions.',
    ],
    mistakes: [
      'Dropping heavy iron bar masses onto a dynamics cart resting on the track, denting the ball bearings.',
    ],
    spotInLab: 'Long silver aluminium rail with a ruler strip along one edge and two wheeled carts with spring plungers.',
  },

  // 77. Mass hanger and slotted masses
  {
    id: 'slotted-masses',
    number: 77,
    name: 'Mass hanger and slotted masses (10 g – 100 g set)',
    subtitle: 'Physics · Engineering · Mechanics',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/retort-stand.svg',
    practiseTo: '/lab/physics/moments',
    primaryUses: 'Applying calibrated gravitational loads (W = mg) in Hooke’s law, principle of moments, beam deflection, and pulley experiments.',
    description:
      'A machined brass or cast-iron stem hanger (whose own base mass equals one unit, e.g. 50 g or 100 g) carrying radially slotted disc weights that slide onto the central shaft.',
    specs: {
      resolution: '1 g, 5 g, 10 g, 20 g, 50 g, or 100 g calibrated steps',
      range: '10 g – 1000 g total stack',
      zeroError: 'Always include the mass of the hanger itself in the total suspended mass M',
      material: 'Turned brass or enamelled cast-iron discs (±0.5% Class M2)',
    },
    parts: [
      { part: 'Hooked stem hanger (50 g / 100 g)', role: 'Forms the first mass unit and carries the stack of slotted discs.' },
      { part: 'Radially slotted brass discs', role: 'Slide over the central spindle with alternating slot orientations so they cannot slip off.' },
    ],
    handling: [
      'Count the mass of the base hanger itself as the first unit of load (e.g., hanger = 50 g + three 50 g discs = 200 g total).',
      'Alternate the radial slot directions of successive discs by 180° and lower loads gently onto springs without dropping.',
    ],
    mistakes: [
      'Forgetting to add the mass of the hanger (50 g or 100 g) to the recorded load column.',
      'Confusing mass in grams (m) with weight/force in newtons (W = mg in kg × 9.8 or 10 m s⁻²).',
    ],
    spotInLab: 'Vertical brass rod with a top hook and a stack of shiny round brass discs with keyway slots.',
  },

  // 78. Barometer
  {
    id: 'barometer',
    number: 78,
    name: 'Fortin / Aneroid atmospheric barometer',
    subtitle: 'Physics · Pressure & Gas Laws',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/venturi-manometer.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Measuring local atmospheric pressure P_atm (in mmHg, mbar, or kPa) for Boyle’s law, gas volume corrections to STP, and meteorology.',
    description:
      'A Fortin mercury column barometer with an ivory fiducial cistern pointer and Vernier scale (standard 760.0 mmHg = 101.325 kPa), or a evacuated corrugated-capsule aneroid dial barometer.',
    specs: {
      resolution: '0.1 mmHg (Fortin Vernier) · 0.5 hPa / mbar (Aneroid)',
      range: '680 – 800 mmHg (900 – 1060 hPa)',
      zeroError: 'On a Fortin barometer, turn the lower screw until the mercury cistern surface just touches the ivory point',
      material: 'Evacuated beryllium-copper aneroid capsule or glass mercury column in brass case',
    },
    parts: [
      { part: 'Ivory zero pointer & cistern leather bag (Fortin)', role: 'Sets the bottom mercury reservoir surface exactly to zero before reading the top meniscus.' },
      { part: 'Evacuated aneroid capsule & tapping needle', role: 'Flexes with atmospheric pressure changes and drives the dial pointer.' },
    ],
    handling: [
      'On an aneroid barometer, tap the glass face gently with a fingertip to overcome pivot friction before reading the pointer.',
      'On a Fortin barometer, adjust the bottom thumbscrew until the ivory tip touches its own mirror image in the mercury pool, then align the upper Vernier tangent to the top of the convex mercury meniscus.',
    ],
    mistakes: [
      'Reading the bottom of a mercury meniscus instead of the TOP of the convex mercury dome.',
    ],
    spotInLab: 'Tall vertical brass tube mounted on the lab wall (Fortin) or a round brass dial graded in mmHg and millibars.',
  },

  // 79. Manometer
  {
    id: 'manometer',
    number: 79,
    name: 'U-tube liquid manometer',
    subtitle: 'Physics · Engineering · Fluid Pressure',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/venturi-manometer.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Measuring gauge pressure and pressure differentials ΔP = ρgh of gas supplies, lung expiration, or fluid flow across an orifice/Venturi.',
    description:
      'A transparent glass U-tube mounted against a central millimetre scale and half-filled with coloured water or mercury; the height difference h = h₂ − h₁ between the two limbs gives ΔP = ρgh.',
    specs: {
      resolution: '1 mm head difference (≈ 9.8 Pa with water)',
      range: '0 – 500 mmH₂O differential head',
      zeroError: 'With both limbs open to air, check that both menisci stand at the same zero level',
      material: 'Borosilicate U-tube on anodized millimetre scale backboard',
    },
    parts: [
      { part: 'Left (test) & right (open atmosphere) limbs', role: 'Compare the unknown gas pressure against atmospheric pressure P_atm.' },
      { part: 'Central millimetre scale', role: 'Measures the vertical height of both liquid columns so h = |h_open − h_gas|.' },
    ],
    handling: [
      'Before connecting the gas supply, verify both limbs are at the same level and flush out any trapped air bubbles.',
      'Read both limb heights at eye level and take the full difference h = h_high − h_low (do not just double one limb unless the bore is strictly uniform).',
    ],
    mistakes: [
      'Recording only the rise in one limb above the zero mark instead of the total vertical difference between the two menisci.',
    ],
    spotInLab: 'U-shaped glass tube half-filled with dyed water clamped flat against a vertical ruler.',
  },

  // 80. Convex lens
  {
    id: 'convex-lens',
    number: 80,
    name: 'Biconvex converging lens (f = +10 cm / +15 cm / +20 cm)',
    subtitle: 'Physics · Geometrical Optics',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/glass-block.svg',
    practiseTo: '/lab/physics/refraction',
    primaryUses: 'Determining focal length f via the lens formula 1/f = 1/u + 1/v, no-parallax pin method, or displacement method, and building telescopes/microscopes.',
    description:
      'A circular optical crown-glass disc thicker at its centre than at its rim, converging parallel paraxial light rays to a real principal focus at distance f.',
    specs: {
      resolution: 'Focal length f determined to ±0.1 cm',
      range: 'f = +10.0 cm, +15.0 cm, or +20.0 cm (50 mm diameter)',
      zeroError: 'Obtain a quick approximate focal length f₀ first by focusing a distant window onto a wall',
      material: 'Polished BK7 optical crown glass (n ≈ 1.52) with ground safety edge',
    },
    parts: [
      { part: 'Thicker optical centre', role: 'Rays passing through the optical centre proceed undeviated.' },
      { part: 'Ground cylindrical rim', role: 'Seats into a V-grooved wooden or spring lens holder at the height of the optical axis.' },
    ],
    handling: [
      'Before starting the main table, focus a distant window or tree onto the white screen to find the approximate focal length f₀ (this prevents setting object distance u < f where no real image can form).',
      'Hold the lens by its ground rim only and align its principal axis level with the illuminated cross-wire object and screen.',
    ],
    mistakes: [
      'Placing the object closer than the focal length (u < f) and wasting time searching for a real image on the screen.',
      'Forgetting to record the preliminary approximate focal length f₀ (usually worth 1–2 marks in WAEC/NECO practicals).',
    ],
    spotInLab: 'Round glass disc that feels noticeably thicker in the middle than at the edges and magnifies print held close beneath it.',
  },

  // 81. Concave lens
  {
    id: 'concave-lens',
    number: 81,
    name: 'Biconcave diverging lens (f = –15 cm)',
    subtitle: 'Physics · Geometrical Optics',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/glass-block.svg',
    practiseTo: '/lab/physics/refraction',
    primaryUses: 'Studying virtual image formation, correcting myopia (short-sightedness) models, and determining negative focal length by combination with a stronger convex auxiliary lens.',
    description:
      'A circular optical glass lens thinner at its optical centre than at its outer rim that diverges incident parallel rays so they appear to originate from a virtual principal focus.',
    specs: {
      resolution: 'Focal length f = –10.0 cm to –20.0 cm',
      range: '50 mm diameter optical crown glass',
      zeroError: 'Requires an auxiliary converging lens of shorter focal length to form a real image on a screen',
      material: 'Optical crown glass (n ≈ 1.52) with bevelled thick rim',
    },
    parts: [
      { part: 'Thin concave optical centre', role: 'Refracts rays outward away from the principal axis.' },
      { part: 'Thick peripheral rim', role: 'Mounts securely in standard optical bench lens holders.' },
    ],
    handling: [
      'Handle by the outer ground rim and inspect nearby print through the lens — a concave lens always produces an upright, diminished virtual image.',
      'To measure its focal length on a screen, pair it in contact (or coaxially) with a convex lens of shorter focal length so the combined power P = P₁ + P₂ remains positive.',
    ],
    mistakes: [
      'Trying to project a real image onto a screen using a standalone concave lens.',
    ],
    spotInLab: 'Round glass lens that feels thin and hollowed-in at the middle and makes text look smaller when viewed through it.',
  },

  // 82. Optical bench
  {
    id: 'optical-bench',
    number: 82,
    name: 'Optical bench with lens holder & white screen',
    subtitle: 'Physics · Optics & Lens Formula',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/metre-rule.svg',
    practiseTo: '/lab/physics/refraction',
    primaryUses: 'Measuring conjugate object distance u and image distance v coaxially along a 100 cm or 150 cm scale to verify 1/u + 1/v = 1/f.',
    description:
      'A rigid graduated rail (or metre rule track) carrying sliding riders with index markers for an illuminated cross-wire object box, a vertical lens holder, and a matte white viewing screen.',
    specs: {
      resolution: '0.1 cm (1 mm) rider index scale',
      range: '0.0 – 100.0 cm (or 150.0 cm) coaxial track',
      zeroError: 'Check index error between lens centre plane and rider pointer mark',
      material: 'Hardwood/aluminium rail + wooden V-block lens stand + matte white screen',
    },
    parts: [
      { part: 'Illuminated wire-gauze / cross-wire object box', role: 'Provides a high-contrast sharp object at a known scale position x_O.' },
      { part: 'Sliding lens holder & matte white screen', role: 'Move along the rail to locate the sharpest focused real image at x_I.' },
    ],
    handling: [
      'Ensure the centre of the illuminated cross-wire, the optical centre of the lens, and the centre of the white screen are all at the same vertical height above the bench.',
      'Slide the screen back and forth through the point of sharpest focus twice and take the mean image distance v = |x_I − x_L|.',
    ],
    mistakes: [
      'Measuring u and v from the edge of the wooden lens holder base rather than from the central plane of the lens.',
    ],
    spotInLab: 'Lamp box with a cut-out cross-wire hole, a grooved wooden lens stand, and a white card screen lined up along a metre rule.',
  },

  // 83. Ray box
  {
    id: 'ray-box',
    number: 83,
    name: 'Optical ray box with single & triple slit comb',
    subtitle: 'Physics · Light Reflection & Refraction',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/glass-block.svg',
    practiseTo: '/lab/physics/refraction',
    primaryUses: 'Projecting narrow, collimated pencil rays of light across drawing paper to trace reflection, refraction, total internal reflection, and focal points.',
    description:
      'A ventilated low-voltage (12 V) lamp housing fitted with a cylindrical collimating lens and interchangeable metal slit plates (single slit, triple slits, and colour filters).',
    specs: {
      resolution: '0.5 mm sharp collimated ray streak on white paper',
      range: '12 V AC/DC 21 W line-filament lamp · 1, 3, or 5 slits',
      zeroError: 'Slide the internal cylindrical lens until the ray streaks remain parallel across the sheet',
      material: 'Finned die-cast metal housing + collimating plano-cylindrical lens',
    },
    parts: [
      { part: 'Plano-cylindrical collimating lens', role: 'Focuses the vertical lamp filament into narrow, non-diverging streaks across the paper.' },
      { part: 'Slotted metal slit comb & filter slots', role: 'Selects a single fine ray (for Snell’s law) or 3 parallel rays (for lens focal points).' },
    ],
    handling: [
      'Connect the ray box to a 12 V low-voltage power pack and slide the slit comb into the front groove after the collimating lens.',
      'Mark the centre of each light ray on the drawing sheet with two sharp pencil crosses (×) spaced at least 5 cm apart, then switch off the lamp to prevent overheating.',
    ],
    mistakes: [
      'Marking the ray with two pencil dots placed only 1 cm apart, causing large angular errors when joined with a ruler.',
      'Grabbing the finned metal lamp housing bare-handed after it has been switched on continuously.',
    ],
    spotInLab: 'Black finned metal box with a power cord and vertical slot channels at the front that throw bright lines of light onto paper.',
  },

  // 84. Prism
  {
    id: 'equilateral-prism',
    number: 84,
    name: 'Equilateral triangular glass prism (60°–60°–60°)',
    subtitle: 'Physics · Refraction, Minimum Deviation & Dispersion',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/glass-block.svg',
    practiseTo: '/lab/physics/refraction',
    primaryUses: 'Tracing the angle of deviation D vs angle of incidence i curve, determining angle of minimum deviation D_m and refractive index n = sin((A + D_m)/2) / sin(A/2), and dispersing white light.',
    description:
      'A triangular optical crown or flint glass prism with three polished 60° refracting edges and two frosted triangular base ends.',
    specs: {
      resolution: 'Refracting angle A = 60.0° ± 0.2° · n ≈ 1.52 (crown)',
      range: '38 × 38 mm or 50 × 50 mm polished rectangular faces',
      zeroError: 'Re-seat the prism cleanly inside its pencil outline before sighting every pair of pins',
      material: 'Optical crown glass (n = 1.52) or dense flint glass (n = 1.62)',
    },
    parts: [
      { part: 'Two polished refracting faces & apex angle A (60°)', role: 'Bend the incident ray twice toward the thick base, giving total deviation D = (i + e) − A.' },
      { part: 'Frosted triangular base face', role: 'Rests flat on the white drawing sheet so the outline can be traced accurately.' },
    ],
    handling: [
      'Place the frosted triangular face flat on the drawing sheet, trace the triangular outline ABC with a sharp H/2H pencil, and remove the prism to draw the normal at the point of incidence.',
      'When sighting pins P₃ and P₄ through the second refracting face, look at the feet of the pins where they enter the paper so all four appear strictly collinear.',
    ],
    mistakes: [
      'Aligning the top heads of tilted optical pins instead of sighting their bases at paper level.',
      'Allowing the prism to shift outside its traced triangle ABC while placing the emergent pins.',
    ],
    spotInLab: 'Clear solid glass triangle that casts rainbow fringes when held up to window light.',
  },

  // 85. Tuning fork
  {
    id: 'tuning-fork',
    number: 85,
    name: 'Calibrated acoustic tuning fork set (256 Hz – 512 Hz)',
    subtitle: 'Physics · Waves, Resonance Tube & Sonometer',
    subject: 'Physics',
    category: 'Measuring & Volumetric',
    file: '/apparatus/vernier-caliper.svg',
    practiseTo: '/lab/physics/pendulum',
    primaryUses: 'Generating a pure sinusoidal acoustic frequency f to find the speed of sound in air v = 2f(L₂ − L₁) with a resonance tube or to verify sonometer wire laws.',
    description:
      'A U-shaped steel or aluminium alloy acoustic resonator with two symmetric tines (prongs) and a cylindrical stem stamped with its fundamental frequency in Hertz (e.g., 256, 320, 384, 440, 512 Hz).',
    specs: {
      resolution: '±0.2% laser-trimmed fundamental frequency',
      range: '256 Hz (C₄), 320 Hz (E₄), 384 Hz (G₄), 440 Hz (A₄), 512 Hz (C₅)',
      zeroError: 'Strike ONLY on a soft rubber pad — never on a hard wooden bench or metal rim',
      material: 'Nickel-plated spring steel or acoustic aluminium alloy',
    },
    parts: [
      { part: 'Two symmetric vibrating tines (prongs)', role: 'Oscillate transversely in antiphase at the stamped fundamental frequency f.' },
      { part: 'Cylindrical nodal stem', role: 'Held between thumb and fingers; vibrates longitudinally to couple sound into a sonometer box.' },
    ],
    handling: [
      'Hold the tuning fork by its cylindrical stem only — touching the prongs damps the vibration immediately.',
      'Strike one prong smartly against a soft rubber striking pad (never against the glass rim of the resonance tube or hard bench).',
      'For a resonance tube, hold the vibrating tines horizontally about 1 cm above the open glass mouth so the prongs oscillate vertically into the air column.',
    ],
    mistakes: [
      'Striking the tuning fork against the glass rim of the resonance tube, chipping the glass and exciting harsh overtone harmonics.',
      'Forgetting the end-correction e = 0.3 d when calculating speed of sound from a single resonance length L₁ + e = λ/4.',
    ],
    spotInLab: 'Two-pronged U-shaped metal fork stamped with a number like 512 Hz on its handle stem alongside a round rubber striker pad.',
  },

  // 86. Electromagnet
  {
    id: 'electromagnet',
    number: 86,
    name: 'U-core electromagnet & soft-iron armature',
    subtitle: 'Physics · Electromagnetism & Induction',
    subject: 'Physics',
    category: 'Electrical & Circuit',
    file: '/apparatus/rheostat.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Investigating how magnetic field strength depends on coil current I and number of turns N (B ∝ NI), free-fall release mechanisms, and Faraday electromagnetic induction.',
    description:
      'A laminated or annealed soft-iron U-core fitted with twin multi-tap copper solenoid bobbins (e.g., 200 / 400 / 800 turns), 4 mm terminal sockets, and a removable soft-iron keeper armature.',
    specs: {
      resolution: 'Tapped windings at 200, 400, 600, 1200 turns',
      range: '0 – 5 A DC operating current (6–12 V low-voltage supply)',
      zeroError: 'Observe wound direction of both coils so the two poles form N and S rather than bucking each other',
      material: 'Annealed low-retentivity soft-iron core + enamelled copper windings',
    },
    parts: [
      { part: 'Annealed soft-iron U-core', role: 'Multiplies magnetic flux density hundreds-fold when current flows and demagnetizes immediately when switched off.' },
      { part: 'Twin multi-tap solenoid coils', role: 'Allow selection of turn count N and series/parallel pole polarity.' },
    ],
    handling: [
      'Wire the two bobbins in series with an ammeter, rheostat, and DC power supply so one limb becomes a North pole and the other a South pole (attracting the keeper cleanly).',
      'Switch off the current between readings so the copper coils do not overheat and change resistance.',
    ],
    mistakes: [
      'Wiring the two bobbins in opposing polarity so their fluxes cancel out across the keeper.',
      'Using a hard steel core instead of soft iron when quick release is required (steel retains remanent magnetism).',
    ],
    spotInLab: 'Heavy U-shaped grey iron block wearing two copper-wire spools with red and black 4 mm sockets.',
  },

  // 87. Separatory funnel
  {
    id: 'separatory-funnel',
    number: 87,
    name: 'Separatory funnel (dropping / solvent extraction funnel)',
    subtitle: 'Chemistry · Liquid–Liquid Extraction',
    subject: 'Chemistry',
    category: 'Glassware & Containers',
    file: '/apparatus/conical-flask.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Separating two immiscible liquids of different densities (such as an aqueous phase and an organic ether/hexane layer) during solvent extraction.',
    description:
      'A pear-shaped borosilicate glass vessel with a ground-glass or PTFE top stopper and a bottom PTFE stopcock tap supported in an iron ring on a retort stand.',
    specs: {
      resolution: 'Sharp meniscus phase interface at tapered lower cone',
      range: '100 cm³, 250 cm³, or 500 cm³ capacity',
      zeroError: 'Always remove the top stopper before opening the bottom tap so air can enter',
      material: 'Borosilicate 3.3 glass + PTFE stopcock + ground-glass stopper',
    },
    parts: [
      { part: 'Tapered pear-shaped body', role: 'Narrows the phase boundary near the stopcock so the lower layer drains cleanly.' },
      { part: 'PTFE stopcock & ground stopper', role: 'Seals during shaking/venting and controls drainage of the denser bottom layer.' },
    ],
    handling: [
      'Support the funnel in a padded iron ring, close the stopcock, pour in the mixture, and insert the top stopper.',
      'Invert the funnel while holding the stopper firmly with your index finger and open the stopcock away from faces every few shakes to vent vapour pressure.',
      'Return to the ring stand, REMOVE the top stopper, let the two layers separate cleanly, and drain the denser bottom layer through the tap.',
    ],
    mistakes: [
      'Forgetting to remove the top stopper before opening the bottom tap, creating a vacuum lock that stops drainage.',
      'Shaking a volatile solvent mixture with acid/bicarbonate without venting the stopcock, blowing the stopper out.',
    ],
    spotInLab: 'Pear-shaped glass bulb tapering down to a white tap at the bottom and capped with a glass stopper at the top.',
  },

  // 88. Hot plate
  {
    id: 'hot-plate',
    number: 88,
    name: 'Ceramic-top laboratory hot plate',
    subtitle: 'Chemistry · Biology · Flameless Heating',
    subject: 'Chemistry',
    category: 'Heating & Thermal',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Uniform, flameless heating of flat-bottomed beakers, Erlenmeyer flasks, and water baths — essential when flammable organic solvents are present.',
    description:
      'A chemically resistant glass-ceramic or die-cast aluminium deck heated by embedded resistance elements with stepless thermostatic control and a hot-surface warning LED.',
    specs: {
      resolution: '1°C digital setpoint (or 1–10 stepless dial)',
      range: 'Ambient + 10°C to 380°C (or 500°C ceramic plate)',
      zeroError: 'Wait for flashing HOT warning light to extinguish before touching plate',
      material: 'Pyroceram glass-ceramic top plate + chemical-spill drip edge',
    },
    parts: [
      { part: 'Glass-ceramic heating deck', role: 'Transfers heat evenly into flat-bottomed borosilicate flasks and resists acid spills.' },
      { part: 'Residual heat warning LED (>50°C)', role: 'Flashes even after the mains switch is off while the ceramic plate remains above 50°C.' },
    ],
    handling: [
      'Use only flat-bottomed heat-resistant borosilicate glassware (Pyrex/Kimax) on the ceramic deck and add anti-bumping granules before boiling.',
      'Never heat sealed containers or soft soda-lime reagent bottles on a hot plate.',
    ],
    mistakes: [
      'Touching the white ceramic top plate right after switching off because it does not glow red even at 300°C.',
      'Placing a cold wet beaker onto a pre-heated 350°C ceramic plate, causing thermal shock.',
    ],
    spotInLab: 'Low square benchtop box with a flat white ceramic top square and a temperature control knob.',
  },

  // 89. Magnetic stirrer
  {
    id: 'magnetic-stirrer',
    number: 89,
    name: 'Magnetic stirrer & PTFE flea stir bar',
    subtitle: 'Chemistry · Titration & Solution Preparation',
    subject: 'Chemistry',
    category: 'Heating & Thermal',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Continuously mixing titration flasks, dissolving buffer salts, and keeping solutions thermally uniform without an external mechanical shaft.',
    description:
      'A variable-speed rotating permanent magnet beneath a flat platform that couples magnetically to a white PTFE-encapsulated iron stir bar ("flea") inside the beaker or flask.',
    specs: {
      resolution: '10 rpm stepless speed control',
      range: '100 – 1500 rpm rotational speed',
      zeroError: 'Centre the flask on the deck and ramp rpm gradually so the flea does not decouple',
      material: 'Brushless DC drive magnet + virgin PTFE-coated Alnico stir bar',
    },
    parts: [
      { part: 'PTFE magnetic stir bar (flea)', role: 'Inert Teflon capsule dropped into the flask that spins horizontally on the vessel floor.' },
      { part: 'Magnetic retriever wand', role: 'Pulls the stir bar up the outside wall of the flask before pouring solution to waste.' },
    ],
    handling: [
      'Slide the PTFE stir bar gently down the tilted wall of the flask so it does not crack the glass bottom.',
      'Centre the flask on the stirrer pad and increase speed slowly until a gentle surface dimple forms without splashing or drawing air bubbles.',
    ],
    mistakes: [
      'Pouring the finished solution down the sink drain and losing the PTFE stir bar with it.',
      'Turning the rpm dial straight to maximum so the stir bar decouples and rattles erratically.',
    ],
    spotInLab: 'Flat platform unit paired with a tic-tac-shaped white Teflon pill that spins inside a beaker.',
  },

  // 90. pH meter
  {
    id: 'ph-meter',
    number: 90,
    name: 'Digital pH meter & combination glass electrode',
    subtitle: 'Chemistry · Biology · Acid–Base & Buffers',
    subject: 'Chemistry',
    category: 'Measuring & Volumetric',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Measuring hydrogen ion activity pH = –log₁₀[H⁺] to 0.01 pH units for pH titration curves, buffer preparation, and enzyme optimum pH assays.',
    description:
      'A high-input-impedance millivoltmeter connected to a combination Ag/AgCl reference and thin hydrated H⁺-sensitive glass bulb electrode with Automatic Temperature Compensation (ATC).',
    specs: {
      resolution: '0.01 pH units · 1 mV',
      range: 'pH 0.00 – 14.00 (±1999 mV)',
      zeroError: 'Two-point calibration with standard buffers pH 7.00 (offset) and pH 4.01 or 10.01 (slope)',
      material: 'Hydrated lithium-silicate glass bulb + Ag/AgCl reference junction in 3 M KCl',
    },
    parts: [
      { part: 'Hydrated glass sensing bulb', role: 'Develops a Nernst potential (≈ 59.16 mV per pH unit at 25°C) across the thin glass membrane.' },
      { part: 'Porous ceramic reference junction', role: 'Completes the electrical circuit with the internal 3 M KCl Ag/AgCl half-cell.' },
      { part: '3 M KCl storage cap', role: 'Keeps the glass bulb hydrated when not in use — never store in distilled water.' },
    ],
    handling: [
      'Remove the storage cap, rinse the bulb with distilled water from a wash bottle, and blot gently with tissue (never wipe or rub the glass bulb, which builds static charge).',
      'Calibrate first in pH 7.00 buffer, rinse, then calibrate slope in pH 4.01 (for acidic samples) or pH 10.01 (for alkaline samples).',
      'After measurement, rinse and return the electrode to its 3 M KCl storage solution cap.',
    ],
    mistakes: [
      'Storing the pH electrode in distilled or deionised water, which leaches ions out of the glass membrane and ruins the reference junction.',
      'Wiping the glass bulb dry with rough paper towel, creating electrostatic drift.',
    ],
    spotInLab: 'Digital meter connected by a coaxial cable to a pen-sized probe ending in a delicate round glass bubble.',
  },

  // 91. Analytical balance
  {
    id: 'analytical-balance',
    number: 91,
    name: 'Analytical 4-decimal balance (0.0001 g with draft shield)',
    subtitle: 'Chemistry · Quantitative Gravimetric & Standard Solutions',
    subject: 'Chemistry',
    category: 'Measuring & Volumetric',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/chemistry/titration',
    primaryUses: 'Weighing primary standards (e.g., anhydrous Na₂CO₃ or KHP) to ±0.1 mg (0.0001 g) for preparing standard volumetric solutions.',
    description:
      'An electromagnetic force restoration balance enclosed inside a three-door sliding glass draft-shield cabinet that isolates the weighing pan from room air currents.',
    specs: {
      resolution: '0.0001 g (0.1 mg)',
      range: '0.0000 – 220.0000 g',
      zeroError: 'Close all glass sliding doors before reading the final 4th decimal digit',
      material: 'Electromagnetic force-compensation cell + 3-pane anti-static glass enclosure',
    },
    parts: [
      { part: 'Three-door sliding glass draft shield', role: 'Blocks air currents from breathing and AC vents that fluctuate the 0.1 mg digit.' },
      { part: 'Internal calibration & Tare bar', role: 'Zeroes the weighing boat and calibrates against an internal motorised reference mass.' },
    ],
    handling: [
      'Check the spirit level bubble, place a clean weighing boat inside, close the glass doors, and press TARE to read 0.0000 g.',
      'Open one side door slightly to add solid reagent with a clean spatula, then close the door completely and wait for the stability ring icon before recording all 4 decimal places.',
    ],
    mistakes: [
      'Reading the display while the sliding glass draft-shield door is still open.',
      'Handling a weighing bottle with bare sweaty fingers instead of tongs or a paper strip (fingerprints add ~0.5 mg).',
    ],
    spotInLab: 'Precision balance topped with a tall transparent glass cube cabinet having sliding left, right, and top doors.',
  },

  // 92. Conductivity meter
  {
    id: 'conductivity-meter',
    number: 92,
    name: 'Electrolytic conductivity meter & dip cell',
    subtitle: 'Chemistry · Electrochemistry & Water Quality',
    subject: 'Chemistry',
    category: 'Measuring & Volumetric',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Comparing strong vs weak electrolytes, measuring total dissolved solids (TDS), and performing conductometric acid–base or precipitation titrations.',
    description:
      'An AC Wheatstone-bridge meter driving a two-electrode platinized-platinum dip cell (cell constant K = L/A ≈ 1.0 cm⁻¹) with an alternating kilohertz signal to prevent electrolysis polarization.',
    specs: {
      resolution: '0.1 µS/cm (microsiemens) · 0.01 mS/cm',
      range: '0.0 µS/cm – 200.0 mS/cm',
      zeroError: 'Calibrate cell constant K with standard 0.0100 M KCl solution (1413 µS/cm at 25°C)',
      material: 'Parallel platinized-platinum plates or graphite rings + NTC temperature probe',
    },
    parts: [
      { part: 'Platinized electrodes & vent hole', role: 'Fixed area A and separation L define cell constant K; upper vent hole lets trapped air escape.' },
      { part: 'AC excitation oscillator', role: 'Prevents gas bubbles and ion polarization from forming on the electrodes.' },
    ],
    handling: [
      'Rinse the conductivity probe thoroughly with deionised water (κ < 2 µS/cm) and dip it past the upper air-vent hole.',
      'Tap the probe gently to dislodge any air bubble trapped between the internal electrodes.',
    ],
    mistakes: [
      'Leaving an air bubble trapped inside the probe shroud, which cuts the effective cross-sectional area A and gives a falsely low reading.',
    ],
    spotInLab: 'Handheld meter with a cylindrical probe tip containing two parallel dark metal plates and a side vent window.',
  },

  // 93. Spectrophotometer
  {
    id: 'spectrophotometer',
    number: 93,
    name: 'UV-Vis spectrophotometer & 1 cm optical cuvettes',
    subtitle: 'Chemistry · Biology · Beer–Lambert Law',
    subject: 'Chemistry',
    category: 'Measuring & Volumetric',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/biology/food-tests',
    primaryUses: 'Measuring optical absorbance A = εcl and percentage transmittance (%T) at a selected wavelength λ_max to determine concentration of coloured ions, proteins, or chlorophyll.',
    description:
      'An optical instrument combining a tungsten/deuterium lamp, diffraction-grating monochromator, 1.00 cm path-length square cuvette holder, and silicon photodiode detector.',
    specs: {
      resolution: '0.001 Absorbance units (AU) · 1 nm wavelength resolution',
      range: 'λ = 320 – 1000 nm (Vis) or 190 – 1100 nm (UV-Vis) · A = 0.000 – 3.000',
      zeroError: 'Always zero (100% T / 0.000 A) with a matched solvent BLANK cuvette at every new wavelength',
      material: '1.00 cm path-length quartz (UV) or optical polystyrene/glass (Vis) cuvettes',
    },
    parts: [
      { part: 'Diffraction grating monochromator', role: 'Isolates a narrow monochromatic band at the sample’s absorption peak λ_max.' },
      { part: '1.00 cm cuvette cell compartment', role: 'Aligns the clear optical faces of the cuvette perpendicular to the light beam.' },
    ],
    handling: [
      'Hold the cuvette ONLY by its two frosted/ribbed sides — never touch the two clear optical windows.',
      'Fill the blank cuvette ~¾ full with pure solvent, wipe the clear faces with lens tissue, align the arrow with the light path, close the lid, and press ZERO (0.000 A).',
      'Replace with the sample cuvette and record absorbance A within the linear Beer–Lambert range (A = 0.10 – 1.20).',
    ],
    mistakes: [
      'Forgetting to re-blank the spectrophotometer after changing the wavelength λ.',
      'Orienting the frosted sides of the cuvette into the light beam instead of the clear windows.',
    ],
    spotInLab: 'Benchtop instrument with a flip-open dark sample well that accepts 1 cm square clear plastic or quartz tubes.',
  },

  // 94. Fume hood
  {
    id: 'fume-hood',
    number: 94,
    name: 'Chemical fume hood (ducted extraction cupboard)',
    subtitle: 'Chemistry · Toxic & Corrosive Gas Safety',
    subject: 'Chemistry',
    category: 'Safety & PPE',
    file: '/apparatus/retort-stand.svg',
    practiseTo: '/lab/chemistry/qualitative-analysis',
    primaryUses: 'Safely exhausting toxic, lachrymatory, or flammable gases and vapours (Cl₂, NO₂, SO₂, H₂S, NH₃, concentrated HCl/HNO₃, bromine, volatile organics) away from the breathing zone.',
    description:
      'A ventilated fire-resistant enclosure with a counterbalanced toughened glass sash, rear baffle slots that draw both heavy and light vapours, and an overhead centrifugal exhaust fan.',
    specs: {
      resolution: '0.40 – 0.50 m/s (80 – 100 fpm) face velocity',
      range: 'Working sash opening height marked at 30 – 45 cm safe arrow',
      zeroError: 'Confirm airflow tell-tale ribbon or digital velocity monitor is green before starting reaction',
      material: 'Phenolic resin / ceramic work deck + laminated safety glass sash',
    },
    parts: [
      { part: 'Counterbalanced vertical glass sash', role: 'Acts as a physical blast shield while maintaining high intake air velocity.' },
      { part: 'Upper & lower rear exhaust baffles', role: 'Lower slot extracts heavy vapours (Br₂, SO₂); upper slot extracts light gases (NH₃, H₂).' },
    ],
    handling: [
      'Switch on the extraction fan, lower the glass sash to the marked safe operating arrow (≈ 40 cm), and set apparatus at least 15 cm inside the front lip.',
      'Never put your head inside the fume cupboard plane during a reaction; keep the sash between your face and the reaction vessel.',
    ],
    mistakes: [
      'Raising the glass sash all the way to the top while evolving toxic NO₂ or H₂S gas, dropping face velocity and letting fumes eddy out into the room.',
    ],
    spotInLab: 'Large glass-fronted alcove chamber along the lab wall with a sliding glass window and roaring exhaust duct.',
  },

  // 95. Oscilloscope
  {
    id: 'oscilloscope',
    number: 95,
    name: 'Digital storage oscilloscope (DSO / CRO)',
    subtitle: 'Electronics · Physics · Waveform & AC Analysis',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Visualizing voltage vs time V(t) waveforms, measuring peak-to-peak voltage V_pp, period T, frequency f = 1/T, phase shift φ (Lissajous figures), and diode rectification.',
    description:
      'A dual-channel high-impedance (1 MΩ || 20 pF) waveform display instrument with calibrated vertical VOLTS/DIV attenuators, horizontal TIME/DIV timebase, and edge trigger circuit.',
    specs: {
      resolution: '8-bit / 12-bit vertical · 10×8 graticule divisions',
      range: '2 mV/div – 10 V/div · 5 ns/div – 50 s/div (50–100 MHz bandwidth)',
      zeroError: 'Check probe attenuation setting (1× vs 10×) matches channel menu so V_pp is not off by 10×',
      material: 'BNC coaxial inputs + 1×/10× compensated passive probes',
    },
    parts: [
      { part: 'VOLTS/DIV vertical scale knob', role: 'Sets the voltage represented by each vertical centimetre square on the graticule.' },
      { part: 'TIME/DIV horizontal timebase knob', role: 'Sets the time interval represented by each horizontal centimetre square.' },
      { part: 'Trigger level & AC/DC/GND coupling', role: 'Locks a repeating waveform stationary on the screen and selects DC offset or AC-only ripple.' },
    ],
    handling: [
      'Confirm the probe switch (1× or 10×) matches the oscilloscope channel attenuation setting.',
      'Count the vertical divisions from trough to crest and multiply by VOLTS/DIV to find V_pp (then V_rms = V_peak / √2 for a sine wave).',
      'Count the horizontal divisions for one full cycle and multiply by TIME/DIV to find period T, then f = 1/T.',
    ],
    mistakes: [
      'Forgetting that the reference ground clip of a standard BNC oscilloscope probe is tied to mains EARTH — clipping it to a non-ground circuit node creates a short circuit.',
      'Using a 10× probe while the scope is set to 1×, making all voltage readings 10 times too small.',
    ],
    spotInLab: 'Bench instrument with a glowing grid screen displaying sine/square waves, rows of rotary knobs, and round silver BNC jacks.',
  },

  // 96. Function generator
  {
    id: 'function-generator',
    number: 96,
    name: 'DDS function / arbitrary waveform generator',
    subtitle: 'Electronics · Physics · AC Circuits & Resonance',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Supplying precision sine, square, triangle, and pulse signals of variable frequency f and amplitude V_pp to test RC/RLC filters, amplifiers, and acoustic transducers.',
    description:
      'A Direct Digital Synthesis (DDS) signal source with a 50 Ω BNC output impedance, variable amplitude, DC offset control, and frequency readout from millihertz to megahertz.',
    specs: {
      resolution: '0.01 Hz frequency resolution · 1 mV_pp amplitude',
      range: '0.1 Hz – 25 MHz · 10 mV_pp – 20 V_pp (into High-Z)',
      zeroError: 'Set output termination menu to High-Z (or 50 Ω) to match your load impedance',
      material: 'DDS quartz synthesizer + 50 Ω BNC output stage',
    },
    parts: [
      { part: 'Waveform selector (Sine / Square / Triangle)', role: 'Switches harmonic content for frequency-response or step-response testing.' },
      { part: '50 Ω BNC output & TTL Sync jack', role: 'Delivers the analog waveform and a clean 5 V logic trigger pulse for the oscilloscope.' },
    ],
    handling: [
      'Set the frequency, waveform type, and peak-to-peak amplitude BEFORE enabling the Output ON button.',
      'Remember that the generator has a 50 Ω internal source resistance: into a high-impedance oscilloscope input the voltage is double what it displays when set to 50 Ω termination.',
    ],
    mistakes: [
      'Trying to drive an 8 Ω loudspeaker directly from the 50 Ω signal output without a power amplifier.',
    ],
    spotInLab: 'Benchtop box with Sine/Square/Triangle wave icons, a rotary frequency encoder wheel, and 50 Ω BNC output connectors.',
  },

  // 97. Bench power supply
  {
    id: 'bench-power-supply',
    number: 97,
    name: 'Regulated DC bench power supply (CV / CC)',
    subtitle: 'Electronics · Physics · Ohm’s Law & Circuit Testing',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Providing clean, ripple-free adjustable DC voltage (0–30 V) with an adjustable Constant-Current (CC) safety limit to prevent burning out breadboard circuits.',
    description:
      'A linear or low-noise switching DC supply featuring dual digital V and A meters, coarse/fine voltage and current-limit knobs, and isolated red (+), black (–), and green (Earth) 4 mm binding posts.',
    specs: {
      resolution: '0.01 V · 0.001 A (1 mA)',
      range: '0.00 – 30.00 V DC · 0.000 – 5.000 A',
      zeroError: 'Set current limit (CC) to a safe value (e.g., 100–250 mA) BEFORE connecting a new circuit',
      material: 'Linear transformer regulator + 4 mm insulated binding posts',
    },
    parts: [
      { part: 'Voltage (CV) & Current Limit (CC) dials', role: 'CV sets target output voltage; CC caps the maximum current if a short circuit occurs.' },
      { part: 'Red (+), Black (–) & Green (GND) posts', role: 'Floating DC output terminals; green links to chassis earth only if strapped.' },
    ],
    handling: [
      'With Output OFF, set the voltage to the required value (e.g., 5.00 V) and dial the current limit down to a safe ceiling for your components.',
      'Wire the circuit red-to-positive and black-to-negative, then press Output ON and watch that the CC (Constant Current) warning LED does not light up.',
    ],
    mistakes: [
      'Cranking the current limit all the way to 5 A before powering an untested breadboard, vaporizing an LED or IC if wired backwards.',
    ],
    spotInLab: 'Boxy bench unit with bright red Voltage and green Current 4-digit LED readouts and red/black/green screw terminals.',
  },

  // 98. Soldering iron
  {
    id: 'soldering-iron',
    number: 98,
    name: 'Temperature-controlled soldering iron',
    subtitle: 'Electronics · PCB Assembly',
    subject: 'Electronics',
    category: 'Heating & Thermal',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Heating copper PCB pads and component leads to melt rosin-core solder alloy (183°C–220°C) into permanent, low-resistance metallurgical joints.',
    description:
      'A ceramic-element heated handpiece fitted with an iron-plated copper chisel or conical tip and an insulated silicone grip.',
    specs: {
      resolution: '±2°C tip thermocouple feedback',
      range: '200°C – 450°C (320°C leaded 60/40 · 350–370°C lead-free SAC305)',
      zeroError: 'Keep the iron-plated tip continuously tinned with a thin bright film of solder to prevent black oxidation',
      material: 'Ceramic heater core + iron-clad copper tip + ESD-safe silicone handle',
    },
    parts: [
      { part: 'Iron-plated copper chisel tip', role: 'Transfers thermal energy rapidly into both the PCB pad and component lead simultaneously.' },
      { part: 'Heat-resistant silicone pencil grip', role: 'Allows precise finger control 4 cm behind the hot stainless barrel.' },
    ],
    handling: [
      'Wipe the hot tip across damp brass wool or a damp cellulose sponge, touch a drop of fresh solder to wet the tip face, and press the tip against BOTH the copper pad and component lead for 1.5–2 seconds.',
      'Feed rosin-core solder wire onto the heated junction (not directly onto the iron tip), remove the solder wire, then remove the iron and let the joint cool undisturbed.',
      'Tin the tip with a protective coat of solder before returning the iron to its stand or switching off.',
    ],
    mistakes: [
      'Melting a blob of solder onto the iron tip and carrying it over to a cold pad ("cold joint" with oxidized flux burnt away).',
      'Filing or sanding a soldering iron tip, which strips away the protective iron plating and causes the copper core to pit rapidly.',
    ],
    spotInLab: 'Slender wand with a heat-proof cord, stainless metal barrel, and pointed silver tip resting in a coiled metal spring cradle.',
  },

  // 99. Soldering station
  {
    id: 'soldering-station',
    number: 99,
    name: 'ESD-safe digital soldering station & brass wool stand',
    subtitle: 'Electronics · Prototyping & Rework',
    subject: 'Electronics',
    category: 'Heating & Thermal',
    file: '/apparatus/calorimeter.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Regulating soldering tip temperature precisely while providing a weighted safety cradle, brass tip cleaner, and auto-sleep timer.',
    description:
      'A low-voltage isolation transformer base unit with closed-loop PID temperature display, ESD grounding jack, and a heavy cast-metal safety holster with brass shavings and cellulose sponge.',
    specs: {
      resolution: '1°C digital PID readout (60 W – 90 W)',
      range: '150°C – 480°C with < 2 mV tip-to-ground leakage',
      zeroError: 'Always return the iron to the metal holster immediately after every joint — never lay it on the bench',
      material: 'ESD-conductive housing + 24 V isolated transformer + brass-curl tip cleaner',
    },
    parts: [
      { part: 'PID temperature base controller', role: 'Supplies isolated 24 V power and recovers tip temperature instantly on heavy ground planes.' },
      { part: 'Spring safety cradle & brass wool curls', role: 'Catches the hot barrel safely and wipes excess oxides without thermal-shocking the tip.' },
    ],
    handling: [
      'Set 330°C for 60/40 tin-lead solder or 360°C for lead-free solder and use a fume extractor while soldering.',
      'Clean the tip in the brass wool coils between joints and switch the station off when leaving the bench.',
    ],
    mistakes: [
      'Soaking the cleaning sponge in dripping pool water instead of wringing it merely damp (cold water thermal-shocks the tip).',
    ],
    spotInLab: 'Compact digital control box tethered to a pencil iron resting in an angled spring stand with golden brass curls in the base.',
  },

  // 100. Desoldering pump
  {
    id: 'desoldering-pump',
    number: 100,
    name: 'Desoldering pump (spring-loaded vacuum solder sucker)',
    subtitle: 'Electronics · PCB Rework & Repair',
    subject: 'Electronics',
    category: 'Support & Handling',
    file: '/apparatus/volumetric-pipette.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Vacuuming molten solder cleanly out of through-hole PCB pads so components can be removed or replaced without lifting copper tracks.',
    description:
      'An anodized aluminium cylinder with a cocking plunger, internal recoil spring, side trigger release button, and replaceable heat-resistant PTFE nozzle.',
    specs: {
      resolution: 'Instantaneous vacuum pulse (~30 cmHg suction)',
      range: 'Standard through-hole pads & DIP IC pins',
      zeroError: 'Keep the white PTFE nozzle flush against the molten pool when pressing the release button',
      material: 'Anodized aluminium barrel + high-temperature PTFE tip + O-ring piston',
    },
    parts: [
      { part: 'Spring-loaded vacuum plunger', role: 'Pressed down until it latches; snaps upward on trigger release to create a sharp vacuum pulse.' },
      { part: 'Replaceable PTFE nozzle tip', role: 'Touches molten 350°C solder directly without melting or sticking.' },
    ],
    handling: [
      'Depress the top plunger with your thumb until it clicks and locks.',
      'Heat the solder joint with the soldering iron until the entire pad is liquid (adding a touch of fresh solder helps heat transfer), place the PTFE nozzle right over the joint, and press the side trigger button.',
    ],
    mistakes: [
      'Heating a delicate copper PCB pad for more than 4–5 seconds while trying to desolder, delaminating and lifting the copper ring off the fibreglass board.',
    ],
    spotInLab: 'Cylindrical metallic tube with a spring plunger rod at the top, a side push-button, and a white plastic cone tip.',
  },

  // 101. Solder wick
  {
    id: 'solder-wick',
    number: 101,
    name: 'Solder wick (fluxed braided copper desoldering braid)',
    subtitle: 'Electronics · SMD & Fine-Pitch Rework',
    subject: 'Electronics',
    category: 'Support & Handling',
    file: '/apparatus/rheostat.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Drawing excess molten solder off surface-mount IC pins, bridged pads, and flat copper lands by capillary action.',
    description:
      'A flat ribbon woven from fine oxygen-free copper strands impregnated with rosin flux and wound onto an anti-static pocket spool (widths 1.5 mm – 3.0 mm).',
    specs: {
      resolution: 'Capillary wicking on 0.5 mm – 2.54 mm pitch pads',
      range: '1.5 mm, 2.0 mm, 2.5 mm, 3.0 mm braid widths',
      zeroError: 'Snip off the silver solder-saturated tip of the braid before the next use',
      material: 'Rosin-flux-coated braided OFHC copper ribbon',
    },
    parts: [
      { part: 'Flux-impregnated copper weave', role: 'Wets with molten solder and pulls it upward away from the PCB pad by surface tension.' },
      { part: 'ESD pocket bobbin spool', role: 'Hold the plastic spool — never hold the bare copper braid with fingers as copper conducts heat rapidly.' },
    ],
    handling: [
      'Lay the fresh copper end of the braid flat over the solder joint and press the hot chisel tip of the soldering iron down on top of the braid.',
      'As soon as silver solder wicks up into the copper weave (1–2 s), lift BOTH the iron and the braid off the pad together at the same instant.',
    ],
    mistakes: [
      'Removing the soldering iron first and leaving the solder wick on the pad, which freezes the copper braid solidly onto the PCB track.',
    ],
    spotInLab: 'Small round plastic spool dispensing a flat, shiny woven copper ribbon.',
  },

  // 102. Wire stripper
  {
    id: 'wire-stripper',
    number: 102,
    name: 'Precision AWG wire stripper (18–30 AWG)',
    subtitle: 'Electronics · Circuit Wiring',
    subject: 'Electronics',
    category: 'Support & Handling',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Stripping PVC, silicone, or Teflon insulation cleanly from solid-core (22 AWG breadboard wire) and stranded hook-up wire without nicking the inner copper conductor.',
    description:
      'Spring-loaded steel jaws precision-ground with semi-circular gauge notches matching standard wire diameters (18, 20, 22, 24, 26, 28, 30 AWG / 0.25–1.0 mm).',
    specs: {
      resolution: 'Calibrated semi-circular die holes per AWG gauge',
      range: '18 – 30 AWG (0.25 mm – 1.02 mm conductor diameter)',
      zeroError: 'Always match the wire gauge to the stamped AWG hole so the blade cuts only the plastic jacket',
      material: 'Hardened high-carbon tool steel jaws + cushioned ESD handles',
    },
    parts: [
      { part: 'Gauge-sized semicircular stripping holes', role: 'Slice the outer insulation cylinder cleanly while leaving the copper core untouched.' },
      { part: 'Base shear cutter & return spring', role: 'Trims hook-up wire to length and re-opens the jaws automatically.' },
    ],
    handling: [
      'Insert the wire into the notch matching its AWG size (typically 22 AWG for breadboard jumper wire), close the handles firmly to sever the jacket, and pull the insulation slug off axially.',
      'Strip ~6–8 mm of insulation for solderless breadboards so bare wire reaches the internal spring clip without leaving exposed copper above the deck.',
    ],
    mistakes: [
      'Using a hole one size too small, scoring a ring around the solid copper core so the wire snaps off inside a breadboard socket.',
    ],
    spotInLab: 'Plier-like hand tool with a row of numbered circular holes along the cutting jaws.',
  },

  // 103. Side cutters
  {
    id: 'side-cutters',
    number: 103,
    name: 'Flush side cutters (diagonal micro-nippers)',
    subtitle: 'Electronics · PCB Lead Trimming',
    subject: 'Electronics',
    category: 'Support & Handling',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Trimming excess through-hole component leads flush above soldered PCB pads and cutting fine copper hook-up wire.',
    description:
      'Angled high-carbon steel micro-shears with a flat ground back face that cuts component wires flush without shocking the solder fillet.',
    specs: {
      resolution: '21° angled flush-ground bypass blades',
      range: 'Soft copper wire up to 1.3 mm (16 AWG)',
      zeroError: 'Never cut hard steel piano wire, screws, or paperclips — they dent the soft-copper flush blades',
      material: 'Induction-hardened tool steel + return leaf spring + ESD grips',
    },
    parts: [
      { part: 'Flush-ground flat underside jaw', role: 'Rests right above the solder cone to leave a neat, non-sharp lead stub.' },
      { part: 'Lead-catching clip / finger guard', role: 'Hold the free wire end while cutting so the clipped lead does not fly across the room.' },
    ],
    handling: [
      'Place the flat back face of the jaws facing down toward the solder joint, hold the protruding tip of the wire with your other hand (and wear safety glasses), and squeeze cleanly.',
      'Trim component leads AFTER soldering (or leave 1 mm above the solder meniscus so you do not crack the solder joint).',
    ],
    mistakes: [
      'Clipping component leads without holding the offcut or wearing eye protection, sending sharp wire darts flying.',
      'Cutting steel wire or thick bolts, leaving a permanent notch in the precision flush blades.',
    ],
    spotInLab: 'Compact spring-loaded diagonal nippers with short pointed jaws flat on one side.',
  },

  // 104. Needle-nose pliers
  {
    id: 'needle-nose-pliers',
    number: 104,
    name: 'Long needle-nose pliers (snipe-nose electronics pliers)',
    subtitle: 'Electronics · Component Forming & Heat Sinking',
    subject: 'Electronics',
    category: 'Support & Handling',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Bending resistor and diode leads at clean 90° right angles for breadboard/PCB insertion, holding nuts in tight chassis corners, and clamping sensitive semiconductor leads as a thermal heat-sink during soldering.',
    description:
      'Slender, tapered steel jaws (smooth or finely serrated) on a box-joint pivot with spring-loaded ESD-safe handles.',
    specs: {
      resolution: '1.5 mm fine tapered tip width',
      range: '130 mm – 150 mm overall length',
      zeroError: 'Leave a 2 mm straight section next to the resistor body before bending the lead 90°',
      material: 'Drop-forged chrome-vanadium steel + ESD dissipative grips',
    },
    parts: [
      { part: 'Slender tapered gripping jaws', role: 'Form neat 90° component lead bends and reach deep between tall capacitors.' },
      { part: 'Heat-sink clamping mass', role: 'Clamped between the solder joint and a transistor body to conduct excess heat away.' },
    ],
    handling: [
      'Grip the component lead 2 mm away from the glass or ceramic body before bending so the axial seal does not crack.',
    ],
    mistakes: [
      'Bending a glass diode lead right against the glass body seal without supporting the lead with needle-nose jaws, shattering the diode package.',
    ],
    spotInLab: 'Small electronics pliers with long, narrow pointed jaws tapering to a 1.5 mm tip.',
  },

  // 105. Jumper wires
  {
    id: 'jumper-wires',
    number: 105,
    name: 'Breadboard jumper wires & 4 mm banana patch leads',
    subtitle: 'Electronics · Physics · Circuit Interconnection',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/breadboard-dmm.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Interconnecting nodes on a solderless breadboard (22 AWG Dupont pin jumpers) and wiring bench meters, power supplies, and rheostats (4 mm stackable banana leads).',
    description:
      'Colour-coded flexible silicone or PVC insulated copper leads terminated with moulded 0.64 mm square Dupont pins (for breadboards) or 4 mm sprung lantern banana plugs.',
    specs: {
      resolution: '22 AWG (0.64 mm diameter) solid/pinned · 4 mm stackable banana plugs',
      range: '< 0.05 Ω lead resistance · 30 V / 3 A (Dupont) or 10 A (4 mm banana)',
      zeroError: 'Check continuity with a DMM buzzer if a circuit appears inexplicably open',
      material: 'Tinned OFHC copper conductors + colour-coded PVC/silicone insulation',
    },
    parts: [
      { part: '0.64 mm square/round header pins', role: 'Fit the spring contacts of 2.54 mm pitch solderless breadboards snugly without splaying them.' },
      { part: 'Colour-coded jackets (Red/Black/Yellow/Blue)', role: 'Enforce wiring discipline: Red for +V_CC, Black/Blue for 0 V GND, other colours for signals.' },
    ],
    handling: [
      'Use red jumpers exclusively for positive supply rails, black or blue for 0 V ground, and keep signal jumpers short and flat so the circuit topology is easy to trace.',
      'Grip the moulded plastic pin housing (never pull by the wire cord) when inserting or removing jumpers.',
    ],
    mistakes: [
      'Forcing thick 18 AWG wire or large component lugs into a breadboard hole, permanently springing the internal phosphor-bronze contact clip.',
    ],
    spotInLab: 'Bundle of bright multi-coloured flexible wires ending in black rectangular pin collars or stackable 4 mm plugs.',
  },

  // 106. Logic analyzer
  {
    id: 'logic-analyzer',
    number: 106,
    name: 'Multi-channel digital logic analyzer',
    subtitle: 'Electronics · Digital Systems & Protocol Decoding',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/breadboard-dmm.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Capturing and decoding 8 to 16 simultaneous digital logic channels (TTL / CMOS 0 and 1 states, I²C, SPI, UART, PWM, and counter timing diagrams).',
    description:
      'A high-speed multi-channel digital timing acquisition pod with micro-grabber hook probes, programmable logic voltage thresholds (1.8 V, 3.3 V, 5.0 V), and protocol decoders.',
    specs: {
      resolution: '4 ns – 10 ns timing resolution (100 – 250 MS/s)',
      range: '8 or 16 digital channels · 1.2 V to 5.5 V logic threshold',
      zeroError: 'Always connect the black GND reference clip of the pod to the target circuit 0 V rail',
      material: 'High-speed FPGA sampler pod + colour-coded micro-hook flying leads',
    },
    parts: [
      { part: 'Colour-coded CH0–CH7 flying micro-hooks', role: 'Clip onto IC pins or header posts to sample logic HIGH/LOW states in parallel.' },
      { part: 'Threshold comparator & protocol decoder', role: 'Translates raw clock/data transitions into hex bytes (I²C, SPI, UART).' },
    ],
    handling: [
      'Connect the black GND lead to the circuit ground FIRST, then clip CH0, CH1, etc. onto the clock and data lines.',
      'Select the logic threshold matching your system (e.g., 1.65 V threshold for 3.3 V CMOS logic) and trigger on a falling start-bit or clock edge.',
    ],
    mistakes: [
      'Forgetting to connect the logic analyzer ground lead, resulting in random floating glitch noise across all channels.',
    ],
    spotInLab: 'Compact USB or benchtop pod with a rainbow ribbon cable fanning out into 8 or 16 tiny spring-hook clips.',
  },

  // 107. Spectrum analyzer
  {
    id: 'spectrum-analyzer',
    number: 107,
    name: 'RF / Audio FFT spectrum analyzer',
    subtitle: 'Electronics · Frequency-Domain & Harmonic Analysis',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Measuring signal power (in dBm or dBV) versus frequency f, total harmonic distortion (THD), filter stop-band attenuation, and oscillator purity.',
    description:
      'A swept-tuned superheterodyne or FFT frequency-domain receiver displaying signal amplitude (vertical axis in dBm) against frequency (horizontal axis in Hz/MHz).',
    specs: {
      resolution: '1 Hz – 1 MHz Resolution Bandwidth (RBW) · 0.1 dB amplitude',
      range: '9 kHz – 1.5 GHz (RF) or 20 Hz – 100 kHz (Audio FFT) · –130 dBm to +20 dBm',
      zeroError: 'Never apply DC voltage or > +20 dBm (100 mW) into the 50 Ω RF input without an external attenuator',
      material: '50 Ω precision N-type / BNC RF front end + swept mixer/FFT processor',
    },
    parts: [
      { part: 'Center Frequency, Span & RBW controls', role: 'Zoom the horizontal frequency window and set the filter resolution bandwidth.' },
      { part: '50 Ω RF input & Peak Marker key', role: 'Measures the exact frequency and dBm power of fundamental and harmonic peaks.' },
    ],
    handling: [
      'Verify the maximum power and DC voltage of your signal source with an oscilloscope before connecting to the sensitive 50 Ω spectrum analyzer input (use a DC block and 20 dB inline pad if unsure).',
    ],
    mistakes: [
      'Connecting a high-voltage DC bias or high-power transmitter directly to the 50 Ω RF input mixer, destroying the input attenuator diodes.',
    ],
    spotInLab: 'Screen instrument similar to an oscilloscope but showing sharp vertical spikes (frequency peaks) rising from a grassy noise floor.',
  },

  // 108. LCR meter
  {
    id: 'lcr-meter',
    number: 108,
    name: 'Digital LCR impedance bridge (Inductance · Capacitance · Resistance)',
    subtitle: 'Electronics · Physics · Passive Components',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/breadboard-dmm.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Measuring inductance L (in µH/mH/H), capacitance C (in pF/nF/µF), resistance R, quality factor Q, and dissipation factor D (ESR) at selectable AC test frequencies.',
    description:
      'A 4-wire Kelvin bridge instrument that excites an unknown passive component at 100 Hz, 1 kHz, 10 kHz, or 100 kHz and resolves both the reactive and resistive impedance components.',
    specs: {
      resolution: '0.1 pF · 0.1 µH · 0.001 Ω (0.2% basic accuracy)',
      range: 'Test frequencies 100 Hz, 120 Hz, 1 kHz, 10 kHz, 100 kHz',
      zeroError: 'Perform OPEN and SHORT fixture zero-compensation before measuring small pF or µH parts',
      material: '4-terminal Kelvin guard sockets + SMD tweezer / Kelvin clip leads',
    },
    parts: [
      { part: '4-terminal Kelvin test slots (H_cur, H_pot, L_pot, L_cur)', role: 'Eliminate lead resistance and stray lead inductance from the measurement.' },
      { part: 'Test frequency & Series/Parallel mode selector', role: 'Selects 120 Hz for large electrolytic caps or 10–100 kHz for small RF inductors.' },
    ],
    handling: [
      'ALWAYS discharge any capacitor completely across a bleed resistor before inserting its leads into the LCR meter test slots.',
      'Run the Open/Short calibration when changing test leads or measuring capacitances below 100 pF.',
    ],
    mistakes: [
      'Inserting a charged high-voltage electrolytic capacitor into the LCR bridge, blowing the precision analog front-end.',
    ],
    spotInLab: 'Handheld or bench meter with direct axial component insertion slots labeled + and – and a display reading L, C, R, and Q/D.',
  },

  // 109. Electronic load
  {
    id: 'electronic-load',
    number: 109,
    name: 'Programmable DC electronic load',
    subtitle: 'Electronics · Power Supply & Battery Testing',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/rheostat.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Sinking controlled current or power from batteries, solar cells, and DC power supplies to plot V–I regulation curves, internal resistance r, and mAh discharge capacity.',
    description:
      'A MOSFET-bank active current sink with fan-cooled heatsink that operates in Constant Current (CC), Constant Voltage (CV), Constant Resistance (CR), or Constant Power (CP) mode.',
    specs: {
      resolution: '1 mV · 1 mA · 0.01 W',
      range: '0 – 150 V DC · 0 – 30 A · up to 150 W / 300 W',
      zeroError: 'Use 4-wire remote sense terminals when testing low-voltage cells at high current',
      material: 'Linear power MOSFET array + high-airflow copper-fin heatsink',
    },
    parts: [
      { part: 'CC / CV / CR / CP mode keys & rotary encoder', role: 'Program the exact current I or equivalent load resistance R_L drawn from the source.' },
      { part: 'High-current binding posts & V-sense terminals', role: 'Carry load current while remote sense reads true terminal voltage at the cell.' },
    ],
    handling: [
      'Verify polarity (+ to red, – to black) with the load Input OFF before connecting a battery or solar module — reverse polarity will trip the internal crowbar fuse.',
      'Set the cutoff discharge voltage V_min when running an automated battery capacity (Wh / mAh) test.',
    ],
    mistakes: [
      'Connecting a battery in reverse polarity across the electronic load input posts.',
    ],
    spotInLab: 'Deep benchtop unit with heavy front screw terminals, V/A/W simultaneous display, and a rear cooling fan tunnel.',
  },

  // 110. Frequency counter
  {
    id: 'frequency-counter',
    number: 110,
    name: 'Reciprocal digital frequency & period counter',
    subtitle: 'Electronics · Physics · Oscillators & Timing',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Measuring carrier frequency f, period T, pulse width, duty cycle, and total event counts with 8- to 10-digit crystal-stabilized precision.',
    description:
      'A high-stability TCXO/OCXO gated counter-timer with selectable gate time (0.1 s, 1 s, 10 s), 50 Ω / 1 MΩ input coupling, trigger level control, and a low-pass noise filter.',
    specs: {
      resolution: '8 to 10 digits per second of gate time (0.001 Hz at low frequencies)',
      range: '0.1 Hz – 100 MHz (Ch A 1 MΩ) · 100 MHz – 2.4 GHz (Ch B 50 Ω)',
      zeroError: 'Enable the 100 kHz Low-Pass Filter and 20× attenuator when counting noisy low-frequency audio/mains signals',
      material: 'Oven/temperature-compensated quartz timebase + BNC comparator input',
    },
    parts: [
      { part: 'Gate time selector & 8-digit display', role: 'Trades off measurement update speed against extra decimal digits of frequency resolution.' },
      { part: 'Trigger slope, coupling & attenuator switches', role: 'Prevents false double-counting on noisy or ringing waveform edges.' },
    ],
    handling: [
      'Allow the crystal reference oscillator to warm up for 5–10 minutes for high-precision drift measurements.',
      'If a low-frequency sine wave reads erratically high, switch in the 100 kHz Low-Pass Filter so high-frequency noise on the zero-crossing does not double-trigger the comparator.',
    ],
    mistakes: [
      'Counting a noisy audio wave without the low-pass filter enabled, getting a wildly fluctuating megahertz noise count.',
    ],
    spotInLab: 'Long narrow bench unit dominated by a wide 8- or 10-digit green/amber numeric display and two BNC input jacks.',
  },

  // 111. Signal generator
  {
    id: 'signal-generator',
    number: 111,
    name: 'RF / Audio calibrated signal generator',
    subtitle: 'Electronics · Physics · Communications & Acoustics',
    subject: 'Electronics',
    category: 'Electrical & Circuit',
    file: '/apparatus/voltmeter.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Driving loudspeakers, vibration generators (Melde’s string / Chladni plates), and tuned radio/amplifier stages with a calibrated sine wave and AM/FM modulation.',
    description:
      'A low-distortion sine/square oscillator featuring both a high-power 8 Ω output (for acoustic transducers and vibration generators) and a calibrated 50 Ω / 600 Ω attenuated output.',
    specs: {
      resolution: '0.1 Hz (audio) · 0.1 dB calibrated step attenuator',
      range: '10 Hz – 1 MHz (Audio/Lab) or 100 kHz – 1 GHz (RF)',
      zeroError: 'Start with the amplitude dial at minimum before switching on an attached loudspeaker or vibration generator',
      material: 'Precision Wien-bridge / PLL synthesizer + step attenuator + 8 Ω power stage',
    },
    parts: [
      { part: 'Range multiplier & fine frequency dial', role: 'Sweeps smoothly through mechanical or electrical resonance peaks.' },
      { part: '600 Ω line output & 8 Ω power output', role: '600 Ω feeds oscilloscope/amplifier inputs; 8 Ω drives speakers and vibration generators directly.' },
    ],
    handling: [
      'Connect low-impedance loads (loudspeakers, sonometer drivers) to the 8 Ω power terminals and high-impedance circuits to the 600 Ω / 50 Ω BNC output.',
    ],
    mistakes: [
      'Overdriving a mechanical vibration generator at high amplitude at very low frequency (< 10 Hz), bottoming out its voice coil.',
    ],
    spotInLab: 'Laboratory generator box with a large frequency dial (or digital readout), decade range buttons (×1, ×10, ×100, ×1k), and 4 mm output sockets.',
  },

  // 112. Crimping tool
  {
    id: 'crimping-tool',
    number: 112,
    name: 'Ratcheting terminal crimping tool',
    subtitle: 'Electronics · Engineering · Harness Assembly',
    subject: 'Electronics',
    category: 'Support & Handling',
    file: '/apparatus/dissecting-kit.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Cold-forming gas-tight mechanical and electrical crimps on Dupont header pins, JST connectors, bootlace ferrules, and insulated spade/ring lugs.',
    description:
      'A compound-leverage steel hand tool with interchangeable precision B-crimp / hexagonal dies and a full-cycle ratchet mechanism that will not release until the full crimp compression is reached.',
    specs: {
      resolution: 'Double-barrel die: inner wings grip bare copper, outer wings grip insulation',
      range: '28–18 AWG (Dupont/JST micro-crimp) or 0.5–6.0 mm² (insulated terminals)',
      zeroError: 'Perform a gentle tug test on every crimped terminal to verify mechanical retention',
      material: 'Hardened carbon steel frame + EDM-machined crimping dies + ratchet pawl',
    },
    parts: [
      { part: 'Dual-profile conductor & insulation die cavity', role: 'Folds the front metal tabs into the copper strands and the rear tabs around the PVC jacket for strain relief.' },
      { part: 'Full-cycle ratchet & emergency release lever', role: 'Guarantees consistent cold-weld pressure on every crimp.' },
    ],
    handling: [
      'Strip the wire to the exact length of the terminal’s inner conductor barrel (typically 2.5–3 mm for Dupont pins).',
      'Seat the metal terminal in the matching die nest and squeeze the handles slightly until the ratchet holds it, slide the stripped wire in so the insulation rests under the rear wings, and squeeze completely until the ratchet releases.',
    ],
    mistakes: [
      'Stripping the wire too long so the rear strain-relief wings crimp onto bare copper instead of the insulation jacket, causing the wire to snap at the neck.',
    ],
    spotInLab: 'Heavy plier tool with ratcheting gear teeth near the pivot and W-shaped or colour-dotted die jaws.',
  },

  // 113. PCB holder
  {
    id: 'pcb-holder',
    number: 113,
    name: 'Adjustable PCB holder & helping-hands jig',
    subtitle: 'Electronics · Soldering & Inspection',
    subject: 'Electronics',
    category: 'Support & Handling',
    file: '/apparatus/retort-stand.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Clamping printed circuit boards securely at any 360° flip angle so both hands are free to hold the soldering iron and solder wire.',
    description:
      'A weighted cast-iron base frame carrying spring-loaded V-grooved clamping rails with a 360° indexing rotation lock (or articulated alligator-clip helping-hand arms).',
    specs: {
      resolution: '360°回転 with 15° detent locking positions',
      range: 'Holds PCBs up to 200 × 140 mm (board thicknesses 0.8 – 3.0 mm)',
      zeroError: 'Seat the board edges inside the ESD-safe V-grooves and lock the side thumbscrews before flipping',
      material: 'Weighted steel base + ESD-safe polyacetal V-clamps',
    },
    parts: [
      { part: 'Spring-loaded V-groove side rails', role: 'Grip the fibreglass board edges firmly so you can load components on top and flip 180° to solder underneath.' },
      { part: 'Weighted anti-tip base & rubber feet', role: 'Prevents the board from sliding across the bench when applying the soldering iron.' },
    ],
    handling: [
      'Slide the movable rail open against its spring, seat the PCB edges into the V-grooves away from edge components, and tighten the rotation lock at a comfortable 30°–45° soldering angle.',
    ],
    mistakes: [
      'Soldering a loose circuit board flat on the bench top, scorching the desk and letting the board skate away under the iron tip.',
    ],
    spotInLab: 'Blue/black H-shaped metal frame with sliding grooved jaws that flip a circuit board upside down like a rotisserie.',
  },

  // 114. Magnifying lamp
  {
    id: 'magnifying-lamp',
    number: 114,
    name: 'Illuminated bench magnifying lamp (3D / 5D dioptre)',
    subtitle: 'Electronics · Biology · Fine Inspection',
    subject: 'Electronics',
    category: 'Microscopy & Specimen',
    file: '/apparatus/compound-microscope.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Inspecting solder joints for hairline cracks, solder bridges, and cold joints, reading SMD resistor codes, and performing fine biological dissection.',
    description:
      'A large 125 mm optical crown-glass biconvex lens (3 dioptres = ×1.75 or 5 dioptres = ×2.25) surrounded by a shadow-free circular daylight LED ring mounted on a pantograph spring arm.',
    specs: {
      resolution: '3 Dioptre (×1.75, f = 333 mm) or 5 Dioptre (×2.25, f = 200 mm)',
      range: '800 mm articulated pantograph reach · 6000 K shadow-free ring LED',
      zeroError: 'Close the flip-down dust cover whenever the lamp is near a sunlit window so the lens cannot focus sunlight and start a fire',
      material: 'Optical crown-glass lens + balanced steel pantograph arm',
    },
    parts: [
      { part: '125 mm wide-field dioptre glass lens', role: 'Allows comfortable binocular (two-eyed) depth perception without eye strain.' },
      { part: 'Annular shadow-free LED ring & flip cover', role: 'Illuminates the PCB from 360° so component leads cast no shadows.' },
    ],
    handling: [
      'Position the lens head about 15–20 cm above the circuit board and look through the centre with both eyes open.',
      'Always flip the hinged opaque lens cover shut when finished.',
    ],
    mistakes: [
      'Leaving an uncovered magnifying lens near a sunny laboratory window where focused sunlight can char the bench.',
    ],
    spotInLab: 'Articulated desk-clamp arm holding a big round magnifying glass ringed by bright white LEDs.',
  },

  // 115. ESD mat
  {
    id: 'esd-mat',
    number: 115,
    name: 'Anti-static ESD dissipative bench mat (with ground cord)',
    subtitle: 'Electronics · Electrostatic Discharge Protection',
    subject: 'Electronics',
    category: 'Safety & PPE',
    file: '/apparatus/breadboard-dmm.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Draining electrostatic charges safely to earth (10⁶–10⁹ Ω) so CMOS integrated circuits, MOSFETs, and microcontrollers are not destroyed by static sparks.',
    description:
      'A two-layer heat-resistant nitrile rubber bench mat (static-dissipative top layer over a conductive black bottom layer) fitted with 10 mm press-stud snaps and a 1 MΩ current-limiting earth cord.',
    specs: {
      resolution: 'Surface resistance R_s = 10⁶ – 10⁹ Ω (dissipative, not dead-short conductive)',
      range: 'Withstands soldering iron drops up to 300–400°C without melting',
      zeroError: 'Verify the ground snap cord is clipped to a verified earth terminal (1 MΩ safety resistor built in)',
      material: 'Dual-layer static-dissipative rubber + 10 mm grounding studs',
    },
    parts: [
      { part: 'Dissipative top layer (10⁶–10⁹ Ω)', role: 'Bleeds static charge off components slowly without causing high-current spark discharge.' },
      { part: '10 mm grounding snap & 1 MΩ earth cord', role: 'Bonds the mat and operator wrist strap to earth through a current-limiting 1 MΩ safety resistor.' },
    ],
    handling: [
      'Clip the mat ground cord to the bench earth post (or green GND post of the bench power supply) and snap your ESD wrist strap into the corner stud before opening any anti-static IC bag.',
      'Do not run powered high-voltage bare circuit boards directly on a conductive mat; place an insulating sheet or standoffs under live high-voltage nodes.',
    ],
    mistakes: [
      'Using an ESD mat without plugging its grounding cord into earth (an ungrounded mat floats at whatever static potential you bring to it).',
    ],
    spotInLab: 'Blue or green rubberized work mat covering the electronics bench with metal press-stud snaps in the corners.',
  },

  // 116. ESD wrist strap
  {
    id: 'esd-wrist-strap',
    number: 116,
    name: 'ESD grounding wrist strap (with 1 MΩ safety resistor)',
    subtitle: 'Electronics · CMOS & Microcontroller Handling',
    subject: 'Electronics',
    category: 'Safety & PPE',
    file: '/apparatus/breadboard-dmm.svg',
    practiseTo: '/lab/electronics/ohms-law',
    primaryUses: 'Equalizing the operator’s body electrostatic potential with the grounded ESD bench mat before touching static-sensitive MOSFETs, op-amps, or logic chips.',
    description:
      'An adjustable elastic wristband woven with silver-plated conductive inner threads, connected via a coiled polyurethane cord and a molded 1 MΩ series safety resistor to an earth banana plug/alligator clip.',
    specs: {
      resolution: 'Built-in 1 MΩ ± 10% current-limiting safety resistor (< 0.25 mA at 240 V)',
      range: 'Drains a 3000 V human-body charge to < 100 V in under 0.1 s',
      zeroError: 'Wear snugly against bare wrist skin — never over a shirt sleeve',
      material: 'Silver-nylon conductive weave + 1 MΩ molded resistor coiled cord',
    },
    parts: [
      { part: 'Interior stainless/silver skin contact plate', role: 'Maintains continuous electrical contact with the skin of the wrist.' },
      { part: 'Molded 1 MΩ series resistor in snap head', role: 'Protects the wearer from electric shock if they accidentally touch a live mains conductor.' },
    ],
    handling: [
      'cinch the elastic strap snugly around your bare wrist and plug the banana jack into the grounded ESD mat or earth socket before removing CMOS ICs from their foam/bags.',
    ],
    mistakes: [
      'Making a homemade ground strap out of plain copper wire without the mandatory 1 MΩ series safety resistor (a direct earth wire on your wrist is a lethal shock hazard).',
    ],
    spotInLab: 'Blue elastic wristband with a metal snap button and a curly telephone-style cord ending in a yellow banana plug.',
  },

  // 117. Universal tensile testing machine
  {
    id: 'tensile-testing-machine',
    number: 117,
    name: 'Universal tensile testing machine & extensometer',
    subtitle: 'Engineering · Mechanics of Materials',
    subject: 'Engineering',
    category: 'Measuring & Volumetric',
    file: '/apparatus/dial-gauge.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Plotting the engineering stress–strain curve (σ = F/A₀ vs ε = ΔL/L₀) of steel, aluminium, and polymer dog-bone specimens to find Young’s modulus E, yield strength σ_y, UTS, and percentage elongation at fracture.',
    description:
      'A twin-column ball-screw or hydraulic loading frame with wedge jaws, a calibrated strain-gauge load cell, and a clip-on gauge-length extensometer.',
    specs: {
      resolution: '1 N load resolution · 0.001 mm extensometer extension',
      range: '0 – 50 kN (or 100 kN) tensile/compressive load',
      zeroError: 'Measure original gauge diameter d₀ at three points with a micrometer before loading',
      material: 'High-stiffness steel load frame + self-tightening serrated wedge grips',
    },
    parts: [
      { part: 'Moving crosshead & load cell', role: 'Pulls the specimen at constant strain rate while measuring tensile force F.' },
      { part: 'Clip-on gauge extensometer', role: 'Measures true elastic elongation ΔL directly on the 50 mm gauge section, eliminating grip slippage.' },
    ],
    handling: [
      'Measure the initial diameter d₀ of the specimen gauge length in three places using a micrometer screw gauge and mark the original gauge length L₀ = 5 d₀ with two light punch marks.',
      'Remove the delicate clip-on extensometer just after the yield point before violent necking and fracture occur.',
    ],
    mistakes: [
      'Using total crosshead displacement instead of an extensometer to calculate Young’s modulus E (machine compliance and grip seating make E artificially low).',
    ],
    spotInLab: 'Tall twin-column vertical frame with heavy serrated jaws pulling a waisted metal bar until it necks and snaps with a loud bang.',
  },

  // 118. Gear train rig
  {
    id: 'gear-train-rig',
    number: 118,
    name: 'Spur & compound gear train apparatus',
    subtitle: 'Engineering · Physics · Kinematics & Torque Transmission',
    subject: 'Engineering',
    category: 'Measuring & Volumetric',
    file: '/apparatus/dial-gauge.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Verifying gear velocity ratio VR = N_driven / N_driver, mechanical advantage MA = Load / Effort, torque amplification, and idler-gear direction reversal.',
    description:
      'A slotted steel mounting backboard carrying interchangeable machined brass or Delrin spur gears (20, 40, 60, 80 teeth, module m = 2) on ball-bearing spindles with cord drums and weight hangers.',
    specs: {
      resolution: 'Exact tooth-count ratio N_B / N_A · 0.5° angular protractor',
      range: 'Simple, idler, and compound 2-stage gear ratios from 1:1 to 16:1',
      zeroError: 'Set spindle centre-to-centre distance to (r₁ + r₂) with slight backlash so teeth do not bind',
      material: 'Involute-profile brass/acetal spur gears + ball-bearing stub axles',
    },
    parts: [
      { part: 'Interchangeable involute spur gears (20T–80T)', role: 'Mesh together to step rotational speed down and multiply output torque.' },
      { part: 'Input effort & output load winding drums', role: 'Convert cord tensions into measurable input and output torques τ = F · r.' },
    ],
    handling: [
      'Slide the gear spindles along the mounting slot until the meshing teeth have a tiny perceptible play (backlash) and spin freely without binding.',
      'Notice that an intermediate idler gear reverses the output rotation direction without changing the overall velocity ratio N_last / N_first.',
    ],
    mistakes: [
      'Clamping meshing gear centres too tightly together, causing high tooth friction and falsely low mechanical efficiency η.',
    ],
    spotInLab: 'Vertical metal panel carrying interlocking toothed brass wheels with strings and weight hangers hanging from drums.',
  },

  // 119. Torsion testing apparatus
  {
    id: 'torsion-testing-apparatus',
    number: 119,
    name: 'Torsion of rods apparatus (shear modulus G)',
    subtitle: 'Engineering · Physics · Elasticity & Shear',
    subject: 'Engineering',
    category: 'Measuring & Volumetric',
    file: '/apparatus/dial-gauge.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Verifying the torsion equation T / J = Gθ / L = τ / r and determining the shear modulus (modulus of rigidity G) of steel, brass, and aluminium shafts.',
    description:
      'A rigid horizontal cast-iron bedplate with a fixed tailstock chuck, a ball-bearing torque pulley wheel at the free end, and movable Vernier degree protractors along the test rod.',
    specs: {
      resolution: '0.1° twist angle Vernier · 0.01 mm rod diameter (via micrometer)',
      range: 'Rod lengths L up to 750 mm · diameters d = 3 mm – 6 mm',
      zeroError: 'Because J = πd⁴/32 contains d⁴, measure rod diameter d with a micrometer at 5 points along the shaft',
      material: 'Cast-iron lathe-style bed + 3-jaw collet chucks + degree Vernier drums',
    },
    parts: [
      { part: 'Fixed tailstock chuck & ball-bearing torque wheel', role: 'Clamps one end of the rod while applying a pure torsional couple T = W · R_wheel.' },
      { part: 'Sliding angular Vernier pointers', role: 'Measure twist angle θ in degrees (convert to radians: θ_rad = θ° × π/180) over gauge length L.' },
    ],
    handling: [
      'Measure the test rod diameter d carefully with a micrometer screw gauge (since G ∝ 1/d⁴, a 1% error in d produces a 4% error in G).',
      'Record twist readings during both loading and unloading to verify the shaft remained inside its elastic limit.',
    ],
    mistakes: [
      'Forgetting to convert the angle of twist θ from degrees to RADIANS before substituting into G = (32 T L) / (π d⁴ θ).',
    ],
    spotInLab: 'Long horizontal metal bed clamping a slender metal rod between a fixed chuck and a large grooved pulley wheel with degree scales.',
  },

  // 120. Spirit level
  {
    id: 'spirit-level',
    number: 120,
    name: 'Precision machinist’s spirit level & clinometer',
    subtitle: 'Engineering · Physics · Alignment & Datum Levelling',
    subject: 'Engineering',
    category: 'Measuring & Volumetric',
    file: '/apparatus/metre-rule.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Levelling beam deflection rigs, dynamics tracks, cathetometers, and analytical balances to a true horizontal datum (0.00°).',
    description:
      'A precision-ground cast-iron or anodized box beam housing barrel-shaped glass vials filled with low-viscosity dyed alcohol and a gas bubble between two etched Hairline index rings.',
    specs: {
      resolution: '0.02 mm/m (≈ 4 arc-seconds) machinist grade · 0.5 mm/m bench grade',
      range: 'Horizontal (0°), vertical plumb (90°), and 45° vials',
      zeroError: 'Check level calibration by reversing it 180° end-for-end on the same surface — the bubble should stay centred',
      material: 'Precision-ground V-grooved base + internal barrel-ground glass vial',
    },
    parts: [
      { part: 'Barrel-ground alcohol vial & twin index rings', role: 'Bubble rises to the highest point of the slightly curved glass arc; centred between the two lines = horizontal.' },
      { part: 'V-grooved machined base', role: 'Seats squarely on cylindrical shafts and pipes as well as flat beams.' },
    ],
    handling: [
      'Wipe grit off the beam surface, place the spirit level along the axis, and check it again after rotating 180° end-for-end to rule out vial zero error.',
    ],
    mistakes: [
      'Viewing the bubble from a steep side angle instead of directly from above, misjudging which index hairline the bubble meniscus touches.',
    ],
    spotInLab: 'Heavy machined metal bar with a glowing yellow-green liquid window and an air bubble trapped between two black lines.',
  },

  // 121. Bourdon tube pressure gauge
  {
    id: 'bourdon-pressure-gauge',
    number: 121,
    name: 'Bourdon tube dial pressure gauge (kPa / bar / psi)',
    subtitle: 'Engineering · Physics · Fluid & Thermodynamics',
    subject: 'Engineering',
    category: 'Measuring & Volumetric',
    file: '/apparatus/dial-gauge.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Measuring static fluid and gas gauge pressure above atmospheric pressure in hydraulic lines, autoclaves, Boyle’s law rigs, and pump test beds.',
    description:
      'A C-shaped flattened phosphor-bronze or stainless-steel tube closed at one tip that tends to uncurl when internal pressure exceeds ambient pressure, driving a sector gear and pointer.',
    specs: {
      resolution: '2 kPa / 0.02 bar minor divisions (Class 1.0 accuracy)',
      range: '0 – 100 kPa, 0 – 600 kPa (6 bar), or –100 to +300 kPa compound',
      zeroError: 'Remember a Bourdon gauge reads GAUGE pressure P_g; add atmospheric pressure P_atm for absolute pressure P_abs = P_g + P_atm',
      material: 'Phosphor-bronze C-tube + brass pinion movement + glycerine damping',
    },
    parts: [
      { part: 'Elliptical C-shaped Bourdon tube (internal)', role: 'Straightens slightly under internal fluid pressure.' },
      { part: 'Sector gear, hairspring & dial pointer', role: 'Amplifies the millimeter tip travel into a 270° circular dial sweep.' },
    ],
    handling: [
      'Open pressurized supply valves slowly so water hammer does not slam the pointer against the full-scale stop pin.',
      'When applying the ideal gas law PV = nRT or Boyle’s law P₁V₁ = P₂V₂, convert gauge pressure to absolute pressure by adding P_atm (≈ 101.3 kPa).',
    ],
    mistakes: [
      'Substituting raw Bourdon gauge pressure P_g directly into Boyle’s law instead of absolute pressure P_abs = P_g + P_atm.',
    ],
    spotInLab: 'Circular brass-threaded dial gauge mounted on a pipe tee or air cylinder with dual bar and psi scales.',
  },

  // 122. Flywheel moment of inertia apparatus
  {
    id: 'flywheel-apparatus',
    number: 122,
    name: 'Flywheel rotational inertia apparatus',
    subtitle: 'Engineering · Physics · Rotational Dynamics',
    subject: 'Engineering',
    category: 'Measuring & Volumetric',
    file: '/apparatus/dial-gauge.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Determining the moment of inertia I of a heavy cast-iron flywheel by converting gravitational potential energy mgh of a falling mass into translational ½mv² + rotational ½Iω² + bearing friction.',
    description:
      'A heavy machined cast-iron disc wheel mounted on a horizontal ball-bearing axle with a small projecting peg onto which a cord carrying a slotted mass hanger is wound.',
    specs: {
      resolution: 'Axle diameter d to 0.01 cm · fall time t to 0.01 s · revolutions n₂ to 0.1 rev',
      range: 'Wheel mass 5 – 15 kg · diameter 15 – 25 cm',
      zeroError: 'Loop the cord slip-knot over the axle peg so it detaches automatically the instant the mass hits the floor',
      material: 'Turned cast-iron flywheel disc + low-friction ball-bearing journals',
    },
    parts: [
      { part: 'Heavy cast-iron flywheel rim', role: 'Stores rotational kinetic energy ½Iω².' },
      { part: 'Axle winding peg & chalk reference mark', role: 'Releases the cord cleanly at height h = 0 and lets you count coasting revolutions n₂.' },
    ],
    handling: [
      'Adjust the cord length so the loop slips off the axle peg at the exact instant the falling mass touches the floor (after n₁ windings of height h).',
      'Time the fall duration t for the n₁ windings, and simultaneously count the number of revolutions n₂ the flywheel coasts before coming to rest.',
    ],
    mistakes: [
      'Using a permanent knot on the axle so the falling mass rebounds and gets wound back up the opposite way.',
    ],
    spotInLab: 'Heavy grey iron wheel mounted on horizontal wall brackets with a thin cord wrapped around its projecting steel shaft.',
  },

  // 123. Searle's Young's modulus apparatus
  {
    id: 'searles-apparatus',
    number: 123,
    name: 'Searle’s two-wire Young’s modulus apparatus',
    subtitle: 'Engineering · Physics · Elasticity of Wires',
    subject: 'Engineering',
    category: 'Measuring & Volumetric',
    file: '/apparatus/micrometer.svg',
    practiseTo: '/lab/engineering/beam',
    primaryUses: 'Measuring the sub-millimetre elastic extension e of a long steel or brass test wire under tensile load M to determine Young’s modulus E = (F · L) / (A · e).',
    description:
      'Two parallel rectangular metal frames suspended from an overhead beam by an identical reference wire (compensating for thermal expansion and ceiling sag) and the test wire, bridged by a sensitive spirit level driven by a 0.01 mm vertical micrometer screw.',
    specs: {
      resolution: '0.01 mm extension micrometer + spirit-level null detector',
      range: '0 – 25 mm extension · wire lengths L = 1.5 – 2.5 m',
      zeroError: 'Hang a 1 kg dead-weight on BOTH wires first to pull out all kinks before taking the zero micrometer reading',
      material: 'Twin brass/steel comparison frames + 0.01 mm pitch micrometer + spirit level',
    },
    parts: [
      { part: 'Identical reference & test wires', role: 'Cancel out room temperature expansion and ceiling beam deflection automatically.' },
      { part: 'Bridging spirit level & vertical micrometer', role: 'Restores the spirit bubble to centre after each added load; micrometer difference = extension e.' },
    ],
    handling: [
      'Pre-tension both wires with a 1 kg dead load to straighten any bends, and measure the wire diameter d at 5 points with a micrometer screw gauge (A = πd²/4).',
      'After adding each 0.5 kg slotted mass, turn the vertical micrometer until the spirit-level bubble returns to its centre mark, and repeat during unloading.',
    ],
    mistakes: [
      'Taking readings on a kinked wire without applying an initial straightening dead-weight.',
    ],
    spotInLab: 'Pair of small brass frames hanging side-by-side from two long ceiling wires, linked by a tiny spirit level and vertical micrometer.',
  },
];
