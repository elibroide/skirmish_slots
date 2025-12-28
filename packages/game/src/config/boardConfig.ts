// Defines the visual and layout configuration for the board and its elements
export interface WinRecordSettings {
    show: boolean;
    // Base Positioning (Group)
    playerOffsetX: number;
    playerOffsetY: number;
    opponentOffsetX: number;
    opponentOffsetY: number;

    // Screen Positioning (%)
    playerXPercent: number;
    playerYPercent: number;
    opponentXPercent: number;
    opponentYPercent: number;

    // Element Positioning (Relative)
    playerTextOffsetX: number;
    playerTextOffsetY: number;
    playerRhombusOffsetX: number;
    playerRhombusOffsetY: number;
    
    opponentTextOffsetX: number;
    opponentTextOffsetY: number;
    opponentRhombusOffsetX: number;
    opponentRhombusOffsetY: number;

    scale: number;
    spacingX: number;
    emptyColor: string;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    playerTextColor: string;
    opponentTextColor: string;
    invertOpponent: boolean;
    fontSize: number;
    rhombusScale: number;
}

// Hand Settings (Migrated from Card.tsx)
export interface HandSettings {
    fanSpacing: number;
    fanRotation: number;
    fanArcHeight: number;
    // Manual Squeeze Controls
    maxCardsSqueeze: number;
    squeezeSpacing: number;
    squeezeRotation: number;
    squeezeArcHeight: number;
    hoverLift: number;
    hoverScale: number;
    hoverTransitionDuration: number;
    dragThresholdY: number;
    dragScale: number;
    tiltMaxAngle: number;
    tiltSensitivity: number;
    tiltSmoothing: number;
    tiltReturnSpeed: number;
    velocityDecay: number;
    tiltVelocityThreshold: number;
    returnDuration: number;
    returnSpringiness: number;

    // Slam Animation (Anticipation -> Impact)
    slamDuration: number;    // Total time for the slam sequence
    slamScalePeak: number;   // Max scale during anticipation
    slamScaleLand: number;   // Final scale (or scale just before impact)
    slamHeight: number;      // How high it lifts during anticipation

    // Size & Scale
    cardScale: number; // Controls the base size relative to 750x1050

    hitAreaWidth: number;
    hitAreaHeight: number;
    showHitAreas: boolean;
    perspective: number;

    // Glow Settings
    glowColorPlayable: string;
    glowColorDragging: string;
    glowColorTargeting: string;

    // Back-Glow Geometry
    glowExpLeft: number;
    glowExpRight: number;
    glowExpTop: number;
    glowExpBottom: number;
    glowCornerRadius: number; // 0 = sharp
    glowOffsetX: number; // Global shift
    glowOffsetY: number; // Global shift
    glowOpacity: number; // Edge/Pulse opacity
    fillOpacity: number; // Solid rect opacity
    glowPulseSpeed: number; // 0 = no pulse
    glowBlur: number; // Edge softness

    // Debug
    debugForcePlayable: boolean;

    // Positioning
    baseX: number; // % from left
    baseY: number; // px from bottom

    // Facedown (Opponent) Positioning
    facedownBaseX: number; // % from left
    facedownBaseY: number; // px from Top (usually)
}

export type TurnStatus = 'none' | 'turn' | 'done' | 'last_say';

export interface TurnIndicatorSettings {
    show: boolean;

    // Positioning
    playerXPercent: number;
    playerYPercent: number;
    playerOffsetX: number;
    playerOffsetY: number;

    opponentXPercent: number;
    opponentYPercent: number;
    opponentOffsetX: number;
    opponentOffsetY: number;

    // Styling
    fontSize: number;
    playerTextColor: string;
    opponentTextColor: string;
    
    // Status Logic
    // We can add more here if needed, e.g. custom text overrides
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

export interface BoardSettings {
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
            conclude: string;
            concludeClicked: string;
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
    boardTooltipLeftOffsetX: number; 
    boardTooltipRightOffsetX: number;
    boardTooltipGap: number; // Single offset X (Left/Right alignment)
    boardTooltipOffsetY: number; // Vertical offset

    // Win Record Visuals
    winRecordSettings: WinRecordSettings;
    
