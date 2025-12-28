import { Effect } from './Effect';
import type { EffectResult, GameState, GameEvent, PlayerId, TerrainId, PlayerSlotId } from '../../core/types';
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
      const terrain = this.engine.terrains[terrainId as TerrainId];
      const unit0 = terrain.slots[0].unit;
      const unit1 = terrain.slots[1].unit;

      // Use engine's centralized winner calculation (which respects RuleManager and Rogue)
      terrain.setWinner(this.engine.calculateTerrainWinner(terrainId as TerrainId));

      // Award SP
      if (terrain.winner === 0) {
        this.engine.getPlayer(0).addSkirmishPoints(1);
      } else if (terrain.winner === 1) {
        this.engine.getPlayer(1).addSkirmishPoints(1);
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
      const terrain = this.engine.terrains[terrainId as TerrainId];
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
    const sp0 = this.engine.getPlayer(0).sp;
    const sp1 = this.engine.getPlayer(1).sp;

    let skirmishWinner: PlayerId | null = null;

    if (sp0 > sp1) {
      skirmishWinner = 0;
      this.engine.getPlayer(0).incrementSkirmishesWon();
    } else if (sp1 > sp0) {
      skirmishWinner = 1;
      this.engine.getPlayer(1).incrementSkirmishesWon();
    } 
    // If tie, Game entity handles tie count increment in endSkirmish

    // Notify Game Entity of result (encapsulates history & event emission)
    this.engine.game.endSkirmish(skirmishWinner);

    // STEP 4: Check match end conditions (using Game entity stats)
    const matchWinner = this.checkMatchEnd(state); // pass state or just use engine?

    if (matchWinner !== undefined) {
      if (matchWinner !== null) {
          this.engine.game.setWinner(matchWinner);
      }
      
      // Cleanup all units when match ends (call onLeave)
      this.cleanupMatchEnd(state);
      
    } else {
      // STEP 5: Cleanup for next skirmish
      this.cleanupSkirmish(state);
      // Game entity already incremented currentSkirmish in endSkirmish()

      // Enqueue next skirmish start
      this.engine.enqueueEffect(new StartSkirmishEffect());
    }

    return { newState: state, events };
  }

  private checkMatchEnd(state: GameState): PlayerId | null | undefined {
    const tieSkirmishes = this.engine.game.tieSkirmishes;
    
    // 2 skirmishes won = victory
    if (this.engine.getPlayer(0).skirmishesWon >= 2) return 0;
    if (this.engine.getPlayer(1).skirmishesWon >= 2) return 1;

    // 1 win + 1 tie = victory
    if (this.engine.getPlayer(0).skirmishesWon === 1 && tieSkirmishes >= 1) return 0;
    if (this.engine.getPlayer(1).skirmishesWon === 1 && tieSkirmishes >= 1) return 1;

    // 2 ties = draw
    if (tieSkirmishes >= 2) return null;

    // Continue playing
    return undefined;
  }

  private cleanupSkirmish(state: GameState): void {
    // Move all units to graveyard (they don't "die", just cleanup)
    for (const terrain of this.engine.terrains) {
      for (const playerId of [0, 1]) {
        const slot = terrain.slots[playerId as PlayerSlotId];
        if (slot.unit) {
          const unit = slot.unit as UnitCard;
          
          this.engine.getPlayer(playerId as PlayerId).addToGraveyard(unit);
          slot.setUnit(null);
          
          // Call onLeave to cleanup rules and subscriptions
          unit.onLeave();
        }
      }

      // Reset terrain winner
      terrain.setWinner(null);
    }

    // Reset "done" flags
    for (const id of [0, 1]) {
        this.engine.getPlayer(id as PlayerId).resetSkirmishFlags();
    }
  }

  private cleanupMatchEnd(state: GameState): void {
    // Similar to cleanupSkirmish, but for match end
    // Call onLeave for all units still on the board
    for (const terrain of this.engine.terrains) {
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
