import { Effect } from './Effect';
import type { EffectResult, GameState, GameEvent, PlayerId, TerrainId, PlayerSlotId } from '../types';
import { UnitCard } from '../cards/Card';
import { StartSkirmishEffect } from './StartSkirmishEffect';

/**
 * Resolve the skirmish (calculate terrain winners, award SP, trigger Conquer effects)
 */
export class ResolveSkirmishEffect extends Effect {
  async execute(state: GameState): Promise<EffectResult> {
    const events: GameEvent[] = [];

    // STEP 1: Calculate terrain winners (5 terrains)
    for (let terrainId = 0; terrainId < 5; terrainId++) {
      const terrain = state.terrains[terrainId as TerrainId];
      const unit0 = terrain.slots[0].unit;
      const unit1 = terrain.slots[1].unit;

      // Use engine's centralized winner calculation (which respects RuleManager and Rogue)
      terrain.winner = this.engine.calculateTerrainWinner(terrainId as TerrainId);

      // Award SP
      if (terrain.winner === 0) {
        state.players[0].sp += 1;
      } else if (terrain.winner === 1) {
        state.players[1].sp += 1;
      }

      // Calculate power for event reporting
      const power0 = unit0 ? unit0.power : 0;
      const power1 = unit1 ? unit1.power : 0;

      events.push({
        type: 'TERRAIN_RESOLVED' as const,
        terrainId: terrainId as TerrainId,
        winner: terrain.winner,
        unit0Power: power0,
        unit1Power: power1,
      });
    }

    // STEP 2: Trigger Conquer effects (left to right)
    for (let terrainId = 0; terrainId < 5; terrainId++) {
      const terrain = state.terrains[terrainId as TerrainId];
      if (terrain.winner !== null) {
        const winningUnit = terrain.slots[terrain.winner].unit;
        if (winningUnit) {
          events.push({
            type: 'CONQUER_TRIGGERED' as const,
            unitId: winningUnit.id,
            terrainId: terrainId as TerrainId,
          });

          // Execute onConquer
          (winningUnit as UnitCard).onConquer();
        }
      }
    }

    // STEP 3: Determine skirmish winner
    const sp0 = state.players[0].sp;
    const sp1 = state.players[1].sp;

    let skirmishWinner: PlayerId | null = null;

    if (sp0 > sp1) {
      skirmishWinner = 0;
      state.players[0].skirmishesWon += 1;
    } else if (sp1 > sp0) {
      skirmishWinner = 1;
      state.players[1].skirmishesWon += 1;
    } else {
      // Tie skirmish
      state.tieSkirmishes += 1;
    }

    events.push({
      type: 'SKIRMISH_ENDED' as const,
      skirmishNumber: state.currentSkirmish,
      winner: skirmishWinner,
      sp: [sp0, sp1] as [number, number],
    });

    // STEP 4: Check match end conditions
    const matchWinner = this.checkMatchEnd(state);

    if (matchWinner !== undefined) {
      state.matchWinner = matchWinner ?? undefined;

      // Cleanup all units when match ends (call onLeave)
      this.cleanupMatchEnd(state);

      // Only emit MATCH_ENDED if there's an actual winner (not a draw with null)
      if (matchWinner !== null) {
        events.push({
          type: 'MATCH_ENDED' as const,
          winner: matchWinner,
        });
      }
    } else {
      // STEP 5: Cleanup for next skirmish
      this.cleanupSkirmish(state);
      state.currentSkirmish += 1;

      // Enqueue next skirmish start
      this.engine.enqueueEffect(new StartSkirmishEffect());
    }

    return { newState: state, events };
  }

  private checkMatchEnd(state: GameState): PlayerId | null | undefined {
    // 2 skirmishes won = victory
    if (state.players[0].skirmishesWon >= 2) return 0;
    if (state.players[1].skirmishesWon >= 2) return 1;

    // 1 win + 1 tie = victory
    if (state.players[0].skirmishesWon === 1 && state.tieSkirmishes >= 1) return 0;
    if (state.players[1].skirmishesWon === 1 && state.tieSkirmishes >= 1) return 1;

    // 2 ties = draw
    if (state.tieSkirmishes >= 2) return null;

    // Continue playing
    return undefined;
  }

  private cleanupSkirmish(state: GameState): void {
    // Move all units to graveyard (they don't "die", just cleanup)
    for (const terrain of state.terrains) {
      for (const playerId of [0, 1]) {
        const slot = terrain.slots[playerId as PlayerSlotId];
        if (slot.unit) {
          const unit = slot.unit as UnitCard;
          state.players[playerId].graveyard.push(unit);
          slot.unit = null;
          
          // Call onLeave to cleanup rules and subscriptions
          unit.onLeave();
        }

        // CRITICAL: Clear slot modifiers (V2 key change - modifiers don't persist)
        slot.modifier = 0;
      }

      // Reset terrain winner
      terrain.winner = null;
    }

    // Reset "done" flags
    state.isDone = [false, false];
  }

  private cleanupMatchEnd(state: GameState): void {
    // Similar to cleanupSkirmish, but for match end
    // Call onLeave for all units still on the board
    for (const terrain of state.terrains) {
      for (const playerId of [0, 1]) {
        const slot = terrain.slots[playerId as PlayerSlotId];
        if (slot.unit) {
          const unit = slot.unit as UnitCard;
          unit.onLeave();
        }
      }
    }
  }
}
