import React from 'react';
import { useStore } from '../store/useStore';
import clsx from 'clsx';

interface CollapsibleSectionProps {
    id: string; // Unique ID for persistence
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
    headerClassName?: string;
    actions?: React.ReactNode; // Optional extra actions in header
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    id,
    title,
    children,
    defaultOpen = true,
    className,
    headerClassName,
    actions
}) => {
    const { collapsedSections, toggleSection } = useStore();

    // Check if key exists, if not use defaultOpen logic (inverted because map stores 'collapsed' state usually? or 'open'?)
    // Let's assume the store stores 'isCollapsed' for clarity with 'collapsedSections'.
    // If key is missing, we rely on !defaultOpen to determine if valid?
    // Actually, let's treat the store value as "isCollapsed".
    // If undefined, we use !defaultOpen (if defaultOpen=true, isCollapsed=false).

    const isCollapsed = collapsedSections[id] !== undefined
        ? collapsedSections[id]
        : !defaultOpen;

    return (
        <div className={clsx("rounded-lg shadow-sm border bg-white overflow-hidden transition-all", className)}>
            <div
                className={clsx(
                    "flex items-center justify-between p-3 cursor-pointer select-none bg-gray-50 hover:bg-gray-100 transition-colors",
                    !isCollapsed && "border-b",
                    headerClassName
                )}
                onClick={() => toggleSection(id)}
            >
                <div className="flex items-center gap-2">
                    <span className={clsx("text-gray-400 font-bold text-xs transition-transform", isCollapsed ? "-rotate-90" : "rotate-0")}>
                        ▼
                    </span>
                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                        {title}
                    </h3>
                </div>
                {actions && (
                    <div onClick={(e) => e.stopPropagation()}>
                        {actions}
                    </div>
                )}
            </div>

            {!isCollapsed && (
                <div className="p-4 animate-fadeIn">
                    {children}
                </div>
            )}
        </div>
    );
};
