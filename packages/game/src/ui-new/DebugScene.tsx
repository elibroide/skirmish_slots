import React, { useState } from 'react';
import { Hand } from './components/Hand';
import { HandSettings, DEFAULT_SETTINGS } from './components/Card';
import { useGameStore } from '../store/gameStore';
import orderData from './Data/order.json';
import type { CardInstance } from '@skirmish/card-maker';
import { PhaserLayer } from '../phaser/PhaserLayer';

// Filter to only use "Normal" template cards
const NORMAL_TEMPLATE = orderData.templates.find(t => t.name === 'Normal');
const INITIAL_CARDS = (orderData.cards as unknown as CardInstance[]).filter(c =>
  NORMAL_TEMPLATE ? c.templateId === NORMAL_TEMPLATE.id : true
);

interface DebugSceneProps {
  onBack: () => void;
}

const InputColor = ({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) => (
  <div className="flex justify-between items-center">
    <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{label}</label>
    <div className="flex gap-2 items-center">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-16 text-right font-mono text-[10px] text-stone-700 bg-white border border-stone-200 rounded px-1"
      />
    </div>
  </div>
);

const InputRange = ({ label, value, min, max, step, onChange, type = 'range' }: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  type?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{label}</label>
      {type !== 'checkbox' && (
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-16 text-right font-mono text-[10px] text-stone-700 bg-white border border-stone-200 rounded px-1 focus:outline-none focus:border-blue-400"
        />
      )}
    </div>
    {type === 'checkbox' ? (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked ? 1 : 0)}
        className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
      />
    ) : (
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
      />
    )}
  </div>
);

