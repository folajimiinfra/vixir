import { useState, useEffect, useRef } from 'react';
import { LabLayout } from '../../lab-shell/LabLayout';
import { Button } from '@vixir/ui';
import { Droplet, RotateCcw, FlaskConical } from 'lucide-react';

interface Titration {
  id: number;
  type: 'Rough' | 'Accurate';
  initial: number; // cm³
  final: number; // cm³
  titre: number; // final - initial
  concordant?: boolean;
}

type TapSetting = 'closed' | 'dropwise' | 'slow' | 'fast';

export function TitrationLab() {
  const [buretteVolume, setBuretteVolume] = useState(50.0); // cm³ in burette
  const [buretteReading, setBuretteReading] = useState(0.0); // cm³ delivered
  const [initialReading, setInitialReading] = useState<number | null>(null);
  const [tapSetting, setTapSetting] = useState<TapSetting>('closed');
  const [flaskSwirled, setFlaskSwirled] = useState(true);
  const [titrations, setTitrations] = useState<Titration[]>([]);
  const [pH, setPH] = useState(14.0); // Starting pH (NaOH solution)
  const [showPHCurve, setShowPHCurve] = useState(false);
  
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  // Hidden acid concentration (from seed)
  const acidConcentration = 0.125; // mol/dm³ (will be seeded)
  const baseConcentration = 0.100; // mol/dm³
  const baseVolume = 25.0; // cm³

  // Tap flow rates (cm³/s)
  const flowRates: Record<TapSetting, number> = {
    closed: 0,
    dropwise: 0.05,
    slow: 0.35,
    fast: 1.4,
  };

  // Calculate pH based on volumes
  const calculatePH = (volumeAdded: number) => {
    const molesBase = (baseVolume / 1000) * baseConcentration;
    const molesAcid = (volumeAdded / 1000) * acidConcentration;
    const totalVolume = (baseVolume + volumeAdded) / 1000;

    if (molesAcid < molesBase) {
      // Excess base
      const excessOH = (molesBase - molesAcid) / totalVolume;
      const pOH = -Math.log10(excessOH);
      return 14 - pOH;
    } else if (molesAcid > molesBase) {
      // Excess acid
      const excessH = (molesAcid - molesBase) / totalVolume;
      return -Math.log10(excessH);
    } else {
      return 7.0; // Equivalence point
    }
  };

  // Animation loop for tap flow
  useEffect(() => {
    if (tapSetting !== 'closed' && buretteVolume > 0) {
      const animate = (timestamp: number) => {
        if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;
        const delta = (timestamp - lastUpdateRef.current) / 1000;
        
        if (delta > 0) {
          const volumeChange = flowRates[tapSetting] * delta;
          
          setBuretteVolume(prev => Math.max(0, prev - volumeChange));
          setBuretteReading(prev => {
            const newReading = prev + volumeChange;
            setPH(calculatePH(newReading));
            return newReading;
          });
          
          // Mark as not swirled after adding acid
          if (volumeChange > 0.1) {
            setFlaskSwirled(false);
          }
          
          lastUpdateRef.current = timestamp;
        }
        
        if (buretteVolume > 0 && tapSetting !== 'closed') {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      lastUpdateRef.current = 0;
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [tapSetting, buretteVolume, acidConcentration]);

  const handleRecordInitial = () => {
    // Round to nearest 0.05
    const rounded = Math.round(buretteReading / 0.05) * 0.05;
    setInitialReading(rounded);
  };

  const handleRecordFinal = () => {
    if (initialReading === null) {
      alert('Please record initial reading first!');
      return;
    }

    // Round to nearest 0.05
    const rounded = Math.round(buretteReading / 0.05) * 0.05;
    const titre = rounded - initialReading;
    
    const type = titrations.length === 0 ? 'Rough' : 'Accurate';
    
    // Check concordance with last accurate titration
    let concordant = false;
    if (type === 'Accurate' && titrations.length > 0) {
      const lastAccurate = [...titrations].reverse().find(t => t.type === 'Accurate');
      if (lastAccurate) {
        concordant = Math.abs(titre - lastAccurate.titre) <= 0.10;
      }
    }

    const newTitration: Titration = {
      id: titrations.length + 1,
      type,
      initial: initialReading,
      final: rounded,
      titre: Number(titre.toFixed(2)),
      concordant,
    };
    
    setTitrations([...titrations, newTitration]);
  };

  const handleNewTitration = () => {
    setBuretteVolume(50.0);
    setBuretteReading(0.0);
    setInitialReading(null);
    setPH(14.0);
    setFlaskSwirled(true);
    setTapSetting('closed');
  };

  const handleSwirl = () => {
    setFlaskSwirled(true);
  };

  // Get flask color based on pH (phenolphthalein indicator)
  const getFlaskColor = () => {
    if (pH >= 8.2) return '#FF69B4'; // Pink
    if (pH >= 7.5) return '#FFB6C1'; // Light pink (fading)
    return 'transparent'; // Colorless
  };

  // Check for concordant titrations
  const concordantTitrations = titrations.filter(t => t.concordant);
  const meanTitre = concordantTitrations.length >= 2
    ? concordantTitrations.reduce((sum, t) => sum + t.titre, 0) / concordantTitrations.length
    : null;

  // Equivalence volume (for practice mode pH curve)
  const equivalenceVolume = (baseVolume * baseConcentration) / acidConcentration;
  const overshoot = buretteReading > equivalenceVolume + 0.10;

  return (
    <LabLayout
      experimentTitle="Acid-Base Titration"
      mode="practice"
      attemptNumber={1}
      onCallVix={() => console.log('Call Vix')}
      onNextStep={() => console.log('Calculate concentration')}
      nextStepLabel="Calculate"
      nextStepDisabled={!meanTitre}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Apparatus SVG */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <svg
            viewBox="0 0 700 600"
            className="w-full h-auto"
            style={{ maxHeight: '600px' }}
          >
            {/* Burette Stand */}
            <rect x="280" y="50" width="6" height="400" fill="#666" />
            <rect x="240" y="50" width="86" height="12" fill="#666" />
            <rect x="260" y="440" width="46" height="100" fill="#666" rx="8" />
            
            {/* Burette */}
            <g id="burette">
              <rect x="290" y="80" width="30" height="300" fill="#E8F4F8" stroke="#333" strokeWidth="2" />
              
              {/* Liquid in burette */}
              <rect
                x="292"
                y={380 - (buretteVolume / 50) * 300}
                width="26"
                height={(buretteVolume / 50) * 300}
                fill="#B8E6F0"
              />
              
              {/* Scale markings */}
              {Array.from({ length: 11 }, (_, i) => i * 5).map(mark => (
                <g key={mark}>
                  <line
                    x1="290"
                    y1={80 + (mark / 50) * 300}
                    x2="285"
                    y2={80 + (mark / 50) * 300}
                    stroke="#333"
                    strokeWidth="1"
                  />
                  <text
                    x="275"
                    y={85 + (mark / 50) * 300}
                    fontSize="10"
                    textAnchor="end"
                    fill="#333"
                  >
                    {mark}
                  </text>
                </g>
              ))}
              
              {/* Tap */}
              <circle cx="305" cy="385" r="8" fill={tapSetting !== 'closed' ? '#4A90E2' : '#999'} stroke="#333" strokeWidth="2" />
              
              {/* Tip & drops */}
              <rect x="302" y="385" width="6" height="15" fill="#999" />
              
              {/* Animated drops when tap open */}
              {tapSetting !== 'closed' && (
                <>
                  <circle cx="305" cy="405" r="3" fill="#B8E6F0" opacity="0.8" />
                  <circle cx="305" cy="415" r="2.5" fill="#B8E6F0" opacity="0.6" />
                </>
              )}
            </g>
            
            {/* Conical Flask */}
            <g id="flask">
              <path
                d="M 250 430 L 240 480 Q 235 520 250 540 L 360 540 Q 375 520 370 480 L 360 430 Z"
                fill={getFlaskColor()}
                fillOpacity="0.6"
                stroke="#333"
                strokeWidth="2"
              />
              <ellipse cx="305" cy="430" rx="55" ry="8" fill="none" stroke="#333" strokeWidth="2" />
              
              {/* Solution level */}
              <ellipse
                cx="305"
                cy="520"
                rx="50"
                ry="6"
                fill={getFlaskColor()}
                stroke="#333"
                strokeWidth="1"
              />
              
              {/* Swirl warning indicator */}
              {!flaskSwirled && tapSetting === 'closed' && (
                <text x="305" y="500" textAnchor="middle" fontSize="12" fill="#D97706">
                  ⚠ Swirl flask
                </text>
              )}
              
              {/* Local color streak when not swirled */}
              {!flaskSwirled && (
                <ellipse
                  cx="320"
                  cy="510"
                  rx="15"
                  ry="8"
                  fill="#B8E6F0"
                  opacity="0.8"
                />
              )}
            </g>
            
            {/* Meniscus view (magnified) */}
            <g id="meniscus-view" transform="translate(450, 100)">
              <rect x="0" y="0" width="150" height="100" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="2" rx="4" />
              <text x="75" y="20" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">
                Meniscus View
              </text>
              
              {/* Magnified reading */}
              <line x1="20" y1="60" x2="130" y2="60" stroke="#333" strokeWidth="1" />
              <path
                d="M 20 60 Q 75 65 130 60"
                fill="none"
                stroke="#4A90E2"
                strokeWidth="2"
              />
              <text x="75" y="85" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1F2937">
                {buretteReading.toFixed(2)} cm³
              </text>
            </g>
            
            {/* pH display (practice mode) */}
            {showPHCurve && (
              <g id="ph-display" transform="translate(450, 220)">
                <rect x="0" y="0" width="150" height="60" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" rx="4" />
                <text x="75" y="25" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#92400E">
                  pH: {pH.toFixed(2)}
                </text>
                <text x="75" y="45" textAnchor="middle" fontSize="10" fill="#92400E">
                  Practice mode only
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tap Control */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
            <h3 className="font-semibold text-neutral-900">Burette Control</h3>
            
            <div className="space-y-2">
              {(['closed', 'dropwise', 'slow', 'fast'] as TapSetting[]).map(setting => (
                <button
                  key={setting}
                  onClick={() => setTapSetting(setting)}
                  className={`w-full px-4 py-2 text-sm font-medium rounded border transition-colors ${
                    tapSetting === setting
                      ? 'bg-blue-100 border-blue-500 text-blue-900'
                      : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                  }`}
                  disabled={buretteVolume <= 0}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{setting}</span>
                    {setting !== 'closed' && (
                      <span className="text-xs text-neutral-500">
                        {flowRates[setting]} cm³/s
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {overshoot && (
              <p className="text-xs text-amber-600">
                ⚠️ Overshoot: You've passed the end point by more than 0.10 cm³
              </p>
            )}

            <div className="pt-2 border-t border-neutral-200">
              <Button
                onClick={handleSwirl}
                variant="outline"
                size="sm"
                className="w-full gap-2"
                disabled={flaskSwirled}
              >
                <FlaskConical className="w-4 h-4" />
                Swirl Flask
              </Button>
            </div>
          </div>

          {/* Recording */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
            <h3 className="font-semibold text-neutral-900">Record Readings</h3>
            
            <div className="text-center space-y-2">
              <div className="text-sm text-neutral-600">Current reading</div>
              <div className="text-3xl font-mono font-bold text-neutral-900">
                {buretteReading.toFixed(2)} cm³
              </div>
              {initialReading !== null && (
                <div className="text-sm text-neutral-600">
                  Initial: {initialReading.toFixed(2)} cm³
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleRecordInitial}
                variant="outline"
                size="sm"
                disabled={initialReading !== null}
              >
                Record Initial
              </Button>
              
              <Button
                onClick={handleRecordFinal}
                variant="default"
                size="sm"
                disabled={initialReading === null}
              >
                Record Final
              </Button>

              <Button
                onClick={handleNewTitration}
                variant="outline"
                size="sm"
                className="col-span-2 gap-2"
                disabled={initialReading === null}
              >
                <RotateCcw className="w-4 h-4" />
                New Titration
              </Button>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPHCurve}
                  onChange={(e) => setShowPHCurve(e.target.checked)}
                  className="rounded"
                />
                Show pH (practice mode)
              </label>
            </div>
          </div>
        </div>

        {/* Titrations Table */}
        {titrations.length > 0 && (
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Titrations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Initial (cm³)</th>
                    <th className="text-left py-2 px-3">Final (cm³)</th>
                    <th className="text-left py-2 px-3">Titre (cm³)</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {titrations.map((titration) => (
                    <tr
                      key={titration.id}
                      className={`border-b border-neutral-100 ${titration.concordant ? 'bg-green-50' : ''}`}
                    >
                      <td className="py-2 px-3">{titration.id}</td>
                      <td className="py-2 px-3">{titration.type}</td>
                      <td className="py-2 px-3 font-mono">{titration.initial.toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono">{titration.final.toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono font-bold">{titration.titre.toFixed(2)}</td>
                      <td className="py-2 px-3 text-xs">
                        {titration.concordant && <span className="text-green-600">✓ Concordant</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {meanTitre && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-semibold text-green-900">
                  Mean concordant titre: {meanTitre.toFixed(2)} cm³
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Two concordant titrations achieved. You can now calculate the acid concentration.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </LabLayout>
  );
}
