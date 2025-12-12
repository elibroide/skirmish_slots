import { ActionCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

export class Repositioning extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('repositioning', 'Repositioning', 'Move an unit to a close slot of the same player.', owner, engine);
  }
  
  async play(target?: any): Promise<void> {}
}

