import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  CheckCircle2,
  Circle,
  Eraser,
  Eye,
  Grid3X3,
  Pencil,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
} from 'lucide-react';
import { LabLayout } from '../../lab-shell/LabLayout';

type DrawTool = 'line' | 'box' | 'ellipse' | 'eraser';
type LineStyleKind = 'object' | 'construction' | 'hidden' | 'center';
type IsoPlane = 'top' | 'left' | 'right';
type ProjectionAngle = 'first' | 'third';

interface IsoPoint {
  /** Right-up 30° axis in grid units (1 unit = 10 mm) */
  u: number;
  /** Left-up 150° axis in grid units (1 unit = 10 mm) */
  v: number;
  /** Vertical +Z axis in grid units (1 unit = 10 mm) */
  w: number;
}

interface IsoSegment {
  id: string;
  a: IsoPoint;
  b: IsoPoint;
  style: LineStyleKind;
}

interface IsoEllipse {
  id: string;
  center: IsoPoint;
  radiusUnits: number;
  plane: IsoPlane;
  style: LineStyleKind;
}

interface IsoExercise {
  id: string;
  title: string;
  shortLabel: string;
  dimensionsMm: string;
  crate: { L: number; W: number; H: number };
  brief: string;
  targetEdges: Array<[IsoPoint, IsoPoint]>;
  hiddenEdges: Array<[IsoPoint, IsoPoint]>;
  ellipses?: Array<{ center: IsoPoint; radiusUnits: number; plane: IsoPlane }>;
  frontRects: Array<{ x: number; y: number; w: number; h: number; dashed?: boolean }>;
  planRects: Array<{ x: number; y: number; w: number; h: number; dashed?: boolean; circle?: boolean }>;
  sideRects: Array<{ x: number; y: number; w: number; h: number; dashed?: boolean }>;
}

const COS30 = Math.cos(Math.PI / 6); // 0.8660254
const SIN30 = 0.5;
const GRID_STEP_PX = 28;
const ORIGIN_X = 380;
const ORIGIN_Y = 340;

function isoToScreen(p: IsoPoint): { x: number; y: number } {
  return {
    x: ORIGIN_X + (p.u - p.v) * GRID_STEP_PX * COS30,
    y: ORIGIN_Y - (p.u + p.v) * GRID_STEP_PX * SIN30 - p.w * GRID_STEP_PX,
  };
}

function ptKey(p: IsoPoint): string {
  return `${Math.round(p.u)},${Math.round(p.v)},${Math.round(p.w)}`;
}

