import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext.tsx';
import { Story, Chapter } from '../../types.ts';
import { CheckIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ArrowUturnLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner.tsx';
import CustomEditor from '../../components/CustomEditor.tsx';

// --- BẮT ĐẦU THÊM MỚI: HÀM GỢI Ý TIÊU ĐỀ ---
const getNextChapterTitle = (currentTitle: string): string => {
    // Tìm kiếm số ở cuối tiêu đề
    const match = currentTitle.match(/(.*?)(\d+)$/);
    if (match) {
        const base = match[1].trim(); // Phần chữ (ví dụ: "Chương")
        const number = parseInt(match[2], 10); // Phần số
        return `${base} ${number + 1}`;
    }
    // Nếu không tìm thấy số, chỉ trả về chuỗi rỗng
    return '';
};
// --- KẾT THÚC THÊM MỚI ---

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
  const [key, setKey] = useState(Date.now()); // Thêm key để reset CustomEditor

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
            setTitle(''); // Bắt đầu với tiêu đề rỗng
            setContent('<p>Nội dung chương mới...</p>');
        }
    } catch (error: any) {
        alert(error.message || 'Lỗi tải dữ liệu.');
        navigate(`/admin/story/edit/${storyId}`);
    } finally {
        setIsLoading(false);
        setKey(Date.now()); // Reset key sau khi tải xong
    }
  }, [storyId, volumeId, chapterId, getStoryById, navigate]);


  useEffect(() => {
    loadData();
  }, [chapterId, loadData]); // Chỉ chạy lại khi chapterId thay đổi

  // --- BẮT ĐẦU SỬA ĐỔI HÀM LƯU ---
  const handleSave = async () => {
    if (!storyId || !volumeId || !title.trim()) {
      alert('Lỗi: Vui lòng điền tiêu đề chương.');
      return;
    }
    
    setIsSaving(true);
    try {
        let savedChapterTitle = title;
        if (isNew) {
          const newChapter = await addChapterToVolume(storyId, volumeId, { title, content, isRaw });
          savedChapterTitle = newChapter.title;
        } else if(chapterId) {
          const chapterToUpdate: Omit<Chapter, 'createdAt' | 'views' | '_id'> = { id: chapterId, title, content, isRaw };
          await updateChapterInVolume(storyId, volumeId, chapterToUpdate);
        }
        
        // Hỏi người dùng có muốn tiếp tục không
        const continueEditing = window.confirm(`Đã lưu "${savedChapterTitle}" thành công!\nBạn có muốn tạo ngay chương tiếp theo không?`);

        if (continueEditing) {
            // Reset state để tạo chương mới
            navigate(`/admin/story/${storyId}/volume/${volumeId}/chapter/new`, { replace: true });
            setIsNew(true);
            setTitle(getNextChapterTitle(savedChapterTitle)); // Gợi ý tiêu đề mới
            setContent('<p>Nội dung chương tiếp theo...</p>');
            setIsRaw(true);
            setKey(Date.now()); // Thay đổi key để buộc CustomEditor re-render
        } else {
            navigate(`/admin/story/edit/${storyId}`);
        }

    } catch(err) {
        alert('Lưu chương thất bại!');
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };
  // --- KẾT THÚC SỬA ĐỔI HÀM LƯU ---

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
          {/* Dùng key để reset editor khi cần */}
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
