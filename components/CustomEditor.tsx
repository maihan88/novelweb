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
    EyeDropperIcon
} from '@heroicons/react/24/outline';

import { uploadImage } from '../services/uploadService';

// --- TYPE DEFINITIONS FOR EYEDROPPER API ---
interface EyeDropperInstance {
    open: (options?: { signal?: AbortSignal }) => Promise<{ sRGBHex: string }>;
}

declare global {
    interface Window {
        EyeDropper?: {
            new (): EyeDropperInstance;
        };
    }
}

interface CustomEditorProps {
    value: string;
    onChange: (value: string) => void;
}

// --- HÀM HELPER: LÀM SẠCH HTML (CORE LOGIC) ---
const cleanHTML = (htmlContent: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const body = doc.body;

    // Danh sách các tag được phép giữ lại
    const allowedTags = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'span', 'div', 'img', 'blockquote'];
    // Danh sách style được phép giữ lại
    const allowedStyles = ['text-align', 'color', 'background-color', 'font-weight', 'font-style', 'text-decoration'];

    const cleanNode = (node: Node): Node | null => {
        // 1. Nếu là Text node, giữ nguyên
        if (node.nodeType === Node.TEXT_NODE) {
            return node;
        }

        // 2. Nếu là Element node
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();

            // Xử lý đặc biệt: Chuyển đổi các thẻ heading (h1-h6) hoặc div thành p để đồng bộ
            let newTagName = tagName;
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'article', 'section'].includes(tagName)) {
                newTagName = 'p';
            }

            // Nếu tag không nằm trong danh sách cho phép, chỉ lấy nội dung con (unwrap)
            if (!allowedTags.includes(newTagName) && newTagName !== 'p') {
                const fragment = document.createDocumentFragment();
                while (el.firstChild) {
                    const cleanedChild = cleanNode(el.firstChild);
                    if (cleanedChild) fragment.appendChild(cleanedChild);
                }
                return fragment;
            }

            // Tạo element mới sạch sẽ
            const newEl = document.createElement(newTagName);

            // Copy các style quan trọng
            if (el.style.length > 0) {
                allowedStyles.forEach(styleName => {
                    const val = el.style.getPropertyValue(styleName);
                    if (val) newEl.style.setProperty(styleName, val);
                });
            }

            // Giữ lại href cho thẻ a (nếu sau này cần), src cho img
            if (tagName === 'img') {
                if (el.hasAttribute('src')) newEl.setAttribute('src', el.getAttribute('src') || '');
                if (el.hasAttribute('alt')) newEl.setAttribute('alt', el.getAttribute('alt') || '');
                // Force style ảnh cho đẹp
                newEl.style.maxWidth = '100%';
                newEl.style.height = 'auto';
                newEl.style.display = 'block';
                newEl.style.margin = '0 auto';
            }

            // Đệ quy xử lý node con
            let hasContent = false;
            Array.from(el.childNodes).forEach(child => {
                const cleanedChild = cleanNode(child);
                if (cleanedChild) {
                    newEl.appendChild(cleanedChild);
                    // Kiểm tra xem node con có nội dung thực không (tránh thẻ rỗng vô nghĩa, trừ br/img)
                    if (cleanedChild.textContent?.trim() || ['img', 'br'].includes((cleanedChild as HTMLElement).tagName?.toLowerCase())) {
                        hasContent = true;
                    }
                }
            });

            // Nếu thẻ rỗng (không phải img/br) và không có style padding/margin đặc biệt -> bỏ qua hoặc trả về br
            // Tuy nhiên, để giữ dòng trống như bạn muốn, ta kiểm tra kỹ hơn
            if (!hasContent && !['img', 'br'].includes(newTagName)) {
                // Nếu là thẻ P rỗng, trả về <p><br></p> để giữ dòng
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

    // Chuyển về string
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(resultFragment);
    return tempDiv.innerHTML;
};