    // Turn Indicators
    turnIndicatorSettings: TurnIndicatorSettings;

    // Hand Settings (Consolidated)
    handSettings: HandSettings;
}

export const defaultBoardSettings: BoardSettings = {
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
    boardTooltipScale: 0.35,
    boardTooltipLeftOffsetX: -20, // These two missing defined
    boardTooltipRightOffsetX: 20,
    boardTooltipGap: 20,
    boardTooltipOffsetY: 0,

    // Slot Modifier Defaults
    slotModifierOffsetX: 0,
    slotModifierOffsetY: 130, 
    slotModifierFontSize: 32,
    slotModifierFontColor: '#ffffff',
    slotModifierPositiveColor: '#4ade80', // Green-400
    slotModifierNegativeColor: '#f87171', // Red-400
    slotModifierStrokeColor: '#000000',
    slotModifierStrokeWidth: 0,

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
            conclude: '#a855f7', // Purple-500
            concludeClicked: '#7e22ce', // Purple-700
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

    // Win Record Defaults
    winRecordSettings: {
        show: true,
        playerOffsetX: 0,
        playerOffsetY: 0,
        opponentOffsetX: 0,
        opponentOffsetY: 0,
        playerXPercent: 5,
        playerYPercent: 95,
        opponentXPercent: 5,
        opponentYPercent: 4,
        playerTextOffsetX: 28,
        playerTextOffsetY: 0,
        playerRhombusOffsetX: 30,
        playerRhombusOffsetY: -40,
        opponentTextOffsetX: 62,
        opponentTextOffsetY: 0,
        opponentRhombusOffsetX: 30,
        opponentRhombusOffsetY: 40,
        scale: 1,
        spacingX: 15,
        emptyColor: "#44403c",
        fillColor: "#fbbf24",
        strokeColor: "#ffffff",
        strokeWidth: 2,
        playerTextColor: "#3d91ff",
        opponentTextColor: "#f97316",
        invertOpponent: false,
        fontSize: 20,
        rhombusScale: 1
    },

    // Turn Indicator Defaults
    turnIndicatorSettings: {
        show: true,
        playerXPercent: 10,
        playerYPercent: 65,
        playerOffsetX: 0,
        playerOffsetY: 0,
        opponentXPercent: 10,
        opponentYPercent: 30,
        opponentOffsetX: 0,
        opponentOffsetY: 0,
        fontSize: 28,
        playerTextColor: "#3d91ff",
        opponentTextColor: "#f97316"
    },

    // Hand Settings Defaults (Mirrored from Card.tsx DEFAULT_SETTINGS)
    handSettings: {
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
        dragScale: 1.0,

        // Drag tilt physics
        tiltMaxAngle: 20,
        tiltSensitivity: 1.5,
        tiltSmoothing: 0.5,
        tiltReturnSpeed: 0.15,
        velocityDecay: 0.85,
        tiltVelocityThreshold: 2,

        // Return animation
        returnDuration: 0.15,
        returnSpringiness: 1.56,

        // Slam Animation
        slamDuration: 0.6,
        slamScalePeak: 1.5,
        slamScaleLand: 0.8,
        slamHeight: -100,

        // Size & Scale
        cardScale: 0.25,

        hitAreaWidth: 140,
        hitAreaHeight: 255,
        showHitAreas: false,

        // Visual
        perspective: 2000,

        // Glow Defaults
        glowColorPlayable: '#21b9c4',
        glowColorDragging: '#eab308',
        glowColorTargeting: '#ace708',

        // Back-Glow Defaults
        glowExpLeft: 4,
        glowExpRight: -9,
        glowExpTop: 2.5,
        glowExpBottom: 2.5,
        glowCornerRadius: 5,
        glowOffsetX: 0,
        glowOffsetY: 0,
        glowOpacity: 0.5,
        fillOpacity: 1,
        glowPulseSpeed: 1,
        glowBlur: 10,

        debugForcePlayable: false, // Default to FALSE for real game

        // Positioning
        baseX: 50,
        baseY: -150,

        // Facedown Defaults
        facedownBaseX: 0,
        facedownBaseY: -225, 
    }
};
