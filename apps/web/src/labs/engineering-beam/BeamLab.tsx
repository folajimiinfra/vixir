import { useState } from 'react';
import { LabLayout } from '../../lab-shell/LabLayout';
import { Button } from '@vixir/ui';
import { Eye, Maximize2 } from 'lucide-react';

interface Reading {
  id: number;
  load: number; // N
  deflectionLoading: number; // mm
  deflectionUnloading: number; // mm
  meanDeflection: number; // mm
}

type Material = 'steel' | 'brass' | 'aluminium';
type Span = 0.6 | 0.8 | 1.0; // meters
type View = 'isometric' | 'elevation';

const materialData = {
  steel: { name: 'Mild Steel', color: '#708090', E: 200 }, // GPa (hidden, will be seeded)
  brass: { name: 'Brass', color: '#B5A642', E: 100 },
  aluminium: { name: 'Aluminium', color: '#C0C0C0', E: 70 },
};

export function BeamLab() {
  const [material, setMaterial] = useState<Material>('steel');
  const [span, setSpan] = useState<Span>(0.8);
  const [view, setView] = useState<View>('isometric');
  const [load, setLoad] = useState(0); // N (0, 1, 2, 3, 4, 5 N using 100g masses)
  const [gaugeZeroed, setGaugeZeroed] = useState(false);
  const [zeroError, setZeroError] = useState(0.05); // mm
  const [gaugeSettling, setGaugeSettling] = useState(false);
  const [currentDeflection, setCurrentDeflection] = useState(0);
  const [loadingReadings, setLoadingReadings] = useState<Map<number, number>>(new Map());
  const [readings, setReadings] = useState<Reading[]>([]);

  // Beam properties
  const width = 0.025; // m (25mm)
  const thickness = 0.003; // m (3mm)
  const I = (width * Math.pow(thickness, 3)) / 12; // Second moment of area

  // Hidden Young's modulus (seeded)
  const E = materialData[material].E * 1e9; // Convert GPa to Pa, add seed variation

  // Calculate deflection: δ = W L³ / (48 E I)
  const calculateDeflection = (W: number): number => {
    const L = span;
    const delta = (W * Math.pow(L, 3)) / (48 * E * I);
    return delta * 1000; // Convert to mm
  };

  const theoreticalDeflection = calculateDeflection(load);
  
  // Displayed deflection with noise and zero error
  const displayedDeflection = theoreticalDeflection + (gaugeZeroed ? 0 : zeroError) + (Math.random() * 0.02 - 0.01);

  const handleChangeLoad = (newLoad: number) => {
    setLoad(newLoad);
    setGaugeSettling(true);
    
    // Simulate needle settling
    setTimeout(() => {
      setCurrentDeflection(displayedDeflection);
      setGaugeSettling(false);
    }, 1500);
  };

  const handleZeroGauge = () => {
    setGaugeZeroed(true);
    setZeroError(0);
  };

  const handleRecordLoading = () => {
    if (gaugeSettling) {
      alert('⚠️ Wait for the dial gauge needle to settle before taking a reading!');
      return;
    }

    const rounded = Math.round(displayedDeflection * 100) / 100; // 0.01 mm resolution
    const newLoadingReadings = new Map(loadingReadings);
    newLoadingReadings.set(load, rounded);
    setLoadingReadings(newLoadingReadings);
  };

  const handleRecordUnloading = () => {
    if (gaugeSettling) {
      alert('⚠️ Wait for the dial gauge needle to settle before taking a reading!');
      return;
    }

    const loadingDeflection = loadingReadings.get(load);
    if (loadingDeflection === undefined) {
      alert('Please record the loading deflection for this load first!');
      return;
    }

    const rounded = Math.round(displayedDeflection * 100) / 100;
    const mean = (loadingDeflection + rounded) / 2;

    const newReading: Reading = {
      id: readings.length + 1,
      load,
      deflectionLoading: loadingDeflection,
      deflectionUnloading: rounded,
      meanDeflection: Number(mean.toFixed(3)),
    };

    setReadings([...readings, newReading]);
  };

  // Calculate E from slope
  const youngModulus = readings.length >= 4
    ? readings.reduce((sum, r) => {
        const expectedDelta = (r.load * Math.pow(span, 3)) / (48 * (r.meanDeflection / 1000) * I);
        return sum + expectedDelta;
      }, 0) / readings.length / 1e9 // Convert to GPa
    : null;

  // Visual deflection for SVG (magnified)
  const visualDeflection = theoreticalDeflection * 50; // Magnify for visibility

  return (
    <LabLayout
      experimentTitle="Beam Deflection - Determination of Young's Modulus"
      mode="practice"
      attemptNumber={1}
      onCallVix={() => console.log('Call Vix')}
      onNextStep={() => console.log('Calculate E')}
      nextStepLabel="Calculate E"
      nextStepDisabled={readings.length < 4}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Setup Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Material</h3>
            <div className="space-y-2">
              {(Object.keys(materialData) as Material[]).map(mat => (
                <button
                  key={mat}
                  onClick={() => {
                    setMaterial(mat);
                    setLoad(0);
                    setReadings([]);
                    setLoadingReadings(new Map());
                  }}
                  className={`w-full px-4 py-2 text-sm font-medium rounded border transition-colors ${
                    material === mat
                      ? 'bg-blue-100 border-blue-500 text-blue-900'
                      : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                  }`}
                  disabled={readings.length > 0}
                >
                  {materialData[mat].name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Span (L)</h3>
            <div className="space-y-2">
              {[0.6, 0.8, 1.0].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setSpan(s as Span);
                    setLoad(0);
                    setReadings([]);
                    setLoadingReadings(new Map());
                  }}
                  className={`w-full px-4 py-2 text-sm font-medium rounded border transition-colors ${
                    span === s
                      ? 'bg-blue-100 border-blue-500 text-blue-900'
                      : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                  }`}
                  disabled={readings.length > 0}
                >
                  {s} m
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">View</h3>
            <div className="space-y-2">
              <button
                onClick={() => setView('isometric')}
                className={`w-full px-4 py-2 text-sm font-medium rounded border transition-colors gap-2 ${
                  view === 'isometric'
                    ? 'bg-blue-100 border-blue-500 text-blue-900'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Isometric
              </button>
              <button
                onClick={() => setView('elevation')}
                className={`w-full px-4 py-2 text-sm font-medium rounded border transition-colors gap-2 ${
                  view === 'elevation'
                    ? 'bg-blue-100 border-blue-500 text-blue-900'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Maximize2 className="w-4 h-4 inline mr-2" />
                Elevation
              </button>
            </div>
          </div>
        </div>

        {/* Apparatus Visualization */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          {view === 'isometric' ? (
            <svg viewBox="0 0 800 500" className="w-full h-auto">
              {/* Frame (isometric) */}
              <g id="frame">
                <line x1="100" y1="400" x2="700" y2="400" stroke="#666" strokeWidth="4" />
                <rect x="95" y="400" width="10" height="60" fill="#666" />
                <rect x="695" y="400" width="10" height="60" fill="#666" />
              </g>

              {/* Knife edges */}
              <polygon points="150,395 160,405 140,405" fill="#333" />
              <polygon points="650,395 660,405 640,405" fill="#333" />

              {/* Beam (deflected) */}
              <path
                d={`M 150 390 Q 400 ${390 + visualDeflection} 650 390`}
                fill={materialData[material].color}
                stroke="#333"
                strokeWidth="2"
              />
              
              {/* Span dimension */}
              <line x1="150" y1="480" x2="650" y2="480" stroke="#999" strokeWidth="1" strokeDasharray="3,3" />
              <text x="400" y="495" textAnchor="middle" fontSize="14" fill="#666">
                L = {span} m
              </text>

              {/* Load hanger & masses at mid-span */}
              <g transform={`translate(400, ${390 + visualDeflection})`}>
                <rect x="-10" y="0" width="20" height="30" fill="#888" stroke="#333" strokeWidth="1" />
                {Array.from({ length: load }, (_, i) => (
                  <rect
                    key={i}
                    x="-15"
                    y={30 + i * 8}
                    width="30"
                    height="8"
                    fill="#B8860B"
                    stroke="#333"
                    strokeWidth="1"
                  />
                ))}
              </g>

              {/* Dial gauge on magnetic stand */}
              <g id="dial-gauge" transform={`translate(400, ${330 + visualDeflection})`}>
                <rect x="-5" y="-80" width="10" height="80" fill="#666" />
                <circle cx="0" cy="-100" r="35" fill="#F0F0F0" stroke="#333" strokeWidth="2" />
                <text x="0" y="-95" textAnchor="middle" fontSize="12" fontWeight="bold">
                  {currentDeflection.toFixed(2)}
                </text>
                <text x="0" y="-82" textAnchor="middle" fontSize="8" fill="#666">
                  mm
                </text>
                
                {/* Needle */}
                {load > 0 && !gaugeSettling && (
                  <line
                    x1="0"
                    y1="-100"
                    x2={25 * Math.cos(((currentDeflection / 2) * Math.PI) / 180 - Math.PI / 2)}
                    y2={-100 + 25 * Math.sin(((currentDeflection / 2) * Math.PI) / 180 - Math.PI / 2)}
                    stroke="#E53E3E"
                    strokeWidth="2"
                  />
                )}
                
                {gaugeSettling && (
                  <text x="0" y="-110" textAnchor="middle" fontSize="10" fill="#D97706">
                    Settling...
                  </text>
                )}
              </g>

              {/* Magnification note */}
              <text x="400" y="30" textAnchor="middle" fontSize="12" fill="#999" fontStyle="italic">
                Deflection magnified 50× for visibility
              </text>
            </svg>
          ) : (
            /* Elevation view */
            <svg viewBox="0 0 800 300" className="w-full h-auto">
              {/* Side view - simpler */}
              <line x1="100" y1="250" x2="700" y2="250" stroke="#666" strokeWidth="4" />
              
              {/* Knife edges */}
              <polygon points="150,245 155,250 145,250" fill="#333" />
              <polygon points="650,245 655,250 645,250" fill="#333" />

              {/* Beam */}
              <path
                d={`M 150 240 Q 400 ${240 + visualDeflection} 650 240`}
                fill="none"
                stroke={materialData[material].color}
                strokeWidth="4"
              />

              {/* Load at mid-span */}
              <line
                x1="400"
                y1={240 + visualDeflection}
                x2="400"
                y2={260 + visualDeflection}
                stroke="#E53E3E"
                strokeWidth="3"
                markerEnd="url(#arrowhead)"
              />
              <text x="420" y={255 + visualDeflection} fontSize="14" fill="#E53E3E">
                W = {load} N
              </text>

              {/* Deflection dimension */}
              {load > 0 && (
                <>
                  <line
                    x1="680"
                    y1="240"
                    x2="680"
                    y2={240 + visualDeflection}
                    stroke="#4A90E2"
                    strokeWidth="2"
                    markerStart="url(#arrow)"
                    markerEnd="url(#arrow)"
                  />
                  <text x="695" y={240 + visualDeflection / 2} fontSize="12" fill="#4A90E2">
                    δ (magnified)
                  </text>
                </>
              )}

              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#E53E3E" />
                </marker>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#4A90E2" />
                </marker>
              </defs>
            </svg>
          )}
        </div>

        {/* Load & Measurement Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
            <h3 className="font-semibold text-neutral-900">Load Control</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Load: {load} N {load > 0 && `(${(load * 100).toFixed(0)}g)`}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={load}
                onChange={(e) => handleChangeLoad(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-neutral-600 mt-1">
                Add/remove 100g slotted masses (1N ≈ 100g)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
            <h3 className="font-semibold text-neutral-900">Dial Gauge</h3>
            
            <div className="text-center p-4 bg-neutral-50 rounded">
              <div className="text-xs text-neutral-600 mb-1">Reading</div>
              <div className="text-3xl font-mono font-bold text-neutral-900">
                {currentDeflection.toFixed(2)} mm
              </div>
              {gaugeSettling && (
                <div className="text-xs text-amber-600 mt-2">
                  ⏱ Needle settling...
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleZeroGauge}
                disabled={gaugeZeroed || load > 0}
                variant="outline"
                size="sm"
              >
                Zero Gauge
              </Button>
              
              <Button
                onClick={handleRecordLoading}
                disabled={gaugeSettling || load === 0}
                variant="default"
                size="sm"
              >
                Record (Loading)
              </Button>

              <Button
                onClick={handleRecordUnloading}
                disabled={gaugeSettling || !loadingReadings.has(load)}
                variant="default"
                size="sm"
                className="col-span-2"
              >
                Record (Unloading)
              </Button>
            </div>

            {!gaugeZeroed && (
              <p className="text-xs text-amber-600">
                ⚠️ Gauge not zeroed. Zero error present in readings.
              </p>
            )}
          </div>
        </div>

        {/* Readings Table */}
        {readings.length > 0 && (
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Deflection Readings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">W (N)</th>
                    <th className="text-left py-2 px-3">δ Loading (mm)</th>
                    <th className="text-left py-2 px-3">δ Unloading (mm)</th>
                    <th className="text-left py-2 px-3">δ Mean (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((reading) => (
                    <tr
                      key={reading.id}
                      className="border-b border-neutral-100"
                    >
                      <td className="py-2 px-3">{reading.id}</td>
                      <td className="py-2 px-3 font-mono">{reading.load}</td>
                      <td className="py-2 px-3 font-mono">{reading.deflectionLoading.toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono">{reading.deflectionUnloading.toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono font-bold">{reading.meanDeflection.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {youngModulus && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-semibold text-green-900">
                  Young's Modulus (E): {youngModulus.toFixed(1)} GPa
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Material: {materialData[material].name} | Span: {span} m
                </p>
              </div>
            )}
            
            {readings.length >= 4 && (
              <p className="text-sm text-green-600 mt-3">
                ✓ Four readings recorded. You can now calculate Young's modulus from the δ vs W graph.
              </p>
            )}
          </div>
        )}
      </div>
    </LabLayout>
  );
}
