import { useState, useEffect, useRef } from 'react';
import { LabLayout } from '../../lab-shell/LabLayout';
import { Button } from '@vixir/ui';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

type Stage = 'mouth' | 'oesophagus' | 'stomach' | 'small-intestine' | 'large-intestine' | 'rectum';
type FoodType = 'bread' | 'beans' | 'groundnut-oil';
type PlaybackSpeed = 1 | 2 | 4;

interface StageInfo {
  name: string;
  enzymes: Record<FoodType, string[]>;
  pH: string;
  movement: string;
  substrate: Record<FoodType, string>;
  product: Record<FoodType, string>;
  question: string;
}

const stageData: Record<Stage, StageInfo> = {
  'mouth': {
    name: 'Mouth',
    enzymes: {
      'bread': ['Salivary amylase (ptyalin)'],
      'beans': [],
      'groundnut-oil': [],
    },
    pH: '6.8-7.0 (neutral)',
    movement: 'Mechanical chewing',
    substrate: {
      'bread': 'Starch',
      'beans': '—',
      'groundnut-oil': '—',
    },
    product: {
      'bread': 'Maltose',
      'beans': '—',
      'groundnut-oil': '—',
    },
    question: 'What is the role of saliva in the mouth?',
  },
  'oesophagus': {
    name: 'Oesophagus',
    enzymes: { 'bread': [], 'beans': [], 'groundnut-oil': [] },
    pH: '—',
    movement: 'Peristalsis (wave-like contractions)',
    substrate: { 'bread': '—', 'beans': '—', 'groundnut-oil': '—' },
    product: { 'bread': '—', 'beans': '—', 'groundnut-oil': '—' },
    question: 'How does food move down the oesophagus?',
  },
  'stomach': {
    name: 'Stomach',
    enzymes: {
      'bread': [],
      'beans': ['Pepsin', 'Rennin'],
      'groundnut-oil': [],
    },
    pH: '1.5-2.0 (very acidic)',
    movement: 'Churning',
    substrate: {
      'bread': '—',
      'beans': 'Protein',
      'groundnut-oil': '—',
    },
    product: {
      'bread': '—',
      'beans': 'Polypeptides',
      'groundnut-oil': '—',
    },
    question: 'Why is the stomach very acidic?',
  },
  'small-intestine': {
    name: 'Small Intestine',
    enzymes: {
      'bread': ['Maltase', 'Pancreatic amylase'],
      'beans': ['Trypsin', 'Erepsin'],
      'groundnut-oil': ['Lipase (+ bile salts)'],
    },
    pH: '7.5-8.5 (slightly alkaline)',
    movement: 'Peristalsis & segmentation',
    substrate: {
      'bread': 'Maltose',
      'beans': 'Polypeptides',
      'groundnut-oil': 'Fats',
    },
    product: {
      'bread': 'Glucose',
      'beans': 'Amino acids',
      'groundnut-oil': 'Fatty acids & glycerol',
    },
    question: 'What is the function of villi in the small intestine?',
  },
  'large-intestine': {
    name: 'Large Intestine',
    enzymes: { 'bread': [], 'beans': [], 'groundnut-oil': [] },
    pH: '5.5-7.0',
    movement: 'Slow peristalsis',
    substrate: { 'bread': '—', 'beans': '—', 'groundnut-oil': '—' },
    product: { 'bread': 'Water absorption', 'beans': 'Water absorption', 'groundnut-oil': 'Water absorption' },
    question: 'What happens to undigested food in the large intestine?',
  },
  'rectum': {
    name: 'Rectum & Anus',
    enzymes: { 'bread': [], 'beans': [], 'groundnut-oil': [] },
    pH: '—',
    movement: 'Storage & egestion',
    substrate: { 'bread': '—', 'beans': '—', 'groundnut-oil': '—' },
    product: { 'bread': 'Faeces', 'beans': 'Faeces', 'groundnut-oil': 'Faeces' },
    question: 'What is the difference between egestion and excretion?',
  },
};

const stages: Stage[] = ['mouth', 'oesophagus', 'stomach', 'small-intestine', 'large-intestine', 'rectum'];

