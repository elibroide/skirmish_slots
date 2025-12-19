import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

interface ImagePickerProps {
    currentUrl?: string;
    onSelect: (url: string) => void;
    onClear: () => void;
}

export const ImagePicker: React.FC<ImagePickerProps & { directory?: string }> = ({ currentUrl, onSelect, onClear, directory = 'templates' }) => {
    const [mode, setMode] = useState<'upload' | 'preset'>('preset');
    const [presets, setPresets] = useState<string[]>([]);


    useEffect(() => {
        // Load assets based on directory.
        // Vite requires string literals for glob. We can try to load all assets in public.
        // NOTE: This might be heavy if there are many files, but for a local tool it's acceptable.

        let modules: Record<string, any> = {};

        if (directory === 'templates')
        {
            modules = import.meta.glob('/public/templates/*');
        } else if (directory === 'card-art')
        {
            modules = import.meta.glob('/public/card-art/*');
        } else
        {
            // Assume it's in public/assets/[directory]/*
            modules = import.meta.glob('/public/assets/**/*');
        }

        const paths = Object.keys(modules)
            .map(path => path.replace('/public', ''))
            .filter(path => {
                if (directory === 'templates' || directory === 'card-art') return true;
                // For custom directories, strictly filter by the folder name
                // e.g. path: /assets/rarityImage/rare.png, directory: 'rarityImage'
                // The import.meta.glob above gets EVERYTHING in assets.
                // We check if the path starts with /assets/{directory}/
                return path.startsWith(`/assets/${directory}/`);
            });

        setPresets(paths);
    }, [directory]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file)
        {
            const reader = new FileReader();
            reader.onload = (ev) => {
                onSelect(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded border">
            <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-xs uppercase text-gray-500">{directory === 'card-art' ? 'Card Art' : 'Card Frame'}</label>
                <div className="flex bg-gray-200 rounded p-0.5">
                    <button
                        onClick={() => setMode('preset')}
                        className={clsx(
                            "px-2 py-0.5 text-[10px] rounded",
                            mode === 'preset' ? "bg-white shadow text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Presets
                    </button>
                    <button
                        onClick={() => setMode('upload')}
                        className={clsx(
                            "px-2 py-0.5 text-[10px] rounded",
                            mode === 'upload' ? "bg-white shadow text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Upload
                    </button>
                </div>
            </div>

            {mode === 'upload' ? (
                <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs" />
            ) : (
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1 border rounded bg-white">
                    {presets.length === 0 && <span className="text-xs text-gray-400 col-span-4 p-2 text-center">No presets found in public/{directory}</span>}
                    {presets.map(path => (
                        <button
                            key={path}
                            onClick={() => onSelect(path)}
                            className={clsx(
                                "aspect-[3/4] border rounded overflow-hidden hover:ring-2 ring-blue-400 transition-all relative group",
                                currentUrl === path ? "ring-2 ring-blue-600" : "border-gray-200"
                            )}
                            title={path.split('/').pop()}
                        >
                            <img src={path} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {currentUrl && (
                <div className="relative group mt-2">
                    <img src={currentUrl} alt="Preview" className="h-24 object-contain border bg-white mx-auto" />
                    <button
                        onClick={onClear}
                        className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Remove
                    </button>
                </div>
            )}
        </div>
    );
};
