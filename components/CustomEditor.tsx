// maihan88/novelweb/novelweb-bb25e07affd2305d7e9afc8949e929c60a9cbfdb/components/CustomEditor.tsx
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
    XMarkIcon,
    MinusIcon
} from '@heroicons/react/24/outline';

import { uploadImage } from '../services/uploadService.ts';

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


const CustomEditor: React.FC<CustomEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);

    // --- STATE ---
    const [showFind, setShowFind] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [isToolbarFixed, setIsToolbarFixed] = useState(false);
    const [toolbarHeight, setToolbarHeight] = useState(0);
    const [toolbarPosition, setToolbarPosition] = useState({ left: 0, width: 0 });

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Sync value from props to editable div
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            // Chỉ cập nhật nếu khác biệt để tránh mất vị trí con trỏ khi đang gõ
            // Tuy nhiên, với Drag/Drop, ta cần đảm bảo DOM clean ngay từ đầu
            if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    // --- HANDLE SCROLL & RESIZE ---
    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current || !toolbarRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const currentToolbarHeight = toolbarRef.current.offsetHeight;
            const shouldBeFixed = containerRect.top <= 0 && containerRect.bottom > currentToolbarHeight;

            if (shouldBeFixed && !isToolbarFixed) {
                setToolbarPosition({
                    left: containerRect.left,
                    width: containerRect.width
                });
            }
            setToolbarHeight(currentToolbarHeight);
            setIsToolbarFixed(shouldBeFixed);
        };

        const updateToolbarHeight = () => {
             if (toolbarRef.current) {
                setToolbarHeight(toolbarRef.current.offsetHeight);
                handleScroll();
             }
        };

        updateToolbarHeight();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', updateToolbarHeight);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', updateToolbarHeight);
        };
    }, [showFind, isToolbarFixed]);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            const currentHtml = editorRef.current.innerHTML;
            if (value !== currentHtml) {
                onChangeRef.current(currentHtml);
            }
        }
    }, [value]);

    // --- EXEC CMD ---
    const execCmd = (command: string, commandValue?: string) => {
        document.execCommand(command, false, commandValue);
        editorRef.current?.focus();
        handleInput();
    };

    // --- XỬ LÝ NỘI DUNG NHẬP VÀO (CHUNG CHO PASTE & DROP) ---
    const processContentInsertion = (htmlData: string | null, textData: string | null) => {
        try {
            let finalHtml = '';

            // 1. Ưu tiên xử lý HTML nếu có (để giữ định dạng: Bold, Color...)
            if (htmlData) {
                // Chạy qua bộ lọc để bỏ rác nhưng giữ định dạng
                finalHtml = cleanHTML(htmlData);
            } 
            // 2. Nếu không có HTML, fallback về xử lý Text (Logic cũ của bạn)
            else if (textData) {
                const lines = textData.split(/[\r\n]+/);
                finalHtml = lines.map(line => {
                    const trimmedLine = line.trim();
                    return trimmedLine ? `<p>${trimmedLine}</p>` : ''; 
                }).join('');
                // Note: Logic cũ của bạn có xử lý dòng trống thông minh, ở đây tôi đơn giản hóa
                // để đảm bảo tính nhất quán. Nếu muốn giữ nguyên logic text cũ, bạn có thể paste lại đoạn split đó vào đây.
            }

            if (finalHtml) {
                // Sử dụng insertHTML để chèn vào vị trí con trỏ hiện tại
                const success = document.execCommand('insertHTML', false, finalHtml);
                
                // Nếu execCommand thất bại (một số trình duyệt chặn nếu không có user interaction trực tiếp),
                // ta append vào cuối (fallback)
                if (!success && editorRef.current) {
                    editorRef.current.innerHTML += finalHtml;
                }
                handleInput();
            }
        } catch (error) {
            console.error("Lỗi xử lý nội dung:", error);
            alert("Có lỗi khi chèn nội dung. Vui lòng thử lại dạng văn bản thuần.");
        }
    };

    // --- SỰ KIỆN PASTE ---
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const handlePaste = (event: ClipboardEvent) => {
            event.preventDefault(); // Ngăn hành vi mặc định
            const textData = event.clipboardData?.getData('text/plain') || null;
            const htmlData = event.clipboardData?.getData('text/html') || null;
            processContentInsertion(htmlData, textData);
        };

        editor.addEventListener('paste', handlePaste);
        return () => editor.removeEventListener('paste', handlePaste);
    }, [handleInput]);

    // --- SỰ KIỆN DROP (KÉO THẢ) ---
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const handleDrop = (event: DragEvent) => {
            event.preventDefault(); // CỰC KỲ QUAN TRỌNG: Ngăn trình duyệt mở link hoặc chèn HTML rác
            event.stopPropagation();

            // Lấy dữ liệu từ sự kiện Drop
            const textData = event.dataTransfer?.getData('text/plain') || null;
            const htmlData = event.dataTransfer?.getData('text/html') || null;

            // Đặt focus vào nơi thả chuột (nếu trình duyệt hỗ trợ caretRangeFromPoint)
            if (document.caretRangeFromPoint && event.clientX) {
                const range = document.caretRangeFromPoint(event.clientX, event.clientY);
                if (range) {
                    const selection = window.getSelection();
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                }
            }

            processContentInsertion(htmlData, textData);
            
            // Xóa hiệu ứng drag over (nếu có thêm class UI)
            editor.classList.remove('bg-slate-100', 'dark:bg-slate-700'); 
        };

        const handleDragOver = (event: DragEvent) => {
            event.preventDefault(); // Cho phép drop
            event.dataTransfer!.dropEffect = 'copy';
            // Có thể thêm class để highlight vùng drop
             // editor.classList.add('bg-slate-100', 'dark:bg-slate-700');
        };

        // const handleDragLeave = () => {
            // editor.classList.remove('bg-slate-100', 'dark:bg-slate-700');
        // }

        editor.addEventListener('drop', handleDrop);
        editor.addEventListener('dragover', handleDragOver);
        // editor.addEventListener('dragleave', handleDragLeave);

        return () => {
            editor.removeEventListener('drop', handleDrop);
            editor.removeEventListener('dragover', handleDragOver);
            // editor.removeEventListener('dragleave', handleDragLeave);
        };
    }, [handleInput]);


    // ... [GIỮ NGUYÊN CÁC HÀM XỬ LÝ KHÁC: handleToolbarMouseDown, handleReplaceAll, handleImageUpload, etc.] ...
    const handleToolbarMouseDown = (e: React.MouseEvent) => e.preventDefault();

    const handleReplaceAll = () => {
        if (!findText || !editorRef.current) return;
        const originalHtml = editorRef.current.innerHTML;
        const findRegex = new RegExp(findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');

        if (!originalHtml.match(findRegex)) {
             alert(`Không tìm thấy "${findText}" trong nội dung.`);
             return;
        }
        const newHtml = originalHtml.replaceAll(findRegex, replaceText);
        if (window.confirm(`Bạn có chắc muốn thay thế tất cả "${findText}" bằng "${replaceText}" không?`)) {
            editorRef.current.innerHTML = newHtml;
            handleInput();
        }
    };

    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const placeholderId = `img-placeholder-${Date.now()}`;
                const placeholderHtml = `<div id="${placeholderId}" class="p-4 border border-dashed border-gray-300 rounded text-center text-gray-500">Đang tải ảnh...</div><p><br></p>`;
                execCmd('insertHTML', placeholderHtml);

                try {
                    const imageUrl = await uploadImage(file);
                    const placeholderNode = editorRef.current?.querySelector(`#${placeholderId}`);
                    if (placeholderNode) {
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.alt = "Ảnh minh họa";
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                        img.style.display = 'block';
                        img.style.margin = '1rem auto';
                        img.style.borderRadius = '0.25rem';
                        placeholderNode.parentNode?.replaceChild(img, placeholderNode);
                    }
                    handleInput();
                } catch (error) {
                    console.error("Lỗi tải ảnh:", error);
                    const placeholderNode = editorRef.current?.querySelector(`#${placeholderId}`);
                    if(placeholderNode) placeholderNode.innerHTML = '<span style="color:red">Lỗi tải ảnh</span>';
                }
            }
        };
        input.click();
    };

    const handleInsertFrame = () => {
        const frameHTML = `<blockquote style="border-left: 4px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px; color: #666; font-style: italic; background-color: rgba(0,0,0,0.05);"><p>Nội dung trong khung...</p></blockquote><p><br></p>`;
        execCmd('insertHTML', frameHTML);
    };

    const handleInsertSeparator = () => {
        const separatorHtml = `<div style="text-align: center; margin: 1.5em 0; display: flex; align-items: center; gap: 1em; opacity: 0.7; color: currentColor;"><hr style="flex-grow: 1; border-top: 1px solid currentColor;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;"><path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><hr style="flex-grow: 1; border-top: 1px solid currentColor;"></div><p><br></p>`;
        execCmd('insertHTML', separatorHtml);
    };

    const ToolbarButton: React.FC<{ children: React.ReactNode, onClick?: () => void, ariaLabel: string, isActive?: boolean }> = ({ children, onClick, ariaLabel, isActive }) => (
        <button
            type="button"
            onClick={onClick}
            onMouseDown={handleToolbarMouseDown}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${isActive ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
            aria-label={ariaLabel}
            aria-pressed={isActive}
        >
            {children}
        </button>
    );

    const toolbarContent = (
        <>
            <div className="flex flex-wrap items-center gap-1 p-2">
                <ToolbarButton onClick={() => execCmd('undo')} ariaLabel="Hoàn tác"><ArrowUturnLeftIcon className="w-5 h-5" /></ToolbarButton>
                <ToolbarButton onClick={() => execCmd('redo')} ariaLabel="Làm lại"><ArrowUturnRightIcon className="w-5 h-5" /></ToolbarButton>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

                <ToolbarButton onClick={() => execCmd('bold')} ariaLabel="In đậm"><span className="font-bold w-5 h-5 flex items-center justify-center">B</span></ToolbarButton>
                <ToolbarButton onClick={() => execCmd('italic')} ariaLabel="In nghiêng"><span className="italic w-5 h-5 flex items-center justify-center">I</span></ToolbarButton>
                <ToolbarButton onClick={() => execCmd('underline')} ariaLabel="Gạch chân"><span className="underline w-5 h-5 flex items-center justify-center">U</span></ToolbarButton>
                <label className="relative flex items-center cursor-pointer" onMouseDown={handleToolbarMouseDown}>
                    <div className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><PaintBrushIcon className="w-5 h-5" /></div>
                    <input type="color" onChange={(e) => execCmd('foreColor', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Màu chữ"/>
                </label>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

                <ToolbarButton onClick={() => execCmd('justifyLeft')} ariaLabel="Căn trái"><Bars3BottomLeftIcon className="w-5 h-5" /></ToolbarButton>
                <ToolbarButton onClick={() => execCmd('justifyCenter')} ariaLabel="Căn giữa"><Bars3Icon className="w-5 h-5" /></ToolbarButton>
                <ToolbarButton onClick={() => execCmd('justifyRight')} ariaLabel="Căn phải"><Bars3BottomRightIcon className="w-5 h-5" /></ToolbarButton>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

                <ToolbarButton onClick={handleImageUpload} ariaLabel="Tải ảnh"><PhotoIcon className="w-5 h-5" /></ToolbarButton>
                <ToolbarButton onClick={handleInsertFrame} ariaLabel="Tạo khung"><CodeBracketSquareIcon className="w-5 h-5" /></ToolbarButton>
                <ToolbarButton onClick={handleInsertSeparator} ariaLabel="Chèn dấu phân cách"><MinusIcon className="w-5 h-5" /></ToolbarButton>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

                <ToolbarButton onClick={() => execCmd('removeFormat')} ariaLabel="Xóa định dạng"><EyeSlashIcon className="w-5 h-5" /></ToolbarButton>
                <ToolbarButton onClick={() => setShowFind(prev => !prev)} isActive={showFind} ariaLabel="Tìm và thay thế"><MagnifyingGlassIcon className="w-5 h-5" /></ToolbarButton>
            </div>

            {showFind && (
                 <div className="flex flex-col sm:flex-row gap-2 p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <input type="text" placeholder="Tìm kiếm..." value={findText} onChange={e => setFindText(e.target.value)} className="flex-grow p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-orange-500 text-sm"/>
                    <input type="text" placeholder="Thay thế bằng..." value={replaceText} onChange={e => setReplaceText(e.target.value)} className="flex-grow p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-orange-500 text-sm"/>
                    <button onClick={handleReplaceAll} className="px-3 py-2 bg-orange-500 text-white font-semibold rounded hover:bg-orange-600 text-sm whitespace-nowrap disabled:opacity-50" disabled={!findText}>Thay thế</button>
                     <ToolbarButton onClick={() => setShowFind(false)} ariaLabel="Đóng"><XMarkIcon className="w-5 h-5" /></ToolbarButton>
                </div>
            )}
        </>
    );

    return (
        <div ref={containerRef} className="border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm">
             <div ref={toolbarRef} className={`relative z-10 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 ${isToolbarFixed ? 'invisible' : ''}`}>
                {toolbarContent}
            </div>

            {isToolbarFixed && (
                <div className="fixed top-0 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-md border-b border-slate-200 dark:border-slate-700" style={{ zIndex: 100, left: `${toolbarPosition.left}px`, width: `${toolbarPosition.width}px`}}>
                    {toolbarContent}
                </div>
            )}

            <div
                ref={editorRef}
                onInput={handleInput}
                contentEditable={true}
                spellCheck={false}
                suppressContentEditableWarning={true}
                className="prose dark:prose-invert max-w-none prose-p:my-2 prose-blockquote:border-l-4 prose-blockquote:border-slate-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 dark:prose-blockquote:border-slate-600 p-4 min-h-[400px] focus:outline-none focus:ring-2 focus:ring-orange-300 rounded-b-md"
                style={{ paddingTop: isToolbarFixed ? `${toolbarHeight + 16}px` : undefined }}
            />
        </div>
    );
};

export default CustomEditor;
