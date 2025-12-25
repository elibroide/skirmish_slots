import React, { useState, useEffect } from 'react';

export const FullScreenToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    const toggleFullscreen = async () => {
        try
        {
            if (!document.fullscreenElement)
            {
                await document.documentElement.requestFullscreen();
            } else
            {
                await document.exitFullscreen();
            }
        } catch (err)
        {
            console.error('Error toggling fullscreen:', err);
        }
    };

    return (
        <button
            onClick={toggleFullscreen}
            className={`p-2 bg-stone-800/80 text-white rounded-lg hover:bg-stone-700 transition-colors backdrop-blur-sm shadow-md ${className}`}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
        >
            {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
            )}
        </button>
    );
};
