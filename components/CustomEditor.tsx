import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon,
    Bars3BottomLeftIcon,
    Bars3Icon,
    Bars3BottomRightIcon,
    PhotoIcon,
    MagnifyingGlassIcon,
    EyeSlashIcon,
    XMarkIcon,
    StopIcon,
    EnvelopeIcon,
    CommandLineIcon,
    MinusIcon,
    StarIcon,
    SwatchIcon,
    EyeDropperIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { uploadImage } from '../services/uploadService';

// --- TYPE DEFINITIONS ---
interface EyeDropperInstance {
    open: (options?: { signal?: AbortSignal }) => Promise<{ sRGBHex: string }>;
}
declare global {
    interface Window {
        EyeDropper?: { new (): EyeDropperInstance };
    }
}
interface CustomEditorProps {
    value: string;
    onChange: (value: string) => void;
}

// --- HELPER: cleanHTML (Giữ nguyên logic) ---
const cleanHTML = (htmlContent: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const body = doc.body;
    const allowedTags = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'span', 'div', 'img', 'blockquote'];
    const allowedStyles = ['text-align', 'color', 'background-color', 'font-weight', 'font-style', 'text-decoration'];

    const cleanNode = (node: Node): Node | null => {
        if (node.nodeType === Node.TEXT_NODE) return node;
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();
            let newTagName = tagName;
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'article', 'section'].includes(tagName)) {
                newTagName = 'p';
            }
            if (!allowedTags.includes(newTagName) && newTagName !== 'p') {
                const fragment = document.createDocumentFragment();
                while (el.firstChild) {
                    const cleanedChild = cleanNode(el.firstChild);
                    if (cleanedChild) fragment.appendChild(cleanedChild);
                }
                return fragment;
            }
            const newEl = document.createElement(newTagName);
            if (el.style.length > 0) {
                allowedStyles.forEach(styleName => {
                    const val = el.style.getPropertyValue(styleName);
                    if (val) newEl.style.setProperty(styleName, val);
                });
            }
            if (tagName === 'img') {
                if (el.hasAttribute('src')) newEl.setAttribute('src', el.getAttribute('src') || '');
                if (el.hasAttribute('alt')) newEl.setAttribute('alt', el.getAttribute('alt') || '');
                newEl.style.maxWidth = '100%';
                newEl.style.height = 'auto';
                newEl.style.display = 'block';
                newEl.style.margin = '0 auto';
            }
            let hasContent = false;
            Array.from(el.childNodes).forEach(child => {
                const cleanedChild = cleanNode(child);
                if (cleanedChild) {
                    newEl.appendChild(cleanedChild);
                    if (cleanedChild.textContent?.trim() || ['img', 'br'].includes((cleanedChild as HTMLElement).tagName?.toLowerCase())) {
                        hasContent = true;
                    }
                }
            });
            if (!hasContent && !['img', 'br'].includes(newTagName)) {
                if (newTagName === 'p') {
                    newEl.innerHTML = '<br>';
                    return newEl;
                }
                return null; 
            }
            return newEl;
        }
        return null;
    };
    const resultFragment = document.createDocumentFragment();
    Array.from(body.childNodes).forEach(node => {
        const cleaned = cleanNode(node);
        if (cleaned) resultFragment.appendChild(cleaned);
    });
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(resultFragment);
    return tempDiv.innerHTML;
};

