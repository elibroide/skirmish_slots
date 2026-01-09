import type { SelectionConfig } from './ReactTypes';
import type { UnitCard } from '../../cards/Card';

export class SelectionResolver {
  
  public async resolve(candidates: any[], config: SelectionConfig, owner: UnitCard): Promise<any[]> {
      if (candidates.length === 0) return [];

      switch (config.strategy) {
          case 'Player':
              // Pause game and ask owner
              // Check for single candidate auto-selection optimization?
              // Current decision: Always ask if strategy is Player.
              
              const result = await owner.requestInput({
                  type: 'select_target',
                  candidates: candidates,
                  min: config.min || 1,
                  max: config.max || 1,
                  context: 'Reaction Target Selection'
              });
              
              return result || [];

          case 'Random':
              // Pick N randoms
              const count = config.max || 1;
              // Shuffle and slice
              const shuffled = [...candidates].sort(() => 0.5 - Math.random());
              return shuffled.slice(0, count);

          case 'All':
          default:
              return candidates;
      }
  }
}
