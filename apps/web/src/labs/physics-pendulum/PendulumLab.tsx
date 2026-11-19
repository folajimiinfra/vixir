import { useState, useEffect, useRef } from 'react';
import { LabLayout } from '../../lab-shell/LabLayout';
import { Button } from '@vixir/ui';
import { Play, Pause, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface Reading {
  id: number;
  length: number; // cm
  time: number; // seconds
  oscillations: number;
  period: number; // T = t/n
  periodSquared: number; // T²
  warning?: string;
}

export function PendulumLab() {
  const [length, setLength] = useState(100); // cm
  const [angle, setAngle] = useState(5); // degrees
  const [isSwinging, setIsSwinging] = useState(false);
  const [eyeLevel, setEyeLevel] = useState(false);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [oscillationCount, setOscillationCount] = useState(0);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [currentAngle, setCurrentAngle] = useState(0);
  
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const oscillationStartRef = useRef<number>(0);

  // Realistic physics: T = 2π√(L/g) with small angle correction
  const g = 9.81; // m/s² (will be seeded in real implementation)
  const period = 2 * Math.PI * Math.sqrt((length / 100) / g) * (1 + (angle * Math.PI / 180) ** 2 / 16);

  useEffect(() => {
    if (isSwinging && !stopwatchRunning) {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = (timestamp - startTimeRef.current) / 1000;
        
        // Simple harmonic motion with decay
        const decay = Math.exp(-0.02 * elapsed);
        const omega = 2 * Math.PI / period;
        const currentAngle = angle * Math.cos(omega * elapsed) * decay;
        
        setCurrentAngle(currentAngle);
        
        if (decay > 0.05) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsSwinging(false);
          setCurrentAngle(0);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else if (!isSwinging) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      startTimeRef.current = 0;
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSwinging, period, angle, stopwatchRunning]);

  // Stopwatch logic
  useEffect(() => {
    if (stopwatchRunning && isSwinging) {
      const interval = setInterval(() => {
        setStopwatchTime(prev => prev + 0.01);
        
        // Count oscillations
        const elapsed = stopwatchTime;
        const completedOscillations = Math.floor(elapsed / period);
        if (completedOscillations > oscillationCount) {
          setOscillationCount(completedOscillations);
        }
      }, 10);
      
      return () => clearInterval(interval);
    }
  }, [stopwatchRunning, isSwinging, period, stopwatchTime, oscillationCount]);

  const handleRelease = () => {
    if (!isSwinging) {
      setIsSwinging(true);
      setCurrentAngle(angle);
      startTimeRef.current = 0;
    }
  };

  const handleStartStopwatch = () => {
    if (!isSwinging) {
      alert('Please release the bob first!');
      return;
    }
    setStopwatchRunning(true);
    oscillationStartRef.current = stopwatchTime;
    setOscillationCount(0);
  };

  const handleStopStopwatch = () => {
    // Add reaction time error (0.1-0.3s)
    const reactionError = 0.15 + Math.random() * 0.15;
    const finalTime = stopwatchTime + reactionError;
    setStopwatchTime(finalTime);
    setStopwatchRunning(false);
  };

  const handleRecordReading = () => {
    if (!stopwatchTime) {
      alert('Please take a timing first!');
      return;
    }

    const displayLength = eyeLevel ? length : length + (Math.random() * 2 - 1); // Parallax error
    const T = stopwatchTime / (oscillationCount || 1);
    const T2 = T * T;
    
    const warning = oscillationCount !== 20 ? 'Not 20 oscillations' : undefined;
    
    const newReading: Reading = {
      id: readings.length + 1,
      length: Number(displayLength.toFixed(1)),
      time: Number(stopwatchTime.toFixed(2)),
      oscillations: oscillationCount,
      period: Number(T.toFixed(3)),
      periodSquared: Number(T2.toFixed(4)),
      warning,
    };
    
    setReadings([...readings, newReading]);
    
    // Reset for next reading
    setStopwatchTime(0);
    setOscillationCount(0);
  };

  const handleReset = () => {
    setIsSwinging(false);
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setOscillationCount(0);
    setCurrentAngle(0);
    startTimeRef.current = 0;
  };

  return (
    <LabLayout
      experimentTitle="Simple Pendulum - Determination of g"
      mode="practice"
      attemptNumber={1}
      onCallVix={() => console.log('Call Vix')}
      onNextStep={() => console.log('Analyse results')}
      nextStepLabel="Analyse Results"
      nextStepDisabled={readings.length < 6}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Pendulum SVG */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <svg
            viewBox="0 0 600 500"
            className="w-full h-auto"
            style={{ maxHeight: '500px' }}
          >
            {/* Retort Stand */}
            <g id="stand">
              <rect x="250" y="400" width="100" height="15" fill="#666" />
              <rect x="290" y="50" width="20" height="365" fill="#888" />
              <rect x="290" y="50" width="80" height="25" fill="#666" />
            </g>
            
            {/* Pivot Point */}
            <circle cx="300" cy="74" r="4" fill="#333" />
            
            {/* String */}
            <line
              x1="300"
              y1="74"
              x2={300 + (length * 2) * Math.sin((currentAngle * Math.PI) / 180)}
              y2={74 + (length * 2)}
              stroke="#8B4513"
              strokeWidth="2"
            />
            
            {/* Bob */}
            <circle
              cx={300 + (length * 2) * Math.sin((currentAngle * Math.PI) / 180)}
              cy={74 + (length * 2)}
              r="20"
              fill="#C0C0C0"
              stroke="#999"
              strokeWidth="2"
            />
            
            {/* Metre Rule (vertical reference) */}
            <g id="metre-rule">
              <rect x="450" y="74" width="20" height="400" fill="#F4E4C1" stroke="#8B7355" strokeWidth="1" />
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(mark => (
                <g key={mark}>
                  <line
                    x1="450"
                    y1={74 + mark * 4}
                    x2="460"
                    y2={74 + mark * 4}
                    stroke="#333"
                    strokeWidth="1"
                  />
                  {mark % 10 === 0 && (
                    <text x="475" y={78 + mark * 4} fontSize="10" fill="#333">
                      {mark}
                    </text>
                  )}
                </g>
              ))}
            </g>
            
            {/* Arc to show angle */}
            {angle > 0 && !isSwinging && (
              <path
                d={`M 300 ${74 + length * 2} A ${length * 2} ${length * 2} 0 0 ${angle > 0 ? 1 : 0} ${300 + (length * 2) * Math.sin((angle * Math.PI) / 180)} ${74 + (length * 2)}`}
                fill="none"
                stroke="#4A90E2"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            )}
          </svg>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Setup Controls */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
            <h3 className="font-semibold text-neutral-900">Setup</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Length (L): {length} cm
              </label>
              <input
                type="range"
                min="40"
                max="120"
                step="10"
                value={length}
                onChange={(e) => {
                  setLength(Number(e.target.value));
                  handleReset();
                }}
                className="w-full"
                disabled={isSwinging || stopwatchRunning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Initial Angle (θ₀): {angle}°
              </label>
              <input
                type="range"
                min="3"
                max="15"
                step="1"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full"
                disabled={isSwinging}
              />
              {angle > 10 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Large angle: small-angle formula may not hold
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setEyeLevel(!eyeLevel)}
                variant={eyeLevel ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
              >
                {eyeLevel ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                Eye Level
              </Button>
              {!eyeLevel && (
                <span className="text-xs text-amber-600">
                  ⚠️ Parallax error present
                </span>
              )}
            </div>
          </div>

          {/* Measurement Controls */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
            <h3 className="font-semibold text-neutral-900">Stopwatch</h3>
            
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-neutral-900 mb-2">
                {stopwatchTime.toFixed(2)}s
              </div>
              <div className="text-sm text-neutral-600">
                Oscillations: {oscillationCount}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleRelease}
                disabled={isSwinging}
                variant="outline"
                size="sm"
              >
                Release Bob
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>

              {!stopwatchRunning ? (
                <Button
                  onClick={handleStartStopwatch}
                  disabled={!isSwinging}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start
                </Button>
              ) : (
                <Button
                  onClick={handleStopStopwatch}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Stop
                </Button>
              )}

              <Button
                onClick={handleRecordReading}
                disabled={stopwatchRunning || !stopwatchTime}
                variant="default"
                size="sm"
              >
                Record
              </Button>
            </div>

            <p className="text-xs text-neutral-600">
              Target: 20 oscillations for accurate period measurement
            </p>
          </div>
        </div>

        {/* Readings Table */}
        {readings.length > 0 && (
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Readings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">L (cm)</th>
                    <th className="text-left py-2 px-3">t (s)</th>
                    <th className="text-left py-2 px-3">n</th>
                    <th className="text-left py-2 px-3">T (s)</th>
                    <th className="text-left py-2 px-3">T² (s²)</th>
                    <th className="text-left py-2 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((reading) => (
                    <tr
                      key={reading.id}
                      className={`border-b border-neutral-100 ${reading.warning ? 'bg-amber-50' : ''}`}
                    >
                      <td className="py-2 px-3">{reading.id}</td>
                      <td className="py-2 px-3">{reading.length}</td>
                      <td className="py-2 px-3">{reading.time}</td>
                      <td className="py-2 px-3">{reading.oscillations}</td>
                      <td className="py-2 px-3 font-mono">{reading.period}</td>
                      <td className="py-2 px-3 font-mono">{reading.periodSquared}</td>
                      <td className="py-2 px-3 text-amber-600 text-xs">{reading.warning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {readings.length >= 6 && (
              <p className="text-sm text-green-600 mt-3">
                ✓ Six readings recorded. You can now analyse your results.
              </p>
            )}
          </div>
        )}
      </div>
    </LabLayout>
  );
}
