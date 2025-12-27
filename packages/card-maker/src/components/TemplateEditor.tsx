import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { ZoneWrapper } from './ZoneWrapper';
import { SliderInput } from './SliderInput';
import { ImagePicker } from './ImagePicker';
import { AutomationEditor } from './AutomationEditor';
import type { Zone } from '../types';
import { CollapsibleSection } from './CollapsibleSection';
import clsx from 'clsx';

// Memoized background to prevent re-rendering massive base64 strings during drag
const CardFrameBackground = React.memo(({ frameUrl, config }: { frameUrl?: string, config?: any }) => {
    if (!frameUrl)
    {
        return (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-bold text-4xl select-none border-2 border-dashed border-gray-300 m-8">
                Drop Frame Here
            </div>
        );
    }

    // 9-Slice Rendering
    if (config?.mode === '9slice' && config?.slice)
    {
        return (
            <div
                className="w-full h-full pointer-events-none select-none absolute inset-0 z-0"
                style={{
                    borderStyle: 'solid',
                    borderWidth: `${config.slice}px`,
                    borderImageSource: `url(${frameUrl})`,
                    borderImageSlice: `${config.slice} fill`,
                    borderImageRepeat: 'stretch',
                    boxSizing: 'border-box'
                }}
            />
        );
    }

    // Default Simple Rendering
    return (
        <div
            className="w-full h-full pointer-events-none opacity-40 select-none absolute inset-0 z-0"
            style={{
                backgroundImage: `url(${frameUrl})`,
                backgroundSize: '100% 100%', // FORCE STRETCH for simple mode to match 9slice behavior intent (filling box)
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        />
    );
});

export const TemplateEditor: React.FC = () => {
    const {
        templates,
        activeTemplateId,
        setActiveTemplateId,
        addTemplate,
        updateTemplate,
        duplicateTemplate,
        deleteTemplate,
        setTemplateFrame,
        addZone,
        updateZone,
        removeZone,
        schema,
        activeZoneId,
        setActiveZoneId
    } = useStore();

    const [scale, setScale] = useState(0.8);
    const containerRef = useRef<HTMLDivElement>(null);

    // Ensure we have an active template
    const template = templates.find(t => t.id === activeTemplateId);

    // If no template is active (and we have templates), select the first one
    React.useEffect(() => {
        if (templates.length > 0)
        {
            // Check if active ID corresponds to a real template
            const activeExists = templates.some(t => t.id === activeTemplateId);
            if (!activeTemplateId || !activeExists)
            {
                setActiveTemplateId(templates[0].id);
            }
        } else if (templates.length === 0)
        {
            // Should not really happen due to migration, but fallback
            addTemplate("Default Template");
        }
    }, [activeTemplateId, templates, setActiveTemplateId, addTemplate]);

    if (!template) return <div className="p-8 text-center text-gray-500">Loading Template...</div>;

    const toggleFieldVisibility = (schemaKey: string) => {
        const existingZone = template.zones.find(z => z.schemaKey === schemaKey);
        if (existingZone)
        {
            removeZone(existingZone.id);
            if (activeZoneId === existingZone.id) setActiveZoneId(null);
        } else
        {
            const newZone: Zone = {
                id: crypto.randomUUID(),
                schemaKey,
                x: 10, y: 10, width: 20, height: 10,
                style: { color: '#ffffff', backgroundColor: 'transparent', fontSize: '24px', textAlign: 'center', fontFamily: 'sans-serif', wordWrap: 'break-word' }
            };
            addZone(newZone);
            setActiveZoneId(newZone.id);
        }
    };

    const selectedZone = template.zones.find(z => z.id === activeZoneId);

    const handleCreate = () => {
        addTemplate("New Template");
    };

    // Default dimensions
    const tWidth = template.width || 750;
    const tHeight = template.height || 1050;

    return (
        <div className="flex h-full bg-gray-100 overflow-hidden">
            {/* Left Sidebar - Template List */}
            <div className="w-64 bg-white border-r flex flex-col shadow-lg z-10 shrink-0">
                <div className="p-4 border-b">
                    <button onClick={handleCreate} className="w-full bg-green-600 text-white p-2 text-sm rounded hover:bg-green-700 shadow font-semibold transition-colors flex justify-between items-center px-4">
                        <span>+ New Template</span>
                        <span className="bg-green-700 px-2 rounded-full text-xs opacity-75">{templates.length}</span>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {templates.map(t => (
                        <div
                            key={t.id}
                            onClick={() => setActiveTemplateId(t.id)}
                            className={clsx(
                                "p-3 rounded cursor-pointer border transition-all",
                                activeTemplateId === t.id ? "bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500" : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                            )}
                        >
                            <div className="font-bold text-sm truncate">{t.name}</div>
                            <div className="text-xs text-gray-400 mt-1 uppercase font-mono">{t.id.slice(0, 6)}</div>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <div className="text-center text-gray-400 text-sm p-4 mt-10">
                            No templates. Create one!
                        </div>
                    )}
                </div>
            </div>

            {/* Center Panel - Config Form */}
            <div className="w-96 bg-gray-50 border-r flex flex-col overflow-y-auto shadow-inner shrink-0 z-10">
                <div className="p-4 border-b bg-white input-group sticky top-0 z-20 shadow-sm">
                    <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-1">Template Name</label>
                    <input
                        className="text-lg font-bold text-gray-800 w-full border-b border-transparent focus:border-blue-500 outline-none pb-1"
                        value={template.name}
                        onChange={(e) => updateTemplate(template.id, { name: e.target.value })}
                        placeholder="Template Name"
                    />
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => duplicateTemplate(template.id)}
                            className="flex-1 bg-white border shadow-sm py-1.5 text-xs rounded hover:bg-gray-50 font-medium"
                        >
                            📋 Duplicate
                        </button>
                        <button
                            onClick={() => {
                                if (templates.length <= 1)
                                {
                                    alert("Cannot delete the last template.");
                                    return;
                                }
                                if (confirm("Are you sure you want to delete this template?"))
                                {
                                    deleteTemplate(template.id);
                                }
                            }}
                            disabled={templates.length <= 1}
                            className="flex-1 bg-white border border-red-200 text-red-600 shadow-sm py-1.5 text-xs rounded hover:bg-red-50 disabled:opacity-50 font-medium"
                        >
                            🗑 Delete
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Canvas Dimensions */}
                    <CollapsibleSection id="editor-canvas" title="Canvas Dimensions" defaultOpen={true}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1">Width (px)</label>
                                <input
                                    type="number"
                                    value={tWidth}
                                    onChange={(e) => updateTemplate(template.id, { width: Number(e.target.value) })}
                                    className="w-full border rounded p-1 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1">Height (px)</label>
                                <input
                                    type="number"
                                    value={tHeight}
                                    onChange={(e) => updateTemplate(template.id, { height: Number(e.target.value) })}
                                    className="w-full border rounded p-1 text-sm"
                                />
                            </div>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-2 italic">
                            Standard Size: 750 x 1050
                        </div>
                    </CollapsibleSection>

                    {/* Image Picker & 9-Slice */}
                    <CollapsibleSection id="editor-card-frame" title="Card Frame" defaultOpen={true}>
                        <ImagePicker
                            currentUrl={template.frameUrl}
                            onSelect={setTemplateFrame}
                            onClear={() => setTemplateFrame("")}
                            directory="templates"
                        />

                        {/* 9-Slice Controls */}
                        <div className="mt-4 pt-4 border-t border-dashed">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-gray-700">9-Slice Scaling</label>
                                <input
                                    type="checkbox"
                                    checked={template.frameConfig?.mode === '9slice'}
                                    onChange={(e) => {
                                        updateTemplate(template.id, {
                                            frameConfig: {
                                                ...template.frameConfig,
                                                mode: e.target.checked ? '9slice' : 'simple',
                                                slice: template.frameConfig?.slice || 50
                                            }
                                        });
                                    }}
                                />
                            </div>

                            {template.frameConfig?.mode === '9slice' && (
                                <div className="bg-gray-100 p-2 rounded text-xs space-y-2">
                                    <div>
                                        <label className="block mb-1 font-semibold text-gray-600">Slice / Border Width (px)</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="range" min="1" max="300" step="1"
                                                value={template.frameConfig.slice || 50}
                                                onChange={(e) => updateTemplate(template.id, { frameConfig: { ...template.frameConfig!, slice: Number(e.target.value) } })}
                                                className="flex-1"
                                            />
                                            <span className="font-mono w-8 text-right">{template.frameConfig.slice}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500">
                                        This defines the size of the corners that WON'T stretch. The middle sections will stretch to fit the custom width.
                                    </p>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>

                    {/* Frame Variants */}
                    <CollapsibleSection
                        id="editor-frame-variants"
                        title="Frame Variants"
                        defaultOpen={false}
                        actions={
                            <button
                                onClick={() => {
                                    const name = prompt("Enter variant name (e.g. 'Blue Version'):");
                                    if (name)
                                    {
                                        updateTemplate(template.id, {
                                            frameVariants: [
                                                ...(template.frameVariants || []),
                                                { id: crypto.randomUUID(), name, url: template.frameUrl } // Default to current URL
                                            ]
                                        });
                                    }
                                }}
                                className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-200"
                            >
                                + Add
                            </button>
                        }
                    >
                        {(template.frameVariants || []).length > 0 ? (
                            <div className="space-y-2">
                                {template.frameVariants?.map(variant => (
                                    <div key={variant.id} className="p-2 border rounded bg-gray-50 text-sm space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-gray-700">{variant.name}</span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => {
                                                    }}
                                                    title="Edit URL below"
                                                    className="text-xs text-blue-500 cursor-default"
                                                >
                                                    Edit Below
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Delete variant '${variant.name}'?`))
                                                        {
                                                            updateTemplate(template.id, {
                                                                frameVariants: template.frameVariants?.filter(v => v.id !== variant.id)
                                                            });
                                                        }
                                                    }}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                        <ImagePicker
                                            currentUrl={variant.url}
                                            onSelect={(url) => {
                                                updateTemplate(template.id, {
                                                    frameVariants: template.frameVariants?.map(v => v.id === variant.id ? { ...v, url } : v)
                                                });
                                            }}
                                            onClear={() => {
                                                updateTemplate(template.id, {
                                                    frameVariants: template.frameVariants?.map(v => v.id === variant.id ? { ...v, url: "" } : v)
                                                });
                                            }}
                                            directory="templates"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-gray-400 italic">No variants defined. The main frame will be used.</div>
                        )}
                    </CollapsibleSection>

                    {/* Automation Rules */}
                    <CollapsibleSection id="editor-automation" title="Automation Rules" defaultOpen={false}>
                        <AutomationEditor
                            template={template}
                            onUpdate={(updates) => updateTemplate(template.id, updates)}
                            schema={schema}
                        />
                    </CollapsibleSection>

                    {/* Layers Panel */}
                    <CollapsibleSection id="editor-layers" title="Layers" defaultOpen={true}>
                        <div className="flex flex-col gap-2">
                            {/* Active Layers - Reversed so top layer is top of list */}
                            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto border p-1 rounded bg-white shadow-sm">
                                {[...template.zones].reverse().map((zone, reverseIndex) => {
                                    const realIndex = template.zones.length - 1 - reverseIndex;
                                    const isActive = activeZoneId === zone.id;
                                    return (
                                        <div
                                            key={zone.id}
                                            onClick={() => setActiveZoneId(zone.id)}
                                            className={clsx(
                                                "px-2 py-1.5 rounded text-sm flex justify-between items-center transition-colors border cursor-pointer select-none",
                                                isActive ? "bg-blue-50 border-blue-200 shadow-sm" : "hover:bg-gray-50 border-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="font-mono text-[10px] text-gray-400 w-4 text-center">{realIndex}</span>
                                                <span className={clsx("font-medium truncate", isActive ? "text-blue-700" : "text-gray-700")}>
                                                    {schema.find(f => f.key === zone.schemaKey)?.label || zone.schemaKey}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {/* Reorder Buttons */}
                                                <div className="flex flex-col mr-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (realIndex < template.zones.length - 1)
                                                            {
                                                                const newZones = [...template.zones];
                                                                [newZones[realIndex], newZones[realIndex + 1]] = [newZones[realIndex + 1], newZones[realIndex]];
                                                                updateTemplate(template.id, { zones: newZones });
                                                            }
                                                        }}
                                                        disabled={realIndex >= template.zones.length - 1}
                                                        className="text-[8px] leading-none px-1 hover:bg-gray-200 rounded disabled:opacity-20"
                                                    >
                                                        ▲
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (realIndex > 0)
                                                            {
                                                                const newZones = [...template.zones];
                                                                [newZones[realIndex], newZones[realIndex - 1]] = [newZones[realIndex - 1], newZones[realIndex]];
                                                                updateTemplate(template.id, { zones: newZones });
                                                            }
                                                        }}
                                                        disabled={realIndex <= 0}
                                                        className="text-[8px] leading-none px-1 hover:bg-gray-200 rounded disabled:opacity-20"
                                                    >
                                                        ▼
                                                    </button>
                                                </div>

                                                {/* Visibility / Remove */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFieldVisibility(zone.schemaKey);
                                                    }}
                                                    title="Hide (Remove) Layer"
                                                    className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                                                >
                                                    👁
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {template.zones.length === 0 && <div className="text-xs italic text-gray-400 p-2 text-center">No active layers. Add from below.</div>}
                            </div>

                            {/* Available Fields */}
                            <div className="border-t pt-2">
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Hidden Fields</label>
                                <div className="flex flex-wrap gap-1">
                                    {schema.filter(f => !template.zones.some(z => z.schemaKey === f.key)).filter(f => {
                                        const scope = f.scope || ((f as any).readOnly ? 'template_only' : 'both');
                                        return scope !== 'card_only';
                                    }).map(field => (
                                        <button
                                            key={field.key}
                                            onClick={() => toggleFieldVisibility(field.key)}
                                            className="text-xs bg-gray-100 hover:bg-green-50 text-gray-600 hover:text-green-700 px-2 py-1 rounded border border-gray-200 flex items-center gap-1"
                                        >
                                            <span>+ {field.label}</span>
                                        </button>
                                    ))}
                                    {schema.every(f => template.zones.some(z => z.schemaKey === f.key)) && (
                                        <span className="text-[10px] text-gray-400 italic">All fields visible.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Selected Zone Properties */}
                    {selectedZone ? (
                        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4 animate-fadeIn">
                            <div className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100 mb-2">
                                <div>
                                    <h4 className="font-bold text-sm text-blue-900">{selectedZone.schemaKey}</h4>
                                    <span className="text-xs text-blue-500 font-mono uppercase">Zone Settings</span>
                                </div>
                            </div>

                            {(() => {
                                const field = schema.find(f => f.key === selectedZone.schemaKey);
                                if (field?.type === 'image')
                                {
                                    return (
                                        <CollapsibleSection id="editor-zone-image" title="Image Configuration" defaultOpen={true}>
                                            <div className="space-y-4">
                                                {/* Default Image */}
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Default Image</label>
                                                    <ImagePicker
                                                        currentUrl={selectedZone.src}
                                                        onSelect={(url) => updateZone(selectedZone.id, { src: url })}
                                                        onClear={() => updateZone(selectedZone.id, { src: undefined })}
                                                        directory={selectedZone.schemaKey}
                                                    />
                                                </div>

                                                {/* Variants */}
                                                <div className="border-t pt-2">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-xs font-semibold text-gray-600">Variants</label>
                                                        <button
                                                            onClick={() => {
                                                                const name = prompt("Enter variant name (e.g. 'Rare'):");
                                                                if (name)
                                                                {
                                                                    updateZone(selectedZone.id, {
                                                                        variants: [
                                                                            ...(selectedZone.variants || []),
                                                                            { id: crypto.randomUUID(), name, src: selectedZone.src || "" }
                                                                        ]
                                                                    });
                                                                }
                                                            }}
                                                            className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100"
                                                        >
                                                            + Add Variant
                                                        </button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {selectedZone.variants?.map((variant) => (
                                                            <div key={variant.id} className="p-2 border rounded bg-gray-50 text-sm space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <input
                                                                        className="font-semibold text-gray-700 bg-transparent border-b border-transparent focus:border-blue-500 outline-none w-full mr-2"
                                                                        value={variant.name}
                                                                        onChange={(e) => {
                                                                            updateZone(selectedZone.id, {
                                                                                variants: selectedZone.variants?.map(v => v.id === variant.id ? { ...v, name: e.target.value } : v)
                                                                            });
                                                                        }}
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            if (confirm(`Delete variant '${variant.name}'?`))
                                                                            {
                                                                                updateZone(selectedZone.id, {
                                                                                    variants: selectedZone.variants?.filter(v => v.id !== variant.id)
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="text-gray-400 hover:text-red-500"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                                <ImagePicker
                                                                    currentUrl={variant.src}
                                                                    onSelect={(url) => {
                                                                        updateZone(selectedZone.id, {
                                                                            variants: selectedZone.variants?.map(v => v.id === variant.id ? { ...v, src: url } : v)
                                                                        });
                                                                    }}
                                                                    onClear={() => {
                                                                        updateZone(selectedZone.id, {
                                                                            variants: selectedZone.variants?.map(v => v.id === variant.id ? { ...v, src: "" } : v)
                                                                        });
                                                                    }}
                                                                    directory={selectedZone.schemaKey}
                                                                />
                                                            </div>
                                                        ))}
                                                        {(!selectedZone.variants || selectedZone.variants.length === 0) && (
                                                            <div className="text-xs text-gray-400 italic text-center py-2">No variants defined.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CollapsibleSection>
                                    );
                                }
                                return null;
                            })()}

                            {/* Typography Group */}
                            <CollapsibleSection id="editor-zone-typography" title="Typography" defaultOpen={true}>
                                <div className="flex flex-col gap-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-1">Font Family</label>
                                            <select
                                                value={selectedZone.style?.fontFamily || 'sans-serif'}
                                                onChange={(e) => updateZone(selectedZone.id, { style: { ...selectedZone.style, fontFamily: e.target.value } })}
                                                className="w-full border rounded text-xs p-1"
                                            >
                                                <option value="sans-serif">Sans Serif</option>
                                                <option value="serif">Serif</option>
                                                <option value="monospace">Monospace</option>
                                                <option value="cursive">Cursive</option>
                                                <option value="fantasy">Fantasy</option>
                                                <option value="Orbitron">Orbitron</option>
                                                <option value="Exo 2">Exo 2</option>
                                                <option value="Titillium Web">Titillium Web</option>
                                                <option value="Russo One">Russo One</option>
                                                <option value="Cinzel">Cinzel</option>
                                                <option value="MedievalSharp">MedievalSharp</option>
                                                <option value="Uncial Antiqua">Uncial Antiqua</option>
                                                <option value="Playfair Display">Playfair Display</option>
                                                <option value="Bangers">Bangers</option>
                                                <option value="Anton">Anton</option>
                                                <option value="Impact">Impact</option>
                                                <option value="Lato">Lato</option>
                                                <option value="Roboto">Roboto</option>
                                                <option value="Open Sans">Open Sans</option>
                                            </select>
                                            <div className="flex gap-1 mt-2">
                                                <select
                                                    title="Font Weight"
                                                    value={selectedZone.style?.fontWeight || 'normal'}
                                                    onChange={(e) => updateZone(selectedZone.id, { style: { ...selectedZone.style, fontWeight: e.target.value } })}
                                                    className="border rounded text-xs p-1 flex-1 min-w-[80px]"
                                                >
                                                    <option value="normal">Normal (400)</option>
                                                    <option value="500">Medium (500)</option>
                                                    <option value="600">Semi-Bold (600)</option>
                                                    <option value="bold">Bold (700)</option>
                                                    <option value="800">Extra Bold (800)</option>
                                                    <option value="900">Black (900)</option>
                                                </select>
                                                <button
                                                    title="Italic"
                                                    onClick={() => updateZone(selectedZone.id, { style: { ...selectedZone.style, fontStyle: selectedZone.style?.fontStyle === 'italic' ? 'normal' : 'italic' } })}
                                                    className={clsx(
                                                        "px-2 py-1 text-xs border rounded italic transition-colors flex-1",
                                                        selectedZone.style?.fontStyle === 'italic' ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-50"
                                                    )}
                                                >
                                                    I
                                                </button>
                                                <button
                                                    title="Underline"
                                                    onClick={() => updateZone(selectedZone.id, { style: { ...selectedZone.style, textDecoration: selectedZone.style?.textDecoration === 'underline' ? 'none' : 'underline' } })}
                                                    className={clsx(
                                                        "px-2 py-1 text-xs border rounded underline transition-colors flex-1",
                                                        selectedZone.style?.textDecoration === 'underline' ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-50"
                                                    )}
                                                >
                                                    U
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-1">Color</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={selectedZone.style?.color || '#000000'}
                                                    onChange={(e) => updateZone(selectedZone.id, { style: { ...selectedZone.style, color: e.target.value } })}
                                                    className="h-6 w-8 p-0 border-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={selectedZone.style?.color || '#000000'}
                                                    onChange={(e) => updateZone(selectedZone.id, { style: { ...selectedZone.style, color: e.target.value } })}
                                                    className="w-full text-xs border rounded p-1 font-mono uppercase"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Font Size</label>
                                        <SliderInput
                                            label=""
                                            value={parseInt(String(selectedZone.style?.fontSize) || '24')}
                                            onChange={(val) => updateZone(selectedZone.id, { style: { ...selectedZone.style, fontSize: `${val}px` } })}
                                            min={8} max={200} step={1} unit="px"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-1">H-Align</label>
                                            <div className="flex border rounded overflow-hidden">
                                                {['left', 'center', 'right'].map((align) => (
                                                    <button
                                                        key={align}
                                                        onClick={() => updateZone(selectedZone.id, { style: { ...selectedZone.style, textAlign: align as any } })}
                                                        className={clsx(
                                                            "flex-1 p-1 text-xs hover:bg-gray-100 transition-colors",
                                                            (selectedZone.style?.textAlign || 'center') === align && "bg-blue-100 text-blue-600 font-bold"
                                                        )}
                                                    >
                                                        {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-1">V-Align</label>
                                            <div className="flex border rounded overflow-hidden">
                                                {['top', 'middle', 'bottom'].map((align) => (
                                                    <button
                                                        key={align}
                                                        onClick={() => updateZone(selectedZone.id, { style: { ...selectedZone.style, verticalAlign: align as any } })}
                                                        className={clsx(
                                                            "flex-1 p-1 text-xs hover:bg-gray-100 transition-colors",
                                                            (selectedZone.style?.verticalAlign || 'middle') === align && "bg-blue-100 text-blue-600 font-bold"
                                                        )}
                                                    >
                                                        {align === 'top' ? '↑' : align === 'middle' ? '↕' : '↓'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            <CollapsibleSection id="editor-zone-appearance" title="Appearance" defaultOpen={true}>
                                {/* Word Wrap Control */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            id="wordWrap"
                                            checked={selectedZone.style?.wordWrap === 'break-word'}
                                            onChange={(e) => updateZone(selectedZone.id, { style: { ...selectedZone.style, wordWrap: e.target.checked ? 'break-word' : 'normal' } })}
                                        />
                                        <label htmlFor="wordWrap" className="text-xs font-semibold text-gray-600">Word Wrap</label>
                                    </div>
                                    <p className="text-[10px] text-gray-400 pl-5">If checked, text wraps. If not, text shrinks.</p>
                                </div>

                                {/* Background Color Control */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Background Color</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative overflow-hidden w-8 h-6 border rounded">
                                            <input
                                                type="color"
                                                value={selectedZone.style?.backgroundColor?.startsWith('#') ? selectedZone.style.backgroundColor : '#ffffff'}
                                                onChange={(e) => updateZone(selectedZone.id, { style: { ...selectedZone.style, backgroundColor: e.target.value } })}
                                                className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={selectedZone.style?.backgroundColor || 'transparent'}
                                            onChange={(e) => updateZone(selectedZone.id, { style: { ...selectedZone.style, backgroundColor: e.target.value } })}
                                            className="flex-1 text-xs border rounded p-1 font-mono"
                                            placeholder="transparent"
                                        />
                                        <button
                                            onClick={() => updateZone(selectedZone.id, { style: { ...selectedZone.style, backgroundColor: 'transparent' } })}
                                            className="text-[10px] px-2 py-1 bg-gray-100 border rounded hover:bg-gray-200"
                                            title="Clear Background"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                {/* Text Stroke */}
                                <div className="border-t border-dashed pt-2 mt-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2 block">Text Border (Stroke)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-1">Width</label>
                                            <SliderInput
                                                label=""
                                                value={parseFloat(selectedZone.style?.textStrokeWidth || '0')}
                                                onChange={(val) => updateZone(selectedZone.id, { style: { ...selectedZone.style, textStrokeWidth: val > 0 ? `${val}px` : undefined } })}
                                                min={0} max={10} step={0.5} unit="px"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-1">Color</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={selectedZone.style?.textStrokeColor || '#000000'}
                                                    onChange={(e) => updateZone(selectedZone.id, { style: { ...selectedZone.style, textStrokeColor: e.target.value } })}
                                                    className="h-6 w-8 p-0 border-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={selectedZone.style?.textStrokeColor || ''}
                                                    onChange={(e) => updateZone(selectedZone.id, { style: { ...selectedZone.style, textStrokeColor: e.target.value } })}
                                                    className="w-full text-xs border rounded p-1 font-mono uppercase"
                                                    placeholder="None"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            <CollapsibleSection id="editor-zone-position" title="Position & Size" defaultOpen={false}>
                                {/* Pixel Editor */}
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded border border-gray-100">
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-mono">X (px)</label>
                                        <input
                                            type="number"
                                            className="w-full border rounded px-1 py-0.5 text-xs"
                                            value={Math.round((selectedZone.x / 100) * 750)}
                                            onChange={(e) => updateZone(selectedZone.id, { x: (Number(e.target.value) / 750) * 100 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-mono">Y (px)</label>
                                        <input
                                            type="number"
                                            className="w-full border rounded px-1 py-0.5 text-xs"
                                            value={Math.round((selectedZone.y / 100) * 1050)}
                                            onChange={(e) => updateZone(selectedZone.id, { y: (Number(e.target.value) / 1050) * 100 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-mono">W (px)</label>
                                        <input
                                            type="number"
                                            className="w-full border rounded px-1 py-0.5 text-xs"
                                            value={Math.round((selectedZone.width / 100) * 750)}
                                            onChange={(e) => updateZone(selectedZone.id, { width: (Number(e.target.value) / 750) * 100 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-mono">H (px)</label>
                                        <input
                                            type="number"
                                            className="w-full border rounded px-1 py-0.5 text-xs"
                                            value={Math.round((selectedZone.height / 100) * 1050)}
                                            onChange={(e) => updateZone(selectedZone.id, { height: (Number(e.target.value) / 1050) * 100 })}
                                        />
                                    </div>
                                </div>
                            </CollapsibleSection>


                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 text-center py-8 italic border-t mt-2">
                            Select a zone on the canvas to edit its properties.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Live Preview / Canvas */}
            <div className="flex-1 overflow-hidden flex flex-col bg-gray-200 relative">
                <div className="absolute top-4 right-4 z-20 bg-white p-2 rounded shadow flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500">Zoom</label>
                    <input
                        type="range" min="0.2" max="2.0" step="0.1"
                        value={scale}
                        onChange={(e) => setScale(Number(e.target.value))}
                        className="w-24"
                    />
                    <span className="text-xs font-mono w-8 text-right">{(scale * 100).toFixed(0)}%</span>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center p-8 active:cursor-grab">
                    <div
                        ref={containerRef}
                        className="relative bg-white shadow-2xl ring-1 ring-black/5"
                        style={{
                            width: `${tWidth}px`,
                            height: `${tHeight}px`,
                            transform: `scale(${scale})`,
                            transformOrigin: 'center center',
                            flexShrink: 0
                        }}
                        onClick={(e) => {
                            // Deselect if clicking background (not a zone)
                            if (!(e.target as Element).closest('.zone-wrapper'))
                            {
                                setActiveZoneId(null);
                            }
                        }}
                    >
                        {/* Frame Background */}
                        <CardFrameBackground frameUrl={template.frameUrl} config={template.frameConfig} />

                        {/* Zones - Interactive */}
                        {template.zones.map(zone => {
                            const field = schema.find(f => f.key === zone.schemaKey);
                            const previewText = field?.example || field?.label || zone.schemaKey;
                            return (
                                <ZoneWrapper
                                    key={zone.id}
                                    zone={zone}
                                    onUpdate={updateZone}
                                    onSelect={setActiveZoneId}
                                    isSelected={activeZoneId === zone.id}
                                    containerWidth={tWidth}
                                    containerHeight={tHeight}
                                    scale={scale}
                                    previewText={previewText}
                                    imageSrc={zone.src} // Pass default image
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
