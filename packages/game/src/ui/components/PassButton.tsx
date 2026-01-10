import React from 'react';
import { useGameStore } from '../../store/gameStore';

interface PassButtonProps {
    mode: 'pass' | 'done' | 'cancel' | 'conclude' | 'none';
    status: 'disabled' | 'normal' | 'clicked';
    onClick: () => void;
    onMouseDown?: () => void;
    onMouseUp?: () => void;
}

export const PassButton: React.FC<PassButtonProps> = ({ mode, status, onClick, onMouseDown, onMouseUp }) => {
    const settings = useGameStore(state => state.boardSettings.passButtonSettings);

    if (!settings) return null;

    const { x, y, colors, glow, scale } = settings;

    // console.log(`[PassButton] Render Mode: ${mode}, Status: ${status}`);

    const getBaseColor = () => {
        if (status === 'clicked')
        {
            switch (mode)
            {
                case 'pass': return colors.passClicked;
                case 'done': return colors.doneClicked;
                case 'cancel': return colors.cancelClicked;
                case 'conclude': return colors.concludeClicked;
                case 'none': return 'transparent';
            }
        }
        switch (mode)
        {
            case 'pass': return colors.pass;
            case 'done': return colors.done;
            case 'cancel': return colors.cancel;
            case 'conclude': return colors.conclude;
            case 'none': return 'transparent';
        }
    };

    const baseColor = getBaseColor();
    const isNormal = status === 'normal';
    const isClicked = status === 'clicked';
    const isDisabled = status === 'disabled';
    const isVisible = mode !== 'none';

    // Calculate current scale based on status and visibility
    // If not visible (none), scale to 0
    // If clicked, scale down slightly
    // Otherwise normal scale
    const targetScale = isVisible ? (isClicked ? scale * 0.95 : scale) : 0;

    const buttonStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${targetScale})`,
        backgroundColor: isDisabled ? '#9ca3af' : baseColor,
        color: colors.text,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        // Use a springy bezier for transform to give it that "pop" feel
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: isNormal && isVisible ? `0 0 ${glow.radius}px ${glow.intensity * 10}px ${glow.color}` : 'none',
        animation: isNormal && isVisible && glow.speed > 0 ? `pulse-glow ${glow.speed}s infinite` : 'none',
        pointerEvents: isVisible ? 'auto' : 'none',
        userSelect: 'none'
    };

    return (
        <>
            <style>
                {`
                    @keyframes pulse-glow {
                        0% { box-shadow: 0 0 ${glow.radius}px ${glow.intensity * 5}px ${glow.color}; }
                        50% { box-shadow: 0 0 ${glow.radius * 1.5}px ${glow.intensity * 10}px ${glow.color}; }
                        100% { box-shadow: 0 0 ${glow.radius}px ${glow.intensity * 5}px ${glow.color}; }
                    }
                `}
            </style>
            <button
                style={buttonStyle}
                onClick={isDisabled ? undefined : onClick}
                onMouseDown={isDisabled ? undefined : onMouseDown}
                onMouseUp={isDisabled ? undefined : onMouseUp}
                onMouseLeave={isDisabled ? undefined : onMouseUp} // Reset on leave too
            >
                {mode}
            </button>
        </>
    );
};
