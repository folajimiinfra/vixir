import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { RotateCcw, RotateCw, Compass } from 'lucide-react';
import { LabLayout } from '../../lab-shell/LabLayout';

type MaterialKey = 'steel' | 'brass' | 'aluminium';
type SpanM = 1.0 | 0.8 | 0.6;
type RigView = 'isometric' | 'elevation';

interface BeamRow {
  id: number;
  masses: number;
  loadN: number;
  deltaLoad: number;
  deltaUnload: number | null;
  meanMm: number;
}

const MATERIALS: Record<
  MaterialKey,
  {
    label: string;
    eGPa: number;
    slopePerN: number;
    beamColors: { top: string; front: string; side: string };
  }
> = {
  steel: {
    label: 'Mild steel',
    eGPa: 200,
    slopePerN: 0.2315,
    beamColors: { top: '#CBD5E1', front: '#64748B', side: '#94A3B8' },
  },
  brass: {
    label: 'Brass',
    eGPa: 105,
    slopePerN: 0.441,
    beamColors: { top: '#FDE68A', front: '#B45309', side: '#D97706' },
  },
  aluminium: {
    label: 'Aluminium',
    eGPa: 70,
    slopePerN: 0.661,
    beamColors: { top: '#E2E8F0', front: '#94A3B8', side: '#CBD5E1' },
  },
};

const INITIAL_ROWS: BeamRow[] = [];

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Box3D {
  id: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  colors: { top: string; front: string; side: string };
}

interface Poly2D {
  key: string;
  points: string;
  fill: string;
  depth: number;
}

