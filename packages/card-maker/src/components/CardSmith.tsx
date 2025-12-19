import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { CardRenderer } from './CardRenderer';
import { ImagePicker } from './ImagePicker';
import { RichTextEditor } from './RichTextEditor';
import html2canvas from 'html2canvas';

export const CardSmith: React.FC = () => {
    const { schema, cards, templates, addCard, updateCard, deleteCard, duplicateCard, activeCardId, setActiveCardId } = useStore();
    const renderRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.8);

    // Search & Sort State
    const [searchQuery, setSearchQuery] = useState("");
    const [sortMethod, setSortMethod] = useState<'created' | 'created_desc' | 'az' | 'za'>('created');
    const [areFiltersOpen, setAreFiltersOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

    const activeCard = cards.find(c => c.id === activeCardId);
    // Find the template assigned to this card, or fallback (safe guard)
    const cardTemplate = activeCard ? templates.find(t => t.id === activeCard.templateId) : undefined;

    // --- Filter & Sort Logic ---
    const getFilteredAndSortedCards = () => {
        let result = [...cards];

        // 1. Text Search
        if (searchQuery.trim())
        {
            const query = searchQuery.toLowerCase().trim();
            const firstKey = schema[0]?.key || 'name'; // Assume first field is main identifier

            result = result.filter(c => {
                const val = String(c.data[firstKey] || '').toLowerCase();
                return val.includes(query);
            });

            // Smart Sort: StartsWith > Contains > Alphabetical
            result.sort((a, b) => {
                const valA = String(a.data[firstKey] || '').toLowerCase();
                const valB = String(b.data[firstKey] || '').toLowerCase();
                const aStarts = valA.startsWith(query);
                const bStarts = valB.startsWith(query);

                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return valA.localeCompare(valB);
            });
        }

        // 2. Advanced Filters
        Object.entries(activeFilters).forEach(([key, filterVal]) => {
            if (!filterVal) return;
            result = result.filter(c => {
                const cardVal = c.data[key];
                if (filterVal === '__EMPTY__') return !cardVal;
                if (filterVal === '__NOT_EMPTY__') return !!cardVal;
                // Array/Tags check
                if (Array.isArray(cardVal))
                {
                    return cardVal.some(v => String(v).toLowerCase().includes(String(filterVal).toLowerCase()));
                }
                // String/exact check -> Changed to Contains
                return String(cardVal || '').toLowerCase().includes(String(filterVal).toLowerCase());
            });
        });

        // 3. Sorting (Only if not searching, or user explicitly asks? User req: Default index created, but able to change)
        // If searching, we prioritized relevance above. But if user selects specific sort, we might want to respect that?
        // Let's apply explicit sort if it's NOT 'created' (default), OR if we haven't already sorted by relevance (i.e. empty search)
        // Actually, user said: "It will first try to match startWith... Then alphabetically" for Search.
        // And "The sort will default to index created...".
        // Let's say: If Search is active, Search Relevance rules. If Search is NOT active, use Sort Method.
        if (!searchQuery.trim())
        {
            if (sortMethod === 'az')
            {
                const key = schema[0]?.key || 'id';
                result.sort((a, b) => String(a.data[key] || '').localeCompare(String(b.data[key] || '')));
            } else if (sortMethod === 'za')
            {
                const key = schema[0]?.key || 'id';
                result.sort((a, b) => String(b.data[key] || '').localeCompare(String(a.data[key] || '')));
            } else if (sortMethod === 'created_desc')
            {
                result.reverse();
            } else
            {
                // 'created' -> We rely on array order (assuming push adds to end) or ID?
                // IDs are timestamps often, or random. Current AddCard uses random UUID.
                // But `cards` array is usually in creation order if we don't mess it up.
                // So default valid 'created' is just no-op on the array from store.
            }
        }

        return result;
    };

    const displayCards = getFilteredAndSortedCards();

    const handleCreate = () => {
        // If we have multiple templates, we could ask. For now, defaulting to the first one is fine or the active one.
        // The store's addCard uses activeTemplateId or first available.
        const newId = addCard();
        setActiveCardId(newId);
        // Clear search so we see the new card
        setSearchQuery("");
    };



    const handleExport = async () => {
        if (renderRef.current)
        {
            try
            {
                // Wait for images to load (simplified)
                const canvas = await html2canvas(renderRef.current, {
                    useCORS: true,
                    scale: 2, // High res export
                    backgroundColor: null
                });
                const link = document.createElement('a');
                link.download = `${activeCard?.data[schema[0]?.key] || 'card'}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (err)
            {
                console.error("Export failed", err);
                alert("Failed to export card image.");
            }
        }
    };

    return (
        <div className="flex h-full bg-gray-100 overflow-hidden">
            {/* Sidebar - Card List */}
            <div className="w-64 bg-white border-r flex flex-col shadow-lg z-10 shrink-0">
                <div className="p-4 border-b space-y-3">
                    <button onClick={handleCreate} className="w-full bg-green-600 text-white p-2 text-sm rounded hover:bg-green-700 shadow font-semibold transition-colors">
                        + New Card
                    </button>

                    {/* Search & Sort Controls */}
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            placeholder="Search cards..."
                            className="w-full border rounded px-2 py-1 text-sm bg-gray-50 focus:bg-white transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <select
                                className="flex-1 text-xs border rounded bg-gray-50 p-1"
                                value={sortMethod}
                                onChange={(e) => setSortMethod(e.target.value as any)}
                            >
                                <option value="created">Created (Oldest)</option>
                                <option value="created_desc">Created (Newest)</option>
                                <option value="az">A-Z</option>
                                <option value="za">Z-A</option>
                            </select>
                            <button
                                onClick={() => setAreFiltersOpen(!areFiltersOpen)}
                                className={`px-2 py-1 border rounded text-xs ${areFiltersOpen || Object.keys(activeFilters).length > 0 ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-gray-50 text-gray-600'}`}
                            >
                                Filtered
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel (Collapsible) */}
                    {areFiltersOpen && (
                        <div className="p-2 bg-gray-50 rounded border text-xs space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="flex justify-between items-center text-gray-400 uppercase font-bold tracking-wider text-[10px]">
                                <span>Filters</span>
                                {Object.keys(activeFilters).length > 0 && (
                                    <button onClick={() => setActiveFilters({})} className="text-red-400 hover:text-red-500">
                                        Clear
                                    </button>
                                )}
                            </div>
                            {schema.map(field => (
                                field.type !== 'image' && (
                                    <div key={field.key} className="flex flex-col gap-1">
                                        <label className="text-gray-500">{field.label}</label>
                                        {field.options && field.options.length > 0 ? (
                                            <select
                                                className="border rounded px-1 py-0.5 bg-white w-full text-xs"
                                                value={activeFilters[field.key] || ''}
                                                onChange={(e) => setActiveFilters({ ...activeFilters, [field.key]: e.target.value })}
                                            >
                                                <option value="">Any</option>
                                                {field.options.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                className="border rounded px-1 py-0.5 bg-white w-full"
                                                placeholder="Matches..."
                                                value={activeFilters[field.key] || ''}
                                                onChange={(e) => setActiveFilters({ ...activeFilters, [field.key]: e.target.value })}
                                            />
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {displayCards.map(card => (
                        <div
                            key={card.id}
                            onClick={() => setActiveCardId(card.id)}
                            className={`p-3 rounded cursor-pointer border transition-all ${activeCardId === card.id ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                        >
                            <div className="font-bold text-sm truncate">{String(card.data[schema[0]?.key] || 'Untitled Card')}</div>
                            <div className="text-xs text-gray-400 mt-1 uppercase font-mono">{card.id.slice(0, 6)}</div>
                        </div>
                    ))}
                    {displayCards.length === 0 && (
                        <div className="text-center text-gray-400 text-sm p-4 mt-10">
                            {cards.length === 0 ? "No cards yet. Create one to start!" : "No matches found."}
                        </div>
                    )}
                </div>
            </div>

            {/* Center - Form & Tools */}
            {activeCard ? (
                <div className="w-96 bg-gray-50 border-r flex flex-col overflow-y-auto shadow-inner shrink-0">
                    <div className="p-4 border-b bg-white top-0 sticky z-10 font-bold text-gray-700 flex justify-between items-center shadow-sm">
                        <span>Card Data</span>
                        <div className="flex gap-2">
                            <button onClick={handleExport} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 font-bold">
                                📸 Export PNG
                            </button>
                            <span className="text-xs font-normal text-gray-400 flex items-center">{activeCard.id.slice(0, 6)}</span>
                        </div>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* Template Selection */}
                        <div className="bg-white p-3 rounded-lg shadow-sm border space-y-1">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Template</label>
                            <select
                                value={activeCard.templateId}
                                onChange={(e) => updateCard(activeCard.id, { templateId: e.target.value })}
                                className="w-full border rounded text-sm p-1.5"
                            >
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>

                        </div>

                        {/* Frame Variant Selection */}
                        {((cardTemplate?.frameVariants?.length || 0) > 0) && (
                            <div className="bg-white p-3 rounded-lg shadow-sm border space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Frame Variant</label>
                                <select
                                    value={activeCard.frameVariantId || ""}
                                    onChange={(e) => updateCard(activeCard.id, { frameVariantId: e.target.value })}
                                    className="w-full border rounded text-sm p-1.5"
                                >
                                    <option value="">Default Frame</option>
                                    {cardTemplate?.frameVariants?.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Art Tools */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-1">Card Art</label>
                            <ImagePicker
                                directory="card-art"
                                currentUrl={activeCard.artConfig.imageUrl}
                                onSelect={(url: string) => updateCard(activeCard.id, { artConfig: { ...activeCard.artConfig, imageUrl: url } })}
                                onClear={() => updateCard(activeCard.id, { artConfig: { ...activeCard.artConfig, imageUrl: "" } })}
                            />

                            <div className="flex flex-col gap-3 border-t pt-2">
                                {/* Image Controls */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block mb-1">Image Placement</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] font-mono text-gray-500">X</label>
                                            <input
                                                type="number"
                                                value={activeCard.artConfig.x}
                                                onChange={(e) => updateCard(activeCard.id, { artConfig: { ...activeCard.artConfig, x: Number(e.target.value) } })}
                                                className="w-full border rounded text-xs px-1 py-0.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-mono text-gray-500">Y</label>
                                            <input
                                                type="number"
                                                value={activeCard.artConfig.y}
                                                onChange={(e) => updateCard(activeCard.id, { artConfig: { ...activeCard.artConfig, y: Number(e.target.value) } })}
                                                className="w-full border rounded text-xs px-1 py-0.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-mono text-gray-500">Scale</label>
                                            <input
                                                type="number" step="0.1"
                                                value={activeCard.artConfig.scale}
                                                onChange={(e) => updateCard(activeCard.id, { artConfig: { ...activeCard.artConfig, scale: Number(e.target.value) } })}
                                                className="w-full border rounded text-xs px-1 py-0.5"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Mask Controls */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <input
                                            type="checkbox"
                                            id="useMask"
                                            checked={activeCard.artConfig.isMask}
                                            onChange={(e) => updateCard(activeCard.id, { artConfig: { ...activeCard.artConfig, isMask: e.target.checked } })}
                                        />
                                        <label htmlFor="useMask" className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Use Mask</label>
                                    </div>

                                    {activeCard.artConfig.isMask && (
                                        <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-blue-100">
                                            <div>
                                                <label className="text-[10px] font-mono text-gray-500">Mask X</label>
                                                <input
                                                    type="number"
                                                    value={activeCard.artConfig.maskX}
                                                    onChange={(e) => updateCard(activeCard.id, { artConfig: { ...activeCard.artConfig, maskX: Number(e.target.value) } })}
                                                    className="w-full border rounded text-xs px-1 py-0.5"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-mono text-gray-500">Mask Y</label>
                                                <input
                                                    type="number"
                                                    value={activeCard.artConfig.maskY}
                                                    onChange={(e) => updateCard(activeCard.id, { artConfig: { ...activeCard.artConfig, maskY: Number(e.target.value) } })}
                                                    className="w-full border rounded text-xs px-1 py-0.5"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-mono text-gray-500">Mask W</label>
                                                <input
                                                    type="number"
                                                    value={activeCard.artConfig.maskWidth}
                                                    onChange={(e) => updateCard(activeCard.id, { artConfig: { ...activeCard.artConfig, maskWidth: Number(e.target.value) } })}
                                                    className="w-full border rounded text-xs px-1 py-0.5"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-mono text-gray-500">Mask H</label>
                                                <input
                                                    type="number"
                                                    value={activeCard.artConfig.maskHeight}
                                                    onChange={(e) => updateCard(activeCard.id, { artConfig: { ...activeCard.artConfig, maskHeight: Number(e.target.value) } })}
                                                    className="w-full border rounded text-xs px-1 py-0.5"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Data Fields */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block">Fields</label>
                            {schema.length === 0 && <div className="text-sm text-gray-500 italic p-2 border border-dashed rounded bg-gray-100">No schema fields defined. Go to Settings to add fields.</div>}
                            {schema.map(field => {
                                // Zone checks are now optional for Data Only fields
                                const zone = cardTemplate?.zones.find(z => z.schemaKey === field.key);
                                const scope = field.scope || ((field as any).readOnly ? 'template_only' : 'both');

                                // Template Only fields: HIDDEN in Card Smith
                                if (scope === 'template_only') return null;

                                return (
                                    <div key={field.key} className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-gray-700">
                                            {field.label}
                                            {/* Scope indicators for clarity */}
                                            {scope === 'card_only' && <span className="text-[10px] text-blue-500 ml-2 uppercase border border-blue-200 bg-blue-50 rounded px-1">Data Only</span>}
                                        </label>

                                        {/* Image Variant Selector OR Generic Image Picker */}
                                        {field.type === 'image' ? (
                                            zone && zone.variants && zone.variants.length > 0 ? (
                                                <div className="space-y-2">
                                                    <select
                                                        value={activeCard.data[field.key] || ''}
                                                        onChange={(e) => updateCard(activeCard.id, { data: { ...activeCard.data, [field.key]: e.target.value } })}
                                                        className="w-full border rounded text-sm p-2 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                                    >
                                                        <option value="">(Default)</option>
                                                        <option value="__NONE__">(None)</option>
                                                        {zone.variants.map(v => (
                                                            <option key={v.id} value={v.name}>{v.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                // Fallback for Data Only Image or Image without variants -> Use generic text input or picker?
                                                // Let's use simple input for now as "Data Only" images are rare, usually they are for rules.
                                                // Or better, use ImagePicker with field key as directory?
                                                <ImagePicker
                                                    directory={field.key}
                                                    currentUrl={activeCard.data[field.key]}
                                                    onSelect={(url) => updateCard(activeCard.id, { data: { ...activeCard.data, [field.key]: url } })}
                                                    onClear={() => updateCard(activeCard.id, { data: { ...activeCard.data, [field.key]: "" } })}
                                                />
                                            )
                                        ) : field.type === 'richtext' ? (
                                            <div>
                                                <RichTextEditor
                                                    value={activeCard.data[field.key] || ''}
                                                    onChange={(val) => updateCard(activeCard.id, { data: { ...activeCard.data, [field.key]: val } })}
                                                    placeholder={`Enter ${field.label}...`}
                                                />
                                            </div>
                                        ) : field.type === 'tags' ? (
                                            <input
                                                type="text"
                                                className="border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full"
                                                value={Array.isArray(activeCard.data[field.key]) ? activeCard.data[field.key].join(', ') : (activeCard.data[field.key] || '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    updateCard(activeCard.id, { data: { ...activeCard.data, [field.key]: val.split(',').map(s => s.trim()) } });
                                                }}
                                                placeholder="e.g. Fire, Magic, Rare"
                                            />
                                        ) : (
                                            // Text / Number
                                            field.options && field.options.length > 0 ? (
                                                <select
                                                    className="w-full border rounded text-sm p-2 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                                    value={activeCard.data[field.key] || ''}
                                                    onChange={(e) => updateCard(activeCard.id, { data: { ...activeCard.data, [field.key]: e.target.value } })}
                                                >
                                                    <option value="">-- Select --</option>
                                                    {field.options.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type={field.type === 'number' ? 'number' : 'text'}
                                                    className="border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                                    value={activeCard.data[field.key] || ''}
                                                    onChange={(e) => updateCard(activeCard.id, { data: { ...activeCard.data, [field.key]: e.target.value } })}
                                                    placeholder={`Enter ${field.label}...`}
                                                />
                                            )
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="pt-4 mt-auto flex gap-2">
                            <button
                                onClick={() => duplicateCard(activeCard.id)}
                                className="flex-1 bg-white text-blue-600 border border-blue-200 py-2 rounded hover:bg-blue-50 transition-colors text-sm font-semibold shadow-sm"
                            >
                                Duplicate
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this card?'))
                                    {
                                        deleteCard(activeCard.id);
                                        setActiveCardId(null);
                                    }
                                }}
                                className="flex-1 bg-white text-red-600 border border-red-200 py-2 rounded hover:bg-red-50 transition-colors text-sm font-semibold shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-96 flex flex-col items-center justify-center text-gray-400 italic bg-gray-50 border-r p-8 text-center shrink-0">
                    <div className="text-4xl mb-4">🎴</div>
                    <p>Select a card from the list to edit its content.</p>
                </div>
            )
            }

            {/* Right - Live Preview */}
            <div className="flex-1 bg-gray-200 flex flex-col relative overflow-hidden">
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

                <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                    {activeCard && cardTemplate ? (
                        <div
                            className="bg-white shadow-2xl ring-1 ring-black/10 origin-center"
                            style={{
                                transform: `scale(${scale})`,
                                transition: 'transform 0.1s ease-out'
                            }}
                        >
                            {/* We wrap the renderer in a div for html2canvas to target, ensuring clean capture */}
                            {/* NOTE: We duplicate the component for rendering, but in a real app might share ref/instance */}
                            <div ref={renderRef} className="bg-white">
                                <CardRenderer
                                    template={cardTemplate}
                                    data={activeCard}
                                    schema={schema}
                                    scale={1} // Renderer itself should be 1, we scale the container
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 font-bold text-2xl flex flex-col items-center gap-4">
                            <span>{activeCard ? "Missing Template" : "Preview Area"}</span>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};
