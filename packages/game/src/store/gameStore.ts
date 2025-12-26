import { create } from 'zustand';
import { TerrainId, PlayerId } from '../engine/types';
import type { CardInstance } from '@skirmish/card-maker';

// Definition of a Board Slot
export type SlotStatus = 'idle' | 'showTarget' | 'showDrop';

export interface BoardSlot {
  id: string; // "playerId_terrainId"
  playerId: PlayerId;
  terrainId: TerrainId;
  owner: 'player' | 'enemy';
  // Position in Screen Space (relative to the Phaser canvas/Game container)
  // We use this to detect drops in React
  x: number;
  y: number;
  width: number;
  height: number;
  status: SlotStatus;
  
  // Power Circle
  power: number;
  powerState: 'none' | 'contested' | 'winning';
  modifier: number; // Added
    
  // Is something here?
  content: {
    cardId: string;
    instance?: CardInstance;
    // We can add more unit data here later (hp, attack, art)
  } | null;
}

export interface PlayerStoreData {
    slots: Record<TerrainId, BoardSlot>;
}

export interface BoardSettings {
    // Layout Percentages
    slotHeightPercent: number; // 0.0 to 1.0 (relative to Screen Height)
    boardScale: number;
    boardX: number;
    boardY: number;

    // Slot Config
    slotAspectRatio: number;   // width / height
    
    // Rows
    playerRowY: number; // % of Viewport Height
    enemyRowY: number;

    // Gaps
    playerSlotGapPercent: number; // % of Viewport Width
    enemySlotGapPercent: number;

    // Power Circle Visuals
    powerCircleOffsetX: number;
    powerCircleOffsetY: number;
    powerCircleRadius: number;
    powerCircleFontSize: number;
    powerCircleStrokeWidth: number;
    powerCircleFlipPositions: boolean;
    
    // Power Circle Colors
    powerCirclePlayerColor: string; // Hex
    powerCircleEnemyColor: string;  // Hex
    powerCircleStrokeColor: string; // Hex
    powerCircleWinningStrokeColor: string; // Hex
    powerCircleWinningGlowColor: string; // Hex

    // Power Circle Scales & Animations
    powerCircleScaleContested: number;
    powerCircleScaleWinning: number;
    powerCircleWinGlowScaleMin: number;
    powerCircleWinGlowScaleMax: number;
    powerCircleWinGlowSpeed: number;
    powerCircleTextStrokeWidth: number; // Pixels
    powerCircleTextStrokeColor: string; // Hex

    // Slot Visuals
    slotTargetColor: string; // Hex
    slotDropColor: string;   // Hex
    slotGlowRadius: number;
    slotGlowIntensity: number; // 0-1 alpha
    slotPulseSpeed: number;    // seconds

    // Card Margins (New)
    cardMarginTop: number;
    cardMarginBottom: number;
    cardMarginLeft: number;
    cardMarginRight: number;

    // Score Totals
    scoreTotalXOffset: number; // Distance from center
    scoreTotalYOffset: number; // Vertical offset from row center
    scoreTotalScale: number;

    // Slot Modifier Visuals
    slotModifierOffsetX: number;
    slotModifierOffsetY: number;
    slotModifierFontSize: number;
    slotModifierFontColor: string; // Hex (Default/Neutral)
    slotModifierPositiveColor: string; // Hex
    slotModifierNegativeColor: string; // Hex
    slotModifierStrokeColor: string; // Hex
    slotModifierStrokeWidth: number;

    // Animation Settings
    animationSettings: {
        playerPlay: AnimationConfig;
        opponentPlay: AnimationConfig;
    };

    // Pass Button Settings
    passButtonSettings: {
        // Position percentage (0-100)
        x: number;
        y: number;
        
        colors: {
            pass: string;
            passClicked: string;
            done: string;
            doneClicked: string;
            cancel: string;
            cancelClicked: string;
            text: string;
        };
        
        glow: {
            radius: number;
            intensity: number;
            color: string; // Typically matches mode color, but user said "glowing properties here as well (don't need them to be per mode. config are for all modes)"
            // Wait, "I want it to be glowing when its Normal status"
            // "don't need them to be per mode. config are for all modes" -> So one glow config
            speed: number;
        };
        
        scale: number;
    };

