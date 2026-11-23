import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Trash2, RotateCw, RefreshCw } from 'lucide-react';
import { LabLayout } from '../../lab-shell/LabLayout';

export type ComponentKind =
  | 'battery'
  | 'rheostat'
  | 'ammeter'
  | 'wireX'
  | 'voltmeter'
  | 'key'
  | 'diode'
  | 'led'
  | 'resistor'
  | 'capacitor';

export type ActiveTool = 'pointer' | 'probe' | 'wire' | 'meters' | 'note';

export interface CircuitNode {
  id: string;
  kind: ComponentKind;
  label: string;
  x: number;
  y: number;
  rotation: 0 | 90;
  value: number; // e.g. EMF in V, Resistance in Ω, Capacitance in µF
  unit: string;
}

export interface CircuitWire {
  id: string;
  fromNode: string;
  fromTerm: 'a' | 'b';
  toNode: string;
  toTerm: 'a' | 'b';
  parallel?: boolean;
}

export interface OhmsReading {
  id: number;
  rhOhm: number;
  currentA: number;
  voltageV: number;
  ratioR: number;
}

const DEFAULT_NODES: CircuitNode[] = [
  { id: 'bat1', kind: 'battery', label: 'E', x: 80, y: 195, rotation: 90, value: 3.0, unit: 'V' },
  { id: 'rh1', kind: 'rheostat', label: 'Rh', x: 205, y: 70, rotation: 0, value: 8.0, unit: 'Ω' },
  { id: 'am1', kind: 'ammeter', label: 'A', x: 355, y: 70, rotation: 0, value: 0.05, unit: 'Ω' },
  { id: 'wx1', kind: 'wireX', label: 'X', x: 460, y: 205, rotation: 90, value: 4.68, unit: 'Ω' },
  { id: 'vm1', kind: 'voltmeter', label: 'V', x: 560, y: 205, rotation: 90, value: 10000, unit: 'Ω' },
  { id: 'key1', kind: 'key', label: 'K', x: 260, y: 320, rotation: 0, value: 1, unit: '' },
];

const DEFAULT_WIRES: CircuitWire[] = [
  { id: 'w1', fromNode: 'bat1', fromTerm: 'a', toNode: 'rh1', toTerm: 'a' },
  { id: 'w2', fromNode: 'rh1', fromTerm: 'b', toNode: 'am1', toTerm: 'a' },
  { id: 'w3', fromNode: 'am1', fromTerm: 'b', toNode: 'wx1', toTerm: 'a' },
  { id: 'w4', fromNode: 'wx1', fromTerm: 'b', toNode: 'key1', toTerm: 'b' },
  { id: 'w5', fromNode: 'key1', fromTerm: 'a', toNode: 'bat1', toTerm: 'b' },
  { id: 'w6', fromNode: 'wx1', fromTerm: 'a', toNode: 'vm1', toTerm: 'a', parallel: true },
  { id: 'w7', fromNode: 'vm1', fromTerm: 'b', toNode: 'wx1', toTerm: 'b', parallel: true },
];

const INITIAL_READINGS: OhmsReading[] = [];

