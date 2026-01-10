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
    glowMinBlur: number;
    glowMaxBlur: number;
    glowMinSpread: number;
    glowMaxSpread: number;
    
    // Independent Glow Geometry
    glowScaleX: number;
    glowScaleY: number;
    glowOffsetX: number;
    glowOffsetY: number;
    
    glowCornerRadius: number; // 0 = sharp
    glowPulseSpeed: number; // 0 = no pulse

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

    playerRowY: 0.65,
    enemyRowY: 0.3,

    playerSlotGapPercent: 0.025,
    enemySlotGapPercent: 0.025,

    powerCircleOffsetX: 0,
    powerCircleOffsetY: 0,
    powerCircleRadius: 24,
    powerCircleFontSize: 25,
    powerCircleStrokeWidth: 4,
    powerCircleFlipPositions: false,
    powerCirclePlayerColor: '#3b82f6',
    powerCircleEnemyColor: '#f97316',
    powerCircleStrokeColor: '#000000',
    powerCircleWinningStrokeColor: '#ffd700',
    powerCircleWinningGlowColor: '#ffd700',
    powerCircleScaleContested: 1,
    powerCircleScaleWinning: 1.1,
    powerCircleWinGlowScaleMin: 1.4,
    powerCircleWinGlowScaleMax: 1.7,
    powerCircleWinGlowSpeed: 2,
    powerCircleTextStrokeWidth: 1,
    powerCircleTextStrokeColor: '#000000',

    slotTargetColor: '#facc15',
    slotDropColor: '#60a5fa',
    slotGlowRadius: 10,
    slotGlowIntensity: 0.5,
    slotPulseSpeed: 1.1,
    
    cardMarginTop: 0.03,
    cardMarginBottom: 0.03,
    cardMarginLeft: 0.03,
    cardMarginRight: 0.03,
    
    boardTooltipScale: 0.35,
    boardTooltipLeftOffsetX: -20,
    boardTooltipRightOffsetX: 20,
    boardTooltipGap: 20,
    boardTooltipOffsetY: 0,

    slotModifierOffsetX: 0,
    slotModifierOffsetY: 130,
    slotModifierFontSize: 32,
    slotModifierFontColor: '#ffffff',
    slotModifierPositiveColor: '#4ade80',
    slotModifierNegativeColor: '#f87171',
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
            slamScaleLand: 1.0,
            moveDuration: 0.15,
            moveEase: 'easeOut',
            triggerNextOn: 'hoverDone',
            slamEase: 'easeIn'
        },
        opponentPlay: {
            hoverScale: 1.2,
            hoverOffsetX: 0,
            hoverOffsetY: -75,
            waitDuration: 0.5,
            slamDuration: 0.2,
            slamScalePeak: 1.5,
            slamScaleLand: 1.0,
            moveDuration: 0.25,
            moveEase: 'easeOut',
            triggerNextOn: 'slamDone',
            slamEase: 'easeIn'
        }
    },
    passButtonSettings: {
        x: 90,
        y: 90,
        colors: {
            pass: '#3b82f6',
            passClicked: '#2563eb',
            done: '#10b981',
            doneClicked: '#059669',
            cancel: '#ef4444',
            cancelClicked: '#b91c1c',
            conclude: '#a855f7',
            concludeClicked: '#7e22ce',
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
    handTooltipSettings: {
        show: true,
        offsetX: 100,
        offsetY: 0,
        width: 250,
        backgroundColor: '#1c1917',
        borderColor: '#44403c',
        borderWidth: 1
    },
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
        scale: 1.0,
        spacingX: 15,
        emptyColor: '#44403c',
        fillColor: '#fbbf24',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        playerTextColor: '#3d91ff',
        opponentTextColor: '#f97316',
        invertOpponent: false,
        fontSize: 20,
        rhombusScale: 1.0
    },
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
        playerTextColor: '#3d91ff',
        opponentTextColor: '#f97316'
    },
    handSettings: {
        fanSpacing: 105,
        fanRotation: 3.5,
        fanArcHeight: 3,
        maxCardsSqueeze: 8,
        squeezeSpacing: 10,
        squeezeRotation: 0.1,
        squeezeArcHeight: 0.3,
        hoverLift: 200,
        hoverScale: 1.65,
        hoverTransitionDuration: 0.15,
        dragThresholdY: 50,
        dragScale: 1.3,
        tiltMaxAngle: 90,
        tiltSensitivity: 1.5,
        tiltSmoothing: 0.5,
        tiltReturnSpeed: 0.15,
        velocityDecay: 0.6,
        tiltVelocityThreshold: 2,
        returnDuration: 0.15,
        returnSpringiness: 1.56,
        slamDuration: 0.6,
        slamScalePeak: 1.5,
        slamScaleLand: 0.8,
        slamHeight: -100,
        cardScale: 0.3,
        hitAreaWidth: 140,
        hitAreaHeight: 290,
        showHitAreas: false,
        perspective: 2000,
        glowColorPlayable: '#c7feff',
        glowColorDragging: '#eab308',
        glowColorTargeting: '#ace708',
        glowMinBlur: 5,
        glowMaxBlur: 5,
        glowMinSpread: 15,
        glowMaxSpread: 15,
        glowScaleX: 0.78,
        glowScaleY: 0.86,
        glowOffsetX: 0,
        glowOffsetY: 2,
        glowCornerRadius: 2,
        glowPulseSpeed: 0.5,
        debugForcePlayable: false,
        baseX: 50,
        baseY: -200,
        facedownBaseX: 0,
        facedownBaseY: -300
    }
};
