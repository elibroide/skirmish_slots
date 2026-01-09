// This schema defines the structure for Traits in the Card Maker
// It mimics the TypeScript interfaces for ReactionConfig and ContinuousConfig
// Schema for a single effect definition
const ReactionEffectSchema = {
    type: 'object',
    properties: {
        effect: {
            type: 'string',
            enum: ['DEAL_DAMAGE', 'HEAL', 'ADD_POWER', 'KILL', 'BOUNCE', 'ADD_SHIELD', 'DRAW_CARDS']
        },
        value: {
            // type: 'number' | 'object'
            // Simplified for schema, ideally using 'oneOf'
            oneOf: [
                { type: 'number', title: "Static Value" },
                {
                    type: 'object',
                    title: "Dynamic Value",
                    properties: {
                        source: { type: 'string', enum: ['EVENT', 'TARGET', 'SOURCE', 'OPPOSING_UNIT'] },
                        property: { type: 'string' },
                        multiplier: { type: 'number' }
                    }
                }
            ]
        },
        target: {
            oneOf: [
                { type: 'string', enum: ['SELF'] },
                { type: 'object' } // Detailed schema to be filled by Card Maker later
            ]
        },
        targetDecision: {
            enum: ["PLAYER", "RANDOM", "ALL", "FIRST"],
            default: "FIRST"
        }
    }
};
export const PowerModifierTraitSchema = {
    type: "object",
    title: "Power Modifier Trait",
    properties: {
        type: { type: "string", const: "POWER_MODIFIER", title: "Trait Type" },
        target: {
            type: "string",
            title: "Target Scope",
            enum: ["SELF", "CLOSE_ALLY", "CLOSE_ENEMY", "ALL_ENEMIES"],
            default: "SELF"
        },
        value: {
            type: "number",
            title: "Amount",
            description: "Power modifier (e.g. +1 or -1)"
        }
    }
};
export const TraitListSchema = {
    type: "array",
    title: "Traits",
    items: {
        type: "object",
        title: "Trait",
        properties: {
            traitType: {
                type: "string",
                title: "Class",
                enum: ["REACTION", "POWER_MODIFIER"],
                default: "REACTION"
            }
        }
    }
};
