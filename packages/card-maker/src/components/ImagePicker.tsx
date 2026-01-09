import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

interface ImagePickerProps {
    currentUrl?: string;
    onSelect: (url: string) => void;
    onClear: () => void;
    directory?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({ currentUrl, onSelect, onClear, directory = 'templates' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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
                // Exclude board tiles
                if (path.includes('.board')) return false;

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
                setIsOpen(false); // Close after upload
            };
            reader.readAsDataURL(file);
        }
    };

    const filteredPresets = presets.filter(path =>
        path.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {/* Trigger Button & Preview */}
            <div className="flex gap-2 items-center">
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex-1 bg-white border rounded p-2 hover:bg-gray-50 text-left flex items-center gap-2 group transition-all hover:border-blue-300"
                >
                    {currentUrl ? (
                        <div className="w-8 h-8 rounded bg-gray-100 border overflow-hidden shrink-0">
                            <img src={currentUrl} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded bg-gray-100 border flex items-center justify-center text-gray-400 shrink-0 group-hover:bg-white">
                            📷
                        </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-medium truncate text-gray-700 group-hover:text-blue-600">
                            {currentUrl ? currentUrl.split('/').pop() : "Select Image..."}
                        </div>
                        {currentUrl && <div className="text-[10px] text-gray-400 truncate">Click to change</div>}
                    </div>
                </button>
                {currentUrl && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onClear(); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-colors"
                        title="Clear Image"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8" onClick={() => setIsOpen(false)}>
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-fadeIn"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <span>Select {directory === 'card-art' ? 'Card Art' : directory === 'templates' ? 'Template Frame' : 'Image'}</span>
                                <span className="bg-gray-200 text-gray-500 text-xs px-2 py-0.5 rounded-full">{presets.length} assets</span>
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Toolbar */}
                        <div className="p-4 border-b flex gap-4 bg-white">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Search images..."
                                    autoFocus
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>

                            <div className="flex bg-gray-100 rounded-lg p-1 shrink-0">
                                <button
                                    onClick={() => setMode('preset')}
                                    className={clsx(
                                        "px-4 py-1.5 text-sm rounded-md transition-all font-medium",
                                        mode === 'preset' ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Library
                                </button>
                                <button
                                    onClick={() => setMode('upload')}
                                    className={clsx(
                                        "px-4 py-1.5 text-sm rounded-md transition-all font-medium",
                                        mode === 'upload' ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Upload
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {mode === 'upload' ? (
                                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl m-4 bg-gray-50/50">
                                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <label className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                        Choose File
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                    <p className="mt-2 text-gray-400 text-sm">Supports PNG, JPG, GIF, WEBP</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {filteredPresets.map(path => (
                                        <button
                                            key={path}
                                            onClick={() => { onSelect(path); setIsOpen(false); }}
                                            className={clsx(
                                                "aspect-[3/4] border-2 rounded-lg overflow-hidden group relative bg-white transition-all hover:shadow-lg transform hover:-translate-y-1",
                                                currentUrl === path ? "ring-4 ring-blue-500/30 border-blue-500" : "border-gray-100 hover:border-blue-300"
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-gray-100/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                                            <img
                                                src={path}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                <div className="text-white text-xs truncate font-medium">
                                                    {path.split('/').pop()}
                                                </div>
                                            </div>
                                            {currentUrl === path && (
                                                <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg z-20">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    {filteredPresets.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-gray-400 flex flex-col items-center">
                                            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <p>No images found matching "{searchTerm}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
