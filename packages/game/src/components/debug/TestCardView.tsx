import React, { useState, useEffect } from "react";
import { CardRenderer } from "../../../../card-maker/src/components/CardRenderer";
// @ts-ignore
import { GameEngine } from "../../engine/GameEngine";
// @ts-ignore
import { createUnitCard } from "../../engine/cards/CardFactory";
import { UNIT_CARD_DEFINITIONS } from "../../engine/cards/cardDefinitions";
import { useCardViewModel } from "../../hooks/useCardViewModel";

// Helper to render a single card (to adhere to hooks rules)
const DebugCardItem: React.FC<{ cardId: string, engine: any }> = ({ cardId, engine }) => {
    const [card, setCard] = useState<any>(null);

    useEffect(() => {
        try
        {
            const c = createUnitCard(cardId, 0, engine);
            setCard(c);
        } catch (e)
        {
            console.error(`Failed to create card ${cardId}`, e);
        }
    }, [cardId, engine]);

    const viewModel = useCardViewModel(card);

    if (!card) return null;
    if (!viewModel) return null; // Logic handled in parent for filtering

    return (
        <div className="transform scale-[0.3] origin-top-left" style={{ width: '225px', height: '315px', marginBottom: '-210px', marginRight: '-150px' }}>
            <CardRenderer
                template={viewModel.template}
                data={viewModel.data}
                schema={viewModel.schema}
                scale={1}
            />
        </div>
    );
};

export const TestCardView: React.FC = () => {
    const [engine, setEngine] = useState<any>(null);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const mockEngine = {
            rng: { next: () => Math.random() },
            onEvent: () => { },
        } as unknown as GameEngine;
        setEngine(mockEngine);
    }, []);

    if (!engine) return <div className="p-8 text-white">Initializing Engine...</div>;

    // Create array of objects with ID and Name for easier filtering
    const validCards: { id: string, name: string }[] = [];

    Object.entries(UNIT_CARD_DEFINITIONS).forEach(([id, def]) => {
        validCards.push({ id, name: def.name });
    });

    return (
        <div className="p-8 bg-gray-900 min-h-screen">
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Valid Card Gallery</h1>
                </div>

                <div className="flex gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Search cards..."
                        className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-blue-500 w-64"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                    <p className="text-gray-400 text-sm">
                        Displaying cards from <code>UNIT_CARD_DEFINITIONS</code> with matching visuals.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-4">
                {validCards
                    .filter(item => item.name.toLowerCase().includes(filter.toLowerCase()))
                    .sort((a, b) => {
                        const lowerFilter = filter.toLowerCase();
                        if (!lowerFilter) return a.name.localeCompare(b.name);

                        const aStarts = a.name.toLowerCase().startsWith(lowerFilter);
                        const bStarts = b.name.toLowerCase().startsWith(lowerFilter);

                        if (aStarts && !bStarts) return -1;
                        if (!aStarts && bStarts) return 1;

                        return a.name.localeCompare(b.name);
                    })
                    .map(item => (
                        <div key={item.id} className="relative group">
                            {/* Tooltip for Debug Info */}
                            <div className="absolute -top-6 left-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 z-50 pointer-events-none transition-opacity">
                                ID: {item.id}
                            </div>
                            <DebugCardItem cardId={item.id} engine={engine} />
                        </div>
                    ))}
            </div>
        </div>
    );
};
