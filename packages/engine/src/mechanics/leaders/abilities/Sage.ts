import { Leader } from '../Leader';

/**
 * Sage Leader: Draw 1 card
 */
export class Sage extends Leader {
  async execute(): Promise<void> {
    const player = this.engine.getPlayer(this.owner);
    await player.draw(1);
  }
}
