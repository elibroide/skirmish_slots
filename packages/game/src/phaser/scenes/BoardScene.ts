import { Scene } from 'phaser';
import { useGameStore } from '../../store/gameStore';
import cardData from '../../ui/Data/order.json';

interface SlotVisuals {
    graphics: Phaser.GameObjects.Graphics;
    unit?: Phaser.GameObjects.Image;
    currentStatus?: string; 
    powerCircle?: Phaser.GameObjects.Graphics;
    powerText?: Phaser.GameObjects.Text;
}

export class BoardScene extends Scene {
    private slotVisualMap = new Map<number, SlotVisuals>();
    // ... existing subscription properties ...
    private settingsUnsubscribe: (() => void) | null = null;
    private slotsUnsubscribe: (() => void) | null = null;
    private dragUnsubscribe: (() => void) | null = null;

    constructor() {
        super('BoardScene');
    }

    preload() {
        // Load the specialized texture atlas for unit tiles
        this.load.atlas('tiles_atlas', '/tiles/texture.png', '/tiles/texture.json');
    }

    create() {
        if (this.textures.exists('tiles_atlas')) {
            const texture = this.textures.get('tiles_atlas');
            texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        }

        this.updateBoardLayout();

         // Subscribe to Board Settings changes
         this.settingsUnsubscribe = useGameStore.subscribe((state, prevState) => {
            if (state.boardSettings !== prevState.boardSettings) {
                 this.updateBoardLayout();
            }
        });

        // Subscribe to Slots changes (Content)
        this.slotsUnsubscribe = useGameStore.subscribe((state, prevState) => {
            if (state.slots !== prevState.slots) {
                this.updateBoardLayout();
            }
        });

        // Subscribe to Drag State changes
        this.dragUnsubscribe = useGameStore.subscribe((state, prevState) => {
            if (state.dragState !== prevState.dragState) {
                this.updateBoardLayout();
            }
        });

        this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
        this.events.on(Phaser.Scenes.Events.DESTROY, this.onShutdown, this);
    }

    // ... update() ...

