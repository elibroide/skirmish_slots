export declare const PowerModifierTraitSchema: {
    type: string;
    title: string;
    properties: {
        type: {
            type: string;
            const: string;
            title: string;
        };
        target: {
            type: string;
            title: string;
            enum: string[];
            default: string;
        };
        value: {
            type: string;
            title: string;
            description: string;
        };
    };
};
export declare const TraitListSchema: {
    type: string;
    title: string;
    items: {
        type: string;
        title: string;
        properties: {
            traitType: {
                type: string;
                title: string;
                enum: string[];
                default: string;
            };
        };
    };
};
