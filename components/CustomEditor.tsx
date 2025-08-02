import React, { useRef, useEffect, useCallback } from 'react';
import {
    PaintBrushIcon,
    PhotoIcon,
    CodeBracketSquareIcon,
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon
} from '@heroicons/react/24/outline';

interface CustomEditorProps {
    value: string;
    onChange: (value: string) => void;
}

const CustomEditor: React.FC<CustomEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Syncs the editor when the `value` prop changes externally.
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    // Callback to update parent state when user types or formats text.
    const handleInput = useCallback(() => {
        if (editorRef.current) {
            const currentHtml = editorRef.current.innerHTML;
            if (value !== currentHtml) {
                onChangeRef.current(currentHtml);
            }
        }
    }, [value]);

    const handleToolbarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    const execCmd = (command: string, commandValue: string | null = null) => {
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand(command, false, commandValue);
        editorRef.current?.focus();
        handleInput();
    };

    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result;
                    if (typeof dataUrl === 'string') {
                        const imgHtml = `<img src="${dataUrl}" style="max-width: 100%; height: auto; border-radius: 0.25rem;" alt=""/>`;
                        execCmd('insertHTML', imgHtml);
                    }
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const handleInsertFrame = () => {
        const frameHTML = `<div style="border: 1px dashed #9ca3af; padding: 1rem; margin: 1rem 0; border-radius: 0.25rem;">
            <p>Nội dung trong khung...</p>
        </div><p><br></p>`;
        execCmd('insertHTML', frameHTML);
    };

    const ToolbarButton: React.FC<{ children: React.ReactNode, onClick: () => void, ariaLabel: string }> = ({ children, onClick, ariaLabel }) => (
        <button
            type="button"
            onClick={onClick}
            onMouseDown={handleToolbarMouseDown}
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );

    return (
        <div className="border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
            <div
                className="toolbar flex flex-wrap items-center gap-1 p-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700"
            >
                <ToolbarButton onClick={() => execCmd('undo')} ariaLabel="Hoàn tác">
                    <ArrowUturnLeftIcon className="w-5 h-5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCmd('redo')} ariaLabel="Làm lại">
                    <ArrowUturnRightIcon className="w-5 h-5" />
                </ToolbarButton>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                <ToolbarButton onClick={() => execCmd('bold')} ariaLabel="In đậm">
                    <span className="font-bold w-5 h-5 flex items-center justify-center">B</span>
                </ToolbarButton>
                <ToolbarButton onClick={() => execCmd('italic')} ariaLabel="In nghiêng">
                    <span className="italic w-5 h-5 flex items-center justify-center">I</span>
                </ToolbarButton>
                <ToolbarButton onClick={() => execCmd('underline')} ariaLabel="Gạch chân">
                    <span className="underline w-5 h-5 flex items-center justify-center">U</span>
                </ToolbarButton>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                <label className="relative flex items-center cursor-pointer" onMouseDown={handleToolbarMouseDown}>
                    <div className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <PaintBrushIcon className="w-5 h-5" />
                    </div>
                    <input
                        type="color"
                        onChange={(e) => execCmd('foreColor', e.target.value)}
                        className="absolute w-full h-full opacity-0 cursor-pointer"
                        aria-label="Màu chữ"
                    />
                </label>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                <ToolbarButton onClick={handleImageUpload} ariaLabel="Tải ảnh">
                    <PhotoIcon className="w-5 h-5" />
                </ToolbarButton>
                <ToolbarButton onClick={handleInsertFrame} ariaLabel="Tạo khung văn bản">
                    <CodeBracketSquareIcon className="w-5 h-5" />
                </ToolbarButton>
            </div>
            <div
                ref={editorRef}
                onInput={handleInput}
                contentEditable={true}
                spellCheck={false}
                suppressContentEditableWarning={true}
                className="max-w-none prose dark:prose-invert prose-p:my-2 prose-h2:my-4 prose-h3:my-3 prose-h4:my-2 prose-blockquote:my-2 p-4 min-h-[400px] focus:outline-none"
            />
        </div>
    );
};

export default CustomEditor;