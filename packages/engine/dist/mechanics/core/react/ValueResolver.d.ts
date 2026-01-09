import type { UnitCard } from '../../cards/Card';
export type ValueSource = 'static' | 'target' | 'me';
export interface ValueSelector {
    type: ValueSource;
    value: any;
    target?: any;
}
export declare class ValueResolver {
    private targetResolver;
    constructor(targetResolver: (selector: any, context: any) => any[]);
    resolve(selector: ValueSelector, context: any, owner: UnitCard): any;
    getProperty(obj: any, path: string): any;
}
