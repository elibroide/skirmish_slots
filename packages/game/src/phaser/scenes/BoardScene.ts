import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

export class BoardScene extends Phaser.Scene {
  private unsubscribeStore: (() => void) | null = null;
  private units: Map<number, Phaser.GameObjects.Container> = new Map();

  constructor() {
    super({ key: 'BoardScene' });
  }

  preload() {
    // We will load real assets here later.
    // For now, we use Phaser primitives.
  }

  create() {
    this.createBoardLayout();
    
    // Subscribe to store changes to render units
    this.unsubscribeStore = useGameStore.subscribe((state) => {
      this.syncUnits(state.slots);
    });

    // Clean up listener when scene is destroyed
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.events.on(Phaser.Scenes.Events.DESTROY, this.onShutdown, this);
  }

  private createBoardLayout() {
    const { width, height } = this.scale;
    const SLOT_WIDTH = 120;
    const SLOT_HEIGHT = 160;
    const GAP = 20;
    const TOTAL_WIDTH = (SLOT_WIDTH * 5) + (GAP * 4);
    const START_X = (width - TOTAL_WIDTH) / 2 + SLOT_WIDTH / 2;
    
    // Enemy Row (Top)
    const ENEMY_Y = height * 0.25;
    for (let i = 0; i < 5; i++) {
        this.createSlot(i, START_X + i * (SLOT_WIDTH + GAP), ENEMY_Y, 'enemy', SLOT_WIDTH, SLOT_HEIGHT);
    }

    // Player Row (Bottom)
    const PLAYER_Y = height * 0.55; // Slightly lower than center
    for (let i = 0; i < 5; i++) {
        // IDs 5-9 are player slots
        this.createSlot(i + 5, START_X + i * (SLOT_WIDTH + GAP), PLAYER_Y, 'player', SLOT_WIDTH, SLOT_HEIGHT);
    }

    // Divider Line
    this.add.line(0, 0, 0, height * 0.4, width, height * 0.4, 0xffffff, 0.1).setOrigin(0);
  }

  private createSlot(id: number, x: number, y: number, owner: 'player' | 'enemy', width: number, height: number) {
    // Visuals
    const color = owner === 'player' ? 0x3b82f6 : 0xef4444;
    const slotValues = this.add.rectangle(x, y, width, height, color, 0.1);
    slotValues.setStrokeStyle(2, color, 0.3);

    // Register with Store so React knows where this is
    // We need to convert to absolute DOM coordinates if the canvas is scaled,
    // but for now assuming 1:1 pixel match or handling scaling in the drop logic.
    useGameStore.getState().registerSlot({
      id,
      owner,
      x: x, // Center X
      y: y, // Center Y
      width,
      height,
      content: null
    });
  }

  private syncUnits(slots: Record<number, any>) {
    if (!this.scene.isActive()) return; // Safety check

    Object.values(slots).forEach(slot => {
       const existingUnit = this.units.get(slot.id);
       
       // Case 1: Slot has content, but no visual unit -> SPAWN
       if (slot.content && !existingUnit) {
          this.spawnUnit(slot);
       }
       
       // Case 2: Slot is empty, but has visual unit -> DESPAWN
       if (!slot.content && existingUnit) {
          existingUnit.destroy();
          this.units.delete(slot.id);
       }
    });
  }

  private spawnUnit(slot: any) {
    if (!this.add) return; // Extra safety

    // 1. Create Container
    const unit = this.add.container(slot.x, slot.y);
    
    // 2. Add Visuals (Simple Rect + Text for now)
    const color = slot.owner === 'player' ? 0x60a5fa : 0xf87171;
    const bg = this.add.rectangle(0, 0, slot.width - 10, slot.height - 10, color);
    const text = this.add.text(0, 0, "UNIT", { 
        fontSize: '20px', 
        fontStyle: 'bold',
        color: '#ffffff'
    }).setOrigin(0.5);

    unit.add([bg, text]);
    
    // 3. Impact FX
    this.playImpactFx(slot.x, slot.y, color);

    this.units.set(slot.id, unit);
  }

  private playImpactFx(x: number, y: number, color: number) {
    // Shake Camera
    this.cameras.main.shake(100, 0.005);

    // Particle Burst (Simple circle expansion for now)
    const circle = this.add.circle(x, y, 10, 0xffffff);
    this.tweens.add({
        targets: circle,
        scale: 10,
        alpha: 0,
        duration: 300,
        onComplete: () => circle.destroy()
    });
  }

  onShutdown() {
    if (this.unsubscribeStore) {
        this.unsubscribeStore();
        this.unsubscribeStore = null;
    }
  }
}