export function DigestionLab() {
  const [selectedFood, setSelectedFood] = useState<FoodType>('bread');
  const [currentStage, setCurrentStage] = useState<Stage>('mouth');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [progress, setProgress] = useState(0); // 0-100 within current stage
  const [showVillusZoom, setShowVillusZoom] = useState(false);
  
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  // Stage durations in seconds (at 1x speed)
  const stageDurations: Record<Stage, number> = {
    'mouth': 3,
    'oesophagus': 4,
    'stomach': 8,
    'small-intestine': 12,
    'large-intestine': 6,
    'rectum': 3,
  };

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      const animate = (timestamp: number) => {
        if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;
        const delta = ((timestamp - lastUpdateRef.current) / 1000) * playbackSpeed;
        
        if (delta > 0) {
          const duration = stageDurations[currentStage];
          const increment = (delta / duration) * 100;
          
          setProgress(prev => {
            const newProgress = prev + increment;
            if (newProgress >= 100) {
              // Move to next stage
              const currentIndex = stages.indexOf(currentStage);
              if (currentIndex < stages.length - 1) {
                setCurrentStage(stages[currentIndex + 1]);
                return 0;
              } else {
                // Journey complete
                setIsPlaying(false);
                return 100;
              }
            }
            return newProgress;
          });
          
          lastUpdateRef.current = timestamp;
        }
        
        if (isPlaying) {
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
  }, [isPlaying, currentStage, playbackSpeed]);

  // Show villus zoom in small intestine
  useEffect(() => {
    setShowVillusZoom(currentStage === 'small-intestine' && progress > 30);
  }, [currentStage, progress]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStage('mouth');
    setProgress(0);
  };

  const handleJumpToStage = (stage: Stage) => {
    setCurrentStage(stage);
    setProgress(0);
    setIsPlaying(false);
  };

  const foodIcons: Record<FoodType, string> = {
    'bread': '🍞',
    'beans': '🫘',
    'groundnut-oil': '🥜',
  };

  const currentStageInfo = stageData[currentStage];
  const enzymesForFood = currentStageInfo.enzymes[selectedFood];

  return (
    <LabLayout
      experimentTitle="The Journey of Food - Digestive System"
      mode="practice"
      attemptNumber={1}
      onCallVix={() => console.log('Call Vix')}
      onNextStep={() => console.log('Review concepts')}
      nextStepLabel="Review Concepts"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Food Selection */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <h3 className="font-semibold text-neutral-900 mb-3">Select Food</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['bread', 'beans', 'groundnut-oil'] as FoodType[]).map(food => (
              <button
                key={food}
                onClick={() => {
                  setSelectedFood(food);
                  handleReset();
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedFood === food
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                disabled={isPlaying}
              >
                <div className="text-4xl mb-2">{foodIcons[food]}</div>
                <div className="text-sm font-medium capitalize">
                  {food.replace('-', ' ')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Digestive System Animation */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <svg
            viewBox="0 0 800 900"
            className="w-full h-auto"
            style={{ maxHeight: '900px' }}
          >
            {/* Mouth */}
            <g id="mouth" opacity={currentStage === 'mouth' ? 1 : 0.4}>
              <ellipse cx="400" cy="80" rx="60" ry="30" fill="#FFD7D7" stroke="#333" strokeWidth="2" />
              <text x="400" y="85" textAnchor="middle" fontSize="14" fontWeight="bold">Mouth</text>
              {currentStage === 'mouth' && (
                <circle cx="400" cy="80" r="10" fill="#FFA500">
                  <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Oesophagus */}
            <g id="oesophagus" opacity={currentStage === 'oesophagus' ? 1 : 0.4}>
              <rect x="380" y="110" width="40" height="150" fill="#FFE4E4" stroke="#333" strokeWidth="2" rx="8" />
              <text x="460" y="185" fontSize="12" fontWeight="bold">Oesophagus</text>
              {currentStage === 'oesophagus' && (
                <>
                  {/* Peristaltic waves */}
                  <ellipse cx="400" cy={110 + progress * 1.5} rx="25" ry="15" fill="#FFA500" opacity="0.6">
                    <animate attributeName="cy" from="110" to="260" dur="2s" repeatCount="indefinite" />
                  </ellipse>
                </>
              )}
            </g>

            {/* Stomach */}
            <g id="stomach" opacity={currentStage === 'stomach' ? 1 : 0.4}>
              <ellipse cx="420" cy="340" rx="80" ry="60" fill="#FFD0D0" stroke="#333" strokeWidth="2" />
              <text x="420" y="345" textAnchor="middle" fontSize="14" fontWeight="bold">Stomach</text>
              {currentStage === 'stomach' && (
                <>
                  {/* Churning animation */}
                  <circle cx="400" cy="340" r="15" fill="#FFA500" opacity="0.7">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 420 340"
                      to="360 420 340"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </>
              )}
            </g>

            {/* Small Intestine */}
            <g id="small-intestine" opacity={currentStage === 'small-intestine' ? 1 : 0.4}>
              <path
                d="M 400 400 Q 300 450 320 520 Q 340 590 420 600 Q 500 590 520 520 Q 540 450 440 400"
                fill="#FFE8D0"
                stroke="#333"
                strokeWidth="2"
              />
              <text x="420" y="500" textAnchor="middle" fontSize="14" fontWeight="bold">Small Intestine</text>
              {currentStage === 'small-intestine' && (
                <circle cx="420" cy="500" r="12" fill="#FFA500">
                  <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Large Intestine */}
            <g id="large-intestine" opacity={currentStage === 'large-intestine' ? 1 : 0.4}>
              <path
                d="M 420 620 Q 300 640 280 720 Q 300 780 380 790"
                fill="none"
                stroke="#333"
                strokeWidth="30"
                strokeLinecap="round"
                opacity="0.3"
              />
              <text x="320" y="700" fontSize="14" fontWeight="bold">Large Intestine</text>
              {currentStage === 'large-intestine' && (
                <circle cx={280 + progress} cy={720} r="10" fill="#8B4513">
                  <animate attributeName="opacity" values="1;0.6;1" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Rectum */}
            <g id="rectum" opacity={currentStage === 'rectum' ? 1 : 0.4}>
              <rect x="360" y="790" width="40" height="80" fill="#DDD" stroke="#333" strokeWidth="2" rx="8" />
              <text x="450" y="835" fontSize="12" fontWeight="bold">Rectum</text>
            </g>

            {/* Bolus/Food indicator */}
            {isPlaying && (
              <text
                x={
                  currentStage === 'mouth' ? 400 :
                  currentStage === 'oesophagus' ? 400 :
                  currentStage === 'stomach' ? 420 :
                  currentStage === 'small-intestine' ? 420 :
                  currentStage === 'large-intestine' ? 320 :
                  380
                }
                y={
                  currentStage === 'mouth' ? 80 :
                  currentStage === 'oesophagus' ? 110 + progress * 1.5 :
                  currentStage === 'stomach' ? 340 :
                  currentStage === 'small-intestine' ? 500 :
                  currentStage === 'large-intestine' ? 720 :
                  830
                }
                fontSize="24"
                textAnchor="middle"
              >
                {foodIcons[selectedFood]}
              </text>
            )}
          </svg>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">Playback Controls</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                variant={isPlaying ? 'destructive' : 'default'}
                size="sm"
                className="gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
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

              <div className="flex items-center gap-1 ml-2">
                {[1, 2, 4].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed as PlaybackSpeed)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-blue-100 text-blue-900 font-semibold'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    ×{speed}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stage Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-neutral-600 mb-1">
              <span>Progress in {currentStageInfo.name}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Jump to Stage */}
          <div className="flex flex-wrap gap-2">
            {stages.map(stage => (
              <button
                key={stage}
                onClick={() => handleJumpToStage(stage)}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  currentStage === stage
                    ? 'bg-blue-100 border-blue-500 text-blue-900 font-semibold'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
                disabled={isPlaying}
              >
                {stageData[stage].name}
              </button>
            ))}
          </div>
        </div>

        {/* Stage Information */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <h3 className="font-semibold text-neutral-900 mb-3">{currentStageInfo.name}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-700">pH Level:</p>
              <p className="text-sm text-neutral-900">{currentStageInfo.pH}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-neutral-700">Movement:</p>
              <p className="text-sm text-neutral-900">{currentStageInfo.movement}</p>
            </div>
          </div>

          {enzymesForFood.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-neutral-700 mb-1">Enzymes/Juices:</p>
              <ul className="text-sm text-neutral-900 list-disc list-inside">
                {enzymesForFood.map((enzyme, idx) => (
                  <li key={idx}>{enzyme}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-700">Substrate:</p>
              <p className="text-sm text-neutral-900">{currentStageInfo.substrate[selectedFood]}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-neutral-700">Product:</p>
              <p className="text-sm text-neutral-900">{currentStageInfo.product[selectedFood]}</p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium text-blue-900 mb-1">Check Yourself:</p>
            <p className="text-sm text-blue-800">{currentStageInfo.question}</p>
          </div>
        </div>

        {/* Villus Zoom (Small Intestine) */}
        {showVillusZoom && (
          <div className="bg-white rounded-lg border border-blue-500 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Magnified View: Villus</h3>
            <svg viewBox="0 0 400 300" className="w-full h-auto">
              {/* Villus structure */}
              <path
                d="M 150 250 L 150 100 Q 150 50 200 50 Q 250 50 250 100 L 250 250"
                fill="#FFE4E4"
                stroke="#333"
                strokeWidth="2"
              />
              
              {/* Capillary */}
              <circle cx="180" cy="150" r="20" fill="#FF6B6B" opacity="0.6" />
              <text x="180" y="155" textAnchor="middle" fontSize="10">Capillary</text>
              
              {/* Lacteal */}
              <circle cx="220" cy="150" r="20" fill="#FFE66D" opacity="0.6" />
              <text x="220" y="155" textAnchor="middle" fontSize="10">Lacteal</text>
              
              {/* Nutrients moving in */}
              <circle cx="200" cy="200" r="5" fill="#4A90E2">
                <animate attributeName="cy" from="200" to="150" dur="2s" repeatCount="indefinite" />
              </circle>
              
              <text x="200" y="280" textAnchor="middle" fontSize="12" fill="#666">
                Nutrients absorbed into bloodstream and lymph
              </text>
            </svg>
          </div>
        )}
      </div>
    </LabLayout>
  );
}