    // Hand Tooltip Settings (Keywords & Relative Position)
    handTooltipSettings: {
        show: boolean;
        offsetX: number;
        offsetY: number;
        width: number;
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
    };

    // Board Tooltip Config (Global Preview)
    boardTooltipScale: number;
    boardTooltipGap: number; // Single offset X (Left/Right alignment)
    boardTooltipOffsetY: number; // Vertical offset
}

export interface AnimationConfig {
    hoverScale: number;
    hoverOffsetX: number;  // Pixels relative to target X
    hoverOffsetY: number;  // Pixels relative to target Y
    waitDuration: number;  // Seconds
    slamDuration: number;  // Seconds
    slamScalePeak: number;
    slamScaleLand: number;
    
    // New Sequencing & Timing
    moveDuration: number; // Seconds (Time to travel to hover position)
    moveEase: string;
    triggerNextOn: 'start' | 'moveDone' | 'hoverDone' | 'slamDone';
    slamEase: string;
}

export interface DragState {
  isDragging: boolean;
  cardId: string | null;
  hoveredSlot: { playerId: PlayerId, terrainId: TerrainId } | null;
}

interface GameState {
  // Current Board State
  players: Record<PlayerId, PlayerStoreData>;

  boardSettings: BoardSettings;
  dragState: DragState;
  hoveredCard: CardInstance | null; // Added
  
  // Opponent Hand
  opponentCards: any[]; // Using any[] temporarily if CardInstance not imported, or update import
  setOpponentCards: (cards: any[]) => void;

  
  // Actions
  registerSlot: (slot: Omit<BoardSlot, 'id'>) => void;
  updateSlotPosition: (playerId: PlayerId, terrainId: TerrainId, x: number, y: number, width: number, height: number) => void;
  
  // Interactions
  setHoveredSlot: (slot: { playerId: PlayerId, terrainId: TerrainId } | null) => void;
  setHoveredCard: (card: CardInstance | null) => void; // Added
  setSlotStatus: (targets: { playerId: PlayerId, terrainId: TerrainId }[], status: 'idle' | 'showDrop' | 'showTarget') => void;
  setSlotPower: (targets: { playerId: PlayerId, terrainId: TerrainId }[], power: number, state: 'none' | 'contested' | 'winning') => void;
  setSlotModifier: (targets: { playerId: PlayerId, terrainId: TerrainId }[], modifier: number) => void; // Added
  resetSlotStatus: () => void; // Reset all to idle

  occupySlot: (playerId: PlayerId, terrainId: TerrainId, cardId: string, instance?: CardInstance) => void;
  clearSlot: (playerId: PlayerId, terrainId: TerrainId) => void;

