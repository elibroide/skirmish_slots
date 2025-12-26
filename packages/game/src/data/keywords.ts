export interface KeywordDefinition {
    id: string;
    name: string;
    text: string;
}

export const KEYWORDS: Record<string, KeywordDefinition> = {
    deploy: {
        id: 'deploy',
        name: 'Deploy',
        text: 'Trigger when the unit is deployed to a slot.'
    },
    dominant: {
        id: 'dominant',
        name: 'Dominant',
        text: 'Triggers once when your turn starts if the unit controls its lane.'
    },
    battle: {
        id: 'battle',
        name: 'Battle',
        text: 'Battling units deal damage to each other equal to their power.'
    }
};
