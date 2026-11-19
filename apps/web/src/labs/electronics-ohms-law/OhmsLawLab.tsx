import { useState, useEffect } from 'react';
import { LabLayout } from '../../lab-shell/LabLayout';
import { Button } from '@vixir/ui';
import { Power, PowerOff, Zap } from 'lucide-react';

interface Reading {
  id: number;
  voltage: number; // V
  current: number; // A
}

export function OhmsLawLab() {
  const [keyState, setKeyState] = useState<'open' | 'closed'>('open');
  const [rheostatPosition, setRheostatPosition] = useState(50); // 0-100%
  const [voltmeterRange, setVoltmeterRange] = useState(5); // V
  const [ammeterRange, setAmmeterRange] = useState(1); // A
  const [wireTemp, setWireTemp] = useState(25); // °C
  const [readings, setReadings] = useState<Reading[]>([]);
  const [keyClosedTime, setKeyClosedTime] = useState(0);

  // Circuit parameters
  const emf = 3.0; // V (2 cells)
  const internalResistance = 0.5; // Ω
  const ammeterResistance = 0.1; // Ω
  const wireResistanceAt25C = 5.0; // Ω
  const tempCoefficient = 0.004; // per °C
  
  // Calculate wire resistance with temperature
  const wireResistance = wireResistanceAt25C * (1 + tempCoefficient * (wireTemp - 25));
  
  // Rheostat: 0-20 Ω
  const rheostatResistance = (rheostatPosition / 100) * 20;
  
  // Total circuit resistance
  const totalResistance = internalResistance + ammeterResistance + rheostatResistance + wireResistance;
  
  // Current (Ohm's law)
  const current = keyState === 'closed' ? emf / totalResistance : 0;
  
  // Voltage across test wire
  const voltage = current * wireResistance;
  
  // Power dissipated in wire (heating)
  const powerInWire = current * current * wireResistance;

  // Heat wire when key is closed
  useEffect(() => {
    if (keyState === 'closed') {
      const interval = setInterval(() => {
        setKeyClosedTime(prev => prev + 0.1);
        
        // Temperature rise based on power
        setWireTemp(prev => {
          const heatingRate = powerInWire * 2; // °C per second
          const coolingRate = (prev - 25) * 0.05; // Natural cooling
          return prev + (heatingRate - coolingRate) * 0.1;
        });
      }, 100);
      
      return () => clearInterval(interval);
    } else {
      setKeyClosedTime(0);
      // Cool down
      const interval = setInterval(() => {
        setWireTemp(prev => {
          if (prev > 25) {
            return Math.max(25, prev - 0.1);
          }
          return prev;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [keyState, powerInWire]);

  const handleRecordReading = () => {
    if (keyState === 'open') {
      alert('Please close the key first!');
      return;
    }

    if (wireTemp > 32) {
      alert('⚠️ Warning: Wire is hot. Consider opening the key between readings to prevent heating effects.');
    }

    // Check if readings exceed range
    if (current > ammeterRange) {
      alert(`Current (${current.toFixed(3)} A) exceeds ammeter range (${ammeterRange} A). Select a higher range.`);
      return;
    }
    if (voltage > voltmeterRange) {
      alert(`Voltage (${voltage.toFixed(2)} V) exceeds voltmeter range (${voltmeterRange} V). Select a higher range.`);
      return;
    }

    // Round to instrument resolution
    const ammeterResolution = ammeterRange / 100; // 1% of range
    const voltmeterResolution = voltmeterRange / 100;
    
    const roundedCurrent = Math.round(current / ammeterResolution) * ammeterResolution;
    const roundedVoltage = Math.round(voltage / voltmeterResolution) * voltmeterResolution;

    const newReading: Reading = {
      id: readings.length + 1,
      voltage: Number(roundedVoltage.toFixed(3)),
      current: Number(roundedCurrent.toFixed(4)),
    };
    
    setReadings([...readings, newReading]);
  };

  // Calculate resistance from slope of V-I graph
  const resistance = readings.length >= 3
    ? readings.reduce((sum, r) => sum + (r.voltage / r.current), 0) / readings.length
    : null;

  const tempWarning = wireTemp > 32;

  return (
    <LabLayout
      experimentTitle="Verifying Ohm's Law"
      mode="practice"
      attemptNumber={1}
      onCallVix={() => console.log('Call Vix')}
      onNextStep={() => console.log('Analyse results')}
      nextStepLabel="Analyse Results"
      nextStepDisabled={readings.length < 5}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Circuit Diagram */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <svg
            viewBox="0 0 800 400"
            className="w-full h-auto"
            style={{ maxHeight: '400px' }}
          >
            {/* Cells (EMF) */}
            <g id="cells">
              <line x1="50" y1="200" x2="120" y2="200" stroke="#333" strokeWidth="3" />
              {/* Cell 1 */}
              <line x1="120" y1="180" x2="120" y2="220" stroke="#333" strokeWidth="4" />
              <line x1="140" y1="190" x2="140" y2="210" stroke="#333" strokeWidth="2" />
              {/* Cell 2 */}
              <line x1="160" y1="180" x2="160" y2="220" stroke="#333" strokeWidth="4" />
              <line x1="180" y1="190" x2="180" y2="210" stroke="#333" strokeWidth="2" />
              <text x="150" y="250" textAnchor="middle" fontSize="12" fill="#666">3V</text>
            </g>

            {/* Key (switch) */}
            <g id="key">
              <circle cx="250" cy="200" r="5" fill={keyState === 'closed' ? '#4A90E2' : '#999'} />
              <circle cx="330" cy="200" r="5" fill={keyState === 'closed' ? '#4A90E2' : '#999'} />
              <line
                x1="255"
                y1="200"
                x2={keyState === 'closed' ? 325 : 315}
                y2={keyState === 'closed' ? 200 : 180}
                stroke={keyState === 'closed' ? '#4A90E2' : '#999'}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <text x="290" y="170" textAnchor="middle" fontSize="12" fill="#666">Key</text>
            </g>

            {/* Rheostat */}
            <g id="rheostat">
              <rect x="380" y="180" width="80" height="40" fill="none" stroke="#333" strokeWidth="2" rx="4" />
              <path
                d="M 390 200 Q 420 190 450 200"
                fill="none"
                stroke="#333"
                strokeWidth="2"
              />
              <text x="420" y="250" textAnchor="middle" fontSize="12" fill="#666">Rheostat</text>
              <text x="420" y="265" textAnchor="middle" fontSize="10" fill="#999">
                {rheostatPosition}%
              </text>
            </g>

            {/* Ammeter */}
            <g id="ammeter">
              <circle cx="530" cy="200" r="30" fill="#F0F0F0" stroke="#333" strokeWidth="2" />
              <text x="530" y="205" textAnchor="middle" fontSize="16" fontWeight="bold">A</text>
              <text x="530" y="250" textAnchor="middle" fontSize="12" fill="#666">Ammeter</text>
              
              {/* Needle */}
              {keyState === 'closed' && (
                <line
                  x1="530"
                  y1="200"
                  x2={530 + 20 * Math.cos(((-90 + (current / ammeterRange) * 180) * Math.PI) / 180)}
                  y2={200 + 20 * Math.sin(((-90 + (current / ammeterRange) * 180) * Math.PI) / 180)}
                  stroke="#E53E3E"
                  strokeWidth="2"
                />
              )}
              
              {/* Reading display */}
              <text x="530" y="175" textAnchor="middle" fontSize="10" fill="#333">
                {current.toFixed(3)} A
              </text>
            </g>

            {/* Test Wire */}
            <g id="test-wire">
              <line x1="580" y1="200" x2="700" y2="200" stroke={wireTemp > 32 ? '#E53E3E' : '#8B4513'} strokeWidth="6" />
              <text x="640" y="180" textAnchor="middle" fontSize="12" fill="#666">Test Wire</text>
              {tempWarning && (
                <text x="640" y="225" textAnchor="middle" fontSize="10" fill="#E53E3E">
                  🔥 {wireTemp.toFixed(1)}°C
                </text>
              )}
            </g>

            {/* Voltmeter (across test wire) */}
            <g id="voltmeter">
              <circle cx="640" cy="300" r="30" fill="#F0F0F0" stroke="#333" strokeWidth="2" />
              <text x="640" y="305" textAnchor="middle" fontSize="16" fontWeight="bold">V</text>
              
              {/* Needle */}
              {keyState === 'closed' && (
                <line
                  x1="640"
                  y1="300"
                  x2={640 + 20 * Math.cos(((-90 + (voltage / voltmeterRange) * 180) * Math.PI) / 180)}
                  y2={300 + 20 * Math.sin(((-90 + (voltage / voltmeterRange) * 180) * Math.PI) / 180)}
                  stroke="#E53E3E"
                  strokeWidth="2"
                />
              )}
              
              {/* Reading display */}
              <text x="640" y="275" textAnchor="middle" fontSize="10" fill="#333">
                {voltage.toFixed(2)} V
              </text>
              
              {/* Connection lines */}
              <line x1="580" y1="200" x2="640" y2="270" stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="700" y1="200" x2="640" y2="270" stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
            </g>

            {/* Wire connections */}
            <line x1="180" y1="200" x2="250" y2="200" stroke="#333" strokeWidth="3" />
            <line x1="330" y1="200" x2="380" y2="200" stroke="#333" strokeWidth="3" />
            <line x1="460" y1="200" x2="500" y2="200" stroke="#333" strokeWidth="3" />
            <line x1="560" y1="200" x2="580" y2="200" stroke="#333" strokeWidth="3" />
            <line x1="700" y1="200" x2="750" y2="200" stroke="#333" strokeWidth="3" />
            <line x1="750" y1="200" x2="750" y2="350" stroke="#333" strokeWidth="3" />
            <line x1="750" y1="350" x2="50" y2="350" stroke="#333" strokeWidth="3" />
            <line x1="50" y1="350" x2="50" y2="200" stroke="#333" strokeWidth="3" />

            {/* Current flow animation */}
            {keyState === 'closed' && (
              <>
                <circle cx="100" cy="200" r="4" fill="#FBBF24">
                  <animateMotion
                    dur="4s"
                    repeatCount="indefinite"
                    path="M 0 0 L 80 0 L 80 0 L 150 0 L 150 0 L 80 0 L 80 0 L 120 0 L 120 0 L 170 0 L 170 0 L 50 0 L 50 150 L -700 150 L -700 -150 L -650 -150"
                  />
                </circle>
              </>
            )}
          </svg>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Circuit Control */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
            <h3 className="font-semibold text-neutral-900">Circuit Control</h3>
            
            <div>
              <Button
                onClick={() => setKeyState(keyState === 'open' ? 'closed' : 'open')}
                variant={keyState === 'closed' ? 'destructive' : 'default'}
                size="lg"
                className="w-full gap-2"
              >
                {keyState === 'closed' ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                {keyState === 'closed' ? 'Open Key' : 'Close Key'}
              </Button>
              
              {keyState === 'closed' && (
                <p className="text-xs text-amber-600 mt-2">
                  Key closed for {keyClosedTime.toFixed(1)}s
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Rheostat: {rheostatPosition}% ({rheostatResistance.toFixed(1)} Ω)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={rheostatPosition}
                onChange={(e) => setRheostatPosition(Number(e.target.value))}
                className="w-full"
                disabled={keyState === 'closed'}
              />
              <p className="text-xs text-neutral-600 mt-1">
                Adjust resistance to change current
              </p>
            </div>

            {tempWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm font-medium text-amber-900">⚠️ Temperature Warning</p>
                <p className="text-xs text-amber-700 mt-1">
                  Wire temperature: {wireTemp.toFixed(1)}°C. Open key between readings to prevent heating effects.
                </p>
              </div>
            )}
          </div>

          {/* Meter Ranges & Recording */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
            <h3 className="font-semibold text-neutral-900">Measurements</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Ammeter Range
                </label>
                <select
                  value={ammeterRange}
                  onChange={(e) => setAmmeterRange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded"
                  disabled={keyState === 'closed'}
                >
                  <option value={0.1}>0.1 A</option>
                  <option value={0.5}>0.5 A</option>
                  <option value={1}>1 A</option>
                  <option value={2}>2 A</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Voltmeter Range
                </label>
                <select
                  value={voltmeterRange}
                  onChange={(e) => setVoltmeterRange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded"
                  disabled={keyState === 'closed'}
                >
                  <option value={1}>1 V</option>
                  <option value={2.5}>2.5 V</option>
                  <option value={5}>5 V</option>
                  <option value={10}>10 V</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded">
              <div>
                <p className="text-xs text-neutral-600">Current</p>
                <p className="text-xl font-mono font-bold text-neutral-900">{current.toFixed(3)} A</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600">Voltage</p>
                <p className="text-xl font-mono font-bold text-neutral-900">{voltage.toFixed(2)} V</p>
              </div>
            </div>

            <Button
              onClick={handleRecordReading}
              disabled={keyState === 'open'}
              variant="default"
              size="sm"
              className="w-full gap-2"
            >
              <Zap className="w-4 h-4" />
              Record Reading
            </Button>
          </div>
        </div>

        {/* Readings Table */}
        {readings.length > 0 && (
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Readings & V-I Graph</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-2 px-3">#</th>
                      <th className="text-left py-2 px-3">I (A)</th>
                      <th className="text-left py-2 px-3">V (V)</th>
                      <th className="text-left py-2 px-3">R (Ω)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((reading) => (
                      <tr
                        key={reading.id}
                        className="border-b border-neutral-100"
                      >
                        <td className="py-2 px-3">{reading.id}</td>
                        <td className="py-2 px-3 font-mono">{reading.current.toFixed(4)}</td>
                        <td className="py-2 px-3 font-mono">{reading.voltage.toFixed(3)}</td>
                        <td className="py-2 px-3 font-mono">{(reading.voltage / reading.current).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {resistance && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm font-semibold text-green-900">
                      Mean Resistance: {resistance.toFixed(2)} Ω
                    </p>
                  </div>
                )}
              </div>

              {/* Simple V-I plot */}
              <div className="border border-neutral-200 rounded p-4">
                <svg viewBox="0 0 300 250" className="w-full h-auto">
                  {/* Axes */}
                  <line x1="40" y1="210" x2="280" y2="210" stroke="#333" strokeWidth="2" />
                  <line x1="40" y1="210" x2="40" y2="20" stroke="#333" strokeWidth="2" />
                  <text x="280" y="230" fontSize="12" fill="#666">I (A)</text>
                  <text x="20" y="20" fontSize="12" fill="#666">V (V)</text>
                  
                  {/* Data points */}
                  {readings.map((r, idx) => {
                    const x = 40 + (r.current / Math.max(...readings.map(r => r.current), 0.1)) * 230;
                    const y = 210 - (r.voltage / Math.max(...readings.map(r => r.voltage), 1)) * 180;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#4A90E2"
                      />
                    );
                  })}
                  
                  {/* Best fit line hint */}
                  {readings.length >= 2 && (
                    <line
                      x1="40"
                      y1="210"
                      x2="270"
                      y2={210 - 180}
                      stroke="#E53E3E"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity="0.5"
                    />
                  )}
                </svg>
                <p className="text-xs text-center text-neutral-600 mt-2">
                  Voltage vs. Current (Slope = R)
                </p>
              </div>
            </div>
            
            {readings.length >= 5 && (
              <p className="text-sm text-green-600 mt-3">
                ✓ Five readings recorded. You can now analyse your results.
              </p>
            )}
          </div>
        )}
      </div>
    </LabLayout>
  );
}
