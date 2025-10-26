// maihan88/novelweb/novelweb-f5f06717a24d62369141d3da728fb70d3a283629/components/CustomEditor.tsx
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

import { uploadImage } from '../services/uploadService.ts'; //

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
            // Chiều cao thực tế của toolbar (bao gồm cả phần tìm kiếm nếu có)
            const currentToolbarHeight = toolbarRef.current.offsetHeight;
            const shouldBeFixed = containerRect.top <= 0 && containerRect.bottom > currentToolbarHeight;

            if (shouldBeFixed && !isToolbarFixed) {
                setToolbarPosition({
                    left: containerRect.left,
                    width: containerRect.width
                });
            }
             // Cập nhật chiều cao toolbar bất kể trạng thái fixed
            setToolbarHeight(currentToolbarHeight);
            setIsToolbarFixed(shouldBeFixed);
        };

        const updateToolbarHeight = () => {
             if (toolbarRef.current) {
                setToolbarHeight(toolbarRef.current.offsetHeight);
                // Trigger lại handleScroll để cập nhật vị trí nếu cần
                handleScroll();
             }
        };


        // Cập nhật chiều cao khi showFind thay đổi
        updateToolbarHeight();

        window.addEventListener('scroll', handleScroll, { passive: true }); // passive: true cho hiệu năng tốt hơn
        window.addEventListener('resize', updateToolbarHeight);

        // --- Clean up listener ---
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', updateToolbarHeight);
        };
    // Thêm showFind vào dependency array để tính lại chiều cao khi bật/tắt tìm kiếm
    }, [showFind, isToolbarFixed]); // Loại bỏ toolbarHeight khỏi dependencies


    const handleInput = useCallback(() => {
        if (editorRef.current) {
            const currentHtml = editorRef.current.innerHTML;
            if (value !== currentHtml) {
                onChangeRef.current(currentHtml);
            }
        }
    }, [value]);

    // --- START: Xử lý sự kiện PASTE ---
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const handlePaste = (event: ClipboardEvent) => {
            event.preventDefault(); // Ngăn hành vi dán mặc định

            const text = event.clipboardData?.getData('text/plain');

            if (text) {
                // 1. Tách văn bản thành các dòng dựa trên MỘT HOẶC NHIỀU ký tự xuống dòng
                const lines = text.split(/[\r\n]+/);

                // 2. Lọc bỏ các dòng trống ở đầu và cuối, và chỉ giữ lại MỘT dòng trống giữa các đoạn
                const cleanedLines: string[] = [];
                let previousLineWasEmpty = true; // Bắt đầu coi như đã có dòng trống để loại bỏ các dòng trống ở đầu

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine) { // Nếu dòng có nội dung
                        cleanedLines.push(trimmedLine);
                        previousLineWasEmpty = false;
                    } else { // Nếu dòng trống
                        if (!previousLineWasEmpty) { // Chỉ thêm dòng trống nếu dòng trước đó không trống
                             // Thêm một ký tự đặc biệt để đánh dấu chỗ cần tạo thẻ <p> trống sau này, HOẶC bỏ qua nếu không muốn có khoảng cách lớn giữa đoạn
                             // cleanedLines.push('__EMPTY_PARAGRAPH__'); // Tùy chọn: giữ khoảng cách đoạn
                        }
                        previousLineWasEmpty = true;
                    }
                }
                 // Loại bỏ dòng trống cuối cùng nếu có
                 // if (cleanedLines[cleanedLines.length - 1] === '__EMPTY_PARAGRAPH__') {
                 //    cleanedLines.pop();
                 // }


                // 3. Tạo chuỗi HTML: mỗi dòng/đoạn trong thẻ <p>
                const processedHtml = cleanedLines.map(line => {
                    // if (line === '__EMPTY_PARAGRAPH__') {
                    //    return '<p><br></p>'; // Tạo thẻ p trống nếu muốn giữ khoảng cách
                    // }
                    // Bọc các dòng có nội dung bằng thẻ <p>
                    return `<p>${line}</p>`;
                }).join(''); // Nối các thẻ <p> lại với nhau

                // 4. Chèn HTML đã xử lý vào trình soạn thảo
                document.execCommand('insertHTML', false, processedHtml);

                // 5. Cập nhật state (quan trọng)
                handleInput();
            } else {
                 // Xử lý trường hợp dán nội dung không phải text (ví dụ: ảnh từ clipboard) - có thể giữ nguyên hành vi mặc định hoặc xử lý riêng
                 const html = event.clipboardData?.getData('text/html');
                 if (html) {
                     // Có thể thêm bộ lọc HTML ở đây nếu muốn làm sạch HTML được dán vào
                     document.execCommand('insertHTML', false, html);
                     handleInput();
                 }
            }
        };

        editor.addEventListener('paste', handlePaste);

        // Cleanup function
        return () => {
            editor.removeEventListener('paste', handlePaste);
        };
    }, [handleInput]); // Thêm handleInput vào dependency array
    // --- END: Xử lý sự kiện PASTE ---


    const handleToolbarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    const execCmd = (command: string, commandValue?: string) => {
        document.execCommand(command, false, commandValue);
        editorRef.current?.focus();
        handleInput(); // Cập nhật state sau mỗi lệnh
    };

     const handleReplaceAll = () => {
        if (!findText || !editorRef.current) return;
        const originalHtml = editorRef.current.innerHTML;

        // Tạo biểu thức chính quy từ findText, 'g' để thay thế tất cả, 'i' để không phân biệt hoa thường
        const findRegex = new RegExp(findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');

        if (!originalHtml.match(findRegex)) {
             alert(`Không tìm thấy "${findText}" trong nội dung.`);
             return;
        }

        // Sử dụng replaceAll để thay thế
        const newHtml = originalHtml.replaceAll(findRegex, replaceText);

        if (window.confirm(`Bạn có chắc muốn thay thế tất cả "${findText}" bằng "${replaceText}" không? (Thao tác này không thể hoàn tác)`)) {
            editorRef.current.innerHTML = newHtml;
            handleInput(); // Cập nhật state sau khi thay đổi
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

                const placeholderHtml = `<div id="${placeholderId}" style="display: flex; align-items: center; gap: 8px; justify-content: center; padding: 1rem; border: 1px dashed #ccc; border-radius: 4px; opacity: 0.7;">
                    <svg class="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Đang tải ảnh...
                </div><p><br></p>`;
                execCmd('insertHTML', placeholderHtml);

                try {
                    const imageUrl = await uploadImage(file); //

                    const placeholderNode = editorRef.current?.querySelector(`#${placeholderId}`);

                    if (placeholderNode) {
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.alt = "Ảnh trong truyện";
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                        img.style.borderRadius = '0.25rem'; // bo góc nhẹ
                        img.style.display = 'block'; // Tránh khoảng trống thừa bên dưới ảnh inline
                        img.style.marginLeft = 'auto'; // Căn giữa ảnh (tùy chọn)
                        img.style.marginRight = 'auto'; // Căn giữa ảnh (tùy chọn)

                        placeholderNode.parentNode?.replaceChild(img, placeholderNode);
                    } else {
                        console.warn("Không tìm thấy placeholder, chèn ảnh ở cuối.");
                        const imgHtml = `<p style="text-align: center;"><img src="${imageUrl}" style="max-width: 100%; height: auto; border-radius: 0.25rem; display: inline-block;" alt="Ảnh trong truyện"/></p>`;
                        execCmd('insertHTML', imgHtml);
                    }
                    handleInput(); // Cập nhật state sau khi ảnh tải xong
                } catch (error) {
                    console.error("Lỗi tải ảnh:", error);
                    alert('Tải ảnh thất bại. Vui lòng thử lại.');
                    const placeholderNode = editorRef.current?.querySelector(`#${placeholderId}`);
                    if (placeholderNode) {
                        const errorEl = document.createElement('p');
                        errorEl.style.color = 'red';
                        errorEl.style.textAlign = 'center';
                        errorEl.textContent = '[Lỗi tải ảnh]';
                        placeholderNode.parentNode?.replaceChild(errorEl, placeholderNode);
                         handleInput(); // Cập nhật state sau khi báo lỗi
                    }
                }
                // Không cần finally handleInput() nữa vì đã gọi trong try và catch
            }
        };
        input.click();
    };


    const handleInsertFrame = () => {
        const frameHTML = `<blockquote style="border-left: 4px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px; color: #666; font-style: italic;">
            <p>Nội dung trong khung...</p>
        </blockquote><p><br></p>`; // Sử dụng blockquote cho ngữ nghĩa tốt hơn và thêm <p> rỗng để đảm bảo xuống dòng
        execCmd('insertHTML', frameHTML);
    };


    const ToolbarButton: React.FC<{ children: React.ReactNode, onClick?: () => void, ariaLabel: string, isActive?: boolean }> = ({ children, onClick, ariaLabel, isActive }) => (
        <button
            type="button"
            onClick={onClick}
            onMouseDown={handleToolbarMouseDown} // Ngăn editor mất focus khi click toolbar
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${isActive ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
            aria-label={ariaLabel}
            aria-pressed={isActive} // Cho biết trạng thái active (ví dụ: nút Bold)
        >
            {children}
        </button>
    );

    const toolbarContent = (
        <>
            <div className="flex flex-wrap items-center gap-1 p-2">
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
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" // Che phủ toàn bộ nút cha
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
                <ToolbarButton onClick={() => setShowFind(prev => !prev)} isActive={showFind} ariaLabel="Tìm và thay thế">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                </ToolbarButton>
            </div>

            {/* Khung tìm kiếm & thay thế */}
            {showFind && (
                 <div className="flex flex-col sm:flex-row gap-2 p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={findText}
                        onChange={e => setFindText(e.target.value)}
                        className="flex-grow p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-orange-500 text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Thay thế bằng..."
                        value={replaceText}
                        onChange={e => setReplaceText(e.target.value)}
                        className="flex-grow p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-orange-500 text-sm"
                    />
                    <button
                        onClick={handleReplaceAll}
                        className="px-3 py-2 bg-orange-500 text-white font-semibold rounded hover:bg-orange-600 text-sm whitespace-nowrap disabled:opacity-50"
                        disabled={!findText} // Vô hiệu hóa nếu không có gì để tìm
                    >
                        Thay thế tất cả
                    </button>
                     <ToolbarButton onClick={() => setShowFind(false)} ariaLabel="Đóng tìm kiếm">
                       <XMarkIcon className="w-5 h-5" />
                    </ToolbarButton>
                </div>
            )}
        </>
    );


    return (
        <div ref={containerRef} className="border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm">
            {/* Toolbar Container (for height calculation and normal display) */}
             <div
                ref={toolbarRef}
                className={`relative z-10 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 ${isToolbarFixed ? 'invisible' : ''}`} // Ẩn khi fixed để tránh nhảy layout
            >
                {toolbarContent}
            </div>

             {/* Fixed Toolbar (only visible when scrolled) */}
            {isToolbarFixed && (
                <div
                    className="fixed top-0 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-md border-b border-slate-200 dark:border-slate-700"
                    style={{
                        zIndex: 100, // Đảm bảo toolbar nổi trên cùng
                        left: `${toolbarPosition.left}px`,
                        width: `${toolbarPosition.width}px`,
                        // Thêm chiều cao để tính toán vị trí nội dung bên dưới
                        // height: `${toolbarHeight}px` // Không cần set height ở đây, nó tự tính
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
                spellCheck={false} // Tắt kiểm tra chính tả mặc định của trình duyệt
                suppressContentEditableWarning={true}
                // Sử dụng Tailwind Prose để định dạng cơ bản, có thể tùy chỉnh thêm
                className="prose dark:prose-invert max-w-none prose-p:my-2 prose-blockquote:border-l-4 prose-blockquote:border-slate-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 dark:prose-blockquote:border-slate-600 p-4 min-h-[400px] focus:outline-none focus:ring-2 focus:ring-orange-300 rounded-b-md"
                // Thêm padding top bằng chiều cao toolbar khi toolbar được fixed
                style={{ paddingTop: isToolbarFixed ? `${toolbarHeight + 16}px` : undefined }} // +16px là padding mặc định của editor
            />
        </div>
    );
};

export default CustomEditor;
