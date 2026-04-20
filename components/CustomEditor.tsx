import React, { useRef, useEffect, useCallback, useState } from 'react';
import { 
    TableCellsIcon, 
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
    SparklesIcon, 
    PaintBrushIcon, 
    ArrowsRightLeftIcon,
    CheckIcon // Bổ sung icon Check
} from '@heroicons/react/24/outline';
import { uploadImage } from '../services/uploadService';
import FormatSyncModal from './FormatSyncModal'; 

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
    readOnly?: boolean; 
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void; 
}

// --- HELPER: cleanHTML ---
const cleanHTML = (htmlContent: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const body = doc.body;
    
    const allowedTags = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'span', 'div', 'img', 'blockquote', 'h4', 'table', 'tbody', 'tr', 'td', 'th', 'hr'];
    const allowedStyles = ['text-align', 'color', 'background-color', 'font-weight', 'font-style', 'text-decoration'];
    
    const specialClasses = ['kabox', 'box_c', 'ka_lb', 'box_1', 'box_txt', 'container_box', 'top_table', 'box01', 'board', 'board01', 'box_title', 'box_gl', 'dashed'];

    const customStylesMap: Record<string, string> = {
        'board':     'border: 1px solid #6aaddb; background-color: #eaf5fc; margin: 8px 0; overflow: hidden;',
        'board01':   'padding: 6px 12px 10px 12px; background-color: #eaf5fc;',
        'box_title': 'font-weight: bold; word-break: keep-all; background-color: #4a90c4; color: #ffffff; padding: 5px 12px; margin: 0;',
        'box_gl':    'margin: 3px 0; padding: 0;',
        'dashed':    'border: 0; border-top: 1px dashed #a0c8e0; margin: 5px 0;',
    };

    const cleanNode = (node: Node): Node | null => {
        if (node.nodeType === Node.TEXT_NODE) return node;
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();
            let newTagName = tagName;
            
            const elClasses = Array.from(el.classList);
            const hasSpecialClass = elClasses.some(cls => specialClasses.includes(cls));

            if (!hasSpecialClass && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'article', 'section'].includes(tagName)) {
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
            
            if (hasSpecialClass) {
                const validClasses = elClasses.filter(cls => specialClasses.includes(cls));
                if (validClasses.length > 0) {
                    newEl.setAttribute('class', validClasses.join(' '));
                    
                    const injectedStyles = validClasses
                        .map(cls => customStylesMap[cls])
                        .filter(Boolean)
                        .join(' ');
                        
                    if (injectedStyles) {
                        newEl.setAttribute('style', injectedStyles);
                    }
                }
            } else if (el.style.length > 0) {
                allowedStyles.forEach(styleName => {
                    let val = el.style.getPropertyValue(styleName);
                    // Block căn lề justify khi dán nội dung
                    if (styleName === 'text-align' && val === 'justify') {
                        val = ''; 
                    }
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

            if (!hasContent && !['img', 'br', 'td', 'th'].includes(newTagName)) {
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
const CustomEditor: React.FC<CustomEditorProps> = ({ value, onChange, readOnly = false, onScroll }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);

    const [showFind, setShowFind] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(() => localStorage.getItem('editorToolbarCollapsed') === 'true');
    
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState('#000000');

    const [showBgColorPicker, setShowBgColorPicker] = useState(false);
    const [currentBgColor, setCurrentBgColor] = useState('#ffff00');
    
    const [isHighQuality, setIsHighQuality] = useState(false);

    const [showTableOptions, setShowTableOptions] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);

    const [copiedFormat, setCopiedFormat] = useState<{style: string, classNames: string, isBold: boolean, isItalic: boolean, isUnderline: boolean, isStrikethrough: boolean} | null>(null);

    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [syncInitialHtml, setSyncInitialHtml] = useState('');

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
        if (editorRef.current && !readOnly) {
            const currentHtml = editorRef.current.innerHTML;
            if (value !== currentHtml) onChangeRef.current(currentHtml);
        }
    }, [value, readOnly]);

    const execCmd = (command: string, commandValue?: string) => {
        if (readOnly) return;
        document.execCommand(command, false, commandValue);
        editorRef.current?.focus();
        handleInput();
        
        // Khi gọi lệnh đổi màu, phải set lại state để ô input hiển thị đúng mã màu
        if (command === 'foreColor' && commandValue) setCurrentColor(commandValue);
        if (command === 'backColor' && commandValue) setCurrentBgColor(commandValue);
    };

    const handleFormatPainter = () => {
        if (copiedFormat) {
            if (readOnly) {
                alert("Không thể dán định dạng vào bản Raw (Chỉ đọc).");
                return;
            }
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
                setCopiedFormat(null); 
                return;
            }

            const range = selection.getRangeAt(0);
            
            const span = document.createElement('span');
            if (copiedFormat.style) span.setAttribute('style', copiedFormat.style);
            if (copiedFormat.classNames) span.setAttribute('class', copiedFormat.classNames);
            
            span.appendChild(range.cloneContents());

            let wrapper: HTMLElement = span;
            if (copiedFormat.isBold) { const b = document.createElement('b'); b.appendChild(wrapper); wrapper = b; }
            if (copiedFormat.isItalic) { const i = document.createElement('i'); i.appendChild(wrapper); wrapper = i; }
            if (copiedFormat.isUnderline) { const u = document.createElement('u'); u.appendChild(wrapper); wrapper = u; }
            if (copiedFormat.isStrikethrough) { const s = document.createElement('s'); s.appendChild(wrapper); wrapper = s; }

            document.execCommand('insertHTML', false, wrapper.outerHTML);
            setCopiedFormat(null);
        } else {
            const selection = window.getSelection();
            if (!selection) return;
            let node = selection.anchorNode;
            if (!node) return;
            
            let el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node) as HTMLElement;
            
            let styleStr = '';
            let classNames = el.className || '';
            let isBold = false, isItalic = false, isUnderline = false, isStrikethrough = false;

            let current: HTMLElement | null = el;
            while (current && current.id !== editorRef.current?.id && current !== document.body) {
                const tag = current.tagName.toLowerCase();
                if (tag === 'b' || tag === 'strong' || current.style.fontWeight === 'bold' || parseInt(current.style.fontWeight) >= 700) isBold = true;
                if (tag === 'i' || tag === 'em' || current.style.fontStyle === 'italic') isItalic = true;
                if (tag === 'u' || current.style.textDecoration.includes('underline')) isUnderline = true;
                if (tag === 's' || tag === 'strike' || tag === 'del' || current.style.textDecoration.includes('line-through')) isStrikethrough = true;
                
                if (current.style.color && !styleStr.includes('color')) styleStr += `color: ${current.style.color}; `;
                if (current.style.backgroundColor && current.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && current.style.backgroundColor !== 'transparent' && !styleStr.includes('background-color')) {
                    styleStr += `background-color: ${current.style.backgroundColor}; `;
                }
                if (current.style.textAlign && current.style.textAlign !== 'justify' && !styleStr.includes('text-align')) {
                    styleStr += `text-align: ${current.style.textAlign}; `;
                }

                current = current.parentElement;
            }

            setCopiedFormat({ style: styleStr, classNames, isBold, isItalic, isUnderline, isStrikethrough });
        }
    };

    const modifySelectionAndPreserveUndo = (styleRemover: (el: HTMLElement) => void) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        let targetRange = selection.getRangeAt(0);

        if (selection.isCollapsed) {
            let block = targetRange.commonAncestorContainer as HTMLElement;
            if (block.nodeType === Node.TEXT_NODE) block = block.parentElement as HTMLElement;
            
            while (block && block !== editorRef.current && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH', 'LI'].includes(block.tagName.toUpperCase())) {
                block = block.parentElement as HTMLElement;
            }
            
            if (block && block !== editorRef.current) {
                targetRange = document.createRange();
                targetRange.selectNode(block);
                selection.removeAllRanges();
                selection.addRange(targetRange);
            } else {
                return;
            }
        }

        const div = document.createElement('div');
        div.appendChild(targetRange.cloneContents());

        const allElements = div.querySelectorAll('*');
        allElements.forEach(el => styleRemover(el as HTMLElement));

        document.execCommand('insertHTML', false, div.innerHTML);
    };

    const removeJustifyOnly = () => {
        modifySelectionAndPreserveUndo((el: HTMLElement) => {
            if (el.style.textAlign === 'justify') {
                el.style.removeProperty('text-align');
                if (!el.getAttribute('style')) el.removeAttribute('style');
            }
            if (el.getAttribute('align') === 'justify') {
                el.removeAttribute('align');
            }
        });
    };

    const removeSpecificColor = () => {
        modifySelectionAndPreserveUndo((el: HTMLElement) => {
            if (el.style.color) {
                const normalizedColor = el.style.color.replace(/\s/g, '');
                if (normalizedColor === 'rgb(78,55,38)' || normalizedColor === '#4e3726') {
                    el.style.removeProperty('color');
                    if (el.tagName.toLowerCase() === 'font') el.removeAttribute('color');
                    if (!el.getAttribute('style')) el.removeAttribute('style');
                }
            }
        });
    };

    const removeTextColorOnly = () => {
        modifySelectionAndPreserveUndo((el: HTMLElement) => {
            el.style.removeProperty('color');
            if (el.tagName.toLowerCase() === 'font') el.removeAttribute('color');
            if (!el.getAttribute('style')) el.removeAttribute('style');
        });
    };

    const removeBackgroundOnly = () => {
        modifySelectionAndPreserveUndo((el: HTMLElement) => {
            el.style.removeProperty('background-color');
            el.removeAttribute('bgcolor');
            if (!el.getAttribute('style')) el.removeAttribute('style');
        });
    };

    const processContentInsertion = (htmlData: string | null, textData: string | null) => {
        try {
            let finalHtml = '';
            if (htmlData) {
                finalHtml = cleanHTML(htmlData);
            } else if (textData) {
                const cleanText = textData.replace(/\\/g, ''); 
                const lines = cleanText.split(/[\r\n]+/);
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
        if (!editor|| readOnly) return;
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
    }, [handleInput, readOnly]);

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
    
    // Các hàm đổi màu gốc
    const handleColorChange = (color: string) => { execCmd('foreColor', color); setShowColorPicker(false); };
    const handleBgColorChange = (color: string) => { execCmd('backColor', color); setShowBgColorPicker(false); };
    
    const handleEyeDropperClick = async (type: 'text' | 'bg') => { 
        const color = await openEyeDropper(); 
        if (color) {
            if (type === 'text') handleColorChange(color);
            else handleBgColorChange(color);
        }
    };

    const handleApplySync = (finalHtml: string) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand('selectAll', false);
            document.execCommand('insertHTML', false, finalHtml);
            handleInput();
        }
        setIsSyncModalOpen(false);
    };

    const ToolbarButton: React.FC<{ children: React.ReactNode, onClick?: () => void, ariaLabel: string, isActive?: boolean, title?: string, className?: string, disabled?: boolean }> = ({ children, onClick, ariaLabel, isActive, title, className, disabled }) => (
        <button type="button" onClick={onClick} onMouseDown={(e) => e.preventDefault()} disabled={disabled}
            className={`p-2 rounded hover:bg-sukem-bg transition-colors flex items-center justify-center ${isActive ? 'bg-sukem-bg text-sukem-primary font-bold shadow-sm border border-sukem-border' : 'text-sukem-text-muted'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
            aria-label={ariaLabel} title={title || ariaLabel}>
            {children}
        </button>
    );

    const PRESET_COLORS = [
        '#000000', '#444444', '#888888', '#cccccc', '#ffffff', 
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
        '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef',
        '#fef08a', '#fecaca', '#bfdbfe', '#bbf7d0', '#e9d5ff'
    ];

    return (
        <div ref={containerRef} className={`border border-sukem-border rounded-lg overflow-visible bg-sukem-card shadow-sm relative ${readOnly ? 'opacity-90' : ''}`}>
            {/* Thanh Toolbar */}
            <div className="sticky top-0 z-[50] bg-sukem-card border-b border-sukem-border rounded-t-lg shadow-sm mb-0">
                <button type="button" onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
                    className="md:hidden w-full flex items-center justify-center gap-2 p-2 text-sukem-text-muted hover:bg-sukem-bg transition-colors"
                    aria-label={isToolbarCollapsed ? "Mở rộng" : "Thu gọn"}>
                    {isToolbarCollapsed ? <><ChevronDownIcon className="w-4 h-4" /><span className="text-xs font-medium">Hiện công cụ</span></> : <><ChevronUpIcon className="w-4 h-4" /><span className="text-xs font-medium">Ẩn công cụ</span></>}
                </button>

                <div className={`${isToolbarCollapsed ? 'hidden md:block' : 'block'} transition-all duration-200`}>
                    <div className="flex flex-wrap items-center gap-0.5 p-1">
                        
                        <ToolbarButton 
                            onClick={handleFormatPainter} 
                            ariaLabel="Sao chép định dạng" 
                            isActive={!!copiedFormat}
                            title={copiedFormat ? "Đã lấy định dạng. Bôi đen text và click lại để dán" : "Click vào chữ có màu/in nghiêng -> Bấm nút này để copy định dạng"}
                            className={copiedFormat ? "bg-amber-100 border-amber-300 text-amber-600 animate-pulse" : ""}
                        >
                            <PaintBrushIcon className="w-5 h-5" />
                        </ToolbarButton>

                        <div className="w-px h-5 bg-sukem-border mx-1"></div>

                        <ToolbarButton disabled={readOnly} onClick={() => execCmd('undo')} ariaLabel="Hoàn tác"><ArrowUturnLeftIcon className="w-5 h-5" /></ToolbarButton>
                        <ToolbarButton disabled={readOnly} onClick={() => execCmd('redo')} ariaLabel="Làm lại"><ArrowUturnRightIcon className="w-5 h-5" /></ToolbarButton>
                        <div className="w-px h-5 bg-sukem-border mx-1"></div>
                        
                        <ToolbarButton disabled={readOnly} onClick={() => execCmd('bold')} ariaLabel="In đậm"><span className="font-bold w-5 h-5 flex items-center justify-center">B</span></ToolbarButton>
                        <ToolbarButton disabled={readOnly} onClick={() => execCmd('italic')} ariaLabel="In nghiêng"><span className="italic w-5 h-5 flex items-center justify-center">I</span></ToolbarButton>
                        <ToolbarButton disabled={readOnly} onClick={() => execCmd('underline')} ariaLabel="Gạch chân"><span className="underline w-5 h-5 flex items-center justify-center">U</span></ToolbarButton>
                        <ToolbarButton disabled={readOnly} onClick={() => execCmd('strikeThrough')} ariaLabel="Gạch ngang"><span className="line-through w-5 h-5 flex items-center justify-center">S</span></ToolbarButton>
                        
                        {/* 1. MÀU CHỮ */}
                        <div className="relative">
                            <ToolbarButton disabled={readOnly} onClick={() => { setShowColorPicker(!showColorPicker); setShowBgColorPicker(false); }} ariaLabel="Màu chữ" isActive={showColorPicker}>
                                <div className="flex items-center gap-1">
                                    <SwatchIcon className="w-5 h-5 text-gray-500" />
                                    <div className="w-3 h-3 rounded-full border border-sukem-border" style={{ backgroundColor: currentColor }}></div>
                                </div>
                            </ToolbarButton>
                            {showColorPicker && !readOnly && (
                                <div className="absolute top-full left-0 mt-2 p-3 bg-sukem-card border border-sukem-border rounded-lg shadow-xl min-w-[250px] z-[100] animate-in fade-in zoom-in-95 duration-200">
                                    <div className="text-xs font-semibold mb-2 text-sukem-text">Màu chữ</div>
                                    {/* MÀU GỢI Ý (PRESETS) */}
                                    <div className="grid grid-cols-5 gap-2 mb-3">
                                        {PRESET_COLORS.map(c => (
                                            <button key={c} onClick={() => handleColorChange(c)} className="w-8 h-8 rounded-full border border-sukem-border hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-sukem-primary" style={{ backgroundColor: c }} title={c} />
                                        ))}
                                    </div>
                                    {/* MÀU TÙY CHỈNH (CUSTOM) */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-sukem-border">
                                        <div className="relative flex-grow">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-sukem-text-muted font-mono">#</span>
                                            <input 
                                                type="text" 
                                                value={currentColor.replace('#', '')} 
                                                onChange={(e) => setCurrentColor(`#${e.target.value}`)} 
                                                onBlur={() => handleColorChange(currentColor)}
                                                onKeyDown={(e) => { 
                                                    if (e.key === 'Enter') { 
                                                        e.preventDefault(); 
                                                        handleColorChange(currentColor); 
                                                    } 
                                                }}
                                                className="w-full pl-5 pr-7 py-1 text-sm border rounded bg-sukem-bg border-sukem-border focus:ring-1 focus:ring-sukem-primary outline-none text-sukem-text font-mono" 
                                                placeholder="HEX" 
                                                maxLength={6}
                                            />
                                            <button 
                                                onClick={() => handleColorChange(currentColor)}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-sukem-primary hover:bg-sukem-primary/10 rounded"
                                                title="Áp dụng màu này (Enter)"
                                            >
                                                <CheckIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <label className="cursor-pointer p-1.5 rounded hover:bg-sukem-bg border border-sukem-border" title="Bảng chọn màu tùy ý">
                                            <input type="color" value={currentColor} onChange={(e) => handleColorChange(e.target.value)} className="sr-only"/>
                                            <div className="w-5 h-5 rounded" style={{background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'}}></div>
                                        </label>
                                        {eyeDropperSupported && (
                                            <button onClick={() => handleEyeDropperClick('text')} className="p-1.5 rounded hover:bg-sukem-bg border border-sukem-border text-sukem-text-muted" title="Hút màu trên màn hình">
                                                <EyeDropperIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. MÀU NỀN */}
                        <div className="relative">
                            <ToolbarButton disabled={readOnly} onClick={() => { setShowBgColorPicker(!showBgColorPicker); setShowColorPicker(false); }} ariaLabel="Màu nền" isActive={showBgColorPicker}>
                                <div className="flex items-center gap-1">
                                    <div className="w-5 h-5 rounded flex items-center justify-center border border-sukem-border" style={{ backgroundColor: currentBgColor }}>
                                        <span className="text-[10px] font-bold text-gray-800 mix-blend-difference">A</span>
                                    </div>
                                </div>
                            </ToolbarButton>
                            {showBgColorPicker && !readOnly && (
                                <div className="absolute top-full left-0 mt-2 p-3 bg-sukem-card border border-sukem-border rounded-lg shadow-xl min-w-[250px] z-[100] animate-in fade-in zoom-in-95 duration-200">
                                    <div className="text-xs font-semibold mb-2 text-sukem-text">Màu nền</div>
                                    {/* MÀU GỢI Ý (PRESETS) */}
                                    <div className="grid grid-cols-5 gap-2 mb-3">
                                        {PRESET_COLORS.map(c => (
                                            <button key={c} onClick={() => handleBgColorChange(c)} className="w-8 h-8 rounded-full border border-sukem-border hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-sukem-primary" style={{ backgroundColor: c }} title={c} />
                                        ))}
                                    </div>
                                    {/* MÀU TÙY CHỈNH (CUSTOM) */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-sukem-border">
                                        <div className="relative flex-grow">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-sukem-text-muted font-mono">#</span>
                                            <input 
                                                type="text" 
                                                value={currentBgColor.replace('#', '')} 
                                                onChange={(e) => setCurrentBgColor(`#${e.target.value}`)} 
                                                onBlur={() => handleBgColorChange(currentBgColor)}
                                                onKeyDown={(e) => { 
                                                    if (e.key === 'Enter') { 
                                                        e.preventDefault(); 
                                                        handleBgColorChange(currentBgColor); 
                                                    } 
                                                }}
                                                className="w-full pl-5 pr-7 py-1 text-sm border rounded bg-sukem-bg border-sukem-border focus:ring-1 focus:ring-sukem-primary outline-none text-sukem-text font-mono" 
                                                placeholder="HEX" 
                                                maxLength={6}
                                            />
                                            <button 
                                                onClick={() => handleBgColorChange(currentBgColor)}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-sukem-primary hover:bg-sukem-primary/10 rounded"
                                                title="Áp dụng màu này (Enter)"
                                            >
                                                <CheckIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <label className="cursor-pointer p-1.5 rounded hover:bg-sukem-bg border border-sukem-border" title="Bảng chọn màu tùy ý">
                                            <input type="color" value={currentBgColor} onChange={(e) => handleBgColorChange(e.target.value)} className="sr-only"/>
                                            <div className="w-5 h-5 rounded" style={{background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'}}></div>
                                        </label>
                                        {eyeDropperSupported && (
                                            <button onClick={() => handleEyeDropperClick('bg')} className="p-1.5 rounded hover:bg-sukem-bg border border-sukem-border text-sukem-text-muted" title="Hút màu nền trên màn hình">
                                                <EyeDropperIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-px h-5 bg-sukem-border mx-1"></div>
                        
                        <ToolbarButton disabled={readOnly} onClick={() => execCmd('justifyLeft')} ariaLabel="Căn trái" title="Căn lề trái"><Bars3BottomLeftIcon className="w-5 h-5" /></ToolbarButton>
                        <ToolbarButton disabled={readOnly} onClick={() => execCmd('justifyCenter')} ariaLabel="Căn giữa" title="Căn lề giữa"><Bars3Icon className="w-5 h-5" /></ToolbarButton>
                        <ToolbarButton disabled={readOnly} onClick={() => execCmd('justifyRight')} ariaLabel="Căn phải" title="Căn lề phải"><Bars3BottomRightIcon className="w-5 h-5" /></ToolbarButton>
                        
                        <ToolbarButton disabled={readOnly} onClick={removeJustifyOnly} ariaLabel="Xóa Justify" title="Xóa căn lề Justify (đưa về mặc định)">
                            <div className="relative w-5 h-5 flex items-center justify-center">
                                <Bars3Icon className="w-5 h-5 text-gray-500" />
                                <span className="absolute w-[18px] h-[2px] bg-red-500 -rotate-45"></span>
                            </div>
                        </ToolbarButton>
                        
                        <div className="w-px h-5 bg-sukem-border mx-1"></div>
                        
                        <div className="flex items-center bg-sukem-bg/50 border border-sukem-border rounded px-1 gap-0.5">
                            <ToolbarButton disabled={readOnly} onClick={handleImageUpload} ariaLabel="Tải ảnh" title={isHighQuality ? "Tải ảnh (Chất lượng cao HD)" : "Tải ảnh (Tiết kiệm dung lượng)"}>
                                <PhotoIcon className="w-5 h-5" />
                            </ToolbarButton>
                            
                            <ToolbarButton disabled={readOnly} 
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

                        <div className="flex items-center bg-sukem-bg/50 border border-sukem-border rounded px-1 gap-0.5 ml-1">
                            <ToolbarButton disabled={readOnly} onClick={() => setShowTableOptions(prev => !prev)} isActive={showTableOptions} ariaLabel="Bảng" title="Chèn bảng"><TableCellsIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton disabled={readOnly} onClick={() => insertFrame('normal')} ariaLabel="Khung thường" title="Chèn khung thường"><StopIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton disabled={readOnly} onClick={() => insertFrame('letter')} ariaLabel="Khung thư" title="Chèn khung thư"><EnvelopeIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton disabled={readOnly} onClick={() => insertFrame('system')} ariaLabel="Khung hệ thống" title="Chèn khung hệ thống"><CommandLineIcon className="w-5 h-5" /></ToolbarButton>
                        </div>
                        <div className="flex items-center bg-sukem-bg/50 border border-sukem-border rounded px-1 gap-0.5 ml-1">
                            <ToolbarButton disabled={readOnly} onClick={insertSeparatorLine} ariaLabel="Dòng kẻ" title="Chèn dòng phân cách"><MinusIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton disabled={readOnly} onClick={insertSeparatorStars} ariaLabel="Sao phân cách" title="Chèn 3 ngôi sao"><StarIcon className="w-5 h-5" /></ToolbarButton>
                        </div>
                        <div className="w-px h-5 bg-sukem-border mx-1"></div>
                        
                        <div className="flex items-center bg-sukem-bg/50 border border-sukem-border rounded px-1 gap-0.5 ml-1">
                            <ToolbarButton disabled={readOnly} onClick={removeBackgroundOnly} ariaLabel="Xóa nền" title="Xóa màu nền"><EyeSlashIcon className="w-5 h-5" /></ToolbarButton>
                            
                            <ToolbarButton disabled={readOnly} onClick={removeSpecificColor} ariaLabel="Xóa màu Nâu đặc thù" title="Chỉ xóa màu chữ rgb(78, 55, 38)">
                                <div className="relative w-5 h-5 flex items-center justify-center">
                                    <span className="font-bold text-sm text-[#4e3726]">A</span>
                                    <span className="absolute w-[18px] h-[2px] bg-red-500 -rotate-45"></span>
                                </div>
                            </ToolbarButton>

                            <ToolbarButton disabled={readOnly} onClick={removeTextColorOnly} ariaLabel="Xóa TẤT CẢ màu chữ" title="Xóa toàn bộ màu chữ">
                                <div className="relative w-5 h-5 flex items-center justify-center">
                                    <span className="font-bold text-sm">A</span>
                                    <span className="absolute w-[18px] h-[2px] bg-red-500 -rotate-45"></span>
                                </div>
                            </ToolbarButton>
                        </div>
                        
                        <div className="w-px h-5 bg-sukem-border mx-1"></div>

                        <ToolbarButton 
                            disabled={readOnly}
                            onClick={() => {
                                if (!readOnly) {
                                    setSyncInitialHtml(editorRef.current?.innerHTML || '');
                                    setIsSyncModalOpen(true);
                                }
                            }}
                            ariaLabel="Đồng bộ định dạng" 
                            title="Khớp văn bản với định dạng gốc"
                            className="text-sukem-primary font-semibold ml-auto border-sukem-border border"
                        >
                            <div className="flex items-center gap-1">
                                <ArrowsRightLeftIcon className="w-5 h-5" />
                                <span className="hidden sm:inline text-xs">Ghép dịch</span>
                            </div>
                        </ToolbarButton>
                        
                        <ToolbarButton disabled={readOnly} onClick={() => setShowFind(prev => !prev)} isActive={showFind} ariaLabel="Tìm kiếm" title="Tìm và thay thế"><MagnifyingGlassIcon className="w-5 h-5" /></ToolbarButton>
                    </div>

                    {showFind && !readOnly && (
                        <div className="flex flex-col sm:flex-row gap-2 p-2 border-t border-sukem-border bg-sukem-bg animate-in slide-in-from-top-2 duration-200">
                            <input type="text" placeholder="Tìm kiếm..." value={findText} onChange={e => setFindText(e.target.value)} className="flex-grow p-1.5 border rounded text-sm bg-sukem-card border-sukem-border focus:ring-1 focus:ring-sukem-primary text-sukem-text"/>
                            <input type="text" placeholder="Thay thế bằng..." value={replaceText} onChange={e => setReplaceText(e.target.value)} className="flex-grow p-1.5 border rounded text-sm bg-sukem-card border-sukem-border focus:ring-1 focus:ring-sukem-primary text-sukem-text"/>
                            <button onClick={() => {
                                if (!findText) return;
                                const content = editorRef.current?.innerHTML || '';
                                if (!content.includes(findText)) return alert('Không tìm thấy nội dung');
                                if (window.confirm('Thay thế tất cả?')) {
                                    editorRef.current!.focus();
                                    document.execCommand('selectAll', false);
                                    const replacedHtml = content.replaceAll(findText, replaceText);
                                    document.execCommand('insertHTML', false, replacedHtml);
                                    handleInput();
                                }
                            }} className="px-3 py-1.5 bg-sukem-primary text-white text-sm rounded hover:opacity-90 disabled:opacity-50 font-medium" disabled={!findText}>Thay thế</button>
                            <ToolbarButton onClick={() => setShowFind(false)} ariaLabel="Đóng"><XMarkIcon className="w-5 h-5" /></ToolbarButton>
                        </div>
                    )}

                    {showTableOptions && !readOnly && (
                        <div className="flex flex-col sm:flex-row gap-2 p-2 border-t border-sukem-border bg-sukem-bg animate-in slide-in-from-top-2 duration-200 items-center">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-sukem-text">Số hàng:</label>
                                <input type="number" min="1" value={tableRows} onChange={e => setTableRows(parseInt(e.target.value) || 1)} className="w-16 p-1.5 border rounded text-sm bg-sukem-card border-sukem-border focus:ring-1 focus:ring-sukem-primary text-sukem-text"/>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-sukem-text">Số cột:</label>
                                <input type="number" min="1" value={tableCols} onChange={e => setTableCols(parseInt(e.target.value) || 1)} className="w-16 p-1.5 border rounded text-sm bg-sukem-card border-sukem-border focus:ring-1 focus:ring-sukem-primary text-sukem-text"/>
                            </div>
                            <button onClick={() => {
                                let tableHtml = '<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin: 16px 0;"><tbody>';
                                for (let i = 0; i < tableRows; i++) {
                                    tableHtml += '<tr>';
                                    for (let j = 0; j < tableCols; j++) {
                                        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px;">${i === 0 && j === 0 ? '<br>' : '<br>'}</td>`;
                                    }
                                    tableHtml += '</tr>';
                                }
                                tableHtml += '</tbody></table><p><br></p>';
                                execCmd('insertHTML', tableHtml);
                                setShowTableOptions(false);
                            }} className="px-3 py-1.5 bg-sukem-primary text-white text-sm rounded hover:opacity-90 font-medium">Chèn bảng</button>
                            <div className="flex-grow"></div>
                            <ToolbarButton onClick={() => setShowTableOptions(false)} ariaLabel="Đóng"><XMarkIcon className="w-5 h-5" /></ToolbarButton>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Vùng gõ nội dung */}
            <div 
                ref={editorRef} 
                onInput={handleInput} 
                onScroll={onScroll}
                contentEditable={!readOnly} 
                spellCheck={false} 
                suppressContentEditableWarning={true}
                className={`prose dark:prose-invert max-w-none p-6 h-[700px] overflow-y-auto outline-none focus:ring-0 bg-sukem-bg text-sukem-text leading-relaxed rounded-b-lg ${readOnly ? 'bg-gray-50/50 cursor-text' : ''}`} 
            />

            <FormatSyncModal 
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                initialHtml={syncInitialHtml}
                onApply={handleApplySync}
            />
        </div>
    );
};

export default CustomEditor;