  // Settings
  updateBoardSettings: (settings: Partial<BoardSettings>) => void;
  setDragState: (state: Partial<DragState>) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    // Initial State
    players: {
        0: { slots: {} as Record<TerrainId, BoardSlot> },
        1: { slots: {} as Record<TerrainId, BoardSlot> }
    },
    boardSettings: {
        boardScale: 0.9,
        boardX: 0,
        boardY: 0,
        slotHeightPercent: 0.25,
        slotAspectRatio: 0.8,
        playerRowY: 0.65, // Lower half
        enemyRowY: 0.30,  // Upper half
        playerSlotGapPercent: 0.025,
        enemySlotGapPercent: 0.025,
        
        // Power Circle Defaults
        powerCircleOffsetX: 0,
        powerCircleOffsetY: 0,
        powerCircleRadius: 24,
        powerCircleFontSize: 25,
        powerCircleStrokeWidth: 4,
        powerCircleFlipPositions: false,

        // Power Circle Colors Defaults
        powerCirclePlayerColor: '#3b82f6', // Blue-500
        powerCircleEnemyColor: '#f97316',  // Orange-500
        powerCircleStrokeColor: '#000000', // Black
        powerCircleWinningStrokeColor: '#ffd700', // Gold
        powerCircleWinningGlowColor: '#ffd700', // Gold

        // Power Circle Scales & Animations Defaults
        powerCircleScaleContested: 1.0,
        powerCircleScaleWinning: 1.1,
        powerCircleWinGlowScaleMin: 1.4,
        powerCircleWinGlowScaleMax: 1.7,
        powerCircleWinGlowSpeed: 2.0,
        powerCircleTextStrokeWidth: 1.0, // Default stroke
        powerCircleTextStrokeColor: '#000000', // Default black

        // Slot Visuals Defaults
        slotTargetColor: '#facc15', // Yellow-400
        slotDropColor: '#60a5fa',   // Blue-400
        slotGlowRadius: 10,
        slotGlowIntensity: 0.5,
        slotPulseSpeed: 1.1,

        // Card Margins Defaults
        cardMarginTop: 0.03,
        cardMarginBottom: 0.03,
        cardMarginLeft: 0.03,
        cardMarginRight: 0.03,

        // Board Tooltip Defaults
        boardTooltipScale: 1.0,
        boardTooltipLeftOffsetX: -20, // Default for when tooltip is on the Left
        boardTooltipRightOffsetX: 20, // Default for when tooltip is on the Right

        // Score Totals Defaults
        scoreTotalXOffset: 600, // Roughly outside the 5 slots
        scoreTotalYOffset: 0,
        scoreTotalScale: 1.0,

        // Slot Modifier Defaults
        slotModifierOffsetX: 0,
        slotModifierOffsetY: 140, 
        slotModifierFontSize: 48,
        slotModifierFontColor: '#ffffff',
        slotModifierPositiveColor: '#4ade80', // Green-400
        slotModifierNegativeColor: '#f87171', // Red-400
        slotModifierStrokeColor: '#000000',
        slotModifierStrokeWidth: 2,

        animationSettings: {
            playerPlay: {
                hoverScale: 1.2,
                hoverOffsetX: 0,
                hoverOffsetY: -75,
                waitDuration: 0.5,
                slamDuration: 0.2,
                slamScalePeak: 1.5,
                slamScaleLand: 1,
                moveDuration: 0.15,
                moveEase: "easeOut",
                triggerNextOn: "hoverDone",
                slamEase: "easeIn"
            },
            opponentPlay: {
                hoverScale: 1.2,
                hoverOffsetX: 0,
                hoverOffsetY: -75,
                waitDuration: 0.5,
                slamDuration: 0.2,
                slamScalePeak: 1.5,
                slamScaleLand: 1,
                moveDuration: 0.25,
                moveEase: "easeOut",
                triggerNextOn: "slamDone",
                slamEase: "easeIn"
            }
        },

        passButtonSettings: {
            x: 90, // Bottom-rightish
            y: 90,
            colors: {
                pass: '#3b82f6',   // Blue
                passClicked: '#2563eb', // Blue-600
                done: '#10b981',   // Green
                doneClicked: '#059669', // Green-600
                cancel: '#ef4444', // Red
                cancelClicked: '#b91c1c', // Red-700
                text: '#ffffff'
            },
            glow: {
                radius: 15,
                intensity: 0.6,
                color: '#ffffff',
                speed: 1.5
            },
            scale: 1.0
        },

        // Hand Tooltip Defaults
        handTooltipSettings: {
            show: true,
            offsetX: 100,
            offsetY: 0,
            width: 250,
            backgroundColor: '#1c1917', // stone-900
            borderColor: '#44403c',     // stone-700
            borderWidth: 1
        },

        // Board Tooltip Defaults
        boardTooltipScale: 0.35,
        boardTooltipGap: 20,
        boardTooltipOffsetY: 0
    },
    dragState: {
        isDragging: false,
        cardId: null,
        hoveredSlot: null
    },

    hoveredCard: null,


    // Opponent Hand Implementation
    opponentCards: [],
    setOpponentCards: (cards) => set({ opponentCards: cards }),
    // Actions
    registerSlot: (slotData) => set((state) => {
        const { playerId, terrainId } = slotData;
        const newPlayers = { ...state.players };
        
        // Ensure player structure exists (it should from initial state, but helpful for safety)
        if (!newPlayers[playerId]) newPlayers[playerId] = { slots: {} as Record<TerrainId, BoardSlot> };

        newPlayers[playerId].slots = {
            ...newPlayers[playerId].slots,
            [terrainId]: {
                ...slotData,
                modifier: 0, // Initialize
                id: `${playerId}_${terrainId}` // Set the composite ID here
            } as BoardSlot
        };

        return { players: newPlayers };
    }),

