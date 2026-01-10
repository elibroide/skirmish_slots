import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Card, HandSettings, BASE_CARD_HEIGHT } from './Card';
import { DraggedCard } from './DraggedCard';
import { ReturningCard } from './ReturningCard';
import type { CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';
import { useGameStore, BoardSlot } from '../../store/gameStore';
import { useAnimationStore } from '../../store/animationStore';
import { TerrainId, PlayerId, getGlobalEngine } from '@skirmish/engine';

interface HandProps {
    cards: CardInstance[];
    settings: HandSettings;
    templates: CardTemplate[];
    schema: CardSchema;
    onRemoveCard: (id: string) => void;
    setCards: React.Dispatch<React.SetStateAction<CardInstance[]>>;
    isFacedown?: boolean; // Renamed from isOpponent
    onCardDrop?: (
        cardId: string,
        targetSlot: { playerId: PlayerId, terrainId: TerrainId },
        dropPosition: { x: number, y: number },
        startPosition: { x: number, y: number }
    ) => void;
}

interface DragState {
    isDragging: boolean;
    card: CardInstance | null;
    index: number | null;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    lastPosition: { x: number; y: number };
    lastTime: number;
}

interface ReturningCardState {
    card: CardInstance;
    fromPosition: { x: number; y: number };
    targetPosition: { x: number; y: number };
    rotation: number;
}



interface DragStartPos {
    x: number;
    y: number;
}

interface PendingDrag {
    card: CardInstance;
    index: number;
}

export const Hand: React.FC<HandProps> = ({
    cards,
    settings,
    settings: initialSettings, // Aliased to allow override if needed, but we use 'settings' prop
    templates,
    schema,
    onRemoveCard,
    setCards,
    isFacedown = false,
    onCardDrop
}) => {
    // Subscribe to active animations to hide cards being played
    const activeTasks = useAnimationStore(state => state.activeTasks);
    const animatingCardIds = activeTasks
        .filter(t => t.type === 'card_play' && t.payload.cardId)
        .map(t => t.payload.cardId);

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        card: null,
        index: null,
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        lastPosition: { x: 0, y: 0 },
        lastTime: 0
    });
    const [returningCard, setReturningCard] = useState<ReturningCardState | null>(null);

    const [binHovered, setBinHovered] = useState(false);

    // Subscribe to animation settings
    const animationSettings = useGameStore(state => state.boardSettings.animationSettings);

    // Facedown (Opponent) Logic: No interactions
    const canInteract = !isFacedown;
    const setHoveredCard = useGameStore(state => state.setHoveredCard);

    // Playability Check (Engine Integration)
    const localPlayerId = useGameStore(state => state.localPlayerId);
    const gameState = useGameStore(state => state.gameState); // Subscribe to updates
    const [playableCardIds, setPlayableCardIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isFacedown || localPlayerId === undefined)
        {
            setPlayableCardIds(new Set());
            return;
        }

        const engine = getGlobalEngine();
        if (!engine) return;

        // Check legal actions
        // We use a timeout to avoid blocking the render loop heavily every frame, 
        // though typically run on state change is fine.
        const legalActions = engine.getLegalActions(localPlayerId);

        const ids = new Set<string>();
        legalActions.forEach(action => {
            if (action.type === 'PLAY_CARD')
            {
                ids.add(action.cardId);
            }
        });
        setPlayableCardIds(ids);

    }, [gameState, localPlayerId, isFacedown]);

    const handleHover = useCallback((index: number) => {
        if (!dragState.isDragging && canInteract)
        {
            console.log(`[Hand] Hover card in hand: ${index}`);
            setHoveredIndex(index);
            setHoveredCard(cards[index]);
        }
    }, [dragState.isDragging, canInteract, cards, setHoveredCard]);

    const handleLeave = useCallback(() => {
        if (!dragState.isDragging && canInteract)
        {
            setHoveredIndex(null);
            setHoveredCard(null);
        }
    }, [dragState.isDragging, canInteract, setHoveredCard]);

    const [dragStartPos, setDragStartPos] = useState<DragStartPos | null>(null);
    const [pendingDrag, setPendingDrag] = useState<PendingDrag | null>(null);
    const [isMouseDown, setIsMouseDown] = useState(false);

    const handleDragStart = useCallback((e: React.MouseEvent, card: CardInstance, index: number) => {
        if (!canInteract) return;
        e.preventDefault();
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setPendingDrag({ card, index });
        setIsMouseDown(true);
    }, [canInteract]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!canInteract) return;
        const currentTime = Date.now();

        // Check if we should start dragging
        if (pendingDrag && dragStartPos && isMouseDown && !dragState.isDragging)
        {
            const dy = dragStartPos.y - e.clientY; // positive when moving UP

            if (dy >= settings.dragThresholdY)
            {
                setHoveredIndex(null);
                console.log(`[Hand] Card picked up: ${pendingDrag.card.id}`);
                setDragState({
                    isDragging: true,
                    card: pendingDrag.card,
                    index: pendingDrag.index,
                    position: { x: e.clientX, y: e.clientY },
                    velocity: { x: 0, y: 0 },
                    lastPosition: { x: e.clientX, y: e.clientY },
                    lastTime: currentTime
                });
                setPendingDrag(null);
                setDragStartPos(null);
            }
        }

        // Check for Slot Hover during Drag
        if (dragState.isDragging && dragState.card)
        {
            const distinctElements = document.elementsFromPoint(e.clientX, e.clientY);
            let foundSlot = false;

            for (const el of distinctElements)
            {
                const pidStr = el.getAttribute('data-player-id');
                const tidStr = el.getAttribute('data-terrain-id');

                if (pidStr && tidStr)
                {
                    const playerId = parseInt(pidStr) as PlayerId;
                    const terrainId = parseInt(tidStr) as TerrainId;

                    // Check if valid slot in store
                    const slotData = useGameStore.getState().players[playerId]?.slots[terrainId];
                    // Only valid if empty (and belongs to correct player? assume yes for now)
                    if (slotData && !slotData.content)
                    {
                        useGameStore.getState().setHoveredSlot({ playerId, terrainId });
                        foundSlot = true;
                        break;
                    }
                }
            }

            if (!foundSlot)
            {
                useGameStore.getState().setHoveredSlot(null);
            }
        }

        // Update drag position
        if (dragState.isDragging)
        {
            const timeDelta = currentTime - dragState.lastTime;

            let newVelocity = { x: 0, y: 0 };
            if (timeDelta > 0 && timeDelta < 100)
            {
                const dx = e.clientX - dragState.lastPosition.x;
                const dy = e.clientY - dragState.lastPosition.y;

                const smoothing = settings.tiltSmoothing;
                newVelocity = {
                    x: dragState.velocity.x * (1 - smoothing) + dx * smoothing,
                    y: dragState.velocity.y * (1 - smoothing) + dy * smoothing
                };
            } else
            {
                newVelocity = {
                    x: dragState.velocity.x * settings.velocityDecay,
                    y: dragState.velocity.y * settings.velocityDecay
                };
            }

            setDragState(prev => ({
                ...prev,
                position: { x: e.clientX, y: e.clientY },
                velocity: newVelocity,
                lastPosition: { x: e.clientX, y: e.clientY },
                lastTime: currentTime
            }));

            // Check if over bin - assuming bin has id 'destroy-zone'
            const binElement = document.getElementById('destroy-zone');
            if (binElement)
            {
                const binRect = binElement.getBoundingClientRect();
                const isOverBin =
                    e.clientX >= binRect.left &&
                    e.clientX <= binRect.right &&
                    e.clientY >= binRect.top &&
                    e.clientY <= binRect.bottom;
                setBinHovered(isOverBin);

                if (isOverBin)
                {
                    binElement.setAttribute('data-hovered', 'true');
                } else
                {
                    binElement.removeAttribute('data-hovered');
                }
            }
        }
    }, [dragState.isDragging, dragState.lastPosition, dragState.lastTime, dragState.velocity, pendingDrag, dragStartPos, isMouseDown, settings, canInteract]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!canInteract) return;
        setIsMouseDown(false);
        if (pendingDrag)
        {
            setPendingDrag(null);
            setDragStartPos(null);
        }

        if (dragState.isDragging && dragState.card)
        {
            // DOM-based Collision Detection for React Board
            const distinctElements = document.elementsFromPoint(e.clientX, e.clientY);
            console.log(`[Hand] Checking drop at ${e.clientX}, ${e.clientY}. Found ${distinctElements.length} elements.`);

            let droppedOnSlotId: { playerId: PlayerId, terrainId: TerrainId } | null = null;
            let droppedSlotPos: { x: number, y: number } | null = null;

            for (const el of distinctElements)
            {
                const pidStr = el.getAttribute('data-player-id');
                const tidStr = el.getAttribute('data-terrain-id');

                if (pidStr && tidStr)
                {
                    const playerId = parseInt(pidStr) as PlayerId;
                    const terrainId = parseInt(tidStr) as TerrainId;

                    console.log(`[Hand] Potential slot hit: ${playerId}-${terrainId}`);

                    // Check if valid slot in store
                    const slotData = useGameStore.getState().players[playerId]?.slots[terrainId];
                    if (slotData)
                    {
                        if (!slotData.content)
                        {
                            console.log(`[Hand] Slot ${playerId}-${terrainId} is empty and valid.`);
                            droppedOnSlotId = { playerId, terrainId };
                            const rect = el.getBoundingClientRect();
                            droppedSlotPos = {
                                x: rect.left + rect.width / 2,
                                y: rect.top + rect.height / 2
                            };
                            break;
                        } else
                        {
                            console.log(`[Hand] Slot ${playerId}-${terrainId} is occupied.`);
                        }
                    } else
                    {
                        console.log(`[Hand] Slot ${playerId}-${terrainId} not found in store.`);
                    }
                }
            }

            if (droppedOnSlotId !== null && droppedSlotPos)
            {
                // SUCCESS: Play Card -> Emit Event
                console.log(`[Hand] Card dropped on slot: ${droppedOnSlotId}`);

                if (onCardDrop)
                {
                    onCardDrop(
                        dragState.card.id,
                        droppedOnSlotId,
                        droppedSlotPos,
                        dragState.position
                    );
                } else
                {
                    console.warn('[Hand] onCardDrop prop not provided, but card was dropped on a valid slot.');
                    // Fallback or just remove? For now, we expect parent to handle it.
                    // If we don't remove it here, it snaps back.
                    // But if we remove it here, we duplicate logic if parent also removes it.
                    // The instruction was: "Remove onRemoveCard call (let parent handle it)".
                }

                // Note: Logic update (occupySlot) now needs to happen when animation completes.
                // We likely need to pass a callback or handle it in AnimationLayer?
                // Actually, the previous implementation handled it in 'onComplete'.
                // The AnimationLayer will call 'complete' on Manager.
                // But who calls 'occupySlot'? 
                // Ideally, the Manager should support 'onComplete' Logic? 
                // OR, we optimistically update store now? No, user wants animation then logic.

                // Refined Plan:
                // AnimationManager tasks can have `onComplete` callbacks purely for logic.
                // I'll update AnimationTask interface or just hack it into payload?
                // Better: The AnimationLayer calls Manager.complete().
                // The Manager should probably execute a callback attached to the task?

                // Let's modify AnimationManager to support task callbacks.
                // For now, I'll pass it in payload as a hack or update Manager definition.
                // Updating Manager definition is cleaner. But let's check Manager file again.
                // I didn't add onComplete to Task.

                // Temporary fix: I will pass a function in the payload if AnimationLayer supports it?
                // No, AnimationTask payload is 'any'.
                // I can put `onFinish: () => void` in payload and have AnimationLayer call it.


            } else
            {
                // Return to hand
                console.log(`[Hand] Card dropped on nothing/invalid. Returning.`);
                const cardIndex = cards.findIndex(c => c.id === dragState.card!.id);
                // Fallback if not found

                const totalCards = cards.length;
                const centerIndex = (totalCards - 1) / 2;
                const offsetFromCenter = cardIndex - centerIndex;

                // Calculate how many cards are "extra" beyond the squeeze threshold
                const maxCards = settings.maxCardsSqueeze || 100;
                const extraCards = Math.max(0, totalCards - maxCards);

                // Apply linear decay per extra card (matching Card.tsx logic)
                const effectiveSpacing = Math.max(10, settings.fanSpacing - (extraCards * (settings.squeezeSpacing || 0)));
                const effectiveRotation = Math.max(0, settings.fanRotation - (extraCards * (settings.squeezeRotation || 0)));
                const effectiveArcHeight = Math.max(0, settings.fanArcHeight - (extraCards * (settings.squeezeArcHeight || 0)));

                const baseTranslateX = offsetFromCenter * effectiveSpacing;

                // Parabolic Arc Calculation using effective height
                const baseTranslateY = Math.pow(offsetFromCenter, 2) * effectiveArcHeight;
                const baseRotation = offsetFromCenter * effectiveRotation;

                const fanContainer = document.querySelector('[data-card-fan]');
                if (fanContainer)
                {
                    const containerRect = fanContainer.getBoundingClientRect();
                    const cardHeight = BASE_CARD_HEIGHT * settings.cardScale;

                    const targetX = containerRect.left + containerRect.width / 2 + baseTranslateX;
                    const targetY = containerRect.bottom - 20 - (cardHeight / 2) + baseTranslateY;

                    setReturningCard({
                        card: dragState.card,
                        fromPosition: { ...dragState.position },
                        targetPosition: { x: targetX, y: targetY },
                        rotation: baseRotation
                    });
                }
            }

            setDragState({
                isDragging: false,
                card: null,
                index: null,
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
                lastPosition: { x: 0, y: 0 },
                lastTime: 0
            });
            setBinHovered(false);
        }
    }, [dragState, binHovered, pendingDrag, cards, settings, onRemoveCard, canInteract]);

    useEffect(() => {
        let frameId: number;
        if (dragState.isDragging)
        {
            const loop = () => {
                setDragState(prev => {
                    if (!prev.isDragging) return prev;

                    const now = Date.now();
                    const timeSinceLastMove = now - prev.lastTime;

                    if (timeSinceLastMove > 50)
                    {
                        if (Math.abs(prev.velocity.x) < 0.1 && Math.abs(prev.velocity.y) < 0.1) return prev;
                        const decayFactor = settings.velocityDecay || 0.85;
                        return { ...prev, velocity: { x: prev.velocity.x * decayFactor, y: prev.velocity.y * decayFactor } };
                    }
                    return prev;
                });
                frameId = requestAnimationFrame(loop);
            };
            frameId = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(frameId);
    }, [dragState.isDragging, settings.velocityDecay]);

    useEffect(() => {
        if (dragState.isDragging || isMouseDown)
        {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragState.isDragging, isMouseDown, handleMouseMove, handleMouseUp]);
    const getCardGlowState = useCallback((cardId: string, isDraggingThisCard: boolean): 'none' | 'playable' | 'dragging' | 'targeting' => {
        if (isDraggingThisCard)
        {
            return 'dragging';
        }
        if (settings.debugForcePlayable)
        {
            return 'playable';
        }
        if (playableCardIds.has(cardId))
        {
            return 'playable';
        }
        return 'none';
    }, [settings.debugForcePlayable, playableCardIds]);

    const draggedCardGlowState = React.useMemo(() => {
        const storeState = useGameStore.getState();
        const hoveredSlot = storeState.hoveredSlot; // Use new simple hoveredSlot

        // Return explicit valid/invalid states
        if (hoveredSlot !== null) return 'valid-target';
        return 'invalid-target';
    }, [dragState.isDragging, useGameStore.getState().hoveredSlot]);

    // Dynamic Style for Container
    const handContainerStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${settings.baseX}%`,
        transform: 'translateX(-50%)',
        width: '600px',
        height: '350px',
        perspective: `${settings.perspective}px`,
        perspectiveOrigin: '50% 50%',
        pointerEvents: 'none',
    };

    if (isFacedown)
    {
        // Use facedown settings for positioning
        handContainerStyle.top = `${settings.facedownBaseY}px`;
        handContainerStyle.left = '50%';
        handContainerStyle.marginLeft = `${settings.facedownBaseX}px`;
        handContainerStyle.bottom = 'auto';
    } else
    {
        handContainerStyle.bottom = `${settings.baseY}px`;
        handContainerStyle.top = 'auto';
    }

    return (
        <>
            <div data-card-fan style={handContainerStyle}>
                <div style={{ pointerEvents: 'auto', width: '100%', height: '100%', position: 'relative' }}>
                    {cards.map((card, index) => {
                        // Skip rendering if card is being animated
                        if (animatingCardIds.includes(card.id)) return null;

                        // Calculate position
                        const isDraggingThis = canInteract && dragState.isDragging && dragState.card?.id === card.id;
                        const glowState = getCardGlowState(card.id, isDraggingThis);

                        return (
                            <Card
                                key={card.id}
                                card={card}
                                index={index}
                                totalCards={cards.length}
                                isHovered={hoveredIndex === index}
                                hoveredIndex={hoveredIndex}
                                onHover={handleHover}
                                onLeave={handleLeave}
                                onDragStart={handleDragStart}
                                isDragging={isDraggingThis}
                                isReturning={returningCard?.card?.id === card.id}
                                settings={settings}
                                templates={templates}
                                schema={schema}
                                glowState={glowState}
                                isFacedown={isFacedown}
                            />
                        );
                    })}
                </div>
            </div>

            {dragState.isDragging && dragState.card && (
                <DraggedCard
                    card={dragState.card}
                    position={dragState.position}
                    velocity={dragState.velocity}
                    settings={settings}
                    templates={templates}
                    schema={schema}
                    glowState={draggedCardGlowState as any}
                />
            )}

            {returningCard && (
                <ReturningCard
                    card={returningCard.card}
                    fromPosition={returningCard.fromPosition}
                    targetPosition={returningCard.targetPosition}
                    rotation={returningCard.rotation}
                    onComplete={() => setReturningCard(null)}
                    settings={settings}
                    templates={templates}
                    schema={schema}
                />
            )}
        </>
    );
};