// --- COMPONENT CHÍNH ---
const CustomEditor: React.FC<CustomEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);

    // --- STATE ---
    const [showFind, setShowFind] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    
    // Color Picker State
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState('#000000');

    const useEyeDropper = () => {
        const [supported, setSupported] = useState(false);
        useEffect(() => {
            if (window.EyeDropper) setSupported(true);
        }, []);

        const open = useCallback(async () => {
            if (!window.EyeDropper) return null;
            const eyeDropper = new window.EyeDropper();
            try {
                const result = await eyeDropper.open();
                return result.sRGBHex;
            } catch (e) { return null; }
        }, []);
        return { supported, open };
    };
    const { supported: eyeDropperSupported, open: openEyeDropper } = useEyeDropper();

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Sync value
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
            if (value !== currentHtml) {
                onChangeRef.current(currentHtml);
            }
        }
    }, [value]);

    const execCmd = (command: string, commandValue?: string) => {
        document.execCommand(command, false, commandValue);
        editorRef.current?.focus();
        handleInput();
        if (command === 'foreColor' && commandValue) setCurrentColor(commandValue);
    };

    // --- PASTE & DROP (SỬ DỤNG LOGIC LỌC CŨ) ---
    const processContentInsertion = (htmlData: string | null, textData: string | null) => {
        try {
            let finalHtml = '';
            // 1. HTML -> Clean
            if (htmlData) {
                finalHtml = cleanHTML(htmlData);
            } 
            // 2. Text -> P logic
            else if (textData) {
                const lines = textData.split(/[\r\n]+/);
                finalHtml = lines.map(line => {
                    const trimmedLine = line.trim();
                    return trimmedLine ? `<p>${trimmedLine}</p>` : ''; 
                }).join('');
            }

            if (finalHtml) {
                const success = document.execCommand('insertHTML', false, finalHtml);
                if (!success && editorRef.current) {
                    editorRef.current.innerHTML += finalHtml;
                }
                handleInput();
            }
        } catch (error) {
            console.error("Lỗi xử lý nội dung:", error);
            alert("Có lỗi khi chèn nội dung.");
        }
    };

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const handlePaste = (event: ClipboardEvent) => {
            event.preventDefault();
            const textData = event.clipboardData?.getData('text/plain') || null;
            const htmlData = event.clipboardData?.getData('text/html') || null;
            processContentInsertion(htmlData, textData);
        };

        const handleDrop = (event: DragEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const textData = event.dataTransfer?.getData('text/plain') || null;
            const htmlData = event.dataTransfer?.getData('text/html') || null;
            
            if (document.caretRangeFromPoint && event.clientX) {
                const range = document.caretRangeFromPoint(event.clientX, event.clientY);
                if (range) {
                    const selection = window.getSelection();
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                }
            }
            processContentInsertion(htmlData, textData);
            editor.classList.remove('bg-slate-100', 'dark:bg-slate-700'); 
        };

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'copy';
        };

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
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const placeholderId = `img-${Date.now()}`;
                execCmd('insertHTML', `<div id="${placeholderId}">Đang tải ảnh...</div>`);

                try {
                    const imageUrl = await uploadImage(file);
                    const placeholder = editorRef.current?.querySelector(`#${placeholderId}`);
                    if (placeholder) {
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.style.maxWidth = '100%';
                        img.style.display = 'block';
                        img.style.margin = '1rem auto';
                        placeholder.parentNode?.replaceChild(img, placeholder);
                    }
                    handleInput();
                } catch (e) {
                    console.error(e);
                }
            }
        };
        input.click();
    };

    // --- CÁC TÍNH NĂNG MỚI (MANUAL) ---
    const insertFrame = (type: 'normal' | 'letter' | 'system') => {
        let style = '';
        // Nội dung rỗng để nhập liệu
        const content = '<p><br></p>';

        switch (type) {
            case 'normal':
                // Khung thường: Viền 4 cạnh, không border-left đậm
                style = `border: 2px solid #94a3b8; background-color: #f8fafc; padding: 16px; margin: 16px 0; color: #374151; font-style: normal; border-radius: 4px;`;
                break;
            case 'letter':
                style = `border: 4px double #d97706; background-color: #fffbeb; padding: 24px; margin: 16px 0; color: #451a03; font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif; font-style: italic; line-height: 1.8; box-shadow: 2px 2px 5px rgba(0,0,0,0.05);`;
                break;
            case 'system':
                style = `border: 2px solid #3b82f6; background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0; color: #1e3a8a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; position: relative; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);`;
                break;
        }

        const html = `<div style="${style}">${content}</div><p><br></p>`;
        execCmd('insertHTML', html);
    };

    const insertSeparatorLine = () => {
        execCmd('insertHTML', `<hr style="border: 0; border-top: 2px solid #64748b; margin: 24px 0;"><p><br></p>`);
    };

    const insertSeparatorStars = () => {
        const star = '&#9734;';
        const space = '&nbsp;&nbsp;';
        const html = `<div style="text-align: center; margin: 24px 0; font-size: 1.2em; color: #475569;">${star}${space}${star}${space}${star}</div><p><br></p>`;
        execCmd('insertHTML', html);
    };

    const handleColorChange = (color: string) => {
        execCmd('foreColor', color);
        setCurrentColor(color);
        setShowColorPicker(false);
    };

    const handleEyeDropperClick = async () => {
        const color = await openEyeDropper();
        if (color) handleColorChange(color);
    };

    const ToolbarButton: React.FC<{ children: React.ReactNode, onClick?: () => void, ariaLabel: string, isActive?: boolean, title?: string }> = ({ children, onClick, ariaLabel, isActive, title }) => (
        <button
            type="button"
            onClick={onClick}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${isActive ? 'bg-slate-200 dark:bg-slate-700 text-orange-600' : 'text-slate-700 dark:text-slate-200'}`}
            aria-label={ariaLabel}
            title={title || ariaLabel}
        >
            {children}
        </button>
    );

    const PRESET_COLORS = [
        '#000000', '#444444', '#888888', '#cccccc', '#ffffff', 
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
        '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef'
    ];

    return (
        <div ref={containerRef} className="border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden bg-white dark:bg-slate-800 shadow-sm relative">
            {/* Toolbar Sticky: Sử dụng position: sticky để thanh công cụ tự đi theo khi cuộn */}
            <div className="sticky top-0 z-50 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-0.5 p-1">
                    <ToolbarButton onClick={() => execCmd('undo')} ariaLabel="Hoàn tác"><ArrowUturnLeftIcon className="w-5 h-5" /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('redo')} ariaLabel="Làm lại"><ArrowUturnRightIcon className="w-5 h-5" /></ToolbarButton>
                    <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

                    <ToolbarButton onClick={() => execCmd('bold')} ariaLabel="In đậm"><span className="font-bold w-5 h-5 flex items-center justify-center">B</span></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('italic')} ariaLabel="In nghiêng"><span className="italic w-5 h-5 flex items-center justify-center">I</span></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('underline')} ariaLabel="Gạch chân"><span className="underline w-5 h-5 flex items-center justify-center">U</span></ToolbarButton>
                    
                    <div className="relative">
                        <ToolbarButton onClick={() => setShowColorPicker(!showColorPicker)} ariaLabel="Màu chữ" isActive={showColorPicker}>
                            <div className="flex items-center gap-1">
                                <SwatchIcon className="w-5 h-5" />
                                <div className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: currentColor }}></div>
                            </div>
                        </ToolbarButton>
                        
                        {showColorPicker && (
                            <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl min-w-[240px] z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="grid grid-cols-5 gap-2 mb-3">
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => handleColorChange(c)}
                                            className="w-8 h-8 rounded-full border border-slate-200 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            style={{ backgroundColor: c }}
                                            title={c}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                    <div className="relative flex-grow">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">#</span>
                                        <input 
                                            type="text" 
                                            value={currentColor.replace('#', '')}
                                            onChange={(e) => setCurrentColor(`#${e.target.value}`)}
                                            onBlur={() => handleColorChange(currentColor)}
                                            className="w-full pl-5 pr-2 py-1 text-sm border rounded bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600 focus:ring-1 focus:ring-orange-500 outline-none"
                                            placeholder="HEX"
                                        />
                                    </div>
                                    <label className="cursor-pointer p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                        <input type="color" value={currentColor} onChange={(e) => handleColorChange(e.target.value)} className="sr-only"/>
                                        <div className="w-5 h-5 rounded" style={{background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'}}></div>
                                    </label>
                                    {eyeDropperSupported && (
                                        <button onClick={handleEyeDropperClick} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300" title="Hút màu từ màn hình">
                                            <EyeDropperIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

                    <ToolbarButton onClick={() => execCmd('justifyLeft')} ariaLabel="Căn trái"><Bars3BottomLeftIcon className="w-5 h-5" /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('justifyCenter')} ariaLabel="Căn giữa"><Bars3Icon className="w-5 h-5" /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('justifyRight')} ariaLabel="Căn phải"><Bars3BottomRightIcon className="w-5 h-5" /></ToolbarButton>
                    <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

                    <ToolbarButton onClick={handleImageUpload} ariaLabel="Tải ảnh" title="Chèn ảnh"><PhotoIcon className="w-5 h-5" /></ToolbarButton>
                    
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded px-1 gap-0.5">
                        <ToolbarButton onClick={() => insertFrame('normal')} ariaLabel="Khung thường" title="Chèn khung thường"><StopIcon className="w-5 h-5" /></ToolbarButton>
                        <ToolbarButton onClick={() => insertFrame('letter')} ariaLabel="Khung thư" title="Chèn khung thư tín"><EnvelopeIcon className="w-5 h-5" /></ToolbarButton>
                        <ToolbarButton onClick={() => insertFrame('system')} ariaLabel="Khung hệ thống" title="Chèn khung hệ thống"><CommandLineIcon className="w-5 h-5" /></ToolbarButton>
                    </div>

                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded px-1 gap-0.5 ml-1">
                        <ToolbarButton onClick={insertSeparatorLine} ariaLabel="Dòng kẻ" title="Chèn dòng phân cách"><MinusIcon className="w-5 h-5" /></ToolbarButton>
                        <ToolbarButton onClick={insertSeparatorStars} ariaLabel="Sao phân cách" title="Chèn 3 ngôi sao"><StarIcon className="w-5 h-5" /></ToolbarButton>
                    </div>

                    <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                    
                    <ToolbarButton onClick={() => execCmd('removeFormat')} ariaLabel="Xóa định dạng" title="Xóa định dạng"><EyeSlashIcon className="w-5 h-5" /></ToolbarButton>
                    <ToolbarButton onClick={() => setShowFind(prev => !prev)} isActive={showFind} ariaLabel="Tìm kiếm" title="Tìm và thay thế"><MagnifyingGlassIcon className="w-5 h-5" /></ToolbarButton>
                </div>

                {showFind && (
                    <div className="flex flex-col sm:flex-row gap-2 p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 animate-in slide-in-from-top-2 duration-200">
                        <input type="text" placeholder="Tìm kiếm..." value={findText} onChange={e => setFindText(e.target.value)} className="flex-grow p-1.5 border rounded text-sm bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-orange-500"/>
                        <input type="text" placeholder="Thay thế bằng..." value={replaceText} onChange={e => setReplaceText(e.target.value)} className="flex-grow p-1.5 border rounded text-sm bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-orange-500"/>
                        <button 
                            onClick={() => {
                                if (!findText) return;
                                const content = editorRef.current?.innerHTML || '';
                                if (!content.includes(findText)) return alert('Không tìm thấy nội dung');
                                if (window.confirm('Thay thế tất cả?')) {
                                    editorRef.current!.innerHTML = content.replaceAll(findText, replaceText);
                                    handleInput();
                                }
                            }} 
                            className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50 font-medium" 
                            disabled={!findText}
                        >
                            Thay thế
                        </button>
                        <ToolbarButton onClick={() => setShowFind(false)} ariaLabel="Đóng"><XMarkIcon className="w-5 h-5" /></ToolbarButton>
                    </div>
                )}
            </div>

            <div
                ref={editorRef}
                onInput={handleInput}
                contentEditable={true}
                spellCheck={false}
                suppressContentEditableWarning={true}
                className="prose dark:prose-invert max-w-none p-6 min-h-[500px] outline-none focus:ring-0 text-slate-900 dark:text-slate-100 leading-relaxed"
            />
        </div>
    );
};

export default CustomEditor;
