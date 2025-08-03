


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStories } from '../../contexts/StoryContext.tsx';
import { Story, Chapter } from '../../types.ts';
import { CheckIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner.tsx';
import CustomEditor from '../../components/CustomEditor.tsx';

const ChapterEditPage: React.FC = () => {
  const { storyId, volumeId, chapterId } = useParams<{ storyId: string; volumeId: string; chapterId?: string }>();
  const navigate = useNavigate();
  const { getStoryById, addChapterToVolume, updateChapterInVolume } = useStories();

  const [story, setStory] = useState<Story | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        if (!storyId || !volumeId) {
            navigate('/admin');
            return;
        }

        try {
            const currentStory = await getStoryById(storyId);
            if (!currentStory) {
              alert('Không tìm thấy truyện!');
              navigate('/admin');
              return;
            }
            setStory(currentStory);

            const currentVolume = currentStory.volumes.find(v => v.id === volumeId);
            if (!currentVolume) {
                alert('Không tìm thấy tập!');
                navigate(`/admin/story/edit/${storyId}`);
                return;
            }

            if (chapterId) {
              // Editing existing chapter
              const currentChapter = currentVolume.chapters.find(c => c.id === chapterId);
              if (currentChapter) {
                setTitle(currentChapter.title);
                setContent(currentChapter.content);
                setIsNew(false);
              } else {
                alert('Không tìm thấy chương!');
                navigate(`/admin/story/edit/${storyId}`);
                return;
              }
            } else {
              // Adding new chapter
              setIsNew(true);
              setContent('<p>Viết nội dung chương ở đây...</p>');
            }
        } catch (error) {
            alert('Lỗi tải dữ liệu.');
            navigate('/admin');
        } finally {
            setIsLoading(false);
        }
    }
    loadData();
  }, [storyId, volumeId, chapterId, getStoryById, navigate]);

  const handleSave = async () => {
    if (!storyId || !volumeId || !title.trim()) {
      alert('Lỗi: Vui lòng điền đầy đủ thông tin.');
      return;
    }
    
    setIsSaving(true);
    try {
        if (isNew) {
          await addChapterToVolume(storyId, volumeId, { title, content });
        } else if(chapterId) {
          const chapterToUpdate: Omit<Chapter, 'createdAt' | 'views' | '_id'> = { id: chapterId, title, content };
          await updateChapterInVolume(storyId, volumeId, chapterToUpdate);
        }
        
        alert(`Đã ${isNew ? 'thêm' : 'cập nhật'} chương thành công!`);
        navigate(`/admin/story/edit/${storyId}`);
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
    <div className="animate-fade-in space-y-6">
      <div>
        <button onClick={() => navigate(`/admin/story/edit/${storyId}`)} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2">
          <ArrowUturnLeftIcon className="h-4 w-4" />
          Quay lại trang chỉnh sửa truyện
        </button>
        <h1 className="text-3xl font-bold font-serif">
          {isNew ? 'Thêm Chương Mới' : 'Chỉnh Sửa Chương'}
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
            className="w-full p-3 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nội dung
          </label>
          <CustomEditor value={content} onChange={setContent} />
        </div>
        <div className="flex justify-end pt-4">
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-md hover:opacity-90 transition-opacity shadow disabled:opacity-70"
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