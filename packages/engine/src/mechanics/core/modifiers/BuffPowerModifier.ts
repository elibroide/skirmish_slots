import { Modifier, ModifierContext, ModifierConfig } from './Modifier';
import type { UnitCard } from '../../cards/Card';
import type { GameEntity } from '../../../entities/base/GameEntity';

export class BuffPowerModifier extends Modifier {
    get type(): 'BuffPower' { return 'BuffPower'; }

    // Store applied values to support dynamic removal (though for stateless buffs, usually just tracking amount is enough)
    // But since value can be dynamic (e.g. valid targets count), recalculation logic is handled by PassiveTrait re-applying?
    // PassiveTrait architecture: "conditions" toggle on/off.
    // If condition is MET, apply is called. If UN-MET, remove is called.
    // However, if the VALUE changes (e.g. +1 per Ally), PassiveTrait needs to update.
    // We'll solve the dynamic updates later; for now, simple apply/remove.

    apply(target: GameEntity, context: ModifierContext): void {
        const unit = target as unknown as UnitCard;
        // Simple static value check for now. Later use ValueResolver.
        // Assuming value is a number or simple static object
        let val = 0;
        if (typeof this.config.value === 'number') {
            val = this.config.value;
        } else if (this.config.value && this.config.value.type === 'static') {
            val = Number(this.config.value.value);
        } else {
            console.warn('BuffPowerModifier: value resolution not fully implemented for non-static values');
            return;
        }

        unit.addPower(val);
    }

    remove(target: GameEntity, context: ModifierContext): void {
        const unit = target as unknown as UnitCard;
        // Same logic to resolve value - assumption: value hasn't changed since apply?
        // Ideally we track what we applied.
        // For MVP, re-resolve.
        
        let val = 0;
        if (typeof this.config.value === 'number') {
            val = this.config.value;
        } else if (this.config.value && this.config.value.type === 'static') {
            val = Number(this.config.value.value);
        }

        unit.addPower(-val);
    }
}
