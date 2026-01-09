import type { PlayerId, TerrainId, TargetInfo, GameState, UnitCard as IUnitCard, GameEvent } from '../../core/types';
import type { GameEngine } from '../../core/GameEngine';
import { PlayerGameEntity } from '../../entities/base/PlayerGameEntity';
import { RuleType, type RuleModifier, type SlotCoord } from '../../systems/rules/RuleTypes';
import type { Trait } from '../core/Trait';
/**
 * Base class for all cards
 * Extends GameEntity for common functionality (requestInput, engine access)
 */
export declare abstract class Card extends PlayerGameEntity {
    id: string;
    cardId: string;
    name: string;
    description: string;
    private eventUnsubscribers;
    constructor(cardId: string, name: string, description: string, owner: PlayerId, engine: GameEngine);
    /**
     * Get the type of this card
     */
    abstract getType(): 'unit' | 'action';
    /**
     * Does this card need a target to be played?
     */
    needsTarget(): boolean;
    /**
     * Get valid targets for this card
     */
    getValidTargets(state: GameState): TargetInfo;
    /**
     * Select a default target (for AI)
     */
    selectDefaultTarget(state: GameState): SlotCoord | null;
    /**
     * Register a rule modifier
     * @param type Rule type
     * @param modifier Modifier function
     */
    registerRule<T = boolean>(type: RuleType, modifier: RuleModifier<T>): void;
    /**
     * Unregister rules for this card
     * @param type Optional specific rule type to remove
     */
    unregisterRule(type?: RuleType): void;
    /**
     * Subscribe to a game event. Automatically unsubscribes on leave.
     * @param callback Event listener
     */
    subscribe(callback: (event: GameEvent) => void): void;
    /**
     * Unsubscribe from all registered events
     */
    unsubscribeAll(): void;
    /**
     * Override onLeave for base Card cleanup
     */
    onLeave(): void;
}
/**
 * Base class for unit cards
 * Now concrete - uses trait system for behavior composition
 */
export declare class UnitCard extends Card implements IUnitCard {
    readonly originalPower: number;
    private _damage;
    private _buffs;
    private _shield;
    private _terrainId;
    get damage(): number;
    get buffs(): number;
    get shield(): number;
    get terrainId(): TerrainId | null;
    private _hasDominant;
    private _dominantTriggered;
    get hasDominant(): boolean;
    get dominantTriggered(): boolean;
    set hasDominant(val: boolean);
    set dominantTriggered(val: boolean);
    traits: Trait[];
    rarity: 'Bronze' | 'Silver' | 'Gold';
    color: 'Red' | 'Purple';
    unitType: string;
    /**
     * Snapshot generation
     */
    toState(): import('../../core/types').UnitState;
    onLeave(): void;
    activateAbility?: {
        cooldownMax: number;
        cooldownRemaining: number;
        description: string;
        activate: () => void;
    };
    constructor(cardId: string, name: string, description: string, power: number, owner: PlayerId, engine: GameEngine);
    getType(): 'unit';
    /**
     * Get the current effective power of the unit
     */
    get power(): number;
    /**
     * Deploy this unit to a terrain.
     * Handles consumption of existing units automatically.
     */
    deploy(terrainId: TerrainId): Promise<void>;
    /**
     * Consume another unit (wrapper around death + event).
     */
    consume(victim: UnitCard): Promise<void>;
    /**
     * Die (remove from board -> graveyard).
     */
    die(cause?: string): Promise<void>;
    /**
     * Bounce back to hand.
     */
    bounce(): Promise<void>;
    /**
     * Move this unit to a different terrain slot (same player).
     * Does NOT trigger onDeploy - this is a repositioning, not deployment.
     */
    move(targetTerrainId: TerrainId): Promise<void>;
    /**
     * Swap two units' positions (both must belong to same player).
     */
    static swap(unit1: UnitCard, unit2: UnitCard): Promise<void>;
    /**
     * Called when this unit is deployed to a terrain
     */
    onDeploy(): Promise<void>;
    /**
     * Called when this unit dies (any reason)
     */
    onDeath(): Promise<void>;
    /**
     * Called when this unit conquers its terrain
     */
    onConquer(): Promise<void>;
    /**
     * Called when this unit's power changes
     */
    onPowerChanged(_oldPower: number, _newPower: number): void;
    /**
     * Called at start of owner's turn (for cooldown reduction and turn-start triggers)
     */
    onTurnStart(): void;
    /**
     * Called when this unit is consumed (by another unit or action)
     */
    onConsumed?(consumingUnit: UnitCard | null): void;
    /**
     * Called when this unit consumes another unit
     */
    onConsume?(victim: UnitCard): void;
    /**
     * Check if this unit can activate its ability
     */
    canActivate(): boolean;
    /**
     * Activate this unit's ability
     */
    activate(): Promise<void>;
    /**
     * Reduce cooldown by 1 (called at start of owner's turn)
     */
    reduceCooldown(): Promise<void>;
    /**
     * Add a trait to this unit
     */
    addTrait(trait: Trait): void;
    /**
     * Remove a trait from this unit
     */
    removeTrait(traitId: string): void;
    /**
     * Add power to this unit (buff)
     */
    addPower(amount: number): Promise<void>;
    /**
     * Deal damage to this unit (reduce power)
     * Shield absorbs damage first before health is reduced
     */
    dealDamage(amount: number): Promise<void>;
    /**
     * Heal this unit (restore power up to original)
     * Note: Keep for future use, not used by V2 cards
     */
    heal(amount: number): Promise<void>;
    /**
     * Reset buffs (Cleanse effect)
     */
    resetBuffs(): Promise<void>;
    /**
     * Add shield to this unit
     * Shield absorbs damage before health is reduced
     */
    addShield(amount: number): Promise<void>;
    /**
     * Get close ally units (adjacent terrains)
     */
    getCloseAllies(): UnitCard[];
    /**
     * Get close enemy units (adjacent terrains)
     */
    getCloseEnemies(): UnitCard[];
    /**
     * Get unit in front (opposite player's unit on same terrain)
     */
    getUnitInFront(): UnitCard | null;
    /**
     * Check if this unit can be consumed
     * NOTE: This check doesn't include context (who is consuming), so it's a basic check.
     * Full validation happens in GameEngine using RuleManager.
     */
    canBeConsumed(): boolean;
}
/**
 * Base class for action cards
 */
export declare abstract class ActionCard extends Card {
    getType(): 'action';
    /**
     * Play this action card
     * Target parameter is now SlotCoord (if target was selected)
     */
    abstract play(target?: SlotCoord): Promise<void>;
}
