import type { GameAction } from '@skirmish/engine';

/**
 * CommandBuffer - Stores incoming network actions indexed by sequence
 * 
 * Used by NetworkController to retrieve actions in order.
 * Supports waiting for actions that haven't arrived yet from the network.
 */
export class CommandBuffer {
  private commands: Map<number, GameAction> = new Map();
  private waiters: Map<number, (action: GameAction) => void> = new Map();
  private nextExpectedIndex: number = 0;

  /**
   * Add an action to the buffer
   * If someone is waiting for this action, resolve their promise
   */
  addCommand(sequenceId: number, action: GameAction): void {
    this.commands.set(sequenceId, action);

    const waiter = this.waiters.get(sequenceId);
    console.log(`[Network CommandBuffer] add command seqId: ${sequenceId}, action: ${action}, waiter: ${!!waiter}`);
    if (waiter) {
      waiter(action);
      this.waiters.delete(sequenceId);
    }
  }

  /**
   * Get an action if it's already in the buffer, or null if not
   */
  getCommand(sequenceId: number): GameAction | null {
    return this.commands.get(sequenceId) ?? null;
  }

  /**
   * Wait for an action to arrive
   * Returns immediately if already in buffer, otherwise waits for network delivery
   */
  async waitForCommand(sequenceId: number): Promise<GameAction> {
    const existing = this.commands.get(sequenceId);
    console.log(`[Network CommandBuffer] wait for Command seqId: ${sequenceId}, existing: ${!!existing}`);
    if (existing) {
      return existing;
    }

    return new Promise((resolve) => {
      this.waiters.set(sequenceId, resolve);
    });
  }

  /**
   * Get the next expected command index
   */
  getNextExpectedIndex(): number {
    return this.nextExpectedIndex;
  }

  /**
   * Set the next expected command index (used when initializing)
   */
  setNextExpectedIndex(index: number): void {
    this.nextExpectedIndex = index;
  }

  /**
   * Clear all commands and waiters (used when resetting)
   */
  clear(): void {
    this.commands.clear();
    
    // Reject any pending waiters
    this.waiters.forEach((resolve) => {
      // In a real scenario, we might want to throw an error here
    });
    this.waiters.clear();
  }

  /**
   * Get count of buffered commands
   */
  size(): number {
    return this.commands.size;
  }

  /**
   * Check if a command is buffered
   */
  hasCommand(sequenceId: number): boolean {
    return this.commands.has(sequenceId);
  }
}

