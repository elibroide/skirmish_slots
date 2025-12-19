import { useMemo } from 'react';
import type { Card, UnitCard } from '../engine/cards/Card';
import { visualAssetManager } from '../utils/VisualAssetManager';

export interface CardViewModel {
  template: any;
  data: any;
  schema: any;
}

export function useCardViewModel(card: Card | UnitCard | null): CardViewModel | null {
  return useMemo(() => {
    if (!card) return null;

    // 1. Get Visual Data (Art, Layout, Frame)
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
      description: card.description, // Use engine description (reflects modifications?? Not yet but could)
      
      // Unit Specific Overrides
      ...((card.getType() === 'unit') ? {
        power: (card as UnitCard).power, // Real-time power (buffs/damage)
        rarity: (card as UnitCard).rarity,
        color: (card as UnitCard).color,
        type: (card as UnitCard).unitType, // "Human Knight" etc.
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
  }, [card, card?.name, (card as any)?.power, (card as any)?.description]); // Re-compute on critical updates
}
