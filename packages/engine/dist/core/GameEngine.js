import { EventEmitter } from './EventEmitter';
import { EffectStack } from '../systems/EffectStack';
import { StateChecker } from '../systems/StateChecker';
import { getAdjacentTerrains, getOpponent } from './GameState';
import { RuleManager } from '../systems/rules/RuleManager';
import { RuleType } from '../systems/rules/RuleTypes';
import { Player } from '../entities/Player';
import { PlayCardEffect, ActivateEffect, PassEffect, ActivateLeaderEffect } from '../mechanics/effects';
import { GameLogger } from './logger/GameLogger';
import { SeededRNG } from './SeededRNG';
import { Game } from '../entities/Game';
import { Terrain } from '../entities/Terrain';
import { StateHasher } from '../systems/StateHasher';
import { getLeader, createLeaderState } from '../mechanics/leaders';
/**
 * Core game engine.
 * Processes actions, resolves effects, and emits events.
 */
export class GameEngine {
    // public state: GameState; // Replaced by getter
    get state() {
        return {
            players: [this.players[0].toState(), this.players[1].toState()],
            terrains: [
                this.terrains[0].toState(),
                this.terrains[1].toState(),
                this.terrains[2].toState(),
                this.terrains[3].toState(),
                this.terrains[4].toState()
            ],
            leaders: this.leaders,
            currentSkirmish: this.game.currentSkirmish,
            currentTurn: this.game.currentTurn,
            currentPlayer: this.game.currentPlayer,
            tieSkirmishes: this.game.tieSkirmishes,
            matchWinner: this.game.matchWinner
        };
    }
    constructor(controller0, controller1, options) {
        // Private backing fields for game state
        // These are the "Real" state sources now
        Object.defineProperty(this, "game", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Global Game Entity
        Object.defineProperty(this, "players", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Made public for internal legacy access, should be private eventually
        Object.defineProperty(this, "terrains", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "leaders", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // public currentSkirmish: number = 1; -- Moved to Game
        // public currentTurn: number = 1; -- Moved to Game
        // public currentPlayer: PlayerId = 0; -- Moved to Game
        // public tieSkirmishes: number = 0; -- Moved to Game
        // public matchWinner?: PlayerId; -- Moved to Game
        Object.defineProperty(this, "effectStack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ruleManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rng", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "eventEmitter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "actionEmitter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stateChecker", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "controllers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pendingInputResolve", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // this.state = {} as GameState; // Removed
        this.game = null; // Set in initializeGame
        this.players = [null, null];
        this.terrains = [null, null, null, null, null];
        this.leaders = [null, null];
        this.effectStack = new EffectStack();
        this.ruleManager = new RuleManager();
        this.eventEmitter = new EventEmitter();
        this.actionEmitter = new EventEmitter();
        this.stateChecker = new StateChecker(this);
        this.controllers = [controller0, controller1];
        // Initialize seeded RNG (defaults to current time for local games)
        const seed = options?.seed ?? Date.now();
        this.rng = new SeededRNG(seed);
        // Initialize logger with player info
        const player0Info = {
            id: 0,
            name: 'Player 1',
            type: controller0.type === 'ai' ? 'ai' : 'human'
        };
        const player1Info = {
            id: 1,
            name: 'Player 2',
            type: controller1.type === 'ai' ? 'ai' : 'human'
        };
        this.logger = new GameLogger(player0Info, player1Info);
        // Controllers subscribe to all events
        this.onEvent((event) => {
            this.controllers.forEach((controller) => controller.onEvent(event));
        });
        // Log game result when match ends
        this.onEvent((event) => {
            if (event.type === 'MATCH_ENDED') {
                this.logger.setResult(event.winner, this.state);
            }
        });
    }
    async initializeGame(deck1, deck2, leader1Id, leader2Id, startingPlayer) {
        // 1. Initialize Players (Entities)
        const player0 = new Player(0, this);
        player0.setDeck([...deck1]);
        const player1 = new Player(1, this);
        player1.setDeck([...deck2]);
        this.players = [player0, player1];
        // 2. Initialize Terrains (Entities)
        this.terrains = [
            new Terrain(this, 0),
            new Terrain(this, 1),
            new Terrain(this, 2),
            new Terrain(this, 3),
            new Terrain(this, 4)
        ];
        // 3. Initialize Global State
        this.game = new Game(this);
        // Determine starting player
        if (startingPlayer !== undefined) {
            this.game.setCurrentPlayer(startingPlayer);
        }
        else {
            this.game.setCurrentPlayer(this.rng.next() < 0.5 ? 0 : 1);
        }
        // Initialize Leaders
        this.leaders = [createLeaderState(leader1Id), createLeaderState(leader2Id)];
        // this.game handles skirmish/turn defaults (1, 1, 0 ties)
        // Start the first skirmish (draw initial hands)
        const { StartSkirmishEffect } = await import('../mechanics/effects/StartSkirmishEffect');
        this.addInterrupt(new StartSkirmishEffect());
        await this.processEffectStack();
        // Emit ACTION_REQUIRED for the first player
        await this.checkForRequiredActions();
    }
    /**
     * Subscribe to game events
     */
    onEvent(callback) {
        return this.eventEmitter.subscribe(callback);
    }
    /**
     * Subscribe to game actions
     */
    onAction(callback) {
        return this.actionEmitter.subscribe(callback);
    }
    /**
     * Emit an event
     */
    async emitEvent(event) {
        await this.eventEmitter.emit(event);
    }
    /**
     * Process a game action
     * Now async to support input requests during effect execution.
     * All actions are wrapped in Effects for consistent ordering and status effect management.
     */
    async processAction(action) {
        // Validate action
        if (!this.isLegalAction(action)) {
            throw new Error(`Illegal action: ${JSON.stringify(action)}`);
        }
        // Wrap all actions in effects for consistent effect stack ordering
        switch (action.type) {
            case 'PLAY_CARD':
                this.addInterrupt(new PlayCardEffect(action.playerId, action.cardId, action.targetSlot));
                break;
            case 'ACTIVATE':
                this.addInterrupt(new ActivateEffect(action.playerId, action.unitId));
                break;
            case 'PASS':
                this.addInterrupt(new PassEffect(action.playerId));
                break;
            case 'ACTIVATE_LEADER':
                this.addInterrupt(new ActivateLeaderEffect(action.playerId));
                break;
        }
        // Process effect stack (await it) - triggers like TurnEnd or OnDeploy/OnDeath run here
        await this.processEffectStack();
        // Only emit STATE_SNAPSHOT if not waiting for input
        if (!this.pendingInputResolve) {
            await this.emitEvent({
                type: 'STATE_SNAPSHOT',
                state: this.state,
            });
            // Check if anyone needs to act
            await this.checkForRequiredActions();
        }
        return this.state;
    }
    /**
     * Public alias for processAction (used by controllers)
     */
    async submitAction(action, reasoning) {
        // Log the action before processing
        const controller = this.controllers[action.playerId];
        const playerType = controller.type === 'ai' ? 'ai' : 'human';
        this.logger.logAction(action, playerType, this.state, reasoning);
        return await this.processAction(action);
    }
    /**
     * Check if current player needs to make a decision and emit ACTION_REQUIRED
     * Auto-passes if the player has acted this turn and has no more actions available
     */
    async checkForRequiredActions() {
        const currentPlayer = this.state.currentPlayer;
        // Only check if game is ongoing and player hasn't declared done
        if (this.state.matchWinner === undefined &&
            !this.players[currentPlayer].isDone) {
            // Get all legal actions for the current player
            const legalActions = this.getLegalActions(currentPlayer);
            // Auto-pass only if:
            // 1. Player has acted this turn (played a card or activated something)
            // 2. The only remaining action is PASS
            // This prevents infinite loops when a player hasn't done anything yet
            if (!this.players[currentPlayer].hasActedThisTurn &&
                legalActions.length === 1 &&
                legalActions[0].type === 'PASS') {
                // Automatically pass for the player
                await this.processAction({ type: 'PASS', playerId: currentPlayer });
                return;
            }
            await this.emitEvent({
                type: 'ACTION_REQUIRED',
                playerId: currentPlayer,
            });
        }
    }
    /**
     * Process the effect stack until empty
     * Now async to support input requests during effect execution
     */
    async processEffectStack() {
        let iterations = 0;
        const MAX_ITERATIONS = 1000; // Prevent infinite loops
        while (!this.effectStack.isEmpty()) {
            if (iterations++ > MAX_ITERATIONS) {
                throw new Error('Effect stack exceeded maximum iterations - possible infinite loop');
            }
            const effect = this.effectStack.pop();
            if (!effect)
                break;
            // Execute effect (now async) - will naturally pause if effect awaits input
            const result = await effect.execute(this.state);
            this.stateChecker.checkStateConditions(this.state);
            // Update state - NO-OP in Entity System (State is derivative)
            // this.state = result.newState;
            // Emit events
            // Wait for events to be processed (critical for async event listeners)
            for (const e of result.events) {
                await this.emitEvent(e);
            }
        }
    }
    /**
     * Submit player input (for targeting, modal choices, etc.)
     * Resolves the pending input Promise, allowing effect execution to continue
     */
    async submitInput(input) {
        if (!this.pendingInputResolve) {
            throw new Error('No input request in progress');
        }
        // Get the player who this input is for (from the pending request)
        const playerId = this.state.currentPlayer; // The player whose turn it is
        // Generate checksum for this input
        const checksum = StateHasher.hashStateSync(this.state);
        // Emit INPUT action for network sync
        const inputAction = {
            type: 'INPUT',
            playerId,
            input,
            checksum
        };
        await this.actionEmitter.emit(inputAction);
        // Resolve the Promise that requestInput() is awaiting
        this.pendingInputResolve(input);
        this.pendingInputResolve = null;
    }
    /**
     * Add a single high-priority effect (Interrupt/Trigger)
     * It will execute immediately after the current effect finishes.
     */
    addInterrupt(effect) {
        effect.setEngine(this);
        this.effectStack.push(effect);
    }
    /**
     * Add a chain of effects to execute in order (A -> B -> C)
     * Result: A is on top (executes first), then B, then C.
     */
    addSequence(effects) {
        effects.forEach(e => e.setEngine(this));
        this.effectStack.pushSequence(effects);
    }
    // Deprecated alias for backwards compatibility during migration (optional)
    enqueueEffect(effect) {
        this.addInterrupt(effect);
    }
    // Removed actionToEffect as logic is now in processAction
    /**
     * Check if an action is legal in the current game state
     */
    isLegalAction(action) {
        // Check if game is over
        if (this.state.matchWinner !== undefined) {
            console.log(`action [${JSON.stringify(action)}] is not legal because game ended`);
            return false;
        }
        // Check if it's the player's turn
        if (action.playerId !== this.state.currentPlayer) {
            console.log(`action [${JSON.stringify(action)}] is not legal not current player [${this.state.currentPlayer}]`);
            return false;
        }
        // Check if player has already declared done
        if (this.players[action.playerId].isDone) {
            // Changed from hasPassed
            console.log(`action [${JSON.stringify(action)}] is not legal current player done [${this.state.currentPlayer}]`);
            return false;
        }
        switch (action.type) {
            case 'PLAY_CARD': {
                // Check if player has already played a card this turn
                // Exception: unlimited plays allowed when opponent is done
                const opponent = (1 - action.playerId);
                const opponentIsDone = this.players[opponent].isDone;
                if (this.players[action.playerId].hasPlayedCardThisTurn && !opponentIsDone) {
                    console.log(`action [${JSON.stringify(action)}] already played a card this turn`);
                    return false;
                }
                // Find card in hand
                const player = this.state.players[action.playerId];
                const card = player.hand.find((c) => c.id === action.cardId);
                if (!card) {
                    console.log(`action [${JSON.stringify(action)}] card not found [${action.cardId}]`);
                    return false;
                }
                // If action has no target, allow it ONLY if card doesn't need one
                if (!action.targetSlot) {
                    if (card.needsTarget()) {
                        console.log(`action [${JSON.stringify(action)}] needed target and not found`);
                        return false;
                    }
                    return true;
                }
                // Validate target
                if (card.getType() === 'unit') {
                    // Unit deployment check
                    if (!this.isDeploymentAllowed(card, action.targetSlot.terrainId)) {
                        console.log(`action [${JSON.stringify(action)}] deployment not allowed [${action.targetSlot.terrainId}]`);
                        return false;
                    }
                }
                else {
                    // Action card targeting check
                    if (!this.isTargetingAllowed(card, action.targetSlot)) {
                        console.log(`action [${JSON.stringify(action)}] target not allowed [${action.targetSlot.terrainId}]`);
                        return false;
                    }
                }
                return true;
            }
            case 'ACTIVATE': {
                // Find unit
                const unit = this.getUnitById(action.unitId);
                if (!unit)
                    return false;
                // Check if unit belongs to current player
                if (unit.owner !== action.playerId)
                    return false;
                // Check if unit can activate
                return unit.canActivate();
            }
            case 'PASS':
                return true;
            case 'ACTIVATE_LEADER': {
                const leaderState = this.leaders[action.playerId];
                if (!leaderState)
                    return false;
                if (leaderState.currentCharges <= 0)
                    return false;
                if (leaderState.isExhausted)
                    return false;
                // Check if leader has an ability and if it can be activated
                const leader = getLeader(leaderState.leaderId, this, action.playerId);
                if (!leader.ability)
                    return false; // Rookie has no ability
                return leader.ability.canActivate();
            }
            default:
                console.log(`action [${JSON.stringify(action)}] unknown type`);
                return false;
        }
    }
    // ========== Rule System Validation ==========
    /**
     * Check if a card can be deployed to a specific terrain
     */
    isDeploymentAllowed(card, terrainId) {
        const terrain = this.terrains[terrainId];
        // const slot = terrain.slots[card.owner]; // TODO: Refactor Terrain to Entity
        const slot = terrain.slots[card.owner];
        const existingUnit = slot.unit;
        // Default: can only deploy to empty slots
        // Cards with MUST_CONSUME trait bypass this via getValidTargets() override
        let allowed = !existingUnit;
        // Check rules (e.g., Sentinel blocking)
        return this.ruleManager.evaluate(RuleType.CAN_DEPLOY, {
            deployingCard: card,
            targetSlot: { terrainId, playerId: card.owner },
            targetUnitId: existingUnit?.id,
        }, allowed);
    }
    /**
     * Check if a card can target a specific unit or terrain
     */
    isTargetingAllowed(sourceCard, targetSlot) {
        let allowed = true;
        // Check rules
        return this.ruleManager.evaluate(RuleType.CAN_TARGET, {
            sourceCard,
            targetSlot,
        }, allowed);
    }
    /**
     * Get all legal actions for a player in the current state
     * This properly validates actions using all rule checks (e.g., Sentinel blocking)
     */
    getLegalActions(playerId) {
        const actions = [];
        // Check if player can act at all
        if (this.state.matchWinner !== undefined ||
            this.state.currentPlayer !== playerId ||
            this.players[playerId].isDone) {
            return actions;
        }
        // Can always pass (behavior changes based on hasActedThisTurn)
        actions.push({ type: 'PASS', playerId });
        const player = this.state.players[playerId];
        // Only allow playing cards if player hasn't played one this turn
        // Exception: unlimited plays allowed when opponent is done
        const opponentId = (1 - playerId);
        const opponentIsDone = this.players[opponentId].isDone;
        const canPlayCard = !this.players[playerId].hasPlayedCardThisTurn || opponentIsDone;
        // Check each card in hand (only if player can still play a card)
        if (canPlayCard) {
            player.hand.forEach(card => {
                if (card.getType() === 'unit') {
                    // Unit cards - check each terrain for valid deployment
                    this.state.terrains.forEach((terrain, terrainId) => {
                        // Must be empty slot
                        if (!terrain.slots[playerId].unit) {
                            // Check deployment rules (e.g., Sentinel blocking)
                            if (this.isDeploymentAllowed(card, terrainId)) {
                                actions.push({
                                    type: 'PLAY_CARD',
                                    playerId,
                                    cardId: card.id,
                                    targetSlot: { terrainId: terrainId, playerId }
                                });
                            }
                        }
                    });
                }
                else {
                    // Action cards
                    if (!card.needsTarget()) {
                        // No target needed - always valid
                        actions.push({
                            type: 'PLAY_CARD',
                            playerId,
                            cardId: card.id
                        });
                    }
                    else {
                        // Action card with targeting
                        const targets = card.getValidTargets(this.state);
                        if (targets.type === 'slots' && targets.validSlots) {
                            targets.validSlots.forEach((slot) => {
                                // Check targeting rules
                                if (this.isTargetingAllowed(card, slot)) {
                                    actions.push({
                                        type: 'PLAY_CARD',
                                        playerId,
                                        cardId: card.id,
                                        targetSlot: slot
                                    });
                                }
                            });
                        }
                    }
                }
            });
        }
        // Check activate actions for units on field
        this.state.terrains.forEach(terrain => {
            const unit = terrain.slots[playerId].unit;
            if (unit && unit.owner === playerId) {
                const unitCard = unit;
                if (unitCard.canActivate && unitCard.canActivate()) {
                    actions.push({
                        type: 'ACTIVATE',
                        playerId,
                        unitId: unit.id
                    });
                }
            }
        });
        // Check leader ability
        const leaderState = this.state.leaders[playerId];
        if (leaderState) {
            const leader = getLeader(leaderState.leaderId, this, playerId);
            if (leader.ability &&
                leaderState.currentCharges > 0 &&
                !leaderState.isExhausted &&
                leader.ability.canActivate()) {
                actions.push({
                    type: 'ACTIVATE_LEADER',
                    playerId,
                });
            }
        }
        return actions;
    }
    /**
     * Calculate the winner of a terrain based on current state and rules.
     * This is used by ResolveSkirmishEffect AND by the UI to preview winners.
     */
    calculateTerrainWinner(terrainId) {
        const terrain = this.state.terrains[terrainId];
        if (!terrain)
            return null;
        const unit0 = terrain.slots[0].unit;
        const unit1 = terrain.slots[1].unit;
        // Calculate power (unit.power getter already includes slot modifiers)
        const power0 = unit0 ? unit0.power : 0;
        const power1 = unit1 ? unit1.power : 0;
        // Determine default winner logic (Standard Skirmish Rule)
        let defaultWinner = null;
        if (unit0 && unit1) {
            // Both players have units - compare power
            if (power0 > power1) {
                defaultWinner = 0;
            }
            else if (power1 > power0) {
                defaultWinner = 1;
            }
            else {
                // Tie
                defaultWinner = null;
            }
        }
        else if (unit0) {
            // Only player 0 has unit
            defaultWinner = 0;
        }
        else if (unit1) {
            // Only player 1 has unit
            defaultWinner = 1;
        }
        else {
            // Empty terrain
            defaultWinner = null;
        }
        // Allow rules to override the winner (e.g. Rogue)
        return this.ruleManager.evaluate(RuleType.DETERMINE_TERRAIN_WINNER, {
            terrainId,
            power0,
            power1
        }, defaultWinner);
    }
    // ========== Helper Methods for Cards ==========
    /**
     * Get a player instance
     */
    getPlayer(playerId) {
        // Cast to Player class (we know it is one because of createInitialGameState)
        return this.players[playerId];
    }
    /**
     * Get a card by its instance ID
     */
    getCardById(cardId) {
        for (const player of Object.values(this.players)) {
            const card = player.hand.find((c) => c.id === cardId) ||
                player.deck.find((c) => c.id === cardId) ||
                player.graveyard.find((c) => c.id === cardId); // Changed from discard
            if (card)
                return card;
        }
        // Check units on terrains
        for (const terrain of this.terrains) {
            if (terrain.slots[0].unit?.id === cardId)
                return terrain.slots[0].unit;
            if (terrain.slots[1].unit?.id === cardId)
                return terrain.slots[1].unit;
        }
        return undefined;
    }
    /**
     * Get a unit by its instance ID
     */
    getUnitById(unitId) {
        // Check board
        for (const terrain of this.terrains) {
            if (terrain.slots[0].unit?.id === unitId)
                return terrain.slots[0].unit;
            if (terrain.slots[1].unit?.id === unitId)
                return terrain.slots[1].unit;
        }
        // Check hands (for units being deployed/consumed interactions)
        for (const playerId of [0, 1]) {
            const card = this.players[playerId].hand.find(c => c.id === unitId);
            if (card && card.getType() === 'unit')
                return card;
        }
        return undefined;
    }
    /**
     * Get close units to a given terrain
     * Close = adjacent terrains (left/right) AND unit in front (same terrain, opposite slot)
     */
    getCloseUnits(terrainId, owner, filter) {
        if (terrainId === null)
            return [];
        const units = [];
        // 1. Get unit in front (same terrain, opposite slot)
        const unitInFront = this.getUnitInFront(terrainId, owner);
        if (unitInFront) {
            if (filter === 'ally' && unitInFront.owner === owner) {
                units.push(unitInFront);
            }
            else if (filter === 'enemy' && unitInFront.owner !== owner) {
                units.push(unitInFront);
            }
            else if (filter === 'any') {
                units.push(unitInFront);
            }
        }
        // 2. Get units on adjacent terrains (left/right)
        const adjacentTerrainIds = getAdjacentTerrains(terrainId);
        for (const adjTerrainId of adjacentTerrainIds) {
            const terrain = this.terrains[adjTerrainId];
            const unit0 = terrain.slots[0].unit;
            const unit1 = terrain.slots[1].unit;
            for (const unit of [unit0, unit1]) {
                if (!unit)
                    continue;
                const typedUnit = unit;
                if (filter === 'ally' && typedUnit.owner === owner) {
                    units.push(typedUnit);
                }
                else if (filter === 'enemy' && typedUnit.owner !== owner) {
                    units.push(typedUnit);
                }
                else if (filter === 'any') {
                    units.push(typedUnit);
                }
            }
        }
        return units;
    }
    /**
     * Get unit in front (opposite player's unit on same terrain)
     */
    getUnitInFront(terrainId, playerId) {
        const terrain = this.terrains[terrainId];
        if (!terrain)
            return null;
        const opponentId = this.kOpponent(playerId); // or 1-playerId
        return terrain.slots[opponentId].unit;
    }
    // Helper for opponent ID since I can't easily import getOpponent from GameState if it causes cycles or is wrong
    kOpponent(id) {
        return (1 - id);
    }
    /**
     * Get a unit by its slot coordinates
     */
    getUnitAt(slot) {
        const terrain = this.terrains[slot.terrainId];
        if (!terrain)
            return null;
        return terrain.slots[slot.playerId].unit;
    }
    /**
     * Add slot modifier (replaces addSlotEffect - simpler system)
     */
    async addSlotModifier(terrainId, playerId, amount) {
        if (!this.terrains[terrainId])
            return;
        // Use Entity setter
        const slot = this.terrains[terrainId].slots[playerId];
        slot.setModifier(slot.modifier + amount);
        await this.emitEvent({
            type: 'SLOT_MODIFIER_CHANGED',
            terrainId,
            playerId,
            newModifier: slot.modifier,
        });
        // We don't need to manually update unit power anymore as it's calculated dynamically
        // But we should emit a power change event for the UI if a unit is present
        const unit = this.terrains[terrainId].slots[playerId].unit;
        if (unit) {
            await this.emitEvent({
                type: 'UNIT_POWER_CHANGED',
                unitId: unit.id,
                terrainId,
                oldPower: unit.power - amount, // Approximation
                newPower: unit.power,
                amount,
            });
        }
    }
    /**
     * Get the modifier for a specific slot
     */
    getSlotModifier(terrainId, playerId) {
        if (!this.terrains[terrainId])
            return 0;
        return this.terrains[terrainId].slots[playerId].modifier;
    }
    /**
     * Get all units owned by a player
     */
    getPlayerUnits(playerId) {
        const units = [];
        for (const terrain of this.terrains) {
            const unit = terrain.slots[playerId].unit;
            if (unit)
                units.push(unit);
        }
        return units;
    }
    /**
     * Get a player's state (snapshot)
     */
    getPlayerState(playerId) {
        // Return snapshot
        return this.players[playerId].toState();
    }
    /**
     * Get opponent player ID
     */
    getOpponent(playerId) {
        return getOpponent(playerId);
    }
}
