import React from 'react';
import { useStore } from '../store/useStore';
import type { SchemaField } from '../types';

export const ProjectSettings: React.FC = () => {
    const { schema, setSchema, loadProject, cards, templates } = useStore();

    const [exportType, setExportType] = React.useState<'all' | 'schema' | 'cards'>('all');

    const handleAddParam = () => {
        const newField: SchemaField = { key: 'field_' + Date.now(), type: 'text', label: 'New Field' };
        setSchema([...schema, newField]);
    };

    const handleUpdate = (idx: number, updates: Partial<SchemaField>) => {
        const newSchema = [...schema];
        newSchema[idx] = { ...newSchema[idx], ...updates };
        setSchema(newSchema);
    };

    const handleDelete = (idx: number) => {
        setSchema(schema.filter((_, i) => i !== idx));
    };

    const handleMove = (idx: number, direction: 'up' | 'down') => {
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === schema.length - 1) return;

        const newSchema = [...schema];
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        newSchema[idx] = newSchema[targetIdx];
        newSchema[targetIdx] = schema[idx]; // FIX: Original code had logic but let's be safe
        // Re-implementing swap correctly to be sure, the old code looked like:
        // [newSchema[idx], newSchema[targetIdx]] = [newSchema[targetIdx], newSchema[idx]];
        // I will use the destructuring swap because it's cleaner.
        [newSchema[idx], newSchema[targetIdx]] = [newSchema[targetIdx], newSchema[idx]];
        setSchema(newSchema);
    };

    const handleExport = () => {
        let state: any = { schema, templates, cards };

        if (exportType === 'schema')
        {
            state = { schema, templates };
        } else if (exportType === 'cards')
        {
            state = { cards };
        }

        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Rename file based on type for convenience
        a.download = exportType === 'all' ? 'card-project.json' : `card-project-${exportType}.json`;
        a.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file)
        {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try
                {
                    const json = JSON.parse(ev.target?.result as string);
                    // Validate basic structure?
                    // Handle legacy import (single template) -> convert to templates array
                    if (json.template && !json.templates)
                    {
                        json.templates = [json.template];
                        delete json.template;
                        // Migration for cards needing templateId is handled in useStore? No, loadProject just sets state.
                        // We should patch it here.
                        const tid = json.templates[0].id || "default-imported";
                        json.templates[0].id = tid;
                        if (json.cards)
                        {
                            json.cards = json.cards.map((c: any) => ({ ...c, templateId: c.templateId || tid }));
                        }
                    }

                    if (json.schema && json.templates && json.cards)
                    {
                        loadProject(json);
                        alert("Project loaded successfully!");
                    } else
                    {
                        alert("Invalid project file structure.");
                    }
                } catch (err)
                {
                    console.error(err);
                    alert("Invalid JSON file.");
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <section className="bg-gray-100 h-full p-8 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Project Settings</h1>

            <section className="mb-12">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-700">Data Schema</h2>
                        <p className="text-gray-500 text-sm">Define the fields available for your cards.</p>
                    </div>
                    <button onClick={handleAddParam} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium shadow-sm transition-colors">
                        + Add Field
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow ring-1 ring-black/5 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b">
                            <tr>
                                <th className="p-4 font-medium">Key (Variable Name)</th>
                                <th className="p-4 font-medium">Label (Display Name)</th>
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Example</th>
                                <th className="p-4 font-medium">Default</th>
                                <th className="p-4 font-medium">Options (Enum)</th>
                                <th className="p-4 font-medium">Message Scope</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {schema.map((field, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3">
                                        <input
                                            value={field.key}
                                            onChange={(e) => handleUpdate(idx, { key: e.target.value })}
                                            className="border rounded p-2 w-full font-mono text-sm bg-gray-50 focus:bg-white transition-colors"
                                            placeholder="e.g. power"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            value={field.label}
                                            onChange={(e) => handleUpdate(idx, { label: e.target.value })}
                                            className="border rounded p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="e.g. Power"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <select
                                            value={field.type}
                                            onChange={(e) => handleUpdate(idx, { type: e.target.value as any })}
                                            className="border rounded p-2 w-full text-sm bg-white"
                                        >
                                            <option value="text">Text (Single Line)</option>
                                            <option value="number">Number</option>
                                            <option value="richtext">Rich Text (Multi-line)</option>
                                            <option value="image">Image (URL)</option>
                                            <option value="tags">Text (Tags)</option>
                                        </select>
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            placeholder="e.g. 5, Fireball"
                                            className="border rounded p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={field.example || ''}
                                            onChange={(e) => handleUpdate(idx, { example: e.target.value })}
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            placeholder="Default value"
                                            className="border rounded p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={field.defaultValue || ''}
                                            onChange={(e) => handleUpdate(idx, { defaultValue: e.target.value })}
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            placeholder="Comma separated..."
                                            className="border rounded p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={field.options?.join(', ') || ''}
                                            onChange={(e) => handleUpdate(idx, { options: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined })}
                                        />
                                    </td>
                                    <td className="p-3">
                                        <select
                                            value={field.scope || ((field as any).readOnly ? 'template_only' : 'both')}
                                            onChange={(e) => handleUpdate(idx, { scope: e.target.value as any })}
                                            className="border rounded p-2 w-full text-sm bg-white"
                                        >
                                            <option value="both">Template & Card</option>
                                            <option value="template_only">Template Only</option>
                                            <option value="card_only">Card Only</option>
                                        </select>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex gap-1 justify-end">
                                            <button
                                                onClick={() => handleMove(idx, 'up')}
                                                disabled={idx === 0}
                                                className="text-gray-500 hover:text-blue-600 px-2 disabled:opacity-30"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                onClick={() => handleMove(idx, 'down')}
                                                disabled={idx === schema.length - 1}
                                                className="text-gray-500 hover:text-blue-600 px-2 disabled:opacity-30"
                                            >
                                                ▼
                                            </button>
                                            <div className="w-px bg-gray-300 mx-1"></div>
                                            <button onClick={() => handleDelete(idx)} className="text-red-600 hover:text-red-800 font-medium text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {schema.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                                        No fields defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="border-t pt-8">
                <h2 className="text-xl font-bold mb-4 text-gray-700">Data Management</h2>

                <div className="flex flex-col gap-4">
                    <div className="bg-white p-6 rounded-lg shadow ring-1 ring-black/5 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-800">Local Storage</h3>
                            <p className="text-gray-500 text-sm mt-1">Manually save your progress or clear everything to start fresh.</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    /* Zustand persist handles it auto, but we can force rehydration or just notify */
                                    alert("Project saved to LocalStorage!");
                                }}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 shadow-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                💾 Save Project
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm("ARE YOU SURE? This will delete all your settings, layouts, and cards. This cannot be undone."))
                                    {
                                        localStorage.removeItem('card-maker-storage');
                                        window.location.reload();
                                    }
                                }}
                                className="bg-red-50 border border-red-200 text-red-600 px-6 py-2 rounded hover:bg-red-100 shadow-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                🗑 Clear Project
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow ring-1 ring-black/5 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-800">File Export / Import</h3>
                            <p className="text-gray-500 text-sm mt-1">Save your entire project to a JSON file to transfer between devices.</p>
                        </div>
                        <div className="flex gap-4 items-center">
                            <select
                                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
                                value={exportType}
                                onChange={(e) => setExportType(e.target.value as any)}
                            >
                                <option value="all">All Data</option>
                                <option value="schema">Schema & Templates</option>
                                <option value="cards">Cards Only</option>
                            </select>
                            <button onClick={handleExport} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 shadow-sm font-bold flex items-center gap-2 transition-colors">
                                ⬇ Export JSON
                            </button>
                            <label className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded cursor-pointer hover:bg-gray-50 font-bold flex items-center gap-2 transition-colors shadow-sm">
                                ⬆ Import JSON
                                <input type="file" onChange={handleImport} className="hidden" accept=".json" />
                            </label>
                        </div>
                    </div>
                </div>
            </section>
        </section>
    );
};
