import React from 'react';

interface JsonFieldProps {
    schema?: Record<string, any>;
    value: any;
    onChange: (val: any) => void;
    label?: string;
    depth?: number;
}

export const JsonField: React.FC<JsonFieldProps> = ({ schema, value, onChange, label, depth = 0 }) => {
    if (!schema) return <div className="text-red-500 text-xs">No Schema Definition</div>;

    const fieldType = schema.type || 'string';
    const isObject = fieldType === 'object' && schema.properties;

    // Default initialization if value is undefined
    React.useEffect(() => {
        if (value === undefined)
        {
            if (fieldType === 'object') onChange({});
            else if (fieldType === 'number') onChange(0);
            else if (fieldType === 'boolean') onChange(false);
            else onChange("");
        }
    }, [value, fieldType]);

    // Recursive logic for Object
    if (isObject)
    {
        return (
            <div className={`space-y-2 ${depth > 0 ? 'pl-2 border-l-2 border-gray-100 ml-1' : ''}`}>
                {label && <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</div>}
                {Object.entries(schema.properties).map(([key, propSchema]: [string, any]) => (
                    <JsonField
                        key={key}
                        schema={propSchema}
                        value={value?.[key]}
                        onChange={(newVal) => onChange({ ...value, [key]: newVal })}
                        label={propSchema.title || key} // Use title from schema or key
                        depth={depth + 1}
                    />
                ))}
            </div>
        );
    }

    // Array logic (Simple list of items for now)
    if (fieldType === 'array' && schema.items)
    {
        const list = Array.isArray(value) ? value : [];
        return (
            <div className={`space-y-2 ${depth > 0 ? 'pl-2 border-l-2 border-gray-100 ml-1' : ''}`}>
                <div className="flex justify-between items-center">
                    {label && <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</div>}
                    <button
                        onClick={() => onChange([...list, undefined])} // Add undefined, child will init
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100"
                    >
                        + Add
                    </button>
                </div>
                {list.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <JsonField
                                schema={schema.items}
                                value={item}
                                onChange={(newItemVal) => {
                                    const newList = [...list];
                                    newList[idx] = newItemVal;
                                    onChange(newList);
                                }}
                                depth={depth + 1}
                            />
                        </div>
                        <button
                            onClick={() => {
                                const newList = list.filter((_, i) => i !== idx);
                                onChange(newList);
                            }}
                            className="text-red-400 hover:text-red-500 text-xs px-1"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        )
    }

    // Enum (Select)
    if (schema.enum)
    {
        return (
            <div className="mb-2">
                {label && <label className="block text-xs font-medium text-gray-600 mb-0.5">{label}</label>}
                <select
                    className="w-full border rounded text-xs p-1.5 bg-white"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">-- Select --</option>
                    {schema.enum.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                {schema.description && <div className="text-[10px] text-gray-400">{schema.description}</div>}
            </div>
        );
    }

    // Boolean
    if (fieldType === 'boolean')
    {
        return (
            <div className="flex items-center gap-2 mb-2">
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                />
                {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
                {schema.description && <div className="text-[10px] text-gray-400 ml-auto">{schema.description}</div>}
            </div>
        );
    }

    // Number
    if (fieldType === 'number' || fieldType === 'integer')
    {
        return (
            <div className="mb-2">
                {label && <label className="block text-xs font-medium text-gray-600 mb-0.5">{label}</label>}
                <input
                    type="number"
                    className="w-full border rounded text-xs p-1.5"
                    value={value || 0}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                />
                {schema.description && <div className="text-[10px] text-gray-400">{schema.description}</div>}
            </div>
        );
    }

    // Default String
    return (
        <div className="mb-2">
            {label && <label className="block text-xs font-medium text-gray-600 mb-0.5">{label}</label>}
            <input
                type="text"
                className="w-full border rounded text-xs p-1.5"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={schema.description || `Enter ${label}...`}
            />
        </div>
    );
};
