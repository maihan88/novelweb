import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext';
import { Story, Chapter } from '../../types';
import { 
  CheckIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon, 
  PlusIcon, 
  ArrowRightIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon
} from '@heroicons/react/24/solid';
import { ArrowUturnLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomEditor from '../../components/CustomEditor';

// --- HÀM GỢI Ý TIÊU ĐỀ ---
const getNextChapterTitle = (currentTitle: string): string => {
    const match = currentTitle.match(/^(.*?)([:\s-])?(\d+)$/);
    if (match) {
        const prefix = match[1] || '';
        const separator = match[2] || ': ';
        const number = parseInt(match[3], 10);
        return `${prefix.trim()}${separator}${number + 1}`;
    }
     const lastNumMatch = currentTitle.match(/(\d+)$/);
     if (lastNumMatch) {
         const number = parseInt(lastNumMatch[1], 10);
         const base = currentTitle.substring(0, currentTitle.length - lastNumMatch[1].length).trim();
         return `${base} ${number + 1}`;
     }
    return currentTitle + ' (Tiếp theo)';
};

// --- COMPONENT THÔNG BÁO ---
const SaveNotification: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed bottom-24 right-5 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in border border-green-500/50 backdrop-blur-sm">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onDismiss} className="ml-2 p-1 hover:bg-green-700 rounded-full">
                <XMarkIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

// --- COMPONENT BUTTON TOOLTIP ---
// Helper nhỏ để tạo tooltip khi hover
const TooltipButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    icon: React.ReactNode;
    label: string; // Text hiện trên PC
    tooltip: string; // Text hiện tooltip
    colorClass: string; // Class màu
}> = ({ onClick, disabled, className, icon, label, tooltip, colorClass }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`relative group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${colorClass} ${className}`}
    >
        {icon}
        <span className="hidden lg:inline font-semibold text-sm">{label}</span>
        
        {/* Tooltip */}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {tooltip}
        </span>
    </button>
);

