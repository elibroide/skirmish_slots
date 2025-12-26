import React from 'react';

// Placeholder CardBack component
// In the future, this can be an image or a complex SVG
export const CardBack: React.FC<{
    width: number;
    height: number;
    className?: string;
    style?: React.CSSProperties;
}> = ({ width, height, className = '', style = {} }) => {
    return (
        <div
            className={`bg-stone-800 border-4 border-stone-600 rounded-xl relative overflow-hidden ${className}`}
            style={{
                width,
                height,
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
                ...style
            }}
        >
            {/* Pattern */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle, #444 2px, transparent 2.5px)',
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Logo / Emblem Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-stone-500 flex items-center justify-center">
                    <div className="text-4xl text-stone-500 font-bold">?</div>
                </div>
            </div>
        </div>
    );
};
