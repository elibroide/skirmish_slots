import React, { useLayoutEffect, useRef } from 'react';

interface TextFitterProps {
    text: string;
    maxSize?: number;
    minSize?: number;
    wrap?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export const TextFitter: React.FC<TextFitterProps> = ({
    text,
    maxSize = 100,
    minSize = 8,
    wrap = false,
    className,
    style
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;
        const textEl = textRef.current;
        if (!container || !textEl) return;

        // Reset to max size first
        textEl.style.fontSize = `${maxSize}px`;

        // Helper to check overflow
        const isOverflowing = () => {
            if (wrap)
            {
                // If wrapping, we primarily care about height overflow.
                // We ignore width overflow to ensure text wraps first.
                // The only risk is a single word wider than the container, 
                // but prioritizing wrapping is the user's explicit request.
                return container.scrollHeight > container.clientHeight;
            } else
            {
                // If not wrapping, we care about width overflow
                return textEl.scrollWidth > container.clientWidth;
            }
        };

        let currentSize = maxSize;
        while (isOverflowing() && currentSize > minSize)
        {
            currentSize--;
            textEl.style.fontSize = `${currentSize}px`;
        }
    }, [text, maxSize, minSize, wrap, style]);

    const isHtml = /<\/?[a-z][\s\S]*>/i.test(text);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: style?.alignItems || 'center',
                justifyContent: style?.justifyContent || 'center',
                overflow: 'hidden',
                ...style
            }}
        >
            <span
                ref={textRef}
                style={{
                    whiteSpace: wrap ? 'normal' : 'nowrap',
                    wordWrap: 'normal', // Allow words to cause overflow so we can shrink them
                    overflowWrap: 'normal', // Standard property
                    wordBreak: 'normal', // Prevent breaking mid-word unless necessary
                    fontSize: `${maxSize}px`,
                    fontFamily: style?.fontFamily,
                    fontWeight: style?.fontWeight,
                    lineHeight: style?.lineHeight || '1.2',
                    fontStyle: style?.fontStyle,
                    textDecoration: style?.textDecoration,
                    WebkitTextStrokeWidth: (style as any)?.WebkitTextStrokeWidth || (style as any)?.textStrokeWidth,
                    WebkitTextStrokeColor: (style as any)?.WebkitTextStrokeColor || (style as any)?.textStrokeColor,
                    color: style?.color,
                    // Ensure inner HTML elements inherit styles
                    display: isHtml || wrap ? 'block' : 'inline',
                    width: isHtml || wrap ? '100%' : 'auto',
                    textAlign: style?.textAlign as any || 'center' // Default to center if not specified, matching container default
                }}
            >
                {isHtml ? (
                    <span dangerouslySetInnerHTML={{ __html: text }} />
                ) : (
                    text
                )}
            </span>
        </div>
    );
};
