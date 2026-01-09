import { Effect } from './Effect';
import { TurnStartEffect } from './TurnStartEffect';
import { ResolveSkirmishEffect } from './ResolveSkirmishEffect';
export class TurnEndEffect extends Effect {
    async execute(state) {
        const events = [];
        // Use Engine Game Entity for state
        const game = this.engine.game;
        const currentPlayer = game.currentPlayer;
        const opponent = (1 - currentPlayer);
        // Increment turn counter each time a player passes
        // state.currentTurn++; // BROKEN: Modifies snapshot
        game.passTurn();
        const isDone = (id) => this.engine.players[id].isDone;
        if ([0, 1].every(id => isDone(id))) {
            this.engine.addInterrupt(new ResolveSkirmishEffect());
        }
        if (!isDone(opponent)) {
            // state.currentPlayer = opponent; // BROKEN: Modifies snapshot
            game.setCurrentPlayer(opponent);
            // Reset flags for the opponent's new turn
            this.engine.getPlayer(opponent).resetTurnFlags();
            events.push({
                type: 'PRIORITY_CHANGED',
                newPriority: opponent,
            });
            // Start the turn for the new player
            this.engine.addInterrupt(new TurnStartEffect());
        }
        return { newState: this.engine.state, events };
    }
}
