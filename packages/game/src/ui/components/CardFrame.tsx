import React from 'react';

type CardFrameProps = {
    glowIntensity: number; // 0 to 1000
};

export const CardFrame: React.FC<CardFrameProps> = ({ glowIntensity }) => {
    // Map intensity (0-1000) to visual values

    // Blur radius: 
    // at 0 => 0.5px
    // at 1000 => 20px
    const blurRadius = 0.5 + (glowIntensity / 1000) * 20;

    // Opacity:
    // at 0 => 0.4
    // at 1000 => 1
    const opacity = 0.4 + (glowIntensity / 1000) * 0.6;

    // Drop Shadow for high intensity (simulate ambient light)
    // at 0 => 0px
    // at 1000 => 50px
    const shadowSpread = (glowIntensity / 1000) * 50;

    // Color: Red neon
    const glowColor = "#ff3333";
    const frameColor = "#ffffff";

    return (
        <div
            className="relative w-[300px] h-[420px] flex items-center justify-center transition-all duration-300"
            style={{
                filter: `drop-shadow(0 0 ${shadowSpread}px ${glowColor})`
            }}
        >
            <div
                className="absolute bg-stone-800"
                style={{
                    left: '20px',
                    top: '20px',
                    width: '260px', /* 280 - 20 */
                    height: '380px', /* 400 - 20 */
                    borderRadius: '20px',
                    zIndex: 0
                }}
            />

            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <img
                    src="/neon_white_card_art.png"
                    alt="Engineer"
                    className="w-[180px] h-[180px]"
                />
            </div>

            <svg
                width="100%"
                height="100%"
                viewBox="0 0 300 420"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible z-20"
            >
                <defs>
                    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation={blurRadius} result="blur" />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values={`
                0 0 0 0 1
                0 0 0 0 0.2
                0 0 0 0 0.2
                0 0 0 ${opacity} 0
              `}
                            result="coloredBlur"
                        />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Outer Glow Layer */}
                <path
                    d="M 40,20 
             H 260 
             A 20,20 0 0 1 280,40
             V 380 
             A 20,20 0 0 1 260,400
             H 40 
             A 20,20 0 0 1 20,380
             V 40 
             A 20,20 0 0 1 40,20 
             Z"
                    fill="none"
                    stroke={glowColor}
                    strokeWidth="4"
                    filter="url(#neon-glow)"
                    opacity={opacity}
                />

                {/* Inner Tech Frame (The actual shape) */}
                {/* Top Tech Notch */}
                <path
                    d="M 90,30 L 210,30 L 200,40 L 100,40 Z"
                    fill={glowColor}
                    opacity="0.3"
                />

                {/* Bottom Tech Notch */}
                <path
                    d="M 90,390 L 210,390 L 200,380 L 100,380 Z"
                    fill={glowColor}
                    opacity="0.3"
                />

                {/* Main Frame Path */}
                <path
                    d="M 50,50 
             L 80,50 L 90,40 L 210,40 L 220,50 L 250,50
             A 10,10 0 0 1 260,60
             V 120 L 270,130 V 160 L 260,170
             V 250 L 270,260 V 290 L 260,300
             V 360 
             A 10,10 0 0 1 250,370
             L 220,370 L 210,380 L 90,380 L 80,370 L 50,370
             A 10,10 0 0 1 40,360
             V 300 L 30,290 V 260 L 40,250
             V 170 L 30,160 V 130 L 40,120
             V 60
             A 10,10 0 0 1 50,50
             Z"
                    fill="none"
                    stroke={frameColor}
                    strokeWidth="3"
                />

                {/* Inner Red Line */}
                <path
                    d="M 58,58 
             L 82,58 L 92,48 L 208,48 L 218,58 L 242,58
             A 6,6 0 0 1 248,64
             V 122 L 258,132 V 158 L 248,168
             V 252 L 258,262 V 288 L 248,298
             V 356 
             A 6,6 0 0 1 242,362
             L 218,362 L 208,372 L 92,372 L 82,362 L 58,362
             A 6,6 0 0 1 52,356
             V 298 L 42,288 V 262 L 52,252
             V 168 L 42,158 V 132 L 52,122
             V 64
             A 6,6 0 0 1 58,58
             Z"
                    fill="none"
                    stroke={glowColor}
                    strokeWidth="1.5"
                    filter="url(#neon-glow)"
                />

            </svg>
        </div>
    );
};
