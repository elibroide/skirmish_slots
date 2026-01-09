import type { TraitDefinition } from '../core/TraitFactory';
export interface UnitCardDefinition {
    name: string;
    description: string;
    basePower: number;
    traits: TraitDefinition[];
    rarity: 'Bronze' | 'Silver' | 'Gold';
    color: 'Red' | 'Purple';
    unitType: string;
}
export declare const UNIT_CARD_DEFINITIONS: Record<string, UnitCardDefinition>;
export type UnitCardId = keyof typeof UNIT_CARD_DEFINITIONS;
