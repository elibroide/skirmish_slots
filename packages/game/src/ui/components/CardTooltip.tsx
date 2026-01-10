import React from 'react';
import type { CardInstance } from '@skirmish/card-maker';
import { KEYWORDS } from '../../data/keywords';

interface CardTooltipProps {
    card: CardInstance;
    settings: {
        show: boolean;
        offsetX: number;
        offsetY: number;
        width: number;
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
    };
    style?: React.CSSProperties; // Allow override
}

export const CardTooltip: React.FC<CardTooltipProps> = ({ card, settings, style }) => {
    if (!settings || !settings.show) return null;

    // Parse keywords from card data
    // Assuming card.keywords is a comma-separated string like "deploy, dominant"
    const rawKeywords = (card as any).data.keywords;

    let parsedKeywords: string[] = [];

    if (Array.isArray(rawKeywords))
    {
        parsedKeywords = rawKeywords;
    } else if (typeof rawKeywords === 'string')
    {
        parsedKeywords = rawKeywords.split(',');
    }

    if (parsedKeywords.length === 0) return null;

    const activeTips = parsedKeywords
        .map((k: string) => k.trim().toLowerCase())
        .map((id: string) => KEYWORDS[id])
        .filter((tip: any) => !!tip);

    if (activeTips.length === 0) return null;

    return (
        <div style={{
            position: 'absolute',
            left: '50%', // Relative to card center
            top: 0, // Align to top of card
            // Apply Offsets
            marginLeft: `${settings.offsetX}px`,
            marginTop: `${settings.offsetY}px`,

            width: `${settings.width}px`,
            backgroundColor: settings.backgroundColor,

            // Stroke (Border)
            border: `${settings.borderWidth}px solid ${settings.borderColor}`,

            borderRadius: '8px',
            padding: '16px',
            color: 'white',
            pointerEvents: 'none',
            zIndex: 9999, // Ensure on top
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            ...style
        }}>
            {activeTips.map((tip: any) => (
                <div key={tip.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{
                        color: '#fbbf24', // Gold-ish for Name
                        fontWeight: 'bold',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        {tip.name}
                    </div>
                    <div style={{
                        color: '#e5e7eb', // White-ish (Tailwind gray-200 equivalent)
                        fontSize: '12px',
                        lineHeight: '1.4'
                    }}>
                        {tip.text}
                    </div>
                </div>
            ))}
        </div>
    );
};
