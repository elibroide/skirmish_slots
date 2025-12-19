
import type { CardTemplate, AutomationRule, AutomationCondition } from '../types';

export const evaluateCondition = (condition: AutomationCondition, data: Record<string, any>): boolean => {
    const fieldValue = data[condition.field];
    const conditionValue = condition.value;

    // Handle undefined/null gracefully
    if (fieldValue === undefined || fieldValue === null) return false;

    switch (condition.operator) {
        case 'equals':
            return String(fieldValue) === String(conditionValue);
        case 'not_equals':
            return String(fieldValue) !== String(conditionValue);
        case 'contains':
            return String(fieldValue).includes(String(conditionValue));
        case 'gt':
            return Number(fieldValue) > Number(conditionValue);
        case 'lt':
            return Number(fieldValue) < Number(conditionValue);
        default:
            return false;
    }
};

export const resolveTemplate = (template: CardTemplate, data: Record<string, any>): CardTemplate => {
    if (!template.automations || template.automations.length === 0) {
        return template;
    }

    // Deep clone to avoid mutating original state
    const resolvedTemplate: CardTemplate = JSON.parse(JSON.stringify(template));

    // Initialize all zones to visible by default if not set
    resolvedTemplate.zones.forEach(z => {
        if (z.visible === undefined) z.visible = true;
    });

    resolvedTemplate.automations?.forEach((rule: AutomationRule) => {
        const isMatch = rule.conditions.every(c => evaluateCondition(c, data));

        if (isMatch) {
            rule.effects.forEach(effect => {
                // Resolve value: Direct or from Field
                let value = effect.value;
                if (effect.fromField) {
                     // If targeting a field, value is the Key of that field
                     value = data[String(effect.value)]; 
                }

                if (effect.target === 'FRAME') {
                    if (effect.property === 'frameVariant') {
                        // Find variant by Name or ID
                        // value is the variant name (e.g. "Red") resolved from data
                        const variant = resolvedTemplate.frameVariants?.find(
                            v => v.name === value || v.id === value
                        );
                        if (variant) {
                            resolvedTemplate.frameUrl = variant.url;
                            // FORCE: Clear variants so data.frameVariantId logic fails lookup and falls back to this URL
                            resolvedTemplate.frameVariants = []; 
                        }
                    } else if (effect.property === 'src') {
                        resolvedTemplate.frameUrl = value;
                        // FORCE: Clear variants
                        resolvedTemplate.frameVariants = [];
                    }
                } else {
                    // Zone Target
                    const zone = resolvedTemplate.zones.find(z => z.schemaKey === effect.target);
                    if (zone) {
                        if (effect.property === 'visible') {
                             zone.visible = Boolean(value);
                        } else if (effect.property === 'src') {
                             zone.src = String(value);
                             // FORCE: Clear variants so data[key] lookup fails and falls back to this src
                             zone.variants = [];
                        } else if (effect.property === 'style') {
                             // Style is complex for dynamic fields since it's an object. 
                             // If value is object, merge it. If string, ignore? 
                             // For now assuming direct object for static, and maybe JSON string for dynamic? 
                             // Or simpler: dynamic style override is likely not main use case yet.
                             if (typeof value === 'object') {
                                zone.style = { ...zone.style, ...value };
                             }
                        }
                        // We could add 'variant' property handling for zones too
                        else if (effect.property === 'frameVariant') { 
                             // Misnomer for zones, but maybe we interpret it as 'zoneVariant'
                             const variant = zone.variants?.find(v => v.name === value);
                             if (variant) {
                                 zone.src = variant.src;
                                 // FORCE: Clear variants so data[key] lookup fails
                                 zone.variants = [];
                             }
                        }
                    }
                }
            });
        }
    });

    return resolvedTemplate;
};