// --- COMPONENT CHÍNH ---
const CustomEditor: React.FC<CustomEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);

    const [showFind, setShowFind] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(() => localStorage.getItem('editorToolbarCollapsed') === 'true');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState('#000000');
    
    // State mới: Chế độ Upload HD
    const [isHighQuality, setIsHighQuality] = useState(false);

    const useEyeDropper = () => {
        const [supported, setSupported] = useState(false);
        useEffect(() => { if (window.EyeDropper) setSupported(true); }, []);
        const open = useCallback(async () => {
            if (!window.EyeDropper) return null;
            const eyeDropper = new window.EyeDropper();
            try { return (await eyeDropper.open()).sRGBHex; } catch (e) { return null; }
        }, []);
        return { supported, open };
    };
    const { supported: eyeDropperSupported, open: openEyeDropper } = useEyeDropper();

    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => { localStorage.setItem('editorToolbarCollapsed', isToolbarCollapsed.toString()); }, [isToolbarCollapsed]);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            const currentHtml = editorRef.current.innerHTML;
            if (value !== currentHtml) onChangeRef.current(currentHtml);
        }
    }, [value]);

    const execCmd = (command: string, commandValue?: string) => {
        document.execCommand(command, false, commandValue);
        editorRef.current?.focus();
        handleInput();
        if (command === 'foreColor' && commandValue) setCurrentColor(commandValue);
    };

    const removeBackgroundOnly = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const editor = editorRef.current;
        if (!editor) return;

        const cleanElementStyle = (el: HTMLElement) => {

            el.style.removeProperty('background-color');
            
            el.removeAttribute('bgcolor');
            
            if (!el.getAttribute('style')) {
                el.removeAttribute('style');
            }
        };

        let ancestor = range.commonAncestorContainer;
        if (ancestor.nodeType === Node.TEXT_NODE && ancestor.parentElement) {
            ancestor = ancestor.parentElement;
        }
        const containerEl = ancestor as HTMLElement;

        if (!editor.contains(containerEl)) return;

        cleanElementStyle(containerEl);

        const allElements = containerEl.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (selection.containsNode(el, true)) {
                cleanElementStyle(el);
            }
        }

        handleInput();
    };

    const processContentInsertion = (htmlData: string | null, textData: string | null) => {
        try {
            let finalHtml = '';
            if (htmlData) finalHtml = cleanHTML(htmlData);
            else if (textData) {
                const lines = textData.split(/[\r\n]+/);
                finalHtml = lines.map(line => line.trim() ? `<p>${line.trim()}</p>` : '').join('');
            }
            if (finalHtml) {
                const success = document.execCommand('insertHTML', false, finalHtml);
                if (!success && editorRef.current) editorRef.current.innerHTML += finalHtml;
                handleInput();
            }
        } catch (error) { console.error("Lỗi xử lý nội dung:", error); }
    };

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;
        const handlePaste = (event: ClipboardEvent) => {
            event.preventDefault();
            processContentInsertion(event.clipboardData?.getData('text/html') || null, event.clipboardData?.getData('text/plain') || null);
        };
        const handleDrop = (event: DragEvent) => {
            event.preventDefault(); event.stopPropagation();
            processContentInsertion(event.dataTransfer?.getData('text/html') || null, event.dataTransfer?.getData('text/plain') || null);
            editor.classList.remove('bg-sukem-bg', 'bg-sukem-card'); 
        };
        const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.dataTransfer!.dropEffect = 'copy'; };
        editor.addEventListener('paste', handlePaste);
        editor.addEventListener('drop', handleDrop);
        editor.addEventListener('dragover', handleDragOver);
        return () => {
            editor.removeEventListener('paste', handlePaste);
            editor.removeEventListener('drop', handleDrop);
            editor.removeEventListener('dragover', handleDragOver);
        };
    }, [handleInput]);

    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const placeholderId = `img-${Date.now()}`;
                const qualityText = isHighQuality ? " (HD)" : "";
                execCmd('insertHTML', `<div id="${placeholderId}">Đang tải ảnh${qualityText}...</div>`);
                try {
                    const uploadType = isHighQuality ? 'cover' : 'editor';
                    const imageUrl = await uploadImage(input.files[0], uploadType);
                    
                    const placeholder = editorRef.current?.querySelector(`#${placeholderId}`);
                    if (placeholder) {
                        const img = document.createElement('img');
                        img.src = imageUrl; img.style.maxWidth = '100%'; img.style.display = 'block'; img.style.margin = '1rem auto';
                        placeholder.parentNode?.replaceChild(img, placeholder);
                    }
                    handleInput();
                } catch (e) { 
                    console.error(e);
                    const placeholder = editorRef.current?.querySelector(`#${placeholderId}`);
                    if (placeholder) placeholder.remove();
                }
            }
        };
        input.click();
    };

    const insertFrame = (type: 'normal' | 'letter' | 'system') => {
        let style = '';
        const content = '<p><br></p>';
        switch (type) {
            case 'normal':style = `border: 2px solid #94a3b8; background-color: #f8fafc; padding: 16px; margin: 16px 0; color: #374151; font-style: normal; border-radius: 4px;`;break;
            case 'letter':style = `border: 4px double #d97706; background-color: #fffbeb; padding: 24px; margin: 16px 0; color: #451a03; font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif; font-style: italic; line-height: 1.8; box-shadow: 2px 2px 5px rgba(0,0,0,0.05);`;break;
            case 'system':style = `border: 2px solid #3b82f6; background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0; color: #1e3a8a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; position: relative; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);`;break;
        }
        execCmd('insertHTML', `<div style="${style}">${content}</div><p><br></p>`);
    };

    const insertSeparatorLine = () => execCmd('insertHTML', `<hr style="border: 0; border-top: 2px solid #64748b; margin: 24px 0;"><p><br></p>`);
    const insertSeparatorStars = () => execCmd('insertHTML', `<div style="text-align: center; margin: 24px 0; font-size: 1.2em; color: #475569;">&#9734;&nbsp;&nbsp;&#9734;&nbsp;&nbsp;&#9734;</div><p><br></p>`);
    
    const handleColorChange = (color: string) => { execCmd('foreColor', color); setCurrentColor(color); setShowColorPicker(false); };
    const handleEyeDropperClick = async () => { const color = await openEyeDropper(); if (color) handleColorChange(color); };

    const ToolbarButton: React.FC<{ children: React.ReactNode, onClick?: () => void, ariaLabel: string, isActive?: boolean, title?: string, className?: string }> = ({ children, onClick, ariaLabel, isActive, title, className }) => (
        <button type="button" onClick={onClick} onMouseDown={(e) => e.preventDefault()}
            className={`p-2 rounded hover:bg-sukem-bg transition-colors flex items-center justify-center ${isActive ? 'bg-sukem-bg text-sukem-primary font-bold shadow-sm border border-sukem-border' : 'text-sukem-text-muted'} ${className || ''}`}
            aria-label={ariaLabel} title={title || ariaLabel}>
            {children}
        </button>
    );

    const PRESET_COLORS = [
        '#000000', '#444444', '#888888', '#cccccc', '#ffffff', 
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
        '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef'
    ];

    return (
        <div ref={containerRef} className="border border-sukem-border rounded-lg overflow-visible bg-sukem-card shadow-sm relative">
            <div className="sticky top-0 z-[100] bg-sukem-card border-b border-sukem-border rounded-t-lg shadow-sm mb-0">
                <button type="button" onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
                    className="md:hidden w-full flex items-center justify-center gap-2 p-2 text-sukem-text-muted hover:bg-sukem-bg transition-colors"
                    aria-label={isToolbarCollapsed ? "Mở rộng" : "Thu gọn"}>
                    {isToolbarCollapsed ? <><ChevronDownIcon className="w-4 h-4" /><span className="text-xs font-medium">Hiện công cụ</span></> : <><ChevronUpIcon className="w-4 h-4" /><span className="text-xs font-medium">Ẩn công cụ</span></>}
                </button>

                <div className={`${isToolbarCollapsed ? 'hidden md:block' : 'block'} transition-all duration-200`}>
                    <div className="flex flex-wrap items-center gap-0.5 p-1">
                        <ToolbarButton onClick={() => execCmd('undo')} ariaLabel="Hoàn tác"><ArrowUturnLeftIcon className="w-5 h-5" /></ToolbarButton>
                        <ToolbarButton onClick={() => execCmd('redo')} ariaLabel="Làm lại"><ArrowUturnRightIcon className="w-5 h-5" /></ToolbarButton>
                        <div className="w-px h-5 bg-sukem-border mx-1"></div>
                        <ToolbarButton onClick={() => execCmd('bold')} ariaLabel="In đậm"><span className="font-bold w-5 h-5 flex items-center justify-center">B</span></ToolbarButton>
                        <ToolbarButton onClick={() => execCmd('italic')} ariaLabel="In nghiêng"><span className="italic w-5 h-5 flex items-center justify-center">I</span></ToolbarButton>
                        <ToolbarButton onClick={() => execCmd('underline')} ariaLabel="Gạch chân"><span className="underline w-5 h-5 flex items-center justify-center">U</span></ToolbarButton>
                        
                        <div className="relative">
                            <ToolbarButton onClick={() => setShowColorPicker(!showColorPicker)} ariaLabel="Màu chữ" isActive={showColorPicker}>
                                <div className="flex items-center gap-1"><SwatchIcon className="w-5 h-5" /><div className="w-3 h-3 rounded-full border border-sukem-border" style={{ backgroundColor: currentColor }}></div></div>
                            </ToolbarButton>
                            {showColorPicker && (
                                <div className="absolute top-full left-0 mt-2 p-3 bg-sukem-card border border-sukem-border rounded-lg shadow-xl min-w-[240px] z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-5 gap-2 mb-3">
                                        {PRESET_COLORS.map(c => (
                                            <button key={c} onClick={() => handleColorChange(c)} className="w-8 h-8 rounded-full border border-sukem-border hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-sukem-primary" style={{ backgroundColor: c }} title={c} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 border-t border-sukem-border">
                                        <div className="relative flex-grow">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-sukem-text-muted">#</span>
                                            <input type="text" value={currentColor.replace('#', '')} onChange={(e) => setCurrentColor(`#${e.target.value}`)} onBlur={() => handleColorChange(currentColor)}
                                                className="w-full pl-5 pr-2 py-1 text-sm border rounded bg-sukem-bg border-sukem-border focus:ring-1 focus:ring-sukem-primary outline-none text-sukem-text" placeholder="HEX" />
                                        </div>
                                        <label className="cursor-pointer p-1.5 rounded hover:bg-sukem-bg border border-sukem-border"><input type="color" value={currentColor} onChange={(e) => handleColorChange(e.target.value)} className="sr-only"/><div className="w-5 h-5 rounded" style={{background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'}}></div></label>
                                        {eyeDropperSupported && <button onClick={handleEyeDropperClick} className="p-1.5 rounded hover:bg-sukem-bg border border-sukem-border text-sukem-text-muted" title="Hút màu"><EyeDropperIcon className="w-5 h-5" /></button>}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="w-px h-5 bg-sukem-border mx-1"></div>
                        <ToolbarButton onClick={() => execCmd('justifyLeft')} ariaLabel="Căn trái"><Bars3BottomLeftIcon className="w-5 h-5" /></ToolbarButton>
                        <ToolbarButton onClick={() => execCmd('justifyCenter')} ariaLabel="Căn giữa"><Bars3Icon className="w-5 h-5" /></ToolbarButton>
                        <ToolbarButton onClick={() => execCmd('justifyRight')} ariaLabel="Căn phải"><Bars3BottomRightIcon className="w-5 h-5" /></ToolbarButton>
                        <div className="w-px h-5 bg-sukem-border mx-1"></div>
                        
                        {/* --- KHU VỰC UPLOAD ẢNH & HD TOGGLE --- */}
                        <div className="flex items-center bg-sukem-bg/50 border border-sukem-border rounded px-1 gap-0.5">
                            <ToolbarButton onClick={handleImageUpload} ariaLabel="Tải ảnh" title={isHighQuality ? "Tải ảnh (Chất lượng cao HD)" : "Tải ảnh (Tiết kiệm dung lượng)"}>
                                <PhotoIcon className="w-5 h-5" />
                            </ToolbarButton>
                            
                            <ToolbarButton 
                                onClick={() => setIsHighQuality(!isHighQuality)} 
                                ariaLabel="Chế độ HD" 
                                isActive={isHighQuality}
                                title={isHighQuality ? "Đang bật chế độ HD (1200px) - Tắt để tiết kiệm" : "Đang tắt chế độ HD (500x750) - Bật để ảnh nét hơn"}
                                className={`gap-0.5 ${isHighQuality ? "text-amber-500" : ""}`}
                            >
                                <SparklesIcon className="w-4 h-4" />
                                <span className="text-[10px] font-bold leading-none">{isHighQuality ? 'HD' : 'SD'}</span>
                            </ToolbarButton>
                        </div>
                        {/* --- HẾT KHU VỰC UPLOAD --- */}

                        <div className="flex items-center bg-sukem-bg/50 border border-sukem-border rounded px-1 gap-0.5 ml-1">
                            <ToolbarButton onClick={() => insertFrame('normal')} ariaLabel="Khung thường" title="Chèn khung thường"><StopIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton onClick={() => insertFrame('letter')} ariaLabel="Khung thư" title="Chèn khung thư"><EnvelopeIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton onClick={() => insertFrame('system')} ariaLabel="Khung hệ thống" title="Chèn khung hệ thống"><CommandLineIcon className="w-5 h-5" /></ToolbarButton>
                        </div>
                        <div className="flex items-center bg-sukem-bg/50 border border-sukem-border rounded px-1 gap-0.5 ml-1">
                            <ToolbarButton onClick={insertSeparatorLine} ariaLabel="Dòng kẻ" title="Chèn dòng phân cách"><MinusIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton onClick={insertSeparatorStars} ariaLabel="Sao phân cách" title="Chèn 3 ngôi sao"><StarIcon className="w-5 h-5" /></ToolbarButton>
                        </div>
                        <div className="w-px h-5 bg-sukem-border mx-1"></div>
                        
                        <ToolbarButton onClick={removeBackgroundOnly} ariaLabel="Xóa nền" title="Xóa màu nền"><EyeSlashIcon className="w-5 h-5" /></ToolbarButton>
                        
                        <ToolbarButton onClick={() => setShowFind(prev => !prev)} isActive={showFind} ariaLabel="Tìm kiếm" title="Tìm và thay thế"><MagnifyingGlassIcon className="w-5 h-5" /></ToolbarButton>
                    </div>

                    {showFind && (
                        <div className="flex flex-col sm:flex-row gap-2 p-2 border-t border-sukem-border bg-sukem-bg animate-in slide-in-from-top-2 duration-200">
                            <input type="text" placeholder="Tìm kiếm..." value={findText} onChange={e => setFindText(e.target.value)} className="flex-grow p-1.5 border rounded text-sm bg-sukem-card border-sukem-border focus:ring-1 focus:ring-sukem-primary text-sukem-text"/>
                            <input type="text" placeholder="Thay thế bằng..." value={replaceText} onChange={e => setReplaceText(e.target.value)} className="flex-grow p-1.5 border rounded text-sm bg-sukem-card border-sukem-border focus:ring-1 focus:ring-sukem-primary text-sukem-text"/>
                            <button onClick={() => {
                                if (!findText) return;
                                const content = editorRef.current?.innerHTML || '';
                                if (!content.includes(findText)) return alert('Không tìm thấy nội dung');
                                if (window.confirm('Thay thế tất cả?')) {
                                    editorRef.current!.innerHTML = content.replaceAll(findText, replaceText);
                                    handleInput();
                                }
                            }} className="px-3 py-1.5 bg-sukem-primary text-white text-sm rounded hover:opacity-90 disabled:opacity-50 font-medium" disabled={!findText}>Thay thế</button>
                            <ToolbarButton onClick={() => setShowFind(false)} ariaLabel="Đóng"><XMarkIcon className="w-5 h-5" /></ToolbarButton>
                        </div>
                    )}
                </div>
            </div>
            <div ref={editorRef} onInput={handleInput} contentEditable={true} spellCheck={false} suppressContentEditableWarning={true}
                className="prose dark:prose-invert max-w-none p-6 min-h-[500px] outline-none focus:ring-0 bg-sukem-bg text-sukem-text leading-relaxed rounded-b-lg" />
        </div>
    );
};

export default CustomEditor;