export function BeamLab() {
  const navigate = useNavigate();
  const [material, setMaterial] = useState<MaterialKey>('steel');
  const [span, setSpan] = useState<SpanM>(1.0);
  const [view, setView] = useState<RigView>('isometric');
  const [showLabels, setShowLabels] = useState(true);
  const [masses, setMasses] = useState(4); // 4 × 100 g
  const [phase, setPhase] = useState<'loading' | 'unloading'>('loading');
  const [zeroOffset, setZeroOffset] = useState(0.0);
  const [plungerStuckOffset, setPlungerStuckOffset] = useState(0.0);
  const [rows, setRows] = useState<BeamRow[]>(INITIAL_ROWS);
  const [logMsg, setLogMsg] = useState(
    'log > Gauge zeroed with empty hanger. Loading in 100 g steps.'
  );

  // Vix Live Tutorial Sandbox Mode (analogous Aluminium/Brass beam at 0.800 m so student's real steel bench is untouched)
  const [tutorialSandbox, setTutorialSandbox] = useState<{
    title: string;
    note: string;
  } | null>(null);
  const [demoRows, setDemoRows] = useState<BeamRow[]>([]);
  const savedRealBeamRef = useRef<{
    material: MaterialKey;
    span: SpanM;
    masses: number;
    phase: 'loading' | 'unloading';
    zeroOffset: number;
    view: RigView;
  } | null>(null);

  const activeRows = tutorialSandbox ? demoRows : rows;

  // Interactive 3D Orbit Camera State (default yaw=30°, pitch=30° matches D7-engineering-beam-rig-isometric.svg)
  const [yawDeg, setYawDeg] = useState(30);
  const [pitchDeg, setPitchDeg] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(
    null
  );

  const matInfo = MATERIALS[material];
  const loadN = Number((masses * 0.98).toFixed(2));
  const spanFactor = Math.pow(span / 1.0, 3);
  const rawDeflection = loadN * matInfo.slopePerN * spanFactor;
  const gaugeReading = Math.max(
    0,
    Number((rawDeflection + zeroOffset + plungerStuckOffset).toFixed(2))
  );

  const handleAdjustMass = (delta: number) => {
    const next = Math.max(0, Math.min(10, masses + delta));
    if (next === masses) return;
    setMasses(next);
    setPlungerStuckOffset(delta > 0 ? -0.01 : 0.01);
    setLogMsg(
      `log > ${delta > 0 ? 'Added' : 'Removed'} 100 g mass. Load on hanger: ${next} × 100 g (W = ${(next * 0.98).toFixed(2)} N).`
    );
  };

  const handleTapBench = () => {
    setPlungerStuckOffset(0);
    setLogMsg('log > Bench tapped — dial gauge plunger settled freely.');
  };

  const handleZeroGauge = () => {
    setZeroOffset(-rawDeflection);
    setPlungerStuckOffset(0);
    setLogMsg('log > Dial gauge bezel rotated to zero (0.00 mm).');
  };

  const handleRecordDeflection = () => {
    const updater = (prev: BeamRow[]) => {
      const existing = prev.find((r) => r.masses === masses);
      if (existing) {
        return prev.map((r) => {
          if (r.masses !== masses) return r;
          const nextLoad = phase === 'loading' ? gaugeReading : r.deltaLoad;
          const nextUnload = phase === 'unloading' ? gaugeReading : r.deltaUnload;
          const mean =
            nextUnload !== null
              ? Number(((nextLoad + nextUnload) / 2).toFixed(3))
              : nextLoad;
          return {
            ...r,
            deltaLoad: nextLoad,
            deltaUnload: nextUnload,
            meanMm: mean,
          };
        });
      }
      return [
        ...prev,
        {
          id: prev.length + 1,
          masses,
          loadN,
          deltaLoad: gaugeReading,
          deltaUnload: phase === 'unloading' ? gaugeReading : null,
          meanMm: gaugeReading,
        },
      ].sort((a, b) => a.masses - b.masses);
    };
    if (tutorialSandbox) {
      setDemoRows(updater);
    } else {
      setRows(updater);
    }
    setLogMsg(
      `log > ${tutorialSandbox ? '[Vix Demo] ' : ''}Recorded ${phase} deflection at W = ${loadN.toFixed(2)} N: δ = ${gaugeReading.toFixed(2)} mm.`
    );
  };

  const exitBeamTutorialSandbox = () => {
    const saved = savedRealBeamRef.current;
    savedRealBeamRef.current = null;
    setTutorialSandbox(null);
    setDemoRows([]);
    if (saved) {
      setMaterial(saved.material);
      setSpan(saved.span);
      setMasses(saved.masses);
      setPhase(saved.phase);
      setZeroOffset(saved.zeroOffset);
      setView(saved.view);
    }
    setPlungerStuckOffset(0);
    setLogMsg('log > Exited Tutorial Sandbox and restored your real Mild Steel beam rig & readings.');
  };

  // Listen for Vix Live Bench Control RPCs so Vix can run a full step-by-step Beam Deflection tutorial live!
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onBenchControl = (ev: Event) => {
      const detail = (ev as CustomEvent<{ action: string; params?: Record<string, unknown> }>).detail;
      if (!detail?.action) return;
      const { action, params = {} } = detail;

      if (action === 'start_tutorial_sandbox') {
        if (!savedRealBeamRef.current) {
          savedRealBeamRef.current = { material, span, masses, phase, zeroOffset, view };
        }
        setTutorialSandbox({
          title: String(params.scenarioTitle || 'Tutorial Demo: Aluminium Beam (E = 70 GPa, L = 0.800 m)'),
          note: String(
            params.analogNote ||
              'Using an analogous Aluminium beam at 0.800 m span so your Mild Steel practical readings stay untouched.'
          ),
        });
        setDemoRows([]);
        setMaterial('aluminium');
        setSpan(0.8);
        setMasses(0);
        setPhase('loading');
        setZeroOffset(0);
        setPlungerStuckOffset(0);
        setLogMsg('log > [Vix Tutorial Sandbox] Loaded analogous Aluminium beam (0.800 m) with empty hanger.');
      } else if (action === 'set_material') {
        const m = String(params.material || params.value || 'aluminium').toLowerCase();
        const nextMat: MaterialKey =
          m.includes('brass') ? 'brass' : m.includes('steel') ? 'steel' : 'aluminium';
        setMaterial(nextMat);
        setZeroOffset(0);
        setLogMsg(`log > [Vix Demo] Switched test beam to ${MATERIALS[nextMat].label}.`);
      } else if (action === 'set_span') {
        const v = Number(params.value);
        const nextSpan: SpanM = v <= 0.65 ? 0.6 : v <= 0.85 ? 0.8 : 1.0;
        setSpan(nextSpan);
        setLogMsg(`log > [Vix Demo] Set knife-edge span L = ${nextSpan.toFixed(3)} m.`);
      } else if (action === 'zero_gauge') {
        handleZeroGauge();
      } else if (action === 'set_masses') {
        const next = Math.max(0, Math.min(10, Math.round(Number(params.value) || 0)));
        setMasses(next);
        setPlungerStuckOffset(next > masses ? -0.01 : 0.01);
        setLogMsg(`log > [Vix Demo] Placed ${next} × 100 g on hanger (W = ${(next * 0.98).toFixed(2)} N).`);
      } else if (action === 'add_mass') {
        handleAdjustMass(Math.max(1, Math.round(Number(params.value) || 1)));
      } else if (action === 'remove_mass') {
        handleAdjustMass(-Math.max(1, Math.round(Number(params.value) || 1)));
      } else if (action === 'tap_bench') {
        handleTapBench();
      } else if (action === 'set_phase') {
        const p = String(params.phase || params.value || 'loading').toLowerCase();
        const nextPhase: 'loading' | 'unloading' = p.includes('unload') ? 'unloading' : 'loading';
        setPhase(nextPhase);
        setLogMsg(`log > [Vix Demo] Switched to ${nextPhase} phase.`);
      } else if (action === 'set_view') {
        const vw = String(params.view || params.value || 'isometric').toLowerCase();
        setView(vw.includes('elev') || vw.includes('front') ? 'elevation' : 'isometric');
      } else if (action === 'record_demo_trial' || action === 'record_deflection') {
        handleRecordDeflection();
      } else if (action === 'end_tutorial_sandbox') {
        exitBeamTutorialSandbox();
      }
    };

    window.addEventListener('vix:bench-control', onBenchControl);
    return () => window.removeEventListener('vix:bench-control', onBenchControl);
  });

  // Pointer drag handlers for 3D orbit rotation
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      yaw: yawDeg,
      pitch: pitchDeg,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const nextYaw = ((dragStartRef.current.yaw - dx * 0.45 + 540) % 360) - 180;
    const nextPitch = Math.max(8, Math.min(78, dragStartRef.current.pitch + dy * 0.35));
    setYawDeg(Math.round(nextYaw));
    setPitchDeg(Math.round(nextPitch));
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  // Dial needle angle: 1.00 mm = full 360° revolution (0 at top -90°)
  const dialAngleRad = ((gaugeReading * 360 - 90) * Math.PI) / 180;
  const visualSag = Math.min(26, gaugeReading * 16);

  // --- 3D Isometric / Orbit Projection Engine ---
  const yawRad = (yawDeg * Math.PI) / 180;
  const pitchRad = (pitchDeg * Math.PI) / 180;
  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);
  const cosP = Math.cos(pitchRad);
  const sinP = Math.sin(pitchRad);

  const project3D = (p: Vec3) => {
    // At yaw=30, pitch=30: +x goes down-right, +y goes down-left (front), +z goes up
    const rx = p.x * cosY - p.y * sinY;
    const ry = p.x * sinY + p.y * cosY;
    const sx = 390 + rx;
    const sy = 325 + ry * sinP - p.z * cosP;
    const depth = ry * cosP + p.z * sinP;
    return { sx, sy, depth };
  };

  // Construct 3D Boxes for the Rig
  const halfSpanPx = span === 1.0 ? 210 : span === 0.8 ? 168 : 126;
  const boxes: Box3D[] = [
    // 1. Rigid base frame plate
    {
      id: 'base-plate',
      x0: -265,
      x1: 265,
      y0: -62,
      y1: 62,
      z0: 0,
      z1: 18,
      colors: { top: '#5B6B8C', front: '#34425F', side: '#45557A' },
    },
    // 2. Back guide rail
    {
      id: 'rail-back',
      x0: -265,
      x1: 265,
      y0: -48,
      y1: -32,
      z0: 18,
      z1: 30,
      colors: { top: '#4B5563', front: '#1F2937', side: '#374151' },
    },
    // 3. Front guide rail
    {
      id: 'rail-front',
      x0: -265,
      x1: 265,
      y0: 26,
      y1: 42,
      z0: 18,
      z1: 30,
      colors: { top: '#4B5563', front: '#1F2937', side: '#374151' },
    },
    // 4. Magnetic stand base block
    {
      id: 'mag-base',
      x0: -25,
      x1: 25,
      y0: -30,
      y1: -2,
      z0: 18,
      z1: 46,
      colors: { top: '#4B5563', front: '#1F2937', side: '#374151' },
    },
    // 5. Magnetic stand vertical pillar
    {
      id: 'mag-post',
      x0: -4,
      x1: 4,
      y0: -20,
      y1: -12,
      z0: 46,
      z1: 214,
      colors: { top: '#94A3B8', front: '#475569', side: '#64748B' },
    },
    // 6. Magnetic stand upper horizontal arm
    {
      id: 'mag-arm',
      x0: -5,
      x1: 5,
      y0: -22,
      y1: 18,
      z0: 194,
      z1: 204,
      colors: { top: '#94A3B8', front: '#475569', side: '#64748B' },
    },
    // 7. Dial gauge plunger rod
    {
      id: 'plunger',
      x0: -2.5,
      x1: 2.5,
      y0: 8,
      y1: 13,
      z0: 130 - visualSag,
      z1: 194,
      colors: { top: '#E2E8F0', front: '#94A3B8', side: '#CBD5E1' },
    },
    // 8. Left knife-edge support pillar
    {
      id: 'support-left',
      x0: -halfSpanPx - 12,
      x1: -halfSpanPx + 12,
      y0: -10,
      y1: 30,
      z0: 30,
      z1: 122,
      colors: { top: '#94A3B8', front: '#475569', side: '#64748B' },
    },
    // 9. Right knife-edge support pillar
    {
      id: 'support-right',
      x0: halfSpanPx - 12,
      x1: halfSpanPx + 12,
      y0: -10,
      y1: 30,
      z0: 30,
      z1: 122,
      colors: { top: '#94A3B8', front: '#475569', side: '#64748B' },
    },
  ];

  // 10. Segmented deflected test beam (20 segments along X)
  const numBeamSegs = 20;
  const beamHalfLen = 240;
  const segLen = (beamHalfLen * 2) / numBeamSegs;
  for (let i = 0; i < numBeamSegs; i++) {
    const sx0 = -beamHalfLen + i * segLen;
    const sx1 = sx0 + segLen;
    const xm = (sx0 + sx1) / 2;
    const norm = Math.min(1, Math.abs(xm) / halfSpanPx);
    const sag = Math.abs(xm) <= halfSpanPx ? visualSag * (1 - norm * norm) : 0;
    boxes.push({
      id: `beam-seg-${i}`,
      x0: sx0,
      x1: sx1,
      y0: -6,
      y1: 26,
      z0: 122 - sag,
      z1: 130 - sag,
      colors: matInfo.beamColors,
    });
  }

  // 11. Mid-span load hanger base & slotted masses stack
  const hangerBaseZ = 52 - visualSag;
  boxes.push({
    id: 'hanger-rod',
    x0: -2,
    x1: 2,
    y0: 8,
    y1: 12,
    z0: hangerBaseZ,
    z1: 124 - visualSag,
    colors: { top: '#E2E8F0', front: '#94A3B8', side: '#CBD5E1' },
  });
  boxes.push({
    id: 'hanger-plate',
    x0: -22,
    x1: 22,
    y0: -8,
    y1: 28,
    z0: hangerBaseZ,
    z1: hangerBaseZ + 4,
    colors: { top: '#94A3B8', front: '#475569', side: '#64748B' },
  });

  for (let m = 0; m < masses; m++) {
    const mz0 = hangerBaseZ + 5 + m * 5.5;
    boxes.push({
      id: `mass-${m}`,
      x0: -20,
      x1: 20,
      y0: -6,
      y1: 26,
      z0: mz0,
      z1: mz0 + 4.5,
      colors: { top: '#CBD5E1', front: '#64748B', side: '#94A3B8' },
    });
  }

  // Convert each 3D box into 6 faces, cull back-facing faces, and sort by depth
  const polys: Poly2D[] = [];
  for (const b of boxes) {
    const { x0, x1, y0, y1, z0, z1, colors } = b;
    const faces: { name: string; verts: Vec3[]; fill: string }[] = [
      {
        name: 'top',
        verts: [
          { x: x0, y: y0, z: z1 },
          { x: x1, y: y0, z: z1 },
          { x: x1, y: y1, z: z1 },
          { x: x0, y: y1, z: z1 },
        ],
        fill: colors.top,
      },
      {
        name: 'bottom',
        verts: [
          { x: x0, y: y0, z: z0 },
          { x: x0, y: y1, z: z0 },
          { x: x1, y: y1, z: z0 },
          { x: x1, y: y0, z: z0 },
        ],
        fill: colors.front,
      },
      {
        name: 'frontY1',
        verts: [
          { x: x0, y: y1, z: z0 },
          { x: x1, y: y1, z: z0 },
          { x: x1, y: y1, z: z1 },
          { x: x0, y: y1, z: z1 },
        ],
        fill: colors.front,
      },
      {
        name: 'backY0',
        verts: [
          { x: x1, y: y0, z: z0 },
          { x: x0, y: y0, z: z0 },
          { x: x0, y: y0, z: z1 },
          { x: x1, y: y0, z: z1 },
        ],
        fill: colors.front,
      },
      {
        name: 'rightX1',
        verts: [
          { x: x1, y: y1, z: z0 },
          { x: x1, y: y0, z: z0 },
          { x: x1, y: y0, z: z1 },
          { x: x1, y: y1, z: z1 },
        ],
        fill: colors.side,
      },
      {
        name: 'leftX0',
        verts: [
          { x: x0, y: y0, z: z0 },
          { x: x0, y: y1, z: z0 },
          { x: x0, y: y1, z: z1 },
          { x: x0, y: y0, z: z1 },
        ],
        fill: colors.side,
      },
    ];

    // Determine visible faces from view vector
    for (const f of faces) {
      if (f.name === 'bottom') continue;
      if (f.name === 'frontY1' && cosY < 0) continue;
      if (f.name === 'backY0' && cosY >= 0) continue;
      if (f.name === 'rightX1' && sinY < 0) continue;
      if (f.name === 'leftX0' && sinY >= 0) continue;

      const projected = f.verts.map(project3D);
      const avgDepth =
        projected.reduce((sum, pt) => sum + pt.depth, 0) / projected.length;
      const pts = projected
        .map((pt) => `${pt.sx.toFixed(1)},${pt.sy.toFixed(1)}`)
        .join(' ');
      polys.push({
        key: `${b.id}-${f.name}`,
        points: pts,
        fill: f.fill,
        depth: avgDepth,
      });
    }
  }

  polys.sort((a, b) => a.depth - b.depth);

  // Projected 3D anchor points for dial gauge and purple labels
  const dialCenter = project3D({ x: 25, y: 18, z: 204 });
  const anchorLeftSupport = project3D({ x: -halfSpanPx, y: 10, z: 120 });
  const anchorRightSupport = project3D({ x: halfSpanPx, y: 10, z: 120 });
  const anchorBeam = project3D({ x: -95, y: 10, z: 128 });
  const anchorMagStand = project3D({ x: 0, y: -16, z: 150 });
  const anchorPlunger = project3D({ x: 0, y: 12, z: 165 });
  const anchorBase = project3D({ x: -180, y: 60, z: 10 });
  const anchorHanger = project3D({ x: 0, y: 26, z: hangerBaseZ + 2 });
  const anchorMasses = project3D({ x: 18, y: 16, z: hangerBaseZ + 14 });

  return (
    <LabLayout
      experimentTitle="Deflection of a simply supported beam"
      subtitle="Graded · find Young’s modulus E of the beam · autosaved"
      activeLab="engineering"
      mode="graded"
      headerRightExtra={
        <span className="hidden md:inline-block px-3 py-1 rounded-full bg-[#121A2B] border border-[#22304A] font-mono text-xs text-[#C9D3E6]">
          Beam 25 × 6 mm · I = 4.5 × 10⁻¹⁰ m⁴
        </span>
      }
      nextStepLabel="Analyse →"
      onNextStep={() => navigate('/attempt/demo/results')}
      toolRail={[
        { id: 'pointer', label: 'Interact / drag to rotate', icon: 'pointer', active: true },
        { id: 'ruler', label: 'Span scale', icon: 'ruler' },
        { id: 'gauge', label: 'Dial gauge', icon: 'gauge' },
        { id: 'alert', label: 'Support check', icon: 'alert' },
        { id: 'note', label: 'Lab notebook', icon: 'note' },
      ]}
      toolRailAccent="bg-[#291A42] text-[#D8B4FE]"
      leftTray={
        <div className="flex flex-col justify-between h-full gap-4">
          <div className="space-y-3">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8]">
              RIG SETUP
            </div>

            <div>
              <label htmlFor="beam-material" className="block text-[11px] text-[#93A0B8] mb-1">
                Beam material
              </label>
              <select
                id="beam-material"
                value={material}
                onChange={(e) => setMaterial(e.target.value as MaterialKey)}
                className="w-full bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2 text-xs text-[#E6EBF5]"
              >
                <option value="steel">Mild steel</option>
                <option value="brass">Brass</option>
                <option value="aluminium">Aluminium</option>
              </select>
            </div>

            <div>
              <label htmlFor="beam-span" className="block text-[11px] text-[#93A0B8] mb-1">
                Span between knife edges
              </label>
              <select
                id="beam-span"
                value={span}
                onChange={(e) => setSpan(Number(e.target.value) as SpanM)}
                className="w-full bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2 text-xs font-mono text-[#E6EBF5]"
              >
                <option value={1.0}>1.000 m</option>
                <option value={0.8}>0.800 m</option>
                <option value={0.6}>0.600 m</option>
              </select>
            </div>

            {[
              { name: 'Dial gauge', sub: '0.01 mm per division · 10 mm travel' },
              {
                name: 'Load hanger + slotted masses',
                sub: 'hanger 0 g (tared) · 10 × 100 g',
              },
              { name: 'Knife-edge supports', sub: 'simply supported' },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-[#121A2B] border border-[#22304A] rounded-xl px-3 py-2.5"
              >
                <div className="text-xs font-semibold text-[#E6EBF5]">{item.name}</div>
                <div className="text-[11px] text-[#93A0B8] mt-0.5 leading-snug">{item.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3 text-[11px] text-[#93A0B8] leading-relaxed">
            Beam is shown with deflection magnified ×6 so the shape is visible. Drag on the bench
            to rotate 360°.
          </div>
        </div>
      }
      bottomDock={
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          {/* Load controls */}
          <div className="md:col-span-5 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between space-y-2.5">
            <div className="text-xs text-[#93A0B8]">
              Load on hanger:{' '}
              <strong className="font-mono text-[#E6EBF5]">{masses} × 100 g</strong>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleAdjustMass(-1)}
                className="py-2 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] font-mono text-xs font-semibold text-[#E6EBF5] transition-colors cursor-pointer"
              >
                – 100 g
              </button>
              <button
                type="button"
                onClick={() => handleAdjustMass(1)}
                className="py-2 rounded-lg bg-[#C084FC] hover:bg-[#A855F7] font-mono text-xs font-bold text-[#0B1220] transition-colors cursor-pointer"
              >
                + 100 g
              </button>
              <button
                type="button"
                onClick={handleZeroGauge}
                className="py-2 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors cursor-pointer"
              >
                Zero gauge
              </button>
            </div>

            <button
              type="button"
              onClick={handleTapBench}
              className="w-full py-2 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors cursor-pointer"
            >
              Tap the bench (frees sticking plunger)
            </button>
          </div>

          {/* Gauge readout */}
          <div className="md:col-span-4 bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-xs text-[#93A0B8]">Gauge (practice readout)</div>
            <div className="font-mono text-3xl font-semibold text-[#D8B4FE] my-1">
              {gaugeReading.toFixed(2)} mm
            </div>
            <div className="text-xs text-[#93A0B8]">graded mode: read the dial</div>
          </div>

          {/* Record & phase toggle */}
          <div className="md:col-span-3 flex flex-col justify-between gap-2">
            <button
              type="button"
              onClick={handleRecordDeflection}
              className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Record deflection
            </button>
            <button
              type="button"
              onClick={() => {
                const nextPhase = phase === 'loading' ? 'unloading' : 'loading';
                setPhase(nextPhase);
                setLogMsg(`log > Switched to ${nextPhase} phase.`);
              }}
              className="w-full py-3 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors cursor-pointer"
            >
              Switch to {phase === 'loading' ? 'unloading' : 'loading'}
            </button>
          </div>
        </div>
      }
      logMessage={logMsg}
      rightPanel={
        <div className="space-y-3.5">
          <div>
            <h2 className="font-display text-sm font-bold text-[#E6EBF5] mb-2">
              {tutorialSandbox ? 'Demo Load–deflection table' : 'Load–deflection table'}
            </h2>
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1E2A42] text-[#93A0B8] text-[11px]">
                    <th className="py-2 px-2.5 text-left">W/N</th>
                    <th className="py-2 px-2 text-right">δ load</th>
                    <th className="py-2 px-2 text-right">δ unload</th>
                    <th className="py-2 px-2.5 text-right">mean/mm</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[#1E2A42]/60 last:border-b-0 text-[#E6EBF5]"
                    >
                      <td className="py-1.5 px-2.5">{r.loadN.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right">{r.deltaLoad.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right text-[#93A0B8]">
                        {r.deltaUnload !== null ? r.deltaUnload.toFixed(2) : '—'}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-[#D8B4FE]">
                        {r.meanMm.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live preview chart */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-xs text-[#93A0B8] mb-2">Live preview · δ against W</div>
            <svg viewBox="0 0 260 140" className="w-full h-auto">
              <line x1="35" y1="15" x2="35" y2="115" stroke="#3A4A68" strokeWidth="1" />
              <line x1="35" y1="115" x2="240" y2="115" stroke="#3A4A68" strokeWidth="1" />
              <line
                x1="35"
                y1="115"
                x2="238"
                y2="68"
                stroke="#C084FC"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              {activeRows.map((r) => {
                const cx = 35 + (r.loadN / 10) * 200;
                const cy = 115 - Math.min(95, (r.meanMm / 3.5) * 95);
                return (
                  <circle
                    key={r.id}
                    cx={cx}
                    cy={cy}
                    r="3.5"
                    fill={tutorialSandbox ? '#38BDF8' : '#D8B4FE'}
                  />
                );
              })}
              <text
                x="138"
                y="133"
                fill="#93A0B8"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                W / N (0 – 10)
              </text>
              <text
                x="12"
                y="65"
                fill="#93A0B8"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
                transform="rotate(-90 12 65)"
              >
                δ / mm
              </text>
            </svg>
          </div>

          {/* Formula card */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 font-mono text-xs space-y-1">
            <div className="text-[#C9D3E6]">δ = W L³ / 48 E I</div>
            <div className="text-[#C9D3E6]">
              slope δ/W = {(matInfo.slopePerN * spanFactor).toFixed(4)} mm N⁻¹
            </div>
            <div className="text-[#D8B4FE] font-semibold">E ≈ {matInfo.eGPa} GPa</div>
          </div>

          {/* Lab Assistant */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#60A5FA] mb-1.5">
              LAB ASSISTANT
            </div>
            <p className="text-xs text-[#C9D3E6] leading-relaxed">
              Why do engineers take readings while unloading as well as loading? What would a
              big difference between the two columns tell you about the beam?
            </p>
          </div>
        </div>
      }
    >
      {/* Vix Live Tutorial Sandbox Banner */}
      {tutorialSandbox && (
        <div className="mb-2 px-4 py-2.5 rounded-xl bg-[#0F2942] border border-[#38BDF8] flex flex-wrap items-center justify-between gap-2 text-xs z-20">
          <div>
            <span className="font-mono font-bold text-[#38BDF8] mr-2">
              VIX LIVE TUTORIAL SANDBOX
            </span>
            <span className="text-white font-semibold">{tutorialSandbox.title}</span>
            <span className="text-[#93C5FD] ml-2">({tutorialSandbox.note})</span>
          </div>
          <button
            type="button"
            onClick={exitBeamTutorialSandbox}
            className="px-3 py-1 rounded-lg bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#0B1220] font-bold text-[11px] cursor-pointer shrink-0"
          >
            Exit Demo &amp; Restore My Bench
          </button>
        </div>
      )}

      {/* Top Bench Overlays */}
      <div className="flex flex-wrap items-center justify-between gap-2 z-10">
        <span className="px-3 py-1 rounded-full bg-[#291A42] border border-[#6B21A8] text-xs font-semibold text-[#D8B4FE]">
          {phase === 'loading'
            ? 'Loading phase · add masses one at a time'
            : 'Unloading phase · remove masses one at a time'}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#121A2B] border border-[#22304A] rounded-lg p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setView('isometric')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                view === 'isometric'
                  ? 'bg-[#291A42] text-[#D8B4FE]'
                  : 'text-[#93A0B8] hover:text-[#E6EBF5]'
              }`}
            >
              Isometric
            </button>
            <button
              type="button"
              onClick={() => setView('elevation')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                view === 'elevation'
                  ? 'bg-[#291A42] text-[#D8B4FE]'
                  : 'text-[#93A0B8] hover:text-[#E6EBF5]'
              }`}
            >
              Front elevation
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className="px-3 py-1.5 rounded-lg bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors cursor-pointer"
          >
            {showLabels ? 'Hide labels' : 'Show labels'}
          </button>
        </div>
      </div>

      {/* Main Beam Rig Visualization: Interactive 3D Orbit Isometric OR Front Elevation */}
      <div className="flex-1 flex flex-col items-center justify-center my-1">
        {view === 'isometric' ? (
          <div className="w-full flex flex-col items-center">
            <svg
              viewBox="0 0 760 510"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`w-full max-w-[740px] h-auto max-h-[430px] ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              role="img"
              aria-label={`Interactive 3D view of the beam deflection test rig at yaw ${yawDeg} degrees and pitch ${pitchDeg} degrees`}
            >
              {/* Sorted 3D Polygons */}
              {polys.map((poly) => (
                <polygon
                  key={poly.key}
                  points={poly.points}
                  fill={poly.fill}
                  stroke="#0B1220"
                  strokeWidth="0.65"
                  strokeLinejoin="round"
                />
              ))}

              {/* 3D-Anchored Dial Gauge Face */}
              <g transform={`translate(${dialCenter.sx.toFixed(1)}, ${dialCenter.sy.toFixed(1)})`}>
                <circle
                  cx="0"
                  cy="0"
                  r="34"
                  fill="#F1F5F9"
                  stroke="#475569"
                  strokeWidth="5"
                />
                {Array.from({ length: 20 }, (_, i) => {
                  const a = ((i * 18 - 90) * Math.PI) / 180;
                  const isMajor = i % 5 === 0;
                  const r1 = isMajor ? 23 : 26;
                  const r2 = 30;
                  return (
                    <line
                      key={i}
                      x1={r1 * Math.cos(a)}
                      y1={r1 * Math.sin(a)}
                      x2={r2 * Math.cos(a)}
                      y2={r2 * Math.sin(a)}
                      stroke="#0E1726"
                      strokeWidth={isMajor ? 2 : 1}
                    />
                  );
                })}
                <line
                  x1="0"
                  y1="0"
                  x2={23 * Math.cos(dialAngleRad)}
                  y2={23 * Math.sin(dialAngleRad)}
                  stroke="#DC2626"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="0" cy="0" r="3" fill="#0E1726" />
              </g>

              {/* 3D-Tracked Purple Callout Labels */}
              {showLabels && (
                <g fontFamily="Inter, sans-serif" fontSize="12" fontWeight="600" fill="#F3E8FF">
                  {/* Left Knife-edge support */}
                  <line
                    x1={anchorLeftSupport.sx}
                    y1={anchorLeftSupport.sy}
                    x2="150"
                    y2="75"
                    stroke="#D8B4FE"
                    strokeWidth="1"
                  />
                  <circle cx={anchorLeftSupport.sx} cy={anchorLeftSupport.sy} r="3" fill="#D8B4FE" />
                  <rect x="8" y="64" width="142" height="22" rx="5" fill="#2E1065" stroke="#6B21A8" />
                  <text x="16" y="79">Knife-edge support</text>

                  {/* Right Knife-edge support */}
                  <line
                    x1={anchorRightSupport.sx}
                    y1={anchorRightSupport.sy}
                    x2="614"
                    y2="375"
                    stroke="#D8B4FE"
                    strokeWidth="1"
                  />
                  <circle cx={anchorRightSupport.sx} cy={anchorRightSupport.sy} r="3" fill="#D8B4FE" />
                  <rect x="614" y="364" width="142" height="22" rx="5" fill="#2E1065" stroke="#6B21A8" />
                  <text x="622" y="379">Knife-edge support</text>

                  {/* Test beam */}
                  <line
                    x1={anchorBeam.sx}
                    y1={anchorBeam.sy}
                    x2="271"
                    y2="106"
                    stroke="#D8B4FE"
                    strokeWidth="1"
                  />
                  <circle cx={anchorBeam.sx} cy={anchorBeam.sy} r="3" fill="#D8B4FE" />
                  <rect x="101" y="95" width="170" height="22" rx="5" fill="#2E1065" stroke="#6B21A8" />
                  <text x="109" y="110">Test beam ({matInfo.label.toLowerCase()})</text>

                  {/* Magnetic stand */}
                  <line
                    x1={anchorMagStand.sx}
                    y1={anchorMagStand.sy}
                    x2="333"
                    y2="168"
                    stroke="#D8B4FE"
                    strokeWidth="1"
                  />
                  <circle cx={anchorMagStand.sx} cy={anchorMagStand.sy} r="3" fill="#D8B4FE" />
                  <rect x="219" y="157" width="114" height="22" rx="5" fill="#2E1065" stroke="#6B21A8" />
                  <text x="227" y="172">Magnetic stand</text>

                  {/* Dial gauge plunger */}
                  <line
                    x1={anchorPlunger.sx}
                    y1={anchorPlunger.sy}
                    x2="482"
                    y2="77"
                    stroke="#D8B4FE"
                    strokeWidth="1"
                  />
                  <circle cx={anchorPlunger.sx} cy={anchorPlunger.sy} r="3" fill="#D8B4FE" />
                  <rect x="482" y="66" width="142" height="22" rx="5" fill="#2E1065" stroke="#6B21A8" />
                  <text x="490" y="81">Dial gauge plunger</text>

                  {/* Rigid base frame */}
                  <line
                    x1={anchorBase.sx}
                    y1={anchorBase.sy}
                    x2="157"
                    y2="306"
                    stroke="#D8B4FE"
                    strokeWidth="1"
                  />
                  <circle cx={anchorBase.sx} cy={anchorBase.sy} r="3" fill="#D8B4FE" />
                  <rect x="157" y="295" width="128" height="22" rx="5" fill="#2E1065" stroke="#6B21A8" />
                  <text x="165" y="310">Rigid base frame</text>

                  {/* Load hanger */}
                  <line
                    x1={anchorHanger.sx}
                    y1={anchorHanger.sy}
                    x2="337"
                    y2="402"
                    stroke="#D8B4FE"
                    strokeWidth="1"
                  />
                  <circle cx={anchorHanger.sx} cy={anchorHanger.sy} r="3" fill="#D8B4FE" />
                  <rect x="244" y="391" width="93" height="22" rx="5" fill="#2E1065" stroke="#6B21A8" />
                  <text x="252" y="406">Load hanger</text>

                  {/* Slotted masses */}
                  <line
                    x1={anchorMasses.sx}
                    y1={anchorMasses.sy}
                    x2="462"
                    y2="358"
                    stroke="#D8B4FE"
                    strokeWidth="1"
                  />
                  <circle cx={anchorMasses.sx} cy={anchorMasses.sy} r="3" fill="#D8B4FE" />
                  <rect x="462" y="347" width="142" height="22" rx="5" fill="#2E1065" stroke="#6B21A8" />
                  <text x="470" y="362">Slotted masses × {masses}</text>
                </g>
              )}
            </svg>

            {/* Bottom 3D Orbit Rotation Toolbar inside Bench */}
            <div className="flex flex-wrap items-center justify-center gap-2 bg-[#121A2B]/90 border border-[#22304A] rounded-xl px-3 py-1.5 text-xs">
              <span className="text-[#93A0B8] inline-flex items-center gap-1.5 mr-1">
                <Compass className="w-3.5 h-3.5 text-[#D8B4FE]" />
                <span className="font-mono text-[11px]">
                  Yaw {yawDeg}° · Pitch {pitchDeg}°
                </span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setYawDeg((y) => ((y - 45 + 540) % 360) - 180);
                  setLogMsg('log > Rotated bench view 45° counter-clockwise.');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-[#E6EBF5] inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Rotate 45°
              </button>

              <button
                type="button"
                onClick={() => {
                  setYawDeg((y) => ((y + 45 + 540) % 360) - 180);
                  setLogMsg('log > Rotated bench view 45° clockwise.');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-[#E6EBF5] inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                Rotate 45°
              </button>

              <button
                type="button"
                onClick={() => {
                  setYawDeg(-150);
                  setPitchDeg(28);
                  setLogMsg('log > Rotated bench to rear magnetic-stand view.');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-[#E6EBF5] cursor-pointer"
              >
                Rear view
              </button>

              <button
                type="button"
                onClick={() => {
                  setYawDeg(0);
                  setPitchDeg(72);
                  setLogMsg('log > Tilted bench to top plan view.');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0B1220] hover:bg-[#192338] border border-[#22304A] text-[#E6EBF5] cursor-pointer"
              >
                Top view
              </button>

              <button
                type="button"
                onClick={() => {
                  setYawDeg(30);
                  setPitchDeg(30);
                  setLogMsg('log > Reset bench camera to standard isometric view.');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#291A42] hover:bg-[#3B235E] border border-[#6B21A8] text-[#D8B4FE] font-semibold cursor-pointer"
              >
                Reset view
              </button>
            </div>
          </div>
        ) : (
          <svg
            viewBox="0 0 680 440"
            className="w-full max-w-[660px] h-auto max-h-[420px]"
            role="img"
            aria-label={`Front elevation of beam deflection rig with L = ${span.toFixed(3)} m and W = ${loadN.toFixed(2)} N`}
          >
            {/* Base Frame */}
            <rect x="70" y="344" width="540" height="16" rx="4" fill="#2A3852" />

            {/* Knife-edge triangular supports */}
            <polygon
              points={`${340 - halfSpanPx - 28},344 ${340 - halfSpanPx + 28},344 ${340 - halfSpanPx},186`}
              fill="#475569"
            />
            <polygon
              points={`${340 + halfSpanPx - 28},344 ${340 + halfSpanPx + 28},344 ${340 + halfSpanPx},186`}
              fill="#475569"
            />

            {/* Deflected Test Beam */}
            <path
              d={`M 90 180 Q 340 ${180 + visualSag} 590 180`}
              fill="none"
              stroke={matInfo.beamColors.top}
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Magnetic stand overhead bar & plunger housing */}
            <rect x="272" y="32" width="136" height="14" rx="4" fill="#55688C" />
            <rect x="326" y="52" width="28" height="68" rx="4" fill="#3A4A68" />
            <line
              x1="340"
              y1="120"
              x2="340"
              y2={176 + visualSag / 2}
              stroke="#CBD5E1"
              strokeWidth="4"
            />

            {/* Load hanger + slotted masses beneath mid-span */}
            <line
              x1="340"
              y1={186 + visualSag / 2}
              x2="340"
              y2={232 + visualSag / 2}
              stroke="#CBD5E1"
              strokeWidth="3"
            />
            {Array.from({ length: Math.max(1, masses) }, (_, i) => (
              <rect
                key={i}
                x="318"
                y={230 + visualSag / 2 + i * 7}
                width="44"
                height="5"
                rx="1"
                fill="#CBD5E1"
              />
            ))}

            {/* Large Magnified Dial Gauge Face */}
            <line x1="354" y1="84" x2="416" y2="100" stroke="#55688C" strokeWidth="2.5" />
            <g transform="translate(480 112)">
              <circle
                cx="0"
                cy="0"
                r="76"
                fill="#F1F5F9"
                stroke="#475569"
                strokeWidth="4"
              />
              {/* Dial graduations 0..90 */}
              {Array.from({ length: 50 }, (_, i) => {
                const a = ((i * 7.2 - 90) * Math.PI) / 180;
                const isMajor = i % 5 === 0;
                const r1 = isMajor ? 58 : 63;
                const r2 = 70;
                return (
                  <g key={i}>
                    <line
                      x1={r1 * Math.cos(a)}
                      y1={r1 * Math.sin(a)}
                      x2={r2 * Math.cos(a)}
                      y2={r2 * Math.sin(a)}
                      stroke="#0E1726"
                      strokeWidth={isMajor ? 2 : 1}
                    />
                    {isMajor && (
                      <text
                        x={45 * Math.cos(a)}
                        y={45 * Math.sin(a) + 4}
                        textAnchor="middle"
                        fill="#0E1726"
                        fontSize="11"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {i * 2}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Small revolution counter sub-dial */}
              <circle
                cx="0"
                cy="24"
                r="14"
                fill="#F8FAFC"
                stroke="#94A3B8"
                strokeWidth="1"
              />
              <line x1="0" y1="24" x2="0" y2="14" stroke="#0E1726" strokeWidth="1.5" />
              <text
                x="0"
                y="50"
                textAnchor="middle"
                fill="#475569"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
              >
                mm
              </text>

              {/* Rotating Red Dial Needle */}
              <line
                x1="0"
                y1="0"
                x2={56 * Math.cos(dialAngleRad)}
                y2={56 * Math.sin(dialAngleRad)}
                stroke="#DC2626"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="0" cy="0" r="4" fill="#0E1726" />
            </g>

            {/* Bottom Span & Load Caption */}
            <text
              x="340"
              y="382"
              textAnchor="middle"
              fill="#C9D3E6"
              fontSize="13"
              fontFamily="JetBrains Mono, monospace"
            >
              L = {span.toFixed(3)} m · W = {loadN.toFixed(2)} N
            </text>
          </svg>
        )}
      </div>
    </LabLayout>
  );
}