const ChapterEditPage: React.FC = () => {
  const { storyId, volumeId, chapterId } = useParams<{ storyId: string; volumeId: string; chapterId?: string }>();
  const navigate = useNavigate();
  const { getStoryById, addChapterToVolume, updateChapterInVolume } = useStories();

  const [story, setStory] = useState<Story | null>(null);
  const [volumeTitle, setVolumeTitle] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isRaw, setIsRaw] = useState(false);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNew, setIsNew] = useState(!chapterId);
  const [editorKey, setEditorKey] = useState(Date.now());
  const [error, setError] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Navigation State
  const [prevChapterId, setPrevChapterId] = useState<string | null>(null);
  const [nextChapterId, setNextChapterId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!storyId || !volumeId) {
        navigate('/admin');
        return;
    }
    setError('');
    setSaveSuccessMessage(null);
    try {
        setIsLoading(true);
        const currentStory = await getStoryById(storyId);
        if (!currentStory) throw new Error('Không tìm thấy truyện!');
        setStory(currentStory);

        const currentVolume = currentStory.volumes.find(v => v.id === volumeId);
        if (!currentVolume) throw new Error('Không tìm thấy tập!');
        setVolumeTitle(currentVolume.title);

        const editingExisting = !!chapterId;
        setIsNew(!editingExisting);

        // --- Logic tính toán Next/Prev Chapter ---
        if (editingExisting) {
            const chapterIndex = currentVolume.chapters.findIndex(c => c.id === chapterId);
            if (chapterIndex !== -1) {
                // Chương trước
                if (chapterIndex > 0) {
                    setPrevChapterId(currentVolume.chapters[chapterIndex - 1].id);
                } else {
                    setPrevChapterId(null);
                }
                // Chương sau
                if (chapterIndex < currentVolume.chapters.length - 1) {
                    setNextChapterId(currentVolume.chapters[chapterIndex + 1].id);
                } else {
                    setNextChapterId(null);
                }
            }
        } else {
            setPrevChapterId(null);
            setNextChapterId(null);
        }

        if (editingExisting) {
            const currentChapter = currentVolume.chapters.find(c => c.id === chapterId);
            if (!currentChapter) throw new Error('Không tìm thấy chương!');
            setTitle(currentChapter.title);
            setContent(currentChapter.content);
            setIsRaw(!!currentChapter.isRaw);
        } else {
            const allChapters = currentStory.volumes.flatMap(v => v.chapters);
            const lastChapter = allChapters.length > 0 ? allChapters[allChapters.length - 1] : null;
             const lastChapterInVolume = currentVolume.chapters.length > 0 ? currentVolume.chapters[currentVolume.chapters.length - 1] : null;
            setTitle(lastChapterInVolume ? getNextChapterTitle(lastChapterInVolume.title) : (lastChapter ? getNextChapterTitle(lastChapter.title) : `${currentVolume.title} - Chương 1`));
            setContent('');
            setIsRaw(true);
        }
    } catch (error: any) {
        setError(error.message || 'Lỗi tải dữ liệu.');
    } finally {
        setIsLoading(false);
        setEditorKey(Date.now()); 
    }
  }, [storyId, volumeId, chapterId, getStoryById, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hàm chuyển hướng nhanh (Nav)
  const handleNavigateChapter = (targetId: string | null) => {
      if (!targetId) return;
      navigate(`/admin/story/${storyId}/volume/${volumeId}/chapter/edit/${targetId}`);
  };

   const handleSave = useCallback(async (action: 'new' | 'editNext' | 'close') => {
        if (!storyId || !volumeId || !title.trim()) {
            setError('Vui lòng điền tiêu đề chương.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsSaving(true);
        setError('');
        setSaveSuccessMessage(null);
        let currentChapterId = chapterId;

        try {
            if (isNew) {
                const newChapter = await addChapterToVolume(storyId, volumeId, { title, content, isRaw });
                currentChapterId = newChapter.id;
                setIsNew(false);
                 navigate(`/admin/story/${storyId}/volume/${volumeId}/chapter/edit/${newChapter.id}`, { replace: true });
                setSaveSuccessMessage(`Đã thêm chương "${title}"!`);

            } else if (currentChapterId) {
                const chapterToUpdate: Omit<Chapter, 'createdAt' | 'views' | '_id'> = { id: currentChapterId, title, content, isRaw };
                await updateChapterInVolume(storyId, volumeId, chapterToUpdate);
                 setSaveSuccessMessage(`Đã cập nhật chương "${title}"!`);
            } else {
                 throw new Error("Không xác định được ID chương.");
            }

            if (action === 'close') {
                setTimeout(() => navigate(`/admin/story/edit/${storyId}`), 500);
            } else if (action === 'new') {
                 const updatedStory = await getStoryById(storyId);
                 const allChapters = updatedStory?.volumes.flatMap(v => v.chapters) || [];
                 const lastChapter = allChapters.length > 0 ? allChapters[allChapters.length - 1] : null;
                setTitle(lastChapter ? getNextChapterTitle(lastChapter.title) : 'Chương tiếp theo');
                setContent('<p>Nội dung chương tiếp theo...</p>');
                setIsRaw(true);
                setEditorKey(Date.now());
                setIsNew(true);
                navigate(`/admin/story/${storyId}/volume/${volumeId}/chapter/new`, { replace: true });
                window.scrollTo(0, 0);
            } else if (action === 'editNext' && currentChapterId) {
                const updatedStory = await getStoryById(storyId);
                const allChaptersWithVolume = updatedStory?.volumes.flatMap(v => v.chapters.map(c => ({ ...c, volumeId: v.id }))) || [];
                const currentIndex = allChaptersWithVolume.findIndex(c => c.id === currentChapterId);

                 if (currentIndex !== -1 && currentIndex < allChaptersWithVolume.length - 1) {
                    const nextChapter = allChaptersWithVolume[currentIndex + 1];
                    navigate(`/admin/story/${storyId}/volume/${nextChapter.volumeId}/chapter/edit/${nextChapter.id}`);
                 } else {
                     setSaveSuccessMessage(`Đã lưu. Đây là chương cuối cùng.`);
                 }
            } 

        } catch (err: any) {
            setError('Lưu thất bại: ' + (err.message || 'Lỗi không xác định'));
            console.error(err);
            setSaveSuccessMessage(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    }, [storyId, volumeId, chapterId, title, content, isRaw, isNew, getStoryById, addChapterToVolume, updateChapterInVolume, navigate]);


  // --- RENDER UI ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen -mt-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

    if (error && !story) {
         return (
             <div className="max-w-xl mx-auto text-center py-16 px-6 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700/50">
                 <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-400 mb-4"/>
                <p className="text-lg font-semibold text-red-700 dark:text-red-200 mb-2">Đã xảy ra lỗi</p>
                <p className="text-red-600 dark:text-red-300">{error}</p>
                 <button onClick={() => navigate(`/admin/story/edit/${storyId}`)} className="mt-6 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium">
                    Quay lại Sửa truyện
                </button>
             </div>
         );
     }


  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 p-4 sm:p-6 lg:p-8 pb-40"> {/* Padding bottom lớn để tránh Floating Dock */}
      
      {/* Header trang */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
            <button onClick={() => navigate(`/admin/story/edit/${storyId}`)} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors mb-2 group">
                <ArrowUturnLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-200" />
                Quay lại Sửa truyện
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white leading-tight">
                {isNew ? 'Thêm Chương Mới' : `Chỉnh Sửa Chương`}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
                Truyện: <span className="font-semibold">{story?.title || '...'}</span> / Tập: <span className="font-semibold">{volumeTitle || '...'}</span>
            </p>
        </div>
      </div>

       {/* Thông báo lỗi */}
        {error && (
             <div className="p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r-lg flex items-center gap-3 text-sm text-red-700 dark:text-red-300 shadow-sm">
                <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0"/>
                <span className="font-medium">{error}</span>
             </div>
         )}

      {/* Form chính */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
        {/* Tiêu đề chương */}
        <div>
          <label htmlFor="chapter-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Tiêu đề chương *
          </label>
          <input
            id="chapter-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ví dụ: Chương 1: Khởi Đầu"
            className="w-full p-3 border rounded-lg bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-150 shadow-sm"
          />
        </div>

        {/* Đánh dấu Raw */}
        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-lg">
            <InformationCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"/>
            <div className="-mt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        id="isRaw"
                        name="isRaw"
                        checked={isRaw}
                        onChange={(e) => setIsRaw(e.target.checked)}
                        className="h-4 w-4 text-orange-600 border-slate-300 dark:border-slate-500 rounded focus:ring-orange-500 bg-white dark:bg-slate-700"
                    />
                    <span className="font-medium text-sm text-slate-800 dark:text-slate-200 select-none">
                        Đánh dấu là bản nháp (Raw)
                    </span>
                </label>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 pl-6 sm:pl-0">
                    Chương nháp sẽ không hiển thị ở mục "Mới cập nhật" trên trang chủ.
                </p>
            </div>
        </div>

        {/* Nội dung */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Nội dung chương
          </label>
          <CustomEditor key={editorKey} value={content} onChange={setContent} />
        </div>
      </div>

       {/* Thông báo thành công */}
       {saveSuccessMessage && (
           <SaveNotification message={saveSuccessMessage} onDismiss={() => setSaveSuccessMessage(null)} />
       )}

      {/* ===================================================================================== */}
      {/* --- SUPER FLOATING DOCK (THANH CÔNG CỤ TỔNG HỢP) --- */}
      {/* ===================================================================================== */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 max-w-[95vw]">
        <div className="flex items-center gap-2 p-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 ring-1 ring-black/5">
            
            {/* 1. Nút Prev (Chỉ hiện khi sửa) */}
            {!isNew && (
                <button
                    onClick={() => handleNavigateChapter(prevChapterId)}
                    disabled={!prevChapterId}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Chương trước"
                >
                    <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            )}

            {/* Vách ngăn */}
            {!isNew && <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>}

            {/* 2. CỤM NÚT LƯU (MAIN ACTIONS) */}
            <div className="flex items-center gap-2">
                
                {/* 2a. Lưu & Thêm Mới (Màu Xanh Dương) */}
                <TooltipButton
                    onClick={() => handleSave('new')}
                    disabled={isSaving}
                    colorClass="bg-blue-600 hover:bg-blue-700 text-white"
                    icon={isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PlusIcon className="h-5 w-5" />}
                    label="Lưu & Mới"
                    tooltip="Lưu và Tạo chương mới"
                />

                {/* 2b. Lưu & Sửa Tiếp (Màu Tím) - Chỉ hiện khi đang sửa, hoặc khi tạo mới mà muốn sửa tiếp thì logic cần handle sau (nhưng ở đây ẩn khi tạo mới cho gọn) */}
                {!isNew && (
                    <TooltipButton
                        onClick={() => handleSave('editNext')}
                        disabled={isSaving}
                        colorClass="bg-indigo-600 hover:bg-indigo-700 text-white"
                        icon={isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ArrowRightIcon className="h-5 w-5" />}
                        label="Lưu & Tiếp"
                        tooltip="Lưu và Sửa chương tiếp theo"
                    />
                )}

                {/* 2c. Lưu & Đóng (Màu Xanh Lá - Nút thoát) */}
                <TooltipButton
                    onClick={() => handleSave('close')}
                    disabled={isSaving}
                    colorClass="bg-emerald-600 hover:bg-emerald-700 text-white"
                    icon={isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ListBulletIcon className="h-5 w-5" />} // Icon List để biểu thị quay về danh sách
                    label="Lưu & Thoát"
                    tooltip="Lưu và Quay lại danh sách"
                />
            </div>

            {/* Vách ngăn */}
            {!isNew && <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>}

            {/* 3. Nút Next (Chỉ hiện khi sửa) */}
            {!isNew && (
                <button
                    onClick={() => handleNavigateChapter(nextChapterId)}
                    disabled={!nextChapterId}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Chương sau"
                >
                    <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            )}
        </div>
      </div>

    </div>
  );
};

export default ChapterEditPage;
