import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LabLayout } from '../../lab-shell/LabLayout';

type SystemKey = 'skeletal' | 'circulatory' | 'respiratory' | 'nervous';
type ActivityMode = 'resting' | 'walking' | 'running';
type FocusTab = 'skeleton' | 'heart' | 'lungs' | 'nerves';

const ACTIVITY_STATS: Record<ActivityMode, { bpm: number; breaths: number }> = {
  resting: { bpm: 72, breaths: 14 },
  walking: { bpm: 98, breaths: 20 },
  running: { bpm: 148, breaths: 34 },
};

export function BodySystemsLab() {
  const navigate = useNavigate();
  const [layers, setLayers] = useState<Record<SystemKey, boolean>>({
    skeletal: true,
    circulatory: true,
    respiratory: true,
    nervous: false,
  });
  const [activity, setActivity] = useState<ActivityMode>('resting');
  const [focusTab, setFocusTab] = useState<FocusTab>('heart');
  const [selectedPart, setSelectedPart] = useState('Heart');

  const toggleLayer = (key: SystemKey) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const stats = ACTIVITY_STATS[activity];

  return (
    <LabLayout
      experimentTitle="Human anatomy — body systems explorer"
      subtitle="Biology · animated · layer the systems on and off"
      activeLab="biology"
      mode="practice"
      headerRightExtra={
        <div className="hidden sm:flex items-center gap-2">
          <Link
            to="/lab/biology/digestion"
            className="px-3.5 py-1.5 rounded-full bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors"
          >
            Digestion
          </Link>
          <Link
            to="/lab/biology/dissection"
            className="px-3.5 py-1.5 rounded-full bg-[#121A2B] hover:bg-[#192338] border border-[#22304A] text-xs font-semibold text-[#E6EBF5] transition-colors"
          >
            Dissection
          </Link>
        </div>
      }
      leftTray={
        <div className="space-y-5">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2.5">
              LAYERS
            </div>
            <div className="space-y-2">
              {[
                {
                  key: 'skeletal' as const,
                  name: 'Skeletal',
                  sub: 'support & movement',
                  dot: 'bg-[#E5E7EB]',
                },
                {
                  key: 'circulatory' as const,
                  name: 'Circulatory',
                  sub: 'heart & blood vessels',
                  dot: 'bg-[#EF4444]',
                },
                {
                  key: 'respiratory' as const,
                  name: 'Respiratory',
                  sub: 'airways & lungs',
                  dot: 'bg-[#60A5FA]',
                },
                {
                  key: 'nervous' as const,
                  name: 'Nervous',
                  sub: 'brain, spinal cord, nerves',
                  dot: 'bg-[#FACC15]',
                },
              ].map((item) => {
                const on = layers[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleLayer(item.key)}
                    className={`w-full text-left rounded-xl px-3 py-2.5 border flex items-center gap-2.5 transition-colors cursor-pointer ${
                      on
                        ? 'bg-[#121A2B] border-[#3A4A68] text-[#E6EBF5]'
                        : 'bg-[#0B1220] border-[#1E2A42] text-[#6B778C]'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        on ? item.dot : 'bg-[#3A4A68]'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-semibold">{item.name}</div>
                      <div className="text-[11px] text-[#93A0B8]">{item.sub}</div>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => navigate('/lab/biology/digestion')}
                className="w-full text-left rounded-xl px-3 py-2.5 border border-dashed border-[#2C3B59] hover:border-[#F472B6] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#F472B6] shrink-0" />
                <div className="text-xs font-semibold text-[#C9D3E6]">
                  Digestive system — open lab →
                </div>
              </button>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#93A0B8] mb-2">
              ACTIVITY
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {(['resting', 'walking', 'running'] as ActivityMode[]).map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => setActivity(act)}
                  className={`py-2 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    activity === act
                      ? 'bg-[#4ADE80] text-[#0B1220]'
                      : 'bg-[#121A2B] border border-[#22304A] text-[#E6EBF5]'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-2.5">
                <div className="text-[10px] text-[#93A0B8] mb-0.5">Heart rate</div>
                <div className="font-mono text-base font-bold text-[#FCA5A5]">
                  {stats.bpm} bpm
                </div>
              </div>
              <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-2.5">
                <div className="text-[10px] text-[#93A0B8] mb-0.5">Breathing</div>
                <div className="font-mono text-base font-bold text-[#93C5FD]">
                  {stats.breaths} /min
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      rightPanel={
        <div className="space-y-4">
          {/* Focus tabs */}
          <div className="bg-[#121A2B] border border-[#22304A] p-1 rounded-xl grid grid-cols-4 text-xs font-semibold">
            {(
              [
                { id: 'skeleton', label: 'Skeleton' },
                { id: 'heart', label: 'Heart' },
                { id: 'lungs', label: 'Lungs' },
                { id: 'nerves', label: 'Nerves' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFocusTab(t.id)}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  focusTab === t.id
                    ? 'bg-[#4ADE80] text-[#0B1220]'
                    : 'text-[#93A0B8] hover:text-[#E6EBF5]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-white mb-1.5">
              {focusTab === 'heart'
                ? 'Circulatory system'
                : focusTab === 'lungs'
                  ? 'Respiratory system'
                  : focusTab === 'skeleton'
                    ? 'Skeletal system'
                    : 'Nervous system'}
            </h2>
            <p className="text-xs text-[#C9D3E6] leading-relaxed">
              The heart pumps blood through arteries to every cell and back through veins. Blood
              goes through the heart twice per lap: once to the lungs and once to the body —
              double circulation.
            </p>
          </div>

          {/* Inside the heart · double circulation diagram */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-xs text-[#93A0B8] mb-2">
              Inside the heart · double circulation
            </div>
            <svg viewBox="0 0 260 175" className="w-full h-auto">
              {/* Lungs pill at top */}
              <rect x="98" y="8" width="64" height="18" rx="6" fill="#0E3A5A" />
              <text
                x="130"
                y="20"
                textAnchor="middle"
                fill="#E0F2FE"
                fontSize="9"
                fontWeight="600"
              >
                LUNGS
              </text>

              {/* Circulation tracks */}
              <path
                d="M 40 148 L 40 20 L 98 20 M 162 20 L 220 20 L 220 148"
                fill="none"
                stroke="#3A4A68"
                strokeWidth="6"
              />

              {/* 4 Chambers */}
              <rect
                x="62"
                y="45"
                width="62"
                height="44"
                rx="8"
                fill="#1D4ED8"
                stroke="#60A5FA"
                strokeWidth="1.5"
              />
              <text x="93" y="70" textAnchor="middle" fill="#E0F2FE" fontSize="8">
                R atrium
              </text>

              <rect
                x="136"
                y="45"
                width="62"
                height="44"
                rx="8"
                fill="#991B1B"
                stroke="#F87171"
                strokeWidth="1.5"
              />
              <text x="167" y="70" textAnchor="middle" fill="#FEE2E2" fontSize="8">
                L atrium
              </text>

              <rect
                x="62"
                y="97"
                width="62"
                height="50"
                rx="8"
                fill="#1D4ED8"
                stroke="#60A5FA"
                strokeWidth="1.5"
              />
              <text x="93" y="125" textAnchor="middle" fill="#E0F2FE" fontSize="8">
                R ventricle
              </text>

              <rect
                x="136"
                y="97"
                width="62"
                height="50"
                rx="8"
                fill="#991B1B"
                stroke="#F87171"
                strokeWidth="2.5"
              />
              <text x="167" y="125" textAnchor="middle" fill="#FEE2E2" fontSize="8">
                L ventricle
              </text>

              {/* Moving blood corpuscles */}
              <circle cx="92" cy="80" r="3" fill="#60A5FA" />
              <circle cx="98" cy="82" r="3" fill="#60A5FA" />
              <circle cx="48" cy="30" r="3" fill="#60A5FA" />
              <circle cx="167" cy="112" r="3" fill="#F87171" />
              <circle cx="216" cy="40" r="3" fill="#F87171" />
              <circle cx="222" cy="144" r="3" fill="#F87171" />

              <text x="40" y="164" textAnchor="middle" fill="#93A0B8" fontSize="8">
                from body
              </text>
              <text x="220" y="164" textAnchor="middle" fill="#93A0B8" fontSize="8">
                to body
              </text>
            </svg>
          </div>

          {/* Structure buttons */}
          <div className="grid grid-cols-2 gap-2">
            {['Heart', 'Aorta', 'Vena cava', 'Pulmonary artery', 'Capillaries', 'Blood'].map(
              (part) => (
                <button
                  key={part}
                  type="button"
                  onClick={() => setSelectedPart(part)}
                  className={`text-left px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    selectedPart === part
                      ? 'bg-[#121A2B] border-[#60A5FA] text-white'
                      : 'bg-[#121A2B] border-[#22304A] text-[#C9D3E6] hover:border-[#3A4A68]'
                  }`}
                >
                  {part}
                </button>
              )
            )}
          </div>

          {/* Try this card */}
          <div className="bg-[#121A2B] border border-[#22304A] rounded-xl p-3.5">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#60A5FA] mb-1.5">
              TRY THIS
            </div>
            <p className="text-xs text-[#C9D3E6] leading-relaxed">
              Change the activity to Running. Why does the heart rate rise? Which wall in the
              heart inset is thickest, and why?
            </p>
          </div>
        </div>
      }
    >
      {/* Center Human Body Systems SVG matching D5-biology-body-systems.svg */}
      <div className="flex-1 flex items-center justify-center my-2">
        <svg
          viewBox="0 0 420 640"
          className="w-full max-w-[380px] h-auto max-h-[540px]"
          role="img"
          aria-label="Human body showing skeletal, circulatory, respiratory and nervous layers"
        >
          {/* Body silhouette */}
          <circle
            cx="210"
            cy="62"
            r="42"
            fill="#FDE7D6"
            opacity="0.1"
            stroke="#FDE7D6"
            strokeOpacity="0.35"
          />
          <path
            d="M190 102 L190 120 L120 140 Q96 150 92 180 L70 330 L88 334 L112 210 L126 330 Q124 360 132 400 L144 620 L188 620 L204 420 L216 420 L232 620 L276 620 L288 400 Q296 360 294 330 L308 210 L332 334 L350 330 L328 180 Q324 150 300 140 L230 120 L230 102 Z"
            fill="#FDE7D6"
            opacity="0.07"
            stroke="#FDE7D6"
            strokeOpacity="0.3"
          />

          {/* Skeletal Layer */}
          {layers.skeletal && (
            <g>
              <g
                stroke="#E5E7EB"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
              >
                <ellipse cx="210" cy="58" rx="30" ry="36" strokeWidth="3" />
                <line x1="150" y1="138" x2="270" y2="138" />
                <line x1="150" y1="140" x2="116" y2="232" />
                <line x1="116" y1="232" x2="96" y2="326" />
                <line x1="270" y1="140" x2="304" y2="232" />
                <line x1="304" y1="232" x2="324" y2="326" />
                <path
                  d="M174 360 Q210 330 246 360 L238 392 Q210 404 182 392 Z"
                  strokeWidth="4"
                />
                <line x1="184" y1="392" x2="170" y2="500" />
                <line x1="170" y1="500" x2="166" y2="608" />
                <line x1="236" y1="392" x2="250" y2="500" />
                <line x1="250" y1="500" x2="254" y2="608" />
              </g>
              {Array.from({ length: 16 }, (_, i) => 100 + i * 15.5).map((vy) => (
                <rect
                  key={vy}
                  x="204"
                  y={vy}
                  width="12"
                  height="9"
                  rx="2"
                  fill="#E5E7EB"
                />
              ))}
              {[0, 1, 2, 3, 4, 5].map((r) => {
                const ry = 160 + r * 20;
                return (
                  <path
                    key={r}
                    d={`M210 ${ry} Q${150 - r * 2} ${ry + 6} ${156 + r * 3} ${ry + 26} M210 ${ry} Q${270 + r * 2} ${ry + 6} ${264 - r * 3} ${ry + 26}`}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                  />
                );
              })}
            </g>
          )}

          {/* Respiratory Layer */}
          {layers.respiratory && (
            <g>
              <path
                d="M196 170 Q160 168 150 220 Q144 280 172 296 Q196 300 200 260 Z"
                fill="#93C5FD"
                opacity="0.55"
                stroke="#60A5FA"
              />
              <path
                d="M224 170 Q260 168 270 220 Q276 280 248 296 Q224 300 220 260 Z"
                fill="#93C5FD"
                opacity="0.55"
                stroke="#60A5FA"
              />
              <line x1="210" y1="108" x2="210" y2="166" stroke="#BFDBFE" strokeWidth="7" />
              <path
                d="M210 166 L194 184 M210 166 L226 184"
                stroke="#BFDBFE"
                strokeWidth="5"
                fill="none"
              />
            </g>
          )}

          {/* Circulatory Layer */}
          {layers.circulatory && (
            <g>
              <g fill="none" strokeWidth="3" strokeLinecap="round">
                <path
                  d="M222 200 L222 120 L214 80 M222 200 L222 360 L200 400 L188 500 L180 610 M222 360 L240 400 L246 500 L250 610 M222 150 L270 160 L300 232 L318 326 M222 150 L160 160 L118 232 L100 326"
                  stroke="#EF4444"
                  strokeDasharray="7 9"
                />
                <path
                  d="M198 200 L198 120 L204 80 M198 210 L198 360 L180 400 L174 500 L170 610 M198 360 L226 400 L236 500 L240 610 M198 150 L150 160 L110 232 L92 326 M198 150 L264 165 L294 232 L310 326"
                  stroke="#3B82F6"
                  strokeDasharray="7 9"
                  opacity="0.85"
                />
              </g>
              <path
                d="M214 186 C 196 172, 188 200, 214 222 C 240 200, 232 172, 214 186 Z"
                fill="#DC2626"
                stroke="#FCA5A5"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Nervous Layer */}
          {layers.nervous && (
            <g>
              <path
                d="M182 46 Q190 20 214 22 Q240 22 242 48 Q246 72 226 80 L196 80 Q178 72 182 46 Z"
                fill="#FDE68A"
                opacity="0.55"
                stroke="#FACC15"
              />
              <g fill="none" stroke="#FACC15" strokeWidth="2" opacity="0.85">
                <path d="M210 80 L210 360" />
                <path d="M210 140 L150 150 L112 232 L94 330 M210 140 L270 150 L308 232 L326 330 M210 360 L186 420 L172 520 L168 612 M210 360 L234 420 L248 520 L252 612 M210 200 L160 220 M210 200 L260 220 M210 260 L170 280 M210 260 L250 280" />
              </g>
            </g>
          )}
        </svg>
      </div>
    </LabLayout>
  );
}
