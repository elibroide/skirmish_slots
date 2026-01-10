import React, { useState, useEffect } from 'react';
import { Hand } from './components/Hand';
import { HandSettings, DEFAULT_SETTINGS } from './components/Card';
import { useGameStore, TurnStatus } from '../store/gameStore';
import { TerrainId, PlayerId } from '@skirmish/engine';
import orderData from './Data/order.json';
import type { CardInstance } from '@skirmish/card-maker';
import { PhaserLayer } from '../phaser/PhaserLayer';
import { Board } from './components/Board';
import { AnimationLayer } from './AnimationLayer';
import { useAnimationStore } from '../store/animationStore';
import { PassButton } from './components/PassButton';
import { CardTooltip } from './components/CardTooltip';
import { BoardCardTooltip } from './components/BoardCardTooltip';

// Filter to only use "Normal" template cards
import { visualAssetManager } from '../utils/VisualAssetManager';

// Use VisualAssetManager to get all cards from the new system
// Use VisualAssetManager to get specific engine cards for the debug view
const DEBUG_CARD_NAMES = [
  'Unstable Core',
  'Peace Enforcer',
  'Scrap Collector',
  'Loyalty Weaver',
  'Squad Leader',
  'Shock Bandit',
  'Acolyte of Spring',
  'Seed Spreader',
  'Matrix Attendent'
];

