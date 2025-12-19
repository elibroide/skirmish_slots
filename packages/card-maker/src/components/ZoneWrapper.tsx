import React from 'react';
import { Rnd } from 'react-rnd';
import type { DraggableData, ResizableDelta, Position } from 'react-rnd';
import clsx from 'clsx';
import type { Zone } from '../types';

interface ZoneWrapperProps {
    zone: Zone;
    onUpdate: (id: string, updates: Partial<Zone>) => void;
    onSelect: (id: string) => void;
    isSelected?: boolean;
    containerWidth: number;
    containerHeight: number;
    scale?: number;
    previewText?: string;
    imageSrc?: string;
}

export const ZoneWrapper: React.FC<ZoneWrapperProps> = ({
    zone, onUpdate, onSelect, isSelected, containerWidth, containerHeight, scale = 1, previewText, imageSrc
}) => {
    // Convert % to pixels for Rnd
    const x = (zone.x / 100) * containerWidth;
    const y = (zone.y / 100) * containerHeight;
    const width = (zone.width / 100) * containerWidth;
    const height = (zone.height / 100) * containerHeight;

    const handleDragStop = (_e: any, d: DraggableData) => {
        const newX = (d.x / containerWidth) * 100;
        const newY = (d.y / containerHeight) * 100;
        onUpdate(zone.id, { x: newX, y: newY });
    };

    const handleResizeStop = (
        _e: any,
        _dir: any,
        ref: HTMLElement,
        _delta: ResizableDelta,
        position: Position
    ) => {
        const newWidth = (ref.offsetWidth / containerWidth) * 100;
        const newHeight = (ref.offsetHeight / containerHeight) * 100;
        const newX = (position.x / containerWidth) * 100;
        const newY = (position.y / containerHeight) * 100;

        onUpdate(zone.id, {
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY
        });
        // Select on resize too
        onSelect(zone.id);
    };

    return (
        <Rnd
            size={{ width, height }}
            position={{ x, y }}
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
            enableUserSelectHack={false}
            scale={scale}
            bounds="parent"
            className={clsx(
                "zone-wrapper border group absolute",
                isSelected ? "border-blue-500 z-20" : "border-gray-400/50 hover:border-blue-300 z-10"
            )}
            dragHandleClassName="drag-handle"
            resizeHandleClasses={{
                bottomRight: clsx("z-50", isSelected ? "!bg-blue-500" : "!bg-gray-400")
            }}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            // Handle selection on ANY interaction start, but defer it to allow Drag library to initialize first
            onMouseDown={() => {
                setTimeout(() => onSelect(zone.id), 0);
            }}
            onTouchStart={() => {
                setTimeout(() => onSelect(zone.id), 0);
            }}
        >
            {/* Content Area - Visual Preview */}
            <div
                className="w-full h-full flex overflow-hidden relative drag-handle cursor-move pointer-events-auto"
                style={{
                    color: zone.style?.color,
                    fontSize: zone.style?.fontSize ? `${(parseInt(String(zone.style.fontSize)) || 12) * scale}px` : undefined,
                    fontFamily: zone.style?.fontFamily,
                    justifyContent: zone.style?.textAlign === 'center' ? 'center' : zone.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    alignItems: zone.style?.verticalAlign === 'top' ? 'flex-start' : zone.style?.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                    whiteSpace: zone.style?.wordWrap === 'break-word' ? 'normal' : 'nowrap',
                    wordWrap: zone.style?.wordWrap === 'break-word' ? 'break-word' : 'normal',
                    WebkitTextStrokeWidth: zone.style?.textStrokeWidth,
                    WebkitTextStrokeColor: zone.style?.textStrokeColor,
                    backgroundColor: zone.style?.backgroundColor
                }}
            >
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt="Default"
                        className="w-full h-full object-contain pointer-events-none"
                    />
                ) : (
                    <span className="pointer-events-none px-1" style={{ textAlign: zone.style?.textAlign as any }}>
                        {previewText || zone.schemaKey}
                    </span>
                )}
            </div>

            {/* Context Info (Size) - Only show when selected/hovered */}
            {isSelected && (
                <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[10px] px-1 rounded pointer-events-none whitespace-nowrap">
                    {Math.round(width)} x {Math.round(height)} px
                </div>
            )}
        </Rnd>
    );
};
