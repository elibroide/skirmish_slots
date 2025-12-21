import { resolveTemplate } from '../utils/automationUtils';
import { useMemo } from 'react';
import { TextFitter } from './TextFitter';
import type { CardTemplate, CardInstance, Zone } from '../types';
import clsx from 'clsx';

interface CardRendererProps {
    template: CardTemplate;
    data: CardInstance;
    schema: import('../types').CardSchema;
    className?: string;
    scale?: number;
}

export const CardRenderer: React.FC<CardRendererProps> = ({ template, data, schema, className, scale = 1 }) => {
    const { artConfig } = data;

    // Apply automations to the template based on card data
    const resolvedTemplate = useMemo(() => resolveTemplate(template, data.data), [template, data.data]);

    // Determine frame URL
    let frameUrl = resolvedTemplate.frameUrl;
    if (data.frameVariantId && resolvedTemplate.frameVariants)
    {
        const variant = resolvedTemplate.frameVariants.find(v => v.id === data.frameVariantId);
        if (variant)
        {
            frameUrl = variant.url;
        }
    }

    const renderZoneContent = (zone: Zone) => {
        const value = data.data[zone.schemaKey];
        const field = schema.find(f => f.key === zone.schemaKey);

        // Handle Image Fields
        if (field?.type === 'image')
        {
            let imageSrc = zone.src; // Default to zone's default image

            if (value)
            {
                const variantName = String(value);

                if (variantName === '__NONE__')
                {
                    return null; // Explicitly no image
                }

                // Check if it matches a variant
                const variant = zone.variants?.find(v => v.name === variantName);
                if (variant)
                {
                    imageSrc = variant.src;
                } else if (variantName.startsWith('http') || variantName.startsWith('data:'))
                {
                    // Support direct URLs if entered (backwards compatibility or custom)
                    imageSrc = variantName;
                }
            }

            if (!imageSrc) return null;

            return (
                <img
                    src={imageSrc}
                    alt={zone.schemaKey}
                    className="w-full h-full object-contain pointer-events-none select-none"
                    style={{
                        // Apply any relevant styles from zone.style if valid for img
                        opacity: zone.style?.opacity,
                        mixBlendMode: zone.style?.mixBlendMode as any,
                    }}
                />
            );
        }

        if (field?.type === 'tags')
        {
            // Handle Tags rendering
            const tags = Array.isArray(value) ? value : String(value || '').split(',').map(s => s.trim()).filter(s => s);
            if (tags.length === 0) return null;

            return (
                <div className="flex flex-wrap gap-1 justify-center w-full h-full content-center"
                    style={{
                        alignItems: zone.style?.verticalAlign === 'top' ? 'flex-start' : zone.style?.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                        justifyContent: zone.style?.textAlign === 'center' ? 'center' : zone.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    }}
                >
                    {tags.map((tag: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded border text-[0.8em] font-semibold tracking-wide"
                            style={{
                                borderColor: zone.style?.color || '#000',
                                color: zone.style?.color || '#000',
                                // Inherit other font properties?
                                fontFamily: zone.style?.fontFamily,
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            );
        }

        if (value === undefined || value === null) return null;

        const content = String(value).replace(/&nbsp;/g, ' ');

        // Unified rendering using TextFitter (which now supports HTML detection)
        return (
            <TextFitter
                text={content}
                wrap={zone.style?.wordWrap === 'break-word'}
                minSize={8}
                maxSize={parseInt(String(zone.style?.fontSize)) || 100}
                style={{
                    // Pass style for font family, color, alignment, etc
                    fontFamily: zone.style?.fontFamily,
                    color: zone.style?.color,
                    alignItems: zone.style?.verticalAlign === 'top' ? 'flex-start' : zone.style?.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                    justifyContent: zone.style?.textAlign === 'center' ? 'center' : zone.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    // Custom stroke props
                    ...(zone.style as any)
                }}
            />
        );
    };

    return (
        <div
            className={clsx("relative overflow-hidden shadow-lg", className)}
            style={{
                width: '750px',
                height: '1050px',
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
            }}
        >
            {/* Layer 0: Art */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {artConfig.imageUrl && (
                    artConfig.isMask ? (
                        <div
                            style={{
                                position: 'absolute',
                                left: `${artConfig.maskX}px`,
                                top: `${artConfig.maskY}px`,
                                width: `${artConfig.maskWidth}px`,
                                height: `${artConfig.maskHeight}px`,
                                overflow: 'hidden'
                            }}
                        >
                            <img
                                src={artConfig.imageUrl}
                                alt="Card Art"
                                className="absolute origin-top-left"
                                style={{
                                    left: `${artConfig.x - artConfig.maskX}px`,
                                    top: `${artConfig.y - artConfig.maskY}px`,
                                    transform: `scale(${artConfig.scale})`,
                                    maxWidth: 'none'
                                }}
                            />
                        </div>
                    ) : (
                        <img
                            src={artConfig.imageUrl}
                            alt="Card Art"
                            className="absolute origin-top-left"
                            style={{
                                left: `${artConfig.x}px`,
                                top: `${artConfig.y}px`,
                                transform: `scale(${artConfig.scale})`,
                                maxWidth: 'none'
                            }}
                        />
                    )
                )}
            </div>

            {/* Layer 1: Frame */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {frameUrl && (
                    <img src={frameUrl} alt="Frame" className="w-full h-full object-contain" />
                )}
            </div>

            {/* Layer 2: Zones */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                {resolvedTemplate.zones.filter(z => z.visible !== false).map((zone) => (
                    <div
                        key={zone.id}
                        className="absolute flex items-center justify-center p-1"
                        style={{
                            left: `${zone.x}%`,
                            top: `${zone.y}%`,
                            width: `${zone.width}%`,
                            height: `${zone.height}%`,
                            // Remove flex alignment here as TextFitter handles it internally
                            // But we need container size

                            // Apply background here
                            backgroundColor: zone.style?.backgroundColor === 'rgba(0,0,0,0.5)' ? 'transparent' : zone.style?.backgroundColor,
                        }}
                    >
                        {renderZoneContent(zone)}
                    </div>
                ))}
            </div>
        </div>
    );
};