const SettingsPanel = ({ settings, onUpdate, onReset, onAddCard, onDrawRandom }: {
  settings: HandSettings;
  onUpdate: (key: keyof HandSettings, value: number) => void;
  onReset: () => void;
  onAddCard: () => void;
  onDrawRandom: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'hand' | 'board'>('hand');
  const [isMinimized, setIsMinimized] = useState(true);
  const [dockSide, setDockSide] = useState<'left' | 'right'>('right');

  // Board Settings from Store
  const boardSettings = useGameStore(state => state.boardSettings);
  const updateBoard = useGameStore(state => state.updateBoardSettings);
  const dragState = useGameStore(state => state.dragState);
  const setDragState = useGameStore(state => state.setDragState);
  const setHoveredSlot = useGameStore(state => state.setHoveredSlot);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Hand Positioning': true,
    'Slot Layout': true,
    'Card Margins': true,
    'Debug State': true,
    'Actions': true,
  });
  const [copyFeedback, setCopyFeedback] = useState('');

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleExport = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback(''), 1000);
  };

  const handSections = [
    {
      title: 'Actions',
      settings: [],
      customContent: (
        <div className="flex flex-col gap-2 p-2 bg-stone-100 rounded border border-stone-200">
          <div className="flex gap-2">
            <button onClick={onAddCard} className="flex-1 py-1 bg-white border border-stone-300 rounded text-[10px] font-bold text-stone-600 hover:bg-stone-50 hover:text-blue-600 shadow-sm">
              + CARD
            </button>
            <button onClick={onDrawRandom} className="flex-1 py-1 bg-white border border-stone-300 rounded text-[10px] font-bold text-stone-600 hover:bg-stone-50 hover:text-purple-600 shadow-sm">
              + RANDOM
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onReset} className="flex-1 py-1 bg-white border border-stone-300 rounded text-[10px] font-bold text-stone-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm">
              RESET
            </button>
            <button onClick={() => handleExport(settings)} className="flex-1 py-1 bg-blue-50 border border-blue-200 rounded text-[10px] font-bold text-blue-600 hover:bg-blue-100 shadow-sm">
              {copyFeedback || 'EXPORT JSON'}
            </button>
          </div>
        </div>
      )
    },
    {
      title: 'Hand Positioning',
      settings: [
        { key: 'baseX', label: 'Hand X (%)', min: 0, max: 100, step: 1 },
        { key: 'baseY', label: 'Hand Y (px)', min: -200, max: 600, step: 5 }, // Increased range
        { key: 'cardScale', label: 'Card Scale', min: 0.1, max: 2.0, step: 0.01 }, // Increased max
      ]
    },
    {
      title: 'Fan Layout',
      settings: [
        { key: 'fanSpacing', label: 'Spacing', min: 0, max: 300, step: 1 }, // Increased range
        { key: 'fanRotation', label: 'Rotation', min: 0, max: 30, step: 0.1 }, // Increased range
        { key: 'fanArcHeight', label: 'Arc Height', min: 0, max: 60, step: 0.1 }, // Increased range
        { key: 'perspective', label: '3D Persp.', min: 400, max: 4000, step: 50 }, // Increased range
      ]
    },
    {
      title: 'Squeeze Rules',
      settings: [
        { key: 'maxCardsSqueeze', label: 'Start @ Card #', min: 1, max: 30, step: 1 }, // Increased range
        { key: 'squeezeSpacing', label: '-Space / Card', min: 0, max: 20, step: 0.1 }, // Increased range
        { key: 'squeezeRotation', label: '-Rot / Card', min: 0, max: 5, step: 0.1 }, // Increased range
      ]
    },
    {
      title: 'Return Anim',
      settings: [
        { key: 'returnDuration', label: 'Duration', min: 0.1, max: 2.0, step: 0.05 },
        { key: 'returnSpringiness', label: 'Bounciness', min: 1, max: 5.0, step: 0.1 },
      ]
    },
    {
      title: 'Drag & Tilt Physics',
      settings: [
        { key: 'dragScale', label: 'Drag Scale', min: 0.1, max: 2.0, step: 0.01 },
        { key: 'dragThresholdY', label: 'Drag Thresh Y', min: 0, max: 200, step: 5 },
        { key: 'tiltMaxAngle', label: 'Max Tilt (deg)', min: 0, max: 90, step: 1 },
        { key: 'tiltSensitivity', label: 'Tilt Sens.', min: 1, max: 10, step: 0.1 },
        { key: 'tiltSmoothing', label: 'Smoothing', min: 0, max: 1, step: 0.05 },
        { key: 'tiltReturnSpeed', label: 'Return Speed', min: 0.1, max: 2.0, step: 0.05 },
        { key: 'velocityDecay', label: 'Vel. Decay', min: 0.5, max: 0.99, step: 0.01 },
        { key: 'tiltVelocityThreshold', label: 'Tilt Thresh.', min: 0, max: 20, step: 0.5 },
      ]
    },
    {
      title: 'Hit Areas',
      settings: [
        { key: 'hitAreaWidth', label: 'Hit Width', min: 50, max: 300, step: 5 },
        { key: 'hitAreaHeight', label: 'Hit Height', min: 50, max: 400, step: 5 },
        { key: 'showHitAreas', label: 'Show Debug', type: 'checkbox' },
      ]
    },


    {
      title: 'Glow & Logic',
      settings: [
        { key: 'debugForcePlayable', label: 'Force Playable', type: 'checkbox' },

        { key: 'glowExpTop', label: 'Expand Top', min: -100, max: 100, step: 1 },
        { key: 'glowExpBottom', label: 'Expand Bottom', min: -100, max: 100, step: 1 },
        { key: 'glowExpLeft', label: 'Expand Left', min: -100, max: 100, step: 1 },
        { key: 'glowExpRight', label: 'Expand Right', min: -100, max: 100, step: 1 },
        { key: 'glowCornerRadius', label: 'Corner Radius', min: 0, max: 50, step: 1 },

        { key: 'glowOffsetX', label: 'Glow Offset X', min: -50, max: 50, step: 1 },
        { key: 'glowOffsetY', label: 'Glow Offset Y', min: -50, max: 50, step: 1 },
        { key: 'glowOpacity', label: 'Edge Opacity', min: 0, max: 1, step: 0.05 },
        { key: 'fillOpacity', label: 'Fill Opacity', min: 0, max: 1, step: 0.05 },
        { key: 'glowBlur', label: 'Edge Blur', min: 0, max: 50, step: 1 },
        { key: 'glowPulseSpeed', label: 'Pulse Speed (0=Off)', min: 0, max: 3.0, step: 0.1 },

        { key: 'glowColorPlayable', label: 'Playable Color', type: 'color' },
        { key: 'glowColorDragging', label: 'Drag Color', type: 'color' },
        { key: 'glowColorTargeting', label: 'Target Color', type: 'color' },
      ]
    },
    {
      title: 'Slam Anim',
      settings: [
        { key: 'slamDuration', label: 'Duration', min: 0.1, max: 4.0, step: 0.1 },
        { key: 'slamScalePeak', label: 'Scale Peak', min: 1.0, max: 6.0, step: 0.1 },
        { key: 'slamScaleLand', label: 'Scale Land', min: 0.1, max: 3.0, step: 0.1 },
        { key: 'slamHeight', label: 'Lift (Neg)', min: -600, max: 0, step: 10 },
      ]
    },
  ];

  const boardSections = [
    {
      title: 'Global Settings',
      customContent: (
        <div className="flex flex-col gap-2 p-2 bg-stone-100 rounded border border-stone-200 mb-2">
          <button onClick={() => handleExport(boardSettings)} className="w-full py-1 bg-blue-50 border border-blue-200 rounded text-[10px] font-bold text-blue-600 hover:bg-blue-100 shadow-sm">
            {copyFeedback || 'EXPORT BOARD JSON'}
          </button>
        </div>
      ),
      settings: []
    },
    {
      title: 'Slot Layout',
      settings: [
        { key: 'slotHeightPercent', label: 'Height (%. H)', min: 0.1, max: 0.5, step: 0.01 },
        { key: 'slotAspectRatio', label: 'Aspect Ratio', min: 0.5, max: 2.0, step: 0.01 },
        { key: 'playerRowY', label: 'Player Y (%)', min: 0, max: 1, step: 0.01 },
        { key: 'enemyRowY', label: 'Enemy Y (%)', min: 0, max: 1, step: 0.01 },
        { key: 'playerSlotGapPercent', label: 'P. Gap (%W)', min: 0, max: 0.1, step: 0.001 },
        { key: 'enemySlotGapPercent', label: 'E. Gap (%W)', min: 0, max: 0.1, step: 0.001 },
      ]
    },
    {
      title: 'Card Margins',
      settings: [
        { key: 'cardMarginTop', label: 'Top (%)', min: 0, max: 0.4, step: 0.01 },
        { key: 'cardMarginBottom', label: 'Bottom (%)', min: 0, max: 0.4, step: 0.01 },
        { key: 'cardMarginLeft', label: 'Left (%)', min: 0, max: 0.4, step: 0.01 },
        { key: 'cardMarginRight', label: 'Right (%)', min: 0, max: 0.4, step: 0.01 },
      ]
    },
    {
      title: 'Debug State (Slot Visuals)',
      settings: [],
      customContent: (
        <div className="flex flex-col gap-2 p-2 bg-stone-100 rounded border border-stone-200">
          {/* Global Buttons */}
          <div className="text-[10px] font-bold text-stone-600 mb-1">Set ALL Slots To:</div>
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => useGameStore.getState().resetSlotStatus()}
              className="flex-1 py-1 bg-white border border-stone-300 rounded text-[10px] hover:bg-stone-50"
            >
              Idle
            </button>
            <button
              onClick={() => {
                const allIds = Object.keys(useGameStore.getState().slots).map(Number);
                useGameStore.getState().setSlotStatus(allIds, 'showDrop');
              }}
              className="flex-1 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded text-[10px] hover:bg-blue-100"
            >
              Drop
            </button>
            <button
              onClick={() => {
                const allIds = Object.keys(useGameStore.getState().slots).map(Number);
                useGameStore.getState().setSlotStatus(allIds, 'showTarget');
              }}
              className="flex-1 py-1 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded text-[10px] hover:bg-yellow-100"
            >
              Target
            </button>
          </div>

          <div className="h-px bg-stone-200 my-1"></div>

          {/* Specific Slot Override */}
          <div className="text-[10px] font-bold text-stone-600 mb-1">Override Specific Slot:</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-500">Slot ID:</span>
            <input
              type="number"
              placeholder="#"
              className="w-10 text-xs border rounded px-1"
              id="debug-slot-id"
            />
            <button
              onClick={() => {
                const input = document.getElementById('debug-slot-id') as HTMLInputElement;
                const id = parseInt(input.value);
                if (!isNaN(id))
                {
                  useGameStore.getState().setSlotStatus([id], 'showTarget');
                }
              }}
              className="px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-[10px] hover:bg-yellow-200"
            >
              Target
            </button>
            <button
              onClick={() => {
                const input = document.getElementById('debug-slot-id') as HTMLInputElement;
                const id = parseInt(input.value);
                if (!isNaN(id))
                {
                  useGameStore.getState().setSlotStatus([id], 'showDrop');
                }
              }}
              className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded text-[10px] hover:bg-blue-200"
            >
              Drop
            </button>
          </div>

          <div className="h-px bg-stone-200 my-1"></div>

          <div className="text-[9px] text-stone-400 italic">
            Note: Dragging cards will override these manual states.
          </div>
        </div>
      )
    }
  ];

  if (isMinimized)
  {
    return (
      <div className={`absolute top-4 ${dockSide === 'left' ? 'left-4' : 'right-4'} z-50`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-white border border-stone-300 text-stone-600 px-4 py-2 rounded-lg shadow-lg hover:bg-stone-50 font-bold text-xs flex items-center gap-2"
        >
          <span>⚙️</span> Tuner
        </button>
      </div>
    );
  }

  const activeSections = activeTab === 'hand' ? handSections : boardSections;

  return (
    <div className={`absolute top-4 ${dockSide === 'left' ? 'left-4' : 'right-4'} z-50 w-80 bg-stone-50/95 border border-stone-200 rounded-xl shadow-2xl text-stone-800 max-h-[90vh] flex flex-col backdrop-blur-md`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-stone-200 bg-white/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          <h2 className="font-bold text-sm text-stone-700">Skirmish Tuner</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDockSide(prev => prev === 'left' ? 'right' : 'left')}
            className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-600"
            title="Switch Side"
          >
            ↔
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-600"
          >
            ─
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3 border-b border-stone-200 bg-stone-100/50">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as 'hand' | 'board')}
          className="w-full p-2 bg-white border border-stone-300 rounded-lg text-sm font-bold text-stone-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        >
          <option value="hand">🃏 Hand Settings</option>
          <option value="board">🪵 Board Settings</option>
        </select>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-3 space-y-3 custom-scrollbar">
        {activeSections.map((section: any) => (
          <div key={section.title} className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-50 text-[10px] font-extrabold uppercase tracking-widest text-stone-400 text-left transition-colors"
            >
              {section.title}
              <span className="text-stone-300">{expandedSections[section.title] ? '−' : '+'}</span>
            </button>

            {(expandedSections[section.title] ?? true) && (
              <div className="p-3 pt-0 space-y-4 border-t border-stone-100">
                <div className="h-2"></div>
                {section.customContent}
                {section.settings.map((setting: any) => {
                  const currentSettings = activeTab === 'hand' ? settings : boardSettings;
                  const currentValue = (currentSettings as any)[setting.key];

                  if (setting.type === 'color')
                  {
                    return (
                      <InputColor
                        key={setting.key}
                        label={setting.label}
                        value={currentValue as string}
                        onChange={(val) => {
                          if (activeTab === 'hand') onUpdate(setting.key as any, val as any);
                        }}
                      />
                    );
                  }

                  return (
                    <InputRange
                      key={setting.key}
                      label={setting.label}
                      value={typeof currentValue === 'number' ? currentValue : (currentValue ? 1 : 0)}
                      min={setting.min}
                      max={setting.max}
                      step={setting.step}
                      type={setting.type}
                      onChange={(val) => {
                        if (activeTab === 'hand')
                        {
                          onUpdate(setting.key as any, val);
                        } else
                        {
                          updateBoard({ [setting.key]: val });
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div className="mt-6 pt-4 border-t border-stone-200">
          <button
            onClick={() => {
              const json = JSON.stringify(settings, null, 2);
              navigator.clipboard.writeText(json);
              alert('Hand Settings copied to clipboard!');
            }}
            className="w-full py-2 bg-stone-800 text-white rounded hover:bg-stone-700 transition-colors font-bold"
          >
            Export JSON to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};

export const DebugScene: React.FC<DebugSceneProps> = ({ onBack }) => {
  const [cards, setCards] = useState<CardInstance[]>(INITIAL_CARDS);
  const [settings, setSettings] = useState<HandSettings>(DEFAULT_SETTINGS);

  const handleDrawRandomProp = () => {
    // Pick a random card from initial set but give it a new ID
    const randomCard = { ...INITIAL_CARDS[Math.floor(Math.random() * INITIAL_CARDS.length)] };
    randomCard.id = crypto.randomUUID();
    setCards(prev => [...prev, randomCard]);
  };

  const handleRemoveCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const handleChange = (key: keyof HandSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-stone-950 overflow-hidden relative flex flex-col items-center justify-end pb-12">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 120%, #1e1b4b 0%, #0f0f23 40%, #000000 100%)
          `
        }}
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Styles for particles/animations */}
      <style>{`
          @keyframes binGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.3), inset 0 0 30px rgba(220, 38, 38, 0.1); }
            50% { box-shadow: 0 0 40px rgba(220, 38, 38, 0.6), inset 0 0 50px rgba(220, 38, 38, 0.2); }
          }
           /* Helper for indicating hover from JS logic */
          #destroy-zone[data-hovered="true"] {
            background: linear-gradient(180deg, rgba(220, 38, 38, 0.4) 0%, rgba(127, 29, 29, 0.5) 100%) !important;
            border-color: #dc2626 !important;
            animation: binGlow 1s ease-in-out infinite;
          }
          #destroy-zone[data-hovered="true"] span {
            color: #fca5a5 !important;
          }
          #destroy-zone[data-hovered="true"] .emoji {
             transform: scale(1.2);
             filter: drop-shadow(0 0 10px rgba(255, 100, 100, 0.8));
          }
          
          /* Custom scrollbar for settings */
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.05);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.1);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.2);
          }
      `}</style>

      <PhaserLayer />

      {/* Top Left Controls */}
      <div className="absolute top-4 left-4 z-50 flex gap-4">
        <button
          onClick={onBack}
          className="bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white px-3 py-2 rounded-lg backdrop-blur-sm border border-stone-800 transition-all font-bold text-xs uppercase tracking-wide flex items-center gap-2"
        >
          <span>←</span> Back to Menu
        </button>
      </div>

      {/* Hand Container */}
      <Hand
        cards={cards}
        setCards={setCards}
        onRemoveCard={handleRemoveCard}
        settings={settings}
        templates={orderData.templates as any}
        schema={orderData.schema as any}
      />

      {/* Persistent Right Settings Panel */}
      <SettingsPanel
        settings={settings}
        onUpdate={handleChange}
        onReset={() => setSettings(DEFAULT_SETTINGS)}
        onAddCard={handleDrawRandomProp}
        onDrawRandom={handleDrawRandomProp}
      />

      {/* Table edge */}

    </div>
  );
};
