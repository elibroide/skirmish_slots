import React, { lazy, Suspense } from 'react';
import 'react-quill-new/dist/quill.snow.css';

// Lazy load ReactQuill to avoid build issues with server-side/static generation if any
const ReactQuill = lazy(() => import('react-quill-new'));

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ],
    };

    return (
        <Suspense fallback={<div className="h-32 bg-gray-100 flex items-center justify-center text-gray-400">Loading Editor...</div>}>
            <div className="bg-white text-gray-800">
                <ReactQuill
                    theme="snow"
                    value={value || ''}
                    onChange={onChange}
                    modules={modules}
                    placeholder={placeholder}
                    className="rich-text-editor"
                />
            </div>
            {/* Custom styles to make it fit nicely */}
            <style>{`
                .ql-container {
                    font-family: inherit;
                    min-height: 100px;
                }
                .ql-editor {
                    min-height: 100px;
                    font-size: inherit;
                }
            `}</style>
        </Suspense>
    );
};
