import React, { useState } from 'react';
import { Hand } from './components/Hand';
import { HandSettings } from './components/Card';
import orderData from './Data/order.json';
import type { CardInstance } from '@skirmish/card-maker';
import { PhaserLayer } from '../phaser/PhaserLayer';

const INITIAL_CARDS = orderData.cards as unknown as CardInstance[];

interface DebugSceneProps {
  onBack: () => void;
}

const DEFAULT_SETTINGS: HandSettings = {
  // Fan layout
  fanSpacing: 105,
  fanRotation: 3.5,
  fanArcHeight: 3,

  // Manual Squeeze Controls
  maxCardsSqueeze: 8,
  squeezeSpacing: 10,
  squeezeRotation: 0.1,
  squeezeArcHeight: 0.3,

  // Hover effects
  hoverLift: 125,
  hoverScale: 1.3,
  hoverTransitionDuration: 0.15,

  // Drag settings
  dragThresholdY: 50,
  dragScale: 1,

  // Drag tilt physics
  tiltMaxAngle: 40,
  tiltSensitivity: 3,
  tiltSmoothing: 0.5,
  tiltReturnSpeed: 0.25,
  velocityDecay: 0.85,

  // Return animation
  returnDuration: 0.15,
  returnSpringiness: 1.56,

  // Slam Animation
  slamDuration: 0.6,
  slamScalePeak: 1.5,
  slamScaleLand: 0.8,
  slamHeight: -100, // Negative goes UP in this context if adding to Y, or subtract if absolute. Hand coords Y is up? Mouse Y is down. Usually Y increase = down. So negative is up.

  // Size & Scale
  cardScale: 0.25, // Default ~187px width

  hitAreaWidth: 125,
  hitAreaHeight: 210,
  showHitAreas: false,

  // Visual
  perspective: 2000,

  // Positioning
  baseX: 50,
  baseY: -100,
};

