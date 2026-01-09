import type { UnitCard } from '../../cards/Card';
import type { TargetSelector } from './ReactTypes';
// Actually, ReactionTrait.md defines these schemas. I should probably create a central `Types.ts` in `core/react` to avoid circular deps.

// Let's define the Types in a separate file first to be clean.
// But for now, I will stick to putting types in the Resolver or a shared types file.
// A shared `ReactTypes.ts` in `core/react` is a good idea.

export type ValueSource = 'static' | 'target' | 'me';

export interface ValueSelector {
  type: ValueSource;
  value: any;
  target?: any; // Should be TargetSelector config, but avoiding circular dep for now. Usage: filtered by TargetResolver
}

export class ValueResolver {
  // We need a way to resolve targets if source is 'target'.
  // But TargetResolver uses ValueResolver (probably not, but maybe for values inside conditions?).
  // Actually TargetResolver uses Condition, Condition uses ValueResolver.
  // ValueResolver might need TargetResolver if type is 'target' and it has a sub-target selector.
  // This implies recursion/dependency.
  
  // For simplicity, `type: 'target'` usually implies "Target of the Event" or "Target found by a selector".
  // The spec says:
  // type: target, value: "power", target: { type: 'Relative' ... }
  // So yes, ValueResolver needs to call TargetResolver.
  
  // Implementation note: I'll inject a resolveTarget callback or interface to avoid hard circular link.
  
  constructor(
    private targetResolver: (selector: any, context: any) => any[] // Returns found objects (Units/Slots)
  ) {}

  public resolve(selector: ValueSelector, context: any, owner: UnitCard): any {
    switch (selector.type) {
      case 'static':
        return selector.value;
      
      case 'me':
        return this.getProperty(owner, selector.value);
      
      case 'target':
        if (!selector.target) {
            // implicit target? or error? Spec says required only if type is target.
            // If missing, maybe usage implies "Context Target"? 
            // Let's assume strict compliance: must have target selector.
            // OR context.victim / context.unit if available? 
            // Spec usage example 10: target: { type: 'Relative', ... }
            if (context.target) return this.getProperty(context.target, selector.value); // Fallback to context target?
            console.warn("ValueSelector type 'target' missing target selector");
            return 0;
        }

        const targets = this.targetResolver(selector.target, context);
        if (targets.length === 0) return 0; // or null?
        // Default to first target? Sum? Spec doesn't say.
        // Usually "my power becomes equal to opposing enemy" implies one target.
        return this.getProperty(targets[0], selector.value); // Use first found

      default:
        return selector.value;
    }
  }

  public getProperty(obj: any, path: string): any {
    if (!obj) return 0;
    
    // Handle nested paths like "slot.modifier" or "lastSlot.modifier"
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  }

}
