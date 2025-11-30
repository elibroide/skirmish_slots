import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId, SlotId } from '../types';
import { UnitCard } from '../cards/Card';
import { StartRoundEffect } from './StartRoundEffect';

/**
 * Resolve the round (calculate winners, award VP, trigger Conquer effects)
 */
export class ResolveRoundEffect extends Effect {
  execute(state: GameState): EffectResult {
    const events = [];

    // STEP 1: Calculate slot winners
    for (let slotId = 0; slotId < 4; slotId++) {
      const slot = state.slots[slotId as SlotId];
      const unit0 = slot.units[0];
      const unit1 = slot.units[1];

      if (unit0 && unit1) {
        // Both players have units - compare power
        if (unit0.power > unit1.power) {
          state.players[0].vp += 1;
          slot.winner = 0;
        } else if (unit1.power > unit0.power) {
          state.players[1].vp += 1;
          slot.winner = 1;
        } else {
          // Tie - no VP awarded
          slot.winner = null;
        }
      } else if (unit0) {
        // Only player 0 has unit
        state.players[0].vp += 1;
        slot.winner = 0;
      } else if (unit1) {
        // Only player 1 has unit
        state.players[1].vp += 1;
        slot.winner = 1;
      } else {
        // Empty slot - no VP
        slot.winner = null;
      }

      events.push({
        type: 'SLOT_RESOLVED' as const,
        slotId: slotId as SlotId,
        winner: slot.winner,
        unit0Power: unit0?.power || 0,
        unit1Power: unit1?.power || 0,
      });
    }

    // STEP 2: Trigger Conquer effects (left to right)
    for (let slotId = 0; slotId < 4; slotId++) {
      const slot = state.slots[slotId as SlotId];
      if (slot.winner !== null) {
        const winningUnit = slot.units[slot.winner];
        if (winningUnit) {
          events.push({
            type: 'CONQUER_TRIGGERED' as const,
            unitId: winningUnit.id,
            slotId: slotId as SlotId,
          });

          // Execute onConquer
          (winningUnit as UnitCard).onConquer();
        }
      }
    }

    // STEP 3: Determine round winner
    const vp0 = state.players[0].vp;
    const vp1 = state.players[1].vp;

    let roundWinner: PlayerId | null = null;

    if (vp0 > vp1) {
      roundWinner = 0;
      state.players[0].roundsWon += 1;
    } else if (vp1 > vp0) {
      roundWinner = 1;
      state.players[1].roundsWon += 1;
    } else {
      // Tie round
      state.tieRounds += 1;
    }

    events.push({
      type: 'ROUND_ENDED' as const,
      roundNumber: state.currentRound,
      winner: roundWinner,
      vp: [vp0, vp1] as [number, number],
    });

    // STEP 4: Check match end conditions
    const matchWinner = this.checkMatchEnd(state);

    if (matchWinner !== undefined) {
      state.matchWinner = matchWinner;
      events.push({
        type: 'MATCH_ENDED' as const,
        winner: matchWinner,
      });
    } else {
      // STEP 5: Cleanup for next round
      this.cleanupRound(state);
      state.currentRound += 1;

      // Enqueue next round start
      this.engine.enqueueEffect(new StartRoundEffect());
    }

    return { newState: state, events };
  }

  private checkMatchEnd(state: GameState): PlayerId | null | undefined {
    // 2 rounds won = victory
    if (state.players[0].roundsWon >= 2) return 0;
    if (state.players[1].roundsWon >= 2) return 1;

    // 1 win + 1 tie = victory
    if (state.players[0].roundsWon === 1 && state.tieRounds >= 1) return 0;
    if (state.players[1].roundsWon === 1 && state.tieRounds >= 1) return 1;

    // 2 ties = draw
    if (state.tieRounds >= 2) return null;

    // Continue playing
    return undefined;
  }

  private cleanupRound(state: GameState): void {
    // Move all units to discard (they don't "die", just cleanup)
    for (const slot of state.slots) {
      for (let playerId = 0; playerId < 2; playerId++) {
        const unit = slot.units[playerId];
        if (unit) {
          state.players[playerId].discard.push(unit);
          slot.units[playerId] = null;
        }
      }
      // Ongoing effects persist!
      // Reset slot winner
      slot.winner = null;
    }

    // Reset pass flags
    state.hasPassed = [false, false];
  }
}
