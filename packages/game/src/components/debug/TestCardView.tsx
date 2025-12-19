import { CardRenderer, CardInstance, resolveTemplate } from '@skirmish/card-maker';
import projectData from '../../config/card-maker-project.json';

export const TestCardView = () => {
    // Cast projectData to any validation needed or just use as is for debug
    const { cards, templates, schema } = projectData as any;

    return (
        <div className="p-8 bg-gray-100 min-h-screen overflow-auto">
            <h1 className="text-3xl font-bold mb-8">Card Renderer Integration Test</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cards.map((card: any) => {
                    const template = templates.find((t: any) => t.id === card.templateId);
                    if (!template) return null;

                    // Combine card art config with defaults if missing (just in case)
                    // The renderer expects full config usually

                    return (
                        <div key={card.id} className="flex flex-col items-center">
                            <h2 className="text-xl font-semibold mb-4">{card.data.name}</h2>
                            <div className="transform scale-[0.5] origin-top border border-gray-300 shadow-xl">
                                <CardRenderer
                                    template={template}
                                    data={card}
                                    schema={schema}
                                    scale={1}
                                />
                            </div>
                            {/* Spacer for the scaled card which takes up less flow space than its height */}
                            <div className="h-[525px]"></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