const SettingsPanel = ({ settings, onUpdate, onReset, onAddCard, onDrawRandom }: {
  settings: HandSettings;
  onUpdate: (key: keyof HandSettings, value: number) => void;
  onReset: () => void;
  onAddCard: () => void;
  onDrawRandom: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'tuning' | 'actions'>('tuning');
  const [isMinimized, setIsMinimized] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Positioning': true,
    'Fan Layout': true,
    'Hover Effects': false,
    'Drag Physics': false,
    'Slam Anim': true,
  });
  const [copyFeedback, setCopyFeedback] = useState('');

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleExport = () => {
    navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    setCopyFeedback('Config copied!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const tabs = [
    { id: 'tuning', label: 'Tuning' },
    { id: 'actions', label: 'Actions' },
  ];

  const sections = [
    {
      title: 'Positioning',
      settings: [
        { key: 'baseX', label: 'Hand X (%)', min: 0, max: 100, step: 1 },
        { key: 'baseY', label: 'Hand Y (px)', min: -100, max: 200, step: 5 },
        { key: 'cardScale', label: 'Card Scale', min: 0.1, max: 1.0, step: 0.01 },
        { key: 'hitAreaWidth', label: 'Hit Area W', min: 40, max: 150, step: 5 },
        { key: 'hitAreaHeight', label: 'Hit Area H', min: 100, max: 600, step: 10 },
      ]
    },
    {
      title: 'Debug',
      settings: [
        { key: 'showHitAreas', label: 'Show Hit Areas', type: 'checkbox' },
      ]
    },

    {
      title: 'Fan Layout',
      settings: [
        { key: 'fanSpacing', label: 'Spacing', min: 20, max: 150, step: 5 },
        // { key: 'maxFanWidth', label: 'Max Width', min: 300, max: 1200, step: 50 },
        { key: 'fanRotation', label: 'Rotation', min: 0, max: 15, step: 0.1 },
        { key: 'fanArcHeight', label: 'Arc Height', min: 0, max: 30, step: 0.1 },
        { key: 'perspective', label: '3D Perspective', min: 400, max: 2000, step: 50 },
      ]
    },
    {
      title: 'Squeeze Rules',
      settings: [
        { key: 'maxCardsSqueeze', label: 'Start @ Card #', min: 3, max: 15, step: 1 },
        { key: 'squeezeSpacing', label: '-Space / Card', min: 0, max: 10, step: 0.5 },
        { key: 'squeezeRotation', label: '-Rot / Card', min: 0, max: 2, step: 0.1 },
        { key: 'squeezeArcHeight', label: '-Arc / Card', min: 0, max: 1, step: 0.05 },
      ]
    },
    {
      title: 'Hover Effects',
      settings: [
        { key: 'hoverLift', label: 'Lift Dist', min: 50, max: 200, step: 10 },
        { key: 'hoverScale', label: 'Scale', min: 1, max: 3.0, step: 0.05 },
        { key: 'hoverTransitionDuration', label: 'Duration', min: 0.1, max: 0.8, step: 0.05 },
      ]
    },
    {
      title: 'Drag Physics',
      settings: [
        { key: 'tiltSensitivity', label: 'Tilt Sens.', min: 1, max: 8, step: 0.5 },
        { key: 'tiltMaxAngle', label: 'Max Tilt', min: 10, max: 60, step: 5 },
        { key: 'tiltSmoothing', label: 'Smoothing', min: 0.1, max: 0.9, step: 0.05 },
        { key: 'tiltReturnSpeed', label: 'Return Spd', min: 0.1, max: 1.0, step: 0.05 },
        { key: 'dragScale', label: 'Drag Scale', min: 1, max: 1.3, step: 0.05 },
      ]
    },
    {
      title: 'Return Anim',
      settings: [
        { key: 'returnDuration', label: 'Duration', min: 0.15, max: 1.0, step: 0.05 },
        { key: 'returnSpringiness', label: 'Bounciness', min: 1, max: 2.5, step: 0.1 },
      ]
    },
    {
      title: 'Slam Anim',
      settings: [
        { key: 'slamDuration', label: 'Duration', min: 0.1, max: 2.0, step: 0.1 },
        { key: 'slamScalePeak', label: 'Scale Peak', min: 1.0, max: 3.0, step: 0.1 },
        { key: 'slamScaleLand', label: 'Scale Land', min: 0.1, max: 1.5, step: 0.1 },
        { key: 'slamHeight', label: 'Diff Y (Up)', min: -300, max: 0, step: 10 },
      ]
    },
  ];

  if (isMinimized)
  {
    return (
      <div className="absolute top-4 right-4 z-[100] flex flex-col items-end gap-2">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-stone-900/90 hover:bg-stone-800 text-amber-500 border border-stone-700 px-4 py-2 rounded-lg backdrop-blur shadow-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105"
        >
          <span>⚙️</span> Tuner
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 bottom-4 w-80 bg-stone-900/95 backdrop-blur-md border border-stone-700 rounded-xl shadow-2xl flex flex-col overflow-hidden z-[100] transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-stone-700 bg-stone-800/50">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-amber-500 font-cinzel tracking-wider uppercase">Hand Tuner v1.0</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="text-[10px] bg-stone-700 hover:bg-stone-600 text-stone-300 px-2 py-1 rounded transition-colors"
            title="Copy Configuration JSON"
          >
            {copyFeedback || 'JSON'}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-stone-700 text-stone-400 font-bold transition-colors"
            title="Minimize Panel"
          >
            —
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-700 bg-stone-800/30">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 text-xs font-bold transition-colors relative uppercase tracking-wide ${activeTab === tab.id
              ? 'text-white bg-white/5'
              : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {activeTab === 'tuning' && (
          <div className="space-y-1">
            {sections.map(section => (
              <div key={section.title} className="border border-stone-800 rounded bg-stone-800/30 overflow-hidden mb-2">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex justify-between items-center p-2 bg-stone-800/80 hover:bg-stone-800 transition-colors text-left"
                >
                  <span className="text-xs font-bold text-stone-400 uppercase">{section.title}</span>
                  <span className="text-stone-500 text-xs transform transition-transform duration-200" style={{ transform: expandedSections[section.title] ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>

                {expandedSections[section.title] && (
                  <div className="p-3 space-y-3 bg-stone-900/50">
                    {section.settings.map((setting: any) => (
                      <div key={setting.key} className="space-y-1">
                        <div className="flex justify-between items-end">
                          <label className="text-[10px] text-stone-400 font-medium uppercase">{setting.label}</label>
                          {setting.type !== 'checkbox' && (
                            <span className="font-mono text-[10px] text-amber-500/80">
                              {settings[setting.key as keyof HandSettings]}
                            </span>
                          )}
                        </div>
                        {setting.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={!!settings[setting.key as keyof HandSettings]}
                            onChange={(e) => onUpdate(setting.key as keyof HandSettings, e.target.checked ? 1 : 0)}
                            className="w-4 h-4 rounded border-stone-600 bg-stone-700 text-amber-600 focus:ring-amber-500/50"
                          />
                        ) : (
                          <input
                            type="range"
                            min={setting.min}
                            max={setting.max}
                            step={setting.step}
                            value={settings[setting.key as keyof HandSettings] as number}
                            onChange={(e) => onUpdate(setting.key as keyof HandSettings, parseFloat(e.target.value))}
                            className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-600 hover:accent-amber-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={onReset}
              className="w-full mt-4 py-2 rounded border border-stone-700 text-stone-500 text-xs hover:text-white hover:border-stone-500 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3">
            <div className="p-3 border border-stone-800 rounded bg-stone-800/30">
              <h3 className="text-xs font-bold text-stone-400 uppercase mb-3">Deck Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={onDrawRandom}
                  className="w-full bg-green-900/40 hover:bg-green-800/60 border border-green-800/50 text-green-100 font-bold py-2 px-3 rounded transition-colors text-xs flex items-center justify-center gap-2"
                >
                  <span>🎴</span> Draw Random Card
                </button>
                <button
                  onClick={onAddCard}
                  className="w-full bg-stone-700/40 hover:bg-stone-600/60 border border-stone-600/50 text-stone-200 font-bold py-2 px-3 rounded transition-colors text-xs"
                >
                  + Add Specific Card (WIP)
                </button>
              </div>
            </div>

            <div className="p-3 border border-stone-800 rounded bg-stone-800/30">
              <h3 className="text-xs font-bold text-stone-400 uppercase mb-3">Debug Info</h3>
              <div className="text-[10px] font-mono text-stone-500 space-y-1">
                <p>Resolution: {window.innerWidth}x{window.innerHeight}</p>
                <p>Renderer: React DOM</p>
              </div>
            </div>
          </div>
        )}
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
            background: rgba(0,0,0,0.2);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.2);
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
      <div style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '40px',
        background: 'linear-gradient(180deg, #1c1917 0%, #0c0a09 100%)',
        borderTop: '1px solid #292524',
        boxShadow: '0 -20px 50px rgba(0,0,0,0.8)',
        zIndex: 10
      }} />
    </div>
  );
};

