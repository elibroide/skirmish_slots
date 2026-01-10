import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { HandSettings } from '../../components/Card';

export const InputColor = ({ label, value, onChange }: {
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

export const InputRange = ({ label, value, min, max, step, onChange, type = 'range' }: {
    label: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (val: number) => void;
    type?: string;
}) => {
    const [localValue, setLocalValue] = useState(value ?? 0);

    useEffect(() => {
        setLocalValue(value ?? 0);
    }, [value]);

    useEffect(() => {
        if (localValue === (value ?? 0)) return;
        const timer = setTimeout(() => {
            onChange(localValue);
        }, 100);
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

export const TunerPanel = ({ settings, onUpdate, onReset, onAddCard, onDrawRandom, onAddOpponentCard }: {
    settings: HandSettings;
    onUpdate: (key: keyof HandSettings, value: number) => void;
    onReset: () => void;
    onAddCard?: () => void;
    onDrawRandom?: () => void;
    onAddOpponentCard?: () => void;
}) => {
    const [activeTab, setActiveTab] = useState<'hand' | 'board' | 'anim' | 'store'>('hand');
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
    };

    const updatePassButtonSetting = (keyPath: string, val: any) => {
        const parts = keyPath.split('.');
        const cur = boardSettings.passButtonSettings;
        let newSettings: any;

        if (parts.length === 2)
        {
            newSettings = { ...cur, [parts[1]]: val };
        } else if (parts.length === 3)
        {
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
                        {onAddCard && <button onClick={onAddCard} className="flex-1 py-1 bg-white border border-stone-300 rounded text-[10px] font-bold text-stone-600 hover:bg-stone-50 hover:text-blue-600 shadow-sm">
                            + CARD
                        </button>}
                        {onDrawRandom && <button onClick={onDrawRandom} className="flex-1 py-1 bg-white border border-stone-300 rounded text-[10px] font-bold text-stone-600 hover:bg-stone-50 hover:text-purple-600 shadow-sm">
                            + RANDOM
                        </button>}
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
                        {onAddOpponentCard && <button onClick={onAddOpponentCard} className="flex-1 py-1 bg-red-50 border border-red-200 rounded text-[10px] font-bold text-red-600 hover:bg-red-100 shadow-sm">
                            + FOE CARD
                        </button>}
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
                { key: 'hoverScale', label: 'Hover Scale', min: 1.0, max: 2.5, step: 0.01 },
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

                { key: 'glowMinBlur', label: 'Min Blur', min: 0, max: 20, step: 1 },
                { key: 'glowMaxBlur', label: 'Max Blur', min: 0, max: 50, step: 1 },
                { key: 'glowMinSpread', label: 'Min Spread', min: -50, max: 50, step: 1 },
                { key: 'glowMaxSpread', label: 'Max Spread', min: -50, max: 50, step: 1 },

                { key: 'glowScaleX', label: 'Scale X', min: 0.5, max: 1.5, step: 0.01 },
                { key: 'glowScaleY', label: 'Scale Y', min: 0.5, max: 1.5, step: 0.01 },
                { key: 'glowOffsetX', label: 'Offset X', min: -100, max: 100, step: 1 },
                { key: 'glowOffsetY', label: 'Offset Y', min: -100, max: 100, step: 1 },

                { key: 'glowCornerRadius', label: 'Corner Radius', min: 0, max: 50, step: 1 },

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
                        {/* Disabled for GameScene reuse to avoid complex type imports if not needed */}
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

            ]
        },
    ];

    const renderSection = (title: string, configList: any[], data: any, onCommit: (key: string, val: any) => void, customContent?: React.ReactNode) => {
        const isExpanded = expandedSections[title];
        return (
            <div key={title} className="border-b border-stone-200">
                <button
                    onClick={() => toggleSection(title)}
                    className="w-full flex justify-between items-center p-2 bg-stone-50 hover:bg-stone-100 text-[10px] font-bold text-stone-600 uppercase tracking-wider"
                >
                    <span>{title}</span>
                    <span>{isExpanded ? '−' : '+'}</span>
                </button>
                {isExpanded && (
                    <div className="p-2 space-y-2 bg-white">
                        {customContent}
                        {configList.map(setting => {
                            if (setting.key.startsWith('animationSettings.'))
                            {
                                // Skip here, handled in separate anim tab
                                return null;
                            }
                            if (setting.key.startsWith('passButtonSettings.'))
                            {
                                const path = setting.key;
                                // Get value
                                const parts = path.split('.');
                                let val;
                                if (parts.length === 2) val = (boardSettings.passButtonSettings as any)[parts[1]];
                                else if (parts.length === 3) val = (boardSettings.passButtonSettings as any)[parts[1]][parts[2]];

                                return (
                                    <div key={setting.key}>
                                        {setting.type === 'color' ?
                                            <InputColor
                                                label={setting.label}
                                                value={val}
                                                onChange={(v) => updatePassButtonSetting(path, v)}
                                            /> :
                                            <InputRange
                                                label={setting.label}
                                                value={val}
                                                min={setting.min} max={setting.max} step={setting.step}
                                                type={setting.type}
                                                onChange={(v) => updatePassButtonSetting(path, v)}
                                            />
                                        }
                                    </div>
                                );
                            }
                            if (setting.key.startsWith('handTooltipSettings.'))
                            {
                                const path = setting.key;
                                const parts = path.split('.');
                                const val = (boardSettings.handTooltipSettings as any)[parts[1]];
                                return (
                                    <div key={setting.key}>
                                        {setting.type === 'color' ?
                                            <InputColor
                                                label={setting.label}
                                                value={val}
                                                onChange={(v) => updateTooltipSetting(path, v)}
                                            /> :
                                            <InputRange
                                                label={setting.label}
                                                value={val}
                                                min={setting.min} max={setting.max} step={setting.step}
                                                type={setting.type}
                                                onChange={(v) => updateTooltipSetting(path, v)}
                                            />
                                        }
                                    </div>
                                );
                            }
                            if (setting.key.startsWith('winRecordSettings.'))
                            {
                                const path = setting.key;
                                const parts = path.split('.');
                                const val = (boardSettings.winRecordSettings as any)[parts[1]];
                                return (
                                    <div key={setting.key}>
                                        {setting.type === 'color' ?
                                            <InputColor
                                                label={setting.label}
                                                value={val}
                                                onChange={(v) => updateWinRecordSetting(path, v)}
                                            /> :
                                            <InputRange
                                                label={setting.label}
                                                value={val}
                                                min={setting.min} max={setting.max} step={setting.step}
                                                type={setting.type}
                                                onChange={(v) => updateWinRecordSetting(path, v)}
                                            />
                                        }
                                    </div>
                                );
                            }
                            if (setting.key.startsWith('turnIndicatorSettings.'))
                            {
                                const path = setting.key;
                                const parts = path.split('.');
                                const val = (boardSettings.turnIndicatorSettings as any)[parts[1]];
                                return (
                                    <div key={setting.key}>
                                        {setting.type === 'color' ?
                                            <InputColor
                                                label={setting.label}
                                                value={val}
                                                onChange={(v) => updateTurnIndicatorSetting(path, v)}
                                            /> :
                                            <InputRange
                                                label={setting.label}
                                                value={val}
                                                min={setting.min} max={setting.max} step={setting.step}
                                                type={setting.type}
                                                onChange={(v) => updateTurnIndicatorSetting(path, v)}
                                            />
                                        }
                                    </div>
                                );
                            }

                            // Board Scale/Transform
                            if (['boardScale', 'boardX', 'boardY', 'slotHeightPercent', 'slotAspectRatio', 'playerRowY', 'enemyRowY', 'playerSlotGapPercent', 'enemySlotGapPercent'].includes(setting.key)
                                || setting.key.startsWith('powerCircle')
                                || setting.key.startsWith('slot')
                                || setting.key.startsWith('cardMargin')
                                || setting.key.startsWith('boardTooltip')
                            )
                            {
                                // Fallback to updateBoard since these are specific to BoardSettings directly
                                const val = (boardSettings as any)[setting.key];
                                return (
                                    <div key={setting.key}>
                                        {setting.type === 'color' ?
                                            <InputColor
                                                label={setting.label}
                                                value={val}
                                                onChange={(v) => updateBoard({ [setting.key]: v })}
                                            /> :
                                            <InputRange
                                                label={setting.label}
                                                value={val}
                                                min={setting.min} max={setting.max} step={setting.step}
                                                type={setting.type}
                                                onChange={(v) => updateBoard({ [setting.key]: v })}
                                            />
                                        }
                                    </div>
                                );
                            }

                            // Generic Handler (Uses passed 'data' and 'onCommit')
                            return (
                                <div key={setting.key}>
                                    {setting.type === 'color' ?
                                        <InputColor
                                            label={setting.label}
                                            value={(data as any)[setting.key] || '#000000'}
                                            onChange={(val) => onCommit(setting.key, val)}
                                        />
                                        :
                                        <InputRange
                                            label={setting.label}
                                            value={(data as any)[setting.key] ?? 0}
                                            min={setting.min}
                                            max={setting.max}
                                            step={setting.step}
                                            type={setting.type}
                                            onChange={(val) => onUpdate(setting.key as keyof HandSettings, val)}
                                        />
                                    }
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`
        fixed top-0 ${dockSide === 'right' ? 'right-0' : 'left-0'} h-full bg-white shadow-2xl z-[1000] flex flex-col transition-all duration-300
        ${isMinimized ? 'w-12' : 'w-80'}
            `}>
            {/* Header / Toggle */}
            <div className="p-2 border-b border-stone-200 flex justify-between items-center bg-stone-100">
                <div className="flex gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-stone-200 rounded text-stone-600"
                    >
                        {isMinimized ? (dockSide === 'right' ? '◀' : '▶') : (dockSide === 'right' ? '▶' : '◀')}
                    </button>
                    {!isMinimized && (
                        <button
                            onClick={() => handleExport(boardSettings)}
                            className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 ml-2"
                            title="Export entire board configuration"
                        >
                            EXPORT ALL
                        </button>
                    )}
                </div>
                {!isMinimized && <span className="text-xs font-bold text-stone-500 uppercase">Tuner</span>}
                {!isMinimized && (
                    <button
                        onClick={() => setDockSide(side => side === 'right' ? 'left' : 'right')}
                        className="text-[10px] text-blue-500 hover:text-blue-700 px-2"
                    >
                        {dockSide === 'right' ? 'Dock Left' : 'Dock Right'}
                    </button>
                )}
            </div>

            {!isMinimized && (
                <>
                    {/* Tabs */}
                    <div className="flex border-b border-stone-200">
                        <button
                            onClick={() => setActiveTab('hand')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'hand' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                                }`}
                        >
                            Hand & UI
                        </button>
                        <button
                            onClick={() => setActiveTab('board')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'board' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                                } `}
                        >
                            Board
                        </button>
                        <button
                            onClick={() => setActiveTab('anim')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'anim' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                                } `}
                        >
                            Anim
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden pb-12">
                        {activeTab === 'hand' && handSections.map(s => renderSection(s.title, s.settings, settings, (k, v) => onUpdate(k as keyof HandSettings, v), s.customContent))}
                        {activeTab === 'board' && boardSections.map(s => renderSection(s.title, s.settings, boardSettings, (k, v) => updateBoard({ [k]: v }), s.customContent))}

                        {activeTab === 'anim' && (
                            <div className="p-2 space-y-4">
                                <div className="flex gap-1 mb-2">
                                    <button
                                        onClick={() => setActiveAnimCategory('playerPlay')}
                                        className={`flex-1 py-1 text-[10px] rounded border ${activeAnimCategory === 'playerPlay' ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-stone-300'}`}
                                    >
                                        Player Play
                                    </button>
                                    <button
                                        onClick={() => setActiveAnimCategory('opponentPlay')}
                                        className={`flex-1 py-1 text-[10px] rounded border ${activeAnimCategory === 'opponentPlay' ? 'bg-orange-100 border-orange-300 text-orange-800' : 'bg-white border-stone-300'}`}
                                    >
                                        Opponent Play
                                    </button>
                                </div>

                                {animationSections.flatMap(section => section.settings).map(setting => {
                                    if (!setting.key.startsWith(activeAnimCategory)) return null;

                                    const propName = setting.key.split('.')[1];
                                    const val = (boardSettings.animationSettings as any)[activeAnimCategory][propName];

                                    return (
                                        <div key={setting.key}>
                                            <InputRange
                                                label={setting.label}
                                                value={val}
                                                min={setting.min} max={setting.max} step={setting.step}
                                                onChange={(v) => updateAnimSetting(activeAnimCategory, propName, v)}
                                            />
                                        </div>
                                    );
                                })}

                                <div className="p-2 bg-stone-100 rounded text-[10px] text-stone-500 italic mt-4">
                                    Note: Some animation changes may require a page reload or Full Reset to fully take effect if they affect initializing sequences.
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