const INITIAL_CARDS = visualAssetManager.getAllVisuals()
  .filter(v => DEBUG_CARD_NAMES.includes(v.data.name))
  .map(v => ({
    id: v.cardId,
    templateId: v.templateId,
    data: v.data,
    artConfig: v.artConfig,
    frameVariantId: v.frameVariantId
  } as CardInstance));

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
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value when prop value changes (e.g. Reset button)
  // We need a ref to avoid circular fighting if the parent updates slowly, 
  // but since we are debouncing ONLY the parent update, we should trust the parent's value
  // if it differs significantly or if we aren't currently editing? 
  // Actually, simplest is just to sync.
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced output
  useEffect(() => {
    // If local matches prop, do nothing (initial render or sync)
    if (localValue === value) return;

    const timer = setTimeout(() => {
      onChange(localValue);
    }, 100); // 100ms debounce

    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  const handleChange = (newVal: number) => {
    setLocalValue(newVal);
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{label}</label>
        {type !== 'checkbox' && (
          <input
            type="number"
            value={localValue}
            step={step}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            className="w-16 text-right font-mono text-[10px] text-stone-700 bg-white border border-stone-200 rounded px-1 focus:outline-none focus:border-blue-400"
          />
        )}
      </div>
      {type === 'checkbox' ? (
        <input
          type="checkbox"
          checked={!!localValue}
          onChange={(e) => handleChange(e.target.checked ? 1 : 0)}
          className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
        />
      ) : (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
        />
      )}
    </div>
  );
};

const SettingsPanel = ({ settings, onUpdate, onReset, onAddCard, onDrawRandom, onAddOpponentCard }: {
  settings: HandSettings;
  onUpdate: (key: keyof HandSettings, value: number) => void;
  onReset: () => void;
  onAddCard: () => void;
  onDrawRandom: () => void;
  onAddOpponentCard: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'hand' | 'board' | 'anim'>('hand');
  const [isMinimized, setIsMinimized] = useState(true);
  const [dockSide, setDockSide] = useState<'left' | 'right'>('right');

  // Board Settings from Store
  const boardSettings = useGameStore(state => state.boardSettings);
  const updateBoard = useGameStore(state => state.updateBoardSettings);
  const dragState = useGameStore(state => state.dragState);
  const setDragState = useGameStore(state => state.setDragState);
  const setHoveredSlot = useGameStore(state => state.setHoveredSlot);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeAnimCategory, setActiveAnimCategory] = useState<string>('playerPlay');
  const [copyFeedback, setCopyFeedback] = useState('');

  const updateAnimSetting = (type: string, prop: string, val: any) => {
    const currentAnimSettings = boardSettings.animationSettings;
    const newAnimConfig = {
      ...(currentAnimSettings as any)[type],
      [prop]: val
    };
    updateBoard({
      animationSettings: {
        ...currentAnimSettings,
        [type]: newAnimConfig
      }
    });
    updateBoard({
      animationSettings: {
        ...currentAnimSettings,
        [type]: newAnimConfig
      }
    });
  };

  const updatePassButtonSetting = (keyPath: string, val: any) => {

    // keyPath examples: 'passButtonSettings.x', 'passButtonSettings.colors.pass'
    const parts = keyPath.split('.');
    // parts[0] is 'passButtonSettings'
    // parts[1] might be 'x' or 'colors' or 'glow'
    // parts[2] might be 'pass' etc.

    const cur = boardSettings.passButtonSettings;

    // We only support 1 or 2 levels deep for now based on the schema
    // Level 1: passButtonSettings.x
    // Level 2: passButtonSettings.colors.pass

    let newSettings: any;

    if (parts.length === 2)
    {
      // e.g. passButtonSettings.x
      newSettings = {
        ...cur,
        [parts[1]]: val
      };
    } else if (parts.length === 3)
    {
      // e.g. passButtonSettings.colors.pass
      const groupKey = parts[1] as 'colors' | 'glow';
      newSettings = {
        ...cur,
        [groupKey]: {
          ...cur[groupKey],
          [parts[2]]: val
        }
      };
    } else
    {
      console.warn('Unsupported key depth for pass button settings', keyPath);
      return;
    }

    updateBoard({ passButtonSettings: newSettings });
  };

  const updateTooltipSetting = (keyPath: string, val: any) => {
    // keyPath: handTooltipSettings.offsetX
    const parts = keyPath.split('.');
    const prop = parts[1];
    const cur = boardSettings.handTooltipSettings;

    updateBoard({
      handTooltipSettings: {
        ...cur,
        [prop]: val
      }
    });
  };

  const updateWinRecordSetting = (keyPath: string, val: any) => {
    // keyPath: winRecordSettings.offsetX
    const parts = keyPath.split('.');
    const prop = parts[1];
    const cur = boardSettings.winRecordSettings;

    updateBoard({
      winRecordSettings: {
        ...cur,
        [prop]: val
      }
    });
  };

  const updateTurnIndicatorSetting = (keyPath: string, val: any) => {
    // keyPath: turnIndicatorSettings.playerXPercent
    const parts = keyPath.split('.');
    const prop = parts[1];
    const cur = boardSettings.turnIndicatorSettings;

    updateBoard({
      turnIndicatorSettings: {
        ...cur,
        [prop]: val
      }
    });
  };

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
          <div className="flex gap-2">
            <button onClick={onAddOpponentCard} className="flex-1 py-1 bg-red-50 border border-red-200 rounded text-[10px] font-bold text-red-600 hover:bg-red-100 shadow-sm">
              + FOE CARD
            </button>
          </div>
        </div>
      )
    },
    {
      title: 'Hand Positioning',
      settings: [
        { key: 'baseX', label: 'Hand X (%)', min: 0, max: 100, step: 1 },
        { key: 'baseY', label: 'Hand Y (px)', min: -200, max: 600, step: 5 },
        { key: 'facedownBaseX', label: 'Foe X (px)', min: -600, max: 600, step: 5 },
        { key: 'facedownBaseY', label: 'Foe Y (px)', min: -300, max: 500, step: 5 },
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
    {
      title: 'Pass Button',
      settings: [
        // Position
        { key: 'passButtonSettings.x', label: 'Pos X (%)', min: 0, max: 100, step: 1 },
        { key: 'passButtonSettings.y', label: 'Pos Y (%)', min: 0, max: 100, step: 1 },
        { key: 'passButtonSettings.scale', label: 'Scale', min: 0.5, max: 3.0, step: 0.1 },

        // Colors
        { key: 'passButtonSettings.colors.pass', label: 'Pass Color', type: 'color' },
        { key: 'passButtonSettings.colors.passClicked', label: 'Pass Clicked', type: 'color' },
        { key: 'passButtonSettings.colors.done', label: 'Done Color', type: 'color' },
        { key: 'passButtonSettings.colors.doneClicked', label: 'Done Clicked', type: 'color' },
        { key: 'passButtonSettings.colors.cancel', label: 'Cancel Color', type: 'color' },
        { key: 'passButtonSettings.colors.cancelClicked', label: 'Cancel Clicked', type: 'color' },
        { key: 'passButtonSettings.colors.conclude', label: 'Conclude Color', type: 'color' },
        { key: 'passButtonSettings.colors.concludeClicked', label: 'Conclude Clicked', type: 'color' },
        { key: 'passButtonSettings.colors.text', label: 'Text Color', type: 'color' },

        // Glow
        { key: 'passButtonSettings.glow.radius', label: 'Glow Radius', min: 0, max: 50, step: 1 },
        { key: 'passButtonSettings.glow.intensity', label: 'Glow Intensity', min: 0, max: 1, step: 0.1 },
        { key: 'passButtonSettings.glow.color', label: 'Glow Color', type: 'color' },
        { key: 'passButtonSettings.glow.speed', label: 'Glow Speed', min: 0, max: 5, step: 0.1 },
      ],
      customContent: (
        <div className="flex flex-col gap-2 p-2 bg-stone-100 rounded border border-stone-200 mt-2">
          <div className="text-[10px] font-bold text-stone-600 mb-1">Debug Controls</div>
          <div className="grid grid-cols-3 gap-1">
            <button className="px-2 py-1 bg-white border rounded text-[10px]" onClick={() => (window as any).setPassMode('pass')}>Set Pass</button>
            <button className="px-2 py-1 bg-white border rounded text-[10px]" onClick={() => (window as any).setPassMode('done')}>Set Done</button>
            <button className="px-2 py-1 bg-white border rounded text-[10px]" onClick={() => (window as any).setPassMode('cancel')}>Set Cancel</button>
            <button className="px-2 py-1 bg-white border rounded text-[10px]" onClick={() => (window as any).setPassMode('conclude')}>Set Conclude</button>
            <button className="px-2 py-1 bg-white border rounded text-[10px]" onClick={() => (window as any).setPassMode('none')}>Set None</button>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <button className="px-2 py-1 bg-white border rounded text-[10px]" onClick={() => (window as any).setPassStatus('normal')}>Normal</button>
            <button className="px-2 py-1 bg-white border rounded text-[10px]" onClick={() => (window as any).setPassStatus('disabled')}>Disabled</button>
            <button className="px-2 py-1 bg-white border rounded text-[10px]" onClick={() => (window as any).setPassStatus('clicked')}>Clicked</button>
          </div>
        </div >
      )
    },
    {
      title: 'Hand Tooltips',
      settings: [
        { key: 'handTooltipSettings.show', label: 'Show Tooltip', type: 'checkbox' },
        { key: 'handTooltipSettings.offsetX', label: 'Offset X (px)', min: -500, max: 500, step: 5 },
        { key: 'handTooltipSettings.offsetY', label: 'Offset Y (px)', min: -500, max: 500, step: 5 },
        { key: 'handTooltipSettings.width', label: 'Width (px)', min: 100, max: 600, step: 10 },
        { key: 'handTooltipSettings.backgroundColor', label: 'Bg Color', type: 'color' },
        { key: 'handTooltipSettings.borderColor', label: 'Border Color', type: 'color' },
        { key: 'handTooltipSettings.borderWidth', label: 'Border Width', min: 0, max: 10, step: 1 },
      ]
    },
  ];

  const animationSections = [
    {
      title: 'Player Animation',
      settings: [
        { key: 'playerPlay.moveDuration', label: 'Move Dur (s)', min: 0, max: 2, step: 0.1 },
        { key: 'playerPlay.hoverDuration', label: 'Hover Dur (s)', min: 0, max: 2, step: 0.1 },
        { key: 'playerPlay.hoverScale', label: 'Hover Scale', min: 0.5, max: 2, step: 0.1 },
        { key: 'playerPlay.hoverOffsetX', label: 'Hover Off X', min: -300, max: 300, step: 10 },
        { key: 'playerPlay.hoverOffsetY', label: 'Hover Off Y', min: -300, max: 300, step: 10 },
        { key: 'playerPlay.waitDuration', label: 'Wait Dur (s)', min: 0, max: 2, step: 0.1 },
        { key: 'playerPlay.slamDuration', label: 'Slam Dur (s)', min: 0, max: 2, step: 0.1 },
        { key: 'playerPlay.slamScalePeak', label: 'Peak Scale', min: 1, max: 3, step: 0.1 },
        { key: 'playerPlay.slamScaleLand', label: 'Land Scale', min: 0.1, max: 2, step: 0.1 },
        // triggerNextOn handled manually below in render loop
      ]
    },
    {
      title: 'Opponent Animation',
      settings: [
        { key: 'opponentPlay.moveDuration', label: 'Move Dur (s)', min: 0, max: 2, step: 0.1 },
        { key: 'opponentPlay.hoverDuration', label: 'Hover Dur (s)', min: 0, max: 2, step: 0.1 },
        { key: 'opponentPlay.hoverScale', label: 'Hover Scale', min: 0.5, max: 2, step: 0.1 },
        { key: 'opponentPlay.hoverOffsetX', label: 'Hanging X', min: -300, max: 300, step: 10 },
        { key: 'opponentPlay.hoverOffsetY', label: 'Hanging Y', min: -300, max: 300, step: 10 },
        { key: 'opponentPlay.waitDuration', label: 'Wait Dur (s)', min: 0, max: 2, step: 0.1 },
        { key: 'opponentPlay.slamDuration', label: 'Slam Dur (s)', min: 0, max: 2, step: 0.1 },
        { key: 'opponentPlay.slamScalePeak', label: 'Peak Scale', min: 1, max: 3, step: 0.1 },
        { key: 'opponentPlay.slamScaleLand', label: 'Land Scale', min: 0.1, max: 2, step: 0.1 },
      ]
    }
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
      title: 'Board Tooltips',
      settings: [
        { key: 'boardTooltipScale', label: 'Preview Scale', min: 0.5, max: 2.0, step: 0.1 },
        { key: 'boardTooltipGap', label: 'Gap X (px)', min: -100, max: 100, step: 5 },
        { key: 'boardTooltipOffsetY', label: 'Align Offset Y', min: -200, max: 200, step: 5 },
      ]
    },
    {
      title: 'Board Transform',
      settings: [
        { key: 'boardScale', label: 'Scale', min: 0.1, max: 2.0, step: 0.05 },
        { key: 'boardX', label: 'X Offset (px)', min: -400, max: 100, step: 10 },
        { key: 'boardY', label: 'Y Offset (px)', min: -400, max: 300, step: 10 },
      ]
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
      title: 'Power Circle Visuals',
      settings: [
        { key: 'powerCircleOffsetX', label: 'Offset X (px)', min: -100, max: 100, step: 1 },
        { key: 'powerCircleOffsetY', label: 'Offset Y (px)', min: -100, max: 100, step: 1 },
        { key: 'powerCircleRadius', label: 'Radius (px)', min: 5, max: 50, step: 1 },
        { key: 'powerCircleFontSize', label: 'Font Size', min: 8, max: 40, step: 1 },
        { key: 'powerCircleStrokeWidth', label: 'Stroke Width', min: 0, max: 10, step: 0.5 },
        { key: 'powerCircleFlipPositions', label: 'Flip Positions', type: 'checkbox' },
        { key: 'powerCirclePlayerColor', label: 'Player Color', type: 'color' },
        { key: 'powerCircleEnemyColor', label: 'Enemy Color', type: 'color' },
        { key: 'powerCircleStrokeColor', label: 'Stroke Color', type: 'color' },
        { key: 'powerCircleWinningStrokeColor', label: 'Win Stroke', type: 'color' },
        { key: 'powerCircleWinningGlowColor', label: 'Win Glow', type: 'color' },
        { key: 'powerCircleScaleContested', label: 'Scale (Contested)', min: 0.5, max: 2, step: 0.1 },
        { key: 'powerCircleScaleWinning', label: 'Scale (Winning)', min: 0.5, max: 2, step: 0.1 },
        { key: 'powerCircleWinGlowScaleMin', label: 'Glow Min', min: 1, max: 3, step: 0.1 },
        { key: 'powerCircleWinGlowScaleMax', label: 'Glow Max', min: 1, max: 3, step: 0.1 },
        { key: 'powerCircleWinGlowSpeed', label: 'Glow Speed (s)', min: 0.1, max: 5, step: 0.1 },
        { key: 'powerCircleTextStrokeWidth', label: 'Text Stroke Width', min: 0, max: 5, step: 0.1 },
        { key: 'powerCircleTextStrokeColor', label: 'Text Stroke Color', type: 'color' },
      ]
    },
    {
      title: 'Card Margins',
      settings: [
        { key: 'cardMarginTop', label: 'Top (%)', min: 0, max: 0.4, step: 0.01 },
        { key: 'cardMarginBottom', label: 'Bottom (%)', min: 0, max: 0.4, step: 0.01 },
      ]
    },

    {
      title: 'Win Record Visuals',
      settings: [
        { key: 'winRecordSettings.show', label: 'Show', type: 'checkbox' },

        // --- PLAYER ---
        { key: 'winRecordSettings.playerXPercent', label: 'Player X (%)', min: 0, max: 100, step: 0.5 },
        { key: 'winRecordSettings.playerYPercent', label: 'Player Y (%)', min: 0, max: 100, step: 0.5 },
        { key: 'winRecordSettings.playerOffsetX', label: 'Player Off X', min: -200, max: 200, step: 5 },
        { key: 'winRecordSettings.playerOffsetY', label: 'Player Off Y', min: -200, max: 200, step: 5 },
        { key: 'winRecordSettings.playerTextColor', label: 'Player Text', type: 'color' },
        { key: 'winRecordSettings.playerTextOffsetX', label: 'P. Text Off X', min: -100, max: 100, step: 2 },
        { key: 'winRecordSettings.playerTextOffsetY', label: 'P. Text Off Y', min: -50, max: 50, step: 2 },
        { key: 'winRecordSettings.playerRhombusOffsetX', label: 'P. Rhombus Off X', min: -100, max: 100, step: 2 },
        { key: 'winRecordSettings.playerRhombusOffsetY', label: 'P. Rhombus Off Y', min: -50, max: 50, step: 2 },

        // --- OPPONENT ---
        { key: 'winRecordSettings.opponentXPercent', label: 'Enemy X (%)', min: 0, max: 100, step: 0.5 },
        { key: 'winRecordSettings.opponentYPercent', label: 'Enemy Y (%)', min: 0, max: 100, step: 0.5 },
        { key: 'winRecordSettings.opponentOffsetX', label: 'Enemy Off X', min: -200, max: 200, step: 5 },
        { key: 'winRecordSettings.opponentOffsetY', label: 'Enemy Off Y', min: -200, max: 200, step: 5 },
        { key: 'winRecordSettings.opponentTextColor', label: 'Enemy Text', type: 'color' },
        { key: 'winRecordSettings.opponentTextOffsetX', label: 'E. Text Off X', min: -100, max: 100, step: 2 },
        { key: 'winRecordSettings.opponentTextOffsetY', label: 'E. Text Off Y', min: -50, max: 50, step: 2 },
        { key: 'winRecordSettings.opponentRhombusOffsetX', label: 'E. Rhombus Off X', min: -100, max: 100, step: 2 },
        { key: 'winRecordSettings.opponentRhombusOffsetY', label: 'E. Rhombus Off Y', min: -50, max: 50, step: 2 },

        // --- SHARED ---
        { key: 'winRecordSettings.scale', label: 'Global Scale', min: 0.1, max: 2.0, step: 0.1 },
        { key: 'winRecordSettings.spacingX', label: 'Spacing X', min: 0, max: 100, step: 1 },
        { key: 'winRecordSettings.fontSize', label: 'Font Size', min: 8, max: 40, step: 1 },
        { key: 'winRecordSettings.rhombusScale', label: 'Rhombus Scale', min: 0.1, max: 3.0, step: 0.1 },
        { key: 'winRecordSettings.emptyColor', label: 'Empty Color', type: 'color' },
        { key: 'winRecordSettings.fillColor', label: 'Fill Color', type: 'color' },
        { key: 'winRecordSettings.strokeColor', label: 'Stroke Color', type: 'color' },
        { key: 'winRecordSettings.strokeWidth', label: 'Stroke Width', min: 0, max: 10, step: 0.5 },
      ]
    },
    {
      title: 'Turn Indicators',
      settings: [
        { key: 'turnIndicatorSettings.show', label: 'Show', type: 'checkbox' },

        // Player
        { key: 'turnIndicatorSettings.playerXPercent', label: 'Player X (%)', min: 0, max: 100, step: 0.5 },
        { key: 'turnIndicatorSettings.playerYPercent', label: 'Player Y (%)', min: 0, max: 100, step: 0.5 },
        { key: 'turnIndicatorSettings.playerOffsetX', label: 'Player Off X', min: -200, max: 200, step: 5 },
        { key: 'turnIndicatorSettings.playerOffsetY', label: 'Player Off Y', min: -200, max: 200, step: 5 },
        { key: 'turnIndicatorSettings.playerTextColor', label: 'Player Text', type: 'color' },

        // Opponent
        { key: 'turnIndicatorSettings.opponentXPercent', label: 'Enemy X (%)', min: 0, max: 100, step: 0.5 },
        { key: 'turnIndicatorSettings.opponentYPercent', label: 'Enemy Y (%)', min: 0, max: 100, step: 0.5 },
        { key: 'turnIndicatorSettings.opponentOffsetX', label: 'Enemy Off X', min: -200, max: 200, step: 5 },
        { key: 'turnIndicatorSettings.opponentOffsetY', label: 'Enemy Off Y', min: -200, max: 200, step: 5 },
        { key: 'turnIndicatorSettings.opponentTextColor', label: 'Enemy Text', type: 'color' },

        // Shared
        { key: 'turnIndicatorSettings.fontSize', label: 'Font Size', min: 8, max: 60, step: 1 },
      ],
      customContent: (
        <div className="flex flex-col gap-2 p-2 bg-stone-100 rounded border border-stone-200">
          <div className="text-[10px] font-bold text-stone-600">Player Status</div>
          <div className="flex flex-wrap gap-1">
            {(['none', 'turn', 'done', 'last_say'] as TurnStatus[]).map(status => (
              <button
                key={status}
                onClick={() => useGameStore.getState().setPlayerTurnStatus(0, status)}
                className={`px-2 py-1 text-[10px] rounded border ${useGameStore.getState().players[0]?.turnStatus === status
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                  }`}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="text-[10px] font-bold text-stone-600 mt-2">Opponent Status</div>
          <div className="flex flex-wrap gap-1">
            {(['none', 'turn', 'done', 'last_say'] as TurnStatus[]).map(status => (
              <button
                key={status}
                onClick={() => useGameStore.getState().setPlayerTurnStatus(1, status)}
                className={`px-2 py-1 text-[10px] rounded border ${useGameStore.getState().players[1]?.turnStatus === status
                  ? 'bg-orange-500 text-white border-orange-600'
                  : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                  }`}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Slot Modifier',
      settings: [
        { key: 'slotModifierOffsetX', label: 'Offset X', min: -200, max: 200, step: 5 },
        { key: 'slotModifierOffsetY', label: 'Offset Y', min: -300, max: 300, step: 5 },
        { key: 'slotModifierFontSize', label: 'Font Size', min: 10, max: 100, step: 1 },
        { key: 'slotModifierFontColor', label: 'Neutral Color', type: 'color' },
        { key: 'slotModifierPositiveColor', label: 'Pos Color', type: 'color' },
        { key: 'slotModifierNegativeColor', label: 'Neg Color', type: 'color' },
        { key: 'slotModifierStrokeColor', label: 'Stroke Color', type: 'color' },
        { key: 'slotModifierStrokeWidth', label: 'Stroke Width', min: 0, max: 10, step: 0.5 },
      ]
    },
    {
      title: 'Slot Visuals (Glow)',
      settings: [
        { key: 'slotTargetColor', label: 'Target Color', type: 'color' },
        { key: 'slotDropColor', label: 'Drop Color', type: 'color' },
        { key: 'slotGlowRadius', label: 'Glow Radius', min: 0, max: 100, step: 1 },
        { key: 'slotGlowIntensity', label: 'Intensity (Alpha)', min: 0, max: 1, step: 0.05 },
        { key: 'slotPulseSpeed', label: 'Pulse Speed (s)', min: 0.1, max: 5.0, step: 0.1 },
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
                const targets: { playerId: PlayerId, terrainId: TerrainId }[] = [];
                const state = useGameStore.getState();
                ([0, 1] as PlayerId[]).forEach(pid => {
                  const slots = state.players[pid]?.slots;
                  if (slots)
                  {
                    Object.keys(slots).forEach(tid => {
                      targets.push({ playerId: pid, terrainId: parseInt(tid) as TerrainId });
                    });
                  }
                });
                useGameStore.getState().setSlotStatus(targets, 'showDrop');
              }}
              className="flex-1 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded text-[10px] hover:bg-blue-100"
            >
              Drop
            </button>
            <button
              onClick={() => {
                const targets: { playerId: PlayerId, terrainId: TerrainId }[] = [];
                const state = useGameStore.getState();
                ([0, 1] as PlayerId[]).forEach(pid => {
                  const slots = state.players[pid]?.slots;
                  if (slots)
                  {
                    Object.keys(slots).forEach(tid => {
                      targets.push({ playerId: pid, terrainId: parseInt(tid) as TerrainId });
                    });
                  }
                });
                useGameStore.getState().setSlotStatus(targets, 'showTarget');
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
            <span className="text-[10px] text-stone-500">P/T:</span>
            <input
              type="number"
              placeholder="P"
              className="w-8 text-xs border rounded px-1"
              id="debug-pid"
              defaultValue="0"
            />
            <input
              type="number"
              placeholder="T"
              className="w-8 text-xs border rounded px-1"
              id="debug-tid"
              defaultValue="0"
            />
            <button
              onClick={() => {
                const pid = parseInt((document.getElementById('debug-pid') as HTMLInputElement).value) as PlayerId;
                const tid = parseInt((document.getElementById('debug-tid') as HTMLInputElement).value) as TerrainId;
                if (!isNaN(pid) && !isNaN(tid))
                {
                  useGameStore.getState().setSlotStatus([{ playerId: pid, terrainId: tid }], 'showTarget');
                }
              }}
              className="px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-[10px] hover:bg-yellow-200"
            >
              Target
            </button>
            <button
              onClick={() => {
                const pid = parseInt((document.getElementById('debug-pid') as HTMLInputElement).value) as PlayerId;
                const tid = parseInt((document.getElementById('debug-tid') as HTMLInputElement).value) as TerrainId;
                if (!isNaN(pid) && !isNaN(tid))
                {
                  useGameStore.getState().setSlotStatus([{ playerId: pid, terrainId: tid }], 'showDrop');
                }
              }}
              className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded text-[10px] hover:bg-blue-200"
            >
              Drop
            </button>
          </div>

          <div className="h-px bg-stone-200 my-1"></div>

          {/* Power Controls */}
          <div className="text-[10px] font-bold text-stone-600 mb-1">Power Controls:</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-stone-500">Power:</span>
            <input
              type="number"
              placeholder="0"
              defaultValue="0"
              className="w-10 text-xs border rounded px-1"
              id="debug-power-val"
            />
          </div>
          <div className="flex gap-1 mb-1">
            <button
              onClick={() => {
                const val = parseInt((document.getElementById('debug-power-val') as HTMLInputElement).value) || 0;
                const targets: { playerId: PlayerId, terrainId: TerrainId }[] = [];
                const state = useGameStore.getState();
                ([0, 1] as PlayerId[]).forEach(pid => {
                  const slots = state.players[pid]?.slots;
                  if (slots)
                  {
                    Object.keys(slots).forEach(tid => {
                      targets.push({ playerId: pid, terrainId: parseInt(tid) as TerrainId });
                    });
                  }
                });
                useGameStore.getState().setSlotPower(targets, val, 'none');
              }}
              className="flex-1 py-1 bg-stone-100 border border-stone-300 text-stone-600 rounded text-[10px] hover:bg-stone-200"
            >
              Set All None
            </button>
            <button
              onClick={() => {
                const val = parseInt((document.getElementById('debug-power-val') as HTMLInputElement).value) || 0;
                const targets: { playerId: PlayerId, terrainId: TerrainId }[] = [];
                const state = useGameStore.getState();
                ([0, 1] as PlayerId[]).forEach(pid => {
                  const slots = state.players[pid]?.slots;
                  if (slots)
                  {
                    Object.keys(slots).forEach(tid => {
                      targets.push({ playerId: pid, terrainId: parseInt(tid) as TerrainId });
                    });
                  }
                });
                useGameStore.getState().setSlotPower(targets, val, 'contested');
              }}
              className="flex-1 py-1 bg-orange-100 border border-orange-300 text-orange-800 rounded text-[10px] hover:bg-orange-200"
            >
              All Contested
            </button>
            <button
              onClick={() => {
                const val = parseInt((document.getElementById('debug-power-val') as HTMLInputElement).value) || 0;
                const targets: { playerId: PlayerId, terrainId: TerrainId }[] = [];
                const state = useGameStore.getState();
                ([0, 1] as PlayerId[]).forEach(pid => {
                  const slots = state.players[pid]?.slots;
                  if (slots)
                  {
                    Object.keys(slots).forEach(tid => {
                      targets.push({ playerId: pid, terrainId: parseInt(tid) as TerrainId });
                    });
                  }
                });
                useGameStore.getState().setSlotPower(targets, val, 'winning');
              }}
              className="flex-1 py-1 bg-blue-100 border border-blue-300 text-blue-800 rounded text-[10px] hover:bg-blue-200"
            >
              All Winning
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-500">Specific P/T:</span>
            <button
              onClick={() => {
                const pid = parseInt((document.getElementById('debug-pid') as HTMLInputElement).value) as PlayerId;
                const tid = parseInt((document.getElementById('debug-tid') as HTMLInputElement).value) as TerrainId;
                const val = parseInt((document.getElementById('debug-power-val') as HTMLInputElement).value) || 0;
                if (!isNaN(pid) && !isNaN(tid)) useGameStore.getState().setSlotPower([{ playerId: pid, terrainId: tid }], val, 'none');
              }}
              className="px-2 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]"
            >
              None
            </button>
            <button
              onClick={() => {
                const pid = parseInt((document.getElementById('debug-pid') as HTMLInputElement).value) as PlayerId;
                const tid = parseInt((document.getElementById('debug-tid') as HTMLInputElement).value) as TerrainId;
                const val = parseInt((document.getElementById('debug-power-val') as HTMLInputElement).value) || 0;
                if (!isNaN(pid) && !isNaN(tid)) useGameStore.getState().setSlotPower([{ playerId: pid, terrainId: tid }], val, 'contested');
              }}
              className="px-2 py-0.5 bg-orange-100 border border-orange-300 rounded text-[10px]"
            >
              Contest
            </button>
            <button
              onClick={() => {
                const pid = parseInt((document.getElementById('debug-pid') as HTMLInputElement).value) as PlayerId;
                const tid = parseInt((document.getElementById('debug-tid') as HTMLInputElement).value) as TerrainId;
                const val = parseInt((document.getElementById('debug-power-val') as HTMLInputElement).value) || 0;
                if (!isNaN(pid) && !isNaN(tid)) useGameStore.getState().setSlotPower([{ playerId: pid, terrainId: tid }], val, 'winning');
              }}
              className="px-2 py-0.5 bg-blue-100 border border-blue-300 rounded text-[10px]"
            >
              Win
            </button>
          </div>

          <div className="h-px bg-stone-200 my-1"></div>

          {/* Modifier Controls */}
          <div className="text-[10px] font-bold text-stone-600 mb-1">Modifier Controls:</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-stone-500">Value:</span>
            <input
              type="number"
              placeholder="0"
              defaultValue="0"
              className="w-10 text-xs border rounded px-1"
              id="debug-mod-val"
            />
          </div>
          <div className="flex gap-1 mb-1">
            <button
              onClick={() => {
                const val = parseInt((document.getElementById('debug-mod-val') as HTMLInputElement).value) || 0;
                const targets: { playerId: PlayerId, terrainId: TerrainId }[] = [];
                const state = useGameStore.getState();
                ([0, 1] as PlayerId[]).forEach(pid => {
                  const slots = state.players[pid]?.slots;
                  if (slots)
                  {
                    Object.keys(slots).forEach(tid => {
                      targets.push({ playerId: pid, terrainId: parseInt(tid) as TerrainId });
                    });
                  }
                });
                useGameStore.getState().setSlotModifier(targets, val);
              }}
              className="flex-1 py-1 bg-stone-100 border border-stone-300 text-stone-600 rounded text-[10px] hover:bg-stone-200"
            >
              Set All
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-500">Specific P/T:</span>
            <button
              onClick={() => {
                const pid = parseInt((document.getElementById('debug-pid') as HTMLInputElement).value) as PlayerId;
                const tid = parseInt((document.getElementById('debug-tid') as HTMLInputElement).value) as TerrainId;
                const val = parseInt((document.getElementById('debug-mod-val') as HTMLInputElement).value) || 0;
                if (!isNaN(pid) && !isNaN(tid)) useGameStore.getState().setSlotModifier([{ playerId: pid, terrainId: tid }], val);
              }}
              className="px-2 py-0.5 bg-purple-100 border border-purple-300 rounded text-[10px] hover:bg-purple-200 text-purple-900"
            >
              Set Mod
            </button>
          </div>

          <div className="h-px bg-stone-200 my-1"></div>

          <div className="text-[9px] text-stone-400 italic">
            Note: Dragging cards will override these manual states.
          </div>
        </div>
      )
    },
    {
      title: 'Debug State (Game Flow)',
      settings: [],
      customContent: (
        <div className="flex flex-col gap-2 p-2 bg-stone-100 rounded border border-stone-200">
          {/* Turn Controls */}
          <div className="text-[10px] font-bold text-stone-600 mb-1">Set Turn (Triggers Animation?):</div>
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => useGameStore.getState().setTurn('player')}
              className="flex-1 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded text-[10px] hover:bg-blue-100"
            >
              Your Turn
            </button>
            <button
              onClick={() => useGameStore.getState().setTurn('opponent')}
              className="flex-1 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded text-[10px] hover:bg-orange-100"
            >
              Enemy Turn
            </button>
          </div>

          <div className="h-px bg-stone-200 my-1"></div>

          {/* Win Count Controls */}
          <div className="text-[10px] font-bold text-stone-600 mb-1">Wins (Player 0 / You):</div>
          <div className="flex gap-1 mb-2">
            {[0, 1, 2].map(w => (
              <button
                key={w}
                onClick={() => useGameStore.getState().setPlayerWins(0, w)}
                className="flex-1 py-1 bg-white border border-stone-300 rounded text-[10px] hover:bg-stone-50"
              >
                {w}
              </button>
            ))}
          </div>

          <div className="text-[10px] font-bold text-stone-600 mb-1">Wins (Player 1 / Enemy):</div>
          <div className="flex gap-1 mb-2">
            {[0, 1, 2].map(w => (
              <button
                key={w}
                onClick={() => useGameStore.getState().setPlayerWins(1, w)}
                className="flex-1 py-1 bg-white border border-stone-300 rounded text-[10px] hover:bg-stone-50"
              >
                {w}
              </button>
            ))}
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

  const activeSections = activeTab === 'hand' ? handSections : (activeTab === 'board' ? boardSections : animationSections);

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
          onChange={(e) => setActiveTab(e.target.value as 'hand' | 'board' | 'anim')}
          className="w-full p-2 bg-white border border-stone-300 rounded-lg text-sm font-bold text-stone-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        >
          <option value="hand">🃏 Hand Settings</option>
          <option value="board">🪵 Board Settings</option>
          <option value="anim">🎬 Animations</option>
        </select>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-3 space-y-3 custom-scrollbar">
        {activeTab === 'anim' ? (
          <div className="space-y-4">
            <div className="bg-white p-2 rounded border border-stone-200">
              <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Animation Type</label>
              <select
                value={activeAnimCategory}
                onChange={(e) => setActiveAnimCategory(e.target.value)}
                className="w-full text-xs p-1 border rounded"
              >
                <option value="playerPlay">Player Play</option>
                <option value="opponentPlay">Opponent Play</option>
              </select>
            </div>

            {/* Render settings for selected category */}
            {animationSections.map(section => {
              // Filter logic: section.title needs to map to category?
              // Actually, my animationSections array has 'Player Animation' and 'Opponent Animation'.
              // I will just map the category ID to the Title prefix.

              const neededTitle = activeAnimCategory === 'playerPlay' ? 'Player Animation' : 'Opponent Animation';

              if (section.title !== neededTitle) return null;

              return (
                <div key={section.title} className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="p-3 bg-stone-50 border-b border-stone-100 text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
                    {section.title}
                  </div>
                  <div className="p-3 space-y-4">
                    {section.title === 'Player Animation' || section.title === 'Opponent Animation' ? (
                      // Custom Grouped Render for Animations
                      (() => {
                        const activeAnimCategory = section.title === 'Player Animation' ? 'playerPlay' : 'opponentPlay';
                        return (
                          <div className="space-y-4">
                            {/* Move Phase */}
                            <div className="p-2 bg-stone-50 rounded border border-stone-100">
                              <div className="text-[10px] uppercase font-bold text-stone-400 mb-2">Move Phase</div>
                              <InputRange
                                label="Move Duration"
                                value={(boardSettings.animationSettings as any)[activeAnimCategory].moveDuration}
                                min={0} max={2} step={0.1}
                                onChange={(val) => updateAnimSetting(activeAnimCategory, 'moveDuration', val)}
                              />
                              <div className="flex justify-between items-center mt-2">
                                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Move Ease</label>
                                <select
                                  value={(boardSettings.animationSettings as any)[activeAnimCategory].moveEase || 'easeOut'}
                                  onChange={(e) => updateAnimSetting(activeAnimCategory, 'moveEase', e.target.value)}
                                  className="w-24 text-[10px] p-1 border rounded bg-white"
                                >
                                  <option value="linear">Linear</option>
                                  <option value="easeIn">Ease In</option>
                                  <option value="easeOut">Ease Out</option>
                                  <option value="easeInOut">Ease In Out</option>
                                  <option value="backIn">Back In</option>
                                  <option value="backOut">Back Out</option>
                                  <option value="bounce">Bounce</option>
                                </select>
                              </div>
                            </div>

                            {/* Wait Phase */}
                            <div className="p-2 bg-stone-50 rounded border border-stone-100">
                              <div className="text-[10px] uppercase font-bold text-stone-400 mb-2">Wait Phase</div>
                              <InputRange
                                label="Wait Duration"
                                value={(boardSettings.animationSettings as any)[activeAnimCategory].waitDuration}
                                min={0} max={3} step={0.1}
                                onChange={(val) => updateAnimSetting(activeAnimCategory, 'waitDuration', val)}
                              />
                              <InputRange
                                label="Hanging Offset X"
                                value={(boardSettings.animationSettings as any)[activeAnimCategory].hoverOffsetX}
                                min={-300} max={300} step={10}
                                onChange={(val) => updateAnimSetting(activeAnimCategory, 'hoverOffsetX', val)}
                              />
                              <InputRange
                                label="Hanging Offset Y"
                                value={(boardSettings.animationSettings as any)[activeAnimCategory].hoverOffsetY}
                                min={-300} max={300} step={10}
                                onChange={(val) => updateAnimSetting(activeAnimCategory, 'hoverOffsetY', val)}
                              />
                              <InputRange
                                label="Hanging Scale"
                                value={(boardSettings.animationSettings as any)[activeAnimCategory].hoverScale}
                                min={0.5} max={2} step={0.1}
                                onChange={(val) => updateAnimSetting(activeAnimCategory, 'hoverScale', val)}
                              />
                            </div>

                            {/* Slam Phase */}
                            <div className="p-2 bg-stone-50 rounded border border-stone-100">
                              <div className="text-[10px] uppercase font-bold text-stone-400 mb-2">Slam Phase</div>
                              <InputRange
                                label="Slam Duration"
                                value={(boardSettings.animationSettings as any)[activeAnimCategory].slamDuration}
                                min={0} max={2} step={0.1}
                                onChange={(val) => updateAnimSetting(activeAnimCategory, 'slamDuration', val)}
                              />
                              <div className="flex justify-between items-center mt-2 mb-2">
                                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Slam Ease</label>
                                <select
                                  value={(boardSettings.animationSettings as any)[activeAnimCategory].slamEase || 'backIn'}
                                  onChange={(e) => updateAnimSetting(activeAnimCategory, 'slamEase', e.target.value)}
                                  className="w-24 text-[10px] p-1 border rounded bg-white"
                                >
                                  <option value="linear">Linear</option>
                                  <option value="easeIn">Ease In</option>
                                  <option value="easeOut">Ease Out</option>
                                  <option value="easeInOut">Ease In Out</option>
                                  <option value="backIn">Back In</option>
                                  <option value="backOut">Back Out</option>
                                  <option value="bounce">Bounce</option>
                                </select>
                              </div>
                              <InputRange
                                label="Peak Scale"
                                value={(boardSettings.animationSettings as any)[activeAnimCategory].slamScalePeak}
                                min={1} max={3} step={0.1}
                                onChange={(val) => updateAnimSetting(activeAnimCategory, 'slamScalePeak', val)}
                              />
                              <InputRange
                                label="Land Scale"
                                value={(boardSettings.animationSettings as any)[activeAnimCategory].slamScaleLand}
                                min={0.1} max={2} step={0.1}
                                onChange={(val) => updateAnimSetting(activeAnimCategory, 'slamScaleLand', val)}
                              />
                            </div>

                            {/* Trigger Event Selector (Manual) */}
                            <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Trigger Next On</label>
                              <select
                                value={(boardSettings.animationSettings as any)[activeAnimCategory].triggerNextOn}
                                onChange={(e) => updateAnimSetting(activeAnimCategory, 'triggerNextOn', e.target.value)}
                                className="w-24 text-[10px] p-1 border rounded bg-white"
                              >
                                <option value="start">Start</option>
                                <option value="moveDone">Move Done</option>
                                <option value="hoverDone">Wait Done</option>
                                <option value="slamDone">Slam Done</option>
                              </select>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      section.settings.map((setting: any) => {
                        const [type, prop] = setting.key.split('.');
                        const currentValue = (boardSettings.animationSettings as any)[type][prop];

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
                              updateAnimSetting(type, prop, val);
                            }}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Hand / Board Tabs (Legacy List)
          activeSections.map((section: any) => (
            <div key={section.title} className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-50 text-[10px] font-extrabold uppercase tracking-widest text-stone-400 text-left transition-colors"
              >
                {section.title}
                <span className="text-stone-300">{expandedSections[section.title] ? '▼' : '▶'}</span>
              </button>

              {!!expandedSections[section.title] && (
                <div className="p-3 pt-0 space-y-4 border-t border-stone-100">
                  <div className="h-2"></div>
                  {section.customContent}
                  {section.settings.map((setting: any) => {
                    let currentValue: any;
                    // If it's a hand setting (no dots) AND we are on hand tab, use local settings
                    if (activeTab === 'hand' && !setting.key.includes('.'))
                    {
                      currentValue = (settings as any)[setting.key];
                    } else
                    {
                      // Otherwise (Animation/Board tabs OR nested keys like passButtonSettings.*), use boardSettings
                      if (setting.key.includes('.'))
                      {
                        const parts = setting.key.split('.');
                        currentValue = parts.reduce((acc: any, part: string) => acc && acc[part], boardSettings);
                      } else
                      {
                        currentValue = (boardSettings as any)[setting.key];
                      }
                    }

                    if (setting.type === 'color')
                    {
                      return (
                        <InputColor
                          key={setting.key}
                          label={setting.label}
                          value={currentValue as string}
                          onChange={(val) => {
                            if (activeTab === 'hand' && !setting.key.includes('.'))
                            {
                              onUpdate(setting.key as any, val as any);
                            } else
                            {
                              if (setting.key.startsWith('passButtonSettings.'))
                              {
                                updatePassButtonSetting(setting.key, val);
                              } else if (setting.key.startsWith('handTooltipSettings.'))
                              {
                                updateTooltipSetting(setting.key, val);
                              } else if (setting.key.startsWith('winRecordSettings.'))
                              {
                                updateWinRecordSetting(setting.key, val);
                              } else if (setting.key.startsWith('turnIndicatorSettings.'))
                              {
                                updateTurnIndicatorSetting(setting.key, val);
                              } else
                              {
                                updateBoard({ [setting.key]: val });
                              }
                            }
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
                          if (activeTab === 'hand' && !setting.key.includes('.'))
                          {
                            onUpdate(setting.key as any, val);
                          } else
                          {
                            if (setting.key.startsWith('passButtonSettings.'))
                            {
                              updatePassButtonSetting(setting.key, val);
                            } else if (setting.key.startsWith('handTooltipSettings.'))
                            {
                              updateTooltipSetting(setting.key, val);
                            } else if (setting.key.startsWith('winRecordSettings.'))
                            {
                              updateWinRecordSetting(setting.key, val);
                            } else if (setting.key.startsWith('turnIndicatorSettings.'))
                            {
                              updateTurnIndicatorSetting(setting.key, val);
                            } else
                            {
                              updateBoard({ [setting.key]: val });
                            }
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )))}

        <div className="mt-6 pt-4 border-t border-stone-200">
          <button
            onClick={() => {
              let json = '';
              const state = useGameStore.getState();
              if (activeTab === 'hand')
              {
                // Merge Pass Button Settings (which are technically Board Settings) with Hand Settings for export
                const exportData = {
                  ...settings,
                  passButtonSettings: state.boardSettings.passButtonSettings,
                  handTooltipSettings: state.boardSettings.handTooltipSettings // Renamed
                };

                // Cleanup: Remove any flattened keys that might have polluted settings due to previous bugs
                Object.keys(exportData).forEach(key => {
                  if (key.startsWith('passButtonSettings.') || key.startsWith('handTooltipSettings.'))
                  {
                    delete (exportData as any)[key];
                  }
                });

                json = JSON.stringify(exportData, null, 2);
              } else if (activeTab === 'anim')
              {
                json = JSON.stringify(state.boardSettings.animationSettings, null, 2);
              } else
              {
                // Default or Board
                json = JSON.stringify(state.boardSettings, null, 2);
              }
              navigator.clipboard.writeText(json);
              alert(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings copied to clipboard!`);
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

  // Pass Button State
  const [passMode, setPassMode] = useState<'pass' | 'done' | 'cancel' | 'conclude' | 'none'>('pass');
  const [passStatus, setPassStatus] = useState<'normal' | 'disabled' | 'clicked'>('normal');

  // Opponent Store State
  const opponentCards = useGameStore(state => state.opponentCards);
  const setOpponentCards = useGameStore(state => state.setOpponentCards);
  const handleRemoveOpponentCard = (id: string) => {
    setOpponentCards(opponentCards.filter((c: any) => c.id !== id));
  };

  const handleDrawOpponentCard = () => {
    const randomCard = { ...INITIAL_CARDS[Math.floor(Math.random() * INITIAL_CARDS.length)] };
    randomCard.id = crypto.randomUUID();
    // Assuming setOpponentCards accepts CardInstance[]
    setOpponentCards([...opponentCards, randomCard]);
  };

  // Initialize Opponent with 5 cards
  useEffect(() => {
    if (opponentCards.length === 0)
    {
      const initialFoeCards = Array.from({ length: 5 }).map(() => {
        const c = { ...INITIAL_CARDS[Math.floor(Math.random() * INITIAL_CARDS.length)] };
        c.id = crypto.randomUUID();
        return c;
      });
      setOpponentCards(initialFoeCards);
    }
  }, []); // Run once on mount

  // Expose Console Commands
  useEffect(() => {
    // Pass Button Debug
    (window as any).setPassMode = setPassMode;
    (window as any).setPassStatus = setPassStatus;

    (window as any).opponentPlay = (cardIndexOrId: number | string, terrainId: number) => {
      const state = useGameStore.getState();
      let cardId: string | undefined;

      if (typeof cardIndexOrId === 'number')
      {
        const card = state.opponentCards[cardIndexOrId];
        if (card)
        {
          cardId = card.id;
          console.log(`[OpponentPlay] Playing card at index ${cardIndexOrId}: ${card.name} (${cardId})`);
        } else
        {
          console.warn(`[OpponentPlay] No card found at index ${cardIndexOrId}`);
          return;
        }
      } else
      {
        cardId = cardIndexOrId;
      }

      if (cardId)
      {
        const slotEl = document.querySelector(`[data-player-id="1"][data-terrain-id="${terrainId}"]`);
        let targetPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        if (slotEl)
        {
          const rect = slotEl.getBoundingClientRect();
          targetPos = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        }

        const cardInstance = state.opponentCards.find(c => c.id === cardId);
        if (cardInstance)
        {
          // 1. Remove from Hand Logic (UI State) IMMEDIATELY
          state.setOpponentCards(state.opponentCards.filter(c => c.id !== cardId));

          const animSettings = state.boardSettings.animationSettings.opponentPlay;

          // Starting Pos? 
          // Hand is at top. Let's assume some top position.
          // settings.facedownBaseX/Y
          const settings = DEFAULT_SETTINGS; // We don't have access to 'settings' state here easily without closing over it?
          // Actually, 'settings' is state in DebugScene, not global store. 
          // Ideally opponent hand settings should be in store too, but they are in 'settings' state found in DebugScene.
          // Since this is a console command, using defaults or approximating is okay for now.

          useAnimationStore.getState().play({
            id: 'test-play-' + crypto.randomUUID(),
            type: 'card_play',
            config: animSettings,
            payload: {
              card: cardInstance,
              startPosition: { x: window.innerWidth / 2, y: -200 }, // Approximate top
              targetPosition: targetPos,
              onFinish: () => {
                console.log(`[OpponentPlay] Animation complete. Occupying slot ${terrainId} for ${cardId}`);
                // 2. Logic: Actually occupy the slot in the store
                // We use occupySlot directly because we already removed it from hand
                const ENEMY_ID = 1;
                useGameStore.getState().occupySlot(ENEMY_ID, terrainId as TerrainId, cardId!, cardInstance);
              }
            }
          });
        }
      }
    };
    (window as any).opponentHandRead = () => {
      console.log("Opponent Hand:", useGameStore.getState().opponentCards);
      return useGameStore.getState().opponentCards;
    };
  }, []);

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

  // Helper for nested animation settings
  const updateAnimSetting = (type: string, prop: string, val: any) => {
    const currentAnimSettings = useGameStore.getState().boardSettings.animationSettings;
    const newAnimConfig = {
      ...currentAnimSettings[type as keyof typeof currentAnimSettings],
      [prop]: val
    };
    useGameStore.getState().updateBoardSettings({
      animationSettings: {
        ...currentAnimSettings,
        [type]: newAnimConfig
      }
    });
  };

  const handleCardDrop = (
    cardId: string,
    targetSlot: { playerId: PlayerId, terrainId: TerrainId },
    dropPosition: { x: number, y: number },
    startPosition: { x: number, y: number }
  ) => {
    console.log(`[DebugScene] Card Dropped: ${cardId} on ${targetSlot.playerId}-${targetSlot.terrainId}`);

    // 1. Remove from Hand Logic (UI State)
    handleRemoveCard(cardId);

    // 2. Trigger Animation via Manager
    // Since this is the Player Hand (interactive), use playerPlay settings
    const animSettings = useGameStore.getState().boardSettings.animationSettings.playerPlay;

    // We need the CardInstance object. Check 'cards' state.
    // Note: 'cards' might have been updated by 'handleRemoveCard' already if we are not careful with closures/timing?
    // Actually handleRemoveCard uses setCards(prev => ...), so 'cards' in this scope is the render-time value.
    // However, it's safer to find it before removal or pass it up.
    // 'cards' is available in scope.
    const cardInstance = cards.find(c => c.id === cardId);

    if (cardInstance)
    {
      useAnimationStore.getState().play({
        id: 'test-play-' + crypto.randomUUID(),
        type: 'card_play',
        config: animSettings,
        payload: {
          card: cardInstance,
          startPosition: startPosition,
          targetPosition: dropPosition,
          onFinish: () => {
            // 3. Logic: Actually occupy the slot in the store
            console.log(`[DebugScene] Animation complete. Occupying slot ${targetSlot.playerId}-${targetSlot.terrainId}`);
            useGameStore.getState().occupySlot(targetSlot.playerId, targetSlot.terrainId, cardId);
          }
        }
      });
    } else
    {
      console.warn(`[DebugScene] Could not find card instance for animation: ${cardId}`);
    }
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

      {/* React Board Layer */}
      <div className="z-0">
        <Board />
      </div>

      {/* Top Left Controls */}
      <div className="absolute top-4 left-4 z-50 flex gap-4">
        <button
          onClick={onBack}
          className="bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white px-3 py-2 rounded-lg backdrop-blur-sm border border-stone-800 transition-all font-bold text-xs uppercase tracking-wide flex items-center gap-2"
        >
          <span>←</span> Back to Menu
        </button>
      </div>

      <AnimationLayer
        settings={settings}
        templates={orderData.templates as any}
        schema={orderData.schema as any}
      />

      {/* Hand Container */}
      {/* Hand Container (Player) */}
      <Hand
        cards={cards}
        setCards={setCards}
        onRemoveCard={handleRemoveCard}
        settings={settings}
        templates={orderData.templates as any}
        schema={orderData.schema as any}
        isFacedown={false}
        onCardDrop={handleCardDrop}
      />

      {/* Hand Container (Opponent/Facedown) */}
      <Hand
        cards={opponentCards}
        setCards={setOpponentCards as any}
        onRemoveCard={handleRemoveOpponentCard}
        settings={settings}
        templates={orderData.templates as any}
        schema={orderData.schema as any}
        isFacedown={true} // Renamed prop
      />

      {/* Persistent Right Settings Panel */}
      <PassButton
        mode={passMode}
        status={passStatus}
        onClick={() => {
          console.log('Pass Button Clicked');
          // Logic for click action (e.g. passing turn) would go here
        }}
        onMouseDown={() => setPassStatus('clicked')}
        onMouseUp={() => setPassStatus('normal')}
      />



      {/* Tooltip for board cards */}
      <BoardCardTooltip />

      {/* UI Overlay */}
      <SettingsPanel
        settings={settings}
        onUpdate={handleChange}
        onReset={() => setSettings(DEFAULT_SETTINGS)}
        onAddCard={handleDrawRandomProp}
        onDrawRandom={handleDrawRandomProp}
        onAddOpponentCard={handleDrawOpponentCard}
      />
    </div>
  );
};
