import { GameEntity } from './base/GameEntity';
export class Game extends GameEntity {
    constructor(engine) {
        super(engine);
        Object.defineProperty(this, "_currentSkirmish", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "_currentTurn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "_currentPlayer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "_tieSkirmishes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "_matchWinner", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_skirmishHistory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.initializeSkirmish();
    }
    initializeSkirmish() {
        this._skirmishHistory.push({
            id: this._currentSkirmish,
            status: 'ONGOING',
            winner: null,
            scores: { 0: 0, 1: 0 }
        });
    }
    // Accessors
    get currentSkirmish() { return this._currentSkirmish; }
    get currentTurn() { return this._currentTurn; }
    get currentPlayer() { return this._currentPlayer; }
    get tieSkirmishes() { return this._tieSkirmishes; }
    get matchWinner() { return this._matchWinner; }
    get skirmishHistory() { return this._skirmishHistory; }
    // Logic
    startSkirmish() {
        // Logic moved from StartSkirmishEffect? Or just state tracking?
        // Often effect drives this, but entity holds state.
        const hands = {
            0: this.engine.players[0] ? [...this.engine.players[0].hand] : [],
            1: this.engine.players[1] ? [...this.engine.players[1].hand] : []
        };
        this.engine.emitEvent({
            type: 'SKIRMISH_STARTED',
            skirmishNumber: this._currentSkirmish,
            hands,
            entity: this
        });
    }
    endSkirmish(winner) {
        const p0 = this.engine.getPlayer(0).skirmishPoints;
        const p1 = this.engine.getPlayer(1).skirmishPoints;
        const currentRecord = this._skirmishHistory.find(s => s.id === this._currentSkirmish);
        if (currentRecord) {
            currentRecord.status = 'CONCLUDED';
            currentRecord.winner = winner === null ? 'TIE' : winner;
            currentRecord.scores = { 0: p0, 1: p1 };
        }
        // Emit SKIRMISH_ENDED
        this.engine.emitEvent({
            type: 'SKIRMISH_ENDED',
            skirmishNumber: this._currentSkirmish,
            winner,
            sp: [p0, p1],
            entity: this
        });
        if (winner === null) {
            this._tieSkirmishes++;
        }
        // Prepare next
        this._currentSkirmish++;
        this.initializeSkirmish();
    }
    passTurn() {
        this._currentTurn++;
        // Toggle player? Usually handled by GameEngine logic based on who passed.
        // This entity mostly just tracks the numbers.
    }
    setWinner(winner) {
        this._matchWinner = winner;
        this.engine.emitEvent({
            type: 'MATCH_ENDED',
            winner,
            entity: this
        });
    }
    updateScore(playerId, score) {
        const record = this._skirmishHistory.find(s => s.id === this._currentSkirmish);
        if (record) {
            record.scores[playerId] = score;
        }
    }
    setCurrentPlayer(playerId) {
        const old = this._currentPlayer;
        this._currentPlayer = playerId;
        if (old !== playerId) {
            // Emit? 'TURN_CHANGED' usually means turn number increment, 
            // but 'ACTIVE_PLAYER_CHANGED' is different.
            // Existing engine treats TURN_CHANGED as "New Turn Started".
        }
    }
    toState() {
        return {
            currentSkirmish: this._currentSkirmish,
            currentTurn: this._currentTurn,
            currentPlayer: this._currentPlayer,
            tieSkirmishes: this._tieSkirmishes,
            matchWinner: this._matchWinner,
            // history: this._skirmishHistory // TODO: Add to GameState type if needed
        };
    }
}
