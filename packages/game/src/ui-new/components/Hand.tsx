import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, HandSettings, BASE_CARD_HEIGHT } from './Card';
import { DraggedCard } from './DraggedCard';
import { ReturningCard } from './ReturningCard';
import type { CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';

interface HandProps {
    cards: CardInstance[];
    settings: HandSettings;
    templates: CardTemplate[];
    schema: CardSchema;
    onRemoveCard: (id: string) => void;
    setCards: React.Dispatch<React.SetStateAction<CardInstance[]>>;
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
    templates,
    schema,
    onRemoveCard,
    setCards // Needed to calculate return position correctly based on index
}) => {
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

    // Use a fixed ref for bin since it's likely outside, or we find it by selector
    // In the original code, binRef was inside the component. Here we might need to find it.

    const handleHover = useCallback((index: number) => {
        if (!dragState.isDragging)
        {
            setHoveredIndex(index);
        }
    }, [dragState.isDragging]);

    const handleLeave = useCallback(() => {
        if (!dragState.isDragging)
        {
            setHoveredIndex(null);
        }
    }, [dragState.isDragging]);

    const [dragStartPos, setDragStartPos] = useState<DragStartPos | null>(null);
    const [pendingDrag, setPendingDrag] = useState<PendingDrag | null>(null);
    const [isMouseDown, setIsMouseDown] = useState(false);

    const handleDragStart = useCallback((e: React.MouseEvent, card: CardInstance, index: number) => {
        e.preventDefault();
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setPendingDrag({ card, index });
        setIsMouseDown(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const currentTime = Date.now();

        // Check if we should start dragging
        if (pendingDrag && dragStartPos && isMouseDown && !dragState.isDragging)
        {
            const dy = dragStartPos.y - e.clientY; // positive when moving UP

            if (dy >= settings.dragThresholdY)
            {
                setHoveredIndex(null);
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

                // Optional: Trigger visual feedback on bin via class or dispatch custom event
                if (isOverBin)
                {
                    binElement.setAttribute('data-hovered', 'true');
                } else
                {
                    binElement.removeAttribute('data-hovered');
                }
            }
        }
    }, [dragState.isDragging, dragState.lastPosition, dragState.lastTime, dragState.velocity, pendingDrag, dragStartPos, isMouseDown, settings]);

    const handleMouseUp = useCallback(() => {
        setIsMouseDown(false);
        if (pendingDrag)
        {
            setPendingDrag(null);
            setDragStartPos(null);
        }

        if (dragState.isDragging && dragState.card)
        {
            const binElement = document.getElementById('destroy-zone');
            if (binElement) binElement.removeAttribute('data-hovered');

            if (binHovered)
            {
                onRemoveCard(dragState.card.id);
            } else
            {
                // Return to hand
                const cardIndex = cards.findIndex(c => c.id === dragState.card!.id);
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
    }, [dragState, binHovered, pendingDrag, cards, settings, onRemoveCard]);

    useEffect(() => {
        let frameId: number;
        if (dragState.isDragging)
        {
            const loop = () => {
                setDragState(prev => {
                    if (!prev.isDragging) return prev;

                    const now = Date.now();
                    const timeSinceLastMove = now - prev.lastTime;

                    // If we haven't moved in 50ms, start decaying velocity
                    if (timeSinceLastMove > 50)
                    {
                        // Stop if already negligible
                        if (Math.abs(prev.velocity.x) < 0.1 && Math.abs(prev.velocity.y) < 0.1)
                        {
                            return prev;
                        }

                        // Apply a gentle decay per frame (adjust 0.9 as needed for smoothness)
                        const decayFactor = 0.92;
                        return {
                            ...prev,
                            velocity: {
                                x: prev.velocity.x * decayFactor,
                                y: prev.velocity.y * decayFactor
                            }
                        };
                    }
                    return prev;
                });
                frameId = requestAnimationFrame(loop);
            };
            frameId = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(frameId);
    }, [dragState.isDragging]); // Only restart when drag status changes

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

    return (
        <>
            {/* Container for the fan */}
            <div
                data-card-fan
                style={{
                    position: 'absolute',
                    bottom: `${settings.baseY}px`,
                    left: `${settings.baseX}%`,
                    transform: 'translateX(-50%)',
                    width: '600px', // Fixed width container for stable perspective logic
                    height: '350px',
                    perspective: `${settings.perspective}px`,
                    perspectiveOrigin: '50% 50%',
                    pointerEvents: 'none', // Allow clicking through empty space
                }}
            >
                <div style={{ pointerEvents: 'auto', width: '100%', height: '100%', position: 'relative' }}>
                    {cards.map((card, index) => (
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
                            isDragging={dragState.isDragging && dragState.card?.id === card.id}
                            isReturning={returningCard?.card?.id === card.id}
                            settings={settings}
                            templates={templates}
                            schema={schema}
                        />
                    ))}
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

