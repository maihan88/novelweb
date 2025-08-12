import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
    PaintBrushIcon,
    PhotoIcon,
    CodeBracketSquareIcon,
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon,
    Bars3BottomLeftIcon,
    Bars3Icon,
    Bars3BottomRightIcon,
    MagnifyingGlassIcon, // Thêm icon
    EyeSlashIcon,     // Thêm icon
    XMarkIcon             // Thêm icon
} from '@heroicons/react/24/outline';

interface CustomEditorProps {
    value: string;
    onChange: (value: string) => void;
}

const CustomEditor: React.FC<CustomEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);
    
    // --- THÊM STATE CHO TÌM KIẾM & THAY THẾ ---
    const [showFind, setShowFind] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    // --- KẾT THÚC ---

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

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

    const execCmd = (command: string, commandValue?: string) => {
        document.execCommand(command, false, commandValue);
        editorRef.current?.focus();
        handleInput();
    };
    
    // --- THÊM HÀM THAY THẾ TẤT CẢ ---
    const handleReplaceAll = () => {
        if (!findText || !editorRef.current) return;
        const originalHtml = editorRef.current.innerHTML;
        
        // Sử dụng new RegExp để tìm kiếm không phân biệt chữ hoa/thường
        const findRegex = new RegExp(findText, 'gi');
        
        if (!originalHtml.match(findRegex)) {
             alert(`Không tìm thấy "${findText}" trong nội dung.`);
             return;
        }

        const newHtml = originalHtml.replaceAll(findRegex, replaceText);
        
        if (window.confirm(`Bạn có chắc muốn thay thế tất cả "${findText}" bằng "${replaceText}" không? (Thao tác này không thể hoàn tác)`)) {
            editorRef.current.innerHTML = newHtml;
            handleInput(); // Cập nhật lại state
        }
    };
    // --- KẾT THÚC ---

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
        <div className=" border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
            {/* --- THÊM class sticky, top-0, z-10 CHO THANH CÔNG CỤ --- */}
            <div
                className="toolbar sticky top-0 z-10 flex flex-wrap items-center gap-1 p-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700"
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

                <ToolbarButton onClick={() => execCmd('justifyLeft')} ariaLabel="Căn trái">
                    <Bars3BottomLeftIcon className="w-5 h-5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCmd('justifyCenter')} ariaLabel="Căn giữa">
                    <Bars3Icon className="w-5 h-5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCmd('justifyRight')} ariaLabel="Căn phải">
                    <Bars3BottomRightIcon className="w-5 h-5" />
                </ToolbarButton>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

                <ToolbarButton onClick={handleImageUpload} ariaLabel="Tải ảnh">
                    <PhotoIcon className="w-5 h-5" />
                </ToolbarButton>
                <ToolbarButton onClick={handleInsertFrame} ariaLabel="Tạo khung văn bản">
                    <CodeBracketSquareIcon className="w-5 h-5" />
                </ToolbarButton>

                {/* --- THÊM CÁC NÚT MỚI --- */}
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                <ToolbarButton onClick={() => execCmd('removeFormat')} ariaLabel="Xóa định dạng">
                    <EyeSlashIcon className="w-5 h-5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => setShowFind(prev => !prev)} ariaLabel="Tìm và thay thế">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                </ToolbarButton>
                {/* --- KẾT THÚC --- */}
            </div>

            {/* --- THÊM KHUNG TÌM KIẾM & THAY THẾ --- */}
            {showFind && (
                <div className="flex flex-col sm:flex-row gap-2 p-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm..." 
                        value={findText}
                        onChange={e => setFindText(e.target.value)}
                        className="flex-grow p-2 border rounded bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    />
                    <input 
                        type="text" 
                        placeholder="Thay thế bằng..." 
                        value={replaceText}
                        onChange={e => setReplaceText(e.target.value)}
                        className="flex-grow p-2 border rounded bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    />
                    <button 
                        onClick={handleReplaceAll}
                        className="px-3 py-2 bg-orange-500 text-white font-semibold rounded hover:bg-orange-600 text-sm"
                    >
                        Thay thế tất cả
                    </button>
                    <button onClick={() => setShowFind(false)} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                       <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            {/* --- KẾT THÚC --- */}

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