    updateBoardLayout() {
       // DISABLED: Migrated to React (GameBoard.tsx + Slot.tsx)
       // This scene is now effectively empty but kept for structural integrity if needed later.
       return;

        const state = useGameStore.getState();
        const settings = state.boardSettings;
        const slotsState = state.slots;
        
        const { width, height } = this.scale;
        const { slotHeightPercent, slotAspectRatio, playerSlotGapPercent, enemySlotGapPercent, playerRowY, enemyRowY } = settings;
        
        // ... Dimension calcs (lines 73-86) ...
        const sHeight = height * slotHeightPercent; 
        const sWidth = sHeight * slotAspectRatio;

        // Enemy Layout
        const sGapEnemy = width * enemySlotGapPercent;
        const totalEnemyWidth = (5 * sWidth) + (4 * sGapEnemy);
        const startXEnemy = (width - totalEnemyWidth) / 2 + (sWidth / 2);
        const enemyY = height * enemyRowY;

        // Player Layout
        const sGapPlayer = width * playerSlotGapPercent;
        const totalPlayerWidth = (5 * sWidth) + (4 * sGapPlayer);
        const startXPlayer = (width - totalPlayerWidth) / 2 + (sWidth / 2);
        const playerY = height * playerRowY;

        const updateSlot = (id: number, baseX: number, baseY: number, baseW: number, baseH: number, owner: 'player' | 'enemy') => {
            // Check visuals
            let visuals = this.slotVisualMap.get(id);
            if (!visuals) {
                 const graphics = this.add.graphics();
                 visuals = { graphics };
                 this.slotVisualMap.set(id, visuals);
            }

            const graphics = visuals.graphics;
            
            // --- 0. Dimensions ---
            const rectX = baseX - baseW / 2;
            const rectY = baseY - baseH / 2;

            // --- 1. State ---
            const slotData = slotsState[id];
            
            // Get Current Slot Local State for Visuals
            const currentSlot = slotData;

            // Status driven logic
            const status = currentSlot?.status || 'idle';
            
            // Clear
            graphics.clear();

            // State Logic
            if (status === 'idle') {
                // Idle Style
                graphics.lineStyle(2, 0xffffff, 0.4);
                graphics.strokeRoundedRect(rectX, rectY, baseW, baseH, 12);
            } else {
                // Active State (Target or Drop)
                const isTarget = status === 'showTarget';
                const color = isTarget ? 0xfacc15 : 0x60a5fa; // Yellow vs Blue
                const alpha = isTarget ? 1 : 0.8;
                
                // Draw Fill
                graphics.fillStyle(color, isTarget ? 0.2 : 0.1);
                graphics.fillRoundedRect(rectX, rectY, baseW, baseH, 12);

                // Draw Stroke
                graphics.lineStyle(isTarget ? 4 : 3, color, alpha);
                graphics.strokeRoundedRect(rectX, rectY, baseW, baseH, 12);
            }

            visuals.currentStatus = status;

            // --- 2. Unit Content ---
            let contentName: string | undefined;

             if (slotData && slotData.content) {
                const cardDef = cardData.cards.find(c => c.id === slotData.content!.cardId);
                if (cardDef) {
                    contentName = cardDef.data.name + '.board.png';
                }
            }
            
            // ... (Unit rendering Logic same as before) ...
            const atlasKey = 'tiles_atlas';
            let frameExists = false;
            // ...
            if (contentName && this.textures.exists(atlasKey)) {
                 frameExists = this.textures.get(atlasKey).has(contentName);
            }

            if (contentName && frameExists) {
                if (!visuals.unit) {
                    visuals.unit = this.add.image(baseX, baseY, atlasKey, contentName);
                }
                
                visuals.unit.setVisible(true);
                visuals.unit.setTexture(atlasKey, contentName); 
                visuals.unit.setPosition(baseX, baseY);
                
                // --- 3. Scale with Margins ---
                const { cardMarginTop, cardMarginBottom, cardMarginLeft, cardMarginRight } = settings;
                
                const availW = baseW * (1 - (cardMarginLeft + cardMarginRight));
                const availH = baseH * (1 - (cardMarginTop + cardMarginBottom));
                
                const left = rectX + (baseW * cardMarginLeft);
                const top = rectY + (baseH * cardMarginTop);
                
                const centerX = left + availW / 2;
                const centerY = top + availH / 2;
                
                visuals.unit.setPosition(centerX, centerY);

                const unitW = visuals.unit.width;
                const unitH = visuals.unit.height;
                
                const scaleX = availW / unitW;
                const scaleY = availH / unitH;
                const scale = Math.min(scaleX, scaleY);
                
                visuals.unit.setScale(scale);
                
            } else {
                if (visuals.unit) visuals.unit.setVisible(false);
            }

            // --- 4. Store Update (Layout Reporting) ---
            if (!currentSlot || 
                Math.abs(currentSlot.x - baseX) > 0.1 || 
                Math.abs(currentSlot.y - baseY) > 0.1 ||
                Math.abs(currentSlot.width - baseW) > 0.1 ||
                Math.abs(currentSlot.height - baseH) > 0.1 ||
                currentSlot.status !== status) { // Also update if status changed locally?? No, store is source of truth.
                
                // We update the store if the Phaser POSITION differs from Store Position.
                // We do NOT update the store with the status, because the store GAVE us the status.
                // BUT we need to construct the object correctly.
                
                useGameStore.getState().registerSlot({
                    id,
                    owner,
                    x: baseX,
                    y: baseY,
                    width: baseW,
                    height: baseH,
                    content: slotData?.content || null,
                     // We must persist the status back, otherwise it might get overwritten by 'idle' if we default it here?
                     // registerSlot does: [slot.id]: { ...slot, status: 'idle' } in my previous edit?
                     // WAIT. If registerSlot forces 'idle', we are breaking the status!
                     // I should fix registerSlot to preserve existing status if available, or accept status in payload.
                     
                     status: slotData?.status || 'idle', // Pass current status back so we don't clobber it
                     power: slotData?.power || 0,
                     powerState: slotData?.powerState || 'none'
                });
            }
            // --- 5. Power Circle ---
            const power = slotData?.power || 0;
            const powerState = slotData?.powerState || 'none';

            if (!visuals.powerCircle) {
                visuals.powerCircle = this.add.graphics();
                visuals.powerText = this.add.text(0, 0, '', {
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                // Ensure depth is high enough
                visuals.powerCircle.setDepth(10);
                visuals.powerText.setDepth(11);
            }

            visuals.powerCircle.setVisible(true);
            if (visuals.powerText) visuals.powerText.setVisible(true);

            const circleGraphics = visuals.powerCircle;
            circleGraphics.clear();

            const circleColor = owner === 'player' ? 0x3b82f6 : 0xf97316; // Blue vs Orange // Colors OK!
            const circleRadius = settings.powerCircleRadius;
            
            // Position
            const slotTopY = baseY - (baseH / 2);
            const circleY = slotTopY + settings.powerCircleOffsetY;
            const circleX = baseX + settings.powerCircleOffsetX;
            
            // Draw Circle
            circleGraphics.fillStyle(circleColor, 1);
            circleGraphics.fillCircle(circleX, circleY, circleRadius);

            // Helper for Winning State (Glow/Stroke)
            if (powerState === 'winning') {
                circleGraphics.lineStyle(settings.powerCircleStrokeWidth, 0xffd700, 1); // Gold stroke
                circleGraphics.strokeCircle(circleX, circleY, circleRadius);
            } else {
                 // Contested & None - neutral border
                circleGraphics.lineStyle(2, 0x000000, 0.5); 
                circleGraphics.strokeCircle(circleX, circleY, circleRadius);
            }

            if (visuals.powerText) {
                visuals.powerText.setText(power.toString());
                visuals.powerText.setPosition(circleX, circleY);
                visuals.powerText.setFontSize(settings.powerCircleFontSize);
                
                // Center align text
                visuals.powerText.setOrigin(0.5);
            }
        };
        
        // Loop over slots
        for (let i = 0; i < 5; i++) {
            updateSlot(i, startXEnemy + i * (sWidth + sGapEnemy), enemyY, sWidth, sHeight, 'enemy');
        }
        for (let i = 0; i < 5; i++) {
            updateSlot(i + 5, startXPlayer + i * (sWidth + sGapPlayer), playerY, sWidth, sHeight, 'player');
        }
    }

    onShutdown() {
        if (this.settingsUnsubscribe) { this.settingsUnsubscribe(); this.settingsUnsubscribe = null; }
        if (this.slotsUnsubscribe) { this.slotsUnsubscribe(); this.slotsUnsubscribe = null; }
        if (this.dragUnsubscribe) { this.dragUnsubscribe(); this.dragUnsubscribe = null; }
    }
}
