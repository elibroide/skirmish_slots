
import React, { useState } from 'react';
import type { CardTemplate, AutomationRule, SchemaField, AutomationCondition, AutomationEffect } from '../types';

interface AutomationEditorProps {
    template: CardTemplate;
    onUpdate: (updates: Partial<CardTemplate>) => void;
    schema: SchemaField[];
}

export const AutomationEditor: React.FC<AutomationEditorProps> = ({ template, onUpdate, schema }) => {
    const automations = template.automations || [];

    const handleAddRule = () => {
        const newRule: AutomationRule = {
            id: crypto.randomUUID(),
            name: 'New Rule',
            conditions: [],
            effects: []
        };
        onUpdate({ automations: [...automations, newRule] });
    };

    const handleUpdateRule = (ruleId: string, updates: Partial<AutomationRule>) => {
        const newAutomations = automations.map(r => r.id === ruleId ? { ...r, ...updates } : r);
        onUpdate({ automations: newAutomations });
    };

    const handleDeleteRule = (ruleId: string) => {
        if (!confirm('Delete this rule?')) return;
        onUpdate({ automations: automations.filter(r => r.id !== ruleId) });
    };

    const handleDuplicateRule = (ruleId: string) => {
        const original = automations.find(r => r.id === ruleId);
        if (!original) return;

        const newRule: AutomationRule = {
            ...original,
            id: crypto.randomUUID(),
            name: `${original.name} (Copy)`,
            conditions: original.conditions.map(c => ({ ...c, id: crypto.randomUUID() })),
            effects: original.effects.map(e => ({ ...e, id: crypto.randomUUID() }))
        };

        onUpdate({ automations: [...automations, newRule] });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 italic">{automations.length} rules defined</span>
                <button
                    onClick={handleAddRule}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 hover:bg-green-200 font-semibold"
                >
                    + New Rule
                </button>
            </div>

            <div className="space-y-3">
                {automations.map((rule) => (
                    <RuleItem
                        key={rule.id}
                        rule={rule}
                        schema={schema}
                        template={template}
                        onUpdate={(updates) => handleUpdateRule(rule.id, updates)}
                        onDelete={() => handleDeleteRule(rule.id)}
                        onDuplicate={() => handleDuplicateRule(rule.id)}
                    />
                ))}
            </div>
        </div>
    );
};

