import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext';
import { getChapterContent } from '../../services/storyService';
import { Story, Chapter } from '../../types';
import { 
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

// --- HÀM GỢI Ý TIÊU ĐỀ (Giữ nguyên logic) ---
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
        <div className="fixed bottom-24 right-5 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in border border-green-500/50 backdrop-blur-sm">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm font-bold">{message}</span>
            <button onClick={onDismiss} className="ml-2 p-1 hover:bg-green-700 rounded-full transition-colors">
                <XMarkIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

// --- COMPONENT BUTTON TOOLTIP ---
const TooltipButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    icon: React.ReactNode;
    label: string;
    tooltip: string;
    colorClass: string;
}> = ({ onClick, disabled, className, icon, label, tooltip, colorClass }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`relative group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${colorClass} ${className}`}
    >
        {icon}
        <span className="hidden lg:inline font-bold text-sm">{label}</span>
        
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-sukem-text rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
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
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isRaw, setIsRaw] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isNew = !chapterId; 
  const [editorKey, setEditorKey] = useState(Date.now());
  const [error, setError] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const [prevChapterId, setPrevChapterId] = useState<string | null>(null);
  const [nextChapterId, setNextChapterId] = useState<string | null>(null);

  useEffect(() => {
    if (!chapterId) {
        setTitle('Đang tải...');
        setContent('');
        setIsRaw(true);
        setEditorKey(Date.now());
    }
  }, [chapterId]);

  const loadData = useCallback(async () => {
    if (!storyId || !volumeId) {
        navigate('/admin');
        return;
    }
    setError('');
    try {
        setIsLoading(true);
        const currentStory = await getStoryById(storyId);
        if (!currentStory) throw new Error('Không tìm thấy truyện!');
        setStory(currentStory);

        const currentVolume = currentStory.volumes.find(v => v.id === volumeId);
        if (!currentVolume) throw new Error('Không tìm thấy tập!');
        setVolumeTitle(currentVolume.title);

        if (chapterId) {
            const chapterIndex = currentVolume.chapters.findIndex(c => c.id === chapterId);
            if (chapterIndex !== -1) {
                setPrevChapterId(chapterIndex > 0 ? currentVolume.chapters[chapterIndex - 1].id : null);
                setNextChapterId(chapterIndex < currentVolume.chapters.length - 1 ? currentVolume.chapters[chapterIndex + 1].id : null);
            }
            const fullChapter = await getChapterContent(storyId, chapterId);
            setTitle(fullChapter.title);
            setContent(fullChapter.content);
            setIsRaw(!!fullChapter.isRaw);
        } else {
            setPrevChapterId(null);
            setNextChapterId(null);
            const allChaptersInVolume = currentVolume.chapters;
            const lastChapterInVolume = allChaptersInVolume.length > 0 ? allChaptersInVolume[allChaptersInVolume.length - 1] : null;
            const nextTitle = lastChapterInVolume ? getNextChapterTitle(lastChapterInVolume.title) : `${currentVolume.title} - Chương 1`;
            setTitle(nextTitle);
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

  useEffect(() => { loadData(); }, [loadData]);

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
        
        let savedChapterId = chapterId;

        try {
            if (isNew) {
                const newChapter = await addChapterToVolume(storyId, volumeId, { title, content, isRaw });
                savedChapterId = newChapter.id;
                setSaveSuccessMessage(`Đã thêm chương "${title}"!`);
            } else if (savedChapterId) {
                const chapterToUpdate: Omit<Chapter, 'createdAt' | 'views' | '_id'> = { id: savedChapterId, title, content, isRaw };
                await updateChapterInVolume(storyId, volumeId, chapterToUpdate);
                 setSaveSuccessMessage(`Đã cập nhật chương "${title}"!`);
            } else {
                 throw new Error("Không xác định được ID chương.");
            }

            if (action === 'new') {
                if (isNew) {
                    setTitle('Đang tạo tên...');
                    setContent('');
                    setIsRaw(true);
                    setEditorKey(Date.now());
                    loadData(); 
                    window.scrollTo(0, 0);
                } else {
                    navigate(`/admin/story/${storyId}/volume/${volumeId}/chapter/new`, { replace: true });
                    window.scrollTo(0, 0);
                }
            } 
            else if (action === 'editNext') {
                const updatedStory = await getStoryById(storyId);
                const allChapters = updatedStory?.volumes.flatMap(v => v.chapters.map(c => ({...c, volId: v.id}))) || [];
                const currentIndex = allChapters.findIndex(c => c.id === savedChapterId);
                
                if (currentIndex !== -1 && currentIndex < allChapters.length - 1) {
                    const nextChap = allChapters[currentIndex + 1];
                    navigate(`/admin/story/${storyId}/volume/${nextChap.volId}/chapter/edit/${nextChap.id}`);
                } else {
                     setSaveSuccessMessage(`Đã lưu. Đây là chương cuối cùng.`);
                     if (isNew && savedChapterId) {
                         navigate(`/admin/story/${storyId}/volume/${volumeId}/chapter/edit/${savedChapterId}`, { replace: true });
                     }
                }
            } 
            else if (action === 'close') {
                setTimeout(() => navigate(`/admin/story/edit/${storyId}`), 500);
            }
            else if (isNew && savedChapterId) {
                 navigate(`/admin/story/${storyId}/volume/${volumeId}/chapter/edit/${savedChapterId}`, { replace: true });
            }

        } catch (err: any) {
            setError('Lưu thất bại: ' + (err.message || 'Lỗi không xác định'));
            console.error(err);
            setSaveSuccessMessage(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    }, [storyId, volumeId, chapterId, title, content, isRaw, isNew, getStoryById, addChapterToVolume, updateChapterInVolume, navigate, loadData]);

  if (isLoading && !story) {
    return <div className="flex justify-center items-center h-screen -mt-16"><LoadingSpinner size="lg" /></div>;
  }

    if (error && !story) {
         return (
             <div className="max-w-xl mx-auto text-center py-16 px-6 bg-red-50 rounded-xl border border-red-200">
                 <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-400 mb-4"/>
                <p className="text-lg font-semibold text-red-700 mb-2">Đã xảy ra lỗi</p>
                <p className="text-red-600">{error}</p>
                 <button onClick={() => navigate(`/admin/story/edit/${storyId}`)} className="mt-6 px-4 py-2 bg-sukem-bg text-sukem-text rounded-lg border border-sukem-border hover:bg-sukem-card font-medium transition-colors">
                    Quay lại Sửa truyện
                </button>
             </div>
         );
     }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 p-4 sm:p-6 lg:p-8 pb-40">
      
      {/* Header trang */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
            <button onClick={() => navigate(`/admin/story/edit/${storyId}`)} className="flex items-center gap-1.5 text-sm text-sukem-text-muted hover:text-sukem-primary transition-colors mb-2 group font-medium">
                <ArrowUturnLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-200" />
                Quay lại Sửa truyện
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-sukem-text leading-tight">
                {isNew ? 'Thêm Chương Mới' : `Chỉnh Sửa Chương`}
            </h1>
            <p className="text-sukem-text-muted mt-1 text-sm sm:text-base">
                Truyện: <span className="font-bold text-sukem-text">{story?.title || '...'}</span> / Tập: <span className="font-bold text-sukem-text">{volumeTitle || '...'}</span>
            </p>
        </div>
      </div>

       {/* Thông báo lỗi */}
        {error && (
             <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 text-sm text-red-700 shadow-sm">
                <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0"/>
                <span className="font-medium">{error}</span>
             </div>
         )}

      {/* Form chính */}
      <div className="bg-sukem-card p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-sukem-border space-y-6">
        {/* Tiêu đề chương */}
        <div>
          <label htmlFor="chapter-title" className="block text-sm font-bold text-sukem-text mb-1.5">
            Tiêu đề chương *
          </label>
          <div className="relative">
             <input
                id="chapter-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Chương 1: Khởi Đầu"
                className="w-full p-3 border border-sukem-border rounded-xl bg-sukem-bg text-sukem-text focus:ring-2 focus:ring-sukem-accent focus:border-transparent outline-none transition duration-150 shadow-sm"
                disabled={isLoading && isNew}
              />
               {isLoading && isNew && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <LoadingSpinner size="sm"/>
                  </div>
               )}
          </div>
        </div>

        {/* Đánh dấu Raw */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
            <InformationCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"/>
            <div className="-mt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        id="isRaw"
                        name="isRaw"
                        checked={isRaw}
                        onChange={(e) => setIsRaw(e.target.checked)}
                        className="h-4 w-4 text-sukem-primary border-sukem-border rounded focus:ring-sukem-primary bg-white"
                    />
                    <span className="font-bold text-sm text-sukem-text select-none">
                        Đánh dấu là bản nháp (Raw)
                    </span>
                </label>
                <p className="text-xs text-sukem-text-muted mt-1">
                    Chương nháp sẽ không hiển thị ở mục "Mới cập nhật" trên trang chủ.
                </p>
            </div>
        </div>

        {/* Nội dung - Custom Editor Wrapper */}
        <div>
          <label className="block text-sm font-bold text-sukem-text mb-1.5">
            Nội dung chương
          </label>
          <div className="rounded-xl border border-sukem-border bg-white">
             <CustomEditor key={editorKey} value={content} onChange={setContent} />
          </div>
        </div>
      </div>

       {/* Thông báo thành công */}
       {saveSuccessMessage && (
           <SaveNotification message={saveSuccessMessage} onDismiss={() => setSaveSuccessMessage(null)} />
       )}

      {/* Floating Dock */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 max-w-[95vw]">
        <div className="flex items-center gap-2 p-2 bg-sukem-card/90 backdrop-blur-md rounded-2xl shadow-2xl border border-sukem-border ring-1 ring-black/5">
            
            {!isNew && (
                <button
                    onClick={() => handleNavigateChapter(prevChapterId)}
                    disabled={!prevChapterId}
                    className="p-2.5 rounded-full hover:bg-sukem-bg text-sukem-text-muted hover:text-sukem-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Chương trước"
                >
                    <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            )}

            {!isNew && <div className="w-px h-6 bg-sukem-border mx-1"></div>}

            <div className="flex items-center gap-2">
                <TooltipButton
                    onClick={() => handleSave('new')}
                    disabled={isSaving}
                    colorClass="bg-blue-500 hover:bg-blue-600 text-white"
                    icon={isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PlusIcon className="h-5 w-5" />}
                    label="Lưu & Mới"
                    tooltip="Lưu và Tạo chương mới"
                />

                {!isNew && (
                    <TooltipButton
                        onClick={() => handleSave('editNext')}
                        disabled={isSaving}
                        colorClass="bg-indigo-500 hover:bg-indigo-600 text-white"
                        icon={isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ArrowRightIcon className="h-5 w-5" />}
                        label="Lưu & Tiếp"
                        tooltip="Lưu và Sửa chương tiếp theo"
                    />
                )}

                <TooltipButton
                    onClick={() => handleSave('close')}
                    disabled={isSaving}
                    colorClass="bg-emerald-500 hover:bg-emerald-600 text-white"
                    icon={isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ListBulletIcon className="h-5 w-5" />}
                    label="Lưu & Thoát"
                    tooltip="Lưu và Quay lại danh sách"
                />
            </div>

            {!isNew && <div className="w-px h-6 bg-sukem-border mx-1"></div>}

            {!isNew && (
                <button
                    onClick={() => handleNavigateChapter(nextChapterId)}
                    disabled={!nextChapterId}
                    className="p-2.5 rounded-full hover:bg-sukem-bg text-sukem-text-muted hover:text-sukem-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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