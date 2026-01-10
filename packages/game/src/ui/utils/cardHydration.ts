import { CardState, UnitState } from '@skirmish/engine';
import { CardInstance } from '@skirmish/card-maker';

export function hydrateCard(state: CardState): CardInstance {
    const isUnit = state.type === 'unit';
    
    // Safely access unit specific properties
    const power = isUnit ? (state as UnitState).power : 0;
    const baseHealth = isUnit ? (state as UnitState).baseHealth : 0;
    const currentHealth = isUnit ? (state as UnitState).currentHealth : 0;

    // 1. Prefer Config from Engine (If V2 Card)
    if (state.config) {
        return {
            id: state.id,
            templateId: state.config.templateId,
            
            data: {
                ...state.config.data, // Base static data
                // Dynamic overrides
                name: state.name,
                description: state.description,
                cost: state.cost,
                power: power,
                health: baseHealth,
                tags: state.tags || state.config.data.tags || [],
                abilities: state.abilities || state.config.data.abilities || []
            },
            
            artConfig: state.config.artConfig || {
                imageUrl: '',
                x: 0, y: 0, scale: 1, isMask: false, 
                maskX: 0, maskY: 0, maskWidth: 100, maskHeight: 100
            },
            
            currentHealth: currentHealth,
            currentPower: power,
            frameVariantId: state.config.frameVariantId,
            
            engineId: state.id
        } as unknown as CardInstance;
    }

    // 2. Fallback (Legacy/V1 Cards)
    return {
        id: state.id,
        templateId: state.templateId || 'default_template',
        
        data: {
            name: state.name,
            cost: state.cost,
            power: power,
            health: baseHealth,
            description: state.description || '',
            tags: state.tags || [],
            abilities: state.abilities || [],
            laneEffect: '',
            onPlayEffect: ''
        },
        
        artConfig: {
            imageUrl: '',
            x: 0,
            y: 0,
            scale: 1,
            isMask: false,
            maskX: 0,
            maskY: 0,
            maskWidth: 100,
            maskHeight: 100
        },
        
        currentHealth: currentHealth,
        currentPower: power,
        
        engineId: state.id
    } as unknown as CardInstance;
}