function edgeKey(a: IsoPoint, b: IsoPoint): string {
  const ka = ptKey(a);
  const kb = ptKey(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

function buildCrateEdges(L: number, W: number, H: number): Array<[IsoPoint, IsoPoint]> {
  const p = (u: number, v: number, w: number): IsoPoint => ({ u, v, w });
  return [
    [p(0, 0, 0), p(L, 0, 0)],
    [p(0, 0, 0), p(0, W, 0)],
    [p(L, 0, 0), p(L, W, 0)],
    [p(0, W, 0), p(L, W, 0)],
    [p(0, 0, H), p(L, 0, H)],
    [p(0, 0, H), p(0, W, H)],
    [p(L, 0, H), p(L, W, H)],
    [p(0, W, H), p(L, W, H)],
    [p(0, 0, 0), p(0, 0, H)],
    [p(L, 0, 0), p(L, 0, H)],
    [p(0, W, 0), p(0, W, H)],
    [p(L, W, 0), p(L, W, H)],
  ];
}

function buildIsoEllipsePath(center: IsoPoint, radiusUnits: number, plane: IsoPlane): string {
  const steps = 36;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const c = Math.cos(theta) * radiusUnits;
    const s = Math.sin(theta) * radiusUnits;
    let p: IsoPoint;
    if (plane === 'top') {
      p = { u: center.u + c, v: center.v + s, w: center.w };
    } else if (plane === 'right') {
      p = { u: center.u + c, v: center.v, w: center.w + s };
    } else {
      p = { u: center.u, v: center.v + c, w: center.w + s };
    }
    const sc = isoToScreen(p);
    pts.push(`${i === 0 ? 'M' : 'L'} ${sc.x.toFixed(1)} ${sc.y.toFixed(1)}`);
  }
  return `${pts.join(' ')} Z`;
}

const pt = (u: number, v: number, w: number): IsoPoint => ({ u, v, w });

const ISO_EXERCISES: IsoExercise[] = [
  {
    id: 'stepped_block',
    title: 'Stepped Block (WAEC Technical Drawing)',
    shortLabel: 'Stepped Block',
    dimensionsMm: '60 × 40 × 40 mm · Step 30 × 20 mm',
    crate: { L: 6, W: 4, H: 4 },
    brief:
      'Construct the full isometric view of the stepped block from its Front, Plan, and Side elevations. Box in the 60 × 40 × 40 mm crate using 2H lines first, then darken visible HB outlines.',
    targetEdges: [
      // Base visible perimeter
      [pt(0, 0, 0), pt(6, 0, 0)],
      [pt(0, 0, 0), pt(0, 4, 0)],
      // Front-right vertical & step profile (v = 0)
      [pt(0, 0, 0), pt(0, 0, 4)],
      [pt(0, 0, 4), pt(3, 0, 4)],
      [pt(3, 0, 4), pt(3, 0, 2)],
      [pt(3, 0, 2), pt(6, 0, 2)],
      [pt(6, 0, 2), pt(6, 0, 0)],
      // Upper step top & back edges
      [pt(0, 0, 4), pt(0, 4, 4)],
      [pt(0, 4, 4), pt(3, 4, 4)],
      [pt(3, 4, 4), pt(3, 0, 4)],
      [pt(0, 4, 0), pt(0, 4, 4)],
      // Lower terrace top & step riser
      [pt(3, 4, 4), pt(3, 4, 2)],
      [pt(3, 0, 2), pt(3, 4, 2)],
      [pt(3, 4, 2), pt(6, 4, 2)],
      [pt(6, 0, 2), pt(6, 4, 2)],
      [pt(6, 4, 2), pt(6, 4, 0)],
    ],
    hiddenEdges: [
      [pt(0, 4, 0), pt(6, 4, 0)],
      [pt(6, 0, 0), pt(6, 4, 0)],
    ],
    frontRects: [
      { x: 10, y: 15, w: 45, h: 60 },
      { x: 55, y: 45, w: 45, h: 30 },
    ],
    planRects: [
      { x: 10, y: 15, w: 45, h: 55 },
      { x: 55, y: 15, w: 45, h: 55 },
    ],
    sideRects: [
      { x: 20, y: 15, w: 60, h: 60 },
      { x: 20, y: 45, w: 60, h: 30 },
    ],
  },
  {
    id: 'slotted_block',
    title: 'Slotted Channel Block (U-Groove)',
    shortLabel: 'Slotted Block',
    dimensionsMm: '60 × 40 × 30 mm · Slot 20 × 10 mm',
    crate: { L: 6, W: 4, H: 3 },
    brief:
      'Draw the U-channel block with a central through-slot running full depth (40 mm). Watch the inner vertical wall and slot floor lines.',
    targetEdges: [
      [pt(0, 0, 0), pt(6, 0, 0)],
      [pt(0, 0, 0), pt(0, 4, 0)],
      [pt(0, 0, 0), pt(0, 0, 3)],
      [pt(0, 0, 3), pt(2, 0, 3)],
      [pt(2, 0, 3), pt(2, 0, 2)],
      [pt(2, 0, 2), pt(4, 0, 2)],
      [pt(4, 0, 2), pt(4, 0, 3)],
      [pt(4, 0, 3), pt(6, 0, 3)],
      [pt(6, 0, 3), pt(6, 0, 0)],
      [pt(0, 4, 0), pt(0, 4, 3)],
      [pt(0, 0, 3), pt(0, 4, 3)],
      [pt(0, 4, 3), pt(2, 4, 3)],
      [pt(2, 0, 3), pt(2, 4, 3)],
      [pt(2, 4, 3), pt(2, 4, 2)],
      [pt(2, 0, 2), pt(2, 4, 2)],
      [pt(2, 4, 2), pt(4, 4, 2)],
      [pt(4, 0, 2), pt(4, 4, 2)],
      [pt(4, 0, 3), pt(4, 4, 3)],
      [pt(4, 4, 3), pt(6, 4, 3)],
      [pt(6, 0, 3), pt(6, 4, 3)],
      [pt(6, 4, 3), pt(6, 4, 0)],
    ],
    hiddenEdges: [
      [pt(4, 4, 3), pt(4, 4, 2)],
      [pt(0, 4, 0), pt(6, 4, 0)],
    ],
    frontRects: [
      { x: 10, y: 20, w: 30, h: 55 },
      { x: 40, y: 40, w: 30, h: 35 },
      { x: 70, y: 20, w: 30, h: 55 },
    ],
    planRects: [
      { x: 10, y: 15, w: 30, h: 55 },
      { x: 40, y: 15, w: 30, h: 55 },
      { x: 70, y: 15, w: 30, h: 55 },
    ],
    sideRects: [
      { x: 20, y: 20, w: 60, h: 55 },
      { x: 20, y: 40, w: 60, h: 35, dashed: true },
    ],
  },
  {
    id: 'l_bracket',
    title: 'Engineering L-Bracket Support',
    shortLabel: 'L-Bracket',
    dimensionsMm: '60 × 40 × 50 mm · Web 10 mm thick',
    crate: { L: 6, W: 4, H: 5 },
    brief:
      'Construct the tall L-bracket with a 10 mm horizontal base flange and a 10 mm vertical backplate. Check vertical heights carefully along the +Z axis.',
    targetEdges: [
      [pt(0, 0, 0), pt(6, 0, 0)],
      [pt(0, 0, 0), pt(0, 4, 0)],
      [pt(0, 0, 0), pt(0, 0, 5)],
      [pt(0, 0, 5), pt(1, 0, 5)],
      [pt(1, 0, 5), pt(1, 0, 1)],
      [pt(1, 0, 1), pt(6, 0, 1)],
      [pt(6, 0, 1), pt(6, 0, 0)],
      [pt(0, 4, 0), pt(0, 4, 5)],
      [pt(0, 0, 5), pt(0, 4, 5)],
      [pt(0, 4, 5), pt(1, 4, 5)],
      [pt(1, 0, 5), pt(1, 4, 5)],
      [pt(1, 4, 5), pt(1, 4, 1)],
      [pt(1, 0, 1), pt(1, 4, 1)],
      [pt(1, 4, 1), pt(6, 4, 1)],
      [pt(6, 0, 1), pt(6, 4, 1)],
      [pt(6, 4, 1), pt(6, 4, 0)],
    ],
    hiddenEdges: [
      [pt(0, 4, 0), pt(6, 4, 0)],
      [pt(6, 0, 0), pt(6, 4, 0)],
    ],
    frontRects: [
      { x: 12, y: 12, w: 16, h: 64 },
      { x: 28, y: 60, w: 70, h: 16 },
    ],
    planRects: [
      { x: 12, y: 15, w: 16, h: 55 },
      { x: 28, y: 15, w: 70, h: 55 },
    ],
    sideRects: [
      { x: 20, y: 12, w: 60, h: 64 },
      { x: 20, y: 60, w: 60, h: 16 },
    ],
  },
  {
    id: 'cylindrical_boss',
    title: 'Base Plate with Cylindrical Boss (Iso-Circle)',
    shortLabel: 'Cylinder Boss',
    dimensionsMm: '60 × 40 × 20 mm Plate + Ø30 mm Bore',
    crate: { L: 6, W: 4, H: 2 },
    brief:
      'Draw the 60 × 40 × 20 mm rectangular base plate and construct a Ø30 mm isometric circle centered on the top face using the Ellipse tool (4-center method).',
    targetEdges: [
      [pt(0, 0, 0), pt(6, 0, 0)],
      [pt(0, 0, 0), pt(0, 4, 0)],
      [pt(0, 0, 0), pt(0, 0, 2)],
      [pt(6, 0, 0), pt(6, 0, 2)],
      [pt(0, 4, 0), pt(0, 4, 2)],
      [pt(0, 0, 2), pt(6, 0, 2)],
      [pt(0, 0, 2), pt(0, 4, 2)],
      [pt(6, 0, 2), pt(6, 4, 2)],
      [pt(0, 4, 2), pt(6, 4, 2)],
      [pt(6, 4, 2), pt(6, 4, 0)],
    ],
    hiddenEdges: [
      [pt(0, 4, 0), pt(6, 4, 0)],
      [pt(6, 0, 0), pt(6, 4, 0)],
    ],
    ellipses: [{ center: pt(3, 2, 2), radiusUnits: 1.5, plane: 'top' }],
    frontRects: [
      { x: 10, y: 40, w: 90, h: 32 },
      { x: 35, y: 40, w: 40, h: 32, dashed: true },
    ],
    planRects: [
      { x: 10, y: 15, w: 90, h: 55 },
      { x: 38, y: 25, w: 34, h: 34, circle: true },
    ],
    sideRects: [
      { x: 20, y: 40, w: 60, h: 32 },
      { x: 35, y: 40, w: 30, h: 32, dashed: true },
    ],
  },
];

/** Analogous sandbox block used when Vix demonstrates isometric construction so graded exercises stay untouched. */
const SANDBOX_ANALOG_EXERCISE: IsoExercise = {
  id: 'sandbox_analog_cube',
  title: 'Analogous 40 × 30 × 30 mm Notched Cube (Vix Demo)',
  shortLabel: 'Vix Demo Block',
  dimensionsMm: '40 × 30 × 30 mm · Notch 20 × 10 mm',
  crate: { L: 4, W: 3, H: 3 },
  brief: 'Vix demonstrates the 3-stage isometric method (2H boxing-in crate → HB visible outlines → hidden-detail lines) on an analogous block.',
  targetEdges: [
    [pt(0, 0, 0), pt(4, 0, 0)],
    [pt(0, 0, 0), pt(0, 3, 0)],
    [pt(0, 0, 0), pt(0, 0, 3)],
    [pt(0, 0, 3), pt(2, 0, 3)],
    [pt(2, 0, 3), pt(2, 0, 2)],
    [pt(2, 0, 2), pt(4, 0, 2)],
    [pt(4, 0, 2), pt(4, 0, 0)],
    [pt(0, 3, 0), pt(0, 3, 3)],
    [pt(0, 0, 3), pt(0, 3, 3)],
    [pt(0, 3, 3), pt(2, 3, 3)],
    [pt(2, 0, 3), pt(2, 3, 3)],
    [pt(2, 3, 3), pt(2, 3, 2)],
    [pt(2, 0, 2), pt(2, 3, 2)],
    [pt(2, 3, 2), pt(4, 3, 2)],
    [pt(4, 0, 2), pt(4, 3, 2)],
    [pt(4, 3, 2), pt(4, 3, 0)],
  ],
  hiddenEdges: [[pt(0, 3, 0), pt(4, 3, 0)]],
  frontRects: [
    { x: 18, y: 20, w: 32, h: 52 },
    { x: 50, y: 38, w: 32, h: 34 },
  ],
  planRects: [
    { x: 18, y: 18, w: 32, h: 48 },
    { x: 50, y: 18, w: 32, h: 48 },
  ],
  sideRects: [
    { x: 24, y: 20, w: 50, h: 52 },
    { x: 24, y: 38, w: 50, h: 34 },
  ],
};

const LINE_STYLE_CFG: Record<
  LineStyleKind,
  { label: string; stroke: string; width: number; dash?: string; badge: string }
> = {
  object: { label: 'HB Object', stroke: '#E6EBF5', width: 2.3, badge: 'HB' },
  construction: { label: '2H Construction', stroke: '#60A5FA', width: 1.0, dash: '2 3', badge: '2H' },
  hidden: { label: 'Hidden Detail', stroke: '#FDBA74', width: 1.5, dash: '5 4', badge: 'HID' },
  center: { label: 'Centerline', stroke: '#5EEAD4', width: 1.2, dash: '9 3 2 3', badge: 'CL' },
};

export function IsometricDrawingLab() {
  const navigate = useNavigate();
  const [exerciseId, setExerciseId] = useState<string>(ISO_EXERCISES[0]!.id);
  const [activeTool, setActiveTool] = useState<DrawTool>('line');
  const [lineStyle, setLineStyle] = useState<LineStyleKind>('object');
  const [ellipsePlane, setEllipsePlane] = useState<IsoPlane>('top');
  const [ellipseDiamMm, setEllipseDiamMm] = useState<20 | 30 | 40>(30);
  const [projectionAngle, setProjectionAngle] = useState<ProjectionAngle>('first');
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showGhostGuide, setShowGhostGuide] = useState(true);
  const [activeElevationW, setActiveElevationW] = useState<number>(0);

  const [segments, setSegments] = useState<IsoSegment[]>([]);
  const [ellipses, setEllipses] = useState<IsoEllipse[]>([]);
  const [undoStack, setUndoStack] = useState<Array<{ segments: IsoSegment[]; ellipses: IsoEllipse[] }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{ segments: IsoSegment[]; ellipses: IsoEllipse[] }>>([]);
  const [pendingStart, setPendingStart] = useState<IsoPoint | null>(null);
  const [hoverPoint, setHoverPoint] = useState<IsoPoint | null>(null);
  const [lastCheckResult, setLastCheckResult] = useState<{
    matched: number;
    total: number;
    pct: number;
  } | null>(null);
  const [logMsg, setLogMsg] = useState(
    'log > 30° isometric grid active. Select 2H Construction to box in your crate, then HB Object for visible outlines.'
  );

  // Vix Live Tutorial Sandbox state (preserves student's real drawing completely)
  const [tutorialSandbox, setTutorialSandbox] = useState<{
    title: string;
    note: string;
  } | null>(null);
  const savedRealDrawingRef = useRef<{
    exerciseId: string;
    segments: IsoSegment[];
    ellipses: IsoEllipse[];
    showGhostGuide: boolean;
  } | null>(null);
  const segmentsRef = useRef(segments);
  const ellipsesRef = useRef(ellipses);
  segmentsRef.current = segments;
  ellipsesRef.current = ellipses;
  const animTimersRef = useRef<number[]>([]);
  const seqRef = useRef(1);

  const clearAnimTimers = () => {
    for (const id of animTimersRef.current) window.clearTimeout(id);
    animTimersRef.current = [];
  };

  useEffect(() => () => clearAnimTimers(), []);

  const exercise: IsoExercise = tutorialSandbox
    ? SANDBOX_ANALOG_EXERCISE
    : ISO_EXERCISES.find((ex) => ex.id === exerciseId) ?? ISO_EXERCISES[0]!;

  // Precompute snapped 3D isometric lattice nodes across the active horizontal working plane (w = activeElevationW)
  // PLUS key vertices at w = 0..H so students can click any vertical corner effortlessly!
  const snapPoints = useMemo<IsoPoint[]>(() => {
    const map = new Map<string, IsoPoint>();
    const add = (p: IsoPoint) => map.set(ptKey(p), p);
    for (let u = 0; u <= 7; u++) {
      for (let v = 0; v <= 5; v++) {
        add({ u, v, w: activeElevationW });
      }
    }
    // Always include vertices from the active exercise's crate & target edges so 3D vertical snapping is effortless
    for (const [a, b] of [...buildCrateEdges(exercise.crate.L, exercise.crate.W, exercise.crate.H), ...exercise.targetEdges]) {
      add(a);
      add(b);
    }
    return Array.from(map.values());
  }, [activeElevationW, exercise]);

  const pushHistory = () => {
    setUndoStack((prev) => [...prev.slice(-24), { segments: segmentsRef.current, ellipses: ellipsesRef.current }]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1]!;
    setRedoStack((r) => [...r, { segments: segmentsRef.current, ellipses: ellipsesRef.current }]);
    setUndoStack((u) => u.slice(0, -1));
    setSegments(prev.segments);
    setEllipses(prev.ellipses);
    setLogMsg('log > Undid last drawing action.');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1]!;
    setUndoStack((u) => [...u, { segments: segmentsRef.current, ellipses: ellipsesRef.current }]);
    setRedoStack((r) => r.slice(0, -1));
    setSegments(next.segments);
    setEllipses(next.ellipses);
    setLogMsg('log > Redid drawing action.');
  };

  const findNearestSnapPoint = (svgX: number, svgY: number): IsoPoint | null => {
    let best: IsoPoint | null = null;
    let bestDist = 20;
    for (const p of snapPoints) {
      const sc = isoToScreen(p);
      const d = Math.hypot(sc.x - svgX, sc.y - svgY);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    return best;
  };

  const getSvgCoords = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 760;
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 460;
    return { x, y };
  };

  const addUniqueSegments = (newSegs: Array<{ a: IsoPoint; b: IsoPoint; style: LineStyleKind }>) => {
    setSegments((prev) => {
      const existingKeys = new Set(prev.map((s) => `${s.style}:${edgeKey(s.a, s.b)}`));
      const additions: IsoSegment[] = [];
      for (const s of newSegs) {
        const k = `${s.style}:${edgeKey(s.a, s.b)}`;
        if (ptKey(s.a) === ptKey(s.b) || existingKeys.has(k)) continue;
        existingKeys.add(k);
        additions.push({ id: `iso-s-${seqRef.current++}`, a: s.a, b: s.b, style: s.style });
      }
      return [...prev, ...additions];
    });
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const { x, y } = getSvgCoords(e);
    setHoverPoint(findNearestSnapPoint(x, y));
  };

  const handleSvgClick = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool === 'eraser') return;
    const { x, y } = getSvgCoords(e);
    const snapped = findNearestSnapPoint(x, y);
    if (!snapped) return;

    if (activeTool === 'ellipse') {
      pushHistory();
      const radiusUnits = ellipseDiamMm / 20;
      setEllipses((prev) => [
        ...prev,
        {
          id: `iso-e-${seqRef.current++}`,
          center: snapped,
          radiusUnits,
          plane: ellipsePlane,
          style: lineStyle,
        },
      ]);
      setLogMsg(
        `log > Constructed Ø${ellipseDiamMm} mm isometric circle on ${ellipsePlane} face at (${snapped.u * 10}, ${snapped.v * 10}, ${snapped.w * 10}) mm.`
      );
      return;
    }

    if (activeTool === 'box') {
      pushHistory();
      const { L, W, H } = exercise.crate;
      const crateEdges = buildCrateEdges(L, W, H).map(([a, b]) => ({
        a: { u: a.u + snapped.u, v: a.v + snapped.v, w: a.w + snapped.w },
        b: { u: b.u + snapped.u, v: b.v + snapped.v, w: b.w + snapped.w },
        style: lineStyle,
      }));
      addUniqueSegments(crateEdges);
      setLogMsg(
        `log > Boxed in ${L * 10} × ${W * 10} × ${H * 10} mm isometric crate (${LINE_STYLE_CFG[lineStyle].label}).`
      );
      return;
    }

    // Line tool: 2-click segment
    if (!pendingStart) {
      setPendingStart(snapped);
      return;
    }
    if (ptKey(pendingStart) === ptKey(snapped)) {
      setPendingStart(null);
      return;
    }
    pushHistory();
    addUniqueSegments([{ a: pendingStart, b: snapped, style: lineStyle }]);
    const lenMm = Math.round(
      Math.hypot(snapped.u - pendingStart.u, snapped.v - pendingStart.v, snapped.w - pendingStart.w) * 10
    );
    setLogMsg(
      `log > Drew ${LINE_STYLE_CFG[lineStyle].label} edge (${lenMm} mm) from (${pendingStart.u * 10},${pendingStart.v * 10},${pendingStart.w * 10}) to (${snapped.u * 10},${snapped.v * 10},${snapped.w * 10}).`
    );
    setPendingStart(null);
  };

  const handleDrawConstructionCrate = () => {
    pushHistory();
    const { L, W, H } = exercise.crate;
    addUniqueSegments(
      buildCrateEdges(L, W, H).map(([a, b]) => ({ a, b, style: 'construction' as const }))
    );
    setLogMsg(
      `log > Boxed in ${L * 10} × ${W * 10} × ${H * 10} mm 2H construction crate at origin (0,0,0).`
    );
  };

  const handleCheckAccuracy = () => {
    const drawnObjectKeys = new Set(
      segmentsRef.current.filter((s) => s.style === 'object').map((s) => edgeKey(s.a, s.b))
    );
    let matched = 0;
    for (const [a, b] of exercise.targetEdges) {
      if (drawnObjectKeys.has(edgeKey(a, b))) matched += 1;
    }
    const total = exercise.targetEdges.length + (exercise.ellipses?.length ?? 0);
    if (exercise.ellipses && exercise.ellipses.length > 0) {
      for (const reqEl of exercise.ellipses) {
        const hit = ellipsesRef.current.some(
          (el) =>
            el.plane === reqEl.plane &&
            ptKey(el.center) === ptKey(reqEl.center) &&
            Math.abs(el.radiusUnits - reqEl.radiusUnits) <= 0.3
        );
        if (hit) matched += 1;
      }
    }
    const pct = total > 0 ? Math.round((matched / total) * 100) : 0;
    setLastCheckResult({ matched, total, pct });
    setLogMsg(
      `log > Geometry check: ${matched}/${total} required HB isometric features matched (${pct}%).`
    );
  };

  const exitIsoTutorialSandbox = () => {
    clearAnimTimers();
    const saved = savedRealDrawingRef.current;
    savedRealDrawingRef.current = null;
    setTutorialSandbox(null);
    setPendingStart(null);
    setLastCheckResult(null);
    if (saved) {
      setExerciseId(saved.exerciseId);
      setSegments(saved.segments);
      setEllipses(saved.ellipses);
      setShowGhostGuide(saved.showGhostGuide);
    } else {
      setSegments([]);
      setEllipses([]);
    }
    setLogMsg('log > Exited Isometric Tutorial Sandbox and restored your real drawing board.');
  };

  // Vix Live Tutorial Sandbox listener (step-by-step boxing-in crate -> HB outlines -> hidden edges)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onBenchControl = (ev: Event) => {
      const detail = (ev as CustomEvent<{ action: string; params?: Record<string, unknown> }>).detail;
      if (!detail?.action) return;
      const { action, params = {} } = detail;

      if (action === 'start_tutorial_sandbox') {
        clearAnimTimers();
        if (!savedRealDrawingRef.current) {
          savedRealDrawingRef.current = {
            exerciseId,
            segments: segmentsRef.current,
            ellipses: ellipsesRef.current,
            showGhostGuide,
          };
        }
        setTutorialSandbox({
          title: String(
            params.scenarioTitle || 'Tutorial Demo: 40 × 30 × 30 mm Notched Cube (3-Stage Isometric)'
          ),
          note: String(
            params.analogNote ||
              'Using an analogous notched block so your graded isometric drawing stays untouched.'
          ),
        });
        setSegments([]);
        setEllipses([]);
        setPendingStart(null);
        setLastCheckResult(null);
        setShowGhostGuide(true);
        setLogMsg('log > [Vix Tutorial Sandbox] Cleared board for analogous isometric demonstration.');
      } else if (action === 'draw_iso_crate') {
        clearAnimTimers();
        const targetEx = tutorialSandbox ? SANDBOX_ANALOG_EXERCISE : exercise;
        const { L, W, H } = targetEx.crate;
        const crateEdges = buildCrateEdges(L, W, H);
        const timers: number[] = [];
        crateEdges.forEach(([a, b], idx) => {
          timers.push(
            window.setTimeout(() => {
              addUniqueSegments([{ a, b, style: 'construction' }]);
            }, idx * 90)
          );
        });
        animTimersRef.current = timers;
        setLogMsg(`log > [Vix Demo] Stage 1: Boxing in ${L * 10} × ${W * 10} × ${H * 10} mm 2H construction crate.`);
      } else if (action === 'draw_iso_outlines') {
        clearAnimTimers();
        const targetEx = tutorialSandbox ? SANDBOX_ANALOG_EXERCISE : exercise;
        const timers: number[] = [];
        targetEx.targetEdges.forEach(([a, b], idx) => {
          timers.push(
            window.setTimeout(() => {
              addUniqueSegments([{ a, b, style: 'object' }]);
            }, idx * 110)
          );
        });
        animTimersRef.current = timers;
        setLogMsg(`log > [Vix Demo] Stage 2: Darkening ${targetEx.targetEdges.length} visible HB object edges.`);
      } else if (action === 'draw_iso_hidden') {
        const targetEx = tutorialSandbox ? SANDBOX_ANALOG_EXERCISE : exercise;
        addUniqueSegments(
          targetEx.hiddenEdges.map(([a, b]) => ({ a, b, style: 'hidden' as const }))
        );
        setLogMsg('log > [Vix Demo] Stage 3: Added dashed hidden-detail edges.');
      } else if (action === 'select_exercise' && typeof params.exercise_id === 'string') {
        const found = ISO_EXERCISES.find((ex) => ex.id === params.exercise_id);
        if (found) {
          setExerciseId(found.id);
          setSegments([]);
          setEllipses([]);
          setLastCheckResult(null);
          setLogMsg(`log > [Vix Demo] Switched practical block to ${found.title}.`);
        }
      } else if (action === 'set_projection_angle') {
        const ang = String(params.angle || params.value || 'first').toLowerCase();
        setProjectionAngle(ang.includes('third') || ang.includes('3') ? 'third' : 'first');
      } else if (action === 'toggle_guide') {
        setShowGhostGuide(Boolean(Number(params.value ?? 1)));
      } else if (action === 'check_accuracy') {
        handleCheckAccuracy();
      } else if (action === 'end_tutorial_sandbox') {
        exitIsoTutorialSandbox();
      }
    };

    window.addEventListener('vix:bench-control', onBenchControl);
    return () => window.removeEventListener('vix:bench-control', onBenchControl);
  });

  // Render subtle 30° isometric lattice grid lines across the drafting board
  const gridLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];
    for (let u = 0; u <= 7; u++) {
      const a = isoToScreen({ u, v: 0, w: activeElevationW });
      const b = isoToScreen({ u, v: 5, w: activeElevationW });
      lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, key: `gu-${u}` });
    }
    for (let v = 0; v <= 5; v++) {
      const a = isoToScreen({ u: 0, v, w: activeElevationW });
      const b = isoToScreen({ u: 7, v, w: activeElevationW });
      lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, key: `gv-${v}` });
    }
    return lines;
  }, [activeElevationW]);

  const objectLineCount = segments.filter((s) => s.style === 'object').length;
  const constructionLineCount = segments.filter((s) => s.style === 'construction').length;

  return (
    <LabLayout
      activeLab="engineering"
      experimentTitle="Isometric drawing — 30° CAD studio"
      subtitle="Practice · construct 30° isometric projections from orthographic views"
      nextStepLabel="Analyse drawing →"
      onNextStep={() => navigate('/attempt/demo-iso/results')}
      leftTray={
        <div className="space-y-4 text-xs">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#C084FC] mb-2">
              PRACTICAL BLOCKS
            </div>
            <div className="space-y-1.5">
              {ISO_EXERCISES.map((ex) => {
                const active = !tutorialSandbox && ex.id === exerciseId;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      if (tutorialSandbox) exitIsoTutorialSandbox();
                      setExerciseId(ex.id);
                      setSegments([]);
                      setEllipses([]);
                      setPendingStart(null);
                      setLastCheckResult(null);
                      setLogMsg(`log > Loaded orthographic views for ${ex.title}.`);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#291A42] border-[#C084FC] text-white'
                        : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6] hover:border-[#3A4A68]'
                    }`}
                  >
                    <div className="font-semibold">{ex.shortLabel}</div>
                    <div className="text-[10px] font-mono text-[#93A0B8] mt-0.5">{ex.dimensionsMm}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#1E2A42] pt-3 space-y-2.5">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8]">
              LINE WEIGHT &amp; TYPE
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(LINE_STYLE_CFG) as LineStyleKind[]).map((k) => {
                const cfg = LINE_STYLE_CFG[k];
                const active = lineStyle === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setLineStyle(k)}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                      active
                        ? 'bg-[#1E2A42] border-[#C084FC] text-white'
                        : 'bg-[#121A2B] border-[#22304A] text-[#93A0B8] hover:text-white'
                    }`}
                  >
                    <span>{cfg.label.split(' ')[0]}</span>
                    <span
                      className="w-5 h-0.5 rounded-full"
                      style={{
                        backgroundColor: cfg.stroke,
                        borderTop: cfg.dash ? `1.5px dashed ${cfg.stroke}` : undefined,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#1E2A42] pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8]">
                WORKING LEVEL (Z)
              </span>
              <span className="font-mono text-[#D8B4FE]">{activeElevationW * 10} mm</span>
            </div>
            <input
              type="range"
              aria-label="Working elevation height in grid units"
              min={0}
              max={exercise.crate.H}
              step={1}
              value={activeElevationW}
              onChange={(e) => setActiveElevationW(Number(e.target.value))}
              className="w-full accent-[#C084FC] cursor-pointer"
            />
            <div className="text-[10px] text-[#93A0B8]">
              Grid snaps horizontally at Z = {activeElevationW * 10} mm and vertically to all block corners.
            </div>
          </div>

          {activeTool === 'ellipse' && (
            <div className="border-t border-[#1E2A42] pt-3 space-y-2">
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8]">
                ISO-CIRCLE FACE &amp; Ø
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['top', 'left', 'right'] as IsoPlane[]).map((pl) => (
                  <button
                    key={pl}
                    type="button"
                    onClick={() => setEllipsePlane(pl)}
                    className={`py-1 rounded border text-[11px] capitalize cursor-pointer ${
                      ellipsePlane === pl
                        ? 'bg-[#291A42] border-[#C084FC] text-white'
                        : 'bg-[#121A2B] border-[#22304A] text-[#93A0B8]'
                    }`}
                  >
                    {pl}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {([20, 30, 40] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setEllipseDiamMm(d)}
                    className={`py-1 rounded border font-mono text-[11px] cursor-pointer ${
                      ellipseDiamMm === d
                        ? 'bg-[#291A42] border-[#C084FC] text-white'
                        : 'bg-[#121A2B] border-[#22304A] text-[#93A0B8]'
                    }`}
                  >
                    Ø{d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-[#1E2A42] pt-3 space-y-1.5">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8]">
              DISPLAY OPTIONS
            </div>
            <label className="flex items-center justify-between text-[#C9D3E6] cursor-pointer">
              <span>30° Isometric Grid</span>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="accent-[#C084FC]"
              />
            </label>
            <label className="flex items-center justify-between text-[#C9D3E6] cursor-pointer">
              <span>X / Y / Z Axis Triad</span>
              <input
                type="checkbox"
                checked={showAxes}
                onChange={(e) => setShowAxes(e.target.checked)}
                className="accent-[#C084FC]"
              />
            </label>
            <label className="flex items-center justify-between text-[#C9D3E6] cursor-pointer">
              <span>Ghost Reference Outline</span>
              <input
                type="checkbox"
                checked={showGhostGuide}
                onChange={(e) => setShowGhostGuide(e.target.checked)}
                className="accent-[#C084FC]"
              />
            </label>
          </div>
        </div>
      }
      bottomDock={
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Drawing Tool Palette */}
          <div className="md:col-span-5 flex flex-wrap items-center gap-1.5">
            {[
              { id: 'line' as const, label: 'Line (30°)', icon: Pencil },
              { id: 'box' as const, label: 'Iso Crate', icon: Box },
              { id: 'ellipse' as const, label: 'Iso Circle', icon: Circle },
              { id: 'eraser' as const, label: 'Erase', icon: Eraser },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveTool(t.id);
                    setPendingStart(null);
                  }}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#291A42] border-[#C084FC] text-[#E9D5FF]'
                      : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6] hover:bg-[#192338]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Drafting Helpers */}
          <div className="md:col-span-4 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleDrawConstructionCrate}
              className="px-2.5 py-2 rounded-lg bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs text-[#93C5FD] font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              Box-in 2H Crate
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              aria-label="Undo"
              className="p-2 rounded-lg bg-[#121A2B] hover:bg-[#192338] disabled:opacity-40 border border-[#22304A] text-[#C9D3E6] cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              aria-label="Redo"
              className="p-2 rounded-lg bg-[#121A2B] hover:bg-[#192338] disabled:opacity-40 border border-[#22304A] text-[#C9D3E6] cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                pushHistory();
                setSegments([]);
                setEllipses([]);
                setPendingStart(null);
                setLastCheckResult(null);
                setLogMsg('log > Cleared isometric drawing board.');
              }}
              aria-label="Clear board"
              className="p-2 rounded-lg bg-[#121A2B] hover:bg-[#3B1219] border border-[#22304A] text-[#FCA5A5] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Geometry Self-Check Action */}
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCheckAccuracy}
              className="w-full py-2 px-3 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Check Accuracy
            </button>
          </div>
        </div>
      }
      logMessage={logMsg}
      rightPanel={
        <div className="space-y-3.5">
          {/* Orthographic Reference Projections */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#D8B4FE]">
                Orthographic Views
              </h2>
              <div className="inline-flex bg-[#0B1220] border border-[#22304A] rounded-md p-0.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setProjectionAngle('first')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    projectionAngle === 'first' ? 'bg-[#291A42] text-[#E9D5FF]' : 'text-[#93A0B8]'
                  }`}
                >
                  1st ∠
                </button>
                <button
                  type="button"
                  onClick={() => setProjectionAngle('third')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    projectionAngle === 'third' ? 'bg-[#291A42] text-[#E9D5FF]' : 'text-[#93A0B8]'
                  }`}
                >
                  3rd ∠
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#93A0B8] leading-relaxed">{exercise.brief}</p>

            {/* 2D Orthographic Elevations arranged in true 1st-angle or 3rd-angle layout */}
            <div className="grid grid-cols-2 gap-2">
              {projectionAngle === 'third' && (
                <>
                  <div className="bg-[#0B1220] border border-[#1E2A42] rounded-lg p-2">
                    <div className="text-[9px] font-mono text-[#93A0B8] mb-1">PLAN (TOP)</div>
                    <svg viewBox="0 0 110 85" className="w-full h-16">
                      {exercise.planRects.map((r, i) =>
                        r.circle ? (
                          <circle
                            key={i}
                            cx={r.x + r.w / 2}
                            cy={r.y + r.h / 2}
                            r={r.w / 2}
                            fill="none"
                            stroke="#5EEAD4"
                            strokeWidth="1.5"
                          />
                        ) : (
                          <rect
                            key={i}
                            x={r.x}
                            y={r.y}
                            width={r.w}
                            height={r.h}
                            fill="none"
                            stroke="#E6EBF5"
                            strokeWidth="1.5"
                            strokeDasharray={r.dashed ? '3 2' : undefined}
                          />
                        )
                      )}
                    </svg>
                  </div>
                  <div className="bg-[#0B1220]/40 border border-dashed border-[#1E2A42] rounded-lg p-2 flex items-center justify-center text-[10px] font-mono text-[#6B778C]">
                    3rd Angle
                  </div>
                </>
              )}

              <div className="bg-[#0B1220] border border-[#1E2A42] rounded-lg p-2">
                <div className="text-[9px] font-mono text-[#93A0B8] mb-1">FRONT ELEVATION</div>
                <svg viewBox="0 0 110 85" className="w-full h-16">
                  {exercise.frontRects.map((r, i) => (
                    <rect
                      key={i}
                      x={r.x}
                      y={r.y}
                      width={r.w}
                      height={r.h}
                      fill="none"
                      stroke={r.dashed ? '#FDBA74' : '#E6EBF5'}
                      strokeWidth="1.5"
                      strokeDasharray={r.dashed ? '3 2' : undefined}
                    />
                  ))}
                </svg>
              </div>

              <div className="bg-[#0B1220] border border-[#1E2A42] rounded-lg p-2">
                <div className="text-[9px] font-mono text-[#93A0B8] mb-1">END (SIDE) VIEW</div>
                <svg viewBox="0 0 110 85" className="w-full h-16">
                  {exercise.sideRects.map((r, i) => (
                    <rect
                      key={i}
                      x={r.x}
                      y={r.y}
                      width={r.w}
                      height={r.h}
                      fill="none"
                      stroke={r.dashed ? '#FDBA74' : '#E6EBF5'}
                      strokeWidth="1.5"
                      strokeDasharray={r.dashed ? '3 2' : undefined}
                    />
                  ))}
                </svg>
              </div>

              {projectionAngle === 'first' && (
                <>
                  <div className="bg-[#0B1220] border border-[#1E2A42] rounded-lg p-2">
                    <div className="text-[9px] font-mono text-[#93A0B8] mb-1">PLAN (BELOW FRONT)</div>
                    <svg viewBox="0 0 110 85" className="w-full h-16">
                      {exercise.planRects.map((r, i) =>
                        r.circle ? (
                          <circle
                            key={i}
                            cx={r.x + r.w / 2}
                            cy={r.y + r.h / 2}
                            r={r.w / 2}
                            fill="none"
                            stroke="#5EEAD4"
                            strokeWidth="1.5"
                          />
                        ) : (
                          <rect
                            key={i}
                            x={r.x}
                            y={r.y}
                            width={r.w}
                            height={r.h}
                            fill="none"
                            stroke="#E6EBF5"
                            strokeWidth="1.5"
                            strokeDasharray={r.dashed ? '3 2' : undefined}
                          />
                        )
                      )}
                    </svg>
                  </div>
                  <div className="bg-[#0B1220]/40 border border-dashed border-[#1E2A42] rounded-lg p-2 flex items-center justify-center text-[10px] font-mono text-[#6B778C]">
                    1st Angle
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Drawing Metrics & Accuracy */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#93A0B8]">
              DRAWING SHEET STATS
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <div className="bg-[#0B1220] rounded-lg p-2">
                <div className="text-[9px] text-[#93A0B8]">HB EDGES</div>
                <div className="text-white font-bold">{objectLineCount}</div>
              </div>
              <div className="bg-[#0B1220] rounded-lg p-2">
                <div className="text-[9px] text-[#93A0B8]">2H LINES</div>
                <div className="text-[#93C5FD] font-bold">{constructionLineCount}</div>
              </div>
              <div className="bg-[#0B1220] rounded-lg p-2">
                <div className="text-[9px] text-[#93A0B8]">CIRCLES</div>
                <div className="text-[#5EEAD4] font-bold">{ellipses.length}</div>
              </div>
            </div>

            {lastCheckResult && (
              <div
                className={`px-3 py-2 rounded-lg border text-xs font-mono ${
                  lastCheckResult.pct >= 80
                    ? 'bg-[#112D2B] border-[#14B8A6] text-[#5EEAD4]'
                    : 'bg-[#3A2112] border-[#F97316] text-[#FDBA74]'
                }`}
              >
                Accuracy: <strong>{lastCheckResult.pct}%</strong> ({lastCheckResult.matched}/
                {lastCheckResult.total} visible HB features)
              </div>
            )}
          </div>

          {/* WAEC Drafting Checklist */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#60A5FA] mb-1.5">
              DRAFTING METHOD (WAEC)
            </div>
            <p className="text-xs text-[#C9D3E6] leading-relaxed">
              1) Box in the full length × width × height crate in faint 2H construction lines at 30°
              to the horizontal. 2) Mark steps and cutouts along the three isometric axes. 3) Darken
              only final visible edges with HB.
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
            onClick={exitIsoTutorialSandbox}
            className="px-3 py-1 rounded-lg bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#0B1220] font-bold text-[11px] cursor-pointer shrink-0"
          >
            Exit Demo &amp; Restore My Drawing
          </button>
        </div>
      )}

      {/* Top Board Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 z-10 mb-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-[#291A42] border border-[#6B21A8] text-[#D8B4FE] font-semibold">
            {exercise.title} · {exercise.dimensionsMm}
          </span>
          {hoverPoint && (
            <span className="px-2.5 py-1 rounded-full bg-[#121A2B] border border-[#22304A] font-mono text-[11px] text-[#5EEAD4]">
              ({hoverPoint.u * 10}, {hoverPoint.v * 10}, {hoverPoint.w * 10}) mm
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setShowGhostGuide((g) => !g)}
            className="px-2.5 py-1 rounded-lg bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-[#C9D3E6] inline-flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            {showGhostGuide ? 'Hide Guide' : 'Show Guide'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPendingStart(null);
              setActiveElevationW(0);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-[#C9D3E6] inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Level
          </button>
        </div>
      </div>

      {/* Main Interactive 30° Isometric Drafting Canvas */}
      <div className="flex-1 flex items-center justify-center relative min-h-[430px] bg-[#090F1D] rounded-xl border border-[#1E2A42] overflow-hidden">
        <svg
          viewBox="0 0 760 460"
          onPointerMove={handleSvgPointerMove}
          onPointerDown={handleSvgClick}
          className={`w-full h-full max-h-[450px] select-none ${
            activeTool === 'eraser' ? 'cursor-not-allowed' : 'cursor-crosshair'
          }`}
          role="img"
          aria-label={`Interactive 30-degree isometric technical drawing board for ${exercise.title}`}
        >
          {/* 30° Isometric Grid Lines */}
          {showGrid && (
            <g opacity="0.35">
              {gridLines.map((ln) => (
                <line
                  key={ln.key}
                  x1={ln.x1}
                  y1={ln.y1}
                  x2={ln.x2}
                  y2={ln.y2}
                  stroke="#334155"
                  strokeWidth="0.9"
                />
              ))}
            </g>
          )}

          {/* Isometric Reference Axes (30° X, 150° Y, 90° Z) */}
          {showAxes && (() => {
            const o = isoToScreen({ u: 0, v: 0, w: 0 });
            const xEnd = isoToScreen({ u: 7.4, v: 0, w: 0 });
            const yEnd = isoToScreen({ u: 0, v: 5.4, w: 0 });
            const zEnd = isoToScreen({ u: 0, v: 0, w: 5.5 });
            return (
              <g>
                <line x1={o.x} y1={o.y} x2={xEnd.x} y2={xEnd.y} stroke="#F97316" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7" />
                <line x1={o.x} y1={o.y} x2={yEnd.x} y2={yEnd.y} stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7" />
                <line x1={o.x} y1={o.y} x2={zEnd.x} y2={zEnd.y} stroke="#4ADE80" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7" />
                <text x={xEnd.x + 6} y={xEnd.y + 4} fill="#F97316" fontSize="10" fontFamily="JetBrains Mono, monospace">
                  X (30°)
                </text>
                <text x={yEnd.x - 42} y={yEnd.y + 4} fill="#38BDF8" fontSize="10" fontFamily="JetBrains Mono, monospace">
                  Y (30°)
                </text>
                <text x={zEnd.x + 6} y={zEnd.y + 4} fill="#4ADE80" fontSize="10" fontFamily="JetBrains Mono, monospace">
                  Z (90°)
                </text>
              </g>
            );
          })()}

          {/* Optional Ghost Target Guide Outline */}
          {showGhostGuide && (
            <g opacity="0.24" pointerEvents="none">
              {exercise.targetEdges.map(([a, b], idx) => {
                const sa = isoToScreen(a);
                const sb = isoToScreen(b);
                return (
                  <line
                    key={`ghost-${idx}`}
                    x1={sa.x}
                    y1={sa.y}
                    x2={sb.x}
                    y2={sb.y}
                    stroke="#C084FC"
                    strokeWidth="1.6"
                    strokeDasharray="4 4"
                  />
                );
              })}
              {exercise.ellipses?.map((el, idx) => (
                <path
                  key={`ghost-el-${idx}`}
                  d={buildIsoEllipsePath(el.center, el.radiusUnits, el.plane)}
                  fill="none"
                  stroke="#C084FC"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              ))}
            </g>
          )}

          {/* Drawn Isometric Segments */}
          {segments.map((seg) => {
            const sa = isoToScreen(seg.a);
            const sb = isoToScreen(seg.b);
            const cfg = LINE_STYLE_CFG[seg.style];
            return (
              <line
                key={seg.id}
                x1={sa.x}
                y1={sa.y}
                x2={sb.x}
                y2={sb.y}
                stroke={cfg.stroke}
                strokeWidth={cfg.width}
                strokeDasharray={cfg.dash}
                strokeLinecap="round"
                className={activeTool === 'eraser' ? 'cursor-pointer hover:stroke-[#F87171]' : ''}
                onClick={(e) => {
                  if (activeTool !== 'eraser') return;
                  e.stopPropagation();
                  pushHistory();
                  setSegments((prev) => prev.filter((item) => item.id !== seg.id));
                  setLogMsg('log > Erased isometric segment.');
                }}
              />
            );
          })}

          {/* Drawn Isometric Circles / Ellipses */}
          {ellipses.map((el) => {
            const cfg = LINE_STYLE_CFG[el.style];
            return (
              <path
                key={el.id}
                d={buildIsoEllipsePath(el.center, el.radiusUnits, el.plane)}
                fill="none"
                stroke={cfg.stroke}
                strokeWidth={cfg.width}
                strokeDasharray={cfg.dash}
                className={activeTool === 'eraser' ? 'cursor-pointer hover:stroke-[#F87171]' : ''}
                onClick={(e) => {
                  if (activeTool !== 'eraser') return;
                  e.stopPropagation();
                  pushHistory();
                  setEllipses((prev) => prev.filter((item) => item.id !== el.id));
                  setLogMsg('log > Erased isometric circle.');
                }}
              />
            );
          })}

          {/* Rubber-band preview line when placing a segment */}
          {pendingStart && hoverPoint && (() => {
            const sa = isoToScreen(pendingStart);
            const sb = isoToScreen(hoverPoint);
            return (
              <line
                x1={sa.x}
                y1={sa.y}
                x2={sb.x}
                y2={sb.y}
                stroke="#F97316"
                strokeWidth="1.8"
                strokeDasharray="5 3"
                pointerEvents="none"
              />
            );
          })()}

          {/* Snappable Lattice Nodes */}
          {showGrid &&
            snapPoints.map((p) => {
              const sc = isoToScreen(p);
              const isHover = hoverPoint && ptKey(hoverPoint) === ptKey(p);
              const isStart = pendingStart && ptKey(pendingStart) === ptKey(p);
              return (
                <circle
                  key={ptKey(p)}
                  cx={sc.x}
                  cy={sc.y}
                  r={isStart ? 5 : isHover ? 4.5 : 1.7}
                  fill={isStart ? '#F97316' : isHover ? '#5EEAD4' : '#64748B'}
                  opacity={isStart || isHover ? 1 : 0.45}
                  pointerEvents="none"
                />
              );
            })}
        </svg>
      </div>
    </LabLayout>
  );
}