export function OhmsLawLab() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'schematic' | 'bench'>('schematic');
  const [activeTool, setActiveTool] = useState<ActiveTool>('pointer');

  // Interactive circuit nodes & wires
  const [nodes, setNodes] = useState<CircuitNode[]>(DEFAULT_NODES);
  const [wires, setWires] = useState<CircuitWire[]>(DEFAULT_WIRES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('rh1');
  const [pendingTerm, setPendingTerm] = useState<{ nodeId: string; term: 'a' | 'b' } | null>(
    null
  );
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingWiper, setDraggingWiper] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Infinite Schematic Canvas Pan & Zoom ("Move Above and Beyond")
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [panStart, setPanStart] = useState<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
  } | null>(null);

  // Custom Circuit Lab Right-Click Context Menu
  const [circuitMenu, setCircuitMenu] = useState<{
    clientX: number;
    clientY: number;
    svgX: number;
    svgY: number;
    targetNodeId: string | null;
    targetWireId: string | null;
  } | null>(null);

  // Live cursor position in SVG space for rubber-band wire preview
  const [cursorSvgPt, setCursorSvgPt] = useState<{ x: number; y: number } | null>(null);

  // Circuit & instrument parameters
  const [keyClosed, setKeyClosed] = useState(true);
  const [rheostatOhm, setRheostatOhm] = useState(8.0);
  const [emfV, setEmfV] = useState(3.0);
  const [wireLengthCm, setWireLengthCm] = useState(100);
  const [wireMaterial, setWireMaterial] = useState<'nichrome' | 'constantan' | 'copper'>(
    'nichrome'
  );
  const [ammeterMax, setAmmeterMax] = useState<1 | 3>(1);
  const [voltmeterMax, setVoltmeterMax] = useState<3 | 15>(3);
  const [showDigitalDMM, setShowDigitalDMM] = useState(true);
  const [ammeterZeroErr, setAmmeterZeroErr] = useState(0.0);
  const [voltmeterZeroErr, setVoltmeterZeroErr] = useState(0.0);
  const [wireTemp, setWireTemp] = useState(27.0);
  const [dashOffset, setDashOffset] = useState(0);

  // Readings & Interactive Graph State (persisted across navigation in localStorage)
  const [readings, setReadings] = useState<OhmsReading[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('vixir_ohms_readings');
        if (raw) return JSON.parse(raw) as OhmsReading[];
      }
    } catch {
      // ignore
    }
    return INITIAL_READINGS;
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('vixir_ohms_readings', JSON.stringify(readings));
      }
    } catch {
      // ignore
    }
  }, [readings]);
  const [showBestFit, setShowBestFit] = useState(true);
  const [graphAxisMode, setGraphAxisMode] = useState<'V-I' | 'I-V'>('V-I');
  const [manualI, setManualI] = useState('');
  const [manualV, setManualV] = useState('');
  const [probedNodeId, setProbedNodeId] = useState<string>('wx1');
  const [logMsg, setLogMsg] = useState('log > Key closed. Circuit complete.');

  // Sync rheostatOhm and emfV with nodes
  const updateRheostat = (val: number) => {
    const clamped = Math.max(0, Math.min(20, Number(val.toFixed(1))));
    setRheostatOhm(clamped);
    setNodes((prev) =>
      prev.map((n) => (n.kind === 'rheostat' ? { ...n, value: clamped } : n))
    );
  };

  // Base resistance of Wire X depends on material and length
  const resistivityPer100cm =
    wireMaterial === 'nichrome' ? 4.68 : wireMaterial === 'constantan' ? 2.45 : 0.35;
  const baseWireR = resistivityPer100cm * (wireLengthCm / 100);

  // Additional series components placed by student (e.g. extra resistors, diodes, LEDs)
  const extraSeriesR = nodes
    .filter((n) => n.kind === 'resistor')
    .reduce((sum, n) => sum + n.value, 0);
  const hasDiode = nodes.some((n) => n.kind === 'diode');
  const hasLed = nodes.some((n) => n.kind === 'led');
  const diodeDrop = (hasDiode ? 0.65 : 0) + (hasLed ? 1.8 : 0);

  // Circuit solver
  const internalR = 0.6;
  const wireR = baseWireR * (1 + 0.004 * (wireTemp - 25));
  const totalR = Math.max(0.2, internalR + rheostatOhm + wireR + extraSeriesR);
  const hasCompleteLoop = wires.length >= 4 && nodes.some((n) => n.kind === 'battery');
  const effectiveEmf = Math.max(0, emfV - diodeDrop);
  const trueCurrentA = keyClosed && hasCompleteLoop ? effectiveEmf / totalR : 0;
  const trueVoltageV = trueCurrentA * wireR;

  const displayedCurrentA = Math.max(0, trueCurrentA + ammeterZeroErr);
  const displayedVoltageV = Math.max(0, trueVoltageV + voltmeterZeroErr);
  const powerW = trueCurrentA * trueVoltageV;

  // Animate current dots & gradual wire heating while key is closed
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!keyClosed || !hasCompleteLoop || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setDashOffset((prev) => (prev - 3) % 200);
      setWireTemp((prev) =>
        Math.min(48, Number((prev + trueCurrentA * 0.05).toFixed(1)))
      );
    }, 80);

    return () => clearInterval(timer);
  }, [keyClosed, hasCompleteLoop, trueCurrentA]);

  // Helper to get terminal coordinates in SVG space
  const getTerminalPos = (node: CircuitNode, term: 'a' | 'b') => {
    const span =
      node.kind === 'rheostat'
        ? 75
        : node.kind === 'wireX' || node.kind === 'resistor'
          ? 45
          : node.kind === 'key'
            ? 30
            : node.kind === 'battery'
              ? 35
              : 26;
    if (node.rotation === 0) {
      return {
        x: term === 'a' ? node.x - span : node.x + span,
        y: node.y,
      };
    } else {
      return {
        x: node.x,
        y: term === 'a' ? node.y - span : node.y + span,
      };
    }
  };

  // Convert pointer event to exact SVG coordinates using native CTM inverse (works at any zoom/aspect ratio)
  // Zoom is anchored around the canvas center (320, 200) so scaling materials NEVER shifts the circuit off-center!
  const viewWidth = 640 / zoom;
  const viewHeight = 400 / zoom;
  const viewMinX = Math.round(320 - viewWidth / 2 + pan.x);
  const viewMinY = Math.round(200 - viewHeight / 2 + pan.y);

  const toSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 300, y: 200 };
    if (typeof svg.createSVGPoint === 'function' && typeof svg.getScreenCTM === 'function') {
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const transformed = pt.matrixTransform(ctm.inverse());
        return {
          x: Math.round(transformed.x / 5) * 5,
          y: Math.round(transformed.y / 5) * 5,
        };
      }
    }
    const rect = svg.getBoundingClientRect();
    const scaleX = viewWidth / Math.max(1, rect.width);
    const scaleY = viewHeight / Math.max(1, rect.height);
    return {
      x: Math.round((viewMinX + (clientX - rect.left) * scaleX) / 5) * 5,
      y: Math.round((viewMinY + (clientY - rect.top) * scaleY) / 5) * 5,
    };
  };

  // Connect a wire between two node terminals (avoiding self-loops and exact duplicates)
  const connectTerminals = (
    fromNodeId: string,
    fromTerm: 'a' | 'b',
    toNodeId: string,
    toTerm: 'a' | 'b'
  ) => {
    if (fromNodeId === toNodeId && fromTerm === toTerm) {
      setPendingTerm(null);
      return;
    }
    const alreadyExists = wires.some(
      (w) =>
        (w.fromNode === fromNodeId &&
          w.fromTerm === fromTerm &&
          w.toNode === toNodeId &&
          w.toTerm === toTerm) ||
        (w.fromNode === toNodeId &&
          w.fromTerm === toTerm &&
          w.toNode === fromNodeId &&
          w.toTerm === fromTerm)
    );
    const fromLabel = nodes.find((n) => n.id === fromNodeId)?.label ?? fromNodeId;
    const toLabel = nodes.find((n) => n.id === toNodeId)?.label ?? toNodeId;
    if (alreadyExists) {
      setPendingTerm(null);
      setLogMsg(`log > ${fromLabel}:${fromTerm} is already connected to ${toLabel}:${toTerm}.`);
      return;
    }
    const newWire: CircuitWire = {
      id: `w-${Date.now().toString().slice(-4)}`,
      fromNode: fromNodeId,
      fromTerm,
      toNode: toNodeId,
      toTerm,
    };
    setWires((prev) => [...prev, newWire]);
    setPendingTerm(null);
    setSelectedNodeId(toNodeId);
    setLogMsg(
      `log > Connected wire from ${fromLabel}:${fromTerm} → ${toLabel}:${toTerm}.`
    );
  };

  // Pick whichever terminal ('a' or 'b') on targetNode is closer to a given SVG point
  const getClosestTerminal = (targetNode: CircuitNode, refPt: { x: number; y: number }): 'a' | 'b' => {
    const posA = getTerminalPos(targetNode, 'a');
    const posB = getTerminalPos(targetNode, 'b');
    const distA = Math.hypot(posA.x - refPt.x, posA.y - refPt.y);
    const distB = Math.hypot(posB.x - refPt.x, posB.y - refPt.y);
    return distA <= distB ? 'a' : 'b';
  };

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (circuitMenu) setCircuitMenu(null);
    if (e.button !== 0 && e.button !== 1) return;
    // Clicking on the empty schematic canvas starts panning the board
    setPanStart({
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    });
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = toSvgCoords(e.clientX, e.clientY);
    if (pendingTerm) {
      setCursorSvgPt(pt);
    }

    if (draggingWiper) {
      const rhNode = nodes.find((n) => n.id === selectedNodeId && n.kind === 'rheostat') ??
        nodes.find((n) => n.kind === 'rheostat');
      if (!rhNode) return;
      const frac = Math.max(0, Math.min(1, (pt.x - (rhNode.x - 62)) / 124));
      const newRh = Math.round(frac * 20);
      updateRheostat(newRh);
      setLogMsg(`log > Dragged rheostat wiper to Rh = ${newRh} Ω.`);
      return;
    }

    if (draggingNodeId) {
      // Unclamped free movement across the entire infinite schematic plane
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId ? { ...n, x: pt.x, y: pt.y } : n
        )
      );
      return;
    }

    if (panStart) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = ((e.clientX - panStart.clientX) * viewWidth) / Math.max(1, rect.width);
      const dy = ((e.clientY - panStart.clientY) * viewHeight) / Math.max(1, rect.height);
      setPan({
        x: Math.round(panStart.panX - dx),
        y: Math.round(panStart.panY - dy),
      });
    }
  };

  const handleSvgPointerUp = () => {
    setDraggingNodeId(null);
    setDraggingWiper(false);
    setPanStart(null);
  };

  const handleSvgWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    // Only zoom on Ctrl/Cmd + wheel (or pinch) so normal trackpad/mouse scrolling doesn't unexpectedly move the canvas
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoom((z) => Math.max(0.45, Math.min(2.4, Number((z * factor).toFixed(2)))));
  };

  const handleCenterCanvas = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setLogMsg('log > Centered and fitted schematic canvas view (100%).');
  };

  const handleTerminalInteraction = (
    nodeId: string,
    term: 'a' | 'b',
    e: React.MouseEvent | React.PointerEvent
  ) => {
    e.stopPropagation();
    setCircuitMenu(null);
    setSelectedNodeId(nodeId);
    const nodeObj = nodes.find((n) => n.id === nodeId);

    if (!pendingTerm) {
      setPendingTerm({ nodeId, term });
      if (nodeObj) {
        setCursorSvgPt(getTerminalPos(nodeObj, term));
      }
      setLogMsg(
        `log > Wiring from ${nodeObj?.label ?? nodeId}:${term} — click any target component or terminal pin to connect.`
      );
      return;
    }

    if (pendingTerm.nodeId === nodeId && pendingTerm.term === term) {
      setPendingTerm(null);
      setCursorSvgPt(null);
      setLogMsg('log > Cancelled pending wire connection.');
      return;
    }

    connectTerminals(pendingTerm.nodeId, pendingTerm.term, nodeId, term);
    setCursorSvgPt(null);
  };

  const handleAddComponent = (kind: ComponentKind, customPos?: { x: number; y: number }) => {
    const count = nodes.filter((n) => n.kind === kind).length + 1;
    const defaults: Record<
      ComponentKind,
      { label: string; value: number; unit: string; rot: 0 | 90 }
    > = {
      battery: { label: `E${count}`, value: 3.0, unit: 'V', rot: 90 },
      rheostat: { label: `Rh${count}`, value: 10.0, unit: 'Ω', rot: 0 },
      ammeter: { label: `A${count}`, value: 0.05, unit: 'Ω', rot: 0 },
      voltmeter: { label: `V${count}`, value: 10000, unit: 'Ω', rot: 90 },
      wireX: { label: `X${count}`, value: 4.7, unit: 'Ω', rot: 90 },
      key: { label: `K${count}`, value: 1, unit: '', rot: 0 },
      diode: { label: `D${count}`, value: 0.65, unit: 'V', rot: 0 },
      led: { label: `LED${count}`, value: 1.8, unit: 'V', rot: 0 },
      resistor: { label: `R${count}`, value: 5.0, unit: 'Ω', rot: 0 },
      capacitor: { label: `C${count}`, value: 100, unit: 'µF', rot: 0 },
    };
    const cfg = defaults[kind];
    const newId = `${kind}-${Date.now().toString().slice(-3)}`;
    const newNode: CircuitNode = {
      id: newId,
      kind,
      label: cfg.label,
      x: customPos ? customPos.x : pan.x + 260 + ((nodes.length * 30) % 140),
      y: customPos ? customPos.y : pan.y + 190 + ((nodes.length * 20) % 80),
      rotation: cfg.rot,
      value: cfg.value,
      unit: cfg.unit,
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
    setLogMsg(
      `log > Added ${cfg.label} (${cfg.value} ${cfg.unit}) to circuit board. Drag freely or right-click for component actions.`
    );
  };

  const handleDuplicateNode = (nodeId: string) => {
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return;
    handleAddComponent(target.kind, { x: target.x + 45, y: target.y + 45 });
  };

  const handleDisconnectNodeWires = (nodeId: string) => {
    const target = nodes.find((n) => n.id === nodeId);
    setWires((prev) => prev.filter((w) => w.fromNode !== nodeId && w.toNode !== nodeId));
    setLogMsg(`log > Disconnected all wires attached to ${target?.label ?? nodeId}.`);
  };

  const handleRemoveSelectedNode = () => {
    if (!selectedNodeId) return;
    const target = nodes.find((n) => n.id === selectedNodeId);
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setWires((prev) =>
      prev.filter(
        (w) => w.fromNode !== selectedNodeId && w.toNode !== selectedNodeId
      )
    );
    setLogMsg(`log > Removed component ${target?.label ?? selectedNodeId} from board.`);
    setSelectedNodeId(null);
  };

  const handleRotateSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNodeId
          ? { ...n, rotation: n.rotation === 0 ? 90 : 0 }
          : n
      )
    );
    setLogMsg(`log > Rotated component ${selectedNodeId} by 90°.`);
  };

  const handleResetStandardCircuit = () => {
    setNodes(DEFAULT_NODES);
    setWires(DEFAULT_WIRES);
    setSelectedNodeId('rh1');
    setPendingTerm(null);
    setKeyClosed(true);
    updateRheostat(8);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setLogMsg("log > Restored standard Verifying Ohm's Law circuit diagram.");
  };

  // Listen for Vix Co-Builder (`buildSetup` RPC) to draw/wire circuits requested by the student
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onVixBuild = (ev: Event) => {
      const detail = (ev as CustomEvent<Record<string, unknown>>).detail;
      if (!detail) return;

      if (Array.isArray(detail.nodes) && detail.nodes.length > 0) {
        setNodes(detail.nodes as CircuitNode[]);
        if (Array.isArray(detail.wires)) {
          setWires(detail.wires as CircuitWire[]);
        }
        setPan({ x: 0, y: 0 });
        setZoom(1);
        setPendingTerm(null);
        setKeyClosed(true);
        setLogMsg(
          `log > Vix drew circuit setup: ${String(detail.summary || 'Custom schematic layout')}.`
        );
        return;
      }

      if (detail.action === 'reset') {
        handleResetStandardCircuit();
        return;
      }

      if (typeof detail.addKind === 'string') {
        handleAddComponent(detail.addKind as ComponentKind, { x: 320, y: 210 });
      }
    };

    window.addEventListener('vix:build-setup', onVixBuild);
    return () => window.removeEventListener('vix:build-setup', onVixBuild);
  });

  const handleToggleKey = () => {
    const next = !keyClosed;
    setKeyClosed(next);
    if (!next) {
      setWireTemp((prev) => Math.max(25.0, Number((prev - 0.8).toFixed(1))));
    }
    setLogMsg(
      next
        ? `log > Key closed. Current I = ${displayedCurrentA.toFixed(2)} A, V = ${displayedVoltageV.toFixed(2)} V.`
        : 'log > Key opened. Wire X cooling toward room temperature.'
    );
  };

  const handleRecord = () => {
    if (!keyClosed) {
      setLogMsg('log > Close the plug key (K) before taking a meter reading.');
      return;
    }
    const iRounded = Number(displayedCurrentA.toFixed(2));
    const vRounded = Number(displayedVoltageV.toFixed(2));
    const ratio = Number((vRounded / Math.max(iRounded, 0.01)).toFixed(2));
    const nextRow: OhmsReading = {
      id: readings.length + 1,
      rhOhm: rheostatOhm,
      currentA: iRounded,
      voltageV: vRounded,
      ratioR: ratio,
    };
    setReadings((prev) => [...prev, nextRow]);
    setLogMsg(
      `log > Recorded reading #${nextRow.id}: Rh = ${rheostatOhm} Ω, I = ${iRounded.toFixed(2)} A, V = ${vRounded.toFixed(2)} V.`
    );
  };

  const handleAddManualReading = (e: React.FormEvent) => {
    e.preventDefault();
    const iVal = parseFloat(manualI);
    const vVal = parseFloat(manualV);
    if (isNaN(iVal) || isNaN(vVal) || iVal <= 0) return;
    const nextRow: OhmsReading = {
      id: readings.length + 1,
      rhOhm: rheostatOhm,
      currentA: Number(iVal.toFixed(2)),
      voltageV: Number(vVal.toFixed(2)),
      ratioR: Number((vVal / iVal).toFixed(2)),
    };
    setReadings((prev) => [...prev, nextRow]);
    setManualI('');
    setManualV('');
    setLogMsg(
      `log > Added custom data point (#${nextRow.id}): I = ${nextRow.currentA} A, V = ${nextRow.voltageV} V.`
    );
  };

  const handleDeleteReading = (id: number) => {
    setReadings((prev) =>
      prev.filter((r) => r.id !== id).map((r, idx) => ({ ...r, id: idx + 1 }))
    );
    setLogMsg(`log > Deleted reading #${id} from table and plot.`);
  };

  // Analogue dial needle helper
  const getNeedleCoords = (fraction: number, cx: number, cy: number, len: number) => {
    const clamped = Math.max(0, Math.min(1.05, fraction));
    const angleDeg = -155 + clamped * 130;
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x2: cx + len * Math.cos(rad),
      y2: cy + len * Math.sin(rad),
    };
  };

  const ammeterNeedle = getNeedleCoords(displayedCurrentA / ammeterMax, 110, 96, 66);
  const voltmeterNeedle = getNeedleCoords(displayedVoltageV / voltmeterMax, 110, 96, 66);

  // Least-squares linear regression slope for live graph
  const meanSlope =
    readings.length > 0
      ? readings.reduce((acc, r) => acc + r.ratioR, 0) / readings.length
      : 4.7;

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const probedNode = nodes.find((n) => n.id === probedNodeId) ?? nodes[3];

  // Orthogonal L-shaped wire routing between two terminals
  const buildWirePath = (w: CircuitWire) => {
    const nFrom = nodes.find((n) => n.id === w.fromNode);
    const nTo = nodes.find((n) => n.id === w.toNode);
    if (!nFrom || !nTo) return '';
    const p1 = getTerminalPos(nFrom, w.fromTerm);
    const p2 = getTerminalPos(nTo, w.toTerm);

    if (w.parallel) {
      const midX = Math.max(p1.x, p2.x);
      return `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
    }

    // Orthogonal corner routing matching clean schematic style
    if (Math.abs(p1.y - p2.y) < 12 || Math.abs(p1.x - p2.x) < 12) {
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }
    // Corner at outer perimeter
    const cornerX = p1.x < 120 || p2.x < 120 ? Math.min(p1.x, p2.x) : Math.max(p1.x, p2.x);
    const cornerY = p1.x < 120 || p2.x < 120 ? Math.min(p1.y, p2.y) : Math.min(p1.y, p2.y);
    if (w.fromNode === 'bat1' && w.toNode === 'rh1') {
      return `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y} L ${p2.x} ${p2.y}`;
    }
    if (w.fromNode === 'key1' && w.toNode === 'bat1') {
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }
    if (w.fromNode === 'am1' && w.toNode === 'wx1') {
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }
    if (w.fromNode === 'wx1' && w.toNode === 'key1') {
      return `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y} L ${p2.x} ${p2.y}`;
    }
    return `M ${p1.x} ${p1.y} L ${cornerX} ${cornerY} L ${p2.x} ${p2.y}`;
  };

  return (
    <LabLayout
      experimentTitle="Verifying Ohm’s law"
      subtitle="Graded · determine the resistance of wire X · autosaved"
      activeLab="electronics"
      mode="graded"
      dotGrid={true}
      headerRightExtra={
        <div className="hidden sm:flex items-center bg-[#121A2B] border border-[#22304A] rounded-full p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('schematic')}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              viewMode === 'schematic'
                ? 'bg-[#112D2B] text-[#5EEAD4]'
                : 'text-[#93A0B8] hover:text-[#E6EBF5]'
            }`}
          >
            Schematic
          </button>
          <button
            type="button"
            onClick={() => setViewMode('bench')}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              viewMode === 'bench'
                ? 'bg-[#112D2B] text-[#5EEAD4]'
                : 'text-[#93A0B8] hover:text-[#E6EBF5]'
            }`}
          >
            Bench
          </button>
        </div>
      }
      nextStepLabel="Plot V–I →"
      onNextStep={() => navigate('/attempt/demo/results')}
      toolRail={[
        {
          id: 'pointer',
          label: 'Select & drag components',
          icon: 'pointer',
          active: activeTool === 'pointer',
          onClick: () => setActiveTool('pointer'),
        },
        {
          id: 'probe',
          label: 'Oscilloscope & node probe',
          icon: 'wave',
          active: activeTool === 'probe',
          onClick: () => setActiveTool('probe'),
        },
        {
          id: 'wire',
          label: 'Wire connection tool',
          icon: 'pen',
          active: activeTool === 'wire',
          onClick: () => setActiveTool('wire'),
        },
        {
          id: 'meters',
          label: 'Digital multimeter & zeroing',
          icon: 'gauge',
          active: activeTool === 'meters',
          onClick: () => setActiveTool('meters'),
        },
        {
          id: 'note',
          label: 'Circuit parameters',
          icon: 'note',
          active: activeTool === 'note',
          onClick: () => setActiveTool('note'),
        },
      ]}
      toolRailAccent="bg-[#112D2B] text-[#5EEAD4]"
      leftTray={
        <div className="space-y-3">
          {/* Interactive Tool Mode Switcher */}
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#93A0B8] mb-1.5">
              WORKBENCH MODE
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
              {[
                { id: 'pointer' as const, label: 'Move / Edit' },
                { id: 'wire' as const, label: 'Wire Pins' },
                { id: 'probe' as const, label: 'Scope Probe' },
                { id: 'meters' as const, label: 'Calibrate' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveTool(m.id);
                    setPendingTerm(null);
                  }}
                  className={`py-1.5 px-2 rounded-lg border transition-colors cursor-pointer ${
                    activeTool === m.id
                      ? 'bg-[#112D2B] border-[#14B8A6] text-[#5EEAD4]'
                      : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6] hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Core Components · Click to select or + to add to diagram */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2">
              <span>COMPONENTS · IN CIRCUIT</span>
              <span className="text-[10px] text-[#5EEAD4] font-normal">+ add</span>
            </div>
            <div className="space-y-1.5">
              {[
                {
                  kind: 'battery' as const,
                  nodeId: 'bat1',
                  name: `2 × dry cells (E = ${emfV.toFixed(1)} V)`,
                  sub: '≈ 3.0 V, internal r = 0.6 Ω',
                },
                {
                  kind: 'key' as const,
                  nodeId: 'key1',
                  name: 'Key (K)',
                  sub: keyClosed ? 'plug key · CLOSED' : 'plug key · OPEN',
                },
                {
                  kind: 'rheostat' as const,
                  nodeId: 'rh1',
                  name: `Rheostat (Rh = ${rheostatOhm} Ω)`,
                  sub: '0 – 20 Ω sliding contact',
                },
                {
                  kind: 'ammeter' as const,
                  nodeId: 'am1',
                  name: 'Ammeter (A)',
                  sub: `0–${ammeterMax} A range, in series`,
                },
                {
                  kind: 'voltmeter' as const,
                  nodeId: 'vm1',
                  name: 'Voltmeter (V)',
                  sub: `0–${voltmeterMax} V range, in parallel`,
                },
                {
                  kind: 'wireX' as const,
                  nodeId: 'wx1',
                  name: 'Wire X',
                  sub: `${wireMaterial}, ${wireLengthCm} cm, SWG 28`,
                },
              ].map((comp) => {
                const isSel = selectedNodeId === comp.nodeId;
                return (
                  <div
                    key={comp.name}
                    onClick={() => setSelectedNodeId(comp.nodeId)}
                    className={`rounded-xl px-3 py-2 border transition-colors cursor-pointer flex items-center justify-between gap-1 ${
                      isSel
                        ? 'bg-[#112D2B] border-[#14B8A6] text-white'
                        : 'bg-[#121A2B] border-[#22304A] hover:border-[#3A4A68] text-[#E6EBF5]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{comp.name}</div>
                      <div className="text-[11px] text-[#93A0B8] truncate">{comp.sub}</div>
                    </div>
                    <button
                      type="button"
                      title={`Add another ${comp.kind} to diagram`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddComponent(comp.kind);
                      }}
                      className="w-6 h-6 rounded-lg bg-[#0B1220] hover:bg-[#1C2A47] border border-[#22304A] flex items-center justify-center text-[#5EEAD4] shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extra Parts Palette: Diode, LED, Resistor, Capacitor */}
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#93A0B8] mb-1.5">
              ADD EXTRA COMPONENTS
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { kind: 'resistor', label: '+ Resistor 5Ω' },
                  { kind: 'diode', label: '+ Si Diode' },
                  { kind: 'led', label: '+ Green LED' },
                  { kind: 'capacitor', label: '+ 100µF Cap' },
                ] as const
              ).map((item) => (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() => handleAddComponent(item.kind)}
                  className="py-1.5 px-2 rounded-lg border border-dashed border-[#2C3B59] hover:border-[#5EEAD4] text-[11px] font-medium text-[#C9D3E6] hover:text-[#5EEAD4] transition-colors cursor-pointer text-left"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wire X Physical Property Controls */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-2.5 space-y-2">
            <div className="text-[10px] font-bold uppercase text-[#5EEAD4]">
              TEST WIRE X PROPERTIES
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold">
              {(['nichrome', 'constantan', 'copper'] as const).map((mat) => (
                <button
                  key={mat}
                  type="button"
                  onClick={() => {
                    setWireMaterial(mat);
                    setLogMsg(`log > Changed test wire X material to ${mat}.`);
                  }}
                  className={`py-1 rounded capitalize cursor-pointer ${
                    wireMaterial === mat
                      ? 'bg-[#112D2B] text-[#5EEAD4] border border-[#14B8A6]/40'
                      : 'bg-[#0B1220] text-[#93A0B8]'
                  }`}
                >
                  {mat}
                </button>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-[#93A0B8] mb-0.5">
                <span>Wire length L</span>
                <span className="font-mono text-[#E6EBF5]">{wireLengthCm} cm</span>
              </div>
              <input
                type="range"
                aria-label="Test wire length in cm"
                min={25}
                max={150}
                step={5}
                value={wireLengthCm}
                onChange={(e) => setWireLengthCm(Number(e.target.value))}
                className="w-full accent-[#2DD4BF] cursor-pointer"
              />
            </div>
          </div>
        </div>
      }
      bottomDock={
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          {/* Analogue + Digital Ammeter Card */}
          <div className="md:col-span-4 bg-[#121A2B] border border-[#22304A] rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[#93A0B8] font-semibold">Ammeter</span>
                {showDigitalDMM && (
                  <span className="px-2 py-0.5 rounded bg-[#0B1220] border border-[#22304A] font-mono text-xs font-bold text-[#5EEAD4]">
                    {displayedCurrentA.toFixed(3)} A
                  </span>
                )}
              </div>
              <button
                type="button"
                title="Switch Ammeter Full-Scale Range"
                onClick={() => {
                  const next = ammeterMax === 1 ? 3 : 1;
                  setAmmeterMax(next);
                  setLogMsg(`log > Switched Ammeter range to 0–${next} A.`);
                }}
                className="px-2 py-0.5 rounded bg-[#112D2B] border border-[#14B8A6]/40 font-mono text-[11px] font-semibold text-[#5EEAD4] cursor-pointer"
              >
                0–{ammeterMax} A
              </button>
            </div>

            <svg viewBox="0 0 220 105" className="w-full h-auto">
              <path
                d="M 35 92 A 75 75 0 0 1 185 92"
                fill="none"
                stroke="#55688C"
                strokeWidth="1.5"
              />
              {/* Minor & Major Scale Ticks */}
              {Array.from({ length: 26 }, (_, i) => {
                const f = i / 25;
                const ang = ((-155 + f * 130) * Math.PI) / 180;
                const isMajor = i % 5 === 0;
                const r1 = isMajor ? 67 : 71;
                const r2 = 75;
                return (
                  <line
                    key={i}
                    x1={110 + r1 * Math.cos(ang)}
                    y1={96 + r1 * Math.sin(ang)}
                    x2={110 + r2 * Math.cos(ang)}
                    y2={96 + r2 * Math.sin(ang)}
                    stroke="#55688C"
                    strokeWidth={isMajor ? 1.5 : 0.8}
                  />
                );
              })}
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((f, idx) => {
                const ang = ((-155 + f * 130) * Math.PI) / 180;
                const tx = 110 + 53 * Math.cos(ang);
                const ty = 96 + 53 * Math.sin(ang);
                const val = (f * ammeterMax).toFixed(idx === 0 || idx === 5 ? 0 : 1);
                return (
                  <text
                    key={idx}
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    fill="#93A0B8"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {val}
                  </text>
                );
              })}
              {/* Needle */}
              <line
                x1="110"
                y1="96"
                x2={ammeterNeedle.x2}
                y2={ammeterNeedle.y2}
                stroke="#F97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="110" cy="96" r="4.5" fill="#F97316" />
            </svg>
          </div>

          {/* Analogue + Digital Voltmeter Card */}
          <div className="md:col-span-4 bg-[#121A2B] border border-[#22304A] rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[#93A0B8] font-semibold">Voltmeter</span>
                {showDigitalDMM && (
                  <span className="px-2 py-0.5 rounded bg-[#0B1220] border border-[#22304A] font-mono text-xs font-bold text-[#FDBA74]">
                    {displayedVoltageV.toFixed(2)} V
                  </span>
                )}
              </div>
              <button
                type="button"
                title="Switch Voltmeter Full-Scale Range"
                onClick={() => {
                  const next = voltmeterMax === 3 ? 15 : 3;
                  setVoltmeterMax(next);
                  setLogMsg(`log > Switched Voltmeter range to 0–${next} V.`);
                }}
                className="px-2 py-0.5 rounded bg-[#112D2B] border border-[#14B8A6]/40 font-mono text-[11px] font-semibold text-[#5EEAD4] cursor-pointer"
              >
                0–{voltmeterMax} V
              </button>
            </div>

            <svg viewBox="0 0 220 105" className="w-full h-auto">
              <path
                d="M 35 92 A 75 75 0 0 1 185 92"
                fill="none"
                stroke="#55688C"
                strokeWidth="1.5"
              />
              {Array.from({ length: 26 }, (_, i) => {
                const f = i / 25;
                const ang = ((-155 + f * 130) * Math.PI) / 180;
                const isMajor = i % 5 === 0;
                const r1 = isMajor ? 67 : 71;
                const r2 = 75;
                return (
                  <line
                    key={i}
                    x1={110 + r1 * Math.cos(ang)}
                    y1={96 + r1 * Math.sin(ang)}
                    x2={110 + r2 * Math.cos(ang)}
                    y2={96 + r2 * Math.sin(ang)}
                    stroke="#55688C"
                    strokeWidth={isMajor ? 1.5 : 0.8}
                  />
                );
              })}
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((f, idx) => {
                const ang = ((-155 + f * 130) * Math.PI) / 180;
                const tx = 110 + 53 * Math.cos(ang);
                const ty = 96 + 53 * Math.sin(ang);
                const val = (f * voltmeterMax).toFixed(idx === 0 || idx === 5 ? 0 : 1);
                return (
                  <text
                    key={idx}
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    fill="#93A0B8"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {val}
                  </text>
                );
              })}
              {/* Needle */}
              <line
                x1="110"
                y1="96"
                x2={voltmeterNeedle.x2}
                y2={voltmeterNeedle.y2}
                stroke="#F97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="110" cy="96" r="4.5" fill="#F97316" />
            </svg>
          </div>

          {/* Rheostat, Supply EMF & Key Actions */}
          <div className="md:col-span-4 flex flex-col justify-between gap-2">
            <div className="space-y-1.5">
              <div>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-[#93A0B8]">Rheostat slider (Rh)</span>
                  <span className="font-mono font-semibold text-[#E6EBF5]">
                    {rheostatOhm.toFixed(1)} Ω
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Rheostat resistance in ohms"
                  min={0}
                  max={20}
                  step={0.5}
                  value={rheostatOhm}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateRheostat(val);
                    setLogMsg(`log > Rheostat adjusted to Rh = ${val.toFixed(1)} Ω.`);
                  }}
                  className="w-full accent-[#2DD4BF] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-[#93A0B8]">DC supply EMF (E)</span>
                  <span className="font-mono font-semibold text-[#5EEAD4]">
                    {emfV.toFixed(1)} V
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Battery EMF in volts"
                  min={1.5}
                  max={9.0}
                  step={0.5}
                  value={emfV}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setEmfV(v);
                    setLogMsg(`log > Adjusted DC supply EMF to E = ${v.toFixed(1)} V.`);
                  }}
                  className="w-full accent-[#2DD4BF] cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleToggleKey}
                className="py-2.5 rounded-xl bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors cursor-pointer"
              >
                {keyClosed ? 'Open key (K)' : 'Close key (K)'}
              </button>

              <button
                type="button"
                onClick={handleRecord}
                className="py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Record V and I
              </button>
            </div>
          </div>
        </div>
      }
      logMessage={logMsg}
      rightPanel={
        <div className="space-y-3.5">
          {/* Interactive Readings Table + Add Custom Point */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-sm font-bold text-[#E6EBF5]">
                Readings ({readings.length})
              </h2>
              <button
                type="button"
                onClick={() => setReadings([])}
                className="text-[11px] text-[#93A0B8] hover:text-[#FCA5A5] cursor-pointer"
              >
                Clear table
              </button>
            </div>

            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1E2A42] text-[#93A0B8] text-[11px]">
                    <th className="py-2 px-2 text-left">S/N</th>
                    <th className="py-2 px-1.5 text-right">Rh/Ω</th>
                    <th className="py-2 px-1.5 text-right">I/A</th>
                    <th className="py-2 px-1.5 text-right">V/V</th>
                    <th className="py-2 px-1.5 text-right">V/I</th>
                    <th className="py-2 px-1.5 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[#1E2A42]/60 last:border-b-0 text-[#E6EBF5]"
                    >
                      <td className="py-1.5 px-2">{r.id}</td>
                      <td className="py-1.5 px-1.5 text-right">{r.rhOhm}</td>
                      <td className="py-1.5 px-1.5 text-right">{r.currentA.toFixed(2)}</td>
                      <td className="py-1.5 px-1.5 text-right">{r.voltageV.toFixed(2)}</td>
                      <td className="py-1.5 px-1.5 text-right text-[#5EEAD4]">
                        {r.ratioR.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-1.5 text-right">
                        <button
                          type="button"
                          aria-label={`Delete reading ${r.id}`}
                          onClick={() => handleDeleteReading(r.id)}
                          className="text-[#6B778C] hover:text-[#FCA5A5] cursor-pointer"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Manual Add Row Form */}
              <form
                onSubmit={handleAddManualReading}
                className="border-t border-[#1E2A42] p-2 grid grid-cols-12 gap-1.5 bg-[#0B1220]/60"
              >
                <input
                  type="number"
                  step="0.01"
                  placeholder="I (A)"
                  value={manualI}
                  onChange={(e) => setManualI(e.target.value)}
                  className="col-span-4 px-2 py-1 rounded bg-[#121A2B] border border-[#22304A] font-mono text-[11px] text-white"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="V (V)"
                  value={manualV}
                  onChange={(e) => setManualV(e.target.value)}
                  className="col-span-4 px-2 py-1 rounded bg-[#121A2B] border border-[#22304A] font-mono text-[11px] text-white"
                />
                <button
                  type="submit"
                  className="col-span-4 py-1 rounded bg-[#112D2B] hover:bg-[#153E3B] border border-[#14B8A6]/40 text-[11px] font-semibold text-[#5EEAD4] cursor-pointer"
                >
                  + Plot pt
                </button>
              </form>
            </div>
          </div>

          {/* Interactive Live V–I Graph Plotter */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[#93A0B8]">
                Live plot · {graphAxisMode === 'V-I' ? 'V against I' : 'I against V'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setGraphAxisMode((m) => (m === 'V-I' ? 'I-V' : 'V-I'))
                  }
                  className="px-2 py-0.5 rounded bg-[#0B1220] border border-[#22304A] text-[10px] font-mono text-[#C9D3E6] cursor-pointer"
                >
                  Swap axes
                </button>
                <button
                  type="button"
                  onClick={() => setShowBestFit(!showBestFit)}
                  className="px-2 py-0.5 rounded bg-[#0B1220] border border-[#22304A] text-[10px] text-[#5EEAD4] cursor-pointer"
                >
                  {showBestFit ? 'Hide line' : 'Fit line'}
                </button>
              </div>
            </div>

            <svg viewBox="0 0 260 155" className="w-full h-auto">
              {/* Grid lines */}
              {[30, 60, 90].map((gy) => (
                <line
                  key={gy}
                  x1="35"
                  y1={gy}
                  x2="240"
                  y2={gy}
                  stroke="#1E2A42"
                  strokeWidth="0.8"
                />
              ))}
              {[85, 135, 185, 235].map((gx) => (
                <line
                  key={gx}
                  x1={gx}
                  y1="15"
                  x2={gx}
                  y2="120"
                  stroke="#1E2A42"
                  strokeWidth="0.8"
                />
              ))}

              {/* Axes */}
              <line x1="35" y1="15" x2="35" y2="120" stroke="#3A4A68" strokeWidth="1.2" />
              <line x1="35" y1="120" x2="240" y2="120" stroke="#3A4A68" strokeWidth="1.2" />

              {/* Best-fit regression line */}
              {showBestFit && (
                <line
                  x1="35"
                  y1="120"
                  x2="235"
                  y2="20"
                  stroke="#2DD4BF"
                  strokeWidth="1.4"
                  strokeDasharray="3 3"
                />
              )}

              {/* Live operating point crosshair */}
              {keyClosed && (
                <circle
                  cx={
                    35 +
                    (Math.min(
                      graphAxisMode === 'V-I' ? displayedCurrentA : displayedVoltageV,
                      graphAxisMode === 'V-I' ? 0.6 : 3.0
                    ) /
                      (graphAxisMode === 'V-I' ? 0.6 : 3.0)) *
                      200
                  }
                  cy={
                    120 -
                    (Math.min(
                      graphAxisMode === 'V-I' ? displayedVoltageV : displayedCurrentA,
                      graphAxisMode === 'V-I' ? 2.8 : 0.6
                    ) /
                      (graphAxisMode === 'V-I' ? 2.8 : 0.6)) *
                      100
                  }
                  r="5"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="1.5"
                />
              )}

              {/* Plotted readings */}
              {readings.map((r) => {
                const xVal = graphAxisMode === 'V-I' ? r.currentA : r.voltageV;
                const yVal = graphAxisMode === 'V-I' ? r.voltageV : r.currentA;
                const xMax = graphAxisMode === 'V-I' ? 0.6 : 2.8;
                const yMax = graphAxisMode === 'V-I' ? 2.8 : 0.6;
                const cx = 35 + (Math.min(xVal, xMax) / xMax) * 200;
                const cy = 120 - (Math.min(yVal, yMax) / yMax) * 100;
                return <circle key={r.id} cx={cx} cy={cy} r="3.5" fill="#5EEAD4" />;
              })}

              <text
                x="138"
                y="138"
                fill="#93A0B8"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                {graphAxisMode === 'V-I' ? 'I / A (0 – 0.6)' : 'V / V (0 – 2.8)'}
              </text>
              <text
                x="12"
                y="70"
                fill="#93A0B8"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
                transform="rotate(-90 12 70)"
              >
                {graphAxisMode === 'V-I' ? 'V / V' : 'I / A'}
              </text>
            </svg>

            <div className="flex items-center justify-between font-mono text-xs text-[#C9D3E6] mt-1">
              <span>
                slope ≈{' '}
                {graphAxisMode === 'V-I'
                  ? `${meanSlope.toFixed(2)} Ω`
                  : `${(1 / meanSlope).toFixed(3)} S`}
              </span>
              <span className="text-[#5EEAD4]">P = {(powerW * 1000).toFixed(0)} mW</span>
            </div>
          </div>

          {/* Live Oscilloscope / Multimeter Probe OR Wire Temperature */}
          {activeTool === 'probe' || activeTool === 'meters' ? (
            <div className="bg-[#121A2B] border border-[#14B8A6] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#5EEAD4]">
                  {activeTool === 'probe'
                    ? `OSCILLOSCOPE PROBE · ${probedNode?.label ?? 'X'}`
                    : 'METER CALIBRATION & DMM'}
                </span>
                <label className="text-[11px] text-[#C9D3E6] flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDigitalDMM}
                    onChange={(e) => setShowDigitalDMM(e.target.checked)}
                  />
                  <span>Digital DMM</span>
                </label>
              </div>

              {activeTool === 'probe' ? (
                <>
                  <svg viewBox="0 0 240 70" className="w-full h-auto bg-[#090E1A] rounded-lg">
                    <line x1="0" y1="35" x2="240" y2="35" stroke="#1E2A42" strokeWidth="1" />
                    <line
                      x1="0"
                      y1={60 - Math.min(50, displayedVoltageV * 16)}
                      x2="240"
                      y2={60 - Math.min(50, displayedVoltageV * 16)}
                      stroke="#5EEAD4"
                      strokeWidth="2"
                    />
                    <line
                      x1="0"
                      y1={60 - Math.min(50, displayedCurrentA * 60)}
                      x2="240"
                      y2={60 - Math.min(50, displayedCurrentA * 60)}
                      stroke="#F97316"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                  </svg>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                    <div className="bg-[#0B1220] p-1.5 rounded">
                      <div className="text-[#93A0B8] text-[9px]">V(drop)</div>
                      <div className="text-[#5EEAD4]">{displayedVoltageV.toFixed(2)}V</div>
                    </div>
                    <div className="bg-[#0B1220] p-1.5 rounded">
                      <div className="text-[#93A0B8] text-[9px]">I(branch)</div>
                      <div className="text-[#FDBA74]">{displayedCurrentA.toFixed(3)}A</div>
                    </div>
                    <div className="bg-[#0B1220] p-1.5 rounded">
                      <div className="text-[#93A0B8] text-[9px]">R(true)</div>
                      <div className="text-white">{wireR.toFixed(2)}Ω</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#93A0B8]">Ammeter zero offset</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAmmeterZeroErr(0)}
                        className="px-2 py-0.5 rounded bg-[#0B1220] border border-[#22304A] text-[10px] text-[#5EEAD4] cursor-pointer"
                      >
                        Zero A
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmmeterZeroErr(0.02)}
                        className="px-2 py-0.5 rounded bg-[#0B1220] border border-[#22304A] text-[10px] text-[#93A0B8] cursor-pointer"
                      >
                        +0.02A err
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#93A0B8]">Voltmeter zero offset</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setVoltmeterZeroErr(0)}
                        className="px-2 py-0.5 rounded bg-[#0B1220] border border-[#22304A] text-[10px] text-[#5EEAD4] cursor-pointer"
                      >
                        Zero V
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoltmeterZeroErr(0.08)}
                        className="px-2 py-0.5 rounded bg-[#0B1220] border border-[#22304A] text-[10px] text-[#93A0B8] cursor-pointer"
                      >
                        +0.08V err
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-[#93A0B8]">Wire X temperature</div>
                <div className="font-mono text-lg font-bold text-[#E6EBF5]">
                  {wireTemp.toFixed(1)} °C
                </div>
              </div>
              <div className="w-28 h-2 bg-[#1E2A42] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    wireTemp > 33 ? 'bg-[#F97316]' : 'bg-[#2DD4BF]'
                  }`}
                  style={{ width: `${Math.min(100, ((wireTemp - 20) / 25) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Lab Assistant */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#60A5FA] mb-1.5">
              LAB ASSISTANT
            </div>
            <p className="text-xs text-[#C9D3E6] leading-relaxed">
              Your last two V/I values drifted upward. What happens to a wire’s resistance when
              it gets warm, and how could you prevent that?
            </p>
          </div>
        </div>
      }
    >
      {/* Top Bench Status & Interactive Circuit Builder Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              keyClosed && hasCompleteLoop
                ? 'bg-[#112D2B] border-[#14B8A6]/40 text-[#5EEAD4]'
                : 'bg-[#121A2B] border-[#22304A] text-[#93A0B8]'
            }`}
          >
            {keyClosed && hasCompleteLoop
              ? `Key closed · current flowing (${displayedCurrentA.toFixed(2)} A)`
              : 'Key open · no current'}
          </span>

          {pendingTerm && (
            <span className="px-3 py-1 rounded-full bg-[#3A2112] border border-[#F97316] text-xs text-[#FDBA74] inline-flex items-center gap-2">
              <span>
                Wiring from{' '}
                <strong>
                  {nodes.find((n) => n.id === pendingTerm.nodeId)?.label ?? pendingTerm.nodeId}:
                  {pendingTerm.term}
                </strong>{' '}
                — click any component or terminal pin to connect
              </span>
              <button
                type="button"
                onClick={() => {
                  setPendingTerm(null);
                  setCursorSvgPt(null);
                }}
                className="px-1.5 py-0.5 rounded bg-[#0B1220] text-[#FCA5A5] hover:text-white text-[10px] font-mono cursor-pointer"
              >
                Cancel ×
              </button>
            </span>
          )}
        </div>

        {/* Selected Component Quick Actions */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {selectedNode && (
            <>
              <span className="px-2.5 py-1 rounded-lg bg-[#121A2B] border border-[#22304A] font-mono text-[#5EEAD4]">
                Selected: {selectedNode.label}
              </span>
              <button
                type="button"
                onClick={handleRotateSelectedNode}
                className="px-2.5 py-1 rounded-lg bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-[#E6EBF5] inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                Rotate
              </button>
              <button
                type="button"
                onClick={handleRemoveSelectedNode}
                className="px-2.5 py-1 rounded-lg bg-[#121A2B] hover:bg-[#3B1219] border border-[#22304A] text-[#FCA5A5] inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleResetStandardCircuit}
            className="px-2.5 py-1 rounded-lg bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-[#C9D3E6] inline-flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Reset diagram
          </button>

          {/* Canvas Pan & Zoom Controls ("Move Above & Beyond") */}
          <div className="inline-flex items-center bg-[#121A2B] border border-[#22304A] rounded-lg p-0.5">
            <button
              type="button"
              title="Zoom out schematic canvas"
              onClick={() => setZoom((z) => Math.max(0.45, Number((z - 0.15).toFixed(2))))}
              className="px-2 py-0.5 text-xs font-mono text-[#C9D3E6] hover:text-white cursor-pointer"
            >
              −
            </button>
            <button
              type="button"
              title="Reset pan & zoom to 100%"
              onClick={handleCenterCanvas}
              className="px-2 py-0.5 text-[11px] font-mono text-[#5EEAD4] hover:underline cursor-pointer"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              title="Zoom in schematic canvas"
              onClick={() => setZoom((z) => Math.min(2.4, Number((z + 0.15).toFixed(2))))}
              className="px-2 py-0.5 text-xs font-mono text-[#C9D3E6] hover:text-white cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas: Infinite Pan/Zoom Schematic Builder OR 3D Bench Apparatus View */}
      <div
        className="flex-1 flex items-center justify-center my-1 relative min-h-[430px]"
        onClick={() => {
          if (circuitMenu) setCircuitMenu(null);
        }}
      >
        {viewMode === 'schematic' ? (
          <svg
            ref={svgRef}
            viewBox={`${viewMinX} ${viewMinY} ${viewWidth} ${viewHeight}`}
            onPointerDown={handleSvgPointerDown}
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            onPointerLeave={handleSvgPointerUp}
            onWheel={handleSvgWheel}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const pt = toSvgCoords(e.clientX, e.clientY);
              const x = Math.min(
                e.clientX,
                (typeof window !== 'undefined' ? window.innerWidth : 1200) - 260
              );
              const y = Math.min(
                e.clientY,
                (typeof window !== 'undefined' ? window.innerHeight : 800) - 340
              );
              setCircuitMenu({
                clientX: Math.max(12, x),
                clientY: Math.max(12, y),
                svgX: pt.x,
                svgY: pt.y,
                targetNodeId: null,
                targetWireId: null,
              });
            }}
            className="w-full h-full min-h-[430px] cursor-grab active:cursor-grabbing"
            role="img"
            aria-label="Interactive circuit builder: drag components freely, pan and zoom canvas, or right-click for circuit lab menu"
          >
            {/* Render Wires */}
            {wires.map((w) => {
              const pathD = buildWirePath(w);
              if (!pathD) return null;
              return (
                <g
                  key={w.id}
                  data-vix-element={`Circuit Jumper Wire (${w.fromNode}:${w.fromTerm} → ${w.toNode}:${w.toTerm})`}
                  onClick={() => {
                    if (activeTool === 'wire') {
                      setWires((prev) => prev.filter((item) => item.id !== w.id));
                      setLogMsg(`log > Removed wire connection ${w.id}.`);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const pt = toSvgCoords(e.clientX, e.clientY);
                    setCircuitMenu({
                      clientX: e.clientX,
                      clientY: e.clientY,
                      svgX: pt.x,
                      svgY: pt.y,
                      targetNodeId: null,
                      targetWireId: w.id,
                    });
                  }}
                  className="cursor-pointer"
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#55688C"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  {keyClosed && hasCompleteLoop && !w.parallel && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#5EEAD4"
                      strokeWidth="3"
                      strokeDasharray="4 16"
                      strokeDashoffset={dashOffset}
                      opacity="0.9"
                    />
                  )}
                </g>
              );
            })}

            {/* Live Rubber-Band Wire Preview when pendingTerm is active */}
            {pendingTerm &&
              cursorSvgPt &&
              (() => {
                const srcNode = nodes.find((n) => n.id === pendingTerm.nodeId);
                if (!srcNode) return null;
                const pStart = getTerminalPos(srcNode, pendingTerm.term);
                return (
                  <g className="pointer-events-none">
                    <path
                      d={`M ${pStart.x} ${pStart.y} L ${cursorSvgPt.x} ${ pStart.y} L ${cursorSvgPt.x} ${cursorSvgPt.y}`}
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />
                    <circle cx={cursorSvgPt.x} cy={cursorSvgPt.y} r="4.5" fill="#F97316" />
                  </g>
                );
              })()}

            {/* Render Interactive Draggable Circuit Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const termA = getTerminalPos(node, 'a');
              const termB = getTerminalPos(node, 'b');
              const kindLabelMap: Record<ComponentKind, string> = {
                battery: `DC Battery Cell Supply ${node.label} (EMF = ${emfV.toFixed(1)} V, internal resistance r = 0.6 Ω)`,
                rheostat: `Sliding Rheostat Variable Resistor ${node.label} (currently set to ${rheostatOhm.toFixed(1)} Ω out of 20 Ω)`,
                ammeter: `Series Ammeter ${node.label} (0–1 A range, measuring current I = ${displayedCurrentA.toFixed(3)} A)`,
                voltmeter: `Parallel Voltmeter ${node.label} (0–3 V range, measuring potential difference V = ${displayedVoltageV.toFixed(2)} V)`,
                wireX: `Test Resistance Wire ${node.label} (${wireMaterial}, length L = ${wireLengthCm} cm, temperature ${wireTemp.toFixed(1)} °C)`,
                key: `Plug Switch Key ${node.label} (currently ${keyClosed ? 'CLOSED — current flowing' : 'OPEN — circuit broken'})`,
                resistor: `Fixed Standard Resistor ${node.label} (${node.value} Ω)`,
                diode: `Silicon Junction Diode ${node.label} (forward voltage drop ≈ ${node.value} V)`,
                led: `Light-Emitting Diode ${node.label} (forward threshold ${node.value} V)`,
                capacitor: `Electrolytic Capacitor ${node.label} (${node.value} µF)`,
              };
              const fullNodeDesc = kindLabelMap[node.kind] || `${node.label} (${node.value} ${node.unit})`;

              return (
                <g key={node.id} data-vix-element={fullNodeDesc}>
                  {/* Component Body Group */}
                  <g
                    data-vix-element={fullNodeDesc}
                    transform={`translate(${node.x}, ${node.y}) rotate(${
                      node.kind === 'battery' ||
                      node.kind === 'wireX' ||
                      node.kind === 'voltmeter'
                        ? 0
                        : node.rotation
                    })`}
                    onPointerDown={(e) => {
                      if (e.button === 2) return;
                      e.stopPropagation();
                      setCircuitMenu(null);

                      // If a wire is currently being pulled (pendingTerm is active) and user clicks another component body, connect directly to its closest terminal!
                      if (pendingTerm && pendingTerm.nodeId !== node.id) {
                        const clickPt = toSvgCoords(e.clientX, e.clientY);
                        const bestTerm = getClosestTerminal(node, clickPt);
                        connectTerminals(
                          pendingTerm.nodeId,
                          pendingTerm.term,
                          node.id,
                          bestTerm
                        );
                        setCursorSvgPt(null);
                        return;
                      }

                      // If in "Wire Pins" tool mode and no pendingTerm yet, start wiring from the closest terminal of this component
                      if (activeTool === 'wire' && !pendingTerm) {
                        const clickPt = toSvgCoords(e.clientX, e.clientY);
                        const bestTerm = getClosestTerminal(node, clickPt);
                        setSelectedNodeId(node.id);
                        setPendingTerm({ nodeId: node.id, term: bestTerm });
                        setCursorSvgPt(getTerminalPos(node, bestTerm));
                        setLogMsg(
                          `log > Wiring from ${node.label}:${bestTerm} — click any target component or terminal pin to connect.`
                        );
                        return;
                      }

                      setSelectedNodeId(node.id);
                      if (activeTool === 'probe') {
                        setProbedNodeId(node.id);
                        setLogMsg(`log > Oscilloscope probe attached to ${node.label}.`);
                        return;
                      }
                      if (node.kind === 'key') {
                        handleToggleKey();
                      }
                      setDraggingNodeId(node.id);
                    }}
                    onPointerUp={(e) => {
                      // Support drag-and-release from a terminal pin onto another component body
                      if (pendingTerm && pendingTerm.nodeId !== node.id) {
                        e.stopPropagation();
                        const releasePt = toSvgCoords(e.clientX, e.clientY);
                        const bestTerm = getClosestTerminal(node, releasePt);
                        connectTerminals(
                          pendingTerm.nodeId,
                          pendingTerm.term,
                          node.id,
                          bestTerm
                        );
                        setCursorSvgPt(null);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                      const pt = toSvgCoords(e.clientX, e.clientY);
                      const x = Math.min(
                        e.clientX,
                        (typeof window !== 'undefined' ? window.innerWidth : 1200) - 260
                      );
                      const y = Math.min(
                        e.clientY,
                        (typeof window !== 'undefined' ? window.innerHeight : 800) - 340
                      );
                      setCircuitMenu({
                        clientX: Math.max(12, x),
                        clientY: Math.max(12, y),
                        svgX: pt.x,
                        svgY: pt.y,
                        targetNodeId: node.id,
                        targetWireId: null,
                      });
                    }}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    {/* Selection halo */}
                    {isSelected && (
                      <rect
                        x="-42"
                        y="-42"
                        width="84"
                        height="84"
                        rx="12"
                        fill="none"
                        stroke="#2DD4BF"
                        strokeWidth="1.2"
                        strokeDasharray="4 3"
                        opacity="0.7"
                      />
                    )}

                    {/* BATTERY (E) */}
                    {node.kind === 'battery' && (
                      <g>
                        <rect x="-16" y="-35" width="32" height="70" fill="#0D1526" />
                        <line
                          x1="-18"
                          y1="-23"
                          x2="18"
                          y2="-23"
                          stroke="#E6EBF5"
                          strokeWidth="3"
                        />
                        <line
                          x1="-10"
                          y1="-13"
                          x2="10"
                          y2="-13"
                          stroke="#E6EBF5"
                          strokeWidth="6"
                        />
                        <line
                          x1="-18"
                          y1="9"
                          x2="18"
                          y2="9"
                          stroke="#E6EBF5"
                          strokeWidth="3"
                        />
                        <line
                          x1="-10"
                          y1="19"
                          x2="10"
                          y2="19"
                          stroke="#E6EBF5"
                          strokeWidth="6"
                        />
                        <text
                          x="-38"
                          y="4"
                          fill="#C9D3E6"
                          fontSize="14"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {node.label}
                        </text>
                      </g>
                    )}

                    {/* RHEOSTAT (Rh) with draggable wiper */}
                    {node.kind === 'rheostat' && (
                      <g>
                        <rect x="-75" y="-18" width="150" height="36" fill="#0D1526" />
                        <path
                          d="M-75 0 L-65 0 L-57 -12 L-45 12 L-33 -12 L-21 12 L-9 -12 L3 12 L15 -12 L27 12 L39 -12 L51 12 L59 0 L75 0"
                          fill="none"
                          stroke="#E6EBF5"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        {(() => {
                          const wx = -62 + (rheostatOhm / 20) * 124;
                          return (
                            <g
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                setDraggingWiper(true);
                              }}
                              className="cursor-ew-resize"
                            >
                              <path
                                d={`M${wx} -34 L${wx} -16 M${wx - 6} -24 L${wx} -14 L${wx + 6} -24`}
                                fill="none"
                                stroke="#2DD4BF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <text
                                x={wx}
                                y="-42"
                                fill="#C9D3E6"
                                fontSize="13"
                                fontFamily="JetBrains Mono, monospace"
                                textAnchor="middle"
                              >
                                {node.label} = {rheostatOhm} Ω
                              </text>
                            </g>
                          );
                        })()}
                      </g>
                    )}

                    {/* AMMETER (A) */}
                    {node.kind === 'ammeter' && (
                      <g>
                        <circle
                          cx="0"
                          cy="0"
                          r="26"
                          fill="#121A2B"
                          stroke="#E6EBF5"
                          strokeWidth="2.5"
                        />
                        <text
                          x="0"
                          y="6"
                          fill="#E6EBF5"
                          fontSize="18"
                          fontFamily="Space Grotesk, sans-serif"
                          textAnchor="middle"
                          fontWeight="700"
                        >
                          {node.label}
                        </text>
                      </g>
                    )}

                    {/* VOLTMETER (V) */}
                    {node.kind === 'voltmeter' && (
                      <g>
                        <circle
                          cx="0"
                          cy="0"
                          r="26"
                          fill="#121A2B"
                          stroke="#E6EBF5"
                          strokeWidth="2.5"
                        />
                        <text
                          x="0"
                          y="6"
                          fill="#E6EBF5"
                          fontSize="18"
                          fontFamily="Space Grotesk, sans-serif"
                          textAnchor="middle"
                          fontWeight="700"
                        >
                          {node.label}
                        </text>
                      </g>
                    )}

                    {/* TEST WIRE X */}
                    {node.kind === 'wireX' && (
                      <g>
                        <rect
                          x="-14"
                          y="-45"
                          width="28"
                          height="90"
                          rx="3"
                          fill={wireTemp > 33 ? '#3A2112' : '#1C2A47'}
                          stroke="#E6EBF5"
                          strokeWidth="2.5"
                        />
                        <text
                          x="26"
                          y="5"
                          fill="#C9D3E6"
                          fontSize="14"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {node.label}
                        </text>
                      </g>
                    )}

                    {/* PLUG KEY (K) */}
                    {node.kind === 'key' && (
                      <g>
                        <rect x="-40" y="-20" width="80" height="40" fill="#0D1526" />
                        <circle cx="-30" cy="0" r="4" fill="#E6EBF5" />
                        <circle cx="30" cy="0" r="4" fill="#E6EBF5" />
                        <line
                          x1="-30"
                          y1="0"
                          x2={keyClosed ? 30 : 24}
                          y2={keyClosed ? 0 : -22}
                          stroke="#E6EBF5"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <text
                          x="0"
                          y="36"
                          fill="#C9D3E6"
                          fontSize="13"
                          fontFamily="JetBrains Mono, monospace"
                          textAnchor="middle"
                        >
                          {node.label}
                        </text>
                      </g>
                    )}

                    {/* EXTRA RESISTOR */}
                    {node.kind === 'resistor' && (
                      <g>
                        <rect
                          x="-36"
                          y="-12"
                          width="72"
                          height="24"
                          rx="3"
                          fill="#121A2B"
                          stroke="#5EEAD4"
                          strokeWidth="2"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#5EEAD4"
                          fontSize="11"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {node.label} ({node.value}Ω)
                        </text>
                      </g>
                    )}

                    {/* SILICON DIODE / LED */}
                    {(node.kind === 'diode' || node.kind === 'led') && (
                      <g>
                        <polygon
                          points="-14,-14 -14,14 14,0"
                          fill={
                            node.kind === 'led' && keyClosed
                              ? '#4ADE80'
                              : '#121A2B'
                          }
                          stroke="#E6EBF5"
                          strokeWidth="2"
                        />
                        <line
                          x1="14"
                          y1="-14"
                          x2="14"
                          y2="14"
                          stroke="#E6EBF5"
                          strokeWidth="2.5"
                        />
                        <text
                          x="0"
                          y="-20"
                          textAnchor="middle"
                          fill="#5EEAD4"
                          fontSize="11"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {node.label}
                        </text>
                      </g>
                    )}

                    {/* CAPACITOR */}
                    {node.kind === 'capacitor' && (
                      <g>
                        <line
                          x1="-6"
                          y1="-16"
                          x2="-6"
                          y2="16"
                          stroke="#E6EBF5"
                          strokeWidth="2.5"
                        />
                        <line
                          x1="6"
                          y1="-16"
                          x2="6"
                          y2="16"
                          stroke="#E6EBF5"
                          strokeWidth="2.5"
                        />
                        <text
                          x="0"
                          y="-22"
                          textAnchor="middle"
                          fill="#5EEAD4"
                          fontSize="11"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {node.label}
                        </text>
                      </g>
                    )}
                  </g>

                  {/* Always-Visible Interactive Wiring Terminal Pins (A & B) on every component */}
                  {(['a', 'b'] as const).map((termKey) => {
                    const pos = termKey === 'a' ? termA : termB;
                    const isSourceTerm =
                      pendingTerm?.nodeId === node.id && pendingTerm?.term === termKey;
                    const isTargetCandidate =
                      Boolean(pendingTerm) && pendingTerm?.nodeId !== node.id;

                    return (
                      <g
                        key={termKey}
                        data-vix-element={`Terminal Pin ${termKey.toUpperCase()} on ${fullNodeDesc}`}
                        onPointerDown={(e) => {
                          if (e.button === 2) return;
                          handleTerminalInteraction(node.id, termKey, e);
                        }}
                        onPointerUp={(e) => {
                          if (pendingTerm && pendingTerm.nodeId !== node.id) {
                            e.stopPropagation();
                            connectTerminals(
                              pendingTerm.nodeId,
                              pendingTerm.term,
                              node.id,
                              termKey
                            );
                            setCursorSvgPt(null);
                          }
                        }}
                        className="cursor-crosshair"
                      >
                        {/* Large invisible hit target so pins are effortless to click even at 45% zoom */}
                        <circle cx={pos.x} cy={pos.y} r="14" fill="transparent" />
                        {/* Pulsing target halo when wiring is in progress */}
                        {(isSourceTerm || isTargetCandidate) && (
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r="10"
                            fill="none"
                            stroke={isSourceTerm ? '#F97316' : '#5EEAD4'}
                            strokeWidth="1.5"
                            strokeDasharray="3 2"
                          />
                        )}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isSourceTerm || isTargetCandidate || isSelected ? '6.5' : '5'}
                          fill={
                            isSourceTerm
                              ? '#F97316'
                              : isTargetCandidate
                                ? '#0D9488'
                                : '#112D2B'
                          }
                          stroke={isSourceTerm ? '#FDBA74' : '#5EEAD4'}
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        ) : (
          /* Physical Bench Isometric Apparatus View */
          <div className="w-full max-w-[680px] bg-[#0B1220]/70 border border-[#1E2A42] rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-4 flex flex-col items-center">
                <img
                  src="/apparatus/rheostat.svg"
                  alt="Sliding rheostat on bench"
                  className="h-32 w-auto object-contain mb-2"
                />
                <div className="text-xs font-bold text-white">
                  Sliding Rheostat ({rheostatOhm.toFixed(1)} Ω)
                </div>
                <div className="text-[11px] text-[#93A0B8]">In series with dry cells</div>
              </div>

              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-4 flex flex-col items-center">
                <img
                  src="/apparatus/voltmeter.svg"
                  alt="Analogue voltmeter on bench"
                  className="h-32 w-auto object-contain mb-2"
                />
                <div className="text-xs font-bold text-white">
                  Analogue Voltmeter ({displayedVoltageV.toFixed(2)} V)
                </div>
                <div className="text-[11px] text-[#93A0B8]">In parallel across Wire X</div>
              </div>

              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-4 flex flex-col items-center">
                <img
                  src="/apparatus/metre-rule.svg"
                  alt="Nichrome wire X mounted on metre rule"
                  className="h-32 w-auto object-contain mb-2"
                />
                <div className="text-xs font-bold text-white">
                  Test Wire X ({wireLengthCm} cm {wireMaterial})
                </div>
                <div className="text-[11px] text-[#5EEAD4]">
                  R = {wireR.toFixed(2)} Ω at {wireTemp.toFixed(1)} °C
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Electronics Circuit Workbench Right-Click Context Menu */}
        {circuitMenu && (
          <div
            role="menu"
            aria-label="Circuit workbench context menu"
            style={{ left: circuitMenu.clientX, top: circuitMenu.clientY }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-64 rounded-xl bg-[#121A2B]/98 border border-[#2DD4BF]/50 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-md p-1.5 text-xs text-[#E6EBF5]"
          >
            {circuitMenu.targetNodeId ? (
              (() => {
                const targetNode = nodes.find((n) => n.id === circuitMenu.targetNodeId);
                return (
                  <>
                    <div className="px-2.5 py-1.5 border-b border-[#1E2A42] flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5EEAD4]">
                        COMPONENT · {targetNode?.label ?? circuitMenu.targetNodeId}
                      </span>
                      <span className="font-mono text-[10px] text-[#93A0B8]">
                        {targetNode?.value} {targetNode?.unit}
                      </span>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSelectedNodeId(circuitMenu.targetNodeId);
                          handleRotateSelectedNode();
                          setCircuitMenu(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between cursor-pointer"
                      >
                        <span>Rotate component 90°</span>
                        <span className="font-mono text-[10px] text-[#93A0B8]">R</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setActiveTool('wire');
                          setPendingTerm({ nodeId: circuitMenu.targetNodeId!, term: 'a' });
                          setLogMsg(
                            `log > Wiring from ${targetNode?.label ?? circuitMenu.targetNodeId}:a — click another component terminal.`
                          );
                          setCircuitMenu(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between text-[#5EEAD4] cursor-pointer"
                      >
                        <span>Wire from Terminal A</span>
                        <span className="font-mono text-[10px]">Pin A</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setActiveTool('wire');
                          setPendingTerm({ nodeId: circuitMenu.targetNodeId!, term: 'b' });
                          setLogMsg(
                            `log > Wiring from ${targetNode?.label ?? circuitMenu.targetNodeId}:b — click another component terminal.`
                          );
                          setCircuitMenu(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between text-[#5EEAD4] cursor-pointer"
                      >
                        <span>Wire from Terminal B</span>
                        <span className="font-mono text-[10px]">Pin B</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setActiveTool('probe');
                          setProbedNodeId(circuitMenu.targetNodeId!);
                          setLogMsg(
                            `log > Attached oscilloscope probe to ${targetNode?.label ?? circuitMenu.targetNodeId}.`
                          );
                          setCircuitMenu(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between cursor-pointer"
                      >
                        <span>Attach oscilloscope probe</span>
                        <span className="font-mono text-[10px] text-[#93A0B8]">CH1</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          handleDuplicateNode(circuitMenu.targetNodeId!);
                          setCircuitMenu(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between cursor-pointer"
                      >
                        <span>Duplicate component</span>
                        <span className="font-mono text-[10px] text-[#93A0B8]">+1</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          handleDisconnectNodeWires(circuitMenu.targetNodeId!);
                          setCircuitMenu(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between text-[#FDBA74] cursor-pointer"
                      >
                        <span>Disconnect attached wires</span>
                        <span className="font-mono text-[10px]">Unwire</span>
                      </button>

                      <div className="pt-1 border-t border-[#1E2A42]">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setSelectedNodeId(circuitMenu.targetNodeId);
                            handleRemoveSelectedNode();
                            setCircuitMenu(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#3B1219] flex items-center justify-between text-[#FCA5A5] font-semibold cursor-pointer"
                        >
                          <span>Delete component</span>
                          <span className="font-mono text-[10px]">Del</span>
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()
            ) : circuitMenu.targetWireId ? (
              <>
                <div className="px-2.5 py-1.5 border-b border-[#1E2A42] font-mono text-[10px] font-bold uppercase tracking-wider text-[#5EEAD4]">
                  WIRE CONNECTION · {circuitMenu.targetWireId}
                </div>
                <div className="py-1 space-y-0.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setWires((prev) =>
                        prev.filter((w) => w.id !== circuitMenu.targetWireId)
                      );
                      setLogMsg(`log > Deleted wire connection ${circuitMenu.targetWireId}.`);
                      setCircuitMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#3B1219] text-[#FCA5A5] font-semibold cursor-pointer"
                  >
                    Remove wire connection
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-2.5 py-1.5 border-b border-[#1E2A42] flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5EEAD4]">
                    CIRCUIT WORKBENCH MENU
                  </span>
                  <span className="font-mono text-[10px] text-[#93A0B8]">
                    ({circuitMenu.svgX}, {circuitMenu.svgY})
                  </span>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      handleRecord();
                      setCircuitMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between text-[#5EEAD4] font-semibold cursor-pointer"
                  >
                    <span>Record V &amp; I reading</span>
                    <span className="font-mono text-[10px]">
                      {displayedVoltageV.toFixed(2)}V / {displayedCurrentA.toFixed(2)}A
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      handleToggleKey();
                      setCircuitMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between cursor-pointer"
                  >
                    <span>{keyClosed ? 'Open circuit key (K)' : 'Close circuit key (K)'}</span>
                    <span className="font-mono text-[10px] text-[#93A0B8]">
                      {keyClosed ? 'CLOSED' : 'OPEN'}
                    </span>
                  </button>

                  <div className="pt-1 border-t border-[#1E2A42]">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#93A0B8]">
                      Place component here
                    </div>
                    {(
                      [
                        { kind: 'resistor' as const, label: '+ Resistor (5.0 Ω)' },
                        { kind: 'ammeter' as const, label: '+ Ammeter (0–1 A)' },
                        { kind: 'voltmeter' as const, label: '+ Voltmeter (0–3 V)' },
                        { kind: 'diode' as const, label: '+ Silicon Diode (0.65 V)' },
                        { kind: 'led' as const, label: '+ Green LED (1.8 V)' },
                        { kind: 'capacitor' as const, label: '+ Capacitor (100 µF)' },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.kind}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          handleAddComponent(item.kind, {
                            x: circuitMenu.svgX,
                            y: circuitMenu.svgY,
                          });
                          setCircuitMenu(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] text-[#C9D3E6] hover:text-white cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 border-t border-[#1E2A42] space-y-0.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleCenterCanvas();
                        setCircuitMenu(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] flex items-center justify-between cursor-pointer"
                    >
                      <span>Center &amp; fit canvas view</span>
                      <span className="font-mono text-[10px] text-[#93A0B8]">100%</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleResetStandardCircuit();
                        handleCenterCanvas();
                        setCircuitMenu(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#192845] text-[#FDBA74] cursor-pointer"
                    >
                      Reset standard Ohm’s law diagram
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </LabLayout>
  );
}
