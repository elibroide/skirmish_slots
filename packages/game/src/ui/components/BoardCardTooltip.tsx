import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { CardRenderer, CardTemplate, CardSchema } from '@skirmish/card-maker';
import { CardTooltip } from './CardTooltip';
import cardData from '../Data/order.json';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from './Card';

interface BoardCardTooltipProps {
}

export const BoardCardTooltip: React.FC<BoardCardTooltipProps> = () => {
    const hoveredSlot = useGameStore(state => state.dragState.hoveredSlot);
    const players = useGameStore(state => state.players);
    const boardSettings = useGameStore(state => state.boardSettings);
    // Use new split settings
    const { handTooltipSettings = { show: false }, boardTooltipScale = 1, boardTooltipGap = 20, boardTooltipOffsetY = 0 } = boardSettings;

    if (!hoveredSlot || !handTooltipSettings.show) return null;

    const { playerId, terrainId } = hoveredSlot;
    const slotData = players[playerId]?.slots[terrainId];

    // Check if slot has a card
    const contentCardId = slotData?.content?.cardId;
    let cardInstance = slotData?.content?.instance;

    // Resolve Card Instance if missing
    if (!cardInstance && contentCardId)
    {
        const found = (cardData.cards as any[]).find((c: any) => c.id === contentCardId);
        if (found) cardInstance = found;
    }

    if (!cardInstance) return null;

    // Resolve Template
    const template = (cardData.templates as any[]).find(t => t.id === cardInstance?.templateId);
    const schema = cardData.schema as unknown as CardSchema;

    if (!template) return null;

    // Position: We need to know where the slot is to position the tooltip nearby.
    const slotX = slotData.x;
    const slotY = slotData.y;
    const slotWidth = slotData.width;
    const slotHeight = slotData.height;

    // --- Side Logic ---
    // "If the unit is in the middle or right to it, then I expect the card preview to appear on the left"
    // "If the unit is in the left, then I expect the card preview to appear on the right"
    const centerX = window.innerWidth / 2;
    const isLeftSide = slotX < centerX;
    const showTooltipOnRight = isLeftSide;

    // --- Dimensions ---
    const PREVIEW_SCALE = boardTooltipScale;
    const PREVIEW_WIDTH = BASE_CARD_WIDTH * PREVIEW_SCALE;
    const PREVIEW_HEIGHT = BASE_CARD_HEIGHT * PREVIEW_SCALE;

    // --- X Position ---
    // "One offset x... display left most to the card's right most"
    // Gap should always push 'outward' from the slot.
    let tooltipX: number;
    if (showTooltipOnRight)
    {
        // Tooltip Left = Slot Right + Gap
        tooltipX = slotX + slotWidth + boardTooltipGap;
    } else
    {
        // Tooltip Right = Slot Left - Gap
        tooltipX = slotX - PREVIEW_WIDTH - boardTooltipGap;
    }

    // --- Y Position & Alignment ---
    // "Player's units should be aligned at the bottom with the display"
    // "Opponent's units should be aligned at the top with their display"
    // Player ID 0 = Player, 1 = Enemy (usually).
    const isHumanPlayer = playerId === 0;

    let tooltipY: number;

    if (isHumanPlayer)
    {
        // Align Bottoms: Tooltip Bottom = Slot Bottom (+ Offset Y relative to that?)
        // Top = (SlotTop + SlotHeight) - TooltipHeight + Offset
        tooltipY = (slotY + slotHeight) - PREVIEW_HEIGHT + boardTooltipOffsetY;
    } else
    {
        // Align Tops: Tooltip Top = Slot Top + Offset
        tooltipY = slotY + boardTooltipOffsetY;
    }

    // Determine Flex Direction for Keywords
    // If tooltip is on Right: [Preview] [Keywords...]
    // If tooltip is on Left:  [Keywords...] [Preview]
    // The main container is positioned at tooltipX. 
    // IF we are on the Left, the PREVIEW is the anchor. 
    // Wait, if tooltipX is calculated for the PREVIEW_WIDTH, then:
    // On Right: X is Left edge of Preview.
    // On Left: X is Left edge of Preview. (Since X = SlotLeft - PreviewWidth).

    // But we have Keywords too!
    // If on Left side (Tooltip on Right), we want: Slot | Gap | Preview | Keywords
    // If on Right side (Tooltip on Left), we want: Keywords | Preview | Gap | Slot
    // My calculation `tooltipX = slotX - PREVIEW_WIDTH - gap` positions the PREVIEW.
    // If I just render the container at tooltipX, and flex-row-reverse, the preview will be at tooltipX?
    // flex-row-reverse: Items are laid out Right-to-Left. 
    // If I set `left: tooltipX`, that defines the left edge of the CONTAINER.
    // If I use `flex-direction: row-reverse`, the first child (Preview) goes to the Right edge of the container?
    // No. `row-reverse` starts main-axis from right.
    // If I render [Preview, Keywords] with row-reverse:
    // Keywords (left) <- Preview (right)
    // This implies the container width grows to left?
    // Absolute positioning `left` puts the Left edge.
    // If I want [Keywords] [Preview], I need to shift `left` further back by keyword width?
    // But keyword width is dynamic/unknown?

    // User constraint: "left most to the card's right most".
    // This implies the PREVIEW is the anchor adjacent to the slot.
    // The keywords hang off the *far* side.

    // Case 1: Show On Right
    // Slot [Gap] [Preview] [Keywords]
    // TooltipX calculated is Left Edge of Preview.
    // Flex direction: Row.
    // Left: tooltipX. 

    // Case 2: Show On Left
    // [Keywords] [Preview] [Gap] Slot
    // TooltipX calculated is Left Edge of Preview.
    // If I set `Left: tooltipX`, the Preview starts there.
    // I need the Keywords to appear to the LEFT of that.

    // Solution:
    // Render the container at `left: tooltipX` and `width: PREVIEW_WIDTH`.
    // Allow overflow? No.
    // Put the Keywords in a wrapper that is absolutely positioned relative to the Preview?
    // Or just use flex and adjust `left`?
    // If I use a wrapper for the Preview at `tooltipX`, I can hang keywords off it.

    return (
        <div style={{
            position: 'fixed',
            left: `${tooltipX}px`, // This is always the Left edge of the PREVIEW
            top: `${tooltipY}px`,
            zIndex: 10000,
            pointerEvents: 'none',
            // We wrapper is effectively just the Preview in terms of positioning
            width: `${PREVIEW_WIDTH}px`,
            height: `${PREVIEW_HEIGHT}px`,
        }}>
            {/* The Preview Image */}
            <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}>
                <CardRenderer
                    template={template}
                    data={cardInstance}
                    schema={schema}
                    scale={PREVIEW_SCALE}
                />
            </div>

            {/* The Keywords - Positioned Relative to the Preview */}
            <div style={{
                position: 'absolute',
                top: 0,
                // If ShowOnRight: Keywords are to the Right of Preview -> Left = 100% + gap
                // If ShowOnLeft: Keywords are to the Left of Preview -> Right = 100% + gap (or Left = -Width - gap)
                left: showTooltipOnRight ? '100%' : undefined,
                right: showTooltipOnRight ? undefined : '100%',
                marginLeft: showTooltipOnRight ? '16px' : undefined,
                marginRight: showTooltipOnRight ? undefined : '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '300px', // Or auto? Tooltips usually have fixed width
                alignItems: showTooltipOnRight ? 'flex-start' : 'flex-end', // Align text? Or just box
            }}>
                {/* 
                  Since CardTooltip is 'absolute' by default in 'style', we need to override it heavily 
                  OR just wrap it. 
                  Inner CardTooltip expects to be absolute usually.
                  But we can pass style={{ position: 'relative' }}
                */}
                <CardTooltip
                    card={cardInstance}
                    settings={{
                        ...handTooltipSettings,
                        show: true,
                        offsetX: 0,
                        offsetY: 0,
                    }}
                    style={{
                        position: 'relative',
                        left: 'auto',
                        top: 'auto',
                        marginLeft: 0,
                        marginTop: 0,
                        transform: 'none',
                    }}
                />
            </div>
        </div>
    );
};
