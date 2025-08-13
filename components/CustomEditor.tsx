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
    MagnifyingGlassIcon,
    EyeSlashIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

interface CustomEditorProps {
    value: string;
    onChange: (value: string) => void;
}

const CustomEditor: React.FC<CustomEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);
    
    // --- STATE CHO TÌM KIẾM & THAY THẾ ---
    const [showFind, setShowFind] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [isToolbarFixed, setIsToolbarFixed] = useState(false);
    const [toolbarHeight, setToolbarHeight] = useState(0);
    const [toolbarPosition, setToolbarPosition] = useState({ left: 0, width: 0 });

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    // Effect để handle scroll và fixed positioning
    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current || !toolbarRef.current) return;
            
            const containerRect = containerRef.current.getBoundingClientRect();
            const shouldBeFixed = containerRect.top <= 0 && containerRect.bottom > toolbarHeight;
            
            if (shouldBeFixed && !isToolbarFixed) {
                // Lấy vị trí và kích thước của container khi bắt đầu fixed
                setToolbarPosition({
                    left: containerRect.left,
                    width: containerRect.width
                });
            }
            
            setIsToolbarFixed(shouldBeFixed);
        };

        const updateToolbarHeight = () => {
            if (toolbarRef.current) {
                setToolbarHeight(toolbarRef.current.offsetHeight);
            }
        };

        updateToolbarHeight();
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', updateToolbarHeight);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', updateToolbarHeight);
        };
    }, [showFind, toolbarHeight, isToolbarFixed]);

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
    
    const handleReplaceAll = () => {
        if (!findText || !editorRef.current) return;
        const originalHtml = editorRef.current.innerHTML;
        
        const findRegex = new RegExp(findText, 'gi');
        
        if (!originalHtml.match(findRegex)) {
             alert(`Không tìm thấy "${findText}" trong nội dung.`);
             return;
        }

        const newHtml = originalHtml.replaceAll(findRegex, replaceText);
        
        if (window.confirm(`Bạn có chắc muốn thay thế tất cả "${findText}" bằng "${replaceText}" không? (Thao tác này không thể hoàn tác)`)) {
            editorRef.current.innerHTML = newHtml;
            handleInput();
        }
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

    const toolbarContent = (
        <>
            <div className="toolbar flex flex-wrap items-center gap-1 p-2">
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

                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                <ToolbarButton onClick={() => execCmd('removeFormat')} ariaLabel="Xóa định dạng">
                    <EyeSlashIcon className="w-5 h-5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => setShowFind(prev => !prev)} ariaLabel="Tìm và thay thế">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                </ToolbarButton>
            </div>

            {/* Khung tìm kiếm & thay thế */}
            {showFind && (
                <div className="flex flex-col sm:flex-row gap-2 p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm..." 
                        value={findText}
                        onChange={e => setFindText(e.target.value)}
                        className="flex-grow p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    />
                    <input 
                        type="text" 
                        placeholder="Thay thế bằng..." 
                        value={replaceText}
                        onChange={e => setReplaceText(e.target.value)}
                        className="flex-grow p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    />
                    <button 
                        onClick={handleReplaceAll}
                        className="px-3 py-2 bg-orange-500 text-white font-semibold rounded hover:bg-orange-600 text-sm whitespace-nowrap"
                    >
                        Thay thế tất cả
                    </button>
                    <button 
                        onClick={() => setShowFind(false)} 
                        className="p-2 rounded hover:bg-slate-200 dark:bg-slate-700"
                    >
                       <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
        </>
    );

    return (
        <div ref={containerRef} className="border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
            {/* Toolbar thường */}
            <div 
                ref={toolbarRef}
                className={`bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 ${isToolbarFixed ? 'invisible' : ''}`}
            >
                {toolbarContent}
            </div>

            {/* Toolbar fixed khi scroll */}
            {isToolbarFixed && (
                <div 
                    className="fixed top-0 bg-slate-100 dark:bg-slate-900 shadow-md border border-slate-300 dark:border-slate-600 rounded-md"
                    style={{ 
                        zIndex: 9999,
                        left: `${toolbarPosition.left}px`,
                        width: `${toolbarPosition.width}px`
                    }}
                >
                    {toolbarContent}
                </div>
            )}

            {/* Vùng soạn thảo */}
            <div
                ref={editorRef}
                onInput={handleInput}
                contentEditable={true}
                spellCheck={false}
                suppressContentEditableWarning={true}
                className="max-w-none prose dark:prose-invert prose-p:my-2 prose-h2:my-4 prose-h3:my-3 prose-h4:my-2 prose-blockquote:my-2 p-4 min-h-[400px] focus:outline-none"
                style={{ marginTop: isToolbarFixed ? `${toolbarHeight}px` : '0' }}
            />
        </div>
    );
};

export default CustomEditor;