    updateSlotPosition: (playerId, terrainId, x, y, width, height) => set((state) => {
        const player = state.players[playerId];
        if (!player || !player.slots[terrainId]) return {}; // No change

        const updatedSlots = {
            ...player.slots,
            [terrainId]: { ...player.slots[terrainId], x, y, width, height }
        };

        return {
            players: {
                ...state.players,
                [playerId]: { ...player, slots: updatedSlots }
            }
        };
    }),
    
    setHoveredSlot: (hoveredSlot) => set((state) => ({ 
        dragState: { ...state.dragState, hoveredSlot } 
    })),

    setHoveredCard: (card) => set({ hoveredCard: card }),

    setSlotStatus: (targets, status) => set((state) => {
        const newPlayers = { ...state.players };
        targets.forEach(({ playerId, terrainId }) => {
            if (newPlayers[playerId] && newPlayers[playerId].slots[terrainId]) {
                // Ensure we spread correctly to trigger updates
                newPlayers[playerId] = { 
                    ...newPlayers[playerId],
                    slots: {
                        ...newPlayers[playerId].slots,
                        [terrainId]: { ...newPlayers[playerId].slots[terrainId], status }
                    }
                };
            }
        });
        return { players: newPlayers };
    }),

    setSlotPower: (targets, power, powerState) => set((state) => {
        const newPlayers = { ...state.players };
        targets.forEach(({ playerId, terrainId }) => {
            if (newPlayers[playerId] && newPlayers[playerId].slots[terrainId]) {
                newPlayers[playerId] = { 
                    ...newPlayers[playerId],
                    slots: {
                        ...newPlayers[playerId].slots,
                        [terrainId]: { ...newPlayers[playerId].slots[terrainId], power, powerState }
                    }
                };
            }
        });
        return { players: newPlayers };
    }),

    setSlotModifier: (targets, modifier) => set((state) => {
        const newPlayers = { ...state.players };
        targets.forEach(({ playerId, terrainId }) => {
            if (newPlayers[playerId] && newPlayers[playerId].slots[terrainId]) {
                newPlayers[playerId] = { 
                    ...newPlayers[playerId],
                    slots: {
                        ...newPlayers[playerId].slots,
                        [terrainId]: { ...newPlayers[playerId].slots[terrainId], modifier }
                    }
                };
            }
        });
        return { players: newPlayers };
    }),

    resetSlotStatus: () => set((state) => {
        const newPlayers = { ...state.players };
        
        // Reset ALL slots for both players
        ([0, 1] as PlayerId[]).forEach(pid => {
            const playerSlots = newPlayers[pid]?.slots;
            if (playerSlots) {
                // Need to iterate keys of the record
                (Object.keys(playerSlots) as unknown as TerrainId[]).forEach(tid => {
                    playerSlots[tid] = { ...playerSlots[tid], status: 'idle' };
                });
            }
        });
        
        return { players: newPlayers };
    }),

    occupySlot: (playerId: PlayerId, terrainId: TerrainId, cardId: string, instance?: CardInstance) => set((state) => {
        const p = state.players[playerId];
        if (!p || !p.slots[terrainId]) return {};

        return {
            players: {
                ...state.players,
                [playerId]: {
                    ...p,
                    slots: {
                        ...p.slots,
                        [terrainId]: {
                            ...p.slots[terrainId],
                            content: { cardId, instance },
                            status: 'idle'
                        }
                    }
                }
            }
        };
    }),

    clearSlot: (playerId, terrainId) => set((state) => {
        const p = state.players[playerId];
        if (!p || !p.slots[terrainId]) return {};

        return {
            players: {
                ...state.players,
                [playerId]: {
                    ...p,
                    slots: {
                        ...p.slots,
                        [terrainId]: {
                            ...p.slots[terrainId],
                            content: null
                        }
                    }
                }
            }
        };
    }),

    updateBoardSettings: (settings) => set((state) => ({
        boardSettings: { ...state.boardSettings, ...settings }
    })),

    setDragState: (newState) => set((state) => ({
        dragState: { ...state.dragState, ...newState }
    })),
}));
