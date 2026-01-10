import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { Hand } from './Hand';
import type { PlayerId, TerrainId } from '@skirmish/engine';
import { visualAssetManager } from '../../utils/VisualAssetManager';

interface ConnectedHandProps {
    playerId: PlayerId;
    isFacedown?: boolean;
    onCardDrop?: (
        cardId: string,
        targetSlot: { playerId: PlayerId, terrainId: TerrainId },
        dropPosition: { x: number, y: number },
        startPosition: { x: number, y: number }
    ) => void;
}


export const ConnectedHand: React.FC<ConnectedHandProps> = ({
    playerId,
    isFacedown = false,
    onCardDrop
}) => {
    // Select Data from Store with shallow comparison
    const frameCards = useGameStore(useShallow(state => state.players[playerId]?.hand || []));
    const settings = useGameStore(useShallow(state => state.boardSettings.handSettings));

    // Optimistic Hiding State
    const [hiddenCardIds, setHiddenCardIds] = useState<Set<string>>(new Set());

    // Sync Hidden Cards with Store Updates
    useEffect(() => {
        setHiddenCardIds(prev => {
            const next = new Set(prev);
            let changed = false;
            next.forEach(id => {
                if (!frameCards.find(c => c.id === id))
                {
                    next.delete(id);
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [frameCards]);

    // Filter out hidden cards
    const visibleCards = useMemo(() =>
        frameCards.filter(c => !hiddenCardIds.has(c.id)),
        [frameCards, hiddenCardIds]);

    // Map Engine State to UI CardInstance - NO LONGER NEEDED (Store has hydrated instances)
    const mappedCards = visibleCards;

    // visual assets
    const templates = useMemo(() => visualAssetManager.getTemplates(), []);
    const schema = useMemo(() => visualAssetManager.getSchema(), []);


    // Handler Wrapper
    const handleCardDrop = (
        cardId: string,
        targetSlot: { playerId: PlayerId, terrainId: TerrainId },
        dropPosition: { x: number, y: number },
        startPosition: { x: number, y: number }
    ) => {
        console.log(`[ConnectedHand] Dropped ${cardId}. Optimistically hiding.`);

        // 1. Optimistically hide
        setHiddenCardIds(prev => {
            const next = new Set(prev);
            next.add(cardId);
            return next;
        });

        // 2. Call Parent
        if (onCardDrop)
        {
            onCardDrop(cardId, targetSlot, dropPosition, startPosition);
        }
    };

    return (
        <Hand
            cards={mappedCards as any[]}
            setCards={() => { }} // No-op: Store is source of truth
            onRemoveCard={() => { }} // No-op: Hand emits onCardDrop, we handle hiding there
            settings={settings}
            templates={templates}
            schema={schema}
            isFacedown={isFacedown}
            onCardDrop={handleCardDrop}
        />
    );
};
