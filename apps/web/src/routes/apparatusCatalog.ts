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
    file: '/apparatus/analogue-meter.svg',
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
    file: '/apparatus/analogue-meter.svg',
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
    file: '/apparatus/analogue-meter.svg',
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
    file: '/apparatus/analogue-meter.svg',
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
];
