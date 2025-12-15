import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext.tsx';
import { Story, Chapter } from '../../types.ts';
import { CheckIcon, ArrowPathIcon, ExclamationTriangleIcon, PlusIcon, PencilIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ArrowUturnLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner.tsx';
import CustomEditor from '../../components/CustomEditor.tsx';

// --- HÀM GỢI Ý TIÊU ĐỀ --- (Giữ nguyên)
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

const SaveNotification: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed bottom-5 right-5 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onDismiss} className="ml-2 p-1 hover:bg-green-700 rounded-full">
                <XMarkIcon className="h-4 w-4" />
            </button>
        </div>
    );
};


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
  const [isNew, setIsNew] = useState(!chapterId);
  const [editorKey, setEditorKey] = useState(Date.now());
  const [error, setError] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);


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

        if (editingExisting) {
            const currentChapter = currentVolume.chapters.find(c => c.id === chapterId);
            if (!currentChapter) throw new Error('Không tìm thấy chương!');
            setTitle(currentChapter.title);
            setContent(currentChapter.content);
            setIsRaw(!!currentChapter.isRaw);
        } else {
            // --- LOGIC TẠO MỚI ---
            const allChapters = currentStory.volumes.flatMap(v => v.chapters);
            const lastChapter = allChapters.length > 0 ? allChapters[allChapters.length - 1] : null;
             const lastChapterInVolume = currentVolume.chapters.length > 0 ? currentVolume.chapters[currentVolume.chapters.length - 1] : null;
            setTitle(lastChapterInVolume ? getNextChapterTitle(lastChapterInVolume.title) : (lastChapter ? getNextChapterTitle(lastChapter.title) : `${currentVolume.title} - Chương 1`));
            
            // [SỬA ĐỔI 1]: Để content rỗng thay vì text mặc định
            setContent(''); 
            
            setIsRaw(true);
        }
    } catch (error: any) {
        setError(error.message || 'Lỗi tải dữ liệu.');
    } finally {
        setIsLoading(false);
        setEditorKey(Date.now());
    }
  }, [storyId, volumeId, chapterId, getStoryById]);


  useEffect(() => {
    loadData();
  }, [loadData]);


   const handleSave = useCallback(async (andContinue: 'new' | 'editNext' | 'close' = 'close') => {
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

            if (andContinue === 'close') {
                setTimeout(() => navigate(`/admin/story/edit/${storyId}`), 1000);
            } else if (andContinue === 'new') {
                 const updatedStory = await getStoryById(storyId);
                 const allChapters = updatedStory?.volumes.flatMap(v => v.chapters) || [];
                 const lastChapter = allChapters.length > 0 ? allChapters[allChapters.length - 1] : null;
                setTitle(lastChapter ? getNextChapterTitle(lastChapter.title) : 'Chương tiếp theo');
                
                // [SỬA ĐỔI 2]: Để content rỗng khi chọn "Lưu & Soạn mới"
                setContent('');
                
                setIsRaw(true);
                setEditorKey(Date.now());
                setIsNew(true);
                navigate(`/admin/story/${storyId}/volume/${volumeId}/chapter/new`, { replace: true });
                window.scrollTo(0, 0);
            } else if (andContinue === 'editNext' && currentChapterId) {
                const updatedStory = await getStoryById(storyId);
                const allChaptersWithVolume = updatedStory?.volumes.flatMap(v => v.chapters.map(c => ({ ...c, volumeId: v.id }))) || [];
                const currentIndex = allChaptersWithVolume.findIndex(c => c.id === currentChapterId);

                 if (currentIndex !== -1 && currentIndex < allChaptersWithVolume.length - 1) {
                    const nextChapter = allChaptersWithVolume[currentIndex + 1];
                    navigate(`/admin/story/${storyId}/volume/${nextChapter.volumeId}/chapter/edit/${nextChapter.id}`);
                 } else {
                     setSaveSuccessMessage(`"${title}" là chương cuối. Không có chương tiếp theo.`);
                 }
            }

        } catch (err: any) {
            setError('Lưu chương thất bại: ' + (err.message || 'Lỗi không xác định'));
            console.error(err);
            setSaveSuccessMessage(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    }, [storyId, volumeId, chapterId, title, content, isRaw, isNew, getStoryById, addChapterToVolume, updateChapterInVolume, navigate]);


  // --- RENDER UI (Giữ nguyên) ---
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
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header trang */}
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

         {/* Nút bấm Lưu */}
        <div className="flex flex-wrap justify-end items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            {/* Nút Lưu & Đóng */}
            <button
                onClick={() => handleSave('close')}
                disabled={isSaving}
                className="order-3 sm:order-1 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckIcon className="h-5 w-5" />}
                Lưu & Đóng
            </button>
             {/* Nút Lưu & Soạn tiếp */}
             <button
                onClick={() => handleSave('new')}
                disabled={isSaving}
                className="order-1 sm:order-2 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
             >
                 {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PlusIcon className="h-5 w-5"/>}
                Lưu & Soạn mới
            </button>
            {/* Nút Lưu & Sửa chương tiếp */}
             {!isNew && (
                <button
                    onClick={() => handleSave('editNext')}
                    disabled={isSaving}
                    className="order-2 sm:order-3 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                     {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PencilIcon className="h-5 w-5"/>}
                     Lưu & Sửa tiếp
                </button>
            )}
        </div>
      </div>
       {/* Thông báo thành công */}
       {saveSuccessMessage && (
           <SaveNotification message={saveSuccessMessage} onDismiss={() => setSaveSuccessMessage(null)} />
       )}
    </div>
  );
};

export default ChapterEditPage;
