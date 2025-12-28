import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Hand } from './Hand';
import orderData from '../Data/order.json';
import type { PlayerId, TerrainId } from '@skirmish/engine';

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
    // Select Data from Store
    const frameCards = useGameStore(state => state.players[playerId]?.hand || []);
    const settings = useGameStore(state => state.boardSettings.handSettings);

    // Optimistic Hiding State
    // Used to hide cards immediately when dropped, before the Engine state update arrives.
    const [hiddenCardIds, setHiddenCardIds] = useState<Set<string>>(new Set());

    // Sync Hidden Cards with Store Updates
    // If a card is removed from the store (engine confirmed play), remove from hidden set (cleanup)
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
            cards={visibleCards}
            setCards={() => { }} // No-op: Store is source of truth
            onRemoveCard={() => { }} // No-op: Hand emits onCardDrop, we handle hiding there
            settings={settings}
            templates={orderData.templates as any}
            schema={orderData.schema as any}
            isFacedown={isFacedown}
            onCardDrop={handleCardDrop}
        />
    );
};
