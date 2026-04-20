import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    ArrowsRightLeftIcon, 
    XMarkIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    FunnelIcon,
    ChevronDownIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

interface FormatSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialHtml: string;
    onApply: (finalHtml: string) => void;
}

const FormatSyncModal: React.FC<FormatSyncModalProps> = ({ isOpen, onClose, initialHtml, onApply }) => {
    const [originalData, setOriginalData] = useState<{ id: string; text: string; badges: string[] }[]>([]);
    const [translatedText, setTranslatedText] = useState('');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    
    const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
    const [selectedBadge, setSelectedBadge] = useState<string>('all');

    const syncDocRef = useRef<HTMLElement | null>(null);
    const syncBlocksRef = useRef<HTMLElement[]>([]);
    
    // Refs dùng để đồng bộ cuộn (Scroll Sync) giữa lớp đệm và Textarea
    const activeBlockRef = useRef<HTMLDivElement | null>(null);
    const backdropRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (activeBlockRef.current) {
            activeBlockRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeBlockIndex]);

    useEffect(() => {
        if (!isOpen) return;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = initialHtml;
        
        const blocks: HTMLElement[] = [];
        const blocksData: { id: string; text: string; badges: string[] }[] = [];
        
        const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node: HTMLElement) => {
                const tag = node.tagName.toLowerCase();
                if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote', 'li', 'td', 'th'].includes(tag)) {
                    const hasBlockChild = Array.from(node.children).some(c => 
                        ['p', 'div', 'hr', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table'].includes(c.tagName.toLowerCase())
                    );
                    if (!hasBlockChild && node.textContent && node.textContent.trim().length > 0) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
                return NodeFilter.FILTER_SKIP;
            }
        });
        
        let currentNode = walker.nextNode() as HTMLElement;
        let idCounter = 0;
        
        while(currentNode) {
            blocks.push(currentNode);
            const badges: string[] = [];
            
            const align = currentNode.style.textAlign;
            if (align && align !== 'justify') badges.push(`Căn: ${align}`);
            
            if (currentNode.style.color) badges.push('Màu chữ');
            if (currentNode.style.backgroundColor && currentNode.style.backgroundColor !== 'transparent' && currentNode.style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                badges.push('Màu nền');
            }

            if (currentNode.style.fontWeight === 'bold' || currentNode.querySelector('b, strong') || Number(currentNode.style.fontWeight) >= 600) badges.push('In đậm');
            if (currentNode.style.fontStyle === 'italic' || currentNode.querySelector('i, em')) badges.push('In nghiêng');
            
            if (currentNode.style.textDecoration.includes('line-through') || currentNode.querySelector('s, strike, del')) badges.push('Gạch ngang');
            if (currentNode.style.textDecoration.includes('underline') || currentNode.querySelector('u')) badges.push('Gạch chân');
            
            const tag = currentNode.tagName.toLowerCase();
            if (['td', 'th'].includes(tag)) badges.push('Ô trong bảng');
            else if (tag !== 'p') badges.push(`Thẻ: ${tag.toUpperCase()}`);
            
            if (currentNode.className) {
                const cls = currentNode.className.split(' ').find(c => ['box_title', 'board', 'board01', 'kabox'].includes(c));
                if (cls) badges.push(`Khung: ${cls}`);
            }

            if (badges.length === 0) badges.push('Mặc định');

            blocksData.push({ id: `sync-block-${idCounter++}`, text: currentNode.textContent || '', badges });
            currentNode = walker.nextNode() as HTMLElement;
        }
        
        syncDocRef.current = tempDiv;
        syncBlocksRef.current = blocks;
        setOriginalData(blocksData);
        setTranslatedText('');
        setIsPreviewMode(false);
        setSelectedBadge('all');
        setActiveBlockIndex(null);

    }, [isOpen, initialHtml]);

    const handleApplyClick = () => {
        const lines = translatedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return alert('Vui lòng nhập bản dịch!');

        const blocks = syncBlocksRef.current;
        const minLength = Math.min(blocks.length, lines.length);
        
        for (let i = 0; i < minLength; i++) {
            blocks[i].textContent = lines[i];
        }

        if (lines.length > blocks.length && syncDocRef.current) {
            for (let i = blocks.length; i < lines.length; i++) {
                const newP = document.createElement('p');
                newP.textContent = lines[i];
                syncDocRef.current.appendChild(newP);
            }
        }
        
        const finalHtml = syncDocRef.current?.innerHTML || '';
        onApply(finalHtml);
    };

    const getPreviewHtml = () => {
        if (!syncDocRef.current) return '';
        const cloneDiv = syncDocRef.current.cloneNode(true) as HTMLElement;
        const blocks: HTMLElement[] = [];
        const walker = document.createTreeWalker(cloneDiv, NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node: HTMLElement) => {
                const tag = node.tagName.toLowerCase();
                if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote', 'li', 'td', 'th'].includes(tag)) {
                    const hasBlockChild = Array.from(node.children).some(c => 
                        ['p', 'div', 'hr', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table'].includes(c.tagName.toLowerCase())
                    );
                    if (!hasBlockChild && node.textContent && node.textContent.trim().length > 0) return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            }
        });
        
        let currentNode = walker.nextNode() as HTMLElement;
        while(currentNode) {
            blocks.push(currentNode);
            currentNode = walker.nextNode() as HTMLElement;
        }

        const lines = translatedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const minLength = Math.min(blocks.length, lines.length);
        for (let i = 0; i < minLength; i++) blocks[i].textContent = lines[i];

        if (lines.length > blocks.length) {
            for (let i = blocks.length; i < lines.length; i++) {
                const newP = document.createElement('p');
                newP.textContent = lines[i];
                cloneDiv.appendChild(newP);
            }
        }
        return cloneDiv.innerHTML;
    };

    const trackCursorPosition = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        const cursorPosition = target.selectionStart;
        
        const textBeforeCursor = target.value.substring(0, cursorPosition);
        const lines = textBeforeCursor.split('\n');
        const validBlocksBeforeCursor = lines.map(l => l.trim()).filter(l => l.length > 0);
        const currentLineText = lines[lines.length - 1].trim();
        
        if (currentLineText.length === 0) {
            setActiveBlockIndex(validBlocksBeforeCursor.length);
        } else {
            setActiveBlockIndex(Math.max(0, validBlocksBeforeCursor.length - 1));
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        
        // VÁ LỖI TẠI ĐÂY: Thêm .replace(/\\/g, '') để lọc sạch dấu \ ngay khi paste
        const cleanedText = pastedData
            .replace(/\\/g, '') 
            .replace(/\r\n|\r/g, '\n')
            .replace(/\n{2,}/g, '\n');
        
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        
        const newText = translatedText.substring(0, start) + cleanedText + translatedText.substring(end);
        setTranslatedText(newText);
        
        setTimeout(() => {
            if (target) {
                target.selectionStart = target.selectionEnd = start + cleanedText.length;
                trackCursorPosition({ target } as any);
            }
        }, 0);
    };

    const uniqueBadges = useMemo(() => {
        const allBadges = originalData.flatMap(item => item.badges);
        return Array.from(new Set(allBadges)).sort();
    }, [originalData]);

    const filteredData = selectedBadge === 'all' 
        ? originalData 
        : originalData.filter(block => block.badges.includes(selectedBadge));

    if (!isOpen) return null;

    const translatedLines = translatedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const translatedLinesCount = translatedLines.length;
    const originalBlocksCount = originalData.length;
    
    let matchStatus: { text: string; color: string; icon: React.ReactNode | null } = { 
        text: 'Chưa có bản dịch', color: 'text-gray-500', icon: null 
    };
    
    if (translatedLinesCount > 0) {
        if (translatedLinesCount === originalBlocksCount) matchStatus = { text: 'Khớp hoàn hảo', color: 'text-green-500', icon: <CheckCircleIcon className="w-5 h-5 text-green-500 inline mr-1" /> };
        else if (translatedLinesCount < originalBlocksCount) matchStatus = { text: `Đang thiếu ${originalBlocksCount - translatedLinesCount} đoạn (Có thể bị gộp đoạn)`, color: 'text-red-500', icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500 inline mr-1" /> };
        else matchStatus = { text: `Dư ${translatedLinesCount - originalBlocksCount} đoạn (sẽ nối đuôi)`, color: 'text-yellow-500', icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 inline mr-1" /> };
    }

    // Logic sinh ra các số thứ tự chìm dưới khung soạn thảo
    let blockCounter = 0;
    const renderGutterBackdrop = () => {
        return translatedText.split('\n').map((line, index) => {
            const isBlock = line.trim().length > 0;
            let currentBlockIndex = null;
            
            if (isBlock) {
                currentBlockIndex = blockCounter;
                blockCounter++;
            }
            
            const isActive = isBlock && currentBlockIndex === activeBlockIndex;
            
            return (
                <div key={index} className="relative w-full">
                    {/* Chỉ render số thứ tự nếu dòng có chữ (bỏ qua dòng Enter thừa) */}
                    {isBlock && (
                        <div className={`absolute -left-10 top-0 text-[11px] font-mono w-8 text-right select-none transition-colors duration-200 ${isActive ? 'text-sukem-primary font-bold scale-110 origin-right' : 'text-sukem-text-muted/50'}`}>
                            {currentBlockIndex! + 1}
                        </div>
                    )}
                    {/* Lớp text tàng hình để tạo chiều cao chính xác giúp số thứ tự căn đúng hàng */}
                    <div className="text-transparent whitespace-pre-wrap break-words">
                        {line || <br />}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-sukem-card border border-sukem-border w-full max-w-[95vw] h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-sukem-border bg-sukem-bg">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 text-sukem-text">
                            <ArrowsRightLeftIcon className="w-6 h-6 text-sukem-primary" />
                            Đồng bộ định dạng (Format Sync)
                        </h3>
                        <p className="text-xs text-sukem-text-muted mt-1">Cột bên phải đã được trang bị hệ thống Gutter Line thông minh tự động bỏ qua dòng trống.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-sukem-border text-sukem-text-muted transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body - Split Columns */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Column: Trực quan hóa Original vs Translated */}
                    <div className="w-1/2 border-r border-sukem-border bg-sukem-bg flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-sukem-border bg-sukem-card flex items-center gap-2">
                            <div className="relative flex-1">
                                <FunnelIcon className="w-4 h-4 text-sukem-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <select 
                                    value={selectedBadge}
                                    onChange={(e) => setSelectedBadge(e.target.value)}
                                    className="w-full pl-9 pr-8 py-1.5 text-sm bg-sukem-bg border border-sukem-border rounded-md outline-none focus:ring-1 focus:ring-sukem-primary text-sukem-text appearance-none cursor-pointer"
                                >
                                    <option value="all">Tất cả định dạng ({originalBlocksCount})</option>
                                    {uniqueBadges.map(badge => {
                                        const count = originalData.filter(d => d.badges.includes(badge)).length;
                                        return (
                                            <option key={badge} value={badge}>
                                                {badge} ({count})
                                            </option>
                                        );
                                    })}
                                </select>
                                <ChevronDownIcon className="w-4 h-4 text-sukem-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <span className="text-xs font-medium text-sukem-text-muted whitespace-nowrap">
                                Đang xem: {filteredData.length} đoạn
                            </span>
                        </div>

                        {/* Danh sách block đối chiếu */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative scroll-smooth">
                            {filteredData.length === 0 ? (
                                <div className="text-center text-sukem-text-muted mt-10 p-4 border border-dashed border-sukem-border rounded-lg">
                                    Không tìm thấy đoạn văn bản nào phù hợp.
                                </div>
                            ) : (
                                filteredData.map((block) => {
                                    const realIndex = originalData.findIndex(o => o.id === block.id);
                                    const mappedTranslation = translatedLines[realIndex];
                                    const isMissingTranslation = translatedLinesCount > 0 && !mappedTranslation;
                                    const isActive = realIndex === activeBlockIndex;

                                    return (
                                        <div 
                                            key={block.id} 
                                            ref={isActive ? activeBlockRef : null}
                                            className={`p-3 border rounded-lg shadow-sm transition-all duration-300 ${
                                                isActive 
                                                    ? 'bg-sukem-primary/10 border-sukem-primary ring-2 ring-sukem-primary/50 shadow-md scale-[1.01] relative z-10' 
                                                    : isMissingTranslation 
                                                        ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-800/50' 
                                                        : 'bg-sukem-card border-sukem-border opacity-80 hover:opacity-100'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className={`px-2 py-0.5 border text-[10px] rounded font-mono font-bold ${isActive ? 'bg-sukem-primary text-white border-sukem-primary' : 'bg-sukem-bg border-sukem-border text-sukem-text-muted'}`}>
                                                        Đoạn {realIndex + 1}
                                                    </span>
                                                    {block.badges.map((badge, bIdx) => (
                                                        <span key={bIdx} className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${badge === 'Mặc định' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                                                            {badge}
                                                        </span>
                                                    ))}
                                                </div>
                                                {isMissingTranslation && !isActive && (
                                                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                                                        <ExclamationTriangleIcon className="w-3 h-3" /> Thiếu đoạn này
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="text-sm text-sukem-text-muted line-clamp-2 italic mb-2 border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                                                {block.text}
                                            </p>
                                            
                                            {mappedTranslation ? (
                                                <p className={`text-sm font-medium border-l-2 pl-2 ${isActive ? 'text-sukem-text border-sukem-primary' : 'text-sukem-text-muted border-sukem-primary/40'}`}>
                                                    {mappedTranslation}
                                                </p>
                                            ) : (
                                                translatedLinesCount > 0 && (
                                                    <p className="text-sm text-red-500 dark:text-red-400 border-l-2 border-red-500 pl-2 opacity-70">
                                                        (Trống - Vui lòng tách đoạn bên phải để bù vào đây)
                                                    </p>
                                                )
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column: Textarea / Preview */}
                    <div className="w-1/2 flex flex-col bg-sukem-card relative">
                        <div className="flex items-center justify-between p-3 border-b border-sukem-border bg-sukem-bg/50">
                            <h4 className="font-semibold text-sukem-text text-sm uppercase tracking-wider flex items-center gap-3">
                                {isPreviewMode ? 'Xem trước kết quả' : 'Soạn thảo (Plain Text)'}
                            </h4>
                            <button onClick={() => setIsPreviewMode(!isPreviewMode)} className="text-xs font-medium text-sukem-primary hover:underline bg-sukem-bg px-3 py-1 rounded-md border border-sukem-border shadow-sm">
                                {isPreviewMode ? 'Quay lại soạn thảo' : 'Xem trước HTML'}
                            </button>
                        </div>

                        {!isPreviewMode ? (
                            <div className="relative flex-1 flex overflow-hidden bg-sukem-bg group">
                                {/* Đường kẻ dọc ranh giới Gutter */}
                                <div className="absolute top-0 left-9 bottom-0 w-[1px] bg-sukem-border/80 z-[1]" />
                                
                                {/* Lớp đệm hiển thị số thứ tự đoạn (Backdrop Overlay) */}
                                <div 
                                    ref={backdropRef}
                                    className="absolute inset-0 p-4 pl-12 overflow-y-scroll pointer-events-none z-[1] text-sm leading-[1.8] font-sans"
                                    aria-hidden="true"
                                >
                                    {renderGutterBackdrop()}
                                </div>
                                
                                {/* Khung soạn thảo trong suốt đè lên trên */}
                                <textarea
                                    ref={textareaRef}
                                    value={translatedText}
                                    onChange={(e) => {
                                        setTranslatedText(e.target.value.replace(/\\/g, ''));
                                        trackCursorPosition(e);
                                    }}
                                    onClick={trackCursorPosition}
                                    onKeyUp={trackCursorPosition}
                                    onPaste={handlePaste}
                                    onScroll={(e) => {
                                        if (backdropRef.current) backdropRef.current.scrollTop = e.currentTarget.scrollTop;
                                    }}
                                    placeholder="Dán toàn bộ nội dung đã dịch vào đây..."
                                    className="flex-1 w-full h-full p-4 pl-12 overflow-y-scroll resize-none outline-none focus:ring-0 bg-transparent text-sukem-text text-sm leading-[1.8] font-sans relative z-[2]"
                                />
                            </div>
                        ) : (
                            <div 
                                className="flex-1 overflow-y-auto p-6 prose dark:prose-invert max-w-none text-sukem-text bg-sukem-bg"
                                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-sukem-border bg-sukem-card flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium flex items-center">
                            <span className="text-sukem-text mr-2">Trạng thái:</span>
                            {matchStatus.icon}
                            <span className={matchStatus.color}>{matchStatus.text}</span>
                        </div>
                        <div className="text-xs text-sukem-text-muted bg-sukem-bg px-2 py-1 rounded border border-sukem-border">
                            Bản dịch: <b className={translatedLinesCount !== originalBlocksCount ? 'text-red-500' : 'text-green-500'}>{translatedLinesCount}</b> đoạn / Gốc: <b>{originalBlocksCount}</b> đoạn
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-medium border border-sukem-border text-sukem-text hover:bg-sukem-bg transition-colors">
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={handleApplyClick}
                            disabled={translatedLinesCount === 0}
                            className="px-6 py-2 rounded-lg text-sm font-medium bg-sukem-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            Áp dụng định dạng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormatSyncModal;