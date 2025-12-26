import React, { useState } from 'react';
import { CardFrame } from './CardFrame';

type CardFrameViewProps = {
    onBack: () => void;
};

export const CardFrameView: React.FC<CardFrameViewProps> = ({ onBack }) => {
    const [glowIntensity, setGlowIntensity] = useState(500);

    return (
        <div className="min-h-screen bg-stone-900 flex items-center justify-center p-8 text-white relative overflow-hidden">
            <button
                onClick={onBack}
                className="absolute top-4 left-4 bg-stone-700 hover:bg-stone-600 text-white px-4 py-2 rounded-lg font-ui transition-colors z-50"
            >
                ← Back
            </button>

            <div className="flex-grow flex items-center justify-center pt-10 pb-32">
                <div className="scale-125 origin-center">
                    <CardFrame glowIntensity={glowIntensity} />
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md bg-stone-800/90 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-stone-700 z-50">
                <div className="flex justify-between mb-2">
                    <label className="font-ui font-semibold">Neon Glow Intensity</label>
                    <span className="font-mono text-stone-400">{glowIntensity}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="1000"
                    step="1"
                    value={glowIntensity}
                    onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-stone-500 mt-1">
                    <span>1</span>
                    <span>1000</span>
                </div>
            </div>
        </div>
    );
};
