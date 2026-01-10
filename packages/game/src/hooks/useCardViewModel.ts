import { useMemo } from 'react';
import type { UnitState, ActionState } from '@skirmish/engine/src/core/types';
import { visualAssetManager } from '../utils/VisualAssetManager';

export interface CardViewModel {
  template: any;
  data: any;
  schema: any;
}

type CardState = UnitState | ActionState;

export function useCardViewModel(card: CardState | null): CardViewModel | null {
  return useMemo(() => {
    if (!card) return null;

    // 0. Check for Direct Config (Single Source of Truth)
    if (card.config) {
        const config = card.config;
        
        // Merge dynamic engine data
        const mergedData = {
            ...config.data,
            name: card.name,
            description: card.description,
            ...(card.type === 'unit' ? {
                power: (card as UnitState).power,
                rarity: (card as UnitState).rarity,
                color: (card as UnitState).color,
                type: (card as UnitState).unitType,
            } : {})
        };

        return {
            template: visualAssetManager.getTemplate(config.templateId),
            data: {
                id: card.id, // Use runtime ID
                templateId: config.templateId,
                data: mergedData,
                artConfig: config.artConfig,
                frameVariantId: config.frameVariantId
            },
            schema: visualAssetManager.getSchema()
        };
    }

    // 1. Fallback: Get Visual Data (Art, Layout, Frame) from Manager
    const visualData = visualAssetManager.getVisuals(card.name);

    if (!visualData) {
      console.warn(`[useCardViewModel] No visual data found for card: ${card.name}`);
      return null;
    }

    // 2. Get Template & Schema
    const template = visualAssetManager.getTemplate(visualData.templateId);
    const schema = visualAssetManager.getSchema();

    if (!template) {
      console.warn(`[useCardViewModel] Template not found: ${visualData.templateId}`);
      return null;
    }

    // 3. Merge Data (Engine Logic Overrides Visual Defaults)
    const mergedData = {
      ...visualData.data, // Base visual data (Art URL, Coordinates)
      
      // Dynamic Overrides from Engine
      name: card.name,
      description: card.description,
      
      // Unit Specific Overrides
      ...((card.type === 'unit') ? {
        power: (card as UnitState).power,
        rarity: (card as UnitState).rarity,
        color: (card as UnitState).color,
        type: (card as UnitState).unitType,
      } : {})
    };

    return {
      template,
      data: {
        id: visualData.cardId,
        templateId: visualData.templateId,
        data: mergedData,
        artConfig: visualData.artConfig,
        frameVariantId: visualData.frameVariantId
      },
      schema
    };
  }, [card, card?.name, (card as any)?.power, (card as any)?.description]); 
}