const RuleItem: React.FC<{
    rule: AutomationRule;
    schema: SchemaField[];
    template: CardTemplate;
    onUpdate: (updates: Partial<AutomationRule>) => void;
    onDelete: () => void;
    onDuplicate: () => void;
}> = ({ rule, schema, template, onUpdate, onDelete, onDuplicate }) => {
    const [expanded, setExpanded] = useState(false);

    // Helpers for Condition Management
    const addCondition = () => {
        const newCondition: AutomationCondition = {
            id: crypto.randomUUID(),
            field: schema[0]?.key || 'type',
            operator: 'equals',
            value: ''
        };
        onUpdate({ conditions: [...rule.conditions, newCondition] });
    };

    const updateCondition = (condId: string, updates: Partial<AutomationCondition>) => {
        onUpdate({ conditions: rule.conditions.map(c => c.id === condId ? { ...c, ...updates } : c) });
    };

    const removeCondition = (condId: string) => {
        onUpdate({ conditions: rule.conditions.filter(c => c.id !== condId) });
    };

    // Helpers for Effect Management
    const addEffect = () => {
        const newEffect: AutomationEffect = {
            id: crypto.randomUUID(),
            target: template.zones[0]?.schemaKey || 'FRAME',
            property: 'visible',
            value: false
        };
        onUpdate({ effects: [...rule.effects, newEffect] });
    };

    const updateEffect = (effId: string, updates: Partial<AutomationEffect>) => {
        onUpdate({ effects: rule.effects.map(e => e.id === effId ? { ...e, ...updates } : e) });
    };

    const removeEffect = (effId: string) => {
        onUpdate({ effects: rule.effects.filter(e => e.id !== effId) });
    };

    return (
        <div className="border rounded bg-white shadow-sm overflow-hidden">
            <div
                className="p-2 bg-gray-50 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 transform transition-transform duration-200" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    <input
                        className="font-bold text-sm bg-transparent border-transparent focus:border-blue-300 border-b outline-none text-gray-700 w-40"
                        value={rule.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        placeholder="Rule Name"
                    />
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                        title="Duplicate Rule"
                        className="text-gray-400 hover:text-blue-500 px-2"
                    >
                        📋
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        title="Delete Rule"
                        className="text-gray-400 hover:text-red-500 px-2"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-3 space-y-4 bg-white">
                    {/* Conditions */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Conditions (AND)</h4>
                            <button onClick={addCondition} className="text-[10px] text-blue-600 hover:text-blue-800 underline">+ Add Condition</button>
                        </div>
                        <div className="space-y-2">
                            {rule.conditions.map(cond => (
                                <div key={cond.id} className="flex gap-1 items-center bg-gray-50 p-1 rounded border">
                                    <select
                                        className="text-xs border rounded p-1 max-w-[80px]"
                                        value={cond.field}
                                        onChange={(e) => updateCondition(cond.id, { field: e.target.value })}
                                    >
                                        {schema.map(f => (<option key={f.key} value={f.key}>{f.label}</option>))}
                                    </select>

                                    <select
                                        className="text-xs border rounded p-1"
                                        value={cond.operator}
                                        onChange={(e) => updateCondition(cond.id, { operator: e.target.value as any })}
                                    >
                                        <option value="equals">==</option>
                                        <option value="not_equals">!=</option>
                                        <option value="contains">contains</option>
                                        <option value="gt">&gt;</option>
                                        <option value="lt">&lt;</option>
                                    </select>

                                    <input
                                        className="flex-1 text-xs border rounded p-1 min-w-[50px]"
                                        value={String(cond.value)}
                                        onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                                        placeholder="Value"
                                    />

                                    <button onClick={() => removeCondition(cond.id)} className="text-gray-400 hover:text-red-500 px-1">✕</button>
                                </div>
                            ))}
                            {rule.conditions.length === 0 && <div className="text-xs text-gray-400 italic text-center p-2 bg-gray-50 rounded">No conditions. Always fires?</div>}
                        </div>
                    </div>

                    {/* Effects */}
                    <div className="border-t pt-3">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Effects</h4>
                            <button onClick={addEffect} className="text-[10px] text-green-600 hover:text-green-800 underline">+ Add Effect</button>
                        </div>
                        <div className="space-y-2">
                            {rule.effects.map(eff => (
                                <div key={eff.id} className="flex flex-col gap-1 bg-green-50 p-2 rounded border border-green-100">
                                    <div className="flex gap-1 items-center">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase w-8">Set</span>
                                        <select
                                            className="flex-1 text-xs border rounded p-1"
                                            value={eff.target}
                                            onChange={(e) => updateEffect(eff.id, { target: e.target.value })}
                                        >
                                            <option value="FRAME">Card Frame</option>
                                            {template.zones.map(z => (
                                                <option key={z.id} value={z.schemaKey}>Zone: {schema.find(f => f.key === z.schemaKey)?.label || z.schemaKey}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => removeEffect(eff.id)} className="text-gray-400 hover:text-red-500 px-1">✕</button>
                                    </div>

                                    <div className="flex gap-1 items-center pl-9">
                                        <span className="text-[10px] text-gray-400">Property</span>
                                        <select
                                            className="text-xs border rounded p-1"
                                            value={eff.property}
                                            onChange={(e) => updateEffect(eff.id, { property: e.target.value as any })}
                                        >
                                            <option value="visible">Visible</option>
                                            <option value="frameVariant">Variant (Name)</option>
                                            <option value="src">Image Src</option>
                                            {/* Could add more like opacity, color etc later. "style" is complex for UI */}
                                        </select>
                                        <span className="text-[10px] text-gray-400">=</span>

                                        {/* Dynamic vs Static Toggle */}
                                        <button
                                            className={`px-1.5 py-0.5 text-[10px] rounded border ${eff.fromField ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                            onClick={() => updateEffect(eff.id, { fromField: !eff.fromField, value: '' })}
                                            title="Toggle between Static Value and Dynamic Field Value"
                                        >
                                            {eff.fromField ? 'Field' : 'Static'}
                                        </button>

                                        {eff.fromField ? (
                                            <select
                                                className="flex-1 text-xs border rounded p-1 bg-blue-50"
                                                value={String(eff.value)}
                                                onChange={(e) => updateEffect(eff.id, { value: e.target.value })}
                                            >
                                                <option value="">-- Select Field --</option>
                                                {schema.map(f => (
                                                    <option key={f.key} value={f.key}>{f.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            /* Static Value Inputs */
                                            eff.property === 'visible' ? (
                                                <select
                                                    className="flex-1 text-xs border rounded p-1"
                                                    value={String(eff.value)}
                                                    onChange={(e) => updateEffect(eff.id, { value: e.target.value === 'true' })}
                                                >
                                                    <option value="true">True</option>
                                                    <option value="false">False</option>
                                                </select>
                                            ) : eff.property === 'frameVariant' ? (
                                                // If target is FRAME, show frame variants. If target is ZONE, show zone variants.
                                                <select
                                                    className="flex-1 text-xs border rounded p-1"
                                                    value={String(eff.value)}
                                                    onChange={(e) => updateEffect(eff.id, { value: e.target.value })}
                                                >
                                                    <option value="">-- Select Variant --</option>
                                                    {(eff.target === 'FRAME'
                                                        ? template.frameVariants
                                                        : template.zones.find(z => z.schemaKey === eff.target)?.variants
                                                    )?.map(v => (
                                                        <option key={v.id} value={v.name}>{v.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    className="flex-1 text-xs border rounded p-1"
                                                    value={String(eff.value)}
                                                    onChange={(e) => updateEffect(eff.id, { value: e.target.value })}
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                            {rule.effects.length === 0 && <div className="text-xs text-gray-400 italic text-center p-2 bg-gray-50 rounded">No effects. Nothing happens.</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
