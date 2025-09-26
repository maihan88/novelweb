import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext.tsx';
import { Story, Chapter } from '../../types.ts';
import { CheckIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ArrowUturnLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner.tsx';
import CustomEditor from '../../components/CustomEditor.tsx';

// Hàm gợi ý tiêu đề chương tiếp theo
const getNextChapterTitle = (currentTitle: string): string => {
    const match = currentTitle.match(/(.*?)(\d+)$/);
    if (match) {
        const base = match[1].trim();
        const number = parseInt(match[2], 10);
        return `${base} ${number + 1}`;
    }
    return '';
};

const ChapterEditPage: React.FC = () => {
  const { storyId, volumeId, chapterId } = useParams<{ storyId: string; volumeId: string; chapterId?: string }>();
  const navigate = useNavigate();
  const { getStoryById, addChapterToVolume, updateChapterInVolume } = useStories();

  const [story, setStory] = useState<Story | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isRaw, setIsRaw] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [key, setKey] = useState(Date.now()); // Key để reset CustomEditor

  const loadData = useCallback(async () => {
    if (!storyId || !volumeId) {
        navigate('/admin');
        return;
    }
    try {
        setIsLoading(true);
        const currentStory = await getStoryById(storyId);
        if (!currentStory) throw new Error('Không tìm thấy truyện!');
        setStory(currentStory);

        const currentVolume = currentStory.volumes.find(v => v.id === volumeId);
        if (!currentVolume) throw new Error('Không tìm thấy tập!');

        if (chapterId) {
            const currentChapter = currentVolume.chapters.find(c => c.id === chapterId);
            if (!currentChapter) throw new Error('Không tìm thấy chương!');
            setTitle(currentChapter.title);
            setContent(currentChapter.content);
            setIsRaw(!!currentChapter.isRaw);
            setIsNew(false);
        } else {
            setIsNew(true);
            setIsRaw(true);
            const allChapters = currentStory.volumes.flatMap(v => v.chapters);
            const lastChapter = allChapters[allChapters.length - 1];
            setTitle(lastChapter ? getNextChapterTitle(lastChapter.title) : 'Chương 1');
            setContent('<p>Nội dung chương mới...</p>');
        }
    } catch (error: any) {
        alert(error.message || 'Lỗi tải dữ liệu.');
        navigate(`/admin/story/edit/${storyId}`);
    } finally {
        setIsLoading(false);
        setKey(Date.now());
    }
  }, [storyId, volumeId, chapterId, getStoryById, navigate]);


  useEffect(() => {
    loadData();
  }, [chapterId, storyId, volumeId]); // Tải lại dữ liệu khi bất kỳ ID nào trên URL thay đổi

  const handleSave = async () => {
    if (!storyId || !volumeId || !title.trim()) {
      alert('Lỗi: Vui lòng điền tiêu đề chương.');
      return;
    }
    
    setIsSaving(true);
    try {
        if (isNew) {
            // --- LOGIC KHI TẠO CHƯƠNG MỚI ---
            const newChapter = await addChapterToVolume(storyId, volumeId, { title, content, isRaw });
            const continueEditing = window.confirm(`Đã thêm "${newChapter.title}" thành công!\nBạn có muốn tạo ngay chương tiếp theo không?`);

            if (continueEditing) {
                // Reset state để tạo chương mới, không cần navigate vì URL đã đúng
                setTitle(getNextChapterTitle(newChapter.title));
                setContent('<p>Nội dung chương tiếp theo...</p>');
                setIsRaw(true);
                setKey(Date.now()); // Thay đổi key để buộc CustomEditor re-render
                window.scrollTo(0, 0); // Cuộn lên đầu trang
            } else {
                navigate(`/admin/story/edit/${storyId}`);
            }
        } else if(chapterId) {
            // --- LOGIC KHI CẬP NHẬT CHƯƠNG CŨ ---
            const chapterToUpdate: Omit<Chapter, 'createdAt' | 'views' | '_id'> = { id: chapterId, title, content, isRaw };
            await updateChapterInVolume(storyId, volumeId, chapterToUpdate);

            // Tìm chương tiếp theo để gợi ý
            const allChaptersWithVolume = story?.volumes.flatMap(v => v.chapters.map(c => ({ ...c, volumeId: v.id }))) || [];
            const currentIndex = allChaptersWithVolume.findIndex(c => c.id === chapterId);

            if (currentIndex !== -1 && currentIndex < allChaptersWithVolume.length - 1) {
                // Nếu có chương tiếp theo
                const nextChapter = allChaptersWithVolume[currentIndex + 1];
                const continueToNext = window.confirm(`Đã cập nhật "${title}" thành công!\nBạn có muốn chỉnh sửa chương tiếp theo ("${nextChapter.title}") không?`);
                if (continueToNext) {
                    navigate(`/admin/story/${storyId}/volume/${nextChapter.volumeId}/chapter/edit/${nextChapter.id}`);
                } else {
                    navigate(`/admin/story/edit/${storyId}`);
                }
            } else {
                // Nếu đây là chương cuối cùng
                const continueToNew = window.confirm(`Đã cập nhật "${title}" thành công!\nĐây là chương cuối. Bạn có muốn tạo chương mới không?`);
                if (continueToNew) {
                    navigate(`/admin/story/${storyId}/volume/${volumeId}/chapter/new`);
                } else {
                    navigate(`/admin/story/edit/${storyId}`);
                }
            }
        }
    } catch(err) {
        alert('Lưu chương thất bại!');
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <div>
        <button onClick={() => navigate(`/admin/story/edit/${storyId}`)} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors mb-2">
          <ArrowUturnLeftIcon className="h-4 w-4" />
          Quay lại trang chỉnh sửa truyện
        </button>
        <h1 className="text-3xl font-bold font-serif">
          {isNew ? 'Thêm Chương Mới' : `Chỉnh Sửa: ${title}`}
        </h1>
        <p className="text-slate-600 dark:text-slate-300">cho truyện: <span className="font-semibold">{story?.title}</span></p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg space-y-6">
        <div>
          <label htmlFor="chapter-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tiêu đề chương
          </label>
          <input
            id="chapter-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ví dụ: Chương 1: Khởi Đầu"
            className="w-full p-3 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 transition"
          />
        </div>

        <div className="flex items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-lg">
            <InformationCircleIcon className="h-6 w-6 text-amber-500 flex-shrink-0"/>
            <div>
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="isRaw"
                        name="isRaw"
                        checked={isRaw}
                        onChange={(e) => setIsRaw(e.target.checked)}
                        className="h-4 w-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="isRaw" className="font-medium text-slate-800 dark:text-slate-200">
                        Đánh dấu là bản nháp (raw)
                    </label>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Chương nháp sẽ không hiển thị ở mục "Mới cập nhật" cho đến khi bạn bỏ dấu tick này.
                </p>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nội dung
          </label>
          <CustomEditor key={key} value={content} onChange={setContent} />
        </div>
        <div className="flex justify-end pt-4">
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-md hover:opacity-90 transition-opacity shadow disabled:opacity-70"
            >
                {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckIcon className="h-5 w-5" />}
                Lưu Chương
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChapterEditPage;
