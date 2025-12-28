/**
 * GameLogger - Captures all game actions with full context and AI reasoning
 *
 * Features:
 * - In-memory storage of all actions
 * - Includes AI reasoning for each decision
 * - Simplified state snapshots for analysis
 * - JSON export for download and replay
 */
export class GameLogger {
    constructor(player0Info, player1Info) {
        Object.defineProperty(this, "gameId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "startTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "actions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "players", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "turnCounter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "gameResult", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.gameId = this.generateGameId();
        this.startTime = new Date();
        this.actions = [];
        this.players = [player0Info, player1Info];
        this.turnCounter = 0;
        this.gameResult = null;
    }
    /**
     * Log a game action with optional AI reasoning
     */
    logAction(action, playerType, state, reasoning) {
        this.turnCounter++;
        const entry = {
            turn: this.turnCounter,
            player: action.playerId,
            playerType,
            actionType: action.type,
            details: this.extractActionDetails(action, state),
            reasoning: reasoning || null,
            timestamp: new Date().toISOString(),
            gameStateSnapshot: this.simplifyState(state)
        };
        this.actions.push(entry);
    }
    /**
     * Record the final game result
     */
    setResult(winner, state) {
        this.gameResult = {
            winner,
            finalScore: [
                state.players[0].skirmishesWon,
                state.players[1].skirmishesWon
            ],
            totalTurns: this.turnCounter
        };
    }
    /**
     * Get the complete game log
     */
    getFullLog() {
        return {
            gameId: this.gameId,
            timestamp: this.startTime.toISOString(),
            players: this.players,
            result: this.gameResult,
            actions: this.actions
        };
    }
    /**
     * Get recent action history (for AI context)
     */
    getHistory(count = 10) {
        return this.actions.slice(-count);
    }
    /**
     * Export log as JSON string
     */
    exportToJSON() {
        return JSON.stringify(this.getFullLog(), null, 2);
    }
    /**
     * Clear all logged actions (for new game)
     */
    clear() {
        this.actions = [];
        this.turnCounter = 0;
        this.gameResult = null;
        this.gameId = this.generateGameId();
        this.startTime = new Date();
    }
    /**
     * Generate a unique game ID
     */
    generateGameId() {
        return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Simplify game state for logging
     */
    simplifyState(state) {
        return {
            currentSkirmish: state.currentSkirmish,
            currentPlayer: state.currentPlayer,
            scores: {
                player0: {
                    sp: state.players[0].sp,
                    skirmishesWon: state.players[0].skirmishesWon
                },
                player1: {
                    sp: state.players[1].sp,
                    skirmishesWon: state.players[1].skirmishesWon
                }
            },
            terrains: state.terrains.map(terrain => ({
                id: terrain.id,
                winner: terrain.winner,
                units: [
                    terrain.slots[0].unit ? {
                        name: terrain.slots[0].unit.name,
                        power: terrain.slots[0].unit.power
                    } : null,
                    terrain.slots[1].unit ? {
                        name: terrain.slots[1].unit.name,
                        power: terrain.slots[1].unit.power
                    } : null
                ]
            })),
            handSizes: [
                state.players[0].hand.length,
                state.players[1].hand.length
            ],
            deckSizes: [
                state.players[0].deck.length,
                state.players[1].deck.length
            ]
        };
    }
    /**
     * Extract human-readable action details
     */
    extractActionDetails(action, state) {
        switch (action.type) {
            case 'PLAY_CARD': {
                const card = this.findCard(action.cardId, state.players[action.playerId]);
                return {
                    cardId: action.cardId,
                    cardName: card?.name || 'Unknown',
                    cardType: card?.getType() || 'unknown',
                    targetSlot: action.targetSlot || null
                };
            }
            case 'PASS': {
                return {
                    action: 'pass'
                };
            }
            case 'ACTIVATE': {
                const unit = this.findUnit(action.unitId, state);
                return {
                    unitId: action.unitId,
                    unitName: unit?.name || 'Unknown'
                };
            }
            default:
                return { ...action };
        }
    }
    /**
     * Find a card in player's hand, deck, or graveyard
     */
    findCard(cardId, player) {
        return player.hand.find(c => c.id === cardId) ||
            player.deck.find(c => c.id === cardId) ||
            player.graveyard.find(c => c.id === cardId) ||
            null;
    }
    /**
     * Find a unit on the battlefield
     */
    findUnit(unitId, state) {
        for (const terrain of state.terrains) {
            if (terrain.slots[0].unit?.id === unitId)
                return terrain.slots[0].unit;
            if (terrain.slots[1].unit?.id === unitId)
                return terrain.slots[1].unit;
        }
        return null;
    }
}
